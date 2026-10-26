/* Inside Grey Room — OMERTÀ 021 · pilote Indic oral-first
 * Deux parcours indépendants : « Je souhaite en parler » (intention seule) ;
 * « J'en ai déjà parlé » (consignation formelle).
 * Aucun indicateur, aucun renseignement ou score n'est certifié par le client.
 */
(function(){
'use strict';
const SID='021';
const FINISHED=new Set(['briefing','provisional_lock','final_debrief','locking','reveal']);
function context(){try{return typeof STATE!=='undefined'?STATE.sync:null;}catch(_){return null;}}
function isPlaying(d){return d?.room?.scenario_id===SID&&d.room.status==='playing'&&Number(d.room.cycle)>=2&&!FINISHED.has(d.room.phase);}
function match(d){return Math.max(1,Number(d?.room?.state?.match_no)||1);}
function events(d,type){return (d?.events||[]).filter(e=>e.event_type===type&&Number(e.payload?.match_no||1)===match(d));}
function activated(d){return d?.player?.public_role==='suspect'&&events(d,'omerta_indic_status').some(e=>e.payload?.accepted===true);}
function pendingOffer(d){return events(d,'omerta_indic_offer').find(e=>!events(d,'omerta_indic_status').some(x=>x.payload?.accepted===true||x.payload?.accepted===false));}
function role(d){return d?.player?.public_role||'';}
function btn(title,cls,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=title;b.addEventListener('click',fn);return b;}
function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
function alertMessage(error){const e=String(error?.message||'');const msgs={
 'indic_not_recruited':'Tu dois accepter le pacte avant de transmettre un renseignement.',
 'indic_closed':'Il est trop tard pour cette décision.',
 'invalid_source':'Cette proposition n’est pas disponible dans ce dossier pilote.',
 'indic_already_recruited':'Une source est déjà recrutée.',
 'offer_already_made':'Une proposition a déjà été envoyée à cette personne.',
 'offer_missing':'La proposition n’est plus disponible.',
 'already_decided':'La décision a déjà été enregistrée.',
 'intel_not_owned_or_unavailable':'Ce renseignement ne t’appartient pas ou a déjà été consigné.',
 'one_intel_per_cycle':'Une seule consignation officielle est autorisée par cycle.',
 'intel_already_received':'Ce renseignement a déjà été consigné.'
 };for(const [key,msg]of Object.entries(msgs))if(e.includes(key))return msg;
 return 'Décision indisponible. Vérifie l’état du cycle puis réessaie.';}
function close(){document.querySelector('.igr-money-intel-modal')?.remove();}
async function sendRpc(name,params){return rpc(name,{p_code:STATE.room||context()?.room?.code,p_player_token:STATE.token,...params});}
async function refresh(){try{if(typeof syncNow==='function')await syncNow(true);}catch(e){console.warn('[OMERTA] synchronisation',e);}}
function modal(title,description){
 close();
 const overlay=node('div');overlay.className='modal igr-money-intel-modal';
 const panel=node('div');panel.className='modal-box igr-money-intel-panel';
 const head=node('span','OMERTÀ · SOURCE CONFIDENTIELLE');head.className='omerta-eyebrow';
 const h=node('h2',title),p=node('p',description);
 const slot=node('div');slot.className='igr-money-intel-card';
 const footer=node('div');footer.className='modal-actions';
 footer.appendChild(btn('Retour à la table','btn ghost',close));
 panel.append(head,h,p,slot,footer);
 overlay.appendChild(panel);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.body.appendChild(overlay);
 return {overlay,slot,footer};
}
function failure(slot,e){
 const msg=node('p',alertMessage(e));msg.className='igr-money-intel-error';
 slot.appendChild(msg);
}
async function offer(){
 if(!isPlaying(context())||role(context())!=='enqueteur')return;
 const d=context(),m=modal('Recruter une source','Négocie d’abord à l’oral. La proposition officielle reste privée entre vous deux.');
 const choices=(d.players||[]).filter(p=>p.public_role==='suspect');
 if(!choices.length){m.slot.textContent='Aucun suspect disponible.';return;}
 const select=node('select');select.className='igr-money-intel-select';
 for(const person of choices){const option=node('option',person.pseudo);option.value=person.id;select.appendChild(option);}
 m.slot.appendChild(select);
 const act=btn('Proposer un pacte confidentiel','btn primary',async()=>{
  act.disabled=true;
  try{await sendRpc('igr_omerta_indic_offer',{p_suspect:select.value});m.slot.textContent='Proposition transmise discrètement au suspect.';act.remove();await refresh();}
  catch(e){failure(m.slot,e);act.disabled=false;}
 });
 m.footer.insertBefore(act,m.footer.firstChild);
}
async function respond(accept){
 const d=context();if(!isPlaying(d)||!pendingOffer(d)||role(d)!=='suspect')return;
 const m=modal('Proposition de l’Enquêteur','Ton choix reste confidentiel. Tu peux négocier oralement avant de répondre.');
 const act=btn(accept?'Accepter et devenir Indic':'Refuser la proposition',accept?'btn primary':'btn ghost',async()=>{
   act.disabled=true;
   try{await sendRpc('igr_omerta_indic_respond',{p_accept:accept});m.slot.textContent=accept?'Pacte accepté. Ton dossier de source est désormais accessible.':'Proposition refusée.';act.remove();await refresh();}
   catch(e){failure(m.slot,e);act.disabled=false;}
 });
 m.slot.textContent=accept?'En acceptant, tu peux choisir ce que tu révéleras. Aucun aveu oral n’est automatiquement enregistré.':'Tu restes libre de refuser.';
 m.footer.insertBefore(act,m.footer.firstChild);
}
async function intel(){
 const d=context();if(!isPlaying(d)||!activated(d)||typeof rpc!=='function')return;
 const m=modal('Mes renseignements','Trois sujets que tu connais. Tu peux parler avant de toucher ton téléphone ou annoncer une discussion à l’avance.');
 m.slot.textContent='Consultation confidentielle…';
 try{
  const reply=await sendRpc('igr_omerta_money_intel_options',{});
  if(!m.overlay.isConnected)return;
  m.slot.replaceChildren();
  const cards=Array.isArray(reply?.cards)?reply.cards:[];
  if(!cards.length){m.slot.textContent='Tous les renseignements disponibles ont déjà été consignés.';return;}
  const d2=context();
  const actions=(d2?.my_actions||[]);
  for(const card of cards){
   const wrapper=node('section');wrapper.className='igr-money-intel-item';
   const title=node('h3',card.title||'Renseignement');
   const detail=node('p',card.detail||'');
   const flag=actions.some(a=>a.action_type==='omerta_intel_intent'&&a.payload?.fact_id===card.id);
   const tag=node('small',card.logged?'Consigné dans le dossier de l’Enquêteur':flag?'Discussion déjà proposée':'Pas encore abordé officiellement');
   const row=node('div');row.className='igr-money-intel-actions';
   if(card.logged){
     const summary=node('p','Renseignement déjà consigné : aucune nouvelle transmission nécessaire.');
     wrapper.append(title,detail,tag,summary);m.slot.appendChild(wrapper);
     continue;
   }
   const intent=btn(flag?'Renouveler le signal':'Je souhaite en parler','btn ghost',async()=>{
     intent.disabled=true;
     try{
      const out=await sendRpc('igr_omerta_money_intel_signal',{p_card_id:card.id});
      tag.textContent=out?.already?'Signal déjà reçu par l’Enquêteur.':'Votre disponibilité a été signalée, pas le contenu.';
      await refresh();
     }catch(e){failure(wrapper,e);}
     finally{intent.disabled=false;}
   });
   const committed=btn('J’en ai déjà parlé','btn primary',async()=>{
     if(!confirm('Consigner ce renseignement dans le dossier de l’Enquêteur ? Cette action est irréversible.'))return;
     committed.disabled=true;
     try{
      const out=await sendRpc('igr_omerta_money_intel_send',{p_card_id:card.id});
      if(out?.ok!==true)throw Error('intel_unavailable');
      tag.textContent='Renseignement consigné auprès de l’Enquêteur.';
      row.remove();
      await refresh();
     }catch(e){failure(wrapper,e);committed.disabled=false;}
   });
   row.append(intent,committed);wrapper.append(title,detail,tag,row);m.slot.appendChild(wrapper);
  }
  const tip=node('p','Un signal de discussion ne compte pas comme coopération. Seule une consignation officielle peut être évaluée par le serveur.');
  tip.className='igr-money-intel-note';m.slot.appendChild(tip);
 }catch(e){
  console.warn('[OMERTA] chargement de renseignement',e);
  if(m.overlay.isConnected)m.slot.textContent='Le dossier n’est pas disponible pour ce cycle.';
 }
}
function mount(){
 const d=context(),dock=document.querySelector('.omerta-decision-dock');
 if(!dock||!isPlaying(d))return;
 if(role(d)==='enqueteur'&&!dock.querySelector('.igr-indic-offer-button')){
  const b=btn('Proposer un pacte secret','btn ghost igr-indic-offer-button',offer);
  dock.appendChild(b);
 }
 if(role(d)==='suspect'&&pendingOffer(d)&&!events(d,'omerta_indic_status').length){
   if(!dock.querySelector('.igr-indic-accept-button')){
     dock.appendChild(btn('Accepter le pacte proposé','btn primary igr-indic-accept-button',()=>respond(true)));
     dock.appendChild(btn('Refuser le pacte','btn ghost igr-indic-reject-button',()=>respond(false)));
   }
 }
 if(role(d)==='suspect'&&activated(d)&&!dock.querySelector('.igr-money-intel-entry')){
   const b=btn('Mes renseignements · Indic','btn ghost igr-money-intel-entry',intel);
   b.setAttribute('aria-label','Ouvrir mes renseignements confidentiels');dock.appendChild(b);
 }
}
function init(){
 mount();if(!document.body)return;
 const ob=new MutationObserver(changes=>{if(changes.some(x=>x.addedNodes?.length))mount();});
 ob.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('pageshow',mount);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
