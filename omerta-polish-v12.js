/* Inside Grey Room — OMERTÀ v12.27 polish
   Reliable DLC art, cold-language pass, direct role selection,
   a visual Famiglia tree and one prominent random-role control. */
(() => {
  const OMERTA_IDS = new Set(['021','022','023','024','025']);
  const ART = {
    '021':'assets/omerta-021-l-enveloppe.webp?v=12.27',
    '022':'assets/omerta-022-omerta.webp?v=12.27',
    '023':'assets/omerta-023-la-table.webp?v=12.27',
    '024':'assets/omerta-024-il-pentito.webp?v=12.27',
    '025':'assets/omerta-025-il-don.webp?v=12.27'
  };
  // Scenario titles, previews and cinematic copy belong exclusively to
  // the Santoro canonical SCENARIO_DATA in omerta-v12.js. Never override
  // them with historical Verri-era COPY from this optional UI polish layer.
  const ROLE_COPY = {
    associato:{label:'Associato',win:'Reste utile. Reste vivant.',body:'Tu n’es pas initié. Tu peux parler, mentir ou rester loyal. Chaque mot peut te coûter.'},
    uomo_onore:{label:'Uomo d’Onore',win:'Tiens l’omertà.',body:'Tu peux dire vrai. Une vérité de trop suffit.'},
    contabile:{label:'Contabile',win:'Fais parler les comptes sans te désigner.',body:'Les chiffres sont des preuves. Celui qui les explique devient visible.'},
    pentito:{label:'Pentito',win:'Réduis ta peine. Obtiens une protection. Survis.',body:'Parle pour gagner des années. Parle trop et tu deviens une cible.'},
    caporegime:{label:'Caporegime',win:'Trouve celui qui parle. Ne tue pas un loyal.',body:'Interroge. Surveille. Puis décide. Une sanction aveugle te condamne.'},
    consigliere:{label:'Consigliere',win:'Protège le sommet sans frapper à l’aveugle.',body:'Lis les silences. Distingue la peur, le mensonge et la trahison.'},
    sottocapo:{label:'Sottocapo',win:'Garde la Famiglia debout.',body:'Le Don ne voit pas tout. Une mauvaise décision peut ouvrir une guerre.'},
    don:{label:'Don',win:'Découvre qui reste loyal et ce qui a été fait en ton nom.',body:'Tu donnes peu d’ordres. Tes hommes comprennent le reste.'}
  };

  function isOmerta(id){ return OMERTA_IDS.has(String(id||'')); }
  function currentScenario(){
    return document.querySelector('.lobby-v11[data-igr-scenario-id]')?.dataset.igrScenarioId
      || (STATE.view==='create-confirm'?STATE.selectedScenario:null)
      || STATE.sync?.room?.scenario_id || STATE.selectedScenario || STATE.scenarioId || '';
  }
  // Public rank topology only: do not expose private A/B/C actors, kinship,
  // evidence or the clandestine role while the room is in the lobby.
  window.igrOmertaPublicFamilyTree=function(scenarioId){
    const sid=String(scenarioId||currentScenario());
    if(!isOmerta(sid))return [];
    return [
      {id:'famiglia',name:'Famiglia Santoro',rank:'Direction · le Don',structural:true},
      {id:'consigliere',parent:'famiglia',name:'Consigliere',rank:'Conseil',structural:true},
      {id:'sottocapo',parent:'famiglia',name:'Sottocapo',rank:'Coordination',structural:true},
      {id:'contabile',parent:'famiglia',name:'Contabile',rank:'Comptabilité',structural:true},
      {id:'caporegime',parent:'sottocapo',name:'Caporegime',rank:'Équipes',structural:true},
      {id:'uomini',parent:'caporegime',name:'Uomini d’Onore',rank:'Membres initiés',structural:true},
      {id:'associati',parent:'uomini',name:'Associati',rank:'Contacts',structural:true}
    ];
  };
  // No scenario copy mutation: one canonical public text per Santoro dossier.
  try{Object.assign(ROLE_INFO,ROLE_COPY)}catch(_){}

  const prevThumb=scenarioThumbArt,prevArt=scenarioArt;
  scenarioThumbArt=function(id){return isOmerta(id)?ART[String(id)]:prevThumb(id)};
  scenarioArt=function(id){return isOmerta(id)?ART[String(id)]:prevArt(id)};

  const prevChooseRole=chooseLobbyRole;
  function patchLocalRole(role){
    const d=STATE.sync;if(!d)return;const id=d.player?.id||STATE.playerId;
    if(d.player)d.player.preferred_role=role||null;
    const me=(d.players||[]).find(p=>String(p.id)===String(id));if(me)me.preferred_role=role||null;
  }
  chooseLobbyRole=async function(role){
    if(!isOmerta(currentScenario()))return prevChooseRole(role);
    try{
      const out=await rpc('igr_omerta_choose_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role||''});
      patchLocalRole(out?.role||null);if(STATE.sync)renderLobby(STATE.sync);await syncNow(true);if(STATE.sync)renderLobby(STATE.sync);
      toast(out?.role?`Rôle choisi : ${publicRoleLabel(out.role)}`:'Choix retiré.');
    }catch(e){console.error('OMERTA role choice',e);toast(/taken/i.test(e?.message||'')?'Ce rôle vient d’être pris.':'Ce rôle n’est pas disponible.');}
  };

  const prevRandomRole=chooseRandomLobbyRole;
  chooseRandomLobbyRole=async function(){
    const d=STATE.sync,sid=d?.room?.scenario_id;if(!d||!isOmerta(sid))return prevRandomRole();
    const sc=scenario(sid),me={...(d.players||[]).find(p=>p.id===d.player?.id),...d.player};
    const available=roleChoiceSummary(sc,d.players.length,d.players).filter(x=>x.taken<x.cap||me.preferred_role===x.id).map(x=>x.id);
    if(!available.length)return toast('Aucun rôle disponible.');
    await chooseLobbyRole(available[secureRandomIndex(available.length)]);
  };

  function campaignState(){return STATE.sync?.room?.state?.omerta_campaign||null}
  function statusLabel(v){if(v==='mort')return'MORT';if(v==='protégé')return'PROTÉGÉ';return'ACTIF'}
  function dossierProgress(){const c=campaignState(),done=c?.dossiers||{};return['021','022','023','024','025'].map(id=>`<span class="${done[id]?'done':''}">${id}</span>`).join('')}
  function familyNode(n,statuses,children){
    const st=statuses[n.name]||'actif';
    const blood=n.blood&&!String(n.rank||'').toUpperCase().includes('SANG')?' · SANG':'';
    const kids=(children[n.id]||[]).map(x=>familyNode(x,statuses,children)).join('');
    return `<li><div class="omerta-family-node status-${h(n.structural?'structure':st)}"><b>${h(n.name)}</b><small>${h(n.rank)}${blood}</small><em>${n.structural?'RANG PUBLIC':h(statusLabel(st))}</em></div>${kids?`<ul>${kids}</ul>`:''}</li>`;
  }
  function familyTreeHtml(){
    const id=currentScenario(),c=campaignState(),
      tree=isOmerta(id)?window.igrOmertaPublicFamilyTree(id)
       :(Array.isArray(c?.family_tree)?c.family_tree:[]),
      statuses=isOmerta(id)?{}:c?.character_status||{};
    if(!tree.length)return'<div class="empty-state">Aucune structure publique disponible pour ce dossier.</div>';
    const children={};for(const n of tree){const key=n.parent||'__root__';(children[key]||(children[key]=[])).push(n)}
    const roots=children.__root__||tree.filter(n=>!n.parent);
    return `<div class="omerta-org-scroll"><div class="omerta-org-tree"><ul class="omerta-org-root">${roots.map(n=>familyNode(n,statuses,children)).join('')}</ul></div></div>${isOmerta(id)?'<p class="omerta-tree-public-note">Hiérarchie publique indicative : aucun personnage, lien de sang ou rôle secret n’est révélé avant la partie.</p>':'<div class="omerta-tree-legend"><span><i class="active"></i>Actif</span><span><i class="protected"></i>Protégé</span><span><i class="dead"></i>Mort</span></div>'}`;
  }
  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();const c=campaignState(),modal=document.createElement('div');modal.className='modal omerta-tree-modal';
    modal.innerHTML=`<div class="modal-box omerta-tree-box"><div class="omerta-eyebrow">OMERTÀ · DOSSIER DE FAMILLE</div><div class="omerta-tree-head"><div><h2>Arbre de la Famiglia</h2><p>Le sang, le rang et les conséquences ne sont pas la même chose.</p></div><div class="omerta-dossier-progress">${dossierProgress()}</div></div>${familyTreeHtml()}<div class="omerta-tree-current"><span>DOSSIER SÉLECTIONNÉ</span><b>${h(currentScenario()||'—')}</b></div><div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
    queueMicrotask(()=>{const s=modal.querySelector('.omerta-org-scroll');if(s)s.scrollLeft=Math.max(0,(s.scrollWidth-s.clientWidth)/2)});
  };

  function markLegacyRandom(zone,omerta){
    zone.querySelectorAll('button,a').forEach(el=>{
      if(el.classList.contains('igr-random-role-cta')||el.classList.contains('omerta-tree-open')||el.closest('.omerta-role-status'))return;
      const t=(el.textContent||'').trim().toLowerCase();
      if(t.includes('choisir au hasard')||t.includes('changer au hasard')||t==='au hasard'||t.includes('choose at random')||t.includes('change at random'))el.classList.add('igr-legacy-random');
      if(omerta&&t.includes('retirer mon choix'))el.classList.add('omerta-legacy-clear');
    });
  }
  function decorateLobby(){
    const d=STATE.sync,zone=document.querySelector('.role-choice-zone');if(!d||!zone)return;
    const omerta=isOmerta(d?.room?.scenario_id),grid=zone.querySelector('.role-choice-grid');
    zone.querySelectorAll('.igr-random-role-cta,.omerta-role-status,.omerta-tree-open').forEach(x=>x.remove());
    if(omerta){
      const me={...(d.players||[]).find(p=>String(p.id)===String(d.player?.id)),...d.player};
      const tree=document.createElement('button');tree.type='button';tree.className='btn ghost block omerta-tree-open';tree.onclick=window.igrOmertaOpenFamilyTree;tree.innerHTML='Arbre de la Famiglia <span>Liens et conséquences</span>';if(grid)zone.insertBefore(tree,grid);
      const status=document.createElement('div');status.className='omerta-role-status '+(me.preferred_role?'has-role':'');status.innerHTML=me.preferred_role?`<span>TON CHOIX</span><strong>${h(publicRoleLabel(me.preferred_role))}</strong><button type="button" onclick="chooseLobbyRole('')">Retirer</button>`:'<span>TON CHOIX</span><strong>Aucun rôle choisi</strong><small>Un rôle sera attribué au lancement.</small>';if(grid)zone.insertBefore(status,grid);
    }
    const random=document.createElement('button');random.type='button';random.className='igr-random-role-cta';random.onclick=()=>chooseRandomLobbyRole();random.innerHTML='<span><b>RÔLE AU HASARD</b><small>Tirage uniforme parmi les rôles encore disponibles.</small></span><em>TIRER</em>';if(grid)zone.insertBefore(random,grid);
    markLegacyRandom(zone,omerta);
  }

  const prevPrivateCard=privateCardHtml;
  privateCardHtml=function(){
    let html=prevPrivateCard();if(!isOmerta(STATE.sync?.room?.scenario_id))return html;
    const card=STATE.sync?.player?.private_state||{},facts=Array.isArray(card.fixed_facts)?card.fixed_facts:[],sentence=Number(card.base_sentence||0);
    if(facts.length||sentence){html+=`<section class="omerta-objective-card omerta-fixed-facts"><span>CONSÉQUENCES FIXES</span>${sentence?`<div><small>PEINE DE DÉPART</small><strong>${sentence} ans</strong></div>`:''}${facts.length?`<details><summary>Faits irréversibles</summary><ul>${facts.map(x=>`<li>${h(x)}</li>`).join('')}</ul></details>`:''}</section>`;}
    return html+`<button class="btn ghost block omerta-tree-open" onclick="igrOmertaOpenFamilyTree()">Arbre de la Famiglia <span>Voir les liens et les conséquences</span></button>`;
  };

  const prevRenderLobby=renderLobby;
  renderLobby=function(prefetched){const out=prevRenderLobby(prefetched);queueMicrotask(decorateLobby);requestAnimationFrame(decorateLobby);setTimeout(decorateLobby,80);return out};
  setTimeout(()=>{try{if(STATE.view==='lobby')decorateLobby()}catch(_){}},0);
})();