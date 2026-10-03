/* Inside Grey Room — runtime optimization v12.9
   Keeps active gameplay responsive while reducing needless background polling.
   Also upgrades room-code entropy and emits a lightweight sync event for UI modules.
*/
(() => {
  const nativeShell = (() => { try { return typeof NATIVE_SHELL !== 'undefined' && !!NATIVE_SHELL; } catch { return false; } })();
  let watcherGeneration = 0;

  function realtimeOwnsRoomSync(){
    try{return !!globalThis.__IGR_REALTIME__}catch{return false}
  }

  function secureIndex(size){
    if(size <= 1) return 0;
    try{
      if(globalThis.crypto?.getRandomValues){
        const limit = 256 - (256 % size);
        const byte = new Uint8Array(1);
        for(;;){
          crypto.getRandomValues(byte);
          if(byte[0] < limit) return byte[0] % size;
        }
      }
    }catch{}
    return Math.floor(Math.random() * size);
  }

  function secureRoomCode(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out='';
    for(let i=0;i<5;i++)out += chars[secureIndex(chars.length)];
    return out;
  }

  try{
    if(typeof newCode === 'function') newCode = secureRoomCode;
  }catch{}

  const baseSync = typeof syncNow === 'function' ? syncNow : null;
  if(baseSync){
    syncNow = async function(force=false){
      const result = await baseSync.call(this, force);
      try{
        window.dispatchEvent(new CustomEvent('igr:sync',{detail:{force:!!force,room:STATE?.room||null,at:Date.now()}}));
      }catch{}
      return result;
    };
  }

  function watcherDelay(){
    if(document.hidden) return 5000;
    const room = globalThis.STATE?.sync?.room;
    if(!room || globalThis.STATE?.view === 'lobby' || room.status === 'lobby') return 900;
    if(room.status === 'finished') return 3000;
    if(room.phase === 'interrogation') return 1050;
    if(room.phase === 'briefing' || room.phase === 'role_reading') return 1550;
    return 1250;
  }

  const baseStop = typeof stopRoomWatcher === 'function' ? stopRoomWatcher : null;
  if(baseStop){
    stopRoomWatcher = function(){
      watcherGeneration++;
      return baseStop.apply(this, arguments);
    };
  }

  if(typeof startRoomWatcher === 'function'){
    startRoomWatcher = function(){
      stopRoomWatcher?.();
      if(!globalThis.STATE?.room || !globalThis.STATE?.token) return;
      const generation = ++watcherGeneration;
      const schedule = (delay=watcherDelay()) => {
        if(generation !== watcherGeneration) return;
        STATE.watcher = setTimeout(async () => {
          if(generation !== watcherGeneration) return;
          try{ await syncNow(false); }catch{}
          if(generation === watcherGeneration) schedule();
        }, delay);
      };
      schedule(Math.min(450, watcherDelay()));
    };
  }

  // The v36 live-cell layer owns foreground/network reconciliation once loaded.
  // Keep these legacy handlers only as a fallback if that layer failed to initialize;
  // otherwise three different lifecycle modules can restart the same watcher at once.
  if(!nativeShell){
    document.addEventListener('visibilitychange',()=>{
      if(realtimeOwnsRoomSync())return;
      if(!document.hidden && globalThis.STATE?.room && globalThis.STATE?.token){
        syncNow?.(true).catch?.(()=>{});
        startRoomWatcher?.();
      }
    },{passive:true});
  }
  window.addEventListener('online',()=>{
    if(realtimeOwnsRoomSync())return;
    if(globalThis.STATE?.room && globalThis.STATE?.token){
      syncNow?.(true).catch?.(()=>{});
      startRoomWatcher?.();
    }
  },{passive:true});
})();
