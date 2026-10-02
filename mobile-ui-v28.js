/* Inside Grey Room v30 — utility navigation + universal role-choice presentation + theme isolation. */
(()=>{
'use strict';
const VERSION='30.0-prebeta-theme-isolation';
let queued=false;
const isFr=()=>window.IGR_LOCALE!=='en';
const currentView=()=>{try{return String(STATE?.view||'')}catch{return''}};

function goHomeSafe(){
  try{if(typeof window.goHome==='function')return window.goHome()}catch{}
  try{if(typeof goHome==='function')return goHome()}catch{}
  try{if(typeof STATE!=='undefined'){STATE.view='home';if(typeof renderHome==='function')renderHome()}}catch{}
}

function enhanceUtilityExit(){
  const view=currentView();
  if(!['profile','rules','join'].includes(view))return;
  const page=document.querySelector('#app .page');
  const head=page?.querySelector('.page-head');
  if(!head)return;

  let button=[...head.querySelectorAll('button,.btn,a')].find(el=>/accueil|\bhome\b|fermer|\bclose\b/i.test(el.textContent||''));
  if(!button){
    button=document.createElement('button');
    button.type='button';
    head.appendChild(button);
  }

  button.classList.add('igr-local-home','igr-utility-exit');
  button.classList.toggle('igr-profile-home',view==='profile');
  button.classList.toggle('igr-rules-close',view==='rules');
  button.classList.toggle('igr-join-home',view==='join');
  button.type='button';
  button.removeAttribute('onclick');

  const close=view==='rules';
  if(close){
    button.innerHTML=isFr()?'<span aria-hidden="true">×</span><b>Fermer</b>':'<span aria-hidden="true">×</span><b>Close</b>';
    button.setAttribute('aria-label',isFr()?'Fermer les règles et revenir à l’accueil':'Close rules and return home');
    button.setAttribute('title',isFr()?'Fermer':'Close');
  }else{
    button.innerHTML=isFr()?'<span aria-hidden="true">⌂</span><b>Accueil</b>':'<span aria-hidden="true">⌂</span><b>Home</b>';
    button.setAttribute('aria-label',isFr()?'Revenir à l’accueil':'Return home');
    button.setAttribute('title',isFr()?'Accueil':'Home');
  }

  if(button.dataset.igrV29Home!=='1'){
    button.dataset.igrV29Home='1';
    button.addEventListener('click',goHomeSafe);
  }
}

function normalizeChoiceStatus(){
  document.querySelectorAll('#app .role-choice-zone .igr-choice-status').forEach(card=>{
    card.classList.add('igr-choice-status-v29');
    const title=card.querySelector('.igr-choice-status-title');
    const button=card.querySelector('.igr-choice-status-button');
    const raw=String(title?.textContent||'').trim();
    const empty=!raw||/aucun\s+r[oô]le\s+choisi|no\s+role\s+(?:selected|chosen)/i.test(raw);
    card.dataset.igrChoiceState=empty?'empty':'chosen';
    card.classList.toggle('has-choice',!empty);
    if(button){
      button.textContent=isFr()?'Retirer':'Remove';
      button.setAttribute('aria-label',isFr()?'Retirer ce choix de rôle':'Remove this role choice');
      button.setAttribute('title',isFr()?'Retirer':'Remove');
    }
  });
}

function expectedDlcTheme(){
  try{
    const view=currentView();
    if(['home','profile','rules','join','create-list'].includes(view))return '';
    const id=String(view==='create-confirm'?(STATE?.selectedScenario||STATE?.scenarioId||''):(STATE?.sync?.room?.scenario_id||STATE?.selectedScenario||STATE?.scenarioId||''));
    const collection=window.IGR_SCENARIO_META?.[id]?.collection||'';
    return ['omerta','terror','cartel','regime'].includes(collection)?`igr-theme-${collection}`:'';
  }catch{return''}
}

function sanitizeThemeState(){
  const body=document.body;if(!body)return;
  const themes=['igr-theme-omerta','igr-theme-terror','igr-theme-cartel','igr-theme-regime'];
  const expected=expectedDlcTheme();
  if(expected){
    for(const theme of themes)body.classList.toggle(theme,theme===expected);
  }else if(['home','profile','rules','join','create-list'].includes(currentView())){
    for(const theme of themes)body.classList.remove(theme);
  }

  const omertaActive=body.classList.contains('igr-theme-omerta');
  if(!omertaActive){
    body.classList.remove('igr-omerta-active');
    document.querySelectorAll('.igr-omerta-cell').forEach(el=>el.classList.remove('igr-omerta-cell'));
  }
  const active=themes.find(theme=>body.classList.contains(theme))||'igr-theme-base';
  body.dataset.igrActiveTheme=active.replace('igr-theme-','');
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
  sanitizeThemeState();
  enhanceUtilityExit();
  normalizeChoiceStatus();
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
