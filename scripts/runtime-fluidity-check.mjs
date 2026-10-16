import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';

// Real presentation controllers, isolated from accounts, audio and room writes.
const controllers=['interface-polish-v14.js','navigation-theme-v18.js','navigation-heritage-v19.js','mobile-ui-v28.js','authoritative-runtime-v41.js'];
const modes=['rules','profile','join','create-list','lobby','game'];
function fixture(mode){
  const page=mode==='create-list'?'page-create-v10-13':mode==='profile'?'profile-page':mode==='game'?'game-v11':'';
  return `<div class="app"><header class="topbar"><div class="top-actions"><button onclick="openSettings()">Paramètres</button></div></header><main class="page ${page}"><div class="page-head"><h1>Vérification</h1><button onclick="goHome()">Accueil</button></div>${mode==='create-list'?'<div class="igr-scenario-filters"><button>Filtres</button></div><div class="scenario-list-v10-13">Dossiers</div>':''}${mode==='lobby'?'<section class="lobby-v11"><div class="role-choice-zone"><p class="role-choice-help">Choisis un rôle.</p><div class="igr-choice-status"><strong class="igr-choice-status-title">Expert</strong><button class="igr-choice-status-button" onclick="window.removeCalls++">Retirer</button></div></div></section>':''}<p id="externalUpdate">État initial</p></main></div>`;
}
async function idleMutations(page){
  return page.evaluate(async()=>{
    let changes=0;
    const observer=new MutationObserver(records=>{changes+=records.length});
    observer.observe(document.getElementById('app'),{childList:true,subtree:true});
    await new Promise(resolve=>{let frames=0;const next=()=>++frames===12?resolve():requestAnimationFrame(next);requestAnimationFrame(next)});
    observer.disconnect();
    return changes;
  });
}
async function loadControllers(page,css,sources,mode,locale){
  await page.setViewportSize({width:390,height:844});
  await page.setContent(`<!doctype html><html class="" lang="${locale}"><head><style>${css}</style></head><body class=""><div id="app">${fixture(mode)}</div></body></html>`);
  await page.addScriptTag({content:`var STATE={view:${JSON.stringify(mode)},selectedScenario:'001',room:${mode==='lobby'||mode==='game'?"'QA'":"null"},sync:{room:{code:'QA',scenario_id:'001',status:${mode==='game'?"'playing'":"'lobby'"}},player:{id:'one',public_role:'expert'}}};window.IGR_LOCALE=${JSON.stringify(locale)};var STORAGE={getItem:()=>null};window.homeCalls=0;window.settingsCalls=0;window.removeCalls=0;function goHome(){window.homeCalls++}function openSettings(){window.settingsCalls++}`});
  for(const source of sources)await page.addScriptTag({content:source});
  // The authoritative controller has one delayed startup repair at 400 ms.
  await page.waitForTimeout(500);
}

export async function runFluidityChecks({page,css,app,read,check,report}){
  const sources=await Promise.all(controllers.map(read));
  let baseline=null;
  const base=process.env.IGR_BASE_SHA;
  if(base&&/^[a-f0-9]{40}$/.test(base)){
    try{baseline=controllers.map(name=>execFileSync('git',['show',`${base}:${name}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']}))}
    catch{console.log('Baseline unavailable; checking current presentation controllers.');}
  }
  for(const mode of modes)for(const locale of ['fr','en']){
    await check('idle-'+mode+'-'+locale,async()=>{
      let before=null;
      if(baseline){await loadControllers(page,css,baseline,mode,locale);before=await idleMutations(page);await page.goto('about:blank')}
      await loadControllers(page,css,sources,mode,locale);
      const after=await idleMutations(page);
      assert.equal(after,0,'Unchanged controls must stop rebuilding their own child nodes');
      await page.locator('#externalUpdate').evaluate(el=>{el.textContent='Nouvel état reçu'});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
      assert.equal(await idleMutations(page),0,'One external update must settle instead of starting another render loop');
      if(['rules','profile','join'].includes(mode)){
        assert.equal(await page.locator('.igr-utility-exit b').innerText(),mode==='rules'?(locale==='fr'?'Fermer':'Close'):(locale==='fr'?'Accueil':'Home'));
        await page.locator('.igr-utility-exit').click();
        assert.equal(await page.evaluate(()=>window.homeCalls),1,'The exit control must retain a single working action');
      }else if(mode==='create-list'){
        await page.locator('#igrDockFilters').click();
        assert(await page.locator('.igr-scenario-filters').evaluate(el=>el.classList.contains('is-dock-open')),'Filters must remain usable');
        await page.locator('#igrGlobalHome').click();
        assert.equal(await page.evaluate(()=>window.homeCalls),1,'Scenario navigation must remain usable');
      }else if(mode==='lobby'){
        assert.equal(await page.locator('.igr-choice-status-button').innerText(),locale==='fr'?'Retirer':'Remove');
        await page.locator('.igr-choice-status-button').click();
        assert.equal(await page.evaluate(()=>window.removeCalls),1,'Role removal must remain usable');
      }else{
        await page.locator('#igrTopSettings').click();
        assert(await page.evaluate(()=>window.settingsCalls>0),'In-game settings must remain usable');
      }
      console.log(`Idle ${mode}/${locale}: ${before===null?'n/a':before} → ${after} child-list mutations over 12 frames`);
    });
  }

  const draftStart=app.indexOf('function draftScope(){'),draftEnd=app.indexOf('function connectionStatus(',draftStart);
  const tabStart=app.indexOf('function setTab('),tabEnd=app.indexOf('function ',tabStart+10);
  assert(draftStart>=0&&draftEnd>draftStart&&tabStart>=0&&tabEnd>tabStart,'Canonical draft and tab handlers must exist');
  const tabs=['card','investigation','channel','video','timeline','rules'];
  const game=`<div class="app"><main class="page game-v11"><h1>Dossier de vérification</h1><div class="phase-strip"><strong>Enquête</strong><div class="phase-clock">04:00</div></div><div class="tabs tabs-v11">${tabs.map(id=>`<button id="tab-${id}" class="tab" onclick="setTab('${id}')">${({card:'Carte privée',investigation:'Investigation',channel:'Communications',video:'Vidéo',timeline:'Chronologie',rules:'Règles'})[id]}</button>`).join('')}</div><section class="panel game-panel-v11"><textarea id="note" aria-label="Notes"></textarea><select id="target"><option value="expert">Expert</option><option value="witness">Témoin</option></select><input id="confirmed" type="checkbox"><input id="photo" type="file"><div class="message-list" style="height:140px">${'<div class="msg" style="min-height:40px">Message de vérification</div>'.repeat(20)}</div><div class="timeline-v11" style="height:160px">${'<div style="height:44px">Événement</div>'.repeat(20)}</div></section></main></div>`;
  for(const width of [320,390,844])await check('game-scroll-and-drafts-'+width,async()=>{
    await page.setViewportSize({width,height:844});
    await page.setContent(`<!doctype html><html class=""><head><style>${css}</style></head><body class=""><div id="app">${game}</div></body></html>`);
    await page.addScriptTag({content:`var STATE={view:'game',tab:'timeline',sync:{room:{code:'QA',phase:'investigation',state:{match_no:1}},player:{id:'one'}}};var byId=id=>document.getElementById(id);function saveSession(){};var fixture=${JSON.stringify(game)};function renderGame(){byId('app').innerHTML=fixture;byId('tab-'+STATE.tab).classList.add('active')};${app.slice(draftStart,draftEnd)};${app.slice(tabStart,tabEnd)};`});
    const saved=await page.evaluate(()=>{
      const note=document.getElementById('note');note.value='Un brouillon conservé';note.focus({preventScroll:true});note.setSelectionRange(3,9);
      document.getElementById('target').value='witness';document.getElementById('confirmed').checked=true;
      document.querySelector('.tabs-v11').scrollLeft=150;document.querySelector('.message-list').scrollTop=180;document.querySelector('.timeline-v11').scrollTop=220;
      const draft=captureDrafts();
      renderGame();restoreDrafts(draft);
      return {expected:draft.panels,actual:draft.panels.map(p=>{const el=document.querySelectorAll(p.selector)[p.index];return {left:el.scrollLeft,top:el.scrollTop}}),value:note.value,restored:document.getElementById('note').value,focus:document.activeElement.id,start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd,checked:document.getElementById('confirmed').checked,target:document.getElementById('target').value};
    });
    assert.equal(saved.restored,saved.value,'A received update must retain the current draft');
    assert.deepEqual([saved.focus,saved.start,saved.end],['note',3,9],'A received update must retain focus and caret');
    assert(saved.checked&&saved.target==='witness','Choices must survive a received update');
    saved.expected.forEach((p,index)=>assert.deepEqual(saved.actual[index],{left:p.left,top:p.top},'Inner panels and tabs must retain their scroll position'));
    const scope=await page.evaluate(()=>{
      const draft=captureDrafts();renderGame();document.querySelector('#target option[value="witness"]').remove();restoreDrafts(draft);
      const invalidTarget=document.getElementById('target').value;
      STATE.sync.room.phase='finale';renderGame();restoreDrafts(draft);
      return {invalidTarget,note:document.getElementById('note').value};
    });
    assert.equal(scope.invalidTarget,'expert','A removed option must not clear the new valid default');
    assert.equal(scope.note,'','Drafts from another phase must not leak into the new form');
    await page.locator('.tabs-v11').evaluate(el=>{el.scrollLeft=el.scrollWidth});
    await page.locator('#tab-rules').click();
    const bounds=await page.evaluate(()=>{const strip=document.querySelector('.tabs-v11'),a=strip.getBoundingClientRect(),b=strip.querySelector('.active').getBoundingClientRect();return {left:strip.scrollLeft,visible:b.left>=a.left-.5&&b.right<=a.right+.5,tabs:strip.children.length,noOverflow:document.documentElement.scrollWidth<=innerWidth,oneRow:Math.max(...[...strip.children].map(el=>el.offsetTop))-Math.min(...[...strip.children].map(el=>el.offsetTop))<2}});
    assert(bounds.visible&&bounds.tabs===6&&bounds.noOverflow&&bounds.oneRow,'All game tabs must remain reachable in one contained horizontal row');
    if(width===320)assert(bounds.left>0,'Switching tabs must not jump the strip back to its start');
    if(width===390)await page.screenshot({path:path.join(report,'game-navigation.png')});
  });

  await check('unchanged-sync-skips-draft-capture',async()=>{
    const start=app.indexOf('async function performSync('),end=app.indexOf('function routeFromServer(',start);
    assert(start>=0&&end>start);
    let captures=0,renders=0,signature='same';
    const data={room:{scenario_id:'001',cycle:1},player:{id:'one',pseudo:'QA',public_role:'expert'},players:[],events:[]};
    const scope={STATE:{room:'QA',token:'token',syncSig:'same'},rpc:async()=>data,syncSignature:()=>signature,captureDrafts:()=>{captures++;return{}},restoreDrafts(){},routeFromServer(){renders++},connectionStatus(){},saveSession(){},refreshAvatars:async()=>{},markGameStarted(){},markGameCompleted(){},manageVideoState(){},setTimeout(){},console};
    vm.createContext(scope);vm.runInContext(app.slice(start,end),scope);
    await scope.performSync(false);assert.deepEqual([captures,renders],[0,0]);
    signature='changed';await scope.performSync(false);assert.deepEqual([captures,renders],[1,1]);
    await scope.performSync(true);assert.deepEqual([captures,renders],[2,2],'Explicit refresh must retain its canonical forced render');
  });
}
