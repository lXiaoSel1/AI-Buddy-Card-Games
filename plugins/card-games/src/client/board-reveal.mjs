const streets=[{phase:'flop',from:0,to:3,duration:360,delay:160},{phase:'turn',from:3,to:4,duration:420,delay:0},{phase:'river',from:4,to:5,duration:520,delay:0}];

export function planBoardReveal(from,to,{allInDelay=0,reduced=false,settled=false}={}){
 const steps=[];
 let end=allInDelay;
 for(const street of streets){
  if(to<street.to||from>=street.to)continue;
  if(steps.length)end+=reduced?300:650;
  if(street.phase==='river'&&!reduced)end+=160;
  const step={...street,from:Math.max(from,street.from),start:end,duration:reduced?120:street.duration,delay:reduced?0:street.delay,reduced};
  steps.push(step);
  end+=step.duration+step.delay*(step.to-step.from-1);
 }
 return {steps,finish:end+(steps.length&&settled?(reduced?300:500):0)};
}

export function createBoardRevealDriver({now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout,onChange}){
 const timers=new Set();
 let state=null,readyAt=0;
 const publish=value=>{state=value;onChange(value);};
 const clear=()=>{for(const timer of timers)clearTimer(timer);timers.clear();readyAt=0;};
 const later=(ms,callback)=>{
  const timer=setTimer(()=>{timers.delete(timer);callback();},ms);
  timers.add(timer);
 };
 return {
  observe(key,count,options={}){
   if(!key||state?.key!==key||count<state.target){
    clear();publish({key,count,target:count,phaseCount:count,animations:{},busy:false});return;
   }
   if(count===state.target)return;
   const plan=planBoardReveal(state.target,count,options),queued=Math.max(0,readyAt-now());
   if(!plan.steps.length){clear();publish({key,count,target:count,phaseCount:count,animations:{},busy:false});return;}
   publish({...state,target:count,busy:true});
   readyAt=now()+queued+plan.finish;
   for(const step of plan.steps){
    later(queued+step.start,()=>{
     const animations={...state.animations};
     for(let i=step.from;i<step.to;i++)animations[i]={phase:step.phase,duration:step.duration,delay:step.delay*(i-step.from),reduced:step.reduced};
     publish({...state,count:step.to,animations});
    });
    later(queued+step.start+step.duration/2+step.delay*(step.to-step.from-1),()=>publish({...state,phaseCount:step.to}));
   }
   later(queued+plan.finish,()=>{if(state.target===count)publish({...state,animations:{},busy:false});});
  },
  dispose(){clear();state=null;}
 };
}

export function useBoardReveal(React,key,count,options){
 const {useEffect,useRef,useState}=React;
 const [state,setState]=useState(null),driver=useRef(null);
 driver.current??=createBoardRevealDriver({onChange:setState});
 useEffect(()=>()=>driver.current.dispose(),[]);
 useEffect(()=>{driver.current.observe(key,count,options);},[key,count]);
 const matching=!!key&&state?.key===key&&count>=state.target;
 return matching?{count:state.count,phaseCount:state.phaseCount,animations:state.animations,busy:state.busy||count>state.target}:{count,phaseCount:count,animations:{},busy:false};
}
