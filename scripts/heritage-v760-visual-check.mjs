import assert from 'node:assert/strict';

/* Browser-level color, touch, crop and overflow tests.
   All fixtures are synthetic: no real accounts, rooms or hidden role data. */
export async function runHeritageV760VisualChecks({page,css,read,check}){
 const journey=await read('heritage-journey-v755.js');
 const poster='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="941" height="1672" viewBox="0 0 941 1672"><rect width="941" height="1672" fill="#a99782"/><rect x="90" y="140" width="761" height="1280" fill="#514a43"/></svg>');
 const steps=[
  ['cendres','hplay-theme-cendres'],
  ['kuroi','hplay-theme-kuroi'],
  ['maitre','hplay-theme-maitre maitre-page']
 ];
 const screen=markup=>'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div id="app">'+markup+'</div></body></html>';

 // v822: three illustrated covers share a compact left-poster / right-copy layout.
 // CASINO is excluded, preserving its existing independent card geometry.
 const hubCards=[
  ['cendres','CONTRE-ESPIONNAGE / SERVICE NATIONAL','CENDRES',"Identifiez une compromission interne avant qu'elle ne déforme toute la chaîne de renseignement."],
  ['kuroi','JAPON / DETTES / POLICE','KUROI','Une alliance contre nature. Des dettes qui survivront à chaque dossier.'],
  ['maitre','DROIT PÉNAL / DÉFENSE','MAÎTRE',"Construisez une défense. Laissez des traces. Assumez ce qu'elles deviendront."]
 ];
 for(const width of [320,393,430,600]){
  await check('heritage-v822-three-covers-'+width,async()=>{
   await page.setViewportSize({width,height:852});
   const cards=hubCards.map(([id,eyebrow,title,description])=>
    '<button type="button" class="hplay-campaign-card hplay-theme-'+id+(id==='maitre'?' maitre-hub-card':'')+'"><img alt="" src="'+poster+'"><span class="hplay-campaign-shade"></span>'+
    '<span class="hplay-campaign-body"><em>'+eyebrow+'</em><strong>'+title+'</strong><small>'+description+'</small>'+
    '<span class="hplay-campaign-foot"><b>0/5 DOSSIERS</b><i>COMMENCER →</i></span></span></button>').join('');
   await page.setContent(screen('<main class="page hplay hplay-hub"><section class="hplay-hub-grid">'+cards+'</section></main>'));
   const measured=await page.evaluate(()=>[...document.querySelectorAll('.hplay-hub-grid>.hplay-campaign-card')].map(card=>{
    const bounds=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const img=card.querySelector('img'),body=card.querySelector('.hplay-campaign-body'),footer=card.querySelector('.hplay-campaign-foot');
    return {display:getComputedStyle(card).display,card:bounds(card),image:bounds(img),fit:getComputedStyle(img).objectFit,
     body:bounds(body),footer:bounds(footer),overflow:body.scrollWidth>body.clientWidth+1};
   }));
   assert.equal(measured.length,3);
   for(const [i,m] of measured.entries()){
    assert.equal(m.display,'flex','Shared campaign geometry: '+hubCards[i][0]);
    assert.equal(m.fit,'contain','Uncropped poster: '+hubCards[i][0]);
    assert(m.card.h>=155&&m.card.h<=330,'No tall empty card: '+hubCards[i][0]+' '+width+' '+m.card.h);
    assert(m.image.y>=m.card.y-1&&m.image.bottom<=m.card.bottom+1,'Poster inside card: '+hubCards[i][0]);
    assert(m.body.x>=m.image.right+5,'Copy beside poster: '+hubCards[i][0]);
    assert(m.footer.bottom<=m.card.bottom+1,'Footer inside card: '+hubCards[i][0]);
    assert(m.body.right<=m.card.right+1&&!m.overflow,'No overlapping copy: '+hubCards[i][0]);
   }
   const heights=measured.map(m=>m.card.h);
   assert(Math.max(...heights)-Math.min(...heights)<45,'Three campaign cards must have comparable heights');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  });
 }
 for(const [campaign,theme] of steps){
  for(const [width,height] of [[320,700],[393,852],[1180,850]]){
   await check('heritage-v760-'+campaign+'-mode-'+width,async()=>{
    await page.setViewportSize({width,height});
    await page.setContent(screen('<main class="page hplay hplay-dossier '+theme+'">'+
     '<header class="hplay-top"><button class="hplay-back">← RETOUR</button><div class="hplay-mode">DOSSIER 01</div></header>'+
     '<div class="hplay-dossier-grid"><div class="hplay-poster"><img alt="Affiche de test" src="'+poster+'"></div>'+
     '<section class="hplay-dossier-copy"><h1>Dossier</h1><div class="hplay-launch-box"><b>MODE DE JEU</b><p>En ligne ou en local.</p>'+
     '<div class="heritage-dual-row"><button class="btn primary heritage-online-btn">MULTIJOUEUR EN LIGNE</button>'+
     '<button class="btn ghost heritage-local-btn">LOCAL · 1 TÉLÉPHONE</button></div></div></section></div></main>'));
    await page.addScriptTag({content:journey});
    await page.waitForFunction(()=>document.querySelectorAll('.hj-mode-icon svg').length===2);
    await page.locator('.hplay-poster img').evaluate(img=>img.decode());
    const data=await page.evaluate(()=>{
     const pick=q=>document.querySelector(q),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
     const online=pick('.hj-mode-online'),local=pick('.hj-mode-local'),poster=pick('.hplay-poster img');
     const modeCopy=pick('.hj-mode-online .hj-mode-copy'),onlineIcon=pick('.hj-mode-online .hj-mode-icon svg'),localIcon=pick('.hj-mode-local .hj-mode-icon svg');
     return {
      scroll:document.documentElement.scrollWidth,viewport:innerWidth,
      online:rect(online),local:rect(local),poster:rect(poster),
      icon:rect(onlineIcon),iconColor:getComputedStyle(onlineIcon).color,
      iconStroke:getComputedStyle(onlineIcon).stroke,
      localIconColor:getComputedStyle(localIcon).color,
      localIconStroke:getComputedStyle(localIcon).stroke,
      onlineColor:getComputedStyle(online).color,
      localColor:getComputedStyle(local).color,
      copyOverflow:modeCopy.scrollWidth>modeCopy.clientWidth+2,
      realIcons:document.querySelectorAll('.hj-mode-icon svg[stroke="currentColor"]').length
     };
    });
    assert.equal(data.realIcons,2,'Use two real SVG icons, not unreliable text glyphs');
    assert(data.icon.w>=20&&data.icon.h>=20,'The multiplayer icon must actually be visible');
    assert(data.iconStroke!=='none'&&data.iconColor===data.onlineColor,'Online icon must match the readable button label: '+campaign+' '+width+' '+JSON.stringify({svg:data.iconColor,button:data.onlineColor,stroke:data.iconStroke}));
    assert(data.localIconStroke!=='none'&&data.localIconColor===data.localColor,'Local icon must match the readable button label: '+campaign+' '+width+' '+JSON.stringify({svg:data.localIconColor,button:data.localColor,stroke:data.localIconStroke}));
    if(campaign==='maitre'){
     assert(!data.iconColor.includes('116, 46, 50'),'Burgundy-on-burgundy multiplayer icon would be invisible');
     assert(data.iconColor==='rgb(255, 245, 234)','MAÎTRE online icon must match ivory text on burgundy');
     assert(data.localColor==='rgb(92, 50, 49)','MAÎTRE local action must use dark ink on ivory');
     assert(data.localIconColor==='rgb(92, 50, 49)','MAÎTRE local icon must use the same dark ink on ivory');
    }
    for(const el of [data.online,data.local,data.poster]){
     assert(el.x>=-.5&&el.right<=data.viewport+.5,'Content must fit viewport '+campaign+' '+width);
    }
    assert(data.scroll<=data.viewport+1,'No sideways scroll in campaign chooser');
    assert(data.online.h>=44&&data.local.h>=44,'Both modes need 44px touch targets');
    assert(!data.copyOverflow,'Mode labels must not be clipped');
    assert(Math.abs(data.poster.w/data.poster.h-941/1672)<.012,'Dossier poster must keep native proportions');
    if(width<=393)assert(data.online.bottom<=data.local.y+1,'Touch modes should stack without overlap on iPhone');
   });
  }
 }
 for(const [campaign,theme,roleZone] of [
  ['cendres','hplay-theme-cendres','hnet-role-minimal'],
  ['kuroi','hplay-theme-kuroi','hnet-role-minimal'],
  ['maitre','hplay-theme-maitre maitre-page','mnet-role-simplified']
 ]){
  for(const width of [320,393]){
   await check('heritage-v760-'+campaign+'-roles-'+width,async()=>{
    await page.setViewportSize({width,height:852});
    await page.setContent(screen('<main class="page hnet '+theme+'"><header class="hnet-head">Salon</header>'+
     '<section class="hnet-lobby"><div class="hnet-title"><h1>Le dossier</h1></div>'+
     '<section class="hnet-role-zone '+roleZone+'"><div class="hnet-role-head"><div><h2>Ton rôle</h2></div></div>'+
     '<div class="hnet-selected-role"><span>TON CHOIX</span><b>ENQUÊTEUR</b><small>Enquête et recoupement des faits.</small></div>'+
     '<div class="hnet-role-grid">'+Array.from({length:6},(_,i)=>'<button class="hnet-role-card"><span class="hnet-role-top"><b>Rôle '+(i+1)+'</b></span><span class="hnet-stars">★★★★☆</span></button>').join('')+'</div>'+
     '<div class="'+(campaign==='maitre'?'mnet-role-actions':'hnet-role-actions')+'"><button type="button" class="hnet-role-random '+(campaign==='maitre'?'mnet-random-action':'hnet-random-action')+'"><b>Tirer un rôle</b></button></div></section></section></main>'));
    const result=await page.evaluate(()=>{
     const q=s=>document.querySelector(s),r=e=>e.getBoundingClientRect();
     const action=q('.hnet-role-random'),cards=[...document.querySelectorAll('.hnet-role-grid .hnet-role-card')];
     return {width:innerWidth,scroll:document.documentElement.scrollWidth,action:{width:r(action).width,height:r(action).height,right:r(action).right},cards:cards.map(x=>({height:r(x).height,right:r(x).right})),largeTile:action.classList.contains('hnet-role-card')};
    });
    assert(!result.largeTile,'Random must be a secondary action, not another giant card');
    assert(result.action.height>=44&&result.action.width<=190,'Random needs a compact accessible touch target');
    assert(result.action.right<=width+.5&&result.scroll<=width+1,'Lobby cannot scroll sideways');
    assert(result.cards.every(c=>c.height>=44&&c.right<=width+.5),'Role cards must stay usable without overflow');
   });
  }
 }
 for(const width of [320,393]){
  await check('heritage-v760-casino-roles-'+width,async()=>{
   await page.setViewportSize({width,height:852});
   await page.setContent(screen('<div class="casino-live" id="casino-live-v105"><div class="casino-lobby-top"><div class="casino-lobby-access"><h1>H4321</h1></div></div>'+
    '<section class="casino-role-choice-zone"><div class="casino-role-choice-heading"><h2>Choisis où jouer</h2></div>'+
    '<div class="casino-selected-role"><span>TON CHOIX</span><b>YONGHE</b><small>Le camp du casino.</small></div>'+
    '<div class="casino-role-choice-grid">'+['Yonghe','Agent','Enquêteur','Analyste','Procureur','Juge'].map(x=>'<button class="casino-role-choice-card"><span class="casino-role-choice-top"><b>'+x+'</b></span><small>Fonction disponible</small></button>').join('')+'</div></section></div>'));
   const sizes=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.casino-role-choice-card')].map(x=>({x:x.getBoundingClientRect().x,right:x.getBoundingClientRect().right,h:x.getBoundingClientRect().height}))}));
   assert(sizes.scroll<=sizes.w+1,'Casino must not horizontally overflow');
   assert(sizes.cards.every(c=>c.x>=-.5&&c.right<=sizes.w+.5&&c.h>=44),'Casino role cards must stay usable');
  });
 }
 // v762: A direct, accessible guest action exists on the Heritage hub,
 // Cendres, Kuroi and Maître campaign pages. Existing server join path is reused.
 for(const [campaign,klass] of [
  ['hub','hplay-hub'],['cendres','hplay-campaign hplay-theme-cendres'],
  ['kuroi','hplay-campaign hplay-theme-kuroi'],
  ['maitre','hplay-campaign hplay-theme-maitre maitre-page']
 ]){
  await check('heritage-v762-guest-entry-'+campaign,async()=>{
   await page.setViewportSize({width:393,height:852});
   const isHub=campaign==='hub';
   await page.setContent(screen('<main class="page hplay '+klass+'">'+
    '<header class="hplay-top"><button class="hplay-back">Retour</button><div class="hplay-mode">HÉRITAGE</div></header>'+
    (isHub?'<section class="hplay-hub-intro"><h1>Héritage</h1></section>'
     :'<section class="hplay-campaign-hero"><div><strong>'+campaign+'</strong></div></section>')+
    '</main>'));
   await page.addScriptTag({content:'window.__heritageJoinHits=0;function goJoin(){window.__heritageJoinHits++}'});
   await page.addScriptTag({content:journey});
   await page.waitForSelector('.hj-join-entry');
   const rect=await page.locator('.hj-join-entry').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {height:r.height,left:r.left,right:r.right,
     scroll:document.documentElement.scrollWidth,width:innerWidth,text:el.textContent.trim()};
   });
   assert.equal(rect.text,'Rejoindre une partie','Each campaign should expose the same clear Join CTA');
   assert(rect.height>=44&&rect.left>=0&&rect.right<=393&&rect.scroll<=393+1,'Join CTA must fit a mobile viewport');
   await page.locator('.hj-join-entry').click();
   assert.equal(await page.evaluate(()=>window.__heritageJoinHits),1,
    'Joining must delegate exactly once to the established invitation-code flow');
  });
 }

 console.log('PASS HÉRITAGE v760: 3 camp identity contrast, 3 responsive mode choosers, 3 compact role lobbies, Casino role choices');
 console.log('PASS HÉRITAGE v762: join action exists and works for hub, Cendres, Kuroi and Maître');
}
