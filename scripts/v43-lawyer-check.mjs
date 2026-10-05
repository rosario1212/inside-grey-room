import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'lawyer-runtime-v43.js');
const app=path.join(target,'app-v11.js');
const migration=path.join(root,'supabase/migrations/20261005_lawyer_role_v43.sql');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const f of [runtime,app,migration])if(!(await exists(f)))throw new Error(`v43 check missing ${f}`);

const syntax=spawnSync(process.execPath,['--check',runtime],{encoding:'utf8'});
if(syntax.status!==0)throw new Error(`v43 runtime syntax error: ${syntax.stderr||syntax.stdout}`);
const js=await readFile(runtime,'utf8');
const sourceApp=await readFile(app,'utf8');
const sql=await readFile(migration,'utf8');

for(const marker of [
  'igr_v43_lawyer_state','igr_v43_request_lawyer','igr_v43_refuse_lawyer','igr_v43_accept_lawyer',
  'can_request_again','one_pending','security definer','set search_path to \'public\''
])if(!sql.includes(marker))throw new Error(`v43 migration marker missing: ${marker}`);

for(const marker of [
  'Rencontrer · 1 min','Demander à nouveau l’avocat','unique client officiel','CONSULTATIONS OFFICIEUSES',
  'may never invent information','AVANT LES CONCLUSIONS PROVISOIRES','window.confirm'
])if(!js.includes(marker))throw new Error(`v43 runtime marker missing: ${marker}`);

if(!sourceApp.includes('unique client officiel'))throw new Error('built app does not contain the one-client lawyer rule');
if(sourceApp.includes('Avocat : peut défendre plusieurs clients compatibles'))throw new Error('legacy multi-client manual copy survived');

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const count=(html.match(/lawyer-runtime-v43\.js/g)||[]).length;
  if(count!==1)throw new Error(`${page}: expected one v43 runtime, found ${count}`);
  if(html.lastIndexOf('lawyer-runtime-v43.js')<html.lastIndexOf('investigation-audit-v42-1.js'))throw new Error(`${page}: v43 must load after v42 audit`);
}

console.log('Inside Grey Room v43 lawyer checks: OK');
