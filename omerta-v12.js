/* Inside Grey Room — OMERTÀ DLC v12.24
   Server-authorized premium campaign, owner/tester access, optional Mafia roles,
   and low-screen decision locks. */
(() => {
  const IDS = new Set(['021','022','023','024','025']);
  const IDENTITY_KEY = 'igr_social_identity_v1';
  const ACCESS = { loaded:false, active:false, level:'none', expiresAt:null, loading:null };
  const nativeBuild=()=>window.IGR_NATIVE_STORE_BUILD===true||location.hostname==='insidegreyroom.local'||location.protocol==='capacitor:';
  const omertaPrice=()=>window.IGR_STORE_COMMERCE?.displayPrice?.('omerta')||window.IGR_STORE_CATALOG?.product?.('omerta')?.fallbackPrice||'CHF 3.–';
  const ROLE_SETS = {
    '021':['enqueteur','analyste','suspect','associato','uomo_onore','contabile','caporegime','consigliere'],
    '022':['enqueteur','analyste','suspect','associato','uomo_onore','contabile','caporegime','consigliere'],
    '023':['enqueteur','analyste','suspect','associato','uomo_onore','contabile','caporegime','consigliere','sottocapo'],
    '024':['enqueteur','analyste','suspect','associato','uomo_onore','contabile','caporegime','consigliere','pentito'],
    '025':['enqueteur','analyste','suspect','associato','uomo_onore','contabile','caporegime','consigliere','sottocapo','pentito','don']
  };
  const SCENARIO_DATA = [
    {id:'021',title:'L’ENVELOPPE',short:'Une enveloppe disparaît. Pour réduire sa peine, quelqu’un devra peut-être parler — et la Famiglia écoute.',context:'Une enveloppe issue des rackets de plusieurs commerces disparaît avant d’atteindre Enzo Rinaldi. La police tient déjà plusieurs faits matériels. Pour les hommes de la Famiglia Verri, le danger n’est pas seulement ce que l’enquête peut prouver : c’est de savoir qui acceptera de parler pour réduire sa peine.',mood:'Rue, racket, loyauté sous pression.',min:4,max:8,sound:'betrayal',mechanics:['Coopération judiciaire','Omertà','Sanction irréversible']},
    {id:'022',title:'OMERTÀ',short:'Un meurtre interne. Plusieurs vérités partielles. Chacun sait exactement pourquoi il préférerait se taire.',context:'Un meurtre interne fragilise la Famiglia Verri. Plusieurs personnes connaissent chacune une partie des faits, mais aucune ne possède la même raison de se taire. L’enquête n’oppose plus seulement vérité et mensonge : elle oppose peine judiciaire, loyauté et survie.',mood:'Silence, dette, peur contenue.',min:4,max:8,sound:'betrayal',mechanics:['Silence stratégique','Révélations graduées','Loyauté']},
    {id:'023',title:'LA TABLE',short:'Sept sièges. Six hommes. Une chaise vide — et une négociation qui peut devenir une guerre.',context:'Sept sièges sont prévus pour une réunion entre organisations criminelles. Six représentants arrivent. Le septième ne viendra jamais. Les joueurs doivent négocier territoire, loyauté et succession pendant qu’une attaque contre Adriano Verri menace de transformer la réunion en guerre ouverte.',mood:'Commission, pouvoir, succession.',min:4,max:8,sound:'ball',mechanics:['Négociation orale','Objectifs contradictoires','Événement dynamique']},
    {id:'024',title:'IL PENTITO',short:'Il peut gagner des années de liberté avec quelques phrases. Il peut aussi signer sa condamnation.',context:'Un membre de la Famiglia Verri est arrêté avec assez d’éléments contre lui pour risquer des décennies de prison. Il peut réduire sa peine en coopérant, demander une protection et livrer des informations sur le crew. Chaque révélation augmente cependant la probabilité que la Famiglia identifie la source.',mood:'Interrogatoire, coopération, chasse à la fuite.',min:4,max:8,sound:'court',mechanics:['Peine négociée','Protection','Exposition mafieuse']},
    {id:'025',title:'IL DON',short:'Vittorio Verri accepte enfin de parler. Le problème n’est plus ce qui a été fait — mais ce qu’il a réellement ordonné.',context:'Pour la première fois, Vittorio Verri accepte de parler. Quatre dossiers ont accumulé morts, dettes, accords et soupçons autour de lui. La question finale n’est pas de savoir s’il dirige une organisation criminelle, mais quels actes il a réellement ordonnés et lesquels ont été commis en son nom.',mood:'Sommet de la Famiglia, autorité silencieuse.',min:4,max:8,sound:'intelligence',mechanics:['Audiences du Don','Commandement ambigu','Conséquences persistantes']}
  ];
  const ART_FALLBACK = {'021':'017','022':'016','023':'019','024':'014','025':'013'};

  function isOmerta(id){ return IDS.has(String(id||'')); }
  function identity(){ try{return JSON.parse(STORAGE.getItem(IDENTITY_KEY)||'null')}catch{return null} }
  function profilePayload(){
    const p=loadProfile();
    let prefs={visibility:'players_and_friends',allowFriendRequests:true};
    try{prefs=Object.assign(prefs,JSON.parse(STORAGE.getItem('igr_social_prefs_v1')||'{}'))}catch{}
    return {pseudo:(p.pseudo||'').trim(),avatar:safeAvatar(p.avatar||''),stats:{games:p.games||0,completed:p.completed||0,wins:p.wins||0,history:Array.isArray(p.history)?p.history.slice(0,10):[]},equippedTitle:p.equippedTitle||'none',equippedBadge:p.equippedBadge||'none',visibility:prefs.visibility,allowFriendRequests:prefs.allowFriendRequests!==false};
  }
  async function ensureIdentity(){
    let id=identity(); if(id?.id&&id?.token)return id;
    const p=profilePayload(); if(!p.pseudo)throw new Error('profile_pseudo_required');
    const r=await fetch(`${SUPABASE_URL}/functions/v1/igr-social`,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify({action:'create',profile:p})});
    const out=await r.json().catch(()=>({})); if(!r.ok||!out?.identity?.id||!out?.identity?.token)throw new Error(out?.error||'profile_create_failed');
    STORAGE.setItem(IDENTITY_KEY,JSON.stringify(out.identity)); return out.identity;
  }
  async function accessStatus(force=false){
    if(ACCESS.loading)return ACCESS.loading;
    if(ACCESS.loaded&&!force)return ACCESS;
    ACCESS.loading=(async()=>{
      const id=identity();
      if(!id?.id||!id?.token){Object.assign(ACCESS,{loaded:true,active:false,level:'none',expiresAt:null});return ACCESS}
      try{
        const out=await rpc('igr_omerta_access_status',{p_profile_id:id.id,p_profile_token:id.token});
        Object.assign(ACCESS,{loaded:true,active:!!out?.active,level:out?.level||'none',expiresAt:out?.expires_at||null});
      }catch(e){console.warn('omerta access',e);Object.assign(ACCESS,{loaded:true,active:false,level:'none',expiresAt:null})}
      return ACCESS;
    })();
    try{return await ACCESS.loading}finally{ACCESS.loading=null}
  }
  function omertaScenarios(){return SCENARIO_DATA.map(x=>scenario(x.id));}
  function addScenarioData(){
    for(const sc of SCENARIO_DATA)if(!SCENARIOS.some(x=>x.id===sc.id))SCENARIOS.push(sc);
    Object.assign(SCENARIO_ROLES,{
      '021':{required:['Enquêteur'],optional:['Analyste','Associato','Uomo d’Onore','Contabile','Caporegime','Consigliere','Suspect']},
      '022':{required:['Enquêteur'],optional:['Analyste','Associato','Uomo d’Onore','Contabile','Caporegime','Consigliere','Suspect']},
      '023':{required:['Enquêteur'],optional:['Analyste','Associato','Uomo d’Onore','Contabile','Caporegime','Consigliere','Sottocapo','Suspect']},
      '024':{required:['Enquêteur'],optional:['Analyste','Associato','Uomo d’Onore','Contabile','Caporegime','Consigliere','Pentito','Suspect']},
      '025':{required:['Enquêteur'],optional:['Analyste','Associato','Uomo d’Onore','Contabile','Caporegime','Consigliere','Sottocapo','Pentito','Don','Suspect']}
    });
    Object.assign(ROLE_INFO,{
      associato:{label:'Associato',win:'Améliore ta position sans devenir sacrifiable.',body:'Membre non initié : tu peux coopérer, mentir ou protéger la Famiglia. Chaque parole a un prix.'},
      uomo_onore:{label:'Uomo d’Onore',win:'Protège l’omertà sans te condamner inutilement.',body:'Tu peux parler et dire vrai, mais tu dois savoir exactement où t’arrêter.'},
      contabile:{label:'Contabile',win:'Fais parler les chiffres sans révéler plus qu’ils ne prouvent.',body:'Les flux financiers valent cher pour la justice et peuvent trahir qui avait accès aux comptes.'},
      pentito:{label:'Pentito',win:'Réduis ta peine et obtiens une protection avant d’être identifié.',body:'Après avoir parlé à l’oral, confirme seulement les révélations qui doivent devenir irréversibles.'},
      caporegime:{label:'Caporegime',win:'Identifie correctement les fuites de ton crew.',body:'Surveille et sanctionne seulement après avoir interrogé. Une erreur peut tuer un homme loyal.'},
      consigliere:{label:'Consigliere',win:'Protège l’équilibre de la Famiglia et le sommet.',body:'Tu reçois des conséquences indirectes et dois distinguer fuite réelle, peur et manipulation.'},
      sottocapo:{label:'Sottocapo',win:'Préserve la continuité et ta place dans la succession.',body:'Tu agis dans la chaîne de commandement sans provoquer une guerre interne inutile.'},
      don:{label:'Don',win:'Distingue loyauté, trahison et actes réellement commis sous ton autorité.',body:'Tu peux convoquer, surveiller, protéger ou autoriser une sanction sans jamais recevoir les réponses privées.'}
    });
  }
  addScenarioData();

  function omertaWon(p,ids){return (p?.history||[]).some(x=>ids.includes(String(x.scenario||''))&&x.won===true)}
  if(typeof PROFILE_TITLES!=='undefined'&&!PROFILE_TITLES.some(x=>x.id==='omerta_uomo')){
    PROFILE_TITLES.push(
      {id:'omerta_uomo',label:'Uomo d’Onore',desc:'Remporter un des premiers dossiers OMERTÀ.',ok:p=>omertaWon(p,['021','022'])},
      {id:'omerta_consigliere',label:'Consigliere',desc:'Remporter La Table ou Il Pentito.',ok:p=>omertaWon(p,['023','024'])},
      {id:'omerta_don',label:'Don de la Grey Room',desc:'Remporter Il Don.',ok:p=>omertaWon(p,['025'])}
    );
  }
  if(typeof PROFILE_BADGES!=='undefined'&&!PROFILE_BADGES.some(x=>x.id==='omerta_uomo_badge')){
    PROFILE_BADGES.push(
      {id:'omerta_uomo_badge',glyph:'◉',label:'Omertà',desc:'Distinction du premier cercle.',ok:p=>omertaWon(p,['021','022'])},
      {id:'omerta_consigliere_badge',glyph:'♞',label:'Le Conseil',desc:'Distinction du cercle intérieur.',ok:p=>omertaWon(p,['023','024'])},
      {id:'omerta_don_badge',glyph:'♛',label:'La Famiglia',desc:'Distinction finale du dossier 025.',ok:p=>omertaWon(p,['025'])}
    );
  }

  const baseScenarioThumbArt=scenarioThumbArt, baseScenarioArt=scenarioArt;
  scenarioThumbArt=function(id){return isOmerta(id)?baseScenarioThumbArt(ART_FALLBACK[id]||'017'):baseScenarioThumbArt(id)};
  scenarioArt=function(id){return isOmerta(id)?baseScenarioArt(ART_FALLBACK[id]||'017'):baseScenarioArt(id)};

  const baseRolesBlock=rolesBlock;
  rolesBlock=function(sc){
    if(!isOmerta(sc?.id))return baseRolesBlock(sc);
    const roles=ROLE_SETS[sc.id].filter(x=>x!=='enqueteur').map(x=>roleInfo(x).label);
    return `<div class="roles-availability omerta-roles-block"><div class="roles-row"><span>Fil conducteur</span><p>Enquêteur · attribué si personne ne le choisit</p></div><div class="roles-row optional"><span>Rôles facultatifs</span><p>${roles.map(h).join(' · ')}</p></div><small>Aucun rôle Mafia n’exige une composition précise : les rôles absents restent hors joueur.</small></div>`;
  };

  const baseRoleChoiceSummary=roleChoiceSummary;
  roleChoiceSummary=function(sc,count,players){
    if(!isOmerta(sc?.id))return baseRoleChoiceSummary(sc,count,players);
    const taken={};(players||[]).forEach(p=>{if(p.preferred_role)taken[p.preferred_role]=(taken[p.preferred_role]||0)+1});
    return ROLE_SETS[sc.id].map(id=>({id,cap:id==='suspect'?7:1,taken:taken[id]||0,info:roleInfo(id)}));
  };

  function dlcCard(sc){
    return `<article id="scenario-${sc.id}" class="scenario scenario--art scenario--compact omerta-scenario" role="button" tabindex="0" onclick="selectScenario('${sc.id}')"><div class="scenario-thumb compact"><img loading="lazy" decoding="async" src="${scenarioThumbArt(sc.id)}" alt="${h(sc.title)}"></div><div class="scenario-body compact"><div class="scenario-id">OMERTÀ · Dossier ${h(sc.id)}</div><h3>${h(sc.title)}</h3><p>${h(sc.short)}</p><div class="tag-row"><span class="tag">4–8 joueurs</span><span class="tag omerta-tag">CONFIDENTIEL</span></div></div></article>`;
  }
  function accessLabel(){
    if(ACCESS.level==='tester')return ACCESS.expiresAt?`LICENCE TEST HÔTE · jusqu’au ${new Date(ACCESS.expiresAt).toLocaleDateString('fr-CH')}`:'LICENCE TEST HÔTE';
    if(ACCESS.active)return 'LICENCE HÔTE';
    return 'ACCÈS FERMÉ';
  }
  function decorateCreateList(){
    const root=document.querySelector('.page-create-v10-13'); if(!root)return;
    for(const id of IDS)document.getElementById(`scenario-${id}`)?.remove();
    root.querySelector('.omerta-dlc-section')?.remove();
    const section=document.createElement('section'); section.className='panel omerta-dlc-section';
    section.innerHTML=ACCESS.active
      ? `<div class="omerta-head"><div><span class="omerta-eyebrow">DLC CONFIDENTIEL</span><h2>OMERTÀ</h2><p>5 dossiers liés. Une Famiglia. Jusqu’au Don.</p><small>Licence hôte · ${h(omertaPrice())} · les invités rejoignent gratuitement.</small></div><span class="omerta-access-pill">${h(accessLabel())}</span></div><div class="scenario-list scenario-list-v10-13 omerta-list">${omertaScenarios().map(dlcCard).join('')}</div><div class="omerta-footer"><span>Téléphones posés · décisions irréversibles · rôles Mafia facultatifs</span>${!nativeBuild()&&ACCESS.level==='owner'?'<button class="btn ghost small" onclick="igrOmertaOpenAccess()">Accès bêta</button>':''}</div>`
      : `<div class="omerta-locked"><div><span class="omerta-eyebrow">DLC CONFIDENTIEL</span><h2>OMERTÀ</h2><p>Licence hôte permanente. Une seule personne achète OMERTÀ ; tous les invités rejoignent gratuitement sa cellule.</p><small>${h(omertaPrice())} · paiement unique</small></div><button class="btn primary" onclick="igrOmertaOpenAccess()">${nativeBuild()?`Acheter · ${h(omertaPrice())}`:'Accès bêta'}</button></div>`;
    root.appendChild(section);
  }
  const baseRenderCreateList=renderCreateList;
  renderCreateList=function(){
    baseRenderCreateList();decorateCreateList();
    if(!ACCESS.loaded&&!ACCESS.loading)accessStatus().then(()=>{if(STATE.view==='create'){baseRenderCreateList();decorateCreateList()}});
  };

  async function activateCode(code){
    const id=await ensureIdentity(); const cleaned=String(code||'').trim().toUpperCase();
    if(!cleaned)throw new Error('code_required');
    const out=cleaned.startsWith('IGR-OWNER-')
      ? await rpc('igr_omerta_activate_owner',{p_profile_id:id.id,p_profile_token:id.token,p_code:cleaned})
      : await rpc('igr_omerta_redeem_invite',{p_profile_id:id.id,p_profile_token:id.token,p_code:cleaned});
    await accessStatus(true); return out;
  }
  async function accessList(){
    const id=await ensureIdentity(); return await rpc('igr_omerta_list_access',{p_profile_id:id.id,p_profile_token:id.token});
  }
  async function purchaseOmerta(){
    const store=window.IGR_STORE_COMMERCE;
    if(!store?.isConfigured?.()){
      try{toast('Les achats Store ne sont pas encore configurés sur cette version.')}catch{}
      return;
    }
    try{
      await store.purchase('omerta');
      await accessStatus(true);
      if(STATE.view==='create')renderCreateList();
    }catch(error){
      console.error('[OMERTA] purchase',error);
      if(!/cancel/i.test(String(error?.message||'')))try{toast('Achat non finalisé.')}catch{}
    }
  }
  window.igrOmertaStorePurchase=purchaseOmerta;

  function renderAccessModal(list=[]){
    document.querySelector('.omerta-access-modal')?.remove();
    const modal=document.createElement('div');modal.className='modal omerta-access-modal';
    const owner=ACCESS.active&&ACCESS.level==='owner';
    const rows=owner?(list||[]).map(x=>`<div class="omerta-access-row"><span><b>${h(x.pseudo||'Profil')}</b><small>${h(x.level)}${x.expires_at?` · expire ${h(new Date(x.expires_at).toLocaleDateString('fr-CH'))}`:' · permanent'}</small></span>${x.level!=='owner'&&x.status==='active'?`<button class="btn danger small" onclick="igrOmertaRevoke('${x.profile_id}')">Révoquer</button>`:''}</div>`).join(''):'';
    modal.innerHTML=`<div class="modal-box omerta-access-box"><div class="omerta-eyebrow">OMERTÀ · CONTRÔLE D’ACCÈS</div><h2>${owner?'Accès propriétaire':ACCESS.active?'Accès autorisé':'Déverrouiller'}</h2>${!ACCESS.active?`<p class="omerta-modal-copy">Entre une invitation OMERTÀ. Le code propriétaire n’est utilisé qu’une fois pour lier ce profil à l’accès OWNER.</p><div class="field"><label for="omertaUnlockCode">Code d’accès</label><input id="omertaUnlockCode" autocomplete="off" autocapitalize="characters" placeholder="OMR-…"></div><button class="btn primary block" onclick="igrOmertaRedeem()">Valider l’accès</button>`:owner?`<p class="omerta-modal-copy">Génère un code à usage unique pour la personne que tu veux autoriser. Elle l’activera sur son profil pour tester la création de cellules OMERTÀ. Les invités n’ont aucun accès à activer pour rejoindre.</p><div class="omerta-invite-builder"><div class="field"><label for="omertaInviteDays">Durée en jours</label><input id="omertaInviteDays" type="number" min="0" max="90" value="7"><small>0 = accès test sans expiration.</small></div><button class="btn primary" onclick="igrOmertaCreateInvite()">Créer une invitation</button></div><div id="omertaInviteResult"></div><div class="section-title"><h3>Accès existants</h3><span>${list.length}</span></div><div class="omerta-access-list">${rows||'<div class="empty-state">Aucun testeur autorisé.</div>'}</div>`:`<div class="omerta-authorized"><b>${h(accessLabel())}</b><p>Ce profil possède une licence d’hôte OMERTÀ et peut créer des cellules. Les invités rejoignent gratuitement.</p></div>`}<div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Fermer</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
  }
  window.igrOmertaOpenAccess=async()=>{
    await accessStatus(true);
    if(nativeBuild()){
      if(ACCESS.active){toast('Licence hôte OMERTÀ active. Les invités rejoignent gratuitement.');return}
      return purchaseOmerta();
    }
    let list=[];
    if(ACCESS.level==='owner'){try{list=await accessList()}catch(e){console.warn(e)}}
    renderAccessModal(list);
  };
  window.igrOmertaRedeem=async()=>{
    try{await activateCode(byId('omertaUnlockCode')?.value||'');document.querySelector('.omerta-access-modal')?.remove();toast(ACCESS.level==='owner'?'Accès propriétaire OMERTÀ activé.':'Accès OMERTÀ activé.');if(STATE.view==='create')renderCreateList()}
    catch(e){console.error(e);toast(e.message==='profile_pseudo_required'?'Enregistre d’abord un pseudo dans ton profil.':'Code OMERTÀ invalide, expiré ou déjà utilisé.')}
  };
  window.igrOmertaCreateInvite=async()=>{
    try{const id=await ensureIdentity();const days=Math.max(0,Math.min(90,Number(byId('omertaInviteDays')?.value||7)));const out=await rpc('igr_omerta_create_invite',{p_profile_id:id.id,p_profile_token:id.token,p_days:days});const el=byId('omertaInviteResult');if(el)el.innerHTML=`<div class="omerta-new-code"><small>INVITATION À TRANSMETTRE</small><strong>${h(out.code)}</strong><button class="btn ghost small" onclick="igrOmertaCopy('${h(out.code)}')">Copier</button></div>`;}
    catch(e){console.error(e);toast('Impossible de créer cette invitation.')}
  };
  window.igrOmertaCopy=async code=>{try{await navigator.clipboard.writeText(code);toast('Code OMERTÀ copié.')}catch{toast(code)}};
  window.igrOmertaRevoke=async target=>{
    if(!confirm('Révoquer cet accès OMERTÀ ?'))return;
    try{const id=await ensureIdentity();await rpc('igr_omerta_revoke_access',{p_profile_id:id.id,p_profile_token:id.token,p_target_profile_id:target});toast('Accès révoqué.');window.igrOmertaOpenAccess()}
    catch(e){console.error(e);toast('Révocation impossible.')}
  };

  async function enterRoomState(out,code,pseudo,isHost){
    STORAGE.setItem('igr_v9_last_pseudo',pseudo);saveProfileData({pseudo});
    Object.assign(STATE,{view:'lobby',room:out.room_code||code,token:out.player_token,hostToken:isHost?out.host_token:null,playerId:out.player_id,playerPseudo:pseudo,role:'en_attente',tab:'card',sync:null,syncSig:''});
    saveSession();await pushProfileAvatar();await pushProfileCosmetics();await syncNow(true);startRoomWatcher();renderLobby();
  }
  const baseCreateRoom=createRoom;
  createRoom=async function(){
    if(!isOmerta(STATE.selectedScenario))return baseCreateRoom();
    primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
    const pseudo=(byId('createPseudo')?.value||'').trim();if(!pseudo)return toast('Entre ton pseudo.');
    try{
      const id=await ensureIdentity();const status=await accessStatus(true);if(!status.active){toast('Accès OMERTÀ requis.');return window.igrOmertaOpenAccess()}
      let out=null,code=null;for(let attempt=0;attempt<5;attempt++){code=newCode();try{out=await rpc('igr_omerta_create_room',{p_code:code,p_scenario_id:STATE.selectedScenario,p_pseudo:pseudo,p_profile_id:id.id,p_profile_token:id.token});break}catch(e){if(e.code!=='23505'||attempt===4)throw e}}
      await enterRoomState(out,code,pseudo,true);
    }catch(e){console.error(e);toast(e.message==='profile_pseudo_required'?'Enregistre d’abord ton pseudo dans le profil.':'Création OMERTÀ impossible. Vérifie ton accès.')}
  };

  joinRoom=async function(){
    primeNarrationFromGesture();wakeAudioFromGesture().catch?.(()=>{});
    const pseudo=(byId('joinPseudo')?.value||'').trim(),code=(byId('joinCode')?.value||'').trim().toUpperCase();
    if(!pseudo||code.length!==5)return toast('Pseudo et code requis.');
    try{
      let out;
      try{out=await rpc('igr_v4_join_room',{p_code:code,p_pseudo:pseudo})}
      catch(e){
        if(!/premium access required/i.test(e.message||''))throw e;
        const id=await ensureIdentity();
        out=await rpc('igr_omerta_join_room',{p_code:code,p_pseudo:pseudo,p_profile_id:id.id,p_profile_token:id.token});
      }
      await enterRoomState(out,code,pseudo,false);
    }catch(e){console.error(e);toast('Cellule introuvable, pleine ou déjà lancée.')}
  };

  const baseChooseLobbyRole=chooseLobbyRole;
  chooseLobbyRole=async function(role){
    if(!isOmerta(STATE.scenarioId||STATE.sync?.room?.scenario_id))return baseChooseLobbyRole(role);
    try{await rpc('igr_omerta_choose_role',{p_code:STATE.room,p_player_token:STATE.token,p_role:role});await syncNow(true);toast(`Rôle choisi : ${publicRoleLabel(role)}`)}catch(e){console.error(e);toast('Ce rôle vient d’être pris ou n’est pas disponible.')}
  };
  const baseStartGame=startGame;
  startGame=async function(){
    if(!isOmerta(STATE.scenarioId||STATE.sync?.room?.scenario_id))return baseStartGame();
    if(!STATE.hostToken)return toast('Seul l’hôte peut lancer.');
    const autoCount=(STATE.sync?.players||[]).filter(p=>!p.preferred_role).length;cancelBriefingVoice();stopAmbient();
    try{const result=await rpc('igr_omerta_start_game',{p_code:STATE.room,p_host_token:STATE.hostToken});await syncNow(true);startRoomWatcher();if(autoCount||result?.auto_assigned_roles)toast(`${result?.auto_assigned_roles??autoCount} rôle${(result?.auto_assigned_roles??autoCount)>1?'s':''} attribué${(result?.auto_assigned_roles??autoCount)>1?'s':''} au hasard.`)}catch(e){console.error(e);toast('Impossible de lancer OMERTÀ : minimum 4 joueurs et un rôle valide par joueur.')}
  };

  function omertaRole(){const p=STATE.sync?.player,ps=p?.private_state||{};return ps.omerta_preferred_role||p?.secret_role||p?.public_role||''}
  function aliveTargets(){
    const d=STATE.sync;if(!d)return[];const dead=new Set((d.room?.state?.omerta?.dead||[]).map(String));
    return (d.players||[]).filter(p=>String(p.id)!==String(d.player?.id)&&p.public_role==='suspect'&&!dead.has(String(p.id)));
  }
  function targetSelect(){const arr=aliveTargets();return arr.length?`<div class="field"><label for="omertaTarget">Personne concernée</label><select id="omertaTarget">${arr.map(p=>`<option value="${p.id}">${h(p.pseudo)}</option>`).join('')}</select></div>`:'<div class="empty-state">Aucune cible disponible.</div>'}
  function decisionBody(){
    const role=omertaRole(),sid=STATE.sync?.room?.scenario_id||STATE.scenarioId;
    if(role==='enqueteur')return `${targetSelect()}<div class="omerta-decision-grid"><button class="btn primary" onclick="igrOmertaDecision('grant_protection')">Accorder une protection</button></div><p class="omerta-decision-note">Décide après la négociation orale. L’application ne juge pas si l’accord est bon pour toi.</p>`;
    if(['caporegime','consigliere','sottocapo','don'].includes(role))return `${targetSelect()}<div class="omerta-decision-grid"><button class="btn ghost" onclick="igrOmertaDecision('watch')">Surveiller</button>${role==='don'&&sid==='025'?'<button class="btn ghost" onclick="igrOmertaDecision(\'audience\')">Ouvrir une audience</button>':''}<button class="btn danger" onclick="igrOmertaDecision('sanction')">Autoriser une sanction</button></div><p class="omerta-decision-note">Interroge d’abord la personne. Tu ne verras jamais ses réponses privées. Une mauvaise sanction reste possible et sera enregistrée.</p>`;
    return `<p class="omerta-modal-copy">Parle d’abord avec l’Enquêteur. Si tu révèles réellement une information décisive, confirme seulement son niveau — un tap rend la conséquence irréversible.</p><div class="omerta-decision-grid reveal"><button class="btn ghost" onclick="igrOmertaDecision('reveal',1)">Révélation secondaire</button><button class="btn ghost" onclick="igrOmertaDecision('reveal',2)">Nom / lien important</button><button class="btn danger" onclick="igrOmertaDecision('reveal',3)">Information majeure</button><button class="btn ghost" onclick="igrOmertaDecision('request_protection')">Demander une protection</button></div>`;
  }
  window.igrOmertaOpenDecision=()=>{
    if(!isOmerta(STATE.sync?.room?.scenario_id))return;
    document.querySelector('.omerta-decision-modal')?.remove();const modal=document.createElement('div');modal.className='modal omerta-decision-modal';
    modal.innerHTML=`<div class="modal-box"><div class="omerta-eyebrow">OMERTÀ · VERROU DE DÉCISION</div><h2>${h(roleInfo(omertaRole()).label||'Décision')}</h2><div class="omerta-phone-down"><b>À FAIRE APRÈS L’ÉCHANGE ORAL</b><span>Cette fenêtre enregistre une conséquence, elle ne remplace pas la conversation.</span></div>${decisionBody()}<div class="modal-actions"><button class="btn ghost" onclick="this.closest('.modal').remove()">Retour à la table</button></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);
  };
  window.igrOmertaDecision=async(kind,level)=>{
    const target=byId('omertaTarget')?.value||null;
    if(kind==='sanction'&&!confirm('Décision irréversible : autoriser cette sanction ?'))return;
    try{const out=await rpc('igr_omerta_action',{p_code:STATE.room,p_player_token:STATE.token,p_kind:kind,p_target:target,p_level:level||null});document.querySelector('.omerta-decision-modal')?.remove();await syncNow(true);if(kind==='reveal')toast(`Révélation confirmée · exposition ${out.exposure_band||'mise à jour'}.`);else if(kind==='sanction')toast(out.outcome==='protected'?'La cible était déjà protégée.':'Conséquence irréversible enregistrée.');else toast('Décision OMERTÀ enregistrée.')}
    catch(e){console.error(e);toast('Cette décision n’est pas disponible ou a déjà été utilisée.')}
  };

  const basePrivateCardHtml=privateCardHtml;
  privateCardHtml=function(){
    let html=basePrivateCardHtml();if(!isOmerta(STATE.sync?.room?.scenario_id))return html;
    const ps=STATE.sync?.player?.private_state||{},role=omertaRole(),info=roleInfo(role);
    if(ps.omerta_objective){
      try{const t=document.createElement('template');t.innerHTML=html;const summary=t.content.querySelector('.role-summary span');if(summary)summary.textContent=ps.omerta_objective;html=t.innerHTML}catch(_){}
    }
    const note=`<div class="omerta-private-role"><span>RÔLE OMERTÀ</span><h3>${h(ps.omerta_role||info.label||role)}</h3>${ps.omerta_power?`<p><b>POUVOIR</b>${h(ps.omerta_power)}</p>`:''}</div>`;
    const dock=`<div class="omerta-decision-dock"><span><b>TÉLÉPHONES POSÉS</b>Discute d’abord. Valide seulement une décision irréversible.</span><button class="btn primary small" onclick="igrOmertaOpenDecision()">Valider une décision</button></div>`;
    html=html.replace('<div class="kicker">CARTE PRIVÉE · NE PAS MONTRER</div>',`<div class="kicker">CARTE PRIVÉE · NE PAS MONTRER</div>${note}`);
    return html + dock;
  };

  void accessStatus();
})();
