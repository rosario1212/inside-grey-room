/* Inside Grey Room v27 — fixed Home controls + scoped low-churn navigation. */
(()=>{
'use strict';
const VERSION='27.0-role-choice-nav';
const POS_KEY='igr_quick_nav_positions_v20';
let queued=false,scrollTimer=0;
const isFr=()=>window.IGR_LOCALE!=='en';
const currentView=()=>{try{return String(STATE?.view||'')}catch{return''}};
const app=()=>document.getElementById('app');
function isHome(){
  if(currentView()==='home')return true;
  const root=app();if(!root)return false;
  return !!root.querySelector('.home-actions-v10-13,.home-actions,.igr-home-create,.igr-home-join,.heritage-premium-home-action');
}
function isProfile(){return currentView()==='profile'||!!document.querySelector('#app .profile-page,#app .profile-v12,#app [data-page="profile"]')}
function scenarioPage(){
  return document.querySelector('#app .page-create-v10-13')||
    (currentView()==='create-list'?document.querySelector('#app main,#app .page'):null);
}
function dockAllowed(){return !!scenarioPage()||isProfile()}
function readPositions(){try{return JSON.parse(localStorage.getItem(POS_KEY)||'{}')||{}}catch{return{}}}
function writePositions(value){try{localStorage.setItem(POS_KEY,JSON.stringify(value||{}))}catch{}}
function writePosition(key,value){try{const all=readPositions();all[key]=value;writePositions(all)}catch{}}
function forgetHomePosition(){try{const all=readPositions();if(Object.prototype.hasOwnProperty.call(all,'home')){delete all.home;writePositions(all)}}catch{}}
function clearInlinePosition(btn){if(!btn)return;btn.style.left='';btn.style.right='';btn.style.top='';btn.style.bottom=''}
function restorePosition(btn,key){
  if(!btn)return;const p=readPositions()[key];if(!p||typeof p.x!=='number'||typeof p.y!=='number'){clearInlinePosition(btn);return}
  const w=btn.offsetWidth||120,h=btn.offsetHeight||48,maxX=Math.max(12,innerWidth-w-12),maxY=Math.max(12,innerHeight-h-12);
  btn.style.right='auto';btn.style.bottom='auto';btn.style.left=`${Math.round(12+p.x*(maxX-12))}px`;btn.style.top=`${Math.round(12+p.y*(maxY-12))}px`;
}
function makeDraggable(btn,key){
  if(!btn||btn.dataset.igrDraggable==='1')return;btn.dataset.igrDraggable='1';
  let start=null,moved=false;
  btn.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;const r=btn.getBoundingClientRect();start={x:e.clientX,y:e.clientY,left:r.left,top:r.top,width:r.width,height:r.height};moved=false;btn.setPointerCapture?.(e.pointerId);btn.classList.add('is-dragging')});
  btn.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;const w=start.width||48,h=start.height||48;const left=Math.max(12,Math.min(innerWidth-w-12,start.left+dx));const top=Math.max(12,Math.min(innerHeight-h-12,start.top+dy));btn.style.right='auto';btn.style.bottom='auto';btn.style.left=`${left}px`;btn.style.top=`${top}px`});
  const end=()=>{if(!start)return;const r=btn.getBoundingClientRect(),maxX=Math.max(12,innerWidth-r.width-12),maxY=Math.max(12,innerHeight-r.height-12);const x=maxX<=12?0:(r.left-12)/(maxX-12),y=maxY<=12?0:(r.top-12)/(maxY-12);writePosition(key,{x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))});btn.dataset.igrDragged=moved?'1':'0';btn.classList.remove('is-dragging');start=null;setTimeout(()=>{btn.dataset.igrDragged='0'},100)};
  btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);
}
function settingsLike(el){
  if(!el)return false;
  const text=(el.textContent||'').trim();
  const signature=[el.id,typeof el.className==='string'?el.className:'',el.getAttribute?.('onclick'),el.getAttribute?.('aria-label'),el.getAttribute?.('title')].filter(Boolean).join(' ');
  return text==='⚙'||/openSettings|paramètres|settings|igr.?top.?settings|settings.?button|settings.?fab/i.test(signature);
}
function ensureTopSettings(){
  const topbar=document.querySelector('#app .topbar');if(!topbar)return;
  let actions=topbar.querySelector('.top-actions');
  if(!actions){actions=document.createElement('div');actions.className='top-actions';topbar.appendChild(actions)}
  let btn=actions.querySelector('#igrTopSettings');
  if(!btn){
    btn=[...actions.querySelectorAll('button,[role="button"],a')].find(settingsLike)||document.createElement('button');
    if(btn.parentElement!==actions)actions.appendChild(btn);
  }
  btn.type='button';btn.id='igrTopSettings';btn.className='pill-btn igr-top-settings';
  if(btn.innerHTML!=='<span aria-hidden="true">⚙</span>')btn.innerHTML='<span aria-hidden="true">⚙</span>';
  btn.setAttribute('aria-label',isFr()?'Paramètres':'Settings');
  btn.setAttribute('title',isFr()?'Paramètres':'Settings');
  if(btn.dataset.igrSettingsBound!=='1'){
    btn.dataset.igrSettingsBound='1';
    btn.removeAttribute('onclick');
    btn.addEventListener('click',()=>{try{if(typeof openSettings==='function')openSettings();else window.openSettings?.()}catch{try{window.openSettings?.()}catch{}}});
  }
  const candidates=[...topbar.querySelectorAll('button,[role="button"],a')];
  for(const el of candidates){if(el!==btn&&settingsLike(el))el.remove()}
  for(const el of [...topbar.querySelectorAll('span')]){
    if(el.closest('#igrTopSettings'))continue;
    if((el.textContent||'').trim()!=='⚙')continue;
    const clickable=el.closest('button,[role="button"],a');
    if(clickable&&clickable!==btn)clickable.remove();else el.remove();
  }
}
function closeFilters(){
  const nav=document.querySelector('#app .igr-scenario-filters');nav?.classList.remove('is-dock-open');document.body.classList.remove('igr-filter-dock-open');document.getElementById('igrDockFilters')?.setAttribute('aria-expanded','false');
}
function clearDockState(){
  closeFilters();
  document.getElementById('igrUniversalDock')?.remove();
  document.body.classList.remove('igr-global-dock-active','igr-dock-scrolling','igr-scenario-browser','igr-profile-view');
}
function ensureDock(){
  const home=isHome(),page=scenarioPage(),profile=isProfile(),allowed=!!page||profile;
  document.body.classList.toggle('igr-at-home',home);
  document.body.classList.toggle('igr-scenario-browser',!!page&&!home);
  document.body.classList.toggle('igr-profile-view',profile&&!home);
  if(home||!allowed){clearDockState();return}
  const dock=document.getElementById('igrUniversalDock');if(!dock)return;
  const homeBtn=dock.querySelector('#igrDockHome'),filters=dock.querySelector('#igrDockFilters');

  /* Accueil is deliberately fixed at the bottom-right. Old persisted drag
     coordinates are discarded so an earlier build cannot move it again. */
  if(homeBtn){
    homeBtn.hidden=false;
    homeBtn.removeAttribute('data-igr-draggable');
    homeBtn.removeAttribute('data-igr-dragged');
    homeBtn.classList.remove('is-dragging');
    clearInlinePosition(homeBtn);
    forgetHomePosition();
  }
  const nav=page?document.querySelector('#app .igr-scenario-filters'):null;
  if(filters){filters.hidden=!nav;if(nav){makeDraggable(filters,'filters');restorePosition(filters,'filters')}else clearInlinePosition(filters)}
  if(nav)nav.classList.add('igr-filter-dock-panel');else closeFilters();
  document.body.classList.toggle('igr-global-dock-active',!!homeBtn||!!nav);
}
function bindDockClicks(){
  const filters=document.getElementById('igrDockFilters');
  if(filters&&!filters.dataset.igrV24Click){filters.dataset.igrV24Click='1';filters.addEventListener('click',e=>{if(filters.dataset.igrDragged==='1'){e.preventDefault();e.stopImmediatePropagation()}},true)}
}
function apply(){ensureTopSettings();ensureDock();bindDockClicks()}
function schedule(){
  const allowed=dockAllowed(),home=isHome(),dock=document.getElementById('igrUniversalDock');
  if(!home&&!allowed&&!dock)return;
  if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()});
}
function onScroll(){
  if(isHome()||(!scenarioPage()&&!isProfile()))return;
  document.body.classList.add('igr-dock-scrolling');
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>document.body.classList.remove('igr-dock-scrolling'),360);
}
function boot(){
  forgetHomePosition();
  apply();const root=app();if(root&&window.MutationObserver){new MutationObserver(schedule).observe(root,{childList:true,subtree:true})}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('click',e=>{if(isHome())return;const nav=document.querySelector('.igr-filter-dock-panel.is-dock-open');if(nav&&!nav.contains(e.target)&&!e.target.closest?.('#igrDockFilters'))closeFilters()});
}
window.IGR_NAV_HERITAGE_V24=Object.freeze({version:VERSION,refresh:schedule});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
