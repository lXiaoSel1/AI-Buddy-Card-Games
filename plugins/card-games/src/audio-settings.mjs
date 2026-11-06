import {randomUUID} from 'node:crypto';
import {lstat,readFile,rename,rm,writeFile} from 'node:fs/promises';
import {isAbsolute,join} from 'node:path';
import {audioSettings,DEFAULT_AUDIO} from './audio-mix.mjs';

export function createAudioSettingsStore(directory){
 if(typeof directory!=='string'||!isAbsolute(directory))throw TypeError('Audio settings require a plugin data directory');
 const path=join(directory,'audio-settings-v1.json');
 let queue=Promise.resolve();
 async function load(){
  try{
   const stat=await lstat(path);
   if(!stat.isFile()||stat.size>1024)return {...DEFAULT_AUDIO};
   return audioSettings(JSON.parse(await readFile(path,'utf8')));
  }catch(error){if(error.code!=='ENOENT'&&!(error instanceof SyntaxError))throw error;return {...DEFAULT_AUDIO};}
 }
 return {
  read:()=>queue.then(load),
  write(value){
   const task=queue.then(async()=>{
    const next=audioSettings(value,await load()),temp=join(directory,`.audio-${randomUUID()}.tmp`);
    try{await writeFile(temp,JSON.stringify(next)+'\n',{flag:'wx'});await rename(temp,path);}
    finally{await rm(temp,{force:true}).catch(()=>{});}
    return next;
   });
   queue=task.catch(()=>{});
   return task;
  },
 };
}
