import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const names=["20261025000000_igr_v450_015_private_pack_preview.sql","20261025000100_igr_v451_015_private_pinned_variants.sql","20261025000200_igr_v452_015_pin_on_start.sql","20261025000300_igr_v453_015_private_pack_readers.sql","20261025000400_igr_v454_015_investigation_sync.sql","20261025000500_igr_v455_015_private_investigations.sql","20261025000600_igr_v456_015_final_lock.sql","20261025000700_igr_v457_015_reconstruction_scoring.sql","20261025000900_igr_v459_015_guard_room_creation.sql"];
const sql=(await Promise.all(names.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
const app=await readFile('app-v11.js','utf8');
for(const f of ['igr_v450_015_build_pack','igr_v451_015_pin_room','igr_v451_015_pinned_pack','igr_v455_015_investigate','igr_v457_015_reveal_enrich','igr_v459_015_room_release_guard','v450_runtime_trames','v450_investigations','v450_verdict','reconstruction_015','investigation_015'])
assert(sql.includes(f),'015 backend missing '+f);
assert(sql.includes("public.igr_v4_min_players('015')=5 and public.igr_v4_max_players('015')=7"),'015 must support 5–7');
for(const f of ['revoke all on function igr_private.igr_v450_015_build_pack','revoke all on function igr_private.igr_v451_015_pinned_pack','before insert or update of scenario_id on public.igr_v4_rooms'])
assert(sql.includes(f),'015 security guard missing '+f);
for(const f of ['igr_v455_015_investigate','investigation_015','igr015Authority','igr015Continuation','igr015Records','payload.reconstruction_015',"id:'015',title:'AVANT LA MORT'"])
assert(app.includes(f),'015 client missing '+f);
assert.match(app,/currentCase==='015'\?\['authority','continuation','records'\]/);
assert(!app.includes('Une médecin est retrouvée morte alors qu’elle enquêtait sur ÉLIGIBLES'),'015 wrong public premise');
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
assert(html.includes('v641-shortcards-001-003'));
assert(sw.includes('igr-v641-shortcards-001-003'));
console.log('015 private pack, 5–7 player, UI and release contracts PASS');
