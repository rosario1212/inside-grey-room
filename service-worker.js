const CACHE='igr-v12-21-unified-locale';
const SHELL=[
  '/', '/index.html', '/en.html',
  '/styles-v11.css?v=v12.21-unified-locale','/polish-v12.css?v=v12.21-unified-locale',
  '/app-v11.js?v=v12.21-unified-locale','/qa-fixes-v12.js?v=v12.21-unified-locale',
  '/investigation-sheet-v12.js?v=v12.21-unified-locale','/video-v12-3.js?v=v12.21-unified-locale',
  '/turn-v12-4.js?v=v12.21-unified-locale','/profile-dossier-v12.js?v=v12.21-unified-locale',
  '/playstore-ready-v12.js?v=v12.21-unified-locale','/social-v12.js?v=v12.21-unified-locale',
  '/notifications-v12.js?v=v12.21-unified-locale','/native-lifecycle-v12.js?v=v12.21-unified-locale',
  '/runtime-optimization-v12.js?v=v12.21-unified-locale','/gameplay-simple-v12.js?v=v12.21-unified-locale',
  '/apple-ui-stability-v12.js?v=v12.21-unified-locale','/gameplay-clean-v12.js?v=v12.21-unified-locale',
  '/language-v12.js?v=v12.21-unified-locale','/i18n-en-v12.js?v=v12.21-unified-locale',
  '/rules-v12.js?v=v12.21-unified-locale','/locale-settings-v12.js?v=v12.21-unified-locale',
  '/manifest.webmanifest','/privacy.html','/terms.html','/delete-account.html','/support.html',
  '/assets/intro-v10-14.webp?v=v12.21-unified-locale','/assets/home-v10-14.webp','/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'/index.html':req,copy))}return r}).catch(()=>caches.match(req.mode==='navigate'?'/index.html':req)));return}event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r})))});
