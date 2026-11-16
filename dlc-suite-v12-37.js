/* Inside Grey Room — DLC suite v12.44
   Host-owned DLC licences for TERREUR / CARTEL / LE RÉGIME. Guests join licensed rooms for free. */
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

  // v752: catalogue-only public hooks, never replacing full dossier contexts.
  const DLC_CARD_TEASERS=Object.freeze({
  "fr": {
    "021": "Une enveloppe disparaît. Dans la Famiglia, personne ne veut répondre.",
    "022": "Nino Caruso est mort. Deux témoins se contredisent.",
    "023": "Trois familles négocient une trêve. Une embuscade change tout.",
    "024": "Massimo De Luca envisage de parler. Le clan le soupçonne.",
    "025": "Un racket tourne mal. L’autorité du Don vacille.",
    "026": "Le FDR domine Almizia. Trois captifs parlent.",
    "027": "Le FDR dit la zone vide. Où sont les otages ?",
    "028": "La capitale tombe. La Grey Room serait infiltrée.",
    "029": "Trois rescapés demandent protection. Vingt personnes restent captives.",
    "030": "Un gouverneur est massacré avec sa famille. Un registre disparaît.",
    "031": "Six agents abattus près de la frontière. Trois chefs de commando arrêtés.",
    "032": "Deux dirigeants sont en fuite. Les archives pourraient les trahir.",
    "033": "Le fils du président et son cousin sont en fuite. Le clan se fissure.",
    "034": "Le président déchu se cache. Ses fidèles brouillent les pistes."
  },
  "en": {
    "021": "An envelope disappears. No one in the Family will answer for it.",
    "022": "Nino Caruso is dead. Two witnesses contradict each other.",
    "023": "Three families negotiate a truce. An ambush changes everything.",
    "024": "Massimo De Luca may talk. His clan grows suspicious.",
    "025": "A protection racket goes wrong. The Don's authority is shaken.",
    "026": "The FDR controls Almizia. Three captives speak.",
    "027": "The FDR says the zone is empty. Are there hostages?",
    "028": "The capital falls. The Grey Room may be infiltrated.",
    "029": "Three survivors seek protection. Twenty people remain captive.",
    "030": "A governor and his family are murdered. A ledger vanishes.",
    "031": "Six agents killed near the border. Three unit chiefs arrested.",
    "032": "Two officials are on the run. The archives may expose them.",
    "033": "The president's son and cousin are fugitives. The clan fractures.",
    "034": "The fallen president is hiding. His loyalists cover his tracks."
  }
});
  function dlcCardTeaser(sc){
    return DLC_CARD_TEASERS[window.IGR_LOCALE==='en'?'en':'fr'][String(sc.id)] || String(sc.short||'').trim();
  }

  // Shared public canon only: all places and characters are fictional.
  // Never encode A/B/C culprit, secret loyalties or evidence outcomes here.
  const CARTEL=[
    {id:'029',title:'LE CYCLE MORT',short:'Trois rescapés demandent protection : le cartel a envoyé la langue de leur compagnon exécuté. Vingt personnes restent captives.',context:'À Puerto Ceniza, dans le Sinaloa, trois rescapés réclament la protection de la Grey Room. Los Salcedo ont fait exécuter leur compagnon, puis ont envoyé sa langue comme avertissement. Vingt personnes restent prisonnières du réseau. Face à des récits qui ne concordent pas toujours et à la crainte des représailles, la cellule doit recouper les témoignages, établir qui a donné les ordres et rechercher des moyens de protéger les captifs.',mood:'Sinaloa · témoignages · menaces · survie.',min:6,max:11,sound:'threat',mechanics:['Témoignages contradictoires','Hiérarchie du cartel','Protection des captifs']},
    {id:'030',title:'LA COUR ACHETÉE',short:'Le cartel a massacré un gouverneur et sa famille, puis détruit un registre compromettant. Trois assaillants ont été capturés. La Grey Room doit reconstituer les noms et les crimes que ce registre contenait.',context:'Le cartel a massacré un gouverneur et sa famille, puis détruit un registre compromettant. Trois assaillants ont été capturés. La Grey Room doit reconstituer les noms et les crimes que ce registre contenait.',mood:'Mexique · massacre · registre détruit · corruption institutionnelle.',min:7,max:9,sound:'court',mechanics:['Reconstitution des faits','Trois colonnes du registre','Confrontations et recoupements','Intégrité des preuves']},
    {id:'031',title:'LA DETTE',short:'Six agents tués, trois chefs arrêtés. Ce que le commando voulait faire disparaître menace de retourner l’enquête contre la Grey Room.',context:'Au Mexique, dans le Sonora, après le massacre du gouverneur, six agents américains sont abattus près de la frontière. Trois chefs du commando sont arrêtés. La Grey Room doit reconstituer l’embuscade et découvrir ce que les tueurs voulaient empêcher de remonter. L’enquête se joue en trois cycles ; ses conséquences dépasseront la salle d’interrogatoire.',mood:'Frontière · dette · peur intime.',min:6,max:8,sound:'debt',mechanics:['Trois chefs du commando','Pression privée','Décisions collectives']}
  ];
  const REGIME=[
    {id:'032',title:'LES ARCHIVES DU PALAIS',short:'Après la chute du régime, le directeur de Vahran et le ministre de l’Intérieur ont disparu. Registres de détention, transferts et réseaux de protection permettent de remonter leur piste. Les capturer ne suffira pas à établir leurs responsabilités.',context:'Le directeur de la prison de Vahran et le ministre de l’Intérieur sont en fuite. Les enquêteurs suivent les registres, les transferts et les réseaux de protection. Au tribunal, les responsabilités sont établies par le vote collectif, distinct des captures.',mood:'Prison · transferts · traque pénitentiaire.',min:6,max:8,sound:'archives',mechanics:['Deux dirigeants à capturer','Variantes de fuite','Responsabilités par actes']},
    {id:'033',title:'LA DYNASTIE',short:'Le fils du président et son cousin, ministre de la Défense, sont en fuite après la guerre. Entre anciens alliés, ordres militaires et rivalités familiales, la Grey Room doit les retrouver et déterminer ce qu’ils ont réellement décidé.',context:'Le fils du président et son cousin, ministre de la Défense, cherchent à échapper aux poursuites. Entre fidélités militaires et rivalités familiales, les enquêteurs doivent reconstituer les ordres de guerre. Captures et verdict collectif déterminent l’issue.',mood:'Guerre · héritage · trahisons.',min:6,max:8,sound:'estate',mechanics:['Deux dirigeants à capturer','Rupture du clan','Responsabilités de guerre']},
    {id:'034',title:'LES NOMS QU’ILS PORTAIENT',short:'Le président déchu et son gendre, chef de la sécurité, tentent d’échapper à la justice. Faux noms, refuges et derniers fidèles brouillent leur trace. Une arrestation peut intervenir très tôt, mais le verdict exige des preuves.',context:'Le président déchu et son gendre, chef de la sécurité, tentent de disparaître. Faux noms, relais et refuges compliquent la traque ; une arrestation peut intervenir dès le premier cycle. Le procès distingue les captures des responsabilités réellement établies.',mood:'Traque présidentielle · réseau de fidèles · procès.',min:6,max:9,sound:'war',mechanics:['Capture possible dès C1','Pistes de refuge','Procédure judiciaire']}
  ];

  const ART=Object.freeze({
    '029':'assets/cartel-029-poster-v2.svg?v=v20261018-cartel-open-masthead-v7',
    '030':'assets/cartel-030-poster-v2.svg?v=v20261018-cartel-open-masthead-v7',
    '031':'assets/cartel-031-poster-v2.svg?v=v20261018-cartel-open-masthead-v7',
    '032':'assets/regime-032-les-archives-du-palais.webp?v=12.37-final',
    '033':'assets/regime-033-la-dynastie.webp?v=12.37-final',
    '034':'assets/regime-034-les-noms-quils-portaient.webp?v=12.37-final'
  });


  for(const sc of [...CARTEL,...REGIME])if(!SCENARIOS.some(x=>x.id===sc.id))SCENARIOS.push(sc);
  Object.assign(SCENARIO_ROLES,{
    '029':{required:['Enquêteur','Analyste','4 témoins'],optional:['Procureur','Juge','Journaliste','Don','Bras droit']},
    '030':{required:['Enquêteur','Analyste','Procureur','Juge','3 suspects'],optional:['Avocat','Journaliste']},
    '031':{required:['Enquêteur','Analyste','3 suspects','Avocat'],optional:['Procureur','Témoin']},
    '032':{required:['Enquêteur','Analyste','Juge','3 suspects'],optional:['Procureur','Témoin']},
    '033':{required:['Enquêteur','Analyste','Juge','3 suspects'],optional:['Procureur','Témoin']},
    '034':{required:['Enquêteur','Analyste','Juge','3 suspects'],optional:['Procureur','Témoin','Journaliste']}
  });
  Object.assign(PUBLIC_LOBBY_SUMMARIES,Object.fromEntries([...CARTEL,...REGIME].map(sc=>[sc.id,sc.short])));
  // The English edition loads before this DLC; keep the public Mexican canon bilingual.
  if(window.IGR_LOCALE==='en'){
    const englishCartel={
      '029':{short:'Three survivors seek protection: the cartel sent them the tongue of their murdered companion. Twenty people remain captive.',context:'In Puerto Ceniza, Sinaloa, three survivors seek protection from the Grey Room. Los Salcedo had their companion killed and sent his tongue as a warning. Twenty people are still held by the network. Faced with conflicting accounts and fear of reprisals, the investigators must corroborate the testimonies, establish who gave the orders and look for ways to protect the captives.',mood:'Mexico · surveillance · reprisals.',mechanics:['Intimidation','Pressure on the investigation','Network violence']},
      '030':{short:'The cartel massacred a governor and his family, then destroyed an incriminating ledger. Three attackers were captured. The Grey Room must reconstruct the names and crimes the ledger contained.',context:'The cartel massacred a governor and his family, then destroyed an incriminating ledger. Three attackers were captured. The Grey Room must reconstruct the names and crimes the ledger contained.',mood:'Mexico · justice under pressure · leaks.',mechanics:['Judicial corruption','Conditional protection','Compromised evidence']},
      '031':{short:'Six agents killed, three arrested chiefs. What the attackers tried to bury threatens to turn the investigation against the Grey Room.',context:'After the governor’s massacre, six American agents are killed near the border. Three chiefs of the attacking unit are arrested. The Grey Room must reconstruct the ambush and discover what the killers tried to keep from coming to light. The investigation has three cycles; its consequences will reach beyond the interrogation room.',mood:'Border · debt · personal terror.',mechanics:['Three unit chiefs','Private pressure','Collective decisions']}
    };
    for(const sc of CARTEL)Object.assign(sc,englishCartel[sc.id]);
    Object.assign(PUBLIC_LOBBY_SUMMARIES,Object.fromEntries(CARTEL.map(sc=>[sc.id,sc.short])));
  }


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
    if(view==='lobby')return String(document.querySelector('.lobby-v11[data-igr-scenario-id]')?.dataset.igrScenarioId||STATE?.sync?.room?.scenario_id||'');
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
    return `<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact ${collection}-scenario" data-igr-scenario-id="${sc.id}" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact" style="--igr-cover-url:url('${scenarioArt(sc.id)}')"><img class="igr-poster-full" loading="lazy" decoding="async" src="${scenarioArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">${label} · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p class="igr-card-excerpt">${h(dlcCardTeaser(sc))}</p><div class="tag-row" aria-label="Informations du dossier"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag ${collection}-tag">${tag}</span>${typeof scenarioDifficultyTag==='function'?scenarioDifficultyTag(sc):''}</div></div></article>`;
  }
  function accessRow(collection){return `<div class="dlc-access-row dlc-access-row--top">${accessBadge(collection)}</div>`}
  // Public-only preview. Never include hidden loyalties or inferred influence in this tree.
  function regimeGovernmentPreview(){
    return `<details class="igr-regime-org-preview">
      <summary><span>ORGANIGRAMME DU RÉGIME</span><small>Clan présidentiel et appareil d’État</small></summary>
      <div class="igr-regime-org-content">
        <p class="igr-regime-org-lead">République de Karsane · 15 millions d’habitants avant la guerre · gouvernement masculin sous la dictature. <strong>Deux joueurs incarnent les fugitifs dès C1</strong> ; le troisième suspect peut être interrogé. L’Enquêteur dirige les recherches, l’Analyste recoupe les pistes, le Juge contrôle les ordonnances et le Procureur est facultatif. Les personnages incarnés utilisent les noms de leurs joueurs en partie.</p>
        <div class="igr-regime-org-head"><strong>PRÉSIDENT DÉCHU</strong><span>COMMANDEMENT SUPRÊME</span><small>Les personnages incarnés utilisent les pseudonymes des joueurs une fois leurs rôles attribués.</small></div>
        <div class="igr-regime-org-nodes" role="list" aria-label="Membres du pouvoir">
          <article role="listitem"><strong>MINISTRE DE LA DÉFENSE</strong><small>COUSIN</small><span>Ministre de la Défense</span></article>
          <article role="listitem"><strong>MINISTRE DE L’INTÉRIEUR</strong><small>FRÈRE</small><span>Ministre de l’Intérieur</span></article>
          <article role="listitem"><strong>FILS DU PRÉSIDENT</strong><small>HÉRITIER PRÉSUMÉ</small><span>Ministre de l’Information</span></article>
          <article role="listitem"><strong>CHEF DE LA SÉCURITÉ</strong><small>GENDRE</small><span>Chef de la sécurité présidentielle</span></article>
          <article role="listitem"><strong>SECRÉTAIRE DU PALAIS</strong><small>CONFIDENT · SANS PARENTÉ</small><span>Secrétaire général du palais</span></article>
          <article role="listitem"><strong>DIRECTEUR DE VAHRAN</strong><small>FIDÈLE · SANS PARENTÉ</small><span>Directeur de la prison de Vahran · sous l’Intérieur</span></article>
        </div>
        <p class="igr-regime-org-note">Liens familiaux et fonctions officielles sont connus. Le pouvoir réel reste à prouver dans chaque enquête : aucun lien secret n’est dévoilé ici.</p>
      </div>
    </details>`;
  }

  function appendCollection(root,{collection,title,eyebrow,copy,ids,label,tag}){
    root.querySelector(`.${collection}-dlc-section`)?.remove();
    for(const id of ids)document.getElementById(`scenario-${id}`)?.remove();
    const section=document.createElement('section');section.className=`panel ${collection}-dlc-section`;section.dataset.collection=collection;
    const scenarios=[...ids].map(id=>scenario(id));
    section.innerHTML=`<div class="dlc-suite-head"><div><span class="dlc-suite-eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy}</p></div></div>${accessRow(collection)}${hasAccess(collection)?`<div class="scenario-list scenario-list-v10-13 ${collection}-list">${scenarios.map(sc=>card(sc,collection,label,tag)).join('')}</div>`:lockedBlock(collection)}`;
    if(collection==='regime')section.querySelector('.dlc-suite-head')?.insertAdjacentHTML('afterend',regimeGovernmentPreview());
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


  // v730: 20 classic dossiers share the normal scroll; DLCs are individual
  // collections, never sections stacked beneath the base or each other.
  const CATALOG_FILTER_OPTIONS = Object.freeze([
    ['base','Dossiers classiques · 001–020','Base cases · 001–020'],
    ['omerta','Omertà · 021–025','Omertà · 021–025'],
    ['terror','Terreur · 026–028','Terror · 026–028'],
    ['cartel','Cartel · 029–031','Cartel · 029–031'],
    ['regime','Le Régime · 032–034','The Regime · 032–034']
  ]);
  function readFilter(){
    try{
      const stored=sessionStorage.getItem(FILTER_KEY)||'base';
      const oldDlc=sessionStorage.getItem(DLC_FILTER_KEY)||'all';
      const value=stored==='dlc'&&['omerta','terror','cartel','regime'].includes(oldDlc)
        ?oldDlc:stored;
      return CATALOG_FILTER_OPTIONS.some(option=>option[0]===value)?value:'base';
    }catch{return 'base'}
  }
  function storeFilter(value){
    try{
      sessionStorage.setItem(FILTER_KEY,value);
      sessionStorage.removeItem(DLC_FILTER_KEY);
    }catch{}
  }
  // v731 — collections are primary navigation, never a hidden filter drawer.
  // Buttons stay in the page itself (above the cards) and survive rerenders.
  function ensureFilters(root){
    let nav=root.querySelector('.igr-scenario-filters');
    if(!nav)nav=document.createElement('nav');
    nav.className='igr-scenario-filters igr-family-picker igr-family-picker-v731';
    nav.setAttribute('aria-label',window.IGR_LOCALE==='en'?'Scenario collections':'Collections de scénarios');
    const head=root.querySelector('.page-head');
    if(head&&head.nextElementSibling!==nav)head.insertAdjacentElement('afterend',nav);
    else if(!nav.parentElement)root.prepend(nav);
    const en=window.IGR_LOCALE==='en';
    if(!nav.querySelector('.igr-collection-choices')){
      const counts={base:'20',omerta:'5',terror:'3',cartel:'3',regime:'3'};
      nav.innerHTML='<div class="igr-collection-top"><span class="igr-catalog-label">'+
        (en?'SELECT A COLLECTION':'CHOISIR UNE COLLECTION')+'</span>'+
        '<span class="igr-catalog-count" aria-live="polite"></span></div>'+
        '<div class="igr-collection-choices" role="group" aria-label="'+
        (en?'Choose case collection':'Choisir les dossiers')+'">'+
        CATALOG_FILTER_OPTIONS.map(option=>
          '<button type="button" class="igr-collection-choice" data-family="'+option[0]+'" aria-pressed="false">'+
          '<span class="igr-family-name">'+(en?option[2].split(' · ')[0]:option[1].split(' · ')[0])+'</span>'+
          '<span class="igr-family-range">'+option[1].split(' · ')[1]+' · '+counts[option[0]]+(en?' cases':' dossiers')+'</span>'+
          '</button>').join('')+'</div>';
      nav.querySelector('.igr-collection-choices').addEventListener('click',event=>{
        const btn=event.target.closest('button[data-family]');
        if(!btn||!nav.contains(btn))return;
        const next=btn.dataset.family;
        if(!CATALOG_FILTER_OPTIONS.some(o=>o[0]===next))return;
        if(readFilter()===next)return;
        storeFilter(next);
        applyFilters(root);
        // A deliberate DLC switch begins at the start of its list.
        const targetTop=root.getBoundingClientRect().top+window.scrollY;
        window.scrollTo({top:Math.max(0,targetTop),behavior:'auto'});
      });
    }
  }
  function scenarioVisible(id,filter=readFilter()){
    const meta=META[String(id||'')];
    if(!meta)return false;
    return filter==='base'?meta.origin==='base':meta.collection===filter;
  }
  function setFilteredVisibility(element,visible){
    if(!element)return;
    // Card CSS uses display:grid!important: inline important is mandatory.
    element.hidden=!visible;
    if(visible)element.style.removeProperty('display');
    else element.style.setProperty('display','none','important');
  }
  function applyFilters(root){
    markExistingCards(root);
    const filter=readFilter();
    root.dataset.igrCatalogFamily=filter;
    root.querySelectorAll('[data-igr-scenario-id]').forEach(card=>
      setFilteredVisibility(card,scenarioVisible(card.dataset.igrScenarioId,filter))
    );
    const base=root.querySelector('.scenario-panel-v10-13');
    setFilteredVisibility(base,filter==='base');
    root.querySelectorAll('section[data-collection]').forEach(section=>
      setFilteredVisibility(section,section.dataset.collection===filter)
    );
    const nav=root.querySelector('.igr-scenario-filters');
    nav?.querySelectorAll('.igr-collection-choice').forEach(button=>{
      const selected=button.dataset.family===filter;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    const count=nav?.querySelector('.igr-catalog-count');
    if(count){
      const n=Object.keys(META).filter(id=>scenarioVisible(id,filter)).length;
      count.textContent=window.IGR_LOCALE==='en'?n+' cases':n+' dossiers';
    }
  }

  function updateBodyTheme(){
    const body=document.body;if(!body)return;
    const id=document.querySelector('.page-create-v10-13')?'':visibleScenarioId();
    const collection=DLC_IDS.has(String(id||''))?META[id]?.collection:'';
    for(const theme of ['omerta','terror','cartel','regime']){
      body.classList.toggle(`igr-theme-${theme}`,theme===collection);
    }
  }

  function decorateCreateList(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    appendCollection(root,{collection:'cartel',title:'CARTEL',eyebrow:'DLC · PRESSION',copy:window.IGR_LOCALE==='en'?'Mexico · Puerto Ceniza, Sinaloa. Three linked cases against Los Salcedo: surveillance of the cell, pressure on justice and threats to loved ones.':'Mexique · Puerto Ceniza, Sinaloa. Trois dossiers liés face à Los Salcedo : surveillance de la cellule, justice sous pression, menace contre les proches.',ids:CARTEL_IDS,label:'CARTEL',tag:'PRESSION'});
    appendCollection(root,{collection:'regime',title:'LE RÉGIME',eyebrow:'DLC · APRÈS LA CHUTE',copy:'Deux dirigeants joués en cavale par scénario. Ils choisissent leur alliance ; la presse fictive suit la chute du régime. Capturer les deux est la première épreuve, identifier les donneurs d’ordre la seconde.',ids:REGIME_IDS,label:'LE RÉGIME',tag:'ARCHIVES'});
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


  // Premium rooms are host-licensed: guests never need their own entitlement.
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
      toast('Cellule introuvable, pleine ou déjà lancée.');
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
