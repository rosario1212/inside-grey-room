import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
assert.equal(config.assets.run_worker_first,true,'Cloudflare must run its access gate before every static asset');

const original=await readFile(new URL('../cloudflare-worker.mjs',import.meta.url),'utf8');
assert.match(original,/ACCESS_VERIFIER = '[0-9a-f]{64}'/,'Production must have a nonempty cryptographic verifier');
const fixture='private-test-only-never-a-production-credential-123456789';
const fixtureHash=createHash('sha256').update(fixture).digest('hex');
// Test the actual shipped Worker with a disposable verifier. The real access
// code is not stored in this public repository or CI test output.
const patched=original.replace(/ACCESS_VERIFIER = '[0-9a-f]{64}'/,"ACCESS_VERIFIER = '"+fixtureHash+"'");
assert.notEqual(patched,original,'Worker verifier must be replaceable for an isolated fixture');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(patched).toString('base64'));

const url='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
let assets=0;
const env={ASSETS:{fetch:async()=>{assets++;return new Response('asset data',{headers:{'Cache-Control':'public,max-age=31536000'}})}}};
const req=(path,init={})=>new Request(url+path,init);
let res=await worker.fetch(req('/'),env);
assert.equal(res.status,302,'Anonymous home should redirect to a private access screen');
assert.equal(new URL(res.headers.get('Location')).pathname,'/__igr-private');
for(const path of ['/app-v11.js','/assets/intro-v10-14.webp','/index.html','/service-worker.js','/api/casino']){
 res=await worker.fetch(req(path),env);
 assert.equal(res.status,403,'Anonymous asset must be denied: '+path);
}
assert.equal(assets,0,'Protected static resources must not be fetched anonymously');
res=await worker.fetch(req('/__igr-private'),env);
assert.equal(res.status,200);
assert((await res.text()).includes('type="password"'),'Login must request a passcode');
res=await worker.fetch(req('/__igr-private',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'code=wrong-guess'}),env);
assert.equal(res.status,401,'Invalid code must be denied');
assert(!res.headers.has('Set-Cookie'),'Invalid login must not create a session');
res=await worker.fetch(req('/__igr-private',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'code='+encodeURIComponent(fixture)}),env);
assert.equal(res.status,303,'Valid code should redirect into the app');
const cookie=res.headers.get('Set-Cookie')||'';
assert(cookie.includes('Secure; HttpOnly; SameSite=Strict'),'Authentication cookie must be secured');
assert(cookie.includes('Max-Age=43200'),'Browser session should have limited persistence');
const headers={Cookie:cookie.split(';')[0]};
res=await worker.fetch(req('/app-v11.js',{headers}),env);
assert.equal(res.status,200,'Authenticated user should receive web assets');
assert.match(res.headers.get('Cache-Control')||'',/no-store/,'Private assets must never be shared-cacheable');
assert.equal(assets,1);
res=await worker.fetch(req('/api/turn',{headers:{Origin:url}}),env);
assert.equal(res.status,401,'Anonymous browser TURN endpoint must be protected');
res=await worker.fetch(req('/api/turn',{headers:{...headers,Origin:url}}),env);
assert.equal(res.status,503,'Authenticated browser TURN passes gate (test has no TURN secrets)');
res=await worker.fetch(req('/api/turn',{headers:{Origin:'capacitor://localhost'}}),env);
assert.equal(res.status,503,'Native TURN clients must remain compatible');
const realFetch=globalThis.fetch;let casinoCalls=0;
try{
 globalThis.fetch=async(url,init)=>{
  casinoCalls++;assert.equal(url,'https://jtasbdiguhiswoyvobkn.supabase.co/functions/v1/casino-runtime');
  assert.equal(init.headers['X-IGR-Private-Code'],fixture,'Only the gated HttpOnly invitation may authenticate the backend');
  assert.equal(init.redirect,'error');assert.equal(await new Response(init.body).text(),'{"op":"sync"}');
  return new Response('{"revision":1}',{headers:{'Content-Type':'application/json'}});
 };
 res=await worker.fetch(req('/api/casino',{method:'POST',headers:{...headers,Origin:url,'Content-Type':'application/json'},body:'{"op":"sync"}'}),env);
 assert.equal(res.status,200);assert.match(res.headers.get('Cache-Control'),/no-store/);assert.equal(casinoCalls,1);
 res=await worker.fetch(req('/api/casino',{method:'POST',headers:{...headers,Origin:'https://hostile.test','Content-Type':'application/json'},body:'{}'}),env);
 assert.equal(res.status,403);assert.equal(casinoCalls,1,'Cross-origin mutations must not reach the backend');
}finally{globalThis.fetch=realFetch}
console.log('Private access verified: anonymous routes and assets blocked, valid login, secure cookies, private caching, native TURN preserved.');
