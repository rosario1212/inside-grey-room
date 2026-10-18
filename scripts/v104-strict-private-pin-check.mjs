// v104: the dormant pin must never bypass the human-evidence preflight.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=await readFile('supabase/migrations/20261018075500_v104_strict_private_pin_preflight.sql','utf8');
assert.match(sql,/create or replace function igr_private\.igr_v99_pin_room_canon\(p_room text\)/i);
assert.match(sql,/igr_private\.igr_v100_preflight\(r\.scenario_id\)/i);
assert.match(sql,/release_eligible/i);
assert.match(sql,/where x\.room_code=r\.code and x\.scenario_id=r\.scenario_id/i);
assert.match(sql,/r\.status <> 'lobby'/i);
assert.match(sql,/from public, anon, authenticated/i);
assert.doesNotMatch(sql,/\bgrant\s+execute\b/i);
assert.doesNotMatch(sql,/\bupdate\s+igr_private\.igr_v99_variant_manuscripts\b/i);
assert.doesNotMatch(sql,/\b(public\.igr_v4_start_game|public\.igr_v4_build_private_card)\b/i);
console.log('v104: approved and source-verified private canons only; no gameplay activation');