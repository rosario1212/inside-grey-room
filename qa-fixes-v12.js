/* Inside Grey Room V12.2 — cross-platform media/runtime fixes
   - one stable WebRTC session per interrogation activation
   - camera + microphone only during the 8-minute interrogation phase
   - no repeated srcObject assignment (removes the ~1s preview hiccup)
   - bounded reconnects, no renegotiation storms
   - explicit remote-audio unlock for iOS/PWA autoplay rules
   - reliable audio-wake control and private messaging UI
   The 30-second opening countdown is intentionally preserved.
*/
(() => {
  const MEDIA_BUILD = 'v12.2-media-phase-20260928-1';
  const VIDEO_ROLES = new Set(['enqueteur','analyste','procureur','juge','inspecteur']);

  Object.assign(VIDEO, {
    mediaBuild: MEDIA_BUILD,
    session: VIDEO.session || null,
    capturePromise: null,
    pollBusy: false,
    viewerRequestPending: false,
    viewerRetryTimer: null,
    viewerRetryCount: 0,
    lastViewerRequestAt: 0,
    offerInFlight: new Set(),
    peerStartedAt: new Map(),
    viewerAudioUnlocked: false
  });

  const phaseAllowsVideo = () =>
    STATE.sync?.room?.status === 'playing' &&
    STATE.sync?.room?.phase === 'interrogation';

  const currentVideoSession = () => {
    const st = videoState();
    return phaseAllowsVideo() && st?.video_active ? (st.video_session || null) : null;
  };

  const liveStream = stream =>
    !!stream && stream.getTracks().some(t => t.readyState === 'live');

  const liveVideoStream = stream =>
    !!stream && stream.getVideoTracks().some(t => t.readyState === 'live');

  const cutActive = () => {
    const raw = videoState()?.video_cut_until;
    const ts = raw ? Date.parse(raw) : NaN;
    return Number.isFinite(ts) && ts > Date.now();
  };

  const setVideoStatus = (text, kind = '') => {
    const el = byId('videoConnectionStatus');
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind;
  };

  const updateAudioButton = () => {
    const btn = byId('videoAudioUnlock');
    if (!btn) return;
    const rv = byId('remoteVideo');
    const hasAudio = !!VIDEO.remoteStream?.getAudioTracks().some(t => t.readyState === 'live');
    const audible = hasAudio && rv && !rv.muted && VIDEO.viewerAudioUnlocked;
    btn.hidden = audible || !hasAudio;
    if (!audible && hasAudio) btn.textContent = 'Activer le son';
  };

  async function attachLocalVideo() {
    const lv = byId('localVideo');
    if (!lv || !liveVideoStream(VIDEO.localStream)) return;
    lv.muted = true;
    lv.playsInline = true;
    lv.autoplay = true;
    if (lv.srcObject !== VIDEO.localStream) lv.srcObject = VIDEO.localStream;
    if (lv.paused) {
      try { await lv.play(); } catch (_) {}
    }
  }

  async function attachRemoteVideo() {
    const rv = byId('remoteVideo');
    if (!rv || !liveStream(VIDEO.remoteStream)) return;
    rv.playsInline = true;
    rv.autoplay = true;
    if (rv.srcObject !== VIDEO.remoteStream) rv.srcObject = VIDEO.remoteStream;

    rv.muted = !VIDEO.viewerAudioUnlocked;
    try {
      if (rv.paused) await rv.play();
      if (!rv.muted) setVideoStatus('Flux en direct · son actif', 'ok');
      else setVideoStatus('Flux en direct', 'ok');
    } catch (_) {
      rv.muted = true;
      try { await rv.play(); } catch (_) {}
      setVideoStatus('Flux en direct · active le son', 'ok');
    }
    updateAudioButton();
  }

  unlockRemoteAudio = async function() {
    VIDEO.viewerAudioUnlocked = true;
    const rv = byId('remoteVideo');
    if (!rv || !liveStream(VIDEO.remoteStream)) {
      updateAudioButton();
      return;
    }
    rv.muted = false;
    rv.volume = 1;
    try {
      await rv.play();
      setVideoStatus('Flux en direct · son actif', 'ok');
    } catch (_) {
      rv.muted = true;
      VIDEO.viewerAudioUnlocked = false;
      toast('Touchez de nouveau « Activer le son ».');
    }
    updateAudioButton();
  };

  const stopViewerRetry = () => {
    if (VIDEO.viewerRetryTimer) clearTimeout(VIDEO.viewerRetryTimer);
    VIDEO.viewerRetryTimer = null;
  };

  const stopSignalPoller = () => {
    if (VIDEO.poller) clearInterval(VIDEO.poller);
    VIDEO.poller = null;
    VIDEO.pollBusy = false;
  };

  closePeer = function(id) {
    const pc = VIDEO.pcs.get(id);
    if (pc) {
      try { pc.ontrack = null; } catch (_) {}
      try { pc.close(); } catch (_) {}
    }
    VIDEO.pcs.delete(id);
    VIDEO.peerStartedAt.delete(String(id));
    VIDEO.offerInFlight.delete(String(id));
  };

  const stopRemoteStream = () => {
    if (VIDEO.remoteStream) {
      try { VIDEO.remoteStream.getTracks().forEach(t => t.stop()); } catch (_) {}
    }
    VIDEO.remoteStream = null;
  };

  closeAllPeers = function() {
    [...VIDEO.pcs.keys()].forEach(closePeer);
    stopRemoteStream();
  };

  function resetPeerState({keepLocal = false, keepSession = false} = {}) {
    stopViewerRetry();
    stopSignalPoller();
    closeAllPeers();
    VIDEO.viewerRequestPending = false;
    VIDEO.viewerRetryCount = 0;
    VIDEO.lastViewerRequestAt = 0;
    VIDEO.lastSignalId = 0;
    VIDEO.offerInFlight.clear();
    VIDEO.peerStartedAt.clear();
    if (!keepSession) VIDEO.session = null;
    if (!keepLocal && VIDEO.localStream) {
      try { VIDEO.localStream.getTracks().forEach(t => t.stop()); } catch (_) {}
      VIDEO.localStream = null;
    }
  }

  stopLocalCapture = function() {
    resetPeerState({keepLocal:false, keepSession:false});
    VIDEO.starting = false;
    VIDEO.capturePromise = null;
  };

  const captureConstraints = {
    video: {
      facingMode: {ideal:'environment'},
      width: {ideal:540, max:720},
      height: {ideal:960, max:1280},
      frameRate: {ideal:24, max:30}
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    }
  };

  ensureLocalVideo = async function() {
    if (liveVideoStream(VIDEO.localStream) &&
        VIDEO.localStream.getAudioTracks().some(t => t.readyState === 'live')) {
      return VIDEO.localStream;
    }
    if (VIDEO.capturePromise) return VIDEO.capturePromise;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');

    VIDEO.capturePromise = (async () => {
      if (VIDEO.localStream) {
        try { VIDEO.localStream.getTracks().forEach(t => t.stop()); } catch (_) {}
        VIDEO.localStream = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia(captureConstraints);
      const vt = stream.getVideoTracks()[0];
      const at = stream.getAudioTracks()[0];
      try { if (vt && 'contentHint' in vt) vt.contentHint = 'motion'; } catch (_) {}
      try { if (at && 'contentHint' in at) at.contentHint = 'speech'; } catch (_) {}
      if (vt) {
        vt.onended = () => {
          if (STATE.sync?.player?.public_role !== 'enqueteur') return;
          if (!videoState()?.video_active) return;
          setTimeout(() => {
            if (!liveVideoStream(VIDEO.localStream) && videoState()?.video_active) {
              rpc('igr_v4_video_set', {
                p_code: STATE.room,
                p_player_token: STATE.token,
                p_active: false,
                p_confidential_cut: false
              }).then(() => syncNow(true)).catch(() => {});
            }
          }, 500);
        };
      }
      VIDEO.localStream = stream;
      await attachLocalVideo();
      return stream;
    })();

    try {
      return await VIDEO.capturePromise;
    } finally {
      VIDEO.capturePromise = null;
    }
  };

  const iceServers = () => {
    const base = [
      {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},
      {urls:['stun:stun.cloudflare.com:3478']}
    ];
    if (Array.isArray(window.IGR_TURN_ICE_SERVERS)) {
      for (const server of window.IGR_TURN_ICE_SERVERS) {
        if (server && server.urls) base.push(server);
      }
    }
    return base;
  };

  async function tuneSender(sender) {
    if (!sender?.track || sender.track.kind !== 'video' || !sender.getParameters) return;
    try {
      const p = sender.getParameters();
      if (!p.encodings?.length) p.encodings = [{}];
      p.encodings[0].maxBitrate = 900000;
      p.encodings[0].maxFramerate = 24;
      p.degradationPreference = 'maintain-framerate';
      await sender.setParameters(p);
    } catch (_) {}
  }

  newPeer = function(remoteId, isBroadcaster) {
    closePeer(remoteId);
    const pc = new RTCPeerConnection({
      iceServers: iceServers(),
      iceCandidatePoolSize: 2,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });
    VIDEO.pcs.set(remoteId, pc);
    VIDEO.peerStartedAt.set(String(remoteId), Date.now());
    pc.onicecandidate = null;

    if (isBroadcaster && liveStream(VIDEO.localStream)) {
      VIDEO.localStream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, VIDEO.localStream);
        if (track.kind === 'video') tuneSender(sender);
      });
    }

    pc.ontrack = e => {
      if (isBroadcaster) return;
      const incoming = e.streams?.[0];
      if (incoming) {
        VIDEO.remoteStream = incoming;
      } else {
        if (!VIDEO.remoteStream) VIDEO.remoteStream = new MediaStream();
        if (!VIDEO.remoteStream.getTracks().some(t => t.id === e.track.id)) {
          VIDEO.remoteStream.addTrack(e.track);
        }
      }
      VIDEO.viewerRequestPending = false;
      VIDEO.viewerRetryCount = 0;
      stopViewerRetry();
      requestAnimationFrame(() => attachRemoteVideo());
    };

    const failLater = () => {
      if (isBroadcaster) return;
      const bad = ['failed','closed','disconnected'].includes(pc.connectionState) ||
                  ['failed','closed','disconnected'].includes(pc.iceConnectionState);
      if (!bad || liveStream(VIDEO.remoteStream)) return;
      setTimeout(() => {
        if (VIDEO.pcs.get(remoteId) !== pc || liveStream(VIDEO.remoteStream)) return;
        closePeer(remoteId);
        joinVideoAsViewer(true, false).catch(() => {});
      }, 1800);
    };
    pc.onconnectionstatechange = failLater;
    pc.oniceconnectionstatechange = failLater;
    return pc;
  };

  const waitForIceGathering = (pc, timeoutMs = 3500) => new Promise(resolve => {
    if (!pc || pc.iceGatheringState === 'complete') return resolve();
    let finished = false;
    let timer;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      pc.removeEventListener?.('icegatheringstatechange', onState);
      resolve();
    };
    const onState = () => { if (pc.iceGatheringState === 'complete') done(); };
    timer = setTimeout(done, timeoutMs);
    pc.addEventListener?.('icegatheringstatechange', onState);
  });

  const sendSignal = async (to, type, payload = {}) => {
    const session = currentVideoSession() || VIDEO.session;
    if (!session) throw new Error('video session unavailable');
    return rpc('igr_v4_signal_send', {
      p_code: STATE.room,
      p_player_token: STATE.token,
      p_to: to,
      p_type: type,
      p_payload: {...payload, session, client_rev: MEDIA_BUILD}
    });
  };

  handleSignal = async function(signal) {
    const me = STATE.sync?.player;
    if (!me || !phaseAllowsVideo()) return;
    const session = currentVideoSession();
    const payload = signal?.payload || {};
    if (!session || payload.session !== session) return;

    const role = me.public_role;
    const from = signal?.from_player_id;
    const type = signal?.signal_type;
    if (!from || !type) return;

    if (type === 'hangup') {
      closePeer(from);
      return;
    }

    if (type === 'ice') {
      const pc = VIDEO.pcs.get(from);
      if (!pc?.remoteDescription?.type) return;
      try {
        const {session:_s, client_rev:_r, ...candidate} = payload;
        await pc.addIceCandidate(candidate);
      } catch (_) {}
      return;
    }

    if (type === 'viewer_ready' && role === 'enqueteur') {
      if (!liveStream(VIDEO.localStream)) return;
      const key = String(from);
      if (VIDEO.offerInFlight.has(key)) return;

      const existing = VIDEO.pcs.get(from);
      if (existing &&
          !['failed','closed','disconnected'].includes(existing.connectionState) &&
          Date.now() - (VIDEO.peerStartedAt.get(key) || 0) < 12000) {
        return;
      }

      VIDEO.offerInFlight.add(key);
      try {
        const pc = newPeer(from, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc);
        if (VIDEO.pcs.get(from) !== pc || pc.signalingState === 'closed') return;
        const local = pc.localDescription || offer;
        await sendSignal(from, 'offer', {type:local.type, sdp:local.sdp});
      } catch (e) {
        console.error('video offer', e);
        closePeer(from);
      } finally {
        VIDEO.offerInFlight.delete(key);
      }
      return;
    }

    if (type === 'offer' && role !== 'enqueteur') {
      VIDEO.viewerRequestPending = false;
      try {
        const pc = newPeer(from, false);
        await pc.setRemoteDescription({type:payload.type, sdp:payload.sdp});
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        if (VIDEO.pcs.get(from) !== pc || pc.signalingState === 'closed') return;
        const local = pc.localDescription || answer;
        await sendSignal(from, 'answer', {type:local.type, sdp:local.sdp});
        setVideoStatus('Connexion au flux…', 'pending');
      } catch (e) {
        console.error('video answer', e);
        closePeer(from);
        scheduleViewerRetry(from);
      }
      return;
    }

    if (type === 'answer' && role === 'enqueteur') {
      const pc = VIDEO.pcs.get(from);
      if (!pc || pc.signalingState === 'closed') return;
      try {
        if (!pc.remoteDescription?.type) {
          await pc.setRemoteDescription({type:payload.type, sdp:payload.sdp});
        }
      } catch (e) {
        console.error('video remote answer', e);
        closePeer(from);
      }
    }
  };

  pollSignals = async function() {
    if (VIDEO.pollBusy || !STATE.room || !STATE.token || !STATE.sync) return;
    const session = currentVideoSession();
    if (!session || !phaseAllowsVideo() || cutActive()) return;

    VIDEO.pollBusy = true;
    const room = STATE.room;
    try {
      const arr = await rpc('igr_v4_signal_poll', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_after: VIDEO.lastSignalId || 0
      });
      for (const s of arr || []) {
        if (STATE.room !== room || currentVideoSession() !== session) break;
        VIDEO.lastSignalId = Math.max(VIDEO.lastSignalId || 0, Number(s.id) || 0);
        await handleSignal(s);
      }
    } catch (e) {
      console.warn('video signal poll', e?.message || e);
    } finally {
      VIDEO.pollBusy = false;
    }
  };

  startSignalPoller = function() {
    if (!phaseAllowsVideo() || !currentVideoSession() || cutActive()) return;
    if (VIDEO.poller) return;
    VIDEO.poller = setInterval(() => pollSignals(), 700);
    pollSignals();
  };

  function scheduleViewerRetry(enqId) {
    stopViewerRetry();
    VIDEO.viewerRetryTimer = setTimeout(() => {
      if (!phaseAllowsVideo() || !currentVideoSession() || liveStream(VIDEO.remoteStream)) return;
      if (VIDEO.viewerRetryCount >= 2) {
        VIDEO.viewerRequestPending = false;
        setVideoStatus('Connexion impossible · réessayez', 'error');
        return;
      }
      VIDEO.viewerRetryCount += 1;
      VIDEO.viewerRequestPending = false;
      joinVideoAsViewer(true, false).catch(() => {});
    }, 9000);
  }

  joinVideoAsViewer = async function(force = false, fromUser = true) {
    if (!phaseAllowsVideo() || !videoState()?.video_active || cutActive()) {
      toast('Le flux est disponible uniquement pendant un interrogatoire actif.');
      return;
    }
    const enq = STATE.sync?.players?.find(p => p.public_role === 'enqueteur');
    if (!enq) return;

    if (fromUser) {
      VIDEO.viewerAudioUnlocked = true;
      VIDEO.viewerRetryCount = 0;
    }

    if (liveStream(VIDEO.remoteStream) && !force) {
      await attachRemoteVideo();
      if (fromUser) await unlockRemoteAudio();
      return;
    }

    const now = Date.now();
    if (!force && (VIDEO.viewerRequestPending || now - VIDEO.lastViewerRequestAt < 4500)) return;

    if (force) {
      closePeer(enq.id);
      stopRemoteStream();
      VIDEO.viewerRequestPending = false;
    }

    VIDEO.lastViewerRequestAt = now;
    VIDEO.viewerRequestPending = true;
    startSignalPoller();
    setVideoStatus(force ? 'Reconnexion…' : 'Connexion…', 'pending');

    try {
      await sendSignal(enq.id, 'viewer_ready', {});
      scheduleViewerRetry(enq.id);
    } catch (e) {
      VIDEO.viewerRequestPending = false;
      console.error('viewer ready', e);
      setVideoStatus('Flux indisponible', 'error');
    }
  };

  activateVideo = async function() {
    if (STATE.sync?.player?.public_role !== 'enqueteur') return;
    if (!phaseAllowsVideo()) {
      toast('Le flux peut être activé uniquement pendant les 8 minutes d’interrogatoire.');
      return;
    }
    if (VIDEO.starting) return;

    VIDEO.starting = true;
    setVideoStatus('Activation caméra + micro…', 'pending');
    try {
      await ensureLocalVideo();
      const out = await rpc('igr_v4_video_set', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_active: true,
        p_confidential_cut: false
      });
      VIDEO.session = out?.session || null;
      VIDEO.lastSignalId = 0;
      closeAllPeers();
      await syncNow(true);
      VIDEO.session = currentVideoSession() || VIDEO.session;
      startSignalPoller();
      await attachLocalVideo();
      setVideoStatus('Caméra et micro en direct', 'ok');
    } catch (e) {
      console.error('activate video', e);
      stopLocalCapture();
      toast('Impossible d’activer la caméra et le micro.');
    } finally {
      VIDEO.starting = false;
    }
  };

  stopVideo = async function() {
    if (STATE.sync?.player?.public_role !== 'enqueteur') return;
    resetPeerState({keepLocal:false, keepSession:false});
    try {
      await rpc('igr_v4_video_set', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_active: false,
        p_confidential_cut: false
      });
      await syncNow(true);
    } catch (e) {
      console.warn('stop video', e);
    }
  };

  confidentialCut = async function() {
    if (STATE.sync?.player?.public_role !== 'enqueteur' || !phaseAllowsVideo()) return;
    try {
      await rpc('igr_v4_video_set', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_active: false,
        p_confidential_cut: true
      });
      resetPeerState({keepLocal:false, keepSession:false});
      await syncNow(true);
    } catch (e) {
      toast('Coupure indisponible ou déjà utilisée pendant ce cycle.');
    }
  };

  manageVideoState = function() {
    const d = STATE.sync;
    if (!d) return;
    const role = d.player.public_role;
    const allowedRole = VIDEO_ROLES.has(role);
    const allowedPhase = phaseAllowsVideo();
    const st = videoState();
    const active = allowedPhase && !!st.video_active;
    const cut = cutActive();
    const session = active && !cut ? (st.video_session || null) : null;

    if (!allowedRole || !allowedPhase || !active || cut || !session) {
      stopViewerRetry();
      stopSignalPoller();
      closeAllPeers();
      VIDEO.viewerRequestPending = false;
      if (!VIDEO.starting && role === 'enqueteur' && liveStream(VIDEO.localStream)) {
        try { VIDEO.localStream.getTracks().forEach(t => t.stop()); } catch (_) {}
        VIDEO.localStream = null;
      }
      if (!active || !allowedPhase) VIDEO.session = null;
      return;
    }

    if (VIDEO.session !== session) {
      const keepLocal = role === 'enqueteur' && liveStream(VIDEO.localStream);
      stopViewerRetry();
      stopSignalPoller();
      closeAllPeers();
      VIDEO.lastSignalId = 0;
      VIDEO.viewerRequestPending = false;
      VIDEO.viewerRetryCount = 0;
      VIDEO.session = session;
      if (!keepLocal && role === 'enqueteur') VIDEO.localStream = null;
    }

    startSignalPoller();

    if (role === 'enqueteur') {
      if (liveStream(VIDEO.localStream)) {
        requestAnimationFrame(() => attachLocalVideo());
        setVideoStatus('Caméra et micro en direct', 'ok');
      } else if (!VIDEO.starting) {
        setVideoStatus('Caméra à réactiver', 'error');
      }
      return;
    }

    if (liveStream(VIDEO.remoteStream)) {
      requestAnimationFrame(() => attachRemoteVideo());
      return;
    }

    setVideoStatus(VIDEO.viewerRequestPending ? 'Connexion…' : 'Connexion au flux…', 'pending');
    if (!VIDEO.viewerRequestPending) joinVideoAsViewer(false, false).catch(() => {});
  };

  const baseSetTab = setTab;
  setTab = function(tab) {
    baseSetTab(tab);
    if (tab === 'video') requestAnimationFrame(() => manageVideoState());
  };

  renderVideoTab = function() {
    const d = STATE.sync;
    if (!d) return '';
    const role = d.player.public_role;
    if (!VIDEO_ROLES.has(role)) {
      return `<div class="empty-state">Ton rôle n’a pas accès au flux vidéo.</div>`;
    }

    if (d.room.phase !== 'interrogation') {
      return `<div class="video-panel"><div class="video-policy"><b>Flux réservé aux interrogatoires</b><span>La caméra et le micro ne peuvent être activés que pendant les interrogatoires de 8 minutes.</span></div><div class="waiting-pulse">Flux inactif jusqu’au prochain interrogatoire.</div></div>`;
    }

    const st = videoState();
    const active = !!st.video_active;
    const cut = cutActive();

    if (role === 'enqueteur') {
      return `<div class="video-panel">
        <div class="video-policy"><b>Flux direct · interrogatoire uniquement</b><span>Caméra + micro. Aucun enregistrement, aucun replay. Tu décides quand l’activer pendant ces 8 minutes.</span></div>
        <video id="localVideo" autoplay muted playsinline></video>
        <div id="videoConnectionStatus" class="video-connection-status">${active && !cut ? 'Caméra et micro en direct' : cut ? 'Coupure confidentielle en cours…' : 'Flux arrêté'}</div>
        <div class="tag-row">
          ${active && !cut
            ? `<button class="btn danger small" onclick="stopVideo()">Arrêter</button><button class="btn small" onclick="confidentialCut()">Coupure confidentielle · 60 s</button>`
            : `<button class="btn primary small" onclick="activateVideo()">${cut ? 'Reprendre le flux' : 'Activer caméra + micro'}</button>`}
        </div>
      </div>`;
    }

    return `<div class="video-panel">
      <div class="video-policy"><b>Observation autorisée</b><span>Flux direct de l’Enquêteur pendant l’interrogatoire, avec audio, sans enregistrement.</span></div>
      ${active && !cut
        ? `<video id="remoteVideo" autoplay playsinline controls></video>
           <div id="videoConnectionStatus" class="video-connection-status">Connexion au flux…</div>
           <div class="video-viewer-actions">
             <button class="btn primary block" onclick="joinVideoAsViewer(true,true)">Démarrer / réactiver le flux</button>
             <button id="videoAudioUnlock" class="btn block" onclick="unlockRemoteAudio()">Activer le son</button>
           </div>`
        : `<div class="waiting-pulse">${cut ? 'Coupure confidentielle en cours…' : 'L’Enquêteur n’a pas activé le flux.'}</div>`}
    </div>`;
  };

  const mediaStyle = document.createElement('style');
  mediaStyle.textContent = `
    .video-connection-status{
      margin-top:10px;padding:9px 11px;border:1px solid rgba(255,255,255,.10);
      border-radius:12px;color:var(--muted);font-size:12px
    }
    .video-connection-status[data-kind="ok"]{color:#dfe8e2}
    .video-connection-status[data-kind="error"]{color:#efc2c2}
    .video-viewer-actions{display:grid;gap:8px;margin-top:10px}
    #videoAudioUnlock[hidden]{display:none!important}
    #localVideo,#remoteVideo{background:#07090b}
  `;
  document.head.appendChild(mediaStyle);

  try {
    const communications = RULES.find(r => r.title === '5. Communications');
    if (communications) {
      const idx = communications.items.findIndex(x => x.includes('flux vidéo'));
      if (idx >= 0) {
        communications.items[idx] = 'Pendant chaque interrogatoire de 8 minutes uniquement, l’Enquêteur peut activer quand il le souhaite un flux vidéo + audio en direct pour les rôles autorisés présents, sans enregistrement ni replay.';
      }
    }
  } catch (_) {}

  showAudioWakePrompt = function(label = 'Touchez pour réactiver le son') {
    let el = byId('audioWakePrompt');
    if (!el) {
      el = document.createElement('button');
      el.id = 'audioWakePrompt';
      el.type = 'button';
      el.className = 'audio-wake-prompt';
      const trigger = async e => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        if (el.dataset.busy === '1') return;
        el.dataset.busy = '1';
        try { await activateInGameAudio(); }
        finally { delete el.dataset.busy; }
      };
      if (window.PointerEvent) el.addEventListener('pointerdown', trigger, {passive:false});
      else el.addEventListener('touchstart', trigger, {passive:false});
      el.addEventListener('click', e => { if (e.detail === 0) trigger(e); });
      document.body.appendChild(el);
    }
    el.textContent = label;
    el.classList.add('show');
  };

  const wakeStyle = document.createElement('style');
  wakeStyle.textContent = `
    .audio-wake-prompt{
      z-index:1000!important;min-height:48px!important;
      min-width:min(320px,calc(100vw - 28px));pointer-events:none;
      touch-action:manipulation!important;-webkit-tap-highlight-color:transparent
    }
    .audio-wake-prompt.show{pointer-events:auto!important}
  `;
  document.head.appendChild(wakeStyle);

  renderChannelTab = function() {
    const d = STATE.sync,
      role = d.player.public_role,
      canInv = canInvestigationChannel(role),
      targets = d.players.filter(p => p.id !== d.player.id);

    return `<div class="channel-v11">${canInv ? `<div class="channel-box"><div class="section-title"><h2>Canal Enquête 🔒</h2><span>200 caractères</span></div><div class="message-list">${renderMessages('investigation')}</div><div class="message-compose"><input id="invMsg" maxlength="200" placeholder="Observation courte"><button onclick="sendMessage('investigation')">Envoyer</button></div></div>` : ''}<div class="channel-box"><div class="section-title"><h2>Messages privés</h2><span>tous les joueurs</span></div>${targets.length ? `<div class="field"><label for="privateTarget">Destinataire</label><select id="privateTarget">${targets.map(p => `<option value="${p.id}">${h(p.pseudo)} · ${h(publicRoleLabel(p.public_role))}</option>`).join('')}</select></div><div class="message-list">${renderMessages('private')}</div><div class="message-compose"><input id="privateMsg" maxlength="200" placeholder="Message privé"><button onclick="sendMessage('private')">Envoyer</button></div>` : '<p>Aucun destinataire disponible.</p>'}</div></div>`;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    setTimeout(() => {
      if (STATE.room && phaseAllowsVideo()) manageVideoState();
    }, 250);
  });
})();
