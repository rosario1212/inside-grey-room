/* Inside Grey Room v34.4 — HÉRITAGE · MAÎTRE online */
(()=>{'use strict';
const D=window.IGR_HERITAGE_MAITRE_DATA;if(!D)return;const {PACK,META,ROLES}=D;
const H='igr_heritage_online_v13_8',I='igr_social_identity_v1',G='igr_heritage_live_v2';
const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const st=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}},read=k=>{try{return JSON.parse(st().getItem(k)||'null')}catch{return null}},write=(k,v)=>st().setItem(k,JSON.stringify(v));
const sess=()=>{const s=read(H);return s?.campaign==='maitre'?s:null},role=id=>ROLES.find(r=>r.id===id)||{name:String(id||'RÔLE').toUpperCase(),public:''},pc=n=>PACK.chapters[Number(n)];
const rpcx=(n,a)=>typeof rpc==='function'?rpc(n,a):Promise.reject(new Error('rpc unavailable')),toastx=m=>{try{toast?.(m)}catch{console.log(m)}};
function put(x,preserveLobby=false){
 const a=$('#app');if(!a)return;
 const previousLobby=preserveLobby?a.querySelector('.hnet-lobby'):null;
 const previousY=Math.max(0,window.scrollY);
 const focused=document.activeElement?.closest?.('.hnet-role-card[data-role]');
 const roleId=focused?.dataset.role||null;
 a.innerHTML=typeof shell==='function'?shell(x,false):x;
 const nextLobby=preserveLobby?a.querySelector('.hnet-lobby'):null;
 if(previousLobby&&nextLobby){
  // A single scroll owner: v816 handles pointer-driven role selections.
  // The old card-geometry delta fought that guard and jumped on iPhone.
  if(!window.IGR_ROLE_VIEWPORT_V816?.isActive?.()){
   try{window.scrollTo({top:previousY,left:0,behavior:'instant'})}
   catch(_){window.scrollTo(0,previousY)}
   requestAnimationFrame(()=>{
    if(!nextLobby.isConnected||window.IGR_ROLE_VIEWPORT_V816?.isActive?.())return;
    try{window.scrollTo({top:previousY,left:0,behavior:'instant'})}
    catch(_){window.scrollTo(0,previousY)}
   });
  }
  const selected=roleId&&Array.from(nextLobby.querySelectorAll('.hnet-role-card[data-role]')).find(b=>b.dataset.role===roleId);
  if(selected&&!selected.disabled)selected.focus({preventScroll:true});
 }else{
  try{window.scrollTo({top:0,left:0,behavior:'instant'})}
  catch(_){window.scrollTo(0,0)}
 }
}
function clear(){try{st().removeItem(H);st().removeItem(G)}catch{};last=''}
function code(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(4);try{crypto.getRandomValues(a)}catch{for(let i=0;i<4;i++)a[i]=Math.random()*2**32}return'H'+[...a].map(x=>c[x%c.length]).join('')}
function variant(){try{let s=window.IGR_HERITAGE_MAITRE?.get?.()||window.IGR_HERITAGE?.get?.('maitre');if(!s){window.IGR_HERITAGE?.begin?.('maitre');s=window.IGR_HERITAGE?.get?.('maitre')}return s?.maitre?.canon?.variant||'blind'}catch{return'blind'}}
function secret(ch,id,v,carry){const card=window.IGR_HERITAGE_MAITRE?.roleCard?.(ch,id,v,carry||null);return card?[card.secret,card.objective]:['Aucune information supplémentaire.','Distingue faits et interprétations.']}
function inject(){const b=$('.maitre-page.hplay-dossier .hplay-launch-box');if(!b||b.dataset.maitreNet)return;const o=$('.hplay-launch',b);if(!o)return;const n=Number(o.dataset.chapter);if(!n)return;b.dataset.maitreNet='1';b.dataset.dualHeritage='1';const s=sess(),res=s&&Number(s.chapter)===n,act=o.dataset.maitreAction||'setup';b.querySelector('b').textContent='CHOISISSEZ LE MODE DE JEU';b.querySelector('p').textContent='Chaque joueur sur son téléphone, ou un téléphone partagé à table.';const r=document.createElement('div');r.className='heritage-dual-row';r.innerHTML=`<button class="btn primary" data-mnet="${res?'resume':'create'}" data-ch="${n}">${res?'REPRENDRE EN LIGNE':'MULTIJOUEUR EN LIGNE'}</button><button class="btn ghost" data-mnet="local" data-act="${esc(act)}" data-ch="${n}">LOCAL · 1 TÉLÉPHONE</button>`;o.replaceWith(r)}
function createView(n){put(`<main class="page hnet hplay-theme-maitre maitre-page"><header class="hnet-head"><button class="btn ghost small" data-mnet="back" data-ch="${n}">← MAÎTRE</button><span>HÉRITAGE · EN LIGNE</span></header><section class="hnet-create"><span>MAÎTRE · DOSSIER 0${n}</span><h1>Créer une cellule</h1><p>Invite les joueurs, puis lance le dossier.</p><label><span>TON PSEUDO</span><input id="mnetPseudo" maxlength="22" autocomplete="nickname" placeholder="Ton pseudo" value="${esc(st().getItem('igr_v9_last_pseudo')||'')}"></label><button class="btn primary block" data-mnet="createNow" data-ch="${n}">CRÉER LA CELLULE</button></section></main>`)}
async function createNow(n){const p=$('#mnetPseudo')?.value.trim(),id=read(I);if(!p)return toastx('Entre ton pseudo.');if(!id?.id||!id?.token)return toastx('Ton profil est requis.');let out,c;for(let i=0;i<5;i++){c=code();try{out=await rpcx('igr_heritage_online_create_maitre',{p_code:c,p_chapter:n,p_pseudo:p,p_profile_id:id.id,p_profile_token:id.token,p_variant:variant()});break}catch(e){if(i===4||!/duplicate|23505|collision/i.test(e.message||'')){console.error(e);return toastx('Création impossible.')}}}st().setItem('igr_v9_last_pseudo',p);write(H,{code:out.room_code||c,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,campaign:'maitre',chapter:n,practice:!!window.IGR_HERITAGE?.get?.('maitre')?.completed?.includes(n)});await window.IGR_HERITAGE_CONTEXT_V71?.publish?.();sync(true)}
function maitreRoleIds(chapter,count){
 const n=Math.max(5,Math.min(7,Number(count)||5));
 return Number(chapter)===3
  ?['avocat','client','associe','enqueteur',...(n>=6?['procureur']:[]),'juge',...(n>=7?['temoin']:[])]
  :['avocat','client','enqueteur','procureur','juge',...(n>=6?['associe']:[]),...(n>=7?['temoin']:[])];
}
function lobby(d){
 const h=!!sess()?.hostToken,n=d.room.chapter,c=d.players.length,picked=d.player?.preferred_role||null;
 const pool=maitreRoleIds(n,c),names=new Map(ROLES.map(r=>[r.id,r.name]));
 const taken=new Map(d.players.filter(p=>p.preferred_role).map(p=>[p.preferred_role,p]));
 const invalid=d.players.filter(p=>p.preferred_role&&!pool.includes(p.preferred_role));
 const cards=pool.map(id=>{
  const r=role(id),mine=picked===id,locked=!!taken.get(id)&&!mine;
  const rating=Math.max(1,Math.min(5,Number(r.activity)||2));
  return `<button type="button" class="hnet-role-card ${mine?'is-picked':''} ${locked?'is-taken':''}" data-mnet="role" data-role="${esc(id)}" aria-pressed="${mine}" aria-label="${esc(r.name+' — '+(r.short||r.public))}" ${locked?'disabled':''}>
    <span class="hnet-role-top"><b>${esc(r.name)}</b><em>${mine?'✓ CHOISI':locked?'PRIS':'CHOISIR'}</em></span>
    <span class="hnet-stars" aria-label="Activité estimée">${'★'.repeat(rating)+'☆'.repeat(5-rating)}</span>
  </button>`;
 }).join('');
 const rosterOpen=!!$('.hnet-lobby .hnet-roster-disclosure[open]');
 const roster=d.players.map((p,i)=>`<div><span>${i+1}</span><b>${esc(p.pseudo)}</b><small>${p.preferred_role?esc(names.get(p.preferred_role)||p.preferred_role):'AU HASARD'}${p.is_host?' · HÔTE':''}</small></div>`).join('');
 const canStart=c>=5&&!invalid.length,chosen=pool.includes(picked)?role(picked):null;
 const selectedRating=Math.max(1,Math.min(5,Number(chosen?.activity)||2));
 const selectedStars=chosen?'★'.repeat(selectedRating)+'☆'.repeat(5-selectedRating):'';
 put(`<main class="page hnet hplay-theme-maitre maitre-page"><header class="hnet-head"><button class="btn ghost small" data-mnet="leave">← Quitter</button><span>MAÎTRE · DOSSIER 0${n}</span></header>
  <section class="hnet-lobby"><div class="hnet-title"><span>SALON</span><h1>${esc(pc(n).title)}</h1><p>${c}/7 joueurs · minimum 5</p></div>
  <div class="hnet-code"><span>INVITATION</span><strong>${esc(d.room.code)}</strong><small>À partager</small><button type="button" class="hnet-code-copy" data-mnet="copy-code" data-code="${esc(d.room.code)}">COPIER</button></div>
  <section class="hnet-role-zone" aria-label="Choix des rôles">
   <div class="hnet-role-head"><div><h2>Ton rôle</h2></div></div>
   <div class="hnet-selected-role" role="status" aria-live="polite"><span>${chosen?'TON CHOIX':'SANS CHOIX'}</span><b>${esc(chosen?.name||'Au hasard au lancement')}</b><small>${esc(chosen?.short||chosen?.public||'Un rôle sera attribué au lancement.')}</small>${chosen?`<em title="Activité estimée">ACTIVITÉ · ${selectedStars}</em>`:''}</div>
   <div class="hnet-role-grid">${cards}</div>
   <div class="mnet-role-actions"><button type="button" class="hnet-role-random mnet-random-action" data-mnet="role" data-role="" data-random="1" aria-label="Tirer maintenant un rôle disponible au hasard"><span aria-hidden="true">⚄</span><b>Tirer un rôle</b></button>${picked?'<button type="button" class="mnet-role-reset" data-mnet="role" data-role="" aria-label="Annuler mon choix et recevoir un rôle au lancement">Annuler</button>':''}</div>
   ${invalid.length?`<p class="hnet-role-warning" role="alert">Choix à revoir : ${invalid.map(p=>esc(p.pseudo)).join(', ')}.</p>`:''}
  </section>
  <details class="hnet-roster-disclosure" ${rosterOpen?'open':''}><summary>Joueurs <span>${c}/7</span></summary><div class="hnet-players">${roster}</div></details>
  <p class="hnet-launch-hint">${c<5?`Encore ${5-c} joueur${5-c>1?'s':''}.`:invalid.length?'Un choix est indisponible.':''}</p>
  ${h?`<button class="btn primary block hnet-start" data-mnet="start" ${canStart?'':'disabled'}>${c<5?`EN ATTENTE (${5-c})`:invalid.length?'CHOIX À REVOIR':'LANCER LA PARTIE'}</button>`:'<div class="hnet-wait">En attente de l’hôte.</div>'}
  </section></main>`,true);
}
function reveal(d){const r=role(d.player.role_id),s=secret(d.room.chapter,d.player.role_id,d.room.maitre_variant,d.room.campaign_carry),ready=d.player.ready,c=d.players.filter(x=>x.ready).length;put(`<main class="page hplay hplay-reveal hplay-theme-maitre maitre-page mnet"><header class="hplay-top"><button class="hplay-back" data-mnet="leave">× <span>Quitter</span></button><div class="hplay-mode">EN LIGNE · ${c}/${d.players.length} PRÊTS</div></header><section class="hplay-private is-open"><span class="hplay-eyebrow">PERSONNAGE DE ${esc(d.player.pseudo)}</span><h1>${esc(d.player.pseudo)}</h1><p class="hplay-role-short"><b>${esc(r.name)}</b> — ${esc(r.short||r.public)}</p><span class="hplay-role-activity">${'ACTIVITÉ · '+'★'.repeat(Number(r.activity)||2)+'☆'.repeat(5-(Number(r.activity)||2))}</span><details class="hplay-role-full" open><summary>Lire la fiche complète</summary><p>${esc(r.public)}</p></details><div class="hplay-objective"><span>TON OBJECTIF</span><b>${esc(s[1])}</b></div><div class="hplay-secret"><span>CE QUE TU SAIS SEUL</span><b>${esc(s[0])}</b></div><button class="btn primary" data-mnet="ready" ${ready?'disabled':''}>${ready?'PRÊT · EN ATTENTE':'J’AI LU · PRÊT'}</button></section></main>`)}
function maitreOnlineHearingGuide(cycle){
  return [
    'Distinguez à l’oral fait confirmé, affirmation contestée et preuve manquante. Être proche du réseau ne signifie pas avoir participé à tous ses actes.',
    'L’Avocat présente l’angle, le Procureur confronte ses pièces et le Juge demande ce qui établit réellement la responsabilité.',
    'Avant le scrutin, chaque rôle dit ce qui est prouvé et ce qui demeure une hypothèse. Le Juge ne décide pas seul.'
  ][cycle]||'';
}
function play(d){const n=d.room.chapter,x=Math.min(2,Number(d.room.phase_index)||0),c=pc(n),cy=c.cycles[x],h=!!sess()?.hostToken,a=d.room.maitre_angle||'',m=d.room.maitre_demonstration||'',law=d.player.role_id==='avocat';put(`<main class="page hplay hplay-session hplay-theme-maitre maitre-page mnet"><header class="hplay-top"><button class="hplay-back" data-mnet="leave">••• <span>Session</span></button><div class="hplay-mode">EN LIGNE · CYCLE ${x+1}/3</div></header><section class="hplay-session-head"><span class="hplay-eyebrow">MAÎTRE · DOSSIER 0${n}</span><h1>${esc(cy[0])}</h1><p>${esc(cy[1])}</p></section><section class="hplay-panel hplay-table-card"><span>AU CENTRE DE LA TABLE</span>${d.room.campaign_carry?.summary?`<div class="hplay-conditional"><b>CONCLUSIONS ANTÉRIEURES</b><span>${esc(d.room.campaign_carry.summary)}</span></div>`:'' }<p>${x===0?esc(c.briefing):esc(c.question)}</p><div class="hplay-conditional maitre-hearing-guide"><b>REPÈRE D’AUDIENCE</b><span>${esc(maitreOnlineHearingGuide(x))}</span></div>${x>=1?`<details class="hplay-conditional maitre-exhibit"><summary>PIÈCE DE L’AUDIENCE · CONSULTER</summary><p>${esc(window.IGR_HERITAGE_MAITRE?.publicExhibit?.(n,x,d.room.campaign_carry)||'')}</p></details>`:''}${x===1?(law?`<div class="maitre-angle-box"><label><span>L’ANGLE</span><textarea id="mAngle" maxlength="600">${esc(a)}</textarea></label><label><span>LA DÉMONSTRATION · OPTIONNELLE</span><textarea id="mDemo" maxlength="600">${esc(m)}</textarea></label><button class="btn ghost" data-mnet="strategy">ENREGISTRER</button></div>`:`<div class="hplay-conditional"><b>STRATÉGIE</b><span>${a||m?'L’Avocat a enregistré sa stratégie.':'L’Avocat prépare son Angle.'}</span></div>`):''}${x===2&&(a||m)?`<div class="maitre-public-angle"><b>ANGLE VERROUILLÉ</b><span>${esc(a||'Aucun angle écrit.')}</span>${m?`<i>DÉMONSTRATION · ${esc(m)}</i>`:''}</div>`:''}</section><nav class="hplay-session-nav"><span></span><button class="btn primary" data-mnet="advance" ${h?'':'disabled'}>${h?(x<2?'CYCLE SUIVANT →':'PASSER À LA CONCLUSION →'):'EN ATTENTE DE L’HÔTE…'}</button></nav></main>`)}
function decision(d){
  const c=pc(d.room.chapter),chapter=Number(d.room.chapter),b=d.room.ballot_status||null;
  const owner=chapter===2?'CLIENT':chapter===5?'AVOCAT':chapter===3?'CLIENT + ASSOCIÉ (si défense commune)':'JUGE (présidence)';
  const voted=!!b?.my_vote,blocked=chapter===3&&d.room.campaign_carry?.maitre?.relationships?.associe==='broken';
  put(`<main class="page hplay hplay-decision hplay-theme-maitre maitre-page mnet">
    <header class="hplay-top"><button class="hplay-back" data-mnet="leave">× <span>Session</span></button><div class="hplay-mode">EN LIGNE · VOTE ${b?.vote_round||1}</div></header>
    <section class="hplay-decision-head"><span class="hplay-eyebrow">DÉLIBÉRATION COLLECTIVE · MAJORITÉ ABSOLUE</span><h1>${esc(c.question)}</h1>
      <p>${b?`${b.votes_cast}/${b.players} bulletins reçus. ${b.my_vote?'Votre vote est enregistré.':'Votez une seule fois sur votre téléphone.'} Majorité : ${b.majority}.`:'Connexion au scrutin…'}
      Le ${owner} conserve sa fonction : aucun rôle ne décide seul et le consentement personnel reste requis quand il s’impose.</p>
      <div class="hplay-conditional maitre-hearing-guide"><b>CE QUE LE VOTE ENGAGE</b><span>La majorité arrête la conclusion inscrite dans l’Héritage ; elle ne transforme pas une accusation en preuve et ne peut pas imposer un accord personnel refusé.</span></div>
    </section>
    <section class="hplay-options">${c.outcomes.map(o=>`<button type="button" data-mnet="decide" data-id="${o.id}" ${voted||blocked&&o.id==='common'?'disabled':''}><span>${esc(o.title)}</span><small>${esc(o.detail)}</small><i>${voted&&b.my_vote===o.id?'VOTE ENREGISTRÉ':blocked&&o.id==='common'?'CONFLIT D’INTÉRÊTS':voted?'VOTE DÉJÀ REÇU':'VOTER →'}</i></button>`).join('')}</section>
    ${b?.vote_round>1?'<div class="hplay-panel">La majorité ou les consentements nécessaires n’ont pas été réunis au tour précédent. Reprenez les arguments avant de voter.</div>':''}
  </main>`);
}
function result(d){const c=pc(d.room.chapter),o=c.outcomes.find(x=>x.id===d.room.decision_id),h=!!sess()?.hostToken;if(!o)return;put(`<main class="page hplay hplay-result hplay-theme-maitre maitre-page mnet"><header class="hplay-top"><div class="hplay-mode">EN LIGNE · CE QUI RESTE</div></header><section class="hplay-result-card maitre-result"><span class="hplay-eyebrow">CONCLUSION · DOSSIER 0${d.room.chapter}</span><h1>${esc(o.title)}</h1><p>${esc(window.IGR_HERITAGE_MAITRE?.ending?.(Number(d.room.chapter),o.id,d.room.campaign_carry)||o.trace||o.detail)}</p>${d.room.maitre_angle?`<div class="maitre-public-angle"><b>ANGLE</b><span>${esc(d.room.maitre_angle)}</span>${d.room.maitre_demonstration?`<i>DÉMONSTRATION · ${esc(d.room.maitre_demonstration)}</i>`:''}</div>`:''}${h?'<button class="btn primary" data-mnet="finish">INSCRIRE DANS L’HÉRITAGE</button>':'<div class="hnet-wait">L’hôte inscrit la conclusion…</div>'}</section></main>`)}
function persistConfirmed(d){
  const s=sess(),r=d?.room;
  if(!s?.hostToken||r?.stage!=='finished'||r.campaign_id!=='maitre')return false;
  const ch=Number(r.chapter),id=r.decision_id;
  if(!pc(ch)?.outcomes?.some(o=>o.id===id))return false;
  if(s.practice)return true;
  const existing=window.IGR_HERITAGE?.get?.('maitre');
  if(existing?.completed?.includes(ch))return true;
  const outcome=window.IGR_HERITAGE?.completeChapter?.('maitre',ch,{
    outcomeId:id,angle:r.maitre_angle||'',demonstration:r.maitre_demonstration||''
  });
  return !!outcome?.ok;
}
function renderFinished(d){
  const s=sess();if(!s)return;
  if(s.hostToken){
    if(!persistConfirmed(d)){
      put('<main class="page hnet hplay-theme-maitre maitre-page"><section class="hnet-finished"><h1>Sauvegarde à terminer</h1><p>Le serveur a clos la partie, mais la conclusion n’a pas été sauvegardée sur cet appareil. Votre accès reste intact.</p><button class="btn primary" data-mnet="retry">RÉESSAYER LA SYNCHRONISATION</button></section></main>');
      return;
    }
    clear();return window.IGR_HERITAGE_MAITRE?.open?.();
  }
  clear();
  put('<main class="page hnet hplay-theme-maitre maitre-page"><section class="hnet-finished"><h1>Conclusion collective confirmée</h1><p>Le serveur a enregistré le résultat du Conseil. L’hôte conserve la progression de la campagne.</p><button class="btn primary" data-mnet="home">RETOUR AUX DOSSIERS</button></section></main>');
}
function route(d){if(d.room?.campaign_id!=='maitre')return;({lobby,reveal:result,role_reading:reveal,play,decision,finished:()=>finishPending?null:renderFinished(d)}[d.room.stage]||(()=>{}))(d)}

let last='',busy=false,finishPending=false,suspended=false,lastStage='',rolePending=false;
async function sync(force=false){
  const s=sess();if(!s||busy||(suspended&&!force))return;
  busy=true;
  try{
    const d=await rpcx('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    lastStage=d.room?.stage||'';
    if(d.room?.stage==='decision')
      d.room.ballot_status=await rpcx('igr_heritage_online_maitre_ballot_status',{p_code:s.code,p_player_token:s.token});
    document.dispatchEvent(new CustomEvent('igr-heritage-sync',{detail:d}));
    const b=d.room.ballot_status;
    const g=JSON.stringify([d.room.status,d.room.stage,d.room.phase_index,d.room.decision_id,
      d.room.maitre_angle,d.room.maitre_demonstration,b?.vote_round,b?.votes_cast,b?.my_vote,
      d.players.map(p=>[p.id,p.ready,p.role_id,p.preferred_role])]);
    if(force||g!==last){route(d);last=g}
  }catch(e){console.warn('[MAÎTRE] sync',e);if(/unauthorized|not found|expired/i.test(e.message||''))clear()}
  finally{busy=false}
}
async function leave(){
  const s=sess();if(!s)return;
  if(lastStage&&lastStage!=='lobby'&&lastStage!=='finished'){
    suspended=true;
    await rpcx('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token}).catch(()=>{});
    window.IGR_HERITAGE_MAITRE?.openChapter?.(s.chapter);
    toastx('Votre place est conservée : reprenez cette salle pour participer au scrutin.');
    return;
  }
  await rpcx('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token}).catch(()=>{});
  const n=s.chapter;clear();window.IGR_HERITAGE_MAITRE?.openChapter?.(n);
}
async function finishOnline(){
  const s=sess();if(!s?.hostToken||finishPending)return;
  finishPending=true;
  try{
    const confirmation=await rpcx('igr_heritage_online_finish',{p_code:s.code,p_host_token:s.hostToken});
    if(confirmation?.ok===false)throw new Error('server denied finish');
    const verified=await rpcx('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    if(verified?.room?.stage!=='finished')throw new Error('server finish not confirmed');
    if(!persistConfirmed(verified))throw new Error('campaign persistence failed');
    clear();window.IGR_HERITAGE_MAITRE?.open?.();
  }catch(err){console.warn('[MAÎTRE] finish',err);toastx('Conclusion non synchronisée. Relancez la sauvegarde depuis la session.')}
  finally{finishPending=false}
}
/* A random tap reserves an available public role immediately.
   No preference remains the fallback server-side random assignment at launch. */
function availableMaitreRoleButtons(){
 return Array.from(document.querySelectorAll('.maitre-page.hnet .hnet-role-grid .hnet-role-card[data-role]'))
  .filter(b=>b.dataset.role&&!b.disabled&&!b.classList.contains('is-taken'));
}
async function drawMaitreRole(s){
 const all=availableMaitreRoleButtons();
 const fresh=all.filter(b=>b.getAttribute('aria-pressed')!=='true');
 const remaining=(fresh.length?fresh:all).slice();
 if(!remaining.length){toastx('Aucun rôle libre.');await sync(true);return}
 while(remaining.length){
  const idx=Math.floor(Math.random()*remaining.length),btn=remaining.splice(idx,1)[0];
  try{
   const answer=await rpcx('igr_heritage_online_choose_role',{p_code:s.code,p_player_token:s.token,p_role_id:btn.dataset.role});
   if(answer?.ok===false)throw Error('role_not_available');
   await sync(true);
   toastx('Rôle tiré : '+(btn.querySelector('.hnet-role-top b')?.textContent||btn.dataset.role));
   return;
  }catch(e){
   if(!/role_already_taken|role_not_available|selected_role_not_available/i.test(String(e?.message||''))){
    console.warn('[MAÎTRE] draw',e);toastx('Tirage impossible.');await sync(true).catch(()=>{});return;
   }
  }
 }
 toastx('Aucun rôle libre.');await sync(true).catch(()=>{});
}
async function click(n){const a=n.dataset.mnet,ch=Number(n.dataset.ch||sess()?.chapter||1);if(a==='create')return createView(ch);if(a==='resume'||a==='retry'){suspended=false;return sync(true)}if(a==='home')return window.IGR_HERITAGE_MAITRE?.open?.();if(a==='back')return window.IGR_HERITAGE_MAITRE?.openChapter?.(ch);if(a==='local'){if(sess()){if(lastStage&&lastStage!=='lobby'&&lastStage!=='finished')return toastx('Cette salle est en cours : reprenez la session avant de passer en local.');await rpcx('igr_heritage_online_leave',{p_code:sess().code,p_player_token:sess().token});clear()}const t=document.createElement('button');t.hidden=true;t.dataset.maitreAction=n.dataset.act||'setup';t.dataset.chapter=String(ch);document.body.appendChild(t);t.click();t.remove();return}if(a==='createNow')return createNow(ch);if(a==='copy-code'){const code=n.dataset.code||'';try{await navigator.clipboard.writeText(code);toastx('Code copié.')}catch{toastx('Code : '+code)}return}if(a==='leave')return leave();const s=sess();if(!s)return;if(a==='role'){
  if(rolePending)return;
  if(n.dataset.random!=='1'&&n.getAttribute('aria-pressed')==='true')return;
  rolePending=true;
  try{
   if(n.dataset.random==='1')await drawMaitreRole(s);
   else{
    const roleId=n.dataset.role||null;
    const response=await rpcx('igr_heritage_online_choose_role',{p_code:s.code,p_player_token:s.token,p_role_id:roleId});
    if(response?.ok===false)throw Error('role_not_available');
    await sync(true);
    if(!roleId)toastx('Tirage au lancement.');
   }
  }catch(e){const msg=String(e?.message||'');toastx(/role_already_taken/i.test(msg)?'Rôle déjà pris.':/role_not_available/i.test(msg)?'Rôle indisponible.':'Choix impossible.');await sync(true).catch(()=>{})}
  finally{rolePending=false}
  return;
 }if(a==='start'){try{await rpcx('igr_heritage_online_start',{p_code:s.code,p_host_token:s.hostToken})}
 catch(e){const msg=String(e?.message||'');toastx(/selected_role_not_available/i.test(msg)?'Un rôle n’est plus disponible, ajustez les choix.':'Impossible de lancer : vérifiez les rôles et le nombre de joueurs.');await sync(true).catch(()=>{});return}}if(a==='ready')await rpcx('igr_heritage_online_ready',{p_code:s.code,p_player_token:s.token});if(a==='strategy')await rpcx('igr_heritage_online_maitre_strategy',{p_code:s.code,p_player_token:s.token,p_angle:$('#mAngle')?.value||'',p_demonstration:$('#mDemo')?.value||''});if(a==='advance'){const angleBox=$('#mAngle');if(angleBox){const angle=angleBox.value.trim(),demo=$('#mDemo')?.value||'';if(!angle)return toastx('Formule un ANGLE avant de passer au Cycle III.');await rpcx('igr_heritage_online_maitre_strategy',{p_code:s.code,p_player_token:s.token,p_angle:angle,p_demonstration:demo})}await rpcx('igr_heritage_online_advance_v71',{p_code:s.code,p_host_token:s.hostToken});}if(a==='decide')await rpcx('igr_heritage_online_vote_maitre',{p_code:s.code,p_player_token:s.token,p_option_id:n.dataset.id});if(a==='finish')return finishOnline();await sync(true)}
function boot(){document.addEventListener('click',e=>{const n=e.target.closest?.('[data-mnet]');if(!n)return;e.preventDefault();e.stopImmediatePropagation();click(n).catch(x=>{console.error(x);toastx('Action impossible.')})},true);new MutationObserver(()=>queueMicrotask(()=>{inject();if(sess()&&!suspended&&!$('.mnet')&&!$('.hnet.hplay-theme-maitre'))sync(true)})).observe(document.documentElement,{childList:true,subtree:true});setInterval(()=>{if(!document.hidden&&sess())sync(false)},650);inject();if(sess())sync(true);window.IGR_HERITAGE_MAITRE_ONLINE=Object.freeze({version:'79.0',create:n=>createView(Math.max(1,Math.min(5,Number(n)||1))),resume:()=>{suspended=false;return sync(true)},roleCard:(chapter,roleId,variantKey,carry)=>{const r=role(roleId),sec=secret(Number(chapter),roleId,variantKey,carry);return Object.freeze({name:r.name,public:r.public||'',secret:sec[0]||'',objective:sec[1]||''})}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();