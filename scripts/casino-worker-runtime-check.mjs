// Run with npx --package=wrangler@4.102.0 -c 'node scripts/casino-worker-runtime-check.mjs'.
// Exercise the real workerd Fetch implementation, including redirect validation.
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
let modulePath;
for(const entry of (process.env.PATH||'').split(path.delimiter)){
 const candidate=path.resolve(entry,'../miniflare/dist/src/index.js');
 try{await access(candidate);modulePath=candidate;break}catch{}
}
assert(modulePath,'Run through the pinned Wrangler package so its own Miniflare is available');
const {Miniflare}=await import(pathToFileURL(modulePath));
let calls=0,redirect=false;
const mf=new Miniflare({modules:true,script:await readFile('cloudflare-worker.mjs','utf8'),
 // This is the runtime bundled with the pinned Wrangler release.
 compatibilityDate:'2026-06-24',outboundService:async req=>{
  calls++;assert.equal(req.url,'https://jtasbdiguhiswoyvobkn.supabase.co/functions/v1/casino-runtime');
  assert.equal(req.method,'POST');assert.deepEqual(await req.json(),{op:'sync'});
  return redirect?new Response(null,{status:302,headers:{Location:'https://untrusted.example/'}}):
   Response.json({error:'invalid_session_token'},{status:400});
 }});
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const post=(body='{"op":"sync"}',headers={})=>mf.dispatchFetch(origin+'/api/casino',{
 method:'POST',headers:{'Content-Type':'application/json',...headers},body});
try{
 let response=await post();assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'invalid_session_token'});assert.equal(calls,1);
 assert.equal((await post('{}',{Origin:'https://untrusted.example'})).status,403);assert.equal(calls,1);
 assert.equal((await post(' '.repeat(17000))).status,413);assert.equal(calls,1);
 redirect=true;response=await post();assert.equal(response.status,503);assert(!response.headers.has('Location'));assert.equal(calls,2,'A personal capability must never follow a redirect');
 console.log('Cloudflare workerd: authenticated upstream response relayed, hostile origin/body rejected, credential redirects refused.');
}finally{await mf.dispose()}
