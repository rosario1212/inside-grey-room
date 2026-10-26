#!/usr/bin/env node
// V23: offline contract and truth-validation tests; not production RPC.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradeInformantTwoChecks} from '../qa/omerta-v23-two-checks-evaluator.mjs';
const c=JSON.parse(await readFile('qa/omerta-v23-informant-two-checks-contract.json','utf8'));
const md=await readFile('docs/OMERTA_V23_TWO_CHECKS_ONE_INFORMANT_OBJECTIVE.md','utf8');
assert.equal(c.version,'OMERTA-V23');
assert.equal(c.status,'EDITORIAL_AND_TEST_ONLY_NOT_LIVE');
assert.equal(c.cases.length,5);
assert.deepEqual(c.cases.map(x=>x.id),['021','022','023','024','025']);
for(const v of Object.values(c.contract))assert.notEqual(v,false,'V23 invariant violated');
assert.ok(md.includes('1. SAUVE TA PEAU')&&md.includes('2. RENSEIGNE L’ENQUÊTE')||md.includes("2. RENSEIGNE L'ENQUÊTE"));
assert.ok(md.includes('UNE seule information suffit'));
assert.ok(md.includes('Accepter'));
const all=c.cases.flatMap(x=>x.roles.map(g=>({caseId:x.id,...g})));
assert.equal(all.length,35);
assert.equal(new Set(all.map(g=>g.caseId+':'+g.rank)).size,35);
for(const g of all){
 assert.notEqual(g.indic.condition_1.text.toLowerCase(),g.suspect_goal.replace(/^Au (verdict|dénouement),\s*/,'').toLowerCase());
 assert.match(g.indic.condition_1.text,/^(Évite|Obtiens)/);
 assert.equal(g.indic.condition_2.text,'Transmets un renseignement vrai, utile et vérifiable.');
 assert.ok(g.indic.condition_2.expected_case_subject.length>12);
 assert.equal(g.indic.victory,'both_conditions_true');
 assert.equal(g.indic.forced_disclosure_at_acceptance,false);
 assert.equal(g.indic.stays_mafia,true);
 assert.equal(g.indic.silence_means_informant_cannot_win,true);
 assert.ok(md.includes('| **'+g.label+'** |'));
 assert.ok(md.includes(g.indic.condition_1.text));
}
const sample=c.cases[4].roles.find(g=>g.rank==='soldato');
assert.equal(sample.indic.condition_1.scored_by,'avoid_attribution');
const arg={
 objective:sample.indic,playerId:'P1',caseId:'025',variantId:'B',
 roleSlotId:'soldato-B',
 lockedVerdict:{[sample.indic.condition_1.crime_axis]:[]},
 caseEvents:{interests:{},protections:[]},
 claims:[],
 sealedFactCatalog:{
  'clue-A':{
   ownerPlayerId:'P1',caseId:'025',variantId:'B',
   roleSlotId:'soldato-B',truthVerified:true,relevant:true,
   privateToPlayerAtStart:true,independentCorroboration:true,
   firstPublicAt:Infinity
  }
 }
};
const disclosure={clueId:'clue-A',sentAt:55,explicitlySent:true};
const check=()=>gradeInformantTwoChecks(arg);
assert.deepEqual([check().safe,check().usefulDisclosure,check().won],[true,false,false],'silence: self-safe alone loses');
arg.claims=[disclosure];
assert.deepEqual([check().safe,check().usefulDisclosure,check().won],[true,true,true],'both => win');
arg.lockedVerdict[sample.indic.condition_1.crime_axis]=[{player_id:'P1',level:'principal'}];
assert.deepEqual([check().safe,check().usefulDisclosure,check().won],[false,true,false],'information without safety loses');
arg.claims=[];
assert.deepEqual([check().safe,check().usefulDisclosure,check().won],[false,false,false],'neither loses');
arg.lockedVerdict[sample.indic.condition_1.crime_axis]=[];
arg.claims=[{...disclosure,explicitlySent:false}];
assert.equal(check().won,false,'accepting alone never sends an info');
arg.claims=[disclosure];
for(const change of [
 {truthVerified:false},{relevant:false},{independentCorroboration:false},
 {privateToPlayerAtStart:false},{ownerPlayerId:'wrong'},
 {variantId:'A'},{roleSlotId:'someone-else'},
 {firstPublicAt:20}
]){
 const current=arg.sealedFactCatalog['clue-A'];
 arg.sealedFactCatalog['clue-A']={...current,...change};
 assert.equal(check().usefulDisclosure,false,'bad clue must not count: '+JSON.stringify(change));
 arg.sealedFactCatalog['clue-A']=current;
}
arg.sealedFactCatalog['clue-A'].firstPublicAt=70; // published AFTER delivery; valid
assert.equal(check().won,true);
arg.sealedFactCatalog['clue-A'].firstPublicAt=55; // public AT time of delivery; invalid
assert.equal(check().won,false);
arg.sealedFactCatalog['clue-A'].firstPublicAt=Infinity;
assert.throws(()=>gradeInformantTwoChecks({...arg,lockedVerdict:{}}),/unavailable/);
const protectedRole=c.cases[2].roles.find(x=>x.rank==='soldato');
assert.equal(protectedRole.indic.condition_1.scored_by,'approved_protection');
const prArgs={...arg,objective:protectedRole.indic,caseId:'023',
 lockedVerdict:{},claims:[disclosure],
 sealedFactCatalog:{'clue-A':{...arg.sealedFactCatalog['clue-A'],caseId:'023'}},
 caseEvents:{protections:[{player_id:'P1',status:'pending',level:'temporary',authorized_by_competent_authority:false}]}};
assert.equal(gradeInformantTwoChecks(prArgs).won,false,'requested protection is not win');
prArgs.caseEvents.protections[0].status='approved';
prArgs.caseEvents.protections[0].authorized_by_competent_authority=true;
assert.equal(gradeInformantTwoChecks(prArgs).won,true,'real protection + useful fact wins');
console.log('OMERTA V23 EDITORIAL PASS: 35 ranks, one objective/two AND conditions; 0/1/2 checks, truth, relevance, private ownership, corroboration, public timestamps, independent safety, protection approval.');
console.log('NOT LIVE: authored role/variant clues, secure RPC and end-of-game scorer are required before publication.');
