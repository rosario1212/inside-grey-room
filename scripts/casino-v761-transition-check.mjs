import assert from 'node:assert/strict';

/* Compare the ACTUAL public Casino campaign -> "Jouer la campagne" transition.
   No requests, user credentials, real room data or hidden story state. */
export async function runCasinoV761TransitionChecks({page,css,read,check}){
 const app=await read('app-v11.js');
 const from=app.indexOf('function shell(');
 const until=app.indexOf('\nfunction renderHome(',from);
 assert(from>=0&&until>from,'The actual shared shell must be present');
 const shellSource='const VERSION="casino-v761-test";\n'+app.slice(from,until);
 const catalog=await read('heritage-casino-v91.js');
 const client=await read('casino-client-v105.js');
 const journey=await read('heritage-journey-v755.js');
 const pageHtml='<!doctype html><html lang="fr"><head>'+
  '<meta name="viewport" content="width=device-width, initial-scale=1"/>'+
  '<style>'+css+'</style></head><body><div id="app"></div></body></html>';
 for(const [width,height] of [[320,720],[393,852],[768,900],[1280,900]]){
  await check('casino-v761-real-play-click-'+width,async()=>{
   await page.setViewportSize({width,height});
   await page.setContent(pageHtml);
   await page.addScriptTag({content:shellSource});
   await page.addScriptTag({content:catalog});
   await page.addScriptTag({content:client});
   await page.addScriptTag({content:journey});
   await page.evaluate(()=>window.IGR_CASINO_HERITAGE.open());
   const before=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,right:r.right,top:r.top,width:r.width}};
    return {main:box('#app .casino-page[data-casino-page="campaign"]'),bar:box('#app .app>.topbar'),
     shell:box('#app .app'),children:document.querySelectorAll('#app .app').length};
   });
   await page.locator('.casino-page[data-casino-page="campaign"] .casino-launch-button[data-casino-live]').click();
   await page.waitForSelector('#casino-live-v105 .casino-entry-options');
   const after=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,right:r.right,top:r.top,width:r.width,height:r.height}};
    const main=document.querySelector('#app .app>#casino-live-v105');
    const bar=document.querySelector('#app .app>.topbar');
    const content=main?.querySelector('.casino-content');
    const host=main?.querySelector('.casino-entry-option');
    const rects=[main,bar,content,host,...main.querySelectorAll('.casino-entry-option input,.casino-entry-option .casino-action')].map(el=>el.getBoundingClientRect());
    return {
     main:box('#app .app>#casino-live-v105'),bar:box('#app .app>.topbar'),
     shell:box('#app .app'),content:box('#app .casino-content'),
     status:main?.querySelector('.casino-live-top')?.textContent.trim(),
     scrollWidth:document.documentElement.scrollWidth, viewport:innerWidth, scrollY:window.scrollY,
     inputs:[...main.querySelectorAll('.casino-entry-option input')].length,
     tabCount:main.querySelectorAll('.casino-entry-tab').length,
     selectedTab:main.querySelector('.casino-entry-tab[aria-selected="true"]')?.dataset.mode,
     panelCount:main.querySelectorAll('.casino-entry-option').length,
     connectionText:main.querySelector('[data-casino-connection]')?.textContent.trim()||'',
     unnecessaryProgress:main.querySelectorAll('.hj-progress').length,
     pages:document.querySelectorAll('#app .app').length,
     overflow:rects.filter(r=>r.x<-.6||r.right>innerWidth+.6).map(r=>({left:r.x,right:r.right})),
     tableGrid:getComputedStyle(main.querySelector('.casino-live-top')).display,
     headerRows:[...main.querySelector('.casino-live-top').children].map(el=>({x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right,top:el.getBoundingClientRect().top,centerY:el.getBoundingClientRect().top+el.getBoundingClientRect().height/2})),
     body:main.textContent.includes('Une table à Macao')&&main.textContent.includes('Créer')&&main.textContent.includes('Rejoindre')
    };
   });
   assert.equal(after.pages,1,'The campaign must stay in one shared app shell, no duplicate wrapper');
   assert(after.body&&after.inputs===1&&after.panelCount===1&&after.tabCount===2,
    'Casino must show only the selected Create panel, never two stacked forms');
   assert.equal(after.selectedTab,'create','The standard play button should show the creation tab');
   assert.equal(after.connectionText,'','Do not show a pointless Connexion… indicator on the entry screen');
   assert.equal(after.unnecessaryProgress,0,'Casino Create/Join must not show the redundant Étape 4/5 progress bar');
   assert(before.bar.width>0&&after.bar.width>0,'The topbar cannot disappear after campaign launch');
   assert(Math.abs(before.bar.x-after.bar.x)<1.5,'Campaign navigation topbar must not shift sideways');
   assert(Math.abs(before.main.x-after.main.x)<1.5,'Opening Casino must preserve the campaign horizontal frame');
   assert(Math.abs(before.main.width-after.main.width)<1.5,'Casino public/live screens must use equal content widths');
   assert(after.main.top>=after.bar.top+20,'Casino view must stay below the topbar');
   assert(after.content.width>0&&after.tableGrid==='grid','The form and action header must use reliable grid alignment');
   assert(after.scrollY<=2,'The public campaign scroll position must be cleared on entry');
   assert(after.scrollWidth<=width+1,'Casino entry must not cause horizontal scrolling');
   assert.equal(after.overflow.length,0,'Casino controls must fit viewport '+JSON.stringify(after.overflow));
   assert(after.headerRows.length>=2,'The back control and campaign label must stay visible');
   if(width>350&&width<=393)assert(Math.abs(after.headerRows[0].centerY-after.headerRows[1].centerY)<3,'Normal mobile header elements must align on the same visual baseline');
   if(width<=350)assert(after.headerRows[1].top>after.headerRows[0].top,'Narrow phones should use two readable non-overlapping header rows');
   await page.locator('#casino-join-tab').click();
   assert.equal(await page.locator('.casino-entry-option input').count(),2,'Join tab must expose code and name, not the host form');
   assert.equal(await page.locator('.casino-entry-option').count(),1,'Join should display one panel only');
   assert.equal(await page.locator('#casino-join-tab').getAttribute('aria-selected'),'true');
   await page.locator('#casino-create-tab').click();
   assert.equal(await page.locator('.casino-entry-option input').count(),1,'Create should restore the host form');

   await page.evaluate(()=>window.IGR_CASINO_HERITAGE.open());
   await page.locator('.casino-page[data-casino-page="campaign"] [data-casino-join]').click();
   await page.waitForSelector('#casino-join-tab[aria-selected="true"]');
   assert.equal(await page.locator('.casino-entry-option input').count(),2,'Direct campaign join must go straight to code/name');
   assert.equal(await page.locator('.casino-entry-option').count(),1,'Direct join must not repeat the creation form');
   assert(!await page.locator('.casino-live').innerText().then(x=>x.includes('Connexion…')),'No fake connection message');

  });
 }
 // A saved room must NEVER show the creation form while the first
 // authoritative sync is still outstanding. Reproduce a slow response.
 await check('casino-v763-no-intermediate-form-on-resume',async()=>{
  await page.setViewportSize({width:393,height:852});
  // Storage is unavailable on an about:blank setContent document. Serve the
  // synthetic HTML from a routed HTTPS origin, exactly like the real PWA.
  const fixtureUrl='https://casino-v763-fixture.test/entry';
  await page.route(fixtureUrl,route=>route.fulfill({
   status:200,contentType:'text/html; charset=utf-8',body:pageHtml
  }));
  await page.goto(fixtureUrl,{waitUntil:'domcontentloaded'});
  await page.addScriptTag({content:shellSource});
  await page.addScriptTag({content:catalog});
  await page.addScriptTag({content:client});
  await page.addScriptTag({content:journey});
  await page.evaluate(()=>{
   localStorage.setItem('igr_casino_identity_v1',JSON.stringify({
    roomId:'b741b335-7040-4dbc-934f-b19d49595753',
    sessionToken:'b'.repeat(64)
   }));
   window.__casinoOriginalFetch=window.fetch;
   window.__casinoFetchCalls=0;
   window.fetch=()=>{window.__casinoFetchCalls++;return new Promise(resolve=>{window.__casinoDeliver=resolve})};
   window.IGR_CASINO_HERITAGE.open();
  });
  await page.locator('.casino-launch-button[data-casino-live]').click();
  await page.waitForFunction(()=>typeof window.__casinoDeliver==='function');
  await page.waitForTimeout(750);
  const before=await page.evaluate(()=>({
   campaign:document.querySelectorAll('.casino-page[data-casino-page="campaign"]').length,
   live:document.querySelectorAll('#casino-live-v105').length,
   unwanted:document.querySelectorAll('.casino-entry-options,.casino-entry-tabs').length,
   busy:document.querySelector('.casino-launch-button')?.getAttribute('aria-busy'),
   disabled:document.querySelector('.casino-launch-button')?.disabled
  }));
  assert.equal(before.campaign,1,'Keep the original campaign while resuming the saved room');
  assert.equal(before.live,0,'No Casino lobby or temporary room form before server confirmation');
  assert.equal(before.unwanted,0,'Never flash the Create/Join screen during resume');
  assert.equal(before.busy,'true','A discreet busy signal remains on the clicked button');
  assert(before.disabled,'Repeated clicks cannot create duplicate opens');
  await page.evaluate(()=>{
   window.__casinoDeliver({
    ok:true,
    json:async()=>({
     roomId:'b741b335-7040-4dbc-934f-b19d49595753',
     revision:1,status:'lobby',inviteCode:'C876543210',
     chapter:1,phase:1,isHost:true,viewer:'p1',
     members:[{id:'p1',name:'Hôte fictif',role:null,ready:false}]
    })
   });
  });
  await page.waitForSelector('#casino-live-v105 .casino-lobby-top');
  const after=await page.evaluate(()=>({
   lobby:document.querySelectorAll('#casino-live-v105 .casino-lobby-top').length,
   temp:document.querySelectorAll('#casino-live-v105 .casino-entry-tabs').length,
   campaign:document.querySelectorAll('.casino-page[data-casino-page="campaign"]').length,
   scroll:window.scrollY,
   rootCount:document.querySelectorAll('#app>.app').length
  }));
  assert.equal(after.lobby,1,'The first rendered Casino view must be the actual restored lobby');
  assert.equal(after.temp,0,'There must be no transient Create/Join view after the reply');
  assert.equal(after.campaign,0,'The public page is replaced exactly once');
  assert(after.scroll<=2,'The final room opens at the top');
  assert.equal(after.rootCount,1,'Keep the same app shell');

  // A failed sync still gives the guest a usable form, rather than freezing
  // the old campaign forever or faking a successful resume.
  await page.evaluate(()=>{
   window.IGR_CASINO_CLIENT.close();
   window.fetch=()=>Promise.reject(new Error('network_uncertain'));
  });
  await page.locator('.casino-launch-button[data-casino-live]').click();
  await page.waitForSelector('#casino-live-v105 .casino-entry-tabs');
  assert.equal(await page.locator('#casino-live-v105 .casino-error').count(),1,
   'Failed room verification should visibly offer recovery, not trap the user');
  await page.evaluate(()=>{
   window.fetch=window.__casinoOriginalFetch;
   localStorage.removeItem('igr_casino_identity_v1');
   localStorage.removeItem('igr_casino_identity_v1_pending');
   window.IGR_CASINO_CLIENT.close();
  });
  await page.unroute(fixtureUrl);
 });

 console.log('PASS CASINO v762: actual campaign Create/Join clicks, compact form, no connection noise and aligned frame');
 console.log('PASS CASINO v763: saved room opens atomically without a temporary form, including slow sync and failure fallback');
}
