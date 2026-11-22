// Heritage v820: four illustrated campaign cards, no duplicate mini selector.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=f=>readFileSync(f,'utf8');
const code=read('heritage-ux-v818.js');
const css=read('heritage-ux-v818.css');
const hubCss=read('heritage-hub-v820.css');
const index=read('index.html'),sw=read('service-worker.js');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
new vm.Script(code);
const cssAsset='heritage-ux-v818.css?v=20261121-v820-1';
const jsAsset='heritage-ux-v818.js?v=20261121-v820-1';
const hubAsset='heritage-hub-v820.css?v=20261122-campaign-intro';
for(const asset of [cssAsset,jsAsset,hubAsset]){
 assert.equal(index.split(asset).length-1,1,'Asset loaded once: '+asset);
 assert(sw.includes('/'+asset),'Offline shell must include '+asset);
}
assert(sw.includes("const CACHE='igr-v827-game-tabs-and-investigator-controls-20261122'"));
assert(finalizer.includes("const pwaVersion='v827-game-tabs-and-investigator-controls-20261122'"));
for(const builder of [web,mobile]){
 for(const file of ['heritage-ux-v818.css','heritage-ux-v818.js','heritage-hub-v820.css'])
  assert(builder.includes("'"+file+"'"),'Builder missing '+file);
}
assert(!code.includes('quickNav('));
assert(!code.includes('hu-quick-button'));
assert(!code.includes('handleClick(event)'));
assert(!css.includes('hu-quick-list'));
assert(code.includes("hub.querySelector('.hu-quick-nav')?.remove()"));
assert(code.includes('LANCER UNE PARTIE'),'Keep preparation stepper wording');
assert(code.includes('Créer ou reprendre une partie'),'Keep the Casino resume action');
assert(css.includes('main.hplay-hub > .hj-progress{display:none!important}'));
assert(css.includes('.hplay.hplay-campaign .hplay-case'),'Keep chapter cards');
assert(css.includes('.hnet-role-minimal .hnet-selected-role'),'Keep online lobby selection');
assert(hubCss.includes('grid-auto-rows:max-content!important'));
assert(hubCss.includes('min-height:330px!important'));
assert(hubCss.includes('height:max-content!important'));
assert(hubCss.includes('#app main.hplay-hub'),'Mobile overrides remain scoped');
const heritage=read('heritage-play-v13-7.js'),casino=read('heritage-casino-v91.js'),maitre=read('heritage-maitre-v34.js');
assert(heritage.includes('data-hp-campaign="${id}"'),'Cendres/Kuroi poster handler retained');
assert(casino.includes("card.dataset.casinoNav='campaign'"),'Casino poster handler retained');
assert(maitre.includes('maitre-hub-card'),'Maître campaign card retained');
let removed=0;
const hub={querySelector:s=>s==='.hu-quick-nav'?{remove(){removed++}}:null};
const root={
 querySelector:s=>s==='main.hplay-hub'?hub:null,
 querySelectorAll:()=>[]
};
const handlers={};
const document={
 readyState:'loading',
 querySelector:s=>s==='#app'?root:null,
 addEventListener:(event,fn)=>{handlers[event]=fn}
};
class MutationObserver{observe(){}}
const window={addEventListener(){}};
vm.runInNewContext(code,{document,window,MutationObserver,requestAnimationFrame:cb=>cb(),console});
assert.equal(typeof handlers.DOMContentLoaded,'function');
handlers.DOMContentLoaded();
assert.equal(removed,1,'Only remove an obsolete duplicate nav if present');
assert.equal(handlers.click,undefined,'Do not add intercepting campaign click handlers');
assert.equal(window.IGR_HERITAGE_UI_V818.version,'820');
const stableMaitre=read('heritage-maitre-online-v34-4.js');
const stableCasino=read('casino-client-v105.js');
assert(!stableMaitre.includes('window.scrollY+delta'),'Maître must not add a role scroll delta');
assert(!stableCasino.includes('oldAnchorTop'),'Casino must not compensate for resized role cards');
assert(hubCss.includes('grid-template-columns:minmax(0,1fr)!important'),'Casino roles must stack on mobile');
assert(hubCss.includes('clip-path:none!important'),'Casino description must remain readable');
assert(hubCss.includes('object-fit:contain!important'),'Campaign art must not crop');
assert(hubCss.includes('v824 PREMIUM HERITAGE'),'Latest premium format explicitly scopes to first three campaigns');
assert(hubCss.includes('object-position:center top!important'),'Cendres and Kuroi headings must remain in frame');
assert(hubCss.includes('clip:rect(0,0,0,0)!important'),'Printed headings must not be duplicated');
assert(hubCss.includes('opacity:.76!important'),'Locked chapters must be readable');
assert(!hubCss.slice(hubCss.indexOf('/* v824')).includes('casino-entry'),'Preserve Casino styling');
assert(hubCss.includes('hplay-campaign-card:is(.hplay-theme-cendres,.hplay-theme-kuroi,.maitre-hub-card)'),'Single responsive contract must cover three campaign cards');
assert(hubCss.includes('object-fit:cover!important'),'Cinematic artwork fills the three campaign cards');
assert(hubCss.includes('v825 — Héritage'),'Compact footer and dossier styles exist');
assert(hubCss.includes('body:has(#app main.hplay-hub) .igr-beta-footer'),'Footer styling is scoped to Heritage hub');
console.log('PASS v825: single poster navigation, responsive card geometry, no gameplay click interception, mobile and PWA bundles.');
