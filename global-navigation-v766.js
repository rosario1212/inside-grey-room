/* Inside Grey Room v766 — shared navigation contract for base, DLC and Héritage. */
(()=>{
'use strict';
const VERSION='766.0-global-navigation';
const root=()=>document.getElementById('app');
const $=(q,p=document)=>p?.querySelector?.(q)||null;
let lastRoute='',returnRoute='',scheduled=false;
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ');
function baseView(){try{return typeof STATE!=='undefined'?String(STATE?.view||''):''}catch{return''}}
function scenarioId(){try{return String(STATE?.selectedScenario||'')}catch{return''}}
function currentRoute(){
 const app=root();if(!app)return '';
 const main=$('main',app);
 if(!main)return $('.home,.home-v10-13',app)?'home':'';
 if(main.matches('.hplay-hub'))return 'heritage:hub';
 if(main.matches('.hplay-campaign'))return 'heritage:campaign:'+([...main.classList].find(c=>c.startsWith('hplay-theme-'))||'');
 if(main.matches('.hplay-dossier'))return 'heritage:dossier:'+([...main.classList].find(c=>c.startsWith('hplay-theme-'))||'')+':'+normalize($('.hplay-mode',main)?.textContent);
 if(main.matches('.hplay-setup'))return 'heritage:setup';
 if(main.matches('.hplay-reveal,.hplay-session,.hplay-decision,.hplay-result'))return 'heritage:game:'+([...main.classList].find(c=>/^hplay-(reveal|session|decision|result)$/.test(c))||'');
 if(main.matches('.hnet')){
  if($('.hnet-lobby',main))return 'heritage:online:lobby';
  if($('.hnet-create',main))return 'heritage:online:create';
  return 'heritage:online:other';
 }
 if(main.matches('.casino-live')){
  if($('.casino-lobby-top',main))return 'casino:lobby';
  if($('.casino-entry-options',main))return 'casino:entry';
  return 'casino:play:'+normalize($('.casino-tabs [aria-selected="true"]',main)?.textContent);
 }
 if(main.matches('.casino-page'))return 'casino:'+String(main.dataset.casinoPage||'campaign');
 if(main.matches('.page-create-v10-13'))return 'scenarios:list';
 if(main.matches('.page-confirm-v10-13'))return 'scenarios:dossier:'+scenarioId();
 if($('.lobby-v11,.page-lobby',main))return 'base:lobby';
 if(main.matches('.game-v11'))return 'base:game:'+(baseView()==='game'?String((typeof STATE!=='undefined'&&STATE.tab)||'game'):'game');
 if(main.matches('.profile-page'))return 'profile';
 if(main.matches('.localplay')){
  const stage=[...main.classList].filter(c=>c.startsWith('local-')).join('.');
  return 'local:'+stage;
 }
 if($('#joinCode',main))return 'join';
 if(baseView()==='rules')return 'rules';
 if(baseView()==='briefing'||baseView()==='role')return 'base:'+baseView();
 const key=normalize($('.page-head .kicker',main)?.textContent||'');
 const mainClass=[...main.classList].filter(c=>c!=='page').join('.');
 return 'page:'+mainClass+':'+key;
}
function noSmoothTop(){
 const html=document.documentElement,prior=html.style.scrollBehavior;
 html.style.scrollBehavior='auto';
 try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch{window.scrollTo(0,0)}
 html.style.scrollBehavior=prior;
}
function isLive(route){return /^(base:game|base:role|base:lobby|heritage:game|heritage:online:lobby|casino:lobby|casino:play)/.test(route)}
function routeChanged(){
 const next=currentRoute();
 if(!next||next===lastRoute)return;
 const old=lastRoute;lastRoute=next;
 if(!old)return;
 // A deliberate return to the selected scenario retains that list position.
 const restoringScenarios=next==='scenarios:list'&&(old.startsWith('scenarios:dossier:')||old==='base:lobby'||old.startsWith('local:'));
 if(!restoringScenarios)noSmoothTop();
 if(old!=='join'&&next==='join')returnRoute=old;
 if(old==='join'&&next!=='join')returnRoute='';
 // A room refresh may repaint a different title without changing this route.
}
function navigateTo(route){
 if(!route)return false;
 try{
  if(route==='home'&&typeof goHome==='function'){goHome();return true}
  if(route==='scenarios:list'&&typeof goCreate==='function'){goCreate();return true}
  if(route.startsWith('scenarios:dossier:')&&typeof backToScenarioList==='function'){backToScenarioList();return true}
  if(route==='heritage:hub'&&window.IGR_HERITAGE_PLAY?.open){window.IGR_HERITAGE_PLAY.open();return true}
  if(route.startsWith('heritage:campaign:')){
   const id=route.match(/hplay-theme-(cendres|kuroi|maitre)/)?.[1];
   if(id==='maitre'&&window.IGR_HERITAGE_MAITRE?.open){window.IGR_HERITAGE_MAITRE.open();return true}
   if(id&&window.IGR_HERITAGE_PLAY?.openCampaign){window.IGR_HERITAGE_PLAY.openCampaign(id);return true}
  }
 }catch(err){console.warn('[IGR Navigation] return',err)}
 return false;
}
function addBackWhereMissing(){
 const app=root(),main=$('main',app);if(!main||isLive(lastRoute))return;
 // The campaign navigation and private game navigation own their back paths.
 if(main.matches('.hplay,.hnet,.casino-live,.casino-page,.localplay'))return;
 const head=$('.page-head',main);
 if(!head)return;
 const present=$('button[data-igr-global-back]',head);
 if(present)return;
 if($('#joinCode',main)){
  // Héritage has an even more specific return path; do not duplicate it.
  if($('button[data-hj-return]',head))return;
  const home=$('button[onclick*="goHome"]',head);
  if(home){
   home.dataset.igrGlobalBack='1';
   home.removeAttribute('onclick');
   home.textContent='← Retour';
   home.setAttribute('aria-label','Revenir à la page précédente');
  }
  return;
 }
 // A self-contained information screen without a navigation action may need
 // a return, but never add one to the active game or room controls.
 const anyBack=$('button[onclick*="goHome"],button[onclick*="backTo"],button[onclick*="leaveRoom"],button[class*="back"],a[href]',head);
 if(anyBack||!lastRoute||lastRoute==='home')return;
 if(!['profile','rules'].includes(lastRoute)&&!lastRoute.startsWith('page:'))return;
 const button=document.createElement('button');
 button.type='button';button.className='btn ghost small igr-global-return';
 button.dataset.igrGlobalBack='1';button.textContent='← Retour';
 head.appendChild(button);
}
function handleBack(e){
 const button=e.target.closest?.('[data-igr-global-back]');
 if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 const origin=returnRoute;returnRoute='';
 if(navigateTo(origin))return;
 if(typeof goHome==='function')goHome();
}
function scan(){
 scheduled=false;
 routeChanged();
 addBackWhereMissing();
}
function queueScan(){
 if(scheduled)return;scheduled=true;
 // Mutation observers already run before the next paint. A microtask avoids
 // an extra frame and prevents users from seeing the wrong scroll position.
 queueMicrotask(scan);
}
function boot(){
 const app=root();if(!app)return;
 lastRoute=currentRoute();
 document.addEventListener('click',handleBack,true);
 new MutationObserver(mutations=>{
  if(!mutations.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))return;
  queueScan();
 }).observe(app,{subtree:true,childList:true});
 queueScan();
 window.addEventListener('pageshow',queueScan,{passive:true});
}
window.IGR_GLOBAL_NAV_V766=Object.freeze({version:VERSION,currentRoute});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();