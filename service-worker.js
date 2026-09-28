const CACHE='igr-v12-13-clean-live-r3';
const SHELL=[
  '/', '/index.html',
  '/styles-v11.css?v=v12.13-clean-live-r3', '/polish-v12.css?v=v12.13-clean-live-r3',
  '/app-v11.js?v=v12.13-clean-live-r3', '/qa-fixes-v12.js?v=v12.13-clean-live-r3',
  '/investigation-sheet-v12.js?v=v12.13-clean-live-r3', '/video-v12-3.js?v=v12.13-clean-live-r3',
  '/turn-v12-4.js?v=v12.13-clean-live-r3', '/profile-dossier-v12.js?v=v12.13-clean-live-r3',
  '/playstore-ready-v12.js?v=v12.13-clean-live-r3', '/social-v12.js?v=v12.13-clean-live-r3',
  '/native-lifecycle-v12.js?v=v12.13-clean-live-r3', '/runtime-optimization-v12.js?v=v12.13-clean-live-r3',
  '/gameplay-simple-v12.js?v=v12.13-clean-live-r3', '/gameplay-clean-v12.js?v=v12.13-clean-live-20260928-2',
  '/manifest.webmanifest?v=v12.13-clean-live-r3', '/privacy.html', '/terms.html', '/delete-account.html', '/support.html',
  '/assets/intro-v10-14.webp?v=v12.13-clean-live-r3', '/assets/home-v10-14.webp?v=v12.13-clean-live-r3',
  '/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}return r;}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));});
