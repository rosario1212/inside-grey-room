/* Inside Grey Room — v12.42 Live Cell + startup stability
   Near-instant lobby/game invalidation through Supabase Realtime,
   optimistic role selection, explicit lobby departure, robust launch + intro fallback. */
(() => {
  'use strict';

  const V = 'v12.42-live-cell';
  const OMERTA_IDS = new Set(['021','022','023','024','025']);
  const RT = {
    room:null, signalToken:null, ws:null, topic:null, ready:false, joining:false,
    ref:0, joinRef:null, heartbeat:null, reconnect:null, reconnectAttempt:0,
    pollTimer:null, syncTimer:null, lastSyncAt:0, closedByUs:false
  };
  const ROLE = {busy:false, queued:undefined};
  let launchBusy = false;
  let introWatchdog = null;

  const roomScenario = () => String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || STATE?.selectedScenario || '');
  const inRoom = () => !!(STATE?.room && STATE?.token);
  const isOmerta = id => OMERTA_IDS.has(String(id || ''));
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
    if(RT[name]){ clearTimeout(RT[name]); clearInterval(RT[name]); RT[name]=null; }
  }

  function closeRealtime(){
    RT.closedByUs = true;
    clearTimer('heartbeat'); clearTimer('reconnect'); clearTimer('syncTimer');
    const ws = RT.ws; RT.ws = null; RT.ready = false; RT.joining = false;
    RT.room = null; RT.signalToken = null; RT.topic = null; RT.joinRef = null;
    if(ws){ try{ws.close(1000,'room-left')}catch{} }
    setRealtimeState('off');
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

  function startHeartbeat(){
    clearTimer('heartbeat');
    RT.heartbeat = setInterval(() => {
      if(RT.ws?.readyState === WebSocket.OPEN){
        sendRealtime('heartbeat',{},String(++RT.ref),'phoenix',null);
      }
    }, 25000);
  }

  function syncSoon(delay=35, force=true){
    if(!inRoom()) return;
    clearTimer('syncTimer');
    const now = performance.now();
    const minGap = 275;
    const wait = Math.max(delay, RT.lastSyncAt + minGap - now, 0);
    RT.syncTimer = setTimeout(async () => {
      RT.syncTimer = null;
      if(!inRoom()) return;
      RT.lastSyncAt = performance.now();
      try{ await syncNow(force); }catch(e){ console.warn('live sync',e); }
    }, wait);
  }

  function scheduleReconnect(){
    if(!inRoom() || RT.closedByUs) return;
    clearTimer('reconnect');
    const delays = [350,700,1200,2200,4000,6500];
    const delay = delays[Math.min(RT.reconnectAttempt++, delays.length-1)];
    RT.reconnect = setTimeout(() => connectRealtime(true), delay);
  }

  function handleRealtimeMessage(event){
    let msg;
    try{ msg = JSON.parse(event.data); }catch{return;}
    if(!msg || msg.topic !== RT.topic) return;

    if(msg.event === 'phx_reply' && String(msg.ref) === String(RT.joinRef)){
      const ok = msg.payload?.status === 'ok';
      RT.ready = !!ok;
      RT.joining = false;
      if(ok){
        RT.reconnectAttempt = 0;
        setRealtimeState('live');
        startHeartbeat();
        syncSoon(0,true);
      }else{
        console.warn('Realtime join rejected',msg.payload);
        setRealtimeState('fallback');
        scheduleReconnect();
      }
      return;
    }

    if(msg.event === 'postgres_changes'){
      const data = msg.payload?.data || msg.payload || {};
      const type = String(data.type || data.eventType || '').toUpperCase();
      const record = data.record || data.new || {};
      if(type === 'DELETE' || record.closed === true){
        remoteRoomClosed();
        return;
      }
      syncSoon(20,true);
      return;
    }

    if(msg.event === 'phx_error' || msg.event === 'phx_close'){
      RT.ready = false;
      setRealtimeState('fallback');
      scheduleReconnect();
    }
  }

  async function connectRealtime(force=false){
    if(!inRoom()) return closeRealtime();
    const room = String(STATE.room || '').toUpperCase();
    if(!force && RT.room === room && (RT.ready || RT.joining || RT.ws?.readyState === WebSocket.CONNECTING)) return;

    const old = RT.ws;
    if(old){ RT.closedByUs = true; try{old.close(1000,'rejoin')}catch{} }
    clearTimer('heartbeat'); clearTimer('reconnect');
    RT.ws = null; RT.ready = false; RT.joining = true; RT.closedByUs = false; RT.room = room;
    setRealtimeState('connecting');

    let signalToken;
    try{
      signalToken = await rpc('igr_v4_realtime_token',{p_code:room,p_player_token:STATE.token});
    }catch(error){
      RT.joining = false;
      console.warn('Realtime token unavailable',error);
      setRealtimeState('fallback');
      scheduleReconnect();
      return;
    }
    if(!signalToken || !inRoom() || String(STATE.room).toUpperCase() !== room) return;

    RT.signalToken = String(signalToken);
    RT.topic = `realtime:igr-room-${RT.signalToken}`;
    let ws;
    try{ ws = new WebSocket(wsEndpoint()); }catch(error){
      RT.joining = false; setRealtimeState('fallback'); scheduleReconnect(); return;
    }
    RT.ws = ws;

    ws.addEventListener('open',() => {
      if(RT.ws !== ws) return;
      RT.joinRef = String(++RT.ref);
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
    });
    ws.addEventListener('message',handleRealtimeMessage);
    ws.addEventListener('error',() => { if(RT.ws === ws) setRealtimeState('fallback'); });
    ws.addEventListener('close',() => {
      if(RT.ws !== ws) return;
      RT.ws = null; RT.ready = false; RT.joining = false; clearTimer('heartbeat');
      if(!RT.closedByUs && inRoom()){setRealtimeState('fallback');scheduleReconnect();}
    });
  }

  // Replace the old fixed 700/1100 ms interval with Realtime + a conservative fallback poll.
  const baseStopRoomWatcher = typeof stopRoomWatcher === 'function' ? stopRoomWatcher : null;
  try{baseStopRoomWatcher?.()}catch{}

  function clearAdaptivePoll(){
    if(RT.pollTimer){clearTimeout(RT.pollTimer);RT.pollTimer=null;}
    try{if(STATE?.watcher){clearInterval(STATE.watcher);clearTimeout(STATE.watcher);STATE.watcher=null;}}catch{}
  }

  stopRoomWatcher = function(){
    clearAdaptivePoll();
    closeRealtime();
  };

  startRoomWatcher = function(){
    clearAdaptivePoll();
    if(!inRoom()) return;
    connectRealtime(false);
    const loop = async () => {
      if(!inRoom()){clearAdaptivePoll();return;}
      try{await syncNow(false);}catch{}
      const hidden = document.visibilityState === 'hidden';
      const delay = RT.ready ? (hidden ? 6500 : 2200) : (hidden ? 2200 : 360);
      RT.pollTimer = setTimeout(loop,delay);
      STATE.watcher = RT.pollTimer;
    };
    RT.pollTimer = setTimeout(loop,RT.ready?1200:220);
    STATE.watcher = RT.pollTimer;
  };

  function meRows(){
    const d=STATE?.sync;if(!d)return[];
    const id=String(d.player?.id || STATE.playerId || '');
    return [d.player,...(d.players||[]).filter(p=>String(p.id)===id)].filter(Boolean);
  }

  function optimisticRole(role){
    const value = !role || ['none','cancel','annuler'].includes(String(role).toLowerCase()) ? null : String(role);
    for(const row of meRows()) row.preferred_role = value;
    try{document.documentElement.dataset.igrRolePending='1'}catch{}
    try{renderLobby(STATE.sync);}catch{}
  }

  async function commitRole(role){
    const sid = roomScenario();
    const normalized = !role || ['none','cancel','annuler'].includes(String(role).toLowerCase()) ? 'none' : String(role);
    const rpcName = isOmerta(sid) ? 'igr_omerta_choose_role' : 'igr_v4_choose_role';
    return rpc(rpcName,{p_code:STATE.room,p_player_token:STATE.token,p_role:normalized});
  }

  // Queue fast successive taps; the UI moves immediately to the latest choice.
  chooseLobbyRole = async function(role){
    ROLE.queued = role;
    optimisticRole(role);
    if(ROLE.busy) return;
    ROLE.busy = true;
    let lastError = null;
    try{
      while(ROLE.queued !== undefined){
        const next = ROLE.queued; ROLE.queued = undefined;
        try{
          await commitRole(next);
          lastError = null;
        }catch(error){
          lastError = error;
          console.warn('role live update',error);
        }
      }
      await syncNow(true);
      if(lastError) toast('Ce rôle vient d’être pris ou n’est plus disponible.');
    }finally{
      ROLE.busy = false;
      try{delete document.documentElement.dataset.igrRolePending}catch{}
    }
  };

  // The upper "Retirer" control now always uses the same live role mutation path.
  document.addEventListener('click',event => {
    const button = event.target.closest?.('.igr-choice-status-button');
    if(!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    chooseLobbyRole('none');
  },true);

  // Any legacy/bottom "Retirer mon choix" control uses the same optimistic live path.
  document.addEventListener('click',event => {
    const el = event.target.closest?.('button,a,[role="button"]');
    if(!el || el.classList?.contains('igr-choice-status-button')) return;
    if(!/retirer\s+(?:mon\s+)?choix/i.test(String(el.textContent||''))) return;
    if(!el.closest?.('.role-choice-zone,.lobby-v11,.page-lobby')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    chooseLobbyRole('none');
  },true);

  function launchButtonBusy(on){
    const b = document.querySelector('.lobby-v11 .btn.primary.block,.page-lobby .btn.primary.block');
    if(!b) return;
    if(on){b.disabled=true;b.setAttribute('aria-busy','true');b.dataset.liveLabel=b.textContent;b.textContent='Lancement…';}
    else{b.removeAttribute('aria-busy');if(b.dataset.liveLabel){b.textContent=b.dataset.liveLabel;delete b.dataset.liveLabel;}}
  }

  function transient(error){
    return /network|fetch|timeout|timed out|load failed|connection|502|503|504|gateway/i.test(String(error?.message || error || ''));
  }

  startGame = async function(){
    if(launchBusy) return;
    if(!STATE.hostToken) return toast('Seul l’hôte peut lancer.');
    launchBusy = true; launchButtonBusy(true);
    try{
      await syncNow(true);
      const d=STATE.sync;
      if(!d) throw new Error('sync_unavailable');
      const count=(d.players||[]).length,min=Number(d.room?.min_players||0),max=Number(d.room?.max_players||99);
      if(count<min){toast(`Encore ${min-count} joueur${min-count>1?'s':''} requis.`);return;}
      if(count>max){toast('Trop de joueurs dans la cellule.');return;}
      const sid=String(d.room?.scenario_id||roomScenario());
      const autoCount=(d.players||[]).filter(p=>!p.preferred_role).length;
      try{cancelBriefingVoice?.()}catch{}; try{stopAmbient?.()}catch{};
      const name=isOmerta(sid)?'igr_omerta_start_game':'igr_v4_start_game';
      let result=null,lastError=null;
      for(let attempt=0;attempt<3;attempt++){
        try{result=await rpc(name,{p_code:STATE.room,p_host_token:STATE.hostToken});lastError=null;break;}
        catch(error){
          lastError=error;
          if(/already started/i.test(String(error?.message||''))){lastError=null;break;}
          if(!transient(error)||attempt===2)break;
          await new Promise(r=>setTimeout(r,180*(attempt+1)));
          await syncNow(true);
          if(STATE.sync?.room?.status!=='lobby'){lastError=null;break;}
        }
      }
      if(lastError) throw lastError;
      await syncNow(true);
      if(STATE.sync?.room?.status==='lobby'){
        await new Promise(r=>setTimeout(r,180));
        await syncNow(true);
      }
      startRoomWatcher();
      if(STATE.sync?.room?.status==='lobby') throw new Error('launch_not_confirmed');
      const assigned=Number(result?.auto_assigned_roles??autoCount);
      if(assigned>0) toast(`${assigned} rôle${assigned>1?'s':''} attribué${assigned>1?'s':''} au hasard.`);
    }catch(error){
      console.error('start game v12.42',error);
      await syncNow(true).catch?.(()=>{});
      if(STATE.sync?.room?.status!=='lobby'){startRoomWatcher();return;}
      toast('Lancement non confirmé. Réessaie : aucun double lancement ne sera créé.');
    }finally{
      launchBusy=false;launchButtonBusy(false);
    }
  };

  // Explicit departure now reaches the server while still returning home immediately.
  const localLeaveRoom = typeof leaveRoom === 'function' ? leaveRoom : null;
  leaveRoom = function(){
    const room=STATE?.room,token=STATE?.token;
    if(room&&token){
      try{rpc('igr_v4_leave_room',{p_code:room,p_player_token:token}).catch(()=>{});}catch{}
    }
    closeRealtime(); clearAdaptivePoll();
    return localLeaveRoom?.apply(this,arguments);
  };

  function remoteRoomClosed(){
    if(!inRoom()) return;
    const wasHost=!!STATE.hostToken;
    closeRealtime();clearAdaptivePoll();
    try{localLeaveRoom?.()}catch{}
    toast(wasHost?'Cellule fermée.':'L’hôte a fermé la cellule.');
  }

  // Startup: force the intro artwork to have a visible fallback and make ENTRER recover from a stale iOS gesture/audio state.
  function healIntroArt(){
    const gate=document.getElementById('introGate'),img=gate?.querySelector('.intro-art');
    if(!gate||!img)return;
    gate.classList.add('igr-intro-v1242');
    if(!img.dataset.live42){
      img.dataset.live42='1';
      img.addEventListener('error',()=>{
        if(img.dataset.retry42==='1'){gate.classList.add('intro-image-failed');return;}
        img.dataset.retry42='1';
        img.src=`assets/intro-v10-14.webp?v=${V}-${Date.now()}`;
      });
    }
    if(img.complete && !img.naturalWidth && img.dataset.retry42!=='1'){
      img.dataset.retry42='1';
      img.src=`assets/intro-v10-14.webp?v=${V}-${Date.now()}`;
    }
  }

  function reliableIntroStart(){
    const gate=document.getElementById('introGate');
    if(!gate || gate.getAttribute('aria-hidden')==='true') return;
    healIntroArt();
    try{
      if(typeof INTRO!=='undefined' && (INTRO.done||INTRO.playing)) return;
      const wake = typeof wakeAudioFromGesture==='function' ? wakeAudioFromGesture().catch?.(()=>false) : Promise.resolve(false);
      if(typeof startIntroSequence==='function') startIntroSequence(wake);
      else if(typeof completeIntroEntry==='function') completeIntroEntry();
    }catch(error){
      console.warn('intro recovery',error);
      try{completeIntroEntry?.()}catch{}
    }
    clearTimeout(introWatchdog);
    introWatchdog=setTimeout(()=>{
      const g=document.getElementById('introGate');
      if(g && g.getAttribute('aria-hidden')!=='true'){
        console.warn('Intro watchdog released a stuck entrance');
        try{completeIntroEntry?.()}catch{}
      }
    },3800);
  }

  document.addEventListener('pointerdown',event=>{
    if(event.target.closest?.('#introEnterBtn')) reliableIntroStart();
  },true);
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ') && event.target?.id==='introEnterBtn') reliableIntroStart();
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      healIntroArt();
      if(inRoom()){connectRealtime(true);syncSoon(0,true);startRoomWatcher();}
    }
  });
  window.addEventListener('online',()=>{if(inRoom()){connectRealtime(true);syncSoon(0,true);}}, {passive:true});
  window.addEventListener('pageshow',()=>{healIntroArt();if(inRoom()){connectRealtime(true);startRoomWatcher();syncSoon(0,true);}}, {passive:true});

  healIntroArt();
  if(inRoom()){startRoomWatcher();syncSoon(0,true);}
})();
