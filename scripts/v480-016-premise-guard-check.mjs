import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('app-v11.js','utf8');
const doc=await readFile('SCENARIO_016_RELEASE_GATES.md','utf8');
const at=app.indexOf("id:'016'");
assert(at>=0,'016 must be listed');
const scenario=app.slice(at,app.indexOf("id:'017'",at));
assert(scenario.includes("title:'LE DERNIER ÉTAGE'"),'016 title');
assert(scenario.includes('min:5,max:8'),'016 supports five to eight players');
for(const s of ['Le meurtre, lui, n’apparaît sur aucune image','Avocat possible','Humiliation ≠ meurtre','Abandon tardif'])
 assert(scenario.includes(s),'016 premise or unique mechanic missing '+s);
for(const s of ['5 joueurs','6 joueurs','7 joueurs','8 joueurs','A/B/C','BEGIN/ROLLBACK','non publié'])
 assert(doc.includes(s),'release criterion not documented '+s);
assert(!doc.includes('human_playtest_verified=true'),'human test must not be invented');
console.log('016 existing premise, 5–8 players and safe release plan: PASS. This is NOT a production/private manuscript validation.');
