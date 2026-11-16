// Test the actual v730 five-collection navigation contract in isolation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(path,'utf8');
const source=read('dlc-suite-v12-37.js'),app=read('app-v11.js');
const css=read('catalog-descriptions-v1.css');
const html=read('index.html'),sw=read('service-worker.js');

const start=source.indexOf('  const CATALOG_FILTER_OPTIONS = Object.freeze([');
const end=source.indexOf('  function updateBodyTheme()',start);
assert(start>=0&&end>start,'The v730 native family navigation was not found');
const code=source.slice(start,end);
assert(!code.includes("['all','Tous les scénarios'"));
assert(!code.includes('igr-filter-chip'),'Legacy horizontal chip controls returned');

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
const base={hidden:false,style:makeStyle()};
const meta={};
for(let i=1;i<=20;i++)meta[String(i).padStart(3,'0')]={origin:'base',collection:i<=8?'original':'second'};
for(const [family,lo,hi] of [['omerta',21,25],['terror',26,28],['cartel',29,31],['regime',32,34]])
 for(let i=lo;i<=hi;i++)meta[String(i).padStart(3,'0')]={origin:'dlc',collection:family};
const cards=Object.keys(meta).map(id=>({dataset:{igrScenarioId:id},hidden:false,style:makeStyle()}));
const panels=['omerta','terror','cartel','regime'].map(key=>({dataset:{collection:key},hidden:false,style:makeStyle()}));
const picker={id:'igrCatalogFilter',value:'base'};
const count={textContent:''};
let nav=null,scrollCount=0;
const document={
 createElement:()=>({
  className:'',innerHTML:'',setAttribute(){},
  classList:{add(){}},
  querySelector(sel){
   if(sel==='#igrCatalogFilter')return this.innerHTML.includes('id="igrCatalogFilter"')?picker:null;
   if(sel==='.igr-catalog-count')return count;
   return null;
  }
 })
};
const root={
 dataset:{},
 getBoundingClientRect:()=>({top:-620}),
 insertBefore:(element)=>{nav=element},
 querySelector:sel=>{
  if(sel==='.igr-scenario-filters')return nav;
  if(sel==='.panel'||sel==='.scenario-panel-v10-13')return base;
  return null;
 },
 querySelectorAll:sel=>{
  if(sel==='[data-igr-scenario-id]')return cards;
  if(sel==='section[data-collection]')return panels;
  return [];
 }
};
const window={IGR_LOCALE:'fr',scrollY:720,scrollTo:()=>{scrollCount++}};
const scope={window,document,sessionStorage,META:meta,
 markExistingCards:()=>{},
 FILTER_KEY:'igr_scenario_filter_v1237',
 DLC_FILTER_KEY:'igr_dlc_filter_v1237'};
vm.createContext(scope);
const api=vm.runInContext(code+
 '\n;({CATALOG_FILTER_OPTIONS,readFilter,ensureFilters,applyFilters,scenarioVisible})',scope);

assert.deepEqual(Array.from(api.CATALOG_FILTER_OPTIONS,option=>option[0]),
 ['base','omerta','terror','cartel','regime']);
const ids=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>String(lo+i).padStart(3,'0'));
function verify(family,expected){
 api.ensureFilters(root);
 api.applyFilters(root);
 assert.equal(api.readFilter(),family,'Wrong selected family');
 assert.equal(root.dataset.igrCatalogFamily,family);
 assert.equal((nav.innerHTML.match(/<option value=/g)||[]).length,5);
 assert.equal(picker.value,family);
 assert.deepEqual(cards.filter(c=>!c.hidden).map(c=>c.dataset.igrScenarioId),expected);
 assert.equal(base.hidden,family!=='base');
 assert.deepEqual(panels.filter(s=>!s.hidden).map(s=>s.dataset.collection),
  family==='base'?[]:[family]);
 for(const hidden of cards.filter(c=>c.hidden))assert.equal(hidden.style.priority,'important');
}
verify('base',ids(1,20));
for(const [family,lo,hi] of [
 ['omerta',21,25],['terror',26,28],['cartel',29,31],['regime',32,34]
]){
 picker.value=family;nav.onchange({target:picker});
 verify(family,ids(lo,hi));
}
picker.value='base';nav.onchange({target:picker});verify('base',ids(1,20));
assert.equal(scrollCount,5,'Selecting a DLC must reset old deep-scroll positions');
store.set('igr_scenario_filter_v1237','all');
assert.equal(api.readFilter(),'base','Legacy ALL should not load the 34-card list');
store.set('igr_scenario_filter_v1237','dlc');
store.set('igr_dlc_filter_v1237','terror');
assert.equal(api.readFilter(),'terror','Preserve a previously chosen DLC');

// Async entitlement panels must be gated by the root's active collection.
for(const family of ['omerta','terror','cartel','regime'])
 assert(css.includes('> .'+family+'-dlc-section{display:none!important}'),
  'Missing asynchronous CSS gate for '+family);
assert(css.includes('> .scenario-panel-v10-13{display:none!important}'));
assert(css.includes('v730 — navigate five separate collections'));
assert(css.includes('object-fit:contain!important'));
assert(css.includes('aspect-ratio:var(--igr-card-art-ratio)!important'));
assert(css.includes('justify-content:center!important'));
assert(css.includes('--igr-card-art-ratio:3/4'));
assert(css.includes('--igr-card-art-ratio:724/960'));
assert(app.includes('SCENARIOS.filter(sc=>Number(sc.id)>=1&&Number(sc.id)<=20).map(sc=>'));
assert(source.includes('scenarioCardTeaser(sc.short,30)'),'DLC 30-word caps altered');
assert(html.includes('catalog-descriptions-v1.css?v=v730-direct-dlc-selector-poster-fit-20261116'));
assert(html.includes('dlc-suite-v12-37.js?v=v730-direct-dlc-selector-poster-fit-20261116'));
assert(sw.includes('/catalog-descriptions-v1.css?v=v730-direct-dlc-selector-poster-fit-20261116'));
assert(sw.includes('/dlc-suite-v12-37.js?v=v730-direct-dlc-selector-poster-fit-20261116'));
console.log('PASS v730: Base 20-scroll, four directly selectable DLCs, robust locked panels, full uncropped poster ratios.');
