/* Inside Grey Room — v12.45 DLC invite codes
   One-time owner-generated access codes for TERREUR / CARTEL / LE RÉGIME. */
(() => {
  'use strict';

  const IDENTITY_KEY='igr_social_identity_v1';
  const META={
    terror:{label:'TERREUR',prefix:'TER'},
    cartel:{label:'CARTEL',prefix:'CAR'},
    regime:{label:'LE RÉGIME',prefix:'REG'}
  };

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const store=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
  function identity(){try{return JSON.parse(store().getItem(IDENTITY_KEY)||'null')}catch{return null}}
  function profilePayload(){
    const p=loadProfile();let prefs={visibility:'players_and_friends',allowFriendRequests:true};
    try{prefs=Object.assign(prefs,JSON.parse(store().getItem('igr_social_prefs_v1')||'{}'))}catch{}
    return {pseudo:(p.pseudo||'').trim(),avatar:safeAvatar(p.avatar||''),stats:{games:p.games||0,completed:p.completed||0,wins:p.wins||0,history:Array.isArray(p.history)?p.history.slice(0,10):[]},equippedTitle:p.equippedTitle||'none',equippedBadge:p.equippedBadge||'none',visibility:prefs.visibility,allowFriendRequests:prefs.allowFriendRequests!==false};
  }
  async function ensureIdentity(){
    let id=identity();if(id?.id&&id?.token)return id;
    const profile=profilePayload();if(!profile.pseudo)throw new Error('profile_pseudo_required');
    const response=await fetch(`${SUPABASE_URL}/functions/v1/igr-social`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({action:'create',profile})});
    const out=await response.json().catch(()=>({}));
    if(!response.ok||!out?.identity?.id||!out?.identity?.token)throw new Error(out?.error||'profile_create_failed');
    store().setItem(IDENTITY_KEY,JSON.stringify(out.identity));return out.identity;
  }

  function cacheEntry(key){return window.IGR_DLC_ACCESS?.items?.[key]||{active:false,level:'none',expires_at:null}}
  async function refreshAccess(){
    const id=await ensureIdentity();
    const out=await rpc('igr_dlc_access_status',{p_profile_id:id.id,p_profile_token:id.token});
    if(window.IGR_DLC_ACCESS){window.IGR_DLC_ACCESS.loaded=true;window.IGR_DLC_ACCESS.items=out||{}}
    return out||{};
  }
  function refreshCreateUi(){
    try{if(window.IGR_DLC_ACCESS)window.IGR_DLC_ACCESS.loaded=false}catch{}
    try{if(typeof renderCreateList==='function'&&document.querySelector('.page-create-v10-13'))renderCreateList()}catch(error){console.warn('DLC list refresh',error)}
    setTimeout(decorateAccessControls,30);
  }

  function rowHtml(x,key){
    const permanent=!x.expires_at;
    return `<div class="igr-dlc-access-person"><span><b>${esc(x.pseudo||'Profil')}</b><small>${esc(String(x.access_level||'tester').toUpperCase())}${permanent?' · permanent':` · expire ${esc(new Date(x.expires_at).toLocaleDateString('fr-CH'))}`}</small></span>${x.access_level!=='owner'&&x.status==='active'?`<button class="btn danger small" onclick="igrDlcRevokeAccess('${esc(key)}','${esc(x.profile_id)}')">Révoquer</button>`:''}</div>`;
  }

  async function renderAccessModal(key){
    const meta=META[key];if(!meta)return;
    document.querySelector('.igr-dlc-access-modal')?.remove();
    let status={};try{status=await refreshAccess()}catch(error){console.warn(error)}
    const entry=status?.[key]||cacheEntry(key);const active=!!entry?.active;const owner=active&&entry?.level==='owner';
    let list=[];
    if(owner){
      const id=identity();
      try{list=await rpc('igr_dlc_list_access',{p_owner_id:id.id,p_owner_token:id.token,p_dlc_key:key})||[]}catch(error){console.warn('DLC access list',error)}
    }
    const modal=document.createElement('div');modal.className='modal igr-dlc-access-modal';
    modal.innerHTML=`<div class="modal-box igr-dlc-access-box"><div class="igr-dlc-access-kicker">${esc(meta.label)} · CONTRÔLE D’ACCÈS</div><h2>${owner?'Accès propriétaire':active?'Accès autorisé':'Déverrouiller le DLC'}</h2>${!active?`<p>Entre le code à usage unique transmis par le propriétaire. Il lie l’accès à ton profil.</p><div class="field"><label for="igrDlcRedeemCode">Code d’accès</label><input id="igrDlcRedeemCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${meta.prefix}-XXXX-XXXX-XXXX-XXXX"></div><button class="btn primary block" onclick="igrDlcRedeemInvite('${key}')">Valider l’accès</button>`:owner?`<p>Crée un code à usage unique pour donner accès à <b>${esc(meta.label)}</b>. Comme pour OMERTÀ, le joueur l’active sur son propre profil.</p><div class="igr-dlc-invite-builder"><div class="field"><label for="igrDlcInviteDays">Durée en jours</label><input id="igrDlcInviteDays" type="number" min="0" max="90" value="7"><small>0 = accès test sans expiration.</small></div><button class="btn primary" onclick="igrDlcCreateInvite('${key}')">Créer une invitation</button></div><div id="igrDlcInviteResult"></div><div class="section-title"><h3>Accès existants</h3><span>${list.length}</span></div><div class="igr-dlc-access-list">${list.length?list.map(x=>rowHtml(x,key)).join(''):'<div class="empty-state">Aucun joueur autorisé.</div>'}</div>`:`<div class="igr-dlc-authorized"><b>${entry.level==='tester'?'ACCÈS TESTEUR':'DLC DÉTENU'}</b><p>Ce profil peut créer et rejoindre les cellules ${esc(meta.label)}.</p></div>`}<div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',event=>{if(event.target===modal)modal.remove()});document.body.appendChild(modal);
  }

  window.igrDlcOpenAccess=key=>renderAccessModal(String(key||''));
  window.igrDlcCreateInvite=async key=>{
    key=String(key||'');if(!META[key])return;
    try{
      const id=await ensureIdentity();const days=Math.max(0,Math.min(90,Number(document.getElementById('igrDlcInviteDays')?.value||7)));
      const out=await rpc('igr_dlc_create_invite',{p_owner_id:id.id,p_owner_token:id.token,p_dlc_key:key,p_days:days});
      const el=document.getElementById('igrDlcInviteResult');if(el)el.innerHTML=`<div class="igr-dlc-new-code"><small>INVITATION À TRANSMETTRE</small><strong>${esc(out.code)}</strong><button class="btn ghost small" onclick="igrDlcCopyCode('${esc(out.code)}')">Copier</button></div>`;
    }catch(error){console.error(error);toast('Impossible de créer cette invitation.');}
  };
  window.igrDlcRedeemInvite=async key=>{
    key=String(key||'');if(!META[key])return;
    const code=(document.getElementById('igrDlcRedeemCode')?.value||'').trim().toUpperCase();if(!code)return toast('Entre le code d’accès.');
    try{
      const id=await ensureIdentity();await rpc('igr_dlc_redeem_invite',{p_profile_id:id.id,p_profile_token:id.token,p_code:code,p_dlc_key:key});
      document.querySelector('.igr-dlc-access-modal')?.remove();await refreshAccess();refreshCreateUi();toast(`Accès ${META[key].label} activé.`);
    }catch(error){console.error(error);toast(/wrong_dlc/i.test(String(error?.message||''))?'Ce code appartient à un autre DLC.':'Code invalide, expiré ou déjà utilisé.');}
  };
  window.igrDlcRevokeAccess=async(key,target)=>{
    key=String(key||'');if(!META[key]||!target||!confirm(`Révoquer cet accès ${META[key].label} ?`))return;
    try{const id=await ensureIdentity();await rpc('igr_dlc_revoke_access',{p_owner_id:id.id,p_owner_token:id.token,p_target_profile_id:target,p_dlc_key:key});toast('Accès révoqué.');await renderAccessModal(key);refreshCreateUi()}
    catch(error){console.error(error);toast('Impossible de révoquer cet accès.');}
  };
  window.igrDlcCopyCode=async code=>{try{await navigator.clipboard.writeText(code);toast('Code DLC copié.')}catch{toast(code)}};

  function decorateAccessControls(){
    for(const key of Object.keys(META)){
      const section=document.querySelector(`.${key}-dlc-section`);if(!section)continue;
      const row=section.querySelector('.dlc-access-row');if(!row)continue;
      row.querySelector('.igr-dlc-access-action')?.remove();
      if(window.IGR_DLC_ACCESS&&!window.IGR_DLC_ACCESS.loaded)continue;
      const entry=cacheEntry(key);let label='';
      if(entry?.active&&entry?.level==='owner')label='Gérer les accès';
      else if(!entry?.active)label='Code d’accès';
      if(!label)continue;
      const btn=document.createElement('button');btn.type='button';btn.className='btn ghost small igr-dlc-access-action';btn.textContent=label;btn.onclick=()=>renderAccessModal(key);row.appendChild(btn);
    }
  }

  const observer=new MutationObserver(()=>queueMicrotask(decorateAccessControls));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',decorateAccessControls,{once:true});
  window.addEventListener('pageshow',()=>setTimeout(decorateAccessControls,30),{passive:true});
  setTimeout(decorateAccessControls,0);
})();
