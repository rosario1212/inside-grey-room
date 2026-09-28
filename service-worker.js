const CACHE='igr-v12-15-auto-role';
const SHELL=[
  '/', '/index.html',
  '/styles-v11.css?v=v12.15-auto-role', '/polish-v12.css?v=v12.15-auto-role',
  '/app-v11.js?v=v12.15-auto-role', '/qa-fixes-v12.js?v=v12.15-auto-role',
  '/investigation-sheet-v12.js?v=v12.15-auto-role', '/video-v12-3.js?v=v12.15-auto-role',
  '/turn-v12-4.js?v=v12.15-auto-role', '/profile-dossier-v12.js?v=v12.15-auto-role',
  '/playstore-ready-v12.js?v=v12.15-auto-role', '/social-v12.js?v=v12.15-auto-role',
  '/native-lifecycle-v12.js?v=v12.15-auto-role', '/runtime-optimization-v12.js?v=v12.15-auto-role',
  '/gameplay-simple-v12.js?v=v12.15-auto-role', '/apple-ui-stability-v12.js?v=v12.15-auto-role',
  '/gameplay-clean-v12.js?v=v12.15-auto-role',
  '/manifest.webmanifest?v=v12.15-auto-role', '/privacy.html', '/terms.html', '/delete-account.html', '/support.html',
  '/assets/intro-v10-14.webp?v=v12.15-auto-role', '/assets/home-v10-14.webp?v=v12.15-auto-role', '/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}return r;}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));});
