/* Inside Grey Room V12.1 — focused QA fixes
   - robust WebRTC ICE handling + viewer recovery
   - reliable tappable audio wake control on mobile/PWA
   - private messaging UI between all players
   The 30-second opening countdown is intentionally preserved.
*/
(() => {
  // ---------- VIDEO: queue ICE candidates until the remote SDP exists ----------
  VIDEO.pendingIce = VIDEO.pendingIce || new Map();

  const queueIce = (remoteId, candidate) => {
    const key = String(remoteId);
    const list = VIDEO.pendingIce.get(key) || [];
    list.push(candidate);
    VIDEO.pendingIce.set(key, list.slice(-32));
  };

  const flushIce = async remoteId => {
    const key = String(remoteId);
    const pc = VIDEO.pcs.get(remoteId);
    if (!pc || !pc.remoteDescription?.type) return;
    const list = VIDEO.pendingIce.get(key) || [];
    VIDEO.pendingIce.delete(key);
    for (const candidate of list) {
      try { await pc.addIceCandidate(candidate); }
      catch (_) { queueIce(remoteId, candidate); }
    }
  };

  const baseHandleSignal = handleSignal;
  handleSignal = async function(signal) {
    const from = signal?.from_player_id;
    const type = signal?.signal_type;
    const payload = signal?.payload || {};

    if (type === 'ice') {
      const pc = VIDEO.pcs.get(from);
      if (!pc || !pc.remoteDescription?.type) {
        queueIce(from, payload);
        return;
      }
      try { await pc.addIceCandidate(payload); }
      catch (_) { queueIce(from, payload); }
      return;
    }

    await baseHandleSignal(signal);
    if (type === 'offer' || type === 'answer') await flushIce(from);
  };

  const baseJoinVideoAsViewer = joinVideoAsViewer;
  joinVideoAsViewer = async function() {
    const enq = STATE.sync?.players?.find(p => p.public_role === 'enqueteur');
    if (!enq) return;

    const existing = VIDEO.pcs.get(enq.id);
    if (existing && ['failed', 'closed', 'disconnected'].includes(existing.connectionState)) closePeer(enq.id);

    VIDEO.lastViewerReadyAt = Date.now();
    startSignalPoller();
    try {
      await rpc('igr_v4_signal_send', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_to: enq.id,
        p_type: 'viewer_ready',
        p_payload: {}
      });
      toast('Connexion au flux…');

      // One controlled retry if no track arrives. This avoids leaving Safari/iOS
      // or Android WebView stuck after an SDP/ICE race without creating a loop.
      setTimeout(async () => {
        if (!STATE.room || !videoState().video_active || VIDEO.remoteStream) return;
        const pc = VIDEO.pcs.get(enq.id);
        if (pc && ['connected', 'connecting'].includes(pc.connectionState)) return;
        try {
          await rpc('igr_v4_signal_send', {
            p_code: STATE.room,
            p_player_token: STATE.token,
            p_to: enq.id,
            p_type: 'viewer_ready',
            p_payload: {}
          });
        } catch (_) {}
      }, 2600);
    } catch (e) {
      console.error(e);
      toast('Flux indisponible.');
    }
  };

  const baseManageVideoState = manageVideoState;
  manageVideoState = function(...args) {
    const out = baseManageVideoState.apply(this, args);
    requestAnimationFrame(() => {
      const rv = byId('remoteVideo');
      if (!rv) return;
      // Muted autoplay lets the picture appear reliably on iOS/PWA and Android.
      // The viewer can then unmute from the native video controls.
      rv.muted = true;
      rv.playsInline = true;
      if (VIDEO.remoteStream && rv.srcObject !== VIDEO.remoteStream) rv.srcObject = VIDEO.remoteStream;
      if (VIDEO.remoteStream) rv.play().catch(() => {});
    });
    return out;
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
