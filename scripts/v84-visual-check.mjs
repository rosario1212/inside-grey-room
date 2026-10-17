import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd(),dist=path.join(root,'dist'),out=path.join(root,'layout-check-results');
await mkdir(out,{recursive:true});
const css=(await Promise.all(['styles-v11.css','navigation-heritage-v19.css','screen-polish-v73.css','dossier-reliability-v84.css'].map(f=>readFile(path.join(dist,f),'utf8')))).join('\n');
const runtime=await readFile(path.join(dist,'dossier-reliability-v84.js'),'utf8');
const browser=await chromium.launch({headless:true});
const viewports=[['phone',390,844],['small-phone',320,568],['tablet',820,1180],['desktop',1280,800]];
const base="<div id=\"app\"><main class=\"page game-v11\">\n<header class=\"game-head-v11\"><h1>LA CHAMBRE 222</h1></header>\n<section class=\"phase-strip\"><div><small>PHASE</small><strong>INVESTIGATION_ASSEMBLY</strong></div></section>\n<nav class=\"tabs-v11\"><button class=\"tab\">MA CARTE</button><button class=\"tab\">CHRONOLOGIE</button><button class=\"tab\">ENQUÊTE</button></nav>\n<section class=\"game-panel-v11\"><div class=\"private-card-v11\">\n<div class=\"private-block danger-soft\"><h4>CE QUE TU CACHES</h4><p>Tu gardes un secret.</p></div>\n<div class=\"private-block\"><h4>TES RELATIONS</h4>\n<div class=\"relation-line\"><b>ipad</b><span>Ton point de départ — Tu ne le connais pas. Tu ignores ce qu'il a vu près de la chambre. À mettre sur la table — À quelle heure as-tu entendu du bruit ?</span></div>\n<div class=\"relation-line\"><b>dwaf</b><span>Ton point de départ — Vous travaillez dans la même structure, sans relation personnelle certaine. À mettre sur la table — Quand as-tu quitté le service ?</span></div>\n</div></div></section></main></div>\n<div class=\"live-session-controls\"><button class=\"live-exit-btn\">✕ Quitter</button></div>\n<button class=\"floating-leave-btn\">Quitter</button><button id=\"igrNotifyBell\" type=\"button\">♪</button>";
try{
 for(const [name,width,height] of viewports){
   const page=await browser.newPage({viewport:{width,height}});
   await page.route('**/*',route=>route.abort());
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><style>#igrNotifyBell{position:fixed;width:34px;height:34px;display:block}</style></head><body class="igr-game-active igr-live-cell">'+base+'</body></html>');
   await page.addScriptTag({content:'var STATE={tab:"card"}; var renderGame=function(){}; var renderRole=function(){}; var privateCardHtml=function(){return document.querySelector(".private-card-v11").outerHTML;};'});
   await page.addScriptTag({content:runtime});
   await page.waitForFunction(()=>document.querySelectorAll('.igr84-relation-card').length===2);
   const labels=await page.locator('.igr84-relation-card').first().innerText();
   assert(labels.includes('VOTRE LIEN')&&labels.includes('CE QUE TU SAIS DE CETTE PERSONNE')&&labels.includes('CE QUE TU PEUX LUI DEMANDER'),name+': semantic labels missing');
   assert(!labels.includes('Ton point de départ')&&!labels.includes('À mettre sur la table'),name+': legacy labels leaked');
   assert.equal(await page.locator('.phase-strip strong').innerText(),'ASSEMBLÉE DU CAMP ENQUÊTE',name+': phase key leaked');
   const geometry=await page.evaluate(()=>{
     const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
     return {docWidth:document.documentElement.scrollWidth,viewport:innerWidth,bell:rect('#igrNotifyBell'),exit:rect('.live-exit-btn'),relation:rect('.igr84-relation-card'),floating:getComputedStyle(document.querySelector('.floating-leave-btn')).display};
   });
   assert(geometry.docWidth<=width+1,name+': horizontal overflow '+JSON.stringify(geometry));
   assert(geometry.floating==='none',name+': duplicate exit obscures dossier');
   const overlap=geometry.bell.x<geometry.exit.right&&geometry.bell.right>geometry.exit.x&&geometry.bell.y<geometry.exit.bottom&&geometry.bell.bottom>geometry.exit.y;
   assert(!overlap,name+': floating notification overlaps exit');
   await page.screenshot({path:path.join(out,'v84-dossier-'+name+'.png'),fullPage:true});
   await page.evaluate(()=>{
     STATE.tab='timeline';
     document.querySelector('.game-panel-v11').innerHTML='<section class="timeline"><h2>Chronologie</h2><ul><li><small>02 h 50</small> Tu passes devant la chambre.</li><li><small>02</small> Tu entends du bruit.</li><li><small>03</small> Tu retournes dans ta chambre.</li></ul></section>';
   });
   await page.waitForFunction(()=>document.querySelector('.timeline li:nth-child(2) small')?.textContent?.includes('ÉTAPE 2'));
   const timeline=await page.locator('.timeline').innerText();
   assert(timeline.includes('02 h 50')&&timeline.includes('ÉTAPE 2')&&timeline.includes('ÉTAPE 3'),name+': ordinal steps were rendered as clocks');
   await page.close();
   console.log('OK · dossier and chronology · '+name);
 }
}finally{await browser.close()}
console.log('Inside Grey Room v84 · 4 responsive fixture checks passed');
