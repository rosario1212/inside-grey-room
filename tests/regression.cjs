const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let timers=[],stopped=0;
function element(){return {innerHTML:'',textContent:'',value:'',inert:false,isConnected:true,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},focus(){},remove(){},closest(){return null}}}
const els=new Map(['app','toast','introGate','introEnterBtn','introHint'].map(k=>[k,element()]));
const document={activeElement:null,visibilityState:'visible',body:element(),documentElement:element(),getElementById:k=>els.get(k)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>element(),addEventListener(){}};
const localStorage={getItem(){return null},setItem(){throw new Error('QuotaExceededError')},removeItem(){}};
const c={console,document,localStorage,navigator:{mediaDevices:{addEventListener(){}}},performance,AbortController,Intl,Date,Math,JSON,Map,Set,Promise,Error,Uint8Array,URL,setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){},setInterval(){return 1},clearInterval(){},requestAnimationFrame:f=>f(),addEventListener(){},scrollTo(){},innerHeight:844,scrollY:0};c.window=c;
vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'app-v11.js'),'utf8').replace(/setupKeyboardGuard\(\);restore\(\)\.then\([^\n]+\n/,''),c);
const run=s=>vm.runInContext(s,c);let checks=0;
function check(s){assert.equal(run(s),true,s);checks++}
(async()=>{
check("VERSION==='v11-17-hardened'");
check("SCENARIOS.length===20 && new Set(SCENARIOS.map(s=>s.id)).size===20");
check("SCENARIOS.every(s=>[s.min,s.max].every(n=>lobbyRoleSlots(s,n).length===n))");
check("roleCapacityMap(scenario('001'),1).suspect===3");
check("roleCapacityMap(scenario('020'),16).temoin===2");
check("(STORAGE.setItem('k','v'),STORAGE.getItem('k')==='v')");
check("(STORAGE.removeItem('k'),STORAGE.getItem('k')===null)");
check("safeAvatar('x\" onerror=\"alert(1)')===''");
check("safeAvatar('https://third-party.test/tracker')===''");
check("safeAvatar('data:image/jpeg;base64,YQ==')!==''");
check("h('<script>\"&')==='&lt;script&gt;&quot;&amp;'");
check("(STATE.sync={room:{phase:'x',phase_ends_at:'invalid'}},phaseSeconds()===null)");
check("(STATE.sync={room:{phase:'x',state:{timer_paused:true,timer_paused_phase:'x',timer_remaining_seconds:72}}},phaseSeconds()===72)");
check("(STATE.sync={room:{phase:'x',state:{timer_paused:true,timer_paused_phase:'y'}}},timerIsPaused()===false)");
check("(STATE.serverOffset=60000,STATE.sync={room:{phase:'x',state:{},phase_ends_at:new Date(Date.now()+90000).toISOString()}},phaseSeconds()===30)");
check("fmtSeconds(72)==='01:12' && fmtSeconds(null)==='—'");
check("(STATE.sync=null,STATE.room='ABCDE',STATE.token='token',saveSession(),STATE.room=null,saveSession(),JSON.parse(STORAGE.getItem(sessionKey())).room==='ABCDE')");
run("SOUND.enabled=false;renderHome();renderCreateList();STATE.selectedScenario='009';renderCreateConfirm();renderJoin();renderRules();renderProfile();");checks+=6;
// Exercise every role and every game phase using explicit server contract fixtures.
run(`
const phases=['role_reading','initial_debrief','interrogation_select','interrogation','cycle_debrief','annex_inspecteur','annex_procureur','annex_juge','annex_temoin','annex_journaliste','annex_expert','trame','provisional_orals','provisional_lock','defense','final_debrief','locking','reveal'];
for(const role of Object.keys(ROLE_INFO))for(const phase of phases){
 STATE.sync={room:{code:'ABCDE',scenario_id:'020',status:phase==='reveal'?'finished':'playing',phase,cycle:1,state:{},min_players:13,max_players:16},player:{id:'p1',pseudo:'Joueur',public_role:role,private_state:{}},players:[{id:'p1',pseudo:'Joueur',public_role:role},{id:'p2',pseudo:'Autre',public_role:'suspect'}],suspects:[{id:'p2',pseudo:'Autre'}],scenario:{news:[],protected:[],field_actions:[],expert_actions:[],truth:{summary:'Fin'}},events:[],my_actions:[],pending_requests:[]};
 STATE.room='ABCDE';STATE.playerId='p1';STATE.role=role;
 for(const tab of gameTabs()){STATE.tab=tab.id;renderGameTab()}
}
`);checks+=11*18;
// Camera shutdown succeeds locally even if the network rejects the update.
c.stopped=0;run("VIDEO.localStream={getTracks:()=>[{stop(){stopped++}},{stop(){stopped++}}]};rpc=async()=>{throw new Error('offline')};");await run('stopVideo()');check('stopped===2 && VIDEO.localStream===null');
// Permissions must not be repeatedly requested after a refusal.
c.calls=0;run("navigator.mediaDevices.getUserMedia=async()=>{calls++;const e=new Error('denied');e.name='NotAllowedError';throw e}");await assert.rejects(run('ensureLocalVideo()'));check('calls===1');
// A legitimate unavailable rear camera may fall back once.
c.calls=0;run("navigator.mediaDevices.getUserMedia=async()=>{calls++;if(calls===1){const e=new Error('camera');e.name='OverconstrainedError';throw e}return {getVideoTracks:()=>[{readyState:'live'}],getTracks:()=>[]}}");await run('ensureLocalVideo()');check('calls===2');
// Late responses from a departed room must not restore its state.
run("STATE.sync=null;STATE.syncBusy=false;STATE.syncPromise=null;STATE.room='ABCDE';STATE.token='old';rpc=()=>new Promise(r=>window.resolveSync=r)");const pending=run('syncNow()');run("STATE.room=null;STATE.token=null;resolveSync({room:{},player:{}})");assert.equal(await pending,null);check('STATE.sync===null');
// Duplicate mutations make only one call while awaiting a response.
run("STATE.room='ABCDE';STATE.token='x';rpc=()=>{window.mutations=(window.mutations||0)+1;return new Promise(r=>window.finishMutation=r)};syncNow=async()=>null");const first=run("chooseLobbyRole('suspect')");await run("chooseLobbyRole('suspect')");check('mutations===1');run('finishMutation({})');await first;
// Client references resolve to files in the complete bundle.
const refs=run("[HOME_ART,SCENARIO_COVER_ART,...Object.values(SCENARIO_POSTERS),...Object.values(SCENARIO_THUMBS)]");for(const ref of refs){assert.ok(fs.existsSync(path.join(root,ref.split('?')[0])),ref);checks++}
console.log(JSON.stringify({status:'PASS',checks,rolePhaseCombinations:198,scenarios:20,scope:'Node VM: logic and HTML generation only; no browser layout/media verification'}));
})().catch(e=>{console.error(e);process.exitCode=1});
