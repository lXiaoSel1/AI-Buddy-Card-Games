export const DDZ_DEAL_TIMING=Object.freeze({deck:120,stagger:34,flight:300,total:1200,reduced:120});
export const DDZ_FINAL_HOLD_MS=900;

const projection=table=>table?.projection??table?.hand?.projection??table?.hand;
export function ddzDealKey(table){
 const view=projection(table);
 return view?.type==='doudizhu'&&view.handId?JSON.stringify([table.tableId,view.handId,view.dealAttempt??1]):null;
}

export function createDdzLifecycle({onChange,setTimer=setTimeout,clearTimer=clearTimeout}){
 const timers=new Set();
 let key=null,state=null,holdTimer=null;
 const publish=value=>{state=value;onChange(value);};
 const later=(delay,callback)=>{
  const timer=setTimer(()=>{timers.delete(timer);callback();},delay);
  timers.add(timer);
  return timer;
 };
 function clear(){
  for(const timer of timers)clearTimer(timer);
  timers.clear();holdTimer=null;
 }
 function reset(){
  clear();key=null;
  if(state)publish(null);
 }
 return {
  get busy(){return state!==null;},
  observe(previous,table,{localDeal=false,reduced=false}={}){
   const nextKey=ddzDealKey(table),previousKey=ddzDealKey(previous),view=projection(table);
   const newDeal=key!==nextKey;
   if(newDeal){reset();key=nextKey;}
   if(!key)return;
   if(localDeal&&newDeal&&previousKey!==key&&view.phase==='calling'){
    const count=17,{deck,flight,stagger,total,reduced:fade}=DDZ_DEAL_TIMING;
    publish({stage:'dealing',count:reduced?count:0,reduced});
    if(!reduced)for(let index=0;index<count;index++){
     later(deck+flight+index*stagger,()=>publish({stage:'dealing',count:index+1,reduced}));
    }
    later(reduced?fade:total,()=>publish(null));
   }
   if(previousKey===key&&projection(previous)?.phase==='playing'&&view.phase==='settled'&&view.settlement?.completed===true){
    clear();publish({stage:'holding'});
   }
  },
  finishFx(token){
   if(token!==state||token?.stage!=='holding'||holdTimer!==null)return;
   holdTimer=later(DDZ_FINAL_HOLD_MS,()=>{holdTimer=null;publish({stage:'revealed'});});
  },
  continueSettlement(token){
   if(token===state&&token?.stage==='revealed')publish(null);
  },
  reset,
  dispose(){clear();key=null;state=null;}
 };
}
