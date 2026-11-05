export const GAME_API_ROUTE='/api/ai-buddy/card-games';
const unconfirmed=()=>Object.assign(Error('The host did not return a confirmed result'),{code:'GAME_REQUEST_UNCONFIRMED',unknown:true});
export function createGamePageClient({fetcher=globalThis.fetch,route=GAME_API_ROUTE}={}){
 return {
  async readiness(){
   const response=await fetcher(route,{credentials:'include'}),value=await response.json();
   if(!response.ok)throw Object.assign(Error(value.error?.message??'插件未就绪'),{code:value.error?.code});
   return value;
  },
  async invoke(method,payload={}){
   const body=JSON.stringify({method,payload});let response,value;
   try{response=await fetcher(route,{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body});value=await response.json();}catch{throw unconfirmed();}
   if(!value||typeof value!=='object'||Array.isArray(value)||!response.ok&&!value.error?.code)throw unconfirmed();
   if(!response.ok||value.error)throw Object.assign(Error(value.error?.message??value.error??'操作失败'),{code:value.error?.code??'GAME_REQUEST_FAILED',unknown:value.error?.unknown===true});
   return value;
  },
 };
}
