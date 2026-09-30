/* Inside Grey Room — OMERTÀ v12.27 visual/runtime fixes
   Dedicated poster binding, visual Famiglia tree and one prominent random-role CTA. */
(()=>{
  const IDS=new Set(['021','022','023','024','025']);
  const ART={
    '021':'/assets/omerta-021-v1227.webp',
    '022':'/assets/omerta-022-v1227.webp',
    '023':'/assets/omerta-023-v1227.webp',
    '024':'/assets/omerta-024-v1227.webp',
    '025':'/assets/omerta-025-v1227.webp'
  };
  const isOmerta=id=>IDS.has(String(id||''));
  const locale=()=>window.IGR_LOCALE==='en'?'en':'fr';
  const esc=value=>typeof h==='function'?h(String(value??'')):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* Bind OMERTÀ to dedicated, versioned assets. Root-relative paths avoid
     nested-route resolution issues in installed PWAs and force a fresh asset URL. */
  try{
    const baseThumb=window.scenarioThumbArt||scenarioThumbArt;
    const baseArt=window.scenarioArt||scenarioArt;
    scenarioThumbArt=function(id){return isOmerta(id)?ART[String(id)]:baseThumb(id)};
    scenarioArt=function(id){return isOmerta(id)?ART[String(id)]:baseArt(id)};
  }catch(e){console.warn('OMERTA art binding',e)}

  function repairOmertaImages(root=document){
    for(const id of IDS){
      root.querySelectorAll?.(`#scenario-${id} img`).forEach(img=>{
        if(img.getAttribute('src')!==ART[id]){
          img.removeAttribute('srcset');
          img.src=ART[id];
        }
      });
    }
    const sid=String(STATE?.sync?.room?.scenario_id||STATE?.scenarioId||STATE?.selectedScenario||'');
    if(isOmerta(sid))root.querySelectorAll?.('.scenario-hero img,.scenario-hero-art img').forEach(img=>{
      if(img.getAttribute('src')!==ART[sid]){img.removeAttribute('srcset');img.src=ART[sid]}
    });
  }

  function randomCopy(){return locale()==='en'
    ?{title:'RANDOM ROLE',help:'Uniform draw among the roles still available.',action:'DRAW'}
    :{title:'RÔLE AU HASARD',help:'Tirage uniforme parmi les rôles encore disponibles.',action:'TIRER'};
  }

  function removeLegacyRoleLinks(zone){
    zone.querySelectorAll('.random-role-card,.omerta-random-role-cta,.igr-random-role-cta').forEach(el=>el.remove());
    const legacy=new Set([
      'choisir au hasard','changer au hasard','au hasard','retirer mon choix',
      'choose at random','change at random','random role','remove my choice'
    ]);
    zone.querySelectorAll('a,button').forEach(el=>{
      const text=(el.textContent||'').trim().toLocaleLowerCase('fr');
      if(legacy.has(text))el.remove();
    });
    zone.querySelectorAll('div,p,nav').forEach(el=>{
      if(el===zone||el.classList.contains('role-choice-grid'))return;
      if(!el.children.length&&!String(el.textContent||'').trim()&&getComputedStyle(el).display!=='none')el.remove();
    });
  }

  function decorateRandomRole(root=document){
    root.querySelectorAll?.('.role-choice-zone').forEach(zone=>{
      removeLegacyRoleLinks(zone);
      const grid=zone.querySelector('.role-choice-grid');
      if(!grid||zone.querySelector('.igr-random-role-cta'))return;
      const c=randomCopy();
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='igr-random-role-cta';
      btn.innerHTML=`<span><b>${c.title}</b><small>${c.help}</small></span><em>${c.action}</em>`;
      btn.addEventListener('click',()=>window.chooseRandomLobbyRole?.());
      zone.insertBefore(btn,grid);
    });
  }

  function campaignState(){return STATE?.sync?.room?.state?.omerta_campaign||null}
  function cleanRank(node){
    let rank=String(node?.rank||'').trim();
    if(node?.blood&&rank.toUpperCase()==='FAMILLE DE SANG')return rank;
    return rank.replace(/\s*·\s*SANG\s*$/i,'');
  }
  function statusLabel(v){return v==='mort'?'MORT':v==='protégé'?'PROTÉGÉ':'ACTIF'}

  function familyTreeHtml(){
    const c=campaignState();
    const nodes=Array.isArray(c?.family_tree)?c.family_tree:[];
    const statuses=c?.character_status||{};
    if(!nodes.length)return '<div class="empty-state">L’arbre apparaîtra avec la campagne.</div>';
    const byParent=new Map();
    for(const n of nodes){const key=n.parent||'__root__';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key).push(n)}
    const renderNode=n=>{
      const children=byParent.get(n.id)||[];
      const st=statuses[n.name]||'actif';
      const rank=cleanRank(n);
      return `<li><div class="igr-family-node status-${esc(st)}"><div class="igr-family-node-head"><span class="igr-family-status-dot"></span><em>${esc(statusLabel(st))}</em></div><strong>${esc(n.name)}</strong><small>${esc(rank)}${n.blood&&!/sang/i.test(rank)?' · SANG':''}</small></div>${children.length?`<ul>${children.map(renderNode).join('')}</ul>`:''}</li>`;
    };
    const roots=byParent.get('__root__')||[];
    return `<div class="igr-family-tree-scroll"><div class="igr-family-tree"><ul>${roots.map(renderNode).join('')}</ul></div></div>`;
  }

  function dossierProgress(){
    const c=campaignState(),done=c?.dossiers||{};
    return ['021','022','023','024','025'].map(id=>`<span class="${done[id]?'done':''}">${id}</span>`).join('');
  }

  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();
    const c=campaignState(),modal=document.createElement('div');
    modal.className='modal omerta-tree-modal';
    modal.innerHTML=`<div class="modal-box omerta-tree-box igr-family-modal"><div class="omerta-eyebrow">OMERTÀ · DOSSIER DE FAMILLE</div><div class="omerta-tree-head"><div><h2>Arbre de la Famiglia</h2><p>Le sang, le rang et les conséquences ne sont pas la même chose.</p></div><div class="omerta-dossier-progress">${dossierProgress()}</div></div>${familyTreeHtml()}<div class="omerta-tree-current"><span>PROCHAIN DOSSIER</span><b>${esc(c?.current_dossier||STATE?.sync?.room?.scenario_id||'021')}</b></div><div class="modal-actions"><button class="btn ghost" type="button">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.modal-actions .btn'))modal.remove()});
    document.body.appendChild(modal);
    requestAnimationFrame(()=>{const scroller=modal.querySelector('.igr-family-tree-scroll');if(scroller)scroller.scrollLeft=Math.max(0,(scroller.scrollWidth-scroller.clientWidth)/2)});
  };

  function apply(root=document){repairOmertaImages(root);decorateRandomRole(root)}

  try{
    const previousRenderLobby=renderLobby;
    renderLobby=function(prefetched){const out=previousRenderLobby(prefetched);queueMicrotask(()=>apply(document));return out};
  }catch(e){console.warn('OMERTA lobby visual patch',e)}

  queueMicrotask(()=>apply(document));
  setTimeout(()=>apply(document),80);
})();
