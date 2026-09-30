/* Inside Grey Room — TERREUR DLC 026–028
   Fictional counter-terror thriller. Threat, perimeter and military consequences stay abstract. */
(() => {
  const IDS = new Set(['026','027','028']);
  const SCENARIO_DATA = [
    {id:'026',title:'LA VILLE TOMBE',short:'La ville perd ses secteurs un à un. Trois prisonniers sont interrogés pendant qu’une structure extérieure continue d’avancer vers la Grey Room.',context:'Trois membres présumés d’une organisation terroriste fictive sont capturés alors que la ville commence à tomber. L’enquête porte sur des atrocités déjà commises, puis découvre qu’une structure extérieure reste active et que le périmètre de la Grey Room se dégrade pendant l’interrogatoire.',mood:'Ville assiégée, informations coupées, menace qui se rapproche.',min:6,max:7,sound:'war',mechanics:['PÉRIMÈTRE dynamique','Agent de renseignement','Menace extérieure simultanée']},
    {id:'027',title:'LA ZONE ROUGE',short:'Une zone contestée pourrait abriter le commandement ennemi. Des civils y sont encore possibles. Après le verdict, une décision militaire irréversible devra être prise.',context:'Après plusieurs massacres, l’organisation contrôle une partie de la ville. Trois suspects donnent des versions incompatibles sur la présence du commandement et des civils. Le verdict de l’Enquêteur servira ensuite de base à une décision militaire portée par l’Officier de liaison.',mood:'Cellule de crise, renseignement incomplet, responsabilité irréversible.',min:7,max:8,sound:'intelligence',mechanics:['Officier de liaison','Décision après verdict','Vérité instrumentalisée']},
    {id:'028',title:'DERNIER PÉRIMÈTRE',short:'Le bâtiment tient encore. La ville, beaucoup moins. Deux prisonniers veulent parler ; le troisième semble seulement attendre que le périmètre cède.',context:'Une grande partie de la ville échappe désormais aux autorités et les communications deviennent intermittentes. Une cellule intérieure est soupçonnée dans le périmètre protégé. Deux prisonniers comprennent que leur propre organisation les a abandonnés ; le troisième reste étrangement calme.',mood:'Dernière ligne, morts annoncées froidement, aucune sortie garantie.',min:6,max:8,sound:'pulse',mechanics:['PÉRIMÈTRE critique','Cellule intérieure','Coopération sous menace']}
  ];
  const ART_FALLBACK = {'026':'011','027':'013','028':'014'};

  function isTerror(id){ return IDS.has(String(id||'')); }
  function activeScenarioId(){ return String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || STATE?.selectedScenario || ''); }

  for(const sc of SCENARIO_DATA) if(!SCENARIOS.some(x=>x.id===sc.id)) SCENARIOS.push(sc);
  Object.assign(SCENARIO_ROLES,{
    '026':{required:['Enquêteur','Analyste','Agent de renseignement','3 suspects'],optional:['Procureur']},
    '027':{required:['Enquêteur','Analyste','Procureur','Officier de liaison','3 suspects'],optional:['Agent de renseignement']},
    '028':{required:['Enquêteur','Analyste','Agent de renseignement','3 suspects'],optional:['Officier de liaison','Procureur']}
  });
  Object.assign(ROLE_LABEL_TO_ID,{
    'Officier de liaison':'inspecteur','officier de liaison':'inspecteur',
    'Agent de renseignement':'expert','agent de renseignement':'expert'
  });
  Object.assign(PUBLIC_LOBBY_SUMMARIES,{
    '026':'La ville perd ses secteurs pendant l’interrogatoire. Trois prisonniers possèdent chacun une partie de la structure encore active ; la Grey Room doit comprendre avant que son propre périmètre ne cède.',
    '027':'Une zone contrôlée par l’organisation pourrait contenir son commandement, mais aussi des civils et des détenus. Après le verdict, l’Officier de liaison devra décider si l’intervention est autorisée, différée ou annulée.',
    '028':'Le dernier périmètre tient encore. Deux prisonniers veulent réellement coopérer parce que leur camp les a abandonnés ; le troisième semble accepter parfaitement l’idée de mourir avec la Grey Room.'
  });

  const baseScenarioThumbArt = scenarioThumbArt;
  const baseScenarioArt = scenarioArt;
  scenarioThumbArt = function(id){ return isTerror(id) ? baseScenarioThumbArt(ART_FALLBACK[id]||'011') : baseScenarioThumbArt(id); };
  scenarioArt = function(id){ return isTerror(id) ? baseScenarioArt(ART_FALLBACK[id]||'011') : baseScenarioArt(id); };

  const baseRoleChoiceSummary = roleChoiceSummary;
  roleChoiceSummary = function(sc,count,players){
    const rows = baseRoleChoiceSummary(sc,count,players);
    if(!isTerror(sc?.id)) return rows;
    return rows.map(row=>{
      if(row.id==='inspecteur') return {...row,info:{...row.info,label:'Officier de liaison',win:'Maintiens une lecture froide de la crise et porte les décisions extérieures sans transformer l’urgence en certitude.',body:'Tu relies la Grey Room à la cellule de crise. Tes actions restent informationnelles et procédurales.'}};
      if(row.id==='expert') return {...row,info:{...row.info,label:'Agent de renseignement',win:'Recoupe correctement les sources sans transformer une probabilité en preuve.',body:'Une analyse par cycle pour établir structure, crédibilité et liens — jamais une procédure d’attaque.'}};
      return row;
    });
  };

  try{
    if(typeof roleInfo==='function'){
      const baseRoleInfo=roleInfo;
      roleInfo=function(id){
        const info=baseRoleInfo(id), sid=activeScenarioId();
        if(!isTerror(sid))return info;
        if(id==='inspecteur')return {...info,label:'Officier de liaison',win:'Maintiens la liaison et prends les décisions extérieures sans confondre urgence et certitude.',body:'Interface avec la cellule de crise. Tu recueilles des confirmations, jamais des instructions tactiques.'};
        if(id==='expert')return {...info,label:'Agent de renseignement',win:'Recoupe les sources et la structure encore active.',body:'Tu établis des faits de réseau et des niveaux de confiance. Tu ne fournis aucune procédure opérationnelle.'};
        return info;
      };
    }
  }catch(e){ console.warn('TERREUR role labels',e); }

  function terrorScenarios(){ return SCENARIO_DATA.map(x=>scenario(x.id)); }
  function dlcCard(sc){
    return `<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact terror-scenario" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">TERREUR · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">${h(playerCountLabel(sc))}</span><span class="tag terror-tag">PÉRIMÈTRE ACTIF</span></div></div></article>`;
  }
  function decorateCreateList(){
    const root=document.querySelector('.page-create-v10-13'); if(!root)return;
    for(const id of IDS)document.getElementById(`scenario-${id}`)?.remove();
    root.querySelector('.terror-dlc-section')?.remove();
    const section=document.createElement('section');section.className='panel terror-dlc-section';
    section.innerHTML=`<div class="terror-head"><div><span class="terror-eyebrow">DOSSIERS DE CRISE</span><h2>TERREUR</h2><p>3 enquêtes indépendantes. Pendant que vous interrogez, la ville continue de tomber.</p></div><span class="terror-access-pill">PÉRIMÈTRE ACTIF</span></div><div class="scenario-list scenario-list-v10-13 terror-list">${terrorScenarios().map(dlcCard).join('')}</div><div class="terror-footer">Menace dynamique · morts et pertes signalées sans gore · décisions militaires abstraites</div>`;
    root.appendChild(section);
  }
  const baseRenderCreateList=renderCreateList;
  renderCreateList=function(){ baseRenderCreateList(); decorateCreateList(); };

  function perimeterData(){
    const d=STATE?.sync, sid=String(d?.room?.scenario_id||''); if(!isTerror(sid))return null;
    const fromServer=Number(d?.room?.state?.terror?.perimeter);
    const cycle=Math.max(0,Number(d?.room?.cycle||0));
    const fallback={'026':[82,66,43,21],'027':[88,74,56,38],'028':[64,44,25,12]}[sid]?.[Math.min(3,cycle)] ?? 100;
    const value=Number.isFinite(fromServer)?fromServer:fallback;
    const band=d?.room?.state?.terror?.band || (value<=20?'CRITIQUE':value<=45?'FRAGILE':value<=70?'CONTESTÉ':'SOUS CONTRÔLE');
    return {sid,value,band,cycle,state:d?.room?.state?.terror||{},role:d?.player?.public_role,status:d?.room?.status,phase:d?.room?.phase};
  }

  function decisionLabel(value){ return value==='intervene'?'AUTORISER LA FRAPPE':value==='delay'?'DIFFÉRER':'ANNULER'; }
  function militaryDecisionBlock(data){
    if(data.sid!=='027'||data.status!=='finished'||data.phase!=='reveal')return '';
    const choice=data.state?.military_decision, outcome=data.state?.military_outcome;
    if(choice&&outcome)return `<div class="terror-decision terror-decision--resolved"><small>DÉCISION MILITAIRE · ${h(decisionLabel(choice))}</small><p>${h(outcome)}</p></div>`;
    if(data.role!=='inspecteur')return `<div class="terror-decision"><small>DÉCISION MILITAIRE EN ATTENTE</small><p>L’Officier de liaison doit maintenant confronter le verdict de l’Enquêteur au risque civil.</p></div>`;
    return `<div class="terror-decision"><small>APRÈS LE VERDICT</small><b>Décision de l’Officier de liaison</b><p>Aucune option n’est présentée comme sûre. Le serveur confrontera ton choix à la précision réelle du verdict de l’Enquêteur.</p><div class="terror-decision-grid"><button class="btn terror-primary" onclick="igrTerrorMilitaryDecision('intervene')">Autoriser</button><button class="btn ghost" onclick="igrTerrorMilitaryDecision('delay')">Différer</button><button class="btn ghost" onclick="igrTerrorMilitaryDecision('cancel')">Annuler</button></div></div>`;
  }

  function ensureHud(){
    const data=perimeterData();
    document.querySelectorAll('.terror-perimeter-hud').forEach(el=>{if(!data)el.remove()});
    if(!data)return;
    const app=document.getElementById('app');if(!app)return;
    let hud=app.querySelector('.terror-perimeter-hud');
    if(!hud){hud=document.createElement('aside');hud.className='terror-perimeter-hud';app.prepend(hud);}
    const width=Math.max(4,Math.min(100,data.value));
    const html=`<div class="terror-perimeter-top"><span>TERREUR · PÉRIMÈTRE</span><b>${data.value}%</b></div><div class="terror-perimeter-track"><i style="width:${width}%"></i></div><div class="terror-perimeter-meta"><span>${h(data.band)}</span><span>Cycle ${data.cycle||0}/3</span></div>${militaryDecisionBlock(data)}`;
    const sig=[data.sid,data.value,data.band,data.cycle,data.status,data.phase,data.role,data.state?.military_decision||'',data.state?.military_outcome||''].join('|');
    if(hud.dataset.sig!==sig){hud.dataset.sig=sig;hud.innerHTML=html;}
  }

  window.igrTerrorMilitaryDecision=async decision=>{
    if(!['intervene','delay','cancel'].includes(decision))return;
    const words={intervene:'autoriser cette frappe',delay:'différer l’intervention',cancel:'annuler la frappe'};
    if(!confirm(`Décision irréversible : ${words[decision]} ?`))return;
    try{
      const out=await rpc('igr_terror_military_decision',{p_code:STATE.room,p_player_token:STATE.token,p_decision:decision});
      toast('Décision militaire enregistrée.');
      await syncNow(true);ensureHud();
      if(out?.outcome)setTimeout(()=>toast('Conséquences confirmées.'),350);
    }catch(e){console.error(e);toast('Cette décision n’est pas disponible ou a déjà été verrouillée.');}
  };

  const observer=new MutationObserver(()=>ensureHud());
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(()=>{if(STATE?.view==='create')decorateCreateList();ensureHud();},0);
})();
