const CACHE='igr-v12-13-clean-live';
const SHELL=[
  '/',
  '/index.html',
  '/styles-v11.css?v=v12.13-clean-live',
  '/polish-v12.css?v=v12.13-clean-live',
  '/app-v11.js?v=v12.13-clean-live',
  '/qa-fixes-v12.js?v=v12.13-clean-live',
  '/investigation-sheet-v12.js?v=v12.13-clean-live',
  '/video-v12-3.js?v=v12.13-clean-live',
  '/turn-v12-4.js?v=v12.13-clean-live',
  '/profile-dossier-v12.js?v=v12.13-clean-live',
  '/playstore-ready-v12.js?v=v12.13-clean-live',
  '/social-v12.js?v=v12.13-clean-live',
  '/native-lifecycle-v12.js?v=v12.13-clean-live',
  '/runtime-optimization-v12.js?v=v12.13-clean-live',
  '/gameplay-simple-v12.js?v=v12.13-clean-live',
  '/gameplay-clean-v12.js?v=v12.13-clean-live-20260928-1',
  '/manifest.webmanifest?v=v12.13-clean-live',
  '/privacy.html',
  '/terms.html',
  '/delete-account.html',
  '/support.html',
  '/assets/intro-v10-14.webp?v=v12.13-clean-live',
  '/assets/home-v10-14.webp?v=v12.13-clean-live',
  '/assets/icon-192-v9.png',
  '/assets/icon-512-v9.png',
  '/assets/apple-touch-icon-v9.png',
  '/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);
  if(runtimeFile){
    event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{
      if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}
      return r;
    }).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{
    if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
    return r;
  })));
});
