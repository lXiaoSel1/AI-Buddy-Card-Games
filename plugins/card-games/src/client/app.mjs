import {renderCardGames} from './render.mjs';
import {createGamePageClient} from './api.mjs';
import {stylesheet} from './style.mjs';
import {useCardPresentation} from './experience.mjs';
import {ddzCanBeat,ddzPatterns} from '../rules/doudizhu.mjs';
import {chatReceipt as normalizeChatReceipt,retryChatPayload} from './chat-receipt.mjs';
import {actionCommand} from './action-command.mjs';
import {createDdzLifecycle} from './ddz-lifecycle.mjs';
import {acceptsTableObservation,commandCanRetry,commandOutcome,commandReadPayload,startSingleFlightPoll,viewScopeIsCurrent} from './operation-state.mjs';

const waitStage=turn=>turn&&({...turn,phase:turn.stage==='generating'?'thinking':turn.stage});
const messageCode=error=>error?.code??'GAME_REQUEST_FAILED';
const cancellation=error=>['GAME_MODEL_CANCELLED','ABORT_ERR'].includes(error?.code);

export async function refreshAfterModelStop(client,{tableId,isCurrent,apply}){
 try{const value=await client.invoke('games.table.read',{tableId});if(isCurrent()){apply(value);return true;}}catch{}
 return false;
}

export function createCardGamesApp(React,{client=createGamePageClient(),render=renderCardGames}={}){
 const {useState,useEffect,useRef}=React;
 return function CardGamesApp(){
  const [ready,setReady]=useState(null),[lobby,setLobby]=useState({tables:[],charactersAvailable:[]}),[table,setTable]=useState(null),[type,setType]=useState('texas'),[count,setCount]=useState(5),[roster,setRoster]=useState([]),[buyIn,setBuyIn]=useState('200'),[blinds,setBlinds]=useState('1/2');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[errorCode,setErrorCode]=useState(null),[selected,setSelected]=useState([]),[pattern,setPattern]=useState(''),[raiseTo,setRaiseTo]=useState(''),[messages,setMessages]=useState([]),[text,setText]=useState('');
  const [replay,setReplay]=useState(null),[review,setReview]=useState(null),[reviewCharacter,setReviewCharacter]=useState(''),[reviewBusy,setReviewBusy]=useState(false),[strategy,setStrategy]=useState(false),[autoAI,setAutoAI]=useState(false),[pendingRetry,setPendingRetry]=useState(null),[modelStatus,setModelStatus]=useState(null),[dismissedModel,setDismissedModel]=useState(null),[modelWaitLong,setModelWaitLong]=useState(false),[localTurn,setLocalTurn]=useState(null);
  const [chatBusy,setChatBusy]=useState(false),[chatCharacter,setChatCharacter]=useState(''),[chatReceipt,setChatReceipt]=useState(null),[chatRetry,setChatRetry]=useState(null),[chatSpeech,setChatSpeech]=useState(null);
  const [screen,setScreen]=useState('lobby'),[overlay,setOverlayState]=useState(null),[topup,setTopup]=useState('20');
  const [ddzPresentation,setDdzPresentation]=useState(null),ddzLifecycle=useRef(null);
  ddzLifecycle.current??=createDdzLifecycle({onChange:setDdzPresentation});
  const stageRef=useRef(null),live=useRef(true),epoch=useRef(0),sequence=useRef(0),observation=useRef(null),lastAuto=useRef(''),selectedTable=useRef(null),tableRef=useRef(null);
  const commandRequest=useRef(null),localTurns=useRef(new Map()),chatRequest=useRef(null),chatObservation=useRef(null),reviewRequest=useRef(null),replayRead=useRef(null);
  const uuid=()=>globalThis.crypto.randomUUID();
  const scope=()=>({epoch:epoch.current,tableId:selectedTable.current});
  const current=value=>live.current&&viewScopeIsCurrent(value,scope());
  const clearError=()=>{setError('');setErrorCode(null);};
  const showError=value=>{setError(String(value?.message??value??''));setErrorCode(value?messageCode(value):null);};
  const visibleError=value=>{if(!value)clearError();else showError(value);};

  useEffect(()=>{
   live.current=true;const initial=scope();let disposed=false;
   (async()=>{try{
    const state=await client.readiness();if(disposed)return;setReady(state);
    if(state.mode!=='runtime')return;
    const list=await client.invoke('games.table.read',{});
    if(!disposed&&current(initial))setLobby(list);
   }catch(error){if(!disposed&&current(initial))showError(error);}})();
   return()=>{disposed=true;live.current=false;epoch.current++;ddzLifecycle.current.dispose();};
  },[]);

  function switchView(tableId=null){
   if(reviewRequest.current)void cancelReview({detach:true});
   epoch.current++;selectedTable.current=tableId;tableRef.current=null;observation.current=null;lastAuto.current='';
   ddzLifecycle.current.reset();
   commandRequest.current=null;chatRequest.current=null;chatObservation.current=null;reviewRequest.current=null;replayRead.current=null;
   setTable(null);setBusy(false);setChatBusy(false);setReviewBusy(false);setAutoAI(false);clearError();setPendingRetry(null);setModelStatus(null);setDismissedModel(null);setModelWaitLong(false);setLocalTurn(localTurns.current.get(tableId)?.turn??null);
   setReplay(null);setReview(null);setSelected([]);setMessages([]);setText('');setChatCharacter('');setChatReceipt(null);setChatRetry(null);setChatSpeech(null);setOverlayState(null);
   return scope();
  }
  function applyTable(value,captured,seq,localDeal=false){
   const candidate=value?.table??value;
   if(!candidate?.tableId||!current(captured)||candidate.tableId!==captured.tableId)return false;
   if(!acceptsTableObservation(observation.current,candidate.version,seq))return false;
   observation.current={version:candidate.version,sequence:seq};
   const local=localTurns.current.get(candidate.tableId);
   if(local){
    if(candidate.modelTurn?.requestId===local.turn.requestId)local.hostSeen=true;
    else if(candidate.version>local.turn.expectedVersion||local.hostSeen){
     local.reconciled=true;localTurns.current.delete(candidate.tableId);
     setLocalTurn(turn=>turn?.requestId===local.turn.requestId?null:turn);
    }
   }
   ddzLifecycle.current.observe(tableRef.current,candidate,{localDeal,reduced:localDeal&&globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true});
   tableRef.current=candidate;setTable(candidate);
   setLobby(old=>{
    const rows=old.tables??[],previous=rows.find(item=>item.tableId===candidate.tableId);
    const hand=Number.isSafeInteger(candidate.hand)?candidate.hand:previous?.hand;
    const characterIds=candidate.projection?.players?.flatMap(player=>player.characterId?[player.characterId]:[])??previous?.characterIds;
    return {...old,charactersAvailable:candidate.charactersAvailable??old.charactersAvailable,tables:[...rows.filter(item=>item.tableId!==candidate.tableId),...(candidate.status==='closed'?[]:[{tableId:candidate.tableId,type:candidate.type,status:candidate.status,version:candidate.version,hand,characterIds}])]};
   });
   return true;
  }
  async function refresh(id=null){
   const captured=scope(),seq=++sequence.current;
   let value;try{value=await client.invoke('games.table.read',id?{tableId:id}:{});}
   catch(error){if(current(captured))throw error;return null;}
   if(!current(captured))return null;
   if(id){if(!applyTable(value,captured,seq))return null;}
   else{setLobby(value);setRoster(old=>old.filter(id=>(value.charactersAvailable??[]).some(character=>character.id===id)));}
   return value;
  }
  function showLobby(){
   const captured=switchView();setScreen('lobby');
   void refresh(null).catch(error=>{if(current(captured))showError(error);});
  }
  async function openSaved(id){
   const captured=switchView(id);
   try{const value=await refresh(id);if(!value||!current(captured))return;setScreen('table');if(value.status==='paused')setOverlayState('pause');}
   catch(error){if(current(captured))showError(error);}
  }

  function adoptCommandResult(request,value,captured,seq,localDeal=false){
   if(request.method==='games.table.create'){
    const id=(value.table??value).tableId;if(!id)return;
    const next=switchView(id);applyTable(value,next,seq,localDeal);setScreen('table');return;
   }
   applyTable(value,captured,seq,localDeal);
   if(request.method==='games.table.leave'&&!request.payload.afterHand&&(request.payload.immediate||(value.table??value).status==='closed')){showLobby();return;}
   if(request.method==='games.table.resume'){setOverlayState(null);setModelStatus(null);}
  }
  async function runCommand(request){
   if(commandRequest.current)return null;
   const captured=scope(),seq=++sequence.current;commandRequest.current=request;setBusy(true);clearError();
   try{
    const value=await client.invoke(request.method,request.payload);
    if(!current(captured)||commandRequest.current!==request)return null;
    const candidate=value.table??value;
    if(request.method.startsWith('games.table.')&&(!candidate.tableId||!Number.isSafeInteger(candidate.version)||request.payload.tableId&&candidate.tableId!==request.payload.tableId))
     throw Object.assign(Error('The host did not return the expected table result'),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});
    const localDeal=request.method==='games.table.create'||request.method==='games.table.next'&&candidate.version===request.payload.expectedVersion+1;
    setPendingRetry(null);adoptCommandResult(request,value,captured,seq,localDeal);
    return value;
   }catch(error){
    if(current(captured)&&commandRequest.current===request){
     showError(error);setAutoAI(false);
     setPendingRetry(error.unknown===true&&commandCanRetry(request)?request:null);
    }
    return null;
   }finally{if(commandRequest.current===request){commandRequest.current=null;if(current(captured))setBusy(false);}}
  }
  function perform(method,payload,{mutate=true}={}){
   const command=structuredClone(payload);
   if(mutate&&!command.commandId&&!command.requestId&&!command.submissionId)command.commandId=uuid();
   return runCommand({method,payload:command});
  }
  function create(){
   return perform('games.table.create',{type,players:[{kind:'user'},...roster.slice(0,rosterCount).map(characterId=>({characterId}))],buyIn:Number(buyIn),blinds:blinds.split('/').map(Number)});
  }
  const retry=()=>pendingRetry&&runCommand(pendingRetry);
  async function checkPending(){
   if(!pendingRetry||commandRequest.current)return;
   const request=pendingRetry,captured=scope(),seq=++sequence.current;commandRequest.current=request;setBusy(true);
   try{
    const payload=commandReadPayload(request),value=await client.invoke('games.table.read',payload);
    if(!current(captured)||commandRequest.current!==request)return;
    const outcome=commandOutcome(request,value);
    if(outcome==='applied'){setPendingRetry(null);clearError();adoptCommandResult(request,value,captured,seq);}
    else if(outcome==='stale'){applyTable(value,captured,seq);setPendingRetry(null);showError({code:'GAME_STALE_VERSION',message:'The table has changed. Choose a new action.'});}
    else if(payload.tableId)applyTable(value,captured,seq);
    else setLobby(value);
   }catch(error){if(current(captured)&&commandRequest.current===request)showError(error);}
   finally{if(commandRequest.current===request){commandRequest.current=null;if(current(captured))setBusy(false);}}
  }

  const view=table?.projection??table?.hand?.projection??table?.hand,players=view?.players??[],userId=table?.userSeatId??'user';
  const ownHand=view?.ownHand??[],legal=view?.legalActions??[],isUser=table?.actorKind==='user'||view?.actorId===userId;
  const settled=view?.settlement?.completed===true,paused=view?.paused||table?.status==='paused',available=lobby.charactersAvailable??[],rosterCount=type==='doudizhu'?2:count-1;
  const modelTurn=screen==='table'&&table?waitStage(table.modelTurn??localTurn):null,modelBusy=!!modelTurn,modelRequest=modelTurn?.requestId??null;
  const observedModel=modelStatus??table?.modelStatus??null;
  const modelNoticeKey=observedModel&&[table?.tableId,table?.version,observedModel.requestId,observedModel.status,observedModel.code].join(':');
  const ddzDealing=ddzPresentation?.stage==='dealing',ddzDealCount=ddzDealing?ddzPresentation.count:null;
  const ddzEndStage=ddzDealing?null:ddzPresentation?.stage??null;
  const continueDdzSettlement=()=>ddzLifecycle.current.continueSettlement(ddzPresentation);
  const visuals=useCardPresentation(React,client,{ready,lobby,table,view,players,screen,overlay,modelRequest,chatSpeech,stageRef,viewEpoch:epoch.current,
   ddzFxToken:ddzEndStage==='holding'?ddzPresentation:null,onDdzFxDone:ddzLifecycle.current.finishFx});
  const boardBusy=visuals.boardBusy||!!ddzPresentation;
  function tableCommand(method,extra={}){
   const latest=tableRef.current;if(!latest||boardBusy||ddzLifecycle.current.busy||method!=='games.table.pause'&&(pendingRetry||latest.modelTurn||localTurns.current.has(latest.tableId)))return;
   if(method==='games.table.pause'){setAutoAI(false);const owned=localTurns.current.get(latest.tableId);if(owned)owned.stopping=true;}
   return perform(method,{tableId:latest.tableId,expectedVersion:latest.version,...extra});
  }
  function action(proposal){try{return tableCommand('games.table.action',{action:actionCommand(proposal)});}catch(error){showError(error);}}
  function readAfterModel(captured){
   const seq=++sequence.current;
   return refreshAfterModelStop(client,{tableId:captured.tableId,isCurrent:()=>current(captured),apply:value=>applyTable(value,captured,seq)});
  }
  async function startModel(){
   const latest=tableRef.current;
   if(!latest||screen!=='table'||boardBusy||ddzLifecycle.current.busy||pendingRetry||commandRequest.current||latest.status!=='active'||latest.actorKind!=='ai'||latest.modelTurn||localTurns.current.has(latest.tableId))return;
   const captured=scope(),seq=++sequence.current,requestId=uuid(),expectedVersion=latest.version;
   const entry={turn:{requestId,actorId:latest.projection?.actorId,stage:'queued',attempt:1,startedAt:Date.now(),expectedVersion},stopping:false};
   localTurns.current.set(latest.tableId,entry);setLocalTurn(entry.turn);clearError();setModelStatus(null);setDismissedModel(null);
   try{
    const value=await client.invoke('games.model.request',{tableId:latest.tableId,expectedVersion,requestId,strategyAssistance:strategy});
    if(!current(captured)||entry.stopping)return;
    if(applyTable(value,captured,seq)&&value.model)setModelStatus(value.model);
    if(value.model?.status==='needs-retry')setAutoAI(false);
   }catch(error){
    if(current(captured)&&!entry.stopping&&!entry.reconciled&&!cancellation(error)){showError(error);setAutoAI(false);}
   }finally{
    if(localTurns.current.get(latest.tableId)===entry)localTurns.current.delete(latest.tableId);
    if(live.current&&selectedTable.current===latest.tableId){
     setLocalTurn(value=>value?.requestId===requestId?null:value);
     await readAfterModel(scope());
    }
   }
  }
  async function cancelModel(){
   if(!modelRequest||!table)return;
   const captured=scope(),owned=localTurns.current.get(captured.tableId);
   if(owned?.turn.requestId===modelRequest)owned.stopping=true;
   setAutoAI(false);clearError();
   try{
    const value=await client.invoke('games.model.cancel',{tableId:captured.tableId,requestId:modelRequest});
    if(!current(captured))return;
    if(value.cancelRequested===false&&owned)owned.stopping=false;
    if(value.cancelRequested===true){if(owned)owned.hostSeen=true;setModelStatus(null);}
    await readAfterModel(captured);
   }catch(error){if(current(captured)){if(owned)owned.stopping=false;showError(error);await readAfterModel(captured);}}
  }
  useEffect(()=>{
   if(!modelBusy)return;
   const captured=scope();
   return startSingleFlightPoll(async()=>{if(current(captured))await refresh(captured.tableId);});
  },[modelBusy,modelRequest,table?.tableId,screen]);
  useEffect(()=>{
   setModelWaitLong(false);
   if(!modelRequest||!Number.isFinite(modelTurn?.startedAt))return;
   const delay=30000-(Date.now()-modelTurn.startedAt);
   if(delay<=0){setModelWaitLong(true);return;}
   const timer=setTimeout(()=>setModelWaitLong(true),delay);
   return ()=>clearTimeout(timer);
  },[modelRequest,modelTurn?.startedAt]);
  useEffect(()=>{
   const key=table?.tableId+':'+table?.version;
   if(screen!=='table'||!autoAI||busy||boardBusy||pendingRetry||paused||settled||modelBusy||table?.actorKind!=='ai'||lastAuto.current===key)return;
   lastAuto.current=key;void startModel();
  },[screen,autoAI,busy,boardBusy,pendingRetry,paused,settled,modelBusy,table?.tableId,table?.version,table?.actorKind,strategy]);
  useEffect(()=>{setSelected([]);setPattern('');const r=legal.find(a=>a.type==='raise');setRaiseTo(r?String(r.minRaiseTo):'');},[view?.version,table?.tableId]);
  useEffect(()=>{
   if(!table?.tableId||screen!=='table')return;
   const captured=scope(),seq=++sequence.current;let disposed=false;
   client.invoke('games.chat.read',{tableId:captured.tableId}).then(value=>{if(!disposed&&current(captured))applyMessages(value.messages??[],seq);}).catch(()=>{});
   return ()=>{disposed=true;};
  },[table?.tableId,table?.version,screen]);

  async function openReplay(handId){
   if(!table)return;
   const captured=scope(),entry={};replayRead.current=entry;clearError();
   if(reviewRequest.current)void cancelReview({detach:true});
   try{const value=await client.invoke('games.replay.read',{tableId:captured.tableId,handId});if(current(captured)&&replayRead.current===entry){setReplay(value.replay??value);setReview(null);setReviewCharacter('');setOverlayState('replay');}}
   catch(error){if(current(captured)&&replayRead.current===entry)showError(error);}
  }
  async function startReview(characterId,handId){
   if(reviewRequest.current||!table)return;
   const captured=scope(),requestId=uuid(),entry={requestId,captured,cancelled:false};reviewRequest.current=entry;
   setReviewBusy(true);setReview(null);clearError();
   try{
    const value=await client.invoke('games.replay.review',{tableId:captured.tableId,handId,characterId,requestId});
    if(current(captured)&&reviewRequest.current===entry&&!entry.cancelled)setReview(value.review??value);
   }catch(error){if(current(captured)&&reviewRequest.current===entry&&!entry.cancelled&&!cancellation(error))showError(error);}
   finally{if(reviewRequest.current===entry){reviewRequest.current=null;if(current(captured))setReviewBusy(false);}}
  }
  async function cancelReview({detach=false}={}){
   const entry=reviewRequest.current;if(!entry||entry.cancelled)return;
   entry.cancelled=true;
   if(detach){reviewRequest.current=null;setReviewBusy(false);}
   try{
    const value=await client.invoke('games.model.cancel',{tableId:entry.captured.tableId,requestId:entry.requestId});
    if(value.cancelRequested===false&&!detach&&reviewRequest.current===entry)entry.cancelled=false;
   }catch(error){if(!detach&&reviewRequest.current===entry&&current(entry.captured)){entry.cancelled=false;showError(error);}}
  }
  function setOverlay(value){if(value!=='replay'){replayRead.current=null;if(reviewRequest.current)void cancelReview({detach:true});}setOverlayState(value);}

  function applyMessages(items,seq){
   if(!acceptsTableObservation(chatObservation.current,items.length,seq))return;
   chatObservation.current={version:items.length,sequence:seq};setMessages(items);
  }
  useEffect(()=>{
   if(!chatBusy)return;
   const entry=chatRequest.current;if(!entry)return;
   const {payload}=entry.request;
   return startSingleFlightPoll(async()=>{
    if(!current(entry.captured)||chatRequest.current!==entry)return;
    const seq=++sequence.current,result=await client.invoke('games.chat.read',{tableId:payload.tableId});
    if(!current(entry.captured)||chatRequest.current!==entry||entry.replied)return;
    applyMessages(result.messages??[],seq);
    if((result.messages??[]).some(item=>item.role==='user'&&item.id===payload.submissionId)){
     setText(old=>old===payload.text?'':old);
     setChatReceipt(old=>normalizeChatReceipt({...result,assistant:result.assistant??{status:'waiting'}},{submissionId:payload.submissionId,previous:old}));
    }
   },{delay:1000});
  },[chatBusy,table?.tableId,screen]);
  async function sendChatRequest(request){
   if(chatRequest.current)return;
   const {text:submitted,tableId,submissionId}=request.payload,captured=scope(),seq=++sequence.current;
   const entry={request,captured,cancelled:false};chatRequest.current=entry;setChatBusy(true);
   setChatReceipt(old=>normalizeChatReceipt({assistant:{status:'waiting'}},{submissionId,previous:old?.submissionId===submissionId?old:null}));
   const owns=()=>current(captured)&&chatRequest.current===entry;
   try{
    const result=await client.invoke(request.method,request.payload);if(!owns())return;entry.replied=true;
    const normalized=normalizeChatReceipt(result,{submissionId});setChatReceipt(normalized);
    const speaker=players.find(player=>player.characterId===result.assistant?.characterId);
    if(speaker&&result.assistant?.text)setChatSpeech({id:result.assistant.requestId??submissionId,actorId:speaker.id,text:result.assistant.text});
    if(normalized.inputAccepted===true)setText(old=>old===submitted?'':old);
    const records=result.messages??(await client.invoke('games.chat.read',{tableId})).messages??[];
    if(!owns())return;
    applyMessages(records,seq);setChatRetry(['failed','unavailable','unknown','cancelled'].includes(normalized.assistantStatus)?request:null);
   }catch(error){
    if(owns()){
     setChatReceipt(old=>normalizeChatReceipt({assistant:{status:entry.cancelled||cancellation(error)?'cancelled':'unknown',code:entry.cancelled?null:messageCode(error),retryAllowed:entry.cancelled}},{submissionId,previous:old}));
     setChatRetry(request);
    }
   }finally{if(chatRequest.current===entry){chatRequest.current=null;if(current(captured))setChatBusy(false);}}
  }
  function submitChat(){
   if(!text.trim()||chatRequest.current||!table)return;
   return sendChatRequest({method:'games.chat.send',payload:{tableId:table.tableId,submissionId:uuid(),text,...chatCharacter&&{characterId:chatCharacter}}});
  }
  const retryChat=()=>chatRetry&&sendChatRequest({method:chatRetry.method,payload:retryChatPayload(chatRetry.payload,chatReceipt,uuid())});
  async function cancelChat(){
   const entry=chatRequest.current;if(!entry||entry.cancelled)return;
   const {payload}=entry.request;
   try{
    const result=await client.invoke('games.model.cancel',{tableId:payload.tableId,requestId:payload.replyRequestId??payload.submissionId+':reply'});
    if(current(entry.captured)&&chatRequest.current===entry&&result.cancelRequested)entry.cancelled=true;
   }catch(error){if(current(entry.captured)&&chatRequest.current===entry)showError(error);}
  }
  async function refreshChat(){
   if(!table)return;
   const captured=scope(),seq=++sequence.current;
   try{
    const value=await client.invoke('games.chat.read',{tableId:captured.tableId});if(!current(captured))return;
    applyMessages(value.messages??[],seq);setChatReceipt(old=>old&&normalizeChatReceipt(value,{submissionId:old.submissionId,previous:old}));
   }catch(error){if(current(captured))showError(error);}
  }

  const openSetup=value=>{setType(value);setCount(value==='doudizhu'?3:5);setRoster([]);clearError();setOverlay('setup');};
  const changeCount=value=>{setCount(value);setRoster(old=>old.slice(0,value-1));};
  const openSeats=()=>{setType('texas');const seats=table?.pendingSeats??players;setCount(seats.length);setRoster(seats.filter(player=>player.kind!=='user').map(player=>player.characterId));setOverlay('seats');};
  const selectedPatterns=selected.length?ddzPatterns(selected).filter(move=>ddzCanBeat(move,view?.lastPlay)):[],chosenPattern=selectedPatterns.find(item=>item.moveId===pattern)??selectedPatterns[0];
  const toggleCard=code=>setSelected(old=>old.includes(code)?old.filter(value=>value!==code):[...old,code]);
  const previousFocus=useRef(null);
  useEffect(()=>{
   if(!overlay){previousFocus.current?.focus?.();previousFocus.current=null;return;}
   const modal=stageRef.current?.querySelector('[data-overlay="'+overlay+'"]:not([hidden])');
   if(!modal)return;
   previousFocus.current??=globalThis.document?.activeElement;modal.focus();
   const onKey=event=>{
    if(event.key==='Escape'){event.preventDefault();setOverlay(null);return;}
    if(event.key!=='Tab')return;
    const elements=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),summary')];
    if(!elements.length){event.preventDefault();return;}
    if(event.shiftKey&&(document.activeElement===modal||document.activeElement===elements[0])){event.preventDefault();elements.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===elements.at(-1)){event.preventDefault();elements[0].focus();}
   };
   modal.addEventListener('keydown',onKey);return ()=>modal.removeEventListener('keydown',onKey);
  },[overlay]);
  async function refreshReadiness(){
   const captured=scope();
   try{const state=await client.readiness();if(!current(captured))return;setReady(state);clearError();if(state.mode==='runtime')await refresh(null);}
   catch(error){if(current(captured))showError(error);}
  }
  return render(React,{...visuals,boardBusy,ddzDealing,ddzDealCount,ddzDealReduced:ddzDealing&&ddzPresentation.reduced,ddzEndStage,continueDdzSettlement,stageRef,screen,overlay,setOverlay,openSetup,openSaved,openSeats,showLobby,returnLobby:showLobby,topup,setTopup,toggleCard,refreshReadiness,clearModelStatus:()=>setDismissedModel(modelNoticeKey),ready,lobby,table,type,count,roster,buyIn,blinds,busy,chatBusy,chatCharacter,chatReceipt,chatRetry,error,errorCode,selected,pattern,raiseTo,messages,text,replay,review,reviewCharacter,reviewBusy,strategy,autoAI,pendingRetry,modelStatus:modelNoticeKey===dismissedModel?null:observedModel,modelTurn,modelBusy,modelWaitLong,view,players,userId,ownHand,legal,isUser,settled,paused,available,rosterCount,chosenPattern,selectedPatterns,stylesheet,modelRequest,refresh,perform,tableCommand,startModel,changeCount,create,action,retry,checkPending,cancelModel,openReplay,startReview,cancelReview,submitChat,retryChat,refreshChat,cancelChat,setType,setRoster,setBuyIn,setBlinds,setRaiseTo,setText,setReplay,setReview,setReviewCharacter,setChatCharacter,setStrategy,setAutoAI,setPattern,setError:visibleError,epoch,lastAuto,uuid});
 };
}
