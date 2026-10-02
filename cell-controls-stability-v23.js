/* Inside Grey Room v24 — live-cell/gameplay interaction stability.
   - Makes every visible Retirer control use the canonical role mutation path.
   - Serializes room syncs and coalesces realtime bursts instead of allowing
     overlapping fetch/render passes to compete for the iPhone main thread.
   - Repairs launch-button state after every launch attempt.
   - Marks only server status=playing as an actual game for the discreet bell.
   - Purges stale floating navigation from live cells/gameplay. */
(()=>{
  'use strict';
  const VERSION='24.2-gameplay-stability';

  const inRoom=()=>{try{return !!(STATE?.room&&STATE?.token)}catch{return false}};
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const isRoleArea=el=>!!el?.closest?.('.role-choice-zone,.lobby-v11,.page-lobby,[class*="role-choice"]');
  const roomStatus=()=>{try{return String(STATE?.sync?.room?.status||'').toLowerCase()}catch{return''}};
  const gameActive=()=>inRoom()&&roomStatus()==='playing';

  function healLobbyControls(){
    try{
      const d=STATE?.sync;
      if(!d||String(d.room?.status||'').toLowerCase()!=='lobby')return;
      const button=document.querySelector('.lobby-v11 .btn.primary.block,.page-lobby .btn.primary.block');
      if(!button||button.getAttribute('aria-busy')==='true')return;
      const count=(d.players||[]).length;
      const min=Number(d.room?.min_players||0);
      const max=Number(d.room?.max_players||99);
      const canStart=!!STATE?.hostToken&&count>=min&&count<=max;
      /* live-cell-v12-44 set disabled=true while launching but its legacy
         busy-reset path did not explicitly restore disabled=false. Restore the
         server-derived lobby state, never blindly enable an invalid launch. */
      button.disabled=!canStart;
      button.removeAttribute('aria-busy');
      if(button.dataset.liveLabel&&button.textContent==='Lancement…'){
        button.textContent=button.dataset.liveLabel;
        delete button.dataset.liveLabel;
      }
    }catch{}
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
    /* Do not mutate introGate here. The door sequence is reusable on genuine
       app entry/return and owns its own pointer-event lifecycle. */
    healLobbyControls();
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
     Core syncNow already prevents simultaneous network writes, but a burst of
     Realtime invalidations plus explicit force=true calls can still queue
     several complete render passes after one another. Passive calls now share
     the active request; forced calls arriving mid-sync are collapsed into one
     trailing forced pass, preserving the newest server state without a render
     storm. */
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
      if(!inRoom())return Promise.resolve(base.call(this,force,...rest)).finally(syncGameUiState);

      const now=performance.now();
      if(!forced&&!running&&now-lastCompletedAt<1000){
        syncGameUiState();
        return Promise.resolve(currentState());
      }
      if(running){
        if(!forced)return currentPromise.then(()=>currentState());
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

  /* The legacy launcher owns validation/RPC semantics. This wrapper changes no
     gameplay rule: it only deduplicates rapid taps and guarantees a UI repair
     immediately after the launch promise settles. */
  function installLaunchGuard(){
    let base=null;
    try{base=typeof globalThis.startGame==='function'?globalThis.startGame:(typeof startGame==='function'?startGame:null)}catch{}
    if(typeof base!=='function'||base.__igrV24LaunchGuard)return;
    let flight=null;
    const wrapped=function(...args){
      if(flight)return flight;
      const ctx=this;
      flight=Promise.resolve().then(()=>base.apply(ctx,args)).finally(()=>{
        flight=null;
        syncGameUiState();
        requestAnimationFrame(syncGameUiState);
        setTimeout(syncGameUiState,120);
      });
      return flight;
    };
    Object.defineProperty(wrapped,'__igrV24LaunchGuard',{value:true});
    try{globalThis.startGame=wrapped}catch{}
    try{startGame=wrapped}catch{}
  }
  installLaunchGuard();

  /* Repair presentation after iOS background/foreground transitions without
     adding another polling loop. */
  addEventListener('pageshow',syncGameUiState,{passive:true});
  addEventListener('online',syncGameUiState,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncGameUiState()},{passive:true});
  window.addEventListener('igr:sync',syncGameUiState,{passive:true});
  queueMicrotask(syncGameUiState);
  setTimeout(syncGameUiState,0);

  window.IGR_CELL_CONTROLS_V24=Object.freeze({version:VERSION,refresh:syncGameUiState});
})();
