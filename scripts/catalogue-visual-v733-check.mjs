// IGR v733 — browser checks for catalogue identity and complete poster art.
// This test intentionally uses real shipped CSS and real public poster assets.
// Never needs an account, a paid DLC licence or a live game room.
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd(),dist=path.join(root,'dist');
const read=async relative=>readFile(path.join(dist,relative),'utf8');
const html=await read('index.html');
const styles=[];
for(const match of html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>|<style[^>]*>([\s\S]*?)<\/style>/g)){
  if(match[1]!==undefined)styles.push(match[1]);
  else{
    const uri=match[0].match(/href="([^"]+)"/)?.[1];
    if(uri)styles.push(await read(uri.split('?')[0]));
  }
}
const css=styles.join('\n');
const poster=async(file,mime='image/webp')=>{
  const contents=await readFile(path.join(dist,'assets',file));
  return 'data:'+mime+';base64,'+contents.toString('base64');
};
const posters={
  '001':await poster('scenario-001-v10-13.webp'),
  '014':await poster('scenario-014-v11-6.webp'),
  '021':await poster('omerta-021-l-enveloppe.webp'),
  '026':await poster('terror-026-la-ville-tombe.webp'),
  '029':await poster('cartel-029-poster-v2.svg','image/svg+xml'),
  '032':await poster('regime-032-les-archives-du-palais.webp')
};
const entries=[
 {id:'001',family:'base',title:'LA CHAMBRE 222',label:'DOSSIER 001',description:'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont croisé sa route cette nuit-là. Leurs versions se contredisent.',players:'4–5 JOUEURS'},
 {id:'014',family:'base',title:'SOUS SECRET',label:'DOSSIER 014',description:'Une fuite expose onze informateurs et leurs familles. Dans un service fondé sur le secret, une seule information peut condamner plusieurs vies.',players:'5–6 JOUEURS'},
 {id:'021',family:'omerta',title:"L’ENVELOPPE",label:'OMERTÀ · DOSSIER 021',description:'À Brooklyn, une partie des recettes du racket manque à l’appel. Plusieurs hommes avaient accès à la collecte ; aucun ne veut en répondre.',players:'4–8 JOUEURS'},
 {id:'026',family:'terror',title:'LA VILLE TOMBE',label:'TERREUR · DOSSIER 026',description:'Le FDR a pris presque tout Almizia. Des fonctionnaires ont été exécutés, des familles déplacées et des noms effacés des registres.',players:'6 JOUEURS'},
 {id:'029',family:'cartel',title:'LE CYCLE MORT',label:'CARTEL · DOSSIER 029',description:'Trois rescapés demandent protection : le cartel a envoyé la langue de leur compagnon exécuté. Vingt personnes restent captives.',players:'6–11 JOUEURS'},
 {id:'032',family:'regime',title:'LES ARCHIVES DU PALAIS',label:'LE RÉGIME · DOSSIER 032',description:'Après la chute du régime, le directeur de Vahran et le ministre de l’Intérieur ont disparu. Registres de détention, transferts et réseaux de protection permettent de remonter leur piste.',players:'6–8 JOUEURS'}
];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=x=>`<article id="scenario-${x.id}" class="scenario scenario--art scenario--compact ${x.family==='base'?'':x.family+'-scenario'}" data-igr-scenario-id="${x.id}">
 <div class="scenario-thumb compact" style="--igr-cover-url:url('${posters[x.id]}')">
  <img class="igr-poster-full" alt="Affiche ${x.id}" src="${posters[x.id]}" />
 </div>
 <div class="scenario-body compact"><div class="scenario-id">${escape(x.label)}</div>
 <h3>${escape(x.title)}</h3><p class="igr-card-excerpt">${escape(x.description)}</p>
 <div class="tag-row"><span class="tag">${escape(x.players)}</span></div></div></article>`;
const panel=(family,rows)=>`<section class="panel ${family==='base'?'scenario-panel-v10-13':family+'-dlc-section igr-premium-dlc-section igr-premium-dlc-section--'+family}" id="panel-${family}">
 <div class="scenario-list scenario-list-v10-13">${rows.map(card).join('')}</div></section>`;
const panels=['base','omerta','terror','cartel','regime'].map(f=>panel(f,entries.filter(x=>x.family===f))).join('');
const report=path.join(root,'layout-check-results');
await mkdir(report,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.IGR_CHROMIUM_PATH?{executablePath:process.env.IGR_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
try{
  for(const width of [320,375,390,430,768]){
    const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head>
    <body><div id="app"><div class="app"><main class="page page-create-v10-13">${panels}</main></div></div></body></html>`,{waitUntil:'load'});
    await page.locator('img.igr-poster-full').first().waitFor({state:'visible'});
    const data=await page.evaluate(()=>{
      const rgb=s=>{const match=s.match(/rgba?\(([^)]+)\)/);return match?match[1].split(',').map(Number):[]};
      const rect=el=>{const b=el.getBoundingClientRect();return{top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height}};
      return {
        viewport:document.documentElement.clientWidth,
        scroll:document.documentElement.scrollWidth,
        cards:[...document.querySelectorAll('article.scenario')].map(card=>{
          const img=card.querySelector('img'),thumb=card.querySelector('.scenario-thumb'),body=card.querySelector('.scenario-body'),text=card.querySelector('p'),tags=card.querySelector('.tag-row');
          return{id:card.dataset.igrScenarioId,card:rect(card),image:rect(img),thumb:rect(thumb),description:rect(text),tags:rect(tags),
          imageFit:getComputedStyle(img).objectFit,posterRatio:getComputedStyle(img).aspectRatio,
          label:getComputedStyle(card.querySelector('.scenario-id')).color,
          border:rgb(getComputedStyle(card).borderTopColor),
          bodyOverflow:body.scrollWidth>body.clientWidth+1,clamp:getComputedStyle(text).webkitLineClamp};
        }),
        panels:[...document.querySelectorAll('section.panel')].map(el=>({family:el.id.replace('panel-',''),border:rgb(getComputedStyle(el).borderTopColor),background:getComputedStyle(el).backgroundImage}))
      };
    });
    assert(data.scroll<=data.viewport+1,`${width}px: horizontal overflow ${data.scroll} > ${data.viewport}`);
    assert.equal(data.cards.length,6,`${width}px: one of the six dossiers is absent`);
    for(const c of data.cards){
      assert.equal(c.imageFit,'contain',`${width}px ${c.id}: poster is cropped`);
      assert(c.image.width>30&&c.image.height>30,`${width}px ${c.id}: poster collapsed`);
      assert(c.image.left>=c.thumb.left-2&&c.image.right<=c.thumb.right+2,`${width}px ${c.id}: poster outside column`);
      assert(c.image.top>=c.thumb.top-2&&c.image.bottom<=c.thumb.bottom+2,`${width}px ${c.id}: poster vertically clipped`);
      assert(c.tags.top>=c.description.bottom-2,`${width}px ${c.id}: synopsis touches badges`);
      assert(c.tags.bottom<=c.card.bottom+2,`${width}px ${c.id}: badges outside card`);
      assert(!c.bodyOverflow,`${width}px ${c.id}: text overflowing horizontally`);
      assert.equal(c.clamp,'none',`${width}px ${c.id}: synopsis unexpectedly clamped`);
    }
    const [base001,base014]=data.cards;
    assert(Math.abs(base001.image.width-base014.image.width)<2,`${width}px: 014 has an anomalous poster width`);
    assert(Math.abs(base001.image.height-base014.image.height)<2,`${width}px: 014 is stretched differently than 001`);
    const panelBy=Object.fromEntries(data.panels.map(x=>[x.family,x]));
    const color=(c)=>c.border;
    const red=color(panelBy.omerta),gold=color(panelBy.cartel),blue=color(panelBy.regime);
    assert(red[0]>red[1]*1.7&&red[0]>red[2]*1.5,`${width}px: OMERTÀ lost red border: ${red}`);
    assert(gold[0]>gold[2]*1.7&&gold[1]>gold[2]*1.5,`${width}px: CARTEL lost gilded border: ${gold}`);
    assert(blue[2]>blue[0]*1.25,`${width}px: LE RÉGIME lost steel-blue border: ${blue}`);
    assert(panelBy.cartel.background!==panelBy.omerta.background,`${width}px: DLC panels flattened to the same background`);
    if(width===390)await page.screenshot({path:path.join(report,'catalogue-v733-themed-cards-iphone.png'),fullPage:true});
    console.log(`PASS v733 ${width}px: 6 real posters fitted, DLC palettes distinct, no overflow or overlapping tags`);
    await context.close();
  }
}finally{await browser.close()}
