#!/usr/bin/env node
// V23 contractual QA and sealed-fact mock only; no published features.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradeTwoConditionIndicWin,formatIndicCard} from '../qa/omerta-v23-two-condition-indic-simulator.mjs';
const c=JSON.parse(await readFile('qa/omerta-v23-indic-two-condition-goals.json','utf8'));
const md=await readFile('docs/OMERTA_V23_INDIC_TWO_CONDITIONS_PERSONAL_ESCAPE_AND_DISCLOSURE.md','utf8');
assert.equal(c.version,'OMERTA-V23');
assert.equal(c.production_deployed,false);
assert.equal(c.scenario_count,5);
assert.equal(c.mafia_role_templates,35);
assert.equal(c.one_main_objective_composed_of_two_required_conditions,true);
assert.deepEqual(c.mandatory_win_conditions,['save_one_self','send_one_verified_relevant_private_disclosure']);
assert.equal(c.acceptance.disclosures_sent_on_accept,0);
assert.equal(c.acceptance.silent_indic_cannot_win_without_second_condition,true);
assert.equal(c.informant_remains_in_mafia,true);
assert.equal(c.private_source_validation.must_be_voluntary_submission_after_acceptance,true);
assert.equal(c.private_source_validation.must_be_before_locked_verdict,true);
assert.equal(c.player_facing_design.no_additional_goal,true);
assert.ok(c.player_facing_design.compact_card_word_target<=80);
assert.match(md,/DEUX CONDITIONS OBLIGATOIRES/);
assert.match(md,/Voir les détails et les pièces/);
assert.match(md,/UNE seule|une seule|seulement son rang/i);
const roles=['associato','soldato','contabile','capo','consigliere','sottocapo','don'];
const common="Avant le verdict, transmets volontairement à l'Enquêteur au moins un renseignement vrai et utile tiré de ta fiche privée.";
let count=0;
for(const game of c.cases){
 assert.equal(game.roles.length,7,game.id+' rank count');
 assert.deepEqual(game.roles.map(x=>x.role),roles);
 for(const r of game.roles){
  count++;
  assert.equal(r.indic_condition_1.label,'SAUVE TA PEAU');
  assert.equal(r.indic_condition_2.label,'RENSEIGNE L’ENQUÊTE');
  assert.equal(r.indic_condition_2.text,common);
  assert.equal(r.indic_condition_2.min_qualifying_disclosures,1);
  assert.equal(r.indic_condition_1.kind,'avoid_attribution');
  assert.ok(r.indic_condition_1.text.length<150,'too long personal win copy');
  assert.notEqual(r.indic_condition_1.text,r.suspect_goal,'same personal goal after informant status');
  assert.equal(r.goal_is_single_and,true);
  assert.ok(md.includes(r.indic_condition_1.text),game.id+' personal condition missing');
  assert.ok(formatIndicCard(r).includes('SAUVE TA PEAU'));
 }
}
assert.equal(count,35);
const personalGoal={kind:'avoid_attribution',crime_id:'specific_crime',player_id:'P',liability_level:'principal'};
const lockedVerdict={specific_crime:[{player_id:'Q',level:'principal'}]};
const privateFactCatalog=[{factId:'private1',roomId:'R',ownerPlayerId:'P',trueInSealedVariant:true,caseRelevant:true,corrobableIndependently:true},
 {factId:'rumor',roomId:'R',ownerPlayerId:'P',trueInSealedVariant:false,caseRelevant:true,corrobableIndependently:false}];
const tip={type:'source_private_fact_submission',roomId:'R',playerId:'P',recipientRole:'enqueteur',serverAuthenticated:true,
 factId:'private1',submittedAt:3,serverEligibleFact:true,alreadyPublicAtSubmission:false};
const base={roomId:'R',playerId:'P',acceptedAt:2,lockedAt:4,personalGoal,lockedVerdict,caseEvents:{},privateFactCatalog,disclosureEvents:[]};
assert.deepEqual(gradeTwoConditionIndicWin(base),{personalSaved:true,tipDelivered:false,won:false},'accept+silence not enough');
const delivered=gradeTwoConditionIndicWin({...base,disclosureEvents:[tip]});
assert.deepEqual(delivered,{personalSaved:true,tipDelivered:true,won:true});
assert.deepEqual(gradeTwoConditionIndicWin({...base,lockedVerdict:{specific_crime:[{player_id:'P',level:'principal'}]},disclosureEvents:[tip]}),
 {personalSaved:false,tipDelivered:true,won:false},'tip cannot win if participant was implicated');
const eventVariations=[
 {...tip,submittedAt:2},{...tip,submittedAt:4},{...tip,alreadyPublicAtSubmission:true},
 {...tip,recipientRole:'capo'},{...tip,serverAuthenticated:false},
 {...tip,serverEligibleFact:false},{...tip,roomId:'other'},
 {...tip,factId:'rumor'},{...tip,factId:'invented'},
 {...tip,playerId:'notP'},{...tip,type:'general_chat_statement'}
];
for(const bad of eventVariations)assert.equal(gradeTwoConditionIndicWin({...base,disclosureEvents:[bad]}).won,false,JSON.stringify(bad));
assert.throws(()=>gradeTwoConditionIndicWin({...base,acceptedAt:4}),/acceptance before verdict/);
assert.throws(()=>gradeTwoConditionIndicWin({...base,personalGoal:null}),/personal goal missing/);
assert.throws(()=>gradeTwoConditionIndicWin({...base,privateFactCatalog:[] ,disclosureEvents:null}),/verified private fact/);
console.log('OMERTA V23 EDITORIAL+SIM PASS: all 35 roles get just two understandable indic conditions; tip must be freely submitted, true/private/relevant/verifiable; AND scoring; mafia alignment, silence allowed but cannot win.');
console.log('NOT LIVE: no real server-side sealed fact store, tip submission RPC or 15 A/B/C verified assignments have been integrated.');
