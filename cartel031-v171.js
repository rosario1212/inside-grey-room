/* CARTEL 031 — authenticated decisions; the canon is fetched per game. */
(()=>{
'use strict';
const version='v171-cartel031-la-dette';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
const room=()=>S()?.sync?.room,me=()=>S()?.sync?.player;
const active=()=>room()?.scenario_id==='031'&&room()?.state?.cartel031_ready;
const fr=()=>window.IGR_LOCALE!=='en',copy=(a,b)=>fr()?a:b;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bureau=r=>['enqueteur','analyste','procureur'].includes(r);
const label=t=>({prison:copy('Prison','Prison'),release:copy('Sortie sans protection','Unprotected release'),protected_release:copy('Sortie protégée','Protected release')})[t]||t;
const card=(title,body)=>'<article class="igr031-card"><h3>'+esc(title)+'</h3>'+body+'</article>';
const button=(action,payload,text)=>'<button type="button" class="btn ghost block" data-c031-action="'+action+'" data-c031-payload="'+esc(JSON.stringify(payload))+'">'+esc(text)+'</button>';
// Keep the saved local-game schema stable while asset releases change.
let cache=null,busy=false,loadingKey='',requestSerial=0,cacheKey='',drafts={},signature='',localContext=null,localActor=null,localPending=null;
const sessionIdentity=()=>active()&&S()?.token?JSON.stringify([S().room,S().token,me()?.id,me()?.public_role,room()?.state?.match_no||1,room()?.status]):'';
function currentCache(){
 const key=sessionIdentity();
 if(key!==cacheKey){cacheKey=key;cache=null;signature='';drafts={};loadingKey='';requestSerial++;document.getElementById('igr031PrivateProof')?.remove();}
 return cache;
}
async function refresh(){
 currentCache();const key=cacheKey;if(!key||loadingKey===key)return;
 loadingKey=key;const request=++requestSerial;
 try{const next=await window.rpc('igr_v171_031_state',{p_code:S().room,p_player_token:S().token});
  if(request!==requestSerial||key!==sessionIdentity()){currentCache();return;}
  const sig=JSON.stringify(next),changed=sig!==signature;cache=next;signature=sig;
  if(changed&&S()?.tab==='cartel031')window.renderGame?.();
  showPrivateProof(next);
 }catch(e){if(request===requestSerial&&key===sessionIdentity()&&S()?.tab==='cartel031')window.toast?.(e.message)}
 finally{if(request===requestSerial)loadingKey='';}
}
function showPrivateProof(d){
 if(!d?.proof||!document.body||room()?.status!=='playing')return;
 const key='igr:031:proof:'+S().room+':'+(room()?.state?.match_no||1)+':'+me()?.id;
 try{if(window.sessionStorage?.getItem(key))return}catch{}
 if(document.getElementById('igr031PrivateProof'))return;
 const overlay=document.createElement('section');overlay.id='igr031PrivateProof';overlay.className='igr031-proof';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.innerHTML='<div class="igr031-card"><small>'+esc(copy('PRIVÉ · POUR TOI UNIQUEMENT','PRIVATE · FOR YOU ONLY'))+'</small><h2>'+esc(d.proof.title)+'</h2><p>'+esc(d.proof.text)+'</p><button type="button" class="btn block" data-c031-proof-close>'+esc(copy('J’ai lu — masquer','I have read — hide'))+'</button></div>';
 overlay.querySelector('[data-c031-proof-close]')?.addEventListener('click',()=>{try{window.sessionStorage?.setItem(key,'1')}catch{}overlay.remove()});
 document.body.appendChild(overlay);
}
function roleFocus(role,crisis){
 const prompts={
  enqueteur:crisis?['Fais préciser les renseignements des suspects, écoute le recoupement de l’Analyste, puis enregistre le plan. Ton vote reste personnel.','Clarify the suspects’ information, hear the Analyst’s cross-check, then record the plan. Your ballot remains personal.']:['Fais expliquer à chaque suspect ses actes et l’origine de l’ordre d’assaut. Compare les versions.','Ask each suspect about their actions and who ordered the assault. Compare their accounts.'],
  analyste:crisis?['Distingue le plan prévu de ce qui a réellement eu lieu. Relie le destinataire, le mouvement et les consignes ; expose ta conclusion au bureau.','Separate the original plan from what actually happened. Connect the recipient, movement and instructions; explain your conclusion to the bureau.']:['Repère les contradictions entre les récits et les pièces. Fais préciser ce qui est observé, supposé ou caché.','Find contradictions between accounts and evidence. Clarify what was observed, assumed or concealed.'],
  procureur:crisis?['Négocie une contrepartie précise avec les suspects. Un accord accepté engage le bureau ; il n’efface pas les meurtres.','Negotiate clear terms with the suspects. An accepted agreement binds the bureau; it does not erase the murders.']:['Confronte les actes de chacun aux preuves. Prépare les responsabilités que tu devras établir.','Compare each person’s actions with the evidence. Prepare your assessment of their responsibility.'],
  suspect:crisis?['Tu peux donner un fragment vérifiable à l’oral, puis négocier la suite. Signer transmet tout le renseignement affiché contre les conditions acceptées.','You may share a verifiable fragment face to face, then negotiate the rest. Signing submits all the displayed information in exchange for the accepted terms.']:['Évite la prison. Choisis ce que tu racontes du massacre ; ta personnalité et ta manière de négocier restent libres.','Avoid prison. Choose what you say about the massacre; your personality and negotiating style are yours.'],
  maitre:crisis?['Fais préciser ce que le bureau veut de ton client et quelle protection il lui promet. Ton client seul peut accepter et signer.','Clarify what the bureau wants from your client and what protection it promises. Only your client can accept and sign.']:['Prépare la défense de ton client et négocie sa sortie vivante, sans prison. Tu ne décides pas à sa place.','Prepare your client’s defence and negotiate their release alive, without prison. You do not decide for them.'],
  temoin:crisis?['Reprends les conclusions qui dépassent tes observations. Ne pas avoir vu quelque chose ne prouve pas son absence.','Challenge conclusions that go beyond your observations. Not seeing something does not prove it was absent.']:['Raconte les faits que tu as vus et confronte les récits des suspects. Tu peux signer ton témoignage factuel.','Describe what you witnessed and challenge the suspects’ accounts. You may sign your factual testimony.']
 };
 return prompts[role]?copy(...prompts[role]):'';
}
function renderBoard(d,player,draft={},compactProof=false){
 if(!d?.enabled)return '<div class="locked-state">'+esc(copy('Chargement du dossier…','Loading case…'))+'</div>';
 const r=d.role,open=d.open,crisis=d.crisis;
 const heading=r==='suspect'?copy('Sortir vivant, sans prison','Leave alive, without prison'):r==='maitre'?copy('Faire sortir ton client vivant','Get your client out alive'):r==='temoin'?copy('Faire entendre ce que tu as vu','Make your observations heard'):copy(crisis?'Ramener les proches':'Reconstituer le massacre',crisis?'Bring the families back':'Reconstruct the massacre');
 let html='<section class="igr031-page"><header><small>CARTEL 031 · LA DETTE</small><h2>'+esc(heading)+'</h2><p class="igr031-focus">'+esc(roleFocus(r,crisis))+'</p><small>'+esc(copy('Les échanges se jouent à l’oral. Ici, vous enregistrez seulement les décisions officielles.','Play the conversations face to face. Record only official decisions here.'))+'</small></header>';
 if(d.proof){const proof='<p class="igr031-private">'+esc(copy('PRIVÉ · POUR TOI UNIQUEMENT','PRIVATE · FOR YOU ONLY'))+'</p><p>'+esc(d.proof.text)+'</p>';html+=compactProof?'<details id="c031ProofReview" class="igr031-card igr031-proof-review"'+(draft.c031ProofOpen?' open':'')+'><summary>'+esc(copy('Revoir ta preuve de vie privée','Review your private life proof'))+'</summary><h3>'+esc(d.proof.title)+'</h3>'+proof+'</details>':card(d.proof.title,proof);}
 if(bureau(r)&&crisis){
  html+=card(copy('La demande et le vote secret','The demand and secret ballot'),'<p>'+esc(d.demand)+'</p><p>'+esc(copy('Bulletins reçus : ','Ballots received: '))+Number(d.votes_received||0)+'/'+(d.crew||[]).length+' · '+esc(copy('Majorité requise : ','Majority required: '))+Number(d.majority||0)+'</p>'+
   (open?'<label>'+esc(copy('Ton bulletin privé','Your private ballot'))+'<select id="c031Vote"><option value="refuse">'+esc(copy('Refuser de livrer un collègue','Refuse to hand over a colleague'))+'</option>'+(d.crew||[]).map(p=>'<option value="'+esc(p.id)+'" '+((draft.c031Vote??d.own_ballot)===p.id?'selected':'')+'>'+esc(p.pseudo)+'</option>').join('')+'</select></label>'+button('vote',{},copy('Enregistrer mon bulletin secret','Save my secret ballot'))+'<small>'+esc(copy('Ton bulletin reste modifiable jusqu’à la clôture. Une égalité ou l’absence de majorité ne désigne personne.','You may change your ballot until closure. A tie or lack of majority designates nobody.'))+'</small>':
   '<p>'+esc(d.nominee?copy('La majorité a désigné : ','The majority designated: ')+d.nominee.pseudo:copy('Aucune majorité pour livrer un membre du bureau.','No majority to hand over a member of the bureau.'))+'</p>'));
  if(r==='enqueteur'){
   const plan={...(d.plan||{})};for(const [field,id] of Object.entries({mode:'c031Mode',location:'c031Location',approach:'c031Approach',assault_author:'c031Assault'}))if(Object.hasOwn(draft,id))plan[field]=draft[id];
   html+=card(copy('Plan du bureau','Bureau plan'),'<p>'+esc(copy('Ce plan s’applique au dénouement si aucune majorité n’impose la remise d’un collègue. Par défaut, le bureau attend.','This plan applies in the ending unless a majority orders a colleague’s handover. The default is to wait.'))+'</p>'+
    (open?'<label>'+esc(copy('Qui a donné l’ordre de lancer l’assaut ?','Who ordered the assault to begin?'))+'<select id="c031Assault"><option value="">'+esc(copy('Choisir…','Choose…'))+'</option>'+(d.assault_options||[]).map(p=>'<option value="'+esc(p.id)+'" '+(plan.assault_author===p.id?'selected':'')+'>'+esc(p.label)+'</option>').join('')+'</select></label><label>'+esc(copy('Décision','Decision'))+'<select id="c031Mode"><option value="wait">'+esc(copy('Attendre, sans intervention','Wait without intervening'))+'</option><option value="intervene" '+(plan.mode==='intervene'?'selected':'')+'>'+esc(copy('Intervenir','Intervene'))+'</option></select></label><label>'+esc(copy('Lieu','Location'))+'<select id="c031Location">'+(d.locations||[]).map(p=>'<option value="'+esc(p.id)+'" '+(plan.location===p.id?'selected':'')+'>'+esc(p.label)+'</option>').join('')+'</select></label><label>'+esc(copy('Approche','Approach'))+'<select id="c031Approach">'+(d.approaches||[]).map(p=>'<option value="'+esc(p.id)+'" '+(plan.approach===p.id?'selected':'')+'>'+esc(p.label)+'</option>').join('')+'</select></label>'+button('plan',{},copy('Enregistrer le plan','Save plan')):
    '<p>'+esc(copy('Plan verrouillé : ','Locked plan: ')+(plan.mode==='intervene'?copy('intervention','intervention'):copy('attente','waiting')))+'</p>'));
  }
  html+=card(copy('Accords avec les suspects','Agreements with suspects'),'<p>'+esc(copy('Un accord accepté transmet la déposition prévue dans la fiche du suspect et engage sa contrepartie, même si le sauvetage échoue. Une protection ne rend personne innocent.','Acceptance submits the testimony specified on the suspect’s card and binds the promised terms even if the rescue fails. Protection does not make anyone innocent.'))+'</p>'+(d.suspects||[]).map(p=>{
   const o=p.offer;return '<div class="igr031-agreement"><b>'+esc(p.pseudo)+'</b><p>'+esc(o?label(o.terms)+' · '+copy(({pending:'en attente',accepted:'accepté — engageant',refused:'refusé'})[o.status]||o.status,({pending:'pending',accepted:'accepted — binding',refused:'refused'})[o.status]||o.status):copy('Aucun accord : la décision finale sur la responsabilité s’appliquera.','No agreement: the final responsibility decision applies.'))+'</p>'+
   (open&&['enqueteur','procureur'].includes(r)&&o?.status!=='accepted'?'<select id="c031Terms-'+esc(p.id)+'">'+['protected_release','prison','release'].map(t=>'<option value="'+t+'" '+(draft['c031Terms-'+p.id]===t?'selected':'')+'>'+esc(label(t))+'</option>').join('')+'</select>'+button('offer',{suspect_id:p.id},copy('Proposer cet accord','Offer these terms')):'')+'</div>'}).join(''));
 }
 if(r==='suspect'&&crisis){
  const o=d.offer;
  html+=card(copy('Sortir vivant','Leave alive'),'<p>'+esc(copy('Tu veux éviter la prison et sortir vivant. Négocie à l’oral. Le cartel n’entend pas tes conversations ; une déposition signée deviendra identifiable dans le dossier final. Sans protection, sa sortie peut te faire tuer.','Avoid prison and leave alive. Negotiate face to face. The cartel cannot hear your conversations; signed testimony becomes identifiable in the final case record. Release without protection can get you killed.'))+'</p>'+
   (o?'<p><b>'+esc(label(o.terms))+'</b> · '+esc(o.status)+'</p>':'<p>'+esc(copy('Aucune proposition officielle en attente.','No official offer pending.'))+'</p>')+
   (open&&o?.status==='pending'?'<p>'+esc(copy('Accepter transmet officiellement ce renseignement : ','Acceptance formally submits this information: '))+'</p><blockquote>'+esc(player?.private_state?.information||player?.card?.information||'')+'</blockquote>'+button('respond',{revision:o.revision,accept:true,terms:o.terms},copy('Accepter et signer la déposition','Accept and sign testimony'))+button('respond',{revision:o.revision,accept:false},copy('Refuser cet accord','Refuse these terms')):''));
 }
 if(r==='maitre'&&d.cartel_forfeit)html+=card(copy('Défaite personnelle définitive','Final personal defeat'),'<p>'+esc(copy('Tu as abandonné le mandat : le cartel fera tuer ta famille au dénouement, même si tu reprends le mandat.','You abandoned the appointment: the cartel will kill your family in the ending, even if you resume it.'))+'</p>');
 if(r==='maitre'&&crisis)html+=card(copy('Ton mandat','Your appointment'),'<p>'+esc(copy('Tu peux négocier pour ton client ; lui seul accepte son accord. Tu ne votes pas pour le bureau et tu n’as pas accès aux preuves de vie de ses membres.','You may negotiate for your client; only they can accept their agreement. You do not vote for the bureau or access its members’ life proofs.'))+'</p>'+(d.offer?'<p>'+esc(label(d.offer.terms)+' · '+d.offer.status)+'</p>':''));
 if(r==='temoin')html+=card(copy('Ton témoignage','Your testimony'),'<p>'+esc(copy('Tu témoignes sur les faits de ta carte. Tu ne votes pas pour le bureau et tu ne connais pas le plan entier.','Testify to the facts on your card. You do not vote for the bureau and do not know the entire plan.'))+'</p>'+(d.witness_signed?'<b>'+esc(copy('Témoignage transmis.','Testimony submitted.'))+'</b>':open&&d.cycle>=1?button('testify',{},copy('Signer mon témoignage factuel','Sign my factual testimony')):''));
 return html+'</section>';
}
function prepareAction(action,payload,d){
 payload={...payload};
 if(action==='end_rep'){
  const lawyer=d?.role==='maitre';
  if(!window.confirm(lawyer?'Abandonner le mandat ? Ta défaite sera définitive et le cartel fera tuer ta famille au dénouement, même si tu reprends le mandat.':'Renvoyer ton avocat ? La représentation prend fin immédiatement.'))return null;
  payload.acknowledge_risk=lawyer;
 }
 if(action==='vote'){
  payload.choice=document.getElementById('c031Vote')?.value||payload.choice||'refuse';
  if(payload.choice!=='refuse'&&!window.confirm(copy('Ce bulletin peut imposer la remise de ce collègue au cartel, sans son veto. Vous ne disposez d’aucune garantie de libération des proches. Confirmer ce vote secret ?','This ballot can force this colleague’s handover without their veto. There is no guarantee the hostages will be released. Confirm your secret ballot?')))return null;
 }
 if(action==='plan'){
  payload={mode:document.getElementById('c031Mode')?.value||'wait',location:document.getElementById('c031Location')?.value,approach:document.getElementById('c031Approach')?.value,assault_author:document.getElementById('c031Assault')?.value};
  if(!payload.assault_author){window.toast?.(copy('Identifie qui a donné l’ordre d’assaut.','Identify who ordered the assault.'));return null;}
  if(payload.mode==='intervene'){
   if(!window.confirm(copy('Une intervention mal préparée peut faire tuer tous les proches. Ce plan sera appliqué au dénouement si le vote n’impose pas la remise d’un collègue. Confirmer ?','An ill-prepared intervention can get all loved ones killed. This plan applies in the ending unless the vote orders a colleague’s handover. Confirm?')))return null;
   payload.acknowledge_risk=true;
  }
 }
 if(action==='offer')payload.terms=document.getElementById('c031Terms-'+payload.suspect_id)?.value||'protected_release';
 if(action==='respond'&&payload.accept){
  const risky=payload.terms==='release';
  if(!window.confirm(risky?copy('Tu signes une déposition identifiable et acceptes une sortie sans protection. Le cartel pourra te retrouver et te tuer. Confirmer malgré ce risque ?','You sign identifiable testimony and accept unprotected release. The cartel can find and kill you. Confirm despite this risk?'):copy('Signer le renseignement prévu dans ta fiche et accepter la contrepartie affichée ?','Sign the information specified on your card and accept the displayed terms?')))return null;
  payload.acknowledge_risk=risky;delete payload.terms;
 }
 return payload;
}
async function act(action,payload={}){
 if(busy)return;
 const d=localContext?localState(localContext.s,localActor):currentCache(),key=cacheKey;
 if(!localContext&&!d?.enabled)return;
 const prepared=prepareAction(action,payload,d);if(!prepared)return;
 const submittedDraft={...drafts};
 busy=true;
 try{
  if(localContext){applyLocal(localContext.s,localActor,action,prepared);localContext.save(localContext.s);renderLocal(localContext.s,localContext);return;}
  await window.rpc('igr_v171_031_act',{p_code:S().room,p_player_token:S().token,p_action:action,p_payload:prepared});
  if(key!==sessionIdentity()){currentCache();return;}
  const ids=action==='vote'?['c031Vote']:action==='plan'?['c031Mode','c031Location','c031Approach','c031Assault']:action==='offer'?['c031Terms-'+prepared.suspect_id]:[];
  for(const id of ids)if(drafts[id]===submittedDraft[id])delete drafts[id];
  await window.syncNow?.(true);await refresh();window.renderGame?.();
 }catch(e){window.toast?.(e.message)}
 finally{busy=false}
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-c031-action]');if(!b)return;e.preventDefault();act(b.dataset.c031Action,JSON.parse(b.dataset.c031Payload||'{}'));});
document.addEventListener('change',e=>{if(localContext||!currentCache()?.open)return;const id=e.target?.id;if(/^c031(?:Vote|Mode|Location|Approach|Assault|Terms-.+)$/.test(id||''))drafts[id]=e.target.value;});
document.addEventListener('toggle',e=>{if(localContext||e.target?.id!=='c031ProofReview'||!currentCache()?.enabled)return;if(document.getElementById('c031ProofReview')===e.target)drafts.c031ProofOpen=!!e.target.open;},true);
const baseTabs=typeof window.gameTabs==='function'?window.gameTabs:null;
if(baseTabs){const f=function(){const tabs=baseTabs.apply(this,arguments)||[];if(active()&&!tabs.some(t=>t.id==='cartel031'))tabs.push({id:'cartel031',label:'La Dette'});return tabs};try{gameTabs=f}catch{}window.gameTabs=f;}
const baseTab=typeof window.renderGameTab==='function'?window.renderGameTab:null;
if(baseTab){const f=function(){const d=currentCache();if(active()&&(S()?.tab==='cartel031'||S()?.tab==='prosecutor'&&me()?.public_role==='procureur')){localContext=null;localActor=null;return renderBoard(d,me(),drafts,true);}return baseTab.apply(this,arguments)};try{renderGameTab=f}catch{}window.renderGameTab=f;}
const baseLeave=window.leaveRoom;if(typeof baseLeave==='function')window.leaveRoom=function(){try{return baseLeave.apply(this,arguments)}finally{currentCache();}};
setInterval(refresh,2200);window.addEventListener('focus',refresh);setTimeout(refresh,400);
const style=document.createElement('style');style.textContent='.igr031-proof{position:fixed;inset:0;z-index:1100;background:#030608f5;display:grid;align-items:center;padding:20px;overflow:auto}.igr031-proof>.igr031-card{max-width:650px;margin:auto}.igr031-page{display:grid;gap:14px}.igr031-card{padding:16px;border:1px solid #ffffff26;border-radius:16px;background:#ffffff06}.igr031-card p,.igr031-card blockquote{line-height:1.5;white-space:pre-line}.igr031-card label{display:grid;gap:6px;margin:12px 0}.igr031-card select{width:100%;min-height:44px;background:#14191f;color:#f2f4f6;border:1px solid #ffffff40;border-radius:8px;padding:8px}.igr031-card .btn{margin-top:10px;white-space:normal}.igr031-private{color:#dcb177;font-size:12px;font-weight:800}.igr031-agreement{padding:12px 0;border-top:1px solid #ffffff20}';document.head.appendChild(style);
window.igr031Open=()=>{if(S()){S().tab='cartel031';window.renderGame?.();refresh()}};
window.IGR_CARTEL031={version,refresh,renderBoard,act,prepareAction,
 initLocal,renderLocal,localState,applyLocal,localOutcome};

function initLocal(s){
 if(s.scenarioId!=='031'||!s.pack?.cartel031_canon)return;
 if(!s.cartel031||s.cartel031.version!==version){localActor=null;localPending=null;s.cartel031={version,ballots:{},offers:{},plan:{mode:'wait'},locked:false,nominee:null,witness_signed:false,levels:{},client_id:s.players.find(p=>p.role==='suspect'&&p.slot===3)?.id,cartel_forfeit:false,request:false};}
 return s.cartel031;
}
function localState(s,actor){
 const x=initLocal(s),c=s.pack.cartel031_canon,p=s.players.find(p=>p.id===(typeof actor==='string'?actor:actor?.id));
 if(!x||!p)return null;
 const crisis=s.cycle>=2,d={enabled:true,version,role:p.role,cycle:s.cycle,crisis,locked:x.locked,open:!x.locked&&s.stage!=='result',witness_signed:x.witness_signed};
 if(bureau(p.role)&&crisis){
  d.crew=s.players.filter(p=>bureau(p.role)).map(p=>({id:p.id,pseudo:p.name,role:p.role}));
  d.votes_received=d.crew.filter(p=>Object.hasOwn(x.ballots,p.id)).length;d.majority=Math.floor(d.crew.length/2)+1;
  d.own_ballot=x.ballots[p.id];d.nominee=x.locked&&x.nominee?{id:x.nominee,pseudo:s.players.find(p=>p.id===x.nominee)?.name}:null;
  d.proof=c.family_proofs[p.role];d.demand=c.demand;d.locations=c.locations;d.approaches=c.approaches;d.assault_options=c.assault_options;d.plan=x.plan;
  d.suspects=s.players.filter(p=>p.role==='suspect').map(p=>({id:p.id,pseudo:p.name,offer:x.offers[p.id]}));
 }else if(p.role==='suspect'&&crisis)d.offer=x.offers[p.id];
 else if(p.role==='maitre'){d.client_id=x.client_id;d.offer=x.offers[x.client_id];d.cartel_forfeit=x.cartel_forfeit}
 return d;
}
function applyLocal(s,actor,action,payload){
 const x=initLocal(s),c=s.pack.cartel031_canon,p=s.players.find(p=>p.id===(typeof actor==='string'?actor:actor?.id));
 if(!x||!p||s.stage==='result')throw Error('Action indisponible.');
 if(['end_rep','request_rep','accept_rep'].includes(action)){
  if(action==='end_rep'){
   if(!(p.role==='maitre'||p.role==='suspect'&&p.id===x.client_id)||!x.client_id)throw Error('Mandat indisponible.');
   if(p.role==='maitre'){if(payload.acknowledge_risk!==true)throw Error('Confirme la sanction du cartel.');x.cartel_forfeit=true}
   x.client_id=null;x.request=false;
  }else if(action==='request_rep'){
   if(p.role!=='suspect'||p.slot!==3||x.client_id)throw Error('Mandat réservé au client désigné.');
   x.request=true;
  }else{if(p.role!=='maitre'||!x.request||x.client_id)throw Error('Demande indisponible.');x.client_id=s.players.find(p=>p.role==='suspect'&&p.slot===3)?.id;x.request=false}
  return;
 }
 if(action==='levels'||action==='abstain'){
  if(!bureau(p.role)||s.stage!=='verdict')throw Error('Décision indisponible.');
  if(action==='levels'&&s.players.filter(p=>p.role==='suspect').some(q=>![0,1,2].includes(payload[q.id])))throw Error('Complète les trois responsabilités.');
  x.levels[p.id]=action==='abstain'?{}:{...payload};return;
 }
 if(x.locked)throw Error('Les décisions sont closes.');
 if(action==='testify'){
  if(p.role!=='temoin'||s.cycle<1)throw Error('Rôle non autorisé.');
  x.witness_signed=true;return;
 }
 if(s.cycle<2)throw Error('Décision indisponible au premier cycle.');
 if(action==='vote'){
  if(!bureau(p.role)||!(payload.choice==='refuse'||s.players.some(q=>bureau(q.role)&&q.id===payload.choice)))throw Error('Bulletin invalide.');
  x.ballots[p.id]=payload.choice;
 }else if(action==='plan'){
  if(!c.assault_options.some(q=>q.id===payload.assault_author))throw Error('Identifie l’ordre d’assaut.');
  if(p.role!=='enqueteur'||!['wait','intervene'].includes(payload.mode))throw Error('Plan non autorisé.');
  if(payload.mode==='intervene'&&(!c.locations.some(q=>q.id===payload.location)||!c.approaches.some(q=>q.id===payload.approach)||payload.acknowledge_risk!==true))throw Error('Confirme le risque et le plan.');
  x.plan={mode:payload.mode,location:payload.location,approach:payload.approach,assault_author:payload.assault_author};
 }else if(action==='offer'){
  if(!['enqueteur','procureur'].includes(p.role)||!s.players.some(q=>q.role==='suspect'&&q.id===payload.suspect_id)||!['prison','release','protected_release'].includes(payload.terms))throw Error('Accord non autorisé.');
  const old=x.offers[payload.suspect_id];if(old?.status==='accepted')throw Error('L’accord accepté engage le bureau.');
  x.offers[payload.suspect_id]={revision:(old?.revision||0)+1,terms:payload.terms,status:'pending'};
 }else if(action==='respond'){
  const o=x.offers[p.id];
  if(p.role!=='suspect'||o?.status!=='pending'||o.revision!==payload.revision||typeof payload.accept!=='boolean')throw Error('Accord modifié ou indisponible.');
  if(payload.accept&&o.terms==='release'&&payload.acknowledge_risk!==true)throw Error('Confirme le risque sans protection.');
  o.status=payload.accept?'accepted':'refused';
 }else throw Error('Action inconnue.');
}
function freezeLocal(s){
 const x=initLocal(s),crew=s.players.filter(p=>bureau(p.role)),required=Math.floor(crew.length/2)+1;
 x.nominee=crew.find(p=>crew.filter(q=>x.ballots[q.id]===p.id).length>=required)?.id||null;x.locked=true;
}
function localOutcome(s){
 const x=initLocal(s),c=s.pack.cartel031_canon;
 if(!x.locked)throw Error('Les décisions doivent être closes.');
 let outcome=x.nominee?c.resolution.handover:x.plan.mode==='intervene'&&x.plan.location===c.canonical_truth.hostage_location?(x.plan.approach===c.canonical_truth.safe_approach?c.resolution.located_safe:c.resolution.located_unsafe):c.resolution.unreached;
 const enq=s.players.find(p=>p.role==='enqueteur'),levels=x.levels[enq.id]||{},results=[];
 for(const p of s.players.filter(p=>p.role==='suspect')){
  const o=x.offers[p.id],guess=levels[p.id],fate=o?.status==='accepted'?({protected_release:'released_protected',release:'killed_after_release',prison:'prison'})[o.terms]:[0,1].includes(guess)?'released':'prison';
  results.push({id:p.id,name:p.name,role:p.role,success:['released','released_protected'].includes(fate),fate});
 }
 for(const p of s.players.filter(p=>p.role!=='suspect')){
  const exact=s.players.filter(q=>q.role==='suspect'&&x.levels[p.id]?.[q.id]===c.canonical_truth.levels[q.slot-1]).length;
  const success=bureau(p.role)?exact===3&&outcome==='rescued'&&x.plan.assault_author===c.canonical_truth.assault_author:p.role==='temoin'?x.witness_signed:p.role==='maitre'?!x.cartel_forfeit&&!!results.find(q=>q.id===x.client_id)?.success:false;
  results.push({id:p.id,name:p.name,role:p.role,success,fate:p.id===x.nominee?(c.resolution.delegate_fates[outcome]||'alive'):'alive',family_fate:p.role==='maitre'&&x.cartel_forfeit?'killed':null,exact});
 }
 return {outcome,nominee:x.nominee,results,summary:c.final_reveal+'\n\n'+c.endings[outcome]};
}
function renderLocal(s,context){
 if(!initLocal(s))return false;
 localContext={...context,s};
 const c=s.pack.cartel031_canon,x=s.cartel031;
 const player=s.players.find(p=>p.id===localActor);
 const heading='<header><button class="btn ghost small" type="button" data-c031-local="quit">Quitter</button><small>CARTEL 031 · LOCAL</small><h2>'+esc(s.stage==='result'?'LA VÉRITÉ':'LA DETTE · CYCLE '+s.cycle+'/3')+'</h2></header>';
 const put=body=>context.shell('<main class="page localplay igr031-page">'+heading+body+'</main>');
 const localButton=(a,id,text)=>'<button type="button" class="btn ghost block" data-c031-local="'+a+'" data-c031-id="'+esc(id||'')+'">'+esc(text)+'</button>';
 if(localPending){put(card('INFORMATIONS SCELLÉES','<p>Passez le téléphone à '+esc(s.players.find(p=>p.id===localPending)?.name)+'. Personne d’autre ne doit regarder.</p>')+localButton('private','','Afficher mes informations privées')+localButton('hide','','Rendre le téléphone'));return true;}
 if(s.stage==='result'){
  const result=localOutcome(s);localActor=null;
  const rows=result.results.map(p=>{
   const fateText=c.fate_copy[p.fate]||'';
   let body='<p>'+esc(fateText)+'</p>';
   if(p.family_fate==='killed')body+='<p>Tu as abandonné volontairement le mandat : le cartel a fait tuer ta famille.</p>';
   if(bureau(p.role))body+='<p>'+esc(p.exact+'/3 responsabilités exactes. Proches : '+c.outcome_copy[result.outcome])+'.</p>';
   return card(p.name+' · '+(p.success?'VICTOIRE':'DÉFAITE'),body);
  }).join('');
  put(card('Révélation','<p>'+esc(result.summary)+'</p>')+rows+localButton('finish','','Terminer'));
  return true;
 }
 if(player){
  let body=card('PRIVÉ · '+player.name,'<p>'+esc('Personne d’autre ne doit regarder cet écran.')+'</p>'+['place','chronology','hide','anchors','position','relations'].map(k=>player.card?.[k]?'<details><summary>'+esc(({place:'Ta place',chronology:'Ta chronologie',hide:'Ce que tu caches',anchors:'Tes repères',position:'Ta position',relations:'Tes relations'})[k])+'</summary><p>'+esc(typeof player.card[k]==='string'?player.card[k]:JSON.stringify(player.card[k]))+'</p></details>':'').join(''));
  body+=renderBoard(localState(s,player),player);
  if(bureau(player.role)){
   body+=card('PIÈCES REÇUES',c.revelations.filter(p=>p.min_cycle<=s.cycle).map(p=>'<details><summary>'+esc(p.title)+'</summary><p>'+esc(p.text)+'</p></details>').join('')+
    s.players.filter(p=>p.role==='suspect'&&x.offers[p.id]?.status==='accepted').map(p=>'<details><summary>'+esc('DÉPOSITION — '+p.name)+'</summary><p>'+esc(c.suspects[p.slot-1].information)+'</p></details>').join(''));
   if(s.stage==='verdict')body+=card('TA RECONSTRUCTION FINALE',s.players.filter(p=>p.role==='suspect').map(p=>'<label>'+esc(p.name)+'<select id="c031Level-'+esc(p.id)+'">'+[0,1,2].map(v=>'<option value="'+v+'" '+(x.levels[player.id]?.[p.id]===v?'selected':'')+'>'+v+' · '+['aucune','secondaire','principale'][v]+'</option>').join('')+'</select></label>').join('')+localButton('levels','','Verrouiller ma lecture')+localButton('abstain','','M’abstenir — aucun objectif validé'));
  }
  if(player.role==='maitre'||player.role==='suspect'){
   let counsel='';
   if(x.client_id&&(player.role==='maitre'||x.client_id===player.id))counsel=button('end_rep',{},player.role==='maitre'?'Cesser de représenter ce client':'Renvoyer l’avocat');
   else if(!x.client_id&&player.role==='suspect'&&player.slot===3)counsel=button('request_rep',{},'Redemander l’avocat du cartel');
   else if(!x.client_id&&player.role==='maitre'&&x.request)counsel=button('accept_rep',{},'Accepter la nouvelle demande');
   body+=card('REPRÉSENTATION',counsel+(player.role==='maitre'&&x.cartel_forfeit?'<p>Défaite personnelle définitive : le cartel fera tuer ta famille au dénouement, même si tu reprends le mandat.</p>':''));
  }
  put(body+localButton('hide','','Masquer et rendre le téléphone'));
  return true;
 }
 let body=card('LES ÉCHANGES SE JOUENT À TABLE','<p>'+esc(s.cycle===1?'Interrogez les trois chefs sur le massacre. Passez le téléphone seulement pour les informations privées et les décisions.':'Chaque joueur consulte seul ses informations. Les membres du bureau peuvent consulter les pièces, voter secrètement et négocier les accords. Aucun bulletin individuel ne s’affiche à table.')+'</p>');
 body+=s.players.map(p=>localButton('open',p.id,'Passer le téléphone à '+p.name)).join('');
 if(s.stage==='verdict'){
  const crew=s.players.filter(p=>bureau(p.role)),missing=crew.filter(p=>!Object.hasOwn(x.levels,p.id)).length;
  body+=card('DERNIÈRES LECTURES','<p>'+esc((crew.length-missing)+'/'+crew.length+' décisions reçues. Chaque membre du bureau verrouille sa lecture ou s’abstient sur son écran privé.')+'</p>'+(!missing?localButton('reveal','','Révéler la vérité'):''));
 }else body+=localButton('next','',s.cycle<3?'Passer au cycle suivant':'Clore les échanges et verrouiller les décisions');
 put(body);
 return true;
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-c031-local]');if(!b||!localContext)return;
 e.preventDefault();const {s,save}=localContext,a=b.dataset.c031Local;
 try{
  if(a==='quit'){save(s);localActor=null;localPending=null;localContext=null;if(S()){S().selectedScenario='031';S().view='create-confirm'}window.renderCreateConfirm?.();return}
  if(a==='open'){localPending=b.dataset.c031Id;localActor=null}
  else if(a==='private'){localActor=localPending;localPending=null}
  else if(a==='hide'){localActor=null;localPending=null}
  else if(a==='next'){
   if(s.cycle<3)s.cycle++;
   else{freezeLocal(s);s.stage='verdict'}localActor=null;
  }else if(a==='levels'){const values={};for(const p of s.players.filter(p=>p.role==='suspect'))values[p.id]=Number(document.getElementById('c031Level-'+p.id)?.value);applyLocal(s,localActor,'levels',values);localActor=null}
  else if(a==='abstain'){applyLocal(s,localActor,'abstain',{});localActor=null}
  else if(a==='reveal'){if(s.players.filter(p=>bureau(p.role)).some(p=>!Object.hasOwn(s.cartel031.levels,p.id)))throw Error('Chaque membre du bureau doit décider ou s’abstenir.');s.stage='result';localActor=null}
  else if(a==='finish'){localContext=null;localActor=null;try{STORAGE.removeItem('igr_local_standard_v13_8')}catch{localStorage.removeItem('igr_local_standard_v13_8')}window.renderCreateConfirm?.();return}
  save(s);renderLocal(s,localContext);
 }catch(error){window.toast?.(error.message)}
});
})();
