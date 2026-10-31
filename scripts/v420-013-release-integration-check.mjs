import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const files=[
 '20261024220000_igr_v410_013_private_pack_preview.sql',
 '20261024220100_igr_v411_013_private_pinned_variants.sql',
 '20261024220200_igr_v412_013_pin_on_start.sql',
 '20261024220300_igr_v413_013_private_pack_readers.sql',
 '20261024220400_igr_v414_013_investigation_sync.sql',
 '20261024220500_igr_v415_013_private_investigations.sql',
 '20261024220600_igr_v416_013_final_lock.sql',
 '20261024220700_igr_v417_013_reconstruction_scoring.sql',
 '20261024220900_igr_v419_013_guard_room_creation.sql',
 '20261024221000_igr_v410_013_fix_verdict_axes.sql'
];
const sql=(await Promise.all(files.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const term of ['igr_v410_013_build_pack','igr_v411_013_pin_room','igr_v411_013_pinned_pack','igr_v415_013_investigate','igr_v417_013_reveal_enrich','igr_v419_013_room_release_guard'])
 assert(sql.includes(term),'013 runtime missing '+term);
for(const term of ['v410_runtime_trames','v410_investigations','v410_verdict','reconstruction_013','investigation_013'])
 assert(sql.includes(term),'013 pack missing '+term);
assert(sql.includes("public.igr_v4_min_players('013')=5 and public.igr_v4_max_players('013')=6"),'013 must support 5 or 6 players');
assert.match(sql,/before insert or update of scenario_id on public\.igr_v4_rooms/);
assert.match(sql,/revoke all on function igr_private\.igr_v410_013_build_pack/);
assert.match(sql,/revoke all on function igr_private\.igr_v411_013_pinned_pack/);
for(const term of ['igr_v415_013_investigate','investigation_013','igr013Knowledge','igr013Command','igr013Security','payload.reconstruction_013'])
 assert(app.includes(term),'013 interface missing '+term);
assert.match(app,/currentCase==='013'\?\['knowledge','command','security'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='013'/);
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
assert(['20261024-013-variants','20261024-014-variants','v644-relations-facts-only'].some(v=>html.includes(v)));
assert(['igr-v42-013-variants','igr-v44-014-variants','igr-v644-relations-facts-only'].some(v=>sw.includes(v)));
console.log('013 integration contracts: PASS (server smoke tests required separately).');
