// V102 private role simulation acceptance - no plot content or player access.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const s=await readFile('supabase/migrations/20261018065000_v102_private_role_simulator.sql','utf8');
assert.match(s,/create or replace function igr_private\.igr_v102_simulate_role_view/i);
assert.match(s,/p_verified_actions text\[\]/i);
assert.match(s,/p_unlocked_clues text\[\]/i);
assert.match(s,/current_audience='investigation' and p_role in \('inspecteur','enqueteur'\)/i);
assert.match(s,/current_audience='player' and role_is_private/i);
assert.match(s,/event_kind='conditional' and not/i);
assert.match(s,/event_kind='missable' and not/i);
assert.match(s,/case p_role[\s\S]+when 'juge' then 5/i);
assert.match(s,/revoke all on function igr_private\.igr_v102_simulate_role_view\(/i);
assert.match(s,/from public,anon,authenticated/i);
assert.doesNotMatch(s,/\bgrant\s+execute\b/i);
assert.doesNotMatch(s,/\bcreate or replace function public\./i);
assert.doesNotMatch(s,/\bupdate public\.igr_v4_rooms\b/i);
assert.doesNotMatch(s,/\bupdate igr_private\.igr_v99_variant_manuscripts\b/i);
assert.doesNotMatch(s,/final_reveal|responsibility_by_slot|canonical_truth|['\"]variant_id['\"]\s*,/i,
  'The simulated client payload must not include story truth or branch seed');
console.log('v102: strictly private, action-gated, role-scoped simulation OK');
