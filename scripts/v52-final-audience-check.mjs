import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const target=path.resolve(process.cwd(),process.argv[2]||'dist');
const req=(v,s,l)=>{if(!v.includes(s))throw new Error(`v52 missing ${l||s}`)};
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const app=await readFile(path.join(target,'app-v11.js'),'utf8');
const html=await readFile(path.join(target,'index.html'),'utf8');
const rt=await readFile(path.join(target,'final-audience-v52.js'),'utf8');
for(const x of ['0 · aucune responsabilité','1 · responsabilité secondaire','2 · responsabilité principale'])req(app,x);
if(app.includes('3 · centrale'))throw new Error('legacy level 3 remains');
for(const x of ['final_audience','final_suspect_defenses','final_lawyer_opinions'])req(app,x);
for(const x of ['igr_v52_stage_action','ME DÉFENDRE · ${defenseMinutes()}:00','DONNER MON VERDICT · ${speechMinutes()}:00','Réévaluation finale','v52_queue','v52_status'])req(rt,x);
req(html,'final-audience-v52.js?v=v52-final-audience');
const swPath=path.join(target,'service-worker.js');
if(await exists(swPath)){
  const sw=await readFile(swPath,'utf8');
  req(sw,'igr-v52-final-audience');
  req(sw,'/final-audience-v52.js?v=v52-final-audience');
}
console.log('v52 final audience checks OK');
