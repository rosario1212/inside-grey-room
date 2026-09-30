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
  const COPY = {
    '021':{short:'Une enveloppe disparaît. Parler réduit une peine. Parler peut aussi faire tuer.',context:'Une enveloppe issue des rackets disparaît avant d’atteindre Enzo Rinaldi. Certains faits sont déjà prouvés. Il reste à savoir qui parlera pour sauver des années de prison — et qui le découvrira.',mood:'Rue · racket · dette · loyauté.',mechanics:['Peine','Omertà','Sanction']},
    '022':{short:'Un homme est mort. Plusieurs savent pourquoi. Personne ne veut être le premier à parler.',context:'Un meurtre interne fissure la Famiglia Verri. Chacun détient une partie de la vérité. Chacun a une raison de se taire. Une phrase peut faire tomber un homme — ou désigner celui qui l’a prononcée.',mood:'Meurtre · silence · omertà.',mechanics:['Silence','Mensonge','Loyauté']},
    '023':{short:'Sept sièges. Six hommes. Une chaise vide. Une guerre peut commencer autour de cette table.',context:'Une réunion doit empêcher une guerre. Un siège reste vide. Pouvoir, territoire et succession se négocient à voix basse. Puis un appel tombe : Adriano Verri a été touché.',mood:'Commission · pouvoir · guerre interne.',mechanics:['Négociation','Succession','Attaque']},
    '024':{short:'Il peut acheter des années de liberté avec quelques phrases. La Famiglia cherche déjà qui parle.',context:'Un membre arrêté risque des décennies de prison. Il peut réduire sa peine, livrer des noms et demander une protection. Plus il parle, plus la justice l’aide. Plus il parle, plus la Famiglia se rapproche.',mood:'Interrogatoire · coopération · chasse à l’homme.',mechanics:['Peine','Protection','Chasse à l’homme']},
    '025':{short:'Vittorio Verri parle enfin. Il reste à savoir quels morts portent réellement son ordre.',context:'Quatre dossiers ont laissé des morts, des dettes et des trahisons. Vittorio Verri accepte enfin de parler. La question n’est plus de savoir qui est le Don. Elle est de savoir ce qu’il a réellement ordonné — et ce que ses hommes ont fait en son nom.',mood:'Le Don · ordres · exécutions · conséquences.',mechanics:['Audiences','Ordres','Conséquences']}
  };
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
  function currentScenario(){ return STATE.sync?.room?.scenario_id || STATE.scenarioId || STATE.selectedScenario; }
  for(const id of OMERTA_IDS){ const sc=typeof scenario==='function'?scenario(id):null; if(sc&&COPY[id])Object.assign(sc,COPY[id]); }
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
    return `<li><div class="omerta-family-node status-${h(st)}"><b>${h(n.name)}</b><small>${h(n.rank)}${blood}</small><em>${h(statusLabel(st))}</em></div>${kids?`<ul>${kids}</ul>`:''}</li>`;
  }
  function familyTreeHtml(){
    const c=campaignState(),tree=Array.isArray(c?.family_tree)?c.family_tree:[],statuses=c?.character_status||{};
    if(!tree.length)return'<div class="empty-state">L’arbre apparaîtra avec la campagne.</div>';
    const children={};for(const n of tree){const key=n.parent||'__root__';(children[key]||(children[key]=[])).push(n)}
    const roots=children.__root__||tree.filter(n=>!n.parent);
    return `<div class="omerta-org-scroll"><div class="omerta-org-tree"><ul class="omerta-org-root">${roots.map(n=>familyNode(n,statuses,children)).join('')}</ul></div></div><div class="omerta-tree-legend"><span><i class="active"></i>Actif</span><span><i class="protected"></i>Protégé</span><span><i class="dead"></i>Mort</span></div>`;
  }
  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();const c=campaignState(),modal=document.createElement('div');modal.className='modal omerta-tree-modal';
    modal.innerHTML=`<div class="modal-box omerta-tree-box"><div class="omerta-eyebrow">OMERTÀ · DOSSIER DE FAMILLE</div><div class="omerta-tree-head"><div><h2>Arbre de la Famiglia</h2><p>Le sang, le rang et les conséquences ne sont pas la même chose.</p></div><div class="omerta-dossier-progress">${dossierProgress()}</div></div>${familyTreeHtml()}<div class="omerta-tree-current"><span>PROCHAIN DOSSIER</span><b>${h(c?.current_dossier||STATE.sync?.room?.scenario_id||'021')}</b></div><div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
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
    if(facts.length||sentence){const objective=card.omerta_objective||card.position||'Reste cohérent avec les faits. Chaque choix aura une conséquence.';html+=`<section class="omerta-objective-card"><span>OBJECTIF</span><b>${h(objective)}</b>${sentence?`<div><small>PEINE DE DÉPART</small><strong>${sentence} ans</strong></div>`:''}${facts.length?`<details><summary>Faits irréversibles</summary><ul>${facts.map(x=>`<li>${h(x)}</li>`).join('')}</ul></details>`:''}</section>`;}
    return html+`<button class="btn ghost block omerta-tree-open" onclick="igrOmertaOpenFamilyTree()">Arbre de la Famiglia <span>Voir les liens et les conséquences</span></button>`;
  };

  const prevRenderLobby=renderLobby;
  renderLobby=function(prefetched){const out=prevRenderLobby(prefetched);queueMicrotask(decorateLobby);requestAnimationFrame(decorateLobby);setTimeout(decorateLobby,80);return out};
  setTimeout(()=>{try{if(STATE.view==='lobby')decorateLobby()}catch(_){}},0);
})();