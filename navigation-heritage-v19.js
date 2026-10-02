/* Inside Grey Room v19 — home-safe dock, draggable quick navigation, stable top settings and Heritage polish. */
(()=>{
'use strict';
const VERSION='19.0-nav-heritage';
const POS_KEY='igr_quick_nav_positions_v19';
let queued=false,scrollTimer=0;
const isFr=()=>window.IGR_LOCALE!=='en';
const currentView=()=>{try{return String(STATE?.view||'')}catch{return''}};
const app=()=>document.getElementById('app');
function isHome(){
  if(currentView()==='home')return true;
  const root=app();if(!root)return false;
  return !!root.querySelector('.home-actions-v10-13,.home-actions,.igr-home-create,.igr-home-join,.heritage-premium-home-action');
}
function scenarioPage(){return document.querySelector('#app .page-create-v10-13')}
function readPositions(){try{return JSON.parse(localStorage.getItem(POS_KEY)||'{}')||{}}catch{return{}}}
function writePosition(key,value){try{const all=readPositions();all[key]=value;localStorage.setItem(POS_KEY,JSON.stringify(all))}catch{}}
function clearInlinePosition(btn){if(!btn)return;btn.style.left='';btn.style.right='';btn.style.top='';btn.style.bottom=''}
function restorePosition(btn,key){
  if(!btn)return;const p=readPositions()[key];if(!p||typeof p.x!=='number'||typeof p.y!=='number'){clearInlinePosition(btn);return}
  const w=btn.offsetWidth||120,h=btn.offsetHeight||48,maxX=Math.max(12,innerWidth-w-12),maxY=Math.max(12,innerHeight-h-12);
  btn.style.right='auto';btn.style.bottom='auto';btn.style.left=`${Math.round(12+p.x*(maxX-12))}px`;btn.style.top=`${Math.round(12+p.y*(maxY-12))}px`;
}
function makeDraggable(btn,key){
  if(!btn||btn.dataset.igrDraggable==='1')return;btn.dataset.igrDraggable='1';
  let start=null,moved=false;
  btn.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;const r=btn.getBoundingClientRect();start={x:e.clientX,y:e.clientY,left:r.left,top:r.top};moved=false;btn.setPointerCapture?.(e.pointerId);btn.classList.add('is-dragging')});
  btn.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;const w=btn.offsetWidth||r?.width||48,h=btn.offsetHeight||48;const left=Math.max(12,Math.min(innerWidth-w-12,start.left+dx));const top=Math.max(12,Math.min(innerHeight-h-12,start.top+dy));btn.style.right='auto';btn.style.bottom='auto';btn.style.left=`${left}px`;btn.style.top=`${top}px`});
  const end=e=>{if(!start)return;const r=btn.getBoundingClientRect(),maxX=Math.max(12,innerWidth-r.width-12),maxY=Math.max(12,innerHeight-r.height-12);const x=maxX<=12?0:(r.left-12)/(maxX-12),y=maxY<=12?0:(r.top-12)/(maxY-12);writePosition(key,{x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))});btn.dataset.igrDragged=moved?'1':'0';btn.classList.remove('is-dragging');start=null;setTimeout(()=>{btn.dataset.igrDragged='0'},80)};
  btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',end);
}
function ensureTopSettings(){
  document.getElementById('igrGlobalHome')?.remove();
  const topbar=document.querySelector('#app .topbar');if(!topbar)return;
  let actions=topbar.querySelector('.top-actions');if(!actions){actions=document.createElement('div');actions.className='top-actions';topbar.appendChild(actions)}
  const candidates=[...actions.querySelectorAll('button')].filter(b=>/openSettings/.test(b.getAttribute('onclick')||'')||/paramètres|settings/i.test(b.textContent||''));
  let btn=candidates[0]||document.getElementById('igrTopSettings');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.id='igrTopSettings';btn.addEventListener('click',()=>{try{openSettings()}catch{try{window.openSettings?.()}catch{}}});actions.appendChild(btn)}
  for(const extra of candidates.slice(1))extra.remove();
  btn.id='igrTopSettings';btn.classList.add('pill-btn','igr-top-settings');btn.innerHTML='<span aria-hidden="true">⚙</span>';btn.setAttribute('aria-label',isFr()?'Paramètres':'Settings');btn.setAttribute('title',isFr()?'Paramètres':'Settings');
}
function closeFilters(){
  const nav=scenarioPage()?.querySelector('.igr-scenario-filters');nav?.classList.remove('is-dock-open');document.body.classList.remove('igr-filter-dock-open');document.getElementById('igrDockFilters')?.setAttribute('aria-expanded','false');
}
function ensureDock(){
  const home=isHome(),page=scenarioPage();document.body.classList.toggle('igr-at-home',home);document.body.classList.toggle('igr-scenario-browser',!!page&&!home);
  let dock=document.getElementById('igrUniversalDock');
  if(home){closeFilters();dock?.remove();document.body.classList.remove('igr-global-dock-active');return}
  if(!dock)return;
  const homeBtn=dock.querySelector('#igrDockHome'),filters=dock.querySelector('#igrDockFilters');
  if(homeBtn){homeBtn.hidden=false;makeDraggable(homeBtn,'home');restorePosition(homeBtn,'home')}
  const nav=page?.querySelector('.igr-scenario-filters');
  if(filters){filters.hidden=!nav;if(nav){makeDraggable(filters,'filters');restorePosition(filters,'filters')}else clearInlinePosition(filters)}
  if(nav)nav.classList.add('igr-filter-dock-panel');else closeFilters();
  document.body.classList.toggle('igr-global-dock-active',!!homeBtn||!!nav);
}
function bindDockClicks(){
  const home=document.getElementById('igrDockHome'),filters=document.getElementById('igrDockFilters');
  if(home&&!home.dataset.igrV19Click){home.dataset.igrV19Click='1';home.addEventListener('click',e=>{if(home.dataset.igrDragged==='1'){e.preventDefault();e.stopImmediatePropagation();return}} ,true)}
  if(filters&&!filters.dataset.igrV19Click){filters.dataset.igrV19Click='1';filters.addEventListener('click',e=>{if(filters.dataset.igrDragged==='1'){e.preventDefault();e.stopImmediatePropagation();return}},true)}
}
function apply(){ensureTopSettings();ensureDock();bindDockClicks()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}
function onScroll(){if(!scenarioPage()||isHome())return;document.body.classList.add('igr-dock-scrolling');clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>document.body.classList.remove('igr-dock-scrolling'),360)}
function boot(){
  apply();const root=app();if(root&&window.MutationObserver){new MutationObserver(schedule).observe(root,{childList:true,subtree:true})}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('click',e=>{if(isHome())return;const nav=document.querySelector('.igr-filter-dock-panel.is-dock-open');if(nav&&!nav.contains(e.target)&&!e.target.closest?.('#igrDockFilters'))closeFilters()});
}
window.IGR_NAV_HERITAGE_V19=Object.freeze({version:VERSION,refresh:schedule});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
