import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderCardGames} from '../../plugins/card-games/src/client/render.mjs';
function props(status,commands){const noop=()=>{};const view={type:'texas',phase:'settled',version:8,handId:'synthetic-ui-hand',actorId:null,players:[{id:'user',kind:'user',handCount:2,stack:100},{id:'ai-a',kind:'ai',characterId:'a',handCount:2,stack:300}],board:[],history:[],ownHand:[],currentBet:0,minRaise:2,blinds:{small:1,big:2},settlement:{completed:true,deltasByPlayer:{user:-100,'ai-a':100}}};return {ready:{mode:'runtime'},lobby:{tables:[],wallet:{balance:100,held:0,available:100}},table:{tableId:'synthetic-ui-table',version:8,status,type:'texas',history:[],accounts:[]},type:'texas',count:5,roster:['a'],available:[{id:'a',label:'甲'}],rosterCount:4,buyIn:'200',blinds:'1/2',busy:false,chatBusy:false,chatCharacter:'',chatReceipt:null,chatRetry:null,error:'',messages:[],text:'',stylesheet:'',view,players:view.players,userId:'user',ownHand:[],legal:[],settled:true,isUser:false,paused:false,replay:null,modelStatus:null,selected:[],selectedPatterns:[],refresh:async()=>{},perform:async()=>{},tableCommand:(method,payload)=>commands.push({method,payload}),startModel:noop,changeCount:noop,create:noop,action:noop,retry:noop,retryChat:noop,refreshChat:noop,cancelModel:noop,openReplay:noop,submitChat:noop,card:c=>React.createElement('span',{key:c},String(c)),setType:noop,setRoster:noop,setBuyIn:noop,setBlinds:noop,setRaiseTo:noop,setText:noop,setReplay:noop,setReview:noop,setReviewCharacter:noop,setChatCharacter:noop,setStrategy:noop,setAutoAI:noop,setPattern:noop,setError:noop,epoch:{current:0},lastAuto:{current:''},uuid:()=>''};}
function elements(node,out=[]){if(Array.isArray(node)){for(const child of node)elements(child,out);}else if(React.isValidElement(node)){out.push(node);elements(node.props.children,out);}return out;}
function label(node){const text=value=>Array.isArray(value)?value.map(text).join(''):React.isValidElement(value)?text(value.props.children):value==null||typeof value==='boolean'?'':String(value);return text(node.props.children);}

test('revoked binding exposes confirmed rebind and void/refund without starting a model',async()=>{
 const commands=[],p=props('paused',commands);p.paused=true;p.settled=false;p.overlay='pause';p.table.bindingRecovery=true;p.view.phase='preflop';p.view.settlement=null;
 const nodes=elements(renderCardGames(React,p));
 const pause=nodes.find(n=>n.props['data-overlay']==='pause');assert.match(label(pause),/这位角色的模型连接改过了/);
 await elements(pause).find(n=>n.type==='button'&&label(n)==='用现在的连接继续').props.onClick();
 assert.deepEqual(commands,[{method:'games.table.resume',payload:{rebindCurrent:true,confirmed:true}}]);
 p.overlay='void-hand';const confirm=elements(renderCardGames(React,p)).find(n=>n.props['data-overlay']==='void-hand');assert.equal(confirm.props.hidden,false);
 assert.match(label(confirm),/这一手不算输赢，押上的积分全部退回/);
 elements(confirm).find(n=>n.type==='button'&&label(n)==='作废并退回').props.onClick();
 assert.deepEqual(commands.at(-1),{method:'games.table.leave',payload:{voidHand:true,confirmed:true}});
});
