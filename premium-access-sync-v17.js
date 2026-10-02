/* Inside Grey Room v17 — one source of truth for premium ownership + DLC browser layout. */
(()=>{
  'use strict';

  const VERSION='17.0-premium-sync';
  const IDENTITY_KEY='igr_social_identity_v1';
  const META={
    omerta:{label:'OMERTÀ',ids:['021','022','023','024','025'],eyebrow:'DLC CONFIDENTIEL',copy:'5 dossiers liés. Une Famiglia. Jusqu’au Don.',tag:'CONFIDENTIEL',footer:'Téléphones posés · décisions irréversibles · rôles Mafia facultatifs'},
    terror:{label:'TERREUR',ids:['026','027','028'],eyebrow:'DLC DE CRISE',copy:'Bloqués dans la Grey Room. Un groupe terroriste s’empare de la ville. Le périmètre se referme.',tag:'CRISE',footer:'Pression extérieure · urgence · responsabilité sous contrainte'},
    cartel:{label:'CARTEL',ids:['029','030','031'],eyebrow:'DLC SOUS PRESSION',copy:'Le cartel frappe l’enquête, achète la justice et remonte jusqu’à vos proches.',tag:'SOUS PRESSION',footer:'Réseau · corruption · pression sur les proches'},
    regime:{label:'LE RÉGIME',ids:['032','033','034'],eyebrow:'DLC APRÈS LA CHUTE',copy:'Le régime est tombé. Les archives restent. Identifiez ceux qui ont ordonné, couvert et profité.',tag:'APRÈS LA CHUTE',footer:'Archives · chaîne de commandement · responsabilité'}
  };
  const PROFILE_META={
    omerta:{label:'OMERTÀ'},terror:{label:'TERREUR'},cartel:{label:'CARTEL'},regime:{label:'LE RÉGIME'},heritage:{label:'HÉRITAGE'}
  };
  const state={status:null,loading:null,lastFetch:0,observer:null,applying:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
  function identity(){try{return JSON.parse(store().getItem(IDENTITY_KEY)||'null')}catch{return null}}
  function normalize(raw){
    const out={};
    for(const key of Object.keys(PROFILE_META)){
      const v=raw?.[key];
      out[key]=typeof v==='boolean'?{active:v,level:v?'purchased':'none',expires_at:null}:{active:!!v?.active,level:String(v?.level||'none'),expires_at:v?.expires_at||null};
    }
    return out;
  }
  function label(entry){
    if(!entry?.active)return 'NON DÉTENU';
    if(entry.level==='owner')return 'PROPRIÉTAIRE';
    if(entry.level==='tester')return 'TESTEUR';
    return 'DÉTENU';
  }
  function accessPill(entry){return `<span class="igr-premium-access-pill">${esc(label(entry))}</span>`}
  function playerLabel(sc){try{return typeof playerCountLabel==='function'?playerCountLabel(sc):`${sc?.min||'—'}–${sc?.max||'—'} joueurs`}catch{return `${sc?.min||'—'}–${sc?.max||'—'} joueurs`}}
  function scenarioById(id){try{return typeof scenario==='function'?scenario(id):SCENARIOS?.find?.(x=>String(x.id)===String(id))}catch{return null}}
  function artFor(id){try{return typeof scenarioThumbArt==='function'?scenarioThumbArt(id):''}catch{return''}}

  async function fetchStatus(force=false){
    const now=Date.now();
    if(state.loading)return state.loading;
    if(!force&&state.status&&now-state.lastFetch<1800)return state.status;
    const id=identity();
    if(!id?.id||!id?.token){state.status=normalize(null);state.lastFetch=now;return state.status}
    state.loading=(async()=>{
      try{
        const raw=await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token});
        state.status=normalize(raw);
        state.lastFetch=Date.now();
        if(window.IGR_DLC_ACCESS){
          window.IGR_DLC_ACCESS.loaded=true;
          window.IGR_DLC_ACCESS.items=raw||{};
        }
      }catch(error){
        console.warn('[premium sync] access status',error);
        if(!state.status)state.status=normalize(null);
      }
      return state.status;
    })();
    try{return await state.loading}finally{state.loading=null}
  }

  function card(sc,key){
    if(!sc)return'';
    const meta=META[key];
    return `<article id="scenario-${esc(sc.id)}" class="scenario scenario--art scenario--compact ${key}-scenario" data-igr-scenario-id="${esc(sc.id)}" role="button" tabindex="0" onclick="selectScenario('${esc(sc.id)}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${esc(artFor(sc.id))}" alt="${esc(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">${esc(meta.label)} · Dossier ${esc(sc.id)}</div><h3>${esc(sc.title)}</h3><p>${esc(sc.short||'')}</p><div class="tag-row"><span class="tag">${esc(playerLabel(sc))}</span><span class="tag ${key}-tag">${esc(meta.tag)}</span></div></div></article>`;
  }
  function accessButton(key,entry){
    if(key==='omerta'){
      if(typeof window.igrOmertaOpenAccess!=='function')return'';
      return `<button class="btn ghost small igr-premium-manage" type="button" onclick="igrOmertaOpenAccess()">${entry?.active&&entry.level==='owner'?'Gérer les accès':'Déverrouiller'}</button>`;
    }
    if(typeof window.igrDlcOpenAccess!=='function')return'';
    return `<button class="btn ghost small igr-premium-manage" type="button" onclick="igrDlcOpenAccess('${key}')">${entry?.active&&entry.level==='owner'?'Gérer les accès':'Déverrouiller'}</button>`;
  }
  function sectionHtml(key,entry){
    const meta=META[key],scenarios=meta.ids.map(scenarioById).filter(Boolean);
    if(entry?.active){
      return `<div class="igr-premium-head"><div><span class="igr-premium-eyebrow">${esc(meta.eyebrow)}</span><h2>${esc(meta.label)}</h2><p>${esc(meta.copy)}</p></div>${accessPill(entry)}</div><div class="scenario-list scenario-list-v10-13 ${key}-list">${scenarios.map(sc=>card(sc,key)).join('')}</div><div class="igr-premium-footer"><span>${esc(meta.footer)}</span>${entry.level==='owner'?accessButton(key,entry):''}</div>`;
    }
    return `<div class="igr-premium-locked"><div><span class="igr-premium-eyebrow">${esc(meta.eyebrow)}</span><h2>${esc(meta.label)}</h2><p>${esc(meta.copy)}</p></div>${accessButton(key,entry)}</div>`;
  }
  function patchSection(key,status){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;
    const meta=META[key],entry=status?.[key]||{active:false,level:'none'};
    for(const id of meta.ids){
      const loose=document.getElementById(`scenario-${id}`);
      if(loose&&!loose.closest(`.${key}-dlc-section`))loose.remove();
    }
    let section=root.querySelector(`.${key}-dlc-section`);
    if(!section){section=document.createElement('section');root.appendChild(section)}
    const fingerprint=`${entry.active?1:0}:${entry.level}:${entry.expires_at||''}`;
    if(section.dataset.igrV17===fingerprint)return;
    section.className=`panel ${key}-dlc-section igr-premium-dlc-section igr-premium-dlc-section--${key}`;
    section.dataset.collection=key;
    section.dataset.igrV17=fingerprint;
    section.innerHTML=sectionHtml(key,entry);
  }

  function profileCards(status){
    return Object.entries(PROFILE_META).map(([key,meta])=>{
      const entry=status?.[key]||{active:false,level:'none'};
      return `<div class="igr-dlc-owned-card ${key} ${entry.active?'is-owned':'is-locked'}"><span>${esc(meta.label)}</span><b>${esc(label(entry))}</b></div>`;
    }).join('');
  }
  function patchProfile(status){
    const panel=document.querySelector('.profile-page .profile-panel');if(!panel)return;
    let box=panel.querySelector('.igr-profile-dlc-box');
    if(!box){
      box=document.createElement('section');box.className='igr-profile-dlc-box';
      const before=panel.querySelector('.profile-dossier,.reward-section');
      if(before)panel.insertBefore(box,before);else panel.appendChild(box);
    }
    const fingerprint=Object.keys(PROFILE_META).map(k=>`${k}:${status?.[k]?.active?1:0}:${status?.[k]?.level||'none'}`).join('|');
    if(box.dataset.igrV17===fingerprint)return;
    box.dataset.igrV17=fingerprint;
    box.innerHTML=`<div class="igr-profile-dlc-head"><div><small>CONTENUS PREMIUM</small><h2>Contenus du joueur</h2></div><span>Compte lié</span></div><div class="igr-profile-dlc-grid">${profileCards(status)}</div>`;
  }
  function cleanLegacyFloatingUi(){
    document.getElementById('igrFilterFab')?.remove();
    document.getElementById('igrScenarioExit')?.remove();
    const nav=document.querySelector('.page-create-v10-13 .igr-scenario-filters');
    if(nav){nav.classList.remove('igr-filter-popover','is-open');nav.classList.add('igr-filter-inline')}
  }
  function apply(status=state.status){
    if(state.applying||!status)return;
    state.applying=true;
    try{
      cleanLegacyFloatingUi();
      if(document.querySelector('.page-create-v10-13'))for(const key of Object.keys(META))patchSection(key,status);
      if(document.querySelector('.profile-page'))patchProfile(status);
    }finally{state.applying=false}
  }
  async function refresh(force=false){const status=await fetchStatus(force);apply(status);return status}
  function schedule(force=false){queueMicrotask(()=>refresh(force));requestAnimationFrame(()=>apply())}

  function boot(){
    cleanLegacyFloatingUi();
    schedule(true);
    const app=document.getElementById('app');
    if(app&&window.MutationObserver){
      let queued=false;
      state.observer=new MutationObserver(()=>{
        if(queued||state.applying)return;queued=true;
        queueMicrotask(()=>{queued=false;cleanLegacyFloatingUi();apply();if(document.querySelector('.page-create-v10-13,.profile-page'))void refresh(false)});
      });
      state.observer.observe(app,{childList:true,subtree:true});
    }
    window.addEventListener('pageshow',()=>schedule(true),{passive:true});
    window.addEventListener('focus',()=>schedule(true),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(true)},{passive:true});
  }
  window.IGR_PREMIUM_SYNC=Object.freeze({version:VERSION,refresh:()=>refresh(true),status:()=>state.status});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
