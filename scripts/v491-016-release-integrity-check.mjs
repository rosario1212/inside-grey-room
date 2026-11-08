import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const db=await readFile('supabase/migrations/20261025192406_igr_v480_016_private_release_engine.sql','utf8');
const expert=await readFile('supabase/migrations/20261025193141_igr_v490_016_expert_cycle_access_guard.sql','utf8');
const finalizer=await readFile('scripts/finalize-cartel030-release.mjs','utf8');
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
const intro=app.slice(app.indexOf("id:'016'"),app.indexOf("id:'017'"));
assert(intro.includes('min:5,max:9'),'016 must accept 5 to 9 players');
assert(intro.includes('Les circonstances exactes de sa mort restent hors champ'),'016 premise not neutral');
assert(!intro.includes('geste fatal'),'016 public spoilers not allowed');
assert(app.includes("'016':{required:['Enquêteur','Analyste','3 suspects'],optional:['Avocat','Journaliste','Juge','Expert']}"),'016 roles wrong');
for(const part of ["'016'?'investigation_016'","igr_v485_016_investigate","payload.reconstruction_016","igr016After","igr016Death","igr016Warning","sixteenReconstruction", "currentCase==='016'?'reconstruction_016'","'after_video','death','warning'"]){
 assert(app.includes(part),'016 interactive private case missing: '+part);
}
for(const part of ['igr_private.igr_v480_016_build_pack','igr_private.igr_v480_016_safe_pack','igr_private.igr_v481_016_pin_room','igr_private.igr_v481_016_release_status','igr_private.igr_v489_016_room_release_guard','igr_v485_016_investigate','igr_v487_016_reveal_enrich','public.igr_v4_lock_final','reconstruction_016','investigation_016']){
 assert(db.includes(part),'016 private migration missing: '+part);
}
assert(db.includes("before insert or update of scenario_id")||db.includes("BEFORE INSERT OR UPDATE OF scenario_id"),'016 room guard missing');
assert(db.includes("from public,anon,authenticated")||db.includes("FROM public,anon,authenticated"),'016 private privileges not revoked');
assert(db.includes("'016'"),'016 backend path absent');
assert(expert.includes("r.scenario_id in (''003'',''009'',''016'')"),'016 forensic cycle guard missing');
assert(expert.includes("THEN CONTINUE"),'future forensic catalog data must not appear');
assert(!app.includes("variant_id==='B'"),'canon variant must not be exposed to frontend');
const cache='v647-006-fiches-220';
assert(html.includes('app-v11.js?v='+cache),'016 source client cache missing');
const serviceWorkerCache=sw.match(/const CACHE='([^']+)'/)?.[1];
assert(serviceWorkerCache?.startsWith('igr-'+cache),'016 service-worker must retain the released 016 base and allow newer cache versions');
const omertaScript=html.match(/omerta-money-intel-v1\.js\?v=[^"']+/)?.[0];
assert(omertaScript&&sw.includes('/'+omertaScript),'Omerta standalone script and offline asset must share the same version');
assert(serviceWorkerCache!=='igr-'+cache,'Omerta standalone fix must invalidate the previous installed PWA cache');
assert(sw.includes('/app-v11.js?v='+cache),'016 app shell cache missing');
assert(finalizer.includes("const clientVersion='"+cache+"'"),'production builder would reinstate stale 016 cache');
console.log('016 release gate: 5–9 roles, 3-axis final, private A/B/C pinned runtime, secured optional Expert, and PWA coherence PASS');
