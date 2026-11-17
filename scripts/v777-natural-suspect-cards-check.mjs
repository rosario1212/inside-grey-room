// v777 — smoke checks for the unified fact-led suspect-card layout.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const load=p=>readFileSync(p,'utf8');
const render=load('suspect-natural-cards-v777.js');
const html=load('index.html');
const web=load('scripts/build-web.mjs');
const mobile=load('scripts/build-mobile.mjs');
new Function(render);
for(const label of ['TON HISTOIRE','CE QUE TU AS FAIT','CE QUE TU SAIS','CE QUE TU CACHES','TES RELATIONS','TON OBJECTIF']){
 assert(render.includes(label),'Missing natural card section: '+label);
}
for(const label of ['TA DEFENSE','POUR ECHANGER','CE QUE TU PEUX DEMANDER']){
 assert(render.includes("'"+label+"':'guidance'"),'Directive not classified: '+label);
}
for(const marker of ['player?.public_role','player.private_state','groupSections','storyFallback','igr-private-priority','special.push(child)']){
 assert(render.includes(marker),'Missing preservation/private-only guard: '+marker);
}
assert(!/state\.sync\.players\b|pack\.truth\b|answer_key\b|variant_id\b/.test(render),
  'The card transformer must not use other players, an answer key or variant identifiers');
assert(html.lastIndexOf('suspect-natural-cards-v777.js')>html.lastIndexOf('judicial-card-v773.js'),
  'The final suspect-card layout must load after the other private-card renderers');
assert(web.includes("'suspect-natural-cards-v777.js'"),'Missing Cloudflare file');
assert(mobile.includes("'suspect-natural-cards-v777.js'"),'Missing mobile file');
const dir=process.argv[2];
if(dir){
 assert(existsSync(dir+'/suspect-natural-cards-v777.js'),'Built script missing');
 assert(load(dir+'/index.html').includes('suspect-natural-cards-v777.js'),'Built entry point missing script');
}
console.log('PASS v777: 5 fact-led sections + objective, no scripted guidance, authenticated card only, special secrets preserved, web/mobile inclusion.');
