// v819: specific regressions observed in the 29.97s iPhone Heritage recording.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const css=read('heritage-recording-fixes-v819.css');
const index=read('index.html'),sw=read('service-worker.js');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const old=read('heritage-ux-v818.css'),casino=read('casino-client-v105.js');
const asset='heritage-recording-fixes-v819.css?v=20261121-v819-1';
assert.equal(index.split(asset).length-1,1,'v819 layer only once');
assert(index.indexOf('heritage-ux-v818.css?v=')<index.indexOf(asset),
  'v819 has to load after prior mobile layout and v818 fixes');
assert(sw.includes('/'+asset),'v819 offline asset missing');
assert(sw.includes("const CACHE='igr-v826-full-width-dossiers-20261121'"),
  'PWA must refresh after layout fix');
assert(finalizer.includes("const pwaVersion='v826-full-width-dossiers-20261121'"),
  'Production finalize should retain v819 cache');
for(const builder of [web,mobile])assert(builder.includes("'heritage-recording-fixes-v819.css'"));
const required=[
 ["CASINO card height",'.hplay-hub-grid>.casino-entry{'],
 ["CASINO no forced 100% height",'height:auto!important'],
 ["CASINO remove equal grid rows",'grid-auto-rows:auto!important'],
 ["CASINO poster readable at balanced size",'.casino-entry .casino-poster{'],
 ["KUROI/CENDRES wide hero",'.hplay-campaign-hero{'],
 ["KUROI/CENDRES hero cover",'.hplay-campaign-hero>img{'],
 ["Visible step labels",'.hj-progress li b{'],
 ["Step label unhidden",'display:block!important'],
 ["Role descriptions no longer clipped accessibly",'.casino-role-choice-card>small{'],
 ["Actual role descriptions stay in original HTML",'-webkit-line-clamp:2!important'],
 ["CASINO scenario description visible",'.casino-dossier-content>span{'],
 ["CASINO optional role + aligned",'.casino-optional-roles>summary::after{'],
 ["Keep reduced motion",'prefers-reduced-motion:reduce']
];
for(const [label,fragment] of required)assert(css.includes(fragment),'Missing '+label+': '+fragment);
assert(casino.includes('roleShort(id)'),'Original Casino role summaries must not be removed from markup');
assert(!old.includes("hu-quick-list"),'Do not restore the redundant four-button campaign menu');
const hidden=read('heritage-unified-v760.css');
assert(!hidden.includes('clip-path:inset(50%)'),'Casino descriptions should never be hidden in one-pixel overlays');
assert(css.includes('clip-path:none!important'),'Restored text must override old clipping');
assert(css.includes('max-width:100%!important'),'Hero must not overflow mobile layout');
assert(!css.includes('pointer-events:none!important'),'Do not block role selection or other handlers');
console.log('PASS v819: blank Casino campaign card, narrow KUROI/CENDRES hero, five step labels, Casino role and scenario copy, disclosure control, web/mobile/PWA.');
