#!/usr/bin/env node
// OMERTA V19: editorial QA for ready-to-render goal wording.
// Does NOT prove that the private variants, roles or verdict engine exist live.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const s=await readFile('docs/OMERTA_V19_VERBATIM_PLAYER_GOALS_021_025.md','utf8');
const rolesByScenario={
 '021':['Suspect','Associato','Soldato','Contabile','Capo','Consigliere'],
 '022':['Suspect','Associato','Soldato','Contabile','Capo','Consigliere'],
 '023':['Suspect','Associato','Soldato','Contabile','Capo','Consigliere','Sottocapo'],
 '024':['Suspect','Associato','Soldato','Contabile','Capo','Consigliere','Pentito'],
 '025':['Suspect','Associato','Soldato','Contabile','Capo','Consigliere','Sottocapo','Don Santoro','Pentito']
};
let total=0,indicGoals=0;
for(const [id,roleLabels] of Object.entries(rolesByScenario)){
 const start=s.indexOf('# '+id+' — ');
 assert.ok(start>0,id+' heading');
 const next=s.indexOf('\n# ',start+1);
 const part=s.slice(start,next>0?next:s.length).split('\n---\n')[0];
 assert.match(part,/\*\*ÉNONCÉ commun/);
 assert.match(part,/\*\*80 %\*\*/);
 assert.match(part,/\*\*20 %\*\*/);
 const lines=part.split('\n').filter(x=>x.startsWith('| **'));
 assert.equal(lines.length,roleLabels.length,id+' expected exactly '+roleLabels.length+' specific role lines');
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  assert.ok(line.includes(roleLabels[i]),id+' role '+roleLabels[i]);
  const columns=line.split(' | ');
  assert.ok(columns.length>=3,id+' invalid markdown row');
  const quoted=[...line.matchAll(/«([^»]+)»/g)].map(m=>m[1]);
  assert.ok(quoted.length>=1,id+' missing initial goal '+roleLabels[i]);
  assert.ok(quoted[0].startsWith('Au verdict,')||quoted[0].startsWith('Au dénouement,'),id+' goal not scoreable');
  assert.ok(quoted[0].endsWith('.'),id+' punctuation');
  assert.ok(quoted[0].split(/\s+/).length<=33,id+' initial goal too long');
  const isPentito=roleLabels[i]==='Pentito';
  if(isPentito){
   assert.ok(line.includes('Non proposé'),id+' formal pentito must not be auto recruited as clandestine indic');
  }else{
   assert.equal(quoted.length,2,id+' missing/extra indic goal for '+roleLabels[i]);
   assert.ok(quoted[1].startsWith('Au verdict,'),id+' informant goal not verdict-based');
   assert.ok(quoted[1].endsWith('.'));
   assert.ok(quoted[1].split(/\s+/).length<=35,id+' indic goal too long');
   assert.notEqual(quoted[1],quoted[0],id+' accept must change objective');
   indicGoals++;
  }
  total++;
 }
}
assert.equal(total,35);
assert.equal(indicGoals,33);
assert.match(s,/15 canons privés|quinze variantes privées/);
assert.match(s,/aucun indic/i);
assert.match(s,/aucune information|sans transmettre automatiquement aucune information|ne.*aucune information/i);
assert.ok(s.includes('UNE cible réelle'));
assert.ok(s.includes('UN acte de verdict'));
assert.ok(s.includes('Le verdict est comparé à la vérité'));
assert.ok(s.includes('être désigné')||s.includes('désigné responsable'));
console.log('OMERTA V19 EDITORIAL PASS — 35 role rows across five standalone cases, 68 exact compact goal lines (35 original, 33 informant), strict endpoint scoring and Pentito separation.');
console.log('NOT a production or 15-variant feasibility certification; every goal must be checked against sealed role assignment and verdict types.');
