import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the shipped sync functions with delayed RPCs and independent clients.
// No accounts, live rooms, browser, or network are needed for these regressions.
const target=process.argv[2]||'.';
const read=name=>readFile(new URL(`../${target==='.'?'':target+'/'}${name}`,import.meta.url),'utf8');
const app=await read('app-v11.js'),live=await read('live-cell-v12-44.js'),optimization=await read('runtime-optimization-v12.js');
const extract=(source,start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a);
  assert(a>=0&&b>a,`Missing shipped implementation: ${start}`);
  return source.slice(a,b);
};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const data=(phase='investigation')=>({room:{code:'CHECK',scenario_id:'001',status:'playing',phase,cycle:1,state:{}},player:{id:'one',pseudo:'QA',public_role:'suspect'},players:[],events:[]});
function client(){
  const requests=[],renders=[],timers=new Map(),listeners={};let timerId=0;
  const document={visibilityState:'visible',hidden:false,documentElement:{dataset:{}},getElementById:()=>null,querySelector:()=>null,addEventListener(name,fn){(listeners[name]??=[]).push(fn)}};
  const scope={STATE:{room:'CHECK',token:'token',sync:data(),syncSig:'',syncBusy:false,syncPromise:null,serverOffset:0},document,navigator:{onLine:true},URL,performance:{now:()=>0},console:{warn(){},error(){}},
    setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id},clearTimeout:id=>timers.delete(id),setInterval(){return++timerId},clearInterval(){},
    rpc(name){if(name==='igr_v4_realtime_token')return Promise.resolve('signal');const request=deferred();requests.push(request);return request.promise},
    syncSignature:d=>JSON.stringify(d),captureDrafts:()=>({}),restoreDrafts(){},connectionStatus(){},saveSession(){},refreshAvatars:async()=>{},markGameStarted(){},markGameCompleted(){},manageVideoState(){},maybeShowRoleNotice(){},routeFromServer(){renders.push(scope.STATE.sync.room.phase)},
    stopRoomWatcher(){},startRoomWatcher(){},leaveRoom(){scope.STATE.room=null;scope.STATE.token=null},chooseLobbyRole(){},startGame(){},toast(){},clearSession(){},SUPABASE_URL:'https://example.supabase.co',SUPABASE_KEY:'test',
  };
  scope.window=scope;scope.addEventListener=(name,fn)=>(listeners[name]??=[]).push(fn);
  class Socket{
    static OPEN=1;static CONNECTING=0;static sockets=[];
    constructor(){this.readyState=0;this.listeners={};this.sent=[];Socket.sockets.push(this)}
    addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
    emit(name,event={}){for(const fn of this.listeners[name]||[])fn(event)}
    send(raw){this.sent.push(JSON.parse(raw))}
    close(){this.readyState=3;this.emit('close')}
    open(){this.readyState=1;this.emit('open');const join=this.sent.find(x=>x.event==='phx_join');this.message({topic:join.topic,event:'phx_reply',ref:join.ref,payload:{status:'ok',response:{}}});return this}
    message(value){this.emit('message',{data:JSON.stringify(value)})}
    update(revision){const topic=this.sent.find(x=>x.event==='phx_join').topic;this.message({topic,event:'postgres_changes',payload:{data:{type:'UPDATE',record:{signal_token:'signal',revision}}}})}
  }
  scope.WebSocket=Socket;vm.createContext(scope);
  vm.runInContext(extract(app,'async function syncNow(','function routeFromServer('),scope);
  const runTimer=async(max=20,min=0)=>{for(const [id,t] of timers){if(t.delay>=min&&t.delay<=max){timers.delete(id);t.fn();await flush();return true}}return false};
  return{scope,requests,renders,timers,listeners,Socket,runTimer,loadLive:()=>{vm.runInContext(optimization,scope);vm.runInContext(live,scope)}};
}

const checks=[];
async function check(name,fn){try{await fn();checks.push(name);console.log('PASS '+name)}catch(error){console.error('FAIL '+name);throw error}}

await check('events received during a pending fetch require a fresh snapshot',async()=>{
  const c=client(),first=c.scope.syncNow(false);await flush();
  const event=c.scope.syncNow(false,true);await flush();assert.equal(c.requests.length,1);
  c.requests[0].resolve(data('old-phase'));await flush();
  assert.equal(c.requests.length,2,'An in-flight snapshot cannot satisfy a later invalidation');
  c.requests[1].resolve(data('new-phase'));await Promise.all([first,event]);
  assert.equal(c.scope.STATE.sync.room.phase,'new-phase');
});
await check('simultaneous forced refreshes coalesce into one follow-up',async()=>{
  const c=client(),pending=c.scope.syncNow(false);await flush();
  const calls=Array.from({length:6},()=>c.scope.syncNow(true));
  c.requests[0].resolve(data());await flush();assert.equal(c.requests.length,2);
  c.requests[1].resolve(data('next'));await Promise.all([pending,...calls]);
  assert.equal(c.requests.length,2);assert.equal(c.scope.STATE.syncBusy,false);assert.equal(c.scope.STATE.syncPromise,null);
});
await check('cosmetic avatar fetches do not delay phase rendering or the next sync',async()=>{
  const c=client(),avatar=deferred();c.scope.refreshAvatars=()=>avatar.promise;
  let done=false;const pending=c.scope.syncNow(false).then(()=>{done=true});
  c.requests[0].resolve(data('next'));await flush();
  assert.deepEqual(c.renders,['next']);assert(done,'Gameplay synchronization must finish even if avatars stall');
  avatar.resolve(false);await pending;
});
await check('old room responses cannot repaint a different session',async()=>{
  const c=client(),pending=c.scope.syncNow(false);await flush();
  c.scope.STATE.room='OTHER';c.scope.STATE.token='other-token';const next=c.scope.syncNow(false);c.requests[0].resolve(data('old'));await flush();
  assert.equal(c.renders.length,0);assert.equal(c.requests.length,2);
  const other=data('other');other.room.code='OTHER';c.requests[1].resolve(other);await Promise.all([pending,next]);assert.deepEqual(c.renders,['other']);
});
await check('all clients catch up when one already has a request in flight',async()=>{
  const clients=Array.from({length:3},()=>client());
  for(const c of clients){c.loadLive();await flush();c.Socket.sockets[0].open();await c.runTimer();assert.equal(c.requests.length,1)}
  for(const c of clients)c.Socket.sockets[0].update(2);
  for(const [i,c] of clients.entries()){c.requests[0].resolve(data(i===1?'old':'next'));await flush();await c.runTimer();if(c.requests[1]){c.requests[1].resolve(data('next'));await flush()}}
  for(const c of clients){assert.equal(c.scope.STATE.sync.room.phase,'next');assert.equal(c.scope.__IGR_REALTIME__.snapshot().syncedRevision,2)}
});
await check('failed RPC does not acknowledge a revision and is retried',async()=>{
  const c=client();c.loadLive();await flush();const ws=c.Socket.sockets[0].open();await c.runTimer();c.requests[0].resolve(data());await flush();
  ws.update(4);await c.runTimer();c.requests[1].reject(new Error('network'));await flush();
  assert.equal(c.scope.__IGR_REALTIME__.snapshot().syncedRevision,0);
  const retry=[...c.timers.values()].find(t=>t.delay>=500&&t.delay<=1000);assert(retry,'Failed snapshot must schedule a retry');
  await c.runTimer(1000,500);c.requests[2].resolve(data('recovered'));await flush();
  assert.equal(c.scope.__IGR_REALTIME__.snapshot().syncedRevision,4);
});
await check('messages from a superseded socket are ignored',async()=>{
  const c=client();c.loadLive();await flush();const old=c.Socket.sockets[0].open();await c.runTimer();c.requests[0].resolve(data());await flush();
  c.listeners.online.at(-1)();await flush();old.update(999);
  assert.notEqual(c.scope.__IGR_REALTIME__.snapshot().revision,999);
});
await check('fallback watchdog catches a missed notification within 2.5 seconds',async()=>{
  const c=client();c.loadLive();await flush();c.Socket.sockets[0].open();await c.runTimer();c.requests[0].resolve(data());await flush();
  assert([...c.timers.values()].some(t=>t.delay>=250&&t.delay<=2500),'Healthy sockets still need a bounded safety refresh');
  await c.runTimer(2500,250);c.requests[1].resolve(data('caught-up'));await flush();
  assert.equal(c.scope.STATE.sync.room.phase,'caught-up','A missed WebSocket event must still be recovered');
});
await check('clock-only updates are ignored while edits to existing events render',async()=>{
  const c=client();vm.runInContext(extract(app,'function syncSignature(','function draftScope('),c.scope);
  const a=data();a.server_now='2026-10-17T12:00:00Z';a.events=[{id:1,event_type:'phase',payload:{title:'Old'}}];
  const b=structuredClone(a);b.server_now='2026-10-17T12:00:01Z';assert.equal(c.scope.syncSignature(a),c.scope.syncSignature(b));
  b.events[0].payload.title='Updated';assert.notEqual(c.scope.syncSignature(a),c.scope.syncSignature(b));
});
await check('leaving and joining another room restores automatic reconnection',async()=>{
  const c=client();c.loadLive();await flush();c.Socket.sockets[0].open();await c.runTimer();c.requests[0].resolve(data());await flush();
  c.scope.stopRoomWatcher();c.scope.STATE.room='OTHER';c.scope.STATE.token='next-token';c.scope.startRoomWatcher();await flush();
  const ws=c.Socket.sockets.at(-1).open();ws.close();await flush();
  assert([...c.timers.values()].some(t=>t.delay>0&&t.delay<350),'A new session must reconnect after its socket closes');
});
await check('switching player identity in the same room replaces the subscription',async()=>{
  const c=client();c.loadLive();await flush();c.Socket.sockets[0].open();c.scope.STATE.token='replacement';
  c.scope.startRoomWatcher();await flush();assert.equal(c.Socket.sockets.length,2);
  assert.equal(c.scope.__IGR_REALTIME__.snapshot().syncedRevision,0);
});
await check('legacy foreground heartbeat yields to the realtime scheduler',async()=>{
  const c=client();c.scope.syncBusy=false;c.scope.decorateLobbyRole=()=>{};c.scope.removeInvestigationFocus=()=>{};c.scope.scanEvidenceNotifications=()=>{};
  const clean=await read('gameplay-clean-v12.js');vm.runInContext(extract(clean,'  async function cleanSync(','  setInterval('),c.scope);
  let reconciles=0;c.scope.__IGR_REALTIME__={reconcile:()=>reconciles++};
  await c.scope.cleanSync(false);assert.equal(c.requests.length,0);
  await c.scope.cleanSync(true);assert.equal(reconciles,1);
});
await check('stopping a watcher during a pending poll cannot resurrect it',async()=>{
  const c=client();c.loadLive();await flush();
  await c.runTimer(1000,500);assert.equal(c.requests.length,1);
  c.scope.stopRoomWatcher();c.requests[0].resolve(data());await flush();
  assert(![...c.timers.values()].some(t=>t.delay>=250),'Stopped polling must remain stopped after its HTTP response returns');
});
console.log(`Multiplayer synchronization: ${checks.length} behavioral checks passed (${target}).`);
