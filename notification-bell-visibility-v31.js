/* Inside Grey Room — notification bell visibility v31
   Keep the notification bell out of menus/lobby/end screens and expose it only while a match is actively running.
*/
(() => {
  const CLASS='igr-notification-bell-game-active';
  const ACTIVE_VIEWS=new Set(['briefing','role','game']);

  const style=document.createElement('style');
  style.id='igr-notification-bell-visibility-v31-style';
  style.textContent=`
    #igrNotifyBell.igr-notify-bell{display:none!important}
    body.${CLASS} #igrNotifyBell.igr-notify-bell:not([hidden]){display:grid!important}
  `;
  document.head.appendChild(style);

  function shouldShowBell(){
    try{
      if(typeof STATE==='undefined')return false;
      const room=STATE.sync?.room;
      if(!room?.code)return false;
      const status=String(room.status||'').toLowerCase();
      if(status==='lobby'||status==='finished')return false;
      return ACTIVE_VIEWS.has(String(STATE.view||''));
    }catch{return false}
  }

  let queued=false;
  function applyVisibility(){
    queued=false;
    document.body?.classList.toggle(CLASS,shouldShowBell());
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
  window.addEventListener('pageshow',schedule);
  window.addEventListener('online',schedule);
  document.addEventListener('visibilitychange',schedule);
  setInterval(schedule,900);
  schedule();
})();
