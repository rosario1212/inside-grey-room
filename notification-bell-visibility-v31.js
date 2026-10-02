/* Inside Grey Room — notification bell visibility v31
   The bell belongs to the live match UI only. A saved/running room must never
   make it appear on Home, menus, lobby, profile, settings or end screens.
*/
(() => {
  const CLASS='igr-notification-bell-game-active';
  const ACTIVE_VIEWS=new Set(['briefing','role','game']);

  const style=document.createElement('style');
  style.id='igr-notification-bell-visibility-v31-style';
  style.textContent=`
    #igrNotifyBell.igr-notify-bell{
      display:none!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    body.${CLASS}:not(.home-locked) #igrNotifyBell.igr-notify-bell:not([hidden]){
      display:grid!important;
      visibility:visible!important;
      pointer-events:auto!important;
    }
    body.home-locked #igrNotifyBell.igr-notify-bell{
      display:none!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);

  function hasLiveMatchDom(){
    return !!document.querySelector('#app .live-session-controls');
  }

  function shouldShowBell(){
    try{
      if(document.body?.classList.contains('home-locked'))return false;
      if(typeof STATE==='undefined')return false;
      if(!STATE.room||!STATE.token)return false;
      const room=STATE.sync?.room;
      if(!room?.code)return false;
      if(String(room.status||'').toLowerCase()!=='playing')return false;
      if(!ACTIVE_VIEWS.has(String(STATE.view||'')))return false;
      return hasLiveMatchDom();
    }catch{return false}
  }

  let queued=false;
  function applyVisibility(){
    queued=false;
    const show=shouldShowBell();
    document.body?.classList.toggle(CLASS,show);
    const bell=document.getElementById('igrNotifyBell');
    if(!bell)return;
    bell.hidden=!show;
    bell.setAttribute('aria-hidden',show?'false':'true');
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(applyVisibility);
  }

  const app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  }
  if(document.body&&window.MutationObserver){
    new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});
  }
  window.addEventListener('pageshow',schedule);
  window.addEventListener('popstate',schedule);
  window.addEventListener('online',schedule);
  document.addEventListener('visibilitychange',schedule);
  setInterval(schedule,700);
  schedule();
})();
