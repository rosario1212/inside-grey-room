# V100 — Private variant preview, NOT game activation

This is a public source repository. All 147 manuscript payloads remain **outside GitHub**.

## Verified staging
- 147 manuscripts exist in the private authoring files; all 147 have status `review` with human approval false.
- 144/147 are in private Supabase draft table. `028-A/B/C` were blocked by security checks during upload and must not be bypassed.
- None are author-approved or activated.
- 102 of 147 lack an explicit guaranteed cycle-III clue.
- OMERTÀ 021–025 does not yet have a machine-enforced five-episode story lock; those three branches must not be switched between chapters.
- MAÎTRE 045–049 does not exist in `igr_v4_scenario_packs` and requires a separate role-aware integration. In particular the Juge must never receive the hidden client truth.

## What this migration does
- A private-only, read-only legacy-pack preview translates an editorial manuscript into provisional public briefing, private suspect card and directed relationship structures. It returns full secret content **only to a privileged internal caller**, never to a player.
- A private-only preflight reports whether all A/B/C manuscripts for an episode are independently approved, contain guaranteed final-cycle clues and have the required OMERTÀ saga marker. If not, it returns `release_eligible=false`.
- It does **not** modify start-game, sync, scoring, clues, court verdicts, active packs, or Cloudflare client bundles.
- Supabase execution verified 129 provisional pack previews. Fifteen MAÎTRE drafts intentionally have no matching legacy pack; three 028 drafts are missing from staging.
- The actual game keeps the current live canonical cases as a safe fallback.

## Mandatory steps for safe activation
1. Complete authored, evidence-backed cycle-three guarantees for the 102 flagged versions.
2. Manually verify all narrative contradictions and approve individual stories.
3. Restore 028 through a supported authorization path, without evading the current tool block.
4. Add a persistent saga-level branch lock for OMERTÀ, CENDRES, KUROI and MAÎTRE, with an immutable selection before private cards are generated.
5. Integrate the chosen private pack into **all** server readers: private cards, public context, event engine, inspection/forensic procedures, judge/verdict/scoring, sync, reconnect, replay and campaign handoff.
6. Keep the schema private; do not return unreleased truths in any client API. This includes network inspection, not just the app UI.
7. Test multiple roles, phases and reconnects across desktop/mobile using a separate non-production environment, including negative tests for cross-variant leaks.
8. Enable only after those gates pass. If any fail, leave old canon active.

No new variants will be selected from this preview migration.