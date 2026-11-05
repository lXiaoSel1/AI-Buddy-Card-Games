import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderCardGames} from '../../plugins/card-games/src/client/render.mjs';
import {refreshAfterModelStop} from '../../plugins/card-games/src/client/app.mjs';
function props(status,commands){const noop=()=>{};const view={type:'texas',phase:'settled',version:8,handId:'synthetic-ui-hand',actorId:null,players:[{id:'user',kind:'user',handCount:2,stack:100},{id:'ai-a',kind:'ai',characterId:'a',handCount:2,stack:300}],board:[],history:[],ownHand:[],currentBet:0,minRaise:2,blinds:{small:1,big:2},settlement:{completed:true,deltasByPlayer:{user:-100,'ai-a':100}}};return {ready:{mode:'runtime'},lobby:{tables:[],wallet:{balance:100,held:0,available:100}},table:{tableId:'synthetic-ui-table',version:8,status,type:'texas',history:[],accounts:[]},type:'texas',count:5,roster:['a'],available:[{id:'a',label:'甲'}],rosterCount:4,buyIn:'200',blinds:'1/2',busy:false,chatBusy:false,chatCharacter:'',chatReceipt:null,chatRetry:null,error:'',messages:[],text:'',stylesheet:'',view,players:view.players,userId:'user',ownHand:[],legal:[],settled:true,isUser:false,paused:false,replay:null,modelStatus:null,selected:[],selectedPatterns:[],refresh:async()=>{},perform:async()=>{},tableCommand:(method,payload)=>commands.push({method,payload}),startModel:noop,changeCount:noop,create:noop,action:noop,retry:noop,retryChat:noop,refreshChat:noop,cancelModel:noop,openReplay:noop,submitChat:noop,card:c=>React.createElement('span',{key:c},String(c)),setType:noop,setRoster:noop,setBuyIn:noop,setBlinds:noop,setRaiseTo:noop,setText:noop,setReplay:noop,setReview:noop,setReviewCharacter:noop,setChatCharacter:noop,setStrategy:noop,setAutoAI:noop,setPattern:noop,setError:noop,epoch:{current:0},lastAuto:{current:''},uuid:()=>''};}
function elements(node,out=[]){if(Array.isArray(node)){for(const child of node)elements(child,out);}else if(React.isValidElement(node)){out.push(node);elements(node.props.children,out);}return out;}
function label(node){const text=value=>Array.isArray(value)?value.map(text).join(''):React.isValidElement(value)?text(value.props.children):value==null||typeof value==='boolean'?'':String(value);return text(node.props.children);}
test('lobby refresh reads the whole table list even when the previous table is still selected',async()=>{
 const p=props('completed',[]),calls=[];
 p.screen='lobby';p.refresh=async tableId=>calls.push(tableId);
 const refresh=elements(renderCardGames(React,p)).find(node=>node.type==='button'&&label(node)==='刷新状态');
 assert.ok(refresh);await refresh.props.onClick();assert.deepEqual(calls,[undefined]);
});
test('settled Texas page exposes real leave command to release funds at the safe boundary',()=>{const commands=[],nodes=elements(renderCardGames(React,props('completed',commands))),leave=nodes.find(n=>n.type==='button'&&label(n)==='离开并收回桌上筹码');assert(leave);assert.equal(leave.props.disabled,false);leave.props.onClick();assert.deepEqual(commands,[{method:'games.table.leave',payload:undefined}]);assert.equal(nodes.find(n=>n.type==='button'&&label(n)==='下一手').props.disabled,false);});
test('closed table cannot start another hand or lock additional funds from its settled screen',()=>{const nodes=elements(renderCardGames(React,props('closed',[])));assert(!nodes.some(n=>n.type==='button'&&label(n)==='下一手'));assert(nodes.some(n=>n.type==='button'&&label(n)==='返回大厅'&&!n.props.disabled));assert.equal(nodes.find(n=>n.type==='button'&&label(n)==='从钱包补筹').props.disabled,true);assert(!nodes.some(n=>n.type==='button'&&label(n)==='离开并收回桌上筹码'));assert(nodes.some(n=>n.type==='strong'&&label(n)==='本桌已关闭'));assert(nodes.some(n=>n.type==='button'&&label(n)==='全牌回放'&&!n.props.disabled));});
test('model failure/cancel recovery reads paused authority without replaying the failed action or updating another table',async()=>{const calls=[],applied=[],client={invoke:async(method,payload)=>{calls.push({method,payload});return {tableId:'original',status:'paused',version:9};}};assert.equal(await refreshAfterModelStop(client,{tableId:'original',isCurrent:()=>true,apply:value=>applied.push(value)}),true);assert.deepEqual(calls,[{method:'games.table.read',payload:{tableId:'original'}}]);assert.equal(applied[0].status,'paused');assert.equal(await refreshAfterModelStop(client,{tableId:'original',isCurrent:()=>false,apply:()=>assert.fail('late state crossed table context')}),false);assert.equal(await refreshAfterModelStop({invoke:async()=>{throw Error('network unavailable');}},{tableId:'original',isCurrent:()=>true,apply:()=>assert.fail('failed read fabricated a state')}),false);});
test('Doudizhu cap indicator uses each public landlord-farmer pair independently and never raises its score above16',()=>{const p=props('active',[]);p.type='doudizhu';p.table.type='doudizhu';p.rosterCount=2;p.settled=false;p.players=[{id:'user',kind:'user',handCount:20},{id:'ai-a',characterId:'a',handCount:17},{id:'ai-b',characterId:'b',handCount:17}];p.view={...p.view,type:'doudizhu',phase:'playing',players:p.players,settlement:null,landlordId:'user',publicMultiplier:4,doubles:{user:2,'ai-a':2,'ai-b':1}};let pairs=elements(renderCardGames(React,p)).filter(n=>n.props['data-pair-stake']);assert.equal(pairs.length,2);assert.equal(pairs.find(n=>n.props['data-pair-stake']==='ai-a').props['data-cap-reached'],true);assert.match(label(pairs.find(n=>n.props['data-pair-stake']==='ai-a')),/当前倍率 16 · 已封顶/);assert.equal(pairs.find(n=>n.props['data-pair-stake']==='ai-b').props['data-cap-reached'],false);assert.match(label(pairs.find(n=>n.props['data-pair-stake']==='ai-b')),/当前倍率 8$/);p.view.publicMultiplier=128;pairs=elements(renderCardGames(React,p)).filter(n=>n.props['data-pair-stake']);assert(pairs.every(n=>label(n).includes('当前倍率 16 · 已封顶')));assert(pairs.every(n=>!JSON.stringify(n.props).includes('ownHand')));});

test('settled Texas uses real in-table top-ups, guides busts, and only calls a true showdown a showdown',()=>{
 const p=props('completed',[]);
 p.view.settlement.endingStacks={user:0,'ai-a':400};
 p.view.settlement.winnerIds=['ai-a'];
 let nodes=elements(renderCardGames(React,p));
 assert(nodes.some(n=>n.props.className==='cg-note'&&label(n)==='甲 赢下底池'));
 assert(nodes.some(n=>n.type==='p'&&label(n)==='筹码已用完，请补筹或离开牌桌。'));
 assert.equal(nodes.find(n=>n.props['data-game-control']==='next').props.disabled,true);
 p.table.topups={user:120};
 p.view.board=[47,50,23,0,29];
 p.table.presentation={showdown:{user:[3,4],'ai-a':[48,49]}};
 nodes=elements(renderCardGames(React,p));
 assert(nodes.some(n=>n.props.className==='cg-note'&&label(n)==='甲赢了 · 三条 A'));
 assert(nodes.some(n=>n.type==='p'&&label(n)==='在桌 120 · 可用 100'));
 assert.equal(nodes.find(n=>n.props['data-game-control']==='next').props.disabled,false);
});

test('R4 Dou Dizhu keeps the last play and waits at revealed hands before presenting settlement',()=>{
 const p=props('completed',[]),[user,a]=p.players,b={id:'ai-b',kind:'ai',characterId:'b',handCount:0};
 p.players.push(b);
 Object.assign(p.view,{type:'doudizhu',phase:'settled',landlordId:b.id,bottom:[9,10,11],
  history:[{actorId:b.id,type:'play',cards:[3]}],settlement:{completed:true,winnerIds:[b.id],deltasByPlayer:{user:-1,'ai-a':-1,'ai-b':2}}});
 Object.assign(p.table,{type:'doudizhu',presentation:{remainingHands:{[user.id]:[4],[a.id]:[5,53,0],[b.id]:[]}}});
 p.ownHand=[4];p.continueDdzSettlement=()=>{p.ddzEndStage=null;};
 p.ddzEndStage='holding';
 let nodes=elements(renderCardGames(React,p));
 assert(nodes.some(n=>n.props.className==='cg-played cg-ddz-played'));
 assert(!nodes.some(n=>n.props['data-game-result']||n.props['data-game-reveal']));
 p.ddzEndStage='revealed';
 nodes=elements(renderCardGames(React,p));
 const reveal=nodes.find(n=>n.props['data-game-reveal']);
 assert(reveal);
 assert(!nodes.some(n=>n.props['data-game-result']||n.props.className==='cg-played cg-ddz-played'));
 assert.equal(elements(reveal).filter(n=>n.props.className==='cg-ddz-reveal-card').length,3);
 assert(elements(reveal).some(n=>n.props.className==='cg-ddz-out'&&label(n)==='出完了'));
 assert.equal(nodes.find(n=>n.props['data-user-card']===4).props.disabled,true);
 nodes.find(n=>n.props['data-game-control']==='continue-ddz-settlement').props.onClick();
 nodes=elements(renderCardGames(React,p));
 assert(nodes.some(n=>n.props['data-game-result']));
 assert(!nodes.some(n=>n.props['data-game-reveal']||n.props.className==='cg-table-picture'));
});

test('R4 between-hand top-up displays the bounded approved slider and submits the displayed amount',async()=>{
 const p=props('completed',[]),calls=[],overlays=[];
 Object.assign(p,{overlay:'topup',topup:'150',setOverlay:value=>overlays.push(value),tableCommand:async(...args)=>{calls.push(args);return true;}});
 p.table.accounts=[{playerId:'user',available:90}];
 const modal=elements(renderCardGames(React,p)).find(n=>n.props['data-overlay']==='topup');
 const nodes=elements(modal);
 assert.equal(nodes.find(n=>n.props.type==='range').props.value,90);
 assert(nodes.some(n=>n.props.className==='cg-topup-preview'&&label(n)==='补 90，下一手在桌 190'));
 await nodes.find(n=>n.type==='button'&&label(n)==='补筹').props.onClick();
 assert.deepEqual(calls,[['games.table.topup',{amount:90}]]);
 assert.deepEqual(overlays,[null]);
});

test('Texas always holds five board places and hides final presentation until the runout finishes',()=>{
 const p=props('completed',[]);
 p.view.board=[0,1,2,3,4];
 p.view.settlement.winnerIds=['ai-a'];
 p.view.settlement.endingStacks={user:0,'ai-a':400};
 p.table.presentation={showdown:{user:[8,9],'ai-a':[10,11]}};
 const nodes=elements(renderCardGames(React,{...p,boardBusy:true,boardCount:3,boardPhaseCount:3}));
 assert.equal(nodes.filter(n=>n.props.className==='cg-board-slot').length,5);
 assert.deepEqual(nodes.filter(n=>n.props['data-board-card']!=null).map(n=>n.props['data-board-card']),[0,1,2]);
 assert.equal(nodes[0].props['data-game-phase'],'flop');
 assert(!nodes.some(n=>n.props['data-game-result']||n.props['data-game-control']==='next'||n.props.className?.split(' ').includes('winner')));
 assert(nodes.some(n=>n.type==='article'&&n.props['data-seat']==='ai-a'&&label(n).includes('300')));
});

test('short all-in call has one button, localized waiting and error captions expose no raw codes',()=>{
 const p=props('active',[]),actions=[];
 Object.assign(p,{settled:false,isUser:true,action:action=>actions.push(action),raiseTo:'24',legal:[{type:'fold'},{type:'call',amount:16,raiseTo:20},{type:'all-in',raiseTo:20}]});
 Object.assign(p.view,{phase:'turn',actorId:'user',settlement:null});
 let nodes=elements(renderCardGames(React,p));
 assert(!nodes.some(n=>n.props['data-game-action']==='all-in'));
 const call=nodes.find(n=>n.props['data-game-action']==='call');
 assert.equal(label(call),'跟注 16 · ALL IN');
 call.props.onClick();
 assert.deepEqual(actions,[p.legal[1]]);
 nodes=elements(renderCardGames(React,{...p,isUser:false,modelBusy:true,modelWaitLong:true,modelTurn:{stage:'correcting',attempt:2,actorId:'ai-a'},errorCode:'GAME_MODEL_TIMEOUT'}));
 assert(nodes.some(n=>n.type==='div'&&n.props.role==='status'&&label(n).includes('格式不对，正在重答（第 1 次）')));
 assert(nodes.some(n=>n.type==='small'&&label(n).includes('可以取消')));
 assert(nodes.some(n=>n.type==='div'&&n.props.role==='alert'&&label(n).includes('模型长时间没有返回数据')));
 assert(!nodes.some(n=>n.type==='div'&&n.props.role==='alert'&&label(n).includes('GAME_MODEL_TIMEOUT')));
});

test('R4 Texas raise presets show amounts and the maximum submits an all-in without a numeric input',()=>{
 const p=props('active',[]),actions=[];
 Object.assign(p,{settled:false,isUser:true,action:action=>actions.push(action),raiseTo:'24',setRaiseTo:value=>{p.raiseTo=value;},
  legal:[{type:'fold'},{type:'call',amount:12,raiseTo:12},{type:'raise',minRaiseTo:20,maxRaiseTo:100},{type:'all-in',raiseTo:100}]});
 Object.assign(p.view,{phase:'flop',actorId:'user',currentBet:12,settlement:null});
 p.players[0].committed=20;p.players[1].committed=20;
 let nodes=elements(renderCardGames(React,p));
 const controls=elements(nodes.find(n=>n.props.className==='cg-controls texas'));
 assert(!controls.some(n=>n.type==='input'&&n.props.type==='number'));
 assert.deepEqual(controls.filter(n=>n.type==='button').slice(0,4).map(label),['最小 20','半池 32','一池 52','ALL IN 100']);
 assert(!nodes.some(n=>n.props.className==='cg-turn-note texas'));
 controls.find(n=>n.type==='button'&&label(n)==='ALL IN 100').props.onClick();
 nodes=elements(renderCardGames(React,p));
 assert.equal(nodes.find(n=>n.props.id==='cg-raise-amount').props.value,100);
 const allIn=nodes.find(n=>n.props['data-game-action']==='all-in');
 assert.match(allIn.props.className,/gold/);allIn.props.onClick();
 p.legal=p.legal.filter(action=>action.type!=='raise');
 nodes=elements(renderCardGames(React,p));
 assert(!nodes.some(n=>n.props.id==='cg-raise-amount'));
 nodes.find(n=>n.props['data-game-action']==='all-in').props.onClick();
 assert.deepEqual(actions,[{type:'all-in'},{type:'all-in'}]);
});

test('R4 moves the center-seat Texas bet away from the pot and uses only current street action tags',()=>{
 const p=props('active',[]),[user,opponent]=p.players;
 Object.assign(opponent,{committed:24,streetCommitted:24});
 Object.assign(p.view,{phase:'turn',actorId:'user',board:[1,2,3,4],settlement:null,history:[
  {actorId:'user',type:'blind',amount:2},
  {actorId:'user',type:'call',amount:12,street:'flop'},
  {actorId:'ai-a',type:'raise',amount:12,raiseTo:24,street:'turn'},
  {actorId:'ai-a',type:'uncalled-return',amount:5,street:'turn'}
 ]});
 const nodes=elements(renderCardGames(React,{...p,settled:false,isUser:true}));
 const pot=nodes.find(n=>n.props.className==='cg-pot'),bet=nodes.find(n=>n.props['data-seat-bet']==='ai-a');
 assert.equal(bet.props.style.left,'722px');
 assert.equal(pot.props.style.top,'calc(414px + var(--dy))');
 assert.deepEqual(nodes.filter(n=>n.props.className==='cg-action-tag').map(label),['加注 24']);
 assert.equal(nodes.find(n=>n.props['data-seat']===user.id).props.style.left,'112px');
});

test('R22 table fragment keeps separate keys for portraits and nameplates across seat changes',()=>{
 const p=props('active',[]);
 const roster=['claude','deepseek','chatgpt','grok','gemini','kimi','qwen','seed','glm'];
 const user={...p.players[0],streetCommitted:2};
 for(const [type,count] of [...[4,3,6,8,2,5,7,9,10].map(count=>['texas',count]),['doudizhu',3]]){
  const ddz=type==='doudizhu';
  const players=[user,...roster.slice(0,count-1).map(characterId=>({id:'ai-'+characterId,kind:'ai',characterId,handCount:2,stack:100,streetCommitted:2}))];
  const history=ddz?[{actorId:'user',type:'play',cards:[0]},{actorId:'ai-claude',type:'pass'},{actorId:'ai-deepseek',type:'play',cards:[1]}]:[];
  const view={...p.view,type,players,phase:ddz?'playing':'preflop',actorId:'ai-claude',history,settlement:null};
  const nodes=elements(renderCardGames(React,{...p,table:{...p.table,type},players,view,settled:false,modelBusy:true}));
  const fragment=nodes.find(n=>n.props.className==='cg-content').props.children;
  assert.equal(fragment.type,React.Fragment);
  const children=fragment.props.children.filter(React.isValidElement);
  const keys=children.flatMap(n=>n.key===null?[]:[n.key]);
  const context=type+' '+count+' seats';
  assert.equal(new Set(keys).size,keys.length,context);
  const seatNodes=children.filter(n=>n.props['data-seat']||/^cg-(bust|medal|spot|bubble|played|pass|seat-backs|bet)\b/.test(n.props.className??''));
  assert(seatNodes.every(n=>n.key!==null),context);
  assert.deepEqual(children.flatMap(n=>n.props['data-seat']?[n.props['data-seat']]:[]).sort(),players.map(n=>n.id).sort(),context);
  const portraits=children.filter(n=>/^cg-(bust|medal)\b/.test(n.props.className??''));
  assert.equal(portraits.length,count-1,context);
  assert.deepEqual(children.filter(n=>n.props.className==='cg-spot').map(n=>n.key),type==='texas'&&count>=8?['spot-ai-claude']:[],context);
 }
});

test('R23 Chinese and English retry numbers match the More panel correction count',()=>{
 const p=props('active',[]);
 Object.assign(p.view,{phase:'preflop',actorId:'ai-a',settlement:null});
 for(const corrections of [1,2])for(const lang of ['zh','en']){
  const nodes=elements(renderCardGames(React,{...p,lang,overlay:'more',settled:false,modelBusy:true,modelTurn:{stage:'correcting',attempt:corrections+1,actorId:'ai-a'},modelStatus:{status:'waiting',corrections}}));
  const status=nodes.find(n=>n.props.className==='cg-turn-note texas');
  const text=lang==='en'?'Retrying after an invalid response format (retry '+corrections+')':'格式不对，正在重答（第 '+corrections+' 次）';
  assert(label(status).includes(text));
  assert(nodes.some(n=>n.type==='p'&&label(n).includes((lang==='en'?'Corrections ':'纠错 ')+corrections)));
 }
});

test('paused leave options omit immediate leave and historical refusals use their recorded phase',()=>{
 const p=props('paused',[]);
 let nodes=elements(renderCardGames(React,{...p,paused:true,overlay:'leave'}));
 assert(!nodes.some(n=>n.type==='input'&&n.props.name==='leave-mode'&&n.props.value==='now'));
 assert(nodes.some(n=>n.type==='p'&&label(n)==='若要立即离开，请先恢复牌局。'));
 p.table.type='doudizhu';
 p.view.type='doudizhu';
 p.view.history=[{actorId:'user',type:'decline'},{actorId:'ai-a',type:'call-landlord'},{actorId:'user',type:'decline'}];
 nodes=elements(renderCardGames(React,{...p,overlay:'history'}));
 assert.deepEqual(nodes.filter(n=>n.props.className==='cg-history-entry').map(label),['你 · 不叫','甲 · 叫地主','你 · 不抢']);
});

test('R4 user-turn portraits remain bright and Dou Dizhu bid and double keep their approved emphasis',()=>{
 const p=props('active',[]),actions=[];
 Object.assign(p,{settled:false,isUser:true,action:move=>actions.push(move),legal:[{type:'rob'},{type:'decline'}]});
 Object.assign(p.table,{type:'doudizhu'});
 Object.assign(p.view,{type:'doudizhu',phase:'robbing',actorId:'user',settlement:null});
 let nodes=elements(renderCardGames(React,p));
 const buttons=nodes.filter(n=>n.props['data-game-action']);
 assert.deepEqual(buttons.map(label),['不抢','抢地主']);
 assert.match(buttons[0].props.className,/quiet/);
 assert(!buttons[1].props.className.includes('quiet'));
 assert(!nodes.some(n=>n.props.className==='cg-bust idle'));
 buttons[1].props.onClick();
 assert.deepEqual(actions,[{type:'rob'}]);
 Object.assign(p.view,{phase:'doubling',landlordId:'user',publicMultiplier:2});
 p.legal=[{type:'double',factor:1},{type:'double',factor:2}];
 nodes=elements(renderCardGames(React,p));
 assert(nodes.some(n=>n.props.className==='cg-note'&&label(n)==='地主加倍对两位农民都生效'));
 assert.match(nodes.find(n=>n.props['data-game-action']==='double'&&label(n)==='加倍 ×2').props.className,/gold/);
});

test('R4 all-in nameplates keep their marker during runout and show the settled or topped-up stack afterwards',()=>{
 const p=props('completed',[]);
 for(const player of p.players)Object.assign(player,{allIn:true,stack:0});
 Object.assign(p.view.settlement,{winnerIds:['ai-a'],endingStacks:{user:0,'ai-a':400}});
 p.view.board=[0,1,2,3,4];
 p.table.topups={user:20};
 const plate=(nodes,id)=>nodes.find(n=>n.props['data-seat']===id);
 const sub=node=>label(elements(node).find(n=>n.props.className==='cg-ribbon-sub'));
 const runout=elements(renderCardGames(React,{...p,boardBusy:true,boardCount:3,boardPhaseCount:3}));
 const settled=elements(renderCardGames(React,p));
 for(const [id,amount] of [['user','20'],['ai-a','400']]){
  assert.equal(sub(plate(runout,id)),'ALL IN');
  assert.match(plate(runout,id).props.className,/\ballin\b/);
  assert.equal(sub(plate(settled,id)),amount);
  assert.doesNotMatch(plate(settled,id).props.className,/\ballin\b/);
 }
});

test('R4 reduced-motion dealing renders only the fading hand, without a flight layer or deck',()=>{
 const p=props('active',[]);
 Object.assign(p,{settled:false,isUser:true,ddzDealing:true,ddzDealCount:17,
  ownHand:Array.from({length:17},(_,i)=>i),legal:[{type:'call-landlord'},{type:'decline'}]});
 p.table.type='doudizhu';
 Object.assign(p.view,{type:'doudizhu',phase:'calling',actorId:'user',settlement:null});
 const standard=elements(renderCardGames(React,p));
 assert.equal(standard.filter(n=>n.props.className==='cg-deal-flight').length,37);
 assert(standard.some(n=>n.props.className==='cg-deal-stack'));
 const reduced=elements(renderCardGames(React,{...p,ddzDealReduced:true}));
 assert(!reduced.some(n=>n.props['data-game-dealing']||['cg-deal-stack','cg-deal-flight','cg-board cg-deal-bottom'].includes(n.props.className)));
 assert.equal(reduced.filter(n=>n.props.className==='cg-deal').length,17);
 assert(reduced.filter(n=>n.props['data-user-card']!=null).every(n=>n.props.disabled));
 assert(!reduced.some(n=>n.props['data-game-action']));
});

test('R5 the acting end seat keeps its spotlight and the thinking bubble follows the stage bottom',()=>{
 const p=props('active',[]);
 const ids=['claude','deepseek','chatgpt','grok','gemini','kimi','qwen'];
 const opponents=ids.map(characterId=>({id:'ai-'+characterId,kind:'ai',characterId,stack:100}));
 p.players=[p.players[0],...opponents];
 Object.assign(p.view,{phase:'flop',players:p.players,settlement:null});
 Object.assign(p,{settled:false,modelBusy:true});
 for(const actor of [opponents[0],opponents.at(-1)]){
  p.view.actorId=actor.id;
  for(const height of [800,1000]){
   const nodes=elements(renderCardGames(React,{...p,size:{width:1280,height}}));
   assert.deepEqual(nodes.filter(n=>n.props.className==='cg-spot').map(n=>n.key),['spot-'+actor.id]);
   const bubble=nodes.find(n=>n.key==='say-'+actor.id);
   assert.equal(bubble.props.className,'cg-bubble cg-bubble-spot thinking');
   assert.deepEqual(bubble.props.style,{left:'860px',bottom:'375px'});
  }
  const paused=elements(renderCardGames(React,{...p,paused:true}));
  assert(!paused.some(n=>n.props.className==='cg-spot'||n.key==='say-'+actor.id));
 }
 p.view.actorId='user';
 const user=elements(renderCardGames(React,{...p,isUser:true,modelBusy:false}));
 assert(!user.some(n=>n.props.className==='cg-spot'));
});
