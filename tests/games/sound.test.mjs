import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {audioScene,createCardSound,fxSound,tableSounds} from '../../plugins/card-games/src/client/sound.mjs';
import {createAudioSettingsStore} from '../../plugins/card-games/src/audio-settings.mjs';

function table(version=1,{id='table',hand='hand',type='texas',actor='ai',players=[],settlement=null,history=[],bottom=[],dealAttempt=1,status='active'}={}){
 return {tableId:id,version,status,userSeatId:'user',projection:{type,handId:hand,actorId:actor,players,settlement,history,bottom,dealAttempt}};
}

test('live play gives one cue for a turn, a user wager, and the outcome',()=>{
 const before=table(),after=table(2,{actor:'user',history:[{actorId:'ai',type:'call',amount:20}]});
 assert.deepEqual(tableSounds(before,after),['turn']);
 assert.deepEqual(tableSounds(after,after),[]);
 const nextStreet=table(3,{actor:'user'});
 nextStreet.projection.phase='flop';after.projection.phase='preflop';
 assert.deepEqual(tableSounds(after,nextStreet),['turn']);
 const wager=table(3,{history:[...after.projection.history,{actorId:'user',type:'call',amount:20}]});
 assert.deepEqual(tableSounds(after,wager),['chip']);
 const victory=table(4,{settlement:{completed:true,winnerIds:['user'],deltasByPlayer:{user:20}},history:wager.projection.history});
 assert.deepEqual(tableSounds(wager,victory),['chip','win']);
 assert.deepEqual(tableSounds(wager,table(4,{settlement:{completed:true,winnerIds:['user','ai'],deltasByPlayer:{user:0}}})),['chip']);
 assert.deepEqual(tableSounds(wager,table(4,{settlement:{completed:true,winnerIds:['ai'],deltasByPlayer:{user:-20}}})),['lose']);
});

test('a deal is local or a live redeal, and resumed or replayed observations are silent',()=>{
 const calling=table(1,{type:'doudizhu'}),redeal=table(2,{type:'doudizhu',dealAttempt:2});
 assert.deepEqual(tableSounds(null,calling),[]);
 assert.deepEqual(tableSounds(null,calling,{localDeal:true}),['deal']);
 assert.deepEqual(tableSounds(null,table(1,{history:[{actorId:'user',type:'blind',amount:2}]}),{localDeal:true}),['deal','chip']);
 assert.deepEqual(tableSounds(calling,redeal),['deal']);
 assert.deepEqual(tableSounds(redeal,table(3,{type:'doudizhu',dealAttempt:2,bottom:[3,6,10]})),['flip','flip','flip']);
 assert.deepEqual(tableSounds(table(1,{status:'paused'}),table(2,{actor:'user'})),[]);
 assert.deepEqual(tableSounds(calling,table(5,{type:'doudizhu',actor:'user'})),[]);
});

test('approved effects have audio and every ordinary or large Texas rank stays silent',()=>{
 for(const name of ['landlord','plane','bomb','rocket','spring','allin'])assert.equal(fxSound(name),name);
 assert.equal(fxSound('antispring'),'spring');
 for(const name of ['royal','straightflush','quads','fullhouse','flush','straight','trips','ddzstraight','chainpair','twopair','pair','call','play','check'])assert.equal(fxSound(name),null);
});

test('tension stays with the hand until it settles',()=>{
 assert.equal(audioScene('lobby'), 'lobby');
 const allIn=table(2,{players:[{allIn:true}]});
 assert.equal(audioScene('table',allIn),'tension');
 assert.equal(audioScene('table',table(3),true),'tension');
 assert.equal(audioScene('table',table(4,{settlement:{completed:true}}),true),'texas');
 const completedAllIn=table(4,{settlement:{completed:true},players:[{allIn:true}]});
 assert.equal(audioScene('table',completedAllIn,false,true),'tension');
 assert.equal(audioScene('table',completedAllIn,false,false),'texas');
 assert.equal(audioScene('table',table(3,{type:'doudizhu',players:[{handCount:2}]})),'tension');
 assert.equal(audioScene('table',table(3,{type:'doudizhu',players:[{handCount:3}]})),'ddz');
});

function audioClock({reject=null}={}){
 let now=0,handle=0;
 const tasks=new Map(),audio=[];
 const setTimer=(callback,ms)=>{const id=++handle;tasks.set(id,{callback,at:now+ms});return id;};
 const makeAudio=src=>{
  const item=Object.assign(new EventTarget(),{src,volume:1,paused:true,currentTime:0,starts:0,play(){
   this.starts++;if(reject?.(this))return Promise.reject(Object.assign(Error('rejected'),{name:'NotAllowedError'}));
   this.paused=false;this.dispatchEvent(new Event('playing'));return Promise.resolve();
  },pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}});
  audio.push(item);return item;
 };
 const sound=createCardSound({makeAudio,now:()=>now,setTimer,clearTimer:id=>tasks.delete(id)});
 function advance(ms){const end=now+ms;for(;;){const next=[...tasks.entries()].filter(([,row])=>row.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;tasks.delete(next[0]);now=next[1].at;next[1].callback();}now=end;}
 const element=id=>audio.find(item=>item.src.endsWith('/'+id+'.ogg'));
 return {sound,audio,advance,element};
}
const closeTo=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-4,`${actual} vs ${expected}`);

test('a scene crossfades, starts tension at 56.82, and pauses and resumes in place',async()=>{
 const {sound,element,advance}=audioClock();
 sound.scene('texas');advance(1200);closeTo(element('texas').volume,.4);
 await Promise.resolve();
 sound.scene('tension');assert.equal(element('tension').currentTime,56.82);
 advance(250);closeTo(element('tension').volume,.4);assert.equal(element('texas').paused,true);
 element('tension').currentTime=61;
 sound.scene('tension');assert.equal(element('tension').currentTime,61);
 await Promise.resolve();
 sound.setVisible(false);advance(400);assert.equal(element('tension').paused,true);
 sound.setVisible(true);assert.equal(element('tension').currentTime,61);advance(800);closeTo(element('tension').volume,.4);
 sound.scene('texas');advance(1500);closeTo(element('texas').volume,.4);assert.equal(element('tension').paused,true);
 element('texas').currentTime=20;sound.scene('lobby',{leavingTable:true});advance(400);assert.equal(element('texas').paused,true);
 sound.scene('texas',{resumingTable:true});advance(800);assert.equal(element('texas').currentTime,20);closeTo(element('texas').volume,.4);
});

test('overlapping effects hold the deepest attenuation until the last one ends',()=>{
 const {sound,element,advance}=audioClock();
 sound.scene('lobby');advance(1200);
 sound.effect('deal');advance(40);closeTo(element('lobby').volume,.4*10**(-5/20));
 sound.effect('rocket');advance(40);closeTo(element('lobby').volume,.4*10**(-10/20));
 element('rocket').dispatchEvent(new Event('ended'));advance(500);closeTo(element('lobby').volume,.4*10**(-10/20));
 element('deal').dispatchEvent(new Event('ended'));advance(500);closeTo(element('lobby').volume,.4);
});

test('flip and chip cues are spaced and hidden pages discard queued effects',()=>{
 const {sound,audio,advance}=audioClock();
 const count=id=>audio.filter(item=>item.src.endsWith('/'+id+'.ogg')).length;
 sound.cues(['flip','flip','flip','flip','chip','chip']);assert.equal(count('flip'),1);assert.equal(count('chip'),1);
 advance(149);assert.equal(count('flip'),1);advance(1);assert.equal(count('flip'),2);
 sound.setVisible(false);advance(500);assert.equal(count('flip'),2);
 sound.setVisible(true);sound.effect('chip');assert.equal(count('chip'),2);
});

test('autoplay refusal waits for unlock and audio failures are contained',async()=>{
 let blocked=true;
 const {sound,element}=audioClock({reject:()=>blocked});
 sound.scene('lobby');await Promise.resolve();await Promise.resolve();
 assert.equal(element('lobby').starts,1);
 sound.scene('lobby');assert.equal(element('lobby').starts,1);
 blocked=false;sound.unlock();assert.equal(element('lobby').starts,2);
 const missing=createCardSound({makeAudio(){throw Error('asset missing');}});
 assert.doesNotThrow(()=>{missing.scene('texas');missing.effect('deal');missing.dispose();});
});

test('settings persist across new plugin store instances and preserve the reserved channel',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'card-audio-'));
 try{
  const store=createAudioSettingsStore(dir);
  assert.deepEqual(await store.read(),{muted:false,music:.4,sfx:.6,voice:1});
  await store.write({muted:true,music:.25,sfx:.8,voice:.2});
  assert.deepEqual(await createAudioSettingsStore(dir).read(),{muted:true,music:.25,sfx:.8,voice:.2});
  assert.deepEqual(await store.write({muted:false,music:2,sfx:-1}),{muted:false,music:1,sfx:0,voice:.2});
 }finally{await rm(dir,{recursive:true,force:true});}
});
