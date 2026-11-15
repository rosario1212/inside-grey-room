import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=f=>readFileSync(f,'utf8');
const root='supabase/migrations/20261115031500_igr_v694_officer_cadence_and_roles.sql';
const sql=read(root),app=read('role-cadence-v694.js'),index=read('index.html');
const dist=process.argv[2]||'dist';
execFileSync(process.execPath,['--check','role-cadence-v694.js'],{stdio:'pipe'});
assert(sql.includes('igr_v694_officer_state')&&sql.includes('igr_v694_officer_decide'),'server-authoritative officer status/choice missing');
assert(sql.includes('igr_v694_window')&&sql.includes('60+floor(random()*61)'),'1–2 minute random windows missing');
assert(sql.includes('v694 cumulative command impact')&&sql.includes('correct_count>=5'),'all three officer decisions must affect measured consequences');
assert(sql.includes('v694 deadline guard')&&sql.includes('military order time expired'),'legacy officer endpoint must not bypass timed decisions');
assert(sql.includes('v694 new suspect per visit'),'officer should not repeat the same suspect across cycles');
assert(sql.includes('igr_v694_role_initiative')&&sql.includes("p.public_role NOT IN ('analyste','temoin')"),'analyst/witness initiative must remain role-gated');
assert(sql.includes("'verified',false")&&sql.includes("'canonical_evidence',false"),'player declarations must not become canonical evidence');
assert(sql.includes('EXISTS(SELECT 1 FROM public.igr_v4_actions a')&&sql.includes('igr_v694_role_initiative'),'one initiative per cycle is required');
assert(app.includes("STATE?.sync?.player")&&app.includes('igr694OfficerOrder')===false,'check unexpected API alias');
assert(app.includes('igr694Order')&&app.includes('igr694Initiative'),'UI buttons missing');
assert(!app.includes('innerHTML=note'),'never inject unsanitized role declarations');
assert(index.includes('role-cadence-v694.js')&&index.includes('role-cadence-v694.css'),'index entrypoints missing');
for(const builder of ['scripts/build-web.mjs','scripts/build-mobile.mjs']){
 const content=read(builder);
 assert(content.includes("'role-cadence-v694.js'")&&content.includes("'role-cadence-v694.css'"),'bundle missing in '+builder);
}
const sw=read('service-worker.js');
assert(sw.includes('role-cadence-v694.js')&&sw.includes('role-cadence-v694.css'),'PWA preload absent');
assert(read(dist+'/index.html').includes('role-cadence-v694.js'),'built entrypoint lost the role runtime');
for(const file of ['index.html','role-cadence-v694.js','role-cadence-v694.css']){
 assert(existsSync(dist+'/'+file),'bundle missing '+file+' in '+dist);
}
console.log('v694 officer/role contract: PASS');
