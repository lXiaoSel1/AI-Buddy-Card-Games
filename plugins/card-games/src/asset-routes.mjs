import {lstat,open,readFile,realpath} from 'node:fs/promises';
import {extname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const assetType=Object.freeze({'.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'});
const allowedPath=/^(?:art|fonts|misc)\/(?:[a-z0-9-]+\/)*[a-zA-Z0-9-]+\.(?:webp|png|woff2)$/;
const audioPath=/^audio\/[a-z0-9-]+\.ogg$/;

async function audioResponse(file,size,range){
 const headers={'content-type':'audio/ogg','accept-ranges':'bytes','cache-control':'private, max-age=3600','x-content-type-options':'nosniff'};
 if(range===null)return new Response(await readFile(file),{headers:{...headers,'content-length':String(size)}});
 const parts=/^bytes=(\d*)-(\d*)$/.exec(range);
 const invalid=()=>new Response(null,{status:416,headers:{...headers,'content-range':`bytes */${size}`}});
 if(!parts||!parts[1]&&!parts[2])return invalid();
 const first=parts[1]?Number(parts[1]):null,last=parts[2]?Number(parts[2]):null;
 if(first!==null&&!Number.isSafeInteger(first)||last!==null&&!Number.isSafeInteger(last))return invalid();
 const start=first??Math.max(0,size-last),end=first===null||last===null?size-1:Math.min(last,size-1);
 if(start>end)return invalid();
 const bytes=Buffer.alloc(end-start+1),handle=await open(file,'r');
 try{
  for(let offset=0;offset<bytes.length;){
   const {bytesRead}=await handle.read(bytes,offset,bytes.length-offset,start+offset);
   if(!bytesRead)return new Response(null,{status:404});
   offset+=bytesRead;
  }
 }finally{await handle.close();}
 return new Response(bytes,{status:206,headers:{...headers,'content-range':`bytes ${start}-${end}/${size}`,'content-length':String(bytes.length)}});
}

export async function cardAssetRoutes(prefix,packageLib=new URL('./',import.meta.url)){
 let paths;
 try{paths=JSON.parse(await readFile(new URL('./assets.json',packageLib),'utf8'));}
 catch(error){if(error.code==='ENOENT')return [];throw error;}
 if(!Array.isArray(paths)||paths.length>512||new Set(paths).size!==paths.length||paths.some(p=>typeof p!=='string'||!allowedPath.test(p)&&!audioPath.test(p)))throw Error('Invalid card-games asset inventory');
 const base=await realpath(fileURLToPath(new URL('./assets/',packageLib)));
 return paths.map(asset=>{
  const path=prefix+'/assets/'+asset;
  const audio=audioPath.test(asset),unavailable=()=>new Response(null,{status:audio?204:404});
  return {path,methods:['GET'],requestBody:'buffered',async fetch(request){
   if(request.method!=='GET')return new Response(null,{status:405});
   if(new URL(request.url).pathname!==path)return new Response(null,{status:404});
   try{
    const candidate=join(base,asset),file=await realpath(candidate);
    if(relative(base,file).replaceAll('\\','/')!==asset)return new Response(null,{status:404});
    const stat=await lstat(file);
    if(!stat.isFile()||stat.size>12*1024*1024)return new Response(null,{status:404});
    if(audio)return await audioResponse(file,stat.size,request.headers.get('range'));
    return new Response(await readFile(file),{headers:{'content-type':assetType[extname(asset)],'cache-control':'private, max-age=3600','x-content-type-options':'nosniff'}});
   }catch(error){if(!['ENOENT','ENOTDIR','EACCES','EPERM'].includes(error.code))throw error;return unavailable();}
  }};
 });
}
