import {readFile,readdir} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
export const root=resolve(import.meta.dirname,'../..');
export const sha=b=>createHash('sha256').update(b).digest('hex');
export async function inventory(directory,{filter=()=>true}={}){const rows=[];async function visit(dir){for(const e of(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const path=join(dir,e.name),rel=relative(directory,path).replaceAll('\\','/');if(!filter(rel,e))continue;if(e.isSymbolicLink())throw Error('Evidence refuses links: '+path);if(e.isDirectory())await visit(path);else if(e.isFile()){const data=await readFile(path);rows.push({path:rel,bytes:data.length,sha256:sha(data)});}}}await visit(directory);return rows;}
export async function snapshot(){
 const rows=[];
 for(const dir of ['contracts','plugins/card-games','tests/games','scripts']){
  for(const row of await inventory(join(root,dir)))rows.push({...row,path:dir+'/'+row.path});
 }
 for(const name of ['package.json','package-lock.json','HOST-CONTRACT.md','README.md','LICENSE.md','THIRD-PARTY-NOTICES.md','RELEASE-NOTES.md']){
  const data=await readFile(join(root,name));
  rows.push({path:name,bytes:data.length,sha256:sha(data)});
 }
 rows.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 return {sha256:sha(JSON.stringify(rows)),files:rows};
}
