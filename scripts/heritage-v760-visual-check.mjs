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

 // v824: campaign cover typography appears exactly once. Cendres and Kuroi
 // use the titles printed on the art; Maître retains its editorial heading.
 // The three share one geometry and keep distinct campaign colors; Casino is excluded.
 const hubCards=[
  ['cendres','CONTRE-ESPIONNAGE / SERVICE NATIONAL','CENDRES',"Identifiez une compromission interne avant qu'elle ne déforme toute la chaîne de renseignement."],
  ['kuroi','JAPON / DETTES / POLICE','KUROI','Une alliance contre nature. Des dettes qui survivront à chaque dossier.'],
  ['maitre','DROIT PÉNAL / DÉFENSE','MAÎTRE',"Construisez une défense. Laissez des traces. Assumez ce qu'elles deviendront."]
 ];
 for(const width of [320,393,430,600]){
  await check('heritage-v824-premium-covers-'+width,async()=>{
   await page.setViewportSize({width,height:852});
   const cards=hubCards.map(([id,eyebrow,title,description])=>
    '<button type="button" class="hplay-campaign-card hplay-theme-'+id+(id==='maitre'?' maitre-hub-card':'')+'"><img alt="" src="'+poster+'"><span class="hplay-campaign-shade"></span>'+
    '<span class="hplay-campaign-body"><em>'+eyebrow+'</em><strong>'+title+'</strong><small>'+description+'</small>'+
    '<span class="hplay-campaign-foot"><b>0/5 DOSSIERS</b><i>COMMENCER →</i></span></span></button>').join('');
   await page.setContent(screen('<main class="page hplay hplay-hub"><section class="hplay-hub-grid">'+cards+'</section></main>'));
   const measured=await page.evaluate(()=>[...document.querySelectorAll('.hplay-hub-grid>.hplay-campaign-card')].map(card=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const img=card.querySelector('img'),shade=card.querySelector('.hplay-campaign-shade');
    const body=card.querySelector('.hplay-campaign-body'),title=body.querySelector('strong'),footer=body.querySelector('.hplay-campaign-foot');
    return {
     display:getComputedStyle(card).display,card:rect(card),image:rect(img),
     imageFit:getComputedStyle(img).objectFit,imagePosition:getComputedStyle(img).position,
     artAlignment:getComputedStyle(img).objectPosition,titlePosition:getComputedStyle(title).position,
     shade:getComputedStyle(shade).backgroundImage,shadeDisplay:getComputedStyle(shade).display,
     body:rect(body),title:rect(title),footer:rect(footer),
     titleFont:parseFloat(getComputedStyle(title).fontSize),
     color:getComputedStyle(title).color,accent:getComputedStyle(card).getPropertyValue('--igr-poster-accent').trim(),
     overflow:body.scrollWidth>body.clientWidth+1
    };
   }));
   assert.equal(measured.length,3);
   for(const [i,m] of measured.entries()){
    assert.equal(m.display,'block','Cinematic cover presentation '+hubCards[i][0]);
    assert.equal(m.imageFit,'cover','Full-bleed poster '+hubCards[i][0]);
    assert.equal(m.imagePosition,'absolute','Poster must be background layer '+hubCards[i][0]);
    assert.equal(m.shadeDisplay,'block','Gradient overlay must be visible '+hubCards[i][0]);
    assert(m.shade.includes('linear-gradient'),'Premium gradient preserves white-text contrast');
    assert(m.card.h>=390&&m.card.h<=490,'Paid campaign poster must be immersive, not a thumbnail '+hubCards[i][0]+' '+width);
    assert(Math.abs(m.image.w-m.card.w)<=2.5&&Math.abs(m.image.h-m.card.h)<=2.5,'Art must fill the entire premium card '+hubCards[i][0]);
    if(i<2){
     assert.equal(m.artAlignment,'50% 0%','Embedded campaign poster title must not be cropped '+hubCards[i][0]);
     assert.equal(m.titlePosition,'absolute','Do not repeat the printed poster title '+hubCards[i][0]);
     assert(m.title.w<=1.5&&m.title.h<=1.5,'Duplicate campaign heading should be visually hidden '+hubCards[i][0]);
    }else{
     assert(m.titleFont>=35,'Maître must still be identifiable on the first dossier artwork');
     assert(m.title.y>m.card.y+70,'Maître label should not obscure the cover face');
    }
    assert(m.footer.bottom<=m.card.bottom+1,'Bottom navigation remains inside poster '+hubCards[i][0]);
    assert(m.body.right<=m.card.right+1&&!m.overflow,'No text clipping '+hubCards[i][0]);
   }
   assert.equal(new Set(measured.map(m=>m.accent)).size,3,'Each premium campaign keeps a separate art direction accent');
   assert(Math.max(...measured.map(m=>m.card.h))-Math.min(...measured.map(m=>m.card.h))<2,'The three campaigns share one cover height');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No sideways scrolling on iPhone');
  });
 }

 // The 18:06 recording also showed cropped chapter banners and near-invisible
 // locked chapters. Verify both from real responsive browser styles.
 for(const campaign of ['cendres','kuroi']){
  for(const width of [320,393,430]){
   await check('heritage-v824-chapter-progress-'+campaign+'-'+width,async()=>{
    await page.setViewportSize({width,height:852});
    await page.setContent(screen('<main class="page hplay hplay-campaign hplay-theme-'+campaign+'">'+
     '<section class="hplay-campaign-hero"><img src="'+poster+'" alt="Affiche de campagne">'+
     '<div><span>0/5 DOSSIERS</span><strong>DOSSIER 035 ACTIF</strong></div></section>'+
     '<button class="hplay-case" type="button" disabled><span class="hplay-case-poster"><img src="'+poster+'" alt=""></span>'+
     '<span class="hplay-case-copy"><em>036</em><strong>04:17</strong><small>Un faux drapeau transforme l’enquête en crise.</small><b>VERROUILLÉ</b></span></button></main>'));
    const m=await page.evaluate(()=>{
     const q=s=>document.querySelector(s),b=q('.hplay-campaign-hero'),img=q('.hplay-campaign-hero>img'),
      status=q('.hplay-campaign-hero>div'),locked=q('.hplay-case');
     const rect=e=>{const x=e.getBoundingClientRect();return {x:x.x,y:x.y,right:x.right,bottom:x.bottom,w:x.width,h:x.height}};
     return {banner:rect(b),art:rect(img),status:rect(status),fit:getComputedStyle(img).objectFit,
      disabled:getComputedStyle(locked).opacity,artFilter:getComputedStyle(locked.querySelector('img')).filter,
      scroll:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    assert.equal(m.fit,'contain','Chapter hero must show the COMPLETE portrait cover');
    assert(m.art.w>=62&&m.art.w<=72&&m.art.h>=110&&m.art.h<=123,'Portrait must be a legible compact element');
    assert(m.status.x>m.art.right&&m.status.right<=m.banner.right+1,'Status alongside art, never on top of it');
    assert(m.banner.h>=138&&m.banner.h<=175,'Avoid oversized campaign hero');
    assert(Number(m.disabled)>=.7,'Locked chapter descriptions must remain readable');
    assert(m.scroll<=m.viewport+1,'No sideways chapter scrolling');
   });
  }
 }


 // v825: measure the report link against the end of the actual shell.
 for(const width of [320,393,430]){
  await check('heritage-v825-footer-adjacency-'+width,async()=>{
   await page.setViewportSize({width,height:852});
   const fixture='<div class="app"><main class="page hplay hplay-hub"><section class="hplay-hub-grid">'+
    '<button class="hplay-campaign-card hplay-theme-cendres"><img src="'+poster+'"><span class="hplay-campaign-shade"></span><span class="hplay-campaign-body"><strong>CENDRES</strong></span></button>'+
    '<button class="hplay-campaign-card casino-entry"><span class="casino-poster"><img src="'+poster+'"></span><span class="hplay-campaign-body"><strong>CASINO</strong></span></button>'+
    '</section></main></div>';
   await page.setContent(screen(fixture).replace('</body>','<footer class="igr-beta-footer" style="display:flex;justify-content:center;padding:20px"><a href="support.html">Signaler un problème</a></footer></body>'));
   const d=await page.evaluate(()=>{
    const c=document.querySelector('.casino-entry').getBoundingClientRect();
    const f=document.querySelector('.igr-beta-footer').getBoundingClientRect();
    const a=document.querySelector('.igr-beta-footer a').getBoundingClientRect();
    return {gap:f.top-c.bottom,linkGap:a.top-c.bottom,height:a.height,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
   });
   assert(d.gap>=-1&&d.gap<=12,'No blank region between the final campaign and report footer: '+JSON.stringify(d));
   assert(d.linkGap<=16&&d.height>=44,'Report action sits directly under campaign with accessible tap area');
   assert(d.scroll<=d.viewport+1,'Footer layout has no sideways scroll');
  });
 }

 for(const [campaign,theme] of steps){
  for(const [width,height] of [[320,700],[393,852],[1180,850]]){
   await check('heritage-v760-'+campaign+'-mode-'+width,async()=>{
    await page.setViewportSize({width,height});
    await page.setContent(screen('<main class="page hplay hplay-dossier '+theme+'">'+
     '<header class="hplay-top"><button class="hplay-back">← RETOUR</button><div class="hplay-mode">DOSSIER 01</div></header>'+
     '<div class="hplay-dossier-grid"><div class="hplay-poster"><img alt="Affiche de test" src="'+poster+'"></div>'+
     '<section class="hplay-dossier-copy"><span class="hplay-eyebrow">HÉRITAGE · DOSSIER 01</span><h1>PERSONNE N’EXISTE</h1><div class="hplay-launch-box"><b>MODE DE JEU</b><p>En ligne ou en local.</p>'+
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
      title:rect(pick('.hplay-dossier-copy h1')),grid:rect(pick('.hplay-dossier-grid')),chooser:rect(pick('.hplay-launch-box')),
      copyDisplay:getComputedStyle(pick('.hplay-dossier-copy')).display,
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
    if(width<=393){
     assert.equal(data.copyDisplay,'block','Dossier copy follows the full-width artwork');
     assert(Math.abs(data.poster.w-data.grid.w)<=2,'Poster occupies the entire reading column');
     assert(Math.abs(data.poster.x-data.grid.x)<=1,'Poster left edge aligned with content');
     assert(Math.abs(data.poster.right-data.grid.right)<=1,'No lateral blank bands');
     assert(data.title.y>=data.poster.bottom&&data.title.y-data.poster.bottom<65,'Title follows the complete poster');
     assert(data.chooser.y>=data.title.bottom&&data.chooser.y-data.title.bottom<38,'Play modes follow the dossier title');
     assert(data.chooser.w>=data.grid.w-2,'Mode buttons use full available width');
    }
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
