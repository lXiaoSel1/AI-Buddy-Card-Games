import assert from 'node:assert/strict';
import test from 'node:test';
import {createDdzLifecycle,DDZ_DEAL_TIMING,DDZ_FINAL_HOLD_MS} from '../../plugins/card-games/src/client/ddz-lifecycle.mjs';

function fixture(){
 const jobs=new Map(),changes=[];
 let now=0,id=0;
 const lifecycle=createDdzLifecycle({onChange:value=>changes.push(value),setTimer:(fn,delay)=>{
  const job=++id;jobs.set(job,{fn,at:now+delay});return job;
 },clearTimer:job=>jobs.delete(job)});
 function tick(ms){
  const until=now+ms;
  while(jobs.size){
   const [job,next]=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];
   if(next.at>until)break;
   jobs.delete(job);now=next.at;next.fn();
  }
  now=until;
 }
 return {lifecycle,jobs,changes,tick,last:()=>changes.at(-1)??null};
}

const table=(hand,dealAttempt,phase='calling',type='doudizhu')=>({tableId:'table',projection:{type,handId:'hand-'+hand,dealAttempt,phase,settlement:phase==='settled'?{completed:true}:null}});

test('only an accepted local create, next hand or redeal animates; counts update at arrival and saved hands stay static',()=>{
 const {lifecycle,jobs,changes,tick,last}=fixture(),{deck,flight,stagger,total,reduced}=DDZ_DEAL_TIMING;
 const initial=table(1,1);
 lifecycle.observe(null,initial);
 assert.equal(lifecycle.busy,false);
 assert.equal(changes.length,0);
 lifecycle.reset();
 lifecycle.observe(null,initial,{localDeal:true});
 assert.deepEqual(last(),{stage:'dealing',count:0,reduced:false});
 tick(deck+flight-1);assert.equal(last().count,0);
 tick(1);assert.equal(last().count,1);
 tick(stagger*16);assert.equal(last().count,17);
 lifecycle.observe(initial,initial,{localDeal:true});
 assert.equal(jobs.size,1);
 tick(total-deck-flight-stagger*16);assert.equal(last(),null);

 const redealRequired=table(1,1,'redeal-required'),redealt=table(1,2),settled=table(1,2,'settled'),next=table(2,1);
 lifecycle.observe(initial,redealRequired);
 lifecycle.observe(redealRequired,redealt,{localDeal:true,reduced:true});
 assert.deepEqual(last(),{stage:'dealing',count:17,reduced:true});
 tick(reduced-1);assert.equal(lifecycle.busy,true);
 tick(1);assert.equal(lifecycle.busy,false);
 lifecycle.observe(redealt,settled);
 lifecycle.observe(settled,next,{localDeal:true});
 assert.equal(lifecycle.busy,true);
 lifecycle.reset();lifecycle.observe(null,next);tick(total);
 assert.equal(lifecycle.busy,false);
 lifecycle.observe(next,table(3,1,'calling','texas'),{localDeal:true});
 assert.equal(jobs.size,0);
});

test('a live DDZ settlement waits for final effects plus 900ms and Continue; leaving cancels its hold',()=>{
 const {lifecycle,jobs,tick,last}=fixture();
 const playing=table(1,1,'playing'),settled=table(1,1,'settled');
 lifecycle.observe(null,playing);
 lifecycle.observe(playing,settled);
 const token=last();
 assert.equal(token.stage,'holding');
 assert.equal(lifecycle.busy,true);
 tick(4000);assert.equal(last(),token);
 lifecycle.continueSettlement(token);assert.equal(last(),token);
 lifecycle.finishFx(token);
 tick(DDZ_FINAL_HOLD_MS-1);
 lifecycle.finishFx(token);
 assert.equal(last(),token);
 tick(1);
 const reveal=last();
 assert.equal(reveal.stage,'revealed');
 tick(4000);assert.equal(last(),reveal);
 lifecycle.continueSettlement(reveal);
 lifecycle.observe(settled,settled);
 assert.equal(lifecycle.busy,false);
 lifecycle.reset();lifecycle.observe(null,settled);
 assert.equal(lifecycle.busy,false);

 lifecycle.reset();lifecycle.observe(null,playing);lifecycle.observe(playing,settled);
 const leaving=last();lifecycle.finishFx(leaving);
 lifecycle.reset();lifecycle.observe(null,settled);
 lifecycle.finishFx(leaving);tick(DDZ_FINAL_HOLD_MS);
 assert.equal(lifecycle.busy,false);assert.equal(jobs.size,0);
});
