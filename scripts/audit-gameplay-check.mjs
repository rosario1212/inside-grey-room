import assert from 'node:assert/strict';

// Click the shipped UI and handlers with a deterministic local RPC boundary.
// Server authorization and persistence are checked separately in the SQL rollback suite.
export async function runAuditGameplayChecks({page,read,check}){
  const extract=(source,start,end)=>{
    const from=source.indexOf(start),to=source.indexOf(end,from);
    assert(from>=0&&to>from,'Gameplay implementation missing: '+start);return source.slice(from,to);
  };
  const flow=await read('gameplay-flow-v13.js');
  const controls=extract(flow,'function renderJournalistInvestigation(){','window.renderInvestigationTab=');
  const modern=await read('natural-role-gameplay-v50.js');
  const journalistRpc=modern.split('\n').find(line=>/^(?:async )?function rpc\(/.test(line));
  const journalistHandler=modern.split('\n').find(line=>line.startsWith('window.igr50JournalistInvestigate='));
  assert(journalistRpc&&journalistHandler,'Use the shipped Press RPC wrapper and investigation handler');
  for(const locale of ['fr','en'])await check('journalist-press-'+locale,async()=>{
    await page.setContent('<div id="app"></div>');
    await page.addScriptTag({content:`
      window.IGR_LOCALE=${JSON.stringify(locale)};
      window.calls=[];window.tabs=[];window.notices=[];
      var STATE={room:'AUDIT',token:'player-token',sync:{room:{cycle:1},my_actions:[]}};
      var role=()=> 'journaliste',room=()=>STATE.sync.room,esc=String,syncNow=async()=>{},toast=m=>notices.push(m);
      var setTab=tab=>tabs.push(tab),rpc=async(name,args)=>{calls.push({name,args});return {ok:true}};
      ${controls}
      document.querySelector('#app').innerHTML=renderJournalistInvestigation();
      (()=>{
        const code=()=>STATE.room,token=()=>STATE.token,copy=(fr,en)=>window.IGR_LOCALE==='en'?en:fr,refresh=async()=>{},toast=window.toast;
        ${journalistRpc}
        ${journalistHandler}
      })();
    `});
    await page.getByRole('button',{name:locale==='fr'?'Ouvrir la Presse':'Open Press',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>tabs),['press50'],'Legacy investigation must open the active Press tab');
    await page.evaluate(()=>igr50JournalistInvestigate('j1'));
    const calls=await page.evaluate(()=>window.calls);
    assert.deepEqual(calls,[{name:'igr_v50_journalist_investigate',args:{p_code:'AUDIT',p_player_token:'player-token',p_lead:'j1'}}]);
  });
  for(const [phase,role,outcome] of [['event_negociation','procureur','accepted'],['event_requete','juge','refused'],['event_saisine','juge','accepted']])await check('judicial-outcome-'+phase,async()=>{
    await page.setContent('<div id="app"></div>');
    await page.addScriptTag({content:`
      window.calls=[];window.synced=0;
      var STATE={room:'AUDIT',token:'judicial-token',sync:{room:{cycle:1},my_actions:[]}};
      var role=()=>${JSON.stringify(role)},room=()=>STATE.sync.room,esc=String,syncNow=async()=>{synced++},toast=m=>{throw Error(m)},rpc=async(name,args)=>{calls.push({name,args});return {ok:true}};
      ${controls}
      document.querySelector('#app').innerHTML=renderJudicialOutcome(${JSON.stringify(phase)},${JSON.stringify(role)});
    `});
    await page.getByRole('button',{name:outcome==='accepted'?'ACCEPTER':'REFUSER',exact:true}).click();
    await page.waitForFunction(()=>synced===1);
    assert.deepEqual(await page.evaluate(()=>calls),[{name:'igr_v13_record_judicial_outcome',args:{p_code:'AUDIT',p_player_token:'judicial-token',p_outcome:outcome,p_note:''}}]);
    assert.equal(await page.evaluate(phase=>renderJudicialOutcome(phase,'analyste'),phase),'','Other roles must not see judicial controls');
  });
  const dual=await read('play-modes-v13-8.js');
  const generic=extract(dual,'function enhanceHeritageChapter(){','async function dualJoinRoom(');
  const online=await read('heritage-maitre-online-v34-4.js');
  const data=await read('heritage-maitre-data-v34.js');
  const setup=(campaign,variant)=>`
    window.calls=[];window.saved=null;window.notices=[];
    window.IGR_HERITAGE_MAITRE={get:()=>({maitre:{canon:{variant:${JSON.stringify(variant)}}}})};
    // Deliberately stale generic state: the canonical MAÎTRE state must win.
    window.IGR_HERITAGE={get:()=>({maitre:{canon:{variant:'blind'}}})};
    window.STORAGE={values:new Map([['igr_social_identity_v1',JSON.stringify({id:'audit-profile',token:'profile-token'})]]),getItem(k){return this.values.get(k)||null},setItem(k,v){this.values.set(k,v)},removeItem(k){this.values.delete(k)}};
    window.rpc=async(name,args)=>{
      calls.push({name,args});
      if(name==='igr_heritage_online_sync')return {room:{campaign_id:'maitre',chapter:3,status:'lobby',stage:'lobby'},players:[{id:'host',pseudo:'Audit Host',is_host:true}],player:{id:'host'}};
      return {room_code:'HABCD',player_token:'player-token',host_token:'host-token',player_id:'host',campaign_id:${JSON.stringify(campaign)},chapter:3};
    };
    window.toast=m=>notices.push(m);
    (()=>{
      const $=(s,r=document)=>r.querySelector(s),esc=String,hSession=()=>null,shellPut=html=>document.querySelector('#app').innerHTML=html;
      const toastX=window.toast,heritageMeta=()=>({title:'Campaign',chapters:[{},{},{title:'Dossier 3'}]}),pseudoDefault=()=>'',profileIdentity=()=>({id:'audit-profile',token:'profile-token'});
      const storage=()=>window.STORAGE,saveHSession=s=>window.saved=s,startHWatcher=()=>{},newHCode=()=> 'HABCD';
      ${generic}
      enhanceHeritageChapter();
    })();
  `;
  const html=campaign=>`<div id="app"><main class="page hplay hplay-dossier ${campaign==='maitre'?'maitre-page':''}"><section class="hplay-launch-box"><b>Mode</b><p>Instructions</p><button class="hplay-launch" data-campaign="${campaign}" data-chapter="3" data-maitre-action="setup">COMMENCER</button></section></main></div>`;
  for(const variant of ['fiscal','blind','link'])await check('maitre-canonical-creation-'+variant,async()=>{
    await page.setContent(html('maitre'));
    await page.addScriptTag({content:data});await page.addScriptTag({content:setup('maitre',variant)});
    await page.addScriptTag({content:online});
    await page.locator('.heritage-online-btn').click();
    assert.equal(await page.locator('#mnetPseudo').count(),1,'The generic mode chooser must open the canonical MAÎTRE form');
    assert.equal(await page.locator('#hnetPseudo').count(),0,'Do not retain the generic form that omits the variant');
    await page.locator('#mnetPseudo').fill('Audit Host');
    await page.locator('[data-mnet="createNow"]').click();
    await page.waitForFunction(()=>calls.some(c=>c.name==='igr_heritage_online_create_maitre'));
    const calls=await page.evaluate(()=>window.calls);
    assert(!calls.some(c=>c.name==='igr_heritage_online_create'),'Never create MAÎTRE without its canonical variant');
    const creation=calls.find(c=>c.name==='igr_heritage_online_create_maitre');
    assert.equal(creation.args.p_variant,variant);assert.equal(creation.args.p_chapter,3);
    assert.equal(creation.args.p_profile_id,'audit-profile');assert.equal(creation.args.p_pseudo,'Audit Host');
    assert.deepEqual(await page.evaluate(()=>notices),[]);
  });
  for(const campaign of ['cendres','kuroi'])await check('heritage-creation-'+campaign,async()=>{
    await page.setContent(html(campaign));await page.addScriptTag({content:setup(campaign,'fiscal')});
    await page.locator('.heritage-online-btn').click();await page.locator('#hnetPseudo').fill('Audit Host');await page.locator('#hnetCreateBtn').click();
    await page.waitForFunction(()=>window.saved!==null);
    assert.deepEqual(await page.evaluate(()=>calls),[{name:'igr_heritage_online_create',args:{p_code:'HABCD',p_campaign_id:campaign,p_chapter:3,p_pseudo:'Audit Host',p_profile_id:'audit-profile',p_profile_token:'profile-token'}}]);
    assert.equal(await page.evaluate(()=>saved.campaign),campaign);
  });
}
