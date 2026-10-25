import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(name,'utf8');
const first=read('supabase/migrations/20261025120000_igr_v495_case_role_editorial_hardening.sql');
const next=read('supabase/migrations/20261025121000_igr_v496_case_role_guidance.sql');
const budget=read('supabase/migrations/20261025122000_igr_v497_judge_budget_label.sql');
const closing=read('supabase/migrations/20261025123000_igr_v498_final_phase_role_guards.sql');
const ui=read('natural-role-gameplay-v50.js');
const release=read('app-v11.js');
for(const s of ['003','008','009','011'])assert(release.includes("'"+s+"':{required:"),'Missing base case '+s);
for(const s of ['igr_v44_judge_decide_request','igr_v50_counter_expertise','igr_v50_expert_analyze','igr_v50_expert_state','igr_v50_share_expert_result','igr_v49_publish_expert_result','igr_v49_expert_public_state','igr_v44_submit_judge_request'])
  assert(first.includes("'"+s+"'")||first.includes("'"+s+"'".replaceAll("'","")),'No runtime guard for '+s);
assert(first.includes("used+item_cost>3"),'008 must bill protection by actual points');
assert(first.includes("'cost',item_cost"),'008 judge action cost must not be fixed at one');
assert(first.includes('igr_v495_enrich_003_investigations'),'Missing 003 factual document questions');
assert(first.includes('igr_v495_expert_actions'),'Missing per-variant expert interpretation');
assert(first.includes('r.cycle<coalesce((item->>'),'Expert must be cycle gated');
assert(first.includes("igr_v331_009_pinned_pack(r.code)"),'Expert must use 009 immutable variant');
assert(first.includes("igr_v220_003_pinned_pack(r.code)"),'Expert must use 003 immutable variant');
assert(next.includes("igr_v371_011_pinned_pack(r.code)"),'011 Prosecutor cannot draw from static dossier');
assert(next.includes("r.cycle-1"),'011 must only reuse preceding cycles');
assert(budget.includes("'cost',greatest(1"),'Protected catalogue must expose cost');
assert(closing.includes('provisional_orals'),'Provisional closure must be locked');
assert(ui.includes('x.available===false'),'Expert UI must disable future-cycle analysis');
assert(ui.includes('expert.can_counter?'),'Expert UI must hide closed counter-analysis');
assert(ui.includes('prosecutor.case_strategy?'),'011 strategy not visible in prosecutor UI');
assert(ui.includes('esc(prosecutor.case_strategy)'),'011 case guidance must be escaped');
console.log('003/008/009/011 editorial/security hardening: PASS (narrative, cycle locks, 008 budget, 011 strategy, no future-proof leak)');
