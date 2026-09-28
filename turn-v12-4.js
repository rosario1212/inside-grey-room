/* Inside Grey Room V12.4 — TURN fallback for restrictive NATs
   Pre-release QA fallback only. Uses Metered Open Relay public TURN when no
   managed TURN server is configured. Replace with managed short-lived TURN
   credentials before public store release.
*/
(() => {
  const REV = 'v12.4-turn-fallback-20260928-1';
  const PUBLIC_TURN = {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  };

  const urlsOf = server => Array.isArray(server?.urls) ? server.urls : [server?.urls].filter(Boolean);
  const hasTurn = servers => (servers || []).some(s => urlsOf(s).some(u => /^turns?:/i.test(String(u))));

  const baseNewPeer = newPeer;
  newPeer = function(remoteId, isBroadcaster) {
    const pc = baseNewPeer(remoteId, isBroadcaster);
    try {
      const cfg = pc.getConfiguration ? pc.getConfiguration() : {};
      const existing = Array.isArray(cfg.iceServers) ? cfg.iceServers.slice() : [];
      if (!hasTurn(existing)) {
        cfg.iceServers = [...existing, PUBLIC_TURN];
        cfg.iceTransportPolicy = 'all';
        pc.setConfiguration(cfg);
        if (STATE.room && STATE.token) {
          rpc('igr_v4_video_diag', {
            p_code: STATE.room,
            p_player_token: STATE.token,
            p_stage: `${REV}:turn-fallback-configured`,
            p_payload: {
              rev: REV,
              role: STATE.sync?.player?.public_role || null,
              phase: STATE.sync?.room?.phase || null,
              session: videoState()?.video_session || null,
              broadcaster: !!isBroadcaster
            }
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('TURN fallback configuration failed', e);
    }
    return pc;
  };
})();
