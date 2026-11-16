import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {chromium} from 'playwright';
import {runFluidityChecks} from './runtime-fluidity-check.mjs';
import {runMaitrePosterChecks} from './maitre-poster-layout-check.mjs';
import {runAuditGameplayChecks} from './audit-gameplay-check.mjs';
import {runNotificationChecks} from './notification-attention-check.mjs';
import {runDesktopChecks} from './desktop-layout-check.mjs';

// Offline layout checks: no accounts, live rooms or backend requests are used.
const root=process.cwd(),target=path.join(root,'dist');
const read=name=>readFile(path.join(target,name),'utf8');
const index=await read('index.html');
const styles=[];
for(const match of index.matchAll(/<link[^>]+rel="stylesheet"[^>]*>|<style[^>]*>([\s\S]*?)<\/style>/g)){
  if(match[1]!==undefined)styles.push(match[1]);
  else styles.push(await read(match[0].match(/href="([^"]+)"/)[1].split('?')[0]));
}
const css=styles.join('\n');
const introMatch=index.match(/<div id="introGate"[\s\S]*?<\/div>\s*(?=<div id="app")/);
assert(introMatch,'Canonical entrance markup must exist');
const introPath=introMatch[0].match(/<img class="intro-art" src="([^"]+)"/)?.[1]?.split('?')[0];
assert(introPath&&introPath.startsWith('assets/'),'Canonical entrance artwork must exist');
const introArt=await readFile(path.join(target,introPath));
const introHtml=introMatch[0].replace(/(<img class="intro-art" )src="[^"]+"/,`$1src="data:image/webp;base64,${introArt.toString('base64')}"`);
const app=await read('app-v11.js');
const playModes=await read('play-modes-v13-8.js');
const homeStart=app.indexOf('function shell('),homeEnd=app.indexOf('function goHome(',homeStart);
assert(homeStart>=0&&homeEnd>homeStart,'Canonical home renderer must exist');
function homeHtml(resume){
  const output={innerHTML:''},classes={toggle(){}};
  const scope={byId:()=>output,document:{documentElement:{classList:classes},body:{classList:classes}},VERSION:'layout-test',HOME_ART:'',STORAGE:{getItem:()=>resume?'saved':null},sessionKey:()=>'',SOUND:{enabled:false}};
  vm.runInNewContext(app.slice(homeStart,homeEnd),scope);
  scope.renderHome();
  return output.innerHTML;
}
const polishController=await read('interface-polish-v14.js');
const premiumSource=await read('heritage-premium-v13-6.js');
const cardStart=premiumSource.indexOf('function renderCard('),cardEnd=premiumSource.indexOf('function equalize(',cardStart);
assert(cardStart>=0&&cardEnd>cardStart,'Canonical HÉRITAGE card renderer must exist');
const premiumCardRenderer=premiumSource.slice(cardStart,cardEnd);
const choiceSource=await read('omerta-v12-39.js');
const choiceStart=choiceSource.indexOf('function ensureChoiceStatusCard(){');
const choiceEnd=choiceSource.indexOf('function markOmertaCells(',choiceStart);
assert(choiceStart>=0&&choiceEnd>choiceStart,'Canonical role summary renderer must exist');
const choiceFunction=choiceSource.slice(choiceStart,choiceEnd);
const bootstrap=await read('lobby-ui-fix-v13.js');
const loadStyleStart=bootstrap.indexOf('function loadStyle('),loadStyleEnd=bootstrap.indexOf('function loadScript(',loadStyleStart);
assert(loadStyleStart>=0&&loadStyleEnd>loadStyleStart,'Canonical style bootstrap must exist');
const startupLink=index.match(/<link\b[^>]+href="startup-stability-v13-3\.css[^>]*>/)?.[0];
assert(startupLink,'Canonical entrance stylesheet must exist');
const report=path.join(root,'layout-check-results');
await mkdir(report,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.IGR_CHROMIUM_PATH?{executablePath:process.env.IGR_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}:{} )});
const page=await browser.newPage();
await page.route('**/*',route=>route.abort());
const failures=[];
async function check(name,run){
  try{await page.goto('about:blank');await run();console.log('OK · '+name)}
  catch(error){failures.push(name+': '+error.message);await page.screenshot({path:path.join(report,name.replace(/[^a-z0-9]+/gi,'-')+'.png')});}
}
try{
  await runFluidityChecks({page,css,app,read,check,report});
  await runAuditGameplayChecks({page,read,check});
  await runNotificationChecks({page,read,check,css});
  await runDesktopChecks({page,css,app,read,check,report});

  await check('regime-v162-phone-cards-and-roles',async()=>{
    const cards=[
      {id:'032',name:'LES ARCHIVES DU PALAIS',
       description:'Deux dirigeants en fuite : le directeur de la prison de Vahran et le ministre de l Intérieur. Les enquêteurs relient les archives, les arrestations et la chaîne de commandement.',
       players:'6–8 JOUEURS'},
      {id:'034',name:'LES NOMS QU ILS PORTAIENT',
       description:'Le président déchu et son gendre, chef de la sécurité, sont recherchés. Le président peut être lié à des identités multiples, des ordres et des responsabilités distinctes.',
       players:'6–9 JOUEURS'}
    ];
    const markup=cards.map(sc=>'<article class="scenario scenario--art scenario--compact regime-scenario" data-igr-scenario-id="'+sc.id+'">'+
      '<div class="scenario-thumb compact"><img class="igr-poster-full" alt="Affiche du dossier" src=""></div>'+
      '<div class="scenario-body compact"><div class="scenario-id">LE RÉGIME · DOSSIER '+sc.id+'</div>'+
      '<h3>'+sc.name+'</h3><p class="igr-card-excerpt">'+sc.description+'</p>'+
      '<div class="tag-row"><span class="tag">'+sc.players+'</span><span class="tag regime-tag">APRÈS LA CHUTE</span></div></div></article>').join('');
    for(const width of [320,375,390,430,768,1280]){
      await page.setViewportSize({width,height:900});
      await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+
        '</style></head><body class="igr-theme-regime"><div id="app"><main class="page page-create-v10-13">'+
        '<section class="panel regime-dlc-section"><div class="scenario-list scenario-list-v10-13 regime-list">'+markup+
        '</div></section></main></div></body></html>');
      const measures=await page.locator('.regime-scenario').evaluateAll(els=>els.map(el=>{
        const body=el.querySelector('.scenario-body'),p=body.querySelector('p'),t=el.querySelector('.tag-row'),
          box=el.getBoundingClientRect(),textBox=p.getBoundingClientRect(),tagBox=t.getBoundingClientRect();
        return {cardHeight:box.height,textBottom:textBox.bottom,tagTop:tagBox.top,tagBottom:tagBox.bottom,
          cardBottom:box.bottom,bodyOverflow:body.scrollWidth>body.clientWidth+1,
          heightRule:getComputedStyle(el).maxHeight,clamp:getComputedStyle(p).webkitLineClamp,
          cardDisplay:getComputedStyle(el).display,cardHeightCSS:getComputedStyle(el).height,
          cardMinHeight:getComputedStyle(el).minHeight,cardContain:getComputedStyle(el).contain,
          cardVisibility:getComputedStyle(el).contentVisibility,
          cardIntrinsic:getComputedStyle(el).containIntrinsicSize,
          bodyDisplay:getComputedStyle(body).display,bodyHeight:getComputedStyle(body).height,
          bodyRectHeight:body.getBoundingClientRect().height,bodyScrollHeight:body.scrollHeight,
          bodyPosition:getComputedStyle(body).position};
      }));
      for(const [i,m] of measures.entries()){
        assert(m.cardHeight>=190,width+'px dossier '+cards[i].id+': card height too small');
        assert(m.heightRule==='none',width+'px dossier '+cards[i].id+': fixed max-height is still active');
        assert(m.clamp==='none',width+'px dossier '+cards[i].id+': description is unexpectedly clamped');
        assert(m.textBottom+2<=m.tagTop,width+'px dossier '+cards[i].id+': text overlaps badges: '+JSON.stringify(m));
        assert(m.tagBottom<=m.cardBottom+1,width+'px dossier '+cards[i].id+': tags outside card '+JSON.stringify(m));
        assert(!m.bodyOverflow,width+'px dossier '+cards[i].id+': text wider than card');
      }
      if(width===390)await page.screenshot({path:path.join(report,'regime-v162-iphone-cards.png'),fullPage:true});
    }
    await page.setViewportSize({width:375,height:780});
    await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+
      '</style></head><body class="igr-theme-regime"><div id="app"><main class="page page-confirm-v10-13">'+
      '<section class="panel confirm-panel-v10-13"><div class="confirm">'+
      '<div class="roles-availability"><div class="roles-row"><span>OBLIGATOIRES</span>'+
      '<p>Enquêteur · Analyste · Juge · 3 suspects</p></div>'+
      '<div class="roles-row optional"><span>FACULTATIFS</span>'+
      '<p>Procureur · Témoin · Journaliste</p></div></div></div></section></main></div></body></html>');
    const rows=await page.locator('.roles-availability .roles-row').evaluateAll(els=>els.map(el=>{
      const title=el.querySelector('span').getBoundingClientRect(),p=el.querySelector('p').getBoundingClientRect(),
        box=el.getBoundingClientRect();
      return {start:box.top,end:box.bottom,titleEnd:title.bottom,textTop:p.top,
        overflow:el.scrollWidth>el.clientWidth+1,pOverflow:el.querySelector('p').scrollWidth>el.querySelector('p').clientWidth+1};
    }));
    assert(rows[0].titleEnd<rows[0].textTop&&rows[1].titleEnd<rows[1].textTop,
      'Regime role category must be visually above its role names');
    assert(rows[0].end+5<=rows[1].start,'Regime mandatory and optional roles are too compressed');
    assert(rows.every(row=>!row.overflow&&!row.pOverflow),'Role names must wrap inside the roster panel');
    await page.screenshot({path:path.join(report,'regime-v162-iphone-roles.png'),fullPage:true});
  });


  await check('catalog-v5-30word-preview-preserves-full-details',async()=>{
    const start=app.indexOf('function scenarioCardTeaser(raw,maxWords=30)');
    const end=app.indexOf('const ADVANCED_SCENARIO_IDS=',start);
    assert(start>=0&&end>start,'Shared 30-word catalogue teaser helper is missing');
    const teaser=vm.runInNewContext(app.slice(start,end)+'; scenarioCardTeaser');
    const longText=Array.from({length:47},(_,i)=>'mot'+i).join(' ');
    const compact=teaser(longText);
    assert.equal(compact.split(/\s+/).length,30,'Classic card descriptions must be capped at 30 words');
    assert.equal(teaser(longText,19).split(/\s+/).length,19,'DLC descriptions must be capped at 19 words');
    assert(compact.endsWith('…'),'Long catalogue descriptions should signal continuation');
    assert.equal(teaser('Une description courte et complète.'),'Une description courte et complète.');
    const cartelSource=await read('dlc-suite-v12-37.js');
    const dossier029=cartelSource.match(/\{id:'029',title:'LE CYCLE MORT',short:'([^']+)',context:'([^']+)'/);
    assert(dossier029,'Cartel 029 public French synopsis not found');
    const cartelPreview=dossier029[1],cartelDetail=dossier029[2];
    assert.equal(cartelPreview.trim().split(/\s+/).length,19,'Cartel 029 must use all 19 preview words');
    assert.equal(teaser(cartelPreview,19),cartelPreview,'Cartel 029 must not be truncated in mid-description');
    assert(cartelPreview.includes('Vingt personnes restent captives.'),
      'Cartel 029 must state the hostage stakes in the public synopsis');
    assert(cartelDetail.length>cartelPreview.length+100,
      'Opening Cartel 029 must retain a more complete, substantive dossier synopsis');
    assert(cartelDetail.includes('Los Salcedo')&&cartelDetail.includes('témoignages'),
      'Cartel 029 full description must respect canon and psychological enquiry');
    assert(cartelSource.includes("'029':{short:'Three survivors seek protection:"),
      'Cartel 029 English public synopsis must be updated too');
    assert(app.includes('<p class="confirm-copy">${h(sc.context)}</p>'),
      'Opening a dossier must still display its complete context');
    for(const file of ['omerta-v12.js','terror-v12-37.js','dlc-suite-v12-37.js','premium-access-sync-v17.js']){
      const source=await read(file);
      assert(source.includes('scenarioCardTeaser(sc.short,30)'),file+': public DLC cards must support fuller 30-word summaries');
      assert(source.includes('class="igr-poster-full"')&&!source.includes('class="igr-poster-ambient"'),
        file+': every DLC rendering pathway must show one image without a vignette');
    }
    assert(app.includes('class="igr-poster-full"')&&!app.includes('class="igr-poster-ambient"'),
      'Classic cards must use a single original full-bleed image');
    assert(app.includes('src="${scenarioArt(sc.id)}"'),
      'Classic cards must load their original artwork, not a thumbnail crop');
  });

  await check('catalog-v728-five-family-approved-mockup-cards',async()=>{
    const samples=[
      {klass:'',label:'DOSSIER 001',title:'LA CHAMBRE 222',description:'Maël Sénéchal est retrouvé mort, poignardé, dans la chambre 222. Trois personnes ont croisé sa route cette nuit-là. Leurs versions se contredisent.',players:'4–5 JOUEURS'},
      {klass:'',label:'DOSSIER 006',title:'LES CENDRES DU CHALET',description:'Cinq ans après la mort de Noé lors d’une randonnée, une ancienne vidéo bouleverse les témoignages de ses trois amis.',players:'4–5 JOUEURS'},
      {klass:'omerta-scenario',label:'OMERTÀ · DOSSIER 021',title:'L’ENVELOPPE',description:'À Brooklyn, une partie des recettes du racket manque à l’appel. Plusieurs hommes avaient accès à la collecte ; aucun ne veut en répondre.',players:'4–8 JOUEURS'},
      {klass:'omerta-scenario',label:'OMERTÀ · DOSSIER 025',title:'IL DON',description:'Vittorio Santoro laisse ses hommes gérer les affaires du clan. Un racket mal maîtrisé met en cause son entourage et son autorité.',players:'4–8 JOUEURS'},
      {klass:'terror-scenario',label:'TERREUR · DOSSIER 026',title:'LA VILLE TOMBE',description:'Le FDR a pris presque tout Almizia. Des fonctionnaires ont été exécutés, des familles déplacées et des noms effacés des registres.',players:'6 JOUEURS'},
      {klass:'terror-scenario',label:'TERREUR · DOSSIER 028',title:'DERNIER PÉRIMÈTRE',description:'La capitale cède secteur après secteur. Le FDR menace les prisonniers et prétend avoir un relais jusque dans la Grey Room. Les communications coupées et les anciens accès cachent-ils une infiltration ou une opération d’intimidation ?',players:'6 JOUEURS'},
      {klass:'cartel-scenario',label:'CARTEL · DOSSIER 029',title:'LE CYCLE MORT',description:'Trois rescapés demandent protection : le cartel a envoyé la langue de leur compagnon exécuté. Vingt personnes restent captives.',players:'6–11 JOUEURS'},
      {klass:'cartel-scenario',label:'CARTEL · DOSSIER 030',title:'LA COUR ACHETÉE',description:'Le cartel a massacré un gouverneur et sa famille, puis détruit un registre compromettant. Trois assaillants ont été capturés. La Grey Room doit reconstituer les noms et les crimes que ce registre contenait.',players:'7–9 JOUEURS'},
      {klass:'regime-scenario',label:'LE RÉGIME · DOSSIER 032',title:'LES ARCHIVES DU PALAIS',description:'Après la chute du régime, des responsables ont disparu. La Grey Room reconstitue les registres et les ordres.',players:'6–8 JOUEURS'},
      {klass:'regime-scenario',label:'LE RÉGIME · DOSSIER 034',title:'LES NOMS QU’ILS PORTAIENT',description:'Le président déchu et son gendre, chef de la sécurité, tentent d’échapper à la justice. Faux noms, refuges et derniers fidèles brouillent leur trace. Une arrestation peut intervenir très tôt, mais le verdict exige des preuves.',players:'6–9 JOUEURS'}
    ];
    const codeStart=app.indexOf('function scenarioCardTeaser(raw,maxWords=30)');
    const codeEnd=app.indexOf('const ADVANCED_SCENARIO_IDS=',codeStart);
    const preview=vm.runInNewContext(app.slice(codeStart,codeEnd)+'; scenarioCardTeaser');
    const cards=samples.map(sc=>'<article class="scenario scenario--art scenario--compact '+sc.klass+'">'+
      '<div class="scenario-thumb compact"><img class="igr-poster-full" alt="Affiche du dossier" src=""></div>'+
      '<div class="scenario-body compact"><div class="scenario-id">'+sc.label+'</div><h3>'+sc.title+
      '</h3><p class="igr-card-excerpt">'+preview(sc.description,30)+'</p><div class="tag-row">'+
      '<span class="tag">'+sc.players+'</span><span class="tag">DOSSIER</span></div></div></article>');
    const families=[
      ['scenario-panel-v10-13',''],
      ['omerta-dlc-section','omerta-list'],
      ['terror-dlc-section','terror-list'],
      ['cartel-dlc-section','cartel-list'],
      ['regime-dlc-section','regime-list']
    ];
    const groupedMarkup=families.map(([section,list],i)=>
      '<section class="panel '+section+'"><div class="scenario-list scenario-list-v10-13 '+list+'">'+
      cards.slice(i*2,i*2+2).join('')+'</div></section>').join('');
    for(const width of [320,375,390,430,768,1280]){
      await page.setViewportSize({width,height:820});
      await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<style>'+css+'</style></head><body class="igr-scenario-browser igr-global-dock-active igr-dock-scrolling">'+
        '<div id="app"><div class="app"><main class="page page-create-v10-13">'+
        groupedMarkup+'</main></div></div>'+
        '<nav id="igrUniversalDock" class="igr-universal-dock"><button class="igr-dock-pill igr-dock-filters"><span>☷</span><b>Filtres</b></button>'+
        '<button class="igr-dock-pill igr-dock-home"><span>⌂</span><b>Accueil</b></button></nav></body></html>');
      const metrics=await page.locator('.scenario--compact').evaluateAll(els=>els.map(el=>{
        const body=el.querySelector('.scenario-body'),title=body.querySelector('h3'),
          excerpt=body.querySelector('.igr-card-excerpt'),tags=el.querySelector('.tag-row'),
          card=el.getBoundingClientRect(),copy=excerpt.getBoundingClientRect(),tag=tags.getBoundingClientRect(),
          style=getComputedStyle(excerpt),heading=getComputedStyle(title);
        return {height:card.height,copyBottom:copy.bottom,tagsTop:tag.top,tagsBottom:tag.bottom,cardBottom:card.bottom,
          bodyOverflow:body.scrollWidth>body.clientWidth+1,
          clamp:style.webkitLineClamp,titleClamp:heading.webkitLineClamp,
          fit:getComputedStyle(el.querySelector('.scenario-thumb .igr-poster-ambient')||el.querySelector('.scenario-thumb img')).objectFit,
          fullFit:el.querySelector('.igr-poster-full')?getComputedStyle(el.querySelector('.igr-poster-full')).objectFit:null,
          fullPadding:el.querySelector('.igr-poster-full')?getComputedStyle(el.querySelector('.igr-poster-full')).paddingTop:null,
          imageCount:el.querySelectorAll('.scenario-thumb img').length,
          artColumnWidth:el.querySelector('.scenario-thumb').getBoundingClientRect().width,
          artHeight:el.querySelector('.scenario-thumb').getBoundingClientRect().height,
          artRatio:getComputedStyle(el.querySelector('.scenario-thumb')).aspectRatio,
          artFloat:getComputedStyle(el.querySelector('.scenario-thumb')).float,
          cardDisplay:getComputedStyle(el).display,
          bodyLeft:body.getBoundingClientRect().left,
          artRight:el.querySelector('.scenario-thumb').getBoundingClientRect().right,
          artFrameWidth:el.querySelector('.igr-poster-full').getBoundingClientRect().width,
          artFrameHeight:el.querySelector('.igr-poster-full').getBoundingClientRect().height,
          artFrameRatio:getComputedStyle(el.querySelector('.igr-poster-full')).aspectRatio,
          cardVisibility:getComputedStyle(el).contentVisibility,
          cardIntrinsic:getComputedStyle(el).containIntrinsicSize,
          titleFont:parseFloat(heading.fontSize),copyFont:parseFloat(style.fontSize),
          bodyBottomPadding:parseFloat(getComputedStyle(body).paddingBottom),
          copyLineRatio:parseFloat(style.lineHeight)/parseFloat(style.fontSize),
          textVisible:style.overflow!=='hidden'&&style.display!=='none'};
      }));
      const global=await page.evaluate(()=>({
        scrollWidth:document.documentElement.scrollWidth,
        dockWidth:document.querySelector('.igr-dock-home').getBoundingClientRect().width,
        topOverlay:getComputedStyle(document.querySelector('#app'),'::before').position,
        dockTextHidden:[...document.querySelectorAll('.igr-dock-pill b')].every(el=>getComputedStyle(el).opacity==='0'),
        scrollClearance:parseFloat(getComputedStyle(document.querySelector('#app>.app')).paddingBottom)
      }));
      assert(global.scrollWidth<=width+1,width+'px: horizontal overflow '+global.scrollWidth);
      assert(global.scrollClearance>=100,width+'px: insufficient bottom safe clearance');
      if(width<=700){
        assert(global.dockWidth>=44&&global.dockWidth<=47,width+'px: dock must collapse to an icon while scrolling');
        assert(global.dockTextHidden,width+'px: dock labels must fade out while scrolling');
        await page.evaluate(()=>document.body.classList.remove('igr-dock-scrolling'));
        await page.waitForTimeout(260);
        const settled=await page.evaluate(()=>({
          widths:[...document.querySelectorAll('.igr-dock-pill')].map(x=>x.getBoundingClientRect().width),
          labels:[...document.querySelectorAll('.igr-dock-pill b')].map(x=>({visible:getComputedStyle(x).display!=='none'&&parseFloat(getComputedStyle(x).opacity)>.9,text:x.textContent.trim()}))
        }));
        assert(settled.widths.every(w=>w>=114&&w<=134),width+'px: dock must expand after scrolling stops: '+JSON.stringify(settled));
        assert(settled.labels.every(x=>x.visible)&&settled.labels.some(x=>x.text==='Filtres')&&settled.labels.some(x=>x.text==='Accueil'),width+'px: readable labels must return when idle');
        assert(global.topOverlay==='fixed',width+'px: transparent status bar is not protected');
      }
      for(let i=0;i<metrics.length;i++){
        const m=metrics[i],name=samples[i].title;
        assert(m.height>=140,width+'px '+name+': card too short');
        assert(m.cardVisibility==='visible',width+'px '+name+': legacy 240px placeholder still active');
        assert(!m.cardIntrinsic.includes('240px'),width+'px '+name+': old fake intrinsic height still applies');
        assert(m.titleFont>=17.5&&m.titleFont<=25,width+'px '+name+': title size too large or too small: '+m.titleFont);
        if(width===390&&samples[i].klass){
          assert(m.bodyBottomPadding<=12.5,
            'DLC card padding creates unnecessary dead space: '+name);
          assert(m.copyLineRatio<=1.47,
            'DLC description leading unexpectedly stretches the poster: '+name);
        }
        assert(m.copyFont>=13.5&&m.copyFont<=16,width+'px '+name+': body copy is not comfortably compact: '+m.copyFont);
        assert(!m.bodyOverflow,width+'px '+name+': clipped horizontal card text');
        assert(m.copyBottom+2<=m.tagsTop,width+'px '+name+': description touches footer badges');
        assert(m.tagsBottom<=m.cardBottom+1,width+'px '+name+': footer badges overflow their card');
        assert(m.imageCount===1,width+'px '+name+': more than one image in family artwork');
        assert(m.tagsBottom<=m.cardBottom+1,width+'px '+name+': badges extend below card '+JSON.stringify(m));
        assert(m.clamp==='none'&&m.titleClamp==='none',width+'px '+name+': title/description clamped');
        assert(m.fit==='contain',width+'px '+name+': stretched or cropped artwork (not contain)');
        assert(m.artFloat==='none'&&m.cardDisplay==='grid'&&m.bodyLeft>=m.artRight-1,
          width+'px '+name+': approved layout needs two independent columns, not text wrapping under poster');
        assert(m.imageCount===1,width+'px '+name+': duplicate image or thumbnail remains');
        if(width===390&&samples[i].klass){
          assert(m.artColumnWidth>=120&&m.artColumnWidth<=154,
            width+'px '+name+': family-specific poster column width is incorrect '+m.artColumnWidth);
        }
        assert(m.fullFit==='contain',width+'px '+name+': poster pixels must retain their original proportions');
        assert(parseFloat(m.fullPadding)===0,width+'px '+name+': edge inset remains');
        assert(m.textVisible,width+'px '+name+': description hidden');
        assert(m.artFrameHeight>110&&m.artFrameHeight<300,width+'px '+name+': family poster frame size is implausible '+m.artFrameHeight);
      }
      // Within every family, the card's text length must NEVER resize the poster.
      for(let j=0;j<samples.length;j+=2){
        const first=metrics[j],second=metrics[j+1];
        assert(samples[j].klass===samples[j+1].klass,'Poster pair belongs to different families');
        assert(Math.abs(first.artFrameWidth-second.artFrameWidth)<.5 &&
               Math.abs(first.artFrameHeight-second.artFrameHeight)<.5,
          width+'px '+(samples[j].klass||'base')+': poster dimensions differ within one family: '+
          JSON.stringify({first,second}));
      }
      if(width===390)await page.screenshot({path:path.join(report,'catalog-v11-five-family-gabarits.png'),fullPage:true});
    }
  });


  await check('catalog-v728-base-001-020-common-optical-frame',async()=>{
    const start=app.indexOf('const SCENARIOS = [');
    const end=app.indexOf('const SCENARIO_ROLES =',start);
    assert(start>=0&&end>start,'Cannot locate 001-020 canonical scenarios');
    const baseScenarios=vm.runInNewContext(app.slice(start,end)+'; SCENARIOS')
      .filter(sc=>Number(sc.id)>=9&&Number(sc.id)<=20);
    assert.equal(baseScenarios.length,12,'Exactly 12 base dossiers 009–020 must be verified');
    const helperStart=app.indexOf('function scenarioCardTeaser(raw,maxWords=30)');
    const helperEnd=app.indexOf('const ADVANCED_SCENARIO_IDS=',helperStart);
    const preview=vm.runInNewContext(app.slice(helperStart,helperEnd)+'; scenarioCardTeaser');
    const cards=baseScenarios.map(sc=>'<article id="scenario-'+sc.id+'" class="scenario scenario--art scenario--compact" data-igr-scenario-id="'+sc.id+'">'+
      '<div class="scenario-thumb compact"><img class="igr-poster-full" src="" alt=""></div>'+
      '<div class="scenario-body compact"><div class="scenario-id">DOSSIER '+sc.id+'</div>'+
      '<h3>'+sc.title+'</h3><p class="igr-card-excerpt">'+preview(sc.short,30)+'</p>'+
      '<div class="tag-row" aria-label="Informations du dossier">'+
      '<span class="tag">'+sc.min+'–'+sc.max+' JOUEURS</span><span class="tag">ENQUÊTE</span></div></div></article>').join('');
    for(const width of [320,375,390,430]){
      await page.setViewportSize({width,height:812});
      await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<style>'+css+'</style></head><body><div id="app"><main class="page page-create-v10-13">'+
        '<section class="panel scenario-panel-v10-13"><div class="scenario-list scenario-list-v10-13">'+cards+
        '</div></section></main></div></body></html>');
      const data=await page.locator('.scenario--compact').evaluateAll(els=>els.map(el=>{
        const poster=el.querySelector('.scenario-thumb').getBoundingClientRect(),
          posterFrame=el.querySelector('.igr-poster-full').getBoundingClientRect(),
          body=el.querySelector('.scenario-body').getBoundingClientRect(),
          footer=el.querySelector('.scenario-body > .tag-row').getBoundingClientRect(),
          card=el.getBoundingClientRect(),title=el.querySelector('h3'),
          style=getComputedStyle(el.querySelector('.igr-poster-full'));
        return {id:el.dataset.igrScenarioId,posterWidth:poster.width,posterHeight:poster.height,
          posterFrameWidth:posterFrame.width,posterFrameHeight:posterFrame.height,
          posterBottom:poster.bottom,bodyBottom:body.bottom,footerTop:footer.top,footerBottom:footer.bottom,
          textBottom:el.querySelector('.igr-card-excerpt').getBoundingClientRect().bottom,
          cardBottom:card.bottom,fullFit:style.objectFit,titleVisible:title.scrollWidth<=title.clientWidth+1,
          posterRight:poster.right,footerLeft:footer.left,bodyWidth:body.width,cardRight:card.right,
          footerWidth:footer.width,cardWidth:card.width,
          horizontalOverflow:el.scrollWidth>el.clientWidth+1};
      }));
      const first=data[0];
      for(const m of data){
        assert(m.fullFit==='contain',width+'px '+m.id+': artwork is cropped or distorted');
        assert(Math.abs(m.posterFrameWidth-first.posterFrameWidth)<.5&&
               Math.abs(m.posterFrameHeight-first.posterFrameHeight)<.5,
          width+'px '+m.id+': base poster differs from other dossiers 009–020');
        assert(m.footerTop>=m.textBottom+2,
          width+'px '+m.id+': player count must follow the synopsis with enough space');
        assert(m.footerBottom<=m.cardBottom+1,width+'px '+m.id+': badges escape the card');
        assert(m.footerLeft>=0&&m.footerLeft+m.footerWidth<=m.cardRight+1,
          width+'px '+m.id+': player count must remain inside the card');
        assert(m.titleVisible,width+'px '+m.id+': scenario title is clipped');
        assert(!m.horizontalOverflow,width+'px '+m.id+': card overflows horizontally');
      }
      if(width===390)await page.screenshot({path:path.join(report,'catalog-v12-all-base-009-020.png'),fullPage:true});
    }
  });

  await check('catalog-v11-real-uncropped-family-posters',async()=>{
    const assets=[
      {klass:'',name:'001 — LA CHAMBRE 222',full:'scenario-001-v10-13.webp'},
      {klass:'',name:'006 — LES CENDRES DU CHALET',full:'scenario-006-v10-13.webp'},
      {klass:'',name:'009 — BASE',full:'scenario-009-v11-6.webp'},
      {klass:'',name:'010 — BASE',full:'scenario-010-v11-6.webp'},
      {klass:'',name:'011 — BASE',full:'scenario-011-v11-6.webp'},
      {klass:'',name:'012 — BASE',full:'scenario-012-v11-6.webp'},
      {klass:'',name:'013 — BASE',full:'scenario-013-v11-6.webp'},
      {klass:'',name:'014 — BASE',full:'scenario-014-v11-6.webp'},
      {klass:'',name:'015 — BASE',full:'scenario-015-v11-6.webp'},
      {klass:'',name:'016 — BASE',full:'scenario-016-v11-6.webp'},
      {klass:'',name:'017 — BASE',full:'scenario-017-v11-6.webp'},
      {klass:'',name:'018 — BASE',full:'scenario-018-v11-6.webp'},
      {klass:'',name:'019 — BASE',full:'scenario-019-v11-6.webp'},
      {klass:'',name:'020 — BASE',full:'scenario-020-v11-6.webp'},
      {klass:'omerta-scenario',name:'021 — L’ENVELOPPE',full:'omerta-021-l-enveloppe.webp'},
      {klass:'terror-scenario',name:'026 — LA VILLE TOMBE',full:'terror-026-la-ville-tombe.webp'},
      {klass:'cartel-scenario',name:'029 — LE CYCLE MORT',full:'cartel-029-poster-v2.svg'},
      {klass:'cartel-scenario',name:'030 — LA COUR ACHETÉE',full:'cartel-030-poster-v2.svg'},
      {klass:'cartel-scenario',name:'031 — LA DETTE',full:'cartel-031-poster-v2.svg'},
      {klass:'regime-scenario',name:'032 — LES ARCHIVES DU PALAIS',full:'regime-032-les-archives-du-palais.webp'}
    ];
    const toData=async file=>{
      const bytes=await readFile(path.join(target,'assets',file));
      return 'data:'+(file.endsWith('.svg')?'image/svg+xml':'image/webp')+';base64,'+bytes.toString('base64');
    };
    const markup=[];
    for(const item of assets){
      const foreground=await toData(item.full);
      markup.push('<article id="scenario-'+item.name.slice(0,3)+'" class="scenario scenario--art scenario--compact '+item.klass+'"><div class="scenario-thumb compact">'+
        '<img class="igr-poster-full" alt="'+item.name+'" src="'+foreground+'"></div>'+
        '<div class="scenario-body compact"><div class="scenario-id">DOSSIER</div><h3>'+item.name+'</h3>'+
        '<p class="igr-card-excerpt">Le titre et les détails importants de cette image doivent rester entièrement visibles.</p>'+
        '<div class="tag-row"><span class="tag">4–6 JOUEURS</span></div></div></article>');
    }
    for(const width of [320,390,430]){
      await page.setViewportSize({width,height:812});
      await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<style>'+css+'</style></head><body><div id="app"><main class="page page-create-v10-13">'+
        '<section class="panel scenario-panel-v10-13"><div class="scenario-list scenario-list-v10-13">'+markup.join('')+
        '</div></section></main></div></body></html>');
      await page.waitForFunction(()=>[...document.querySelectorAll('.igr-poster-full')].every(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0));
      const metrics=await page.locator('.scenario--compact').evaluateAll(els=>els.map(el=>{
        const img=el.querySelector('.igr-poster-full'),holder=el.querySelector('.scenario-thumb'),
          container=holder.getBoundingClientRect(),box=img.getBoundingClientRect(),fit=getComputedStyle(img).objectFit,
          holderStyle=getComputedStyle(holder);
        const borderX=parseFloat(holderStyle.borderLeftWidth)+parseFloat(holderStyle.borderRightWidth);
        const borderY=parseFloat(holderStyle.borderTopWidth)+parseFloat(holderStyle.borderBottomWidth);
        return {fit,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
          imageCount:el.querySelectorAll('.scenario-thumb img').length,
          width:box.width,height:box.height,containerWidth:container.width,containerHeight:container.height,
          contentWidth:container.width-borderX,contentHeight:container.height-borderY,
          sourceAspect:img.naturalWidth/img.naturalHeight,displayAspect:box.width/box.height,
          inside:box.left>=container.left-1&&box.right<=container.right+1&&box.top>=container.top-1&&box.bottom<=container.bottom+1};
      }));
      for(let i=0;i<metrics.length;i++){
        const m=metrics[i],name=assets[i].name;
        assert(m.fit==='contain',width+'px '+name+': image must maintain its original aspect ratio');
        assert(m.imageCount===1,width+'px '+name+': duplicate image or mini poster remains');
        assert(m.inside,width+'px '+name+': image overflows the artwork column');
        assert(Math.abs(m.width-m.contentWidth)<=1&&m.height<=m.contentHeight+1,
          width+'px '+name+': original image frame must fit inside left column '+JSON.stringify(m));
        if(width===390){
          const deviation=Math.abs(Math.log(m.displayAspect/m.sourceAspect));
          console.log('Family poster ratio',name,'source',m.sourceAspect.toFixed(3),
            'slot',m.displayAspect.toFixed(3),'difference',deviation.toFixed(3));
          if(/^(00[1-8]|0(?:09|1[0-9]|20))/.test(name)){
            assert(Math.abs(m.displayAspect-.75)<=.025,width+'px '+name+': every Base poster must use a 3:4 display frame '+JSON.stringify(m));
          }
          if(/^(029|030|031)/.test(name)){
            assert(Math.abs(m.displayAspect-724/960)<=.015,
              width+'px '+name+': Cartel display frame ratio is incorrect '+JSON.stringify(m));
          }
        }
      }
      if(width===390)await page.screenshot({path:path.join(report,'catalog-v12-base-009-020-native34-and-dlc.png'),fullPage:true});
    }
  });

  await check('desktop-standard-multiplayer-button-launch',async()=>{
    await page.setViewportSize({width:1366,height:768});
    await page.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><div id="app"><main class="page page-confirm-v10-13"><section class="panel confirm-panel-v10-13"><div class="confirm"><label>Ton pseudo<input id="createPseudo" value="Test Desktop"></label><button class="btn primary block" type="button">Ouvrir la cellule</button></div></section></main></div></body></html>');
    await page.addScriptTag({content:`window.STATE={view:'create-confirm',selectedScenario:'001'};window.IGR_LOCALE='fr';function scenario(id){return{id}};function createRoom(){window.__igrRoomLaunches=(window.__igrRoomLaunches||0)+1};function renderCreateConfirm(){};function joinRoom(){};`});
    await page.addScriptTag({content:playModes});
    await page.locator('.dual-mode-card.is-online').waitFor();
    await page.locator('.dual-mode-card.is-online').click();
    assert.equal(await page.evaluate(()=>window.__igrRoomLaunches),1,'The desktop online mode button must enter the actual room-creation path');
    assert.equal(await page.locator('#createPseudo').inputValue(),'Test Desktop','Desktop mode switching must preserve the nickname field');
  });
  await runMaitrePosterChecks({page,css,read,check,report,target});
  await check('entrance-stylesheet-bootstrap',async()=>{
    await page.setContent(`<!doctype html><html><head>${startupLink}</head><body></body></html>`);
    await page.addScriptTag({content:`const head=document.head;${bootstrap.match(/const BUILD='[^']+';/)[0]}${bootstrap.slice(loadStyleStart,loadStyleEnd)}${bootstrap.match(/loadStyle\('igr-startup-stability-v13-3-css',[^\n]+/)[0]}`});
    assert.equal(await page.locator('link[href*="startup-stability-v13-3.css"]').count(),1,'Startup must not append an older entrance stylesheet');
    assert.equal(await page.locator('#igr-startup-stability-v13-3-css').getAttribute('href'),startupLink.match(/href="([^"]+)"/)[1],'Startup must retain the versioned head stylesheet');
  });
  const presets=[
    ['phone',390,844,0,0],['safe-area',393,852,44,34],['small-phone',320,568,0,0],
    ['browser-toolbar',390,664,0,0],['small-safe-area',375,667,44,34],
    ['landscape',844,390,0,21],['short-landscape',667,320,0,0],['narrow-landscape',568,320,0,0],['desktop',1280,800,0,0],['laptop',1366,768,0,0],['desktop-large',1920,1080,0,0],['desktop-qhd',2560,1440,0,0],['ultrawide',3440,1440,0,0]
  ];
  for(const [name,width,height,top,bottom] of presets)for(const locale of ['fr','en']){
    await check('entrance-'+name+'-'+locale,async()=>{
      await page.setViewportSize({width,height});
      const side=name==='landscape'?44:0;
      const safeCss=css.replace(/env\(safe-area-inset-(top|bottom|left|right)(?:,\s*0px)?\)/g,(_,edge)=>`${({top,bottom,left:side,right:side})[edge]}px`);
      const entrance=locale==='en'?introHtml.replace('ENTRER','ENTER').replace('TOUCHEZ POUR OUVRIR LA PORTE','TOUCH TO OPEN THE DOOR'):introHtml;
      await page.setContent(`<!doctype html><html lang="${locale}" class="home-locked"><head><style>${safeCss}</style></head><body class="home-locked">${entrance}<div id="app">${homeHtml(false)}</div></body></html>`);
      await page.locator('.intro-art').evaluate(img=>img.decode());
      const layout=await page.evaluate(()=>{
        const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        const title=document.querySelector('.intro-title'),home=document.querySelector('.home-title-spaced');
        return {
          title:box('.intro-title'),art:box('.intro-art'),button:box('#introEnterBtn'),hint:box('#introHint'),
          lines:[...title.children].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,overflow:el.scrollWidth>el.clientWidth}}),
          sameFont:getComputedStyle(title).fontFamily===getComputedStyle(home).fontFamily,
          weight:getComputedStyle(title).fontWeight,fontSize:parseFloat(getComputedStyle(title).fontSize),
          hintLine:parseFloat(getComputedStyle(document.querySelector('#introHint')).lineHeight)
        };
      });
      for(const [label,b] of Object.entries(layout).filter(([key])=>['title','button','hint'].includes(key))){
        assert(b.left>=side&&b.right<=width-side+.5&&b.top>=top&&b.bottom<=height-bottom+.5,`${label} must remain inside safe areas: ${JSON.stringify(b)}`);
      }
      assert(layout.sameFont&&Number(layout.weight)===700,'Entrance must use the home wordmark family and weight');
      assert(layout.fontSize>=30&&layout.lines.length===2&&!layout.lines.some(line=>line.overflow),'The two-line wordmark must remain legible and unclipped');
      assert(Math.abs(layout.lines[0].height-layout.lines[1].height)<1,'Both wordmark lines must have the same typographic scale');
      assert(layout.title.bottom+24<=layout.button.top,'The title and entrance action need clear separation');
      assert(layout.button.height>=44,'Entrance action needs a usable touch target');
      assert(layout.hint.height<=layout.hintLine*1.1,'The entrance hint must remain on one line');
      assert(layout.art.width/layout.art.height<=941/1672+.001,'Wide viewports must retain the full height of the doorway');
      if((width/height>=4/3&&height<=600)||(width>=1100&&height>=601))assert(layout.title.right+16<=layout.art.left&&layout.button.right+16<=layout.art.left,'Landscape identity and action must leave the door unobstructed');
      else {
        assert(layout.title.bottom+12<=layout.art.top+layout.art.height*.233,'Wordmark must leave space above the doorway');
        assert(layout.art.top+layout.art.height*.86+20<=layout.button.top,'The door threshold must remain visible above the entrance button');
      }
      assert.equal(await page.evaluate(()=>{scrollTo(0,500);return scrollY}),0,'Entrance must remain fixed without scrolling');
      if(locale==='fr'&&['phone','safe-area','landscape','desktop','desktop-large'].includes(name))await page.screenshot({path:path.join(report,'entrance-'+name+'.png')});
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'introEnterBtn','Entrance must remain keyboard accessible');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('#introGate').evaluate(el=>el.classList.add('opening'));
      assert.equal(await page.locator('.intro-art').evaluate(el=>getComputedStyle(el).animationName),'none','Reduced motion must skip the door zoom');
      await page.emulateMedia({reducedMotion:'no-preference'});
    });
  }
  for(const [name,width,height,top,bottom] of presets)for(const resume of [false,true]){
    await check(name+(resume?'-resume':''),async()=>{
      await page.setViewportSize({width,height});
      const safeCss=css.replace(/env\(safe-area-inset-(top|bottom)(?:,\s*0px)?\)/g,(_,side)=>`${side==='top'?top:bottom}px`);
      await page.setContent(`<!doctype html><html class="home-locked"><head><style>${safeCss}</style></head><body class="home-locked"><div id="app">${homeHtml(resume).replace('srcset="assets/intro-v10-14.webp"',`srcset="data:image/webp;base64,${introArt.toString('base64')}"`)}</div><footer class="igr-beta-footer"><a href="support.html">Signaler un problème</a></footer></body></html>`);
      await page.addScriptTag({content:'var STATE={view:"home"};'});
      await page.addScriptTag({content:polishController});
      await page.addScriptTag({content:`(()=>{
        const copy=()=>({title:'MODE HÉRITAGE',subtitle:'Campagnes persistantes · accès premium',premium:'PREMIUM',tester:'TESTEURS'});
        ${premiumCardRenderer}
        const card=document.createElement('div');
        card.className='home-action heritage-premium-home-action';card.setAttribute('role','button');card.tabIndex=0;
        renderCard(card,{active:true,level:'tester'});
        document.querySelector('.home-actions .primary').insertAdjacentElement('afterend',card);
      })();`});
      if(width>900&&height>500){
        await page.locator('.hero-image-home picture img').evaluate(img=>img.decode());
        assert(await page.locator('.hero-image-home picture img').evaluate(img=>img.naturalWidth>0&&img.currentSrc.startsWith('data:image/webp;')),'Desktop must display the doorway rather than the old image of a menu');
      }
      const heritage=await page.evaluate(()=>{
        const icon=document.querySelector('.heritage-premium-icon'),copy=document.querySelector('.heritage-premium-copy'),side=document.querySelector('.heritage-premium-side');
        const i=icon.getBoundingClientRect(),c=copy.getBoundingClientRect(),s=side.getBoundingClientRect();
        return {iconVisible:getComputedStyle(icon).display!=='none',iconGap:c.left-i.right,badgeGap:s.left-c.right};
      });
      if(heritage.iconVisible)assert(heritage.iconGap>=13.5,'The H icon must keep at least 14px clear of the title');
      assert(heritage.badgeGap>=13.5,'The premium badge must stay separated from the title and subtitle');
      const bounds=await page.evaluate(()=>{
        const app=document.querySelector('.home-card').getBoundingClientRect();
        return [...document.querySelectorAll('.home-action,.home-actions>.btn,.home-settings-link,.igr-beta-footer a')].map(el=>{
          const r=el.getBoundingClientRect();return {label:el.querySelector('h3')?.textContent||el.textContent.trim(),x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible:getComputedStyle(el).display!=='none',start:el.closest('footer')?0:app.top,limit:el.closest('footer')?innerHeight:app.bottom,footer:!!el.closest('footer')};
        });
      });
      assert.equal(bounds.length,resume?9:8,'All home destinations, settings, privacy and report access must remain present');
      for(const b of bounds){
        assert(b.visible&&b.width>0,`${b.label} must remain visible`);
        assert(b.height>=(b.footer?32:44)-.5,`${b.label} needs a usable touch target`);
        assert(b.x>=-.5&&b.right<=width+.5&&b.y>=b.start-.5&&b.bottom<=b.limit+.5,`${b.label} is clipped: ${JSON.stringify(b)}`);
      }
      assert(await page.evaluate(()=>[...document.querySelectorAll('.home-action h3')].every(el=>el.getBoundingClientRect().height<=parseFloat(getComputedStyle(el).lineHeight)*2.25)),'Home labels must not break into narrow columns');
      assert.equal(await page.evaluate(()=>{scrollTo(0,700);return scrollY}),0,'Home must not scroll');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Home must not overflow horizontally');
      if((name==='phone'&&!resume)||(name==='landscape'&&resume))await page.screenshot({path:path.join(report,name+'.png')});
    });
  }
  for(const theme of ['base','omerta','terror','cartel','regime']){
    await check('role-hierarchy-'+theme,async()=>{
      await page.setViewportSize({width:320,height:568});
      await page.setContent(`<!doctype html><html class=""><head><style>${css}</style></head><body class=""><div id="app"><main class="page"><section class="panel lobby-v11" data-igr-lobby-theme="${theme}"><div class="role-choice-zone"><div class="section-title"><h2>Choisis ton rôle</h2></div><p class="role-choice-help">Choisis un rôle. Pour changer, touche simplement un autre rôle avant le lancement.</p><button class="igr-random-role-cta"><span><b>RÔLE AU HASARD</b><small>Tirage uniforme parmi les rôles encore disponibles.</small></span><em>TIRER</em></button><div class="role-choice-grid">${'<button class="role-choice-card"><span><b>Enquêteur</b><small>Recoupe les informations du dossier et les déclarations.</small></span><em>0/1</em></button>'.repeat(10)}</div></div></section></main></div></body></html>`);
      await page.addScriptTag({content:`var selected='Expert';var randomButton=()=>document.querySelector('.igr-random-role-cta');var removeChoiceControl=()=>null;var selectedRoleLabel=()=>selected;window.igrClearLobbyRole=()=>{selected='';ensureChoiceStatusCard()};${choiceFunction};ensureChoiceStatusCard();ensureChoiceStatusCard();`});
      assert.equal(await page.locator('.igr-choice-status').count(),1,'Summary updates must be idempotent');
      const boxes=await page.evaluate(()=>['.section-title','.role-choice-help','.igr-choice-status','.igr-random-role-cta'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,top:r.top,bottom:r.bottom}}));
      assert(boxes.every(b=>b.x>=0&&b.right<=320),'Role controls must fit a narrow screen');
      assert(boxes[0].bottom<boxes[1].top&&boxes[1].bottom+14<=boxes[2].top&&boxes[2].bottom<boxes[3].top,'Heading, help, summary and random control must have clear visual separation');
      if(theme==='base')await page.screenshot({path:path.join(report,'role-choice.png')});
      await page.getByRole('button',{name:'Retirer',exact:true}).click();
      assert.equal(await page.locator('.igr-choice-status-title').innerText(),'Aucun rôle choisi','Remove must keep returning to automatic assignment');
      assert(await page.evaluate(()=>{scrollTo(0,500);return scrollY>0}),'The lobby must retain vertical scrolling');
    });
  }

  for(const width of [320,390,768]){
    await check('exit-controls-'+width,async()=>{
      await page.setViewportSize({width,height:740});
      await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="app"><div class="app"><main class="page game-v11"><div class="phase-strip"><div><small>PHASE</small><strong>LECTURE PRIVÉE</strong></div><div class="server-authority">MJ</div><div class="phase-timer-box"><div class="phase-host-actions"><button type="button" class="phase-exit-btn" onclick="window.igrExitClicks++">✕ Quitter</button></div></div></div><section class="panel"><div class="private-card-v11"><p>Carte secrète</p><div style="height:1100px">Récit long</div></div></section><div class="live-session-controls"><button type="button" class="live-exit-btn" onclick="window.igrExitClicks++">✕ Quitter</button><button type="button" class="live-advance-btn">Étape suivante →</button></div></main></div></div></body></html>`);
      await page.evaluate(()=>{window.igrExitClicks=0;document.body.appendChild(document.querySelector('#app .live-session-controls'))});
      const top=page.locator('.phase-exit-btn');
      assert(await top.isVisible(),'Top exit must remain visible on phone and desktop');
      const buttonBox=await top.boundingBox();
      assert(buttonBox&&buttonBox.width>=44&&buttonBox.height>=40,'Top exit touch target must be usable');
      await top.click();
      assert.equal(await page.evaluate(()=>window.igrExitClicks),1,'Top exit must receive the tap');
      await page.evaluate(()=>scrollTo(0,650));
      const bottom=page.locator('.live-exit-btn');
      await bottom.click({timeout:5000});
      assert.equal(await page.evaluate(()=>window.igrExitClicks),2,'Bottom exit must receive the tap while scrolled');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'In-game controls must not overflow horizontally');
    });
  }

  // v86: the dynamic guidance card must never become a third, narrow grid cell.
  // Settings stays in the page toolbar; both exit controls remain operable.
  for(const [name,width,height] of [['iphone',390,844],['ipad',768,1024],['desktop',1366,768],['wide',1920,1080]]){
    await check('game-guidance-controls-'+name,async()=>{
      await page.setViewportSize({width,height});
      await page.setContent('<!doctype html><html lang="fr"><head><style>'+css+'</style></head><body><div id="app"><div class="app"><header class="topbar"><div class="brand">Inside Grey Room</div><div class="top-actions"><button id="igrTopSettings" class="pill-btn igr-top-settings" onclick="window.igrSettingClicks++" aria-label="Paramètres">⚙</button></div></header><main class="page game-v11"><div class="page-head game-head-v11"><h1>Le Masque Blanc</h1></div><div class="phase-strip"><div><small>PHASE</small><strong>ASSEMBLÉE D’ENQUÊTE</strong></div><div class="server-authority">MJ AUTOMATIQUE</div><div class="phase-timer-box"><div class="phase-clock">02:17</div><div class="phase-host-actions"><button class="phase-timer-toggle">Pause</button><button class="phase-exit-btn" onclick="window.igrExitClicks++" aria-label="Quitter la partie">✕ Quitter</button></div></div></div><section class="igr51-now" id="igr51Now"><div><small>QUE FAIRE MAINTENANT ?</small><h3>Assemblée 1 · obligatoire</h3></div><p>Rejoins physiquement le camp Enquête. Partagez les premières informations et fixez les priorités.</p></section><div class="tabs tabs-v11"><button class="tab">Ma carte</button><button class="tab active">Enquête</button><button class="tab">Canal</button><button class="tab">Notes</button><button class="tab">Éléments d’enquête</button><button class="tab">Partie</button></div><section class="panel game-panel-v11"><div class="phase-explain"><h2>Assemblée d’enquête</h2><p>La partie continue.</p></div></section><div class="live-session-controls"><button class="live-exit-btn" onclick="window.igrExitClicks++">✕ Quitter</button><button class="live-advance-btn">Étape suivante →</button></div></main></div></div></body></html>');
      await page.evaluate(()=>{window.igrExitClicks=0;window.igrSettingClicks=0;document.body.appendChild(document.querySelector('.live-session-controls'))});
      const layout=await page.evaluate(()=>{
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.left,right:r.right,y:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        const a=rect('#igrTopSettings'),b=rect('.phase-exit-btn');
        return{help:rect('#igr51Now'),phase:rect('.phase-strip'),nav:rect('.tabs-v11'),panel:rect('.game-panel-v11'),
          settings:a,quit:b,overlap:a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y,scrollWidth:document.documentElement.scrollWidth};
      });
      assert(!layout.overlap,'Settings must not overlap the phase exit');
      assert(layout.scrollWidth<=width+1,'Gameplay must fit viewport width');
      assert(layout.help.width>=Math.min(layout.phase.width,layout.panel.width)-2,'Instructions must not collapse into a narrow side column');
      if(width>=1100){
        assert(layout.help.x<=layout.nav.x+1 && layout.help.right>=layout.panel.right-1,'Desktop guidance should span both columns');
        assert(layout.nav.y>=layout.help.bottom+12 && layout.panel.y>=layout.help.bottom+12,'The navigation and reading panel follow the guidance');
        assert(Math.abs(layout.nav.y-layout.panel.y)<1,'Desktop navigation aligns with content');
      }else{
        assert(layout.nav.y>=layout.help.bottom-2,'Compact navigation follows guidance');
        assert(layout.panel.y>=layout.nav.bottom-1,'The reading panel comes after tabs');
      }
      assert(layout.panel.height<360,'A short assembly description should not leave a huge empty panel');
      await page.getByRole('button',{name:'Paramètres'}).click();
      await page.locator('.phase-exit-btn').click();
      await page.locator('.live-exit-btn').click();
      assert.equal(await page.evaluate(()=>window.igrSettingClicks),1,'Settings must remain clickable');
      assert.equal(await page.evaluate(()=>window.igrExitClicks),2,'Both exit buttons must remain clickable');
      if(name==='desktop'||name==='iphone')await page.screenshot({path:path.join(report,'game-guidance-'+name+'.png'),fullPage:true});
    });
  }
}finally{await browser.close()}
assert.equal(failures.length,0,failures.join('\n'));
console.log('Entrance, home viewport and role hierarchy checks passed.');
