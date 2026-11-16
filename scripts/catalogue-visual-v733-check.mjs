// IGR v733 — browser checks for catalogue identity and complete poster art.
// This test intentionally uses real shipped CSS and real public poster assets.
// Never needs an account, a paid DLC licence or a live game room.
import assert from 'node:assert/strict';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import vm from 'node:vm';

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
  '002':await poster('scenario-002-v10-13.webp'),
  '003':await poster('scenario-003-v10-13.webp'),
  '004':await poster('scenario-004-v10-13.webp'),
  '005':await poster('scenario-005-v10-13.webp'),
  '006':await poster('scenario-006-v10-13.webp'),
  '007':await poster('scenario-007-v10-13.webp'),
  '008':await poster('scenario-008-v10-13.webp'),
  '014':await poster('scenario-014-v11-6.webp'),
  '018':await poster('scenario-018-v11-6.webp'),
  '020':await poster('scenario-020-v11-6.webp'),
  '021':await poster('omerta-021-l-enveloppe.webp'),
  '026':await poster('terror-026-la-ville-tombe.webp'),
  '027':await poster('terror-027-la-zone-rouge.webp'),
  '028':await poster('terror-028-dernier-perimetre.webp'),
  '029':await poster('cartel-029-poster-v2.svg','image/svg+xml'),
  '030':await poster('cartel-030-poster-v2.svg','image/svg+xml'),
  '031':await poster('cartel-031-poster-v2.svg','image/svg+xml'),
  '032':await poster('regime-032-les-archives-du-palais.webp'),
  '033':await poster('regime-033-la-dynastie.webp'),
  '034':await poster('regime-034-les-noms-quils-portaient.webp')
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
const card=x=>{const art=posters[x.id]||posters[x.family==='cartel'?'029':x.family==='omerta'?'021':x.family==='terror'?'026':x.family==='regime'?'032':'001'];return `<article id="scenario-${x.id}" class="scenario scenario--art scenario--compact ${x.family==='base'?'':x.family+'-scenario'}" data-igr-scenario-id="${x.id}">
 <div class="scenario-thumb compact" style="--igr-cover-url:url('${art}')">
  <img class="igr-poster-full" alt="Affiche ${x.id}" src="${art}" />
 </div>
 <div class="scenario-body compact"><div class="scenario-id">${escape(x.label)}</div>
 <h3>${escape(x.title)}</h3><p class="igr-card-excerpt">${escape(x.description)}</p>
 <div class="tag-row"><span class="tag">${escape(x.players)}</span></div></div></article>`;};
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
          sourceRatio:img.naturalWidth&&img.naturalHeight?img.naturalWidth/img.naturalHeight:null,
          artUnderlay:getComputedStyle(thumb,'::before').backgroundImage,
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
      const preserve=['001','002','003','004','005','006','007','008','026','027','028','029','030','031','032','033','034'].includes(c.id);
      assert.equal(c.imageFit,preserve?'contain':'cover',
        `${width}px ${c.id}: ${preserve?'full title-safe poster':'approved Omerta cover'} must be used`);
      if(preserve)assert(c.artUnderlay!=='none',`${width}px ${c.id}: atmospheric image extension missing`);
      assert(c.image.width>30&&c.image.height>30,`${width}px ${c.id}: poster collapsed`);
      assert(c.image.left>=c.thumb.left-2&&c.image.right<=c.thumb.right+2,`${width}px ${c.id}: poster outside column`);
      assert(c.image.top>=c.thumb.top-2&&c.image.bottom<=c.thumb.bottom+2,`${width}px ${c.id}: poster vertically clipped`);
      assert(c.tags.top>=c.description.bottom-2,`${width}px ${c.id}: synopsis touches badges`);
      assert(c.tags.bottom<=c.card.bottom+2,`${width}px ${c.id}: badges outside card`);
      assert(!c.bodyOverflow,`${width}px ${c.id}: text overflowing horizontally`);
      assert.equal(c.clamp,'5',`${width}px ${c.id}: synopsis needs consistent five-line Omerta preview`);
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

  // v735 — all 20 classical dossiers and each DLC are measured in Chromium.
  // Uniform means equal complete CARD rectangles, not just equal image widths.
  // Rich previews and long headings stay visible instead of being clamped.
  {
    const source=await read('app-v11.js');
    const head='const SCENARIOS = [';
    const at=source.indexOf(head);
    const tail=source.indexOf('\n];',at);
    assert(at>=0&&tail>at,'Canonical scenarios source unavailable');
    const actualClassic=vm.runInNewContext(source.slice(at+head.length-1,tail+3));
    assert.equal(actualClassic.length,20,'All 20 original dossiers must be measured');
    const cases=actualClassic.map(sc=>({
      id:sc.id,family:'base',title:sc.title,
      label:'DOSSIER '+sc.id,
      description:sc.short,players:sc.min===sc.max?sc.min+' JOUEURS':sc.min+'–'+sc.max+' JOUEURS'
    }));
    const familySize={omerta:5,terror:3,cartel:3,regime:3};
    const familyStarts={omerta:21,terror:26,cartel:29,regime:32};
    for(const [family,count] of Object.entries(familySize)){
      const sample=entries.find(x=>x.family===family);
      for(let i=0;i<count;i++)cases.push({
        ...sample,id:String(familyStarts[family]+i).padStart(3,'0'),
        title:i===1?sample.title+' — DEUXIÈME DOSSIER':sample.title,
        description:i===count-1?sample.description+' '+sample.description:sample.description
      });
    }
    assert.equal(cases.length,34,'Test needs all 34 scenario cards');
    const allPanels=Object.keys({base:1,...familySize}).map(family=>panel(family,cases.filter(x=>x.family===family))).join('');
    for(const width of [320,375,390,430,768,1280]){
      const context=await browser.newContext({viewport:{width,height:920},deviceScaleFactor:2});
      const page=await context.newPage();
      await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>${css}</style></head><body><div id="app"><div class="app"><main class="page page-create-v10-13">${allPanels}</main></div></div></body></html>`,{waitUntil:'load'});
      await page.locator('.scenario[data-igr-scenario-id="020"] img').waitFor({state:'visible'});
      const result=await page.evaluate(()=>{
        const groups={};
        for(const section of document.querySelectorAll('section.panel')){
          const key=section.id.replace('panel-','');
          groups[key]=[...section.querySelectorAll('article.scenario')].map(article=>{
            const rect=article.getBoundingClientRect();
            const body=article.querySelector('.scenario-body');
            const img=article.querySelector('img.igr-poster-full');
            const excerpt=article.querySelector('.igr-card-excerpt');
            const tags=article.querySelector('.tag-row');
            return {
              id:article.dataset.igrScenarioId,height:rect.height,width:rect.width,
              bodyFits:body.scrollHeight<=body.clientHeight+2,
              excerptFits:excerpt.scrollHeight<=excerpt.clientHeight+2,
              excerptClamp:getComputedStyle(excerpt).webkitLineClamp,
              excerptHeight:excerpt.getBoundingClientRect().height,
              imageFit:getComputedStyle(img).objectFit,
              sourceRatio:img.naturalWidth&&img.naturalHeight?img.naturalWidth/img.naturalHeight:null,
              artUnderlay:getComputedStyle(article.querySelector('.scenario-thumb'),'::before').backgroundImage,
              posterRect:img.getBoundingClientRect().toJSON(),
              thumbRect:article.querySelector('.scenario-thumb').getBoundingClientRect().toJSON(),
              tagsTop:tags.getBoundingClientRect().top,
              descriptionBottom:excerpt.getBoundingClientRect().bottom,
              badgesBottom:tags.getBoundingClientRect().bottom,
              cardBottom:rect.bottom,
              right:rect.right
            };
          });
        }
        return{groups,viewport:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth};
      });
      assert(result.documentWidth<=result.viewport+1,'v735 '+width+'px: page horizontally overflowing');
      for(const [family,items] of Object.entries(result.groups)){
        assert.equal(items.length,family==='base'?20:familySize[family],`v735 ${width}px: wrong ${family} card count`);
        const heights=items.map(item=>item.height);
        assert(Math.max(...heights)-Math.min(...heights)<=1.1,
          `v737 ${width}px: ${family} card heights diverge: ${JSON.stringify(items.map(x=>[x.id,x.height]))}`);
        for(const item of items){
          assert(item.bodyFits,`v737 ${width}px ${item.id}: content box unexpectedly overflowing`);
          assert(item.excerptClamp==='5',`v737 ${width}px ${item.id}: five-line Omerta-style excerpt missing`);
          assert(item.excerptHeight>10,`v737 ${width}px ${item.id}: synopsis collapsed`);
          const preserve=['001','002','003','004','005','006','007','008','026','027','028','029','030','031','032','033','034'].includes(item.id);
          assert(item.imageFit===(preserve?'contain':'cover'),
            `v739 ${width}px ${item.id}: original artwork ${preserve?'must be fully framed':'retains approved cover'}`);
          if(preserve)assert(item.artUnderlay!=='none',
            `v739 ${width}px ${item.id}: no ambient source-art backing to fill poster edge`);
          assert(Math.abs(item.posterRect.height-item.thumbRect.height)<2,
            `v737 ${width}px ${item.id}: poster not fitted to its full Omerta-size artwork frame`);
          assert(Math.abs(item.posterRect.width-item.thumbRect.width)<2,
            `v737 ${width}px ${item.id}: poster artwork frame not matched to Omerta`);
          assert(item.tagsTop>=item.descriptionBottom-1,
            `v737 ${width}px ${item.id}: synopsis overlaps its player badges`);
          assert(item.badgesBottom<=item.cardBottom+1.5,`v737 ${width}px ${item.id}: player badge overflow`);
        }
      }
      const allRows=Object.values(result.groups).flat();
      const reference=allRows.find(x=>x.id==='021');
      assert(reference,'Omerta 021 reference must be rendered');
      for(const item of allRows){
        assert(Math.abs(item.height-reference.height)<=1.1,
          `v737 ${width}px ${item.id}: card (${item.height}) must match Omerta 021 (${reference.height})`);
        assert(Math.abs(item.thumbRect.width-reference.thumbRect.width)<=1.1,
          `v737 ${width}px ${item.id}: poster column (${item.thumbRect.width}) must match Omerta 021 (${reference.thumbRect.width})`);
      }
      if(width===390)await page.screenshot({path:path.join(report,'catalogue-v735-34-equal-heights-iphone.png'),fullPage:true});
      console.log(`PASS v740 ${width}px: All 34 cards match Omerta 021 height and poster width, safe full-poster typography with ambient source-art extension`);
      await context.close();
    }
  }
  // v734 regression — real navigation scripts + fixed footer links.
  // Scrolling to the last dossier must not reveal a phantom empty screen.
  {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const fakeCollectionNav='<nav class="igr-scenario-filters igr-family-picker igr-family-picker-v731" aria-label="Collections">'+
      '<div class="igr-collection-choices"><button data-family="base">Classiques</button><button data-family="omerta">Omertà</button>'+
      '<button data-family="terror">Terreur</button><button data-family="cartel">Cartel</button><button data-family="regime">Le Régime</button></div></nav>';
    const lastCard=card({...entries[1],id:'020',title:"L’APOTHÉOSE",label:'DOSSIER 020'});
    await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>${css}</style></head><body>
      <div id="app"><div class="app"><main class="page page-create-v10-13">
      <div class="page-head"><div><div class="kicker">Créer une partie</div><h1>Choisissez un scénario</h1></div></div>
      ${fakeCollectionNav}
      <section class="panel scenario-panel-v10-13"><div class="scenario-list scenario-list-v10-13">
      ${Array.from({length:6},()=>lastCard).join('')}</div></section>
      </main></div></div>
      <footer class="igr-beta-footer"><a href="support.html">Signaler un problème</a></footer>
      </body></html>`,{waitUntil:'load'});
    await page.evaluate(()=>{
      window.STATE={view:'create-list'};
      window.IGR_LOCALE='fr';
      window.goHome=()=>{document.body.dataset.testHome='yes'};
    });
    await page.addScriptTag({content:await read('navigation-theme-v18.js')});
    await page.addScriptTag({content:await read('navigation-heritage-v19.js')});
    await page.locator('#igrDockFilters').waitFor({state:'visible'});
    await page.locator('#igrDockHome').waitFor({state:'visible'});
    const startWidths=await page.locator('#igrDockFilters,#igrDockHome').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().width));
    assert(startWidths.every(w=>w>=98),'v736: buttons should be labeled and expanded at start');
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await page.waitForFunction(()=>document.body.classList.contains('igr-catalogue-scrolled'),null,{timeout:1500});
    // Small only while scrolling; once motion stops, both labels return
    // even at dossier 020, as explicitly requested.
    const compact=await page.evaluate(()=>{
      // Emulate the last active scroll tick and read the style synchronously.
      // Avoid a test-runner scheduling gap longer than the 430ms idle timer.
      window.dispatchEvent(new Event('scroll'));
      return [...document.querySelectorAll('#igrDockFilters,#igrDockHome')].map(n=>({
        width:n.getBoundingClientRect().width,
        labelDisplay:getComputedStyle(n.querySelector('b')).display,
        clickArea:n.getBoundingClientRect().height,
        state:document.body.className
      }));
    });
    assert(compact.every(x=>x.width<=45&&x.width>=42&&x.clickArea>=42&&x.labelDisplay==='none'),
      'v738: Filtres and Accueil should be icon-only during active scroll: '+JSON.stringify(compact));
    await page.waitForFunction(()=>{
      const nodes=[...document.querySelectorAll('#igrDockFilters,#igrDockHome')];
      return !document.body.classList.contains('igr-catalogue-scrolled')&&
        nodes.every(n=>n.getBoundingClientRect().width>=98&&getComputedStyle(n.querySelector('b')).display!=='none');
    },null,{timeout:2300});
    const idlePosition=await page.evaluate(()=>window.scrollY);
    assert(idlePosition>400,'v738: dock must expand without scrolling back to the top');
    const final=await page.evaluate(()=>{
      const rect=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height}};
      const panel=rect('.scenario-panel-v10-13'),footer=rect('.igr-beta-footer'),support=rect('.igr-beta-footer a'),filters=rect('#igrDockFilters'),home=rect('#igrDockHome'),selector=rect('.igr-scenario-filters');
      return {gap:footer.top-panel.bottom,footer,support,filters,home,selector,
        viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
        isFilterShown:getComputedStyle(document.querySelector('#igrDockFilters')).display!=='none'};
    });
    assert(final.gap>=0&&final.gap<=55,'v734: unexpected empty screen between dossier 020 and support: '+JSON.stringify(final));
    assert(final.scrollWidth<=final.viewport+1,'v734: horizontal scroll from floating navigation');
    assert(final.isFilterShown,'v734: Filters button hidden');
    assert(final.filters.height>=38&&final.home.height>=38,'v734: shortcut hit areas collapsed');
    assert(final.filters.right<final.home.left,'v734: Filtres and Accueil overlap');
    assert(final.support.bottom<=Math.min(final.filters.top,final.home.top)-2,'v734: support link covered by floating buttons');
    assert(final.selector.height>35,'v734: top collection selector hidden');
    await page.screenshot({path:path.join(report,'catalogue-v734-footer-and-shortcuts-iphone.png'),fullPage:true});
    // Simulate an old iOS drag flag. This used to swallow the click in capture.
    await page.locator('#igrDockFilters').evaluate(el=>{el.dataset.igrDragged='1'});
    await page.locator('#igrDockFilters').click();
    await page.waitForFunction(()=>window.scrollY<140,null,{timeout:3500});
    await page.waitForFunction(()=>!document.body.classList.contains('igr-catalogue-scrolled'),null,{timeout:1500});
    // Wait for the 360ms idle-state reset and the short CSS width animation.
    // At the top, the labels should be readable again, not permanently hidden.
    await page.waitForFunction(()=>{
      const b=document.getElementById('igrDockFilters');
      return b&&b.getBoundingClientRect().width>=98&&
        getComputedStyle(b.querySelector('b')).display!=='none';
    },null,{timeout:1800});
    assert(await page.locator('.igr-scenario-filters').evaluate(el=>el.classList.contains('igr-picker-attention')),
      'v734: Filtres shortcut did not highlight visible collections');
    await page.locator('#igrDockHome').click();
    assert.equal(await page.locator('body').getAttribute('data-test-home'),'yes',
      'v734: Accueil shortcut did not invoke home navigation');
    console.log('PASS v740 390px: buttons shrink while scrolling, expand when idle at dossier 020; Filtres and Accueil work');
    await context.close();
  }
}finally{await browser.close()}
