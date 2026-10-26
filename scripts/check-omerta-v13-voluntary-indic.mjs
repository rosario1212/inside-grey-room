#!/usr/bin/env node
// The latest OMERTA editorial source of truth is V13.
// Exercise zero, one and multiple voluntary informants WITHOUT asserting that
// this prototype is wired to a real room. Production rollout is separately gated.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeTurncoatSimulation} from '../qa/omerta-v13-turncoat-choice-simulator.mjs';

const spec=JSON.parse(await readFile('qa/omerta-v13-voluntary-turncoat-contract.json','utf8'));
const design=await readFile('docs/OMERTA_V13_VOLUNTARY_TURNCOAT_RISK_80_20.md','utf8');
assert.equal(spec.version,'OMERTA-V13');
assert.deepEqual(spec.scenarios,['021','022','023','024','025']);
assert.equal(spec.turncoat.at_start,0);
assert.equal(spec.turncoat.required_minimum,0);
assert.equal(spec.turncoat.only_explicit_player_commit,true);
assert.equal(spec.turncoat.never_auto_assigned,true);
assert.equal(spec.turncoat.preview_has_cost,false);
assert.equal(spec.turncoat.commit_requires_second_confirmation,true);
assert.equal(spec.turncoat.never_softlocks_progress,true);
assert.equal(spec.evidence_contract.no_informant_case_solvable,true);
assert.ok(spec.evidence_contract.independent_c3_sources_min>=2);
assert.equal(spec.phase_contract.official_confrontations_from_cycle,2);
assert.equal(spec.phase_contract.turncoat_offer_from_cycle,2);
assert.equal(spec.eighty_twenty.case_specific,80);
assert.equal(spec.eighty_twenty.shared_Santoro,20);
assert.equal(spec.four_rules.length,4);
assert.equal(spec.case_hooks.length,5);
assert.equal(spec.release_blockers.production_released,false);
assert.match(design,/AUCUN joueur ne débute INDIC/i);
assert.match(design,/Sans indic/);
assert.match(design,/irréversible/);
for(const s of spec.case_hooks){
 assert.ok(spec.scenarios.includes(s.id));
 assert.ok(s.risk && s.potential_benefit && s.without_turncoat);
 assert.ok(design.includes('### '+s.id+' — '));
}
const sampleOffer={
  fact_to_be_disclosed:'Financial note from this specific case',
  potential_benefit:'Contingent attempt to reduce culpability for other acts',
  economic_and_social_risks:'Crew trust may be lost if access is exposed',
  legal_risk_in_fiction:'Statement might incriminate the holder',
  condition_of_protection:'Only if independently verified, not automatic',
  new_personal_win_condition:'Avoid a principal liability ruling while preserving specific interest',
  case_specific_exposure_route:'Crew can identify which accountant saw the note',
  what_is_unknown:'The identity of the person who ordered the homicide'
};
const newRoom=()=>makeTurncoatSimulation(['a','b','c'],['a','b']);
const none=newRoom();
assert.equal(none.countCommitted(),0);
assert.throws(()=>none.inspect('a',sampleOffer),/before cycle 2/);
none.cycle(2);
const preview=none.preview('a');assert.equal(preview.cost,false);
assert.equal(none.privateState('a').state,'none');
none.inspect('a',sampleOffer);
none.decline('a');
assert.equal(none.countCommitted(),0);
assert.equal(none.privateState('a').state,'none');
none.cycle(3);none.lock();assert.equal(none.countCommitted(),0);
assert.throws(()=>none.preview('a'),/locked/);
const single=newRoom();single.cycle(2);
assert.throws(()=>single.inspect('c',sampleOffer),/ineligible/);
assert.throws(()=>single.inspect('a',{...sampleOffer,legal_risk_in_fiction:''}),/complete benefit\/risk card required/);
single.inspect('a',sampleOffer);
assert.throws(()=>single.confirm('a',true),/second confirmation/);
single.startConfirmation('a');
assert.throws(()=>single.confirm('a',false),/second confirmation/);
single.confirm('a',true);assert.equal(single.countCommitted(),1);
assert.throws(()=>single.decline('a'),/cannot undo|already committed/);
const pub=JSON.stringify(single.publicSnapshot());assert.ok(!pub.includes('committed'));
assert.ok(!pub.includes('source'));assert.ok(!pub.includes(sampleOffer.fact_to_be_disclosed));
assert.equal(single.privateState('a').state,'committed');
single.cycle(3);assert.equal(single.privateState('a').state,'committed');
const multiple=newRoom();multiple.cycle(2);
for(const id of ['a','b']){multiple.inspect(id,sampleOffer);multiple.startConfirmation(id);multiple.confirm(id,true)}
assert.equal(multiple.countCommitted(),2);
assert.equal(multiple.publicSnapshot().players.length,3);
multiple.lock();assert.throws(()=>multiple.preview('b'),/locked/);
console.log('OMERTA V13 editorial + behavior simulation PASS: 0/1/2 voluntary informants; disclosed risks; reversible inspection; irreversible double confirmation; no public exposure; no cross-case state.');
console.log('IMPORTANT: No live RPC, private cards, or multiplayer playtest is certified.');
