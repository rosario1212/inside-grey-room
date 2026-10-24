import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const migrations=[
 '20261024050000_igr_v350_010_private_pack_preview.sql',
 '20261024050500_igr_v351_010_private_pinned_variants.sql',
 '20261024051000_igr_v352_010_pin_on_start.sql',
 '20261024051500_igr_v353_010_private_pack_readers.sql',
 '20261024052000_igr_v354_010_investigation_sync.sql',
 '20261024052500_igr_v355_010_private_investigations.sql',
 '20261024053000_igr_v356_010_final_lock.sql',
 '20261024053500_igr_v357_010_reconstruction_scoring.sql',
 '20261024054000_igr_v359_010_guard_room_creation.sql'
];
const sql=(await Promise.all(migrations.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const term of ['igr_v350_010_build_pack','igr_v351_010_pin_room','igr_v351_010_pinned_pack','igr_v355_010_investigate','igr_v357_010_reveal_enrich','igr_v359_010_room_release_guard'])assert(sql.includes(term),'Missing 010 server part '+term);
assert.match(sql,/room_code text primary key references public\.igr_v4_rooms\(code\) on delete cascade/);
assert.match(sql,/revoke all on function igr_private\.igr_v351_010_pinned_pack/);
assert.match(sql,/revoke all on function igr_private\.igr_v350_010_build_pack/);
assert.match(sql,/before insert or update of scenario_id on public\.igr_v4_rooms/);
for(const term of ['igr_v355_010_investigate','investigation_010','igr010Origin','igr010Door','igr010Signal','payload.reconstruction_010','reconstruction_010'])assert(app.includes(term),'Missing 010 interface '+term);
assert.match(app,/currentCase==='010'\?\['origin','door','signal'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='010'/);
assert.doesNotMatch(app,/"v350_verdict"\s*:\s*\{/);
console.log('010 release integration contracts: PASS (structural; server E2E separately required).');
