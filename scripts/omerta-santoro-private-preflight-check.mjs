import assert from 'node:assert/strict';
import {auditSantoroDrafts} from './omerta-santoro-private-preflight.mjs';

// Synthetic dossiers: the private real-world manuscripts never leave the database.
function draft(scenario, variant) {
  const prefix = scenario + '-' + variant;
  const timeline = [
    {id: prefix + '-DOC-1', origin: 'independent hospital records', what: 'injury and time'},
    {id: prefix + '-DOC-2', origin: 'independent transport logs', what: 'vehicle and time'},
    {id: prefix + '-DOC-3', origin: 'independent company registry', what: 'payment and time'}
  ];
  const goals = {};
  const cards = [];
  for (let slot = 1; slot <= 7; slot++) {
    const goal_id = prefix + '-slot-' + slot + '-avoid_designation';
    goals[String(slot)] = {goal_id, mode: 'avoid_formal_designation'};
    cards.push({
      slot,
      verdict_goal: {goal_id, scoring_review: 'approved'},
      eligible_tip: {
        id: prefix + '-tip-' + slot, text: 'Witnessed event',
        truth_in_variant: true, corroborates_with: timeline[0].id,
        source_review: 'verified'
      },
      what_you_know: 'An established event',
      objective: 'Avoid designation for the exact charged act',
      your_chronology: '1. You observed the meeting.\n2. You saw the vehicle.\n3. You saw the registry.',
      what_you_hide: 'You retained a private copy of the register.',
      conversation_hooks: ['Which register did you see?', 'Who saw the vehicle?']
    });
  }
  const reveal = (name, source_ids) => ({
    id: prefix + '-' + name,
    kind: 'guaranteed', min_cycle: 3, audience: 'investigation',
    editorial_provenance: {
      existing_events: source_ids,
      independent_of_optional_actions: 'true',
      human_source_review: 'verified'
    }
  });
  return {
    private_format: 'santoro_v25', saga: {family: 'SANTORO', branch: variant},
    private_cards: cards,
    canonical_truth: {timeline, verdict_goal_by_slot: goals, truth_by_axis: {variant}},
    revelations: [
      reveal('C3-ONE', [timeline[0].id, timeline[1].id]),
      reveal('C3-TWO', [timeline[1].id, timeline[2].id])
    ],
    public_briefing: 'An investigation involving the Santoro family.',
    final_reveal: 'A documented responsibility and a separate false accusation.',
    status: 'ready', human_review_approved: true, verdict_scoring_review: 'approved'
  };
}
const drafts = Object.fromEntries(['021','022','023','024','025'].flatMap(s =>
  ['A','B','C'].map(v => [s + '-' + v, draft(s, v)])));

const good = auditSantoroDrafts(drafts);
assert.equal(good.variants, 15);
assert.equal(good.characters, 105);
assert.equal(good.independentC3Sources, 60);
assert.equal(good.structuralPass, true, JSON.stringify(good.issueCodes));
assert.equal(good.releasePass, true);

const pending = structuredClone(drafts);
pending['025-C'].revelations[1].editorial_provenance.human_source_review = 'pending';
const pendingAudit = auditSantoroDrafts(pending);
assert.equal(pendingAudit.structuralPass, true);
assert.equal(pendingAudit.releasePass, false);

const sameCustodian = structuredClone(drafts);
sameCustodian['023-A'].canonical_truth.timeline[2].origin =
  sameCustodian['023-A'].canonical_truth.timeline[1].origin;
const custodianAudit = auditSantoroDrafts(sameCustodian);
assert.equal(custodianAudit.structuralPass, false);
assert.ok(custodianAudit.issueCodes.includes('023-A:nonindependent_crosscheck'));

const missingEvidence = structuredClone(drafts);
missingEvidence['024-B'].revelations[0].editorial_provenance.existing_events[0] = 'UNKNOWN';
const missingAudit = auditSantoroDrafts(missingEvidence);
assert.equal(missingAudit.structuralPass, false);

const noReveal = structuredClone(drafts);
noReveal['021-A'].revelations = [];
const noRevealAudit = auditSantoroDrafts(noReveal);
assert.equal(noRevealAudit.structuralPass, false);

console.log('Omertà private preflight: 15 multi-reveal fixtures, proof origins and review gates OK');
