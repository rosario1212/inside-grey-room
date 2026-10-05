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
for(const f of [runtime,sourceRuntime,migration,app])if(!(await exists(f)))throw new Error(`v45 check missing ${f}`);
for(const f of [runtime,sourceRuntime]){
  const syntax=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if(syntax.status!==0)throw new Error(`${path.basename(f)} syntax error: ${syntax.stderr||syntax.stdout}`);
}
const js=await readFile(runtime,'utf8');
const sql=await readFile(migration,'utf8');
const appJs=await readFile(app,'utf8');
const swJs=(await exists(sw))?await readFile(sw,'utf8'):null;
for(const marker of ['v45-lawyer-dismissal','igr_v45_lawyer_state','igr_v45_dismiss_lawyer','Mettre fin Ã  la reprÃ©sentation','tu ne pourras plus demander de nouvel avocat officiel'])if(!js.includes(marker))throw new Error(`v45 runtime marker missing: ${marker}`);
for(const marker of ['igr_v45_lawyer_dismissals','igr_v45_block_rehire_after_dismissal','igr_v45_lawyer_s¶»§q«^