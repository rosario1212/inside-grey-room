import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const contents=Object.fromEntries(await Promise.all([
 'supabase/migrations/20261019113000_v135_cartel029_fix_witness_profile_collision.sql',
 'supabase/migrations/20261019113100_v136_cartel029_current-story-release-review.sql',
 'supabase/migrations/20261019061000_v116_cartel029_distinct_leadership.sql',
 'supabase/migrations/20261019073000_v121_cartel029_report_conclusions.sql',
 'supabase/migrations/20261019032000_v108_cartel029_private_four_witness_gate.sql',
 'cartel029-v121.js'
].map(async file=>[file,await readFile(file,'utf8')])));

const memory=contents['supabase/migrations/20261019113000_v135_cartel029_fix_witness_profile_collision.sql'];
const review=contents['supabase/migrations/20261019113100_v136_cartel029_current-story-release-review.sql'];
const roles=contents['supabase/migrations/20261019061000_v116_cartel029_distinct_leadership.sql'];
const report=contents['supabase/migrations/20261019073000_v121_cartel029_report_conclusions.sql'];
const intro=contents['supabase/migrations/20261019032000_v108_cartel029_private_four_witness_gate.sql'];
const client=contents['cartel029-v121.js'];

assert.match(memory,/declare[^;]*v_profile_key text/i);
assert.match(memory,/counter=4 and v_profile_key in \('V3','V4','V5'\)/);
assert.doesNotMatch(memory,/\bprofile_id\s+text/);
assert.match(review,/primary key\(branch,profile\)/);
assert.match(review,/third_cycle_sources_verified boolean not null default false/);
assert.match(review,/story_reviewed boolean not null default false/);
assert.match(review,/count_variants=15 and approved=15 and signed=15/);
assert.match(review,/passed_end_to_end_testing and manually_activated/);
assert.match(review,/revoke all on igr_private.igr_v135_029_editorial_reviews from public,anon,authenticated/);
assert.match(roles,/array\['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'\]/);
assert.match(intro,/if p_cycle=1.*return 4/);
assert.match(report,/responsibility_choice/);
assert.match(report,/witness4_assessment/);
assert.match(client,/cartel029_ready===true/);
assert.match(client,/igr_v119_029_position/);
assert.match(client,/igr_v118_029_protection/);
const c=spawnSync(process.execPath,['--check','cartel029-v121.js'],{encoding:'utf8'});
assert.equal(c.status,0,c.stderr);
console.log('CARTEL 029: four-witness start-card variable, leader roster, C1 interrogation, report, role-specific choices and release sign-offs verified. No fake approvals.');
