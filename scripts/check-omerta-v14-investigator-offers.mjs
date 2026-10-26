#!/usr/bin/env node
// OMERTA V14 checks — self-contained design and test-only behavior simulation.
// Does not call Supabase, send messages, expose variants, or alter live rooms.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createOmertaV14Case} from '../qa/omerta-v14-investigator-offer-simulator.mjs';

const c=JSON.parse(await readFile('qa/omerta-v14-investigator-offers-and-rank-retaliation.json','utf8'));
const design=await readFile('docs/OMERTA_V14_INVESTIGATOR_OFFERS_RANK_RETALIATION.md','utf8');
assert.equal(c.version,'OMERTA-V14');
assert.equal(c.live_gameplay_verified,false);
assert.deepEqual(c.scenarios,['021','022','023','024','025']);
assert.equal(c.four_laws.length,4);
assert.equal(c.play.offers_start_cycle,2);
assert.equal(c.play.confrontations_start_cycle,2);
assert.equal(c.informant.initiator_role,'enqueteur');
assert.equal(c.informant.none_at_start,true);
assert.equal(c.informant.zero_possible,true);
assert.equal(c.informant.only_player_can_commit,true);
assert.equal(c.informant.no_acceptance_read_receipt_to_investigator,true);
assert.equal(c.informant.no_public_notification_on_offer_or_commit,true);
assert.equal(c.informant.commit_requires_explicit_second_confirmation,true);
assert.equal(c.informant.can_decline_without_system_penalty,true);
assert.equal(c.knowledge.suspicion.severe_retaliation_allowed,false);
assert.equal(c.knowledge.corroborated.severe_retaliation_allowed,false);
assert.equal(c.knowledge.proven.severe_retaliation_allowed,true);
assert.equal(c.retaliation.no_player_elimination_during_case,true);
assert.equal(c.retaliation.no_rank_knows_informant_secret_automatically,true);
assert.equal(c.retaliation.severe_actions_only_endgame,true);
assert.equal(c.retaliation.no_required_evidence_destruction,true);
assert.equal(c.cases.length,5);
for(const d of c.cases){
  assert.ok(['021','022','023','024','025'].includes(d.id));
  for(const k of ['offer_value','offer_risk','rank_retaliation','no_indic_path','eighty','twenty'])assert.ok(d[k]?.length>14,d.id+' '+k);
  assert.ok(design.includes(d.id+' '));
}
assert.ok(design.includes('## 5. APPLICATION AUX CINQ DOSSIERS'));
assert.match(design,/SEUL. L.ENQU.TEUR|Seul l.Enqu.teur|Seul l.Enqu.teur/i);
assert.match(design,/80 %/);
assert.match(design,/20 %/);
assert.match(design,/possibilit. de r.ponse|possibilit. de d.fense|possibilit. de r.ponse de la cible/i);
assert.match(design,/aucun.*indic|z.ro indic/i);

const participants=[
  {id:'i',role:'enqueteur',camp:'investigation'},
  {id:'a',role:'associato',camp:'suspect'},
  {id:'s',role:'uomo_onore',camp:'suspect'},
  {id:'c',role:'caporegime',camp:'suspect'},
  {id:'m',role:'consigliere',camp:'suspect'},
  {id:'u',role:'sottocapo',camp:'suspect'},
  {id:'d',role:'don',camp:'suspect'},
  {id:'f',role:'contabile',camp:'suspect'}
];
const offer={
 fact_to_be_disclosed:'A ledger annotation that was never publicly disclosed',
 conditional_benefit:'Conditional protection if the ledger is authenticated',
 economic_risk:'Losing a share of the racket and a debt owed by the capo',
 judicial_risk:'The transmission could reveal own past participation in collection',
 mafia_retaliation_risk:'The crew may withdraw a business favor if it can identify the source',
 exposure_route:'Two witnesses can potentially establish who had access to the ledger',
 personal_goal_after_commit:'Have a rival held liable for the money while avoiding principal homicide liability',
 protection_limits:'No guarantee of immunity, secrecy, safety or a favorable verdict'
};
const make=()=>createOmertaV14Case({scenarioId:'021',players:participants,offerLimit:2});
const none=make();
assert.equal(none.committedCount(),0);
assert.throws(()=>none.sendProposal('i','a',offer),/not until cycle 2/);
assert.throws(()=>none.inspect('a'),/not until cycle 2/);
none.advanceCycle(2);
assert.throws(()=>none.sendProposal('a','s',offer),/investigator only/);
assert.throws(()=>none.sendProposal('i','i',offer),/eligible suspect/);
assert.throws(()=>none.sendProposal('i','a',{...offer,judicial_risk:''}),/risk disclosure missing/);
assert.equal(none.sendProposal('i','a',offer).sent,true);
assert.throws(()=>none.sendProposal('i','a',offer),/duplicate recipient/);
assert.equal(none.committedCount(),0);
assert.equal(none.investigatorView('i').remaining,1);
assert.equal(none.investigatorView('i').sentTo.join(','),'a');
assert.throws(()=>none.investigatorView('a'),/investigator only/);
const inspected=none.inspect('a');assert.equal(inspected.protection_limits,offer.protection_limits);
assert.equal(none.decline('a').penalty,false);
assert.equal(none.committedCount(),0);
none.sendProposal('i','s',offer);
assert.throws(()=>none.sendProposal('i','c',offer),/budget exhausted/);
none.advanceCycle(3);none.lockVerdict();
assert.equal(none.committedCount(),0);
assert.throws(()=>none.sendProposal('i','c',offer),/verdict locked/);

const one=make();one.advanceCycle(2);one.sendProposal('i','c',offer);
assert.throws(()=>one.commit('c',true),/confirmation/);
one.inspect('c');
assert.throws(()=>one.commit('c',true),/confirmation/);
one.prepare('c');
assert.throws(()=>one.commit('c',false),/confirmation/);
one.commit('c',true);
assert.equal(one.committedCount(),1);
assert.throws(()=>one.decline('c'),/cannot withdraw/);
const inv=JSON.stringify(one.investigatorView('i'));
assert.ok(!inv.includes('committed')&&!inv.includes('confirmed')&&!inv.includes('fact_to_be_disclosed'));
const pub=JSON.stringify(one.publicState());
for(const secret of ['committed','indic','offer','private','fact_to_be_disclosed','personal_goal_after_commit'])assert.ok(!pub.includes(secret),'leaked '+secret);
assert.equal(one.getOwnPrivateState('c').state,'committed');
one.advanceCycle(3);assert.equal(one.getOwnPrivateState('c').state,'committed');

const many=make();many.advanceCycle(2);
for(const id of ['a','s']){
 many.sendProposal('i',id,offer);
 many.inspect(id);many.prepare(id);many.commit(id,true);
}
assert.equal(many.committedCount(),2);
assert.equal(many.publicState().roster.length,participants.length);

// Rank retaliation is based on VERIFIED case evidence, not a secret indic flag.
const rank=make();rank.advanceCycle(2);
rank.testOnlyInjectVerifiedEvidence('a','suspicion');
assert.equal(rank.proposeRetaliation('s','a','report_to_capo').fictional,true);
assert.throws(()=>rank.proposeRetaliation('c','a','freeze_crew_share'),/insufficient corroboration/);
assert.throws(()=>rank.proposeRetaliation('a','s','authorize_endgame_major_sanction'),/rank cannot/);
assert.throws(()=>rank.proposeRetaliation('i','a','report_to_capo'),/rank not in Familia/);
rank.testOnlyInjectVerifiedEvidence('a','corroborated');
assert.equal(rank.proposeRetaliation('c','a','freeze_crew_share').noElimination,true);
assert.equal(rank.proposeRetaliation('m','a','request_hearing').fictional,true);
assert.throws(()=>rank.proposeRetaliation('u','a','approve_local_exclusion',{targetReplied:true}),/insufficient corroboration/);
rank.testOnlyInjectVerifiedEvidence('a','proven');
assert.throws(()=>rank.proposeRetaliation('d','a','authorize_endgame_major_sanction',{targetReplied:true}),/only after verdict/);
rank.lockVerdict();
assert.throws(()=>rank.proposeRetaliation('d','a','authorize_endgame_major_sanction'),/allowed to reply/);
assert.equal(rank.proposeRetaliation('d','a','authorize_endgame_major_sanction',{targetReplied:true}).noElimination,true);
assert.equal(rank.proposeRetaliation('u','a','approve_local_exclusion',{targetReplied:true}).fictional,true);
const consequenceString=JSON.stringify(rank.getRetaliationsForEndgame());
assert.ok(!consequenceString.includes('is_informant'));
assert.equal(createOmertaV14Case({scenarioId:'025',players:participants}).committedCount(),0);
console.log('OMERTA V14 PASS: investigator-only offers, C2+, 0/1/2 informants, free inspection, informed second consent, rank/evidence-tier retaliation and no automatic secret leak.');
console.log('Only a simulation and editorial contract: secure RPCs, private variants and multiplayer production remain unverified.');
