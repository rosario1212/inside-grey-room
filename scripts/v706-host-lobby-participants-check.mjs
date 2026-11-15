// v706: host-only pre-game removal and reliable lobby departure (web + mobile).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const app=readFileSync('app-v11.js','utf8');
const migration=readFileSync('supabase/migrations/20261115204500_igr_v706_host_lobby_participant_controls.sql','utf8');
const qa=readFileSync('supabase/tests/igr_v706_host_lobby_controls_qa.sql','utf8');
execFileSync(process.execPath,['--check','app-v11.js'],{stdio:'pipe'});
function extract(start,end){
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'missing runtime: '+start);
 return app.slice(a,b);
}
for(const word of ['igr_v706_host_kick_lobby','igr_v706_lobby_session_status',
 'v706: lock the room before the player','v700 departure role reconciliation',
 'role_reservations_released','cannot exclude after the game starts','host_token=p_host_token',
 'REVOKE ALL ON FUNCTION public.igr_v706_host_kick_lobby']){
 assert(migration.includes(word),'server contract missing: '+word);
}
for(const word of ['security breach: wrong host token','security breach: host kicked self',
 'security breach: host kicked during play','kicked token still active',
 'v700 role reconciliation failed after kick','voluntary lobby leave failed']){
 assert(qa.includes(word),'server QA missing: '+word);
}
assert(app.includes('onclick="kickLobbyPlayer('),'host kick must be present in lobby UI');
assert(app.includes('STATE.hostToken&&!p.is_host'),'a host may not remove themselves');
assert(app.includes("await rpc('igr_v4_leave_room'"),'lobby exit must call backend before local clear');
assert(app.includes("await rpc('igr_v706_lobby_session_status'"),'revoked player recovery is required');

const notifications=[],requests=[];
const host={id:'host',is_host:true,pseudo:'Organisateur'};
const guest={id:'guest',is_host:false,pseudo:'Joueur'};
const baseState=(hosting=false,phase='lobby')=>({
 room:'K706A',token:'player-token',hostToken:hosting?'secret-host-token':null,
 view:phase==='lobby'?'lobby':'game',selectedScenario:'032',
 sync:{room:{status:phase},players:[host,guest]},
 syncBusy:false,syncFailures:0
});
function setup(hosting=false,phase='lobby'){
 const state=baseState(hosting,phase);let accept=true,networkFail=false,serverResult=null;
 const ctx={
  STATE:state,console:{warn(){},error(){}},VIDEO:{lastSignalId:1,poller:null,localStream:null},
  AVATARS:{map:new Map(),sig:'unchanged'},stopRoomWatcher(){},clearSession(){},
  connectionStatus(){},cancelBriefingVoice(){},closeAllPeers(){},renderHome(){},
  appConfirm:async()=>accept,syncNow:async()=>{},
  toast:(t)=>notifications.push(String(t)),
  rpc:async(name,args)=>{
   requests.push({name,args});
   if(networkFail)throw Error('network failure');
   if(name==='igr_v706_host_kick_lobby')return{ok:true,remaining:1};
   if(name==='igr_v4_leave_room')return serverResult??{ok:true,left:true};
   if(name==='igr_v706_lobby_session_status')return{active:false};
   throw Error('unexpected rpc '+name);
  },
  console:{warn(){},error(){}}
 };
 vm.createContext(ctx);
 vm.runInContext(extract('let LOBBY_KICK_BUSY=false;','async function chooseLobbyRole(role){'),ctx);
 vm.runInContext(extract('function leaveRoomLocal(){','function initAudio(){'),ctx);
 return {ctx,state,setAccepted:x=>accept=x,setNetworkFail:x=>networkFail=x,setServerResult:x=>serverResult=x};
}
const r0=requests.length;
const guestExit=setup(false);
await guestExit.ctx.leaveRoom();
assert.equal(guestExit.state.room,null,'guest should leave locally only after server confirmed');
assert.equal(requests.at(-1).name,'igr_v4_leave_room','guest must free backend seat');
assert.equal(requests.at(-1).args.p_player_token,'player-token');

const hostCancel=setup(true);hostCancel.setAccepted(false);
const beforeCancel=requests.length;await hostCancel.ctx.leaveRoom();
assert.equal(requests.length,beforeCancel,'cancelled host closure may not call the backend');
assert.equal(hostCancel.state.room,'K706A');

const hostExit=setup(true);await hostExit.ctx.leaveRoom();
assert.equal(hostExit.state.room,null,'confirmed host exit must close their local room');
assert.equal(requests.at(-1).name,'igr_v4_leave_room');

const flaky=setup(false);flaky.setNetworkFail(true);
await flaky.ctx.leaveRoom();
assert.equal(flaky.state.room,'K706A','network error must keep the saved seat token');
assert.equal(flaky.state.token,'player-token');

const alreadyStarted=setup(false);alreadyStarted.setServerResult({ok:false,reason:'game_started'});
await alreadyStarted.ctx.leaveRoom();
assert.equal(alreadyStarted.state.room,'K706A','a lobby leave race must not silently abandon a game');

const playing=setup(false,'playing');
const beforePlay=requests.length;await playing.ctx.leaveRoom();
assert.equal(playing.state.room,null,'local exit from active game should still work');
assert.equal(requests.length,beforePlay,'in-game exit must not remove a canonical player');

const kicker=setup(true);
await kicker.ctx.kickLobbyPlayer('guest');
assert.equal(requests.at(-1).name,'igr_v706_host_kick_lobby');
assert.equal(requests.at(-1).args.p_player_id,'guest');
assert.equal(kicker.state.room,'K706A','host must remain in the same lobby');
const beforeSelf=requests.length;
await kicker.ctx.kickLobbyPlayer('host');
assert.equal(requests.length,beforeSelf,'host must not be able to kick themselves');
const kickedCancel=setup(true);kickedCancel.setAccepted(false);
await kickedCancel.ctx.kickLobbyPlayer('guest');
assert.equal(requests.length,beforeSelf,'cancelled kick is a no-op');
const unauthorized=setup(false);
await unauthorized.ctx.kickLobbyPlayer('guest');
assert.equal(requests.length,beforeSelf,'guests must not call host kick RPC');

// The client confirms server revocation before treating a failed sync as a kick.
const kicked=setup(false);
kicked.ctx.rpc=async(name,args)=>{
 requests.push({name,args});
 if(name==='igr_v4_sync')throw new Error('unauthorized');
 if(name==='igr_v706_lobby_session_status')return{active:false};
 throw Error('unexpected rpc '+name);
};
kicked.ctx.manageVideoState=()=>{};
kicked.ctx.saveSession=()=>{};
kicked.ctx.syncSignature=()=>null;
kicked.ctx.refreshAvatars=async()=>{};
vm.runInContext(extract('async function performSync(force=false){','function routeFromServer(){'),kicked.ctx);
await kicked.ctx.performSync(true);
assert.equal(kicked.state.room,null,'removed player is returned to home after verification');
assert(notifications.some(x=>x.includes('retirée par l’hôte')),'removed player must receive clear feedback');

const offline=setup(false);
let checks=0;offline.ctx.rpc=async(name)=>{
 if(name==='igr_v706_lobby_session_status')checks++;
 throw new Error('Failed to fetch');
};
offline.ctx.connectionStatus=()=>{};
vm.runInContext(extract('async function performSync(force=false){','function routeFromServer(){'),offline.ctx);
await offline.ctx.performSync(true);
assert.equal(offline.state.room,'K706A','temporary connectivity loss may not eject a player');
assert.equal(checks,0,'no revocation status needed for a network error');
console.log('PASS v706 lobby: authenticated host removal, safe local exits, network retries, revoked-session recovery and live-game safeguards.');
