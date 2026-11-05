import test from 'node:test';
import assert from 'node:assert/strict';
import {actionCommand} from '../../plugins/card-games/src/client/action-command.mjs';
import {createGamePageClient} from '../../plugins/card-games/src/client/api.mjs';
import {createCardGamesApp} from '../../plugins/card-games/src/client/app.mjs';
import {acceptsTableObservation,commandOutcome,commandReadPayload,startSingleFlightPoll,viewScopeIsCurrent} from '../../plugins/card-games/src/client/operation-state.mjs';

test('action commands keep only rule inputs, including the ordinary and short all-in call',()=>{
  for(const amount of [2,16])assert.deepEqual(actionCommand({type:'call',amount,raiseTo:amount+3}),{type:'call'});
  assert.deepEqual(actionCommand({type:'all-in',amount:16,raiseTo:19}),{type:'all-in'});
  assert.deepEqual(actionCommand({type:'raise',raiseTo:42,minRaiseTo:9,maxRaiseTo:61}),{type:'raise',raiseTo:42});
  assert.deepEqual(actionCommand({type:'double',factor:2,amount:123}),{type:'double',factor:2});
  const raw={type:'play',pattern:'single',cards:[52],bodyRanks:[16],moveId:'single:16:52',amount:0,actorId:'other'};
  assert.deepEqual(actionCommand(raw),{type:'play',pattern:'single',cards:[52],bodyRanks:[16],moveId:'single:16:52'});
  assert.throws(()=>actionCommand({type:'unknown'}),{code:'GAME_ACTION_INVALID'});
});

test('missing transport reply is unknown, while a structured rejection is confirmed',async()=>{
  const network=createGamePageClient({fetcher:async()=>{throw Error('reset');}});
  await assert.rejects(network.invoke('games.table.action',{}),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});
  const nonJson=createGamePageClient({fetcher:async()=>new Response('upstream error',{status:502})});
  await assert.rejects(nonJson.invoke('games.table.action',{}),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});
  const refused=createGamePageClient({fetcher:async()=>Response.json({error:{code:'GAME_STALE_VERSION',message:'stale'}},{status:403})});
  await assert.rejects(refused.invoke('games.table.action',{}),{code:'GAME_STALE_VERSION',unknown:false});
});

test('reconciliation submits the unchanged command for proof and cannot accept a different receipt',()=>{
  const request={method:'games.table.leave',payload:{tableId:'table',expectedVersion:3,commandId:'leave-id',afterHand:true}};
  assert.deepEqual(commandReadPayload(request),{tableId:'table',command:request});
  assert.equal(commandOutcome(request,{version:4,commandReceipt:{commandId:'other',status:'applied'}}),'unconfirmed');
  assert.equal(commandOutcome(request,{version:4,commandReceipt:{commandId:'leave-id',status:'applied'}}),'applied');
  assert.equal(commandOutcome(request,{version:3,commandReceipt:{commandId:'leave-id',status:'not-found'}}),'retryable');
  assert.equal(commandOutcome(request,{version:4,commandReceipt:{commandId:'leave-id',status:'not-found'}}),'stale');
});

test('table navigation rejects stale scopes and polling never stacks slow reads',async()=>{
  assert.equal(viewScopeIsCurrent({epoch:1,tableId:'same'},{epoch:2,tableId:'same'}),false);
  assert.equal(viewScopeIsCurrent({epoch:2,tableId:'same'},{epoch:2,tableId:'different'}),false);
  assert.equal(acceptsTableObservation({version:5,sequence:9},4,10),false);
  assert.equal(acceptsTableObservation({version:5,sequence:9},5,8),false);
  assert.equal(acceptsTableObservation({version:5,sequence:9},6,8),true);
  const timers=new Map();let entered=0,release;
  const stop=startSingleFlightPoll(async()=>{entered++;await new Promise(resolve=>{release=resolve;});},{schedule:(fn,delay)=>{assert.equal(delay,1500);const key=Symbol();timers.set(key,fn);return key;},cancel:key=>timers.delete(key)});
  const [key,fn]=timers.entries().next().value;timers.delete(key);
  const pending=fn();assert.equal(entered,1);assert.equal(timers.size,0);
  stop();release();await pending;assert.equal(timers.size,0);
});

function hooks(client){
  // Minimal hook driver: runs the real app's effects and observes props sent to its renderer.
  const slots=[],effects=[];let cursor=0,props;
  const React={
   useState(initial){const key=cursor++;slots[key]??={value:typeof initial==='function'?initial():initial};return [slots[key].value,update=>{const slot=slots[key];slot.value=typeof update==='function'?update(slot.value):update;}];},
   useRef(initial){const key=cursor++;return slots[key]??={current:initial};},
   useEffect(fn,deps){const key=cursor++,previous=slots[key];if(previous&&deps&&previous.deps&&deps.length===previous.deps.length&&deps.every((v,index)=>Object.is(v,previous.deps[index])))return;
    effects.push(()=>{previous?.cleanup?.();slots[key]={deps,cleanup:fn()};});},
  };
  const App=createCardGamesApp(React,{client,render:(_react,value)=>{props=value;}});
  return {render(){cursor=0;App();for(const effect of effects.splice(0))effect();return props;},dispose(){for(const slot of slots)slot.cleanup?.();}};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function table(id,version,{status='active',turn=null,actor='ai',ended=false}={}){
 return {tableId:id,version,status,type:'texas',actorKind:actor,modelTurn:turn,accounts:[],history:[],projection:{type:'texas',version,phase:ended?'settled':'preflop',actorId:actor==='user'?'user':'ai-a',handId:id+':hand',players:[],board:[],ownHand:[],legalActions:[],settlement:ended?{completed:true}:null}};
}
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));

test('real app keeps model work out of lobby controls and rejects a late response from the other table',async t=>{
  const calls=[],model=deferred(),states={A:table('A',1),B:table('B',4,{actor:'user'})};
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   calls.push({method,payload});
   if(method==='games.table.read')return payload.tableId?states[payload.tableId]:{tables:[states.A,states.B],charactersAvailable:[]};
   if(method==='games.model.request')return model.promise;
   if(method==='games.model.cancel'){states[payload.tableId]={...states[payload.tableId],modelTurn:null};return {cancelRequested:true};}
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  ui.render();await nextTick();
  await ui.render().openSaved('A');let view=ui.render();assert.equal(view.table.tableId,'A');
  const result=view.startModel();view=ui.render();assert.equal(view.busy,false);assert.equal(view.modelBusy,true);
  const id=view.modelRequest;states.A={...states.A,modelTurn:{requestId:id,stage:'generating',startedAt:Date.now()}};
  view.showLobby();view=ui.render();assert.equal(view.screen,'lobby');assert.equal(view.busy,false);assert.equal(view.modelBusy,false);
  await view.openSaved('A');view=ui.render();assert.equal(view.modelRequest,id);assert.equal(view.modelTurn.phase,'thinking');
  await view.cancelModel();
  assert.ok(calls.some(({method,payload})=>method==='games.model.cancel'&&payload.requestId===id));
  ui.render().showLobby();await ui.render().openSaved('B');
  model.resolve(table('A',2));await result;
  view=ui.render();assert.equal(view.table.tableId,'B');assert.equal(view.table.version,4);assert.equal(view.error,'');assert.equal(view.pendingRetry,null);
});

test('real app reconciles a lost leave response with the original identity and returns to a fresh lobby',async t=>{
  const calls=[];let closed=false;
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   calls.push({method,payload});
   if(method==='games.table.leave'){closed=true;throw Object.assign(Error('reset'),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});}
   if(method==='games.table.read'){
    if(!payload.tableId)return {tables:closed?[]:[table('A',1,{status:'completed',ended:true})],charactersAvailable:[]};
    if(payload.command)return {...table('A',2,{status:'closed',ended:true}),commandReceipt:{commandId:payload.command.payload.commandId,status:'applied'}};
    return table('A',1,{status:'completed',ended:true});
   }
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  ui.render();await nextTick();
  await ui.render().openSaved('A');await ui.render().tableCommand('games.table.leave');
  let view=ui.render();assert.equal(view.errorCode,'GAME_REQUEST_UNCONFIRMED');assert.ok(view.pendingRetry);
  await view.checkPending();await nextTick();
  view=ui.render();assert.equal(view.screen,'lobby');assert.equal(view.pendingRetry,null);assert.equal(view.error,'');assert.deepEqual(view.lobby.tables,[]);
  const sent=calls.find(row=>row.method==='games.table.leave');
  assert.deepEqual(calls.find(row=>row.payload.command).payload.command,sent);
  assert.equal(calls.filter(row=>row.method==='games.table.leave').length,1);
});

test('real app pauses without retrying a cancelled move and a later move uses the fresh version and identity',async t=>{
  const calls=[],first=deferred(),second=deferred();let current=table('A',1),count=0;
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   calls.push({method,payload});
   if(method==='games.table.read')return payload.tableId?current:{tables:[current],charactersAvailable:[]};
   if(method==='games.model.request')return ++count===1?first.promise:second.promise;
   if(method==='games.table.pause'){current=table('A',2,{status:'paused'});return current;}
   if(method==='games.table.resume'){current=table('A',3);return current;}
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  ui.render();await nextTick();await ui.render().openSaved('A');
  const old=ui.render().startModel();
  assert.equal(ui.render().modelBusy,true);
  await ui.render().tableCommand('games.table.pause');
  first.reject(Object.assign(Error('cancelled'),{code:'GAME_MODEL_CANCELLED'}));await old;
  let view=ui.render();assert.equal(view.paused,true);assert.equal(view.error,'');assert.equal(view.pendingRetry,null);
  await view.tableCommand('games.table.resume');
  const fresh=ui.render().startModel();
  const [before,after]=calls.filter(call=>call.method==='games.model.request').map(call=>call.payload);
  assert.notEqual(before.requestId,after.requestId);assert.equal(after.expectedVersion,3);
  current=table('A',4,{actor:'user'});second.resolve(current);await fresh;
  view=ui.render();assert.equal(view.table.version,4);assert.equal(view.modelBusy,false);
});

test('authoritative polling releases a finished move while its original HTTP reply is still outstanding',async t=>{
  let current=table('A',1);
  const pending=deferred();
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   if(method==='games.table.read')return payload.tableId?current:{tables:[current],charactersAvailable:[]};
   if(method==='games.model.request')return pending.promise;
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  ui.render();await nextTick();await ui.render().openSaved('A');
  const result=ui.render().startModel(),id=ui.render().modelRequest;
  current=table('A',1,{turn:{requestId:id,stage:'generating',startedAt:Date.now()}});
  await ui.render().refresh('A');assert.equal(ui.render().modelBusy,true);
  current=table('A',2,{actor:'user'});
  await ui.render().refresh('A');assert.equal(ui.render().modelBusy,false);
  pending.reject(Object.assign(Error('network'),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true}));
  await result;const view=ui.render();assert.equal(view.table.version,2);assert.equal(view.error,'');assert.equal(view.pendingRetry,null);
});

test('explicit immediate leave returns to lobby while an authorized remaining hand is listed; scheduled close stays at settlement',async t=>{
  for(const immediate of [true,false]){
   let current=table('A',1,{actor:'user'});
   const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
    if(method==='games.table.read')return payload.tableId?current:{tables:current.status==='closed'?[]:[current],charactersAvailable:[]};
    if(method==='games.table.leave'){current=table('A',2,{status:immediate?'active':'closed',ended:!immediate});return current;}
    return {messages:[]};
   }});t.after(()=>ui.dispose());
   ui.render();await nextTick();await ui.render().openSaved('A');
   await ui.render().tableCommand('games.table.leave',immediate?{immediate:true}:{afterHand:true});
   await nextTick();const view=ui.render();
   assert.equal(view.screen,immediate?'lobby':'table');
   assert.equal(immediate?view.lobby.tables[0]?.status:view.table.status,immediate?'active':'closed');
  }
});

test('closing a busy replay detaches and cancels exactly its review, leaving ordinary controls free',async t=>{
  const calls=[],review=deferred(),closed=table('A',7,{status:'completed',ended:true});
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   calls.push({method,payload});
   if(method==='games.table.read')return payload.tableId?closed:{tables:[closed],charactersAvailable:[]};
   if(method==='games.replay.read')return {replay:{handId:payload.handId}};
   if(method==='games.replay.review')return review.promise;
   if(method==='games.model.cancel')return {cancelRequested:true};
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  ui.render();await nextTick();await ui.render().openSaved('A');await ui.render().openReplay('h');
  const pending=ui.render().startReview('ai-a','h');
  let view=ui.render();assert.equal(view.reviewBusy,true);assert.equal(view.busy,false);
  view.setOverlay(null);view=ui.render();assert.equal(view.overlay,null);assert.equal(view.reviewBusy,false);assert.equal(view.busy,false);
  const id=calls.find(call=>call.method==='games.replay.review').payload.requestId;
  assert.ok(calls.some(call=>call.method==='games.model.cancel'&&call.payload.requestId===id&&call.payload.tableId==='A'));
  review.resolve({review:{text:'late'}});await pending;
  view=ui.render();assert.equal(view.review,null);assert.equal(view.error,'');
});

test('real app locks a locally dealt DDZ hand, drains final effects, and requires Continue for a live closed hand',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date']});
  const calls=[],createReply=deferred(),event=(id,kind)=>({id,kind,actorId:'user'});
  const players=[{id:'user',kind:'user'},{id:'ai-a',kind:'ai',characterId:'a'},{id:'ai-b',kind:'ai',characterId:'b'}];
  function ddz(version,phase,actorKind,events=[]){
   const ended=phase==='settled',value=table('A',version,{status:ended?'closed':'active',actor:actorKind,ended});
   return {...value,type:'doudizhu',hand:2,presentation:{events},projection:{...value.projection,type:'doudizhu',phase,dealAttempt:1,players}};
  }
  let current=ddz(1,'calling','ai');
  const ui=hooks({readiness:async()=>({mode:'runtime'}),async invoke(method,payload){
   calls.push(method);
   if(method==='games.table.read')return payload.tableId?current:{tables:[current],charactersAvailable:[]};
   if(method==='games.table.create')return createReply.promise;
   if(method==='games.model.request')return current=ddz(2,'playing','user',[event('previous','landlord')]);
   if(method==='games.table.action')return current=ddz(3,'settled',null,[event('final-bomb','bomb'),event('final-spring','spring')]);
   return {messages:[]};
  }});t.after(()=>ui.dispose());
  const modelCalls=()=>calls.filter(method=>method==='games.model.request').length;
  ui.render();await nextTick();ui.render().openSetup('doudizhu');ui.render().setRoster(['a','b']);
  const create=ui.render().create();assert.equal(ui.render().ddzDealing,false);
  createReply.resolve(current);await create;
  let view=ui.render();assert.equal(view.ddzDealing,true);assert.equal(view.boardBusy,true);
  assert.deepEqual(view.lobby.tables[0],{tableId:'A',type:'doudizhu',status:'active',version:1,hand:2,characterIds:['a','b']});
  view.setAutoAI(true);await view.startModel();await view.action({type:'decline'});
  assert.equal(modelCalls(),0);assert.equal(calls.includes('games.table.action'),false);
  t.mock.timers.tick(1199);assert.equal(ui.render().ddzDealing,true);assert.equal(modelCalls(),0);
  t.mock.timers.tick(1);assert.equal(ui.render().ddzDealing,false);assert.equal(modelCalls(),1);
  await nextTick();ui.render();view=ui.render();assert.equal(view.effect.kind,'landlord');

  await view.action({type:'play',cards:[0,1,2,3],pattern:'bomb'});
  view=ui.render();assert.equal(view.table.status,'closed');assert.equal(view.ddzEndStage,'holding');
  t.mock.timers.tick(1010);assert.equal(ui.render().effect.kind,'bomb');
  t.mock.timers.tick(1010);assert.equal(ui.render().effect.kind,'spring');
  t.mock.timers.tick(1010);assert.equal(ui.render().effect,null);
  t.mock.timers.tick(899);assert.equal(ui.render().ddzEndStage,'holding');
  t.mock.timers.tick(1);view=ui.render();assert.equal(view.ddzEndStage,'revealed');assert.equal(view.boardBusy,true);
  await view.tableCommand('games.table.next');assert.equal(calls.includes('games.table.next'),false);
  view.continueDdzSettlement();view=ui.render();assert.equal(view.ddzEndStage,null);assert.equal(view.boardBusy,false);
  view.showLobby();await ui.render().openSaved('A');view=ui.render();
  assert.equal(view.ddzDealing,false);assert.equal(view.ddzEndStage,null);assert.equal(view.effect,null);
});
