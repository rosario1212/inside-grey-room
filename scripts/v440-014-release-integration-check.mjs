import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const names=[
'20261024230000_igr_v430_014_private_pack_preview.sql',
'20261024230100_igr_v431_014_private_pinned_variants.sql',
'20261024230200_igr_v432_014_pin_on_start.sql',
'20261024230300_igr_v433_014_private_pack_readers.sql',
'20261024230400_igr_v434_014_investigation_sync.sql',
'20261024230500_igr_v435_014_private_investigations.sql',
'20261024230600_igr_v436_014_final_lock.sql',
'20261024230700_igr_v437_014_reconstruction_scoring.sql',
'20261024230900_igr_v439_014_guard_room_creation.sql'
];
const sql=(await Promise.all(names.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
for(const term of ['igr_v430_014_build_pack','igr_v431_014_pin_room','igr_v431_014_pinned_pack','igr_v435_014_investigate','igr_v437_014_reveal_enrich','igr_v439_014_room_release_guard','v430_runtime_trames','v430_investigations','v430_verdict','reconstruction_014','investigation_014'])
 assert(sql.includes(term),'014 backend missing '+term);
assert(sql.includes("public.igr_v4_min_players('014')=5 and public.igr_v4_max_players('014')=6"));
for(const term of ['revoke all on function igr_private.igr_v430_014_build_pack','revoke all on function igr_private.igr_v431_014_pinned_pack','before insert or update of scenario_id on public.igr_v4_rooms'])
 assert(sql.includes(term),'014 security missing '+term);
for(const term of ['igr_v435_014_investigate','investigation_014','igr014Source','igr014Transmission','igr014Concealment','payload.reconstruction_014'])
 assert(app.includes(term),'014 UI missing '+term);
assert.match(app,/currentCase==='014'\?\['source','transmission','concealment'\]/);
const html=await readFile('index.html','utf8'),sw=await readFile('service-worker.js','utf8');
assert(['20261024-014-variants','v633-omerta-santoro-private-cards'].some(v=>html.includes(v)));assert(['igr-v44-014-variants','igr-v633-omerta-santoro-private-cards'].some(v=>sw.includes(v)));
console.log('014 integration contracts PASS');
