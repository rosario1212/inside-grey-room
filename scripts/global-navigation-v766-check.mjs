import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {join} from 'node:path';

const out=process.argv[2]||'dist';
const read=path=>readFileSync(path,'utf8');
const globalNav=read('global-navigation-v766.js');
const standard=read('app-v11.js');
const lobby=read('lobby-ui-fix-v13.js');
const web=read('scripts/build-web.mjs');
const mobile=read('scripts/build-mobile.mjs');
for(const file of ['global-navigation-v766.js','app-v11.js','lobby-ui-fix-v13.js'])
 execFileSync(process.execPath,['--check',file]);

for(const marker of [
 'global-navigation-v766.js','global-navigation-v766.css'
]){
 assert(web.includes(marker),'Web build missing '+marker);
 assert(mobile.includes(marker),'Native build missing '+marker);
 const canonicalHtml=read(join(out,'index.html'));
 assert(canonicalHtml.includes(marker),'Canonical game entry missing '+marker);
 // English is a deliberate locale-setting redirect to the canonical game,
 // not a second independent runtime.
 const englishRedirect=read(join(out,'en.html'));
 assert(englishRedirect.includes("location.replace('./')"),'English locale redirect changed');
 assert(read(join(out,marker)).length>100,'Published bundle missing '+marker);
}
assert(standard.includes("const oldLobby=document.querySelector('#app .lobby-v11')"),'All 001–034 rooms must preserve existing lobby position');
assert(standard.includes('window.scrollY+shift'),'Base/DLC lobby role anchor compensation is missing');
assert(standard.includes('previousListY!==null'),'Catalogue may not jump on passive refresh');
assert(standard.includes('previousProfileY!==null'),'Profile may not jump after selecting a badge');
assert(lobby.includes('enhanceLobby();')&&lobby.includes('window.scrollY+delta'),'Back/Settings must be inserted before paint, without shifting role cards');
assert(globalNav.includes('new MutationObserver('),'Missing shared navigation routing observer');
assert(globalNav.includes("const restoringScenarios=next==='scenarios:list'"),'Return to previously read catalogue must keep its position');
assert(!globalNav.includes('history.back()'),'Back cannot abandon active multiplayer via browser history');

let main=null,home=false;
const events={};
const app={
 querySelector(sel){
  if(sel==='main')return main;
  if(sel==='.home,.home-v10-13')return home?{}:null;
  return null;
 }
};
function screen(classes,extras={}){
 const classNames=new Set(classes);
 return {
  classList:classNames,
  dataset:extras.dataset||{},
  matches(selector){return selector.split(',').some(part=>classNames.has(part.trim().replace(/^\./,'')))},
  querySelector(selector){return extras.selectors?.[selector]||null}
 };
}
const viewport=[];
const sandbox={
 document:{
  readyState:'loading',getElementById:id=>id==='app'?app:null,
  addEventListener(name,fn){events[name]=fn},
  documentElement:{style:{scrollBehavior:'auto'}}
 },
 window:{
  scrollTo(...args){viewport.push(args)},
  addEventListener(){},
 },
 MutationObserver:class{constructor(fn){this.fn=fn}observe(){}},
 queueMicrotask:fn=>fn(),
 console
};
runInNewContext(globalNav,sandbox,{filename:'global-navigation-v766.js'});
const nav=sandbox.window.IGR_GLOBAL_NAV_V766;
assert(nav?.version?.startsWith('766.'),'Global router not registered');
home=true;main=null;
assert.equal(nav.currentRoute(),'home');
home=false;main=screen(['page','page-create-v10-13']);
assert.equal(nav.currentRoute(),'scenarios:list');
sandbox.STATE={view:'create-confirm',selectedScenario:'024'};
main=screen(['page','page-confirm-v10-13']);
assert.equal(nav.currentRoute(),'scenarios:dossier:024');
main=screen(['page'],{selectors:{'.lobby-v11,.page-lobby':{}}});
assert.equal(nav.currentRoute(),'base:lobby');
sandbox.STATE.view='game';sandbox.STATE.tab='investigation';
main=screen(['page','game-v11']);
assert.equal(nav.currentRoute(),'base:game:investigation');
main=screen(['page','hplay','hplay-campaign','hplay-theme-cendres']);
assert.equal(nav.currentRoute(),'heritage:campaign:hplay-theme-cendres');
main=screen(['page','hnet'],{selectors:{'.hnet-lobby':{}}});
assert.equal(nav.currentRoute(),'heritage:online:lobby');
main=screen(['casino-page','casino-live'],{selectors:{'.casino-lobby-top':{}}});
assert.equal(nav.currentRoute(),'casino:lobby');
main=screen(['page','localplay','local-setup']);
assert.equal(nav.currentRoute(),'local:local-setup');

console.log('PASS global navigation v766: base dossiers, all DLC lobby route, 4 Héritage campaigns, Casino, local screens, stable catalogue/profile and both bundles.');
