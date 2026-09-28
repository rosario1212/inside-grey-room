/* Inside Grey Room — V12 social profiles
   Persistent profile sync, room profile viewing, friend codes, requests and friends.
*/
(() => {
  const IDENTITY_KEY = 'igr_social_identity_v1';
  const PREFS_KEY = 'igr_social_prefs_v1';
  const API_URL = `${SUPABASE_URL}/functions/v1/igr-social`;
  const SOCIAL = {
    ensurePromise: null,
    saveTimer: null,
    lastSavedFingerprint: '',
    status: 'local',
    network: null,
    boundKey: '',
    refreshing: false,
  };

  const style = document.createElement('style');
  style.textContent = `
.social-panel{margin:16px 0 4px;padding:17px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.024),rgba(255,255,255,.012))}
.social-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.social-head h2{margin:4px 0 0;font-size:21px}.social-sync{font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#78828c;padding-top:4px}.social-sync.ok{color:#b9c3cb}.social-sync.err{color:#b18383}
.friend-code-card{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(0,0,0,.16)}.friend-code-card small{display:block;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#6e7882}.friend-code-card strong{display:block;margin-top:5px;font:800 18px 'IBM Plex Mono',monospace;letter-spacing:.08em}.friend-code-card button{flex:0 0 auto}
.social-search{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:10px}.social-search input{min-width:0;padding:12px;border-radius:12px;border:1px solid var(--line);background:#090e13;color:var(--text);text-transform:uppercase;outline:none}.social-search input:focus{border-color:var(--line-2)}
.social-privacy{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.social-privacy label{padding:11px 12px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.014)}.social-privacy span{display:block;margin-bottom:6px;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#6f7983}.social-privacy select{width:100%;background:#090e13;color:#dfe4e8;border:1px solid var(--line);border-radius:9px;padding:9px}.social-privacy .checkline{display:flex;align-items:center;gap:9px}.social-privacy .checkline span{margin:0}.social-privacy input[type=checkbox]{width:19px;height:19px;accent-color:#e4e7ea}
.social-section{margin-top:16px}.social-section-head{display:flex;justify-content:space-between;align-items:end;gap:8px;margin-bottom:8px}.social-section-head h3{margin:0;font-size:15px}.social-section-head span{font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#69737d}
.social-list{display:grid;gap:7px}.social-person{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 11px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.015)}.social-person-main{display:flex;align-items:center;gap:9px;min-width:0}.social-person-main b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.social-person-main small{display:block;margin-top:3px;font:650 8px 'IBM Plex Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:#6f7983}.social-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.social-actions .btn{padding:7px 9px;border-radius:9px;font-size:9px}
.social-empty{padding:12px;border:1px dashed rgba(255,255,255,.08);border-radius:11px;color:#737d87;text-align:center;font-size:10px}.social-autosave-note{margin:12px 0 2px;padding:9px 11px;border-radius:10px;background:rgba(255,255,255,.018);font:650 8px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#737d87;text-align:center}
.lobby-profile-btn{margin-left:auto;padding:7px 9px!important;border-radius:9px!important;font-size:8px!important;letter-spacing:.08em;text-transform:uppercase}.lobby-player-live{gap:9px}.lobby-player-live .player-ident{min-width:0}
.social-profile-modal .modal-box{max-width:560px}.social-modal-head{display:flex;align-items:center;gap:12px;padding-bottom:13px;border-bottom:1px solid rgba(255,255,255,.07)}.social-modal-head h2{margin:0;font-size:24px}.social-modal-head p{margin:4px 0 0;color:#747f89;font:650 8px 'IBM Plex Mono',monospace;letter-spacing:.09em;text-transform:uppercase}.social-modal-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.social-modal-stat{padding:10px 8px;border:1px solid rgba(255,255,255,.06);border-radius:11px;background:rgba(255,255,255,.014)}.social-modal-stat b{display:block;font:800 18px 'IBM Plex Mono',monospace}.social-modal-stat span{display:block;margin-top:4px;color:#6f7983;font:650 7px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;line-height:1.35}.social-modal-meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.social-modal-meta div{padding:10px 11px;border-left:2px solid #4b5560;background:rgba(255,255,255,.015)}.social-modal-meta small{display:block;color:#6d7781;font:650 7px 'IBM Plex Mono',monospace;letter-spacing:.09em;text-transform:uppercase}.social-modal-meta strong{display:block;margin-top:4px;font-size:11px}.social-modal-history{margin-top:13px;display:grid;gap:6px}.social-modal-case{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid rgba(255,255,255,.055);border-radius:10px}.social-modal-case span{font-size:10px;color:#cbd2d7}.social-modal-case small{font:700 7px 'IBM Plex Mono',monospace;text-transform:uppercase;color:#717b84;white-space:nowrap}.social-limited{margin-top:13px;padding:14px;border:1px dashed rgba(255,255,255,.09);border-radius:12px;color:#89939c;font-size:11px;line-height:1.6;text-align:center}
@media(max-width:640px){.social-privacy{grid-template-columns:1fr}.social-modal-stats{grid-template-columns:1fr 1fr}.social-modal-meta{grid-template-columns:1fr}.friend-code-card{align-items:flex-start}.social-person{align-items:flex-start}.social-actions{max-width:44%}}
`;
  document.head.appendChild(style);

  function readIdentity(){
    try{return JSON.parse(STORAGE.getItem(IDENTITY_KEY)||'null')}catch{return null}
  }
  function writeIdentity(v){
    STORAGE.setItem(IDENTITY_KEY,JSON.stringify(v));
  }
  function readPrefs(){
    try{return Object.assign({visibility:'players_and_friends',allowFriendRequests:true},JSON.parse(STORAGE.getItem(PREFS_KEY)||'{}'))}catch{return{visibility:'players_and_friends',allowFriendRequests:true}}
  }
  function writePrefs(v){STORAGE.setItem(PREFS_KEY,JSON.stringify(Object.assign(readPrefs(),v||{})))}
  function profilePayload(){
    const p=loadProfile(),prefs=readPrefs();
    return {
      pseudo:(p.pseudo||'').trim(),avatar:safeAvatar(p.avatar||''),
      stats:{games:p.games||0,completed:p.completed||0,wins:p.wins||0,history:Array.isArray(p.history)?p.history.slice(0,10):[]},
      equippedTitle:p.equippedTitle||'none',equippedBadge:p.equippedBadge||'none',
      visibility:prefs.visibility,allowFriendRequests:prefs.allowFriendRequests!==false
    };
  }
  function fingerprint(v){
    try{return JSON.stringify(v)}catch{return String(Date.now())}
  }
  function setSyncStatus(status){
    SOCIAL.status=status;
    const el=byId('socialSyncState');
    if(!el)return;
    el.className='social-sync '+(status==='synced'?'ok':status==='error'?'err':'');
    el.textContent=status==='synced'?'Synchronisé':status==='syncing'?'Synchronisation…':status==='error'?'Hors ligne · sauvegarde locale':'Sauvegarde locale';
  }
  async function socialApi(action,payload={}){
    const identity=readIdentity();
    const body={action,...payload};
    if(action!=='create'){
      if(!identity?.id||!identity?.token)throw new Error('profile_not_ready');
      body.profile_id=identity.id;body.profile_token=identity.token;
    }
    const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify(body)});
    const out=await r.json().catch(()=>({error:'invalid_response'}));
    if(!r.ok){const e=new Error(out?.error||'social_error');e.code=out?.error||'social_error';throw e}
    return out;
  }
  async function ensureSocialIdentity(){
    const existing=readIdentity();if(existing?.id&&existing?.token)return existing;
    const p=profilePayload();if(!p.pseudo)return null;
    if(SOCIAL.ensurePromise)return SOCIAL.ensurePromise;
    SOCIAL.ensurePromise=(async()=>{
      setSyncStatus('syncing');
      try{
        const out=await socialApi('create',{profile:p});
        if(!out?.identity?.id||!out?.identity?.token)throw new Error('identity_missing');
        writeIdentity(out.identity);SOCIAL.lastSavedFingerprint=fingerprint(p);setSyncStatus('synced');
        return out.identity;
      }catch(e){console.warn('social identity',e);setSyncStatus('error');return null}
      finally{SOCIAL.ensurePromise=null}
    })();
    return SOCIAL.ensurePromise;
  }
  function scheduleSocialSave(delay=650){
    clearTimeout(SOCIAL.saveTimer);setSyncStatus('local');
    SOCIAL.saveTimer=setTimeout(()=>void syncSocialProfile(),delay);
  }
  async function syncSocialProfile(force=false){
    const p=profilePayload();if(!p.pseudo)return;
    const id=await ensureSocialIdentity();if(!id)return;
    const sig=fingerprint(p);if(!force&&sig===SOCIAL.lastSavedFingerprint){setSyncStatus('synced');return}
    setSyncStatus('syncing');
    try{await socialApi('save',{profile:p});SOCIAL.lastSavedFingerprint=sig;setSyncStatus('synced');void bindCurrentRoomProfile()}
    catch(e){console.warn('social save',e);setSyncStatus('error')}
  }
  async function bindCurrentRoomProfile(){
    if(!STATE.room||!STATE.token)return;
    const id=await ensureSocialIdentity();if(!id)return;
    const key=`${STATE.room}|${STATE.token}|${id.id}`;if(SOCIAL.boundKey===key)return;
    try{await socialApi('bind_room',{room_code:STATE.room,room_player_token:STATE.token});SOCIAL.boundKey=key}
    catch(e){console.warn('social room bind',e)}
  }

  function avatarPublic(p,cls='avatar-small'){
    const src=safeAvatar(p?.avatar||'');
    return src?`<span class="avatar ${cls}"><img src="${src}" alt="Photo de ${h(p?.pseudo||'joueur')}"></span>`:`<span class="avatar avatar-fallback ${cls}">${h(initials(p?.pseudo||'?'))}</span>`;
  }
  function titleLabel(id){try{return PROFILE_TITLES.find(x=>x.id===id)?.label||'Aucun titre'}catch{return'Aucun titre'}}
  function badgeLabel(id){try{const b=PROFILE_BADGES.find(x=>x.id===id);return b?`${b.glyph} ${b.label}`:'Aucun badge'}catch{return'Aucun badge'}}
  function metrics(stats){
    const completed=Math.max(0,Number(stats?.completed)||0),wins=Math.min(completed,Math.max(0,Number(stats?.wins)||0));
    return{completed,wins,losses:Math.max(0,completed-wins),rate:completed?Math.round(wins/completed*100):0};
  }
  function relationActions(p){
    if(!p||p.relationship==='self')return'';
    if(p.relationship==='friends')return `<button class="btn ghost small" onclick="igrSocialRemoveFriend('${p.id}')">Retirer des amis</button>`;
    if(p.relationship==='outgoing')return `<button class="btn ghost small" disabled>Demande envoyée</button>`;
    if(p.relationship==='incoming')return `<button class="btn primary small" onclick="igrSocialRespond('${p.id}',true)">Accepter</button><button class="btn ghost small" onclick="igrSocialRespond('${p.id}',false)">Refuser</button>`;
    if(p.allow_friend_requests===false)return `<button class="btn ghost small" disabled>Demandes désactivées</button>`;
    return `<button class="btn primary small" onclick="igrSocialRequestFriend('${p.id}')">Ajouter en ami</button>`;
  }
  function openProfileModal(p){
    document.querySelector('.social-profile-modal')?.remove();
    const m=metrics(p?.stats||{}),history=Array.isArray(p?.stats?.history)?p.stats.history.slice(0,3):[];
    const modal=document.createElement('div');modal.className='modal social-profile-modal';
    modal.innerHTML=`<div class="modal-box"><div class="social-modal-head">${avatarPublic(p,'avatar-profile')}<div><h2>${h(p?.pseudo||'Profil')}</h2><p>${p?.relationship==='friends'?'Ami':p?.relationship==='incoming'?'Demande reçue':p?.relationship==='outgoing'?'Demande envoyée':'Dossier joueur'}</p></div></div>${p?.limited?`<div class="social-limited">Ce joueur a limité la visibilité de son dossier. Son identité reste visible, mais ses statistiques sont privées.</div>`:`<div class="social-modal-stats"><div class="social-modal-stat"><b>${m.completed}</b><span>Affaires</span></div><div class="social-modal-stat"><b>${m.wins}</b><span>Classées</span></div><div class="social-modal-stat"><b>${m.losses}</b><span>Non résolues</span></div><div class="social-modal-stat"><b>${m.rate}%</b><span>Résolution</span></div></div><div class="social-modal-meta"><div><small>Titre</small><strong>${h(titleLabel(p?.equipped_title))}</strong></div><div><small>Badge</small><strong>${h(badgeLabel(p?.equipped_badge))}</strong></div></div>${history.length?`<div class="social-modal-history">${history.map(x=>`<div class="social-modal-case"><span>${h(x.title||`Dossier ${x.scenario||'—'}`)}</span><small>${x.won?'Classé':'Non résolu'}</small></div>`).join('')}</div>`:''}`}
      <div class="modal-actions">${relationActions(p)}<button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
  }

  async function refreshNetwork(){
    const root=byId('socialNetworkBody');if(!root||SOCIAL.refreshing)return;
    const id=await ensureSocialIdentity();if(!id){root.innerHTML='<div class="social-empty">Choisis d’abord un pseudo : le profil social sera créé automatiquement.</div>';return}
    SOCIAL.refreshing=true;
    try{const out=await socialApi('network');SOCIAL.network=out;renderNetwork(out)}
    catch(e){console.warn('social network',e);root.innerHTML='<div class="social-empty">Réseau momentanément indisponible. Ton profil reste sauvegardé sur cet appareil.</div>'}
    finally{SOCIAL.refreshing=false}
  }
  function renderPerson(p,kind){
    const sub=kind==='friend'?'AMI':kind==='incoming'?'DEMANDE REÇUE':'EN ATTENTE';
    const actions=kind==='friend'?`<button class="btn ghost" onclick="igrSocialOpenProfile('${p.id}')">Dossier</button>`:kind==='incoming'?`<button class="btn primary" onclick="igrSocialRespond('${p.id}',true)">Accepter</button><button class="btn ghost" onclick="igrSocialRespond('${p.id}',false)">Refuser</button>`:`<button class="btn ghost" onclick="igrSocialOpenProfile('${p.id}')">Voir</button>`;
    return `<div class="social-person"><div class="social-person-main">${avatarPublic(p)}<span><b>${h(p.pseudo||'Joueur')}</b><small>${sub}</small></span></div><div class="social-actions">${actions}</div></div>`;
  }
  function renderNetwork(out){
    const root=byId('socialNetworkBody');if(!root)return;
    const prefs=readPrefs(),friends=out?.friends||[],incoming=out?.incoming||[],outgoing=out?.outgoing||[];
    root.innerHTML=`<div class="friend-code-card"><div><small>Ton code ami</small><strong>${h(out?.self?.friendCode||readIdentity()?.friendCode||'—')}</strong></div><button class="btn ghost small" onclick="igrSocialCopyCode()">Copier</button></div><div class="social-search"><input id="friendCodeInput" maxlength="12" placeholder="GRY-XXXXXXXX" autocapitalize="characters" spellcheck="false"><button class="btn" onclick="igrSocialLookup()">Rechercher</button></div><div class="social-privacy"><label><span>Visibilité du dossier</span><select id="socialVisibility"><option value="players_and_friends" ${prefs.visibility==='players_and_friends'?'selected':''}>Joueurs de la partie + amis</option><option value="friends_only" ${prefs.visibility==='friends_only'?'selected':''}>Amis uniquement</option><option value="private" ${prefs.visibility==='private'?'selected':''}>Privé</option></select></label><label class="checkline"><input id="socialFriendRequests" type="checkbox" ${prefs.allowFriendRequests!==false?'checked':''}><span>Autoriser les demandes d’amis</span></label></div>${incoming.length?`<div class="social-section"><div class="social-section-head"><h3>Demandes reçues</h3><span>${incoming.length}</span></div><div class="social-list">${incoming.map(p=>renderPerson(p,'incoming')).join('')}</div></div>`:''}<div class="social-section"><div class="social-section-head"><h3>Amis</h3><span>${friends.length}</span></div><div class="social-list">${friends.length?friends.map(p=>renderPerson(p,'friend')).join(''):'<div class="social-empty">Aucun ami pour le moment. Partage ton code ou ajoute un joueur depuis le lobby.</div>'}</div></div>${outgoing.length?`<div class="social-section"><div class="social-section-head"><h3>Demandes envoyées</h3><span>${outgoing.length}</span></div><div class="social-list">${outgoing.map(p=>renderPerson(p,'outgoing')).join('')}</div></div>`:''}`;
    byId('socialVisibility')?.addEventListener('change',e=>{writePrefs({visibility:e.target.value});scheduleSocialSave(250)});
    byId('socialFriendRequests')?.addEventListener('change',e=>{writePrefs({allowFriendRequests:!!e.target.checked});scheduleSocialSave(250)});
  }

  function decorateProfile(){
    const dossier=document.querySelector('.profile-dossier');if(!dossier||byId('socialNetwork'))return;
    const box=document.createElement('div');box.id='socialNetwork';box.className='social-panel';
    box.innerHTML=`<div class="social-head"><div><div class="dossier-kicker">Réseau sécurisé</div><h2>Contacts & amis</h2></div><span id="socialSyncState" class="social-sync">Sauvegarde locale</span></div><div id="socialNetworkBody"><div class="social-empty">Chargement du réseau…</div></div><div class="social-autosave-note">Profil sauvegardé automatiquement à chaque modification</div>`;
    dossier.insertAdjacentElement('afterend',box);
    const input=byId('profilePseudo');
    input?.addEventListener('input',()=>{const pseudo=input.value.slice(0,22);saveProfileData({pseudo});if(pseudo.trim())STORAGE.setItem('igr_v9_last_pseudo',pseudo.trim())});
    const manual=[...document.querySelectorAll('button.btn.primary.block')].find(b=>(b.getAttribute('onclick')||'').includes('saveProfileForm'));
    if(manual)manual.textContent='Synchroniser maintenant';
    setSyncStatus(SOCIAL.status);void refreshNetwork();
  }
  function decorateLobby(d){
    if(!d?.players?.length)return;void bindCurrentRoomProfile();
    const rows=[...document.querySelectorAll('.lobby-player-live')];
    rows.forEach((row,i)=>{
      const p=d.players[i];if(!p||row.querySelector('.lobby-profile-btn'))return;
      const btn=document.createElement('button');btn.className='btn ghost lobby-profile-btn';btn.type='button';btn.textContent=String(p.id)===String(d.player?.id)?'Ton dossier':'Dossier';
      btn.addEventListener('click',ev=>{ev.stopPropagation();void openRoomProfile(p.id)});row.appendChild(btn);
    });
  }

  async function openRoomProfile(playerId){
    const id=await ensureSocialIdentity();if(!id)return toast('Crée d’abord ton profil.');
    await bindCurrentRoomProfile();
    try{const out=await socialApi('room_profile',{room_code:STATE.room,room_player_token:STATE.token,target_player_id:playerId});if(!out.available)return toast('Ce joueur n’a pas encore de dossier synchronisé.');openProfileModal(out.profile)}
    catch(e){console.warn(e);toast('Profil indisponible pour le moment.')}
  }

  window.igrSocialCopyCode=async()=>{const code=SOCIAL.network?.self?.friendCode||readIdentity()?.friendCode;if(!code)return;try{await navigator.clipboard.writeText(code);toast('Code ami copié.')}catch{toast(code)}};
  window.igrSocialLookup=async()=>{const code=(byId('friendCodeInput')?.value||'').trim().toUpperCase();if(!code)return;try{const out=await socialApi('lookup_code',{friend_code:code});openProfileModal(out.profile)}catch(e){toast(e.code==='not_found'?'Aucun profil trouvé avec ce code.':'Code ami invalide ou profil indisponible.')}};
  window.igrSocialOpenProfile=async id=>{try{const out=await socialApi('get_profile',{target_profile_id:id});openProfileModal(out.profile)}catch(e){toast('Profil indisponible.')}};
  window.igrSocialRequestFriend=async id=>{try{const out=await socialApi('friend_request',{target_profile_id:id});document.querySelector('.social-profile-modal')?.remove();toast(out.autoAccepted?'Vous êtes maintenant amis.':'Demande d’ami envoyée.');await refreshNetwork()}catch(e){toast(e.code==='requests_disabled'?'Ce joueur n’accepte pas les demandes d’amis.':'Impossible d’envoyer la demande.')}};
  window.igrSocialRespond=async(id,accept)=>{try{await socialApi('friend_respond',{requester_profile_id:id,accept:!!accept});document.querySelector('.social-profile-modal')?.remove();toast(accept?'Ami ajouté.':'Demande refusée.');await refreshNetwork()}catch(e){toast('Cette demande n’est plus disponible.')}};
  window.igrSocialRemoveFriend=async id=>{try{await socialApi('friend_remove',{target_profile_id:id});document.querySelector('.social-profile-modal')?.remove();toast('Contact retiré.');await refreshNetwork()}catch(e){toast('Impossible de retirer ce contact.')}};

  const originalSaveProfileData=saveProfileData;
  saveProfileData=function(p){const out=originalSaveProfileData(p);scheduleSocialSave();return out};
  const originalRenderProfile=renderProfile;
  renderProfile=function(){originalRenderProfile();decorateProfile();};
  const originalRenderLobby=renderLobby;
  renderLobby=function(prefetched=null){originalRenderLobby(prefetched);decorateLobby(prefetched||STATE.sync);};

  window.addEventListener('online',()=>scheduleSocialSave(120));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void syncSocialProfile();});
  setTimeout(()=>{if(loadProfile().pseudo)void ensureSocialIdentity().then(()=>{void syncSocialProfile();void bindCurrentRoomProfile()})},450);
})();
