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
const hubAsset='heritage-hub-v820.css?v=20261121-v820-1';
for(const asset of [cssAsset,jsAsset,hubAsset]){
 assert.equal(index.split(asset).length-1,1,'Asset loaded once: '+asset);
 assert(sw.includes('/'+asset),'Offline shell must include '+asset);
}
assert(sw.includes("const CACHE='igr-v820-heritage-hub-20261121'"));
assert(finalizer.includes("const pwaVersion='v820-heritage-hub-20261121'"));
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
console.log('PASS v820: single poster navigation, responsive card geometry, no gameplay click interception, mobile and PWA bundles.');
