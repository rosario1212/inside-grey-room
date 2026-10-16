import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';

// Real page renderers with local role/scenario data. No account or room is created.
export async function runDesktopChecks({page,css,app,read,check,report}){
  const extract=(start,end)=>{
    const from=app.indexOf(start),to=app.indexOf(end,from);
    assert(from>=0&&to>from,'Desktop fixture requires the shipped renderer '+start);
    return app.slice(from,to);
  };
  const shell=extract('function shell(','function renderHome(');
  const renderGame=extract('function renderGame(){','function renderGameTab(');
  const setTab=extract('function setTab(','function appConfirm(');
  const scenarios=Array.from({length:8},(_,n)=>({id:String(n+1).padStart(3,'0'),title:['LA CHAMBRE 222','LE SILENCE DE LÉON','LE DERNIER PROTOCOLE','LES TROIS ABSENTS'][n%4],short:'Des déclarations se contredisent. Recoupez les faits du dossier et les indices avant de décider.'}));
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function staticPage(source,globals){
    let output='';
    const scope={...globals,VERSION:'desktop-test',document:{documentElement:{classList:{toggle(){}}},body:{classList:{toggle(){}}}},byId:()=>({set innerHTML(html){output=html}}),h:escape};
    vm.runInNewContext(shell+source,scope);return output;
  }
  const create=staticPage(extract('function renderCreateList(){','function selectScenario(')+';renderCreateList();',{
    SCENARIOS:scenarios,scenarioThumbArt:()=>'',playerCountLabel:()=> '7–10 joueurs',scenarioDifficultyTag:()=>''
  });
  const lobbySource=extract('function lobbyThemeForScenario(','async function chooseLobbyRole(');
  const choices=['Enquêteur','Analyste','Inspecteur','Expert','Journaliste','Procureur','Juge','Suspect'].map((label,i)=>({id:'role-'+i,cap:1,taken:0,info:{label,body:'Recoupe les déclarations et les faits. Tu disposes de tes propres informations et aides à reconstituer ce qui s’est passé.'}}));
  const players=Array.from({length:16},(_,i)=>({id:'player-'+i,pseudo:'Participant '+(i+1),preferred_role:i===0?'role-0':null}));
  const lobby=staticPage(lobbySource+';renderLobby();',{
    STATE:{hostToken:'audit-host',sync:{room:{scenario_id:'020',code:'AUDIT',min_players:13,max_players:16,state:{}},players,player:players[0]}},SOUND:{enabled:false},
    scenario:()=>({id:'020',title:'LA DERNIÈRE AUDIENCE'}),roleChoiceSummary:()=>choices,publicRoleLabel:v=>v,publicScenarioSummary:()=> 'Un dossier public, sans révélation des rôles secrets.',avatarHtml:()=>''
  });
  const noHorizontalOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal page overflow at desktop widths');
  const setContent=async html=>page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="app">${html}</div></body></html>`);
  const presets=[['laptop',1366,768],['desktop',1440,900],['full-hd',1920,1080],['qhd',2560,1440],['ultrawide',3440,1440]];
  for(const [name,width,height] of presets){
    await check('desktop-scenarios-'+name,async()=>{
      await page.setViewportSize({width,height});await setContent(create);
      const layout=await page.evaluate(()=>{
        const main=document.querySelector('.page').getBoundingClientRect();
        const cards=[...document.querySelectorAll('.scenario')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,right:r.right,height:r.height}});
        return {main:{x:main.x,width:main.width,right:main.right},cards};
      });
      assert(layout.main.width>=Math.min(width*.65,1180)&&layout.main.width<=1220,'Use available desktop space with a bounded reading width');
      assert(layout.cards[0].y===layout.cards[1].y&&layout.cards[0].right<layout.cards[1].x,'Dossiers should form two balanced columns');
      assert(layout.cards[2].y>layout.cards[0].y,'Subsequent cards must start a new row');
      assert(layout.cards.every(c=>c.width>=420&&c.height>=150&&c.right<=layout.main.right+.5),'Each card needs enough space for its artwork and description');
      await noHorizontalOverflow();
      if(name==='desktop')await page.screenshot({path:path.join(report,'desktop-scenarios.png'),fullPage:true});
    });
    await check('desktop-lobby-'+name,async()=>{
      await page.setViewportSize({width,height});await setContent(lobby);
      const layout=await page.evaluate(()=>{
        const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,width:r.width}};
        return {players:box('.player-list'),roles:box('.role-choice-zone'),code:box('.lobby-code'),cards:[...document.querySelectorAll('.role-choice-card:not(.random-role-card)')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right}})};
      });
      assert(layout.players.right+20<=layout.roles.x,'Participants and role selection need separate columns');
      assert(layout.roles.y<=layout.code.y+2,'Role selection must be visible alongside the room code');
      assert(layout.cards[0].y===layout.cards[1].y&&layout.cards[0].right<layout.cards[1].x,'Roles should use two legible columns');
      assert.equal(await page.locator('.player-line').count(),16,'Do not hide participants to make the layout fit');
      await noHorizontalOverflow();
      if(name==='desktop')await page.screenshot({path:path.join(report,'desktop-lobby.png'),fullPage:true});
    });
    await check('desktop-game-tabs-'+name,async()=>{
      await page.setViewportSize({width,height});await setContent('');
      await page.addScriptTag({content:`
        var STATE={room:'AUDIT',tab:'card',sync:{room:{scenario_id:'020',cycle:2,phase:'event_select'},player:{id:'one',pseudo:'Participant',public_role:'journaliste'}}};
        var VERSION='desktop-test',SOUND={enabled:false},h=v=>String(v??''),byId=id=>document.getElementById(id),saveSession=()=>{},updatePhaseClock=()=>{};
        var scenario=()=>({id:'020',title:'LA DERNIÈRE AUDIENCE'}),displayRole=()=> 'Journaliste',avatarHtml=()=>'',phaseLabel=()=> 'CHOIX D’UNE ACTION',fmtSeconds=()=> '04:00',phaseSeconds=()=>240,phaseTimerControl=()=>'',liveSessionControls=()=>'';
        var fixtureTabs=['Ma carte','Enquête','Messages','Fil des événements','Règles du jeu','Presse','Salle d’attente','Expertises','Cabinet','Déclarations','Conduite','Informations complémentaires'];
        var gameTabs=()=>fixtureTabs.map((label,i)=>({id:i===0?'card':'tab-'+i,label}));
        var renderGameTab=()=> '<div class="private-card-v11"><h2>Dossier privé</h2><p>'+('Recoupez les faits, écoutez les autres joueurs et préparez votre intervention. '.repeat(45))+'</p></div><div class="private-notes"><label for="desktopNotes">Notes personnelles</label><textarea id="desktopNotes"></textarea></div>';
        ${shell}${renderGame}${setTab}renderGame();
      `});
      const layout=await page.evaluate(()=>{
        const nav=document.querySelector('.tabs-v11').getBoundingClientRect(),panel=document.querySelector('.game-panel-v11').getBoundingClientRect();
        return {nav:{x:nav.x,right:nav.right,width:nav.width},panel:{x:panel.x,right:panel.right,width:panel.width},count:document.querySelectorAll('.tabs-v11 .tab').length};
      });
      assert(layout.nav.right+20<=layout.panel.x&&layout.panel.width>=700,'Keep navigation beside the reading panel');
      assert.equal(layout.count,12,'Keep all role-dependent destinations');
      await page.getByRole('button',{name:'Informations complémentaires',exact:true}).click();
      const active=await page.evaluate(()=>{
        const nav=document.querySelector('.tabs-v11'),tab=nav.querySelector('.active'),a=nav.getBoundingClientRect(),b=tab.getBoundingClientRect();
        return {id:STATE.tab,visible:b.top>=a.top-.5&&b.bottom<=a.bottom+.5,focused:document.activeElement===tab,scrollTop:nav.scrollTop};
      });
      assert.equal(active.id,'tab-11');assert(active.visible&&active.focused,'Switching tabs must retain visible selection and keyboard focus');
      if(height<=768)assert(active.scrollTop>0,'Short desktop screens need a scrollable navigation column');
      await page.evaluate(()=>scrollTo(0,500));
      const sticky=await page.evaluate(()=>({phase:document.querySelector('.phase-strip').getBoundingClientRect().bottom,nav:document.querySelector('.tabs-v11').getBoundingClientRect().top}));
      assert(sticky.nav>=sticky.phase+10,'The timer must not obscure the navigation while reading');
      await noHorizontalOverflow();
      if(name==='desktop')await page.screenshot({path:path.join(report,'desktop-game.png'),fullPage:true});
    });
  }
  // Crossing back to tablet width must restore the original horizontal strip.
  await check('desktop-to-tablet-navigation',async()=>{
    await page.setViewportSize({width:1440,height:900});await setContent('');
    const tabletHtml='<main class="page game-v11"><div class="tabs tabs-v11">'+Array.from({length:8},(_,i)=>'<button class="tab">Destination '+i+'</button>').join('')+'</div><section class="panel game-panel-v11">Dossier</section></main>';
    await page.locator('#app').evaluate((el,html)=>{el.innerHTML=html},tabletHtml);
    await page.setViewportSize({width:1024,height:768});
    assert.equal(await page.locator('.tabs-v11').evaluate(el=>getComputedStyle(el).flexDirection),'row','Tablet must retain horizontal navigation');
    await noHorizontalOverflow();
  });
}
