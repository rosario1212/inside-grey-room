import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const app=await readFile('app-v11.js','utf8');
function isolate(begin,ctx){
 const a=app.indexOf(begin),b=app.indexOf('\n}\n',a+begin.length);
 assert(a>=0&&b>a,'missing function '+begin);
 const f=app.slice(a,b+2);
 vm.runInNewContext(f,ctx,{filename:'app-v11.js'});
 return ctx;
}
const flag={enabled:false,checkedAt:Date.now(),checking:false};
const scenarios=['006','007','008'].map(id=>({id,title:id,short:id,min:5,max:5}));
{
 const target={innerHTML:''};
 const c=isolate('function renderCreateList(){',{
  IGR007_PUBLISH:flag,STATE:{view:'create-list'},
  byId:()=>target,shell:x=>x,SCENARIOS:scenarios,
  scenarioThumbArt:id=>id,h:x=>x,playerCountLabel:()=> '5',
  scenarioDifficultyTag:()=>'',refresh007PublishState:()=>{}
 });
 c.renderCreateList();
 assert.match(target.innerHTML,/id="scenario-007"[^>]*aria-disabled="true"/);
 assert.match(target.innerHTML,/EN PRÉPARATION/);
 flag.enabled=true;
 c.renderCreateList();
 assert.match(target.innerHTML,/id="scenario-007"[^>]*onclick="selectScenario\('007'\)"/);
 assert.doesNotMatch(target.innerHTML,/EN PRÉPARATION/);
 flag.enabled=false;
}
{
 const state={view:'create-list',selectedScenario:'006'};
 const log=[];
 const c=isolate('function selectScenario(id){',{
  IGR007_PUBLISH:flag,STATE:state,
  window:{scrollY:0,scrollTo:()=>{}},toast:x=>log.push(x),
  saveSession:()=>{},renderCreateConfirm:()=>{}
 });
 c.selectScenario('007');
 assert.equal(state.selectedScenario,'006');
 flag.enabled=true;
 c.selectScenario('007');
 assert.equal(state.selectedScenario,'007');
 assert.equal(state.view,'create-confirm');
 flag.enabled=false;
}
{
 const calls=[];
 const c=isolate('async function createRoom(){',{
  STATE:{selectedScenario:'007'},
  byId:()=>({value:'QA'}),
  primeNarrationFromGesture:()=>{},
  wakeAudioFromGesture:async()=>{},
  scenario:id=>({id}),
  toast:()=>{},
  rpc:async name=>{calls.push(name);return false;},
  console
 });
 await c.createRoom();
 assert.deepEqual(calls,['igr_v291_007_catalog_enabled']);
}
{
 const calls=[];
 const c=isolate('async function startGame(){',{
  STATE:{hostToken:'x',sync:{room:{scenario_id:'007'},players:[]}},
  toast:()=>{},rpc:async name=>{calls.push(name);return false;},
  console
 });
 await c.startGame();
 assert.deepEqual(calls,['igr_v291_007_catalog_enabled']);
}
{
 const c=isolate('function compatibleNextScenarios(d){',{
  SCENARIOS:scenarios,IGR007_PUBLISH:flag
 });
 const room={players:Array(5).fill({}),room:{scenario_id:'006'}};
 assert.deepEqual(Array.from(c.compatibleNextScenarios(room),x=>x.id),['008']);
 flag.enabled=true;
 assert.deepEqual(Array.from(c.compatibleNextScenarios(room),x=>x.id),['007','008']);
}
console.log('007 client behavior: release discovery, fail-closed guards, and continuation PASS');
