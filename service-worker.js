const CACHE='igr-v12-19-desktop-lobby';
const SHELL=[
  '/', '/index.html',
  '/styles-v11.css?v=v12.19-desktop-lobby', '/polish-v12.css?v=v12.19-desktop-lobby',
  '/app-v11.js?v=v12.19-desktop-lobby', '/qa-fixes-v12.js?v=v12.19-desktop-lobby',
  '/investigation-sheet-v12.js?v=v12.19-desktop-lobby', '/video-v12-3.js?v=v12.19-desktop-lobby',
  '/turn-v12-4.js?v=v12.19-desktop-lobby', '/profile-dossier-v12.js?v=v12.19-desktop-lobby',
  '/playstore-ready-v12.js?v=v12.19-desktop-lobby', '/social-v12.js?v=v12.19-desktop-lobby',
  '/notifications-v12.js?v=v12.19-desktop-lobby', '/native-lifecycle-v12.js?v=v12.19-desktop-lobby',
  '/runtime-optimization-v12.js?v=v12.19-desktop-lobby', '/gameplay-simple-v12.js?v=v12.19-desktop-lobby',
  '/apple-ui-stability-v12.js?v=v12.19-desktop-lobby', '/gameplay-clean-v12.js?v=v12.19-desktop-lobby',
  '/manifest.webmanifest?v=v12.19-desktop-lobby', '/privacy.html', '/terms.html', '/delete-account.html', '/support.html',
  '/assets/intro-v10-14.webp?v=v12.19-desktop-lobby', '/assets/home-v10-14.webp?v=v12.19-desktop-lobby', '/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy));}return r;}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return;}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;})));});