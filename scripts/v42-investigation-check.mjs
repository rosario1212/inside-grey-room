import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const runtime=path.join(target,'investigation-runtime-v42.js');
if(!(await exists(runtime)))throw new Error('v42 runtime missing from build');
const js=await readFile(runtime,'utf8');
const required=[
  "'001':`Fenêtre à reconstruire",
  "'034':`Les dossiers utilisent des surnoms",
  "label:copy('Éléments d’enquête'",
  "id:'chronology'",
  'v42-objective-bottom',
  "ph==='event_confrontation'",
  "ph==='provisional_orals'",
  'v42-picker-names',
  'ensureSettings'
];
for(const marker of required)if(!js.includes(marker))throw new Error(`v42 missing: ${marker}`);
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v41=html.lastIndexOf('authoritative-runtime-v41.js?v=v41-authoritative-ui');
  const v42=html.lastIndexOf('investigation-runtime-v42.js?v=v42-investigation-ui');
  if(v41<0||v42<0||v42<=v41)throw new Error(`${page}: bad v41/v42 runtime order`);
}
console.log('Inside Grey Room v42 investigation checks: OK');
