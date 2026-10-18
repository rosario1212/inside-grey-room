# v99 — Confidential manuscripts: staged, not activated

This repository is **public**. It MUST NOT contain spoiler-bearing storyline manuscripts, private cards, unreleased evidence, or final truths.

## What is genuinely complete
- 49 narrative units, three A/B/C draft manuscripts each (147 drafts), stored outside GitHub.
- The private authoring database table is installed with RLS and no `anon` / `authenticated` access.
- 144 review variants have been transferred into that table; three (028-A/B/C) were not transferred because an upload action was rejected.
- The latest independent authoring schema audit found no broken structural references, but flagged 102 variants without an explicitly guaranteed cycle-three clue.
- There are zero author-approved or production-enabled variants.

## What this PR does
- Adds a repeatable **private schema migration** (already applied to the Supabase project).
- Adds strict private-manuscript checks to the Cloudflare test and deployment workflows.
- Does not read or distribute secret manuscripts, and does not alter game startup, role secrets, case selection, scoring or verdict.

## Release blockers for actual A/B/C gameplay
1. Finish author review and genuinely resolve fairness and continuity warnings.
2. Develop a server-only variant/campaign lock **before** private cards are built. Do not place secret truth, mapping, or variant choice in public room state.
3. Resolve the same private canonical pack in every server reader of case facts: initial public briefing, private card generation, phase/reconnect, event/trame selection, official procedure, judgment, scoring, and campaign carryover.
4. Ensure role-specific sync never leaks unreleased truths. The judge role in MAÎTRE must never see the canon.
5. Stage and pass full role-based playtests on mobile, iPad, and desktop; confirm no manual refresh is required.
6. Only then authorize activation. Previous canonical production scenarios remain the fallback until every condition is satisfied.

This PR does **not** claim that 147 variants are playable in the app.
