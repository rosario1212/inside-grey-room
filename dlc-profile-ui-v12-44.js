/* Inside Grey Room — v16 premium ownership profile + clean scenario filters */
(() => {
  'use strict';

  const IDENTITY_KEY='igr_social_identity_v1';
  const DLC_META={
    omerta:{label:'OMERTÀ',className:'omerta'},
    terror:{label:'TERREUR',className:'terror'},
    cartel:{label:'CARTEL',className:'cartel'},
    regime:{label:'LE RÉGIME',className:'regime'},
    heritage:{label:'HÉRITAGE',className:'heritage'}
  };
  let ownCache=null;
  let pendingProfileId=null;
  let pendingRoomPlayerId=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readIdentity(){try{return JSON.parse(STORAGE.getItem(IDENTITY_KEY)||'null')}catch{return null}}
  function statusActive(value){return typeof value==='boolean'?value:!!value?.active}
  function statusLevel(value){return typeof value==='object'&&value?String(value.level||'none'):'none'}
  function normalizeStatus(raw){
    const out={};for(const key of Object.keys(DLC_META))out[key]=raw?.[key]??false;return out;
  }
  async function getOwnStatus(force=false){
    if(ownCache&&!force)return ownCache;
    const id=readIdentity();
    if(!id?.id||!id?.token)return normalizeStatus(null);
    try{ownCache=normalizeStatus(await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token}));return ownCache}
    catch(error){console.warn('profile premium status',error);return normalizeStatus(null)}
  }
  async function getProfileStatus(targetProfileId){
    const id=readIdentity();if(!id?.id||!id?.token||!targetProfileId)return normalizeStatus(null);
    try{return normalizeStatus(await rpc('igr_dlc_profile_access',{p_profile_id:id.id,p_profile_token:id.token,p_target_profile_id:targetProfileId}))}
    catch(error){console.warn('public premium status',error);return normalizeStatus(null)}
  }
  async function getRoomPlayerStatus(targetPlayerId){
    if(!STATE?.room||!STATE?.token||!targetPlayerId)return normalizeStatus(null);
    try{return normalizeStatus(await rpc('igr_dlc_room_player_access',{p_code:STATE.room,p_player_token:STATE.token,p_target_player_id:targetPlayerId}))}
    catch(error){console.warn('room premium status',error);return normalizeStatus(null)}
  }

  function entitlementCards(status,{compact=false}={}){
    return Object.entries(DLC_META).map(([key,meta])=>{
      const entry=status?.[key];
      const active=statusActive(entry),level=statusLevel(entry);
      const state=active?(level==='owner'?'PROPRIÉTAIRE':level==='tester'?'TESTEUR':'DÉTENU'):'NON DÉTENU';
      return `<div class="igr-dlc-owned-card ${meta.className} ${active?'is-owned':'is-locked'} ${compact?'is-compact':''}"><span>${esc(meta.label)}</span><b>${state}</b></div>`;
    }).join('');
  }

  async function decorateOwnProfile(){
    const panel=document.querySelector('.profile-page .profile-panel');if(!panel)return;
    let box=panel.querySelector('.igr-profile-dlc-box');
    if(!box){
      box=document.createElement('section');box.className='igr-profile-dlc-box';
      const before=panel.querySelector('.profile-dossier,.reward-section');
      if(before)panel.insertBefore(box,before);else panel.appendChild(box);
    }
    box.innerHTML='<div class="igr-profile-dlc-head"><div><small>CONTENUS PREMIUM</small><h2>Contenus du joueur</h2></div><span>Vérification…</span></div><div class="igr-profile-dlc-grid is-loading"></div>';
    const status=await getOwnStatus(true);
    if(!box.isConnected)return;
    box.querySelector('.igr-profile-dlc-head span').textContent='Compte lié';
    box.querySelector('.igr-profile-dlc-grid').classList.remove('is-loading');
    box.querySelector('.igr-profile-dlc-grid').innerHTML=entitlementCards(status);
  }

  if(typeof renderProfile==='function'){
    const baseRenderProfile=renderProfile;
    renderProfile=function(){const out=baseRenderProfile.apply(this,arguments);queueMicrotask(decorateOwnProfile);return out};
  }

  async function decorateSocialModal(modal){
    if(!modal||modal.dataset.dlcDecorating==='1'||modal.dataset.dlcDecorated==='1')return;
    if(!pendingProfileId&&!pendingRoomPlayerId)return;
    modal.dataset.dlcDecorating='1';
    let status;
    if(pendingProfileId){const id=pendingProfileId;pendingProfileId=null;status=await getProfileStatus(id)}
    else{const id=pendingRoomPlayerId;pendingRoomPlayerId=null;status=await getRoomPlayerStatus(id)}
    if(!modal.isConnected)return;
    const target=modal.querySelector('.social-modal-meta,.social-modal-history,.modal-actions')||modal.querySelector('.modal-box');
    const owned=document.createElement('div');owned.className='igr-social-dlc-box';
    owned.innerHTML=`<small>CONTENUS DÉTENUS</small><div class="igr-social-dlc-grid">${entitlementCards(status,{compact:true})}</div>`;
    target?.parentNode?.insertBefore(owned,target);
    modal.dataset.dlcDecorated='1';delete modal.dataset.dlcDecorating;
  }

  if(typeof window.igrSocialOpenProfile==='function'){
    const baseOpen=window.igrSocialOpenProfile;
    window.igrSocialOpenProfile=async id=>{pendingProfileId=id;const out=await baseOpen(id);setTimeout(()=>decorateSocialModal(document.querySelector('.social-profile-modal')),0);return out};
  }

  document.addEventListener('click',event=>{
    const btn=event.target.closest?.('.lobby-profile-btn');if(!btn)return;
    const row=btn.closest('.lobby-player-live');const rows=[...document.querySelectorAll('.lobby-player-live')];
    const index=rows.indexOf(row);const player=STATE?.sync?.players?.[index];
    if(player?.id)pendingRoomPlayerId=player.id;
  },true);

  function ensureFilterControl(){
    const page=document.querySelector('.page-create-v10-13');
    const toggle=document.getElementById('igrFilterFab');
    if(toggle)toggle.remove();
    if(!page)return;
    const nav=page.querySelector('.igr-scenario-filters');if(!nav)return;
    nav.classList.remove('igr-filter-popover','is-open');
    nav.classList.add('igr-filter-inline');
    nav.removeAttribute('aria-expanded');
  }

  document.addEventListener('click',event=>{
    const chip=event.target.closest?.('.igr-filter-chip');
    if(chip)setTimeout(ensureFilterControl,0);
  },true);

  const observer=new MutationObserver(()=>{
    ensureFilterControl();
    const modal=document.querySelector('.social-profile-modal:not([data-dlc-decorated="1"]):not([data-dlc-decorating="1"])');
    if(modal&&(pendingProfileId||pendingRoomPlayerId))queueMicrotask(()=>decorateSocialModal(modal));
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',ensureFilterControl,{once:true});
  window.addEventListener('pageshow',()=>{ownCache=null;ensureFilterControl()},{passive:true});
  setTimeout(ensureFilterControl,0);
})();
