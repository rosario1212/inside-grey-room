// Scenario 007 v289: immutable UI, fair role separation and no client-side truth keys.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const dist=process.argv[2]||'dist';
const html=readFileSync(path.join(dist,'index.html'),'utf8');
const tag=html.match(/app-v11-([A-Za-z0-9_-]+)\.js\?v=/)?.[1];
assert(tag&&html.includes('app-v11-'+tag+'.js?v='+tag),'007 current immutable release missing');
const app=readFileSync(path.join(dist,'app-v11-'+tag+'.js'),'utf8');
const seven=readFileSync(path.join(dist,'investigation-007-v289.js'),'utf8');
const sw=readFileSync(path.join(dist,'service-worker.js'),'utf8');
const worker=readFileSync('cloudflare-worker.mjs','utf8');
assert(html.includes('app-v11-'+tag+'.js?v='+tag));
assert.match(html,/investigation-007-v289\.js\?v=nine-cases-v347-20261113/);
assert.match(app,/deepSevenInvestigations/,'Room-pinned 007 adaptive UI required');
assert.match(app,/investigation_007_adaptive===true/);
assert.match(app,/igr_v289_007_investigate/,'Server must enforce option caps and timing');
assert(app.includes("const isOptionalInvestigation=id=>/^0(0[1-9]|10)_(1[0-9]|20)$/.test(String(id));"), '007 and 010 optional identifiers must remain recognized');
assert.match(seven,/igr_v289_007_submit_detail/,'Both investigators submit sealed reports');
assert.match(seven,/Le testament suffit-il à désigner/,'Questionnaire must avoid unsupported 007-C signed document premise');
assert.match(seven,/Que montre le registre des sorties concernant le bénéficiaire apparent/,'One objectively scoreable departure question');
assert.doesNotMatch(seven,/Qui les premières traces situent-elles/,'Ambiguous departure prompt must be removed');
assert.match(seven,/\['enqueteur','analyste'\]/,'Suspects cannot submit questionnaires');
assert.match(seven,/previousSubmit\.apply/,'Legacy 007 sessions must retain debrief');
assert.match(seven,/Impossible à établir actuellement/,'Uncertainty remains valid');
assert.doesNotMatch(seven,/answer_keys|canonical_truth|private_variant|prior_alignment|score_by_variant|source_ids/i,
 'Answer keys and private variant data must never ship to browsers');
assert.match(sw,/investigation-007-v289\.js\?v=nine-cases-v347-20261113/,
 '007 client must be in PWA shell');
assert(sw.includes("const CACHE='igr-santoro-display-audit-20261108-"+tag+"'"),'Current PWA cache missing');
assert(worker.includes('index-latest-release.txt'),'Worker must serve active release alias');
assert.match(seven,/Que permet d.identifier le document utilisé lors du dernier rendez-vous/,'007 non-spoiler questionnaire required');
assert.doesNotMatch(seven,/Une autre pièce familiale \(lettre ou filiation\)|Le dossier d’une dette/,'007 must not advertise alternate variants');
console.log('IGR v289 007: sealed questionnaires, fair 3+1 investigations, immutable release: PASS');
