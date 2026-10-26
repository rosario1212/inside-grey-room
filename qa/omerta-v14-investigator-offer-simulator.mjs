/* OMERTA V14 isolated simulator — NO database, no secrets, no production integration.
 * The real implementation must authorize every action in room-scoped server RPCs.
 * This model's privileged injectEvidence() is test-only and MUST NOT be client-callable.
 */
export function createOmertaV14Case({scenarioId, players, offerLimit=2}) {
  const valid=new Set(['021','022','023','024','025']);
  if(!valid.has(scenarioId))throw Error('non-omerta scenario');
  if(!Array.isArray(players)||players.some(p=>!p.id||!p.role||!p.camp))throw Error('invalid cast');
  const ps=new Map(players.map(p=>[p.id,{...p}]));
  if(ps.size!==players.length)throw Error('duplicate player');
  const investigator=[...ps.values()].filter(p=>p.role==='enqueteur'&&p.camp==='investigation');
  if(investigator.length!==1)throw Error('exactly one investigator required in test cast');
  let cycle=1,locked=false,proposalCount=0;
  const offers=new Map(),evidence=new Map(),consequences=[];
  const levels={suspicion:1,corroborated:2,proven:3};
  const roleActions={
    associato:{report_suspicion:1,withdraw_own_arrangement:1},
    uomo_onore:{report_to_capo:1,request_confrontation:1},
    contabile:{submit_account_evidence:1,recommend_financial_suspension:2},
    caporegime:{withdraw_crew_favor:2,freeze_crew_share:2,request_major_sanction:2},
    consigliere:{request_hearing:1,recommend_mediation:1,advise_delay:1},
    sottocapo:{review_exclusion:2,approve_local_exclusion:3,refer_to_don:2},
    don:{grant_clemency:2,authorize_endgame_major_sanction:3}
  };
  function fail(msg){throw Error(msg)}
  function actor(id){const p=ps.get(id);if(!p)fail('unknown actor');return p}
  function inPhase(){if(cycle<2)fail('not until cycle 2');if(locked)fail('verdict locked')}
  function offerContentsValid(o) {
    const keys=['fact_to_be_disclosed','conditional_benefit','economic_risk','judicial_risk','mafia_retaliation_risk','exposure_route','personal_goal_after_commit','protection_limits'];
    return !!o && keys.every(key=>typeof o[key]==='string' && o[key].length>=8);
  }
  function proposal(investigatorId,recipientId,privateOffer){
    inPhase();
    if(actor(investigatorId).role!=='enqueteur'||actor(investigatorId).camp!=='investigation')
      fail('investigator only');
    const target=actor(recipientId);
    if(target.camp!=='suspect'||target.role==='enqueteur')fail('target must be eligible suspect');
    if(proposalCount>=offerLimit)fail('investigator offer budget exhausted');
    if(offers.has(recipientId))fail('duplicate recipient');
    if(!offerContentsValid(privateOffer))fail('risk disclosure missing');
    // In a deployed app these terms come from the sealed manuscript and are
    // generated server-side, never injected untrusted by investigator.
    offers.set(recipientId,{sentBy:investigatorId,state:'sent',card:structuredClone(privateOffer),confirmed:false});
    proposalCount++;
    return {sent:true,recipientId};
  }
  function recipient(id){
    const o=offers.get(id);
    if(!o)fail('no proposal for this suspect');
    return o;
  }
  function inspect(id){
    inPhase();actor(id);
    const o=recipient(id);
    if(o.state==='committed')fail('already committed');
    o.state='viewing';return structuredClone(o.card);
  }
  function decline(id){
    inPhase();actor(id);
    const o=recipient(id);
    if(o.state==='committed')fail('cannot withdraw disclosure');
    o.state='declined';o.confirmed=false;
    return {committed:false,penalty:false};
  }
  function prepare(id){
    inPhase();actor(id);
    const o=recipient(id);
    if(o.state!=='viewing')fail('read offer first');
    o.state='awaiting_confirmation';
    return {requiresSecondConfirmation:true,irreversible:true};
  }
  function commit(id,explicitlyConfirmed){
    inPhase();actor(id);
    const o=recipient(id);
    if(o.state!=='awaiting_confirmation'||explicitlyConfirmed!==true)
      fail('second affirmative confirmation required');
    o.state='committed';o.confirmed=true;
    return {privateStateChanged:true,irreversible:true};
  }
  function suspected(id,level){
    if(!ps.has(id)||!levels[level])fail('invalid evidence');
    // Privileged test-only data injection, NOT a permission granted to players.
    evidence.set(id,levels[level]);
  }
  function retaliate(actorId,targetId,action,{targetReplied=false}={}){
    const p=actor(actorId),target=actor(targetId);
    if(p.camp!=='suspect'||target.camp!=='suspect')fail('rank not in Familia');
    if(actorId===targetId)fail('cannot retaliate against self');
    const threshold=roleActions[p.role]?.[action];
    if(!threshold)fail('rank cannot request this action');
    const established=evidence.get(targetId)||0;
    if(established<threshold)fail('insufficient corroboration');
    if(threshold>=3&&!locked)fail('major measure only after verdict');
    if(threshold>=3&&!targetReplied)fail('target must be allowed to reply');
    const item={actorId,targetId,action,evidenceLevel:established,fictional:true,noElimination:true};
    consequences.push(item);
    return structuredClone(item);
  }
  return Object.freeze({
    advanceCycle(next){if(locked||!Number.isInteger(next)||next<cycle||next>3)fail('bad cycle');cycle=next},
    sendProposal:proposal,
    inspect,
    decline,
    prepare,
    commit,
    testOnlyInjectVerifiedEvidence:suspected,
    proposeRetaliation:retaliate,
    lockVerdict(){locked=true},
    getOwnPrivateState(id){actor(id);const o=offers.get(id);return o?structuredClone({state:o.state,card:o.card}):{state:'no_offer'}},
    investigatorView(id){if(actor(id).role!=='enqueteur')fail('investigator only');return {sentTo:[...offers.keys()],remaining:offerLimit-proposalCount}},
    publicState(){return {scenarioId,cycle,locked,roster:[...ps.values()].map(p=>({id:p.id,role:p.role})),eventTypes:['interrogation','confrontation']}},
    getRetaliationsForEndgame(){return structuredClone(consequences)},
    committedCount(){return [...offers.values()].filter(o=>o.state==='committed').length}
  });
}
