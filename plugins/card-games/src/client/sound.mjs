import {audioSettings,DEFAULT_AUDIO} from '../audio-mix.mjs';
import {packagedAsset} from './visual.mjs';

const BGM=Object.freeze({lobby:0,ddz:0,texas:0,tension:56.82});
const FX_AUDIO=Object.freeze({landlord:'landlord',plane:'plane',bomb:'bomb',rocket:'rocket',spring:'spring',antispring:'spring',allin:'allin'});
const DUCK=Object.freeze({deal:-5,flip:-5,tap:-5,turn:-5,chip:-5,landlord:-10,plane:-10,bomb:-10,rocket:-10,spring:-10,allin:-10,win:-10,lose:-10});
const source=id=>packagedAsset('audio/'+id+'.ogg');
export const audioProjection=table=>table?.projection??table?.hand?.projection??table?.hand;
export const isLiveAudioUpdate=(before,after)=>before?.tableId===after.tableId&&before.status==='active'&&after.version===before.version+1;

export const fxSound=kind=>Object.hasOwn(FX_AUDIO,kind)?FX_AUDIO[kind]:null;

export function audioScene(screen,table,tensionAlready=false,boardBusy=false){
 if(screen!=='table'||!table)return 'lobby';
 const value=audioProjection(table),ddz=value?.type==='doudizhu';
 const tense=value?.players?.some(p=>ddz?p.handCount>0&&p.handCount<=2:p.allIn===true);
 const runout=!ddz&&boardBusy&&(tense||tensionAlready||table.presentation?.events?.some(event=>event.kind==='allin'));
 return (runout||!value?.settlement?.completed&&(tense||tensionAlready))?'tension':ddz?'ddz':'texas';
}

export function tableSounds(previous,table,{localDeal=false}={}){
 const before=audioProjection(previous),after=audioProjection(table);
 if(!after)return [];
 const live=isLiveAudioUpdate(previous,table);
 const newDeal=!before||before.handId!==after.handId||before.dealAttempt!==after.dealAttempt;
 const user=table.userSeatId??'user';
 if(newDeal&&(localDeal||live&&before.handId===after.handId)){
  const cues=['deal'];
  if(after.type==='texas'&&after.history?.some(action=>action.actorId===user&&action.type==='blind'&&action.amount>0))cues.push('chip');
  if(after.actorId===user)cues.push('turn');
  return cues;
 }
 if(!live||newDeal)return [];
 const cues=[];
 if(after.type==='doudizhu'&&!before.bottom?.length&&after.bottom?.length)cues.push(...after.bottom.slice(0,3).map(()=> 'flip'));
 const paid=after.history?.slice(before.history?.length??0).some(action=>action.actorId===user&&['raise','call','all-in'].includes(action.type)&&action.amount>0);
 const result=after.settlement?.completed&&!before.settlement?.completed?after.settlement:null;
 const wonPot=after.type==='texas'&&result?.winnerIds?.includes(user);
 const delta=result?.deltasByPlayer?.[user];
 const tie=after.type==='texas'&&wonPot&&(result.pots?.length
  ?result.pots.filter(pot=>pot.winnerIds.includes(user)).every(pot=>pot.winnerIds.length>1)
  :result.winnerIds.length>1);
 if(paid||wonPot)cues.push('chip');
 if(after.actorId===user&&(before.actorId!==user||before.phase!==after.phase))cues.push('turn');
 if(!tie&&delta>0)cues.push('win');
 if(!tie&&delta<0)cues.push('lose');
 return cues;
}

export function createCardSound({makeAudio=src=>new Audio(src),now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const tracks=new Map(),effects=new Set(),delayed=new Set();
 let settings=DEFAULT_AUDIO,selected=null,visible=true,disposed=false,blocked=false,timer=null;
 let duck=0,duckTween=null,deepest=0,lastChip=-Infinity,lastFlip=-Infinity;
 const volume=(audio,value)=>{audio.volume=Math.max(0,Math.min(1,value));};
 const pause=audio=>{try{audio.pause();}catch{}};
 const tween=(from,to,ms)=>({from,to,start:now(),end:now()+ms});
 function mix(){
  const attenuation=settings.muted?0:settings.music*10**(duck/20);
  for(const slot of tracks.values())volume(slot.audio,attenuation*slot.gain);
  for(const slot of effects)volume(slot.audio,settings.muted?0:settings.sfx);
 }
 function tick(){
  const at=now(),ends=[];
  for(const slot of tracks.values()){
   if(!slot.fade)continue;
   const {from,to,start,end}=slot.fade;
   slot.gain=from+(to-from)*Math.min(1,(at-start)/(end-start));
   if(at>=end){slot.fade=null;if(to===0)pause(slot.audio);}else ends.push(end);
  }
  if(duckTween){
   const {from,to,start,end}=duckTween,curve=to<from?1:3,progress=Math.min(1,(at-start)/(end-start));
   duck=from+(to-from)*(1-Math.exp(-curve*progress))/(1-Math.exp(-curve));
   if(at>=end)duckTween=null;else ends.push(end);
  }
  mix();
  if(ends.length&&timer===null)timer=setTimer(()=>{timer=null;tick();},Math.min(16,Math.min(...ends)-at));
 }
 function update(){if(timer!==null){clearTimer(timer);timer=null;}tick();}
 function fade(slot,to,ms){if(slot.gain===to){slot.fade=null;if(to===0)pause(slot.audio);}else slot.fade=tween(slot.gain,to,ms);}
 function rampDuck(to,ms){duckTween=duck===to?null:tween(duck,to,ms);update();}
 function track(id){
  if(tracks.has(id))return tracks.get(id);
  try{
   const audio=makeAudio(source(id));
   audio.loop=true;audio.preload='metadata';volume(audio,0);
   const slot={audio,gain:0,fade:null,pending:null,visited:false,entry:false,failed:false};
   audio.addEventListener('error',()=>{slot.failed=true;}, {once:true});
   tracks.set(id,slot);return slot;
  }catch{return null;}
 }
 function start(id,slot){
  if(!slot||slot.failed||slot.pending||blocked||!visible||disposed)return;
  if(slot.entry){try{slot.audio.currentTime=BGM[id];}catch{return;}slot.entry=false;}
  if(!slot.audio.paused)return;
  try{
   slot.pending=Promise.resolve(slot.audio.play()).then(()=>{
    if(disposed||!slot.gain&&!slot.fade&&(!visible||selected!==id))pause(slot.audio);
   },error=>{if(error?.name==='NotAllowedError')blocked=true;else if(error?.name!=='AbortError')slot.failed=true;}).finally(()=>{slot.pending=null;});
  }catch{slot.failed=true;}
 }
 function clearCues(){
  for(const id of delayed)clearTimer(id);
  delayed.clear();lastFlip=-Infinity;
 }
 function clearEffects(){
  clearCues();
  for(const slot of [...effects]){slot.done();pause(slot.audio);}
 }
 function effect(id){
  if(disposed||!visible||settings.muted||!settings.sfx||!Object.hasOwn(DUCK,id))return;
  if(id==='chip'&&now()-lastChip<400)return;
  try{
   const audio=makeAudio(source(id));audio.preload='auto';volume(audio,settings.sfx);
   const slot={audio,started:false,done(){
    if(!effects.delete(slot))return;
    if(![...effects].some(effect=>effect.started)){deepest=0;rampDuck(0,500);}
   }};
   effects.add(slot);
   for(const event of ['ended','error','pause','abort'])audio.addEventListener(event,slot.done,{once:true});
   audio.addEventListener('playing',()=>{
    if(!effects.has(slot))return;
    slot.started=true;
    if(DUCK[id]<deepest){deepest=DUCK[id];rampDuck(deepest,40);}
   },{once:true});
   if(id==='chip')lastChip=now();
   try{Promise.resolve(audio.play()).catch(slot.done);}catch{slot.done();}
  }catch{}
 }
 return {
  scene(id,{leavingTable=false,resumingTable=false}={}){
   if(disposed||selected===id||!Object.hasOwn(BGM,id))return;
   const before=selected,slot=track(id);
   selected=id;
   if(id==='tension'&&slot&&!resumingTable)slot.entry=true;
   if(!visible)return;
   const ms=id==='tension'?250:before==='tension'?1500:1200;
   for(const [name,current] of tracks)if(name!==id)fade(current,0,leavingTable?400:ms);
   if(slot){fade(slot,1,resumingTable||leavingTable&&slot.visited?800:ms);slot.visited=true;start(id,slot);}
   update();
  },
  setVisible(value){
   if(disposed||visible===value)return;
   visible=value;
   if(!value){clearEffects();for(const slot of tracks.values())fade(slot,0,400);}
   else if(selected&&tracks.has(selected)){const slot=tracks.get(selected);fade(slot,1,800);slot.visited=true;start(selected,slot);}
   update();
  },
  mix(value){settings=audioSettings(value,settings);mix();},
  unlock(){blocked=false;if(selected)start(selected,tracks.get(selected));},
  effect,
  cues(ids){
   if(!visible||disposed)return;
   let flips=0;
   for(const id of ids){
    if(id!=='flip'){effect(id);continue;}
    if(flips++>=3)continue;
    const time=now(),at=Math.max(time,lastFlip+150);lastFlip=at;
    if(at===time)effect(id);
    else{const timer=setTimer(()=>{delayed.delete(timer);effect(id);},at-time);delayed.add(timer);}
   }
  },
  clearCues,
  dispose(){disposed=true;clearEffects();if(timer!==null)clearTimer(timer);for(const slot of tracks.values())pause(slot.audio);tracks.clear();},
 };
}
