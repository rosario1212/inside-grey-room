const CACHE='igr-v12-23-locale-home';
const SHELL=[
  '/', '/index.html', '/en.html',
  '/styles-v11.css?v=v12.22-mobile-ui','/polish-v12.css?v=v12.22-mobile-ui','/ui-polish-v12.css?v=v12.22-mobile-ui',
  '/app-v11.js?v=v12.22-mobile-ui','/qa-fixes-v12.js?v=v12.22-mobile-ui',
  '/investigation-sheet-v12.js?v=v12.22-mobile-ui','/video-v12-3.js?v=v12.22-mobile-ui',
  '/turn-v12-4.js?v=v12.22-mobile-ui','/profile-dossier-v12.js?v=v12.22-mobile-ui',
  '/playstore-ready-v12.js?v=v12.22-mobile-ui','/social-v12.js?v=v12.22-mobile-ui',
  '/notifications-v12.js?v=v12.22-mobile-ui','/native-lifecycle-v12.js?v=v12.22-mobile-ui',
  '/runtime-optimization-v12.js?v=v12.22-mobile-ui','/gameplay-simple-v12.js?v=v12.22-mobile-ui',
  '/apple-ui-stability-v12.js?v=v12.22-mobile-ui','/gameplay-clean-v12.js?v=v12.22-mobile-ui',
  '/language-v12.js?v=v12.22-mobile-ui','/i18n-en-v12.js?v=v12.22-mobile-ui',
  '/rules-v12.js?v=v12.22-mobile-ui','/locale-settings-v12.js?v=v12.22-mobile-ui','/ui-polish-v12.js?v=v12.22-mobile-ui',
  '/locale-runtime-v12-23.js?v=v12.23-locale-home',
  '/manifest.webmanifest','/privacy.html','/terms.html','/delete-account.html','/support.html',
  '/assets/intro-v10-14.webp?v=v12.22-mobile-ui','/assets/home-v10-14.webp','/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy))}return r}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r})))});
