/* Inside Grey Room — OMERTÀ v12.30
   - Server-authoritative random role draw (live player/capacity aware)
   - Character-becomes-player narrative projection
   - Landscape, horizontally pannable Famiglia tree
   - Resolution-independent OMERTÀ dossier art
*/
(()=>{
  'use strict';
  const IDS=['021','022','023','024','025'];
  const SET=new Set(IDS);
  const ART={
    '021':'/assets/omerta-021-l-enveloppe-hd.svg?v=12.30',
    '022':'/assets/omerta-022-omerta-hd.svg?v=12.30',
    '023':'/assets/omerta-023-la-table-hd.svg?v=12.30',
    '024':'/assets/omerta-024-il-pentito-hd.svg?v=12.30',
    '025':'/assets/omerta-025-il-don-hd.svg?v=12.30'
  };
  const OLD_ART={
    '021':['omerta-021-l-enveloppe.webp','omerta-021-l-enveloppe-hd.svg'],
    '022':['omerta-022-omerta.webp','omerta-022-omerta-hd.svg'],
    '023':['omerta-023-la-table.webp','omerta-023-la-table-hd.svg'],
    '024':['omerta-024-il-pentito.webp','omerta-024-il-pentito-hd.svg'],
    '025':['omerta-025-il-don.webp','omerta-025-il-don-hd.svg']
  };
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const esc=v=>{try{return typeof h==='function'?h(String(v??'')):String(v??'')}catch(_){return String(v??'')}};
  const isOmerta=id=>SET.has(String(id||''));
  const currentId=()=>String(window.STATE?.sync?.room?.scenario_id||window.STATE?.scenarioId||window.STATE?.selectedScenario||'');
  const campaign=()=>window.STATE?.sync?.room?.state?.omerta_campaign||null;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  /* ---------- Sharp dossier art ---------- */
  try{
    const prevThumb=window.scenarioThumbArt;
    const prevArt=window.scenarioArt;
    if(typeof prevThumb==='function')window.scenarioThumbArt=id=>isOmerta(id)?ART[String(id)]:prevThumb(id);
    if(typeof prevArt==='function')window.scenarioArt=id=>isOmerta(id)?ART[String(id)]:prevArt(id);
  }catch(e){console.warn('OMERTA v12.30 art override',e)}

  function artIdFromElement(img){
    const src=String(img?.getAttribute?.('src')||'');
    for(const id of IDS){
      if(OLD_ART[id].some(name=>src.includes(name)))return id;
      if(img?.closest?.(`#scenario-${id}`))return id;
    }
    return null;
  }
  function repairArt(root=document){
    root.querySelectorAll?.('img').forEach(img=>{
      const id=artIdFromElement(img);if(!id)return;
      if(img.getAttribute('src')!==ART[id])img.setAttribute('src',ART[id]);
      img.decoding='async';
    });
  }

  /* ---------- Character -> player fusion ---------- */
  function identityPairs(){
    const tree=Array.isArray(campaign()?.family_tree)?campaign().family_tree:[];
    return tree
      .filter(n=>n?.name&&n?.player)
      .map(n=>({canonical:String(n.name),player:String(n.player)}))
      .sort((a,b)=>b.canonical.length-a.canonical.length);
  }
  function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function projectText(text,htmlSafe=false){
    if(typeof text!=='string'||!isOmerta(currentId()))return text;
    let out=text;
    for(const pair of identityPairs()){
      const replacement=htmlSafe?esc(pair.player):pair.player;
      out=out.replace(new RegExp(escapeRegExp(pair.canonical),'g'),()=>replacement);
      const first=pair.canonical.split(/\s+/)[0];
      if(first&&first.length>=4)out=out.replace(new RegExp(`\\b${escapeRegExp(first)}\\b`,'g'),()=>replacement);
    }
    return out;
  }
  window.igrOmertaProjectNarrativeText=text=>projectText(String(text??''),false);

  try{
    const prevPrivate=window.privateCardHtml;
    if(typeof prevPrivate==='function')window.privateCardHtml=function(){return projectText(prevPrivate.apply(this,arguments),true)};
  }catch(e){console.warn('OMERTA v12.30 private identity projection',e)}

  let projecting=false;
  function projectVisibleNames(root=document.getElementById('app')){
    if(projecting||!root||!isOmerta(currentId())||!identityPairs().length)return;
    projecting=true;
    try{
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
        const p=node.parentElement;
        if(!p||p.closest('script,style,textarea,input,select,option'))return NodeFilter.FILTER_REJECT;
        const txt=node.nodeValue||'';
        return identityPairs().some(x=>txt.includes(x.canonical)||txt.includes(x.canonical.split(/\s+/)[0]))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
      }});
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(n=>{n.nodeValue=projectText(n.nodeValue||'',false)});
    }finally{projecting=false}
  }

  /* ---------- Server-authoritative random role ---------- */
  const previousRandom=window.chooseRandomLobbyRole;
  let drawBusy=false;
  function randomButton(){return document.querySelector('.role-choice-zone .igr-random-role-cta')}
  function secureIndex(n){
    if(!n)return 0;
    try{const max=0x100000000,limit=max-(max%n),a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}catch(_){return Math.floor(Math.random()*n)}
  }
  function visibleRoleLabels(){
    try{
      const d=STATE?.sync,sc=scenario?.(d?.room?.scenario_id),players=d?.players||[];
      if(!d||!sc)return[];
      return (roleChoiceSummary?.(sc,players.length,players)||[]).filter(x=>x&&Number(x.taken)<Number(x.cap)).map(x=>publicRoleLabel?.(x.id)||x.id);
    }catch(_){return[]}
  }
  function startRoll(btn){
    const target=btn?.querySelector('em'),original=target?.textContent||tr('TIRER','DRAW'),labels=visibleRoleLabels();
    if(btn){btn.disabled=true;btn.classList.add('is-rolling');btn.setAttribute('aria-busy','true')}
    const timer=target&&labels.length?setInterval(()=>{target.textContent=String(labels[secureIndex(labels.length)]||'').toUpperCase()},55):null;
    return label=>{if(timer)clearInterval(timer);if(target)target.textContent=label||original;if(btn){btn.disabled=false;btn.classList.remove('is-rolling');btn.removeAttribute('aria-busy')}setTimeout(()=>{if(target&&!btn?.classList.contains('is-rolling'))target.textContent=original},720)};
  }
  window.chooseRandomLobbyRole=async function(){
    if(drawBusy)return;
    drawBusy=true;
    const btn=randomButton(),stop=startRoll(btn),started=performance.now();
    try{
      if(typeof syncNow==='function')await syncNow(true);
      const out=await rpc('igr_v4_choose_random_role',{p_code:STATE.room,p_player_token:STATE.token});
      const remaining=260-(performance.now()-started);if(remaining>0)await wait(remaining);
      if(typeof syncNow==='function')await syncNow(true);
      if(STATE?.sync&&typeof renderLobby==='function')renderLobby(STATE.sync);
      const label=publicRoleLabel?.(out?.role)||out?.role||tr('RÔLE','ROLE');
      stop(String(label).toUpperCase());
      toast?.(`${tr('Rôle tiré','Role drawn')} : ${label}`);
    }catch(e){
      const msg=String(e?.message||'');
      const missing=/igr_v4_choose_random_role|function .* does not exist|404/i.test(msg);
      if(missing&&typeof previousRandom==='function'){
        stop();drawBusy=false;return previousRandom.apply(this,arguments);
      }
      console.error('OMERTA/base atomic random role',e);stop(tr('RÉESSAYER','RETRY'));
      toast?.(/no role available/i.test(msg)?tr('Aucun rôle n’est encore disponible.','No role is currently available.'):tr('Le tirage n’a pas abouti. Réessaie.','The draw did not complete. Try again.'));
    }finally{drawBusy=false}
  };

  /* ---------- Famiglia tree: player names + landscape pan ---------- */
  function statusLabel(v){if(v==='mort')return tr('MORT','DEAD');if(v==='protégé')return tr('PROTÉGÉ','PROTECTED');return tr('ACTIF','ACTIVE')}
  function progress(){const c=campaign(),done=c?.dossiers||{};return IDS.map(id=>`<span class="${done[id]?'done':''}">${id}</span>`).join('')}
  function nodeHtml(n,statuses,children){
    const st=statuses[n.name]||'actif',kids=children[n.id]||[],display=n.player||n.name;
    const blood=n.blood&&!String(n.rank||'').toUpperCase().includes('SANG')?' · SANG':'';
    const fused=n.player?' is-player-fused':'';
    return `<li><div class="omerta-family-node status-${esc(st)}${fused}"><b>${esc(display)}</b><small>${esc(n.rank)}${blood}</small><em>${statusLabel(st)}</em></div>${kids.length?`<ul>${kids.map(x=>nodeHtml(x,statuses,children)).join('')}</ul>`:''}</li>`;
  }
  function treeHtml(){
    const c=campaign(),tree=Array.isArray(c?.family_tree)?c.family_tree:[],statuses=c?.character_status||{};
    if(!tree.length)return `<div class="empty-state">${tr('L’arbre apparaîtra avec la campagne.','The tree will appear with the campaign.')}</div>`;
    const children={};for(const n of tree){const key=n.parent||'__root__';(children[key]||(children[key]=[])).push(n)}
    const roots=children.__root__||tree.filter(n=>!n.parent);
    return `<div class="omerta-tree-pan-hint">${tr('Tourne l’iPhone puis fais glisser l’arbre horizontalement.','Rotate the iPhone, then drag the tree horizontally.')}</div><div class="omerta-org-scroll" tabindex="0" aria-label="${tr('Arbre de la Famiglia, défilement horizontal','Famiglia tree, horizontal scrolling')}"><div class="omerta-org-tree"><ul class="omerta-org-root">${roots.map(n=>nodeHtml(n,statuses,children)).join('')}</ul></div></div><div class="omerta-tree-legend"><span><i></i>${tr('Actif','Active')}</span><span><i class="protected"></i>${tr('Protégé','Protected')}</span><span><i class="dead"></i>${tr('Mort','Dead')}</span></div>`;
  }
  function centerTree(scroll){requestAnimationFrame(()=>{if(scroll)scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)})}
  function bindLandscape(modal){
    const scroll=modal?.querySelector('.omerta-org-scroll');if(!scroll)return;
    centerTree(scroll);
    let t=0;const rotated=()=>{clearTimeout(t);t=setTimeout(()=>centerTree(scroll),150)};
    window.addEventListener('orientationchange',rotated,{passive:true,once:true});
    window.visualViewport?.addEventListener?.('resize',rotated,{passive:true,once:true});
  }
  window.igrOmertaOpenFamilyTree=function(){
    document.querySelector('.omerta-tree-modal')?.remove();
    const c=campaign(),modal=document.createElement('div');modal.className='modal omerta-tree-modal omerta-tree-responsive omerta-tree-v1230';
    modal.innerHTML=`<div class="modal-box omerta-tree-box"><div class="omerta-eyebrow">OMERTÀ · ${tr('DOSSIER DE FAMILLE','FAMILY DOSSIER')}</div><div class="omerta-tree-head"><div><h2>${tr('Arbre de la Famiglia','Famiglia Tree')}</h2><p>${tr('Quand un personnage est attribué, son histoire devient celle du joueur.','Once a character is assigned, their story becomes the player’s story.')}</p></div><div class="omerta-dossier-progress">${progress()}</div></div>${treeHtml()}<div class="omerta-tree-current"><span>${tr('PROCHAIN DOSSIER','NEXT DOSSIER')}</span><b>${esc(c?.current_dossier||currentId()||'021')}</b></div><div class="modal-actions"><button class="btn ghost" type="button">${tr('Fermer','Close')}</button></div></div>`;
    modal.querySelector('.modal-actions button')?.addEventListener('click',()=>modal.remove());
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
    document.body.appendChild(modal);bindLandscape(modal);
  };

  function enforceScenarioColor(){
    const btn=randomButton();if(!btn)return;
    const mafia=isOmerta(currentId());
    btn.classList.toggle('is-omerta',mafia);btn.classList.toggle('is-base',!mafia);
    btn.closest('.role-choice-zone')?.classList.toggle('is-omerta-scenario',mafia);
    btn.closest('.role-choice-zone')?.classList.toggle('is-base-scenario',!mafia);
  }
  function refresh(root=document){repairArt(root);enforceScenarioColor();projectVisibleNames(document.getElementById('app'))}
  const obs=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes?.length||m.type==='characterData'))queueMicrotask(()=>refresh(document))});
  obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',()=>refresh(document),{passive:true});
  document.addEventListener('DOMContentLoaded',()=>refresh(document),{once:true});
  setTimeout(()=>refresh(document),0);setTimeout(()=>refresh(document),300);
})();
