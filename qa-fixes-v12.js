/* Inside Grey Room V12.1 — cross-platform QA fixes
   - stable WebRTC negotiation across iOS/PWA, browsers and Android WebView
   - no replay of stale signaling / no renegotiation storms
   - reliable tappable audio wake control on mobile/PWA
   - private messaging UI between all players
   The 30-second opening countdown is intentionally preserved.
*/
(() => {
  // ---------- VIDEO: one negotiation at a time, with non-trickle ICE ----------
  VIDEO.pendingIce = VIDEO.pendingIce || new Map();
  VIDEO.lastOfferAt = VIDEO.lastOfferAt || new Map();
  VIDEO.lastOfferSdp = VIDEO.lastOfferSdp || new Map();
  VIDEO.lastAnswerSdp = VIDEO.lastAnswerSdp || new Map();
  VIDEO.viewerRetryTimer = VIDEO.viewerRetryTimer || null;
  VIDEO.viewerRetryCount = VIDEO.viewerRetryCount || 0;
  VIDEO.lastViewerRequestAt = VIDEO.lastViewerRequestAt || 0;

  const peerBad = pc => !pc || ['failed', 'closed', 'disconnected'].includes(pc.connectionState) || ['failed', 'closed', 'disconnected'].includes(pc.iceConnectionState);
  const peerBusyOrHealthy = pc => !!pc && !peerBad(pc) && ['new', 'connecting', 'connected'].includes(pc.connectionState);
  const streamLive = stream => !!stream && stream.getTracks().some(t => t.readyState === 'live');

  const attachRemoteVideo = () => {
    const rv = byId('remoteVideo');
    if (!rv || !streamLive(VIDEO.remoteStream)) return;
    rv.muted = true;
    rv.playsInline = true;
    if (rv.srcObject !== VIDEO.remoteStream) rv.srcObject = VIDEO.remoteStream;
    rv.play().catch(() => {});
  };

  const clearViewerRetry = () => {
    if (VIDEO.viewerRetryTimer) clearTimeout(VIDEO.viewerRetryTimer);
    VIDEO.viewerRetryTimer = null;
  };

  const waitForIceGathering = (pc, timeoutMs = 2600) => new Promise(resolve => {
    if (!pc || pc.iceGatheringState === 'complete') return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      pc.removeEventListener?.('icegatheringstatechange', onState);
      resolve();
    };
    const onState = () => { if (pc.iceGatheringState === 'complete') finish(); };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener?.('icegatheringstatechange', onState);
  });

  const queueIce = (remoteId, candidate) => {
    const key = String(remoteId);
    const list = VIDEO.pendingIce.get(key) || [];
    list.push(candidate);
    VIDEO.pendingIce.set(key, list.slice(-24));
  };

  const flushIce = async remoteId => {
    const key = String(remoteId);
    const pc = VIDEO.pcs.get(remoteId);
    if (!pc || !pc.remoteDescription?.type) return;
    const list = VIDEO.pendingIce.get(key) || [];
    VIDEO.pendingIce.delete(key);
    for (const candidate of list) {
      try { await pc.addIceCandidate(candidate); }
      catch (_) { /* old trickle candidate no longer useful after full SDP exchange */ }
    }
  };

  const sendSignal = (to, type, payload = {}) => rpc('igr_v4_signal_send', {
    p_code: STATE.room,
    p_player_token: STATE.token,
    p_to: to,
    p_type: type,
    p_payload: payload
  });

  const baseNewPeer = newPeer;
  newPeer = function(remoteId, isBroadcaster) {
    const pc = baseNewPeer(remoteId, isBroadcaster);

    // New clients send SDP after ICE gathering completes. This removes the
    // offer/answer/ICE race that was repeatedly resetting the stream.
    pc.onicecandidate = null;

    pc.addEventListener?.('track', e => {
      if (isBroadcaster) return;
      VIDEO.remoteStream = e.streams?.[0] || new MediaStream([e.track]);
      VIDEO.viewerRetryCount = 0;
      clearViewerRetry();
      requestAnimationFrame(attachRemoteVideo);
    });

    const watchFailure = () => {
      if (isBroadcaster || !peerBad(pc) || streamLive(VIDEO.remoteStream)) return;
      clearViewerRetry();
      VIDEO.viewerRetryTimer = setTimeout(() => {
        if (!streamLive(VIDEO.remoteStream)) joinVideoAsViewer(true).catch(() => {});
      }, 900);
    };
    pc.addEventListener?.('connectionstatechange', watchFailure);
    pc.addEventListener?.('iceconnectionstatechange', watchFailure);
    return pc;
  };

  handleSignal = async function(signal) {
    const me = STATE.sync?.player;
    if (!me) return;
    const role = me.public_role;
    const from = signal?.from_player_id;
    const type = signal?.signal_type;
    const payload = signal?.payload || {};
    if (!from || !type) return;

    if (type === 'hangup') {
      closePeer(from);
      VIDEO.pendingIce.delete(String(from));
      return;
    }

    // Backward compatibility: old clients can still trickle ICE. New clients
    // normally do not send separate ICE messages anymore.
    if (type === 'ice') {
      const pc = VIDEO.pcs.get(from);
      if (!pc || !pc.remoteDescription?.type) queueIce(from, payload);
      else try { await pc.addIceCandidate(payload); } catch (_) { queueIce(from, payload); }
      return;
    }

    if (type === 'viewer_ready' && role === 'enqueteur') {
      if (!VIDEO.localStream) return;
      const key = String(from);
      const now = Date.now();
      const existing = VIDEO.pcs.get(from);
      const lastOfferAt = VIDEO.lastOfferAt.get(key) || 0;

      // Ignore duplicate viewer_ready messages while the current negotiation is
      // still alive. This was the source of the offer/answer storm.
      if (existing && !peerBad(existing) && now - lastOfferAt < 9000) return;
      if (now - lastOfferAt < 1200) return;

      if (existing) closePeer(from);
      VIDEO.lastOfferAt.set(key, now);
      try {
        const pc = newPeer(from, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc);
        if (VIDEO.pcs.get(from) !== pc || pc.signalingState === 'closed') return;
        const local = pc.localDescription || offer;
        await sendSignal(from, 'offer', {type: local.type, sdp: local.sdp});
      } catch (e) {
        console.error('video offer', e);
        closePeer(from);
      }
      return;
    }

    if (type === 'offer' && role !== 'enqueteur') {
      const key = String(from);
      const existing = VIDEO.pcs.get(from);
      if (payload?.sdp && VIDEO.lastOfferSdp.get(key) === payload.sdp && existing && !peerBad(existing)) return;
      VIDEO.lastOfferSdp.set(key, payload?.sdp || '');
      if (existing) closePeer(from);
      try {
        const pc = newPeer(from, false);
        await pc.setRemoteDescription(payload);
        await flushIce(from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        if (VIDEO.pcs.get(from) !== pc || pc.signalingState === 'closed') return;
        const local = pc.localDescription || answer;
        await sendSignal(from, 'answer', {type: local.type, sdp: local.sdp});
      } catch (e) {
        console.error('video answer', e);
        closePeer(from);
      }
      return;
    }

    if (type === 'answer') {
      const pc = VIDEO.pcs.get(from);
      if (!pc || pc.signalingState === 'closed') return;
      const key = String(from);
      if (payload?.sdp && VIDEO.lastAnswerSdp.get(key) === payload.sdp && pc.remoteDescription?.type) return;
      VIDEO.lastAnswerSdp.set(key, payload?.sdp || '');
      try {
        if (!pc.remoteDescription?.type) await pc.setRemoteDescription(payload);
        await flushIce(from);
      } catch (e) {
        console.error('video remote answer', e);
      }
    }
  };

  const scheduleViewerRetry = enqId => {
    clearViewerRetry();
    VIDEO.viewerRetryTimer = setTimeout(() => {
      if (!STATE.room || !videoState().video_active || streamLive(VIDEO.remoteStream)) return;
      const pc = VIDEO.pcs.get(enqId);
      if (pc && !peerBad(pc) && ['checking', 'connected', 'completed'].includes(pc.iceConnectionState)) {
        scheduleViewerRetry(enqId);
        return;
      }
      if (VIDEO.viewerRetryCount >= 2) {
        toast('Le flux ne répond pas. Touchez « Démarrer / réactiver le flux » pour réessayer.');
        return;
      }
      VIDEO.viewerRetryCount += 1;
      joinVideoAsViewer(true).catch(() => {});
    }, 7000);
  };

  joinVideoAsViewer = async function(force = false) {
    const enq = STATE.sync?.players?.find(p => p.public_role === 'enqueteur');
    if (!enq || !videoState().video_active) return;

    if (!force && streamLive(VIDEO.remoteStream)) {
      attachRemoteVideo();
      return;
    }

    const now = Date.now();
    if (!force && now - VIDEO.lastViewerRequestAt < 5000) return;

    const existing = VIDEO.pcs.get(enq.id);
    if (!force && peerBusyOrHealthy(existing)) return;

    if (force) {
      clearViewerRetry();
      if (VIDEO.remoteStream) {
        try { VIDEO.remoteStream.getTracks().forEach(t => t.stop()); } catch (_) {}
        VIDEO.remoteStream = null;
      }
      if (existing) closePeer(enq.id);
      VIDEO.pendingIce.delete(String(enq.id));
      VIDEO.lastOfferSdp.delete(String(enq.id));
    }

    VIDEO.lastViewerRequestAt = now;
    VIDEO.lastViewerReadyAt = now;
    startSignalPoller();
    try {
      await sendSignal(enq.id, 'viewer_ready', {});
      toast(force ? 'Reconnexion au flux…' : 'Connexion au flux…');
      scheduleViewerRetry(enq.id);
    } catch (e) {
      console.error(e);
      toast('Flux indisponible.');
    }
  };

  const baseManageVideoState = manageVideoState;
  manageVideoState = function(...args) {
    const out = baseManageVideoState.apply(this, args);
    requestAnimationFrame(attachRemoteVideo);
    return out;
  };

  const baseRenderVideoTab = renderVideoTab;
  renderVideoTab = function() {
    const d = STATE.sync;
    if (!d || d.player.public_role === 'enqueteur') return baseRenderVideoTab();
    const st = videoState();
    const active = !!st.video_active;
    const cutUntil = st.video_cut_until ? new Date(st.video_cut_until).getTime() : 0;
    const cut = cutUntil > Date.now();
    if (!canVideo(d.player.public_role)) return `<div class="empty-state">Ton rôle n’a pas accès au flux vidéo.</div>`;
    return `<div class="video-panel"><div class="video-policy"><b>Observation autorisée</b><span>Flux direct de l’Enquêteur, sans enregistrement.</span></div>${active && !cut ? `<video id="remoteVideo" autoplay playsinline muted controls></video><button class="btn primary block" onclick="joinVideoAsViewer(true)">Démarrer / réactiver le flux</button>` : `<div class="waiting-pulse">${cut ? 'Coupure confidentielle en cours…' : 'Flux vidéo inactif.'}</div>`}</div>`;
  };

  // ---------- AUDIO WAKE: make the recovery pill a real direct gesture target ----------
  showAudioWakePrompt = function(label = 'Touchez pour réactiver le son') {
    let el = byId('audioWakePrompt');
    if (!el) {
      el = document.createElement('button');
      el.id = 'audioWakePrompt';
      el.type = 'button';
      el.className = 'audio-wake-prompt';
      const trigger = async e => {
        e?.preventDefault?.();
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

  const style = document.createElement('style');
  style.textContent = `
    .audio-wake-prompt{
      z-index:1000!important;
      min-height:48px!important;
      min-width:min(320px,calc(100vw - 28px));
      pointer-events:none;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent;
    }
    .audio-wake-prompt.show{pointer-events:auto!important}
  `;
  document.head.appendChild(style);

  // ---------- PRIVATE MESSAGES: every player may address every other player ----------
  renderChannelTab = function() {
    const d = STATE.sync,
      role = d.player.public_role,
      canInv = canInvestigationChannel(role),
      targets = d.players.filter(p => p.id !== d.player.id);

    return `<div class="channel-v11">${canInv ? `<div class="channel-box"><div class="section-title"><h2>Canal Enquête 🔒</h2><span>200 caractères</span></div><div class="message-list">${renderMessages('investigation')}</div><div class="message-compose"><input id="invMsg" maxlength="200" placeholder="Observation courte"><button onclick="sendMessage('investigation')">Envoyer</button></div></div>` : ''}<div class="channel-box"><div class="section-title"><h2>Messages privés</h2><span>tous les joueurs</span></div>${targets.length ? `<div class="field"><label for="privateTarget">Destinataire</label><select id="privateTarget">${targets.map(p => `<option value="${p.id}">${h(p.pseudo)} · ${h(publicRoleLabel(p.public_role))}</option>`).join('')}</select></div><div class="message-list">${renderMessages('private')}</div><div class="message-compose"><input id="privateMsg" maxlength="200" placeholder="Message privé"><button onclick="sendMessage('private')">Envoyer</button></div>` : '<p>Aucun destinataire disponible.</p>'}</div></div>`;
  };
})();
