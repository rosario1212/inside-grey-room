// Real independent browser sessions against the actual client and server logic.
// All identities and releases are synthetic; no production endpoint is changed.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {casinoService} from '../casino/service.mjs';
import {fixtureRelease,MemoryStorage} from './casino-fixtures.mjs';
const root=process.cwd(),resultDir=resolve('casino-qa-results');await mkdir(resultDir,{recursive:true});
const storage=new MemoryStorage();storage.approved=['A','B','C'].map(variant=>({...fixtureRelease(),id:'fixture-'+variant,variant}));
let now=Date.now();const service=casinoService(storage,{clock:()=>now}),errors=[],checks=[];
const server=createServer(async(req,res)=>{
 try{
  if(req.url==='/api/casino'){
   let raw='';for await(const chunk of req)raw+=chunk;
   try{const value=await service.process(JSON.parse(raw));res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
   catch(e){res.writeHead(e.message==='revision_conflict'?409:400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}))}return;
  }
  if(req.url==='/qa'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
   res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/styles-v11.css"><link rel="stylesheet" href="/heritage-casino-v91.css"><link rel="stylesheet" href="/casino-client-v105.css"><body><div id="app"></div><script src="/heritage-casino-v91.js"></script><script src="/casino-client-v105.js"></script></body></html>');return;
  }
  if(req.url==='/full'){
   const html=await readFile(join(root,'dist/index.html'),'utf8');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html.replace('<head>','<head><base href="/built/">'));return;
  }
  const pathname=new URL(req.url,'http://localhost').pathname,path=resolve(root,'.'+decodeURIComponent(pathname));
  if(!path.startsWith(root+'/')){res.writeHead(404);res.end();return}
  const actual=pathname.startsWith('/built/')?join(root,'dist',pathname.slice(7)):path;
  const data=await readFile(actual);res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[extname(path)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.IGR_CHROMIUM_PATH?{executablePath:process.env.IGR_CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
const contexts=[];
async function context(viewport){const c=await browser.newContext({viewport});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/qa');return {context:c,page:p}}
async function waitState(page,predicate){await page.waitForFunction(predicate,null,{timeout:12000})}
async function storageIdentity(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('igr_casino_identity_v1')))}
async function api(page,body){const id=await storageIdentity(page);return service.process({...id,...body})}
async function commandFor(page,type,payload={}){const v=await api(page,{op:'sync'});return api(page,{op:'command',type,payload,expectedRevision:v.revision,requestId:randomUUID()})}
async function visibleRevision(page,revision){await page.waitForFunction(rev=>document.querySelector('[data-casino-connection]')?.dataset.revision===String(rev),revision,{timeout:12000})}
async function layout(page,label){
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(dimensions.scroll<=dimensions.width+1,`${label}: horizontal overflow`);
 const small=await page.locator('button:visible').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().height<40).map(e=>e.textContent));assert.deepEqual(small,[],`${label}: touch targets too short`);
 await page.screenshot({path:join(resultDir,label+'.png'),fullPage:true});
}
try{
 // Full validated poster compositions are checked at each viewport, using the
 // shipped catalog rather than a mock-up or a newly generated image.
 for(const [label,viewport]of [['small-phone',{width:320,height:740}],['iphone',{width:390,height:844}],['landscape',{width:844,height:390}],['ipad',{width:820,height:1180}],['desktop',{width:1440,height:900}]]){
  const {page}=await context(viewport);await page.evaluate(()=>window.IGR_CASINO_HERITAGE.open());await page.locator('.casino-hero img').waitFor();
  await page.locator('.casino-hero img').evaluate(e=>e.decode());
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(async e=>{e.loading='eager';await e.decode()})));await page.locator('.casino-dossier').last().scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo(0,0));await layout(page,'posters-'+label);
  const launch=await page.locator('.casino-launch').boundingBox();assert(launch.y<Math.max(viewport.height,740)+180,'Campaign launch should not be buried below a giant cover');
  for(const chapter of [1,2,3]){await page.evaluate(n=>window.IGR_CASINO_HERITAGE.openChapter(n),chapter);await page.locator('.casino-chapter-cover img').evaluate(e=>e.decode());
   const image=await page.locator('.casino-chapter-cover img').evaluate(e=>({fit:getComputedStyle(e).objectFit,width:e.naturalWidth,height:e.naturalHeight}));
   assert.equal(await page.locator('.casino-poster img').first().evaluate(e=>getComputedStyle(e).contentVisibility),'visible');
   assert.equal(image.fit,'fill');assert.equal(image.width,1536);assert.equal(image.height,1024);
   const crop=await page.locator('.casino-chapter-cover .casino-poster').evaluate(e=>{const b=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect(),s=getComputedStyle(e);return {ratio:b.width/b.height,width:Number(s.getPropertyValue('--poster-width')),x:Number(s.getPropertyValue('--poster-x')),left:(b.left-i.left)/i.width,right:(b.right-i.left)/i.width}});
   assert(Math.abs(crop.ratio-crop.width/1024)<.002,'poster aspect ratio');
   assert(Math.abs(crop.left-crop.x/1536)<.002,'poster left boundary');
   assert(Math.abs(crop.right-(crop.x+crop.width)/1536)<.002,'poster right boundary');
  }
  await page.evaluate(()=>window.IGR_CASINO_CLIENT.open());await layout(page,'welcome-'+label);
  assert.equal(await page.getByRole('tab',{name:'Créer'}).count(),1);
  assert.equal(await page.getByRole('tab',{name:'Rejoindre'}).count(),1);
  assert.equal(await page.locator('[data-casino-form=create]').count(),1,'Only the create form should be displayed by default');
  assert.equal(await page.locator('[data-casino-form=join]').count(),0,'The join form stays behind its tab');
  await page.getByRole('tab',{name:'Rejoindre'}).click();
  assert.equal(await page.locator('[data-casino-form=join]').count(),1,'Join tab must be usable');
  assert.equal(await page.locator('[data-casino-form=create]').count(),0,'Join tab hides the create form');
  await page.getByRole('tab',{name:'Créer'}).click();
  if(label==='iphone'){
   // This browser lacks native inset emulation: evaluate the shipped padding
   // formula with a 59px status area and 34px home-indicator area.
   const css=await readFile(join(root,'casino-client-v105.css'),'utf8');
   // Casino now lives inside the shared .app shell. Simulate the native
   // status-bar inset on that shell rather than double-insetting Casino.
   const safe=await page.addStyleTag({content:css.replaceAll('env(safe-area-inset-top,0px)','59px').replaceAll('env(safe-area-inset-bottom)','34px')+
    '\n#app>.app{padding-top:calc(59px + 14px)!important;}'});
   const back=await page.locator('[data-casino-action=close]').boundingBox();assert(back.y>=59,'Back button must clear the status area');
   await layout(page,'welcome-safe-iphone');await safe.evaluate(e=>e.remove());
  }
 }
 checks.push('Affiches et formulaires sans débordement aux formats iPhone, iPad et ordinateur');
 const host=await context({width:390,height:844}),hostPage=host.page;
 await hostPage.evaluate(id=>{localStorage.setItem('igr_social_identity_v1',JSON.stringify({id,token:'synthetic-profile'}));window.IGR_CASINO_CLIENT.open()},randomUUID());
 await hostPage.locator('[data-casino-form=create] input[name=name]').fill('Ali');
 await hostPage.locator('[data-casino-form=create] button').click();await hostPage.locator('.casino-roster-disclosure').waitFor();
 assert(await hostPage.locator('[data-casino-action=start]').isDisabled(),'One player cannot start a seven-player Casino campaign');
 assert((await hostPage.locator('.casino-launch-readiness').textContent()).includes('1/7 joueurs minimum'),'Host must see exact missing-player requirement');
 await layout(hostPage,'casino-lobby-one-player-iphone');
 const hostId=await storageIdentity(hostPage),room=await storage.read(hostId.roomId),people=[host];
 for(let i=1;i<7;i++){
  const person=await context(i%2?{width:820,height:1180}:{width:1440,height:900});people.push(person);
  await person.page.evaluate(()=>window.IGR_CASINO_CLIENT.open({fresh:true,mode:'join'}));await person.page.locator('[data-casino-form=join] input[name=name]').fill('Joueur '+i);
  await person.page.locator('[data-casino-form=join] input[name=inviteCode]').fill(room.inviteCode);
  await person.page.locator('[data-casino-form=join] button').click();await person.page.locator('.casino-roster-disclosure').waitFor();
 }
 await hostPage.waitForFunction(()=>document.querySelectorAll('.casino-members li').length===7);
 assert(await hostPage.locator('[data-casino-action=start]').isDisabled(),'Seven unconfirmed players cannot start early');
 checks.push('Sept sessions indépendantes : les arrivées modifient les écrans sans actualisation');
 for(let i=0;i<7;i++){
  const p=people[i].page;
  await visibleRevision(p,(await storage.read(room.id)).revision);
  if(i>=4){const nextRole=['agent','investigator','analyst'][i-4];await p.locator('[data-casino-action="select-role"][data-role-id="'+nextRole+'"]').click();await p.waitForFunction(()=>!document.querySelector('.casino-content').disabled)}
  await p.locator('[data-casino-action=ready]').click();await p.waitForFunction(()=>!document.querySelector('.casino-content').disabled);
 }
 await hostPage.waitForFunction(()=>[...document.querySelectorAll('.casino-members li')].every(e=>e.textContent.toLocaleLowerCase('fr').includes('prêt')));
 assert(!(await hostPage.locator('[data-casino-action=start]').isDisabled()),'Seven validated participants must enable launch');
 assert((await hostPage.locator('.casino-launch-readiness').textContent()).includes('La table est prête'),'Host must see ready confirmation');
 await layout(hostPage,'casino-lobby-ready-iphone');
 now=Date.now();
 await hostPage.locator('[data-casino-action=start]').click();
 await Promise.all(people.map(p=>p.page.locator('[data-casino-tab=card]').waitFor()));
 assert((await hostPage.locator('body').textContent()).includes('Fiche fictive de Ali.'));
 assert((await hostPage.locator('body').textContent()).includes('Tu as négocié avec Joueur 1.'));
 const ids=await Promise.all(people.map(async p=>({person:p,...await storageIdentity(p.page)})));
 // A different player's readiness update must not change an unsubmitted decision.
 const writer=people[1].page,analystPage=people[6].page;
 const pokerState=(await storage.read(room.id)).state;
 const dealer=people[pokerState.members.findIndex(m=>m.id===pokerState.poker.turn)].page;
 await dealer.locator('[data-casino-tab=table]').click();
 const discard=dealer.locator('input[name="discard"]').first();
 await discard.check();
 const clock=dealer.locator('[data-casino-clock]');
 const initialSeconds=Number(await clock.textContent());
 await dealer.waitForFunction(n=>Number(document.querySelector('[data-casino-clock]')?.textContent)<n,initialSeconds);
 await writer.locator('[data-casino-tab=justice]').click();
 const msg=writer.locator('[data-casino-form=message]');
 await msg.locator('[name=to]').selectOption({index:1});
 const recipient=await msg.locator('[name=to]').inputValue();
 await msg.locator('[name=kind]').selectOption('allies');
 await msg.locator('textarea').fill('Message destiné à un allié');
 await commandFor(analystPage,'PHASE_POSITION',{position:'ready'});
 const revision=(await storage.read(room.id)).revision;
 await Promise.all([visibleRevision(writer,revision),visibleRevision(dealer,revision)]);
 assert.equal(await msg.locator('[name=to]').inputValue(),recipient);
 assert.equal(await msg.locator('[name=kind]').inputValue(),'allies');
 assert.equal(await msg.locator('textarea').inputValue(),'Message destiné à un allié');
 assert(await discard.isChecked());
 await discard.uncheck();
 await writer.locator('[data-casino-tab=registry]').click();
 const agreement=writer.locator('[data-casino-form=agreement]');
 await agreement.locator('[name=kind]').selectOption('territory');
 await agreement.locator('[name=territoryId]').selectOption({index:1});
 const territory=await agreement.locator('[name=territoryId]').inputValue();
 await agreement.locator('[name=visibility]').selectOption('public');
 await commandFor(people[5].page,'PHASE_POSITION',{position:'ready'});
 await visibleRevision(writer,(await storage.read(room.id)).revision);
 assert.equal(await agreement.locator('[name=territoryId]').inputValue(),territory);
 assert.equal(await agreement.locator('[name=visibility]').inputValue(),'public');
 assert.equal(await agreement.locator('[name=kind]').inputValue(),'territory');
 await analystPage.locator('[data-casino-tab=bureau]').click();
 const note=analystPage.locator('[data-casino-form=note] textarea');
 await note.fill('Recoupement en cours');
 await analystPage.locator('[data-casino-tab=card]').click();
 await analystPage.locator('[data-casino-tab=bureau]').click();
 assert.equal(await note.inputValue(),'Recoupement en cours');
 checks.push('Destinataire, accord territorial, échange au poker, chronomètre et brouillon Analyste');
 // The server decides when the collective draw/bet is fully settled. Do not
  // assume one action per player: a turn may be retried after concurrent room updates.
  for(let turn=0;turn<24;turn++){
  const current=(await storage.read(room.id)).state,h=current.poker;if(h.stage==='settled')break;
  const actor=ids[current.members.findIndex(m=>m.id===h.turn)];
  assert(actor,'Poker actor has an independent browser');const page=actor.person.page;
  await page.locator('[data-casino-tab=table]').click();
  if(h.stage==='draw'){await page.locator('[data-casino-action=draw]').waitFor();await page.locator('[data-casino-action=draw]').click()}
  else{await page.getByRole('button',{name:'Parole',exact:true}).waitFor();await page.getByRole('button',{name:'Parole',exact:true}).click()}
  await page.waitForFunction(()=>!document.querySelector('.casino-content').disabled);
 }
 assert.equal((await storage.read(room.id)).state.poker.stage,'settled');checks.push('Main de poker collective jouée par quatre écrans, cartes privées et règlement unique');
 for(const person of people.slice(4)){await person.page.locator('[data-casino-tab=table]').click();assert.equal(await person.page.locator('.casino-playing-card').count(),0)}
 for(let i=0;i<2;i++)await commandFor(people[4].page,'AGENT_DECISION',{answer:'confirmed'});
 now+=60000;await commandFor(hostPage,'ADVANCE_PHASE');
 await Promise.all(people.map(p=>p.page.getByRole('heading',{level:1,name:'Phase fictive 2',exact:true}).waitFor()));
 await hostPage.locator('[data-casino-tab=table]').click();await hostPage.locator('[data-casino-form=slot] input[name=wager]').fill('5');await hostPage.locator('[data-casino-form=slot] button').click();
 await hostPage.waitForFunction(()=>!document.querySelector('.casino-content').disabled);
 const savedChips=(await storage.read(room.id)).state.roster[(await storage.read(room.id)).state.hostId].chips;
 const recovered=await context({width:1440,height:900});await recovered.page.evaluate(()=>window.IGR_CASINO_CLIENT.open());
 await recovered.page.locator('summary').click();await recovered.page.locator('[name=recovery]').fill(hostId.roomId+':'+hostId.sessionToken);await recovered.page.locator('[data-casino-form=recover] button').click();
 await recovered.page.locator('[data-casino-tab=network]').waitFor();await recovered.page.locator('[data-casino-tab=network]').click();
 assert((await recovered.page.locator('body').textContent()).includes(savedChips+' jetons'));
 await recovered.page.reload();await recovered.page.evaluate(()=>window.IGR_CASINO_CLIENT.open());await recovered.page.locator('[data-casino-tab=network]').waitFor();
 checks.push('Reprise avec la clé personnelle sur un autre appareil simulé, puis après fermeture de la page');
 // Background screen catches up as soon as it reconnects. Its own draft is
 // kept while a different participant makes a committed decision.
 await people[5].page.locator('[data-casino-tab=bureau]').click();await people[5].page.locator('[data-casino-form=note] textarea').fill('Brouillon à conserver');
 await commandFor(people[1].page,'CLAIM_SUCCESSION');
 await visibleRevision(people[5].page,(await storage.read(room.id)).revision);
 assert.equal(await people[5].page.locator('[data-casino-form=note] textarea').inputValue(),'Brouillon à conserver');
 await people[2].context.setOffline(true);await people[2].page.locator('[data-casino-connection]').waitFor({state:'visible'});await commandFor(people[1].page,'PLEDGE_LOYALTY',{to:(await storage.read(room.id)).state.hostId});await people[2].context.setOffline(false);
 await visibleRevision(people[2].page,(await storage.read(room.id)).revision);checks.push('Retour réseau et synchronisation des décisions sans perte du brouillon en cours');
 // Drop a response after the server commits it: the UI retries the same UUID,
 // so the important decision remains saved exactly once.
 const unreliable=people[3].page;let dropped=false;
 await unreliable.route('**/api/casino',async route=>{
  const body=route.request().postDataJSON();
  if(!dropped&&body.op==='command'&&body.type==='MESSAGE'){dropped=true;await route.fetch();await route.abort('failed')}
  else await route.continue();
 });
 await visibleRevision(unreliable,(await storage.read(room.id)).revision);
 await unreliable.locator('[data-casino-tab=justice]').click();await unreliable.locator('[data-casino-form=message] textarea').fill('Message fictif dont la réponse réseau est perdue.');
 await unreliable.locator('[data-casino-form=message] button').click();await unreliable.locator('[data-casino-action=retry]').waitFor();
 await unreliable.locator('[data-casino-action=retry]').click();await unreliable.waitForFunction(()=>!document.querySelector('.casino-content').disabled);
 assert.equal((await storage.read(room.id)).state.messages.filter(m=>m.text==='Message fictif dont la réponse réseau est perdue.').length,1);
 await unreliable.unroute('**/api/casino');checks.push('Réponse réseau perdue après sauvegarde : nouvelle tentative sans duplication');
 for(let i=0;i<2;i++)await commandFor(people[4].page,'AGENT_DECISION',{answer:'confirmed'});now+=60000;await commandFor(hostPage,'ADVANCE_PHASE');
 await commandFor(people[4].page,'AGENT_DECISION',{answer:'confirmed'});now+=60000;await commandFor(people[4].page,'LOCATE_ROOM');await commandFor(hostPage,'ADVANCE_PHASE');
 const dossierSubject=(await storage.read(room.id)).state.players[1];
 await people[5].page.locator('[data-casino-tab=bureau]').click();
 const interpellation=people[5].page.locator('[data-casino-form=interpellation]');
 await interpellation.locator('select[name=subjectId]').selectOption(dossierSubject);
 assert.equal(await interpellation.locator('[data-casino-offence]').inputValue(),'infraction fictive');
 assert.equal(await interpellation.locator('input[name=evidenceIds]:enabled').count(),4);
 checks.push('Infraction liée aux preuves et sources sélectionnables par suspect');
 const revisionBefore=(await storage.read(room.id)).revision;
 await visibleRevision(hostPage,revisionBefore);
 await hostPage.locator('[data-casino-command=ADVANCE_PHASE]').click();
 await hostPage.locator('.casino-phase-warning').waitFor();
 assert.equal((await storage.read(room.id)).revision,revisionBefore,'The first phase control click must not skip a chapter');
 await hostPage.locator('[data-casino-action=cancel-advance]').click();
 assert.equal(await hostPage.locator('.casino-phase-warning').count(),0);
 checks.push('Changement de phase avec confirmation explicite et annulation sans mutation');
 // v719: the host cannot bypass discussion in chapter II/III.
 // Advance the synthetic test clock rather than weakening production rules.
 await assert.rejects(commandFor(hostPage,'ADVANCE_PHASE'),/minimum_social_time/,
   'An immediate host advance must be refused');
 for(let i=0;i<4;i++){
  now+=120001; // Continuity at two minimum social windows when nobody confirms readiness
  await commandFor(hostPage,'ADVANCE_PHASE');
 }
 now+=60001; // The final deliberation also has a non-skippable minimum.
 await assert.rejects(commandFor(hostPage,'FINISH_CAMPAIGN'),/bureau_report_pending/,
   'Host must not silence a missing investigative report');
 for(let i=4;i<7;i++)await commandFor(people[i].page,'BUREAU_VERDICT',{position:i===4?'established':'insufficient'});
 await commandFor(hostPage,'FINISH_CAMPAIGN');
 await Promise.all(people.map(p=>p.page.getByRole('heading',{name:'Le dénouement',exact:true}).waitFor()));
 for(const p of people)assert.equal(await p.page.locator('[data-casino-command]').count(),0,'No game command after the campaign ends');
 assert.equal(await hostPage.locator('.casino-victory-report').count(),1,'Three-layer endgame verdict missing on host phone');
 assert.equal(await people[4].page.locator('.casino-victory-report').count(),1,'Bureau verdict missing on investigator phone');
 for(const [i,label]of [[0,'iphone'],[1,'ipad'],[2,'desktop']])await layout(people[i].page,'finale-'+label);
 checks.push('Transitions des trois scénarios et des huit phases jusqu’au dénouement sur tous les écrans');
 await hostPage.locator('[data-casino-action=switch]').click();await hostPage.locator('[data-casino-form=create]').waitFor();
 await hostPage.waitForTimeout(1400);assert.equal(await hostPage.locator('[data-casino-form=create]').count(),1);
 await hostPage.locator('[data-casino-action=resume]').click();await hostPage.getByRole('heading',{name:'Le dénouement',exact:true}).waitFor();
 checks.push('Nouvelle partie accessible après le dénouement et ancienne partie encore reprenable');
 const integrated=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});contexts.push(integrated);
 await integrated.route('https://jtasbdiguhiswoyvobkn.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
 const full=await integrated.newPage();full.on('pageerror',e=>errors.push(e.message));await full.goto(origin+'/full',{waitUntil:'domcontentloaded'});
 await full.waitForFunction(()=>!!window.IGR_CASINO_CLIENT);
 const entrance=full.locator('#introGate button');if(await entrance.first().isVisible())await entrance.first().click();
 await full.waitForFunction(()=>document.getElementById('introGate')?.getAttribute('aria-hidden')==='true');
 await full.evaluate(id=>{localStorage.setItem('igr_social_identity_v1',JSON.stringify({id,token:'synthetic-profile'}));window.IGR_CASINO_CLIENT.open()},randomUUID());
 await full.locator('[data-casino-form=create] input[name=name]').fill('Intégration');await full.locator('[data-casino-form=create] button').click();await full.locator('.casino-roster-disclosure').waitFor();
 await full.waitForTimeout(2600);assert.equal(await full.locator('.casino-members').count(),1,'Existing runtimes must not replace the Casino screen');
 await full.locator('[data-casino-action=close]').click();await full.locator('[data-casino-live]:not([data-casino-join])').waitFor();
 await full.evaluate(()=>window.IGR_HERITAGE_PLAY.open());await full.locator('.casino-entry').waitFor();
 await layout(full,'hub-full-desktop');await full.setViewportSize({width:390,height:844});await layout(full,'hub-full-iphone');
 await full.locator('.casino-entry').click();await layout(full,'campaign-full-iphone');
 await full.locator('[data-casino-live]:not([data-casino-join])').click();await full.locator('[data-casino-action=switch]').click();await layout(full,'entry-full-iphone');
 await full.locator('[data-casino-action=close]').click();checks.push('Client Casino intégré au bundle complet sans remplacement par les anciens runtimes');
 const integratedRoom=await api(full,{op:'sync'});
 await full.evaluate(()=>{localStorage.removeItem('igr_casino_identity_v1');localStorage.removeItem('igr_social_identity_v1');goJoin()});
 await full.locator('#joinCode').waitFor();
 assert.equal(await full.locator('#casino-guest-entry').count(),0,'A single Join entry handles every invitation');
 for(const width of [320,390,768,1366]){
  await full.setViewportSize({width,height:844});
  const spacing=await full.evaluate(()=>({
   gap:document.querySelector('.igr-beta-footer').getBoundingClientRect().top-document.querySelector('#app .panel').getBoundingClientRect().bottom,
   overflow:document.documentElement.scrollWidth>innerWidth
  }));
  assert(spacing.gap>=0&&spacing.gap<60,'Support follows the short join form without a viewport of empty space');
  assert(!spacing.overflow,'Join form fits the viewport');
 }
 await full.setViewportSize({width:390,height:844});await layout(full,'join-unified-iphone');
 await full.locator('#joinPseudo').fill('Invité sans licence');await full.locator('#joinCode').fill(integratedRoom.inviteCode);
 await full.locator('button[onclick*="joinRoom("]').click();await full.locator('[data-casino-form=join]').waitFor();
 assert.equal(await full.locator('[data-casino-form=join] [name=inviteCode]').inputValue(),integratedRoom.inviteCode);
 assert.equal(await full.locator('[data-casino-form=join] [name=name]').inputValue(),'Invité sans licence');
 await full.locator('[data-casino-form=join] button').click();await full.locator('.casino-roster-disclosure').waitFor();
 assert.equal(await full.locator('.casino-members li').count(),2);
 checks.push('Accueil → Rejoindre : invitation Casino accessible à un invité sans licence Héritage');
 // Closing the page after a committed creation must retain its new recovery
 // secret even when the very first response never reached the browser.
 const interrupted=await context({width:390,height:844});
 await interrupted.page.evaluate(id=>{localStorage.setItem('igr_social_identity_v1',JSON.stringify({id,token:'synthetic-profile'}));window.IGR_CASINO_CLIENT.open()},randomUUID());
 let droppedCreate=false;
 await interrupted.page.route('**/api/casino',async route=>{
  if(route.request().postDataJSON()?.op==='create'&&!droppedCreate){droppedCreate=true;await route.fetch();await route.abort('failed')}
  else await route.continue();
 });
 await interrupted.page.locator('[data-casino-form=create] input').fill('Reprise création');
 await interrupted.page.locator('[data-casino-form=create] button').click();await interrupted.page.locator('[data-casino-action=retry]').waitFor();
 const candidate=await interrupted.page.evaluate(()=>JSON.parse(localStorage.getItem('igr_casino_identity_v1_pending')));
 const committed=await storage.read(candidate.roomId);assert(committed);
 await interrupted.page.unroute('**/api/casino');await interrupted.page.reload();await interrupted.page.evaluate(()=>window.IGR_CASINO_CLIENT.open());
 await interrupted.page.locator('.casino-roster-disclosure').waitFor();const recoveredCreation=await storageIdentity(interrupted.page);
 assert.equal(recoveredCreation.roomId,candidate.roomId);assert.equal((await storage.read(recoveredCreation.roomId)).state.members.length,1);
 const interruptedJoin=await context({width:820,height:1180});await interruptedJoin.page.evaluate(()=>window.IGR_CASINO_CLIENT.open({fresh:true,mode:'join'}));let droppedJoin=false;
 await interruptedJoin.page.route('**/api/casino',async route=>{
  if(route.request().postDataJSON()?.op==='join'&&!droppedJoin){droppedJoin=true;await route.fetch();await route.abort('failed')}
  else await route.continue();
 });
 await interruptedJoin.page.locator('[name=inviteCode]').fill(committed.inviteCode);
 await interruptedJoin.page.locator('[data-casino-form=join] [name=name]').fill('Reprise arrivée');await interruptedJoin.page.locator('[data-casino-form=join] button').click();
 await interruptedJoin.page.locator('[data-casino-action=retry]').waitFor();await interruptedJoin.page.unroute('**/api/casino');
 await interruptedJoin.page.reload();await interruptedJoin.page.evaluate(()=>window.IGR_CASINO_CLIENT.open());await interruptedJoin.page.locator('.casino-roster-disclosure').waitFor();
 assert.equal((await storage.read(recoveredCreation.roomId)).state.members.length,2);
 checks.push('Création et arrivée reprises après perte de leur première réponse et fermeture, sans nouvelle identité');
 assert.deepEqual(errors,[],'No browser runtime errors');
 await writeFile(join(resultDir,'results.json'),JSON.stringify({checks,browser:await browser.version(),errors},null,2));
 console.log(checks.map(s=>'PASS Casino browser: '+s).join('\n'));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
