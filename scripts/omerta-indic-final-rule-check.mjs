// OMERTÀ - assertions de publication préliminaires (sans exécuter le SQL en production).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=p=>fs.readFileSync(p,'utf8');
const score=load('supabase/migrations/20261027004500_omerta_indic_reveal_scoring.sql');
const recruit=load('supabase/migrations/20261026233000_omerta_indic_recruitment_021.sql');
const intel=load('supabase/migrations/20261026233500_omerta_money_intel_021.sql');
const ui=load('omerta-money-intel-v1.js');
const html=load('index.html'),build=load('scripts/build-web.mjs'),sw=load('service-worker.js');
new vm.Script(ui);
new vm.Script(sw);
for(const asset of ['omerta-money-intel-v1.js','omerta-money-intel-v1.css']){
 assert.ok(html.includes(asset),'index');
 assert.ok(build.includes("'"+asset+"'"),'bundler copy');
 assert.ok(sw.includes("/"+asset+"?"),'offline cache');
}
assert.match(recruit,/igr_omerta_indic_offer/);
assert.match(recruit,/igr_omerta_indic_respond/);
assert.match(recruit,/igr_omerta_indic_protect/);
assert.match(recruit,/omerta_protection_granted/);
assert.match(recruit,/basis','indic_pact/);
assert.ok(intel.includes("r.scenario_id not in ('021','022','023','024','025')"));
assert.ok(score.includes('indic_personal_ok:=protected or (indic_bargain_requested and indic_by_card);'));
assert.match(score,/a.action_type='omerta_protection_request'/);
assert.match(recruit,/igr_omerta_indic_eligible_role/);
assert.match(recruit,/source_not_eligible_for_pact/);
assert.ok(intel.includes('p.internal_slot in (2,4,6)'));
assert.ok(intel.includes("coalesce((chosen->>'eligible')::boolean,false)"));
assert.match(score,/revoke all on function public.igr_omerta_make_reveal/);
assert.match(ui,/Protéger mon Indic/);
assert.match(intel,/total_cards',3/);
assert.match(intel,/counts_for_cooperation',false/);
assert.match(intel,/one_intel_per_cycle/);
assert.match(intel,/omerta_verified_intel/);
assert.match(score,/indic_second_ok:=indic_by_card;/);
assert.doesNotMatch(score,/indic_vote_yes|second_via_investigator_yes/);
assert.match(score,/indic_personal_ok and indic_second_ok and not dead/);
assert.match(score,/second_via_confirmed_card/);
assert.ok(ui.includes('As-tu partagé une information ?'));
assert.ok(ui.includes("a.action_type==='omerta_verified_intel'"));
assert.ok(ui.includes("d.room.phase==='cycle_debrief'"));
assert.doesNotMatch(ui,/igr_omerta_indic_assess|showFinalReview/);
// Contrat de sécurité A/B/C : jamais de fallback sur un échec réseau et
// jamais de contenu Verri dans la synchronisation autonome.
const standalone=load('supabase/candidates/omerta_standalone_variant_pinning.sql');
const omertaClient=load('omerta-v12.js'),baseClient=load('app-v11.js');
new vm.Script(omertaClient);
new vm.Script(baseClient);
for(const key of [
 'igr_omerta_standalone_release_control',
 'igr_omerta_standalone_can_start',
 'igr_omerta_standalone_safe_sync',
 "raw:=jsonb_set(raw,'{scenario}'",
 "raw:=jsonb_set(raw,'{player,private_state}'",
 "raw:=jsonb_set(raw,'{my_actions}'",
 "'family'='SANTORO'",
])assert.ok(standalone.includes(key),'standalone server guard missing: '+key);
assert.ok(omertaClient.includes('igr_omerta_standalone_release_status'));
assert.ok(omertaClient.includes('igr_omerta_start_standalone'));
assert.ok(omertaClient.includes("if(e.code!=='PGRST202'"));
assert.ok(baseClient.includes('igr_omerta_standalone_safe_sync'));
// Une fiche Santoro doit remplacer les objectifs Verri génériques dans la vue
// uniquement lorsque la salle autonome est marquée par le serveur.
assert.ok(baseClient.includes('santoroStandalone'));
assert.ok(baseClient.includes("d?.room?.state?.omerta_standalone===true"));
assert.ok(baseClient.includes("santoroPrivateCard"));
assert.ok(baseClient.includes("TON OBJECTIF PERSONNEL"));
assert.ok(baseClient.includes("CE QUE TU PEUX DEMANDER"));
assert.ok(baseClient.includes("const privateWin=santoroMyCard?ps.objective"));

assert.ok(baseClient.includes("if(e.code==='PGRST202'"));
assert.ok(recruit.includes('standalone_indic_facts_unapproved'));
assert.ok(intel.includes('standalone_intel_facts_unapproved'));
assert.ok(score.includes('standalone_win_rules_not_approved'));

console.log('OMERTÀ : vérification statique anti-arbitraire et rappel conditionnel OK');
