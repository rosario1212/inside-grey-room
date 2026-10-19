import assert from 'node:assert/strict';
// Independent browser contexts, real shipped notification/card/message renderers,
// deterministic authorized projections. No real room, account or consent is used.
export async function runNotificationChecks({page,read,check,css}){
 const [notify,bell,common,app,modes]=await Promise.all(['notifications-v12.js','notification-bell-visibility-v31.js','common-dossier-v106.js','app-v11.js','play-modes-v13-8.js'].map(read));
 const messageRenderer=app.slice(app.indexOf('function renderMessages(channel)'),app.indexOf('\nfunction renderTimelineTab()',app.indexOf('function renderMessages(channel)')));
 const contexts=[];let enq,suspect;
 async function session(role){
  const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}});contexts.push(ctx);const p=await ctx.newPage();
  await p.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><div id="app"></div></body></html>');
  await p.addScriptTag({content:`
   var STORE=new Map(),STORAGE={getItem:k=>STORE.get(k)||null,setItem:(k,v)=>STORE.set(k,String(v)),removeItem:k=>STORE.delete(k)};
   var STATE={view:'game',room:'SYNTHETIC',token:'synthetic-'+${JSON.stringify(role)},tab:'card',sync:{room:{code:'SYNTHETIC',status:'playing',phase:'interrogation',cycle:1,state:{match_no:1}},player:{id:${JSON.stringify(role)},public_role:${JSON.stringify(role)}},events:[],scenario:{context:'Contexte public fictif.'}}};
   var publicEvents=[];function rpc(){return Promise.resolve({room_code:'SYNTHETIC',context:'Contexte public fictif.',events:structuredClone(publicEvents)})}
   function h(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
   function gameTabs(){return [{id:'card',label:'Ma fiche'},{id:'investigation',label:'Enquête'},{id:'timeline',label:'Dossier commun'},{id:'channel',label:'Canal'}]};
   ${messageRenderer}
   function renderGameTab(){return STATE.tab==='channel'?'<div class="message-list">'+renderMessages('investigation')+renderMessages('private')+'</div>':STATE.tab==='investigation'?STATE.sync.events.filter(e=>e.event_type!=='message').map(e=>'<article data-igr-event-id="'+e.id+'"><h3>'+h(e.payload.title)+'</h3><p>'+h(e.payload.text)+'</p></article>').join(''):'<article class="private-card-v11"><h2>Ma fiche</h2><textarea id="privateNote">Brouillon fictif</textarea></article>'};
   function renderGame(){document.getElementById('app').innerHTML='<div class="app"><header class="topbar"><div class="top-actions"><button aria-label="Paramètres">⚙</button></div></header><main class="game-v11"><div class="phase-strip"><strong>INTERROGATOIRE</strong></div><div class="tabs-v11">'+gameTabs().map(t=>'<button class="tab" onclick="setTab(\\''+t.id+'\\')">'+t.label+'</button>').join('')+'</div><section class="game-panel-v11">'+renderGameTab()+'</section></main></div>';document.querySelector('body>.live-session-controls')?.remove();const controls=document.createElement('div');controls.className='live-session-controls';controls.innerHTML='<button>Quitter</button>';document.body.appendChild(controls)};
   function setTab(t){STATE.tab=t;renderGame()};function saveSession(){};
   window.addEvent=function(id,type,body='Message fictif',visibility='private'){STATE.sync.events.push({id,event_type:type,cycle:1,visibility,created_at:new Date().toISOString(),payload:{title:'Élément '+id,text:body,channel:'investigation',author_id:'another-player'}})};
  `});
  await p.addScriptTag({content:common});await p.addScriptTag({content:notify});await p.addScriptTag({content:bell});await p.evaluate(()=>renderGame());
  return p;
 }
 try{
  await check('notifications-independent-multiplayer-sessions',async()=>{
   enq=await session('enqueteur');suspect=await session('suspect');
   await enq.locator('#igrNotifyBell').waitFor({state:'visible'});await suspect.locator('#igrNotifyBell').waitFor({state:'visible'});
   const overlap=await enq.locator('#igrNotifyBell').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.querySelector('[aria-label="Paramètres"]').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top});assert.equal(overlap,false);
   await enq.evaluate(()=>{addEvent(1,'message');addEvent(2,'expert','Texte confidentiel fictif.');addEvent(3,'message')});
   await enq.locator('.igr-notify-count').getByText('3',{exact:true}).waitFor();
   assert.equal(await suspect.locator('.igr-notify-count').textContent(),'','A different player receives no confidential event');
   assert.equal(await suspect.locator('[data-unread]').count(),0);
   assert.equal(await enq.locator('[onclick="setTab(\'channel\')"] .igr-tab-unread').textContent(),'2');
   assert.equal(await enq.locator('[onclick="setTab(\'investigation\')"] .igr-tab-unread').textContent(),'1');
   await enq.waitForTimeout(1400);assert.equal(await enq.locator('.igr-event-alert').count(),1,'A banner is still visible after the former 1.1-second removal');
   await enq.locator('.igr-alert-close').click();assert.equal(await enq.evaluate(()=>STATE.tab),'card','Dismiss must not navigate');
  });
  await check('notifications-selective-read-and-exact-navigation',async()=>{
   await enq.locator('#igrNotifyBell').click();assert.equal(await enq.locator('.igr-notification-row[aria-pressed="false"]').count(),3);
   assert.equal(await enq.locator('.igr-notify-count').textContent(),'3','Opening the center does not acknowledge any item');
   await enq.getByRole('button',{name:'Fermer',exact:true}).click();await enq.evaluate(()=>setTab('channel'));
   await enq.waitForTimeout(1600);assert.equal(await enq.locator('.igr-notify-count').textContent(),'1','Only visible messages are read');
   await enq.locator('#igrNotifyBell').click();await enq.locator('.igr-notification-row').filter({hasText:'Résultat d’expertise'}).click();
   await enq.locator('[data-igr-event-id="2"].igr-notification-target').waitFor();await enq.waitForTimeout(1600);
   assert.equal(await enq.locator('.igr-notify-count').textContent(),'');
   await enq.evaluate(()=>{setTab('card');for(let i=4;i<=10;i++)addEvent(i,'message')});await enq.waitForTimeout(1000);
   await enq.locator('.igr-alert-open').filter({hasText:'Nouveaux messages · 7'}).waitFor();
  });
  await check('notifications-public-dossier-and-player-isolation',async()=>{
   await suspect.evaluate(()=>IGR_COMMON_DOSSIER_V106.syncPublic(true));
   await suspect.evaluate(async()=>{publicEvents.push({id:20,event_type:'breaking_news',cycle:2,title:'Publication publique fictive',text:'Information accessible à tous.'});await IGR_COMMON_DOSSIER_V106.syncPublic(true)});
   await suspect.locator('.igr-notify-count').getByText('1',{exact:true}).waitFor();
   await suspect.locator('#igrNotifyBell').click();await suspect.locator('.igr-notification-row').filter({hasText:'Publication publique fictive'}).click();
   await suspect.locator('[data-igr-event-id="20"].igr-notification-target').waitFor();
   assert.equal(await suspect.locator('[onclick="setTab(\'investigation\')"]').count(),0,'Suspects never gain the private investigation tab');
   assert(!await suspect.locator('#app').innerText().then(t=>t.includes('Texte confidentiel fictif.')));
   await enq.evaluate(()=>{STATE.sync.player={id:'new-player',public_role:'suspect'};STATE.tab='card';renderGame()});await enq.waitForTimeout(800);
   assert.equal(await enq.locator('.igr-notify-count').textContent(),'','A role switch clears the previous identity alerts');
   assert.equal(await enq.locator('.igr-event-alert').count(),0,'Queued banners cannot cross player identities');
  });
  await check('local-history-never-reveals-future-clues',async()=>{
   const start=modes.indexOf('function localFindingKind('),end=modes.indexOf('function renderLocalCycle(',start);assert(start>=0&&end>start);
   const history=modes.slice(start,end);await page.setContent('<main></main>');
   await page.addScriptTag({content:`var esc=v=>String(v);${history};window.fixture={cycle:2,revealedCycles:[1],tramePlan:[{kind:'clarity',title:'Indice ancien',text:'Déjà révélé'},{kind:'clarity',title:'Indice futur',text:'Encore scellé'}]};document.querySelector('main').innerHTML=localHistory(fixture)`});
   assert(await page.locator('.local-evidence-history').innerHTML().then(t=>t.includes('Indice ancien')&&!t.includes('Indice futur')&&!t.includes('clarity')));
  });
 }finally{for(const ctx of contexts)await ctx.close()}
}
