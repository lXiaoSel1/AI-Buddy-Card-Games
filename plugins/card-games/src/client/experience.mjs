import {artKey,EMOTIONS,FX,safeTheme,THEMES} from './visual.mjs';
import {useBoardReveal} from './board-reveal.mjs';

const EFFECT_MS=1010;
const emptyArt=Object.freeze({});
const appearance=()=>({theme:safeTheme(globalThis.document?.documentElement?.dataset.buddyTheme),lang:globalThis.document?.documentElement?.dataset.buddyLang==='en'?'en':'zh'});
export function useCardPresentation(React,client,{ready,lobby,table,view,players,screen,overlay,modelRequest,chatSpeech,stageRef,viewEpoch,ddzFxToken,onDdzFxDone}){
 const {useEffect,useState,useRef}=React;
 const [{theme,lang},setAppearance]=useState(appearance),[size,setSize]=useState(null),[art,setArt]=useState(emptyArt),[effect,setEffect]=useState(null),[speech,setSpeech]=useState(null),[showdownPending,setShowdownPending]=useState(null);
 const running=useRef(new Set()),cache=useRef(new Map()),mounted=useRef(false),visualScope=useRef(null);
 const seen=useRef(new Set()),seenSpeech=useRef(null),queue=useRef([]),playing=useRef(null),timer=useRef(null),speechTimer=useRef(null),playingUntil=useRef(0),cardsBusy=useRef(false),beforeEmotions=useRef(null),ddzTerminal=useRef(null);
 const active=(screen==='table'?table?.currentCharacterId:lobby.currentCharacterId)??theme,tableId=table?.tableId;
 useEffect(()=>{
  mounted.current=true;
  const change=()=>setAppearance(old=>{const value=appearance();return old.theme===value.theme&&old.lang===value.lang?old:value;});
  globalThis.window?.addEventListener('ai-buddy:appearance',change);change();
  return ()=>{mounted.current=false;globalThis.window?.removeEventListener('ai-buddy:appearance',change);clearTimeout(timer.current);clearTimeout(speechTimer.current);};
 },[]);
 useEffect(()=>{
  const element=stageRef.current;
  if(!element||typeof globalThis.ResizeObserver!=='function')return;
  const update=()=>{const {width,height}=element.getBoundingClientRect();setSize(old=>old?.width===width&&old?.height===height?old:{width,height});};
  const observer=new ResizeObserver(update);observer.observe(element);update();
  return ()=>observer.disconnect();
 },[stageRef]);
 const visible=screen==='table'&&!!tableId,scope=visible?JSON.stringify([viewEpoch,tableId,view?.handId,view?.dealAttempt]):null;
 const boardKey=visible&&view?.type==='texas'&&view.handId?scope:null;
 const events=table?.presentation?.events??[],lastSpeech=table?.presentation?.lastSpeech;
 const pendingAllIn=scope===visualScope.current&&events.some(event=>event.kind==='allin'&&!seen.current.has(event.id));
 const allInDelay=pendingAllIn?EFFECT_MS:playing.current?.event.kind==='allin'?Math.max(0,playingUntil.current-Date.now()):0;
 const reveal=useBoardReveal(React,boardKey,view?.board?.length??0,{
  allInDelay,reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,settled:view?.settlement?.completed===true
 });
 cardsBusy.current=reveal.busy;
 const boardBusy=reveal.busy||!!boardKey&&showdownPending===boardKey;
 useEffect(()=>{
  if(visible&&!view?.settlement?.completed)beforeEmotions.current={scope,emotions:table.presentation?.emotions??emptyArt};
 },[scope,visible,table?.presentation,view?.settlement?.completed]);
 useEffect(()=>{
  if(visualScope.current!==scope||!visible){
   visualScope.current=scope;queue.current=[];playing.current=null;clearTimeout(timer.current);clearTimeout(speechTimer.current);setEffect(null);setSpeech(null);setShowdownPending(null);
   ddzTerminal.current=null;
   seen.current=new Set(ddzFxToken?[]:events.map(event=>event.id));seenSpeech.current=lastSpeech?.id;
   if(!visible||!ddzFxToken)return;
  }
  const play=()=>{
   if(playing.current)return;
   const next=queue.current[0];
   if(!next){
    setShowdownPending(null);
    if(ddzTerminal.current)onDdzFxDone(ddzTerminal.current);
    return;
   }
   if(next.showdown&&cardsBusy.current)return;
   queue.current.shift();
   playing.current=next;playingUntil.current=Date.now()+EFFECT_MS;setEffect(next.event);
   timer.current=setTimeout(()=>{playing.current=null;setEffect(null);play();},EFFECT_MS);
  };
  for(const event of events){
   if(!event.id||seen.current.has(event.id)||!Object.hasOwn(FX,event.kind))continue;
   const showdown=!!boardKey&&reveal.busy&&view?.settlement?.completed===true&&event.kind!=='allin';
   seen.current.add(event.id);queue.current.push({event,showdown});
   if(showdown)setShowdownPending(boardKey);
  }
  if(seen.current.size>256)seen.current=new Set([...seen.current].slice(-128));
  // A previous action's timer can finish before this snapshot is reconciled.
  // Publish the terminal token only after its effects have joined the queue.
  ddzTerminal.current=ddzFxToken;
  play();
  if(lastSpeech?.id&&lastSpeech.id!==seenSpeech.current){
   seenSpeech.current=lastSpeech.id;
   clearTimeout(speechTimer.current);setSpeech(lastSpeech);
   speechTimer.current=setTimeout(()=>setSpeech(null),4400);
  }
 },[scope,visible,table?.presentation,reveal.busy,ddzFxToken,onDdzFxDone]);
 const visibleEmotions=(boardBusy||ddzFxToken)&&view?.settlement?.completed
  ?beforeEmotions.current?.scope===scope?beforeEmotions.current.emotions:emptyArt
  :table?.presentation?.emotions;
 useEffect(()=>{
  if(!visible||!chatSpeech?.id)return;
  clearTimeout(speechTimer.current);setSpeech(chatSpeech);
  speechTimer.current=setTimeout(()=>setSpeech(null),4400);
 },[chatSpeech,visible]);
 const requests=[];
 const add=(kind,id,emotion)=>{
  if(typeof id!=='string'||id.length>256)return;
  requests.push({kind,id,...emotion&&{emotion}});
 };
 const bust=(id,emotion='cheerful')=>{
  if(Object.hasOwn(THEMES,id))add('b',id,EMOTIONS.includes(emotion)?emotion:'cheerful');
  else add('p',id);
 };
 add('bg',theme);
 if(screen==='lobby'){
  add('p',active);bust(active);add('bg','grok');add('bg','claude');
  for(const id of ['grok','gemini','claude','chatgpt'])bust(id);
 }
 if(visible){
  for(const player of players){
   const id=player.characterId??active;add('orn',Object.hasOwn(THEMES,id)?id:'whale');
   if(player.kind==='user')continue;
   bust(id,modelRequest&&view?.actorId===player.id?'serious':visibleEmotions?.[player.id]);
   if(view?.settlement&&!boardBusy)bust(id,(view.settlement.deltasByPlayer?.[player.id]??0)>0?'starry':'exasperated');
  }
  add('pet',safeTheme(active));
 }
 if(['setup','seats'].includes(overlay))for(const c of lobby.charactersAvailable??[])bust(c.id);
 const keys=requests.map(row=>artKey(row.kind,row.id,row.emotion)).join('\u0000');
 useEffect(()=>{
  if(ready?.mode!=='runtime')return;
  const unknown=requests.filter(row=>{
   const key=artKey(row.kind,row.id,row.emotion);
   if(cache.current.has(key)||running.current.has(key))return false;
   running.current.add(key);return true;
  });
  (async()=>{
   for(let index=0;index<unknown.length;index+=4){
    const group=unknown.slice(index,index+4);
    const loaded=await Promise.all(group.map(async row=>{
     const key=artKey(row.kind,row.id,row.emotion);
     try{
      const result=await client.invoke('games.table.art',row);
      const value=typeof result?.url==='string'&&result.url.length<=26_000_000&&/^data:image\/(?:webp|png|jpeg|avif);base64,[a-z0-9+/=]+$/i.test(result.url)?result.url:null;
      cache.current.set(key,value);return [key,value];
     }catch{return [key,null];}
     finally{running.current.delete(key);}
    }));
    if(!mounted.current)break;
    const present=Object.fromEntries(loaded.filter(([,url])=>url));
    if(Object.keys(present).length)setArt(old=>({...old,...present}));
   }
  })();
 },[client,ready?.mode,keys]);
 return {theme,lang,art,size,effect,speech,boardBusy,boardCount:reveal.count,boardPhaseCount:reveal.phaseCount,boardAnimations:reveal.animations,visibleEmotions};
}

