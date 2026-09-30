/* Inside Grey Room — TERREUR DLC 026–028 · v12.35
   Fictional crisis investigations. External violence stays narrative and non-operational. */
(() => {
  'use strict';
  const IDS=new Set(['026','027','028']);
  const DATA=[
    {id:'026',title:'LA VILLE TOMBE',short:'La ville perd ses secteurs un à un. Trois prisonniers sont interrogés pendant qu’une structure extérieure continue d’avancer vers la Grey Room.',context:'Trois membres présumés d’une organisation terroriste fictive sont capturés alors que la ville commence à tomber. L’enquête porte sur des atrocités déjà commises et sur une structure extérieure encore active. La pression monte, mais la vérité judiciaire reste distincte de l’urgence.',mood:'Ville assiégée · pression · renseignement incomplet.',min:6,max:7,sound:'war',mechanics:['Périmètre dynamique','Renseignement','Menace extérieure']},
    {id:'027',title:'LA ZONE ROUGE',short:'Une zone contestée pourrait abriter le commandement ennemi. Des civils y sont encore possibles. Le verdict pèsera sur une décision irréversible.',context:'Après plusieurs massacres, trois suspects donnent des versions incompatibles sur la présence du commandement et des civils dans une zone contestée. L’enquête doit distinguer faits, manipulation et coopération intéressée avant qu’une cellule de crise ne prenne une décision abstraite.',mood:'Cellule de crise · responsabilité · risque civil.',min:7,max:8,sound:'intelligence',mechanics:['Officier de liaison','Verdict sous pression','Vérité instrumentalisée']},
    {id:'028',title:'DERNIER PÉRIMÈTRE',short:'Le bâtiment tient encore. Deux prisonniers veulent parler ; le troisième semble seulement attendre que le périmètre cède.',context:'Une grande partie de la ville échappe aux autorités. Deux prisonniers comprennent que leur propre organisation les a abandonnés ; le troisième reste étrangement calme. L’enquête doit séparer coopération sincère, calcul et responsabilité avant que le dernier périmètre ne devienne symbolique.',mood:'Dernière ligne · abandon · coopération sous menace.',min:6,max:8,sound:'pulse',mechanics:['Périmètre critique','Cellule intérieure','Coopération']}
  ];
  const ART_FALLBACK={'026':'011','027':'013','028':'014'};
  const isTerror=id=>IDS.has(String(id||''));

  for(const sc of DATA)if(!SCENARIOS.some(x=>x.id===sc.id))SCENARIOS.push(sc);
  Object.assign(SCENARIO_ROLES,{
    '026':{required:['Enquêteur','Analyste','Expert','3 suspects'],optional:['Procureur']},
    '027':{required:['Enquêteur','Analyste','Procureur','Inspecteur','3 suspects'],optional:['Expert']},
    '028':{required:['Enquêteur','Analyste','Expert','3 suspects'],optional:['Inspecteur','Procureur']}
  });
  Object.assign(PUBLIC_LOBBY_SUMMARIES,{
    '026':'La ville perd ses secteurs pendant l’interrogatoire. Trois prisonniers possèdent chacun une partie de la structure encore active ; la Grey Room doit comprendre sans laisser la panique remplacer la preuve.',
    '027':'Une zone contestée pourrait contenir des cadres, des civils et des détenus. Une coopération très utile peut aussi servir une rivalité interne.',
    '028':'Le dernier périmètre tient encore. Deux prisonniers veulent réellement coopérer parce que leur camp les a abandonnés ; le troisième semble accepter l’effondrement.'
  });

  const oldThumb=scenarioThumbArt,oldArt=scenarioArt;
  scenarioThumbArt=function(id){return isTerror(id)?oldThumb(ART_FALLBACK[id]||'011'):oldThumb(id)};
  scenarioArt=function(id){return isTerror(id)?oldArt(ART_FALLBACK[id]||'011'):oldArt(id)};

  const oldRoleInfo=roleInfo;
  roleInfo=function(id){
    const info=oldRoleInfo(id),sid=String(STATE?.sync?.room?.scenario_id||STATE?.scenarioId||STATE?.selectedScenario||'');
    if(!isTerror(sid))return info;
    if(id==='inspecteur')return {...info,label:'Officier de liaison',body:'Tu relies la Grey Room à la cellule de crise. Tu portes des décisions extérieures abstraites sans transformer une hypothèse en certitude ni recevoir d’options tactiques.'};
    if(id==='expert')return {...info,label:'Agent de renseignement',body:'Tu recoupes des sources, des chronologies et des liens de structure. Tu produis des niveaux de confiance, jamais une procédure opérationnelle.'};
    return info;
  };

  function terrorCards(){return DATA.map(sc=>scenario(sc.id)).map(sc=>`<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact terror-scenario" data-igr-scenario-id="${sc.id}" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">TERREUR · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag terror-tag">PÉRIMÈTRE</span></div></div></article>`).join('')}
  function decorate(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    for(const id of IDS)document.getElementById(`scenario-${id}`)?.remove();
    root.querySelector('.terror-dlc-section')?.remove();
    const section=document.createElement('section');section.className='panel terror-dlc-section';section.dataset.collection='terror';
    section.innerHTML=`<div class="terror-head"><div><span class="terror-eyebrow">DOSSIERS DE CRISE</span><h2>TERREUR</h2><p>3 enquêtes indépendantes. La menace extérieure avance, mais le jeu reste centré sur les responsabilités, les récits et les conséquences humaines.</p></div><span class="terror-access-pill">PÉRIMÈTRE ACTIF</span></div><div class="scenario-list scenario-list-v10-13 terror-list">${terrorCards()}</div>`;
    root.appendChild(section);
  }
  const previousRenderCreateList=renderCreateList;
  renderCreateList=function(){previousRenderCreateList();decorate()};
})();
