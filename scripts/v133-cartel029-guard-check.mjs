import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file=async path=>readFile(path,'utf8');
const [draft,gate,release,client]=await Promise.all([
 file('supabase/migrations/20261019110000_v133_cartel029_guaranteed_c3_draft.sql'),
 file('supabase/migrations/20261019102000_v132_cartel029_verified_third_cycle_gate.sql'),
 file('supabase/migrations/20261019042000_v111_cartel029_private_revelations.sql'),
 file('cartel029-v121.js')
]);

assert.match(draft,/scenario_id='029'/);
assert.match(draft,/variant_id in \('A','B','C'\)/);
assert.match(draft,/editorial_status='review'/);
assert.match(draft,/029.*-r5-guaranteed-responsibility/);
assert.match(draft,/029.*-r6-guaranteed-fourth-witness/);
assert.match(draft,/'kind','guaranteed'/);
assert.match(draft,/'min_cycle','3'/);
for(const id of ['P11','P12','P14','P15']){
 assert(draft.includes("'"+id+"'"), 'Expected an independent source: '+id);
 assert(release.includes("'"+id+"'"), 'Source not delivered by approved runtime: '+id);
}
assert.match(draft,/'independent_of_optional_actions',true/);
assert.match(draft,/'human_source_review','pending'/);
assert.doesNotMatch(draft,/human_source_review','verified'/);
assert.match(draft,/'human_source_review','pending'/); // no human certification claimed by this migration
assert.doesNotMatch(draft,/editorial_status='approved'/);
assert.match(gate,/igr_v100_preflight\('029'\)/);
assert.match(gate,/passed_end_to_end_testing and manually_activated/);
assert.match(client,/cartel029_ready===true/);
assert.match(client,/igr_v119_029_position/);

console.log('029 C3 draft contracts PASS: P11/P12/P14/P15 guaranteed by runtime.');
console.log('Release gates intentionally remain: human verification, editorial approval, full multiplayer QA.');
