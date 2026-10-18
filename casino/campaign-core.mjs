/**
 * Casino campaign rules foundation (SERVER SIDE ONLY).
 * This module is deliberately not imported by the browser bundle.
 * Hidden roles, answer keys, private reports and sealed evidence live server-side.
 * No payments, withdrawals or real-money wagers are accepted.
 */

const PHASE_COUNT = Object.freeze([3, 3, 2]);
const CANONICAL_ROLES = new Set(['agent', 'investigator', 'analyst', 'prosecutor', 'judge']);
const AGREEMENT_KINDS = new Set(['alliance', 'non_aggression', 'debt', 'territory', 'influence', 'succession', 'custom']);
const deepCopy = (value) => structuredClone(value);
const ensure = (condition, reason) => { if (!condition) throw new Error(reason); };
const compact = (value, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const unique = (values) => new Set(values).size === values.length;

export function createCasinoCampaign({ id, players, characters, bureau, undercoverIds = [], answerKey = {} }) {
  ensure(compact(id, 100), 'invalid_campaign_id');
  ensure(Array.isArray(players) && players.length >= 4 && unique(players), 'minimum_four_unique_casino_players');
  ensure(Array.isArray(characters) && unique(characters.map(c => c.id)), 'invalid_character_roster');
  const roster = Object.fromEntries(characters.map(c => {
    ensure(compact(c.id, 80) && compact(c.name, 160), 'invalid_character');
    ensure(Number.isInteger(c.chips) && c.chips >= 0, 'invalid_starting_chips');
    for (const score of ['reputation', 'legitimacy', 'influence']) ensure(Number.isInteger(c[score]) && c[score] >= 0 && c[score] <= 100, `invalid_${score}`);
    return [c.id, { id: c.id, name: c.name, chips: c.chips, reputation: c.reputation, legitimacy: c.legitimacy, influence: c.influence, status: 'free', npc: !!c.npc }];
  }));
  ensure(players.every(id => roster[id] && !roster[id].npc), 'unknown_casino_player');
  ensure(bureau && bureau.agent && bureau.investigator && bureau.analyst, 'missing_core_bureau_roles');
  ensure(Object.keys(bureau).every(r => CANONICAL_ROLES.has(r)), 'unknown_bureau_role');
  const bureauIds = Object.values(bureau);
  ensure(unique(bureauIds) && bureauIds.every(id => compact(id, 80) && !players.includes(id)), 'bureau_must_be_separate');
  ensure(undercoverIds.length <= 2 && unique(undercoverIds) && undercoverIds.every(id => players.includes(id)), 'invalid_undercover_assignment');
  ensure(players.length !== 4 || undercoverIds.length <= 1, 'four_players_max_one_undercover');
  ensure(Object.entries(answerKey).every(([k, v]) => /^[1-5]$/.test(k) && compact(v, 120)), 'invalid_puzzle_answers');
  return {
    version: 1, id, revision: 0, chapter: 1, phase: 1, roomLocated: false, fallbackReady: false,
    dragonAuthority: true, namedSuccessor: null, splitClaim: null,
    roster, players: [...players], bureau: { ...bureau }, undercoverIds: [...undercoverIds], answerKey: { ...answerKey },
    claims: [], agreements: {}, intel: [], evidence: [], interpellationRequests: [], agentDecisions: [],
    captured: [], eventLog: [],
  };
}

const isSystem = actor => actor === 'system';
const isCasinoPlayer = (state, actor) => state.players.includes(actor);
const bureauRole = (state, actor) => Object.entries(state.bureau).find(([, id]) => id === actor)?.[0];
function requireRole(state, actor, ...roles) {
  ensure(roles.includes(bureauRole(state, actor)), 'unauthorized_role');
}
function requirePlayer(state, actor) {
  ensure(isCasinoPlayer(state, actor), 'casino_player_required');
}
function requireCharacter(state, id) {
  ensure(compact(id, 80) && state.roster[id], 'unknown_character');
}
function requireChapter(state, chapter, minPhase = 1) {
  ensure(state.chapter === chapter && state.phase >= minPhase, 'incorrect_campaign_phase');
}
const cap = n => Math.max(0, Math.min(100, n));
function requireActive(state, actor) {
  requirePlayer(state, actor);
  ensure(state.roster[actor].status !== 'dead', 'deceased_character');
}
function validateRecordId(state, recordId, eventId, type) {
  ensure(compact(recordId, 100), 'invalid_record_id');
  ensure(!state.eventLog.some(e => e.type === type && e.payload.recordId === recordId && e.id !== eventId), 'duplicate_record_id');
}

/** Dispatch an authoritative, idempotent command. All game effects are replayable. */
export function applyCasinoCommand(current, command) {
  ensure(current?.version === 1 && command && compact(command.id, 120) && compact(command.actor, 100) && compact(command.type, 80), 'invalid_command');
  const { id, actor, type } = command;
  const payload = command.payload || {};
  const existing = current.eventLog.find(e => e.id === id);
  if (existing) {
    ensure(existing.actor === actor && existing.type === type && JSON.stringify(existing.payload) === JSON.stringify(payload), 'idempotency_key_conflict');
    return current;
  }
  const s = deepCopy(current);
  switch (type) {
    case 'SETTLE_POKER': {
      ensure(isSystem(actor), 'settlement_requires_server');
      requireChapter(s, 1);
      ensure(compact(payload.handId, 120), 'invalid_hand_id');
      ensure(!s.eventLog.some(e => e.type === 'SETTLE_POKER' && e.payload.handId === payload.handId), 'hand_already_settled');
      const net = payload.net;
      ensure(net && typeof net === 'object' && Object.keys(net).length >= 2 && Object.keys(net).every(k => s.players.includes(k)), 'invalid_hand_participants');
      ensure(Object.values(net).every(n => Number.isSafeInteger(n)) && Object.values(net).reduce((a,b) => a+b,0) === 0, 'poker_must_be_zero_sum');
      for (const [player, amount] of Object.entries(net)) ensure(s.roster[player].chips + amount >= 0, 'insufficient_chips');
      for (const [player, amount] of Object.entries(net)) s.roster[player].chips += amount;
      break;
    }
    case 'SETTLE_SLOT': {
      ensure(isSystem(actor), 'settlement_requires_server');
      requireChapter(s, 1);
      const { player, wager, payout, spinId } = payload;
      requireCharacter(s, player);
      ensure(s.players.includes(player), 'casino_player_required');
      ensure(compact(spinId, 120) && !s.eventLog.some(e => e.type === 'SETTLE_SLOT' && e.payload.spinId === spinId), 'spin_already_settled');
      ensure(Number.isSafeInteger(wager) && wager > 0 && Number.isSafeInteger(payout) && payout >= 0, 'invalid_slot_amount');
      ensure(s.roster[player].chips >= wager, 'insufficient_chips');
      s.roster[player].chips += payout - wager;
      // RNG, paytable and jackpot escrow must be evaluated server-side before calling this command.
      break;
    }
    case 'PROPOSE_AGREEMENT': {
      requireActive(s, actor);
      requireChapter(s, 1);
      const { recordId, participants, kind, visibility, terms, territoryId } = payload;
      validateRecordId(s, recordId, id, type);
      ensure(Array.isArray(participants) && participants.length >= 2 && unique(participants) && participants.includes(actor) && participants.every(p => s.players.includes(p)), 'invalid_agreement_parties');
      ensure(AGREEMENT_KINDS.has(kind) && ['public','private'].includes(visibility) && compact(terms, 1000), 'invalid_agreement');
      ensure(!s.agreements[recordId], 'agreement_exists');
      if(kind==='territory')ensure(typeof territoryId==='string'&&!!s.territories?.[territoryId],'territory_agreement_requires_asset');
      s.agreements[recordId] = { id: recordId, participants, kind, visibility, terms, ...(kind==='territory'?{territoryId}:{}), signatures: [actor], status:'pending', breachedBy:[] };
      break;
    }
    case 'SIGN_AGREEMENT': {
      requireActive(s, actor);
      const a = s.agreements[payload.recordId];
      ensure(a && a.status === 'pending' && a.participants.includes(actor) && !a.signatures.includes(actor), 'agreement_not_signable');
      a.signatures.push(actor);
      if (a.signatures.length === a.participants.length) a.status = 'signed';
      break;
    }
    case 'BREAK_AGREEMENT': {
      requireActive(s, actor);
      const a = s.agreements[payload.recordId];
      ensure(a && a.status === 'signed' && a.participants.includes(actor) && !a.breachedBy.includes(actor), 'agreement_not_breachable');
      a.breachedBy.push(actor);
      s.roster[actor].reputation = cap(s.roster[actor].reputation - 7);
      break;
    }
    case 'CLAIM_SUCCESSION': {
      requireActive(s, actor);
      requireChapter(s, 1);
      ensure(!s.claims.some(c => c.id === actor), 'claim_already_registered');
      s.claims.push({ id: actor, status:'contested', claimedAt:{chapter:s.chapter,phase:s.phase} });
      // No score threshold: claiming changes relationships, it does not grant leadership.
      break;
    }
    case 'DRAGON_AUTHORITY': {
      ensure(isSystem(actor), 'authority_requires_server');
      ensure(typeof payload.retained === 'boolean' && compact(payload.canonicalReason, 250), 'missing_authority_adjudication');
      s.dragonAuthority = payload.retained;
      if (!payload.retained) s.namedSuccessor = null;
      break;
    }
    case 'DRAGON_NOMINATION': {
      ensure(isSystem(actor), 'nomination_requires_server');
      requireCharacter(s, payload.characterId);
      ensure(s.dragonAuthority && s.roster[payload.characterId].status === 'free', 'dragon_lacks_authority');
      ensure(s.claims.some(c => c.id === payload.characterId), 'successor_must_claim');
      s.namedSuccessor = payload.characterId; // Contested until effective control is established.
      break;
    }
    case 'SPLIT_FACTION': {
      requireActive(s, actor);
      ensure(s.claims.some(c => c.id === actor) && !s.splitClaim, 'split_unavailable');
      s.splitClaim = { founder: actor, name: compact(payload.name, 120) ? payload.name : 'Branche dissidente', acceptedSupporters:[] };
      break;
    }
    case 'JOIN_SPLIT': {
      requireActive(s, actor);
      ensure(s.splitClaim && s.roster[actor]?.status==='free' && actor !== s.splitClaim.founder && !s.splitClaim.acceptedSupporters.includes(actor), 'not_joinable');
      s.splitClaim.acceptedSupporters.push(actor);
      break;
    }
    case 'REPORT_INTEL': {
      requireActive(s, actor);
      requireChapter(s, 1);
      ensure(s.undercoverIds.includes(actor), 'not_undercover');
      ensure(compact(payload.text, 1000) && compact(payload.subjectId, 80) && s.roster[payload.subjectId] && payload.subjectId !== actor, 'invalid_intelligence');
      s.intel.push({ id, from:actor, text:payload.text, subjectId:payload.subjectId, checked:false });
      break;
    }
    case 'AGENT_DECISION': {
      requireRole(s, actor, 'agent');
      requireChapter(s, 1);
      const index = s.agentDecisions.length + 1;
      ensure(index <= 5 && compact(payload.answer, 120) && s.answerKey[index], 'no_decision_available');
      ensure((index <= 2 && s.phase === 1) || (index >= 3 && index <= 4 && s.phase === 2) || (index === 5 && s.phase === 3), 'decision_not_available_in_phase');
      s.agentDecisions.push({ index, correct: payload.answer === s.answerKey[index] });
      break;
    }
    case 'AUTHORIZE_FALLBACK': {
      ensure(isSystem(actor) && compact(payload.reason, 300), 'fallback_requires_server');
      requireChapter(s, 1, 3);
      s.fallbackReady = true;
      break;
    }
    case 'LOCATE_ROOM': {
      requireRole(s, actor, 'agent');
      requireChapter(s, 1, 3);
      const perfect = s.agentDecisions.length === 5 && s.agentDecisions.every(d => d.correct);
      ensure(perfect || s.fallbackReady, 'room_not_locatable_yet');
      s.roomLocated = true;
      break;
    }
    case 'VALIDATE_EVIDENCE': {
      ensure(isSystem(actor), 'evidence_requires_server_validation');
      requireCharacter(s, payload.subjectId);
      ensure(compact(payload.sourceId, 150) && compact(payload.description, 400) && compact(payload.offence, 120), 'invalid_evidence');
      ensure(!s.evidence.some(e => e.sourceId === payload.sourceId), 'source_already_recorded');
      s.evidence.push({ id, subjectId:payload.subjectId, sourceId:payload.sourceId, description:payload.description, offence:payload.offence, validated:true });
      break;
    }
    case 'REQUEST_INTERPELLATION': {
      requireRole(s, actor, 'investigator', 'prosecutor');
      ensure(s.chapter >= 2, 'no_visible_police_operation_yet');
      requireCharacter(s, payload.subjectId);
      const evidence = s.evidence.filter(e => e.subjectId === payload.subjectId && (payload.evidenceIds || []).includes(e.id));
      ensure(evidence.length >= 2 && unique(evidence.map(e=>e.sourceId)), 'insufficient_corroboration');
      ensure(compact(payload.allegedOffence, 150) && compact(payload.reasoning, 700), 'missing_reasoned_request');
      s.interpellationRequests.push({id,subjectId:payload.subjectId,evidenceIds:payload.evidenceIds,allegedOffence:payload.allegedOffence,reasoning:payload.reasoning,executed:false});
      break;
    }
    case 'INTERPELLATE': {
      requireRole(s, actor, 'agent');
      ensure(s.chapter >= 2 && s.roomLocated, 'intervention_not_open');
      const r = s.interpellationRequests.find(x=>x.id===payload.requestId);
      ensure(r && !r.executed && s.roster[r.subjectId].status === 'free', 'invalid_interpellation');
      s.roster[r.subjectId].status = 'interpellated';
      r.executed = true;
      break;
    }
    case 'DETAIN': {
      // Detention is distinct from arrest and later conviction.
      ensure(isSystem(actor) || bureauRole(s, actor) === 'judge', 'judicial_authorization_required');
      ensure(s.chapter >= 2, 'detention_not_open');
      requireCharacter(s, payload.subjectId);
      ensure(s.roster[payload.subjectId].status === 'interpellated' && compact(payload.judicialBasis, 700), 'detention_requires_basis');
      s.roster[payload.subjectId].status = 'detained';
      break;
    }
    case 'PRISON_MESSAGE': {
      requireActive(s, actor);
      ensure(s.roster[actor].status === 'detained' && compact(payload.text, 700) && ['cooperate', 'allies', 'appeal'].includes(payload.kind), 'prison_action_unavailable');
      s.captured.push({ id, from:actor, kind:payload.kind, text:payload.text });
      break;
    }
    case 'ADVANCE_PHASE': {
      ensure(isSystem(actor), 'phase_requires_server');
      if (s.phase < PHASE_COUNT[s.chapter-1]) s.phase += 1;
      else {
        ensure(s.chapter < 3, 'campaign_already_complete');
        ensure(s.chapter !== 1 || s.roomLocated, 'room_must_be_located_first');
        s.chapter += 1; s.phase = 1;
      }
      break;
    }
    default: throw new Error('unknown_campaign_command');
  }
  s.revision += 1;
  s.eventLog.push({ id, actor, type, payload: deepCopy(payload), chapter:current.chapter, phase:current.phase, revision:s.revision });
  return s;
}

/** This projection is a boundary: never send the complete authoritative state to clients. */
export function casinoView(state, viewer) {
  const role = bureauRole(state, viewer);
  const casino = isCasinoPlayer(state, viewer);
  ensure(role || casino, 'unknown_viewer');
  const visibleRoster = Object.values(state.roster).map(c => ({ id:c.id, name:c.name, reputation:c.reputation, legitimacy:c.legitimacy, influence:c.influence,
    status:state.chapter >= 2 ? c.status : c.status === 'dead' ? 'dead' : 'guest',
    chips:casino ? c.chips : undefined }));
  const agreements = Object.values(state.agreements).filter(a => a.visibility === 'public' || casino && a.participants.includes(viewer));
  const shared = { campaignId:state.id, version:state.version, revision:state.revision, chapter:state.chapter, phase:state.phase, characters:visibleRoster,
    agreements:deepCopy(agreements), claims:deepCopy(state.claims), namedSuccessor:state.namedSuccessor, splitClaim:deepCopy(state.splitClaim) };
  if (casino) return { ...shared, camp:'casino', ownUndercoverBrief:state.undercoverIds.includes(viewer) ? { mission:'observer_rapporter' } : undefined,
    ownPrisonMessages:deepCopy(state.captured.filter(m=>m.from===viewer)) };
  return { ...shared, camp:'bureau', role, intel:deepCopy(state.intel.map(({id,text,subjectId,checked})=>({id,text,subjectId,checked}))),
    evidence:deepCopy(state.evidence), requests:deepCopy(state.interpellationRequests), agentProgress:state.agentDecisions.map(d=>({index:d.index,correct:d.correct})), roomLocated:state.roomLocated };
}

export function replayCasinoCommands(initial, commands) {
  return commands.reduce((state, cmd) => applyCasinoCommand(state, cmd), initial);
}

