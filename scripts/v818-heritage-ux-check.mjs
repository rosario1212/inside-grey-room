// Inside Grey Room v818: Héritage mobile navigation and unchanged campaign handlers.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=f=>readFileSync(f,'utf8');
const code=read('heritage-ux-v818.js'),css=read('heritage-ux-v818.css');
const index=read('index.html'),sw=read('service-worker.js');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const cssAsset='heritage-ux-v818.css?v=20261121-v818-1';
const jsAsset='heritage-ux-v818.js?v=20261121-v818-1';
new vm.Script(code);
for(const asset of [cssAsset,jsAsset]){
 assert.equal(index.split(asset).length-1,1,'Héritage asset loaded exactly once: '+asset);
 assert(sw.includes('/'+asset),'PWA shell must cache '+asset);
}
assert(sw.includes("const CACHE='igr-v819-heritage-recording-20261121'"));
assert(finalizer.includes("const pwaVersion='v819-heritage-recording-20261121'"));
for(const builder of [web,mobile]){
 assert(builder.includes("'heritage-ux-v818.css'"));
 assert(builder.includes("'heritage-ux-v818.js'"));
}
for(const name of ['cendres','kuroi','maitre','casino']){
 assert(code.includes("id:'"+name+"'"),'Missing direct campaign shortcut '+name);
 assert(css.includes('[data-hu-campaign="'+name+'"]')||name==='cendres','Missing scoped theme '+name);
}
assert(code.includes("if(card&&!card.disabled)card.click()"),'Shortcut must delegate to existing campaign handler');
assert(code.includes("button.disabled")===false,'No new availability rules may be created');
assert(code.includes("Campagne en cours de chargement"),'Async campaigns must not be clickable prematurely');
assert(code.includes("LANCER UNE PARTIE"),'Stepper must describe game setup, not campaign chapter progress');
assert(css.includes('main.hplay-hub > .hj-progress{display:none!important}'),'Hub has no setup stepper');
assert(css.includes('.hu-quick-list{grid-template-columns:repeat(2,minmax(0,1fr))'),'Small screens get 2 x 2 shortcuts');
assert(css.includes('.casino-page[data-casino-page="campaign"] .casino-dossier'),'Casino folders are compact');
assert(css.includes('.hplay.hplay-campaign .hplay-case'),'CENDRES/KUROI folders are compact');
assert(css.includes('.hnet-role-minimal .hnet-selected-role'),'Heritage lobby selection summary remains');
assert(css.includes('min-height:44px!important'),'Back-navigation hit targets stay accessible');
assert(code.includes('Créer ou reprendre une partie'),'Casino label must honor persisted-room recovery');

// Emulate a click on the new shortcut. Only existing original cards should launch.
const handlers={};
const originalClicks={cendres:0,kuroi:0,maitre:0,casino:0};
const selectors={
 cendres:'[data-hp-campaign="cendres"]',kuroi:'[data-hp-campaign="kuroi"]',
 maitre:'[data-maitre-open="campaign"]',casino:'[data-casino-nav="campaign"]'
};
let selectable=true;
const grid={querySelector(selector){
 const name=Object.keys(selectors).find(id=>selectors[id]===selector);
 return name?{disabled:!selectable,click(){originalClicks[name]++}}:null;
}};
const hub={querySelector(s){return s==='.hplay-hub-grid'?grid:null}};
const root={querySelector(){return null},querySelectorAll(){return []}};
const doc={readyState:'loading',querySelector:s=>s==='#app'?root:null,
 addEventListener(name,fn){handlers[name]=fn}};
const win={addEventListener(){}};
class Observer{observe(){}}
vm.runInNewContext(code,{document:doc,window:win,MutationObserver:Observer,
 requestAnimationFrame:cb=>cb(),console});
handlers.DOMContentLoaded();
for(const name of Object.keys(selectors)){
 const button={dataset:{huCampaign:name},closest:s=>s==='.hplay-hub'?hub:null};
 const evt={target:{closest:()=>button},preventDefault(){},stopPropagation(){}};
 handlers.click(evt);
 assert.equal(originalClicks[name],1,name+' must open the original card');
}
selectable=false;
const btn={dataset:{huCampaign:'casino'},closest:()=>hub};
handlers.click({target:{closest:()=>btn},preventDefault(){},stopPropagation(){}});
assert.equal(originalClicks.casino,1,'A disabled original must not be opened');
assert.equal(win.IGR_HERITAGE_UI_V818.version,'818');
console.log('PASS v818: four shortcuts use real campaign handlers, disabled targets safe, compact Heritage layout and web/mobile/PWA packaging.');
