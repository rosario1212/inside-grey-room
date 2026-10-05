import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'self-guided-rules-v51.js');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
if(!(await exists(runtime)))throw new Error('v51 runtime missing');
const js=await readFile(runtime,'utf8');
for(const marker of [
  'v51-self-guided-rules',
  'Tous les suspects',
  'une fois par cycle',
  'Hors Grey Room',
  'Client officiel',
  'QUE FAIRE MAINTENANT ?',
  'Comment jouer chaque rôle',
  'Tes onglets, simplement',
  'installFreeLawyerMeet',
  '1 utilisation par partie'
]){
  if(marker==='1 utilisation par partie'){
    if(!js.includes(marker))continue;
    if(!js.includes("1 utilisation par partie/i"))throw new Error('v51 does not rewrite legacy per-game lawyer wording');
  }else if(!js.includes(marker))throw new Error(`v51 missing marker: ${marker}`);
}
for(const name of ['index.html','en.html']){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v50=html.lastIndexOf('natural-role-gameplay-v50.js');
  const v51=html.lastIndexOf('self-guided-rules-v51.js?v=v51-self-guided-rules');
  if(v50<0||v51<0||v50>=v51)throw new Error(`${name}: bad v50/v51 runtime order`);
}
const sw=path.join(target,'service-worker.js');
if(await exists(sw)){
 const s=await readFile(sw,'utf8');
 if(!s.includes("const CACHE='igr-v51-self-guided-rules';"))throw new Error('v51 cache namespace missing');
 if(!s.includes('/self-guided-rules-v51.js?v=v51-self-guided-rules'))throw new Error('v51 runtime not precached');
}
console.log('Inside Grey Room v51 rules checks: OK');
