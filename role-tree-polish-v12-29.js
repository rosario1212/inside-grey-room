/* Inside Grey Room — v12.29 role random + OMERTÀ family-tree polish
   Neutral random-role UI for base dossiers, OMERTÀ-only red accent,
   fresh-player-aware secure role draw, landscape family-tree navigation,
   and player-first private identity projection for OMERTÀ. */
(()=>{
  const OMERTA_IDS=new Set(['021','022','023','024','025']);
  const DRAW_MIN_MS=240;
  let randomBusy=false;

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const currentScenarioId=()=>String(STATE?.sync?.room?.scenario_id||STATE?.scenarioId||STATE?.selectedScenario||'');
  const isOmerta=id=>OMERTA_IDS.has(String(id||''));
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;

  function secureIndex(length){
    if(!Number.isInteger(length)||length<1)return 0;
    try{
      if(typeof secureRandomIndex==='function')return secureRandomIndex(length);
      const range=0x100000000,limit=range-(range%length),buf=new Uint32Array(1);
      do{crypto.getRandomValues(buf)}while(buf[0]>=limit);
      return buf[0]%length;
    }catch(_){return Math.floor(Math.random()*length)}
  }

  function randomButton(){return document.querySelector('.role-choice-zone .igr-random-role-cta')}
  function syncRandomVisual(){
    const btn=randomButton();if(!btn)return;
    const mafia=isOmerta(currentScenarioId());
    btn.classList.toggle('is-omerta',mafia);
    btn.classList.toggle('is-base',!mafia);
    btn.dataset.scenarioFamily=mafia?'omerta':'base';
  }

  function roleLabel(id){
    try{return typeof publicRoleLabel==='function'?publicRoleLabel(id):(typeof roleInfo==='function'?roleInfo(id)?.label:id)}catch(_){return id}
  }

  function setRolling(btn,labels){
    if(!btn)return()=>{};
    const target=btn.querySelector('em');
    const original=target?.textContent||tr('TIRER','DRAW');
    btn.disabled=true;btn.classList.add('is-rolling');btn.setAttribute('aria-busy','true');
    let timer=null;
    if(target&&labels.length){
      timer=setInterval(()=>{target.textContent=String(roleLabel(labels[secureIndex(labels.length)])||'').toUpperCase()},58);
    }
    return finalLabel=>{
      if(timer)clearInterval(timer);
      if(target)target.textContent=finalLabel||original;
      btn.disabled=false;btn.classList.remove('is-rolling');btn.removeAttribute('aria-busy');
      setTimeout(()=>{if(target&&!btn.classList.contains('is-rolling'))target.textContent=original},650);
    };
  }

  function availableRoleTypes(data){
    const sc=scenario?.(data?.room?.scenario_id);if(!sc)return[];
    const players=Array.isArray(data.players)?data.players:[];
    const me={...players.find(p=>String(p.id)===String(data.player?.id)),...data.player};
    const choices=roleChoiceSummary?.(sc,players.length,players)||[];
    return choices.filter(x=>x&&x.id&&(Number(x.taken)||0)<(Number(x.cap)||0)||x&&x.id&&me.preferred_role===x.id).map(x=>x.id);
  }

  async function freshSync(){
    try{if(typeof syncNow==='function')await syncNow(true)}catch(e){console.warn('random role sync',e)}
    return STATE?.sync||null;
  }

  async function chooseRoleDirect(role,sid){
    const rpcName=isOmerta(sid)?'igr_omerta_choose_role':'igr_v4_choose_role';
    const payload={p_code:STATE.room,p_player_token:STATE.token,p_role:role};
    return rpc(rpcName,payload);
  }

  window.chooseRandomLobbyRole=async function(){
    if(randomBusy)return;
    randomBusy=true;
    const btn=randomButton();
    let stopRolling=()=>{};
    try{
      const initial=STATE?.sync;
      const initialIds=initial?availableRoleTypes(initial):[];
      stopRolling=setRolling(btn,initialIds);
      const started=performance.now();
      let data=await freshSync();
      const elapsed=performance.now()-started;
      if(elapsed<DRAW_MIN_MS)await wait(DRAW_MIN_MS-elapsed);

      for(let attempt=0;attempt<4;attempt++){
        data=STATE?.sync||data;
        if(!data)throw new Error('no_sync');
        const sid=String(data.room?.scenario_id||'');
        const available=availableRoleTypes(data);
        if(!available.length){
          stopRolling(tr('AUCUN','NONE'));
          toast?.(tr('Aucun rôle disponible.','No role is available.'));
          return;
        }
        const picked=available[secureIndex(available.length)];
        try{
          await chooseRoleDirect(picked,sid);
          await freshSync();
          if(STATE?.sync&&typeof renderLobby==='function')renderLobby(STATE.sync);
          syncRandomVisual();
          stopRolling(String(roleLabel(picked)||picked).toUpperCase());
          toast?.(`${tr('Rôle tiré','Role drawn')} : ${roleLabel(picked)}`);
          return;
        }catch(e){
          const msg=String(e?.message||'').toLowerCase();
          const concurrent=/taken|pris|unavailable|indisponible|match scenario composition|role already/.test(msg);
          if(!concurrent||attempt===3)throw e;
          await freshSync();
        }
      }
    }catch(e){
      console.error('random role',e);
      stopRolling(tr('RÉESSAYER','RETRY'));
      toast?.(tr('Le tirage a été actualisé. Réessaie.','The draw was refreshed. Try again.'));
    }finally{randomBusy=false;setTimeout(syncRandomVisual,0)}
  };

  function ownNarrativeIdentity(){
    const d=STATE?.sync,p=d?.player,ps=p?.private_state||{};
    if(!d||!isOmerta(d.room?.scenario_id)||!p?.pseudo||typeof ps.place!=='string')return null;
    const raw=ps.place.trim();if(!raw)return null;
    const canonical=(raw.split('·')[0]||'').trim();
    if(!canonical||canonical===p.pseudo)return null;
    return {canonical,pseudo:p.pseudo,first:canonical.split(/\s+/)[0]||canonical};
  }

  function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function projectPrivateIdentity(html){
    const id=ownNarrativeIdentity();if(!id||typeof html!=='string')return html;
    let out=html;
    const full=new RegExp(escapeRegExp(id.canonical),'g');
    out=out.replace(full,typeof h==='function'?h(id.pseudo):id.pseudo);
    if(id.first.length>=4){
      const first=new RegExp(`\\b${escapeRegExp(id.first)}\\b`,'g');
      out=out.replace(first,typeof h==='function'?h(id.pseudo):id.pseudo);
    }
    return out;
  }

  try{
    const previousPrivate=window.privateCardHtml;
    if(typeof previousPrivate==='function'){
      window.privateCardHtml=function(){return projectPrivateIdentity(previousPrivate.apply(this,arguments))};
    }
  }catch(e){console.warn('OMERTA identity projection',e)}

  function bindTreeLandscape(modal){
    const scroll=modal?.querySelector('.omerta-org-scroll');if(!scroll)return;
    let userMoved=false;
    const mark=()=>{userMoved=true};
    scroll.addEventListener('pointerdown',mark,{passive:true});
    scroll.addEventListener('touchstart',mark,{passive:true});
    const center=()=>{
      if(userMoved)return;
      requestAnimationFrame(()=>{scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)});
    };
    center();
    const onRotate=()=>setTimeout(center,120);
    window.addEventListener('orientationchange',onRotate,{passive:true,once:true});
  }

  try{
    const previousTree=window.igrOmertaOpenFamilyTree;
    if(typeof previousTree==='function'){
      window.igrOmertaOpenFamilyTree=function(){
        const result=previousTree.apply(this,arguments);
        const modal=document.querySelector('.omerta-tree-modal');
        if(modal){
          modal.classList.add('omerta-tree-responsive');
          const sub=modal.querySelector('.omerta-tree-head p');
          if(sub)sub.textContent=tr('Les personnages portent l’histoire ; les joueurs gardent leur identité.','Characters carry the story; players keep their identity.');
          bindTreeLandscape(modal);
        }
        return result;
      };
    }
  }catch(e){console.warn('OMERTA tree landscape',e)}

  try{
    const previousRenderLobby=window.renderLobby;
    if(typeof previousRenderLobby==='function'){
      window.renderLobby=function(){const out=previousRenderLobby.apply(this,arguments);queueMicrotask(syncRandomVisual);requestAnimationFrame(syncRandomVisual);return out};
    }
  }catch(e){console.warn('random role render hook',e)}

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes?.length))syncRandomVisual();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',syncRandomVisual,{passive:true});
  document.addEventListener('DOMContentLoaded',syncRandomVisual,{once:true});
  setTimeout(syncRandomVisual,0);
})();
