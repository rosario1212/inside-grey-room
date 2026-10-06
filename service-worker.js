const CACHE='igr-v36-2-maitre-theme-fix';
const SHELL=[
  '/', '/index.html', '/en.html',
  '/styles-v11.css?v=v12.22-mobile-ui','/polish-v12.css?v=v12.22-mobile-ui','/ui-polish-v12.css?v=v12.22-mobile-ui',
  '/gameplay-flow-v13.css?v=v13.2-final','/dlc-experience-v13.css?v=v13.2-final','/lobby-ui-fix-v13.css?v=v13.2-lobby-fix',
  '/startup-stability-v13-3.css?v=v13.8-dual-play','/heritage-v13-5.css?v=v13.8-dual-play','/heritage-premium-v13-6.css?v=v13.8-dual-play','/heritage-play-v13-7.css?v=v13.8-dual-play','/play-modes-v13-8.css?v=v13.8-dual-play',
  '/heritage-maitre-v34.css?v=v34.9-maitre-theme-posters','/heritage-maitre-judicial-v34.css?v=v34.9-maitre-theme-posters','/heritage-maitre-polish-v34.css?v=v34.9-maitre-theme-posters',
  '/omerta-v12.css?v=v12.24-omerta','/omerta-polish-v12.css?v=v12.28-omerta','/role-tree-polish-v12-29.css?v=v12.29-role-tree','/omerta-v12-30.css?v=v12.32-omerta-final',
  '/omerta-v12-40.css?v=v12.41-uniform-dlc','/terror-v12-40.css?v=v12.41-uniform-dlc','/dlc-suite-v12-40.css?v=v12.41-uniform-dlc','/live-cell-v12-44.css?v=v12.44-live-cell','/dlc-profile-ui-v12-44.css?v=v12.44-ui','/dlc-invites-v12-45.css?v=v12.45-dlc-invites','/dlc-copy-v12-46.css?v=v12.46-copy',
  '/app-v11.js?v=v12.22-mobile-ui','/qa-fixes-v12.js?v=v12.22-mobile-ui','/investigation-sheet-v12.js?v=v12.22-mobile-ui','/video-v12-3.js?v=v12.22-mobile-ui',
  '/turn-v12-4.js?v=v12.22-mobile-ui','/profile-dossier-v12.js?v=v12.22-mobile-ui','/playstore-ready-v12.js?v=v12.22-mobile-ui','/social-v12.js?v=v12.22-mobile-ui',
  '/notifications-v12.js?v=v12.22-mobile-ui','/native-lifecycle-v12.js?v=v12.22-mobile-ui','/runtime-optimization-v12.js?v=v12.22-mobile-ui','/gameplay-simple-v12.js?v=v12.22-mobile-ui',
  '/apple-ui-stability-v12.js?v=v12.22-mobile-ui','/gameplay-clean-v12.js?v=v12.22-mobile-ui',
  '/scenario-flow-v13.js?v=v13.2-final','/gameplay-flow-v13.js?v=v13.2-final','/dlc-experience-v13.js?v=v13.2-final','/scenario-replay-contracts-v13.json?v=v13.2-final','/lobby-ui-fix-v13.js?v=v13.2-lobby-fix',
  '/startup-stability-v13-3.js?v=v13.8-dual-play','/heritage-v13-5.js?v=v13.8-dual-play','/heritage-premium-v13-6.js?v=v13.8-dual-play','/heritage-play-v13-7.js?v=v13.8-dual-play','/play-modes-v13-8.js?v=v13.8-dual-play',
  '/heritage-maitre-data-v34.js?v=v34.9-maitre-theme-posters','/heritage-maitre-assets-v34.js?v=v34.9-maitre-theme-posters','/heritage-maitre-v34.js?v=v34.9-maitre-theme-posters','/heritage-maitre-online-v34-4.js?v=v34.9-maitre-theme-posters','/heritage-maitre-polish-v34.js?v=v34.9-maitre-theme-posters','/heritage-maitre-mobile-v34-5.js?v=v34.9-maitre-theme-posters',
  '/language-v12.js?v=v12.22-mobile-ui','/i18n-en-v12.js?v=v12.22-mobile-ui',
  '/rules-v12.js?v=v12.22-mobile-ui','/locale-settings-v12.js?v=v12.22-mobile-ui','/ui-polish-v12.js?v=v12.22-mobile-ui','/locale-runtime-v12-23.js?v=v12.23-locale-home',
  '/omerta-v12.js?v=v12.24-omerta','/omerta-polish-v12.js?v=v12.28-omerta','/omerta-hotfix-v12.js?v=v12.28-omerta','/role-tree-polish-v12-29.js?v=v12.29-role-tree','/omerta-v12-30.js?v=v12.32-omerta-final',
  '/omerta-v12-39.js?v=v12.45-choice-copy','/terror-v12-37.js?v=v56-dlc-posters','/dlc-suite-v12-37.js?v=v56-dlc-posters','/live-cell-v12-44.js?v=v12.44-live-cell','/dlc-profile-ui-v12-44.js?v=v12.44-ui','/dlc-invites-v12-45.js?v=v12.45-dlc-invites','/dlc-copy-v12-46.js?v=v12.46-copy',
  '/manifest.webmanifest','/privacy.html','/terms.html','/delete-account.html','/support.html',
  '/assets/intro-v10-14.webp?v=v12.42-startup','/assets/home-v10-14.webp','/assets/icon-192-v9.png','/assets/icon-512-v9.png','/assets/apple-touch-icon-v9.png','/assets/favicon-v9.png',
  '/assets/heritage-cendres-01-personne-n-existe.webp?v=v13.6-heritage-premium','/assets/heritage-cendres-02-04-17.webp?v=v13.6-heritage-premium','/assets/heritage-cendres-03-la-chambre.webp?v=v13.6-heritage-premium','/assets/heritage-cendres-04-cendres.webp?v=v13.6-heritage-premium','/assets/heritage-cendres-05-point-zero.webp?v=v13.6-heritage-premium',
  '/assets/heritage-kuroi-01-l-oyabun.webp?v=v13.6-heritage-premium','/assets/heritage-kuroi-02-giri.webp?v=v13.6-heritage-premium','/assets/heritage-kuroi-03-les-mains-sales.webp?v=v13.6-heritage-premium','/assets/heritage-kuroi-04-la-dette.webp?v=v13.6-heritage-premium','/assets/heritage-kuroi-05-le-conseil.webp?v=v13.6-heritage-premium',
  '/assets/heritage-maitre-01-le-client-final.webp?v=v34.9-maitre-theme-posters','/assets/heritage-maitre-02-le-deal-final.webp?v=v34.9-maitre-theme-posters','/assets/heritage-maitre-03-deux-choix-final.webp?v=v34.9-maitre-theme-posters','/assets/heritage-maitre-04-le-proces-final.webp?v=v34.9-maitre-theme-posters','/assets/heritage-maitre-05-l-honneur-final.webp?v=v34.9-maitre-theme-posters',
  '/assets/omerta-021-l-enveloppe.webp?v=12.37-final','/assets/omerta-022-omerta.webp?v=12.37-final','/assets/omerta-023-la-table.webp?v=12.37-final','/assets/omerta-024-il-pentito.webp?v=12.37-final','/assets/omerta-025-il-don.webp?v=12.37-final',
  '/assets/terror-026-la-ville-tombe.webp?v=12.37-final','/assets/terror-027-la-zone-rouge.webp?v=12.37-final','/assets/terror-028-dernier-perimetre.webp?v=12.37-final',
  '/assets/cartel-029-le-cycle-mort.webp?v=12.37-final','/assets/cartel-030-la-cour-achetee.webp?v=12.37-final','/assets/cartel-031-la-dette.webp?v=12.37-final',
  '/assets/regime-032-les-archives-du-palais.webp?v=12.37-final','/assets/regime-033-la-dynastie.webp?v=12.37-final','/assets/regime-034-les-noms-quils-portaient.webp?v=12.37-final'
];

async function precacheShell(){
  const cache=await caches.open(CACHE);
  const failed=[];
  await Promise.all(SHELL.map(async url=>{
    try{
      const request=new Request(url,{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      await cache.put(request,response);
    }catch(error){
      failed.push(`${url} (${String(error?.message||error)})`);
    }
  }));
  if(failed.length)console.warn('[IGR SW] precache partial failure',failed);
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    await precacheShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('igr-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  const runtimeFile=req.mode==='navigate'||/\.(?:js|css|html)$/.test(url.pathname);
  const navigationKey=url.pathname==='/en.html'?'/en.html':'/index.html';
  const key=req.mode==='navigate'?navigationKey:req;

  if(runtimeFile){
    event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{
      if(r.ok){
        const copy=r.clone();
        event.waitUntil(caches.open(CACHE).then(c=>c.put(key,copy)).catch(()=>{}));
      }
      return r;
    }).catch(()=>caches.match(key).then(cached=>cached||Response.error())));
    return;
  }

  event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{
    if(r.ok){
      const copy=r.clone();
      event.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));
    }
    return r;
  }).catch(()=>caches.match(req).then(cached=>cached||Response.error())));
});
