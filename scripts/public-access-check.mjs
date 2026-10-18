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
