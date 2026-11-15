// Public web version: no invitation passcode or authentication cookie.
// Keep TURN credentials server-side and restrict browser origins.
const PROD_ORIGIN='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const NATIVE=new Set(['https://insidegreyroom.local','http://insidegreyroom.local','capacitor://localhost','http://localhost','https://localhost','null']);
const ORIGINS=new Set([PROD_ORIGIN,...NATIVE]);
function corsHeaders(req){
 const origin=req.headers.get('Origin');
 return {'Access-Control-Allow-Origin':!origin||ORIGINS.has(origin)?origin||PROD_ORIGIN:'',
  'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, apikey',
  'Cache-Control':'private, no-store, max-age=0','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
}
function json(req,value,status=200){return new Response(JSON.stringify(value),{status,headers:corsHeaders(req)})}
async function turn(req,env){
 const origin=req.headers.get('Origin');
 if(origin&&!ORIGINS.has(origin))return json(req,{error:'origin_not_allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(req)});
 // GET used to mint anonymous credentials. Retire it rather than trusting
 // client-supplied Origin headers as an authentication mechanism.
 if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
 if(!(req.headers.get('Content-Type')||'').startsWith('application/json'))
   return json(req,{error:'json_required'},415);
 if(+(req.headers.get('Content-Length')||0)>768)
   return json(req,{error:'request_too_large'},413);
 const apiKey=req.headers.get('apikey')||'';
 if(apiKey.length>512 || !/^(?:sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(apiKey))
   return json(req,{error:'authorization_required'},401);
 let body='',payload;
 try{
  const reader=req.body?.getReader();
  if(!reader)return json(req,{error:'invalid_request'},400);
  const decoder=new TextDecoder();let bytes=0;
  while(true){
   const part=await reader.read();if(part.done)break;
   bytes+=part.value.byteLength;
   if(bytes>768){await reader.cancel();return json(req,{error:'request_too_large'},413)}
   body+=decoder.decode(part.value,{stream:true});
  }
  body+=decoder.decode();
  payload=JSON.parse(body);
 }catch{return json(req,{error:'invalid_request'},400)}
 const pCode=String(payload?.p_code||'').trim().toUpperCase();
 const pToken=String(payload?.p_player_token||'').trim();
 if(!/^[A-Z0-9]{5}$/.test(pCode)||!/^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(pToken))
   return json(req,{error:'authorization_required'},401);
 if(!env.CF_TURN_KEY_ID||!env.CF_TURN_KEY_TOKEN)
   return json(req,{error:'turn_not_configured'},503);

 try{
  // A fixed, non-redirecting endpoint checks the player's actual room token,
  // current interrogation phase and role before a TURN credential is issued.
  // Never forward the player's capability to the TURN provider.
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),2900);
  let authorized;
  try{
   authorized=await fetch('https://jtasbdiguhiswoyvobkn.supabase.co/rest/v1/rpc/igr_v701_turn_authorize',{
    method:'POST',
    headers:{'apikey':apiKey,'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({p_code:pCode,p_player_token:pToken}),
    redirect:'manual',signal:ctl.signal
   });
  }finally{clearTimeout(timer)}
  if(authorized.status>=300&&authorized.status<400)
    return json(req,{error:'turn_authorization_unavailable'},503);
  if(!authorized.ok){
   if(authorized.status===429)return json(req,{error:'turn_rate_limited'},429);
   // PostgREST may surface application rate limiting as P0001 / HTTP 400.
   const issue=await authorized.json().catch(()=>({}));
   if(issue?.message==='rate_limited')return json(req,{error:'turn_rate_limited'},429);
   return json(req,{error:authorized.status>=500?'turn_authorization_unavailable':'not_authorized'},
     authorized.status>=500?503:403);
  }
  if(await authorized.json().catch(()=>false)!==true)
    return json(req,{error:'not_authorized'},403);

  const upstream=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+encodeURIComponent(env.CF_TURN_KEY_ID)+'/credentials/generate-ice-servers',{
   method:'POST',
   headers:{Authorization:'Bearer '+env.CF_TURN_KEY_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify({ttl:10800}),redirect:'manual'
  });
  if(upstream.status>=300&&upstream.status<400)return json(req,{error:'turn_upstream_failed'},502);
  const ice=await upstream.json().catch(()=>({}));
  if(!upstream.ok||!Array.isArray(ice?.iceServers)||!ice.iceServers.length)
    return json(req,{error:'turn_upstream_failed'},502);
  return json(req,{iceServers:ice.iceServers,ttl:10800});
 }catch(_){return json(req,{error:'turn_unavailable'},502)}
}
// The proxy is public; room membership and host entitlements are checked by
// the authoritative service. No shared website passcode is sent upstream.
async function casino(req){
 const origin=req.headers.get('Origin');
 const allowed=!origin||origin===new URL(req.url).origin||NATIVE.has(origin);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(allowed&&origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
 const error=(code,status)=>new Response(JSON.stringify({error:code}),{status,headers});
 if(!allowed)return error('origin_forbidden',403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return error('method_not_allowed',405);
 if(!(req.headers.get('Content-Type')||'').startsWith('application/json'))return error('json_required',415);
 if(+(req.headers.get('Content-Length')||0)>16384)return error('request_too_large',413);
 try{
  const reader=req.body?.getReader();if(!reader)return error('invalid_request',400);
  const decoder=new TextDecoder();let body='',bytes=0;
  while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;
   if(bytes>16384){await reader.cancel();return error('request_too_large',413)}body+=decoder.decode(part.value,{stream:true});}
  body+=decoder.decode();
  const upstream=await fetch('https://jtasbdiguhiswoyvobkn.supabase.co/functions/v1/casino-runtime',{
   method:'POST',headers:{'Content-Type':'application/json'},body,redirect:'manual'});
  // Workerd accepts manual/follow. Never follow a redirect carrying a player's
  // capability to a different origin, or forward its Location to the browser.
  if(upstream.status>=300&&upstream.status<400)return error('casino_service_unavailable',503);
  return new Response(upstream.body,{status:upstream.status,headers});
 }catch{return error('casino_service_unavailable',503)}
}
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(url.pathname==='/api/turn')return turn(req,env);
  if(url.pathname==='/api/casino')return casino(req);
  // Existing bookmarks for the old private gate now lead straight to the game.
  if(url.pathname==='/__igr-private')return Response.redirect(new URL('/',url),302);
  // Versioned HTML avoids stale cached home pages after a successful Worker deployment.
  const shellPath=url.pathname==='/'||url.pathname==='/index.html'
    ?'/index-latest-release.txt'
    :url.pathname==='/en.html' ?'/en-latest-release.txt' : null;
  const assetRequest=shellPath?new Request(new URL(shellPath,url).toString(),req):req;
  const asset=await env.ASSETS.fetch(assetRequest);
  const headers=new Headers(asset.headers);
  if(shellPath)headers.set('Content-Type','text/html; charset=utf-8');
  if(shellPath)headers.set('Cache-Control','no-store, max-age=0');
  else if(/^\/igr-v702-(?:js|css)-[a-f0-9]{16}\.(?:js|css)$/.test(url.pathname))
    headers.set('Cache-Control','public, max-age=31536000, immutable');
  else if(/\.(?:js|css|html|json)$/.test(url.pathname)||url.pathname==='/')headers.set('Cache-Control','no-cache');
  // Opaque release marker; narrative and variant IDs remain server-side.
  headers.set('X-IGR-Release','igr-003-008-009-011-secure-20261025');
  headers.set('X-Content-Type-Options','nosniff');
  // Deny embedding private role cards in third-party frames.
  headers.set('X-Frame-Options','DENY');
  headers.set('Content-Security-Policy',"frame-ancestors 'none'");
  headers.set('Referrer-Policy','no-referrer');
  // Public URL, but do not index the unfinished beta in search engines.
  headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
 }
};
