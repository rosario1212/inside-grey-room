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
     scrollWidth:document.documentElement.scrollWidth, viewport:innerWidth,
     inputs:[...main.querySelectorAll('.casino-entry-option input')].length,
     pages:document.querySelectorAll('#app .app').length,
     overflow:rects.filter(r=>r.x<-.6||r.right>innerWidth+.6).map(r=>({left:r.x,right:r.right})),
     tableGrid:getComputedStyle(main.querySelector('.casino-live-top')).display,
     headerRows:[...main.querySelector('.casino-live-top').children].map(el=>({x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right,top:el.getBoundingClientRect().top})),
     body:main.textContent.includes('Organiser une partie')&&main.textContent.includes('Rejoindre des amis')
    };
   });
   assert.equal(after.pages,1,'The campaign must stay in one shared app shell, no duplicate wrapper');
   assert(after.body&&after.inputs===3,'The actual playable Casino entry page must appear');
   assert(before.bar.width>0&&after.bar.width>0,'The topbar cannot disappear after campaign launch');
   assert(Math.abs(before.bar.x-after.bar.x)<1.5,'Campaign navigation topbar must not shift sideways');
   assert(Math.abs(before.main.x-after.main.x)<1.5,'Opening Casino must preserve the campaign horizontal frame');
   assert(Math.abs(before.main.width-after.main.width)<1.5,'Casino public/live screens must use equal content widths');
   assert(after.main.top>=after.bar.top+20,'Casino view must stay below the topbar');
   assert(after.content.width>0&&after.tableGrid==='grid','The form and action header must use reliable grid alignment');
   assert(after.scrollWidth<=width+1,'Casino entry must not cause horizontal scrolling');
   assert.equal(after.overflow.length,0,'Casino controls must fit viewport '+JSON.stringify(after.overflow));
   assert(after.headerRows.length>=2,'The back control and campaign label must stay visible');
   if(width<=393)assert(after.headerRows[0].top===after.headerRows[1].top,'Mobile header must stay on one aligned row');
  });
 }
 console.log('PASS CASINO v761: actual public campaign -> playable entry click keeps topbar and centered responsive layout');
}
