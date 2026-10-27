import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const file=path=>readFileSync(path,'utf8');
const ui=file('omerta-santoro-verdict-v28.js');
const sql=file('supabase/migrations/20261028002000_omerta_santoro_signed_verdict_v28.sql');
const gate=file('supabase/migrations/20261028001000_omerta_verdict_goal_axes_gate_v28.sql');
const seal=file('supabase/migrations/20261028003000_omerta_santoro_seal_generic_finish_v28.sql');
new vm.Script(ui,{filename:'omerta-santoro-verdict-v28.js'});
assert.ok(ui.includes("room(d).phase==='locking'"));
assert.ok(ui.includes("d?.player?.public_role==='enqueteur'"));
assert.ok(ui.includes("room(d).status==='finished'"));
for(const key of ['igr_omerta_standalone_verdict_options','igr_omerta_standalone_lock_verdict',
 'igr_omerta_standalone_my_verdict','act_axis','evidence_ids','match_no']){
 assert.ok((ui+sql).includes(key),'Missing key: '+key);
}
assert.ok(!ui.includes('innerHTML'), 'Never inject private story HTML');
assert.ok(ui.includes('textContent'), 'Labels must be plain text');
assert.ok(sql.includes("review_status='verified'"),'Goal not scorable without review');
assert.ok(sql.includes("manuscript_md5=s.source_md5"),'Old manuscript mappings must not transfer across edits');
assert.ok(sql.includes('SELECT * INTO inv FROM public.igr_v4_players'),'Signer identity must be looked up');
assert.ok(sql.includes("public_role='enqueteur'"),'Signed investigator required');
assert.ok(sql.includes("r.phase<>'locking'"),'Verdict locked only in appropriate phase');
assert.ok(sql.includes("jsonb_array_length(e->'evidence_ids')<>2"),'Require two C3 references');
assert.ok(sql.includes('verdict_already_locked'),'Cannot modify a final allegation');
assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS igr_private.igr_omerta_verdict_locks'));
assert.ok(gate.includes('igr_omerta_verdict_goal_mapping_ready(p_scenario)'));
const actors=file('supabase/migrations/20261028001500_omerta_truth_actor_guard_v28.sql');
const truthfulScorer=file('supabase/migrations/20261028002500_omerta_nonarbitrary_goal_scorer_v28.sql');
assert.ok(actors.includes('igr_omerta_verdict_truth_mapping_ready(p_scenario)'));
assert.ok(actors.includes('igr_omerta_verdict_goal_mapping_ready(p_scenario)'));
assert.ok(truthfulScorer.includes('editorial_actor_truth_pending'));
assert.ok(truthfulScorer.includes('own.internal_slot=ANY(truth.actual_slots)'));
assert.ok(ui.includes('editorial_actor_truth_pending'));
assert.ok(seal.includes('omerta_signed_verdict_required'));
for (const [path,ref] of [
 ['index.html','omerta-santoro-verdict-v28.js?v=santoro-verdict-v28'],
 ['service-worker.js','omerta-santoro-verdict-v28.js?v=santoro-verdict-v28'],
 ['scripts/build-web.mjs',"'omerta-santoro-verdict-v28.js'"],
]) assert.ok(file(path).includes(ref),path+' is missing the verdict entrypoint');
console.log('OMERTA V28 signed goal-scoped verdict: source/asset/security invariants OK');
