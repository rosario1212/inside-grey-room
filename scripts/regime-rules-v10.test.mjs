import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseFugitiveAlliance,resolveMandate,evaluateThirdSuspect,
 evaluateReconstruction,courtroomSchedule,classifyVictory,generatePublicNews,resolveFugitiveTurn}
 from './regime-rules-v10.mjs';

const sources=(target,track)=>[
{id:'e1',origin:'palace',targetId:target,trackId:track,cycle:1,revealed:true,corrobates:true},
{id:'e2',origin:'witness',targetId:target,trackId:track,cycle:1,revealed:true,corrobates:true}
];
const cfg={scenarioId:'034',actorRole:'enqueteur',cycle:1,targetId:'fallen_president',
 trackId:'track_alpha',evidenceIds:['e1','e2'],publicEvidence:sources('fallen_president','track_alpha'),
 canonicalTracks:{fallen_president:{activeTrackId:'track_alpha'}},
 requestId:'req-test-one',judgeResponse:'allow',attempts:[]};
test('alliance requires mutual consent',()=>{
 assert.equal(chooseFugitiveAlliance('together','together'),'together');
 assert.equal(chooseFugitiveAlliance('together','apart'),'apart');
 assert.equal(chooseFugitiveAlliance('together',null),'apart');
});
test('correct evidence allows president capture already in C1',()=>{
 const r=resolveMandate(cfg);
 assert.equal(r.status,'captured');assert.equal(r.publicEvent.targetId,'fallen_president');
});
test('a different fugitive needs own corroboration',()=>{
 assert.equal(resolveMandate({...cfg,targetId:'presidential_security',requestId:'req-second'}).status,'rejected');
});
test('old or undisclosed evidence cannot be used',()=>{
 const bad=cfg.publicEvidence.map((x,i)=>i===0?{...x,revealed:false}:x);
 assert.equal(resolveMandate({...cfg,publicEvidence:bad}).code,'evidence_not_public_or_not_related');
});
test('two copies from a single source do not form corroboration',()=>{
 const x=cfg.publicEvidence.map(e=>({...e,origin:'palace'}));
 assert.equal(resolveMandate({...cfg,publicEvidence:x}).code,'not_independent');
});
test('wrong lead fails and consumes attempt, no secret leak',()=>{
 const r=resolveMandate({...cfg,trackId:'track_wrong',requestId:'req-wrong'});
 assert.equal(r.status,'not_found');assert.equal(r.consumed,true);assert.equal(r.publicEvent,null);
 assert.ok(!('canonicalTracks' in r));
});
test('quota and replay guard',()=>{
 const result=resolveMandate(cfg);
 const old=[result.record];
 assert.equal(resolveMandate({...cfg,attempts:old}).status,'replay');
 assert.equal(resolveMandate({...cfg,attempts:old,requestId:'req-other'}).code,'quota_exhausted');
});
test('an arbitrary judge refusal does not create a capture or consume attempt',()=>{
 const r=resolveMandate({...cfg,judgeResponse:'reject'});
 assert.equal(r.status,'judge_disagreement');assert.equal(r.consumed,false);
});
test('another role cannot file a warrant',()=>{
 assert.equal(resolveMandate({...cfg,actorRole:'suspect'}).code,'not_authorized');
});
test('third suspect cooperation independent of investigator vote',()=>{
 const truth={actId:'act-1',orderedBy:'leader',ownParticipation:'transmitter',documentAuthenticated:true};
 const r=evaluateThirdSuspect({path:'cooperate',actionCycle:2,actionType:'submit_authentic_document',
  actId:'act-1',finalStatement:{orderedBy:'leader',ownParticipation:'transmitter'},privateTruth:truth,
  investigatorLevels:{somebody:0}});
 assert.equal(r.won,true);
});
test('third suspect protection needs defense and an inaccurate verdict',()=>{
 const truth={actId:'act-2',thirdPlayerId:'third',trueLevel:2};
 const base={path:'protect',actionCycle:1,actionType:'file_defense',actId:'act-2',
  privateTruth:truth,defenseSubmitted:true};
 assert.equal(evaluateThirdSuspect({...base,investigatorLevels:{third:1}}).won,true);
 assert.equal(evaluateThirdSuspect({...base,investigatorLevels:{third:2}}).won,false);
 assert.equal(evaluateThirdSuspect({...base,defenseSubmitted:false,investigatorLevels:{third:1}}).won,false);
});
test('courtroom 14 minutes only if second capture in C3',()=>{
 assert.equal(courtroomSchedule({scenarioId:'034',captureCycles:{fallen_president:1,presidential_security:3}}).totalMinutes,14);
 assert.equal(courtroomSchedule({scenarioId:'034',captureCycles:{fallen_president:1,presidential_security:2}}).totalMinutes,8);
 assert.equal(courtroomSchedule({scenarioId:'034',captureCycles:{fallen_president:1}}).kind,'reconstruction');
});
test('reconstruction requires 4 correctly sourced acts',()=>{
 const fields={orderedBy:'A',transmittedBy:'B',executedBy:'C',knewAndControlledBy:'A'};
 const sealedActs=[1,2,3,4].map(id=>({id:'a'+id,...fields}));
 const answers=sealedActs.map(a=>({actId:a.id,...fields,evidenceIds:['p'+a.id,'w'+a.id]}));
 const evidence=sealedActs.flatMap(a=>[
  {id:'p'+a.id,actId:a.id,origin:'palace',revealed:true},
  {id:'w'+a.id,actId:a.id,origin:'witness',revealed:true}]);
 const r=evaluateReconstruction({sealedActs,answers,publicEvidence:evidence});
 assert.equal(r.accurate,4);
 assert.equal(evaluateReconstruction({sealedActs,answers,publicEvidence:evidence.slice(2)}).passed,true);
 assert.equal(evaluateReconstruction({sealedActs,answers,publicEvidence:evidence.slice(4)}).passed,false);
});
test('capture alone is not total victory',()=>{
 const x=classifyVictory({scenarioId:'034',captureCycles:{fallen_president:1,presidential_security:3},
  reconstruction:{passed:false}});
 assert.equal(x.tactical,true);assert.equal(x.totalInvestigationWin,false);assert.equal(x.mixed,true);
});
test('news only after confirmed public president capture, only once',()=>{
 const ev={type:'capture_confirmed',eventId:'capture:r1',targetId:'fallen_president'};
 assert.equal(generatePublicNews({scenarioId:'034',event:ev}).code,'president_captured');
 assert.equal(generatePublicNews({scenarioId:'034',event:ev,publishedIds:['capture:r1']}),null);
 assert.equal(generatePublicNews({scenarioId:'034',event:{...ev,type:'warrant_requested'}}),null);
});

test('a contested lawful warrant is released to neutral review after timeout',()=>{
 const r=resolveMandate({...cfg,judgeResponse:'reject',judgeTimedOut:true,requestId:'req-neutral-fallback'});
 assert.equal(r.status,'captured');assert.equal(r.consumed,true);
});
test('a fugitive not captured never appears as accused in the courtroom',()=>{
 const none=courtroomSchedule({scenarioId:'034',captureCycles:{}});
 const one=courtroomSchedule({scenarioId:'034',captureCycles:{fallen_president:1}});
 assert.equal(none.suspectsPresent,1);assert.equal(one.suspectsPresent,2);
});
test('every Regime scenario supports C1 capture with two scenario-specific pieces',()=>{
 for(const [scenarioId,targetId] of [
  ['032','vahran_director'],['033','presidential_heir'],['034','fallen_president']]){
   const r=resolveMandate({...cfg,scenarioId,targetId,requestId:'req-'+scenarioId,
    publicEvidence:sources(targetId,'track_alpha'),
    canonicalTracks:{[targetId]:{activeTrackId:'track_alpha'}}});
   assert.equal(r.status,'captured');
 }
});

test('a missing sealed truth never grants the third suspect cooperation',()=>{
 const r=evaluateThirdSuspect({path:'cooperate',actionCycle:1,actionType:'submit_authentic_document',
  actId:'act',finalStatement:{},
  privateTruth:{actId:'act',documentAuthenticated:true}});
 assert.equal(r.won,false);
});
test('a missing canonical level never grants the third suspect protection',()=>{
 const r=evaluateThirdSuspect({path:'protect',actionCycle:1,actionType:'file_defense',
  actId:'act',defenseSubmitted:true,investigatorLevels:{third:1},
  privateTruth:{actId:'act',thirdPlayerId:'third'}});
 assert.equal(r.won,false);
});
test('duplicate acts cannot artificially inflate judicial success',()=>{
 let threw=false;
 try{evaluateReconstruction({sealedActs:Array(4).fill({id:'act'}),answers:
  ['a','b','c','d'].map(actId=>({actId})),publicEvidence:[]});}catch(e){threw=true;}
 assert.equal(threw,true);
});

test('fugitive options have one material benefit and one tradeoff',()=>{
 const option={id:'protect_staff',actorId:'fallen_president',availableCycles:[1,2],
  effect:{kind:'shield_contact',ref:'contact_alpha'},
  cost:{kind:'expose_trace',ref:'trace_alpha'}};
 const cfg={scenarioId:'034',actorId:'fallen_president',cycle:1,requestId:'req-action-one',
  actionId:'protect_staff',options:[option],history:[]};
 const accepted=resolveFugitiveTurn(cfg);
 assert.equal(accepted.status,'accepted');assert.equal(accepted.commands.length,2);
 const replay=resolveFugitiveTurn({...cfg,history:[accepted.record]});
 assert.equal(replay.status,'replay');
 const blocked=resolveFugitiveTurn({...cfg,requestId:'req-action-two',history:[accepted.record]});
 assert.equal(blocked.code,'one_strategy_per_cycle');
 assert.equal(resolveFugitiveTurn({...cfg,capturedAt:1}).code,'already_captured');
});
test('a fugitive cannot invent a cost-free or historically rewriting option',()=>{
 const fake={id:'magic',actorId:'fallen_president',
  effect:{kind:'rewrite_truth',ref:'act'},cost:{kind:'none',ref:'zero'}};
 const r=resolveFugitiveTurn({scenarioId:'034',actorId:'fallen_president',cycle:1,
  requestId:'req-action-magic',actionId:'magic',options:[fake]});
 assert.equal(r.code,'unbalanced_option');
});
test('third suspect cannot submit the fugitive strategy',()=>{
 const r=resolveFugitiveTurn({scenarioId:'034',actorId:'transmission_officer',cycle:1,
  requestId:'req-not-fugitive',actionId:'x',options:[]});
 assert.equal(r.code,'not_a_fugitive');
});

test('two independent documents can corroborate several acts without changing truth',()=>{
 const d={orderedBy:'A',transmittedBy:'B',executedBy:'C',knewAndControlledBy:'A'};
 const acts=[1,2,3,4].map(n=>({id:'m'+n,...d}));
 const e=[
  {id:'g1',act_ids:['m1','m2'],origin:'palace',revealed:true},
  {id:'g2',act_ids:['m2','m3'],origin:'audit',revealed:true},
  {id:'g3',act_ids:['m3','m4'],origin:'prison',revealed:true},
  {id:'o1',act_ids:['m1'],origin:'witness',revealed:true}
 ];
 const answers=acts.map(a=>({actId:a.id,...d,
  evidenceIds:a.id==='m1'?['g1','o1']:a.id==='m2'?['g1','g2']:a.id==='m3'?['g2','g3']:['g3']}));
 const z=evaluateReconstruction({sealedActs:acts,answers,publicEvidence:e});
 assert.equal(z.accurate,3);assert.equal(z.passed,true);
});
