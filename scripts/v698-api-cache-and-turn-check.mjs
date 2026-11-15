/* Cross-DLC security regression — no credential caching or premature TURN load.
   Runs without remote accounts, live credentials or external network requests. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const sw=readFileSync('service-worker.js','utf8');
const turn=readFileSync('turn-v12-4.js','utf8');
const html=readFileSync('index.html','utf8');
assert(html.includes('turn-v12-4.js?v=security-v698-lazy-turn-20261115'),
 'Updated video privacy code must be cache-busted in the published entrypoint');
assert(sw.includes('/turn-v12-4.js?v=security-v698-lazy-turn-20261115'),
 'Service-worker manifest must match the lazily provisioned video script');
const origin='https://inside-grey-room-last.alial-khafaji2002.workers.dev';

assert(sw.includes('isSensitiveServicePath(url.pathname)'),
 'All GET /api/* routes must bypass the service-worker cache');
assert(sw.includes('activeCache.delete(request)'),
 'PWA activation must purge credentials cached by earlier releases');
assert(!turn.includes('void refreshManagedTurn(false)'),
 'Opening the app must not generate a TURN credential before a video session');

const events=new Map(),stores=new Map();
const url=request=>new URL(typeof request==='string'?request:request.url,origin).href;
const store=name=>{
  if(!stores.has(name)){
    const entries=new Map();
    stores.set(name,{
      entries,
      async put(req,res){entries.set(url(req),res.clone())},
      async match(req){return entries.get(url(req))?.clone()},
      async keys(){return [...entries.keys()].map(u=>new Request(u))},
      async delete(req){return entries.delete(url(req))}
    });
  }
  return stores.get(name);
};
const caches={
  async open(name){return store(name)},
  async keys(){return [...stores.keys()]},
  async delete(name){return stores.delete(name)},
  async match(req){for(const c of stores.values()){const found=await c.match(req);if(found)return found}return undefined}
};
let networkCalls=0,claimed=0;
const fakeSelf={
  location:{origin},
  addEventListener(name,fn){events.set(name,fn)},
  async skipWaiting(){},
  clients:{async claim(){claimed++}}
};
vm.runInNewContext(sw,{
  self:fakeSelf,caches,URL,Request,Response,
  console:{warn(){}},
  fetch:async()=>{networkCalls++;return new Response('public asset',{status:200})}
});

const cacheName=sw.match(/const CACHE='([^']+)'/)?.[1];
assert(cacheName,'Service worker release cache absent');
const current=await caches.open(cacheName);
await current.put(origin+'/api/turn',Response.json({iceServers:[{urls:'turn:old'}]}));
await current.put(origin+'/api/other-private',Response.json({player_token:'must-not-persist'}));
await current.put(origin+'/assets/cover.webp?v=1',new Response('cover'));
await (await caches.open('igr-obsolete-release')).put(origin+'/api/turn',Response.json({iceServers:[{urls:'turn:old'}]}));
let activation;
events.get('activate')({waitUntil(p){activation=p}});
await activation;
assert.equal(claimed,1,'New service worker must claim clients');
assert.equal(await current.match(origin+'/api/turn'),undefined,'Old TURN token was not removed');
assert.equal(await current.match(origin+'/api/other-private'),undefined,'Old personal API response was not removed');
assert.equal(await (await caches.open(cacheName)).match(origin+'/assets/cover.webp?v=1')?.then(r=>r?.text()),'cover','Offline art should remain available');
assert(!stores.has('igr-obsolete-release'),'Stale release caches must be removed');

function dispatch(request){
 const event={request:new Request(url(request),request.method?{method:request.method}:{}),
  handled:false,waits:[],
  respondWith(p){this.handled=true;this.response=Promise.resolve(p)},
  waitUntil(p){this.waits.push(Promise.resolve(p))}};
 events.get('fetch')(event);
 return event;
}
for(const p of ['/api/turn','/api/private','/rest/v1/rpc/secret','/auth/v1/user',
                '/functions/v1/casino-runtime','/storage/v1/object/private']){
 const e=dispatch(origin+p);
 assert(!e.handled,'Service response was intercepted and might be cached: '+p);
}
assert.equal(networkCalls,0,'Sensitive requests must never reach the cache handler');
const art=dispatch(origin+'/assets/cover-new.webp?v=1');
assert(art.handled,'Public illustrated asset should still work offline');
assert.equal((await art.response).status,200);
await Promise.all(art.waits);
assert(await current.match(origin+'/assets/cover-new.webp?v=1'),'Static illustration must remain cacheable');

let turnRequests=0,videoStarts=0,videoJoins=0,lastConfig=null;
const fakePlayer={
  getConfiguration:()=>({iceServers:[]}),
  setConfiguration(cfg){lastConfig=cfg}
};
const context={
  console,Promise,Date,AbortController,setTimeout,clearTimeout,URL,
  window:{},STATE:{room:null,token:null,sync:null},
  newPeer:()=>fakePlayer,
  startVideo:async()=>{videoStarts++},
  joinVideoAsViewer:async()=>{videoJoins++},
  fetch:async()=>{turnRequests++;return {
    ok:true,async json(){return {iceServers:[{urls:'turn:managed.example',username:'temp',credential:'temporary'}],ttl:3600}}
  }}
};
vm.runInNewContext(turn,context);
assert.equal(turnRequests,0,'TURN credentials fetched before entering video');
await context.startVideo();
assert.equal(videoStarts,1);
assert.equal(turnRequests,1,'First video call must request managed TURN exactly once');
context.newPeer('viewer',true);
assert(lastConfig?.iceServers?.some(x=>String(x.urls)==='turn:managed.example'),'Managed relay not configured for peer');
await context.joinVideoAsViewer();
assert.equal(videoJoins,1);
assert.equal(turnRequests,1,'Second participant action must reuse nonexpired TURN credentials');

console.log('PASS v698: no offline API/token cache, purge old TURN credentials, assets still cached, lazy managed video TURN.');
