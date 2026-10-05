import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'prosecutor-runtime-v47.js');
const sw=path.join(target,'service-worker.js');
const audit=path.join(root,'PROSECUTOR_ROLE_AUDIT_V47.md');
const migration=path.join(root,'supabase/migrations/20261005_prosecutor_role_v47.sql');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const f of [runtime,audit,migration])if(!(await exists(f)))throw new Error(`v47 check missing ${f}`);
const syntax=spawnSync(process.execPath,['--check',runtime],{encoding:'utf8'});
if(syntax.status!==0)throw new Error(`prosecutor-runtime-v47.js syntax error: ${syntax.stderr||syntax.stdout}`);
const js=await readFile(runtime,'utf8');
const md=await readFile(audit,'utf8');
const sql=await readFile(migration,'utf8');
for(const marker of ['v47-prosecutor','PARQUET','CONVOCATION DU PROCUREUR','CONFIRMER ET REJOINDRE','igr_v47_prosecutor_state','igr_v47_prosecutor_summon','igr_v47_offer_cooperation','Juge → Procureur → Enquêteur','PROPOSITION DU PARQUET'])if(!js.includes(marker))throw new Error(`v47 runtime marker missing: ${marker}`);
for(const marker of ['igr_v47_prosecutor_runtime','igr_v47_prosecutor_interviews','igr_v47_prosecutor_cooperations','igr_v47_require_prosecutor_cycle_interview','igr_v47_make_reveal','prosecutor_level','authority_role'])if(!sql.includes(marker))throw new Error(`v47 migration marker missing: ${marker}`);
for(const marker of ['v47_prosecutor_integration_tests_ok','Juge → Procureur → Enquêteur','2 minutes','Avocat','corrompu','100 %'])if(!md.includes(marker))throw new Error(`v47 audit marker missing: ${marker}`);
if(/entretien ciblé de 3 minutes|ENTRETIEN ACCEPTÉ|ENTRETIEN REFUSÉ/.test(js))throw new Error('v47 runtime reintroduced old 3-minute accept/refuse Prosecutor flow');
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);if(!(await exists(file)))continue;
 const html=await readFile(file,'utf8');
 const a=html.lastIndexOf('judicial-runtime-v44.js'),b=html.lastIndexOf('lawyer-dismissal-v45.js'),c=html.lastIndexOf('timer-runtime-v46.js'),d=html.lastIndexOf('prosecutor-runtime-v47.js');
 if(!(a>=0&&a<b&&b<c&&c<d))throw new Error(`${page}: bad v44/v45/v46/v47 runtime order`);
}
if(await exists(sw)){
 const text=await readFile(sw,'utf8');
 if(!text.includes("const CACHE='igr-v47-prosecutor';"))throw new Error('v47 cache namespace missing');
 if(!text.includes('/prosecutor-runtime-v47.js?v=v47-prosecutor'))throw new Error('v47 runtime missing from service-worker precache');
}
console.log('Inside Grey Room v47 Prosecutor checks: OK');
