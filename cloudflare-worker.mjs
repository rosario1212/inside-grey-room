// Private gate: only the SHA-256 verifier, never the private 192-bit code, is in GitHub.
const PROD_ORIGIN='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const ACCESS_VERIFIER = '2fff1181a22a47ce8a64091e7cbb8b10db6fd23a2e5cef451d69364dc8b33d3d';
const COOKIE='igr_private_access',GATE='/__igr-private';
const NATIVE=new Set(['https://insidegreyroom.local','http://insidegreyroom.local','capacitor://localhost','http://localhost','https://localhost','null']);
const ORIGINS=new Set([PROD_ORIGIN,...NATIVE]);
const PRIVATE_HEADERS={
 'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin',
 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};
function corsHeaders(req){
 const origin=req.headers.get('Origin');
 return {'Access-Control-Allow-Origin':!origin||ORIGINS.has(origin)?origin||PROD_ORIGIN:'',
  'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store, max-age=0','Content-Type':'application/json; charset=utf-8','Vary':'Origin'};
}
function json(req,value,status=200){return new Response(JSON.stringify(value),{status,headers:corsHeaders(req)})}
async function validCode(code){
 if(typeof code!=='string'||code.length<28||code.length>120)return false;
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code)));
 const actual=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 let diff=0;for(let i=0;i<64;i++)diff|=actual.charCodeAt(i)^ACCESS_VERIFIER.charCodeAt(i);
 return diff===0;
}
function fromCookie(req){
 for(const part of (req.headers.get('Cookie')||'').split(';')){
  const [key,...value]=part.trim().split('=');
  if(key===COOKIE&&value.length===1&&/^[\w-]{28,120}$/.test(value[0]))return value[0];
 }
 return '';
}
function gatePage(error=false){
 const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><title>Accès privé · Inside Grey Room</title><style>'
 +':root{color-scheme:dark;font-family:system-ui,-apple-system,sans-serif;background:#050708;color:#edf0f2}*{box-sizing:border-box}body{min-height:100svh;display:grid;place-items:center;margin:0;padding:24px;background:radial-gradient(ellipse at 50% 10%,#20262d 0,#0a0d11 48%,#050708 82%)}main{width:min(100%,430px);padding:clamp(26px,6vw,42px);border:1px solid #35404a;background:linear-gradient(145deg,#161c22,#080b0f);box-shadow:0 18px 65px #000a;border-radius:22px}mark{display:inline-block;font-size:11px;letter-spacing:.22em;font-weight:750;background:none;color:#9baab6;text-transform:uppercase}h1{font-size:clamp(30px,7vw,42px);line-height:.99;letter-spacing:-.06em;margin:25px 0 14px}p{line-height:1.6;color:#b3bec8;font-size:14px;margin:0 0 26px}label{display:block;font-size:12px;font-weight:700;margin-bottom:10px}input{width:100%;min-height:50px;border:1px solid #53606c;border-radius:11px;padding:12px 13px;background:#070b0f;color:#f7f9fa;font:600 16px ui-monospace,monospace}button{margin-top:17px;min-height:49px;border:0;border-radius:11px;width:100%;font-size:14px;font-weight:800;background:#e4e9ec;color:#090c10;cursor:pointer}button:focus-visible,input:focus-visible{outline:2px solid white;outline-offset:3px}.error{color:#f6a8a8;margin:14px 0 0;font-size:13px}footer{font-size:11px;color:#8494a1;margin-top:25px;line-height:1.45}'
 +'</style></head><body><main><mark>Cellule privée · accès restreint</mark><h1>Inside<br>Grey Room</h1><p>Cette version est réservée aux joueurs invités. Saisis le code communiqué par l’hôte.</p><form action="/__igr-private" method="post" autocomplete="off"><label for="code">Code d’accès</label><input id="code" name="code" type="password" minlength="28" maxlength="120" required autocomplete="off" spellcheck="false"><button type="submit">Entrer dans la cellule</button>'
 +(error?'<div class="error" role="alert">Code incorrect. Réessaie.</div>':'')
 +'</form><footer>Le code ne figure ni dans l’adresse web ni dans le code source du jeu.</footer></main></body></html>';
 return new Response(html,{status:error?401:200,headers:{...PRIVATE_HEADERS,'Content-Type':'text/html; charset=utf-8'}});
}
async function gateRequest(req){
 if(req.method==='GET'||req.method==='HEAD')return gatePage();
 if(req.method!=='POST')return new Response('Method Not Allowed',{status:405,headers:{...PRIVATE_HEADERS,Allow:'GET, HEAD, POST'}});
 if(+(req.headers.get('Content-Length')||0)>512)return new Response('Request too large',{status:413,headers:PRIVATE_HEADERS});
 if(!(req.headers.get('Content-Type')||'').startsWith('application/x-www-form-urlencoded'))return new Response('Unsupported Media Type',{status:415,headers:PRIVATE_HEADERS});
 const body=await req.text();
 if(body.length>512)return new Response('Request too large',{status:413,headers:PRIVATE_HEADERS});
 const code=new URLSearchParams(body).get('code')||'';
 if(!(await validCode(code)))return gatePage(true);
 return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:'/','Set-Cookie':COOKIE+'='+code+'; Path=/; Max-Age=43200; Secure; HttpOnly; SameSite=Strict'}});
}
async function turn(req,env){
 const origin=req.headers.get('Origin');
 if(origin&&!ORIGINS.has(origin))return json(req,{error:'origin_not_allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(req)});
 if(req.method!=='GET')return json(req,{error:'method_not_allowed'},405);
 // Native clients require TURN. Browser calls must pass the private gate.
 if(!NATIVE.has(origin||'')&&!(await validCode(fromCookie(req))))return json(req,{error:'access_required'},401);
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
  if(url.pathname===GATE)return gateRequest(req);
  if(!(await validCode(fromCookie(req)))){
   const navigation=(req.method==='GET'||req.method==='HEAD')&&(req.headers.get('Sec-Fetch-Mode')==='navigate'||(req.headers.get('Accept')||'').includes('text/html')||url.pathname==='/');
   return navigation?Response.redirect(new URL(GATE,url),302):new Response('Private access required',{status:403,headers:PRIVATE_HEADERS});
  }
  const asset=await env.ASSETS.fetch(req);
  const headers=new Headers(asset.headers);
  headers.set('Cache-Control','private, no-store, max-age=0');
  headers.set('Vary','Cookie');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
 }
};
