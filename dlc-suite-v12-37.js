/* Inside Grey Room — DLC suite v12.44
   Per-player DLC ownership for TERREUR / CARTEL / LE RÉGIME, compact filters, stable themes. */
(() => {
  'use strict';

  const FILTER_KEY='igr_scenario_filter_v1237';
  const DLC_FILTER_KEY='igr_dlc_filter_v1237';
  const IDENTITY_KEY='igr_social_identity_v1';
  const CARTEL_IDS=new Set(['029','030','031']);
  const REGIME_IDS=new Set(['032','033','034']);
  const PREMIUM_IDS=new Set(['026','027','028','029','030','031','032','033','034']);
  const DLC_IDS=new Set(['021','022','023','024','025','026','027','028','029','030','031','032','033','034']);
  const DLC_ACCESS={loaded:false,items:{},loading:null};

  const CARTEL=[
    {id:'029',title:'LE CYCLE MORT',short:'L’enquête touche un réseau qui ne se contente plus de cacher ses crimes : il commence à frapper ceux qui posent les questions.',context:'Le dossier s’ouvre sur un premier homicide destiné à neutraliser la dynamique de l’enquête. Les trois suspects ne se valent pas : l’un profite, l’autre couvre, le troisième lance la spirale.',mood:'Pression · réseau · représailles.',min:5,max:8,sound:'threat',mechanics:['Intimidation','Érosion de l’enquête','Violence réseau']},
    {id:'030',title:'LA COUR ACHETÉE',short:'Les preuves existent. Le problème est de savoir ce qu’elles valent encore quand ceux qui doivent les porter ont eux-mêmes un prix.',context:'L’enquête remonte vers un réseau d’influence qui corrompt ceux censés protéger la procédure. Les joueurs doivent distinguer preuve vraie, preuve compromise et acteur déjà acheté.',mood:'Corruption · procédure · prix du silence.',min:7,max:9,sound:'court',mechanics:['Corruption judiciaire','Protection intéressée','Preuves fragilisées']},
    {id:'031',title:'LA DETTE',short:'Cette fois, le réseau ne menace plus le dossier. Il entre dans la vie de ceux qui le mènent.',context:'Le réseau passe du dossier aux proches. Les suspects savent comment la pression personnelle a été utilisée et doivent répondre de ce qu’ils ont décidé, accepté ou laissé faire.',mood:'Dette · pression intime · enlèvement moral.',min:6,max:8,sound:'debt',mechanics:['Pression privée','Négociation','Responsabilité indirecte']}
  ];
  const REGIME=[
    {id:'032',title:'LES ARCHIVES DU PALAIS',short:'Un régime est tombé. Les archives restent. Chacun affirme n’avoir été qu’un rouage.',context:'Les archives dévoilent arrestations arbitraires, disparitions et chaînes de signatures. Les suspects peuvent se renvoyer la faute, mais les documents forcent à reconstruire la responsabilité réelle.',mood:'Archives · chute du pouvoir · responsabilité.',min:6,max:8,sound:'archives',mechanics:['Chaîne d’ordre','Documents','Déni hiérarchique']},
    {id:'033',title:'LA DYNASTIE',short:'Le gouvernement a disparu. La famille qui l’entourait prétend que personne ne décidait vraiment.',context:'Une famille oligarchique a gardé le pouvoir derrière les titres. L’enquête doit séparer lien de sang, influence et décision réelle.',mood:'Famille d’État · pouvoir réel · succession.',min:6,max:8,sound:'estate',mechanics:['Arbre de pouvoir','Oligarchie','Responsabilités distinctes']},
    {id:'034',title:'LES NOMS QU’ILS PORTAIENT',short:'Dans les dossiers, ils avaient des fonctions. Dans les couloirs, ils avaient des surnoms. Les deux cartes ne coïncident pas.',context:'Les derniers dossiers du régime révèlent des surnoms rares utilisés pour désigner des acteurs dont l’influence variait selon les opérations. Les joueurs doivent reconstruire la place réelle de chacun.',mood:'Surnoms · guerre · hiérarchie opaque.',min:7,max:9,sound:'war',mechanics:['Identités de pouvoir','Délation','Reconstruction de chaîne']}
  ];

  const ART=Object.freeze({
    '029':'assets/cartel-029-le-cycle-mort.webp?v=12.37-final',
    '030':'assets/cartel-030-la-cour-achetee.webp?v=12.37-final',
    '031':'assets/cartel-031-la-dette.webp?v=12.37-final',
    '032':'assets/regime-032-les-archives-du-palais.webp?v=12.37-final',
    '033':'assets/regime-033-la-dynastie.webp?v=12.37-final',
    '034':'assets/regime-034-les-noms-quils-portaient.webp?v=12.37-final'
  });


  for(const sc of [...CARTEL,...REGIME])if(!SCENARIOS.some(x=>x.id===sc.id))SCENARIOS.push(sc);
  Object.assign(SCENARIO_ROLES,{
    '029':{required:['Enquêteur','Analyste','3 suspects'],optional:['Avocat','Procureur','2e Avocat']},
    '030':{required:['Enquêteur','Analyste','Procureur','Juge','3 suspects'],optional:['Avocat','Journaliste']},
    '031':{required:['Enquêteur','Analyste','3 suspects','Avocat'],optional:['Procureur','Témoin']},
    '032':{required:['Enquêteur','Analyste','Procureur','3 suspects'],optional:['Juge','Témoin']},
    '033':{required:['Enquêteur','Analyste','Juge','3 suspects'],optional:['Procureur','Témoin']},
    '034':{required:['Enquêteur','Analyste','Procureur','Juge','3 suspects'],optional:['Témoin','Journaliste']}
  });
  Object.assign(PUBLIC_LOBBY_SUMMARIES,Object.fromEntries([...CARTEL,...REGIME].map(sc=>[sc.id,sc.short])));

  const META={};
  for(let i=1;i<=8;i++)META[String(i).padStart(3,'0')]={origin:'base',collection:'original'};
  for(let i=9;i<=20;i++)META[String(i).padStart(3,'0')]={origin:'base',collection:'second'};
  for(let i=21;i<=25;i++)META[String(i).padStart(3,'0')]={origin:'dlc',collection:'omerta'};
  for(let i=26;i<=28;i++)META[String(i).padStart(3,'0')]={origin:'dlc',collection:'terror'};
  for(let i=29;i<=31;i++)META[String(i).padStart(3,'0')]={origin:'dlc',collection:'cartel'};
  for(let i=32;i<=34;i++)META[String(i).padStart(3,'0')]={origin:'dlc',collection:'regime'};
  window.IGR_SCENARIO_META=Object.freeze(META);
  window.IGR_DLC_ACCESS=DLC_ACCESS;
  SCENARIOS.forEach(sc=>Object.assign(sc,META[sc.id]||{}));

  const oldThumb=scenarioThumbArt,oldArt=scenarioArt;
  scenarioThumbArt=function(id){const key=String(id||'');if(!ART[key])return oldThumb(id);return ART[key]};
  scenarioArt=function(id){const key=String(id||'');return ART[key]||oldArt(id)};

  function storage(){try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}}
  function identity(){try{return JSON.parse(storage().getItem(IDENTITY_KEY)||'null')}catch{return null}}
  function profilePayload(){
    const p=loadProfile();
    let prefs={visibility:'players_and_friends',allowFriendRequests:true};
    try{prefs=Object.assign(prefs,JSON.parse(storage().getItem('igr_social_prefs_v1')||'{}'))}catch{}
    return {pseudo:(p.pseudo||'').trim(),avatar:safeAvatar(p.avatar||''),stats:{games:p.games||0,completed:p.completed||0,wins:p.wins||0,history:Array.isArray(p.history)?p.history.slice(0,10):[]},equippedTitle:p.equippedTitle||'none',equippedBadge:p.equippedBadge||'none',visibility:prefs.visibility,allowFriendRequests:prefs.allowFriendRequests!==false};
  }
  async function ensureIdentity(){
    let id=identity();if(id?.id&&id?.token)return id;
    const profile=profilePayload();if(!profile.pseudo)throw new Error('profile_pseudo_required');
    const response=await fetch(`${SUPABASE_URL}/functions/v1/igr-social`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({action:'create',profile})});
    const out=await response.json().catch(()=>({}));
    if(!response.ok||!out?.identity?.id||!out?.identity?.token)throw new Error(out?.error||'profile_create_failed');
    storage().setItem(IDENTITY_KEY,JSON.stringify(out.identity));
    return out.identity;
  }
  async function dlcAccessStatus(force=false){
    if(DLC_ACCESS.loading)return DLC_ACCESS.loading;
    if(DLC_ACCESS.loaded&&!force)return DLC_ACCESS;
    DLC_ACCESS.loading=(async()=>{
      let id=identity();
      if(!id?.id||!id?.token){
        try{if(loadProfile()?.pseudo)id=await ensureIdentity()}catch{}
      }
      if(!id?.id||!id?.token){DLC_ACCESS.loaded=true;DLC_ACCESS.items={};return DLC_ACCESS}
      try{
        const out=await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token});
        DLC_ACCESS.loaded=true;DLC_ACCESS.items=out||{};
      }catch(error){
        console.warn('DLC access',error);DLC_ACCESS.loaded=true;DLC_ACCESS.items={};
      }
      return DLC_ACCESS;
    })();
    try{return await DLC_ACCESS.loading}finally{DLC_ACCESS.loading=null}
  }
  function accessFor(collection){return DLC_ACCESS.items?.[collection]||{active:false,level:'none',expires_at:null}}
  function hasAccess(collection){return !!accessFor(collection).active}
  function collectionForScenario(id){return META[String(id||'')]?.collection||''}

  function readTextScenarioId(text){const match=String(text||'').match(/\bdossier\s*(\d{3})\b/i);return match?match[1]:''}
  function isRenderedNode(node){
    if(!node||!node.isConnected)return false;
    if(node.closest?.('[hidden],[aria-hidden="true"]'))return false;
    try{const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return false}catch{}
    return node.getClientRects?.().length>0;
  }
  function visibleScenarioId(){
    const view=String(STATE?.view||'');
    if(['home','profile','rules','join','create-list'].includes(view))return '';
    if(view==='create-confirm')return String(STATE?.selectedScenario||STATE?.scenarioId||'');
    if(view==='lobby'||view==='briefing'||view==='game'||view==='role')return String(STATE?.sync?.room?.scenario_id||'');

    const explicitSelector='[data-active-scenario-id],[data-selected-scenario-id],[data-scenario-id],[data-igr-scenario-id][aria-current="true"]';
    const explicit=[...document.querySelectorAll(explicitSelector)].filter(isRenderedNode).reverse();
    for(const node of explicit){
      const direct=node.dataset?.activeScenarioId||node.dataset?.selectedScenarioId||node.dataset?.scenarioId||node.dataset?.igrScenarioId||'';
      if(direct)return String(direct);
    }
    const selector=['#app .page-confirm-v10-13','#app .page-lobby','#app .page-room','#app .page-scenario-detail','#app .scenario-detail','#app main','#app > div'].join(',');
    for(const node of [...document.querySelectorAll(selector)].filter(isRenderedNode).reverse()){
      const id=readTextScenarioId(node.textContent);if(id)return id;
    }
    return String(STATE?.selectedScenario||STATE?.scenarioId||STATE?.sync?.room?.scenario_id||'');
  }

  function accessBadge(collection){
    if(!DLC_ACCESS.loaded)return '<span class="dlc-access-note">VÉRIFICATION…</span>';
    const entry=accessFor(collection);
    if(!entry.active)return '<span class="dlc-access-note locked">NON DÉTENU</span>';
    if(entry.level==='tester')return `<span class="dlc-access-note tester">ACCÈS TESTEUR${entry.expires_at?` · ${h(new Date(entry.expires_at).toLocaleDateString('fr-CH'))}`:''}</span>`;
    return '<span class="dlc-access-note owned">DLC DÉTENU</span>';
  }
  function lockedBlock(collection){return `<div class="dlc-owner-lock"><strong>DLC NON DÉTENU</strong><p>Ce profil ne possède pas encore ce contenu.</p>${accessBadge(collection)}</div>`}
  function card(sc,collection,label,tag){
    return `<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact ${collection}-scenario" data-igr-scenario-id="${sc.id}" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">${label} · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag ${collection}-tag">${tag}</span>${typeof scenarioDifficultyTag==='function'?scenarioDifficultyTag(sc):''}</div></div></article>`;
  }
  function accessRow(collection){return `<div class="dlc-access-row dlc-access-row--top">${accessBadge(collection)}</div>`}
  function appendCollection(root,{collection,title,eyebrow,copy,ids,label,tag}){
    root.querySelector(`.${collection}-dlc-section`)?.remove();
    for(const id of ids)document.getElementById(`scenario-${id}`)?.remove();
    const section=document.createElement('section');section.className=`panel ${collection}-dlc-section`;section.dataset.collection=collection;
    const scenarios=[...ids].map(id=>scenario(id));
    section.innerHTML=`<div class="dlc-suite-head"><div><span class="dlc-suite-eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy}</p></div></div>${accessRow(collection)}${hasAccess(collection)?`<div class="scenario-list scenario-list-v10-13 ${collection}-list">${scenarios.map(sc=>card(sc,collection,label,tag)).join('')}</div>`:lockedBlock(collection)}`;
    root.appendChild(section);
  }

  function renderTerrorAccess(root){
    const section=root.querySelector('.terror-dlc-section');if(!section)return;
    section.dataset.collection='terror';
    const list=section.querySelector('.terror-list,.scenario-list');
    section.querySelector('.dlc-owner-lock')?.remove();
    section.querySelectorAll('.dlc-access-row').forEach(el=>el.remove());
    const head=section.querySelector('.dlc-suite-head')||section.querySelector('h2')?.parentElement;
    if(head)head.insertAdjacentHTML('afterend',accessRow('terror'));
    else section.insertAdjacentHTML('afterbegin',accessRow('terror'));
    if(hasAccess('terror')){
      if(list)list.style.display='';
    }else{
      if(list)list.style.display='none';
      const row=section.querySelector('.dlc-access-row');
      if(row)row.insertAdjacentHTML('afterend',lockedBlock('terror'));
      else section.insertAdjacentHTML('beforeend',lockedBlock('terror'));
    }
  }

  function markExistingCards(root){
    root.querySelectorAll('[id^="scenario-"]').forEach(el=>{const id=el.id.replace('scenario-','');if(META[id])el.dataset.igrScenarioId=id});
    root.querySelector('.omerta-dlc-section')?.setAttribute('data-collection','omerta');
    root.querySelector('.terror-dlc-section')?.setAttribute('data-collection','terror');
  }

  function readFilter(){try{return sessionStorage.getItem(FILTER_KEY)||'all'}catch{return'all'}}
  function readDlcFilter(){try{return sessionStorage.getItem(DLC_FILTER_KEY)||'all'}catch{return'all'}}
  function storeFilter(key,value){try{sessionStorage.setItem(key,value)}catch{}}
  function filterButton(value,label,current,kind='primary'){return `<button type="button" class="igr-filter-chip ${current===value?'active':''}" data-filter-kind="${kind}" data-filter="${value}" aria-pressed="${current===value?'true':'false'}">${label}</button>`}

  function ensureFilters(root){
    let nav=root.querySelector('.igr-scenario-filters');
    if(!nav){nav=document.createElement('nav');nav.className='igr-scenario-filters';nav.setAttribute('aria-label','Filtrer les scénarios');root.insertBefore(nav,root.querySelector('.panel')||root.firstChild)}
    const primary=readFilter(),secondary=readDlcFilter();
    nav.innerHTML=`<div class="igr-filter-row" role="group" aria-label="Catégories">${[
      ['all','TOUS'],['base','BASE 001–020'],['original','001–008'],['second','009–020'],['dlc','DLC']
    ].map(([v,l])=>filterButton(v,l,primary)).join('')}</div><div class="igr-filter-row igr-filter-row-secondary ${primary==='dlc'?'':'is-hidden'}" role="group" aria-label="DLC">${[
      ['all','TOUS LES DLC'],['omerta','OMERTÀ'],['terror','TERREUR'],['cartel','CARTEL'],['regime','LE RÉGIME']
    ].map(([v,l])=>filterButton(v,l,secondary,'dlc')).join('')}</div>`;
    nav.onclick=e=>{const b=e.target.closest('.igr-filter-chip');if(!b)return;if(b.dataset.filterKind==='dlc')storeFilter(DLC_FILTER_KEY,b.dataset.filter);else storeFilter(FILTER_KEY,b.dataset.filter);ensureFilters(root);applyFilters(root)};
  }

  function scenarioVisible(id){
    const meta=META[id];if(!meta)return true;
    const primary=readFilter(),secondary=readDlcFilter();
    if(primary==='all')return true;
    if(primary==='base')return meta.origin==='base';
    if(primary==='original')return meta.collection==='original';
    if(primary==='second')return meta.collection==='second';
    if(primary==='dlc')return meta.origin==='dlc'&&(secondary==='all'||meta.collection===secondary);
    return true;
  }
  function applyFilters(root){
    markExistingCards(root);
    root.querySelectorAll('[data-igr-scenario-id]').forEach(card=>{card.style.display=scenarioVisible(card.dataset.igrScenarioId)?'':'none'});
    const primary=readFilter(),secondary=readDlcFilter();
    root.querySelectorAll('[data-collection]').forEach(section=>{
      const collection=section.dataset.collection;
      if(primary==='base'||primary==='original'||primary==='second'){section.style.display='none';return}
      if(primary==='dlc'&&secondary!=='all'){section.style.display=collection===secondary?'':'none';return}
      const cards=[...section.querySelectorAll('[data-igr-scenario-id]')];
      section.style.display=cards.length?cards.some(x=>x.style.display!=='none')?'':'none':'';
    });
  }

  function updateBodyTheme(){
    const body=document.body;if(!body)return;
    body.classList.remove('igr-theme-omerta','igr-theme-terror','igr-theme-cartel','igr-theme-regime');
    if(document.querySelector('.page-create-v10-13'))return;
    const id=visibleScenarioId();if(!DLC_IDS.has(String(id||'')))return;
    const collection=META[id]?.collection;
    if(collection==='omerta')body.classList.add('igr-theme-omerta');
    if(collection==='terror')body.classList.add('igr-theme-terror');
    if(collection==='cartel')body.classList.add('igr-theme-cartel');
    if(collection==='regime')body.classList.add('igr-theme-regime');
  }

  function decorateCreateList(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    appendCollection(root,{collection:'cartel',title:'CARTEL',eyebrow:'DLC · PRESSION',copy:'3 dossiers liés : le réseau attaque d’abord l’enquête, puis le système, puis la vie privée.',ids:CARTEL_IDS,label:'CARTEL',tag:'PRESSION'});
    appendCollection(root,{collection:'regime',title:'LE RÉGIME',eyebrow:'DLC · APRÈS LA CHUTE',copy:'3 dossiers sur crimes d’État, délation intéressée, oligarchie familiale et reconstruction du pouvoir réel.',ids:REGIME_IDS,label:'LE RÉGIME',tag:'ARCHIVES'});
    renderTerrorAccess(root);
    markExistingCards(root);ensureFilters(root);applyFilters(root);
  }

  function clearDlcVisualState(nextId=''){
    const body=document.body;if(!body)return;
    body.classList.remove('igr-theme-omerta','igr-theme-terror','igr-theme-cartel','igr-theme-regime');
    if(META[String(nextId||'')]?.collection!=='omerta'){
      body.classList.remove('igr-omerta-active');
      document.querySelectorAll('.igr-omerta-cell').forEach(el=>el.classList.remove('igr-omerta-cell'));
    }
  }


  async function enterRoomState(out,code,pseudo,host){
    STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
    Object.assign(STATE,{view:'lobby',room:out.room_code||code,token:out.player_token,hostToken:host?out.host_token:null,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
    saveSession();await pushProfileAvatar();await pushProfileCosmetics();await syncNow(true);startRoomWatcher();renderLobby();
  }

  async function createDlcRoom(){
    primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
    const pseudo=(byId('createPseudo')?.value||'').trim();
    if(!pseudo)return toast('Entre ton pseudo.');
    saveProfileData({pseudo});
    const sc=scenario(STATE.selectedScenario),key=String(sc?.id||''),collection=collectionForScenario(key);
    try{
      const id=await ensureIdentity();
      await dlcAccessStatus(true);
      if(!hasAccess(collection))return toast(`Ce profil ne détient pas le DLC ${collection==='terror'?'TERREUR':collection==='cartel'?'CARTEL':'LE RÉGIME'}.`);
      let out=null,code=null;
      for(let attempt=0;attempt<5;attempt++){
        code=newCode();
        try{out=await rpc('igr_dlc_create_room',{p_code:code,p_scenario_id:key,p_pseudo:pseudo,p_profile_id:id.id,p_profile_token:id.token});break}
        catch(e){if(e.code!=='23505'||attempt===4)throw e}
      }
      await enterRoomState(out,code,pseudo,true);
    }catch(e){
      console.error('DLC create',e);
      toast(/dlc_locked/i.test(String(e?.message||''))?'Ce profil ne détient pas ce DLC.':'Création non confirmée. Vérifie ta connexion avant de réessayer.');
    }
  }

  const baseCreateRoom=createRoom;
  createRoom=async function(){
    const key=String(STATE?.selectedScenario||'');
    if(PREMIUM_IDS.has(key))return createDlcRoom();
    return baseCreateRoom();
  };

  const baseSelectScenario=selectScenario;
  selectScenario=async function(id){
    const key=String(id||'');
    // Clear the previous DLC theme before rendering the next scenario, preventing
    // a one-frame (or persistent) carry-over when leaving an OMERTÀ room.
    clearDlcVisualState(key);
    if(PREMIUM_IDS.has(key)){
      await dlcAccessStatus();
      const collection=collectionForScenario(key);
      if(!hasAccess(collection)){if(typeof toast==='function')toast('Ce profil ne détient pas ce DLC.');updateBodyTheme();return}
    }
    const result=baseSelectScenario(id);
    queueMicrotask(updateBodyTheme);
    requestAnimationFrame(()=>updateBodyTheme());
    return result;
  };

  const oldRenderCreateList=renderCreateList;
  renderCreateList=function(){
    const out=oldRenderCreateList();
    decorateCreateList();
    updateBodyTheme();
    dlcAccessStatus().then(()=>{const root=document.querySelector('.page-create-v10-13');if(root)decorateCreateList()});
    return out;
  };


  // Premium rooms 021–034 require the joining player's own entitlement.
  const baseJoinRoom=joinRoom;
  joinRoom=async function(){
    primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
    const pseudo=(byId('joinPseudo')?.value||'').trim(),code=(byId('joinCode')?.value||'').trim().toUpperCase();
    if(!pseudo||code.length!==5)return toast('Pseudo et code requis.');
    try{
      let out;
      try{out=await rpc('igr_v4_join_room',{p_code:code,p_pseudo:pseudo})}
      catch(error){
        if(!/premium access required/i.test(String(error?.message||'')))throw error;
        saveProfileData({pseudo});
        const id=await ensureIdentity();
        out=await rpc('igr_dlc_join_room',{p_code:code,p_pseudo:pseudo,p_profile_id:id.id,p_profile_token:id.token});
      }
      await enterRoomState(out,code,pseudo,false);
    }catch(error){
      console.error('join room v12.44',error);
      const text=String(error?.message||'');
      if(/dlc_locked:omerta/i.test(text))return toast('Ce profil ne détient pas OMERTÀ.');
      if(/dlc_locked:terror/i.test(text))return toast('Ce profil ne détient pas TERREUR.');
      if(/dlc_locked:cartel/i.test(text))return toast('Ce profil ne détient pas CARTEL.');
      if(/dlc_locked:regime/i.test(text))return toast('Ce profil ne détient pas LE RÉGIME.');
      toast('Cellule introuvable, pleine, déjà lancée ou DLC non détenu.');
    }
  };


  if(typeof goHome==='function'){
    const baseGoHome=goHome;
    goHome=function(){clearDlcVisualState('');const out=baseGoHome.apply(this,arguments);queueMicrotask(updateBodyTheme);return out};
  }
  if(typeof leaveRoom==='function'){
    const baseLeaveRoom=leaveRoom;
    leaveRoom=function(){clearDlcVisualState('');const out=baseLeaveRoom.apply(this,arguments);queueMicrotask(updateBodyTheme);return out};
  }

  const observer=new MutationObserver(()=>{
    const root=document.querySelector('.page-create-v10-13');
    if(root){markExistingCards(root);applyFilters(root)}
    updateBodyTheme();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']});
  setTimeout(()=>{dlcAccessStatus().then(()=>{if(STATE?.view==='create-list')decorateCreateList()});updateBodyTheme()},0);
  window.addEventListener('pageshow',()=>{dlcAccessStatus(true).then(()=>{if(STATE?.view==='create-list')decorateCreateList()});updateBodyTheme()},{passive:true});
})();
