# V90 — private narrative authoring and server integration

Current status: 44 production scenario packs and no active A/B/C variant. The existing 34 A/B/C contracts specify only authoring directions.

## Keep the secrets private

The repository is PUBLIC. Do not commit private manuscripts, hidden truths, suspect cards, conditional evidence, or endings. Protect them separately, even if the deployed Cloudflare application has a private entry gate.

## Validating an author manuscript

Run: node scripts/v90-private-variant-check.mjs /private/location/manuscript.json

The validator emits counts and issue codes without printing sensitive story details or file paths. It tests review-status manuscripts as if they were ready on a temporary copy, without changing editorial approval.

A complete variant needs immutable truth, timeline, all private suspect cards, directed relationships, oral conversation hooks, three revelation kinds, confirmed sources, audience restrictions, responsibility 0–2, final reveal, and human approval.

## Server implementation requirements — NOT implemented by V90

1. Supabase must store spoiler-bearing variant packs in a non-public schema with auditable access rules; no client-readable pack endpoint should return unreleased truth.
2. The start-game RPC generates private cards before replacing room state. Therefore pin an approved variant BEFORE card creation, not after.
3. All pack consumers must use that same persistent canonical selection: briefing, private cards, director events, professional procedures, final verdict, scoring and later episodes.
4. Never change this selection during a match. Preserve it through reconnection and server restarts.
5. For related DLC and HÉRITAGE chapters, pin the campaign trajectory at campaign start and carry consistent decisions forward. Do not reroll per chapter.
6. Revoke or block activation if manuscripts are unapproved, structurally incomplete, or missing a necessary guaranteed route to understanding.
7. The existing production canon is the safe fallback until all readers can resolve a variant safely.
8. Add test rooms, role-specific privacy tests, mobile and desktop reconnection checks and human playtests before activation.

V90 changes neither active packs nor server selection, RPCs, migrations or deployment runtime.

## Editorial progress

Six drafted pilot variants: 001 and 005. Twelve additional completed review manuscripts: 002, 003, 004, 006. All remain unapproved and inactive. The remaining autonomous scenarios and campaigns have authoring directions but not full playable packs.

## Human-first acceptance

Briefings and cards should be readable quickly and should give each player at least two grounded tensions to discuss without opening the phone again. Event releases are punctual, may be conditional or missable, and never create a new truth.