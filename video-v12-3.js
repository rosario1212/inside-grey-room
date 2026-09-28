/* Inside Grey Room V12.3 — receiver video interop + diagnostics
   Focus: iPhone investigator -> browser/PWA/Android observers.
   - prefer VP8 when both browser stacks expose it (avoids H264 black-frame interop cases)
   - distinguish "audio track alive" from "video frames actually rendering"
   - retry a connected-but-black receiver instead of treating audio-only as success
   - collect privacy-minimal WebRTC stats server-side for QA (no IP addresses, no media)
*/
(() => {
  const REV = 'v12.3-video-vp8-health-20260928-1';
  const OBSERVER_ROLES = new Set(['analyste','procureur','juge','inspecteur']);

  VIDEO.videoHealthTimers = VIDEO.videoHealthTimers || new Map();
  VIDEO.videoHealthRetries = VIDEO.videoHealthRetries || 0;
  VIDEO.videoDiagSeen = VIDEO.videoDiagSeen || new Set();

  const interrogationActive = () =>
    STATE.sync?.room?.status === 'playing' &&
    STATE.sync?.room?.phase === 'interrogation' &&
    !!videoState()?.video_active &&
    !!videoState()?.video_session;

  const liveVideoTrack = () =>
    VIDEO.remoteStream?.getVideoTracks?.().find(t => t.readyState === 'live') || null;

  const liveAudioTrack = () =>
    VIDEO.remoteStream?.getAudioTracks?.().find(t => t.readyState === 'live') || null;

  const remoteVideoLooksRenderable = () => {
    const rv = byId('remoteVideo');
    const vt = liveVideoTrack();
    if (!vt || !rv) return false;
    return !vt.muted && rv.readyState >= 2 && rv.videoWidth > 0 && rv.videoHeight > 0;
  };

  const clearHealthTimers = (remoteId = null) => {
    const clearList = timers => (timers || []).forEach(t => clearTimeout(t));
    if (remoteId == null) {
      for (const timers of VIDEO.videoHealthTimers.values()) clearList(timers);
      VIDEO.videoHealthTimers.clear();
      return;
    }
    const key = String(remoteId);
    clearList(VIDEO.videoHealthTimers.get(key));
    VIDEO.videoHealthTimers.delete(key);
  };

  const compactStats = async pc => {
    const out = {
      connectionState: pc?.connectionState || null,
      iceConnectionState: pc?.iceConnectionState || null,
      iceGatheringState: pc?.iceGatheringState || null,
      signalingState: pc?.signalingState || null,
      remoteVideoTrack: null,
      remoteAudioTrack: null,
      inboundVideo: null,
      inboundAudio: null,
      outboundVideo: null,
      candidatePair: null,
      codec: null,
      element: null
    };
    try {
      const rv = byId('remoteVideo');
      if (rv) out.element = {
        readyState: rv.readyState,
        paused: rv.paused,
        videoWidth: rv.videoWidth,
        videoHeight: rv.videoHeight,
        muted: rv.muted
      };
      const vt = liveVideoTrack();
      const at = liveAudioTrack();
      if (vt) out.remoteVideoTrack = {readyState:vt.readyState, muted:vt.muted, enabled:vt.enabled};
      if (at) out.remoteAudioTrack = {readyState:at.readyState, muted:at.muted, enabled:at.enabled};
      if (!pc?.getStats) return out;
      const stats = await pc.getStats();
      let pair = null;
      let transport = null;
      stats.forEach(s => {
        if (s.type === 'transport' && s.selectedCandidatePairId) transport = s;
        const media = s.kind || s.mediaType;
        if (s.type === 'inbound-rtp' && !s.isRemote && media === 'video') {
          out.inboundVideo = {
            bytesReceived:Number(s.bytesReceived||0), packetsReceived:Number(s.packetsReceived||0),
            packetsLost:Number(s.packetsLost||0), framesReceived:Number(s.framesReceived||0),
            framesDecoded:Number(s.framesDecoded||0), keyFramesDecoded:Number(s.keyFramesDecoded||0),
            frameWidth:Number(s.frameWidth||0), frameHeight:Number(s.frameHeight||0), codecId:s.codecId||null
          };
        }
        if (s.type === 'inbound-rtp' && !s.isRemote && media === 'audio') {
          out.inboundAudio = {bytesReceived:Number(s.bytesReceived||0), packetsReceived:Number(s.packetsReceived||0), packetsLost:Number(s.packetsLost||0)};
        }
        if (s.type === 'outbound-rtp' && !s.isRemote && media === 'video') {
          out.outboundVideo = {
            bytesSent:Number(s.bytesSent||0), packetsSent:Number(s.packetsSent||0),
            framesEncoded:Number(s.framesEncoded||0), keyFramesEncoded:Number(s.keyFramesEncoded||0),
            frameWidth:Number(s.frameWidth||0), frameHeight:Number(s.frameHeight||0), codecId:s.codecId||null
          };
        }
      });
      if (transport?.selectedCandidatePairId) pair = stats.get(transport.selectedCandidatePairId);
      if (!pair) {
        stats.forEach(s => {
          if (!pair && s.type === 'candidate-pair' && s.state === 'succeeded' && (s.nominated || s.selected)) pair = s;
        });
      }
      if (pair) {
        const lc = stats.get(pair.localCandidateId);
        const rc = stats.get(pair.remoteCandidateId);
        out.candidatePair = {
          state:pair.state||null, nominated:!!pair.nominated,
          localType:lc?.candidateType||null, remoteType:rc?.candidateType||null,
          protocol:lc?.protocol||rc?.protocol||null,
          bytesSent:Number(pair.bytesSent||0), bytesReceived:Number(pair.bytesReceived||0),
          currentRoundTripTime:Number(pair.currentRoundTripTime||0)
        };
      }
      const codecId = out.inboundVideo?.codecId || out.outboundVideo?.codecId;
      const codec = codecId ? stats.get(codecId) : null;
      if (codec) out.codec = {mimeType:codec.mimeType||null, clockRate:codec.clockRate||null, sdpFmtpLine:codec.sdpFmtpLine||null};
    } catch (_) {}
    return out;
  };

  const reportDiag = async (stage, pc = null, extra = {}) => {
    if (!STATE.room || !STATE.token) return;
    try {
      const stats = pc ? await compactStats(pc) : {};
      await rpc('igr_v4_video_diag', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_stage: `${REV}:${stage}`,
        p_payload: {
          rev: REV,
          phase: STATE.sync?.room?.phase || null,
          role: STATE.sync?.player?.public_role || null,
          session: videoState()?.video_session || null,
          ...stats,
          ...extra
        }
      });
    } catch (_) {}
  };

  const preferVp8 = pc => {
    try {
      const caps = globalThis.RTCRtpSender?.getCapabilities?.('video') || globalThis.RTCRtpReceiver?.getCapabilities?.('video');
      const vp8 = (caps?.codecs || []).filter(c => String(c.mimeType||'').toLowerCase() === 'video/vp8');
      if (!vp8.length) return false;
      let applied = false;
      for (const tr of pc.getTransceivers?.() || []) {
        const isVideo = tr.sender?.track?.kind === 'video' || tr.receiver?.track?.kind === 'video';
        if (!isVideo || typeof tr.setCodecPreferences !== 'function') continue;
        tr.setCodecPreferences(vp8);
        applied = true;
      }
      return applied;
    } catch (_) { return false; }
  };

  const nudgeRemotePlayback = async () => {
    const rv = byId('remoteVideo');
    const stream = VIDEO.remoteStream;
    const vt = liveVideoTrack();
    if (!rv || !stream || !vt) return false;
    try { vt.enabled = true; } catch (_) {}
    rv.playsInline = true;
    rv.autoplay = true;
    if (rv.srcObject !== stream) rv.srcObject = stream;
    if (!VIDEO.viewerAudioUnlocked) rv.muted = true;
    try { await rv.play(); } catch (_) {
      rv.muted = true;
      try { await rv.play(); } catch (_) {}
    }
    return true;
  };

  const videoHasDecodedFrames = async pc => {
    if (remoteVideoLooksRenderable()) return true;
    const s = await compactStats(pc);
    const v = s.inboundVideo;
    if (!v) return false;
    if (Number(v.framesDecoded||0) > 0 && Number(v.frameWidth||0) > 0) return true;
    return remoteVideoLooksRenderable();
  };

  const scheduleVideoHealth = (remoteId, pc) => {
    const key = String(remoteId);
    clearHealthTimers(remoteId);
    const timers = [];

    const probe = delay => setTimeout(async () => {
      if (!interrogationActive() || VIDEO.pcs.get(remoteId) !== pc) return;
      await nudgeRemotePlayback();
      const good = await videoHasDecodedFrames(pc);
      await reportDiag(good ? `viewer-video-ok-${delay}` : `viewer-video-black-${delay}`, pc);
      if (good) {
        VIDEO.videoHealthRetries = 0;
        clearHealthTimers(remoteId);
        const status = byId('videoConnectionStatus');
        if (status) { status.textContent = VIDEO.viewerAudioUnlocked ? 'Flux vidéo en direct · son actif' : 'Flux vidéo en direct'; status.dataset.kind='ok'; }
        return;
      }
      if (delay < 5500) return;
      if (VIDEO.videoHealthRetries >= 2) {
        const status = byId('videoConnectionStatus');
        if (status) { status.textContent='Vidéo non reçue · reconnexion nécessaire'; status.dataset.kind='error'; }
        return;
      }
      VIDEO.videoHealthRetries += 1;
      clearHealthTimers(remoteId);
      try { await joinVideoAsViewer(true, false); } catch (_) {}
    }, delay);

    timers.push(probe(1800), probe(5500), probe(9000));
    VIDEO.videoHealthTimers.set(key, timers);
  };

  const baseNewPeer = newPeer;
  newPeer = function(remoteId, isBroadcaster) {
    const pc = baseNewPeer(remoteId, isBroadcaster);
    const vp8Applied = preferVp8(pc);
    reportDiag(isBroadcaster ? 'broadcaster-peer-created' : 'viewer-peer-created', pc, {vp8Applied}).catch(()=>{});

    const previousOnTrack = pc.ontrack;
    pc.ontrack = e => {
      if (typeof previousOnTrack === 'function') previousOnTrack.call(pc, e);
      if (isBroadcaster) return;
      const track = e.track;
      if (track?.kind === 'video') {
        track.onunmute = () => {
          nudgeRemotePlayback().catch(()=>{});
          reportDiag('viewer-video-unmuted', pc).catch(()=>{});
        };
        scheduleVideoHealth(remoteId, pc);
      } else if (track?.kind === 'audio') {
        reportDiag('viewer-audio-track', pc).catch(()=>{});
        setTimeout(() => {
          if (VIDEO.pcs.get(remoteId) === pc && !liveVideoTrack()) scheduleVideoHealth(remoteId, pc);
        }, 1200);
      }
    };

    let lastState = '';
    const stateReport = () => {
      const state = `${pc.connectionState}/${pc.iceConnectionState}`;
      if (state === lastState) return;
      lastState = state;
      reportDiag(`peer-state-${state}`, pc).catch(()=>{});
    };
    pc.addEventListener?.('connectionstatechange', stateReport);
    pc.addEventListener?.('iceconnectionstatechange', stateReport);

    setTimeout(() => {
      if (VIDEO.pcs.get(remoteId) === pc) reportDiag(isBroadcaster ? 'broadcaster-stats-4s' : 'viewer-stats-4s', pc).catch(()=>{});
    }, 4000);

    return pc;
  };

  const baseJoinViewer = joinVideoAsViewer;
  joinVideoAsViewer = async function(force = false, fromUser = true) {
    if (!interrogationActive()) {
      if (fromUser) toast('Le flux est disponible uniquement pendant un interrogatoire actif.');
      return;
    }
    const enq = STATE.sync?.players?.find(p => p.public_role === 'enqueteur');
    if (!enq) return;

    if (fromUser) VIDEO.videoHealthRetries = 0;

    const audioOnly = !!liveAudioTrack() && !remoteVideoLooksRenderable();
    if (audioOnly && !force) force = true;

    if (force) clearHealthTimers(enq.id);
    const result = await baseJoinViewer(force, fromUser);
    setTimeout(() => {
      const pc = VIDEO.pcs.get(enq.id);
      if (pc && !remoteVideoLooksRenderable()) scheduleVideoHealth(enq.id, pc);
    }, 1300);
    return result;
  };

  const baseManageVideoState = manageVideoState;
  manageVideoState = function(...args) {
    const result = baseManageVideoState.apply(this, args);
    const role = STATE.sync?.player?.public_role;
    if (!OBSERVER_ROLES.has(role) || !interrogationActive()) {
      clearHealthTimers();
      return result;
    }

    const enq = STATE.sync?.players?.find(p => p.public_role === 'enqueteur');
    if (!enq) return result;
    const pc = VIDEO.pcs.get(enq.id);
    if (pc && !remoteVideoLooksRenderable()) scheduleVideoHealth(enq.id, pc);
    if (remoteVideoLooksRenderable()) nudgeRemotePlayback().catch(()=>{});
    return result;
  };

  const baseStopLocalCapture = stopLocalCapture;
  stopLocalCapture = function(...args) {
    clearHealthTimers();
    VIDEO.videoHealthRetries = 0;
    return baseStopLocalCapture.apply(this, args);
  };
})();
