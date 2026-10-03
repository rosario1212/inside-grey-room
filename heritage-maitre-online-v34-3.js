/* Inside Grey Room v34.3 — HÉRITAGE · MAÎTRE online multiplayer */
(()=>{
'use strict';
const VERSION='34.3-maitre-online';
const KEY='igr_heritage_maitre_online_v34_3';
const IDENTITY_KEY='igr_social_identity_v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const storage=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
const read=(k)=>{try{return JSON.parse(storage().getItem(k)||'null')}catch{return null}};
const write=(k,v)=>{try{storage().setItem(k,JSON.stringify(v));return v}catch{return v}};
const remove=k=>{try{storage().removeItem(k)}catch{}};
const DATA=()=>window.IGR_HERITAGE_MAITRE_DATA;
const session=()=>read(KEY);
const saveSession=v=>write(KEY,v);
const toastX=m=>{try{toast?.(m)}catch{console.log(m)}};
function shellPut(html){const root=$('#app');if(!root)return;root.innerHTML=typeof shell==='function'?shell(html,false):`<div class="app">${html}</div>`;requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}))}
function secureIndex(n){if(n<=1)return 0;try{const a=new Uint32Array(1),lim=Math.floor(0x100000000/n)*n;let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n}catch{return Math.floor(Math.random()*n)}}
function newCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='H';for(let i=0;i<4;i++)s+=chars[secureIndex(chars.length)];return s}
function pseudoDefault(){try{return loadProfile?.().pseudo||storage().getItem('igr_v9_last_pseudo')||''}catch{return storage().getItem('igr_v9_last_pseudo')||''}}
function profileIdentity(){return read(IDENTITY_KEY)}
function chapterData(n){return DATA()?.PACK?.chapters?.[Number(n)]}
function roleData(id){return DATA()?.ROLES?.find?.(r=>r.id===id)||null}
function campaignChapter(){return Math.max(1,Math.min(5,Number(session()?.chapter)||1))}
function roman(n){return ['','I','II','III','IV','V'][Number(n)]||String(n)}
function isRpcReady(){return typeof rpc==='function'}

let watcher=null,lastSig='';
function stopWatcher(){if(watcher){clearInterval(watcher);watcher=null}}
function startWatcher(immediate=true){stopWatcher();watcher=setInterval(()=>sync(false),900);if(immediate)sync(true)}

function injectModeChooser(){
  const box=$('.maitre-page .hplay-launch-box');
  if(!box||box.querySelector('.maitre-play-mode-row'))return;
  const old=box.querySelector('.hplay-launch[data-maitre-action]');
  if(!old)return;
  const chapter=Number(old.dataset.chapter)||1;
  const action=old.dataset.maitreAction||'setup';
  const s=session();
  const resume=!!(s?.code&&Number(s.chapter)===chapter);
  const row=document.createElement('div');
  row.className='maitre-play-mode-row';
  row.innerHTML=`<button type="button" class="btn maitre-online-btn" data-maitre-net-open="${chapter}">${resume?'REPRENDRE EN LIGNE':'MULTIJOUEUR EN LIGNE'}</button><button type="button" class="btn ghost maitre-local-btn" data-maitre-local="${esc(action)}" data-chapter="${chapter}">LOCAL · UN TÉLÉPHONE</button>`;
  old.replaceWith(row);
}

function renderGate(chapter){
  const ch=chapterData(chapter);const s=session();
  if(s?.code&&Number(s.chapter)===Number(chapter)){startWatcher(true);return}
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">
    <header class="hplay-top"><button class="hplay-back" data-mn="back-chapter">← <span>MAÎTRE</span></button><div class="hplay-mode">MULTIJOUEUR EN LIGNE</div></header>
    <section class="maitre-net-shell">
      <article class="maitre-net-card"><span class="maitre-net-kicker">DOSSIER ${roman(chapter)} · ${esc(ch?.title||'')}</span><h1>Jouer sur plusieurs téléphones</h1><p>Crée une cellule ou rejoins-en une avec son code. Chaque joueur reçoit son rôle sur son propre écran et la partie reste synchronisée.</p>
        <div class="maitre-net-grid">
          <div class="maitre-net-choice"><span class="maitre-net-kicker">HÔTE</span><h2>Créer</h2><label><span>TON PSEUDO</span><input id="mnCreatePseudo" maxlength="22" autocomplete="nickname" value="${esc(pseudoDefault())}" placeholder="Pseudo"></label><button class="btn primary block" data-mn="create" data-chapter="${chapter}">CRÉER LA CELLULE</button></div>
          <div class="maitre-net-choice"><span class="maitre-net-kicker">JOUEUR</span><h2>Rejoindre</h2><label><span>TON PSEUDO</span><input id="mnJoinPseudo" maxlength="22" autocomplete="nickname" value="${esc(pseudoDefault())}" placeholder="Pseudo"></label><label><span>CODE</span><input id="mnJoinCode" maxlength="5" inputmode="text" autocapitalize="characters" placeholder="H4K7Q"></label><button class="btn ghost block" data-mn="join">REJOINDRE</button></div>
        </div>
      </article>
    </section>
  </main>`);
}

async function createRoom(chapter){
  if(!isRpcReady())return toastX('Connexion multijoueur indisponible.');
  const pseudo=$('#mnCreatePseudo')?.value.trim();if(!pseudo)return toastX('Entre ton pseudo.');
  const ident=profileIdentity();if(!ident?.id||!ident?.token)return toastX('Ton profil est requis pour créer une cellule HÉRITAGE.');
  let out=null,code='';
  for(let i=0;i<5;i++){
    code=newCode();
    try{out=await rpc('igr_heritage_online_create',{p_code:code,p_campaign_id:'maitre',p_chapter:Number(chapter),p_pseudo:pseudo,p_profile_id:ident.id,p_profile_token:ident.token});break}
    catch(e){if(i===4||!/duplicate|23505/i.test(`${e.code||''} ${e.message||''}`)){console.error(e);return toastX(/access/i.test(e.message||'')?'Accès HÉRITAGE requis.':'Création impossible.')}}
  }
  storage().setItem('igr_v9_last_pseudo',pseudo);
  saveSession({code:out.room_code||code,token:out.player_token,hostToken:out.host_token,playerId:out.player_id,chapter:Number(chapter)});
  startWatcher(true);
}
async function joinRoom(){
  if(!isRpcReady())return toastX('Connexion multijoueur indisponible.');
  const pseudo=$('#mnJoinPseudo')?.value.trim(),code=$('#mnJoinCode')?.value.trim().toUpperCase();
  if(!pseudo||!/^H[A-Z2-9]{4}$/.test(code||''))return toastX('Pseudo et code HÉRITAGE requis.');
  try{
    const out=await rpc('igr_heritage_online_join',{p_code:code,p_pseudo:pseudo});
    if(out.campaign_id!=='maitre')return toastX('Ce code appartient à une autre campagne HÉRITAGE.');
    storage().setItem('igr_v9_last_pseudo',pseudo);
    saveSession({code:out.room_code||code,token:out.player_token,hostToken:null,playerId:out.player_id,chapter:Number(out.chapter)});
    startWatcher(true);
  }catch(e){console.error(e);toastX(/full/i.test(e.message||'')?'Cellule complète.':/started/i.test(e.message||'')?'Cette partie a déjà commencé.':'Impossible de rejoindre cette cellule.')}
}
async function sync(force=false){
  const s=session();if(!s?.code||!s?.token)return;if(document.hidden&&!force)return;
  try{
    const d=await rpc('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    if(d.room?.campaign_id!=='maitre')throw new Error('wrong campaign');
    const sig=JSON.stringify([d.room?.stage,d.room?.phase_index,d.room?.decision_id,d.room?.maitre_angle,d.room?.maitre_demonstration,(d.players||[]).map(p=>[p.id,p.ready,p.role_id])]);
    if(!force&&sig===lastSig)return;lastSig=sig;route(d);
  }catch(e){console.warn('[MAÎTRE online]',e.message);if(/unauthorized|not found|expired|wrong campaign/i.test(e.message||'')){stopWatcher();remove(KEY);toastX('La cellule MAÎTRE n’est plus disponible.')}}
}
function route(d){
  const stage=d.room?.stage;
  if(stage==='lobby')return renderLobby(d);
  if(stage==='role_reading')return renderRole(d);
  if(stage==='play')return renderCycle(d);
  if(stage==='decision')return renderDecision(d);
  if(stage==='reveal')return renderResult(d);
  if(stage==='finished')return renderFinished(d);
}
function top(title,sub='MULTIJOUEUR EN LIGNE'){return `<header class="hplay-top"><button class="hplay-back" data-mn="leave">← <span>Quitter</span></button><div class="hplay-mode">${esc(sub)} · ${esc(title)}</div></header>`}
function renderLobby(d){
  const host=!!session()?.hostToken,count=d.players?.length||0,ch=chapterData(d.room.chapter);
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell">
    <article class="maitre-code"><span>CODE DE CELLULE</span><strong>${esc(d.room.code)}</strong><small>5 à 7 joueurs · chacun rejoint depuis MAÎTRE → Multijoueur en ligne</small></article>
    <article class="maitre-net-card"><span class="maitre-net-kicker">${esc(ch?.title||'')}</span><h1>Cellule judiciaire</h1><p>${count}/7 joueurs connectés · minimum 5 pour commencer.</p><div class="maitre-players">${(d.players||[]).map((p,i)=>`<div class="maitre-player"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(p.pseudo)}</b><small>${p.is_host?'HÔTE':'CONNECTÉ'}</small></div>`).join('')}</div>${host?`<div class="maitre-net-actions"><button class="btn primary block" data-mn="start" ${count<5?'disabled':''}>${count<5?`ENCORE ${5-count} JOUEUR${5-count>1?'S':''}`:'LANCER LE DOSSIER'}</button></div>`:'<div class="maitre-net-wait">EN ATTENTE DE L’HÔTE…</div>'}</article>
  </section></main>`);
}
function roleMission(role,chapter){
  const common={
    avocat:'Construis une ligne défendable. Ne transforme jamais une hypothèse en faux fait.',
    client:'Protège tes intérêts sans oublier que ce que tu admets aujourd’hui peut devenir une Trace demain.',
    enqueteur:'Sépare proximité, connaissance, bénéfice et responsabilité. Une relation n’est pas une preuve de complicité.',
    procureur:'Teste la cohérence des liens et attaque les raccourcis de la défense sans prétendre connaître la vérité canonique.',
    juge:'Tu ne connais pas la vérité canonique. Décide uniquement à partir de ce qui survit aux échanges.',
    associe:chapter===3?'Tes intérêts semblent encore communs avec ceux du Client. Observe le moment où ils cessent de l’être.':'Tu appartiens au même réseau relationnel que le Client, sans que votre degré de responsabilité soit identique.',
    temoin:'Apporte ton élément de contexte au bon moment. Une pièce peut changer de sens selon ce qu’elle permet réellement d’établir.'
  };return common[role]||'Joue ton rôle sans accéder à la vérité canonique.'
}
function renderRole(d){
  const r=roleData(d.player?.role_id),ready=!!d.player?.ready;
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell"><article class="maitre-role-card"><span>VOTRE RÔLE · ÉCRAN PRIVÉ</span><h1>${esc(r?.name||d.player?.role_id||'RÔLE')}</h1><p>${esc(r?.public||'')}</p><div class="trace" style="margin-top:16px">${esc(roleMission(d.player?.role_id,d.room.chapter))}</div>${ready?'<div class="maitre-net-wait">PRÊT · EN ATTENTE DES AUTRES…</div>':`<div class="maitre-net-actions"><button class="btn primary block" data-mn="ready">J’AI LU · PRÊT</button></div>`}</article></section></main>`);
}
function renderCycle(d){
  const ch=chapterData(d.room.chapter),idx=Math.max(0,Math.min(2,Number(d.room.phase_index)||0)),cy=ch?.cycles?.[idx]||[],host=!!session()?.hostToken,isLawyer=d.player?.role_id==='avocat';
  const publicStrategy=(d.room.maitre_angle||d.room.maitre_demonstration)?`<div class="maitre-public-strategy">${d.room.maitre_angle?`<b>L’ANGLE</b><p>${esc(d.room.maitre_angle)}</p>`:''}${d.room.maitre_demonstration?`<b style="margin-top:10px">LA DÉMONSTRATION</b><p>${esc(d.room.maitre_demonstration)}</p>`:''}</div>`:'';
  const lawyerBox=(idx===1&&isLawyer)?`<div class="maitre-strategy"><label><span>L’ANGLE · LECTURE QUE VOUS DÉFENDEZ</span><textarea id="mnAngle" maxlength="600" placeholder="Formulez votre angle…">${esc(d.room.maitre_angle||'')}</textarea></label><label><span>LA DÉMONSTRATION · FACULTATIVE ET RISQUÉE</span><textarea id="mnDemo" maxlength="600" placeholder="Décrivez votre démonstration…">${esc(d.room.maitre_demonstration||'')}</textarea></label><button class="btn ghost" data-mn="strategy">RENDRE PUBLIC</button></div>`:'';
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell"><article class="maitre-cycle"><header><div><span class="maitre-net-kicker">CYCLE ${idx+1}/3</span><h1>${esc(String(cy[0]||'').replace(/^CYCLE\s+[IVX]+\s*·\s*/i,''))}</h1></div><b>${esc(roleData(d.player?.role_id)?.name||d.player?.role_id||'')}</b></header><div class="maitre-cycle-copy">${esc(cy[1]||'')}</div>${publicStrategy}${lawyerBox}<div class="maitre-players">${(d.players||[]).map(p=>`<div class="maitre-player"><span>${String((p.seat_index??0)+1).padStart(2,'0')}</span><b>${esc(p.pseudo)}</b><small>${esc(roleData(p.role_id)?.name||p.role_id||'')}</small></div>`).join('')}</div>${host?`<div class="maitre-net-actions"><button class="btn primary block" data-mn="advance">${idx<2?'PASSER AU CYCLE SUIVANT':'PASSER À LA CONCLUSION'}</button></div>`:'<div class="maitre-net-wait">L’HÔTE CONTRÔLE L’AVANCEMENT</div>'}</article></section></main>`);
}
function renderDecision(d){
  const ch=chapterData(d.room.chapter),host=!!session()?.hostToken;
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell"><article class="maitre-net-card"><span class="maitre-net-kicker">CONCLUSION DU DOSSIER</span><h1>Ce qui devient vrai</h1><p>Le Juge annonce ce qui est juridiquement retenu. L’hôte l’inscrit dans l’Héritage : cette conclusion conditionnera le dossier suivant.</p>${host?`<div class="maitre-outcomes">${(ch?.outcomes||[]).map(o=>`<button class="maitre-outcome" data-mn="decide" data-outcome="${esc(o.id)}"><b>${esc(o.title)}</b><span>${esc(o.detail)}</span></button>`).join('')}</div>`:'<div class="maitre-net-wait">LE JUGE DÉLIBÈRE · L’HÔTE ENREGISTRERA LA CONCLUSION</div>'}</article></section></main>`);
}
function applyHostConclusion(d,out){
  const s=session();if(!s?.hostToken||!out)return;
  const key=`igr_maitre_online_applied_${d.room.code}_${d.room.chapter}_${out.id}`;
  if(storage().getItem(key))return;
  try{window.IGR_HERITAGE?.completeChapter?.('maitre',Number(d.room.chapter),{outcomeId:out.id,angle:d.room.maitre_angle||'',demonstration:d.room.maitre_demonstration||''});storage().setItem(key,'1')}catch(e){console.warn('[MAÎTRE online] conclusion locale',e)}
}
function renderResult(d){
  const ch=chapterData(d.room.chapter),out=ch?.outcomes?.find(o=>o.id===d.room.decision_id),host=!!session()?.hostToken;applyHostConclusion(d,out);
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell"><article class="maitre-result"><span class="maitre-net-kicker">CONCLUSION CANONIQUE DE CAMPAGNE</span><h1>${esc(out?.title||'DOSSIER CLOS')}</h1><p>${esc(out?.detail||'')}</p>${out?.trace?`<div class="trace"><b>TRACE PERSISTANTE</b><br>${esc(out.trace)}</div>`:''}${d.room.maitre_angle?`<div class="maitre-public-strategy"><b>L’ANGLE RETENU DANS L’HISTORIQUE</b><p>${esc(d.room.maitre_angle)}</p>${d.room.maitre_demonstration?`<b>LA DÉMONSTRATION</b><p>${esc(d.room.maitre_demonstration)}</p>`:''}</div>`:''}${host?'<div class="maitre-net-actions"><button class="btn primary block" data-mn="finish">CLOTURER LA CELLULE</button></div>':'<div class="maitre-net-wait">CONCLUSION ENREGISTRÉE PAR L’HÔTE</div>'}</article></section></main>`);
}
function renderFinished(d){
  stopWatcher();
  shellPut(`<main class="page hplay hplay-theme-maitre maitre-page maitre-net">${top(`DOSSIER ${roman(d.room.chapter)}`)}<section class="maitre-net-shell"><article class="maitre-result"><span class="maitre-net-kicker">CELLULE TERMINÉE</span><h1>La Trace reste.</h1><p>La conclusion du dossier est archivée dans la campagne de l’hôte. Le dossier suivant repartira de ce qui a été établi ici.</p><div class="maitre-net-actions"><button class="btn primary block" data-mn="return">RETOURNER À MAÎTRE</button></div></article></section></main>`);
}

async function doLeave(){
  const s=session();stopWatcher();
  if(s?.code&&s?.token&&isRpcReady()){try{await rpc('igr_heritage_online_leave',{p_code:s.code,p_player_token:s.token})}catch{}}
  remove(KEY);window.IGR_HERITAGE_MAITRE?.open?.();
}
async function doStart(){const s=session();if(!s?.hostToken)return;try{await rpc('igr_heritage_online_start',{p_code:s.code,p_host_token:s.hostToken});await sync(true)}catch(e){console.error(e);toastX('Il faut 5 à 7 joueurs pour lancer.')}}
async function doReady(){const s=session();if(!s)return;try{await rpc('igr_heritage_online_ready',{p_code:s.code,p_player_token:s.token});await sync(true)}catch(e){console.error(e);toastX('Impossible de valider le rôle.')}}
async function doAdvance(){const s=session();if(!s?.hostToken)return;try{await rpc('igr_heritage_online_advance',{p_code:s.code,p_host_token:s.hostToken});await sync(true)}catch(e){console.error(e);toastX('Impossible de passer au cycle suivant.')}}
async function doStrategy(){const s=session();if(!s)return;try{await rpc('igr_heritage_online_maitre_strategy',{p_code:s.code,p_player_token:s.token,p_angle:$('#mnAngle')?.value||'',p_demonstration:$('#mnDemo')?.value||''});toastX('Angle transmis à toute la cellule.');await sync(true)}catch(e){console.error(e);toastX('Impossible de publier cette stratégie.')}}
async function doDecide(id){const s=session();if(!s?.hostToken||!id)return;try{await rpc('igr_heritage_online_decide',{p_code:s.code,p_host_token:s.hostToken,p_option_id:id});await sync(true)}catch(e){console.error(e);toastX('Impossible d’enregistrer cette conclusion.')}}
async function doFinish(){const s=session();if(!s?.hostToken)return;try{await rpc('igr_heritage_online_finish',{p_code:s.code,p_host_token:s.hostToken});await sync(true)}catch(e){console.error(e);toastX('Impossible de clôturer la cellule.')}}

function onClick(e){
  const open=e.target.closest('[data-maitre-net-open]');if(open){e.preventDefault();const n=Number(open.dataset.maitreNetOpen)||1;const s=session();if(s?.code&&Number(s.chapter)===n)startWatcher(true);else renderGate(n);return}
  const local=e.target.closest('[data-maitre-local]');if(local){e.preventDefault();const tmp=document.createElement('button');tmp.type='button';tmp.dataset.maitreAction=local.dataset.maitreLocal||'setup';tmp.dataset.chapter=local.dataset.chapter||'1';tmp.style.display='none';document.body.appendChild(tmp);tmp.click();tmp.remove();return}
  const a=e.target.closest('[data-mn]');if(!a)return;const cmd=a.dataset.mn;
  if(cmd==='back-chapter'){window.IGR_HERITAGE_MAITRE?.openChapter?.(campaignChapter());return}
  if(cmd==='create'){createRoom(Number(a.dataset.chapter)||1);return}
  if(cmd==='join'){joinRoom();return}
  if(cmd==='leave'){doLeave();return}
  if(cmd==='start'){doStart();return}
  if(cmd==='ready'){doReady();return}
  if(cmd==='advance'){doAdvance();return}
  if(cmd==='strategy'){doStrategy();return}
  if(cmd==='decide'){doDecide(a.dataset.outcome);return}
  if(cmd==='finish'){doFinish();return}
  if(cmd==='return'){remove(KEY);window.IGR_HERITAGE_MAITRE?.open?.();return}
}
function boot(){
  document.addEventListener('click',onClick);
  const obs=new MutationObserver(()=>queueMicrotask(injectModeChooser));obs.observe(document.documentElement,{childList:true,subtree:true});
  injectModeChooser();
  const s=session();if(s?.code)startWatcher(false);
  window.IGR_HERITAGE_MAITRE_ONLINE=Object.freeze({version:VERSION,open:renderGate,resume:()=>startWatcher(true),leave:doLeave});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
