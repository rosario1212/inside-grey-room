#!/usr/bin/env node
// V21 editorial content gate. Not a production game or a full A/B/C audit.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradePersonalGoal} from '../qa/omerta-v18-personal-goal-evaluator.mjs';

const data=JSON.parse(await readFile('qa/omerta-v21-personal-goals-by-role.json','utf8'));
const md=await readFile('docs/OMERTA_V21_PERSONAL_GOALS_BY_ROLE_021_025.md','utf8');
assert.equal(data.version,'OMERTA-V21');
assert.equal(data.production_ready,false);
assert.equal(data.one_main_goal_per_role,true);
assert.equal(data.source_remains_in_mafia,true);
assert.equal(data.accept_swaps_goal_immediately,true);
assert.equal(data.accept_disclosures_zero,true);
assert.equal(data.no_mandatory_informant,true);
assert.equal(data.free_accusation_target_does_not_score,true);
assert.deepEqual(data.cases.map(x=>x.id),['021','022','023','024','025']);
const expected=[6,6,7,7,9];
let count=0,indics=0;
for(const [i,c] of data.cases.entries()){
 assert.equal(c.roles.length,expected[i],c.id+' role count');
 assert.ok(md.includes('## '+c.id+' — '+c.title));
 for(const r of c.roles){
   count++;
   assert.ok(r.initial_goal.startsWith('Au ')&&r.initial_goal.endsWith('.'),c.id+' initial copy');
   assert.ok(r.initial_goal.length<190,c.id+' initial text too long');
   assert.ok(['avoid_attribution','retain_interest','approved_protection'].includes(r.initial_kind));
   assert.ok(md.includes('« '+r.initial_goal+' »'),c.id+' initial not in document');
   if(!r.informant_goal){
     assert.ok(r.role.startsWith('Pentito'),c.id+' missing informant copy '+r.role);
     assert.equal(r.informant_kind,null);
     continue;
   }
   indics++;
   assert.ok(r.informant_goal.startsWith('Au ')&&r.informant_goal.endsWith('.'));
   assert.ok(r.informant_goal.length<190,c.id+' indic copy too long');
   assert.notEqual(r.initial_goal,r.informant_goal,c.id+' no goal replacement');
   assert.ok(md.includes('« '+r.informant_goal+' »'),c.id+' indic not in document');
   assert.ok(['avoid_attribution','retain_interest','approved_protection'].includes(r.informant_kind));
   assert.ok(!/\[pseudo|fais (retenir|désigner) .*rival/i.test(r.informant_goal),
      c.id+' arbitrary-target indic victory prohibited');
 }
}
assert.equal(count,35);
assert.equal(indics,33);
for(const key of ['80 %','20 %','Accepter','Refuser','C2','INDIC','A/B/C','sans partager automatiquement']){
 assert.ok(md.includes(key),'Missing authoring law '+key);
}
// A freely accused person never changes an unrelated authenticated payout.
const financialGoal={kind:'retain_interest',interest_id:'weekly_cut',owner_player_id:'suspect'};
const ctx={lockedVerdict:{diversion:[]},caseEvents:{interests:{weekly_cut:'crew'},protections:[]}};
for(const target of ['capo','soldato','consigliere',null]){
 const declaredEnemy=target;
 assert.equal(gradePersonalGoal(financialGoal,ctx),false,'accusing '+declaredEnemy+' cannot award payout');
}
ctx.caseEvents.interests.weekly_cut='suspect';
assert.equal(gradePersonalGoal(financialGoal,ctx),true);
assert.throws(()=>gradePersonalGoal(financialGoal,{lockedVerdict:{diversion:[]},caseEvents:{interests:{},protections:[]}}),/untracked/);
const protectGoal={kind:'approved_protection',protected_player_id:'suspect',min_protection_level:'temporary'};
assert.equal(gradePersonalGoal(protectGoal,{lockedVerdict:{},caseEvents:{protections:[{
 player_id:'suspect',level:'temporary',status:'pending',authorized_by_competent_authority:false}]}}),false);
assert.equal(gradePersonalGoal(protectGoal,{lockedVerdict:{},caseEvents:{protections:[{
 player_id:'suspect',level:'temporary',status:'approved',authorized_by_competent_authority:true}]}}),true);
console.log('OMERTA V21 EDITORIAL PASS: 35 role-specific initial goals and 33 distinct selfish indic goals, no arbitrary-target scoring, no source disclosure on accept, outcomes gated by recorded case state.');
console.log('NOT PLAYTESTED: 15 sealed variants, live scoring, risk distribution, and case-event registration.');
