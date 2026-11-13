// Scenario 007 v289: immutable UI, fair role separation and no client-side truth keys.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const dist=process.argv[2]||'dist';
const tag='nine-cases-v344-20261113';
const html=readFileSync(path.join(dist,'index.html'),'utf8');
const app=readFileSync(path.join(dist,'app-v11-'+tag+'.js'),'utf8');
const seven=readFileSync(path.join(dist,'investigation-007-v289.js'),'utf8');
const sw=readFileSync(path.join(dist,'service-worker.js'),'utf8');
const worker=readFileSync('cloudflare-worker.mjs','utf8');
assert.match(html,/app-v11-nine-cases-v344-20261113\.js\?v=nine-cases-v344-20261113/);
assert.match(html,/investigation-007-v289\.js\?v=nine-cases-v344-20261113/);
assert.match(app,/deepSevenInvestigations/,'Room-pinned 007 adaptive UI required');
assert.match(app,/investigation_007_adaptive===true/);
assert.match(app,/igr_v289_007_investigate/,'Server must enforce option caps and timing');
assert.match(app,/\^00\[1-9\]_\(1\[0-9\]\|20\)/,'All optional 007 IDs must be recognized');
assert.match(seven,/igr_v289_007_submit_detail/,'Both investigators submit sealed reports');
assert.match(seven,/Le testament suffit-il à désigner/,'Questionnaire must avoid unsupported 007-C signed document premise');
assert.match(seven,/Que montre le registre des sorties concernant le bénéficiaire apparent/,'One objectively scoreable departure question');
assert.doesNotMatch(seven,/Qui les premières traces situent-elles/,'Ambiguous departure prompt must be removed');
assert.match(seven,/\['enqueteur','analyste'\]/,'Suspects cannot submit questionnaires');
assert.match(seven,/previousSubmit\.apply/,'Legacy 007 sessions must retain debrief');
assert.match(seven,/Impossible à établir actuellement/,'Uncertainty remains valid');
assert.doesNotMatch(seven,/answer_keys|canonical_truth|private_variant|prior_alignment|score_by_variant|source_ids/i,
 'Answer keys and private variant data must never ship to browsers');
assert.match(sw,/investigation-007-v289\.js\?v=nine-cases-v344-20261113/,
 '007 client must be in PWA shell');
assert.match(sw,/const CACHE='igr-santoro-display-audit-20261108-nine-cases-v344-20261113'/);
assert.match(worker,/index-nine-cases-v344-20261113\.txt/);
console.log('IGR v289 007: sealed questionnaires, fair 3+1 investigations, immutable release: PASS');
