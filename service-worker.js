const CACHE='igr-v11-25-winner-camp';
const SHELL=["/", "/index.html", "/styles-v11.css?v=v11-25-winner-camp", "/app-v11.js?v=v11-25-winner-camp", "/manifest.webmanifest?v=v11-25-winner-camp", "/assets/intro-v10-14.webp?v=v11-25-winner-camp", "/assets/home-v10-14.webp?v=v11-25-winner-camp", "/assets/icon-192-v9.png", "/assets/icon-512-v9.png", "/assets/apple-touch-icon-v9.png", "/assets/favicon-v9.png"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy));return r;}).catch(()=>caches.match('/index.html')));return;}
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));
});
