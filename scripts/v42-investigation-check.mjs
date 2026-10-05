import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const runtime=path.join(target,'investigation-runtime-v42.js');
const audit=path.join(target,'investigation-audit-v42-1.js');
const migration=path.join(root,'supabase','migrations','20261005_v42_audit_hardening.sql');

for(const [file,label] of [[runtime,'v42 runtime'],[audit,'v42.1 audit runtime'],[migration,'v42 audit migration']]){
  if(!(await exists(file)))throw new Error(`${label} missing`);
}

const js=await readFile(runtime,'utf8');
const auditJs=await readFile(audit,'utf8');
const sql=await readFile(migration,'utf8');
const coreIds=Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0'));
const dlcIds=Array.from({length:14},(_,i)=>String(i+21).padStart(3,'0'));
const hasKey=(block,id)=>new RegExp(`['"]${id}['"]\\s*:`).test(block);
const sliceBetween=(source,start,end)=>{
  const a=source.indexOf(start);
  if(a<0)throw new Error(`missing block start: ${start}`);
  const b=source.indexOf(end,a+start.length);
  if(b<0)throw new Error(`missing block end after: ${start}`);
  return source.slice(a+start.length,b);
};

const frContexts=sliceBetween(js,'const CONTEXT_HINTS={','};\nconst CONTEXT_HINTS_EN=');
for(const id of coreIds)if(!hasKey(frContexts,id))throw new Error(`v42 French context missing for scenario ${id}`);

const enSituations=sliceBetween(auditJs,'const CONTEXT_SITUATIONS_EN=Object.freeze({','});\n\nconst CONTEXT_HINTS_EN=');
const enHints=sliceBetween(auditJs,'const CONTEXT_HINTS_EN=Object.freeze({','});\n\nfunction interrogationSeconds');
for(const id of dlcIds){
  if(!hasKey(enSituations,id))throw new Error(`v42.1 English situation missing for scenario ${id}`);
  if(!hasKey(enHints,id))throw new Error(`v42.1 English starting points missing for scenario ${id}`);
}

for(const marker of [
  'IGR_INVESTIGATION_V42',
  "label:copy('Éléments d’enquête'",
  "id:'chronology'",
  'v42-objective-bottom',
  "ph==='event_confrontation'",
  "ph==='provisional_orals'",
  'v42-picker-names',
  'ensureSettings'
])if(!js.includes(marker))throw new Error(`v42 missing: ${marker}`);

for(const marker of [
  'IGR_INVESTIGATION_AUDIT_V42_1',
  'interrogation_seconds',
  'function interrogationSeconds()',
  'function durationLabel(',
  'renderInterrogationSelect=v421InterrogationSelect',
  'CONTEXT_SITUATIONS_EN',
  'CONTEXT_HINTS_EN'
])if(!auditJs.includes(marker))throw new Error(`v42.1 audit missing: ${marker}`);

if(/Interroger\s*·\s*8\s*min/i.test(auditJs))throw new Error('v42.1 audit must not hard-code an 8-minute interrogation label');

const expectedSuspects={
  '021':7,'022':7,'023':7,'024':8,'025':9,
  '026':3,'027':3,'028':3,'029':3,'030':3,'031':3,'032':3,'033':3,'034':3
};
const objectiveCounts=Object.fromEntries(dlcIds.map(id=>[id,0]));
const objectiveSlots=new Set();
const tupleRe=/\('(\d{3})',(\d+),'((?:[^']|'')*)'\)/g;
let match,totalObjectives=0;
while((match=tupleRe.exec(sql))){
  const [,id,slotText,objective]=match;
  if(!(id in expectedSuspects))continue;
  const slot=Number(slotText);
  if(!objective.trim())throw new Error(`empty objective for ${id} slot ${slot}`);
  const key=`${id}:${slot}`;
  if(objectiveSlots.has(key))throw new Error(`duplicate objective tuple ${key}`);
  objectiveSlots.add(key);
  objectiveCounts[id]+=1;
  totalObjectives+=1;
}
if(totalObjectives!==65)throw new Error(`expected 65 objectives for 021–034, found ${totalObjectives}`);
for(const [id,count] of Object.entries(expectedSuspects)){
  if(objectiveCounts[id]!==count)throw new Error(`scenario ${id}: expected ${count} objectives, found ${objectiveCounts[id]}`);
  for(let slot=1;slot<=count;slot++)if(!objectiveSlots.has(`${id}:${slot}`))throw new Error(`scenario ${id}: objective missing for slot ${slot}`);
}

for(const marker of [
  'igr_v42_valid_core_pack',
  'igr_v42_core_pack_integrity',
  "scenario_id between '001' and '034'",
  "p_pack->>'context'",
  "p_pack->'suspects'",
  "s->>'chronology'",
  "s->>'hide'",
  "s->>'anchors'",
  "s->>'position'",
  "s->>'objective_main'",
  "p_pack->'trames'",
  "t->>'title'",
  "t->>'text'",
  "t->>'min_cycle'",
  "'{interrogation_seconds}'",
  'igr_v35_room_seconds'
])if(!sql.includes(marker))throw new Error(`v42 database content contract missing: ${marker}`);

if(!/count\(\*\)[\s\S]*scenario_id between '001' and '034'[\s\S]*<>34/.test(sql)){
  throw new Error('v42 migration must assert that exactly 34 core scenario packs exist');
}

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v41=html.lastIndexOf('authoritative-runtime-v41.js?v=v41-authoritative-ui');
  const v42=html.lastIndexOf('investigation-runtime-v42.js?v=v42-investigation-ui');
  const auditPos=html.lastIndexOf('investigation-audit-v42-1.js?v=v42.1-investigation-audit');
  if(v41<0||v42<0||auditPos<0||!(v41<v42&&v42<auditPos))throw new Error(`${page}: bad v41/v42/v42.1 runtime order`);
}

console.log('Inside Grey Room v42/v42.1 investigation checks: 34 scenario contexts, 65 DLC objectives, dynamic duration and database content contract OK');
