// Synthetic regression tests: no personal narrative or secret is published here.
import assert from 'node:assert/strict';
import {auditSantoroDrafts} from './omerta-santoro-private-preflight.mjs';

const variants={};
for(const scenario of ['021','022','023','024','025']){
  for(const variant of ['A','B','C']){
    const prefix=scenario+'-'+variant;
    const cards=Array.from({length:7},(_,n)=>{
      const slot=n+1;
      const id=prefix+'-slot-'+slot;
      return {
        slot,identity:'Placeholder '+slot,objective:'Avoid designation',
        what_you_know:'Synthetic knowledge',what_you_hide:'Synthetic secret',
        your_chronology:'Synthetic sequence',conversation_hooks:['Ask first','Ask second'],
        verdict_goal:{goal_id:id,scoring_review:'approved'},
        eligible_tip:{id:id+'-tip',text:'Synthetic tip',truth_in_variant:true,
          corroborates_with:'event-a',source_review:'verified'}
      };
    });
    variants[prefix]={
      private_format:'santoro_v25',saga:{family:'SANTORO',branch:variant},
      private_cards:cards,public_briefing:'Synthetic briefing',
      final_reveal:'Synthetic final',status:'ready',
      human_review_approved:true,verdict_scoring_review:'approved',
      canonical_truth:{
        truth_by_axis:{variant},
        timeline:[{id:'event-a'},{id:'event-b'}],
        verdict_goal_by_slot:Object.fromEntries(cards.map(c=>[String(c.slot),
          {goal_id:c.verdict_goal.goal_id,mode:'avoid_formal_designation'}]))
      },
      revelations:[{kind:'guaranteed',min_cycle:'3',audience:'investigation',
        editorial_provenance:{existing_events:['event-a','event-b'],
          independent_of_optional_actions:true,human_source_review:'verified'}}]
    };
  }
}
const good=auditSantoroDrafts(variants);
assert.equal(good.releasePass,true,JSON.stringify(good));
assert.equal(good.characters,105);
assert.equal(good.emptyPersonalSecrets,0);
assert.equal(good.emptyDialoguePrompts,0);
assert.equal(good.emptyPersonalChronologies,0);

for(const [field,broken] of [
  ['your_chronology',''],
  ['what_you_hide',''],
  ['conversation_hooks',[]],
  ['conversation_hooks',['only one']]
]){
  const old=variants['021-A'].private_cards[0][field];
  variants['021-A'].private_cards[0][field]=broken;
  const result=auditSantoroDrafts(variants);
  assert.equal(result.releasePass,false,'Incomplete '+field+' must not release');
  variants['021-A'].private_cards[0][field]=old;
}
variants['021-A'].revelations[0].editorial_provenance.human_source_review='pending';
assert.equal(auditSantoroDrafts(variants).releasePass,false,
  'Unverified C3 must not be released');
console.log('OMERTA SANTORO: 105 complete synthetic cards pass, missing fields and C3 reject');
