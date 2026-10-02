/* Inside Grey Room v24 — live-cell/gameplay interaction stability.
   - Keeps Retirer on the canonical role mutation path.
   - Serializes room syncs and coalesces realtime bursts instead of allowing
     overlapping fetch/render passes to compete for the iPhone main thread.
   - Marks actual running games for the discreet notification control.
   - Purges stale floating navigation from live cells/gameplay. */
(()=>{
  'use strict';
  const VERSION='24.0-gameplay-stability';

  const inRoom=()=>{try{return !!(STATE?.room&&STATE?.token)}catch{return false}};
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const isRoleArea=el=>!!el?.closest?.('.role-choice-zone,.lobby-v11,.page-lobby,[class*="role-choice"]');
  const terminalStatus=new Set(['closed','finished','ended','complete','completed']);

  function roomStatus(){try{return String(STATE?.sync?.room?.status||'').toLowerCase()}catch{return''}}
  function gameActive(){
    if(!inRoom())return false;
    const status=roomStatus();
    return !!status&&status!=='lobby'&&!terminalStatus.has(status);
  }
  function syncGameUiState(){
    const body=document.body;if(!body)return;
    const active=gameActive();
    body.classList.toggle('igr-game-active',active);
    body.classList.toggle('igr-live-cell',inRoom());
    if(inRoom()){
      /* A live cell intentionally has no floating Home/Filters dock. Removing
         any stale copy once also prevents an invisible full-screen dock shell
         from ever participating in hit testing. */
      document.getElementById('igrUniversalDock')?.remove();
      body.classList.remove('igr-global-dock-active','igr-dock-scrolling','igr-scenario-browser','igr-profile-view','igr-filter-dock-open');
    }
  }

  /* The current upper role card says simply “Retirer”, while older markup says
     “Retirer mon choix”. Both clear the preferred role through one action. */
  document.addEventListener('click',event=>{
    const el=event.target.closest?.('button,a,[role="button"]');
    if(!el||!isRoleArea(el))return;
    const text=normalize(el.textContent);
    if(!/^retirer(?:\s+mon\s+choix)?$/i.test(text))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{
      if(typeof chooseLobbyRole==='function'){
        Promise.resolve(chooseLobbyRole('none')).catch(err=>console.warn('[IGR v24] remove role',err));
      }
    }catch(err){console.warn('[IGR v24] remove role',err)}
  },true);

  /* One room sync at a time.
     The previous runtime could receive a fallback poll, a realtime invalidation
     and an explicit forced sync almost together. Each sync can rerender a large
     part of the lobby/game. On iOS those overlapping passes could generate a
     render storm and make controls appear frozen. Passive calls now share the
     active request; forced calls arriving mid-sync are collapsed into exactly
     one trailing forced pass, so no server update is lost. */
  let installed=false;
  function installSyncGuard(){
    if(installed)return;
    let base=null;
    try{base=typeof globalThis.syncNow==='function'?globalThis.syncNow:(typeof syncNow==='function'?syncNow:null)}catch{}
    if(typeof base!=='function')return;
    if(base.__igrV24Stable){installed=true;return}

    let running=false;
    let currentPromise=null;
    let queuedForce=false;
    let queuedCtx=null;
    let queuedRest=[];
    let queuedWaiters=[];
    let lastCompletedAt=0;

    const currentState=()=>{try{return STATE?.sync||null}catch{return null}};

    const startRun=(force,ctx,rest,waiters=[])=>{
      running=true;
      const task=Promise.resolve().then(()=>base.call(ctx,force,...rest));
      currentPromise=task;
      task.then(result=>{
        lastCompletedAt=performance.now();
        syncGameUiState();
        for(const waiter of waiters)waiter.resolve(result);
      },error=>{
        syncGameUiState();
        for(const waiter of waiters)waiter.reject(error);
      }).finally(()=>{
        running=false;
        currentPromise=null;
        if(queuedForce){
          const nextCtx=queuedCtx,nextRest=queuedRest,nextWaiters=queuedWaiters.splice(0);
          queuedForce=false;queuedCtx=null;queuedRest=[];
          startRun(true,nextCtx,nextRest,nextWaiters);
        }
      });
      return task;
    };

    const wrapped=function(force,...rest){
      const forced=force===true;
      if(!inRoom()){
        return Promise.resolve(base.call(this,force,...rest)).finally(syncGameUiState);
      }

      const now=performance.now();
      if(!forced&&!running&&now-lastCompletedAt<1000){
        syncGameUiState();
        return Promise.resolve(currentState());
      }

      if(running){
        if(!forced){
          return currentPromise.then(()=>currentState());
        }
        queuedForce=true;queuedCtx=this;queuedRest=rest;
        return new Promise((resolve,reject)=>queuedWaiters.push({resolve,reject}));
      }

      return startRun(forced,this,rest);
    };
    Object.defineProperty(wrapped,'__igrV24Stable',{value:true});
    try{globalThis.syncNow=wrapped}catch{}
    try{syncNow=wrapped}catch{}
    installed=true;
  }

  installSyncGuard();
  if(!installed){
    const timer=setInterval(()=>{installSyncGuard();if(installed)clearInterval(timer)},120);
    setTimeout(()=>clearInterval(timer),4000);
  }

  /* Keep the UI state correct after lifecycle transitions without polling the
     application. syncNow is the primary source of truth; these events only
     repair presentation after iOS background/foreground transitions. */
  addEventListener('pageshow',syncGameUiState,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncGameUiState()},{passive:true});
  queueMicrotask(syncGameUiState);
  setTimeout(syncGameUiState,0);

  window.IGR_CELL_CONTROLS_V24=Object.freeze({version:VERSION,refresh:syncGameUiState});
})();
