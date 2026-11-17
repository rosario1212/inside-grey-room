import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(p,'utf8');
const [app,sql,pub]=await Promise.all([
 read('app-v11.js'),
 read('supabase/migrations/20261114184500_igr_v650_018_replayable_runtime.sql'),
 read('scripts/publish-006-adaptive-shell.mjs')
]);
assert(app.includes('igr_v650_018_hypothesis_submit'),'018 independent sealed hypotheses absent');
assert(app.includes('igr_v650_018_investigate_choice'),'018 exact-choice call absent');
assert(app.includes('thisCycle.length>=1'),'018 one investigation per cycle absent');
assert(app.includes("if(r.scenario_id==='018'"),'018 client case absent');
assert(sql.includes('igr_v650_018_offered'),'018 adaptive private offer missing');
assert(sql.includes("a.action_type='hypothesis_018'"),'018 factual answers are not scored server-side');
assert(sql.includes("jsonb_array_length(coalesce(choices,'[]'::jsonb))<>20"),'018 twenty-choice validation absent');
assert(sql.includes('count(distinct e->>\'id\') from jsonb_array_elements(choices) e)<>20'),'018 distinct evidence validator absent');
const v772=await read('supabase/migrations/20261117210100_igr_v772_investigation_cadence.sql');
assert(v772.includes('create trigger igr_v772_one_investigation'),'v772 one-investigation server-side enforcement missing');
assert(sql.includes('count(*)>=2'),'018 legacy release cap expected in migration history');
assert(sql.includes('v650_staging'),'018 private staged manuscripts not activated');
assert(sql.includes("REVOKE ALL ON FUNCTION igr_private.igr_v650_018_offered"),'018 secret scoring must not be public');
assert(!app.includes('v540_verdict'),'private spoiler names exposed in client');
assert(/const tag='[a-z0-9-]+v[0-9]+-[0-9]{8}'/.test(pub),'immutable release tag missing after later scenario publication');
console.log('PASS 018 v651: sealed private A/B/C, 20 authored leads each, one per cycle, anti-spoiler adaptive scoring, immutable PWA.');
