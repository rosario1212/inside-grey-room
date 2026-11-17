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
assert(standard.includes("document.querySelector('#app .lobby-v11')")&&standard.includes('const oldRoleAnchor='),'All 001–034 rooms must preserve existing lobby position');
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


// v769: Join has one context-specific Retour and an independent Accueil.
const joinFragment=standard.slice(standard.indexOf('function renderJoin(){'),standard.indexOf('const PROFILE_TITLES',standard.indexOf('function renderJoin(){')));
assert.equal((joinFragment.match(/class="btn ghost small igr-join-pill/g)||[]).length,2,'Exactly two navigation pills are required');
assert(joinFragment.includes('data-igr-global-back="1"'),'Retour must follow contextual navigation');
assert(joinFragment.includes('onclick="goHome()"'),'Accueil must always return to home');
assert(joinFragment.includes('igr-join-actions')&&joinFragment.includes('<svg viewBox="0 0 24 24"'),'Both buttons need vector icons');
const journey=read('heritage-journey-v755.js');
assert(journey.includes("back.removeAttribute('data-igr-global-back');back.dataset.hjReturn='1'"),'Héritage must only retarget Retour');
assert(!journey.includes("home.textContent='← Retour'"),'Héritage cannot rewrite the Accueil action');
const navStyle=read('global-navigation-v766.css');
assert(navStyle.includes('.igr-join-actions>.igr-join-pill'),'Join buttons must share premium pill styling');
assert(navStyle.includes('@media(max-width:650px)'),'Mobile join layout must be responsive');
assert(web.includes('global-navigation-v766.css?v=v769-join-pill')&&mobile.includes('global-navigation-v766.css?v=v769-join-pill'),'Both builds must ship the revised CSS');

// v776 — actual mobile utility button and shared page-header deduplication.
const mobileUi=read('mobile-ui-v28.js');
const utilityStart=mobileUi.indexOf('function enhanceUtilityExit(){');
const utilityEnd=mobileUi.indexOf('\nfunction normalizeChoiceStatus()',utilityStart);
assert(utilityStart>=0&&utilityEnd>utilityStart,'Mobile utility exit renderer missing');
const utilityFn=mobileUi.slice(utilityStart,utilityEnd);
const buttonMock=(label,options={})=>{
 const classes=new Set(options.classes||[]);
 const attrs={};
 return {
  textContent:label,innerHTML:'',dataset:{},
  classList:{add(...names){for(const name of names)classes.add(name)},toggle(name,on){if(on)classes.add(name);else classes.delete(name)},contains:name=>classes.has(name)},
  hasAttribute:name=>!!options.attrs?.includes(name)||Object.hasOwn(attrs,name),
  getAttribute:name=>attrs[name]||null,
  setAttribute(name,value){attrs[name]=value},
  removeAttribute(name){delete attrs[name]},
  addEventListener(name,fn){this.events=(this.events||[]).concat(name)},
  remove(){this.removed=true}
 };
};
for(const view of ['rules','profile']){
 const exit=buttonMock('← Accueil');
 const head={querySelectorAll:()=>[exit]};
 const page={querySelector:()=>head};
 const ctx={currentView:()=>view,isFr:()=>true,document:{querySelector:()=>page},goHomeSafe(){throw Error('Retour must not bind direct Accueil')}};
 runInNewContext(utilityFn+'\nenhanceUtilityExit();',ctx);
 assert.equal(exit.dataset.igrGlobalBack,'1',view+' must use shared contextual back');
 assert(exit.innerHTML.includes('Retour')&&!exit.innerHTML.includes('Fermer'),view+' must not show a Close button');
 assert(!exit.events?.length,view+' must not bind a competing home click');
}
{
 const exit=buttonMock('Accueil');
 const head={querySelectorAll:()=>[exit]};
 const page={querySelector:()=>head};
 runInNewContext(utilityFn+'\nenhanceUtilityExit();',{currentView:()=> 'join',isFr:()=>true,document:{querySelector:()=>page},goHomeSafe(){}});
 assert(!exit.dataset.igrGlobalBack,'Join Accueil must remain independent of contextual Retour');
 assert(exit.innerHTML.includes('Accueil'),'Join must keep its direct home action');
}
{
 const retour=buttonMock('← Retour',{classes:['igr-utility-exit'],attrs:['data-igr-global-back']});
 const fermer=buttonMock('× FERMER',{classes:['igr-rules-close']});
 const staleBack=buttonMock('← Retour',{classes:['igr-global-return'],attrs:['data-igr-global-back']});
 const home=buttonMock('⌂ Accueil');
 const controls=[retour,fermer,staleBack,home];
 const header={closest:()=>null,querySelectorAll:()=>controls.filter(x=>!x.removed)};
 main={querySelectorAll:()=>[header]};
 nav.reconcileHeaderExits();
 assert(fermer.removed,'An ordinary page must not show Fermer alongside Retour');
 assert(staleBack.removed,'A stale second Retour must be deduplicated');
 assert(!retour.removed&&!home.removed,'Keep contextual Retour and distinct Accueil');
 const modalClose=buttonMock('× Fermer');
 const modalBack=buttonMock('← Retour');
 const modal={closest:()=>({dialog:true}),querySelectorAll:()=>[modalClose,modalBack]};
 main={querySelectorAll:()=>[modal]};
 nav.reconcileHeaderExits();
 assert(!modalClose.removed,'Dialog close must remain available');
}
const loader=read('scripts/apply-mobile-ui-v28.mjs');
assert(loader.includes("v30-v776-single-contextual-exit"),'Mobile cache must refresh');
assert(web.includes('global-navigation-v766.js?v=v30-v776-single-contextual-exit')&&mobile.includes('global-navigation-v766.js?v=v30-v776-single-contextual-exit'),'Both builds must refresh navigation JavaScript');

console.log('PASS global navigation v766: base dossiers, all DLC lobby route, 4 Héritage campaigns, Casino, local screens, stable catalogue/profile and both bundles.');
