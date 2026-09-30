/* Inside Grey Room — OMERTÀ v12.28 hotfix
   Ensures dedicated DLC art loads, keeps one prominent random-role control,
   and renders the Famiglia as a real visual tree with branches. */
(()=>{
  const IDS=['021','022','023','024','025'];
  const SET=new Set(IDS);
  const ART={
    '021':'/assets/omerta-021-l-enveloppe.webp?v=12.28',
    '022':'/assets/omerta-022-omerta.webp?v=12.28',
    '023':'/assets/omerta-023-la-table.webp?v=12.28',
    '024':'/assets/omerta-024-il-pentito.webp?v=12.28',
    '025':'/assets/omerta-025-il-don.webp?v=12.28'
  };
  const isOmerta=id=>SET.has(String(id||''));
  try{
    const oldThumb=window.scenarioThumbArt,oldArt=window.scenarioArt;
    window.scenarioThumbArt=id=>isOmerta(id)?ART[String(id)]:oldThumb(id);
    window.scenarioArt=id=>isOmerta(id)?ART[String(id)]:oldArt(id);
  }catch(e){console.warn('OMERTA art functions',e)}

  function repairArt(root=document){
    for(const id of IDS){
      const card=root.querySelector?.(`#scenario-${id}`);if(!card)continue;
      const img=card.querySelector('img');if(!img)continue;
      const wanted=ART[id];
      if(img.getAttribute('src')!==wanted)img.setAttribute('src',wanted);
      img.onerror=()=>{
        const plain=wanted.split('?')[0];
        if(img.getAttribute('src')!==plain)img.setAttribute('src',plain);
      };
    }
  }

  function removeLegacyRoleControls(zone){
    zone.querySelectorAll('button,a').forEach(el=>{
      if(el.classList.contains('igr-random-role-cta')||el.closest('.omerta-role-status'))return;
      const t=(el.textContent||'').trim().toLowerCase();
      if(t.includes('choisir au hasard')||t.includes('changer au hasard')||t==='au hasard'||t.includes('choose at random')||t.includes('change at random'))el.remove();
    });
    zone.querySelectorAll('.random-role-card').forEach(el=>el.remove());
  }

  function ensureRandomRoleControl(root=document){
    const zone=root.querySelector?.('.role-choice-zone');if(!zone)return;
    removeLegacyRoleControls(zone);
    const grid=zone.querySelector('.role-choice-grid');if(!grid)return;
    let btn=zone.querySelector('.igr-random-role-cta');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='igr-random-role-cta';
      btn.onclick=()=>window.chooseRandomLobbyRole?.();
      btn.innerHTML='<span><b>RÔLE AU HASARD</b><small>Tirage uniforme parmi les rôles encore disponibles.</small></span><em>TIRER</em>';
      zone.insertBefore(btn,grid);
    }
  }

  function getCampaign(){return window.STATE?.sync?.room?.state?.omerta_campaign||null}
  function esc(v){try{return window.h?window.h(String(v??'')):String(v??'')}catch{return String(v??'')}}
  function statusLabel(v){if(v==='mort')return'MORT';if(v==='protégé')return'PROTÉGÉ';return'ACTIF'}
  function progress(){const c=getCampaign(),done=c?.dossiers||{};return IDS.map(id=>`<span class="${done[id]?'done':''}">${id}</span>`).join('')}
  function renderNode(n,statuses,children){
    const st=statuses[n.name]||'actif',kids=children[n.id]||[];
    const blood=n.blood&&!String(n.rank||'').toUpperCase().includes('SANG')?' · SANG':'';
    return `<li><div class="omerta-family-node status-${esc(st)}"><b>${esc(n.name)}</b><small>${esc(n.rank)}${blood}</small><em>${statusLabel(st)}</em></div>${kids.length?`<ul>${kids.map(x=>renderNode(x,statuses,children)).join('')}</ul>`:''}</li>`;
  }
  function treeHtml(){
    const c=getCampaign(),tree=Array.isArray(c?.family_tree)?c.family_tree:[],statuses=c?.character_status||{};
    if(!tree.length)return'<div class="empty-state">L’arbre apparaîtra avec la campagne.</div>';
    const children={};for(const n of tree){const k=n.parent||'__root__';(children[k]||(children[k]=[])).push(n)}
    const roots=children.__root__||tree.filter(n=>!n.parent);
    return `<div class="omerta-org-scroll"><div class="omerta-org-tree"><ul class="omerta-org-root">${roots.map(n=>renderNode(n,statuses,children)).join('')}</ul></div></div><div class="omerta-tree-legend"><span><i></i>Actif</span><span><i class="protected"></i>Protégé</span><span><i class="dead"></i>Mort</span></div>`;
  }
  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();
    const c=getCampaign(),modal=document.createElement('div');modal.className='modal omerta-tree-modal';
    modal.innerHTML=`<div class="modal-box omerta-tree-box"><div class="omerta-eyebrow">OMERTÀ · DOSSIER DE FAMILLE</div><div class="omerta-tree-head"><div><h2>Arbre de la Famiglia</h2><p>Le sang, le rang et les conséquences ne sont pas la même chose.</p></div><div class="omerta-dossier-progress">${progress()}</div></div>${treeHtml()}<div class="omerta-tree-current"><span>PROCHAIN DOSSIER</span><b>${esc(c?.current_dossier||window.STATE?.sync?.room?.scenario_id||'021')}</b></div><div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
    requestAnimationFrame(()=>{const s=modal.querySelector('.omerta-org-scroll');if(s)s.scrollLeft=Math.max(0,(s.scrollWidth-s.clientWidth)/2)});
  };

  function fix(root=document){repairArt(root);ensureRandomRoleControl(root)}
  const obs=new MutationObserver(()=>fix(document));
  obs.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',()=>fix(document));
  document.addEventListener('DOMContentLoaded',()=>fix(document));
  setTimeout(()=>fix(document),0);setTimeout(()=>fix(document),250);setTimeout(()=>fix(document),1200);
})();