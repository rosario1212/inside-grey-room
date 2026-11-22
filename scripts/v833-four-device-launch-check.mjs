import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const app=read('app-v11.js'),sql=read('supabase/migrations/20261122193000_v833_four_device_launch.sql');
const workflow=read('.github/workflows/cloudflare-production-deploy.yml');
execFileSync(process.execPath,['--check','app-v11.js'],{stdio:'pipe'});
assert(sql.includes('JOIN public.igr_v4_players p ON p.room_code=r.code'),'Launch signal must verify the actual room member');
assert(sql.includes('AND p.player_token=p_player_token'),'Launch probe must require the member token');
assert(!/private_state|host_token|secret_role/.test(sql),'Probe must not expose private player information');
assert(sql.includes('REVOKE ALL ON FUNCTION')&&sql.includes('GRANT EXECUTE ON FUNCTION'),
 'Explicit least-privilege RPC grants required');
assert(workflow.includes('node scripts/v833-four-device-launch-check.mjs'),'Mandatory production launch regression absent');
assert(app.includes("if(STATE.view==='lobby'){\n  STATE.launchWatcher=setInterval"),'Launch signal polling must be active in every lobby');
assert(app.includes("signal?.status==='playing'")&&app.includes('syncNow(true,true)'),
 'Every phone must fetch an authoritative private snapshot on launch');
assert(app.includes("Le briefing se lancera automatiquement sur ton téléphone"),
 'Lobby must explain the automatic launch');
assert(app.includes("window.addEventListener('pageshow'")&&app.includes("window.addEventListener('focus'"),
 'Suspended iPhone/PWA clients must immediately resynchronize on return');
const start=app.indexOf('function stopRoomWatcher()');
const end=app.indexOf('function lobbyData()',start);
assert(start>0&&end>start,'Watcher source boundaries missing');
const source=app.slice(start,end);
const factory=new Function('STATE','document','navigator','clearInterval','setInterval','syncNow','rpc','hideIntroImmediately','console',
 source+'return {startRoomWatcher,stopRoomWatcher,probeLobbyLaunch};');
function phone(i,shared,{probeFailure=false,defer=false}={}){
 const STATE={room:'ABCDE',token:'opaque-'+i,view:'lobby',sync:{room:{status:'lobby',phase:null}},
  syncFailures:0,launchProbeWarned:false};
 const timers=new Map();let n=0,syncs=0,hides=0,probes=0;
 let unblock;
 const rpc=async(name,params)=>{
  assert.equal(name,'igr_v833_launch_probe');
  assert.equal(params.p_code,'ABCDE');
  assert.equal(params.p_player_token,'opaque-'+i);
  probes++;
  if(probeFailure)throw new Error('probe unavailable');
  if(defer)await new Promise(done=>unblock=done);
  return {status:shared.status,phase:shared.phase};
 };
 const syncNow=async()=>{
  syncs++;
  STATE.sync={room:{status:shared.status,phase:shared.phase}};
  STATE.view=shared.status==='playing'?'briefing':'lobby';
  return STATE.sync;
 };
 const api=factory(STATE,{visibilityState:'visible'},{onLine:true},
  handle=>timers.delete(handle),(fn,ms)=>{const id=++n;timers.set(id,{fn,ms});return id},
  syncNow,rpc,()=>hides++,{warn:()=>{}});
 return {STATE,api,timers,stats:()=>({syncs,hides,probes}),unblock:()=>unblock?.()};
}
// A four-device multiplayer lobby: one host and three guests, all independently
// notified by the same server state, each with their own opaque token.
const server={status:'lobby',phase:null};
const phones=Array.from({length:4},(_,i)=>phone(i,server));
phones.forEach(p=>p.api.startRoomWatcher());
await Promise.all(phones.map(p=>p.api.probeLobbyLaunch()));
for(const p of phones){
 assert([...p.timers.values()].some(t=>t.ms===450),'Launch polling must be faster than regular room polling');
 assert.equal(p.STATE.view,'lobby','Players stay in the lobby before host launch');
}
server.status='playing';server.phase='briefing';
await Promise.all(phones.map(p=>p.api.probeLobbyLaunch()));
for(const p of phones){
 assert.equal(p.STATE.view,'briefing','All four phones must enter briefing without pressing another button');
 assert.equal(p.STATE.sync.room.status,'playing');
 assert(p.stats().syncs>=1,'Private server snapshot missing on a handset');
 assert.equal(p.stats().hides,1,'The old door overlay must not remain over the game');
}
await Promise.all(phones.map(p=>p.api.probeLobbyLaunch()));
assert(phones.every(p=>p.stats().hides===1),'Starting a match must not repeat on subsequent polls');
phones.forEach(p=>p.api.stopRoomWatcher());
// A stale, delayed signal from a previous session can never launch a new room.
const previous={status:'playing',phase:'briefing'};
const stale=phone(5,previous,{defer:true});
const late=stale.api.probeLobbyLaunch();
stale.STATE.room='OTHER';stale.STATE.token='new-token';
stale.unblock();await late;
assert.equal(stale.stats().syncs,0,'Delayed signal must not route a different room');
assert.equal(stale.stats().hides,0,'Delayed signal must not close the new session entry');
// The full-state watcher remains a fallback when Realtime-like probe fails.
const fallback=phone(6,{status:'playing',phase:'briefing'},{probeFailure:true});
fallback.api.startRoomWatcher();
await fallback.api.probeLobbyLaunch();
for(const timer of fallback.timers.values())if(timer.ms===950)await timer.fn();
assert.equal(fallback.STATE.view,'briefing','Regular room synchronization must work without the launch probe');
fallback.api.stopRoomWatcher();
console.log('PASS v833: four independent phones auto-enter the shared server briefing; stale sessions ignored; full-sync fallback works.');
