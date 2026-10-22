import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const [release,interview,seed,catalog]=await Promise.all([
 readFile('supabase/migrations/20261019125000_v140_cartel029_authorized_release.sql','utf8'),
 readFile('supabase/migrations/20261019123000_v138_cartel029_interview_evidence_title.sql','utf8'),
 readFile('supabase/migrations/20261019124000_v139_cartel029_pin_variant_on_retry.sql','utf8'),
 readFile('dlc-suite-v12-37.js','utf8')
]);
const from=catalog.indexOf("{id:'029'"),to=catalog.indexOf("{id:'030'",from);
assert(from>=0&&to>from);
const item=catalog.slice(from,to);
assert.match(item,/min:6,max:11/);
assert.doesNotMatch(item,/min:5,max:8/);
assert.match(release,/manually_activated/);
assert.match(release,/jsonb_array_length/);
assert.match(release,/editorial_status='approved',public_enabled=true/);
assert.match(release,/igr_v135_029_preflight/);
assert.doesNotMatch(release,/set passed_end_to_end_testing\s*=\s*true/i);
assert.doesNotMatch(release,/set story_reviewed\s*=\s*true/i);
assert(interview.includes("'ÉLÉMENT '||(v_piece->>'id')"));
assert.match(seed,/missing pinned 029 variant/);
assert.match(seed,/join igr_private\.igr_v107_029_editorial_matrix/);
assert.match(seed,/pin\.match_no=n/);
const c=spawnSync(process.execPath,['--check','dlc-suite-v12-37.js'],{encoding:'utf8'});
assert.equal(c.status,0,'DLC source JavaScript invalid: '+c.stderr);
console.log('029 v140 release assets PASS: 6–11 catalog without lawyer, private matrix gate, pinned variant, four-interview fix.');
console.log('Independent reviewer and device QA flags intentionally untouched.');
