/* Inside Grey Room v23 — live-cell interaction stability.
   - Makes every visible Retirer control use the canonical role mutation path.
   - Coalesces passive room syncs so fallback polling cannot saturate iPhone UI.
   - Leaves forced/realtime syncs immediate. */
(()=>{
  'use strict';
  const VERSION='23.0-cell-controls-stability';

  const inRoom=()=>{try{return !!(STATE?.room&&STATE?.token)}catch{return false}};
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const isRoleArea=el=>!!el?.closest?.('.role-choice-zone,.lobby-v11,.page-lobby,[class*="role-choice"]');

  /* The current upper role card says simply “Retirer”, while older markup says
     “Retirer mon choix”. Both must clear the preferred role reliably. */
  document.addEventListener('click',event=>{
    const el=event.target.closest?.('button,a,[role="button"]');
    if(!el||!isRoleArea(el))return;
    const text=normalize(el.textContent);
    if(!/^retirer(?:\s+mon\s+choix)?$/i.test(text))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{
      if(typeof chooseLobbyRole==='function'){
        Promise.resolve(chooseLobbyRole('none')).catch(err=>console.warn('[IGR v23] remove role',err));
      }
    }catch(err){console.warn('[IGR v23] remove role',err)}
  },true);

  /* Realtime already pushes meaningful changes immediately. When Realtime is
     temporarily unavailable the legacy watcher may request passive syncs very
     frequently. Coalescing only force=false calls prevents repeated full lobby
     renders from starving taps while preserving all explicit actions. */
  let installed=false;
  function installSyncGuard(){
    if(installed)return;
    let base=null;
    try{base=typeof globalThis.syncNow==='function'?globalThis.syncNow:(typeof syncNow==='function'?syncNow:null)}catch{}
    if(typeof base!=='function')return;
    if(base.__igrV23Stable){installed=true;return}
    let lastPassiveAt=0,pending=null;
    const wrapped=async function(force,...rest){
      if(force===true||!inRoom())return base.call(this,force,...rest);
      const now=performance.now();
      if(pending)return pending;
      if(now-lastPassiveAt<900){
        try{return STATE?.sync||null}catch{return null}
      }
      lastPassiveAt=now;
      pending=Promise.resolve(base.call(this,force,...rest));
      try{return await pending}finally{pending=null}
    };
    Object.defineProperty(wrapped,'__igrV23Stable',{value:true});
    try{globalThis.syncNow=wrapped}catch{}
    try{syncNow=wrapped}catch{}
    installed=true;
  }

  installSyncGuard();
  if(!installed){
    const timer=setInterval(()=>{installSyncGuard();if(installed)clearInterval(timer)},120);
    setTimeout(()=>clearInterval(timer),4000);
  }

  window.IGR_CELL_CONTROLS_V23=Object.freeze({version:VERSION});
})();
