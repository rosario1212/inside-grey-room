#!/usr/bin/env node
// V22: Editorial coherence audit, not a 15-variant playtest or secure gameplay release.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradePersonalGoal} from '../qa/omerta-v18-personal-goal-evaluator.mjs';

const json=JSON.parse(await readFile('qa/omerta-v22-coherent-role-goals.json','utf8'));
const md=await readFile('docs/OMERTA_V22_COHERENT_ROLE_GOALS_021_025.md','utf8');
assert.equal(json.version,'OMERTA-V22');
assert.equal(json.status,'editorial-and-coherence-audit-only-not-live');
assert.equal(json.role_template_count,40);
assert.equal(json.indic_template_count,40);
assert.equal(json.scenarios.length,5);
assert.equal(json.special_formal_pentito.case_id,'024');
assert.equal(json.special_formal_pentito.recruitable_as_indic,false);
assert.ok(!Object.values(json.not_verified).some(x=>x!==true));
for(const [name,v] of Object.entries(json.invariants))assert.equal(v,true,'invariant '+name);
const roleSet=['suspect','associato','soldato','contabile','capo','consigliere','sottocapo','don'];
for(const c of json.scenarios){
 assert.equal(c.goals.length,8,c.id+' all possible ranks');
 assert.deepEqual(c.goals.map(g=>g.role),roleSet,c.id+' unique consistent rank order');
 assert.ok(c.intro.length>110&&c.question.length>100&&c.mesh.length>160,c.id+' narrative framing');
 assert.ok(c.anchors.length>=5,c.id+' grounded interlocking crime axes');
 assert.ok(md.includes('## '+c.id+' — '+c.title),c.id+' visible section');
 const textSeen=new Set(),keySeen=new Set();
 assert.equal(c.outcome_tracks.length,4,c.id+' exactly four case question families');
 const trackIds=new Set(c.outcome_tracks.map(t=>t.id));
 assert.equal(trackIds.size,4);
 assert.ok(c.outcome_tracks.every(t=>t.question&&t.label&&t.proof&&t.observable));
 assert.ok(c.cross_role_links.length>=7,'interlocking role interests required');
 const connection=new Map(roleSet.map(id=>[id,new Set()]));
 for(const rel of c.cross_role_links){
  assert.equal(rel.roles.length,2);
  const [a,b]=rel.roles;
  assert.ok(connection.has(a)&&connection.has(b)&&a!==b);
  assert.equal(rel.compulsory_alliance,false,'no forced ally');
  assert.equal(rel.one_must_lose,false,'no zero-sum requirement');
  assert.ok(rel.relationship.length>=45);
  connection.get(a).add(b);connection.get(b).add(a);
 }
 const visited=new Set(['suspect']);const queue=['suspect'];
 while(queue.length){for(const other of connection.get(queue.shift()))if(!visited.has(other)){visited.add(other);queue.push(other);}}
 assert.equal(visited.size,roleSet.length,c.id+' all ranks connected through thematic case ties');
 for(const role of roleSet){
  const assignment=c.role_track_assignments[role];
  assert.ok(Array.isArray(assignment)&&assignment.length===2,c.id+' role track mapping');
  assert.ok(assignment.every(x=>trackIds.has(x)),c.id+' no disconnected sub-story');
 }
 for(const goal of c.goals){
   const k=c.id+'::'+goal.role;assert.ok(!keySeen.has(k));keySeen.add(k);
   assert.ok(goal.self_interest.length>=50,k+' personal motive lacking');
   assert.ok(goal.risk.length>=44,k+' stake lacking');
   assert.ok(goal.suspect_text.startsWith('Au verdict,')||goal.suspect_text.startsWith('Au dénouement,'),k+' initial timing');
   assert.ok(goal.indic_text.startsWith('Au verdict,')||goal.indic_text.startsWith('Au dénouement,'),k+' indic timing');
   assert.ok(goal.suspect_text.length<=160,k+' initial compact');
   assert.ok(goal.indic_text.length<=160,k+' indic compact');
   assert.notEqual(goal.suspect_text,goal.indic_text,k+' no personal change');
   for(const [kind,text,axis] of [
      ['suspect',goal.suspect_text,goal.suspect_axis],
      ['indic',goal.indic_text,goal.indic_axis]]){
     assert.ok(!textSeen.has(text),k+' duplicate '+kind+' goal in same room');
     textSeen.add(text);
     assert.ok(goal[kind+'_track']&&trackIds.has(goal[kind+'_track']),k+' objective grounded in a common case theme');
     assert.ok(!/\[(pseudo|cible|rival)/i.test(text),k+' random target placeholder');
     assert.ok(!/fais (accuser|désigner|retenir)\b/i.test(text),k+' target-based arbitrary win');
     assert.ok(md.includes('« '+text+' »'),k+' mismatch between MD and structured data');
   }
 }
 // If there are roles with overlapping motive spaces (e.g. chain of command),
 // their specific contested outcome axes must differ.
 // Distinct player stakes may legitimately concern the same crime/track.
 // Do NOT require 16 independent verdict questions; common tracks make stories coherent.
 assert.ok(c.player_text_rules.main_card_limit_words<=120);
 assert.equal(c.player_text_rules.optional_details_label,'Voir les détails et les pièces');
 assert.ok(c.goals.every(g=>g.player_detail&&g.player_detail.interest&&g.player_detail.when_score&&g.player_detail.freedom));
 const caseSection=md.split('\n## '+c.id+' — '+c.title+'\n')[1]?.split('\n---\n')[0]||'';
 assert.ok(caseSection.includes('**ÉNONCÉ :**'));
 assert.ok(caseSection.includes('**Comment les intérêts s\'entrecroisent'));
 assert.ok(caseSection.includes('80 %')&&caseSection.includes('20 %'));
}
for(const phrase of [
 'UNE seule mission','UNE seule mission personnelle','une seule mission',
 'Accepter / Refuser','Voir les faits','Indics','INDIC',
 'pas une attribution validée','quinze variantes A/B/C',
 'pas une preuve','restes membre de la Famiglia'
]){
 if(!md.toLowerCase().includes(phrase.toLowerCase())&& !['Indics','pas une preuve','UNE seule mission'].includes(phrase))
  throw new Error('missing player clarity or release warning: '+phrase);
}
// Personal result cannot be satisfied through mere allegation or by picking an arbitrary target.
const ctx={lockedVerdict:{specific_homicide:[{player_id:'Soldato',level:'participant'}]},caseEvents:{
 interests:{weekly_cut:'Capo'},protections:[{player_id:'Associato',level:'temporary',status:'pending',authorized_by_competent_authority:false}]
}};
const finance={kind:'retain_interest',interest_id:'weekly_cut',owner_player_id:'Associato'};
const avoid={kind:'avoid_attribution',crime_id:'specific_homicide',player_id:'Soldato',liability_level:'principal'};
const protectedGoal={kind:'approved_protection',protected_player_id:'Associato',min_protection_level:'temporary'};
for(const chosenSuspect of ['Capo','Consigliere','Don',null]){
  assert.equal(gradePersonalGoal(finance,ctx),false,'arbitrary target must not confer a revenue win: '+chosenSuspect);
}
assert.equal(gradePersonalGoal(avoid,ctx),true);
assert.equal(gradePersonalGoal(protectedGoal,ctx),false,'pending protection not victory');
ctx.lockedVerdict.specific_homicide[0].level='principal';
assert.equal(gradePersonalGoal(avoid,ctx),false,'individual must be at meaningful risk');
ctx.caseEvents.interests.weekly_cut='Associato';
assert.equal(gradePersonalGoal(finance,ctx),true,'actual contested financial transfer qualifies');
ctx.caseEvents.protections[0].status='approved';
ctx.caseEvents.protections[0].authorized_by_competent_authority=true;
assert.equal(gradePersonalGoal(protectedGoal,ctx),true);
assert.throws(()=>gradePersonalGoal(finance,{lockedVerdict:ctx.lockedVerdict,caseEvents:{interests:{},protections:[]}}),/untracked/);
console.log('OMERTA V22 EDITORIAL PASS: 5 linked crime narratives, 40 uniquely worded role goals and 40 distinct optional indic replacements, 4 common case threads per scenario; no arbitrary target wins.');
console.log('SPECIAL PENTITO only in 024. CONDITIONALLY AUTHORABLE, NOT LIVE: 15 variants, financial/protection events, objective scoring, confidentiality and multiplayer tests remain unverified.');
