/* Inside Grey Room — v36 Live Cell / Realtime Multiplayer
   Event-driven room synchronization, transaction-coalesced invalidation support,
   resilient reconnects, adaptive timer polling, optimistic role selection,
   explicit lobby departure and startup/intro recovery. */
(() => {
  'use strict';

  const V = 'v36-realtime-multiplayer';
  const OMERTA_IDS = new Set(['021','022','023','024','025']);
  const RT = {
    room:null, signalToken:null, ws:null, topic:null, ready:false, joining:false,
    ref:0, joinRef:null, heartbeatRef:null,
    heartbeat:null, joinWatchdog:null, reconnect:null, reconnectAttempt:0,
    pollTimer:null, syncTimer:null, syncDue:0, syncRunning:false, syncDirty:false,
    syncForce:false, revision:0, syncedRevision:0,
    lastMessageAt:0, serverEpoch:0, clientEpoch:0,
    closedByUs:false, generation:0
  };
  const ROLE = {busy:false, queued:undefined};
  let launchBusy = false;
  let introWatchdog = null;

  const roomScenario = () => String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || STATE?.selectedScenario || '');
  const inRoom = () => !!(STATE?.room && STATE?.token);
  const isOmerta = id => OMERTA_IDS.has(String(id || ''));
  const isOnline = () => navigator.onLine !== false;
  const isTerminalSessionError = error => /unauthorized|room not found|cellule introuvable|invalid player|player not found/i.test(String(error?.message || error || ''));
  const wsEndpoint = () => {
    try {
      const u = new URL(SUPABASE_URL);
      return `wss://${u.host}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_KEY)}&vsn=1.0.0`;
    } catch {
      return `wss://jtasbdiguhiswoyvobkn.supabase.co/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_KEY)}&vsn=1.0.0`;
    }
  };

  function setRealtimeState(state){
    try{document.documentElement.dataset.igrRealtime = state}catch{}
  }

  function clearTimer(name){
    if(RT[name]){
      clearTimeout(RT[name]);
      clearInterval(RT[name]);
      RT[name]=null;
    }
  }

  function recordServerClock(data){
    const parsed = Date.parse(data?.server_now || '');
    if(Number.isFinite(parsed)){
      RT.serverEpoch = parsed;
      RT.clientEpoch = Date.now();
    }
  }

  const coreSyncNow = typeof syncNow === 'function' ? syncNow : null;
  if(coreSyncNow){
    syncNow = async function(){
      const data = await coreSyncNow.apply(this,arguments);
      recordServerClock(data || STATE?.sync);
      return data;
    };
  }

  function estimatedServerNow(){
    if(RT.serverEpoch && RT.clientEpoch) return RT.serverEpoch + (Date.now()-RT.clientEpoch);
    return Date.now();
  }

  function clearSyncScheduler(){
    clearTimer('syncTimer');
    RT.syncDue=0;
    RT.syncDirty=false;
    RT.syncForce=false;
    RT.syncRunning=false;
  }

  function closeRealtime(reason='room-left', intentional=true){
    RT.closedByUs = intentional;
    RT.generation++;
    clearTimer('heartbeat');
    clearTimer('joinWatchdog');
    clearTimer('reconnect');
    clearSyncScheduler();
    const ws = RT.ws;
    RT.ws = null;
    RT.ready = false;
    RT.joining = false;
    RT.room = null;
    RT.signalToken = null;
    RT.topic = null;
    RT.joinRef = null;
    RT.heartbeatRef = null;
    RT.revision = 0;
    RT.syncedRevision = 0;
    if(ws){ try{ws.close(1000,String(reason).slice(0,120))}catch{} }
    setRealtimeState(inRoom() && !isOnline() ? 'offline' : 'off');
  }

  function sendRealtime(event, payload={}, ref=null, topic=null, joinRef=undefined){
    if(!RT.ws || RT.ws.readyState !== WebSocket.OPEN) return false;
    const msg = {
      topic: topic || RT.topic || 'phoenix',
      event,
      payload,
      ref: ref == null ? String(++RT.ref) : String(ref),
      join_ref: joinRef === undefined ? RT.joinRef : joinRef
    };
    try{RT.ws.send(JSON.stringify(msg));return true}catch{return false}
  }

  function runQueuedSync(){
    RT.syncTimer = null;
    RT.syncDue = 0;
    if(!inRoom() || RT.syncRunning || !RT.syncDirty) return;

    const force = RT.syncForce;
    const targetRevision = RT.revision;
    RT.syncDirty = false;
    RT.syncForce = false;
    RT.syncRunning = true;
    let failed = false;

    Promise.resolve()
      .then(() => syncNow(force))
      .then(data => {
        recordServerClock(data || STATE?.sync);
        if(targetRevision) RT.syncedRevision = Math.max(RT.syncedRevision,targetRevision);
      })
      .catch(error => {
        failed = true;
        if(isTerminalSessionError(error)){
          recoverStaleSession('Cette cellule n’est plus disponible.');
          return;
        }
        console.warn('live sync',error);
        RT.syncDirty = true;
      })
      .finally(() => {
        RT.syncRunning = false;
        if(!inRoom()) return;
        if(RT.syncDirty || RT.revision > RT.syncedRevision){
          syncSoon(failed ? 650 : 0,RT.syncForce,RT.revision);
        }
      });
  }

  function syncSoon(delay=0, force=false, revision=0){
    if(!inRoom()) return;
    const rev = Number(revision || 0);
    if(Number.isFinite(rev) && rev > RT.revision) RT.revision = rev;
    if(rev && rev <= RT.syncedRevision && !force) return;

    RT.syncDirty = true;
    RT.syncForce = RT.syncForce || !!force;
    if(RT.syncRunning) return;

    const due = performance.now() + Math.max(0,Number(delay)||0);
    if(RT.syncTimer && RT.syncDue && RT.syncDue <= due) return;
    clearTimer('syncTimer');
    RT.syncDue = due;
    RT.syncTimer = setTimeout(runQueuedSync,Math.max(0,due-performance.now()));
  }

  function failRealtime(reason='realtime-failed'){
    const ws = RT.ws;
    RT.ready=false;
    RT.joining=false;
    clearTimer('heartbeat');
    clearTimer('joinWatchdog');
    RT.ws=null;
    RT.heartbeatRef=null;
    setRealtimeState(isOnline()?'fallback':'offline');
    if(ws){
      RT.closedByUs=true;
      try{ws.close(4000,String(reason).slice(0,120))}catch{}
      RT.closedByUs=false;
    }
    scheduleReconnect();
  }

  function startHeartbeat(){
    clearTimer('heartbeat');
    RT.heartbeat = setInterval(() => {
      if(!RT.ws || RT.ws.readyState !== WebSocket.OPEN) return;
      if(RT.heartbeatRef && Date.now()-RT.lastMessageAt > 55000){
        failRealtime('heartbeat-timeout');
        return;
      }
      const ref = String(++RT.ref);
      RT.heartbeatRef = ref;
      sendRealtime('heartbeat',{},ref,'phoenix',null);
    },25000);
  }

  function scheduleReconnect(){
    if(!inRoom() || RT.closedByUs || !isOnline()) return;
    clearTimer('reconnect');
    const delays = [250,500,900,1600,2800,4500,6500];
    const base = delays[Math.min(RT.reconnectAttempt++,delays.length-1)];
    const delay = Math.round(base*(0.85+Math.random()*0.30));
    RT.reconnect = setTimeout(() => connectRealtime(true),delay);
  }

  function realtimeRevision(record){
    const value = Number(record?.revision || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function handleRealtimeMessage(event){
    let msg;
    try{msg=JSON.parse(event.data)}catch{return}
    if(!msg) return;
    RT.lastMessageAt = Date.now();

    if(msg.topic==='phoenix' && msg.event==='phx_reply'){
      if(RT.heartbeatRef && String(msg.ref)===String(RT.heartbeatRef)) RT.heartbeatRef=null;
      return;
    }
    if(msg.topic !== RT.topic) return;

    if(msg.event==='phx_reply' && String(msg.ref)===String(RT.joinRef)){
      clearTimer('joinWatchdog');
      const ok = msg.payload?.status === 'ok';
      RT.ready=!!ok;
      RT.joining=false;
      if(ok){
        RT.reconnectAttempt=0;
        RT.lastMessageAt=Date.now();
        setRealtimeState('live');
        startHeartbeat();
        syncSoon(0,false,RT.revision);
      }else{
        console.warn('Realtime join rejected',msg.payload);
        failRealtime('join-rejected');
      }
      return;
    }

    if(msg.event==='system'){
      const status = String(msg.payload?.status || '').toLowerCase();
      const extension = String(msg.payload?.extension || '').toLowerCase();
      if(extension==='postgres_changes' && status && status!=='ok'){
        console.warn('Realtime postgres_changes degraded',msg.payload);
        failRealtime('postgres-changes-degraded');
      }
      return;
    }

    if(msg.event==='postgres_changes'){
      const data = msg.payload?.data || msg.payload || {};
      const type = String(data.type || data.eventType || '').toUpperCase();
      const record = data.record || data.new || {};
      const oldRecord = data.old_record || data.old || {};
      const token = String(record.signal_token || oldRecord.signal_token || '');
      if(token && RT.signalToken && token!==RT.signalToken) return;
      if(type==='DELETE' || record.closed===true){
        remoteRoomClosed();
        return;
      }
      syncSoon(16,false,realtimeRevision(record));
      return;
    }

    if(msg.event==='phx_error' || msg.event==='phx_close'){
      failRealtime(msg.event);
    }
  }

  async function connectRealtime(force=false){
    if(!inRoom()) return closeRealtime('room-left',true);
    if(!isOnline()){
      setRealtimeState('offline');
      return;
    }

    const room = String(STATE.room || '').toUpperCase();
    const currentUsable = RT.room===room && (RT.ready || RT.joining || RT.ws?.readyState===WebSocket.CONNECTING);
    if(!force && currentUsable) return;

    const generation = ++RT.generation;
    const old = RT.ws;
    if(old){
      RT.closedByUs=true;
      try{old.close(1000,'rejoin')}catch{}
      RT.closedByUs=false;
    }
    clearTimer('heartbeat');
    clearTimer('joinWatchdog');
    clearTimer('reconnect');
    RT.ws=null;
    RT.ready=false;
    RT.joining=true;
    RT.room=room;
    setRealtimeState('connecting');

    let signalToken;
    try{
      signalToken = await rpc('igr_v4_realtime_token',{p_code:room,p_player_token:STATE.token});
    }catch(error){
      if(generation!==RT.generation) return;
      RT.joining=false;
      if(isTerminalSessionError(error)){
        recoverStaleSession('Cette cellule n’est plus disponible.');
        return;
      }
      console.warn('Realtime token unavailable',error);
      setRealtimeState('fallback');
      scheduleReconnect();
      return;
    }
    if(generation!==RT.generation || !signalToken || !inRoom() || String(STATE.room).toUpperCase()!==room) return;

    RT.signalToken=String(signalToken);
    RT.topic=`realtime:igr-room-${RT.signalToken}`;
    let ws;
    try{ws=new WebSocket(wsEndpoint())}catch(error){
      if(generation!==RT.generation) return;
      RT.joining=false;
      setRealtimeState('fallback');
      scheduleReconnect();
      return;
    }
    RT.ws=ws;

    ws.addEventListener('open',() => {
      if(generation!==RT.generation || RT.ws!==ws) return;
      RT.lastMessageAt=Date.now();
      RT.joinRef=String(++RT.ref);
      sendRealtime('phx_join',{
        config:{
          broadcast:{ack:false,self:false},
          presence:{enabled:false},
          postgres_changes:[{
            event:'*',schema:'public',table:'igr_v4_room_realtime',
            filter:`signal_token=eq.${RT.signalToken}`,
            select:['signal_token','revision','updated_at','closed']
          }],
          private:false
        }
      },RT.joinRef,RT.topic,RT.joinRef);
      clearTimer('joinWatchdog');
      RT.joinWatchdog=setTimeout(() => {
        if(generation===RT.generation && RT.ws===ws && !RT.ready) failRealtime('join-timeout');
      },6000);
    });
    ws.addEventListener('message',handleRealtimeMessage);
    ws.addEventListener('error',() => {
      if(generation!==RT.generation || RT.ws!==ws) return;
      setRealtimeState('fallback');
      setTimeout(() => {
        if(generation===RT.generation && RT.ws===ws && !RT.ready) failRealtime('socket-error');
      },700);
    });
    ws.addEventListener('close',() => {
      if(generation!==RT.generation || RT.ws!==ws) return;
      RT.ws=null;
      RT.ready=false;
      RT.joining=false;
      clearTimer('heartbeat');
      clearTimer('joinWatchdog');
      if(!RT.closedByUs && inRoom()){
        setRealtimeState(isOnline()?'fallback':'offline');
        scheduleReconnect();
      }
    });
  }

  const baseStopRoomWatcher = typeof stopRoomWatcher === 'function' ? stopRoomWatcher : null;
  try{baseStopRoomWatcher?.()}catch{}

  function clearAdaptivePoll(){
    if(RT.pollTimer){clearTimeout(RT.pollTimer);RT.pollTimer=null}
    try{
      if(STATE?.watcher){clearInterval(STATE.watcher);clearTimeout(STATE.watcher);STATE.watcher=null}
    }catch{}
  }

  function pollDelay(){
    const hidden = document.visibilityState==='hidden';
    const healthy = RT.ready && RT.ws?.readyState===WebSocket.OPEN;
    if(!healthy) return hidden ? 3000 : 900;
    if(hidden) return 30000;

    const room = STATE?.sync?.room;
    const end = Date.parse(room?.phase_ends_at || '');
    if(room?.status==='playing' && Number.isFinite(end)){
      const remaining = end-estimatedServerNow();
      if(remaining <= 300) return 350;
      if(remaining <= 2200) return Math.max(350,remaining+120);
      if(remaining <= 10000) return Math.min(2200,Math.max(700,remaining-700));
      return Math.min(12000,Math.max(2500,remaining-1500));
    }
    return 12000;
  }

  function schedulePoll(delay=pollDelay()){
    clearAdaptivePoll();
    if(!inRoom()) return;
    RT.pollTimer=setTimeout(async () => {
      RT.pollTimer=null;
      STATE.watcher=null;
      if(!inRoom()) return;
      try{
        const data=await syncNow(false);
        recordServerClock(data || STATE?.sync);
      }catch(error){
        if(isTerminalSessionError(error)){
          recoverStaleSession('Cette cellule n’est plus disponible.');
          return;
        }
      }
      if(inRoom()) schedulePoll();
    },Math.max(250,delay));
    STATE.watcher=RT.pollTimer;
  }

  stopRoomWatcher = function(){
    clearAdaptivePoll();
    closeRealtime('watcher-stopped',true);
  };

  startRoomWatcher = function(){
    clearAdaptivePoll();
    if(!inRoom()) return;
    connectRealtime(false);
    schedulePoll(RT.ready ? pollDelay() : 900);
  };

  function meRows(){
    const d=STATE?.sync;if(!d)return[];
    const id=String(d.player?.id || STATE.playerId || '');
    return [d.player,...(d.players||[]).filter(p=>String(p.id)===id)].filter(Boolean);
  }

  function optimisticRole(role){
    const value = !role || ['none','cancel','annuler'].includes(String(role).toLowerCase()) ? null : String(role);
    for(const row of meRows()) row.preferred_role=value;
    try{document.documentElement.dataset.igrRolePending='1';document.documentElement.dataset.igrCellAction='role'}catch{}
    try{renderLobby(STATE.sync)}catch{}
  }

  async function commitRole(role){
    const sid=roomScenario();
    const normalized=!role || ['none','cancel','annuler'].includes(String(role).toLowerCase()) ? 'none' : String(role);
    const rpcName=isOmerta(sid)?'igr_omerta_choose_role':'igr_v4_choose_role';
    return rpc(rpcName,{p_code:STATE.room,p_player_token:STATE.token,p_role:normalized});
  }

  chooseLobbyRole = async function(role){
    ROLE.queued=role;
    optimisticRole(role);
    if(ROLE.busy) return;
    ROLE.busy=true;
    let lastError=null;
    try{
      while(ROLE.queued!==undefined){
        const next=ROLE.queued;ROLE.queued=undefined;
        try{
          await commitRole(next);
          lastError=null;
        }catch(error){
          lastError=error;
          console.warn('role live update',error);
        }
      }
      await syncNow(true);
      if(lastError) toast('Ce rôle vient d’être pris ou n’est plus disponible.');
    }finally{
      ROLE.busy=false;
      try{delete document.documentElement.dataset.igrRolePending;delete document.documentElement.dataset.igrCellAction}catch{}
    }
  };

  document.addEventListener('click',event => {
    const button=event.target.closest?.('.igr-choice-status-button');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    chooseLobbyRole('none');
  },true);

  document.addEventListener('click',event => {
    const el=event.target.closest?.('button,a,[role="button"]');
    if(!el || el.classList?.contains('igr-choice-status-button'))return;
    if(!/retirer\s+(?:mon\s+)?choix/i.test(String(el.textContent||'')))return;
    if(!el.closest?.('.role-choice-zone,.lobby-v11,.page-lobby'))return;
    event.preventDefault();event.stopImmediatePropagation();
    chooseLobbyRole('none');
  },true);

  function launchButtonBusy(on){
    const b=document.querySelector('.lobby-v11 .btn.primary.block,.page-lobby .btn.primary.block');
    if(!b)return;
    if(on){
      b.disabled=true;
      b.setAttribute('aria-busy','true');
      b.dataset.liveLabel=b.textContent;
      b.textContent='Lancement…';
    }else{
      b.removeAttribute('aria-busy');
      if(b.dataset.liveLabel){b.textContent=b.dataset.liveLabel;delete b.dataset.liveLabel}
      const d=STATE?.sync;
      const count=(d?.players||[]).length,min=Number(d?.room?.min_players||0),max=Number(d?.room?.max_players||99);
      const canStart=!!STATE.hostToken && d?.room?.status==='lobby' && count>=min && count<=max;
      b.disabled=!canStart;
      if(canStart)b.removeAttribute('disabled');
    }
  }

  function transient(error){
    return /network|fetch|timeout|timed out|load failed|connection|502|503|504|gateway/i.test(String(error?.message || error || ''));
  }

  startGame = async function(){
    if(launchBusy)return;
    if(!STATE.hostToken)return toast('Seul l’hôte peut lancer.');
    launchBusy=true;launchButtonBusy(true);
    try{
      await syncNow(true);
      const d=STATE.sync;
      if(!d)throw new Error('sync_unavailable');
      const count=(d.players||[]).length,min=Number(d.room?.min_players||0),max=Number(d.room?.max_players||99);
      if(count<min){toast(`Encore ${min-count} joueur${min-count>1?'s':''} requis.`);return}
      if(count>max){toast('Trop de joueurs dans la cellule.');return}
      const sid=String(d.room?.scenario_id||roomScenario());
      const autoCount=(d.players||[]).filter(p=>!p.preferred_role).length;
      try{cancelBriefingVoice?.()}catch{};try{stopAmbient?.()}catch{}
      const name=isOmerta(sid)?'igr_omerta_start_game':'igr_v4_start_game';
      let result=null,lastError=null;
      for(let attempt=0;attempt<3;attempt++){
        try{result=await rpc(name,{p_code:STATE.room,p_host_token:STATE.hostToken});lastError=null;break}
        catch(error){
          lastError=error;
          if(/already started/i.test(String(error?.message||''))){lastError=null;break}
          if(!transient(error)||attempt===2)break;
          await new Promise(r=>setTimeout(r,180*(attempt+1)));
          await syncNow(true);
          if(STATE.sync?.room?.status!=='lobby'){lastError=null;break}
        }
      }
      if(lastError)throw lastError;
      await syncNow(true);
      if(STATE.sync?.room?.status==='lobby'){
        await new Promise(r=>setTimeout(r,180));
        await syncNow(true);
      }
      startRoomWatcher();
      if(STATE.sync?.room?.status==='lobby')throw new Error('launch_not_confirmed');
      const assigned=Number(result?.auto_assigned_roles??autoCount);
      if(assigned>0)toast(`${assigned} rôle${assigned>1?'s':''} attribué${assigned>1?'s':''} au hasard.`);
    }catch(error){
      console.error('start game v36',error);
      await syncNow(true).catch?.(()=>{});
      if(STATE.sync?.room?.status!=='lobby'){startRoomWatcher();return}
      toast('Lancement non confirmé. Réessaie : aucun double lancement ne sera créé.');
    }finally{
      launchBusy=false;launchButtonBusy(false);
    }
  };

  const localLeaveRoom = typeof leaveRoom === 'function' ? leaveRoom : null;

  function sendLeaveKeepalive(room,token){
    if(!room||!token)return;
    try{
      fetch(`${API}/rpc/igr_v4_leave_room`,{
        method:'POST',headers:headers(),
        body:JSON.stringify({p_code:room,p_player_token:token}),
        keepalive:true
      }).catch(()=>{});
    }catch{
      try{rpc('igr_v4_leave_room',{p_code:room,p_player_token:token}).catch(()=>{})}catch{}
    }
  }

  leaveRoom = function(){
    const room=STATE?.room,token=STATE?.token;
    if(room&&token)sendLeaveKeepalive(room,token);
    clearAdaptivePoll();
    closeRealtime('room-left',true);
    try{clearSession?.()}catch{}
    return localLeaveRoom?.apply(this,arguments);
  };

  function recoverStaleSession(message){
    if(!inRoom())return;
    clearAdaptivePoll();
    closeRealtime('stale-session',true);
    try{clearSession?.()}catch{}
    try{localLeaveRoom?.()}catch{}
    if(message)toast(message);
  }

  function remoteRoomClosed(){
    if(!inRoom())return;
    const wasHost=!!STATE.hostToken;
    clearAdaptivePoll();
    closeRealtime('room-closed',true);
    try{clearSession?.()}catch{}
    try{localLeaveRoom?.()}catch{}
    toast(wasHost?'Cellule fermée.':'L’hôte a fermé la cellule.');
  }

  function healIntroArt(){
    const gate=document.getElementById('introGate'),img=gate?.querySelector('.intro-art');
    if(!gate||!img)return;
    gate.classList.add('igr-intro-v1242');
    if(!img.dataset.live42){
      img.dataset.live42='1';
      img.addEventListener('error',()=>{
        if(img.dataset.retry42==='1'){gate.classList.add('intro-image-failed');return}
        img.dataset.retry42='1';
        img.src=`assets/intro-v10-14.webp?v=${V}-${Date.now()}`;
      });
    }
    if(img.complete&&!img.naturalWidth&&img.dataset.retry42!=='1'){
      img.dataset.retry42='1';
      img.src=`assets/intro-v10-14.webp?v=${V}-${Date.now()}`;
    }
  }

  function reliableIntroStart(){
    const gate=document.getElementById('introGate');
    if(!gate||gate.getAttribute('aria-hidden')==='true')return;
    healIntroArt();
    try{
      if(typeof INTRO!=='undefined'&&(INTRO.done||INTRO.playing))return;
      const wake=typeof wakeAudioFromGesture==='function'?wakeAudioFromGesture().catch?.(()=>false):Promise.resolve(false);
      if(typeof startIntroSequence==='function')startIntroSequence(wake);
      else if(typeof completeIntroEntry==='function')completeIntroEntry();
    }catch(error){
      console.warn('intro recovery',error);
      try{completeIntroEntry?.()}catch{}
    }
    clearTimeout(introWatchdog);
    introWatchdog=setTimeout(()=>{
      const g=document.getElementById('introGate');
      if(g&&g.getAttribute('aria-hidden')!=='true'){
        console.warn('Intro watchdog released a stuck entrance');
        try{completeIntroEntry?.()}catch{}
      }
    },3800);
  }

  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('#introEnterBtn'))reliableIntroStart();
  },true);
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target?.id==='introEnterBtn')reliableIntroStart();
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      healIntroArt();
      if(inRoom()){
        const stale=!RT.ready||!RT.ws||RT.ws.readyState!==WebSocket.OPEN||Date.now()-RT.lastMessageAt>70000;
        connectRealtime(stale);
        syncSoon(0,false);
        schedulePoll(stale?900:pollDelay());
      }
    }
  });
  window.addEventListener('online',()=>{
    if(inRoom()){
      connectRealtime(true);
      syncSoon(0,false);
      schedulePoll(900);
    }
  },{passive:true});
  window.addEventListener('offline',()=>{
    if(!inRoom())return;
    const ws=RT.ws;
    RT.ready=false;RT.joining=false;RT.ws=null;
    clearTimer('heartbeat');clearTimer('joinWatchdog');clearTimer('reconnect');
    if(ws){RT.closedByUs=true;try{ws.close(1000,'offline')}catch{}RT.closedByUs=false}
    setRealtimeState('offline');
    clearAdaptivePoll();
  },{passive:true});
  window.addEventListener('pageshow',()=>{
    healIntroArt();
    if(inRoom()){
      const stale=!RT.ready||!RT.ws||RT.ws.readyState!==WebSocket.OPEN||Date.now()-RT.lastMessageAt>70000;
      connectRealtime(stale);
      syncSoon(0,false);
      schedulePoll(stale?900:pollDelay());
    }
  },{passive:true});

  try{
    Object.defineProperty(window,'__IGR_REALTIME__',{configurable:true,value:{
      snapshot:()=>({state:document.documentElement.dataset.igrRealtime||'off',room:RT.room,ready:RT.ready,joining:RT.joining,revision:RT.revision,syncedRevision:RT.syncedRevision,reconnectAttempt:RT.reconnectAttempt,lastMessageAt:RT.lastMessageAt}),
      reconcile:()=>syncSoon(0,false)
    }});
  }catch{}

  healIntroArt();
  if(inRoom()){
    startRoomWatcher();
    syncSoon(0,false);
  }
})();
