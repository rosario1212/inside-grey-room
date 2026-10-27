// Private data never loaded. Test only the signed review UI contract.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const ui=read('omerta-money-intel-v1.js');
const service=read('supabase/migrations/20261027230500_omerta_indic_review_v27.sql');
new vm.Script(ui,{filename:'omerta-money-intel-v1.js'});
for(const key of [
 "async function assessSource()",
 "igr_omerta_indic_final_assess",
 "p_reduction_years",
 "omerta_indic_final_review_submitted",
 "igr-indic-final-assess-button",
 "d.room.state?.omerta_standalone!==true",
 "d.room?.state?.omerta_standalone===true",
])assert.ok(ui.includes(key),'Missing review UI guard: '+key);
assert.match(ui,/Number\(d\.room\.cycle\)===3&&d\.room\.phase==='cycle_debrief'/);
assert.match(ui,/events\(d,'omerta_indic_final_review_submitted'\)\.length/);
assert.ok(service.includes("p_player_token uuid"),'Player token required');
assert.ok(service.includes("inv.public_role='enqueteur'"),'Investigator authentication required');
assert.ok(service.includes("indic_match_id") && service.includes("omerta_indic_final_assessment"),'Scorer must bind review to match');
assert.ok(service.includes("standalone_win_rules_not_approved"),'Santoro must be gated');
console.log('Omerta signed end-of-C3 review UI contract OK');
