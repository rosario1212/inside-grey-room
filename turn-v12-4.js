/* Inside Grey Room V12.18 — managed TURN first, public relay fallback.
   Long-lived Cloudflare TURN secrets stay server-side. Clients receive only
   short-lived ICE credentials from /api/turn. */
(() => {
  const REV = 'v12.18-managed-turn-20260929-1';
  const PROD_ORIGIN = 'https://inside-grey-room-last.alial-khafaji2002.workers.dev';
  const PUBLIC_FALLBACK = {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
      'turns:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  };

  let managedIceServers = [];
  let refreshPromise = null;
  let refreshAfter = 0;

  const endpoint = () => {
    const native = typeof NATIVE_SHELL !== 'undefined' && NATIVE_SHELL;
    return native ? `${PROD_ORIGIN}/api/turn` : '/api/turn';
  };
  const urlsOf = server => Array.isArray(server?.urls) ? server.urls : [server?.urls].filter(Boolean);
  const hasTurn = servers => (servers || []).some(s => urlsOf(s).some(u => /^turns?:/i.test(String(u))));

  async function refreshManagedTurn(force = false) {
    if (!force && managedIceServers.length && Date.now() < refreshAfter) return managedIceServers;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3500);
      try {
        const res = await fetch(endpoint(), { cache: 'no-store', credentials: 'omit', signal: ctl.signal });
        if (!res.ok) throw new Error(`TURN endpoint ${res.status}`);
        const data = await res.json();
        const servers = Array.isArray(data?.iceServers) ? data.iceServers.filter(Boolean) : [];
        if (!hasTurn(servers)) throw new Error('Managed TURN response has no relay');
        managedIceServers = servers;
        const ttl = Math.max(900, Math.min(Number(data?.ttl) || 3600, 10800));
        refreshAfter = Date.now() + Math.max(10 * 60 * 1000, (ttl - 600) * 1000);
        return managedIceServers;
      } finally {
        clearTimeout(timer);
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  async function waitForTurn(maxMs = 2800) {
    try {
      await Promise.race([
        refreshManagedTurn(false),
        new Promise(resolve => setTimeout(resolve, maxMs))
      ]);
    } catch (_) {}
  }

  void refreshManagedTurn(false).catch(() => {});

  const baseNewPeer = newPeer;
  newPeer = function(remoteId, isBroadcaster) {
    const pc = baseNewPeer(remoteId, isBroadcaster);
    try {
      const cfg = pc.getConfiguration ? pc.getConfiguration() : {};
      const existing = Array.isArray(cfg.iceServers) ? cfg.iceServers.slice() : [];
      const relay = hasTurn(managedIceServers) ? managedIceServers : [PUBLIC_FALLBACK];
      cfg.iceServers = [...existing.filter(s => !urlsOf(s).some(u => /openrelay\.metered\.ca/i.test(String(u)))), ...relay];
      cfg.iceTransportPolicy = 'all';
      pc.setConfiguration(cfg);
      if (STATE.room && STATE.token) {
        rpc('igr_v4_video_diag', {
          p_code: STATE.room,
          p_player_token: STATE.token,
          p_stage: `${REV}:${hasTurn(managedIceServers) ? 'managed-turn' : 'public-turn-fallback'}`,
          p_payload: {
            rev: REV,
            role: STATE.sync?.player?.public_role || null,
            phase: STATE.sync?.room?.phase || null,
            session: videoState()?.video_session || null,
            broadcaster: !!isBroadcaster
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('TURN configuration failed', e);
    }
    return pc;
  };

  if (typeof startVideo === 'function') {
    const baseStartVideo = startVideo;
    startVideo = async function(...args) {
      await waitForTurn();
      return baseStartVideo.apply(this, args);
    };
  }

  if (typeof joinVideoAsViewer === 'function') {
    const baseJoinVideoAsViewer = joinVideoAsViewer;
    joinVideoAsViewer = async function(...args) {
      await waitForTurn();
      return baseJoinVideoAsViewer.apply(this, args);
    };
  }

  window.igrRefreshManagedTurn = () => refreshManagedTurn(true);
})();
