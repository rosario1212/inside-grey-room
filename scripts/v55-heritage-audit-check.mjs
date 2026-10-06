import {readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)},read=p=>readFile(path.join(root,p),'utf8');
for(const p of ['heritage-audit-v55.js','scripts/apply-heritage-audit-v55.mjs']){const r=spawnSync(process.execPath,['--check',path.join(root,p)],{encoding:'utf8'});ok(r.status===0,`${p} syntax: ${r.stderr||r.stdout}`)}
const runtime=await read('heritage-audit-v55.js'),generic=await read('heritage-play-v13-7.js'),maitre=await read('heritage-maitre-online-v34-4.js'),migration=await read('supabase/migrations/20261006_heritage_multiplayer_audit_v55.sql');
ok(runtime.includes('MA CARTE PRIVÉE'),'v55 personal role card missing');
ok(runtime.includes('À FAIRE MAINTENANT'),'v55 immediate role objective missing');
ok(runtime.includes('data-h55-decide'),'v55 Judge decision control missing');
ok(runtime.includes('DOSSIER VIVANT'),'v55 MAÎTRE compact dossier missing');
ok(generic.includes('roleCard:(campaign,chapter,roleId)'),'CENDRES/KUROI safe role-card accessor missing');
ok(maitre.includes("roleCard:(chapter,roleId,variantKey)"),'MAÎTRE safe role-card accessor missing');
ok(migration.includes("set role_id='avocat',ready=false"),'MAÎTRE host must become Avocat');
ok(migration.includes("v_player.role_id<>'juge'"),'MAÎTRE judge-authority guard missing');
ok(migration.includes('igr_heritage_online_decide_v55'),'v55 decision RPC missing');
try{
  await stat(path.join(target,'index.html'));
  const html=await readFile(path.join(target,'index.html'),'utf8'),sw=await readFile(path.join(target,'service-worker.js'),'utf8');
  ok(html.includes('heritage-audit-v55.css?v=v55-heritage-audit'),'dist missing v55 CSS');
  ok(html.includes('heritage-audit-v55.js?v=v55-heritage-audit'),'dist missing v55 runtime');
  ok(html.lastIndexOf('heritage-audit-v55.js')>html.lastIndexOf('heritage-maitre-online-v34-4.js'),'v55 must load after MAÎTRE online runtime');
  ok(sw.includes("const CACHE='igr-v55-heritage-audit';")||sw.includes("const CACHE='igr-v56-objective-dedupe';"),'service worker cache is older than v55');
  ok(sw.includes('/heritage-audit-v55.js?v=v55-heritage-audit'),'service worker missing v55 runtime');
}catch{}
if(fail.length){console.error('\nHÉRITAGE v55 audit check FAILED:\n- '+fail.join('\n- '));process.exit(1)}
console.log('HÉRITAGE v55 audit checks OK');
