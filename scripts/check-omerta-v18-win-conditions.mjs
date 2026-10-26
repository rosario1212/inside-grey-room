#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradePersonalGoal,gradeInvestigationAgainstSealedTruth} from '../qa/omerta-v18-personal-goal-evaluator.mjs';
import {createV16Room} from '../qa/omerta-v16-informant-goal-simulator.mjs';

const spec=JSON.parse(await readFile('qa/omerta-v18-personal-victory-contract.json','utf8'));
const prose=await readFile('docs/OMERTA_V18_SUSPECT_INFORMANT_WIN_CONDITIONS.md','utf8');
assert.equal(spec.version,'OMERTA-V18');
assert.equal(spec.status,'EDITORIAL_AND_TEST_ONLY_NOT_LIVE');
assert.equal(spec.primary_win_condition_per_player,1);
assert.equal(spec.optional_bonus_launch_enabled,false);
assert.equal(spec.victory_model.suspect_individual_win_independent_of_investigator,true);
assert.equal(spec.victory_model.informant_individual_win_independent_of_investigator,true);
assert.equal(spec.victory_model.accept_changes_goal_immediately,true);
assert.equal(spec.victory_model.zero_information_transmitted_on_accept,true);
assert.equal(spec.victory_model.truth_unmodified_by_testimony,true);
assert.equal(spec.victory_model.no_subjective_oral_scoring,true);
assert.equal(spec.victory_model.active_goal_only,true);
assert.equal(spec.sample_goals.length,5);
assert.equal(spec.screen.max_primary_win_sentences,1);
assert.equal(spec.allowed_objective_types.protect_ally.verdict_based,true);
assert.ok(prose.includes('COMMENT LE JOUEUR LE LIT')||prose.includes('COMMENT LE JOUEUR'));
assert.match(prose,/SUSPECTS & INDICS/);
assert.match(prose,/80 %/);assert.match(prose,/20 %/);
for(const c of spec.sample_goals){assert.ok(spec.scope.includes(c.id));assert.ok(c.suspect&&c.indic&&c.note);}

const truth={money:[{player_id:'A',level:'principal'}],homicide:[{player_id:'D',level:'principal'}]};
const accurate={money:[{player_id:'A',level:'principal'}],homicide:[{player_id:'D',level:'principal'}]};
const mistaken={money:[{player_id:'A',level:'principal'}],homicide:[{player_id:'A',level:'principal'}]};
const caseEvents={interests:{'weekly_collection':'B'},protections:[{player_id:'B',level:'temporary',status:'pending',authorized_by_competent_authority:false}]};
const ctx=(verdict=accurate)=>({lockedVerdict:verdict,caseEvents});
const protectDon={kind:'protect_ally',crime_id:'homicide',ally_player_id:'D',liability_level:'principal'};
const protectCapo={kind:'protect_ally',crime_id:'homicide',ally_player_id:'B',liability_level:'principal'};
const pinAssociate={kind:'pin_target',crime_id:'money',target_player_id:'A',liability_level:'principal'};
const avoidMoney={kind:'avoid_attribution',crime_id:'money',player_id:'B',liability_level:'principal'};
assert.equal(gradeInvestigationAgainstSealedTruth(accurate,truth),true);
assert.equal(gradeInvestigationAgainstSealedTruth(mistaken,truth),false);
assert.equal(gradePersonalGoal(protectCapo,ctx(accurate)),true);
assert.equal(gradePersonalGoal(protectDon,ctx(accurate)),false);
assert.equal(gradePersonalGoal(protectDon,ctx(mistaken)),true,'source can win via investigator error');
assert.equal(gradePersonalGoal(pinAssociate,ctx(accurate)),true);
assert.equal(gradePersonalGoal(avoidMoney,ctx(accurate)),true);
assert.equal(gradePersonalGoal({kind:'avoid_attribution',crime_id:'money',player_id:'A',liability_level:'principal'},ctx(accurate)),false);
assert.throws(()=>gradePersonalGoal(protectDon,{lockedVerdict:{money:accurate.money},caseEvents}),/unavailable/);
assert.equal(gradePersonalGoal({kind:'retain_interest',interest_id:'weekly_collection',owner_player_id:'B'},ctx()),true);
assert.equal(gradePersonalGoal({kind:'retain_interest',interest_id:'weekly_collection',owner_player_id:'A'},ctx()),false);
assert.throws(()=>gradePersonalGoal({kind:'retain_interest',interest_id:'absent',owner_player_id:'B'},ctx()),/untracked/);
const protectionGoal={kind:'approved_protection',protected_player_id:'B',min_protection_level:'temporary'};
assert.equal(gradePersonalGoal(protectionGoal,ctx()),false,'pending is not approval');
caseEvents.protections[0]={player_id:'B',level:'temporary',status:'approved',authorized_by_competent_authority:true};
assert.equal(gradePersonalGoal(protectionGoal,ctx()),true);
assert.equal(gradePersonalGoal({...protectionGoal,min_protection_level:'enhanced'},ctx()),false);
assert.throws(()=>gradePersonalGoal({kind:'act_ruthless'},ctx()),/unsupported/);

const players=[
{id:'E',role:'enqueteur',camp:'investigation',original_goal:'Reconstruct criminal responsibilities'},
{id:'B',role:'caporegime',camp:'suspect',original_goal:'Avoid primary attribution of murder'},
{id:'A',role:'associato',camp:'suspect',original_goal:'Avoid responsibility for the missing envelope'},
{id:'D',role:'don',camp:'suspect',original_goal:'Avoid commanding homicide accusation'}
];
const room=createV16Room({scenarioId:'021',players,maxOffers:2});
room.advanceCycle(2);
const offer={
 original_goal:players[2].original_goal,
 informant_goal:'Prevent Don Santoro receiving murder command attribution',
 certain_effects:'A private informant role and objective swap are recorded',
 possible_benefits:'Potential requested conditional protection',
 exposure_risk:'Ledger detail may identify the confidential source',
 financial_risk:'Lose part of the collection if proven',
 judicial_risk:'Prove involvement in criminal extortion',
 rank_retaliation_conditions:'Suspicions alone cannot trigger severe penalties',
 protection_conditions:'Actual protection requires approval by competent authority',
 protection_approval_status:'Protection has not yet been granted',
 scope_of_optional_disclosures:'No statement automatically transmitted',
 unknown_facts_limits:'You have no knowledge of the true murder commander',
 accept_label:'Accept and become indic',
 decline_label:'Refuse and keep old objective'
};
room.sendOffer('E','A',offer);
room.respond('A','accept');
assert.equal(room.privateFor('A').activeGoal,offer.informant_goal);
assert.equal(room.privateFor('A').disclosures.length,0);
assert.equal(gradePersonalGoal(protectDon,ctx(mistaken)),true);
assert.equal(gradeInvestigationAgainstSealedTruth(mistaken,truth),false,'independent win and loss');
assert.equal(room.privateFor('A').disclosures.length,0,'informant may win without speaking');
const silent=createV16Room({scenarioId:'021',players});
silent.advanceCycle(3);
assert.equal(silent.informantCount(),0);
assert.equal(gradeInvestigationAgainstSealedTruth(accurate,truth),true,'investigation can win with no informant');
assert.ok(!JSON.stringify(silent.publicView()).includes('privateObjective'));

console.log('OMERTA V18 EDITORIAL+SIM PASS — one measurable goal, immediate swap, independent suspect/indic & investigator victories, pending protection not success, no disclosure needed, 0-indic solvability.');
console.log('NO live scorer or per-crime verdict server migration is certified.');
