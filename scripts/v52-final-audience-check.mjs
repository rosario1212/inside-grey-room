import {readFile} from'node:fs/promises';
import path from'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const req=(v,s,l)=>{if(!v.includes(s))throw new Error(`v52 missing ${l||s}`)};
const files=['final-audience-v52.js'];
for(const f of files){const v=await readFile(path.join(root,f),'utf8');req(v,'igr_v52_stage_action');req(v,'PRENDRE LA PAROLE');}
const built=await readFile(path.join(target,'final-audience-v52.js'),'utf8');
for(const x of ['Finale','PRENDRE LA PAROLE','PASSER','TERMINER MON INTERVENTION','ME DÉFENDRE','Réévaluation finale'])req(built,x);
const index=await readFile(path.join(target,'index.html'),'utf8');req(index,'final-audience-v52.js?v=v52-final-audience');
const sw=await readFile(path.join(target,'service-worker.js'),'utf8');req(sw,'/final-audience-v52.js?v=v52-final-audience');
console.log('Inside Grey Room v52 final audience checks: OK');
