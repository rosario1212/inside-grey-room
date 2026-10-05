import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime=path.join(target,'lawyer-dismissal-v45.js');
const sourceRuntime=path.join(root,'lawyer-dismissal-v45.js');
const migration=path.join(root,'supabase/migrations/20261005_lawyer_client_dismissal_v45.sql');
const app=path.join(target,'app-v11.js');
const sw=path.join(target,'service-worker.js');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const f of [runtime,sourceRuntime,migration,app,sw])if(!(await exists(f)))throw new Error(`v45 check missing ${f}`);
for(const f of [runtime,sourceRuntime]){
  const syntax=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if(syntax.status!==0)throw new Error(`${path.basename(f)} syntax error: ${syntax.stderr||syntax.stdout}`);
}
const js=await readFile(runtime,'utf8');
const sql=await readFile(migration,'utf8');
const appJs=await readFile(app,'utf8');
const swJs=await readFile(sw,'utf8');
for(const marker of ['v45-lawyer-dismissal','igr_v45_lawyer_state','igr_v45_dismiss_lawyer','Mettre fin à la représentation','tu ne pourras plus demander de nouvel avocat officiel'])if(!js.includes(marker))throw new Error(`v45 runtime marker missing: ${marker}`);
for(const marker of ['igr_v45_lawyer_dismissals','igr_v45_block_rehire_after_dismissal','igr_v45_lawyer_state','igr_v45_dismiss_lawyer','representation permanently ended by suspect','can_request_new_lawyer'])if(!sql.includes(marker))throw new Error(`v45 migration marker missing: ${marker}`);
if(!/primary key \(room_code,suspect_id\)/.test(sql))throw new Error('v45 dismissal must be one-use per suspect and room');
if(!sql.includes("delete from public.igr_v43_lawyer_representations"))throw new Error('v45 must release the lawyer after dismissal');
if(!appJs.includes('/service-worker.js?v=v45-lawyer-dismissal'))throw new Error('v45 service worker registration missing');
if(!swJs.includes("const CACHE='igr-v45-lawyer-dismissal';"))throw new Error('v45 cache namespace missing');
if(!swJs.includes('/lawyer-dismissal-v45.js?v=v45-lawyer-dismissal'))throw new Error('v45 runtime missing from precache');
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const count=(html.match(/lawyer-dismissal-v45\.js/g)||[]).length;
  if(count!==1)throw new Error(`${page}: expected one v45 dismissal runtime`);
  const v44=html.lastIndexOf('judicial-runtime-v44.js');
  const v45=html.lastIndexOf('lawyer-dismissal-v45.js');
  if(!(v44>=0&&v44<v45))throw new Error(`${page}: expected v44 < v45`);
  const after=html.slice(v45+'lawyer-dismissal-v45.js'.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${page}: v45 dismissal runtime must be last external script`);
}
console.log('Inside Grey Room v45 lawyer dismissal checks: OK');
