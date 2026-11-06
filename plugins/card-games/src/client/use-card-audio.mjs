import {audioSettings,DEFAULT_AUDIO} from '../audio-mix.mjs';
import {audioProjection,audioScene,fxSound,isLiveAudioUpdate,tableSounds} from './sound.mjs';

const PANEL='@ai-buddy/card-games';
export function useCardAudio(React,client,sound,ready){
 const {useEffect,useRef,useState}=React;
 const [settings,setSettings]=useState(DEFAULT_AUDIO),[loaded,setLoaded]=useState(false);
 const mix=useRef(DEFAULT_AUDIO),generation=useRef(0),queued=useRef(null),saving=useRef(false);
 const screenWas=useRef(null),lastHand=useRef(null),tension=useRef(null),liveEffects=useRef(new Set()),board=useRef(null);
 const presentationCues=useRef([]);
 useEffect(()=>{
  if(ready?.mode!=='runtime')return;
  let cancelled=false;
  const version=generation.current;
  void client.invoke('audio.settings').then(value=>{
   if(cancelled||generation.current!==version)return;
   mix.current=audioSettings(value.settings);sound.mix(mix.current);setSettings(mix.current);
  }).catch(()=>{}).finally(()=>{if(!cancelled)setLoaded(true);});
  return ()=>{cancelled=true;};
 },[ready?.mode]);
 useEffect(()=>{
  if(!loaded)return;
  const doc=globalThis.document,win=globalThis.window;
  let selected=!doc?.documentElement.dataset.buddyOpenPlugin||doc.documentElement.dataset.buddyOpenPlugin===PANEL;
  const sync=()=>sound.setVisible(selected&&doc?.visibilityState!=='hidden');
  const panel=event=>{selected=event.detail?.pluginId===PANEL;sync();};
  const hide=()=>sound.setVisible(false);
  const unlock=event=>{if(event.isTrusted&&selected)sound.unlock();};
  doc?.addEventListener('visibilitychange',sync);
  doc?.addEventListener('click',unlock,true);
  win?.addEventListener('pagehide',hide);
  win?.addEventListener('pageshow',sync);
  win?.addEventListener('ai-buddy:open-plugin-page',panel);
  sync();
  return ()=>{
   doc?.removeEventListener('visibilitychange',sync);
   doc?.removeEventListener('click',unlock,true);
   win?.removeEventListener('pagehide',hide);
   win?.removeEventListener('pageshow',sync);
   win?.removeEventListener('ai-buddy:open-plugin-page',panel);
   hide();
  };
 },[loaded]);
 function updateScene(screen,table,boardBusy,presentationBusy){
  if(!loaded)return;
  const value=audioProjection(table),key=table&&JSON.stringify([table.tableId,value?.handId,value?.dealAttempt]);
  const scene=audioScene(screen,table,!!key&&tension.current===key,boardBusy);
  const resumingTable=screenWas.current==='lobby'&&!!key&&key===lastHand.current;
  if(key&&screen==='table'){lastHand.current=key;tension.current=scene==='tension'?key:null;}
  sound.scene(scene,{leavingTable:screenWas.current==='table'&&screen==='lobby',resumingTable});
  screenWas.current=screen;
  if(!presentationBusy){sound.cues(presentationCues.current);presentationCues.current=[];}
 }

 function setAudioSettings(value){
  generation.current++;
  mix.current=audioSettings(value,mix.current);
  sound.mix(mix.current);setSettings(mix.current);queued.current=mix.current;
  if(saving.current)return;
  saving.current=true;
  void (async()=>{
   try{while(queued.current){const latest=queued.current;queued.current=null;await client.invoke('audio.settings',{settings:latest}).catch(()=>{});}}
   finally{saving.current=false;}
  })();
 }
 return {
  loaded,settings,setAudioSettings,updateScene,
  onAudioClick(event){
   if(!loaded||!event.isTrusted)return;
   sound.unlock();
   const button=event.target?.closest?.('button');
   if(!button||button.disabled||button.closest('[data-audio-settings],[data-overlay="replay"],[data-game-control="replay"]'))return;
   if(button.closest('.cg-controls,[data-user-card],[data-game-control]'))sound.effect('tap');
  },
  reset(){liveEffects.current.clear();board.current=null;presentationCues.current=[];sound.clearCues();},
  observe(previous,candidate,localDeal){
   const instant=[];
   for(const cue of tableSounds(previous,candidate,{localDeal})){
    if(['turn','win','lose'].includes(cue))presentationCues.current.push(cue);
    else instant.push(cue);
   }
   sound.cues(instant);
   const before=audioProjection(previous),after=audioProjection(candidate);
   if(!isLiveAudioUpdate(previous,candidate)||before?.handId!==after?.handId)return;
   for(const event of candidate.presentation?.events??[])if(event.id)liveEffects.current.add(event.id);
   if(liveEffects.current.size>128)liveEffects.current=new Set([...liveEffects.current].slice(-64));
   if(after.board?.length>before?.board?.length)board.current={count:after.board.length,handId:after.handId};
  },
  onEffect(event){if(liveEffects.current.delete(event.id))sound.effect(fxSound(event.kind));},
  onBoardReveal(handId,count,added){
   if(board.current?.handId===handId&&count<=board.current.count){
    sound.cues(Array(Math.min(3,added)).fill('flip'));
    if(count===board.current.count)board.current=null;
   }
  },
 };
}
