/* Inside Grey Room — compact live phase controls.
   The existing game engine retains full ownership of timers, RPCs and actions. */
(()=>{
  'use strict';
  const original=window.mountLiveSessionControls;
  if(typeof original!=='function'||original.__igrMobileUx)return;
  function relocate(){
    const game=document.querySelector('#app .game-v11');
    if(!game)return;
    const host=game.querySelector(':scope > .phase-strip .phase-host-actions');
    const dock=document.querySelector('body > .live-session-controls');
    if(!host||!dock)return;
    const advance=dock.querySelector('#liveAdvanceBtn');
    if(advance)host.appendChild(advance); // Preserve its existing onclick and ID.
    /* The phase bar already contains the same fully functional Quitter action.
       Remove the duplicate bottom control but never touch other game modes. */
    dock.remove();
  }
  function patchedMount(...args){
    const result=original.apply(this,args);
    relocate();
    return result;
  }
  patchedMount.__igrMobileUx=true;
  window.mountLiveSessionControls=patchedMount;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',relocate,{once:true});
  else relocate();
})();
