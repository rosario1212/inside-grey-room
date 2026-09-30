/* Inside Grey Room — DLC suite v12.35
   Central scenario metadata + CARTEL 029–031 + LE RÉGIME 032–034 + iPhone filters. */
(() => {
  'use strict';
  const CARTEL_IDS=new Set(['029','030','031']);
  const REGIME_IDS=new Set(['032','033','034']);
  const FILTER_KEY='igr_scenario_filter_v1235';
  const DLC_FILTER_KEY='igr_dlc_filter_v1235';

  const CARTEL=[
    {id:'029',title:'LE CYCLE MORT',short:'L’enquête touche un réseau qui ne se contente plus de cacher ses crimes : il commence à frapper ceux qui posent les questions.',context:'Une série d’exécutions liées au même réseau mène la Grey Room vers une organisation capable d’agir pendant l’enquête elle-même. L’Enquêteur devient momentanément indisponible après une attaque indirecte et l’Analyste doit maintenir le dossier sans transformer l’urgence en preuve.',mood:'Pression · représailles · enquête attaquée.',min:5,max:8,sound:'betrayal',mechanics:['Pression extérieure','Relais de l’Analyste','Coopérations risquées']},
    {id:'030',title:'LA COUR ACHETÉE',short:'Les preuves existent. Le problème est de savoir ce qu’elles valent encore quand ceux qui doivent les porter ont eux-mêmes un prix.',context:'L’enquête découvre qu’une partie du système judiciaire a été achetée, intimidée ou compromise. Les joueurs doivent distinguer corruption réelle, soupçon instrumentalisé et décision encore défendable, tandis que Procureur et Juge deviennent des points de pression.',mood:'Corruption · justice · loyautés achetées.',min:7,max:9,sound:'court',mechanics:['Justice sous pression','Avocat puissant','Confiance fragmentée']},
    {id:'031',title:'LA DETTE',short:'Cette fois, le réseau ne menace plus le dossier. Il entre dans la vie de ceux qui le mènent.',context:'Un proche d’un acteur central de l’enquête disparaît. Le réseau cherche à transformer une décision judiciaire en dette personnelle. Les suspects ne sont pas tous loyaux au cartel : certains coopèrent, d’autres utilisent la peur, et l’un d’eux est responsable d’actes que même ses alliés ne veulent plus couvrir.',mood:'Dette · enlèvement · pression intime.',min:6,max:8,sound:'pulse',mechanics:['Pression personnelle','Coopération','Responsabilité interne']}
  ];

  const REGIME=[
    {id:'032',title:'LES ARCHIVES DU PALAIS',short:'Un régime est tombé. Les archives restent. Chacun affirme n’avoir été qu’un rouage.',context:'Après la chute d’un régime fictif, des archives fragmentaires documentent arrestations arbitraires, disparitions et ordres contradictoires. Les suspects peuvent livrer un autre responsable pour réduire leur propre exposition, mais chaque accusation doit être confrontée aux documents.',mood:'Archives · chute du pouvoir · responsabilité.',min:6,max:8,sound:'intelligence',mechanics:['Délation intéressée','Archives','Chaîne de responsabilité']},
    {id:'033',title:'LA DYNASTIE',short:'Le gouvernement a disparu. La famille qui l’entourait prétend que personne ne décidait vraiment.',context:'Une famille oligarchique a occupé les postes clés d’un ancien gouvernement. Les titres officiels ne correspondent pas toujours au pouvoir réel. L’enquête reconstruit qui décidait, qui exécutait et qui profitait du système, sans confondre parenté et culpabilité.',mood:'Famille d’État · pouvoir réel · succession.',min:6,max:8,sound:'estate',mechanics:['Arbre de pouvoir','Oligarchie','Responsabilités distinctes']},
    {id:'034',title:'LES NOMS QU’ILS PORTAIENT',short:'Dans les dossiers, ils avaient des fonctions. Dans les couloirs, ils avaient des surnoms. Les deux cartes ne coïncident pas.',context:'Les derniers dossiers du régime révèlent des surnoms rares utilisés pour désigner des acteurs dont l’influence variait selon les opérations. Les joueurs doivent reconstruire la place réelle de chacun à partir de décisions, témoignages et conséquences, pas à partir d’un titre spectaculaire.',mood:'Surnoms · guerre · hiérarchie opaque.',min:7,max:9,sound:'war',mechanics:['Identités de pouvoir','Délation','Reconstruction de chaîne']}
  ];

  for(const sc of [...CARTEL,...REGIME])if(!SCENARIOS.some(x=>x.id===sc.id))SCENARIOS.push(sc);
  Object.assign(SCENARIO_ROLES,{
    '029':{required:['Enquêteur','Analyste','3 suspects'],optional:['Avocat','Procureur','Témoin']},
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
  SCENARIOS.forEach(sc=>Object.assign(sc,META[sc.id]||{}));

  const thumbFallback={'029':'017','030':'019','031':'016','032':'014','033':'007','034':'011'};
  const oldThumb=scenarioThumbArt,oldArt=scenarioArt;
  scenarioThumbArt=function(id){const key=String(id||'');return (CARTEL_IDS.has(key)||REGIME_IDS.has(key))?oldThumb(thumbFallback[key]):oldThumb(id)};
  scenarioArt=function(id){const key=String(id||'');return (CARTEL_IDS.has(key)||REGIME_IDS.has(key))?oldArt(thumbFallback[key]):oldArt(id)};

  function card(sc,collection,label,tag){
    return `<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact ${collection}-scenario" data-igr-scenario-id="${sc.id}" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">${label} · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag ${collection}-tag">${tag}</span></div></div></article>`;
  }

  function appendCollection(root,{collection,title,eyebrow,copy,ids,label,tag}){
    root.querySelector(`.${collection}-dlc-section`)?.remove();
    for(const id of ids)document.getElementById(`scenario-${id}`)?.remove();
    const section=document.createElement('section');section.className=`panel ${collection}-dlc-section`;section.dataset.collection=collection;
    const scenarios=[...ids].map(id=>scenario(id));
    section.innerHTML=`<div class="dlc-suite-head"><div><span class="dlc-suite-eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy}</p></div></div><div class="scenario-list scenario-list-v10-13 ${collection}-list">${scenarios.map(sc=>card(sc,collection,label,tag)).join('')}</div>`;
    root.appendChild(section);
  }

  function markExistingCards(root){
    root.querySelectorAll('[id^="scenario-"]').forEach(el=>{
      const id=el.id.replace('scenario-','');if(META[id])el.dataset.igrScenarioId=id;
    });
    root.querySelector('.omerta-dlc-section')?.setAttribute('data-collection','omerta');
    root.querySelector('.terror-dlc-section')?.setAttribute('data-collection','terror');
  }

  function readFilter(){
    try{return sessionStorage.getItem(FILTER_KEY)||'all'}catch{return'all'}
  }
  function readDlcFilter(){
    try{return sessionStorage.getItem(DLC_FILTER_KEY)||'all'}catch{return'all'}
  }
  function storeFilter(key,value){try{sessionStorage.setItem(key,value)}catch{}}

  function filterButton(value,label,current,kind='primary'){
    return `<button type="button" class="igr-filter-chip ${current===value?'active':''}" data-filter-kind="${kind}" data-filter="${value}" aria-pressed="${current===value?'true':'false'}">${label}</button>`;
  }

  function ensureFilters(root){
    let nav=root.querySelector('.igr-scenario-filters');
    if(!nav){nav=document.createElement('nav');nav.className='igr-scenario-filters';nav.setAttribute('aria-label','Filtrer les scénarios');root.insertBefore(nav,root.querySelector('.panel')||root.firstChild)}
    const primary=readFilter(),secondary=readDlcFilter();
    nav.innerHTML=`<div class="igr-filter-row" role="group" aria-label="Catégories">${[
      ['all','TOUS'],['base','BASE 001–020'],['original','001–008'],['second','009–020'],['dlc','DLC']
    ].map(([v,l])=>filterButton(v,l,primary)).join('')}</div><div class="igr-filter-row igr-filter-row-secondary ${primary==='dlc'?'':'is-hidden'}" role="group" aria-label="DLC">${[
      ['all','TOUS LES DLC'],['omerta','OMERTÀ'],['terror','TERREUR'],['cartel','CARTEL'],['regime','LE RÉGIME']
    ].map(([v,l])=>filterButton(v,l,secondary,'dlc')).join('')}</div>`;
    nav.onclick=e=>{
      const b=e.target.closest('.igr-filter-chip');if(!b)return;
      if(b.dataset.filterKind==='dlc')storeFilter(DLC_FILTER_KEY,b.dataset.filter);else storeFilter(FILTER_KEY,b.dataset.filter);
      ensureFilters(root);applyFilters(root);
    };
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
    root.querySelectorAll('[data-collection]').forEach(section=>{
      const cards=[...section.querySelectorAll('[data-igr-scenario-id]')];
      if(cards.length)section.style.display=cards.some(x=>x.style.display!=='none')?'':'none';
      else if(readFilter()==='dlc'&&readDlcFilter()!=='all')section.style.display=section.dataset.collection===readDlcFilter()?'':'none';
      else section.style.display='';
    });
  }

  function decorateCreateList(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    appendCollection(root,{collection:'cartel',title:'CARTEL',eyebrow:'DLC · PRESSION',copy:'3 dossiers liés : le réseau attaque d’abord l’enquête, puis le système, puis la vie privée.',ids:CARTEL_IDS,label:'CARTEL',tag:'PRESSION'});
    appendCollection(root,{collection:'regime',title:'LE RÉGIME',eyebrow:'DLC · APRÈS LA CHUTE',copy:'3 dossiers sur crimes d’État, délation intéressée, oligarchie familiale et reconstruction du pouvoir réel.',ids:REGIME_IDS,label:'LE RÉGIME',tag:'ARCHIVES'});
    markExistingCards(root);ensureFilters(root);applyFilters(root);
  }

  const oldRenderCreateList=renderCreateList;
  renderCreateList=function(){const out=oldRenderCreateList();decorateCreateList();return out};

  const observer=new MutationObserver(()=>{
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    if(!root.querySelector('.cartel-dlc-section')||!root.querySelector('.regime-dlc-section'))return;
    markExistingCards(root);applyFilters(root);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>{if(STATE?.view==='create-list')decorateCreateList()},0);
})();
