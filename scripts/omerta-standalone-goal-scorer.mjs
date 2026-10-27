// OMERTÀ — deterministic, variant-scoped private role objectives.
// No source narratives, secret roles, or culprit identities in this module.
export function scoreStandaloneGoal({
  playerId, matchNo, goal, verdictLocked,
  designations = [], informant = null
}) {
  if (!playerId || !Number.isInteger(matchNo) || matchNo < 1 ||
      goal?.mode !== 'avoid_formal_designation' || !goal.goal_id || !goal.scenario_variant_id) {
    throw new Error('omerta_invalid_private_goal');
  }
  if (verdictLocked !== true) {
    return { status: 'pending', won: null, reason: 'verdict_not_locked' };
  }
  if (informant?.accepted === true) {
    const alive = informant.survived === true;
    const selfish = informant.protectedByOfficialPact === true ||
      (Number.isFinite(informant.formalReductionYears) &&
       informant.formalReductionYears >= 3);
    const usefulFact = (informant.intelEvents || []).some(e =>
      e?.matchNo === matchNo &&
      e?.playerId === playerId &&
      e?.truthVerified === true &&
      e?.transmittedToInvestigation === true &&
      e?.nonpublicWhenSent === true);
    const won = alive && selfish && usefulFact;
    return {
      status: won ? 'won' : 'lost', won,
      personalConditionMet: alive && selfish,
      usefulInformationMet: usefulFact,
      survived: alive,
      oldGoalReplaced: true
    };
  }
  // Only a formally locked, authorized designation concerning this
  // EXACT player, game and authored act can defeat the mafia objective.
  const designated = designations.some(e =>
    e?.matchNo === matchNo &&
    e?.playerId === playerId &&
    e?.goalId === goal.goal_id &&
    e?.scenarioVariantId === goal.scenario_variant_id &&
    e?.confirmed === true &&
    e?.investigatorAuthorized === true);
  return {
    status: designated ? 'lost' : 'won',
    won: !designated,
    personalConditionMet: !designated,
    oldGoalReplaced: false
  };
}
