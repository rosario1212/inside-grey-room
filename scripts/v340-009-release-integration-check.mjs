import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const migrations=[
 '20261024035500_igr_v330_009_evidence_pack_builder.sql',
 '20261024040000_igr_v331_009_pinned_variants.sql',
 '20261024040500_igr_v332_009_pin_on_start.sql',
 '20261024041000_igr_v333_009_pinned_pack_readers.sql',
 '20261024041500_igr_v334_009_investigation_sync.sql',
 '20261024042000_igr_v335_009_investigations.sql',
 '20261024042500_igr_v336_009_final_lock.sql',
 '20261024043000_igr_v337_009_reveal_scoring.sql',
 '20261024043500_igr_v339_009_guard_room_creation.sql'
];
const sql=(await Promise.all(migrations.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const term of ['igr_v330_009_build_pack','igr_v331_009_pin_room','igr_v331_009_pinned_pack','igr_v335_009_investigate','igr_v337_009_reveal_enrich','igr_v339_009_room_release_guard'])assert(sql.includes(term),'Missing 009 server part '+term);
assert.match(sql,/room_code text primary key references public\.igr_v4_rooms\(code\) on delete cascade/);
assert.match(sql,/revoke all on function igr_private\.igr_v331_009_pinned_pack/);
assert.match(sql,/revoke all on function igr_private\.igr_v330_009_build_pack/);
assert.match(sql,/before insert or update of scenario_id on public\.igr_v4_rooms/);
for(const term of ['igr_v335_009_investigate','investigation_009','igr009Withdrawal','igr009Decision','igr009Decoy','payload.reconstruction_009','reconstruction_009'])assert(app.includes(term),'Missing 009 interface '+term);
assert.match(app,/currentCase==='009'\?\['withdrawal','decision','decoy'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='009'/);
assert.doesNotMatch(app,/"v330_verdict"\s*:\s*\{/);
console.log('009 release integration contracts: PASS (structural; server E2E separately required).');
