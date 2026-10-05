import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const runtime=path.join(target,'investigation-runtime-v42.js');
if(!(await exists(runtime)))throw new Error('v42 runtime missing from build');
const js=await readFile(runtime,'utf8');
const required=[
  "'001':`La nuit de la chambre 222",
  "'034':`Les dossiers utilisent des surnoms",
  "label:copy('Éléments d’enquête'",
  "id:'chronology'",
  'v42-objective-bottom',
  "clean(ps.objective_main)||clean(ps.position)",
  "const NON_EVIDENCE_EVENTS=new Set(['context'",
  "const EVIDENCE_EVENTS=new Set(['trame','reveal'",
  "const visible=canSeeEvidence(r)?events:[];",
  "ph==='event_confrontation'",
  "ph==='provisional_orals'",
  'v42-picker-names',
  'ensureSettings'
];
for(const marker of required)if(!js.includes(marker))throw new Error(`v42 missing: ${marker}`);
const contextTemplates=(js.match(/\{kicker:copy\('CONTEXTE [12]'/g)||[]).length;
if(contextTemplates!==2)throw new Error(`v42 must define exactly two opening context cards, found ${contextTemplates}`);
if(js.includes("CONTEXTE 3")||js.includes("CONTEXT 3"))throw new Error('v42 must not define a third opening context card');
if(/02\s*h\s*11\s*[–-]\s*03\s*h\s*10/.test(js)||/02:11\s*[–-]\s*03:10/.test(js))throw new Error('scenario 001 opening context must not reveal the later 03:10 technical timing');
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v41=html.lastIndexOf('authoritative-runtime-v41.js?v=v41-authoritative-ui');
  const v42=html.lastIndexOf('investigation-runtime-v42.js?v=v42-investigation-ui');
  if(v41<0||v42<0||v42<=v41)throw new Error(`${page}: bad v41/v42 runtime order`);
}
console.log('Inside Grey Room v42 investigation checks: OK — 34 scenarios, exactly two context cards, progressive evidence only, role-specific objective fallback.');
