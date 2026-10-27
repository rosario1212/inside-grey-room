// OMERTÀ — verdicts déterministes, strictement limités au joueur et à la variante.
// Fonction PURE. Les événements doivent être constitués après vérification des
// jetons d'enquête et des preuves par un RPC côté serveur, JAMAIS depuis le client.
export function scoreStandaloneGoal({
  playerId, matchNo, goal, verdictLocked,
  designations = [], informant = null
}) {
  if (typeof playerId !== 'string' || !playerId ||
      !Number.isInteger(matchNo) || matchNo < 1 ||
      goal?.mode !== 'avoid_formal_designation' ||
      typeof goal.goal_id !== 'string' || !goal.goal_id ||
      typeof goal.scenario_variant_id !== 'string' || !goal.scenario_variant_id) {
    throw new Error('omerta_invalid_private_goal');
  }
  if (verdictLocked !== true) {
    return { status: 'pending', won: null, reason: 'verdict_not_locked' };
  }

  const scopedToThisPlayerAndVariant = e =>
    e?.matchNo === matchNo && e?.playerId === playerId &&
    e?.scenarioVariantId === goal.scenario_variant_id;

  if (informant?.accepted === true) {
    const alive = informant.survived === true;
    const selfish = informant.protectedByOfficialPact === true ||
      (Number.isFinite(informant.formalReductionYears) &&
       informant.formalReductionYears >= 3);
    // Une seule information vérifiée suffit; les trois propositions de l'onglet
    // ne sont pas un quota de réponses à remplir.
    const verifiedFact = (informant.intelEvents || []).some(e =>
      scopedToThisPlayerAndVariant(e) &&
      e?.truthVerified === true &&
      e?.transmittedToInvestigation === true &&
      e?.nonpublicWhenSent === true);
    // L'enquêteur peut également attester l'utilité globale de l'indic en fin
    // de match, même si aucune des trois propositions n'a été notifiée.
    // L'attestation doit être validée côté serveur pour ce match précis.
    const investigatorApproved = (informant.investigatorAssessments || []).some(e =>
      scopedToThisPlayerAndVariant(e) &&
      e?.investigatorAuthorized === true &&
      e?.confirmed === true &&
      e?.useful === true);
    const useful = verifiedFact || investigatorApproved;
    const won = alive && selfish && useful;
    return {
      status: won ? 'won' : 'lost', won,
      personalConditionMet: alive && selfish,
      usefulInformationMet: useful,
      usefulnessSource: investigatorApproved ? 'investigator' : verifiedFact ? 'verified_fact' : null,
      survived: alive,
      oldGoalReplaced: true
    };
  }

  const designated = designations.some(e =>
    scopedToThisPlayerAndVariant(e) &&
    e?.goalId === goal.goal_id &&
    e?.confirmed === true &&
    e?.investigatorAuthorized === true);
  return {
    status: designated ? 'lost' : 'won',
    won: !designated,
    personalConditionMet: !designated,
    oldGoalReplaced: false
  };
}
