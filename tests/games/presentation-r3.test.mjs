import assert from 'node:assert/strict';
import test from 'node:test';
import {createBoardRevealDriver,planBoardReveal} from '../../plugins/card-games/src/client/board-reveal.mjs';
import {bubblePlacement,ddzDisplayHand,seatPositions} from '../../plugins/card-games/src/client/visual.mjs';

test('R11 keeps the hand source and card identities while sorting 17, 20, played and restored cards',()=>{
 const dealt=[5,9,22,7,52,0,48,44,2,36,16,53,19,13,12,33,4];
 const full=[...dealt,46,51,10],played=full.filter(card=>card!==52&&card!==4);
 const expected=[53,52,48,44,36,33,22,16,19,12,13,9,4,5,7,0,2];
 assert.deepEqual(ddzDisplayHand(dealt),expected);
 assert.deepEqual(ddzDisplayHand(full),[53,52,48,51,44,46,36,33,22,16,19,12,13,9,10,4,5,7,0,2]);
 assert.deepEqual(ddzDisplayHand(played),ddzDisplayHand(full).filter(card=>card!==52&&card!==4));
 assert.deepEqual(ddzDisplayHand(dealt.toReversed()),expected);
 assert.deepEqual(dealt,[5,9,22,7,52,0,48,44,2,36,16,53,19,13,12,33,4]);
});

test('U2 moves heads out of bubble paths and mirrors the end seats',()=>{
 const ddz=seatPositions(2,'doudizhu');
 const left=bubblePlacement(ddz[0],2,true,false),right=bubblePlacement(ddz[1],2,true,false);
 assert.equal(left.tail,'left');assert.ok(parseInt(left.style.left)>ddz[0].x);
 assert.equal(right.tail,'right');assert.ok(1280-parseInt(right.style.right)<ddz[1].x);
 const seats=seatPositions(9,'texas');
 assert.equal(bubblePlacement(seats[0],9,false,false).tail,'left');
 assert.equal(bubblePlacement(seats[8],9,false,false).tail,'right');
 assert.equal(bubblePlacement(seats[2],9,false,false).tail,'up');
 const active=bubblePlacement(seats[0],9,false,true);
 assert.equal(active.tail,'left');
 assert.equal(active.style.left,'156px');
});

test('U4 creates fixed street order and timing in normal and reduced motion',()=>{
 const full=planBoardReveal(0,5,{allInDelay:1010,settled:true});
 assert.deepEqual(full.steps.map(s=>[s.phase,s.start,s.duration,s.delay]),[['flop',1010,360,160],['turn',2340,420,0],['river',3570,520,0]]);
 assert.equal(full.finish,4590);
 const reduced=planBoardReveal(0,5,{reduced:true,settled:true});
 assert.deepEqual(reduced.steps.map(s=>[s.phase,s.start,s.duration,s.delay]),[['flop',0,120,0],['turn',420,120,0],['river',840,120,0]]);
 assert.equal(reduced.finish,1260);
 assert.equal(planBoardReveal(3,4).steps[0].start,0);
});

test('U4 shows a first snapshot directly, skips duplicate renders and cancels old hand timers',()=>{
 const tasks=new Map(),changes=[];
 let id=0,now=0;
 const advance=ms=>{
  const end=now+ms;
  while(true){
   const next=[...tasks.entries()].sort((a,b)=>a[1].at-b[1].at)[0];
   if(!next||next[1].at>end)break;
   tasks.delete(next[0]);now=next[1].at;next[1].callback();
  }
  now=end;
 };
 const driver=createBoardRevealDriver({now:()=>now,setTimer:(callback,ms)=>{tasks.set(++id,{at:now+ms,callback});return id;},clearTimer:id=>tasks.delete(id),onChange:value=>changes.push(value)});
 driver.observe('table/hand1',3);
 assert.equal(changes.at(-1).count,3);
 assert.equal(changes.at(-1).busy,false);
 driver.observe('table/hand1',5,{settled:true,allInDelay:1010});
 assert.equal(changes.at(-1).count,3);
 assert.equal(changes.at(-1).busy,true);
 const scheduled=tasks.size;
 driver.observe('table/hand1',5,{settled:true});
 assert.equal(tasks.size,scheduled);
 advance(1009);assert.equal(changes.at(-1).count,3);
 advance(1);assert.equal(changes.at(-1).count,4);
 driver.observe('table/hand2',5);
 assert.equal(changes.at(-1).count,5);
 assert.equal(changes.at(-1).busy,false);
 assert.equal(tasks.size,0);
 const recent=changes.at(-1);advance(5000);assert.equal(changes.at(-1),recent);
 driver.observe(null,0);driver.observe('table/hand2',5);
 assert.equal(changes.at(-1).busy,false);assert.equal(changes.at(-1).count,5);
});

test('U4 fake-clock runout exposes only the current street and finishes after the river hold',()=>{
 const jobs=[],changes=[];
 let now=0;
 const advanceTo=end=>{
  while(jobs[0]?.at<=end){const next=jobs.shift();now=next.at;next.callback();}
  now=end;
 };
 const driver=createBoardRevealDriver({now:()=>now,setTimer:(callback,ms)=>{const job={at:now+ms,callback};jobs.push(job);jobs.sort((a,b)=>a.at-b.at);return job;},clearTimer:job=>{const i=jobs.indexOf(job);if(i>=0)jobs.splice(i,1);},onChange:value=>changes.push(value)});
 const last=()=>changes.at(-1);
 driver.observe('runout',0);
 driver.observe('runout',5,{settled:true,allInDelay:1010});
 advanceTo(1009);assert.deepEqual([last().count,last().phaseCount,last().busy],[0,0,true]);
 advanceTo(1010);assert.deepEqual([last().count,last().phaseCount,last().busy],[3,0,true]);
 assert.deepEqual(Object.values(last().animations).map(v=>v.delay),[0,160,320]);
 advanceTo(1510);assert.equal(last().phaseCount,3);
 advanceTo(2340);assert.deepEqual([last().count,last().phaseCount],[4,3]);
 advanceTo(3570);assert.deepEqual([last().count,last().phaseCount],[5,4]);
 advanceTo(4589);assert.deepEqual([last().count,last().phaseCount,last().busy],[5,5,true]);
 advanceTo(4590);assert.deepEqual([last().count,last().phaseCount,last().busy],[5,5,false]);
 driver.observe('resized-outside-hook',5,{settled:true});
 assert.deepEqual([last().count,last().phaseCount,last().busy],[5,5,false]);
});
