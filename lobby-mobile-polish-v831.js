/* v831 — presentation-only lobby roster and session resume polish.
   Preserve real player actions: move existing controls rather than cloning them. */
(()=>{
 'use strict';
 if(window.IGR_MOBILE_POLISH_V831)return;
 const root=()=>document.getElementById('app');
 const getState=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
 let queued=false;
 function patchRoster(){
  const lobby=root()?.querySelector('.lobby-v11');
  if(!lobby)return;
  const lines=lobby.querySelectorAll('.player-list .player-line.lobby-player-live');
  for(const line of lines){
   let main=line.querySelector(':scope > .igr831-player-main');
   if(!main){
    const identity=line.querySelector(':scope > .player-ident');
    if(!identity)continue;
    main=document.createElement('div');
    main.className='igr831-player-main';
    line.insertBefore(main,identity);
    main.appendChild(identity);
   }
   let actions=line.querySelector(':scope > .igr831-player-actions');
   const movable=[...line.children].filter(node=>node!==main&&node!==actions);
   if(!actions&&movable.some(node=>node.matches?.('button,a'))){
    actions=document.createElement('div');
    actions.className='igr831-player-actions';
    line.appendChild(actions);
   }
   for(const node of movable){
    if(node.classList?.contains('igr829-presence-pill')){
     main.appendChild(node);
    }else if(node.matches?.('button,a')){
     actions?.appendChild(node);
    }
   }
   const badge=line.querySelector('.igr829-presence-pill');
   if(badge&&badge.parentElement!==main)main.appendChild(badge);
   const role=main.querySelector('.lobby-role-pending');
   if(role&&role.textContent.trim()==='Attribué au lancement'){
    role.textContent=window.IGR_LOCALE==='en'?'Role to assign':'Rôle à attribuer';
   }
  }
 }
 function protectExistingRoom(){
  const state=getState();
  if(!state?.room||!['lobby','briefing','role','game'].includes(state?.view))return;
  try{if(typeof INTRO!=='undefined'&&INTRO.active&&typeof hideIntroImmediately==='function')hideIntroImmediately()}catch(error){console.warn('[IGR v831] resume gate',error)}
 }
 function render(){
  patchRoster();
  protectExistingRoom();
 }
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;render()});
 }
 function boot(){
  const target=root();
  if(!target)return;
  new MutationObserver(schedule).observe(target,{subtree:true,childList:true});
  window.addEventListener('pageshow',()=>{protectExistingRoom();schedule()},{passive:true});
  document.addEventListener('visibilitychange',()=>{
   if(document.visibilityState==='visible'){protectExistingRoom();schedule()}
  },{passive:true});
  schedule();
 }
 window.IGR_MOBILE_POLISH_V831=Object.freeze({version:'831.0',patch:render});
 if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();
