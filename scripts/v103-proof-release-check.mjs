// v103: mandatory human proof provenance before narrative activation.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=await readFile('supabase/migrations/20261018072000_v103_verified_guarantees.sql','utf8');
assert.match(sql,/create or replace function igr_private\.igr_v100_preflight\(p_scenario text\)/i);
assert.match(sql,/distinct_canonical_truths=3/i,'A B C must not share a truth');
assert.match(sql,/e->>'kind'='guaranteed' and e->>'min_cycle'='3'/i);
assert.match(sql,/human_source_review'='verified'/i);
assert.match(sql,/verified_cycle_three_guarantees=3/i,'all three branches need checked evidence');
assert.match(sql,/omerta_lock_missing=0/i);
assert.match(sql,/approved=3/i,'human editorial approval mandatory');
assert.match(sql,/from public,anon,authenticated/i);
assert.doesNotMatch(sql,/\bgrant\s+execute\b/i);
assert.doesNotMatch(sql,/\bupdate public\.igr_v4_/i);
assert.doesNotMatch(sql,/\bupdate igr_private\.igr_v99_variant_manuscripts\b/i);
assert.doesNotMatch(sql,/public\.igr_v4_start_game\s*\(/i);
console.log('v103: unverified editorial recoupments cannot open private release gates');

// v104 extends the existing release check without changing active game code.
await import('./v104-strict-private-pin-check.mjs');
