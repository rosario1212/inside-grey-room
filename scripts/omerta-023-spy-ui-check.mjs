// La Table: verify source-only UX contracts without publishing A/B/C truth.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('omerta-023-spy-v1.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const build=fs.readFileSync('scripts/build-web.mjs','utf8');
const css=fs.readFileSync('omerta-023-spy-v1.css','utf8');
new vm.Script(src);
assert(src.includes("const CASE='023'"));
assert.match(src,/private_state\?\.spy_mission\?\.role==='taupe'/);
assert.match(src,/igr_omerta_023_spy_action/);
assert.match(src,/igr_omerta_023_spy_status/);
assert.match(src,/igr_omerta_023_spy_accuse/);
assert.match(src,/p_evidence_ids:docs\.map\(x=>x\.id\)/);
assert.match(src,/data\.can_accuse!==true/);
assert.match(src,/data\.can_act!==true/);
assert.match(src,/cycle I et II|cycle I|cycle1_mission/);
assert.match(src,/mission_complete|result\.won/);
assert.doesNotMatch(src,/variant_id|canonical_truth|responsibility_by_slot|source_md5/,
 'No private canon, variant IDs or actor mapping can appear in the public client');
for(const path of ['omerta-023-spy-v1.js','omerta-023-spy-v1.css']){
 assert(html.includes(path+'?v=omerta-023-spy-v1'));
 assert(sw.includes('/'+path+'?v=omerta-023-spy-v1'));
 assert(build.includes("'"+path+"'"));
}
assert.match(css,/min-height:44px/);
console.log('OMERTA 023 TAUPE: private role, server-validated two-cycle choices, independent C3 accusation, mobile and offline asset wiring OK');
