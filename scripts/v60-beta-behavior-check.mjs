import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const target=process.argv[2]||'dist';
// Exercise the actual duration module through its observer, with mutation counting.
let observer, writes=0;const buttons=['short','long'].map(mode=>{let value='';const small={get textContent(){return value},set textContent(v){value=v;writes++}};return {dataset:{mode},querySelector:()=>small,classList:{toggle(){}},setAttribute(){}}});
const group={dataset:{durationFor:'014'},querySelectorAll:()=>buttons,classList:{contains:()=>true}};
const panel={querySelector:s=>s==='.lobby-code'?{}:group};
const STATE={hostToken:'host',view:'game',tab:'investigation',sync:{room:{code:'QA',scenario_id:'014',phase:'lobby',state:{duration_mode:'short',match_no:1}},player:{id:'one'},players:[]}};
const c={STATE,document:{documentElement:{lang:'fr'},querySelector:s=>s==='.lobby-v11'?panel:null,querySelectorAll:s=>s.startsWith('.igr-duration-v35[')?[group]:[],addEventListener(){},head:{appendChild(){}}},localStorage:{getItem:()=>null},MutationObserver:class{constructor(f){observer=f}observe(){}},queueMicrotask:f=>f(),setInterval(){},setTimeout(){},console};c.window=c;vm.createContext(c);
vm.runInContext(readFileSync('duration-modes-v35.js','utf8'),c);observer();assert.equal(writes,2);for(let i=0;i<120;i++)observer();assert.equal(writes,2,'stable lobby must not create more child-list mutations');
const app=readFileSync('app-v11.js','utf8');vm.runInContext(app.match(/function draftScope\(\)\{[^\n]+/)[0],c);const scope=c.draftScope();STATE.sync.room.state.match_no=2;assert.notEqual(c.draftScope(),scope);STATE.sync.room.state.match_no=1;STATE.sync.player.id='two';assert.notEqual(c.draftScope(),scope);STATE.sync.player.id='one';STATE.sync.room.code='NEW';assert.notEqual(c.draftScope(),scope);
// Concurrent consent calls share one dialog and both resolve on cancellation.
let dialogs=0;const t={SUPABASE_URL:'https://example.invalid',SUPABASE_KEY:'public',location:{hostname:'localhost',search:''},document:{head:{appendChild(){}},createElement:()=>({}),querySelector:()=>null,body:{insertAdjacentHTML(){dialogs++}}},STORAGE:{getItem:()=>null},setInterval(){},fetch:async()=>{},console};t.window=t;vm.createContext(t);vm.runInContext(readFileSync('playstore-ready-v12.js','utf8'),t);const first=t.igrRequireStoreTerms(),second=t.igrRequireStoreTerms();assert.equal(first,second);assert.equal(dialogs,1);t.igrCloseStoreTerms();assert.equal(await first,false);assert.equal(await second,false);const third=t.igrRequireStoreTerms();assert.notEqual(first,third);t.igrCloseStoreTerms();await third;
const html=readFileSync(target+'/index.html','utf8');for(const asset of ['app-v11.js','playstore-ready-v12.js','duration-modes-v35.js'])assert.ok(html.includes(asset+'?v=v60-mobile-beta'));assert.ok(html.includes('Bêta 12.11.0'));assert.ok(html.includes('prefers-reduced-motion'));
const manifest=JSON.parse(readFileSync('beta-release.json','utf8'));assert.equal(manifest.internalVersion,JSON.parse(readFileSync('package.json','utf8')).version);assert.equal(manifest.nativePaymentsEnabled,false);
console.log('v60 beta behavior OK: idempotent lobby over 120 refreshes, isolated drafts, shared consent, fresh assets and release metadata');
