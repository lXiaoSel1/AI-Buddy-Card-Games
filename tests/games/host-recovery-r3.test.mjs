// Regression coverage for lobby snapshots and lost create replies.
// Actual candidate app/service/economy; no production state, models or network.
import test from 'node:test';
import assert from 'node:assert/strict';
import {isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCardGamesApp} from '../../plugins/card-games/src/client/app.mjs';
import * as rules from '../../plugins/card-games/src/rules/index.mjs';
// Standalone plugin checkouts have no host source. Set this absolute root to run C02;
// an explicitly configured but invalid host path must fail instead of silently skipping.
const hostSource=process.env.AI_BUDDY_CARD_HOST_SOURCE?.trim();

const nextTick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;return {promise:new Promise(yes=>{resolve=yes;}),resolve:value=>resolve(value)};}
function hooks(client){
 const slots=[],effects=[];let cursor=0,props;
 const React={
  useState(initial){const key=cursor++;slots[key]??={value:typeof initial==='function'?initial():initial};return [slots[key].value,update=>{const slot=slots[key];slot.value=typeof update==='function'?update(slot.value):update;}];},
  useRef(initial){const key=cursor++;return slots[key]??={current:initial};},
  useEffect(fn,deps){const key=cursor++,previous=slots[key];if(previous&&deps&&previous.deps&&deps.length===previous.deps.length&&deps.every((value,index)=>Object.is(value,previous.deps[index])))return;effects.push(()=>{previous?.cleanup?.();slots[key]={deps,cleanup:fn()};});},
 };
 const App=createCardGamesApp(React,{client,render:(_react,value)=>{props=value;}});
 return {render(){cursor=0;App();for(const effect of effects.splice(0))effect();return props;},dispose(){for(const slot of slots)slot.cleanup?.();}};
}

test('older lobby refresh cannot restore closed table or stale wallet after newer refresh',async t=>{
 const old=deferred(),fresh=deferred();let reads=0;
 const ui=hooks({readiness:async()=>({mode:'runtime'}),invoke:async(method,payload)=>{
  if(method==='games.table.read'&&!payload.tableId){reads++;return reads===1?{tables:[],charactersAvailable:[],wallet:{available:1000}}:reads===2?old.promise:fresh.promise;}
  return {messages:[]};
 }});
 t.after(()=>ui.dispose());ui.render();await nextTick();ui.render();
 const first=ui.render().refresh(),second=ui.render().refresh();
 const latest={tables:[],charactersAvailable:[],wallet:{available:1200}};
 fresh.resolve(latest);await second;
 assert.deepEqual(ui.render().lobby,latest);
 old.resolve({tables:[{tableId:'already-closed',status:'completed',version:1}],charactersAvailable:[],wallet:{available:800}});await first;
 assert.deepEqual(ui.render().lobby,latest,'late lobby response replaced the latest table list and available funds');
});

async function hostFixture(t){
 assert.ok(isAbsolute(hostSource),'AI_BUDDY_CARD_HOST_SOURCE must be an absolute host checkout path');
 const [{DatabaseSync},{createCardGameService},{createGameEconomy}]=await Promise.all([import('node:sqlite'),import(pathToFileURL(join(hostSource,'src/voice-games/game-service.mjs')).href),import(pathToFileURL(join(hostSource,'src/voice-games/game-economy.mjs')).href)]);
 const db=new DatabaseSync(':memory:');let wallet={balance:2000},serial=0;
 const transaction=fn=>{const name='probe_'+serial++;db.exec('SAVEPOINT '+name);try{const result=fn();db.exec('RELEASE '+name);return result;}catch(error){db.exec('ROLLBACK TO '+name);db.exec('RELEASE '+name);throw error;}};
 const economy=createGameEconomy({db,transaction,wallet:()=>structuredClone(wallet),setWallet:value=>{wallet=structuredClone(value);},ledger:()=>{},now:()=>1800000000000});
 const profile={id:'probe-model',kind:'openai',protocol:'openai',baseUrl:'http://invalid.test',model:'inert-probe',enabled:true,capabilities:{chat:true}};
 const game={gameEconomy:economy,context:()=>({personaId:'probe-persona',characterId:'probe-ai'}),hasCharacter:id=>id==='probe-ai',pluginScope:(characterId,personaId)=>({characterId,personaId,lifeId:'probe-life',operationId:'probe-operation'}),viewState:()=>({characters:[{id:'probe-ai',name:'Probe AI'}]}),gameContext:async()=>({modelBinding:'probe-model',character:{name:'Probe AI'}}),recordGameFact:async fact=>({recorded:true,eventId:fact.id})};
 const provider={enabled:true,state:{profiles:[profile]},captureConnection:()=>structuredClone(profile)};
 const service=createCardGameService({getGame:()=>game,getProvider:()=>provider,now:()=>1800000000000});
 service.registerRuleArtifact({module:rules,sha256:'d03d283bdf6c748fcfbdcbcf4eca7f959ca29cbe4ebfbf87f3b53a51d94f16e4'});
 t.after(async()=>{await service.close();db.close();});
 return {economy,service};
}

test('retrying a lost create preserves a pause applied from another page',{skip:hostSource?false:'Host integration requires AI_BUDDY_CARD_HOST_SOURCE; standalone plugin checkouts have no host service/economy source'},async t=>{
 const {service}=await hostFixture(t);
 let first,dropReply=true;const sent=[];
 const ui=hooks({readiness:async()=>({mode:'runtime'}),invoke:async(method,payload)=>{
  sent.push({method,payload});
  if(method==='audio.settings'||method==='games.table.art')return {};
  const result=await service.invoke(method,payload);
  if(method==='games.table.create'&&dropReply){first=result;dropReply=false;throw Object.assign(Error('lost create reply'),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});}
  return result;
 }});
 t.after(()=>ui.dispose());ui.render();await nextTick();ui.render();
 ui.render().setRoster(['probe-ai']);
 await ui.render().create();
 assert.equal(first.version,1);
 assert.ok(ui.render().pendingRetry,'the real app must retain the original lost create command');
 const paused=await service.invoke('games.table.pause',{tableId:first.tableId,expectedVersion:1,commandId:'probe-pause-id'});
 assert.equal(paused.version,2);assert.equal(paused.status,'paused');
 const original=sent.find(row=>row.method==='games.table.create').payload;
 await assert.rejects(service.invoke('games.table.create',{...original,buyIn:220}),{code:'GAME_COMMAND_CONFLICT'});
 const authority=await service.invoke('games.table.read',{tableId:first.tableId});
 assert.equal(authority.status,'paused');assert.equal(authority.version,2);
 await ui.render().retry();
 const view=ui.render(),requests=sent.filter(row=>row.method==='games.table.create');
 const lobby=await service.invoke('games.table.read',{});
 assert.equal(lobby.tables.length,1,'idempotency must not create a second table');
 assert.equal(requests.length,2);assert.deepEqual(requests[1],requests[0],'real UI retry must retain the original identity');
 assert.equal(view.screen,'table');
 assert.equal(view.paused,true,'the real app resumed the lost-create table as active even though another page had paused it');
 assert.equal(view.table.version,paused.version,'subsequent real controls would submit the obsolete expectedVersion');
});
