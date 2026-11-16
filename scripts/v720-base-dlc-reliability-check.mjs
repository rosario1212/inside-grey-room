// v720 regression: recover every already-created room without inventing a new token.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

for(const file of ['app-v11.js','live-cell-v12-44.js'])
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
const app=readFileSync('app-v11.js','utf8');
const live=readFileSync('live-cell-v12-44.js','utf8');
function part(src,start,end){
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert(a>=0&&b>a,'Missing critical function boundary: '+start);
  return src.slice(a,b);
}
const sessions=[],alerts=[],screens=[],logs=[];
const state={selectedScenario:'001',room:null,token:null,view:'catalog',sync:null};
const outputs={app:{innerHTML:''},createPseudo:{value:'Alice'},joinPseudo:{value:'Bob'},joinCode:{value:'Q7XY9'}};
let nextSync=null;
const scope={
 STATE:state,
 byId:id=>outputs[id],shell:s=>s,h:s=>String(s).replaceAll('<','&lt;'),
 primeNarrationFromGesture:()=>{},wakeAudioFromGesture:async()=>{},
 scenario:id=>({id}),newCode:()=> 'J8XYZ',
 rpc:async(name,args)=>name==='igr_v4_create_room'
   ?{room_code:args.p_code,player_token:'create-secret',host_token:'host-secret',player_id:'player-1'}
   :name==='igr_v4_join_room'
     ?{room_code:args.p_code,player_token:'join-secret',player_id:'player-2'}
     :true,
 STORAGE:{setItem:()=>{}},saveProfileData:()=>{},saveSession:()=>sessions.push({...state}),
 startRoomWatcher:()=>{},syncNow:async()=>nextSync,renderLobby:d=>screens.push(d),
 pushProfileAvatar:async()=>{},pushProfileCosmetics:async()=>{},
 toast:s=>alerts.push(s),console
};
vm.runInNewContext(part(app,'function pendingRoomSyncPanel(){','function syncSignature('),scope);
await scope.createRoom();
assert.equal(state.room,'J8XYZ');assert.equal(state.token,'create-secret');
assert.equal(sessions.length,1);
assert.match(outputs.app.innerHTML,/Réessayer la synchronisation/);
assert.doesNotMatch(outputs.app.innerHTML,/create-secret|host-secret/);
assert.equal(alerts.length,0,'Committed creation must not report an invalid room');

nextSync={room:{status:'lobby'},player:{id:'player-1'}};
await scope.retryRoomSync();
assert.equal(state.room,'J8XYZ','Retry must preserve the original room code');

state.room=null;state.token=null;state.sync=null;state.selectedScenario='001';
outputs.app.innerHTML='';nextSync=null;
await scope.joinRoom();
assert.equal(state.room,'Q7XY9');assert.equal(state.token,'join-secret');
assert.equal(sessions.length,2);
assert.match(outputs.app.innerHTML,/Réessayer la synchronisation/);
assert.doesNotMatch(outputs.app.innerHTML,/join-secret/);
assert.equal(alerts.length,0,'Committed join must not look like a missing room');

let chosen='analyste',roleNotice='';
const self=[{preferred_role:chosen},{preferred_role:chosen}];
const roleCtx={
 ROLE:{queued:undefined,busy:false},meRows:()=>self,
 optimisticRole:role=>{for(const row of self)row.preferred_role=role;chosen=role;},
 commitRole:async()=>{throw Error('role already taken')},
 syncNow:async()=>null,toast:msg=>{roleNotice=msg},console,
 document:{documentElement:{dataset:{}}}
};
vm.runInNewContext(part(live,'  chooseLobbyRole = async function(role){','  document.addEventListener(\'click\','),roleCtx);
await roleCtx.chooseLobbyRole('suspect');
assert.equal(chosen,'analyste','Rejected role must roll back despite a failed sync');
assert.match(roleNotice,/Rôle non confirmé/);
assert.equal(roleCtx.ROLE.busy,false);
roleCtx.commitRole=async()=>true;
await roleCtx.chooseLobbyRole('enqueteur');
assert.equal(chosen,'enqueteur','Valid role confirmation should remain selected');

let startNotices=[];
const startContext={
 STATE:{hostToken:'host',room:'J8XYZ',sync:{room:{scenario_id:'001'},players:[{preferred_role:'suspect'}]}},
 rpc:async()=>{throw Error('Failed to fetch')},
 syncNow:async()=>({room:{status:'playing'}}),
 startRoomWatcher:()=>{},cancelBriefingVoice:()=>{},stopAmbient:()=>{},
 toast:msg=>startNotices.push(msg),console
};
vm.runInNewContext(part(app,'async function startGame(){','function cancelBriefingVoice(){'),startContext);
await startContext.startGame();
assert.equal(startNotices.length,0,'A successful authoritative start must not claim failure when the response was lost');

assert.match(app,/else if\(!fresh\)pendingRoomSyncPanel\(\)/);
assert.match(live,/confirmedAtStart=meRows\(\)\[0\]\?\.preferred_role/);
console.log('v720 OK: committed create/join recovery, credentials privacy, retry, role rollback, ambiguous host launch');
