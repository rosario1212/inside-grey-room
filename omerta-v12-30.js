/* Inside Grey Room — OMERTÀ v12.32
   Official 021–025 poster artwork, resilient cryptographic role draw,
   and OMERTÀ-scoped red visual identity. */
(()=>{
  'use strict';

  const IDS=['021','022','023','024','025'];
  const OMERTA=new Set(IDS);
  const ART={
    '021':'assets/omerta-021-l-enveloppe-hd.svg?v=12.32',
    '022':'assets/omerta-022-omerta-hd.svg?v=12.32',
    '023':'assets/omerta-023-la-table-hd.svg?v=12.32',
    '024':'assets/omerta-024-il-pentito-hd.svg?v=12.32',
    '025':'assets/omerta-025-il-don-hd.svg?v=12.32'
  };
  const DRAW_MIN_MS=560;
  const DRAW_FINAL_MS=760;
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const state=()=>window.STATE||null;
  const currentId=()=>String(state()?.sync?.room?.scenario_id||state()?.scenarioId||state()?.selectedScenario||'');
  const isOmerta=id=>OMERTA.has(String(id||''));
  const campaign=()=>state()?.sync?.room?.state?.omerta_campaign||null;

  /* 021–025: force the supplied official poster artwork everywhere. */
  const oldThumb=window.scenarioThumbArt;
  const oldArt=window.scenarioArt;
  if(typeof oldThumb==='function')window.scenarioThumbArt=id=>isOmerta(id)?ART[String(id)]:oldThumb(id);
  if(typeof oldArt==='function')window.scenarioArt=id=>isOmerta(id)?ART[String(id)]:oldArt(id);

  function repairArtwork(root=document){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('img').forEach(img=>{
      const src=String(img.getAttribute('src')||'');
      let id=IDS.find(x=>img.closest?.(`#scenario-${x}`)||src.includes(`omerta-${x}-`)||src.includes(`omerta-${x}.`));
      if(!id){
        const cid=currentId();
        if(isOmerta(cid)&&img.closest?.('.scenario-hero,.scenario-hero-art,.confirm-art,.section-cover'))id=cid;
      }
      if(!id)return;
      if(img.getAttribute('src')!==ART[id])img.setAttribute('src',ART[id]);
      img.removeAttribute('srcset');
      img.decoding='async';
      img.style.imageRendering='auto';
    });
  }

  /* Character history belongs to the player; the player's pseudo stays visible. */
  function pairs(){
    const tree=Array.isArray(campaign()?.family_tree)?campaign().family_tree:[];
    return tree.filter(x=>x?.name&&x?.player).map(x=>({name:String(x.name),player:String(x.player)}));
  }
  function replaceCharacterNames(root){
    if(!root||!isOmerta(currentId()))return;
    const map=pairs();if(!map.length||typeof document.createTreeWalker!=='function')return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('script,style,textarea,input,select,option'))continue;
      let text=node.nodeValue||'';
      for(const p of map){
        text=text.split(p.name).join(p.player);
        const first=p.name.split(/\s+/)[0];
        if(first&&first.length>3)text=text.replace(new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),p.player);
      }
      node.nodeValue=text;
    }
  }

  /* Uniform, rejection-sampled WebCrypto index. No Math.random fallback. */
  function secureIndex(length){
    if(!Number.isInteger(length)||length<1)throw new Error('invalid_random_range');
    if(!window.crypto?.getRandomValues)throw new Error('secure_random_unavailable');
    const range=0x100000000;
    const limit=range-(range%length);
    const buf=new Uint32Array(1);
    do{window.crypto.getRandomValues(buf)}while(buf[0]>=limit);
    return buf[0]%length;
  }

  function roleLabel(id){
    try{
      if(typeof window.publicRoleLabel==='function')return window.publicRoleLabel(id);
      if(typeof window.roleInfo==='function')return window.roleInfo(id)?.label||id;
    }catch(_){}
    return id;
  }

  function randomButton(){return document.querySelector('.role-choice-zone .igr-random-role-cta')}

  const drawVisual={active:false,labels:[],display:'',raf:0,lastTick:0,resetTimer:0};

  function applyDrawVisual(){
    const btn=randomButton();if(!btn)return;
    const target=btn.querySelector('em');
    btn.disabled=drawVisual.active;
    btn.classList.toggle('is-rolling',drawVisual.active);
    if(drawVisual.active)btn.setAttribute('aria-busy','true');
    else btn.removeAttribute('aria-busy');
    if(target&&drawVisual.display)target.textContent=drawVisual.display;
  }

  function animationFrame(now){
    if(!drawVisual.active){drawVisual.raf=0;return}
    if(drawVisual.labels.length&&now-drawVisual.lastTick>=72){
      drawVisual.lastTick=now;
      const id=drawVisual.labels[secureIndex(drawVisual.labels.length)];
      drawVisual.display=String(roleLabel(id)||id).toUpperCase();
      applyDrawVisual();
    }
    drawVisual.raf=requestAnimationFrame(animationFrame);
  }

  function startRolling(labels){
    clearTimeout(drawVisual.resetTimer);
    drawVisual.active=true;
    drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)));
    drawVisual.display=tr('TIRAGE…','DRAWING…');
    drawVisual.lastTick=0;
    applyDrawVisual();
    if(!drawVisual.raf)drawVisual.raf=requestAnimationFrame(animationFrame);
  }

  function setRollingLabels(labels){
    drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)));
  }

  function finishRolling(label){
    drawVisual.active=false;
    if(drawVisual.raf){cancelAnimationFrame(drawVisual.raf);drawVisual.raf=0}
    drawVisual.display=label||tr('TIRER','DRAW');
    applyDrawVisual();
    clearTimeout(drawVisual.resetTimer);
    drawVisual.resetTimer=setTimeout(()=>{
      if(drawVisual.active)return;
      drawVisual.display=tr('TIRER','DRAW');
      applyDrawVisual();
    },DRAW_FINAL_MS);
  }

  function availableRoleTypes(data){
    const sid=String(data?.room?.scenario_id||'');
    const sc=typeof window.scenario==='function'?window.scenario(sid):null;
    if(!sc)return[];
    const players=Array.isArray(data?.players)?data.players:[];
    const meId=String(data?.player?.id||state()?.playerId||'');
    const listed=players.find(p=>String(p?.id||'')===meId)||{};
    const me={...listed,...(data?.player||{})};
    const summary=typeof window.roleChoiceSummary==='function'
      ? (window.roleChoiceSummary(sc,players.length,players)||[])
      : [];
    const eligible=summary.filter(x=>{
      if(!x?.id)return false;
      const cap=Number(x.cap);
      const taken=Number(x.taken);
      if(!Number.isFinite(cap)||cap<1||!Number.isFinite(taken))return false;
      return taken<cap||me.preferred_role===x.id;
    }).map(x=>String(x.id));
    const unique=Array.from(new Set(eligible));
    const alternatives=me.preferred_role?unique.filter(id=>id!==me.preferred_role):unique;
    return alternatives.length?alternatives:unique;
  }

  async function freshSync(){
    if(typeof window.syncNow==='function'){
      try{await window.syncNow(true)}catch(e){console.warn('random role sync',e)}
    }
    return state()?.sync||null;
  }

  async function chooseRoleDirect(role,sid){
    if(typeof window.rpc!=='function')throw new Error('rpc_unavailable');
    const s=state();
    if(!s?.room||!s?.token)throw new Error('session_unavailable');
    const rpcName=isOmerta(sid)?'igr_omerta_choose_role':'igr_v4_choose_role';
    return window.rpc(rpcName,{p_code:s.room,p_player_token:s.token,p_role:role});
  }

  function isConcurrencyError(error){
    const msg=String(error?.message||error||'').toLowerCase();
    return /taken|pris|unavailable|indisponible|already|composition|capacity|capacit|concurrent|conflict/.test(msg);
  }

  let randomBusy=false;
  window.chooseRandomLobbyRole=async function(){
    if(randomBusy)return;
    randomBusy=true;
    const started=performance.now();
    try{
      const initial=state()?.sync;
      startRolling(initial?availableRoleTypes(initial):[]);
      let data=await freshSync();
      if(!data)throw new Error('no_sync');
      let available=availableRoleTypes(data);
      setRollingLabels(available);

      for(let attempt=0;attempt<5;attempt++){
        if(!available.length){
          const elapsed=performance.now()-started;
          if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
          finishRolling(tr('AUCUN','NONE'));
          if(typeof window.toast==='function')window.toast(tr('Aucun rôle disponible.','No role is available.'));
          return;
        }

        const picked=available[secureIndex(available.length)];
        const sid=String(data?.room?.scenario_id||currentId());
        try{
          await chooseRoleDirect(picked,sid);
          await freshSync();
          const elapsed=performance.now()-started;
          if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
          finishRolling(String(roleLabel(picked)||picked).toUpperCase());
          if(state()?.sync&&typeof window.renderLobby==='function')window.renderLobby(state().sync);
          styleOmerta();
          if(typeof window.toast==='function')window.toast(`${tr('Rôle tiré','Role drawn')} : ${roleLabel(picked)}`);
          return;
        }catch(e){
          if(!isConcurrencyError(e)||attempt===4)throw e;
          data=await freshSync();
          if(!data)throw e;
          available=availableRoleTypes(data);
          setRollingLabels(available);
        }
      }
    }catch(e){
      console.error('random role',e);
      const elapsed=performance.now()-started;
      if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
      finishRolling(tr('RÉESSAYER','RETRY'));
      if(typeof window.toast==='function')window.toast(
        String(e?.message||'').includes('secure_random_unavailable')
          ? tr('Le tirage sécurisé n’est pas disponible sur cet appareil.','Secure drawing is unavailable on this device.')
          : tr('Le tirage a été actualisé. Réessaie.','The draw was refreshed. Try again.')
      );
    }finally{
      randomBusy=false;
      queueMicrotask(styleOmerta);
    }
  };

  function markOmertaCells(root=document){
    if(!root?.querySelectorAll)return;
    const active=isOmerta(currentId());
    document.body?.classList.toggle('igr-omerta-active',active);
    const selector=[
      '.role-choice-card','.roles-row','.omerta-role-status','.omerta-objective-card',
      '.omerta-private-role','.omerta-decision-dock','.omerta-family-node',
      '.omerta-tree-current','.player','.mini','.event'
    ].join(',');
    root.querySelectorAll(selector).forEach(el=>el.classList.toggle('igr-omerta-cell',active));
  }

  function styleOmerta(){
    const btn=randomButton();
    const mafia=isOmerta(currentId());
    if(btn){
      btn.classList.toggle('is-omerta',mafia);
      btn.classList.toggle('is-base',!mafia);
      const zone=btn.closest('.role-choice-zone');
      zone?.classList.toggle('is-omerta-scenario',mafia);
      zone?.classList.toggle('is-base-scenario',!mafia);
    }
    markOmertaCells(document);
    applyDrawVisual();
  }

  /* Keep the Famiglia board horizontally explorable in landscape. */
  const oldTree=window.igrOmertaOpenFamilyTree;
  if(typeof oldTree==='function')window.igrOmertaOpenFamilyTree=function(){
    const out=oldTree.apply(this,arguments);
    requestAnimationFrame(()=>{
      const modal=document.querySelector('.omerta-tree-modal');if(!modal)return;
      modal.classList.add('omerta-tree-responsive','omerta-tree-v1232');
      const subtitle=modal.querySelector('.omerta-tree-head p');
      if(subtitle)subtitle.textContent=tr(
        'Le personnage porte l’histoire ; son rang, ses liens et ses conséquences deviennent ceux du joueur.',
        'The character carries the story; their rank, links and consequences become the player’s.'
      );
      replaceCharacterNames(modal);
      const scroll=modal.querySelector('.omerta-org-scroll');
      if(scroll){
        scroll.style.overflowX='auto';
        scroll.style.webkitOverflowScrolling='touch';
        requestAnimationFrame(()=>{scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)});
      }
      markOmertaCells(modal);
    });
    return out;
  };

  function refresh(){
    repairArtwork(document);
    styleOmerta();
    replaceCharacterNames(document.getElementById('app'));
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes?.length))queueMicrotask(refresh);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  window.addEventListener('pageshow',refresh,{passive:true});
  setTimeout(refresh,0);
  setTimeout(refresh,250);
})();
