// v777 — Public editorial consistency, without loading protected variants.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('app-v11.js','utf8');
const locale=readFileSync('language-v12.js','utf8');
const index=readFileSync('index.html','utf8');
const sw=readFileSync('service-worker.js','utf8');
const finalizer=readFileSync('scripts/finalize-cartel030-release.mjs','utf8');
const j=readFileSync('judicial-card-v773.js','utf8');
const pairs=[
 ['004','Sofia est morte après avoir demandé de l’aide'],
 ['005','Adrian Keller est retrouvé mort dans la galerie d’une ancienne verrerie'],
 ['010','Nora Weiss a été retrouvée morte dans une réserve des archives']
];
for(const [id,fragment] of pairs)assert(app.includes(fragment),id+' client copy not aligned');
for(const outdated of [
 'Sofia meurt d’une overdose',
 'Sofia est morte d’une overdose',
 'Toutes ont reçu son appel',
 'mort de Noé dans un chalet',
 'dans son studio',
 'derrière un mur technique',
 'Chez Adrian Keller'
]){
 assert(!app.includes(outdated),'Old base client narrative: '+outdated);
 assert(!locale.includes(outdated),'Old French locale narrative: '+outdated);
}
assert(locale.includes('Cinq ans après la mort de Noé lors d’une randonnée'),
 'Dossier 006 must locate the fatal event during the hike');
assert(locale.includes('galerie d’une ancienne verrerie'),
 'Dossier 005 must locate the victim in the correct gallery');
assert(locale.includes('réserve des archives'),
 'Dossier 010 must locate the victim in the archive reserve');
for(const url of ['app-v11.js?v=v812-spy-lobby-viewport-20261121','language-v12.js?v=v777-editorial-consistency-20261117']){
 assert(index.includes(url),'Index version missing: '+url);
 assert(sw.includes(url),'PWA version missing: '+url);
}
assert(sw.includes("const CACHE='igr-v826-full-width-dossiers-20261121'"),'Mobile video polish PWA cache not updated');
for(const asset of ['video-mobile-polish-v814.css?v=20261121-v814-1','video-mobile-polish-v814.js?v=20261121-v814-1','heritage-mobile-polish-v815.css?v=20261121-v815-1','interface-consistency-v816.css?v=20261121-v816-1','role-viewport-stability-v816.js?v=20261121-v816-1','video-ui-refinements-v817.css?v=20261121-v817-1','heritage-ux-v818.css?v=20261121-v820-1','heritage-ux-v818.js?v=20261121-v820-1','heritage-recording-fixes-v819.css?v=20261121-v819-1','heritage-hub-v820.css?v=20261121-v826-1']){
 assert(index.includes(asset),'New UI runtime not included in index: '+asset);
 assert(sw.includes('/'+asset),'New UI runtime missing from PWA cache: '+asset);
}
assert(sw.includes('/suspect-natural-cards-v777.js?v=v811-spy-status-v787-20261121'),'Suspect readability script missing from offline cache');
assert(finalizer.includes("const clientVersion='v812-spy-lobby-viewport-20261121'"),'Finalizer restores an obsolete app version');
assert(j.includes("player.public_role!=='enqueteur'"),'Suspect/private roles must remain untouched');
assert(j.includes('igr773-situation-copy'),'Investigator opening still uses bullets');
console.log('PASS v777: base facts, legacy French copy, mobile/PWA cache and private-card isolation.');
