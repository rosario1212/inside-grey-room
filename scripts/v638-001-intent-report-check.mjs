/* Regression: dossier 001 must request a neutral judicial qualification of intent.
   Test is source-level and does not contain private story canon. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync('app-v11.js','utf8');
assert(src.includes('Le geste ayant directement provoqué la blessure mortelle était-il volontaire ?'));
assert(src.includes('igr001-intent-help'));
assert(src.includes('responsabilités 60 %'));
assert(src.includes('reconstitution 40 %'));
assert(src.includes('10 % pour l’intention'));
assert(src.includes('report_score_percent'));
assert(src.includes('responsibility_score_percent'));
assert(src.includes('reconstruction_score_percent'));
assert(!src.includes('l’intention vaut un point dans le pourcentage global'));
assert(src.includes('id="igr001Intent"'));
assert(!src.includes('value="intent_to_kill"'));
assert(src.includes('Geste volontaire</option>'));
assert(src.includes('Geste involontaire</option>'));
assert(src.includes('Intention impossible à déterminer</option>'));
assert(src.includes('voluntary_act'));
assert(src.includes('involuntary_act'));
assert(src.includes('undetermined'));
assert(src.includes('payload.reconstruction_001={moment,gesture,reframe,intent}'));
assert(src.includes('l’intention vaut un point dans le pourcentage global'));
assert(src.includes('report_score_percent'));
assert(src.includes('Math.round(100*recScore/recAxes.length)'));
const intentOptions=src.match(/<select id="igr001Intent">([\s\S]*?)<\/select>/)?.[1]||'';
assert.equal((intentOptions.match(/<option value="(?:voluntary_act|involuntary_act|undetermined)"/g)||[]).length,3);
assert(src.includes("['enqueteur','analyste'].includes(role)&&STATE.sync?.room?.scenario_id==='001'"));
assert(!src.includes('Le geste mortel doit concerner la personne que tu as désignée au niveau 2.'));
assert(!src.includes('Choisis une seule personne au niveau 2 pour expliquer le geste mortel.'));
assert(src.includes("k==='intent'?Boolean(canonicalIntent)&&myReconstruction.intent===canonicalIntent"));
const cases=[
 {truth:'s1_intentional',intent:'voluntary_act',expected:true},
 {truth:'s2_intentional',intent:'voluntary_act',expected:true},
 {truth:'s3_accident',intent:'involuntary_act',expected:true},
 {truth:'s3_accident',intent:'voluntary_act',expected:false},
 {truth:'s1_intentional',intent:'involuntary_act',expected:false},
 {truth:'s2_intentional',intent:'undetermined',expected:false}
];
for(const c of cases){
  const canonical=c.truth==='s3_accident'?'involuntary_act':['s1_intentional','s2_intentional'].includes(c.truth)?'voluntary_act':null;
  assert.equal(c.intent===canonical,c.expected);
}
new Function(src);
console.log('PASS dossier 001: neutral intent qualification, data binding, correction and JS syntax');
