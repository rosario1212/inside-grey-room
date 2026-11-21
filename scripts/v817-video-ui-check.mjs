// v817 — regressions verified against the exact iPhone video refinements.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=f=>readFileSync(f,'utf8');
const css=read('video-ui-refinements-v817.css'),terror=read('terror-live-v681.js');
const index=read('index.html'),sw=read('service-worker.js');
const web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const finalizer=read('scripts/finalize-cartel030-release.mjs');
const cssAsset='video-ui-refinements-v817.css?v=20261121-v817-1';
const jsAsset='terror-live-v681.js?v=20261121-v817-city-1';
new vm.Script(terror);
assert.equal(index.split(cssAsset).length-1,1,'CSS loaded once');
assert.equal(index.split(jsAsset).length-1,1,'city code busts iPhone cache');
assert(sw.includes('/'+cssAsset),'CSS in offline app shell');
assert(sw.includes('/'+jsAsset),'updated Terror code in offline app shell');
assert(sw.includes("const CACHE='igr-v820-heritage-hub-20261121'"));
assert(finalizer.includes("const pwaVersion='v820-heritage-hub-20261121'"));
for(const builder of [web,mobile])assert(builder.includes("'video-ui-refinements-v817.css'"));
for(const style of [
 '.igr-role-option>.role-choice-card:not(.random-role-card)',
 '.igr-role-more>summary',
 'min-height:44px!important',
 '.terror-v681-input-row',
 'grid-template-columns:minmax(0,1fr)!important',
 '.avatar.avatar-profile.avatar-fallback',
 '.profile-page:has(#profilePreview .avatar-fallback) .profile-photo-actions>button',
 'prefers-reduced-motion:reduce'
])assert(css.includes(style),'Missing mobile refinement: '+style);
assert(css.includes('.profile-page:has(#profilePreview .avatar-fallback) .profile-photo-actions>button'),
 'Only the inapplicable remove-photo action may be hidden when no image exists');
assert(!/igr-role-(?:option|more)[^\\n]*display:none/.test(css),'Role controls must stay visible');
assert(!terror.includes('Nomme la capitale avant de lancer cette partie.'),
 'Do not show validation error before first submission');
assert(terror.includes('if(citySaving)return'),'Protect against double-save');
assert(terror.includes("e.key!=='Enter'")&&terror.includes("window.terrorV681SetCity();"),'Keyboard submission must be supported');
assert(terror.includes("p_city:city"),'Keep the original server-side city contract');
// Run the actual extracted city markup function with a minimal DOM.
// The first render must show a single invitation, one input and one save action.
const a=terror.indexOf('function citySetup(){'),b=terror.indexOf('  let citySaving=false;',a);
assert(a>=0&&b>a);
function inspect(initialCity='',isHost=true){
 let markup='',insertions=0;
 const host={insertAdjacentElement(_,node){markup=node.innerHTML;insertions++}};
 const ctx={
  STATE:{sync:{room:{status:'lobby'}},hostToken:isHost?'host':null},
  document:{querySelector:()=>host,getElementById:()=>null,
   createElement:()=>({innerHTML:'',className:'',id:''})},
  isTerror:()=>true,cityName:()=>initialCity,esc:val=>val
 };
 vm.runInNewContext(terror.slice(a,b)+'\ncitySetup()',ctx);
 assert.equal(insertions,1,'TERREUR lobby should have one city panel');
 return markup;
}
const fresh=inspect();
assert(fresh.includes('Nom de la capitale (2 à 36 caractères)'));
assert(fresh.includes('enterkeyhint="done"'));
assert(fresh.includes('Enregistrer</button>'));
assert(!fresh.includes('terror-v681-warning'));
assert(!fresh.includes('Bagdad, Genève, Paris'));
const named=inspect('Norva');
assert(named.includes('CAPITALE D’ALMIZIA'),'Selected city remains visible');
assert(named.includes('Norva'),'Selected city still visible and editable');
const guest=inspect('',false);
assert(!guest.includes('<input'),'Non-host cannot change location');
assert(guest.includes('L’hôte valide'),'Guests receive an explanation');
console.log('PASS v817: video UI city flow, mobile role details, profile fallback, web/mobile/offline wiring.');
