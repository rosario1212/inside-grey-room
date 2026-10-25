import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const files=[
 '20261024210000_igr_v390_012_private_pack_preview.sql',
 '20261024210100_igr_v391_012_private_pinned_variants.sql',
 '20261024210200_igr_v392_012_pin_on_start.sql',
 '20261024210300_igr_v393_012_private_pack_readers.sql',
 '20261024210400_igr_v394_012_investigation_sync.sql',
 '20261024210500_igr_v395_012_private_investigations.sql',
 '20261024210600_igr_v396_012_final_lock.sql',
 '20261024210700_igr_v397_012_reconstruction_scoring.sql',
 '20261024210900_igr_v399_012_guard_room_creation.sql',
 '20261024211000_igr_v390_012_fix_verdict_axes.sql'
];
const sql=(await Promise.all(files.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const name of ['igr_v390_012_build_pack','igr_v391_012_pin_room','igr_v391_012_pinned_pack','igr_v395_012_investigate','igr_v397_012_reveal_enrich','igr_v399_012_room_release_guard'])
 assert(sql.includes(name),'012 backend function missing '+name);
for(const term of ['v390_runtime_trames','v390_investigations','v390_verdict','reconstruction_012','investigation_012'])
 assert(sql.includes(term),'012 privacy/runtime contract missing '+term);
assert.match(sql,/before insert or update of scenario_id on public\.igr_v4_rooms/);
assert.match(sql,/revoke all on function igr_private\.igr_v390_012_build_pack/);
assert.match(sql,/revoke all on function igr_private\.igr_v391_012_pinned_pack/);
for(const term of ['igr_v395_012_investigate','investigation_012','igr012Directive','igr012Violence','igr012Reaction','payload.reconstruction_012'])
 assert(app.includes(term),'012 UI missing '+term);
assert.match(app,/currentCase==='012'\?\['directive','violence','reaction'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='012'/);
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
assert(['20261024-012-variants','20261024-013-variants','20261024-014-variants','v533-017-evidence-titles'].some(v=>html.includes(v)));
assert(["igr-v40-012-variants","igr-v42-013-variants","igr-v44-014-variants","igr-v533-017-evidence-titles"].some(v=>sw.includes(v)));
console.log('012 integration contracts: PASS (structural; live server multiplayer checks required).');
