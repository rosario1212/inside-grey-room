#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assignRandomSantoroPosts,publicSantoroRanks} from '../qa/omerta-v22-random-mafia-roles-simulator.mjs';
const data=JSON.parse(await readFile('qa/omerta-v22-coherent-role-goals.json','utf8'));
const valid=data.playable_mafia_role_keys;
assert.deepEqual(valid,['associato','soldato','contabile','capo','consigliere','sottocapo','don']);
assert.equal(data.generic_suspect_is_not_playable,true);
assert.equal(data.rank_selection_policy.selection_method,'random_server_controlled_from_prevalidated_variant_role_slots');
assert.equal(data.rank_selection_policy.family_don_max_per_room,1);
const players=Array.from({length:7},(_,i)=>'player'+i);
const slots=valid.map((rank,i)=>({
  slotId:'seat'+i,rank,crewId:rank==='capo'?'crew1':undefined,
  initialGoalId:'original'+i,informantGoalId:'indic'+i,
  privateFactsId:'facts'+i,variantValidated:true,scoringValidated:true
}));
for(const c of data.scenarios){
 const actual=c.goals.map(g=>g.role);
 assert.deepEqual(actual,valid,'every authored case has only real Mafia ranks '+c.id);
 for(let size=1;size<=7;size++){
  const args={playerIds:players.slice(0,size),slots,random:()=>.15};
  const distributed=assignRandomSantoroPosts(args);
  assert.equal(distributed.length,size);
  assert.equal(new Set(distributed.map(x=>x.slotId)).size,size);
  assert.ok(distributed.every(x=>valid.includes(x.rank)&&x.isInformant===false));
  assert.equal(distributed.filter(x=>x.rank==='don').length<=1,true);
  const visible=JSON.stringify(publicSantoroRanks(distributed));
  for(const secret of ['privateFactsId','informantGoalId','initialGoalId','facts0','indic0']){
   assert.ok(!visible.includes(secret),'leaked secret '+secret);
  }
 }
}
const a=assignRandomSantoroPosts({playerIds:players.slice(0,3),slots,random:()=>0});
const b=assignRandomSantoroPosts({playerIds:players.slice(0,3),slots,random:()=>.99});
assert.notDeepEqual(a.map(x=>x.rank),b.map(x=>x.rank),'role draw should change with random source');
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),slots:[slots[0]],random:()=>.5
}),/not enough/);
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),
 slots:[slots[0],{...slots[1],rank:'suspect'}],random:()=>.5
}),/invalid rank/);
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),slots:[slots[6],{...slots[5],rank:'don'}],random:()=>.5
}),/one Don maximum/);
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),slots:[slots[0],{...slots[1],privateFactsId:'facts0'}],random:()=>.5
}),/duplicate or missing private objective/);
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),slots:[slots[0],{...slots[1],variantValidated:false}],random:()=>.5
}),/unvalidated variant/);
assert.throws(()=>assignRandomSantoroPosts({
 playerIds:players.slice(0,2),slots:[slots[0],slots[1]],random:()=>1
}),/bad random/);
const doubled=slots.slice(0,3).map(x=>({...x}));
doubled[1].rank='soldato';doubled[2].rank='soldato';
const siblings=assignRandomSantoroPosts({playerIds:players.slice(0,3),slots:doubled,random:()=>.5});
assert.equal(new Set(siblings.map(x=>x.slotId)).size,3);
console.log('OMERTA V22 RANK POLICY PASS — randomized unique authored Mafia roles (not generic Suspect); optional Don, 1 Don max, no secret leaking through public tree, case slots validated.');
console.log('OFFLINE test only. No live Supabase random assignment implementation is proven.');
