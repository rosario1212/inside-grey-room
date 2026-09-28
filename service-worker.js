const CACHE='igr-v12-17-unified';
const SHELL=[
  '/', '/index.html',
  '/styles-v11.css?v=v12.17-unified', '/polish-v12.css?v=v12.17-unified',
  '/app-v11.js?v=v12.17-unified', '/qa-fixes-v12.js?v=v12.17-unified',
  '/investigation-sheet-v12.js?v=v12.17-unified', '/video-v12-3.js?v=v12.17-unified',
  '/turn-v12-4.js?v=v12.17-unified', '/profile-dossier-v12.js?v=v12.17-unified',
  '/playstore-ready-v12.js?v=v12.17-unified', '/social-v12.js?v=v12.17-unified',
  '/notifications-v12.js?v=v12.17-unified', '/native-lifecycle-v12.js?v=v12.17-unified',
  '/runtime-optimization-v12.js?v=v12.17-unified', '/gameplay-simple-v12.js?v=v12.17-unified',
  '/apple-ui-stability-v12.js?v=v12.17-unified', '/gameplay-clean-v12.js?v=v12.17-unified',
  '/manifest.webmanifest?v=v12.17-unified', '/privacy.html', '/terms.html', '/delete-account.html', '/support.html',
  '/assets/intro-v10-14.webp?v=v12.17-unified', '/assets/home-v10-14.webp?v=v12.17-unified', '/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}return r;}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));});
