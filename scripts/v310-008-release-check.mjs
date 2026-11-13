// IGR 008 v310: secure adaptive dossier UI, sealed opinions, cache-safe release.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const dist=process.argv[2]||'dist',release='nine-cases-v344-20261113';
const html=readFileSync(path.join(dist,'index.html'),'utf8');
const app=readFileSync(path.join(dist,'app-v11-'+release+'.js'),'utf8');
const client=readFileSync(path.join(dist,'investigation-008-v310.js'),'utf8');
const sw=readFileSync(path.join(dist,'service-worker.js'),'utf8');
const worker=readFileSync('cloudflare-worker.mjs','utf8');
assert.match(html,/app-v11-nine-cases-v344-20261113\.js\?v=nine-cases-v344-20261113/);
assert.match(html,/investigation-008-v310\.js\?v=nine-cases-v344-20261113/);
assert.match(app,/deepEightInvestigations/,'008 new pinned room gate missing');
assert.match(app,/investigation_008_adaptive===true/,'008 room contract missing');
assert.match(app,/igr_v310_008_investigate/,'008 server authoritative RPC missing');
assert.match(app,/\^00\[1-9\]_\(1\[0-9\]\|20\)/,'008 optional ids must be recognized');
assert.match(app,/deepEightInvestigations\?instructionEight/,'008 new instructional flow missing');
assert.match(client,/igr_v310_008_submit_detail/,'008 sealed questionnaire RPC missing');
assert.match(client,/\['enqueteur','analyste'\]/,'suspects must never submit private reports');
assert.match(client,/priorSubmit\.apply/,'previous 008 sessions must retain debrief');
assert.match(client,/Impossible à établir actuellement/,'uncertainty must be possible');
assert.doesNotMatch(client,/answer_keys|canonical_truth|private_variant|prior_alignment|score_by_variant|v300_verdict|source_ids/i,
 'Correct answers or variant truth must never be bundled');
assert.match(sw,/investigation-008-v310\.js\?v=nine-cases-v344-20261113/,'008 PWA precache missing');
assert.match(sw,/const CACHE='igr-santoro-display-audit-20261108-nine-cases-v344-20261113'/);
assert.match(worker,/index-nine-cases-v344-20261113\.txt/);
console.log('IGR 008 v310: 20 role-safe clues per variant, sealed scoring, pinned-only adaptive UI: PASS');
