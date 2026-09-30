/* Inside Grey Room — OMERTÀ v12.25 polish
   Dedicated art, cold-language pass, reliable lobby role selection,
   persistent Famiglia view. */
(() => {
  const OMERTA_IDS = new Set(['021','022','023','024','025']);
  const ART = {
    '021':'assets/omerta-021-l-enveloppe.webp?v=12.25',
    '022':'assets/omerta-022-omerta.webp?v=12.25',
    '023':'assets/omerta-023-la-table.webp?v=12.25',
    '024':'assets/omerta-024-il-pentito.webp?v=12.25',
    '025':'assets/omerta-025-il-don.webp?v=12.25'
  };
  const COPY = {
    '021':{
      short:'Une enveloppe disparaît. Parler peut réduire une peine. Parler peut aussi faire tuer.',
      context:'Une enveloppe issue des rackets disparaît avant d’atteindre Enzo Rinaldi. La police possède déjà des faits impossibles à effacer. Reste une question : qui parlera pour sauver des années de prison — et qui le saura ?',
      mood:'Rue · racket · dette · loyauté.',
      mechanics:['Peine','Omertà','Sanction']
    },
    '022':{
      short:'Un homme est mort. Plusieurs savent pourquoi. Personne ne veut être le premier à parler.',
      context:'Un meurtre interne fissure la Famiglia Verri. Chacun détient une partie de la vérité. Chacun a une raison de se taire. Ici, une phrase peut faire tomber un homme — ou désigner celui qui l’a prononcée.',
      mood:'Meurtre · silence · omertà.',
      mechanics:['Silence','Mensonge','Loyauté']
    },
    '023':{
      short:'Sept sièges. Six hommes. Une chaise vide. Une guerre peut commencer autour de cette table.',
      context:'Une réunion doit empêcher une guerre entre organisations. Un siège reste vide. Les joueurs négocient pouvoir, territoire et succession. Puis un appel change la pièce : Adriano Verri a été touché.',
      mood:'Commission · pouvoir · guerre interne.',
      mechanics:['Négociation','Succession','Attaque']
    },
    '024':{
      short:'Il peut acheter des années de liberté avec quelques phrases. La Famiglia cherche déjà la source.',
      context:'Un membre arrêté risque des décennies de prison. Il peut réduire sa peine, demander une protection et livrer des noms. Plus il parle, plus la justice l’aide. Plus il parle, plus la Famiglia se rapproche.',
      mood:'Interrogatoire · coopération · chasse à l’homme.',
      mechanics:['Peine','Protection','Chasse à l’homme']
    },
    '025':{
      short:'Vittorio Verri parle enfin. Il reste à savoir quels morts portent réellement son ordre.',
      context:'Vittorio Verri accepte enfin de parler. Quatre dossiers ont laissé des morts, des dettes et des trahisons. Le dernier dossier ne demande pas s’il dirige la Famiglia. Il demande ce qu’il a réellement ordonné — et ce que ses hommes ont fait en son nom.',
      mood:'Le Don · ordres · exécutions · conséquences.',
      mechanics:['Audiences','Ordres','Conséquences']
    }
  };

  function isOmerta(id){ return OMERTA_IDS.has(String(id||'')); }

  for(const id of OMERTA_IDS){
    const sc = typeof scenario === 'function' ? scenario(id) : null;
    if(sc && COPY[id]) Object.assign(sc,COPY[id]);
  }

  if(typeof ROLE_INFO !== 'undefined') Object.assign(ROLE_INFO,{
    associato:{label:'Associato',win:'Reste utile sans devenir sacrifiable.',body:'Tu n’es pas initié. Tu peux parler, mentir ou rester loyal. Chaque mot peut te coûter.'},
    uomo_onore:{label:'Uomo d’Onore',win:'Tiens l’omertà.',body:'Tu peux dire vrai. Une vérité de trop suffit.'},
    contabile:{label:'Contabile',win:'Fais parler les comptes sans te désigner.',body:'Les chiffres ne mentent pas. Celui qui les explique devient visible.'},
    pentito:{label:'Pentito',win:'Réduis ta peine. Obtiens une protection. Survis.',body:'Parle pour gagner des années. Parle trop et tu deviens une cible.'},
    caporegime:{label:'Caporegime',win:'Trouve celui qui parle sans tuer un loyal.',body:'Interroge d’abord. Surveille ensuite. Une sanction aveugle te condamne.'},
    consigliere:{label:'Consigliere',win:'Protège le sommet sans frapper à l’aveugle.',body:'Lis les silences. Sépare la fuite, la peur et la manipulation.'},
    sottocapo:{label:'Sottocapo',win:'Garde la Famiglia debout.',body:'Le Don ne voit pas tout. Une mauvaise décision peut ouvrir une guerre.'},
    don:{label:'Don',win:'Découvre qui reste loyal et ce qui a été fait en ton nom.',body:'Tu donnes peu d’ordres. Tes hommes comprennent le reste.'}
  });

  const prevThumb = scenarioThumbArt;
  const prevArt = scenarioArt;
  scenarioThumbArt = function(id){ return isOmerta(id) ? ART[String(id)] : prevThumb(id); };
  scenarioArt = function(id){ return isOmerta(id) ? ART[String(id)] : prevArt(id); };

  // Use the compatibility RPC fixed server-side. Old clients and the random button now share one path.
  const prevChooseRole = chooseLobbyRole;
  chooseLobbyRole = async function(role){
    const sid=STATE.sync?.room?.scenario_id||STATE.scenarioId;
    if(!isOmerta(sid)) return prevChooseRole(role);
    try{
      await rpc('igr_v4_choose_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role});
      await syncNow(true);
      if(STATE.sync) renderLobby(STATE.sync);
      toast(role ? `Rôle choisi : ${publicRoleLabel(role)}` : 'Choix retiré.');
    }catch(e){
      console.error('OMERTA role choice',e);
      toast(/taken/i.test(e?.message||'')?'Ce rôle vient d’être pris.':'Ce rôle n’est pas disponible.');
    }
  };

  const prevRandomRole = chooseRandomLobbyRole;
  chooseRandomLobbyRole = async function(){
    const d=STATE.sync, sid=d?.room?.scenario_id;
    if(!d||!isOmerta(sid)) return prevRandomRole();
    const sc=scenario(sid), me={...(d.players||[]).find(p=>p.id===d.player?.id),...d.player};
    const choices=roleChoiceSummary(sc,d.players.length,d.players);
    const available=choices.filter(x=>x.taken<x.cap||me.preferred_role===x.id).map(x=>x.id);
    if(!available.length)return toast('Aucun rôle disponible.');
    const role=available[secureRandomIndex(available.length)];
    await chooseLobbyRole(role);
  };

  function campaignState(){
    return STATE.sync?.room?.state?.omerta_campaign || null;
  }
  function statusLabel(v){
    if(v==='mort')return 'MORT'; if(v==='protégé')return 'PROTÉGÉ'; return 'ACTIF';
  }
  function familyRows(){
    const c=campaignState();
    const tree=Array.isArray(c?.family_tree)?c.family_tree:[];
    const statuses=c?.character_status||{};
    if(!tree.length)return '<div class="empty-state">L’arbre apparaîtra avec la campagne.</div>';
    const depth=id=>{let n=tree.find(x=>x.id===id),d=0,guard=0;while(n?.parent&&guard++<5){d++;n=tree.find(x=>x.id===n.parent)}return d};
    return tree.map(n=>{
      const st=statuses[n.name]||'actif';
      return `<div class="omerta-tree-row status-${h(st)}" style="--depth:${depth(n.id)}"><span class="omerta-tree-line"></span><div><b>${h(n.name)}</b><small>${h(n.rank)}${n.blood?' · SANG':''}</small></div><em>${h(statusLabel(st))}</em></div>`;
    }).join('');
  }
  function dossierProgress(){
    const c=campaignState(),done=c?.dossiers||{};
    return ['021','022','023','024','025'].map(id=>`<span class="${done[id]?'done':''}">${id}</span>`).join('');
  }
  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();
    const c=campaignState();
    const modal=document.createElement('div'); modal.className='modal omerta-tree-modal';
    modal.innerHTML=`<div class="modal-box omerta-tree-box"><div class="omerta-eyebrow">OMERTÀ · DOSSIER DE FAMILLE</div><div class="omerta-tree-head"><div><h2>Arbre de la Famiglia</h2><p>Le sang, le rang et les conséquences ne sont pas la même chose.</p></div><div class="omerta-dossier-progress">${dossierProgress()}</div></div><div class="omerta-tree-list">${familyRows()}</div><div class="omerta-tree-current"><span>PROCHAIN DOSSIER</span><b>${h(c?.current_dossier||STATE.sync?.room?.scenario_id||'021')}</b></div><div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
  };

  const prevPrivateCard = privateCardHtml;
  privateCardHtml=function(){
    let html=prevPrivateCard();
    if(!isOmerta(STATE.sync?.room?.scenario_id))return html;
    return html+`<button class="btn ghost block omerta-tree-open" onclick="igrOmertaOpenFamilyTree()">Arbre de la Famiglia <span>Voir les liens et les conséquences</span></button>`;
  };

  const prevRenderLobby = renderLobby;
  renderLobby=function(prefetched){
    prevRenderLobby(prefetched);
    const d=prefetched||STATE.sync;
    if(!isOmerta(d?.room?.scenario_id))return;
    const zone=document.querySelector('.role-choice-zone');
    if(zone&&!zone.querySelector('.omerta-tree-open')){
      const b=document.createElement('button'); b.className='btn ghost block omerta-tree-open'; b.onclick=window.igrOmertaOpenFamilyTree;
      b.innerHTML='Arbre de la Famiglia <span>Campagne persistante</span>';
      zone.insertBefore(b,zone.querySelector('.role-choice-grid'));
    }
  };
})();