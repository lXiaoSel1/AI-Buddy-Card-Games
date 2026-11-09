// Read-only presentation projection. No speech text, card state, voice command,
// model request, or playback acknowledgement is sent from this gate.
export function createCardSpeechDisplayGate({now=Date.now}={}){
 let key=null,tableId=null,handId=null;const waiting=new Map(),released=new Set();
 const release=eventId=>{const changed=waiting.delete(eventId);released.add(eventId);return changed;};
 return {
  scope(value){if(value.key!==key){key=value.key;tableId=value.tableId;handId=value.handId;waiting.clear();released.clear();}},
  current:value=>value===key,
  observe(value){
   if(value?.version!==1||value.tableId!==tableId||value.handId!==handId||!Array.isArray(value.records))return false;
   let changed=false;
   for(const row of value.records.slice(0,256)){
    if(typeof row?.eventId!=='string'||!row.eventId||released.has(row.eventId))continue;
    if(row.state!=='waiting'||!Number.isFinite(row.deadlineAt)||row.deadlineAt<=now()){changed=release(row.eventId)||changed;continue;}
    const old=waiting.get(row.eventId),deadline=old?Math.min(old,row.deadlineAt):row.deadlineAt;
    if(old!==deadline){waiting.set(row.eventId,deadline);changed=true;}
   }
   return changed;
  },
  allows(eventId){if(!eventId)return true;const deadline=waiting.get(eventId);if(deadline!==undefined&&deadline>now())return false;release(eventId);return true;},
  pending:ids=>[...new Set(ids)].filter(eventId=>waiting.has(eventId)&&!released.has(eventId)),
  deadline:ids=>Math.min(...ids.filter(eventId=>waiting.has(eventId)).map(eventId=>waiting.get(eventId))),
  fallback(ids){let changed=false;for(const eventId of ids)if(waiting.has(eventId))changed=release(eventId)||changed;return changed;},
  expire(ids){let changed=false;for(const eventId of ids)if(waiting.has(eventId)&&waiting.get(eventId)<=now())changed=release(eventId)||changed;return changed;}
 };
}

export function useCardSpeechDisplay(React,client,{table,chatSpeech,messages,chatVoice,screen,viewEpoch}){
 const {useRef,useState,useEffect}=React,[,update]=useState(0),gateRef=useRef(null),inflight=useRef(false);
 gateRef.current??=createCardSpeechDisplayGate();const gate=gateRef.current;
 const tableId=table?.tableId,handId=table?.projection?.handId??table?.hand?.projection?.handId??table?.hand?.handId;
 const key=screen==='table'&&tableId&&handId?JSON.stringify([viewEpoch,tableId,handId]):null;
 gate.scope({key,tableId,handId});
 if(key){gate.observe(table?.presentation?.voice);gate.observe(chatVoice);}
 const last=table?.presentation?.lastSpeech;
 const shownTable=last?.id&&!gate.allows(last.id)?{...table,presentation:{...table.presentation,lastSpeech:null}}:table;
 const shownChat=chatSpeech?.id&&!gate.allows(chatSpeech.id)?null:chatSpeech;
 const shownMessages=messages.filter(message=>message.role!=='assistant'||gate.allows(message.id));
 const pending=gate.pending([last?.id,chatSpeech?.id,...messages.filter(message=>message.role==='assistant').map(message=>message.id)].filter(Boolean));
 const token=pending.join('\0');
 useEffect(()=>{
  if(!key||!pending.length)return;
  let disposed=false,timer,deadlineTimer;
  const current=()=>!disposed&&gate.current(key);
  const changed=value=>{if(value&&current())update(value=>value+1);};
  // A host read may never settle. The text deadline therefore owns a separate
  // one-shot timer and never depends on completing (or repeating) that RPC.
  deadlineTimer=setTimeout(()=>{if(current())changed(gate.expire(pending));},Math.max(0,gate.deadline(pending)-Date.now()));
  const poll=async()=>{
   if(!current())return;
   changed(gate.expire(pending));
   const ids=gate.pending(pending);if(!ids.length)return;
   if(inflight.current){timer=setTimeout(poll,50);return;}
   inflight.current=true;
   try{
    const value=await client.invoke('games.table.read',{tableId,handId,voiceOnly:true});
    if(!current())return;
    const voice=value?.presentation?.voice;
    if(value.tableId!==tableId||value.handId!==handId)return;
    if(voice?.version!==1||voice.tableId!==tableId||voice.handId!==handId)changed(gate.fallback(ids));
    else changed(gate.observe(voice));
   }catch{if(current())changed(gate.fallback(ids));}
   finally{inflight.current=false;if(current()&&gate.pending(pending).length)timer=setTimeout(poll,50);}
  };
  timer=setTimeout(poll,50);
  return()=>{disposed=true;clearTimeout(timer);clearTimeout(deadlineTimer);};
 },[key,token,client]);
 return {table:shownTable,chatSpeech:shownChat,messages:shownMessages};
}
