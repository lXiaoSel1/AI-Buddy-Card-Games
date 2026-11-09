import {fail} from './rules/common.mjs';
import {cardAssetRoutes} from './asset-routes.mjs';
import {createAudioSettingsStore} from './audio-settings.mjs';
import {CONTRACT_HASH,CONTRACT_VERSION} from '../../../contracts/contract.mjs';
export const name='ai-buddy-card-games';
export const inject=['buddyVoiceGamesServices','connection'];
export const PLUGIN_ID='@ai-buddy/card-games';
export {CONTRACT_HASH,CONTRACT_VERSION};
const methods=new Set(['games.table.create','games.table.read','games.table.art','games.table.action','games.table.pause','games.table.resume','games.table.leave','games.table.next','games.table.seats','games.table.topup','games.model.request','games.model.cancel','games.chat.send','games.chat.read','games.replay.read','games.replay.review']);
export async function createNativeGamePlugin(ctx){let handle=null,audio=null,closed=false,closePromise=null;const registrations=[],pending=new Set(),readiness={pluginId:PLUGIN_ID,label:'一起玩牌',version:'1.1.3',contractVersion:CONTRACT_VERSION,mode:'unavailable',blockers:[]};
 try{if(typeof ctx.buddyVoiceGamesServices?.openPlugin!=='function')throw fail('VOICE_GAMES_HOST_UPGRADE_REQUIRED','需要更新到 AI 酱 2.0.4 或更高版本');handle=await ctx.buddyVoiceGamesServices.openPlugin({pluginId:PLUGIN_ID,contractVersion:CONTRACT_VERSION,contractHash:CONTRACT_HASH});if(typeof handle?.authorizeRequest!=='function'||typeof handle?.invoke!=='function')throw fail('TRUSTED_GAME_UI_REQUIRED','需要宿主原生页面鉴权');const description=await handle.describe();if(description.contractVersion&&description.contractVersion!==CONTRACT_VERSION)throw fail('GAME_CONTRACT_MISMATCH','宿主合同版本不匹配');Object.assign(readiness,{mode:'runtime',blockers:[],cardAudioVolume:description.cardAudioVolume===true});}
 catch(error){readiness.blockers=[error.code??'GAME_INITIALIZATION_FAILED'];try{await handle?.close?.();}catch{}handle=null;}
 if(handle?.dataDirectory)try{audio=createAudioSettingsStore(handle.dataDirectory);}catch{}
 const route='/api/ai-buddy/card-games';
 const fetch=async request=>{try{
  if(closed)throw fail('GAME_PLUGIN_CLOSED','插件已停用');
  if(request.method==='GET')return Response.json(readiness);
  if(request.method!=='POST')return Response.json({error:{code:'GAME_POST_REQUIRED',message:'需要POST'}},{status:405});
  if(!handle)throw fail(readiness.blockers[0]??'GAME_HOST_UNAVAILABLE','需要兼容宿主接口');
  const authorizationRequest=request.clone(),raw=await request.text(),bytes=Buffer.byteLength(raw);
  if(bytes>200000)throw fail('GAME_REQUEST_TOO_LARGE','请求过大');
  const input=JSON.parse(raw),settings=input?.method==='audio.settings';
  if((!settings&&!methods.has(input?.method))||!input.payload||typeof input.payload!=='object'||Array.isArray(input.payload))throw fail('GAME_REQUEST_INVALID','未知游戏操作');
  if(settings&&(!audio||bytes>1024))throw fail('GAME_AUDIO_SETTINGS_UNAVAILABLE','声音设置暂不可用');
  const principal=await handle.authorizeRequest(authorizationRequest,{pluginId:PLUGIN_ID,action:settings?(readiness.cardAudioVolume?'games.table.audio':'games.table.read'):input.method});
  if(closed)throw fail('GAME_PLUGIN_CLOSED','插件已停用');
  if(!principal?.contextToken)throw fail('GAME_PRINCIPAL_REQUIRED','需要当前APP身份');
  const task=Promise.resolve().then(async()=>{
   if(closed)throw fail('GAME_PLUGIN_CLOSED','插件已停用');
   if(settings){const value=input.payload.settings?await audio.write(input.payload.settings):await audio.read();if(readiness.cardAudioVolume)await handle.invoke('games.table.audio',{voice:value.voice,muted:value.muted,principal});return {settings:value};}
   const payload={...input.payload,principal};delete payload.contextToken;delete payload.actorId;delete payload.scope;
   return handle.invoke(input.method,payload);
  });
  pending.add(task);try{return Response.json(await task);}finally{pending.delete(task);}}
 catch(error){return Response.json({error:{code:typeof error.code==='string'?error.code:'GAME_REQUEST_FAILED',message:typeof error.message==='string'?error.message:'操作失败'}},{status:closed?503:403});}};
 function close(){if(closePromise)return closePromise;closed=true;closePromise=Promise.resolve().then(async()=>{const errors=[];for(const dispose of registrations){try{const value=dispose?.();if(value!==closePromise)await value;}catch(e){errors.push(e);}}try{await handle?.close?.();}catch(e){errors.push(e);}await Promise.allSettled([...pending]);if(errors.length)throw fail('GAME_PLUGIN_DRAIN_FAILED','游戏停用仍有待清理资源');});return closePromise;}
 try{if(typeof ctx.connection?.fetch?.register!=='function')throw fail('NATIVE_ROUTE_REGISTRY_REQUIRED','需要原生DSH路由');registrations.push(await ctx.connection.fetch.register({path:route,methods:['GET','POST'],requestBody:'buffered',fetch}));for(const definition of await cardAssetRoutes(route)){registrations.push(await ctx.connection.fetch.register(definition));}ctx.effect?.(()=>close);}catch(error){await close().catch(()=>{});throw error;}return {route,readiness:()=>structuredClone(readiness),close};
}
// Cordis 4 plugin startup awaits apply() and accepts only a disposer or void.
// The diagnostic/service handle belongs to the explicit factory above, never
// to the native plugin effect result.
export async function apply(ctx){await createNativeGamePlugin(ctx);}
