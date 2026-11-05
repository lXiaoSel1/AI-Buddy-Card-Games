const receipted=new Set(['games.table.action','games.table.leave']);
export const commandCanRetry=request=>receipted.has(request.method)||request.method==='games.table.create';
export const commandReadPayload=({method,payload})=>receipted.has(method)?{tableId:payload.tableId,command:{method,payload}}:payload.tableId?{tableId:payload.tableId}:{};
export function commandOutcome(request,value){
 if(!receipted.has(request.method)||value.commandReceipt?.commandId!==request.payload.commandId)return 'unconfirmed';
 if(value.commandReceipt.status==='applied')return 'applied';
 if(value.commandReceipt.status==='not-found')return value.version===request.payload.expectedVersion?'retryable':'stale';
 return 'unconfirmed';
}
export function viewScopeIsCurrent(scope,current){return scope.epoch===current.epoch&&scope.tableId===current.tableId;}
export function acceptsTableObservation(previous,version,sequence){
 return !previous||version>previous.version||version===previous.version&&sequence>=previous.sequence;
}
export function startSingleFlightPoll(task,{delay=1500,schedule=setTimeout,cancel=clearTimeout}={}){
 let stopped=false,timer;
 const next=()=>{if(!stopped)timer=schedule(async()=>{try{await task();}catch{}finally{next();}},delay);};
 next();return ()=>{stopped=true;cancel(timer);};
}
