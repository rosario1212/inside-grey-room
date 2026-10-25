# Editorial and role-gating hardening · 003 / 008 / 009 / 011

25 October 2026. SQL migrations v495–v498. This change does **not** modify any approved A/B/C manuscript, culprit, verdict, private suspect card, or the four/five/six-player rosters.

## Changes
- **003, Le Dernier Protocole**: All nine investigation results are preserved verbatim and, when short, followed by a precise *question to cross-check*. The private variant builder produces four expert analyses with cycle-aware prompts. Cycle 2's expert read may discuss only a cycle-1 guaranteed exhibit; cycle 3's read only a cycle-2 one; cycle-1 material uses the public briefing.
- **008, Sous Serment**: protected item p3 now uses its authored cost of **2 protection points**, while p1 and p2 each cost **1**. Maximum is 3 points. The UI catalogue displays the cost. New requests and decisions are forbidden when provisional conclusions begin, or thereafter. Judicial results remain restricted to their proper recipients.
- **009, Le Sujet 17**: previously static Expert conclusions are now grounded in the pinned A/B/C case, using previously introduced exhibits. Cycle availability is enforced server-side and reflected in the browser.
- **011, 36 Heures**: optional Prosecutor has a role-only strategy prompt about documented orders, executions and concealments. It references only the public context at C1, the already-introduced C1 exhibit at C2 and C2 at C3. Existing secret objectives remain pinned to the selected variant.

## Privacy and safety
- The internal evidence-enrichment functions belong to \`igr_private\` and have no anon or authenticated EXECUTE permission.
- All Expert action RPCs still require a matching player token with role Expert. The Prosecutor strategy is returned only after the token/role gate succeeds.
- The new dynamic expertise shows the previous-cycle guaranteed clue, never the upcoming guaranteed clue.
- Expert results remain private until an authorized publication or deliberate sharing. These actions stop before provisional verdict; post-verdict requests are denied server-side.
- 003's brief passages are not replaced with invented facts; follow-up prompts require cross-checking times, authors and recipients.

## Verification
- Twelve source variants have valid checksums, distinct truth fingerprints and approved release states.
- Initial SQL migrations were dry-run transactionally before applying.
- 4 simulated six-player games: Expert private/share/public/counter permissions, denial of future-cycle expertise, cost2+cost1 and cap3 on Judge, phase denial, Prosecutor accepted cooperation.
- 011 strategy C1/C2/C3 was simulated and checked against the pinned previous-cycle evidence.
- UI contract and built production pipelines verify expert choice locks, limited retrospective sharing and escaped Prosecutor prompts.
- Each QA transaction was rolled back; no fake test rooms are retained.
- Human playtest is **not** approved; all editorial scores remain provisional until player feedback.

## Provisional editorial goals (not certified user playtest ratings)
| Case | Previous | Provisional target after automated QA |
|---|---:|---:|
| 003 | 7.8 | 8.8–9.0 |
| 008 | 7.2 | 8.8–9.0 |
| 009 | 8.2 | 9.0–9.2 |
| 011 | 8.5 | 9.0–9.2 |

Any attempt to call these cases "10/10 human validated" would be premature without a mixed-role six-player playtest.
