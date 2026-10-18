import assert from 'node:assert/strict';
const {default:worker}=await import('../cloudflare-worker.mjs');
const url='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
let assets=0;
const env={ASSETS:{fetch:async()=>{assets++;return new Response('public asset',{headers:{'Content-Type':'text/plain'}})}}};
const req=(path,init={})=>new Request(url+path,init);
for(const path of ['/','/index.html','/app-v11.js','/assets/intro-v10-14.webp','/service-worker.js']){
 const res=await worker.fetch(req(path),env);
 assert.equal(res.status,200,'Public route must not require a passcode: '+path);
 assert.equal(await res.text(),'public asset');
 assert(!res.headers.has('Set-Cookie'),'Public route must not set a login cookie');
}
assert.equal(assets,5);
let res=await worker.fetch(req('/__igr-private'),env);
assert.equal(res.status,302);
assert.equal(new URL(res.headers.get('Location')).pathname,'/');
res=await worker.fetch(req('/api/turn',{headers:{Origin:'https://malicious.example'}}),env);
assert.equal(res.status,403,'Unknown browser origin must be blocked');
res=await worker.fetch(req('/api/turn',{method:'POST',headers:{Origin:url}}),env);
assert.equal(res.status,405,'TURN must remain GET only');
res=await worker.fetch(req('/api/turn',{headers:{Origin:url}}),env);
assert.equal(res.status,503,'Public browser TURN reaches server configuration without gate');
res=await worker.fetch(req('/api/turn',{headers:{Origin:'capacitor://localhost'}}),env);
assert.equal(res.status,503,'Native TURN clients remain compatible');
console.log('Public access verified: no passcode, no cookie, legacy redirect, restricted TURN origins, native TURN.');
const realFetch=globalThis.fetch;let casinoCalls=0;
try{
 globalThis.fetch=async(endpoint,init)=>{
  casinoCalls++;assert.equal(endpoint,'https://jtasbdiguhiswoyvobkn.supabase.co/functions/v1/casino-runtime');
  assert(!('X-IGR-Private-Code' in init.headers));assert.equal(init.redirect,'error');
  assert.equal(await new Response(init.body).text(),'{"op":"sync"}');
  return new Response('{"error":"invalid_session_token"}',{status:403});
 };
 res=await worker.fetch(req('/api/casino',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:'{"op":"sync"}'}),env);
 assert.equal(res.status,403,'Public proxy preserves the personal-session denial');assert.equal(casinoCalls,1);
 assert.match(res.headers.get('Cache-Control'),/no-store/);assert(!res.headers.has('Set-Cookie'));
 for(const [headers,status]of [[{Origin:'https://hostile.test','Content-Type':'application/json'},403],[{Origin:url,'Content-Type':'text/plain'},415],[{Origin:url,'Content-Type':'application/json','Content-Length':'17000'},413]]){
  res=await worker.fetch(req('/api/casino',{method:'POST',headers,body:'{}'}),env);assert.equal(res.status,status);
 }
 assert.equal(casinoCalls,1,'Rejected requests never reach the service');
 res=await worker.fetch(req('/api/casino',{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(17000)}),env);
 assert.equal(res.status,413);assert.equal(casinoCalls,1,'Chunked bodies are bounded without trusting Content-Length');
 res=await worker.fetch(req('/api/casino',{method:'OPTIONS',headers:{Origin:'capacitor://localhost'}}),env);
 assert.equal(res.status,204);assert.equal(res.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
 res=await worker.fetch(req('/api/casino'),env);assert.equal(res.status,405);
}finally{globalThis.fetch=realFetch}
console.log('Casino proxy verified: personal session authentication, no shared passcode, hostile origins denied, native preflight, bounded JSON requests.');
