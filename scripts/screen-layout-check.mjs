import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {chromium} from 'playwright';

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
const introMatch=index.match(/<div id="introGate"[\s\S]*?<\/button>\s*<\/div>/);
assert(introMatch,'Canonical entrance markup must exist');
const introArt=await readFile(path.join(target,'assets/intro-v10-14.webp'));
const introHtml=introMatch[0].replace(/src="[^"]+"/,`src="data:image/webp;base64,${introArt.toString('base64')}"`);
const app=await read('app-v11.js');
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
const choiceSource=await read('omerta-v12-39.js');
const choiceStart=choiceSource.indexOf('function ensureChoiceStatusCard(){');
const choiceEnd=choiceSource.indexOf('function markOmertaCells(',choiceStart);
assert(choiceStart>=0&&choiceEnd>choiceStart,'Canonical role summary renderer must exist');
const choiceFunction=choiceSource.slice(choiceStart,choiceEnd);
const report=path.join(root,'layout-check-results');
await mkdir(report,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.route('**/*',route=>route.abort());
const failures=[];
async function check(name,run){
  try{await page.goto('about:blank');await run();console.log('OK · '+name)}
  catch(error){failures.push(name+': '+error.message);await page.screenshot({path:path.join(report,name.replace(/[^a-z0-9]+/gi,'-')+'.png')});}
}
try{
  const presets=[
    ['phone',390,844,0,0],['safe-area',393,852,44,34],['small-phone',320,568,0,0],
    ['browser-toolbar',390,664,0,0],['small-safe-area',375,667,44,34],
    ['landscape',844,390,0,21],['short-landscape',667,320,0,0],['narrow-landscape',568,320,0,0],['desktop',1280,800,0,0]
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
      if(width/height>=4/3&&height<=600)assert(layout.title.right+16<=layout.art.left&&layout.button.right+16<=layout.art.left,'Landscape identity and action must leave the door unobstructed');
      else assert(layout.title.bottom+12<=layout.art.top+layout.art.height*.233,'Wordmark must leave space above the doorway');
      assert.equal(await page.evaluate(()=>{scrollTo(0,500);return scrollY}),0,'Entrance must remain fixed without scrolling');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement?.id),'introEnterBtn','Entrance must remain keyboard accessible');
      if(locale==='fr'&&['phone','safe-area','landscape','desktop'].includes(name))await page.screenshot({path:path.join(report,'entrance-'+name+'.png')});
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
      await page.setContent(`<!doctype html><html class="home-locked"><head><style>${safeCss}</style></head><body class="home-locked"><div id="app">${homeHtml(resume)}</div><footer class="igr-beta-footer"><a href="support.html">Signaler un problème</a></footer></body></html>`);
      await page.addScriptTag({content:'var STATE={view:"home"};'});
      await page.addScriptTag({content:polishController});
      await page.evaluate(()=>{
        const card=document.createElement('div');
        card.className='home-action heritage-premium-home-action';card.setAttribute('role','button');card.tabIndex=0;
        card.innerHTML='<div class="icon heritage-premium-icon"><span>H</span></div><div class="heritage-premium-copy"><h3>MODE HÉRITAGE</h3><p>Campagnes persistantes · accès premium</p></div><div class="heritage-premium-side"><span class="heritage-premium-badge">PREMIUM</span><span class="heritage-premium-state">ACCÈS LIMITÉ</span></div>';
        document.querySelector('.home-actions .primary').insertAdjacentElement('afterend',card);
      });
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
}finally{await browser.close()}
assert.equal(failures.length,0,failures.join('\n'));
console.log('Entrance, home viewport and role hierarchy checks passed.');
