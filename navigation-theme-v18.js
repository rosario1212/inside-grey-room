/* Inside Grey Room v26 — scoped navigation, play-mode theme continuity and low-churn UI refresh. */
(()=>{
'use strict';
const VERSION='26.0-role-panel-mode-theme';
const LOCAL_KEY='igr_local_standard_v13_8';
const LOCAL_THEME_CLASSES=['igr-local-theme-normal','igr-local-theme-omerta','igr-local-theme-terror','igr-local-theme-cartel','igr-local-theme-regime','igr-local-theme-cendres','igr-local-theme-kuroi'];
let applying=false,queued=false;

const isFr=()=>window.IGR_LOCALE!=='en';
const store=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
function readLocal(){try{return JSON.parse(store().getItem(LOCAL_KEY)||'null')}catch{return null}}
function selectedScenario(){try{return String(STATE?.selectedScenario||STATE?.sync?.room?.scenario_id||'')}catch{return''}}
function currentView(){try{return String(STATE?.view||'')}catch{return''}}
function appReady(){
  const app=document.getElementById('app');
  if(!app||!app.children.length)return false;
  const gate=document.getElementById('introGate');
  if(gate&&gate.getAttribute('aria-hidden')!=='true'&&!gate.classList.contains('done'))return false;
  return true;
}
function isHome(){return currentView()==='home'||!!document.querySelector('#app .home-v10-13,#app .home-actions-v10-13,#app .home-actions')}
function isProfile(){return currentView()==='profile'||!!document.querySelector('#app .profile-page,#app .profile-v12,#app [data-page="profile"]')}
function scenarioPage(){return document.querySelector('#app .page-create-v10-13')}
function dockAllowed(){return !isHome()&&(!!scenarioPage()||isProfile())}
function closeFilters(){
  const nav=document.querySelector('.page-create-v10-13 .igr-scenario-filters');
  nav?.classList.remove('is-dock-open');
  document.body.classList.remove('igr-filter-dock-open');
  const btn=document.getElementById('igrDockFilters');
  btn?.setAttribute('aria-expanded','false');
}
function goHomeSafe(){
  closeFilters();
  try{if(typeof window.goHome==='function')return window.goHome()}catch{}
  try{if(typeof goHome==='function')return goHome()}catch{}
  try{if(typeof STATE!=='undefined'){STATE.view='home';if(typeof renderHome==='function')renderHome()}}catch{}
}
function toggleFilters(){
  const nav=document.querySelector('.page-create-v10-13 .igr-scenario-filters');if(!nav)return;
  const open=!nav.classList.contains('is-dock-open');
  nav.classList.toggle('is-dock-open',open);
  document.body.classList.toggle('igr-filter-dock-open',open);
  document.getElementById('igrDockFilters')?.setAttribute('aria-expanded',String(open));
}
function ensureDock(){
  document.getElementById('igrGlobalHome')?.remove();
  document.getElementById('igrScenarioExit')?.remove();
  document.getElementById('igrFilterFab')?.remove();
  let dock=document.getElementById('igrUniversalDock');
  if(!appReady()||!dockAllowed()){
    if(dock)dock.remove();
    document.body.classList.remove('igr-global-dock-active');
    closeFilters();
    return;
  }
  if(!dock){
    dock=document.createElement('nav');dock.id='igrUniversalDock';dock.className='igr-universal-dock';dock.setAttribute('aria-label',isFr()?'Navigation rapide':'Quick navigation');
    const filters=document.createElement('button');filters.id='igrDockFilters';filters.type='button';filters.className='igr-dock-pill igr-dock-filters';filters.setAttribute('aria-expanded','false');filters.addEventListener('click',event=>{event.stopPropagation();toggleFilters()});
    const home=document.createElement('button');home.id='igrDockHome';home.type='button';home.className='igr-dock-pill igr-dock-home';home.addEventListener('click',goHomeSafe);
    dock.append(filters,home);document.body.appendChild(dock);
  }
  const home=dock.querySelector('#igrDockHome'),filters=dock.querySelector('#igrDockFilters');
  if(home){home.innerHTML=isFr()?'<span aria-hidden="true">⌂</span><b>Accueil</b>':'<span aria-hidden="true">⌂</span><b>Home</b>';home.setAttribute('aria-label',isFr()?'Revenir à l’accueil':'Return home');home.hidden=false}
  const filterNav=scenarioPage()?.querySelector('.igr-scenario-filters')||null;
  if(filters){filters.innerHTML=isFr()?'<span aria-hidden="true">☷</span><b>Filtres</b>':'<span aria-hidden="true">☷</span><b>Filters</b>';filters.setAttribute('aria-label',isFr()?'Ouvrir les filtres':'Open filters');filters.hidden=!filterNav}
  if(filterNav)filterNav.classList.add('igr-filter-dock-panel');
  document.body.classList.add('igr-global-dock-active');
  if(!filterNav)closeFilters();
}
function themeFromId(id){
  const n=Number(id);
  if(n>=21&&n<=25)return'omerta';
  if(n>=26&&n<=28)return'terror';
  if(n>=29&&n<=31)return'cartel';
  if(n>=32&&n<=34)return'regime';
  return'normal';
}
function resolveLocalScenarioId(local){
  let id=selectedScenario();
  if(/^0\d\d$/.test(id))return id;
  const saved=readLocal();id=String(saved?.scenarioId||'');if(/^0\d\d$/.test(id))return id;
  const text=local?.textContent||'';const match=text.match(/\bDOSSIER\s+(0\d\d)\b/i);return match?.[1]||'';
}
function applyLocalTheme(){
  const body=document.body;if(!body)return;
  const local=document.querySelector('#app .localplay');
  const cendres=document.querySelector('#app .hplay-theme-cendres');
  const kuroi=document.querySelector('#app .hplay-theme-kuroi');
  let theme='';
  if(local)theme=themeFromId(resolveLocalScenarioId(local));
  else if(cendres)theme='cendres';
  else if(kuroi)theme='kuroi';
  const current=body.dataset.igrLocalTheme||'';
  if(current===theme){
    if(local&&theme&&local.getAttribute('data-igr-local-theme')!==theme)local.setAttribute('data-igr-local-theme',theme);
    return;
  }
  body.classList.remove(...LOCAL_THEME_CLASSES);
  body.removeAttribute('data-igr-local-theme');
  if(!theme)return;
  body.classList.add(`igr-local-theme-${theme}`);body.dataset.igrLocalTheme=theme;
  local?.setAttribute('data-igr-local-theme',theme);
}
function setModeTheme(node,theme){
  if(!node)return;
  if(node.dataset.igrModeTheme!==theme)node.dataset.igrModeTheme=theme;
}
function applyModeChooserTheme(){
  const standardCards=[...document.querySelectorAll('#app .dual-mode-card')];
  if(standardCards.length){
    const theme=themeFromId(selectedScenario());
    standardCards.forEach(card=>setModeTheme(card,theme));
    setModeTheme(standardCards[0]?.closest('.dual-mode-chooser'),theme);
  }
  const heritageButtons=[...document.querySelectorAll('#app .heritage-local-btn,#app .heritage-online-btn')];
  if(heritageButtons.length){
    const shell=heritageButtons[0]?.closest('.hplay-theme-cendres,.hplay-theme-kuroi');
    const theme=shell?.classList.contains('hplay-theme-kuroi')?'kuroi':'cendres';
    heritageButtons.forEach(button=>setModeTheme(button,theme));
    setModeTheme(heritageButtons[0]?.closest('.heritage-dual-row'),theme);
  }
}
function apply(){if(applying)return;applying=true;try{ensureDock();applyLocalTheme();applyModeChooserTheme()}finally{applying=false}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
function boot(){
  apply();
  const app=document.getElementById('app');if(app&&window.MutationObserver){const observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true,attributes:false})}
  document.addEventListener('click',event=>{const nav=document.querySelector('.igr-filter-dock-panel.is-dock-open');if(nav&&!nav.contains(event.target)&&!event.target.closest?.('#igrDockFilters'))closeFilters()});
  document.addEventListener('focusin',event=>{if(event.target?.matches?.('input,textarea,select,[contenteditable="true"]'))document.body.classList.add('igr-dock-keyboard')});
  document.addEventListener('focusout',()=>setTimeout(()=>{if(!document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]'))document.body.classList.remove('igr-dock-keyboard')},50));
  window.addEventListener('pageshow',schedule,{passive:true});window.addEventListener('focus',schedule,{passive:true});
}
window.IGR_NAV_THEME_V18=Object.freeze({version:VERSION,refresh:schedule,home:goHomeSafe});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
