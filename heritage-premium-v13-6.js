/* Inside Grey Room v13.6 — HÉRITAGE premium access gate */
(() => {
  'use strict';

  const VERSION='13.6-heritage-premium';
  const IDENTITY_KEY='igr_social_identity_v1';
  const CACHE_MS=30000;
  let accessCache=null;
  let accessAt=0;
  let accessLoading=null;
  let homeWrapped=false;
  let heritageCodeLoading=null;

  const fr=()=>window.IGR_LOCALE!=='en';
  const copy=()=>fr()?{
    title:'Héritage',
    subtitle:'Accès payant · campagnes persistantes',
    premium:'PREMIUM',
    checking:'VÉRIFICATION…',
    locked:'ACCÈS LIMITÉ',
    owned:'DÉVERROUILLÉ',
    tester:'ACCÈS TESTEUR',
    modalKicker:'MODE PREMIUM',
    modalTitle:'HÉRITAGE est en accès limité',
    modalBody:'Ce mode premium contient des campagnes persistantes dont les décisions et les conséquences se transmettent d’un dossier au suivant.',
    modalOwned:'Ce profil possède HÉRITAGE.',
    modalLocked:'Ce profil ne possède pas encore HÉRITAGE. Entre un code d’accès si tu en as reçu un, ou revérifie un achat déjà attribué à ce profil.',
    details:'3 campagnes · 15 dossiers · progression persistante',
    close:'Fermer',
    profile:'Voir mon profil',
    code:'Entrer un code d’accès',
    retry:'Revérifier l’accès',
    codeUnavailable:'Le module de code d’accès n’a pas pu être chargé. Recharge la page puis réessaie.'
  }:{
    title:'Heritage',
    subtitle:'Paid access · persistent campaigns',
    premium:'PREMIUM',
    checking:'CHECKING…',
    locked:'LIMITED ACCESS',
    owned:'UNLOCKED',
    tester:'TESTER ACCESS',
    modalKicker:'PREMIUM MODE',
    modalTitle:'HERITAGE has limited access',
    modalBody:'This premium mode contains persistent campaigns where decisions and consequences carry from one case to the next.',
    modalOwned:'This profile owns HERITAGE.',
    modalLocked:'This profile does not own HERITAGE yet. Enter an access code if you received one, or check again for a purchase already assigned to this profile.',
    details:'3 campaigns · 15 cases · persistent progress',
    close:'Close',
    profile:'View my profile',
    code:'Enter an access code',
    retry:'Check access again',
    codeUnavailable:'The access-code module could not be loaded. Reload the page and try again.'
  };

  function storage(){
    try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}
  }
  function identity(){
    try{return JSON.parse(storage().getItem(IDENTITY_KEY)||'null')}catch{return null}
  }
  function normalize(entry){
    if(typeof entry==='boolean')return {active:entry,level:entry?'purchased':'none',expires_at:null};
    return {
      active:!!entry?.active,
      level:String(entry?.level||'none'),
      expires_at:entry?.expires_at||null
    };
  }
  async function access(force=false){
    if(!force&&accessCache&&(Date.now()-accessAt)<CACHE_MS)return accessCache;
    if(accessLoading)return accessLoading;
    accessLoading=(async()=>{
      const id=identity();
      if(!id?.id||!id?.token||typeof rpc!=='function')return normalize(null);
      try{
        const result=await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token});
        return normalize(result?.heritage);
      }catch(error){
        console.warn('[Heritage Premium] access check failed',error);
        return normalize(null);
      }
    })();
    try{
      accessCache=await accessLoading;
      accessAt=Date.now();
      return accessCache;
    }finally{accessLoading=null}
  }

  function homeActions(){return document.querySelector('.home-actions-v10-13,.home-actions')}
  function createCard(actions){
    const create=[...actions.querySelectorAll('.home-action')].find(el=>/créer une partie|create a game/i.test(el.textContent||''))||actions.querySelector('.home-action');
    if(!create)return null;
    let card=actions.querySelector('.heritage-premium-home-action');
    if(!card){
      actions.querySelector('.heritage-home-action')?.remove();
      card=document.createElement('div');
      card.className='home-action heritage-home-action heritage-premium-home-action is-checking';
      card.setAttribute('role','button');
      card.tabIndex=0;
      card.setAttribute('aria-haspopup','dialog');
      create.insertAdjacentElement('afterend',card);
      card.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openFromCard()});
      card.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openFromCard()}
      });
    }
    renderCard(card,accessCache||normalize(null),!accessCache);
    equalize(card);
    return card;
  }
  function renderCard(card,state,checking=false){
    const t=copy();
    card.classList.toggle('is-checking',checking);
    card.classList.toggle('is-owned',!checking&&state.active);
    card.classList.toggle('is-locked',!checking&&!state.active);
    const status=checking?t.checking:(state.active?(state.level==='tester'?t.tester:t.owned):t.locked);
    card.setAttribute('aria-label',`${t.title} — ${status}`);
    card.innerHTML=`
      <div class="icon heritage-premium-icon" aria-hidden="true"><span>H</span></div>
      <div class="heritage-premium-copy"><h3>${t.title}</h3><p>${t.subtitle}</p></div>
      <div class="heritage-premium-side" aria-hidden="true">
        <span class="heritage-premium-badge">${t.premium}</span>
        <span class="heritage-premium-state"><i class="heritage-premium-lock"></i>${status}</span>
      </div>`;
  }
  function equalize(card){
    requestAnimationFrame(()=>{
      if(!card?.isConnected)return;
      const peers=[...card.parentElement.querySelectorAll('.home-action:not(.primary):not(.heritage-premium-home-action)')];
      const heights=peers.map(el=>el.getBoundingClientRect().height).filter(v=>v>0);
      card.style.minHeight=heights.length?`${Math.max(...heights)}px`:'';
    });
  }
  async function syncCard(force=false){
    const actions=homeActions();if(!actions)return;
    const card=createCard(actions);if(!card)return;
    const state=await access(force);
    if(!card.isConnected)return;
    renderCard(card,state,false);equalize(card);
  }

  function closeModal(){document.getElementById('heritagePremiumModal')?.remove()}
  function loadHeritageCodeModule(){
    if(window.IGR_HERITAGE_CODES?.open)return Promise.resolve(window.IGR_HERITAGE_CODES);
    if(heritageCodeLoading)return heritageCodeLoading;
    heritageCodeLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='heritage-access-code-v14.js?v=v14-heritage-code-modal';
      script.async=true;
      script.addEventListener('load',()=>window.IGR_HERITAGE_CODES?.open?resolve(window.IGR_HERITAGE_CODES):reject(new Error('heritage_code_api_missing')),{once:true});
      script.addEventListener('error',()=>reject(new Error('heritage_code_script_failed')),{once:true});
      document.head.appendChild(script);
    }).finally(()=>{heritageCodeLoading=null});
    return heritageCodeLoading;
  }
  async function openCodeAccess(){
    const t=copy();
    closeModal();
    try{
      const api=window.IGR_HERITAGE_CODES?.open?window.IGR_HERITAGE_CODES:await loadHeritageCodeModule();
      await api.open();
    }catch(error){
      console.error('[Heritage Premium] access-code UI unavailable',error);
      try{if(typeof toast==='function')toast(t.codeUnavailable)}catch{}
      showModal(await access(true));
    }
  }
  function showModal(state){
    closeModal();
    const t=copy();
    const modal=document.createElement('div');
    modal.id='heritagePremiumModal';modal.className='modal heritage-premium-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    modal.innerHTML=`<div class="modal-box heritage-premium-modal-box">
      <button class="heritage-premium-modal-close" type="button" aria-label="${t.close}">×</button>
      <div class="heritage-premium-modal-mark">H</div>
      <div class="kicker heritage-premium-kicker">${t.modalKicker}</div>
      <h2>${t.modalTitle}</h2>
      <p>${t.modalBody}</p>
      <div class="heritage-premium-featureline">${t.details}</div>
      <div class="heritage-premium-accessbox ${state.active?'is-owned':'is-locked'}">
        <span>${t.premium}</span><b>${state.active?t.modalOwned:t.modalLocked}</b>
      </div>
      <div class="modal-actions heritage-premium-modal-actions">
        ${!state.active?`<button class="btn primary" type="button" data-action="heritage-code">${t.code}</button><button class="btn ghost" type="button" data-action="retry">${t.retry}</button>`:''}
        <button class="btn ${state.active?'primary':'ghost'}" type="button" data-action="close">${t.close}</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.dataset.heritageCodeReady='1';
    modal.querySelector('.heritage-premium-modal-close')?.addEventListener('click',closeModal);
    modal.querySelector('[data-action="close"]')?.addEventListener('click',closeModal);
    modal.querySelector('[data-action="heritage-code"]')?.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();void openCodeAccess();
    });
    modal.querySelector('[data-action="retry"]')?.addEventListener('click',async()=>{
      const btn=modal.querySelector('[data-action="retry"]');if(btn)btn.disabled=true;
      const fresh=await access(true);closeModal();await syncCard(true);
      if(fresh.active)openHeritage();else showModal(fresh);
    });
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
    modal.querySelector(state.active?'[data-action="close"]':'[data-action="heritage-code"]')?.focus({preventScroll:true});
  }
  function openHeritage(){
    if(window.IGR_HERITAGE?.open){window.IGR_HERITAGE.open();return true}
    console.warn('[Heritage Premium] Heritage engine unavailable');return false;
  }
  async function openFromCard(){
    const state=await access(true);
    await syncCard(false);
    if(state.active){openHeritage();return}
    showModal(state);
  }

  function wrapHome(){
    if(homeWrapped||typeof renderHome!=='function')return;
    homeWrapped=true;
    const base=renderHome;
    renderHome=function(){const out=base.apply(this,arguments);queueMicrotask(()=>syncCard(false));requestAnimationFrame(()=>syncCard(false));return out};
  }
  function boot(){
    wrapHome();
    setTimeout(()=>syncCard(false),0);
    window.addEventListener('pageshow',()=>{accessCache=null;accessAt=0;syncCard(true)},{passive:true});
    window.addEventListener('resize',()=>{const card=document.querySelector('.heritage-premium-home-action');if(card)equalize(card)},{passive:true});
  }

  window.IGR_HERITAGE_PREMIUM=Object.freeze({version:VERSION,check:()=>access(true),refresh:()=>syncCard(true)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
