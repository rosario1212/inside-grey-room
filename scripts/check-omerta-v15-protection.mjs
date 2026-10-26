#!/usr/bin/env node
// OMERTA V15 — independent editorial safety tests, no Supabase and no real protection.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewProtection} from '../qa/omerta-v15-protection-review-simulator.mjs';

const spec=JSON.parse(await readFile('qa/omerta-v15-protection-contract.json','utf8'));
const doc=await readFile('docs/OMERTA_V15_CONDITIONAL_PROTECTION_BY_RANK.md','utf8');
assert.equal(spec.version,'OMERTA-V15');
assert.equal(spec.live,false);
assert.deepEqual(spec.scenarios,['021','022','023','024','025']);
assert.equal(spec.invariants.investigator_cannot_authorize_federal_protection,true);
assert.equal(spec.invariants.never_use_rank_alone_to_approve_or_deny,true);
assert.equal(spec.invariants.zero_informants_possible,true);
assert.equal(spec.invariants.protection_not_equal_to_immunity,true);
assert.equal(spec.invariants.protection_not_equal_to_complete_safety,true);
assert.equal(spec.invariants.no_protection_import_to_other_episode,true);
assert.equal(spec.invariants.offered_from_cycle,2);
assert.equal(spec.case_protection_examples.length,5);
assert.ok(spec.quality_gates.length>=12);
assert.ok(Object.values(spec.release_blockers).every(x=>x===false));
for(const id of spec.scenarios)assert.ok(doc.includes(id+' '));
assert.match(doc,/Don Santoro/);
assert.match(doc,/80 %/);assert.match(doc,/20 %/);
const options={
 requesterRole:'enqueteur',subjectRank:'associato',tier:'temporary',
 testimonyValue:2,documentedThreat:2,essentialWitness:false,
 suitablePrecautions:true,authorized:true
};
assert.throws(()=>reviewProtection({...options,requesterRole:'caporegime'}),/only investigator/);
assert.throws(()=>reviewProtection({...options,subjectRank:'invalid'}),/invalid suspect/);
assert.throws(()=>reviewProtection({...options,tier:'automatic_immunity'}),/invalid protection level/);
const basic=reviewProtection({...options,tier:'confidential',authorized:null});
assert.equal(basic.decision,'discretion_offered');
assert.equal(basic.physicalProtection,false);
assert.equal(basic.residualRisks.length,3);
const absent=reviewProtection({...options,documentedThreat:0});
assert.equal(absent.decision,'unsupported_request');
assert.equal(absent.effective,false);
const basicApproved=reviewProtection(options);
assert.equal(basicApproved.decision,'approved_by_competent_authority');
assert.equal(basicApproved.physicalProtection,'limited_temporary');
const directDenied=reviewProtection({...options,authorized:false});
assert.equal(directDenied.decision,'refused_by_authority');
const draft=reviewProtection({...options,authorized:null});
assert.equal(draft.decision,'requested_pending');
assert.equal(draft.effective,false);
const capo=reviewProtection({...options,subjectRank:'caporegime'});
assert.equal(capo.decision,'requested_pending');
assert.equal(capo.needs.seniorExposurePlan,true);
const approvedCapo=reviewProtection({...options,subjectRank:'caporegime',seniorExposurePlan:true});
assert.equal(approvedCapo.decision,'approved_by_competent_authority');
const sameLowUnproved=reviewProtection({...options,subjectRank:'associato',testimonyValue:1});
assert.equal(sameLowUnproved.decision,'unsupported_request');
const betterDon=reviewProtection({
 requesterRole:'enqueteur',subjectRank:'don',tier:'enhanced',
 testimonyValue:3,documentedThreat:3,essentialWitness:true,
 riskToOthersAssessed:true,suitablePrecautions:true,
 seniorExposurePlan:true,authorized:true
});
assert.equal(betterDon.decision,'approved_by_competent_authority');
assert.equal(betterDon.authorizedBy,'competent_authority_not_investigator');
assert.equal(betterDon.residualRisks.length,3);
const pendingDon=reviewProtection({
 requesterRole:'enqueteur',subjectRank:'don',tier:'enhanced',
 testimonyValue:3,documentedThreat:3,essentialWitness:true,
 riskToOthersAssessed:true,suitablePrecautions:true,
 authorized:true
});
assert.equal(pendingDon.decision,'referred_pending');
assert.equal(pendingDon.needs.seniorExposurePlan,true);
const withoutVetting=reviewProtection({
 requesterRole:'enqueteur',subjectRank:'don',tier:'enhanced',
 testimonyValue:3,documentedThreat:3,essentialWitness:true,
 riskToOthersAssessed:false,suitablePrecautions:true,
 seniorExposurePlan:true,authorized:true
});
assert.equal(withoutVetting.decision,'referred_pending');
const uselessInformation=reviewProtection({
 requesterRole:'enqueteur',subjectRank:'don',tier:'enhanced',
 testimonyValue:1,documentedThreat:3,essentialWitness:true,
 riskToOthersAssessed:true,suitablePrecautions:true,
 seniorExposurePlan:true,authorized:true
});
assert.equal(uselessInformation.decision,'unsupported_request');
const usefulButNotEssential=reviewProtection({
 requesterRole:'enqueteur',subjectRank:'associato',tier:'enhanced',
 testimonyValue:3,documentedThreat:3,essentialWitness:false,
 riskToOthersAssessed:true,suitablePrecautions:true,
 authorized:true
});
assert.equal(usefulButNotEssential.decision,'unsupported_request');
assert.ok(doc.includes('DON')||doc.includes('Don'));
console.log('OMERTA V15 editorial+simulator PASS: confidentiality not physical protection; pending/refused/approved; senior scrutiny and valuable Don eligible; residual risk always.');
console.log('This proves NO live protection. Secure servers, private variants and human multiplayer still required.');
