/**
 * LE RÉGIME v10 — deterministic rule kernel (candidate, NOT connected to production).
 * This module is deliberately secret-free: sealed facts come from a private server source.
 * Import it ONLY in trusted server code, never with canonical evidence in a browser bundle.
 */
export const REGIME_SCENARIOS = Object.freeze({
  '032': Object.freeze({ fugitives:['vahran_director','interior_minister'], third:'palace_secretary', judgeRequired:true, acts:4 }),
  '033': Object.freeze({ fugitives:['presidential_heir','defense_minister'], third:'clan_financier', judgeRequired:true, acts:4 }),
  '034': Object.freeze({ fugitives:['fallen_president','presidential_security'], third:'transmission_officer', judgeRequired:true, acts:4 })
});

const validCycle = n => Number.isInteger(n) && n>=1 && n<=3;
const privateError = code => ({status:'rejected',code,consumed:false});
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);

export function chooseFugitiveAlliance(choiceA,choiceB) {
  const valid=new Set(['together','apart',null,undefined]);
  if(!valid.has(choiceA)||!valid.has(choiceB))throw Error('invalid alliance choice');
  // Only mutual affirmative consent permits joining a shared network.
  return choiceA==='together'&&choiceB==='together'?'together':'apart';
}

export function resolveMandate(input) {
  const {scenarioId,actorRole,cycle,targetId,trackId,evidenceIds,publicEvidence,
    canonicalTracks,attempts=[],judgeResponse='pending',judgeTimedOut=false,requestId} = input||{};
  const scenario=REGIME_SCENARIOS[scenarioId];
  if(!scenario)return privateError('not_regime');
  if(actorRole!=='enqueteur')return privateError('not_authorized');
  if(!validCycle(cycle))return privateError('invalid_cycle');
  if(!scenario.fugitives.includes(targetId))return privateError('invalid_target');
  if(typeof requestId!=='string'||requestId.trim().length<5)return privateError('invalid_request');
  if(!Array.isArray(attempts))return privateError('bad_attempt_history');
  const previous=attempts.find(x=>x.requestId===requestId);
  if(previous){
    if(previous.targetId!==targetId||previous.cycle!==cycle)return privateError('request_conflict');
    return {status:'replay',code:previous.outcome,consumed:false};
  }
  if(attempts.some(x=>x.targetId===targetId && x.cycle===cycle))return privateError('quota_exhausted');
  if(canonicalTracks?.[targetId]?.capturedAt!=null)return privateError('already_captured');
  if(typeof trackId!=='string'||!trackId.trim())return privateError('invalid_track');
  if(!Array.isArray(evidenceIds)||evidenceIds.length!==2||
     !evidenceIds.every(x=>typeof x==='string')||evidenceIds[0]===evidenceIds[1])return privateError('two_distinct_evidence_required');
  const evidences=evidenceIds.map(id=>Array.isArray(publicEvidence)?publicEvidence.find(e=>e.id===id):undefined);
  if(evidences.some(e=>!e || e.revealed!==true || !validCycle(e.cycle) ||
      e.cycle>cycle ||e.targetId!==targetId))return privateError('evidence_not_public_or_not_related');
  if(!evidences[0].origin||evidences[0].origin===evidences[1].origin)return privateError('not_independent');
  if(!['allow','reject','pending'].includes(judgeResponse))return privateError('invalid_judge_action');
  // A procedural refusal of facially sufficient evidence is reviewable, not a veto.
  if(judgeResponse==='reject'&&!judgeTimedOut)return {status:'judge_disagreement',code:'objective_review_required',consumed:false};
  // After a documented deadline, a neutral procedural fallback can resolve the objection.
  if(judgeResponse==='pending'&&!judgeTimedOut)return {status:'awaiting_judge',consumed:false};
  const sealed=canonicalTracks?.[targetId];
  if(!sealed || typeof sealed.activeTrackId!=='string')return privateError('sealed_data_missing');
  // Only after a valid mandate does the sealed server truth decide the outcome.
  const supported=evidences.every(e=>e.trackId===trackId && e.corrobates===true);
  const captured=supported && trackId===sealed.activeTrackId;
  const outcome=captured?'captured':'not_found';
  return {
    status:outcome,consumed:true,
    record:{requestId,scenarioId,cycle,targetId,outcome},
    publicEvent:captured?{type:'capture_confirmed',targetId,cycle,eventId:'capture:'+requestId}:null
  };
}

export function evaluateThirdSuspect({path,actionCycle,actionType,actId,finalStatement,privateTruth,investigatorLevels,defenseSubmitted}={}) {
  if(!['cooperate','protect'].includes(path))return {won:false,reason:'unknown_path'};
  if(!validCycle(actionCycle)||actionCycle>2)return {won:false,reason:'missed_deadline'};
  if(!privateTruth || !actId || actId!==privateTruth.actId)return {won:false,reason:'wrong_act'};
  if(path==='cooperate'){
    if(actionType!=='submit_authentic_document'||!privateTruth.documentAuthenticated)
      return {won:false,reason:'authentic_document_missing'};
    const trueAnswer={orderedBy:privateTruth.orderedBy,ownParticipation:privateTruth.ownParticipation};
    return {won:same(finalStatement,trueAnswer),reason:same(finalStatement,trueAnswer)?'cooperation_verified':'incorrect_declaration'};
  }
  if(actionType!=='file_defense'||defenseSubmitted!==true)return {won:false,reason:'defense_missing'};
  const score=investigatorLevels?.[privateTruth.thirdPlayerId];
  if(!Number.isInteger(score)||score<0||score>2)return {won:false,reason:'verdict_missing'};
  return {won:score!==privateTruth.trueLevel,reason:score!==privateTruth.trueLevel?'protection_success':'accurate_verdict'};
}

export function evaluateReconstruction({sealedActs,answers,publicEvidence,minimum=3}={}) {
  if(!Array.isArray(sealedActs)||sealedActs.length!==4)throw Error('four sealed acts required');
  if(!Array.isArray(answers)||answers.length!==4)throw Error('four reconstructions required');
  if(!Array.isArray(publicEvidence))throw Error('public evidence required');
  if(!Number.isInteger(minimum)||minimum<1||minimum>4)throw Error('invalid threshold');
  const fields=['orderedBy','transmittedBy','executedBy','knewAndControlledBy'];
  const verdicts=sealedActs.map(act=>{
    const response=answers.find(a=>a.actId===act.id);
    if(!response)return {actId:act.id,correct:false,reason:'missing'};
    const independent=(Array.isArray(response.evidenceIds)?response.evidenceIds:[])
      .map(id=>publicEvidence.find(e=>e.id===id))
      .filter(e=>e&&e.revealed===true&&e.actId===act.id);
    const origins=new Set(independent.map(e=>e.origin).filter(Boolean));
    const supported=origins.size>=2;
    const matching=fields.every(k=>response[k]===act[k]);
    return {actId:act.id,correct:supported&&matching,reason:!supported?'insufficient_sources':matching?'correct':'incorrect_attribution'};
  });
  const accurate=verdicts.filter(x=>x.correct).length;
  return {accurate,total:4,passed:accurate>=minimum,verdicts};
}

export function courtroomSchedule({scenarioId,captureCycles={}}={}) {
  if(!REGIME_SCENARIOS[scenarioId])throw Error('not a Regime scenario');
  const values=REGIME_SCENARIOS[scenarioId].fugitives.map(id=>captureCycles[id]);
  if(values.some(v=>v!=null&&!validCycle(v)))throw Error('invalid capture cycle');
  const doubleCaptured=values.every(validCycle);
  const last=doubleCaptured?Math.max(...values):null;
  if(!doubleCaptured)return {kind:'reconstruction',totalMinutes:8,suspectsPresent:values.filter(validCycle).length+1};
  if(last===3)return {kind:'long',totalMinutes:14,suspectsPresent:3,opening:1,defenses:6,confrontation:5,closing:1,vote:1};
  return {kind:'short',totalMinutes:8,suspectsPresent:3,opening:1,defenses:3,confrontation:2,closing:1,vote:1};
}

export function classifyVictory({scenarioId,captureCycles={},reconstruction}={}) {
  const cfg=REGIME_SCENARIOS[scenarioId];
  if(!cfg)throw Error('not a Regime scenario');
  const captures=cfg.fugitives.filter(id=>validCycle(captureCycles[id])).length;
  const tactical=captures===2;
  const judicial=!!reconstruction?.passed;
  return {captures,tactical,judicial,totalInvestigationWin:tactical&&judicial,
    totalFugitiveWin:!tactical&&!judicial,
    mixed:tactical!==judicial};
}

export function generatePublicNews({scenarioId,event,publishedIds=[]}={}) {
  if(!REGIME_SCENARIOS[scenarioId] || !event || event.type!=='capture_confirmed' || !event.eventId)
    return null;
  if(publishedIds.includes(event.eventId))return null;
  // Only the role of the captured president triggers the special bulletin.
  if(scenarioId==='034'&&event.targetId==='fallen_president')
    return {id:event.eventId,type:'public_bulletin',code:'president_captured',
      title:'LE PRÉSIDENT DÉCHU CAPTURÉ',
      text:'À Darsen, la nouvelle entraîne des rassemblements de joie. Des familles de disparus réclament l’établissement des responsabilités. Les derniers fidèles du régime dénoncent l’arrestation.'};
  return {id:event.eventId,type:'public_bulletin',code:'leader_captured',
    title:'UN HAUT RESPONSABLE DU RÉGIME CAPTURÉ',
    text:'Les autorités de transition confirment une arrestation. Les investigations sur les décisions criminelles se poursuivent.'};
}
