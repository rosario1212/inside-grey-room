/* v836 — premium, calm, mobile-first live-game hierarchy.
 * Presentation only. No RPC calls, state writes, role changes or timer changes.
 * Original buttons remain mounted and bound to the same game actions.
 */
(()=>{
 'use strict';
 if(window.IGR_LIVE_SCREEN_V836)return;
 const english=()=>window.IGR_LOCALE==='en';
 const tr=(fr,en)=>english()?en:fr;
 const definitions={
  cycle:{fr:'Cycle',en:'Cycle',fullFr:'Cycle et actions',fullEn:'Cycle and actions',primary:true},
  investigation:{fr:'Enquête',en:'Investigation',fullFr:'Enquête et preuves',fullEn:'Investigation and evidence',primary:true},
  card:{fr:'Ma fiche',en:'My card',fullFr:'Ma fiche privée',fullEn:'My private card',primary:true},
  timeline:{fr:'Dossier',en:'Case file',fullFr:'Dossier commun',fullEn:'Shared case file'},
  channel:{fr:'Canal',en:'Channel',fullFr:'Canal et messages',fullEn:'Messages and channel'},
  video:{fr:'Flux',en:'Feed',fullFr:'Flux vidéo',fullEn:'Video feed'},
  rules:{fr:'Joueurs',en:'Players',fullFr:'Joueurs et état de la partie',fullEn:'Players and game status'}
 };
 const root=()=>document.getElementById('app');
 const state=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch(_){return window.STATE}};
 function navPatch(main){
  const nav=main.querySelector(':scope > .tabs-v11');
  if(!nav||nav.classList.contains('igr838-ready'))return;
  nav.classList.add('igr836-nav');
  nav.setAttribute('aria-label',tr('Navigation de la partie','Game navigation'));
  for(const button of nav.querySelectorAll(':scope > .tab[data-view]')){
   const def=definitions[button.dataset.view];
   if(!def)continue;
   button.classList.toggle('igr836-primary',!!def.primary);
   button.classList.toggle('igr836-secondary',!def.primary);
   const label=english()?def.en:def.fr;
   if(!button.children.length&&button.textContent!==label)button.textContent=label;
   const full=english()?def.fullEn:def.fullFr;
   if(button.getAttribute('aria-label')!==full)button.setAttribute('aria-label',full);
  }
 }
 function rolePatch(main){
  const tip=main.querySelector('#igr694RoleTip');
  let details=main.querySelector('#igr836RoleHelp');
  if(!tip){
   if(details&&!details.querySelector('#igr694RoleTip'))details.remove();
   return;
  }
  if(!details){
   details=document.createElement('details');
   details.id='igr836RoleHelp';
   details.className='igr836-role-help';
   const summary=document.createElement('summary');
   details.appendChild(summary);
   tip.before(details);
  }
  if(tip.parentElement!==details)details.appendChild(tip);
  const cycle=Number(state()?.sync?.room?.cycle)||1;
  const label=tr('Conseil de rôle · Cycle ','Role guidance · Cycle ')+cycle+'/3';
  const summary=details.querySelector(':scope > summary');
  if(summary&&summary.textContent!==label)summary.textContent=label;
 }
 function patch(){
  const main=root()?.querySelector('main.game-v11');
  if(!main)return;
  navPatch(main);
  rolePatch(main);
 }
 let scheduled=false;
 function queue(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;patch()});
 }
 function boot(){
  const app=root();
  if(!app)return;
  new MutationObserver(queue).observe(app,{childList:true,subtree:true});
  window.addEventListener('igr:sync',queue,{passive:true});
  window.addEventListener('pageshow',queue,{passive:true});
  queue();
 }
 window.IGR_LIVE_SCREEN_V836=Object.freeze({version:'836.0',patch});
 if(document.readyState==='complete')boot();
 else window.addEventListener('load',boot,{once:true});
})();
