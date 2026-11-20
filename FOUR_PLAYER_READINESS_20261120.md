# Four-player implementation readiness — verified 2026-11-20

## Status

**The design directive is merged, but Team-4 is NOT implemented.**

Currently supported in the production Supabase project:
- Standard dossiers **001, 003, 004, 005, 006** at four players: **1 Enquêteur + 3 Suspects**.
- Same dossiers at five players: **1 Enquêteur + 1 Analyste + 3 Suspects**.
- **002** needs five players with four Suspects (no Analyst), an intentional exception.
- **007–016** still need at least five players; none has certified a four-player team/NPC variant.

**Desired second mode:** **1 Enquêteur + 1 Analyste + 2 Suspects**. It cannot simply be enabled in the current server by changing min_players or editing a dropdown. The active `igr_v4_role_for_seat` returns a fixed four-seat roster for each scenario; `igr_v4_role_capacity` is keyed by scenario/count rather than room mode; `igr_v4_start_game` allocates all Suspect cards and assigns their private internal slots. Existing canonical A/B/C packs were written for three playable Suspects, and finale/spy logic may reference all three. Replacing a Suspect with an Analyst without NPC narrative, verdict and private-card adaptation would risk an unsolvable or spoiled mystery.

## Verified checks (production database)

Read-only role/capacity query:
- 001, 003–006 at four: Investigator 1, Analyst 0, Suspects 3, consistent advertised capacity.
- 001, 003–016 at five: Investigator 1, Analyst 1, Suspects 3 (002 exception).
- No unexpected missing Investigator in the checked roster matrix.

Safe smoke suites: `igr_v184_001_smoke_draws`, `igr_v206_002_smoke_draws`, `igr_v224_003_smoke_draws`, `igr_v236_004_smoke_draws`, `igr_v256_005_smoke_draws`, `igr_v266_006_smoke_draws` — **12 attempts each, 72/72 passed**; sampled variants A/B/C, all synthetic rooms rolled back.

Verdict smoke suite:
- 002–006 passed.
- 001 initially failed because the legacy synthetic test omitted the now-required `intent` answer.
- Updated **test function only** in the production database via migration `fix_001_verdict_smoke_intent_20261120`; reran 001 successfully. The player's actual verdict validation was not weakened or changed.

These are **DB simulation and static contract tests, not human multiplayer playtests or browser end-to-end coverage**.

## Required work before calling Team-4 functional

1. Author **variant-specific** third-character nonplayer treatment for each dossier; preserve canonical actions, evidentiary ambiguity, personal goals and ability to identify responsibility.
2. Implement an explicit room-persisted A/B composition, with host confirmation before role choice. Server capacities, role selection, automatic allocation, reconnection, client display and local mode must agree.
3. Update card relations, investigations, one-trame-per-cycle quota, Analyst questionnaire and profiles, target selection, votes, responsibility and spy mission objectives for two human Suspects.
4. Verify **3 variants × 2 rosters × 3 cycles**, with the player slots permuted, including third character liable/innocent/key witness, false accusations, tie votes and incomplete testimony.
5. Add actual browser and server integration tests and human playtests before marking a scenario certified.
6. Roll out **dossier by dossier**, retain A unchanged, keep exceptions in DLC, and verify the same deployment SHA in backend and app.

## Automatic guard

Run `node scripts/four-player-contract-qa.mjs`. This test protects the existing roster and explicitly reports that the unimplemented second mode remains gated. **Passing this test does not mean Team-4 is implemented.**
