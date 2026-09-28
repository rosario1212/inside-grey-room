const CACHE='igr-v12-7-adaptive-notifications';
const SHELL=[
  '/',
  '/index.html',
  '/styles-v11.css?v=v12.7-adaptive-notifications',
  '/app-v11.js?v=v12.7-adaptive-notifications',
  '/qa-fixes-v12.js?v=v12.7-adaptive-notifications',
  '/video-v12-3.js?v=v12.7-adaptive-notifications',
  '/profile-dossier-v12.js?v=v12.7-adaptive-notifications',
  '/playstore-ready-v12.js?v=v12.7-adaptive-notifications',
  '/social-v12.js?v=v12.7-adaptive-notifications',
  '/notifications-v12.js?v=v12.7-adaptive-notifications',
  '/manifest.webmanifest?v=v12.7-adaptive-notifications',
  '/privacy.html',
  '/terms.html',
  '/delete-account.html',
  '/support.html',
  '/assets/intro-v10-14.webp?v=v12.7-adaptive-notifications',
  '/assets/home-v10-14.webp?v=v12.7-adaptive-notifications',
  '/assets/icon-192-v9.png',
  '/assets/icon-512-v9.png',
  '/assets/apple-touch-icon-v9.png',
  '/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}return r;}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));});
