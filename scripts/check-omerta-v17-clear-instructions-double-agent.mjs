#!/usr/bin/env node
// V17 public editorial and non-live gameplay semantics. No production mutations.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createV16Room} from '../qa/omerta-v16-informant-goal-simulator.mjs';
import {createDoubleGameProbe} from '../qa/omerta-v17-double-game-simulator.mjs';

const c=JSON.parse(await readFile('qa/omerta-v17-clear-cards-double-agent-contract.json','utf8'));
const d=await readFile('docs/OMERTA_V17_CLEAR_RULES_DOUBLE_AGENT_PLAYER_AGENCY.md','utf8');
assert.equal(c.version,'OMERTA-V17');
assert.equal(c.status,'editorial-test-only-not-live');
assert.deepEqual(c.scope,['021','022','023','024','025']);
assert.equal(c.card_structure.length,7);
for(const label of ['ÉNONCÉ','CE QUE TU SAIS','CE QUE TU IGNORES','TON OBJECTIF','TU PEUX CHOISIR DE','CE QUE TU RISQUES','COMMENT ON TE JUGE'])
  assert.ok(c.card_structure.some(x=>x.title===label));
assert.equal(c.card_structure.find(x=>x.key==='enonce').maxVisibleSentences,4);
assert.equal(c.ui.initial_card_visible_word_budget,150);
assert.equal(c.ui.one_offer_screen,true);
assert.equal(c.offer_card.initiator,'enqueteur');
assert.equal(c.offer_card.earliest_cycle,2);
assert.equal(c.offer_card.accept.disclosures_on_accept,0);
assert.equal(c.offer_card.accept.change_goal_immediately,true);
assert.equal(c.offer_card.informant_can_still_support_mafia,true);
assert.equal(c.offer_card.informant_can_mislead_investigators,true);
assert.equal(c.double_game.can_support_superior_rank,true);
assert.equal(c.double_game.agreement_is_voluntary_social_interaction,true);
assert.equal(c.double_game.higher_rank_has_no_power_to_force_other_player_to_be_informant,true);
assert.equal(c.double_game.higher_rank_cannot_control_informant_goal_or_statements,true);
assert.equal(c.double_game.informant_statement_is_claim_not_canon,true);
assert.equal(c.double_game.lies_cannot_alter_authenticated_evidence,true);
assert.equal(c.double_game.investigation_winnable_with_zero_indics,true);
assert.equal(c.legal_gameplay.evidence_C3_independent_min,2);
assert.equal(c.case_examples.length,5);
assert.ok(d.includes('L\'ART DE TRAHIR'));
assert.ok(d.includes('PROPOSITION DE TRAHISON'));
assert.ok(d.includes('Accepter')&&d.includes('Refuser'));
assert.ok(d.includes('Capo')&&d.includes('Don Santoro'));
assert.match(d,/80 %/);assert.match(d,/20 %/);

const cast=[
 {id:'E',publicRole:'enqueteur',camp:'investigation',original_goal:'Reconstruct the homicide'},
 {id:'A',publicRole:'associato',camp:'suspect',original_goal:'Protect the money flow'},
 {id:'D',publicRole:'don',camp:'suspect',original_goal:'Keep the family quiet'},
 {id:'C',publicRole:'caporegime',camp:'suspect',original_goal:'Avoid racketeering exposure'}
];
const initialFacts=[{id:'a',text:'The collection ledger records a different total',origin:'commercial ledger'},
 {id:'b',text:'The coroner recorded time of death',origin:'forensic timeline'}];
const room=createV16Room({scenarioId:'021',players:cast.map(x=>({id:x.id,role:x.publicRole,camp:x.camp,original_goal:x.original_goal}))});
room.advanceCycle(2);
const terms={
 original_goal:'Protect the money flow',
 informant_goal:'Avoid murder liability while maintaining favor of the capo',
 certain_effects:'Become a private informant immediately',
 possible_benefits:'Conditional financial favor or protection',
 exposure_risk:'Ledger detail could reveal who held it',
 financial_risk:'Crew share could be frozen after corroboration',
 judicial_risk:'Information may incriminate source in extortion',
 rank_retaliation_conditions:'Confirmed evidence and rank required',
 protection_conditions:'Institutional authorization required for actual safety',
 protection_approval_status:'No protection has been approved',
 scope_of_optional_disclosures:'Zero or more statements chosen later',
 unknown_facts_limits:'You do not know who ordered homicide',
 accept_label:'Accept and become informant',
 decline_label:'Refuse and retain objective'
};
room.sendOffer('E','A',terms);
assert.equal(room.informantCount(),0);
room.respond('A','accept');
assert.equal(room.informantCount(),1);
assert.equal(room.privateFor('A').activeGoal,terms.informant_goal);
assert.equal(room.privateFor('A').disclosures.length,0);
const probe=createDoubleGameProbe({caseId:'021',canonicalFacts:initialFacts,cast});
const before=JSON.stringify(probe.sealedFactsForTestOnly());
const d1=probe.submitPrivateClaim({sourceId:'A',recipientId:'E',text:'The Capo only wanted the collection reviewed, not the killing',protectId:'C'});
assert.equal(d1.canonicalModified,false);
assert.equal(probe.investigativeClaims('E')[0].status,'unverified');
const d2=probe.submitPrivateClaim({sourceId:'A',recipientId:'E',text:'In my view, the Don was not involved',protectId:'D'});
assert.equal(d2.canonicalModified,false);
assert.equal(probe.getClaimCount(),2);
assert.equal(JSON.stringify(probe.sealedFactsForTestOnly()),before,'Manipulation cannot change canon');
const publiclyVisible=JSON.stringify(probe.publicSummary());
for(const secret of ['The Capo only wanted','informant','The Don was not','A protected'])assert.ok(!publiclyVisible.includes(secret),'public leakage '+secret);
assert.equal(probe.investigativeClaims('E').every(x=>x.status==='unverified'),true);
assert.throws(()=>probe.submitPrivateClaim({sourceId:'D',recipientId:'C',text:'The killer was elsewhere',protectId:'A'}),/source and investigator required/);
const noIndics=createV16Room({scenarioId:'025',players:cast.map(x=>({id:x.id,role:x.publicRole,camp:x.camp,original_goal:x.original_goal}))});
noIndics.advanceCycle(3);
assert.equal(noIndics.informantCount(),0);
console.log('OMERTA V17 PASS: clear player instructions, voluntary goal-changing source, protect higher-ranking suspect via unverified claims, no canon rewrite, no hidden-state leak, zero-informant path.');
console.log('EDITORIAL/SIMULATION ONLY: 15 private manuscripts, secure server and production gameplay not certified.');
