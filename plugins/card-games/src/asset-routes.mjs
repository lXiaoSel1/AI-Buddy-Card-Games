import {lstat,readFile,realpath} from 'node:fs/promises';
import {extname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const assetType=Object.freeze({'.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'});
const allowedPath=/^(?:art|fonts|misc)\/(?:[a-z0-9-]+\/)*[a-zA-Z0-9-]+\.(?:webp|png|woff2)$/;

export async function cardAssetRoutes(prefix,packageLib=new URL('./',import.meta.url)){
 let paths;
 try{paths=JSON.parse(await readFile(new URL('./assets.json',packageLib),'utf8'));}
 catch(error){if(error.code==='ENOENT')return [];throw error;}
 if(!Array.isArray(paths)||paths.length>512||new Set(paths).size!==paths.length||paths.some(p=>typeof p!=='string'||!allowedPath.test(p)))throw Error('Invalid card-games asset inventory');
 const base=await realpath(fileURLToPath(new URL('./assets/',packageLib)));
 return paths.map(asset=>{
  const path=prefix+'/assets/'+asset;
  return {path,methods:['GET'],requestBody:'buffered',async fetch(request){
   if(request.method!=='GET')return new Response(null,{status:405});
   if(new URL(request.url).pathname!==path)return new Response(null,{status:404});
   try{
    const candidate=join(base,asset),file=await realpath(candidate);
    if(relative(base,file).replaceAll('\\','/')!==asset)return new Response(null,{status:404});
    const stat=await lstat(file);
    if(!stat.isFile()||stat.size>12*1024*1024)return new Response(null,{status:404});
    return new Response(await readFile(file),{headers:{'content-type':assetType[extname(asset)],'cache-control':'private, max-age=3600','x-content-type-options':'nosniff'}});
   }catch(error){if(!['ENOENT','ENOTDIR','EACCES','EPERM'].includes(error.code))throw error;return new Response(null,{status:404});}
  }};
 });
}
