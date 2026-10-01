/* Inside Grey Room v14 — HÉRITAGE playtest access codes
   Web/PWA beta only. Native store bundles intentionally do not ship this file. */
(() => {
  'use strict';

  const VERSION='14-heritage-access-code';
  const DLC_KEY='heritage';
  const LABEL='HÉRITAGE';
  const PREFIX='HER';
  const IDENTITY_KEY='igr_social_identity_v1';
  let busy=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
  const toastSafe=message=>{try{if(typeof toast==='function')return toast(message)}catch{} console.info('[Heritage Code]',message)};
  function identity(){try{return JSON.parse(store().getItem(IDENTITY_KEY)||'null')}catch{return null}}
  function profilePayload(){
    if(typeof loadProfile!=='function')throw new Error('profile_required');
    const p=loadProfile();
    if(!(p?.pseudo||'').trim())throw new Error('profile_pseudo_required');
    let prefs={visibility:'players_and_friends',allowFriendRequests:true};
    try{prefs=Object.assign(prefs,JSON.parse(store().getItem('igr_social_prefs_v1')||'{}'))}catch{}
    return {
      pseudo:(p.pseudo||'').trim(),
      avatar:typeof safeAvatar==='function'?safeAvatar(p.avatar||''):(p.avatar||''),
      stats:{games:p.games||0,completed:p.completed||0,wins:p.wins||0,history:Array.isArray(p.history)?p.history.slice(0,10):[]},
      equippedTitle:p.equippedTitle||'none',equippedBadge:p.equippedBadge||'none',
      visibility:prefs.visibility,allowFriendRequests:prefs.allowFriendRequests!==false
    };
  }
  async function ensureIdentity(){
    let id=identity();if(id?.id&&id?.token)return id;
    if(typeof SUPABASE_URL!=='string'||typeof SUPABASE_KEY!=='string')throw new Error('backend_unavailable');
    const response=await fetch(`${SUPABASE_URL}/functions/v1/igr-social`,{
      method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
      body:JSON.stringify({action:'create',profile:profilePayload()})
    });
    const out=await response.json().catch(()=>({}));
    if(!response.ok||!out?.identity?.id||!out?.identity?.token)throw new Error(out?.error||'profile_create_failed');
    store().setItem(IDENTITY_KEY,JSON.stringify(out.identity));return out.identity;
  }
  async function status(){
    const id=await ensureIdentity();
    const out=await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token});
    return out?.heritage||{active:false,level:'none',expires_at:null};
  }
  async function refresh(){
    try{await window.IGR_HERITAGE_PREMIUM?.refresh?.()}catch(error){console.warn('[Heritage Code] refresh',error)}
  }
  function closeAccess(){document.querySelector('.heritage-code-access-modal')?.remove()}
  function rowHtml(x){
    const permanent=!x.expires_at;
    return `<div class="igr-dlc-access-person"><span><b>${esc(x.pseudo||'Profil')}</b><small>${esc(String(x.access_level||'tester').toUpperCase())}${permanent?' · permanent':` · expire ${esc(new Date(x.expires_at).toLocaleDateString('fr-CH'))}`}</small></span>${x.access_level!=='owner'&&x.status==='active'?`<button class="btn danger small" type="button" data-revoke="${esc(x.profile_id)}">Révoquer</button>`:''}</div>`;
  }

  async function openAccess(){
    if(busy)return;busy=true;
    try{
      closeAccess();
      const current=await status();
      const owner=!!current.active&&current.level==='owner';
      let list=[];
      if(owner){
        const id=identity();
        list=await rpc('igr_dlc_list_access',{p_owner_id:id.id,p_owner_token:id.token,p_dlc_key:DLC_KEY})||[];
      }
      const modal=document.createElement('div');
      modal.className='modal igr-dlc-access-modal heritage-code-access-modal';
      modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      modal.innerHTML=`<div class="modal-box igr-dlc-access-box">
        <div class="igr-dlc-access-kicker">${LABEL} · CONTRÔLE D’ACCÈS</div>
        <h2>${owner?'Codes de test HÉRITAGE':current.active?'Accès HÉRITAGE autorisé':'Déverrouiller HÉRITAGE'}</h2>
        ${!current.active?`
          <p>Entre le code à usage unique transmis par le propriétaire. Il lie l’accès HÉRITAGE à ton profil.</p>
          <div class="field"><label for="igrHeritageRedeemCode">Code d’accès</label><input id="igrHeritageRedeemCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${PREFIX}-XXXX-XXXX-XXXX-XXXX"></div>
          <button class="btn primary block" type="button" data-action="redeem">Valider l’accès</button>`:
        owner?`
          <p>Crée un code à usage unique pour un bêta-testeur HÉRITAGE. Le code est lié au profil lors de son activation.</p>
          <div class="igr-dlc-invite-builder"><div class="field"><label for="igrHeritageInviteDays">Durée en jours</label><input id="igrHeritageInviteDays" type="number" min="0" max="90" value="7"><small>0 = accès test sans expiration.</small></div><button class="btn primary" type="button" data-action="create">Créer un code</button></div>
          <div id="igrHeritageInviteResult"></div>
          <div class="section-title"><h3>Accès existants</h3><span>${list.length}</span></div>
          <div class="igr-dlc-access-list">${list.length?list.map(rowHtml).join(''):'<div class="empty-state">Aucun joueur autorisé.</div>'}</div>`:
        `<div class="igr-dlc-authorized"><b>${current.level==='tester'?'ACCÈS TESTEUR':'HÉRITAGE DÉTENU'}</b><p>Ce profil peut utiliser le mode HÉRITAGE.</p></div>`}
        <div class="modal-actions"><button class="btn ghost" type="button" data-action="close">Fermer</button></div>
      </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click',async event=>{
        if(event.target===modal||event.target.closest('[data-action="close"]'))return closeAccess();
        const revoke=event.target.closest('[data-revoke]');
        if(revoke){
          if(!confirm('Révoquer cet accès HÉRITAGE ?'))return;
          try{const id=await ensureIdentity();await rpc('igr_dlc_revoke_access',{p_owner_id:id.id,p_owner_token:id.token,p_target_profile_id:revoke.dataset.revoke,p_dlc_key:DLC_KEY});toastSafe('Accès HÉRITAGE révoqué.');closeAccess();await refresh();await openAccess()}catch(error){console.error(error);toastSafe('Impossible de révoquer cet accès.')}return;
        }
        if(event.target.closest('[data-action="redeem"]')){
          const code=(modal.querySelector('#igrHeritageRedeemCode')?.value||'').trim().toUpperCase();
          if(!code)return toastSafe('Entre le code d’accès.');
          try{const id=await ensureIdentity();await rpc('igr_dlc_redeem_invite',{p_profile_id:id.id,p_profile_token:id.token,p_code:code,p_dlc_key:DLC_KEY});closeAccess();await refresh();toastSafe('Accès HÉRITAGE activé.')}catch(error){console.error(error);toastSafe(/wrong_dlc/i.test(String(error?.message||''))?'Ce code appartient à un autre contenu.':'Code invalide, expiré ou déjà utilisé.')}return;
        }
        if(event.target.closest('[data-action="create"]')){
          try{
            const id=await ensureIdentity();
            const days=Math.max(0,Math.min(90,Number(modal.querySelector('#igrHeritageInviteDays')?.value||7)));
            const out=await rpc('igr_dlc_create_invite',{p_owner_id:id.id,p_owner_token:id.token,p_dlc_key:DLC_KEY,p_days:days});
            const result=modal.querySelector('#igrHeritageInviteResult');
            if(result)result.innerHTML=`<div class="igr-dlc-new-code"><small>CODE HÉRITAGE À TRANSMETTRE</small><strong>${esc(out.code)}</strong><button class="btn ghost small" type="button" data-copy="${esc(out.code)}">Copier</button></div>`;
          }catch(error){console.error(error);toastSafe('Impossible de créer ce code.')}return;
        }
        const copy=event.target.closest('[data-copy]');
        if(copy){try{await navigator.clipboard.writeText(copy.dataset.copy);toastSafe('Code HÉRITAGE copié.')}catch{toastSafe(copy.dataset.copy)}}
      });
    }catch(error){
      console.error('[Heritage Code]',error);
      toastSafe(/profile/i.test(String(error?.message||''))?'Crée d’abord ton profil pour utiliser un code HÉRITAGE.':'Impossible d’ouvrir le contrôle d’accès HÉRITAGE.');
    }finally{busy=false}
  }

  function decorateLockedModal(){
    const modal=document.getElementById('heritagePremiumModal');if(!modal||modal.dataset.heritageCodeReady==='1')return;
    const accessBox=modal.querySelector('.heritage-premium-accessbox.is-locked');if(!accessBox)return;
    const actions=modal.querySelector('.heritage-premium-modal-actions');if(!actions)return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn ghost';btn.textContent='Code d’accès';btn.dataset.action='heritage-code';
    btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();modal.remove();openAccess()});
    actions.prepend(btn);modal.dataset.heritageCodeReady='1';
  }
  async function decorateOwnerCard(){
    const card=document.querySelector('.heritage-premium-home-action');if(!card)return;
    const existing=card.querySelector('.heritage-code-owner-action');
    let current;try{current=await window.IGR_HERITAGE_PREMIUM?.check?.()}catch{return}
    if(!current?.active||current.level!=='owner'||!card.isConnected){existing?.remove();return}
    if(existing)return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn ghost small heritage-code-owner-action';btn.textContent='Codes test';btn.style.cssText='margin-top:6px;position:relative;z-index:3;align-self:center;';
    btn.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openAccess()});
    card.appendChild(btn);
  }
  let queued=false;
  function scheduleDecorate(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorateLockedModal();decorateOwnerCard()})}
  const observer=new MutationObserver(scheduleDecorate);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.IGR_HERITAGE_CODES=Object.freeze({version:VERSION,open:openAccess});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleDecorate,{once:true});else scheduleDecorate();
})();
