/* Inside Grey Room V12.18 — managed TURN first, public relay fallback.
   Long-lived Cloudflare TURN secrets stay server-side. Clients receive only
   short-lived ICE credentials from /api/turn. */
(() => {
  const REV = 'v701-authorized-managed-turn-20261115';
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
  let authorizedIdentity = '';
  let backoffUntil = 0;
  const identity = () => STATE?.room && STATE?.token ? String(STATE.room)+':'+String(STATE.token) : '';

  const endpoint = () => {
    const native = typeof NATIVE_SHELL !== 'undefined' && NATIVE_SHELL;
    return native ? `${PROD_ORIGIN}/api/turn` : '/api/turn';
  };
  const urlsOf = server => Array.isArray(server?.urls) ? server.urls : [server?.urls].filter(Boolean);
  const hasTurn = servers => (servers || []).some(s => urlsOf(s).some(u => /^turns?:/i.test(String(u))));

  async function refreshManagedTurn(force = false) {
    const session = identity();
    // Never reuse a TURN credential after changing rooms or player identities.
    if (session !== authorizedIdentity) {
      authorizedIdentity = session;
      managedIceServers = [];
      refreshAfter = 0;
      backoffUntil = 0;
      refreshPromise = null;
    }
    if (!session) return [];
    if (!force && managedIceServers.length && Date.now() < refreshAfter) return managedIceServers;
    if (!force && Date.now() < backoffUntil) return [];
    if (refreshPromise) return refreshPromise;
    const room = String(STATE.room), token = String(STATE.token);
    const operation = (async () => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3500);
      try {
        const res = await fetch(endpoint(), {
          method: 'POST',
          headers: {'Content-Type': 'application/json', apikey: SUPABASE_KEY},
          body: JSON.stringify({p_code:room,p_player_token:token}),
          cache: 'no-store', credentials: 'omit', signal: ctl.signal
        });
        if (!res.ok) throw new Error(`TURN endpoint ${res.status}`);
        const data = await res.json();
        const servers = Array.isArray(data?.iceServers) ? data.iceServers.filter(Boolean) : [];
        if (!hasTurn(servers)) throw new Error('Managed TURN response has no relay');
        if (identity() !== session) return [];
        managedIceServers = servers;
        backoffUntil = 0;
        const ttl = Math.max(900, Math.min(Number(data?.ttl) || 3600, 10800));
        refreshAfter = Date.now() + Math.max(10 * 60 * 1000, (ttl - 600) * 1000);
        return managedIceServers;
      } catch (error) {
        if (identity() === session) backoffUntil = Date.now() + 25000;
        throw error;
      } finally {
        clearTimeout(timer);
      }
    })();
    refreshPromise = operation;
    try { return await operation; }
    finally { if (refreshPromise === operation) refreshPromise = null; }
  }

  async function waitForTurn(maxMs = 2800) {
    let timer;
    try {
      await Promise.race([
        refreshManagedTurn(false),
        new Promise(resolve => { timer = setTimeout(resolve, maxMs); })
      ]);
    } catch (_) {}
    finally { if (timer) clearTimeout(timer); }
  }

  // TURN credentials are unnecessary on the home screen or in text-only rooms.
  // Request them only from a real video action. This avoids issuing billable
  // relay credentials for every page visit and reduces network activity on iOS.
  // startVideo/joinVideoAsViewer below still await the managed provider before
  // creating a peer, with the existing public fallback preserved.

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

  // The canonical investigator entrypoint is activateVideo(), not startVideo().
  // The old lazy TURN patch omitted this hook, leaving iPhones using only the
  // public fallback during their first live broadcast.
  if (typeof activateVideo === 'function') {
    const baseActivateVideo = activateVideo;
    activateVideo = async function(...args) {
      await waitForTurn();
      return baseActivateVideo.apply(this,args);
    };
  }

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
