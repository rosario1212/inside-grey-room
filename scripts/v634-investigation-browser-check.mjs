/* Browser-level contract for the investigation workspace. Uses an offline case stub,
   not live game servers or secret scenario manuscripts. */
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),js=await readFile(path.join(root,'dist/investigation-workspace-v634.js'),'utf8');
const css=await readFile(path.join(root,'dist/investigation-workspace-v634.css'),'utf8');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=path.join(root,'layout-check-results');
await mkdir(report,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const raw=`<div class="phase-explain"><h2>Choix de l'interrogatoire</h2><p>Convoque un suspect.</p></div>
 <section class="igr87-dossier"><div class="igr87-title">Personnes et découvertes</div>
 <details class="igr87-common"><summary>Éléments communs</summary><p>Situation connue</p></details>
 <div class="igr87-people"><details><summary>Suspect A</summary><p>Un témoignage</p></details></div>
 <form class="igr87-note-form" onsubmit="event.preventDefault()"><h3>Consigner une information</h3><textarea id="igr87Text"></textarea><button type="submit">Ajouter</button></form></section>
 <section class="private-block igr001-reports"><h3>Constatations officielles</h3><p>Indice canonique</p></section>
 <section class="action-section"><h3>Suspects restant à entendre</h3><button onclick="startInterrogation('a')">Interroger A</button></section>
 <section class="action-section"><h3>Investigations complémentaires</h3><button onclick="investigateByScenario('b')">Examiner</button></section>
 <div class="igr106-inquiry-evidence"><h3>Éléments révélés</h3><p>Trame autorisée</p></div>`;
 for(const role of ['enqueteur','analyste','suspect']){
  await page.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><main id="app"><div class="game-panel-v11" id="mount"></div></main></body></html>');
  await page.evaluate(({role,raw})=>{
   window.STATE={view:'game',tab:'investigation',room:'ROOM1',sync:{player:{id:'self',public_role:role},room:{code:'ROOM1',scenario_id:'001',phase:'interrogation_select',state:{match_no:1}}}};
   window.IGR_LOCALE='fr';
   window.clicks={interview:0,investigate:0,notes:0};
   window.startInterrogation=()=>{window.clicks.interview++};
   window.investigateByScenario=()=>{window.clicks.investigate++};
   window.igrSavePrivateNotesV32=()=>{window.clicks.notes++};
   window.renderNotesTabV32=()=>'<div class="private-notes notes-tab-v32"><h2>Notes personnelles</h2><textarea id="privateNotesV32" oninput="igrSavePrivateNotesV32(this)">déjà sauvegardé</textarea></div>';
   window.gameTabs=()=>[{id:'card'},{id:'investigation'},{id:'notes'},{id:'timeline'}];
   window.renderGameTab=()=>raw;
   window.setTab=x=>x;
  },{role,raw});
  await page.addScriptTag({content:js});
  const html=await page.evaluate(()=>window.renderGameTab());
  await page.locator('#mount').evaluate((el,s)=>{el.innerHTML=s},html);
  const tabs=await page.evaluate(()=>window.gameTabs().map(x=>x.id));
  if(role==='suspect'){
   assert(tabs.includes('notes'),'Suspects keep the private Notes tab');
   assert.equal(await page.locator('.igr634-workspace').count(),0,'Non-investigators retain original view');
   continue;
  }
  assert(!tabs.includes('notes'),'Private Notes tab is integrated into Enquête');
  assert.equal(await page.locator('.igr634-workspace').count(),1);
  assert.equal(await page.locator('#igr634-interviews').count(),1);
  assert.equal(await page.locator('#igr634-actions').count(),1);
  assert.equal(await page.locator('#igr634-evidence').count(),1);
  assert.equal(await page.locator('#igr634-notebook').count(),1);
  assert.equal(await page.locator('#igr634-personal').count(),1,'Private notes must be present separately');
  const order=await page.evaluate(()=>[...document.querySelector('.igr634-workspace').children].map(x=>x.id).filter(Boolean));
  assert.deepEqual(order,['igr634-interviews','igr634-actions','igr634-evidence','igr634-notebook','igr634-personal'],'The shared notebook and private notes must have distinct sections');
  assert.equal(await page.locator('.igr634-quicknav').count(),0,'No duplicate four-button quick navigation');
  assert.equal(await page.locator('.igr634-priority').count(),1,'Supplemental investigation must be clearly visible');
  assert(await page.getByRole('button',{name:'Examiner'}).isVisible(),'Supplemental investigation is actionable without expansion');
  await page.getByRole('button',{name:'Interroger A'}).click();
  assert.equal(await page.evaluate(()=>window.clicks.interview),1,'Original callback must survive DOM regrouping');
  assert(await page.getByText('Indice canonique').isVisible(),'Evidence must be immediately visible without expansion');
  await page.locator('#igr634-notebook > summary').click();
  assert.equal(await page.locator('#igr634-notebook #privateNotesV32').count(),0,'Shared notebook must not contain private notes');
  assert.equal(await page.locator('#privateNotesV32').count(),1,'Exactly one private notes editor must exist');
  await page.locator('#igr634-personal > summary').click();
  await page.locator('#privateNotesV32').fill('Mon hypothèse personnelle');
  assert.equal(await page.evaluate(()=>window.clicks.notes),1,'Local autosave must remain functional');
  if(role==='enqueteur'){
   assert.equal(await page.locator('.igr87-note-form').count(),1,'Server notebook note form preserved');
   await page.screenshot({path:path.join(report,'investigation-v634-iphone.png'),fullPage:true});
  }
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert(width<=390+1,'Investigation workspace must not overflow on iPhone');
 }
 console.log('PASS browser investigation workspace: visible actions, shared notebook, one private local autosaving note editor.');
}finally{await browser.close()}
