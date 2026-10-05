import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v48-institution-3min';
const CACHE='igr-v48-institution-3min';
const judge=path.join(target,'judicial-runtime-v44.js');
const prosecutor=path.join(target,'prosecutor-runtime-v47.js');
const migration=path.join(root,'supabase/migrations/20261005_institution_interviews_three_minutes_v48.sql');
const sw=path.join(target,'service-worker.js');
const app=path.join(target,'app-v11.js');
const exists=async f=>{try{await stat(f);return true}catch{return false}};

for(const f of [judge,prosecutor,migration])if(!(await exists(f)))throw new Error(`v48 check missing ${f}`);
const j=await readFile(judge,'utf8');
const p=await readFile(prosecutor,'utf8');
const sql=await readFile(migration,'utf8');

for(const marker of ['AU CABINET DU JUGE · 3 MIN MAX','Convoquer · 3 min'])if(!j.includes(marker))throw new Error(`v48 Judge marker missing: ${marker}`);
if(!j.includes('RÉEXAMEN · 2 MIN'))throw new Error('v48 must keep the Judge joint review at 2 minutes');
if(j.includes('AU CABINET DU JUGE · 2 MIN MAX')||j.includes('Convoquer · 2 min'))throw new Error('v48 stale 2-minute Judge summons copy remains');

for(const marker of ['Entretien du Parquet · 3 min','ENTRETIEN DU PARQUET · 3 MIN MAX','Convoquer · 3 min','pendant les 3 minutes.'])if(!p.includes(marker))throw new Error(`v48 Prosecutor marker missing: ${marker}`);
for(const stale of ['Entretien du Parquet · 2 min','ENTRETIEN DU PARQUET · 2 MIN MAX','Convoquer · 2 min','pendant les 2 minutes.','convocations de 2 minutes'])if(p.includes(stale))throw new Error(`v48 stale Prosecutor duration remains: ${stale}`);

for(const marker of ["interval '3 minutes'","'seconds',180",'entretien de 3 minutes','pendant 3 minutes'])if(!sql.includes(marker))throw new Error(`v48 migration marker missing: ${marker}`);

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  if(!html.includes(`judicial-runtime-v44.js?v=${VERSION}`))throw new Error(`${page}: Judge runtime cache-bust missing`);
  if(!html.includes(`prosecutor-runtime-v47.js?v=${VERSION}`))throw new Error(`${page}: Prosecutor runtime cache-bust missing`);
}
if(await exists(app)){
  const text=await readFile(app,'utf8');
  if(!text.includes(`/service-worker.js?v=${VERSION}`))throw new Error('v48 service-worker registration is stale');
}
if(await exists(sw)){
  const text=await readFile(sw,'utf8');
  if(!text.includes(`const CACHE='${CACHE}';`))throw new Error('v48 service-worker cache namespace missing');
  if(!text.includes(`/judicial-runtime-v44.js?v=${VERSION}`)||!text.includes(`/prosecutor-runtime-v47.js?v=${VERSION}`))throw new Error('v48 service-worker institutional runtime URLs missing');
}

console.log('Inside Grey Room v48 institutional interview checks: OK');
