import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const sqlFiles=[
 '20261024070000_igr_v370_011_private_pack_preview.sql',
 '20261024080000_igr_v371_011_private_pinned_variants.sql',
 '20261024090000_igr_v372_011_pin_on_start.sql',
 '20261024100000_igr_v373_011_private_pack_readers.sql',
 '20261024110000_igr_v374_011_investigation_sync.sql',
 '20261024120000_igr_v375_011_private_investigations.sql',
 '20261024130000_igr_v376_011_final_lock.sql',
 '20261024140000_igr_v377_011_reconstruction_scoring.sql',
 '20261024150000_igr_v379_011_guard_room_creation.sql'
];
const sql=(await Promise.all(sqlFiles.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const term of ['igr_v370_011_build_pack','igr_v371_011_pin_room','igr_v371_011_pinned_pack','igr_v375_011_investigate','igr_v377_011_reveal_enrich','igr_v379_011_room_release_guard'])
 assert(sql.includes(term),'Missing 011 server function '+term);
assert.match(sql,/room_code text primary key references public\.igr_v4_rooms\(code\) on delete cascade/);
assert.match(sql,/revoke all on function igr_private\.igr_v370_011_build_pack/);
assert.match(sql,/revoke all on function igr_private\.igr_v371_011_pinned_pack/);
assert.match(sql,/before insert or update of scenario_id on public\.igr_v4_rooms/);
for(const term of ['igr_v375_011_investigate','investigation_011','igr011Order','igr011Field','igr011Halt','payload.reconstruction_011'])
 assert(app.includes(term),'Missing 011 interface '+term);
assert.match(app,/currentCase==='011'\?\['order','field','halt'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='011'/);
assert.doesNotMatch(app,/"v370_verdict"\s*:\s*\{/);
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
assert(['20261024-011-variants','20261024-012-variants','20261024-013-variants','20261024-014-variants','v580-019-grand-bal'].some(v=>html.includes(v)));
assert(["igr-v38-9-011-variants","igr-v40-012-variants","igr-v42-013-variants","igr-v44-014-variants","igr-v580-019-grand-bal"].some(v=>sw.includes(v)));
console.log('011 integration contracts: PASS (structural; real server multiplayer tests still mandatory).');
