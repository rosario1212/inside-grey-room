const PROD_ORIGIN = 'https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const ALLOWED_ORIGINS = new Set([
  PROD_ORIGIN,
  'https://insidegreyroom.local',
  'http://insidegreyroom.local',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'null'
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allow = !origin || ALLOWED_ORIGINS.has(origin) ? (origin || PROD_ORIGIN) : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin'
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/turn') {
      const origin = request.headers.get('Origin');
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: 'origin_not_allowed' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
      if (request.method !== 'GET') return json(request, { error: 'method_not_allowed' }, 405);
      if (!env.CF_TURN_KEY_ID || !env.CF_TURN_KEY_TOKEN) return json(request, { error: 'turn_not_configured' }, 503);

      try {
        const upstream = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.CF_TURN_KEY_ID)}/credentials/generate-ice-servers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CF_TURN_KEY_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ttl: 10800 })
        });
        const payload = await upstream.json().catch(() => ({}));
        if (!upstream.ok || !Array.isArray(payload?.iceServers) || !payload.iceServers.length) {
          return json(request, { error: 'turn_upstream_failed' }, 502);
        }
        return json(request, { iceServers: payload.iceServers, ttl: 10800 }, 200);
      } catch (error) {
        return json(request, { error: 'turn_unavailable' }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
