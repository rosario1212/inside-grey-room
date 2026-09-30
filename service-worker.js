const CACHE='igr-v12-38-omerta-reset';
const SHELL=[
  '/', '/index.html', '/en.html',
  '/styles-v11.css?v=v12.22-mobile-ui','/polish-v12.css?v=v12.22-mobile-ui','/ui-polish-v12.css?v=v12.22-mobile-ui',
  '/omerta-v12.css?v=v12.24-omerta','/omerta-polish-v12.css?v=v12.28-omerta','/role-tree-polish-v12-29.css?v=v12.29-role-tree','/omerta-v12-30.css?v=v12.32-omerta-final',
  '/omerta-v12-37.css?v=v12.37-final','/terror-v12-37.css?v=v12.37-final','/dlc-suite-v12-37.css?v=v12.37-final',
  '/app-v11.js?v=v12.22-mobile-ui','/qa-fixes-v12.js?v=v12.22-mobile-ui','/investigation-sheet-v12.js?v=v12.22-mobile-ui','/video-v12-3.js?v=v12.22-mobile-ui',
  '/turn-v12-4.js?v=v12.22-mobile-ui','/profile-dossier-v12.js?v=v12.22-mobile-ui','/playstore-ready-v12.js?v=v12.22-mobile-ui','/social-v12.js?v=v12.22-mobile-ui',
  '/notifications-v12.js?v=v12.22-mobile-ui','/native-lifecycle-v12.js?v=v12.22-mobile-ui','/runtime-optimization-v12.js?v=v12.22-mobile-ui','/gameplay-simple-v12.js?v=v12.22-mobile-ui',
  '/apple-ui-stability-v12.js?v=v12.22-mobile-ui','/gameplay-clean-v12.js?v=v12.22-mobile-ui','/language-v12.js?v=v12.22-mobile-ui','/i18n-en-v12.js?v=v12.22-mobile-ui',
  '/rules-v12.js?v=v12.22-mobile-ui','/locale-settings-v12.js?v=v12.22-mobile-ui','/ui-polish-v12.js?v=v12.22-mobile-ui','/locale-runtime-v12-23.js?v=v12.23-locale-home',
  '/omerta-v12.js?v=v12.24-omerta','/omerta-polish-v12.js?v=v12.28-omerta','/omerta-hotfix-v12.js?v=v12.28-omerta','/role-tree-polish-v12-29.js?v=v12.29-role-tree','/omerta-v12-30.js?v=v12.32-omerta-final',
  '/omerta-v12-37.js?v=v12.38-omerta-reset','/terror-v12-37.js?v=v12.37-final','/dlc-suite-v12-37.js?v=v12.38-omerta-reset',
  '/manifest.webmanifest','/privacy.html','/terms.html','/delete-account.html','/support.html',
  '/assets/intro-v10-14.webp?v=v12.22-mobile-ui','/assets/home-v10-14.webp','/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png',
  '/assets/omerta-021-l-enveloppe.webp?v=12.37-final','/assets/omerta-022-omerta.webp?v=12.37-final','/assets/omerta-023-la-table.webp?v=12.37-final','/assets/omerta-024-il-pentito.webp?v=12.37-final','/assets/omerta-025-il-don.webp?v=12.37-final',
  '/assets/terror-026-la-ville-tombe.webp?v=12.37-final','/assets/terror-027-la-zone-rouge.webp?v=12.37-final','/assets/terror-028-dernier-perimetre.webp?v=12.37-final',
  '/assets/cartel-029-le-cycle-mort.webp?v=12.37-final','/assets/cartel-030-la-cour-achetee.webp?v=12.37-final','/assets/cartel-031-la-dette.webp?v=12.37-final',
  '/assets/regime-032-les-archives-du-palais.webp?v=12.37-final','/assets/regime-033-la-dynastie.webp?v=12.37-final','/assets/regime-034-les-noms-quils-portaient.webp?v=12.37-final'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);
  const key=req.mode==='navigate'?'/index.html':req;
  if(runtimeFile){event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key,copy))}return r}).catch(()=>caches.match(key)));return}
  event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return r}).catch(()=>caches.match(req)));
});
