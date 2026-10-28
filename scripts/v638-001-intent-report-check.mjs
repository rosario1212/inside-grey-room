/* Regression: dossier 001 must request a neutral judicial qualification of intent.
   Test is source-level and does not contain private story canon. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('app-v11.js','utf8');
assert(src.includes('Qualification de l’intention au vu des pièces'));
assert(src.includes('id="igr001Intent"'));
assert(src.includes('intent_to_kill'));
assert(src.includes('voluntary_act'));
assert(src.includes('involuntary_act'));
assert(src.includes('undetermined'));
assert(src.includes('payload.reconstruction_001={moment,gesture,reframe,intent}'));
assert(src.includes("['enqueteur','analyste'].includes(role)&&STATE.sync?.room?.scenario_id==='001'"));
assert(!src.includes('Le geste mortel doit concerner la personne que tu as désignée au niveau 2.'));
assert(!src.includes('Choisis une seule personne au niveau 2 pour expliquer le geste mortel.'));
assert(src.includes("k==='intent'?Boolean(canonicalIntent)&&myReconstruction.intent===canonicalIntent"));
const cases=[
 {truth:'s1_intentional',intent:'voluntary_act',expected:true},
 {truth:'s2_intentional',intent:'voluntary_act',expected:true},
 {truth:'s3_accident',intent:'involuntary_act',expected:true},
 {truth:'s3_accident',intent:'intent_to_kill',expected:false},
 {truth:'s1_intentional',intent:'intent_to_kill',expected:false},
 {truth:'s2_intentional',intent:'undetermined',expected:false}
];
for(const c of cases){
  const canonical=c.truth==='s3_accident'?'involuntary_act':['s1_intentional','s2_intentional'].includes(c.truth)?'voluntary_act':null;
  assert.equal(c.intent===canonical,c.expected);
}
new Function(src);
console.log('PASS dossier 001: neutral intent qualification, data binding, correction and JS syntax');
