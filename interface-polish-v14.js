/* Inside Grey Room v14 — small additive UI controller. */
(()=>{
'use strict';
const isFr=()=>window.IGR_LOCALE!=='en';

function markHomeActions(){
  const actions=document.querySelector('.home-actions-v10-13,.home-actions');
  if(!actions)return;
  for(const el of actions.querySelectorAll('.home-action')){
    const text=(el.textContent||'').toLowerCase();
    el.classList.toggle('igr-home-join',/rejoindre une partie|join a game/.test(text));
    el.classList.toggle('igr-home-rules',/règles du jeu|game rules/.test(text));
    el.classList.toggle('igr-home-profile',/profil|profile/.test(text));
  }
}

function ensureScenarioExit(){
  const browser=document.querySelector('.page-create-v10-13 .scenario-list-v10-13,.page-create-v10-13 .scenario-list');
  let btn=document.getElementById('igrScenarioExit');
  if(!browser){btn?.remove();return}
  if(btn)return;
  btn=document.createElement('button');
  btn.id='igrScenarioExit';btn.className='igr-scenario-exit';btn.type='button';
  btn.textContent=isFr()?'← Accueil':'← Home';
  btn.setAttribute('aria-label',isFr()?'Quitter la liste des scénarios et revenir à l’accueil':'Leave scenario list and return home');
  btn.addEventListener('click',()=>{if(typeof window.goHome==='function')window.goHome();else if(typeof goHome==='function')goHome();});
  document.body.appendChild(btn);
}

function apply(){markHomeActions();ensureScenarioExit()}
function schedule(){queueMicrotask(apply);requestAnimationFrame(apply);setTimeout(apply,80)}

/* Hooks are additive and execute only when these screens render. */
try{
  if(typeof window.renderHome==='function'){
    const base=window.renderHome;
    window.renderHome=function(){const out=base.apply(this,arguments);schedule();return out};
  }else if(typeof renderHome==='function'){
    const base=renderHome;
    renderHome=function(){const out=base.apply(this,arguments);schedule();return out};
  }
}catch(err){console.warn('[IGR v14] home polish hook skipped',err)}
try{
  if(typeof window.renderCreateList==='function'){
    const base=window.renderCreateList;
    window.renderCreateList=function(){const out=base.apply(this,arguments);schedule();return out};
  }else if(typeof renderCreateList==='function'){
    const base=renderCreateList;
    renderCreateList=function(){const out=base.apply(this,arguments);schedule();return out};
  }
}catch(err){console.warn('[IGR v14] scenario polish hook skipped',err)}

/* One observer on #app only: screen replacements, no polling and no subtree character watching. */
function boot(){
  apply();
  const app=document.getElementById('app');
  if(app&&window.MutationObserver){
    const observer=new MutationObserver(()=>schedule());
    observer.observe(app,{childList:true});
  }
  window.addEventListener('pageshow',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
