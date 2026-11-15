/* v701: No anonymous TURN credentials. Run entirely offline with mocked Worker upstream. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {default as worker} from '../cloudflare-worker.mjs';

const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const pubkey='sb_publishable_unit_test_only';
const pToken='00000000-0000-4000-8000-000000000701';
const env={CF_TURN_KEY_ID:'test_key',CF_TURN_KEY_TOKEN:'non_secret_unit_test'};
const body=JSON.stringify({p_code:'QA701',p_player_token:pToken});
const request=(path,opts={})=>new Request(origin+path,opts);
const post=(data=body,headers={})=>worker.fetch(request('/api/turn',{
 method:'POST',
 headers:{Origin:origin,'Content-Type':'application/json',apikey:pubkey,...headers},
 body:data
}),env);

let r=await worker.fetch(request('/api/turn'),env);
assert.equal(r.status,405,'Legacy anonymous GET must be rejected');
r=await worker.fetch(request('/api/turn',{method:'POST',headers:{
 Origin:'https://hostile.example','Content-Type':'application/json',apikey:pubkey
},body}),env);
assert.equal(r.status,403,'Untrusted origins must be denied');
r=await worker.fetch(request('/api/turn',{method:'OPTIONS',headers:{Origin:'capacitor://localhost'}}),env);
assert.equal(r.status,204,'Native WebView must still preflight');
assert.match(r.headers.get('Access-Control-Allow-Headers')||'',/apikey/);
r=await worker.fetch(request('/api/turn',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body}),env);
assert.equal(r.status,401,'Player must include public REST API key to authenticate');
r=await post(JSON.stringify({p_code:'QA701',p_player_token:'fake'}));
assert.equal(r.status,401,'Malformed private room token must be rejected');
r=await post(' '.repeat(900));
assert.equal(r.status,413,'Chunked-style oversized payload must not hit upstream');
r=await post('{}',{apikey:'sb_secret_key_must_not_forward'});
assert.equal(r.status,401,'Unexpected server-side credential header must not be forwarded');
r=await worker.fetch(request('/api/turn',{method:'POST',headers:{
 Origin:'capacitor://localhost','Content-Type':'application/json',apikey:pubkey
},body}),{});
assert.equal(r.status,503,'Missing private TURN configuration must fail closed');

const realFetch=globalThis.fetch;
let authCalls=0,turnCalls=0,authorized=false,redirect=false,authError=false,rateLimited=false;
try{
 globalThis.fetch=async(url,init)=>{
  if(url==='https://jtasbdiguhiswoyvobkn.supabase.co/rest/v1/rpc/igr_v701_turn_authorize'){
   authCalls++;
   assert.equal(init.method,'POST');
   assert.equal(init.redirect,'manual','No player credentials may follow a redirect');
   assert.equal(init.headers.apikey,pubkey);
   assert.equal(init.headers.Authorization,'Bearer '+pubkey);
   assert.deepEqual(JSON.parse(init.body),{p_code:'QA701',p_player_token:pToken});
   if(redirect)return new Response(null,{status:302,headers:{Location:'https://untrusted.example/token'}});
   if(authError)return Response.json({message:'db_unavailable'},{status:503});
   if(rateLimited)return Response.json({message:'rate_limited',code:'P0001'},{status:400});
   return Response.json(authorized);
  }
  if(url.startsWith('https://rtc.live.cloudflare.com/v1/turn/keys/')){
   turnCalls++;
   assert.equal(init.method,'POST');
   assert.equal(init.redirect,'manual');
   assert(!JSON.stringify(init).includes(pToken),'Player token must never reach the ICE provider');
   return Response.json({iceServers:[{urls:'turn:managed.example',username:'ephemeral',credential:'ephemeral'}]});
  }
  throw new Error('unexpected network request: '+url);
 };
 r=await post();assert.equal(r.status,403);
 assert.equal(authCalls,1);
 assert.equal(turnCalls,0,'Unknown player must never mint credentials');

 rateLimited=true;r=await post();assert.equal(r.status,429);
 rateLimited=false;authError=true;r=await post();assert.equal(r.status,503);
 authError=false;redirect=true;r=await post();assert.equal(r.status,503);
 assert(!r.headers.has('Location'),'Authentication redirect must not leak private credentials');
 redirect=false;
 assert.equal(turnCalls,0,'Only a true auth result can reach the TURN provider');
 authorized=true;
 r=await post();assert.equal(r.status,200);
 const payload=await r.json();
 assert.equal(payload.iceServers[0].credential,'ephemeral');
 assert.equal(turnCalls,1);
 assert.match(r.headers.get('Cache-Control'),/no-store/);
 assert(!r.headers.has('Set-Cookie'));
}finally{globalThis.fetch=realFetch}

const client=readFileSync('turn-v12-4.js','utf8');
assert(client.includes('typeof activateVideo'),'Investigator camera MUST load managed TURN before its first offer');
assert(client.includes("method: 'POST'"),'WebRTC client may not use anonymous GET');
assert(client.includes('authorizedIdentity'),'TURN credentials must be discarded on room changes');
const migration=readFileSync('supabase/migrations/20261115144500_igr_v701_turn_video_authorization.sql','utf8');
assert(migration.includes('terror_v693_officer_join'),'Officer video visit must be checked server-side');
assert(migration.includes("room_.phase <> 'interrogation'"),'Private TURN authorization must be phase bound');
assert(migration.includes("rate_limit('turn_authorize_global'"),'Private TURN auth must have global rate limits');
console.log('PASS v701: authenticated TURN, role and session checks, origin isolation, no provider leak, iOS/Android native preflight.');
