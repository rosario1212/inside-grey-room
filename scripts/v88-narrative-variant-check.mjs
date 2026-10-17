import assert from 'node:assert/strict';
import {auditVariantDossier,canActivateVariantDossier,auditSagaContinuity}
  from './v88-narrative-variant-gates.mjs';
import {readFile} from 'node:fs/promises';

const contract=JSON.parse(await readFile('scenario-replay-contracts-v13.json','utf8'));
assert.equal(Object.keys(contract.scenarios).length,34,
  'The existing 001–034 author directions must remain tracked.');
for(const [id,dossier] of Object.entries(contract.scenarios)){
  assert.equal(dossier.variants.length,3,id+' must have exactly three author directions');
  const outline={id,suspect_count:3,public_anchor:dossier.invariant,variants:
    dossier.variants.map(v=>({id:v.id,canonical_direction:v.canonical_direction,status:'outline'}))};
  assert.deepEqual(auditVariantDossier(outline),[],
    'Incomplete author directions can be stored for review but not activated: '+id);
  assert.equal(canActivateVariantDossier(outline),false,
    'An outline is never a fully canonical playable variant: '+id);
}
const ready=(id)=>({
 id,suspect_count:2,public_anchor:'Shared incident that does not identify a perpetrator',
 variants:['A','B','C'].map((k,i)=>({
  id:k,status:'ready',canonical_direction:'Different causal chain '+k,public_briefing:'An incident needs to be explained.',
  final_reveal:'A coherent reconstruction, with all sources verified: '+k,human_review_approved:true,
  invariants_respected:['Public incident'],cross_episode_dependencies:[],
  canonical_truth:{
   summary:'Final cause known to the server only.',
   responsibility_by_slot:{'1':i,'2':2-i},
   timeline:[
    {id:'meeting',what:'They met',relative_order:'first'},
    {id:'incident',what:'The incident occurred',relative_order:'second'},
    {id:'aftermath',what:'The aftermath',relative_order:'third'}
   ]
  },
  private_cards:[1,2].map(slot=>({
   slot,identity:'You are a person',what_you_know:'You know something relevant',
   what_you_hide:'A private decision',your_chronology:'First meeting then event',
   objective:'Establish your account',conversation_hooks:['Ask about meeting','Ask about aftermath']
  })),
  relationships:{
   '1':[{target_slot:2,known_fact:'They met once',conversation_tension:'What happened afterwards?'}],
   '2':[{target_slot:1,known_fact:'A meeting occurred',conversation_tension:'What was said?'}]
  },
  revelations:[
   {id:'proof1',canonical_event_id:'meeting',title:'Verified meeting',text:'A record of the meeting',kind:'guaranteed',audience:'investigation',min_cycle:1},
   {id:'proof2',canonical_event_id:'incident',title:'Witness',text:'A conditional account',kind:'conditional',trigger_action:'interview',audience:'investigation',min_cycle:2},
   {id:'proof3',canonical_event_id:'aftermath',title:'Trace',text:'A possible trace',kind:'missable',audience:'player',target_slot:1,min_cycle:3}
  ]
 }))
});
let sample=ready('005');
assert.deepEqual(auditVariantDossier(sample),[],'A complete and approved variant passes');
assert.equal(canActivateVariantDossier(sample),true);
const modify=(fn)=>{const copy=structuredClone(sample);fn(copy);return auditVariantDossier(copy).map(x=>x.code)};
assert(modify(x=>{x.variants[2].revelations[0].canonical_event_id='phantom'}).includes('invalid_or_unfounded_revelation'),
  'Evidence with no canonical source must be rejected');
assert(modify(x=>{x.variants[1].revelations[1].trigger_action=''}).includes('conditional_revelation_without_trigger'),
  'No conditional event may arise without an authored trigger');
assert(modify(x=>{x.variants[1].revelations[0].trigger_action='optional_probe'}).includes('guaranteed_evidence_depends_on_optional_action'),
  'Required clues must not be locked behind optional play');
assert(modify(x=>{x.variants[0].private_cards[0].conversation_hooks=[]}).includes('character_not_playable_without_phone'),
  'Characters must have human conversation starters');
assert(modify(x=>{x.variants[2].human_review_approved=false}).includes('not_approved_by_author'),
  'No automatic acceptance of a complete manuscript without human approval');
assert(modify(x=>{x.variants[0].canonical_truth.responsibility_by_slot={'1':3,'2':0}}).includes('invalid_responsibilities'),
  'Responsibility 3 is not supported by the current 0–2 production scoring contract');
assert(modify(x=>{x.variants[1].revelations[2].target_slot=99}).includes('player_audience_unset'),
  'Private evidence cannot target a non-existent suspect');
assert(modify(x=>{x.variants[1].invariants_respected=[]}).includes('invariants_not_approved'),
  'Variant cannot be accepted without authored invariants');
assert(modify(x=>{x.variants[1].canonical_truth=structuredClone(x.variants[0].canonical_truth)})
  .includes('identical_canonical_truth_across_variants'),
  'A second variant cannot be a duplicate of the exact canonical truth');
assert(modify(x=>{x.variants[0].canonical_truth.responsibility_by_slot={'1':2}}).includes('invalid_responsibilities'),
  'All suspect responsibilities must be explicit');
assert(modify(x=>{x.variants[0].relationships['1'][0].target_slot=1}).includes('bad_directed_relationship'),
  'No relations may point to the same source slot');
assert(modify(x=>{x.variants[0].public_briefing='x'.repeat(1000)}).includes('briefing_not_usable'),
  'Public briefing must be short enough for live interactions');
assert(modify(x=>{x.variants[0].status='review'}).length===0,
  'A manuscript still in review must not pretend to be an enabled variant');
const review=structuredClone(sample);review.variants[0].status='review';
assert.equal(canActivateVariantDossier(review),false);
assert.equal(auditSagaContinuity([
 {...sample,saga:{collection:'omerta',branch:'A'}},
 {...sample,id:'006',saga:{collection:'omerta',branch:'B'}}
]).length,1,'A saga cannot mix A and B without an authored carryover contract');
assert.equal(auditSagaContinuity([
 {...sample,saga:{collection:'omerta',branch:'A'}},
 {...sample,id:'006',saga:{collection:'omerta',branch:'A'}}
]).length,0);

assert(auditVariantDossier({...sample,variants:{A:{}}}).some(x=>x.code==='exactly_three_variants_required'),
  'Malformed variants must return safe validation errors');
assert(auditVariantDossier({...sample,variants:sample.variants.map((v,i)=>
  i===0?{...v,private_cards:{}}:v)}).some(x=>x.code==='missing_private_cards'),
  'Malformed private cards must be rejected without crashing');
console.log('v88: 34 legacy contracts inventoried; no outline can activate.');
console.log('v88: role cards, guaranteed/conditional/missable evidence, canonical truth, approvals and saga locks OK.');
