// Public web version: no invitation passcode or authentication cookie.
// Keep TURN credentials server-side and restrict browser origins.
const PROD_ORIGIN='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const NATIVE=new Set(['https://insidegreyroom.local','http://insidegreyroom.local','capacitor://localhost','http://localhost','https://localhost','null']);
const ORIGINS=new Set([PROD_ORIGIN,...NATIVE]);
function corsHeaders(req){
 const origin=req.headers.get('Origin');
 return {'Access-Control-Allow-Origin':!origin||ORIGINS.has(origin)?origin||PROD_ORIGIN:'',
  'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store, max-age=0','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
}
function json(req,value,status=200){return new Response(JSON.stringify(value),{status,headers:corsHeaders(req)})}
async function turn(req,env){
 const origin=req.headers.get('Origin');
 if(origin&&!ORIGINS.has(origin))return json(req,{error:'origin_not_allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(req)});
 if(req.method!=='GET')return json(req,{error:'method_not_allowed'},405);
 // Public web access: retain origin and method checks; TURN secrets remain server-side.
 if(!env.CF_TURN_KEY_ID||!env.CF_TURN_KEY_TOKEN)return json(req,{error:'turn_not_configured'},503);
 try{
  const upstream=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+encodeURIComponent(env.CF_TURN_KEY_ID)+'/credentials/generate-ice-servers',{method:'POST',headers:{Authorization:'Bearer '+env.CF_TURN_KEY_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({ttl:10800})});
  const payload=await upstream.json().catch(()=>({}));
  if(!upstream.ok||!Array.isArray(payload?.iceServers)||!payload.iceServers.length)return json(req,{error:'turn_upstream_failed'},502);
  return json(req,{iceServers:payload.iceServers,ttl:10800});
 }catch(_){return json(req,{error:'turn_unavailable'},502)}
}
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(url.pathname==='/api/turn')return turn(req,env);
  // Existing bookmarks for the old private gate now lead straight to the game.
  if(url.pathname==='/__igr-private')return Response.redirect(new URL('/',url),302);
  const asset=await env.ASSETS.fetch(req);
  const headers=new Headers(asset.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','no-referrer');
  // Public URL, but do not index the unfinished beta in search engines.
  headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
 }
};
