#!/usr/bin/env node
// This checks a non-live state machine and the authored V16 contract.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createV16Room} from '../qa/omerta-v16-informant-goal-simulator.mjs';

const c=JSON.parse(await readFile('qa/omerta-v16-immediate-indic-goal-contract.json','utf8'));
const story=await readFile('docs/OMERTA_V16_ACCEPT_REPLACE_GOAL_DISCLOSE_LATER.md','utf8');
assert.equal(c.version,'OMERTA-V16');
assert.equal(c.live_implemented,false);
assert.deepEqual(c.scenarios,['021','022','023','024','025']);
assert.equal(c.suspect.receive_complete_card_immediately,true);
assert.deepEqual(c.suspect.choices,['ACCEPT_AND_BECOME_INFORMANT','DECLINE_KEEP_ORIGINAL_GOAL']);
assert.equal(c.suspect.separate_preview_screen_required,false);
assert.equal(c.suspect.extra_confirmation_screen_required,false);
assert.equal(c.suspect.accept_immediately_changes_secret_informant_flag,true);
assert.equal(c.suspect.accept_immediately_replaces_primary_personal_goal,true);
assert.equal(c.suspect.accept_discloses_zero_information,true);
assert.equal(c.suspect.disclosure_requires_new_explicit_action,true);
assert.equal(c.suspect.disclosure_is_optional,true);
assert.equal(c.suspect.no_automatic_notice_to_other_suspects,true);
assert.equal(c.suspect.no_automatic_acceptance_notice_to_investigator,true);
assert.equal(c.personal_goal_policy.new_goal_is_about_user_self_interest,true);
assert.equal(c.evidence_and_replay.without_informant_still_solvable,true);
assert.equal(c.evidence_and_replay.c3_independent_evidence_sources_min,2);
assert.equal(c.story_80_20.own_case_share_editorial,80);
assert.equal(c.story_80_20.shared_santoro_share_editorial,20);
assert.equal(c.story_80_20.examples.length,5);
assert.match(story,/ACCEPTER ET DEVENIR INDIC/);
assert.match(story,/REFUSER ET GARDER MON OBJECTIF/);
assert.match(story,/AUCUN renseignement|aucun renseignement/i);
assert.match(story,/ancien objectif.*plus .valu.|objectif.*remplac/i);
for(const x of c.story_80_20.examples){
 assert.ok(c.scenarios.includes(x.id));assert.ok(x.risk&&x.personal_goal&&x.shared);
}
const players=[
 {id:'E',role:'enqueteur',camp:'investigation',original_goal:'Reconstruct the four crime liabilities'},
 {id:'A',role:'associato',camp:'suspect',original_goal:'Keep your cut of the racket'},
 {id:'B',role:'caporegime',camp:'suspect',original_goal:'Avoid being blamed for wrong homicide orders'},
 {id:'C',role:'contabile',camp:'suspect',original_goal:'Show ledger is not forged'}
];
const terms=(id)=>({
 original_goal:players.find(x=>x.id===id).original_goal,
 informant_goal:'Expose a corrupt rival while staying clear of main homicide liability',
 certain_effects:'Secret informant flag and objective replacement immediately',
 possible_benefits:'You may request conditional confidentiality after genuine proof',
 exposure_risk:'Unique ledger access might identify who supplied a statement',
 financial_risk:'The crew may withdraw your share of weekly collection',
 judicial_risk:'This evidence might also incriminate you in extortion',
 rank_retaliation_conditions:'Only authorized rank with evidence, never mere rumor',
 protection_conditions:'Only the competent authority may approve temporary protection',
 protection_approval_status:'None currently granted; possible request only',
 scope_of_optional_disclosures:'A statement you choose later, not on acceptance',
 unknown_facts_limits:'You do not know who ordered the homicide',
 accept_label:'Accept and become a secret informant',
 decline_label:'Refuse and keep your original objective'
});
const room=()=>createV16Room({scenarioId:'021',players,maxOffers:2});
const zero=room();
assert.equal(zero.informantCount(),0);
assert.throws(()=>zero.sendOffer('E','A',terms('A')),/cycle 2 required/);
zero.advanceCycle(2);
assert.throws(()=>zero.sendOffer('A','B',terms('B')),/investigator only/);
assert.throws(()=>zero.sendOffer('E','E',terms('A')),/eligible suspect only/);
assert.throws(()=>zero.sendOffer('E','A',{...terms('A'),exposure_risk:''}),/full up-front/);
assert.throws(()=>zero.sendOffer('E','A',{...terms('A'),original_goal:'fake goal'}),/original objective/);
zero.sendOffer('E','A',terms('A'));
assert.equal(zero.recipientCard('A').informant_goal,terms('A').informant_goal);
assert.equal(zero.privateFor('A').activeGoal,players[1].original_goal);
assert.equal(zero.informantCount(),0);
assert.throws(()=>zero.submitDisclosure('A','some disclosure text'),/not an informant/);
assert.equal(zero.respond('A','decline').objectiveUnchanged,true);
assert.equal(zero.privateFor('A').decision,'declined');
assert.equal(zero.privateFor('A').activeGoal,players[1].original_goal);
assert.equal(zero.respond('A','decline').idempotent,true);
assert.throws(()=>zero.respond('A','accept'),/already final/);
assert.equal(zero.informantCount(),0);
zero.advanceCycle(3);zero.lock();
assert.throws(()=>zero.sendOffer('E','B',terms('B')),/verdict locked/);
assert.equal(zero.informantCount(),0);

const one=room();one.advanceCycle(2);
one.sendOffer('E','A',terms('A'));
const r=one.respond('A','accept');
assert.equal(r.privateStatus,'informant');
assert.equal(r.disclosed,0);
assert.equal(one.informantCount(),1);
assert.equal(one.privateFor('A').informant,true);
assert.equal(one.privateFor('A').previousGoal,players[1].original_goal);
assert.equal(one.privateFor('A').activeGoal,terms('A').informant_goal);
assert.equal(one.privateFor('A').disclosures.length,0);
assert.equal(one.respond('A','accept').idempotent,true);
assert.equal(one.privateFor('A').disclosures.length,0);
assert.throws(()=>one.respond('A','decline'),/already final/);
const publicResponse=JSON.stringify(one.publicView());
const invResponse=JSON.stringify(one.investigatorView('E'));
for(const secret of ['informant','disclosure','accepted','Expose a corrupt rival','secret informant']) {
 assert.equal(publicResponse.includes(secret),false,'public leak: '+secret);
 assert.equal(invResponse.includes(secret),false,'investigator leak: '+secret);
}
one.advanceCycle(3);
assert.equal(one.privateFor('A').disclosures.length,0,'silence may persist to C3');
const d=one.submitDisclosure('A','The second ledger included an additional payment');
assert.equal(d.privateSubmission,true);
assert.equal(one.privateFor('A').disclosures.length,1);
assert.equal(JSON.stringify(one.publicView()).includes('additional payment'),false);
assert.equal(JSON.stringify(one.investigatorView('E')).includes('additional payment'),false);
one.lock();assert.throws(()=>one.submitDisclosure('A','More news in a statement'),/verdict locked/);

const two=room();two.advanceCycle(2);
two.sendOffer('E','A',terms('A'));two.sendOffer('E','B',terms('B'));
two.respond('A','accept');two.respond('B','accept');
assert.equal(two.informantCount(),2);
assert.equal(two.privateFor('B').disclosures.length,0);
assert.throws(()=>two.sendOffer('E','C',terms('C')),/budget exhausted/);
console.log('OMERTA V16 PASS — C2 Investigator offers; single complete card; Accept => private informant + immediate new goal; Refuse => old goal; zero automatic disclosures; optional later disclosure; 0/1/2 informants; privacy.');
console.log('NON-LIVE simulation only; backend implementation, real packs and multiplayer QA remain required.');
