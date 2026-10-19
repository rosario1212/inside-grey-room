import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),dest=path.resolve(process.argv[2]||'dist');
const [source,sql,html,en,built]=await Promise.all([
 readFile('cartel029-v107.js','utf8'),
 readFile('supabase/migrations/20261019023000_v107_cartel029_report_and_public_pressure.sql','utf8'),
 readFile(path.join(dest,'index.html'),'utf8'),readFile(path.join(dest,'en.html'),'utf8'),
 readFile(path.join(dest,'cartel029-v107.js'),'utf8')
]);
for(const file of ['cartel029-v107.js','scripts/apply-cartel029-v107.mjs']){
 const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 assert.equal(check.status,0,file+': '+check.stderr);
}
assert.equal(source,built);
for(const page of [html,en]){
 assert.match(page,/cartel029-v107\.js\?v=v107-cartel029/);
 assert(page.indexOf('common-dossier-v106.js')<page.indexOf('cartel029-v107.js'));
}
assert.match(source,/room\?\.scenario_id==='029'/);
assert.match(source,/cartel029_ready===true/,'new-story UI must stay off until backend confirms readiness');
assert.match(source,/\['enqueteur','analyste'\]/);
assert.match(source,/igr_v107_029_report/);
assert.match(source,/if\(state\(\)\?\.tab==='timeline'\)/);
assert.match(source,/if\(state\(\)\?\.tab==='investigation'&&member\(\)\)/);
assert(!source.includes('V5')&&!source.includes('F01')&&!source.includes('Lorena Cruz'),'Private clues must not enter public JS');
assert.match(sql,/create table if not exists igr_private\.igr_v107_029_editorial_matrix/i);
assert.match(sql,/check\(not public_enabled or editorial_status='approved'\)/);
assert.match(sql,/revoke all on igr_private\.igr_v107_029_editorial_matrix from public,anon,authenticated/i);
assert.match(sql,/alter table public\.igr_v107_029_reports enable row level security/i);
assert.match(sql,/actor\.public_role not in \('enqueteur','analyste'\)/);
assert.match(sql,/actor\.public_role<>'enqueteur'/);
assert.match(sql,/room\.cycle<>3/);
assert.match(sql,/new\.scenario_id<>'029'/);
assert.match(sql,/old\.cycle is distinct from 2/);
assert.match(sql,/old\.cycle is distinct from 3/);
assert.match(sql,/threat_not_confirmed/);
assert.match(sql,/MESSAGE DE LOS SALCEDO · OUVERTURE/);
assert.match(sql,/MESSAGE DE LOS SALCEDO · LA FUITE/);
assert.match(sql,/MESSAGE DE LOS SALCEDO · LES VINGT CAPTIFS/);
assert.doesNotMatch(sql,/\bGRANT SELECT\b/i);
let sw=null;try{sw=await readFile(path.join(dest,'service-worker.js'),'utf8')}catch(e){if(e.code!=='ENOENT'||!dest.endsWith('/www'))throw e}
if(sw!==null)assert.match(sw,/cartel029-v107\.js\?v=v107-cartel029/);
const [gateSql,safetySql,readySql]=await Promise.all([
 readFile('supabase/migrations/20261019032000_v108_cartel029_private_four_witness_gate.sql','utf8'),
 readFile('supabase/migrations/20261019034500_v109_cartel029_no_half_live_release.sql','utf8'),
 readFile('supabase/migrations/20261019035500_v110_cartel029_public_ready_handshake.sql','utf8')
]);
assert.match(gateSql,/passed_end_to_end_testing/);
assert.match(gateSql,/manually_activated/);
assert.match(gateSql,/scenario_id='029' and editorial_status='approved' and approved_at is not null/);
assert.match(gateSql,/return 4; end if;/);
assert.match(gateSql,/igr_v108_029_room_variants/);
assert.match(gateSql,/not igr_private\.igr_v108_029_is_enabled\(\)/);
assert.match(safetySql,/igr_v108_029_is_enabled/);
assert.match(readySql,/cartel029_ready/);
const [releaseSql,interviewSql]=await Promise.all([
 readFile('supabase/migrations/20261019042000_v111_cartel029_private_revelations.sql','utf8'),
 readFile('supabase/migrations/20261019043800_v112_cartel029_first_interviews.sql','utf8')
]);
assert.match(releaseSql,/igr_v108_029_is_enabled/);
assert.match(releaseSql,/audience_roles,cycle,payload/);
assert.match(releaseSql,/\('P11','P12','P13','P14','P15','P16'\)/);
assert.match(releaseSql,/target_player_id,cycle,payload/);
assert.match(interviewSql,/old\.phase<>'interrogation'/);
assert.match(interviewSql,/new\.cycle<>1/);
assert.match(interviewSql,/igr_v108_029_is_enabled/);
assert.match(interviewSql,/\('interrogation_select','cycle_debrief'\)/);
assert.match(interviewSql,/PIÈCE P02 · LE COLIS/);
assert.doesNotMatch(source,/Óscar Beltrán|León Trejo|Lorena Cruz|Efraín Montes/);

console.log('029 v107: no private leaks, role-gated report, cycle messages and web/mobile assets PASS');
