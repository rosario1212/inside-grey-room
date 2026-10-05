import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'public-broadcasts-v49.js');
const sw=path.join(target,'service-worker.js');
const migration=path.join(root,'supabase/migrations/20261005_public_broadcasts_expert_v49.sql');
const audit=path.join(root,'PUBLIC_BROADCASTS_AUDIT_V49.md');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const f of [runtime,migration,audit])if(!(await exists(f)))throw new Error(`v49 check missing ${f}`);
const syntax=spawnSync(process.execPath,['--check',runtime],{encoding:'utf8'});
if(syntax.status!==0)throw new Error(`public-broadcasts-v49.js syntax error: ${syntax.stderr||syntax.stdout}`);
const js=await readFile(runtime,'utf8');
const sql=await readFile(migration,'utf8');
const md=await readFile(audit,'utf8');
for(const marker of ['breaking_news','expert_public','Présenter publiquement','PUBLIC · VISIBLE PAR TOUS','igr_v49_publish_expert_result','igr_v49_expert_public_state','Chronologie'])if(!js.includes(marker))throw new Error(`v49 runtime marker missing: ${marker}`);
for(const marker of ["'breaking_news',\n    'public'","'expert_public',\n    'public'",'public_broadcast','igr_v49_publish_expert_result','igr_v49_expert_public_state'])if(!sql.includes(marker))throw new Error(`v49 SQL marker missing: ${marker}`);
for(const marker of ['v49_public_broadcast_tests_ok','Breaking News','Expertise publique','Chronologie','Éléments d’enquête'])if(!md.includes(marker))throw new Error(`v49 audit marker missing: ${marker}`);
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v49=html.lastIndexOf('public-broadcasts-v49.js?v=v49-public-broadcasts');
  if(v49<0)throw new Error(`${page}: v49 runtime missing`);
  if(/<script[^>]+src=/i.test(html.slice(v49+'public-broadcasts-v49.js?v=v49-public-broadcasts'.length)))throw new Error(`${page}: v49 runtime is not last`);
}
if(await exists(sw)){
  const text=await readFile(sw,'utf8');
  if(!text.includes("const CACHE='igr-v49-public-broadcasts';"))throw new Error('v49 cache namespace missing');
  if(!text.includes('/public-broadcasts-v49.js?v=v49-public-broadcasts'))throw new Error('v49 runtime missing from precache');
}
console.log('Inside Grey Room v49 public broadcast checks: OK');
