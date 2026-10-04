import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const read=rel=>readFile(path.join(root,rel),'utf8');
const exists=async f=>{try{await stat(f);return true}catch{return false}};

const runtime=await read('authoritative-runtime-v41.js');
const migration=await read('supabase/migrations/20261004_gameplay_corrections_v41.sql');
const pkg=await read('package.json');
const parsed=spawnSync(process.execPath,['--check',path.join(root,'authoritative-runtime-v41.js')],{encoding:'utf8'});
ok(parsed.status===0,`authoritative-runtime-v41.js syntax: ${parsed.stderr||parsed.stdout}`);

for(const marker of [
  "typeof STATE!=='undefined'",
  'objective_main',
  "room()?.phase==='event_select'",
  "'CHOIX DE L’ÉVÉNEMENT'",
  "'ce que tu gardes pour toi'",
  "'ce que tu caches'",
  'igrTopSettings',
  'IGR_AUTHORITATIVE_V41'
])ok(runtime.includes(marker),`v41 runtime missing ${marker}`);

ok(migration.includes('if p_cycle=3 then return 1; end if;'),'C3 must return to one interrogation for every core scenario');
ok(migration.includes("igr_v35_room_seconds(r.code,'interrogation')"),'cycle copy must use the selected duration mode');
ok(migration.includes('igr_v35_seconds_label'),'cycle copy must format duration dynamically');
ok(!migration.includes("when lim>=2 then 'Trois actions au choix. Sans Analyste"),'legacy C3 no-Analyst exception must be gone');
ok(pkg.includes('scripts/apply-authoritative-v41.mjs dist'),'web build must finish with v41');
ok(pkg.includes('scripts/apply-authoritative-v41.mjs www'),'mobile build must finish with v41');
ok(!pkg.includes('scripts/apply-authoritative-v39.mjs dist')&&!pkg.includes('scripts/apply-authoritative-v39.mjs www'),'v39 must no longer be a final build owner');

if(await exists(target)){
  for(const page of ['index.html','en.html']){
    const f=path.join(target,page);if(!(await exists(f)))continue;
    const html=await readFile(f,'utf8');
    const count=(html.match(/authoritative-runtime-v41\.js/g)||[]).length;
    ok(count===1,`${page}: expected exactly one v41 runtime, got ${count}`);
    ok(!/authoritative-runtime-v(?:39|40)\.js|gameplay-state-fix-v3[78]\.js/.test(html),`${page}: legacy gameplay owner still loaded`);
    const v41=html.lastIndexOf('authoritative-runtime-v41.js');
    const lastScript=html.lastIndexOf('<script');
    ok(v41>=0&&lastScript>=0&&html.slice(lastScript).includes('authoritative-runtime-v41.js'),`${page}: v41 must be the last script`);
  }
  const sw=await readFile(path.join(target,'service-worker.js'),'utf8');
  const app=await readFile(path.join(target,'app-v11.js'),'utf8');
  ok(sw.includes("const CACHE='igr-v41-authoritative-ui';"),'built service worker must use v41 cache namespace');
  ok(sw.includes('/authoritative-runtime-v41.js?v=v41-authoritative-ui'),'built service worker must precache v41 runtime');
  ok(app.includes('/service-worker.js?v=v41-authoritative-ui'),'built app must request v41 service worker URL');
}

if(failures.length){console.error('\nV41 correction regression check FAILED:\n- '+failures.join('\n- '));process.exit(1)}
console.log('V41 gameplay correction regression check passed.');
