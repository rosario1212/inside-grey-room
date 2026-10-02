/* Inside Grey Room v28 — mobile navigation behavior patch. */
(()=>{
'use strict';
const VERSION='28.0-mobile-ui-controls';
let queued=false;
const isFr=()=>window.IGR_LOCALE!=='en';

function goHomeSafe(){
  try{if(typeof window.goHome==='function')return window.goHome()}catch{}
  try{if(typeof goHome==='function')return goHome()}catch{}
  try{if(typeof STATE!=='undefined'){STATE.view='home';if(typeof renderHome==='function')renderHome()}}catch{}
}

function enhanceProfileHome(){
  const page=document.querySelector('#app .profile-page');
  if(!page)return;
  const head=page.querySelector('.page-head');
  if(!head)return;
  let button=head.querySelector('.igr-local-home,.igr-profile-home');
  if(!button){
    button=[...head.querySelectorAll('button,.btn,a')].find(el=>/accueil|\bhome\b/i.test(el.textContent||''));
  }
  if(!button)return;
  button.classList.add('igr-local-home','igr-profile-home');
  button.type='button';
  button.removeAttribute('onclick');
  button.innerHTML=isFr()?'<span aria-hidden="true">⌂</span><b>Accueil</b>':'<span aria-hidden="true">⌂</span><b>Home</b>';
  button.setAttribute('aria-label',isFr()?'Revenir à l’accueil':'Return home');
  button.setAttribute('title',isFr()?'Accueil':'Home');
  if(button.dataset.igrV28Home!=='1'){
    button.dataset.igrV28Home='1';
    button.addEventListener('click',goHomeSafe);
  }
}

function setFilterOpen(open){
  const nav=document.querySelector('#app .igr-scenario-filters');
  const button=document.getElementById('igrDockFilters');
  if(!nav||!button)return;
  nav.classList.toggle('is-dock-open',open);
  document.body.classList.toggle('igr-filter-dock-open',open);
  button.setAttribute('aria-expanded',String(open));
}

function installFixedFilters(){
  const current=document.getElementById('igrDockFilters');
  if(!current||current.dataset.igrV28Fixed==='1')return;

  /* Clone once to discard the anonymous drag listeners installed by v27.
     The compatibility flag prevents the old controller from re-attaching them. */
  const button=current.cloneNode(true);
  button.dataset.igrV28Fixed='1';
  button.dataset.igrDraggable='1';
  button.dataset.igrV24Click='1';
  button.removeAttribute('data-igr-dragged');
  button.classList.remove('is-dragging');
  button.style.removeProperty('left');
  button.style.removeProperty('right');
  button.style.removeProperty('top');
  button.style.removeProperty('bottom');
  button.style.removeProperty('transform');

  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    const nav=document.querySelector('#app .igr-scenario-filters');
    if(!nav)return;
    setFilterOpen(!nav.classList.contains('is-dock-open'));
  });
  current.replaceWith(button);
}

function clearLegacyFilterPosition(){
  try{
    const key='igr_quick_nav_positions_v20';
    const value=JSON.parse(localStorage.getItem(key)||'{}')||{};
    if(Object.prototype.hasOwnProperty.call(value,'filters')){
      delete value.filters;
      localStorage.setItem(key,JSON.stringify(value));
    }
  }catch{}
}

function apply(){
  enhanceProfileHome();
  installFixedFilters();
  clearLegacyFilterPosition();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
}
function boot(){
  apply();
  const root=document.getElementById('app');
  if(root&&window.MutationObserver)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
}
window.IGR_MOBILE_UI_V28=Object.freeze({version:VERSION,refresh:schedule});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
