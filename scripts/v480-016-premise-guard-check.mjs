import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const doc=await readFile('SCENARIO_016_RELEASE_GATES.md','utf8');
const at=app.indexOf("id:'016'");
assert(at>=0,'016 must be listed');
const scenario=app.slice(at,app.indexOf("id:'017'",at));
assert(scenario.includes("title:'LE DERNIER ÉTAGE'"),'016 title');
assert(scenario.includes('min:5,max:8'),'016 supports five to eight players');
assert(!scenario.includes('avant le geste fatal'),'016 introduction must not assert a post-video fatal act that one variant does not establish');
const briefing=app.match(/'016':'([^']*)',\s*'017':/);
assert(briefing,'016 public briefing must exist');
assert(briefing[1].includes('Le film ne montre pas les circonstances de son décès'),'016 briefing must be neutral across all A/B/C conclusions');
assert(!/avant le meurtre|geste fatal|meurtre hors champ/i.test(briefing[1]),'016 briefing must not presuppose post-film homicide');
for(const s of ['Les circonstances exactes de sa mort restent hors champ','Avocat possible','Vidéo ≠ preuve du décès','Abandon tardif'])
 assert(scenario.includes(s),'016 premise or unique mechanic missing '+s);
for(const s of ['5 joueurs','6 joueurs','7 joueurs','8 joueurs','A/B/C','BEGIN/ROLLBACK','non publié'])
 assert(doc.includes(s),'release criterion not documented '+s);
assert(!doc.includes('human_playtest_verified=true'),'human test must not be invented');
const lawyerSql=await readFile('supabase/migrations/20261022144154_lawyer_mutual_termination.sql','utf8');
const lawyerTests=await readFile('scripts/lawyer-mutual-termination-check.mjs','utf8');
const cartelTests=await readFile('scripts/cartel-lawyer-assignment-check.mjs','utf8');
assert(lawyerSql.includes("penalty:=me.public_role='maitre' and r.scenario_id in ('030','031');"),'016 lawyer must never receive cartel abandonment penalty');
assert(lawyerSql.includes("'cartel_penalty_on_withdraw',me.public_role='maitre' and r.scenario_id in ('030','031')"),'016 lawyer UI penalty flag must remain false');
assert(lawyerTests.includes("['016','030','031']"),'lawyer mutual-termination tests must cover 016');
assert(cartelTests.includes("['030','031','016']"),'016 counsel must retain ordinary client-selection regime');
console.log('016 existing premise, 5–8 players and safe release plan: PASS. This is NOT a production/private manuscript validation.');
