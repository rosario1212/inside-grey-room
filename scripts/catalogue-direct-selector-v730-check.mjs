// v731 regression: direct collection buttons; no hidden "Filtres" dependency.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const source=read('dlc-suite-v12-37.js');
const app=read('app-v11.js');
const css=read('catalogue-navigation-v731.css');
const originalCss=read('catalog-descriptions-v1.css');
const html=read('index.html');
const sw=read('service-worker.js');
const build=read('scripts/build-web.mjs');

const start=source.indexOf('  const CATALOG_FILTER_OPTIONS = Object.freeze([');
const end=source.indexOf('  function updateBodyTheme()',start);
assert(start>=0&&end>start,'Direct collection navigation was not found');
const code=source.slice(start,end);
assert(!code.includes('nav.onchange='),'Old native-select navigation returned');
assert(!code.includes('igr-filter-chip'),'Legacy filter chips returned');
assert(code.includes('igr-collection-choices'),'Direct buttons missing');
assert(code.includes("head.insertAdjacentElement('afterend',nav)"),'Picker not anchored visibly after heading');

const store=new Map();
const sessionStorage={
  getItem:k=>store.get(k)??null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};
const makeStyle=()=>({
 display:'',priority:'',
 removeProperty(){this.display='';this.priority=''},
 setProperty(k,v,p){assert.equal(k,'display');this.display=v;this.priority=p}
});
const meta={};
for(let i=1;i<=20;i++)meta[String(i).padStart(3,'0')]={origin:'base',collection:i<=8?'original':'second'};
for(const [family,lo,hi] of [['omerta',21,25],['terror',26,28],['cartel',29,31],['regime',32,34]])
 for(let i=lo;i<=hi;i++)meta[String(i).padStart(3,'0')]={origin:'dlc',collection:family};
const cards=Object.keys(meta).map(id=>({dataset:{igrScenarioId:id},hidden:false,style:makeStyle()}));
const panels=['omerta','terror','cartel','regime'].map(key=>({dataset:{collection:key},hidden:false,style:makeStyle()}));
const base={hidden:false,style:makeStyle()};
const count={textContent:''};
const buttons=[];
const choices={addEventListener:(type,listener)=>{assert.equal(type,'click');choices.click=listener}};
let nav=null,scrollCount=0;
function newNav(){
 return {
   className:'',innerHTML:'',parentElement:null,attributes:{},
   setAttribute(k,v){this.attributes[k]=v},
   contains:btn=>buttons.includes(btn),
   querySelector(sel){
     if(sel==='.igr-collection-choices')return this.innerHTML.includes('igr-collection-choices')?choices:null;
     if(sel==='.igr-catalog-count')return count;
     return null;
   },
   querySelectorAll(sel){
     if(sel==='.igr-collection-choice')return buttons;
     return [];
   }
 };
}
const head={
 nextElementSibling:null,
 insertAdjacentElement(position,element){
   assert.equal(position,'afterend');
   head.nextElementSibling=element;
   element.parentElement=root;
   nav=element;
 }
};
const document={createElement:tag=>{assert.equal(tag,'nav');return newNav()}};
const root={
 dataset:{},
 getBoundingClientRect:()=>({top:-620}),
 prepend:element=>{nav=element;element.parentElement=root},
 querySelector(sel){
   if(sel==='.igr-scenario-filters')return nav;
   if(sel==='.page-head')return head;
   if(sel==='.scenario-panel-v10-13')return base;
   return null;
 },
 querySelectorAll(sel){
   if(sel==='[data-igr-scenario-id]')return cards;
   if(sel==='section[data-collection]')return panels;
   return [];
 }
};
const window={IGR_LOCALE:'fr',scrollY:720,scrollTo:()=>{scrollCount++}};
const scope={window,document,sessionStorage,META:meta,markExistingCards:()=>{},
 FILTER_KEY:'igr_scenario_filter_v1237',DLC_FILTER_KEY:'igr_dlc_filter_v1237'};
vm.createContext(scope);
const api=vm.runInContext(code+'\n;({CATALOG_FILTER_OPTIONS,readFilter,ensureFilters,applyFilters,scenarioVisible})',scope);
assert.deepEqual(Array.from(api.CATALOG_FILTER_OPTIONS,o=>o[0]),['base','omerta','terror','cartel','regime']);

api.ensureFilters(root);
assert.equal(head.nextElementSibling,nav,'Navigation is not directly beneath the heading');
assert.equal((nav.innerHTML.match(/data-family="/g)||[]).length,5,'Exactly five choice buttons required');
assert(!nav.innerHTML.includes('<select'),'System native picker must not appear');
for(const option of api.CATALOG_FILTER_OPTIONS){
 const family=option[0];
 const button={
  dataset:{family},attributes:{},
  classList:{state:new Set(),toggle(key,on){if(on)this.state.add(key);else this.state.delete(key)}},
  setAttribute(key,value){this.attributes[key]=value},
  closest:()=>button
 };
 buttons.push(button);
}
const ids=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>String(lo+i).padStart(3,'0'));
function verify(family,expected){
 api.ensureFilters(root);api.applyFilters(root);
 assert.equal(api.readFilter(),family,'Wrong selected family');
 assert.equal(root.dataset.igrCatalogFamily,family);
 assert.deepEqual(cards.filter(c=>!c.hidden).map(c=>c.dataset.igrScenarioId),expected);
 assert.equal(base.hidden,family!=='base');
 assert.deepEqual(panels.filter(s=>!s.hidden).map(s=>s.dataset.collection),family==='base'?[]:[family]);
 assert.equal(buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1,'Exactly one selected button');
 assert.equal(buttons.find(b=>b.attributes['aria-pressed']==='true').dataset.family,family);
 for(const hidden of cards.filter(c=>c.hidden))assert.equal(hidden.style.priority,'important');
}
function tap(family){
 const button=buttons.find(b=>b.dataset.family===family);
 assert(button,'Unknown collection '+family);
 choices.click({target:button});
}
verify('base',ids(1,20));
for(const [family,lo,hi] of [
 ['omerta',21,25],['terror',26,28],['cartel',29,31],['regime',32,34]
]){tap(family);verify(family,ids(lo,hi))}
tap('base');verify('base',ids(1,20));
assert.equal(scrollCount,5,'Collection switches should return to start of list');
tap('base');assert.equal(scrollCount,5,'Tapping current choice should not jump');
store.set('igr_scenario_filter_v1237','all');
assert.equal(api.readFilter(),'base','Legacy ALL must not show 34 dossiers');
store.set('igr_scenario_filter_v1237','dlc');
store.set('igr_dlc_filter_v1237','terror');
assert.equal(api.readFilter(),'terror','Previously selected DLC must be preserved');

for(const family of ['omerta','terror','cartel','regime'])
 assert(originalCss.includes('> .'+family+'-dlc-section{display:none!important}'),'Async gate missing: '+family);
assert(originalCss.includes('object-fit:contain!important'),'Poster crop regression');
assert(css.includes('catalogue-corridor-ink-v731.svg'),'Illustrated backdrop missing');
assert(css.includes('opacity:1!important;visibility:visible!important;pointer-events:auto!important'),'Collection choices hidden by legacy drawer');
assert(css.includes('overflow-x:clip!important'),'Horizontal scroll regression');
assert(css.includes('height:210px;top:37px'),'Background still too tall on mobile');
assert(css.includes('#igrUniversalDock'),'Catalogue dock rule missing');
assert(!css.includes('body:has(#app .page-create-v10-13) #igrDockFilters,'),
  'Direct catalogue must not hide Filtres / Accueil');
assert(css.includes('padding-bottom:14px!important'),'Catalog still has large empty bottom padding');
assert(css.includes('> .igr-beta-footer'),'Footer must be close to last dossier');
assert(css.includes('body.igr-scenario-browser:has(#app .page-create-v10-13) :is(#igrDockFilters,#igrDockHome)'),
  'Compact bottom buttons not restored');
const navTheme=read('navigation-theme-v18.js');
const navHeritage=read('navigation-heritage-v19.js');
assert(navTheme.includes("nav.scrollIntoView("),'Filters shortcut must jump to collection picker');
assert(navHeritage.includes('filters.hidden=!nav;'),'Filters button must be visible for direct collections');
assert(css.includes('background:#030405!important'),'Deep black catalogue missing');
assert(css.includes('grid-auto-rows:var(--igr-omerta-card-height)!important'),'All collections must use Omerta-format card rows');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'Desktop needs two balanced columns');
const navJs=read('navigation-heritage-v19.js');
assert(navJs.includes("},430);"),'Dock must restore full size when scrolling becomes idle');
assert(css.includes('--igr-omerta-art-width:clamp(120px,37vw,159px)'),'Omerta reference poster column missing');
for(const id of ['001','002','003','004','005','006','007','008'])
  assert(css.includes('#scenario-'+id),'Missing safe art treatment for classic '+id);
for(const family of ['terror','cartel','regime'])
  assert(css.includes('.'+family+'-scenario'),'Missing safe framing for '+family);
assert(css.includes('background-image:var(--igr-cover-url)!important'),'Missing image-derived ambient edge fill');
assert(css.includes('#scenario-008,#scenario-018,'),'Dossier 018 poster must preserve its full typography');
assert(css.includes('object-fit:var(--igr-poster-fit,cover)!important'),'Omerta card fit must remain variable by art sensitivity');
assert(css.includes('body.igr-scenario-browser.igr-catalogue-scrolled:has(#app .page-create-v10-13)'),
  'Compact on-scroll dock rule missing');
const navigator=read('navigation-heritage-v19.js');
assert(navigator.includes('function updateCatalogueScrollState()'),'No persistent scroll tracking');
assert(navigator.includes('goToVisibleCollections();'),'Filters click no longer returns to collections');
assert(navigator.includes("event.stopImmediatePropagation()"),'Legacy drag handler may suppress Filters');
for(const [klass,accent] of [
 ['omerta-scenario','#230e14'],['terror-scenario','#1b1b1d'],
 ['cartel-scenario','#271b0c'],['regime-scenario','#15222d']
])assert(css.includes(klass)&&css.includes(accent),'Lost DLC-specific card tint '+klass);
assert(css.includes('> section.panel.cartel-dlc-section')&&css.includes('rgba(194,149,71,.52)'),'Cartel gold panel is missing');
assert(css.includes('> section.panel.omerta-dlc-section')&&css.includes('rgba(173,43,53,.46)'),'Omerta red panel is missing');
assert(css.includes('--igr-poster-fit:contain;'),'Sensitive posters must preserve their entire artwork');
assert(css.includes('max-height:100%!important'),'Classics must fill the same Omerta artwork frame without old 228px cap');
assert(css.includes('var(--igr-card-art-ratio)'),'DLC native poster ratio configuration lost');
assert(app.includes('SCENARIOS.filter(sc=>Number(sc.id)>=1&&Number(sc.id)<=20).map(sc=>'),'Base 20-card scroll changed');
assert(source.includes('scenarioCardTeaser(sc.short,30)'),'DLC teaser contract changed');
assert(html.includes('catalogue-navigation-v731.css?v=v740-protect-poster-018-20261116'),'New stylesheet not linked');
assert(html.includes('dlc-suite-v12-37.js?v=v731-direct-collections-20261116'),'New picker JS not versioned');
assert(sw.includes('/catalogue-navigation-v731.css?v=v740-protect-poster-018-20261116'),'PWA stylesheet not versioned');
assert(sw.includes('/dlc-suite-v12-37.js?v=v731-direct-collections-20261116'),'PWA script not versioned');
assert(build.includes("'catalogue-navigation-v731.css'"),'Production build fails to copy stylesheet');
console.log('PASS v731: Five visible direct collections, complete classic scroll, isolated DLCs, monochrome illustrated background.');
