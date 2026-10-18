// Authoritative virtual games. This file must never be copied into static assets.
const require = (ok, code) => { if (!ok) throw Error(code); };
export const SLOT_RULES = Object.freeze({ symbols: ['7', 'DRAGON', 'A', 'K', 'Q'], maxWager: 20,
  tripleDragon: 30, otherTriple: 8, pair: 1, other: 0 });

export function randomInt(limit) {
  require(Number.isSafeInteger(limit) && limit > 0 && limit <= 0x100000000, 'invalid_random_limit');
  const values = new Uint32Array(1), ceiling = Math.floor(0x100000000 / limit) * limit;
  do { crypto.getRandomValues(values); } while (values[0] >= ceiling);
  return values[0] % limit;
}
export function shuffledDeck(rng = randomInt) {
  const deck = Array.from({ length: 52 }, (_, n) => n);
  for (let n = 51; n > 0; n--) { const i = rng(n + 1); [deck[n], deck[i]] = [deck[i], deck[n]]; }
  return deck;
}
const rank = card => card % 13 + 2;
const suit = card => Math.floor(card / 13);
export function evaluateHand(cards) {
  require(Array.isArray(cards) && cards.length === 5 && new Set(cards).size === 5 &&
    cards.every(c => Number.isInteger(c) && c >= 0 && c < 52), 'invalid_poker_hand');
  const values = cards.map(rank).sort((a, b) => b - a), counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every(c => suit(c) === suit(cards[0]));
  const straight = counts.size === 5 && (values[0] - values[4] === 4 ? values[0] :
    values.join(',') === '14,5,4,3,2' ? 5 : 0);
  if (flush && straight) return [8, straight];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (flush) return [5, ...values];
  if (straight) return [4, straight];
  if (groups[0][1] === 3) return [3, ...groups.map(g => g[0])];
  if (groups[0][1] === 2 && groups[1][1] === 2) return [2, ...groups.map(g => g[0])];
  if (groups[0][1] === 2) return [1, ...groups.map(g => g[0])];
  return [0, ...values];
}
export function compareHands(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return Math.sign((a[i] || 0) - (b[i] || 0));
  }
  return 0;
}
export function startPoker(state, { id, participants, deck, now, ante = 5, timeoutMs = 90000 }) {
  require(!state.poker || state.poker.stage === 'settled', 'poker_hand_in_progress');
  require(state.chapter === 1, 'poker_closed');
  require(Array.isArray(participants) && participants.length >= 2 && participants.length <= 7 &&
    new Set(participants).size === participants.length, 'invalid_poker_participants');
  require(participants.every(p => state.players.includes(p) && state.roster[p].status === 'free' &&
    state.roster[p].chips >= ante), 'player_not_available_for_poker');
  require(new Set(deck).size === 52 && deck.every(c => Number.isInteger(c) && c >= 0 && c < 52), 'invalid_deck');
  if (!state.openingPokerComplete) require(participants.length === state.players.length, 'opening_poker_requires_everyone');
  const hand = { id, stage: 'draw', participants: [...participants], deck: [...deck], cards: {},
    contribution: {}, bets: {}, folded: [], drawn: [], acted: [], turn: participants[0],
    highestBet: 0, ante, maxDraw: participants.length === 7 ? 2 : 3, deadline: now + timeoutMs, timeoutMs, pot: 0 };
  for (const p of participants) {
    state.roster[p].chips -= ante; hand.pot += ante; hand.contribution[p] = ante; hand.bets[p] = 0;
    hand.cards[p] = hand.deck.splice(0, 5);
  }
  state.poker = hand;
}
function settlePoker(state) {
  const h = state.poker, alive = h.participants.filter(p => !h.folded.includes(p));
  const scores = Object.fromEntries(alive.map(p => [p, evaluateHand(h.cards[p])]));
  let winners = [alive[0]];
  for (const p of alive.slice(1)) {
    const diff = compareHands(scores[p], scores[winners[0]]);
    if (diff > 0) winners = [p]; else if (!diff) winners.push(p);
  }
  h.winners = winners; h.payouts = {}; let remainder = h.pot % winners.length;
  for (const p of winners) {
    const payout = Math.floor(h.pot / winners.length) + (remainder-- > 0 ? 1 : 0);
    state.roster[p].chips += payout; h.payouts[p] = payout;
  }
  h.showdown = alive.length > 1 ? Object.fromEntries(alive.map(p => [p, h.cards[p]])) : {};
  h.stage = 'settled'; h.turn = null; h.deadline = null;
  state.openingPokerComplete = true;
}
function nextTurn(state, now) {
  const h = state.poker, active = h.participants.filter(p => !h.folded.includes(p));
  if (active.length === 1) return settlePoker(state);
  if (h.stage === 'draw' && active.every(p => h.drawn.includes(p))) {
    h.stage = 'bet'; h.acted = []; h.turn = active[0];
  } else if (h.stage === 'bet' && active.every(p => h.acted.includes(p) && h.bets[p] === h.highestBet)) {
    return settlePoker(state);
  } else {
    const index = h.participants.indexOf(h.turn);
    for (let offset = 1; offset <= h.participants.length; offset++) {
      const p = h.participants[(index + offset) % h.participants.length];
      if (!h.folded.includes(p) && (h.stage === 'draw' ? !h.drawn.includes(p) :
        !h.acted.includes(p) || h.bets[p] < h.highestBet)) { h.turn = p; break; }
    }
  }
  h.deadline = now + h.timeoutMs;
}
export function pokerAction(state, actor, { action, discard = [], amount }, now) {
  const h = state.poker;
  require(h && h.stage !== 'settled' && h.turn === actor, 'not_your_poker_turn');
  if (action === 'fold') {
    h.folded.push(actor);
  } else if (h.stage === 'draw') {
    require(action === 'draw' && Array.isArray(discard) && discard.length <= h.maxDraw &&
      new Set(discard).size === discard.length && discard.every(i => Number.isInteger(i) && i >= 0 && i < 5), 'invalid_draw');
    for (const i of discard) h.cards[actor][i] = h.deck.shift();
    h.drawn.push(actor);
  } else if (action === 'check') {
    require(h.bets[actor] === h.highestBet, 'must_call_or_fold'); h.acted.push(actor);
  } else if (action === 'call') {
    const due = h.highestBet - h.bets[actor];
    require(due > 0 && state.roster[actor].chips >= due, 'invalid_call');
    state.roster[actor].chips -= due; h.pot += due; h.contribution[actor] += due;
    h.bets[actor] = h.highestBet; h.acted.push(actor);
  } else if (action === 'bet') {
    // One capped betting round, no raises or side pots. The table ceiling is
    // limited to every active player's stack so nobody can lose more than held.
    const ceiling = Math.min(20, ...h.participants.filter(p => !h.folded.includes(p)).map(p => state.roster[p].chips));
    require(h.highestBet === 0 && Number.isSafeInteger(amount) && amount > 0 && amount <= ceiling, 'invalid_bet');
    state.roster[actor].chips -= amount; h.pot += amount; h.contribution[actor] += amount;
    h.bets[actor] = amount; h.highestBet = amount; h.acted = [actor];
  } else throw Error('invalid_poker_action');
  nextTurn(state, now);
}
export function expirePokerTurn(state, now) {
  const h = state.poker;
  if (!h || h.stage === 'settled' || now < h.deadline) return false;
  pokerAction(state, h.turn, h.stage === 'draw' ? { action: 'draw' } :
    { action: h.bets[h.turn] === h.highestBet ? 'check' : 'fold' }, now);
  return true;
}
export function pokerView(state, viewer) {
  const h = state.poker; if (!h) return null;
  return { id: h.id, stage: h.stage, participants: h.participants, pot: h.pot, ante: h.ante,
    turn: h.turn, deadline: h.deadline, maxDraw: h.maxDraw, highestBet: h.highestBet, bets: h.bets, folded: h.folded,
    ownCards: state.players.includes(viewer) ? h.cards[viewer] || [] : [],
    winners: h.winners || [], payouts: h.payouts || {}, showdown: h.showdown || {} };
}
export function spinSlot(state, actor, wager, reels) {
  require(state.chapter === 1 && state.phase >= 2, 'slots_not_open');
  require(state.players.includes(actor) && state.roster[actor].status === 'free', 'casino_player_required');
  require(Number.isSafeInteger(wager) && wager >= 1 && wager <= SLOT_RULES.maxWager, 'invalid_slot_wager');
  require(state.roster[actor].chips >= wager, 'insufficient_chips');
  require(Array.isArray(reels) && reels.length === 3 && reels.every(r => SLOT_RULES.symbols.includes(r)), 'invalid_slot_reels');
  const distinct = new Set(reels).size;
  const multiplier = distinct === 1 ? (reels[0] === 'DRAGON' ? SLOT_RULES.tripleDragon : SLOT_RULES.otherTriple) :
    distinct === 2 ? SLOT_RULES.pair : SLOT_RULES.other;
  const payout = wager * multiplier;
  require(state.casinoBank + wager >= payout, 'casino_bank_exhausted');
  state.roster[actor].chips += payout - wager; state.casinoBank += wager - payout;
  state.slotResults[actor] = { reels, wager, payout, multiplier };
}
