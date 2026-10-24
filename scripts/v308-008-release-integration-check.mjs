import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const files=[
 'supabase/migrations/20261024013000_igr_v301_008_immutable_snapshots.sql',
 'supabase/migrations/20261024014500_igr_v302_008_pin_on_game_start.sql',
 'supabase/migrations/20261024015000_igr_v303_008_private_pack_readers.sql',
 'supabase/migrations/20261024015500_igr_v304_008_private_investigation_metadata.sql',
 'supabase/migrations/20261024020000_igr_v305_008_role_token_investigations.sql',
 'supabase/migrations/20261024020500_igr_v306_008_three_axis_final_lock.sql',
 'supabase/migrations/20261024021000_igr_v307_008_final_reconstruction_scoring.sql'
];
const sql=(await Promise.all(files.map(x=>readFile(x,'utf8')))).join('\n');
for(const key of ['igr_v301_008_pin_room','igr_v301_008_pinned_pack','igr_v305_008_investigate','igr_v307_008_reveal_enrich'])assert.match(sql,new RegExp(key));
assert.match(sql,/room_code text primary key references public\.igr_v4_rooms\(code\) on delete cascade/);
assert.match(sql,/revoke all on function public\.igr_v305_008_investigate/);
assert.match(sql,/igr_v301_008_release_status/);
assert.match(sql,/scenario_id='008'/);
for(const term of ['igr_v305_008_investigate','investigation_008','igr008Incident','igr008Responsible','igr008Decoy','payload.reconstruction_008','reconstruction_008'])assert(app.includes(term),'008 browser path is missing '+term);
assert.match(app,/\['001','002','003','004','005','006','007','008','009','010','011'\]/);
assert.match(app,/STATE\.sync\?\.room\?\.scenario_id==='008'/);
assert.match(app,/currentCase==='008'\?\['incident','responsible','decoy'\]/);
assert.doesNotMatch(app,/\"v300_verdict\"\s*:\s*\{/);
console.log('008 client / private-server contract verified without manuscript data.');
