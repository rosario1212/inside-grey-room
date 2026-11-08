/* Inside Grey Room — OMERTÀ 021 · pilote Indic oral-first
 * Deux parcours indépendants : « Je souhaite en parler » (intention seule) ;
 * « J'en ai déjà parlé » (consignation formelle).
 * Aucun indicateur, aucun renseignement ou score n'est certifié par le client.
 */
(function(){
'use strict';
const OMERTA=new Set(['021','022','023','024','025']);
const FINISHED=new Set(['briefing','provisional_lock','final_debrief','locking','reveal']);
function context(){try{return typeof STATE!=='undefined'?STATE.sync:null;}catch(_){return null;}}
function isPlaying(d){return OMERTA.has(d?.room?.scenario_id)&&d.room.status==='playing'&&Number(d.room.cycle)>=2&&!FINISHED.has(d.room.phase);}
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
 'intel_already_received':'Ce renseignement a déjà été consigné.',
 'source_not_eligible_for_pact':'Ce pacte n’est pas possible pour cette personne dans ce dossier.',
 'indic_role_has_no_useful_novel_evidence':'Cette personne ne possède pas de renseignement pouvant faire gagner un Indic dans cette variante.',
 'indic_three_canonical_topics_not_approved':'Les informations de cette source ne sont pas encore vérifiées.',
 'indic_topic_not_owned_or_unreviewed':'Ce renseignement ne correspond pas au dossier privé de cette source.',
 'indic_one_official_report_per_cycle':'Une seule transmission officielle est possible par cycle.',
 'omerta_indic_offer_closed':'Ce pacte ne peut plus être proposé dans ce cycle.',
 'indic_final_review_closed':'Le bilan final n’est pas ouvert ou a déjà été enregistré.',
  'indic_final_assessment_closed':'Bilan réservé au débriefing du troisième cycle.',
  'indic_assessment_already_final':'Ce bilan a déjà été enregistré.',
  'invalid_indic_final_assessment':'Choisis l’utilité de l’Indic et la remise de peine autorisée.'
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

/* Santoro standalone: independent pact, topics and score server contracts.
 * Historical Verri actions must never be submitted by an autonomous room.
 * UI labels suggest usefulness; only the server determines the outcome.
 */
async function santoroPanel(){
 const d=context();
 if(!isPlaying(d)||d?.room?.state?.omerta_standalone!==true||typeof rpc!=='function')return;
 const m=modal('Indic · dossier Santoro',
   'Pacte confidentiel. Un témoignage vrai ne suffit pas toujours : il doit apporter un fait utile et nouveau.');
 m.slot.textContent='Vérification confidentielle du dossier…';
 try{
  const status=await sendRpc('igr_omerta_santoro_indic_status',{});
  if(!m.overlay.isConnected)return;
  m.slot.replaceChildren();
  if(!status?.available){m.slot.appendChild(node('p','Ce dossier n’est pas accessible pour cette partie.'));return;}
  const current=context();
  const userRole=role(current);
  function sendAction(parent,title,kind,params,question){
   const b=btn(title,'btn primary',async()=>{
    if(question&&!confirm(question))return;
    b.disabled=true;
    try{
     const argumentsForRpc=typeof params==='function'?params():params;
     const out=await sendRpc('igr_omerta_santoro_indic_action',
       {p_kind:kind,...argumentsForRpc});
     if(out?.ok!==true)throw Error('indic_action_not_confirmed');
     await refresh();
     if(m.overlay.isConnected)await santoroPanel();
    }catch(e){failure(parent,e);b.disabled=false;}
   });
   parent.appendChild(b);
   return b;
  }
  if(userRole==='enqueteur'){
   if(status.can_offer===true){
    const candidates=(current?.players||[]).filter(p=>p.public_role==='suspect'&&p.id);
    if(!candidates.length){m.slot.appendChild(node('p','Aucun suspect disponible pour un pacte.'));return;}
    m.slot.appendChild(node('p','Choisis un suspect. Le serveur refusera tout pacte dont la source ne peut fournir aucun renseignement utile.'));
    const select=node('select');
    select.className='igr-money-intel-select';
    for(const candidate of candidates){
     const choice=node('option',candidate.pseudo||'Suspect');
     choice.value=candidate.id;
     select.appendChild(choice);
    }
    m.slot.appendChild(select);
    sendAction(m.slot,'Proposer le pacte secret','offer',()=>({p_target:select.value}));
    return;
   }
   if(!status.offered){m.slot.appendChild(node('p','Aucun pacte en cours.'));return;}
   const sourceName=(current?.players||[]).find(p=>p.id===status.source_id)?.pseudo||'Source choisie';
   m.slot.appendChild(node('p','Source : '+sourceName));
   if(status.accepted===null){m.slot.appendChild(node('p','En attente de sa réponse.'));return;}
   if(status.accepted===false){m.slot.appendChild(node('p','Le pacte a été refusé.'));return;}
   m.slot.appendChild(node('p','Pacte accepté. Un signal oral n’est pas une information consignée.'));
   const received=Array.isArray(status.topics)?status.topics:[];
   if(received.length){
    const section=node('div');
    for(const t of received){
     section.appendChild(node('p',(t.title||'Renseignement')+
       (t.logged?' · consigné':t.signaled?' · disponibilité signalée':' · non transmis')));
    }
    m.slot.appendChild(section);
   }
   if(status.protected){
    m.slot.appendChild(node('p','Protection officielle accordée.'));
   }else if(current.room.phase!=='locking'){
    sendAction(m.slot,'Accorder une protection','protect',{},
     'Confirmer la protection de la source pour cette partie ?');
   }
   if(Number(current.room.cycle)===3&&current.room.phase==='cycle_debrief'){
    if(status.final_review_recorded){
     m.slot.appendChild(node('p','Bilan final de la source déjà enregistré.'));
    }else{
     m.slot.appendChild(node('p',
       'L’avis de l’Enquêteur ne crée pas une victoire sans renseignement canonique transmis au deuxième cycle.'));
     const label=node('label','Information réellement utile');
     const useful=node('select');useful.className='igr-money-intel-select';
     for(const [val,text] of [['yes','Oui'],['no','Non']]){
      const option=node('option',text);option.value=val;useful.appendChild(option);
     }
     const labelReduction=node('label','Réduction de peine officielle');
     const reduction=node('select');reduction.className='igr-money-intel-select';
     for(const [val,text] of [['0','Aucune'],['3','Trois ans']]){
      const option=node('option',text);option.value=val;reduction.appendChild(option);
     }
     m.slot.append(label,useful,labelReduction,reduction);
     sendAction(m.slot,'Enregistrer le bilan','review',
       ()=>({p_value:useful.value==='yes',p_reduction_years:Number(reduction.value)}),
       'Enregistrer définitivement ce bilan ?');
    }
   }
   return;
  }
  if(userRole!=='suspect'||!status.offered||!status.is_source){
   m.slot.appendChild(node('p','Aucune proposition de pacte confidentiel reçue.'));
   return;
  }
  if(status.accepted===null){
   m.slot.appendChild(node('p','Tu peux accepter ou refuser librement ce pacte. Aucun renseignement oral n’est enregistré automatiquement.'));
   sendAction(m.slot,'Accepter le pacte','answer',{p_value:true});
   sendAction(m.slot,'Refuser le pacte','answer',{p_value:false});
   return;
  }
  if(status.accepted===false){
   m.slot.appendChild(node('p','Tu as refusé ce pacte.'));
   return;
  }
  m.slot.appendChild(node('p',status.protected?'Tu bénéficies d’une protection officielle.':
   'Tu ne disposes pas encore d’une protection officielle.'));
  if(Number(current.room.cycle)===3){
   m.slot.appendChild(node('p',
     'Attention : une première transmission au troisième cycle est trop tardive pour compter comme information nouvelle du deuxième cycle.'));
  }
  const topics=Array.isArray(status.topics)?status.topics:[];
  if(!topics.length){m.slot.appendChild(node('p','Aucun renseignement disponible.'));return;}
  for(const topic of topics){
   const section=node('section');section.className='igr-money-intel-item';
   section.appendChild(node('h3',topic.title||'Renseignement'));
   const details=node('details');
   const summary=node('summary','Relire ce que je sais');
   details.append(summary,node('p',topic.detail||''));
   section.appendChild(details);
   const useful=topic.investigative_value==='actionable_candidate';
   const hint=node('small',useful?
     'Fait potentiellement exploitable par l’enquête — à confirmer par le serveur.':
     'Élément de contexte : ne suffit pas à lui seul pour gagner comme Indic.');
   section.appendChild(hint);
   if(topic.logged){
    section.appendChild(node('p','Déjà consigné auprès de l’Enquêteur.'));
   }else{
    if(topic.signaled)section.appendChild(node('p','Disponibilité signalée, pas encore consignée.'));
    const row=node('div');row.className='igr-money-intel-actions';
    sendAction(row,'Je souhaite en parler','signal',{p_topic_id:topic.id});
    sendAction(row,"J'en ai déjà parlé · consigner",'spoken',{p_topic_id:topic.id},
      'Enregistrer officiellement ce renseignement ?');
    section.appendChild(row);
   }
   m.slot.appendChild(section);
  }
 }catch(e){
  if(m.overlay.isConnected){
   m.slot.textContent='';
   failure(m.slot,e);
  }
 }
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
 const m=modal('Mes renseignements','Parle librement, puis choisis ce que tu consignes. Sauve ta peau : obtiens une protection ou demande un accord. Donne un renseignement fiable et reste en vie.');
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
   const reminder=node('details');
   reminder.className='igr-indic-knowledge-detail';
   reminder.appendChild(node('summary','Relire ce que je sais'));
   reminder.appendChild(detail);
   const flag=actions.some(a=>a.action_type==='omerta_intel_intent'&&a.payload?.fact_id===card.id);
   const tag=node('small',card.logged?'Consigné dans le dossier de l’Enquêteur':flag?'Discussion déjà proposée':'Pas encore abordé officiellement');
   const row=node('div');row.className='igr-money-intel-actions';
   if(card.logged){
     const summary=node('p','Renseignement déjà consigné : aucune nouvelle transmission nécessaire.');
     wrapper.append(title,reminder,tag,summary);m.slot.appendChild(wrapper);
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
   row.append(intent,committed);wrapper.append(title,reminder,tag,row);m.slot.appendChild(wrapper);
  }
  const tip=node('p','Le signal de disponibilité ne compte pas comme coopération. Un renseignement consigné est automatiquement transmis à l’Enquêteur. Il ne peut pas en nier la réception.');
  tip.className='igr-money-intel-note';m.slot.appendChild(tip);
 }catch(e){
  console.warn('[OMERTA] chargement de renseignement',e);
  if(m.overlay.isConnected)m.slot.textContent='Le dossier n’est pas disponible pour ce cycle.';
 }
}
function acceptedSource(d){
  const found=events(d,'omerta_indic_status').find(e=>e.payload?.accepted===true&&e.payload?.source_id);
  return found?.payload?.source_id||null;
}
async function protectSource(){
  const d=context(),source=acceptedSource(d);
  if(!isPlaying(d)||role(d)!=='enqueteur'||!source||d.room.phase==='locking')return;
  const m=modal('Protection de l’Indic','Vous pouvez officialiser votre accord, même si cette source vous a seulement parlé à l’oral.');
  m.slot.appendChild(node('p','Une protection engage le camp d’enquête. Elle permettra à l’Indic d’atteindre son objectif personnel s’il survit et coopère utilement.'));
  const b=btn('Confirmer sa protection','btn primary',async()=>{
    if(!confirm('Accorder une protection officielle à cette source ? Cette décision ne pourra pas être annulée.'))return;
    b.disabled=true;
    try{
      const response=await sendRpc('igr_omerta_indic_protect',{p_source:source});
      if(response?.ok!==true)throw Error('protection_closed');
      m.slot.textContent='Protection accordée. La source en a été informée confidentiellement.';
      b.remove();await refresh();
    }catch(e){failure(m.slot,e);b.disabled=false;}
  });
  m.footer.insertBefore(b,m.footer.firstChild);
}
// C3 : l'évaluation orale authentifiée peut valider l'utilité même avec 0 carte.
async function assessSource(){
 const d=context(),source=acceptedSource(d);
 if(!d||role(d)!=='enqueteur'||!source||Number(d.room?.cycle)!==3
   ||d.room?.phase!=='cycle_debrief'||d.room?.status!=='playing'
   ||d.room?.state?.omerta_standalone===true
   ||events(d,'omerta_indic_final_review_submitted').length)return;
 const m=modal('Bilan final de l’Indic',
  'L’Enquêteur juge l’utilité réelle des informations reçues, même si la source n’a signalé aucun des trois sujets dans l’application.');
 const title=node('label','Cette source a-t-elle été utile ?');
 const useful=node('select');useful.className='igr-money-intel-select';
 for(const [val,text] of [['','Choisir une évaluation'],['yes','Oui · informations utiles'],['no','Non · utilité insuffisante']]){
   const opt=node('option',text);opt.value=val;useful.appendChild(opt);
 }
 const benefitLabel=node('label','Réduction de peine officiellement négociée');
 const reduction=node('select');reduction.className='igr-money-intel-select';
 for(const [val,text] of [['0','Pas de réduction supplémentaire'],['3','Accorder une réduction de 3 ans']]){
   const opt=node('option',text);opt.value=val;reduction.appendChild(opt);
 }
 m.slot.append(title,useful,benefitLabel,reduction,
   node('p','La protection ou la réduction de peine satisfait la condition personnelle. L’utilité est évaluée indépendamment. Survivre reste indispensable.'));
 const act=btn('Enregistrer le bilan définitif','btn primary',async()=>{
   if(useful.value!=='yes'&&useful.value!=='no'){
     failure(m.slot,new Error('invalid_indic_final_assessment'));return;
   }
   if(!confirm('Valider définitivement ce bilan ?'))return;
   act.disabled=true;
   try{
     const out=await sendRpc('igr_omerta_indic_final_assess',{
       p_source:source,p_useful:useful.value==='yes',
       p_reduction_years:Number(reduction.value)
     });
     if(out?.ok!==true)throw Error('final_assessment_unavailable');
     m.slot.textContent='Bilan enregistré confidentiellement. Le résultat sera calculé au verdict.';
     act.remove();await refresh();
   }catch(e){failure(m.slot,e);act.disabled=false;}
 });
 m.footer.insertBefore(act,m.footer.firstChild);
}
// Une transmission déjà consignée supprime automatiquement le rappel de cycle.
const reminderDismissed=new Set();
function mountCycleReminder(){
 const d=context(),panel=document.querySelector('.game-panel-v11');
 if(d?.room?.state?.omerta_standalone===true){
  panel?.querySelector('.igr-indic-cycle-reminder')?.remove();
  return;
 }
 if(!panel)return;
 const old=panel.querySelector('.igr-indic-cycle-reminder');
 const cycle=Number(d?.room?.cycle)||0;
 const key=[d?.room?.code,match(d),cycle].join(':');
 const active=role(d)==='suspect'&&activated(d)&&d?.room?.status==='playing'
   &&cycle>=2&&d.room.phase==='cycle_debrief'&&OMERTA.has(d.room.scenario_id);
 const logged=(d?.my_actions||[]).some(a=>a.action_type==='omerta_verified_intel'
   &&Number(a.cycle)===cycle&&Number(a.payload?.match_no||1)===match(d));
 if(old&&(!active||logged||old._igrCycleKey!==key))old.remove();
 if(!active||logged||reminderDismissed.has(key)||panel.querySelector('.igr-indic-cycle-reminder'))return;
 const box=node('section');box.className='igr-indic-cycle-reminder';box._igrCycleKey=key;
 box.appendChild(node('strong','INDIC · FIN DE CYCLE'));
 box.appendChild(node('p','As-tu partagé une information ?'));
 const row=node('div');row.className='igr-money-intel-actions';
 row.appendChild(btn('Oui','btn primary',()=>{reminderDismissed.add(key);box.remove();intel();}));
 row.appendChild(btn('Non','btn ghost',()=>{reminderDismissed.add(key);box.remove();}));
 box.appendChild(row);panel.appendChild(box);
}
function mount(){
 mountCycleReminder();
 const d=context();
 // In Santoro, the default tab is Investigation: expose the canonical
 // informant action there even when the private-card dock is not mounted.
 const dock=document.querySelector('.omerta-decision-dock')||
  (d?.room?.state?.omerta_standalone===true?document.querySelector('.game-panel-v11'):null);
 if(!dock||!isPlaying(d))return;
 if(d?.room?.state?.omerta_standalone===true){
  const oldSelectors='.igr-indic-offer-button,.igr-indic-final-assess-button,.igr-indic-protect-button,.igr-indic-accept-button,.igr-indic-reject-button,.igr-money-intel-entry';
  dock.querySelectorAll(oldSelectors).forEach(b=>b.remove());
  if(['enqueteur','suspect'].includes(role(d))&&!dock.querySelector('.igr-santoro-indic-entry')){
   const title=role(d)==='enqueteur'?'Indic · Pacte et protection':'Indic · Mes renseignements';
   dock.appendChild(btn(title,'btn ghost igr-santoro-indic-entry',santoroPanel));
  }
  return;
 }
 if(role(d)==='enqueteur'&&!events(d,'omerta_indic_status').some(e=>e.payload?.accepted===true)&&!dock.querySelector('.igr-indic-offer-button')){
  const b=btn('Proposer un pacte secret','btn ghost igr-indic-offer-button',offer);
  dock.appendChild(b);
 }
 if(role(d)==='enqueteur'&&acceptedSource(d)
   &&d.room.state?.omerta_standalone!==true
   &&Number(d.room.cycle)===3&&d.room.phase==='cycle_debrief'
   &&!events(d,'omerta_indic_final_review_submitted').length
   &&!dock.querySelector('.igr-indic-final-assess-button')){
   dock.appendChild(btn('Évaluer mon Indic · bilan final',
     'btn primary igr-indic-final-assess-button',assessSource));
 }
 if(role(d)==='enqueteur'&&acceptedSource(d)&&d.room.phase!=='locking'
   &&!events(d,'omerta_indic_protection').length
   &&!dock.querySelector('.igr-indic-protect-button')){
   dock.appendChild(btn('Protéger mon Indic','btn ghost igr-indic-protect-button',protectSource));
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
