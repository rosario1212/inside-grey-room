/* Inside Grey Room v16 — compact home + utility navigation controller. */
(()=>{
'use strict';
const isFr=()=>window.IGR_LOCALE!=='en';
const utilityViews=new Set(['create-list','create-confirm','join','rules','profile']);

function currentView(){
  try{return typeof STATE!=='undefined'?String(STATE?.view||''):''}catch{return''}
}

function markHomeActions(){
  const actions=document.querySelector('.home-actions-v10-13,.home-actions');
  if(!actions)return;
  for(const el of actions.querySelectorAll('.home-action')){
    const text=(el.textContent||'').toLowerCase();
    el.classList.toggle('igr-home-create',/créer une partie|create a game/.test(text));
    el.classList.toggle('igr-home-join',/rejoindre une partie|join a game/.test(text));
    el.classList.toggle('igr-home-rules',/règles du jeu|game rules/.test(text));
    el.classList.toggle('igr-home-profile',/profil|profile/.test(text));
  }
}

function callHome(){
  try{if(typeof window.goHome==='function')return window.goHome()}catch{}
  try{if(typeof goHome==='function')return goHome()}catch{}
}

function organizeUtilityNavigation(){
  const view=currentView();
  const enabled=utilityViews.has(view);
  document.documentElement.classList.toggle('igr-has-global-home',enabled);
  document.body.classList.toggle('igr-has-global-home',enabled);

  const topbar=document.querySelector('#app .topbar');
  const actions=topbar?.querySelector('.top-actions');
  if(topbar)topbar.classList.toggle('igr-utility-topbar',enabled);

  let globalHome=document.getElementById('igrGlobalHome');
  if(!enabled||!actions){globalHome?.remove();globalHome=null}
  else{
    if(!globalHome){
      globalHome=document.createElement('button');
      globalHome.id='igrGlobalHome';
      globalHome.className='pill-btn igr-global-home';
      globalHome.type='button';
      globalHome.addEventListener('click',callHome);
    }
    globalHome.textContent=isFr()?'⌂ Accueil':'⌂ Home';
    globalHome.setAttribute('aria-label',isFr()?'Revenir à l’accueil':'Return home');
    actions.prepend(globalHome);
  }

  const page=document.querySelector('#app .page');
  if(page){
    for(const btn of page.querySelectorAll('.page-head > button,.page-head > .btn')){
      const text=(btn.textContent||'').trim().toLowerCase();
      btn.classList.toggle('igr-local-home',/accueil|\bhome\b/.test(text));
    }
  }
}

function normalizeScenarioBrowser(){
  document.getElementById('igrScenarioExit')?.remove();
  document.getElementById('igrFilterFab')?.remove();
  const page=document.querySelector('.page-create-v10-13');
  if(!page)return;
  const nav=page.querySelector('.igr-scenario-filters');
  if(nav){
    nav.classList.remove('igr-filter-popover','is-open');
    nav.classList.add('igr-filter-inline');
  }
}

function apply(){markHomeActions();organizeUtilityNavigation();normalizeScenarioBrowser()}
function schedule(){queueMicrotask(apply);requestAnimationFrame(apply);setTimeout(apply,80)}

/* Hooks stay additive and execute only when those screens render. */
for(const name of ['renderHome','renderCreateList','renderCreateConfirm','renderJoin','renderRules','renderProfile']){
  try{
    const local=typeof globalThis[name]==='function'?globalThis[name]:null;
    if(!local)continue;
    globalThis[name]=function(){const out=local.apply(this,arguments);schedule();return out};
  }catch(err){console.warn(`[IGR v16] ${name} polish hook skipped`,err)}
}

function boot(){
  apply();
  const app=document.getElementById('app');
  if(app&&window.MutationObserver){
    const observer=new MutationObserver(()=>schedule());
    observer.observe(app,{childList:true,subtree:false});
  }
  window.addEventListener('pageshow',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
