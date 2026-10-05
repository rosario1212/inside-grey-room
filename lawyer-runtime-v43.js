/* Inside Grey Room — v43 lawyer recalibration
   - Repeatable representation requests while no lawyer is locked to a client.
   - One official client per lawyer, irreversible only after explicit confirmation.
   - 60s max pre-acceptance / unofficial consultations.
   - Client exposure brief, confrontation/interrogation context, and pre-conclusion prompts.
*/
(()=>{
'use strict';
const VERSION='v43-lawyer-one-client';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'';
const players=()=>Array.isArray(sync()?.players)?sync().players:[];
const suspects=()=>Array.isArray(sync()?.suspects)?sync().suspects:players().filter(p=>p.public_role==='suspect');
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase();
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roomCode=()=>S()?.room||room()?.code||'';
const token=()=>S()?.token||'';
const lawyerPresent=()=>players().some(p=>p.public_role==='maitre');
const lawyerRelevant=()=>['maitre','suspect'].includes(role())&&lawyerPresent();
let cache=null,loading=false,lastSig='',refreshQueued=false;

function playerName(id){return players().find(p=>String(p.id)===String(id))?.pseudo||suspects().find(p=>String(p.id)===String(id))?.pseudo||copy('Suspect','Suspect')}
function phase(){return String(room()?.phase||'')}
function eventParticipants(){const v=room()?.state?.event_participants;return Array.isArray(v)?v.map(String):[]}
function myId(){return String(me()?.id||S()?.playerId||'')}
function clientId(){return String(cache?.client?.id||'')}
function isOfficialClient(){return role()==='suspect'&&!!cache?.represented}
function metKey(id){return `igr:v43:met:${roomCode()}:${id}`}
function hasMet(id){try{return sessionStorage.getItem(metKey(id))==='1'}catch{return false}}
function markMet(id){try{sessionStorage.setItem(metKey(id),'1')}catch{}}

async function rpcCall(name,args={}){
  if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
  return window.rpc(name,{p_code:roomCode(),p_player_token:token(),...args});
}

async function refresh(force=false){
  if(!lawyerRelevant()||!roomCode()||!token()||loading)return;
  loading=true;
  try{
    const next=await rpcCall('igr_v43_lawyer_state');
    const sig=JSON.stringify(next||{});
    const changed=sig!==lastSig;
    cache=next||null;lastSig=sig;
    if(changed||force)queueRefreshUI();
  }catch(e){
    if(force)window.toast?.(e?.message||copy('État de l’avocat indisponible.','Lawyer state unavailable.'));
    console.warn('[IGR v43 lawyer state]',e);
  }finally{loading=false}
}

function queueRefreshUI(){
  if(refreshQueued)return;refreshQueued=true;
  requestAnimationFrame(()=>{
    refreshQueued=false;
    if(S()?.tab==='lawyer'&&typeof window.renderGame==='function'){
      try{window.renderGame();return}catch(_){}
    }
    injectRoleCard();
  });
}

async function requestLawyer(){
  try{
    await rpcCall('igr_v43_request_lawyer');
    window.toast?.(copy('Demande envoyée à l’avocat.','Request sent to the lawyer.'));
    await refresh(true);
  }catch(e){window.toast?.(e?.message||copy('Demande impossible.','Request unavailable.'))}
}
async function refuseLawyer(id){
  try{
    await rpcCall('igr_v43_refuse_lawyer',{p_suspect:id});
    window.toast?.(copy('Demande refusée. Le suspect pourra redemander tant qu’aucun client n’est verrouillé.','Request refused. The suspect may ask again while no client is locked.'));
    await refresh(true);
  }catch(e){window.toast?.(e?.message||copy('Refus impossible.','Unable to refuse.'))}
}
async function acceptLawyer(id,pseudo){
  if(!hasMet(id))return window.toast?.(copy('Rencontrez d’abord ce suspect avant de décider.','Meet this suspect before deciding.'));
  const ok=window.confirm(copy(
    `Confirmer la représentation de ${pseudo} ?\n\n${pseudo} deviendra l’unique client officiel de l’avocat jusqu’à la fin de l’affaire. Ce choix ne pourra plus être modifié.`,
    `Confirm representation of ${pseudo}?\n\n${pseudo} will become the lawyer’s only official client for the rest of the case. This choice cannot be changed.`
  ));
  if(!ok)return;
  try{
    await rpcCall('igr_v43_accept_lawyer',{p_suspect:id});
    window.toast?.(copy(`${pseudo} est désormais le client officiel de l’avocat.`,`${pseudo} is now the lawyer’s official client.`));
    await refresh(true);
  }catch(e){window.toast?.(e?.message||copy('Représentation impossible.','Unable to confirm representation.'))}
}
window.igr43RequestLawyer=requestLawyer;
window.igr43RefuseLawyer=refuseLawyer;
window.igr43AcceptLawyer=acceptLawyer;

let timerHandle=null;
function closeConsultation(mark=true){
  const overlay=document.getElementById('igr43ConsultOverlay');
  if(!overlay)return;
  if(mark&&overlay.dataset.suspect)markMet(overlay.dataset.suspect);
  clearInterval(timerHandle);timerHandle=null;overlay.remove();queueRefreshUI();
}
function openConsultation(id,pseudo,official=false){
  closeConsultation(false);
  let left=60;
  const overlay=document.createElement('div');
  overlay.id='igr43ConsultOverlay';overlay.className='igr43-consult-overlay';overlay.dataset.suspect=id;
  overlay.innerHTML=`<section class="igr43-consult-sheet" role="dialog" aria-modal="true"><small>${esc(official?copy('CLIENT OFFICIEL','OFFICIAL CLIENT'):copy('CONSULTATION · 1 MIN MAX','CONSULTATION · 1 MIN MAX'))}</small><h2>${esc(pseudo)}</h2><div class="igr43-timer" id="igr43ConsultTimer">1:00</div><p>${esc(official?copy('Concertation avec le client officiel.','Conference with the official client.'):copy('Échange officieux : aucun lien de représentation n’est créé.','Unofficial exchange: no representation relationship is created.'))}</p>${!official?`<div class="igr43-integrity"><b>${esc(copy('RÈGLE DE JEU','GAME RULE'))}</b><span>${esc(copy('Avec un non-client, l’avocat peut conseiller sincèrement, orienter ou bluffer pour protéger son client. Il ne peut jamais inventer une information en prétendant qu’elle vient de l’application, du Juge, du MJ ou des règles.','With a non-client, the lawyer may advise honestly, steer or bluff to protect the client. The lawyer may never invent information and claim it came from the app, Judge, Game Master or rules.'))}</span></div>`:''}<button class="btn primary block" type="button" onclick="igr43EndConsultation()">${esc(copy('Terminer l’entretien','End meeting'))}</button></section>`;
  document.body.appendChild(overlay);
  const draw=()=>{const n=document.getElementById('igr43ConsultTimer');if(n)n.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`};
  draw();
  timerHandle=setInterval(()=>{left=Math.max(0,left-1);draw();if(left<=0)closeConsultation(true)},1000);
}
window.igr43Meet=(id,pseudo,official=false)=>openConsultation(String(id),String(pseudo),!!official);
window.igr43EndConsultation=()=>closeConsultation(true);

function requestStatus(){
  const req=cache?.request;
  if(cache?.represented){
    const n=cache?.lawyer?.pseudo||copy('l’avocat','the lawyer');
    return `<article class="igr43-client-card"><small>${esc(copy('REPRÉSENTATION CONFIRMÉE','REPRESENTATION CONFIRMED'))}</small><h3>${esc(n)}</h3><p>${esc(copy('La représentation est officielle jusqu’à la fin de l’affaire.','Representation is official for the rest of the case.'))}</p></article>`;
  }
  if(!cache?.lawyer_count)return `<div class="locked-state">${esc(copy('Aucun avocat n’est présent dans cette partie.','No lawyer is present in this game.'))}</div>`;
  if(req?.status==='pending')return `<article class="igr43-pending"><b>${esc(copy('Demande envoyée','Request sent'))}</b><span>${esc(copy('L’avocat peut recevoir le suspect pendant 1 minute maximum avant de décider. Un refus ne bloque pas une nouvelle demande.','The lawyer may meet the suspect for up to one minute before deciding. A refusal does not block a new request.'))}</span></article>`;
  if(cache?.can_request){
    const again=req?.status==='refused';
    return `<button class="btn primary block" type="button" onclick="igr43RequestLawyer()">⚖ ${esc(again?copy('Demander à nouveau l’avocat','Ask the lawyer again'):copy('Demander un avocat','Request a lawyer'))}</button>${again?`<small class="igr43-muted">${esc(copy('Le précédent refus n’est pas définitif. Tant qu’aucun client n’est verrouillé, une nouvelle demande reste possible.','The previous refusal is not final. A new request remains possible while no client is locked.'))}</small>`:''}`;
  }
  if(cache?.lawyer_available===false)return `<div class="locked-state"><b>${esc(copy('AVOCAT INDISPONIBLE','LAWYER UNAVAILABLE'))}</b><br>${esc(copy('L’avocat représente déjà un autre suspect.','The lawyer already represents another suspect.'))}</div>`;
  return `<div class="locked-state">${esc(copy('La fenêtre de représentation officielle est terminée. Les consultations officieuses restent possibles en salle d’attente.','The official representation window is closed. Unofficial consultations remain possible in the waiting room.'))}</div>`;
}

function unofficialRule(forSuspect=false){
  return `<article class="igr43-rule-card"><small>${esc(copy('CONSULTATIONS OFFICIEUSES','UNOFFICIAL CONSULTATIONS'))}</small><p>${esc(forSuspect
    ?copy('Même sans représentation officielle, un suspect peut poser des questions à l’avocat ou être reçu en salle d’attente. Cette consultation ne crée aucune obligation de loyauté : l’avocat peut déjà défendre les intérêts de son client.','Even without official representation, a suspect may ask the lawyer questions or meet in the waiting room. This creates no duty of loyalty: the lawyer may already be protecting the client’s interests.')
    :copy('L’avocat peut répondre aux questions de tous les suspects et les recevoir en salle d’attente pendant 1 minute maximum. Avec les non-clients, il peut conseiller sincèrement, orienter ou bluffer pour protéger son client ; jamais falsifier une information venant de l’application, du Juge, du MJ ou des règles.','The lawyer may answer all suspects and meet them in the waiting room for up to one minute. With non-clients, the lawyer may advise honestly, steer or bluff to protect the client; never falsify information from the app, Judge, Game Master or rules.'))}</p></article>`;
}

function renderSuspectLawyer(){
  return `<section class="igr43-lawyer-page"><header><small>${esc(copy('DÉFENSE','DEFENCE'))}</small><h2>${esc(copy('Avocat','Lawyer'))}</h2><p>${esc(copy('Une représentation officielle est exclusive. Un refus reste réversible tant qu’aucun client n’a été choisi.','Official representation is exclusive. A refusal remains reversible while no client has been chosen.'))}</p></header>${cache?requestStatus():`<div class="locked-state">${esc(copy('Chargement…','Loading…'))}</div>`}${unofficialRule(true)}</section>`;
}

function requestCard(q){
  const met=hasMet(q.suspect_id);
  return `<article class="igr43-request-card"><div class="igr43-request-head"><div><small>${esc(copy(`DEMANDE ${q.attempt>1?`· ${q.attempt}e ENVOI`:''}`,`REQUEST ${q.attempt>1?`· ATTEMPT ${q.attempt}`:''}`))}</small><h3>${esc(q.pseudo)}</h3></div><span>${esc(met?copy('Rencontré','Met'):copy('À rencontrer','Meet first'))}</span></div><p>${esc(q.brief||'')}</p><div class="igr43-actions"><button class="btn ghost" type="button" onclick="igr43Meet('${esc(q.suspect_id)}','${esc(String(q.pseudo).replace(/'/g,"\\'"))}',false)">${esc(copy('Rencontrer · 1 min','Meet · 1 min'))}</button><button class="btn" type="button" onclick="igr43RefuseLawyer('${esc(q.suspect_id)}')">${esc(copy('Refuser','Refuse'))}</button><button class="btn primary" type="button" ${met?'':'disabled'} onclick="igr43AcceptLawyer('${esc(q.suspect_id)}','${esc(String(q.pseudo).replace(/'/g,"\\'"))}')">${esc(copy('Accepter','Accept'))}</button></div><small class="igr43-muted">${esc(copy('Refuser ferme seulement cette demande. Le suspect pourra en envoyer une nouvelle tant qu’aucun client n’est verrouillé.','Refusing closes only this request. The suspect may send another while no client is locked.'))}</small></article>`;
}

function consultationRoster(){
  const people=Array.isArray(cache?.suspects)?cache.suspects:[];
  if(!people.length)return'';
  return `<section class="igr43-roster"><div class="igr43-section-title"><b>${esc(copy('SALLE D’ATTENTE','WAITING ROOM'))}</b><span>${esc(copy('Consultations de 1 minute maximum','Consultations up to 1 minute'))}</span></div>${people.map(p=>`<div class="igr43-person"><span><b>${esc(p.pseudo)}</b><small>${esc(p.is_client?copy('Client officiel','Official client'):p.represented?copy('Déjà représenté','Already represented'):copy('Consultation officieuse','Unofficial consultation'))}</small></span><button class="btn ghost small" type="button" onclick="igr43Meet('${esc(p.id)}','${esc(String(p.pseudo).replace(/'/g,"\\'"))}',${p.is_client?'true':'false'})">${esc(p.is_client?copy('Se concerter','Confer'):copy('Recevoir · 1 min','Meet · 1 min'))}</button></div>`).join('')}</section>`;
}

function renderLawyerDesk(){
  if(!cache)return `<section class="igr43-lawyer-page"><div class="locked-state">${esc(copy('Chargement des demandes…','Loading requests…'))}</div></section>`;
  if(cache.has_client){
    const c=cache.client||{};
    return `<section class="igr43-lawyer-page"><header><small>${esc(copy('REPRÉSENTATION OFFICIELLE','OFFICIAL REPRESENTATION'))}</small><h2>${esc(copy('Avocat','Lawyer'))}</h2></header><article class="igr43-client-card strong"><small>${esc(copy('CLIENT UNIQUE · VERROUILLÉ','ONLY CLIENT · LOCKED'))}</small><h3>${esc(c.pseudo||'')}</h3><p>${esc(c.brief||'')}</p><button class="btn primary block" type="button" onclick="igr43Meet('${esc(c.id)}','${esc(String(c.pseudo||'').replace(/'/g,"\\'"))}',true)">${esc(copy('Se concerter · 1 min','Confer · 1 min'))}</button></article>${unofficialRule(false)}${consultationRoster()}</section>`;
  }
  const requests=Array.isArray(cache.pending_requests)?cache.pending_requests:[];
  return `<section class="igr43-lawyer-page"><header><small>${esc(copy('REPRÉSENTATION','REPRESENTATION'))}</small><h2>${esc(copy('Choisir un client','Choose a client'))}</h2><p>${esc(copy('Chaque demande peut être examinée après un entretien de 1 minute maximum. L’acceptation est le seul choix irréversible.','Each request can be considered after a meeting of up to one minute. Acceptance is the only irreversible choice.'))}</p></header>${requests.length?`<div class="igr43-request-list">${requests.map(requestCard).join('')}</div>`:`<div class="locked-state">${esc(copy('Aucune demande en attente. Les suspects peuvent redemander après un refus jusqu’au cycle 3.','No pending request. Suspects may ask again after a refusal through cycle 3.'))}</div>`}${unofficialRule(false)}${consultationRoster()}</section>`;
}

function renderLawyerTab(){return role()==='maitre'?renderLawyerDesk():renderSuspectLawyer()}

function contextBanner(){
  if(!cache)return'';
  const ph=phase(),participants=eventParticipants();
  if(role()==='maitre'&&cache.has_client){
    const c=cache.client||{},cid=String(c.id||'');
    if(cid&&participants.includes(cid)&&/confront/i.test(ph)){
      const other=participants.find(x=>x!==cid);
      return `<div class="igr43-context"><b>${esc(copy('CLIENT CONVOQUÉ EN CONFRONTATION','CLIENT CALLED TO CONFRONTATION'))}</b><span>${esc(other?`${c.pseudo} ↔ ${playerName(other)}`:c.pseudo)}. ${esc(copy('L’avocat assiste uniquement son client officiel.','The lawyer assists only the official client.'))}</span></div>`;
    }
    if(cid&&participants.includes(cid)&&/interrog/i.test(ph))return `<div class="igr43-context"><b>${esc(copy('CLIENT CONVOQUÉ','CLIENT CALLED'))}</b><span>${esc(c.pseudo)} · ${esc(copy('L’avocat peut préparer et assister son client selon la phase en cours.','The lawyer may prepare and assist the client for the current phase.'))}</span></div>`;
    if(ph==='closed'||ph==='provisional_orals')return `<div class="igr43-context important"><b>${esc(copy('AVANT LES CONCLUSIONS PROVISOIRES','BEFORE PROVISIONAL CONCLUSIONS'))}</b><span>${esc(copy(`Concertation recommandée avec ${c.pseudo} avant sa prochaine prise de parole.`,`Confer with ${c.pseudo} before the client’s next statement.`))}</span></div>`;
    if(ph==='defense'){
      const q=room()?.state?.defense_queue||[],i=Number(room()?.state?.defense_index||0),active=q[i];
      if(String(active?.id||'')===cid)return `<div class="igr43-context important"><b>${esc(copy('DÉFENSE DU CLIENT','CLIENT DEFENCE'))}</b><span>${esc(copy(`${c.pseudo} prend la parole. Le temps de défense est partagé avec l’avocat.`,`${c.pseudo} is speaking. Defence time is shared with the lawyer.`))}</span></div>`;
    }
  }
  if(role()==='suspect'&&cache.represented){
    const lawyer=cache.lawyer?.pseudo||copy('l’avocat','the lawyer');
    if(participants.includes(myId())&&/confront|interrog/i.test(ph))return `<div class="igr43-context"><b>${esc(copy('ASSISTANCE DISPONIBLE','ASSISTANCE AVAILABLE'))}</b><span>${esc(copy(`Le suspect est officiellement représenté par ${lawyer}. Une concertation est possible avant la prise de parole.`,`The suspect is officially represented by ${lawyer}. A conference is possible before speaking.`))}</span></div>`;
    if(ph==='closed'||ph==='provisional_orals')return `<div class="igr43-context important"><b>${esc(copy('AVANT LES CONCLUSIONS PROVISOIRES','BEFORE PROVISIONAL CONCLUSIONS'))}</b><span>${esc(copy(`Le suspect est invité à se concerter avec ${lawyer} avant sa prochaine prise de parole.`,`The suspect should confer with ${lawyer} before the next statement.`))}</span></div>`;
  }
  return'';
}

const baseTabs=typeof window.gameTabs==='function'?window.gameTabs:(typeof gameTabs==='function'?gameTabs:null);
if(baseTabs){
  const v43Tabs=function(){
    const tabs=baseTabs.apply(this,arguments)||[];
    if(lawyerRelevant()&&!tabs.some(t=>t?.id==='lawyer')){
      const idx=tabs.findIndex(t=>t?.id==='card');
      const item={id:'lawyer',label:role()==='maitre'?copy('Clients','Clients'):copy('Avocat','Lawyer')};
      if(idx>=0)tabs.splice(idx+1,0,item);else tabs.push(item);
    }
    return tabs;
  };
  try{gameTabs=v43Tabs}catch(_){}window.gameTabs=v43Tabs;
}

const baseRenderTab=typeof window.renderGameTab==='function'?window.renderGameTab:(typeof renderGameTab==='function'?renderGameTab:null);
if(baseRenderTab){
  const v43RenderTab=function(){
    if(S()?.tab==='lawyer'&&lawyerRelevant())return renderLawyerTab();
    const html=baseRenderTab.apply(this,arguments);
    const banner=contextBanner();
    return banner+String(html??'');
  };
  try{renderGameTab=v43RenderTab}catch(_){}window.renderGameTab=v43RenderTab;
}

const basePrivate=typeof window.privateCardHtml==='function'?window.privateCardHtml:(typeof privateCardHtml==='function'?privateCardHtml:null);
if(basePrivate){
  const v43Private=function(){
    const html=basePrivate.apply(this,arguments);
    if(role()!=='maitre')return html;
    try{
      const t=document.createElement('template');t.innerHTML=String(html??'');
      const card=t.content.querySelector('.private-card-v11');
      if(!card)return html;
      for(const block of [...card.querySelectorAll('.private-block')]){
        const heading=norm(block.querySelector('h4')?.textContent);
        if(heading.includes('clients'))block.remove();
        else if(/reperes|anchors/.test(heading)&&/plusieurs clients|deux avocats|clients sont repartis/.test(norm(block.textContent||''))){
          const body=block.querySelector('div,span,p')||block;
          if(body)body.textContent=copy('Un seul client officiel par avocat. Les autres suspects peuvent toujours être reçus officieusement.','One official client per lawyer. Other suspects may still be met unofficially.');
        }
      }
      const summary=card.querySelector('.role-summary span');
      if(summary)summary.textContent=copy('Choisir un seul client officiel et empêcher que sa responsabilité soit surestimée, sans inventer de fait ni de preuve.','Choose one official client and prevent that client’s responsibility from being overstated, without inventing facts or evidence.');
      return t.innerHTML;
    }catch{return html}
  };
  try{privateCardHtml=v43Private}catch(_){}window.privateCardHtml=v43Private;
}

function roleCardHelperHtml(){
  if(role()==='suspect')return `<div class="igr43-role-helper"><b>⚖ ${esc(copy('AVOCAT','LAWYER'))}</b>${cache?requestStatus():`<span>${esc(copy('Chargement…','Loading…'))}</span>`}<small>${esc(copy('Même sans représentation officielle, l’avocat peut répondre aux questions des suspects et les recevoir officieusement en salle d’attente.','Even without official representation, the lawyer may answer suspects’ questions and meet them unofficially in the waiting room.'))}</small></div>`;
  if(role()==='maitre'){
    if(cache?.has_client)return `<div class="igr43-role-helper"><b>${esc(copy('CLIENT OFFICIEL','OFFICIAL CLIENT'))}</b><strong>${esc(cache.client?.pseudo||'')}</strong><span>${esc(cache.client?.brief||'')}</span></div>`;
    const n=Array.isArray(cache?.pending_requests)?cache.pending_requests.length:0;
    return `<div class="igr43-role-helper"><b>${esc(copy('REPRÉSENTATION','REPRESENTATION'))}</b><span>${esc(copy(`${n} demande${n===1?'':'s'} en attente. Les entretiens durent 1 minute maximum.`,`${n} pending request${n===1?'':'s'}. Meetings last up to one minute.`))}</span><small>${esc(copy('Les demandes sont gérées dans l’onglet Clients une fois la partie ouverte.','Requests are managed in the Clients tab once the game view is open.'))}</small></div>`;
  }
  return'';
}
function injectRoleCard(){
  if(!lawyerRelevant())return;
  const card=document.querySelector('.private-card-v11');if(!card)return;
  card.querySelector('#igr43RoleHelper')?.remove();
  const holder=document.createElement('div');holder.id='igr43RoleHelper';holder.innerHTML=roleCardHelperHtml();
  const foot=card.querySelector('.private-foot');if(foot)card.insertBefore(holder,foot);else card.appendChild(holder);
}

const baseRenderRole=typeof window.renderRole==='function'?window.renderRole:(typeof renderRole==='function'?renderRole:null);
if(baseRenderRole){
  const v43RenderRole=function(){const out=baseRenderRole.apply(this,arguments);setTimeout(()=>{injectRoleCard();refresh(false)},0);return out};
  try{renderRole=v43RenderRole}catch(_){}window.renderRole=v43RenderRole;
}
const baseRenderGame=typeof window.renderGame==='function'?window.renderGame:(typeof renderGame==='function'?renderGame:null);
if(baseRenderGame){
  const v43RenderGame=function(){const out=baseRenderGame.apply(this,arguments);setTimeout(()=>{injectRoleCard();refresh(false)},0);return out};
  try{renderGame=v43RenderGame}catch(_){}window.renderGame=v43RenderGame;
}

function phaseToast(){
  if(!cache)return;
  const ph=phase();if(!['closed','provisional_orals'].includes(ph))return;
  const key=`igr:v43:conclusion:${roomCode()}:${role()}:${myId()}`;
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch{}
  if(role()==='maitre'&&cache.has_client)window.toast?.(copy(`Avant les conclusions provisoires : concertez-vous avec ${cache.client?.pseudo}.`,`Before provisional conclusions: confer with ${cache.client?.pseudo}.`));
  if(role()==='suspect'&&cache.represented)window.toast?.(copy(`Avant les conclusions provisoires : concertez-vous avec ${cache.lawyer?.pseudo||'l’avocat'}.`,`Before provisional conclusions: confer with ${cache.lawyer?.pseudo||'the lawyer'}.`));
}

setInterval(()=>{if(lawyerRelevant())refresh(false)},3000);
setInterval(phaseToast,1200);
addEventListener('pageshow',()=>refresh(true),{passive:true});
setTimeout(()=>refresh(true),250);setTimeout(()=>injectRoleCard(),450);

const style=document.createElement('style');style.dataset.igrV43=VERSION;style.textContent=`
.igr43-lawyer-page{display:grid;gap:14px;padding:2px 0 18px}.igr43-lawyer-page>header{padding:4px 2px}.igr43-lawyer-page>header small,.igr43-client-card>small,.igr43-rule-card>small,.igr43-request-card small,.igr43-consult-sheet>small{display:block;font-size:10px;letter-spacing:.14em;color:#8d99a5;font-weight:800}.igr43-lawyer-page h2{margin:4px 0 6px}.igr43-lawyer-page header p,.igr43-request-card p,.igr43-client-card p,.igr43-rule-card p{margin:6px 0;line-height:1.45}.igr43-request-list{display:grid;gap:10px}.igr43-request-card,.igr43-client-card,.igr43-rule-card,.igr43-pending,.igr43-role-helper,.igr43-roster{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.035);border-radius:16px;padding:14px}.igr43-client-card.strong{border-color:rgba(255,255,255,.24);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}.igr43-client-card h3,.igr43-request-card h3{margin:3px 0;font-size:20px}.igr43-request-head,.igr43-section-title,.igr43-person{display:flex;align-items:center;justify-content:space-between;gap:10px}.igr43-request-head>span{font-size:11px;color:#9ba6b0}.igr43-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.igr43-actions .btn{flex:1;min-width:90px}.igr43-actions .btn:disabled{opacity:.35;pointer-events:none}.igr43-muted{display:block;color:#7f8a94!important;margin-top:9px;line-height:1.35}.igr43-rule-card{border-style:dashed}.igr43-roster{display:grid;gap:8px}.igr43-section-title{padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.08)}.igr43-section-title span,.igr43-person small{font-size:11px;color:#89949f;display:block}.igr43-person{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}.igr43-person:last-child{border-bottom:0}.igr43-pending{display:grid;gap:5px}.igr43-pending span{font-size:13px;color:#aab3bb}.igr43-role-helper{margin:12px 0;display:grid;gap:7px}.igr43-role-helper>small{color:#89949f;line-height:1.35}.igr43-context{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:11px 13px;margin:0 0 12px;display:grid;gap:4px;background:rgba(255,255,255,.05)}.igr43-context b{font-size:11px;letter-spacing:.08em}.igr43-context span{font-size:13px;line-height:1.4}.igr43-context.important{border-color:rgba(255,255,255,.28)}.igr43-consult-overlay{position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.82);display:grid;place-items:center;padding:18px}.igr43-consult-sheet{width:min(430px,100%);background:#11151a;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.55)}.igr43-consult-sheet h2{margin:5px 0 8px}.igr43-timer{font-size:48px;font-weight:850;letter-spacing:-.04em;margin:10px 0}.igr43-integrity{margin:14px 0;padding:11px;border-radius:12px;background:rgba(255,255,255,.055);display:grid;gap:5px}.igr43-integrity b{font-size:10px;letter-spacing:.12em}.igr43-integrity span{font-size:12px;line-height:1.45;color:#b7c0c8}@media(max-width:520px){.igr43-actions{display:grid;grid-template-columns:1fr 1fr}.igr43-actions .btn:first-child{grid-column:1/-1}.igr43-timer{font-size:42px}}
`;
document.head.appendChild(style);
window.IGR_LAWYER_V43={version:VERSION,refresh,renderLawyerTab};
})();
