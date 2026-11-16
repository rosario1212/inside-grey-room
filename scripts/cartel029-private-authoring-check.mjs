// 029 authoring preflight. PRIVATE input only; never commit scenario manuscripts.
// Usage: node scripts/cartel029-private-authoring-check.mjs /private/path/contract.json
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const path=process.argv[2];
if(!path) throw Error('Pass a private, local JSON path');
const doc=JSON.parse(await readFile(path,'utf8'));
const same=(a,b)=>assert.deepEqual([...a].sort(),[...b].sort());
assert.equal(doc.id,'029');
assert.match(doc.status,/NON ACTIVÉ/);
const a=doc.accounting;
assert.equal(a.initial,30);
assert.equal(a.escape_attempts,4);
assert.equal(a.escapees,3);
assert.equal(a.total_deaths,7);
assert.equal(a.remaining_captive,20);
assert.equal(a.initial,a.escapees+a.total_deaths+a.remaining_captive);
assert.equal(a.deaths_pre_escape+a.recaptured_killed,a.total_deaths);
same(Object.keys(doc.branches),['A','B','C']);
same(Object.keys(doc.witness_profiles),['V1','V2','V3','V4','V5']);
same(Object.keys(doc.witnesses),['T1','T2','T3','T4']);
same(doc.public_roster.mandatory,['enquêteur','analyste','témoin_1','témoin_2','témoin_3','témoin_4']);
assert.equal(doc.interrogation.cycle1_required,4);
const expected=['A','B','C'].flatMap(b=>['V1','V2','V3','V4','V5'].map(p=>b+'-'+p));
assert.equal(doc.matrix.length,15);
same(doc.matrix.map(v=>v.base_branch+'-'+v.witness_profile),expected);
assert(doc.matrix.every(v=>v.status==='AUTHORING_ONLY_NOT_ACTIVATED'));
const proofIds=new Set(doc.evidence.map(p=>p.id));
assert.equal(proofIds.size,doc.evidence.length);
const factIds=new Set(Object.keys(doc.truths));
for(const p of doc.evidence){
 assert(p.cycle>=1&&p.cycle<=3);
 assert(p.facts?.length&&p.facts.every(f=>factIds.has(f)));
 assert(p.text?.trim());
}
for(const v of doc.matrix){
 assert(v.guaranteed_c3_reconciliation?.length>=2);
 assert(v.guaranteed_c3_reconciliation.every(id=>proofIds.has(id)));
}
same(Object.keys(doc.private_exhibits.P14),['V1','V2','V3','V4','V5']);
same(Object.keys(doc.private_exhibits.P15),['A','B','C']);
assert(doc.pressure_messages.length>=5);
assert(doc.pressure_messages.every(m=>m.auto_result===false&&m.trigger?.trim()&&m.text?.trim()));
const safeguards=doc.protective_constraints.join(' ').toLowerCase();
assert(safeguards.includes('aucun enlèvement'));
assert(safeguards.includes('aucune mort définitive'));
same(doc.report_sections.map(s=>s.key),['santa_ceniza','activities','hierarchy','other_sites','leak','protection']);
console.log('029 confidential authoring contract valid (15 combinations; NOT a playable build, approval or privacy test)');
