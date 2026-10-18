/* CASINO client: projections only. The server owns all state and random draws. */
(()=>{'use strict';
const KEY='igr_casino_identity_v1',ROOT='casino-live-v105';
const API=window.Capacitor?.isNativePlatform?.()?'https://inside-grey-room-last.alial-khafaji2002.workers.dev/api/casino':'/api/casino';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles={casino:'Casino',agent:'Agent international',investigator:'Enquêteur',analyst:'Analyste',prosecutor:'Procureur',judge:'Juge'};
const statuses={guest:'Invité',free:'Libre',interpellated:'Interpellé',detained:'Détenu',dead:'Décédé',deposed:'Déchu'};
let credentials=null,state=null,tab='card',timer=null,busy=false,polling=null,generation=0,active=false,pending=null,problem='',syncedAt=0,joinDraft=null,advanceConfirm=false;
const freshToken=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
function load(){try{const v=JSON.parse(localStorage.getItem(KEY+'_pending')||localStorage.getItem(KEY)||'null');return (v?.roomId||v?.inviteCode)&&v?.sessionToken?v:null}catch{return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(credentials));localStorage.removeItem(KEY+'_pending')}catch{}}
function message(error){const map={revision_conflict:'La table a évolué. Relis le nouvel état avant de confirmer ton choix.',casino_editorial_release_required:'Le lancement attend la validation des trois intrigues privées.',session_not_authorized:'Cette clé ne permet pas de reprendre ce personnage.',minimum_social_time:'Laisse encore du temps aux échanges avant de poursuivre.',judicial_elements_not_established:'Les éléments constitutifs de cette infraction ne sont pas tous démontrés par les sources retenues.',continuity_not_available:'La procédure de secours nécessite une attente prolongée.',territory_agreement_requires_asset:'Désigne le territoire exact de cet accord.',intel_requires_documentary_source:'Sélectionne au moins une source documentaire liée à ce personnage.',agent_must_locate_room:'L’Agent doit d’abord localiser la salle.',finish_poker_first:'La main de poker doit être terminée.',players_not_ready:'Chaque participant doit confirmer sa présence.',incomplete_lobby_roles:'Il faut 4 à 7 joueurs au casino, un Agent, un Enquêteur et un Analyste.',name_already_in_use:'Ce prénom est déjà utilisé. Une reprise demande la clé personnelle.',role_already_taken:'Ce rôle vient d’être choisi par une autre personne.',storage_unavailable:'La sauvegarde serveur est momentanément indisponible.',casino_service_unavailable:'Le service Casino est momentanément indisponible.',network_uncertain:'La réponse n’est pas arrivée. Réessaie la même action pour vérifier son enregistrement.'};return map[error]||'Action refusée : '+String(error).replaceAll('_',' ')}
async function request(body){
 const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(API,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(body),signal:controller.signal});
  const data=await response.json().catch(()=>{throw Error('network_uncertain')});
  if(!response.ok||data?.error)throw Error(data.error||'request_failed');
  if(!data?.roomId||!Number.isSafeInteger(data.revision)||!['lobby','playing','finished'].includes(data.status))throw Error('network_uncertain');return data;
 }finally{clearTimeout(deadline)}
}
function accept(data,epoch){if(!active||epoch!==generation)return;if(state&&data.roomId===state.roomId&&data.revision<state.revision)return;
 const changed=!state||state.roomId!==data.roomId||state.revision!==data.revision;
 state=data;syncedAt=Date.now();if(changed){advanceConfirm=false;render()}else connection();
}
function connection(){const el=$('#'+ROOT+' [data-casino-connection]');if(el)el.textContent=problem?message(problem):state&&syncedAt?'Synchronisé · état serveur '+state.revision:credentials?'Connexion…':''}
async function sync(){
 if(!credentials||!active||busy)return;if(polling)return polling;
 const epoch=generation;
 polling=(async()=>{try{const data=await request({...credentials,op:credentials.op==='create'?'create':credentials.roomId?'sync':'join',...(credentials.op==='create'?{profileId:JSON.parse(localStorage.getItem('igr_social_identity_v1')||'null')?.id,profileToken:JSON.parse(localStorage.getItem('igr_social_identity_v1')||'null')?.token}:{})});if(epoch===generation){credentials={roomId:data.roomId,sessionToken:credentials.sessionToken};save()}accept(data,epoch);if(epoch===generation){if(!pending)problem='';connection()}}
 catch(e){if(epoch===generation){problem=e.message==='session_not_authorized'?e.message:'network_uncertain';connection()}}
 finally{polling=null}})();return polling;
}
async function mutate(body,retry=false){
 if(busy)return;if(pending&&!retry)return;
 busy=true;problem='';const epoch=generation;
 const full=retry?pending:{...credentials,...body,expectedRevision:state?.revision,requestId:crypto.randomUUID()};pending=full;
 // Persist a newly issued recovery secret before sending it, including a join
 // whose response may be lost. No decisions or character state are stored here.
 if(full.op==='create'||full.op==='join'){credentials={roomId:full.roomId,inviteCode:full.inviteCode,sessionToken:full.sessionToken,name:full.name,requestId:full.requestId,op:full.op};try{localStorage.setItem(KEY+'_pending',JSON.stringify(credentials))}catch{}}
 render();
 try{
  const data=await request(full);if(epoch!==generation)return;
  credentials={roomId:data.roomId,sessionToken:full.sessionToken};save();pending=null;accept(data,epoch);
 }catch(e){if(epoch!==generation)return;
  const uncertain=['TypeError','TimeoutError','AbortError'].includes(e.name)||['Failed to fetch','network_uncertain','casino_service_unavailable','storage_unavailable'].includes(e.message);
  problem=uncertain?'network_uncertain':e.message;
  if(!uncertain){pending=null;if(full.op==='create'||full.op==='join'){try{localStorage.removeItem(KEY+'_pending')}catch{}credentials=load()}}
 }finally{if(epoch===generation){busy=false;render();if(problem==='revision_conflict')await sync()}}
}
const button=(label,type,payload={},disabled=false)=>`<button type="button" class="casino-action" data-casino-command="${esc(type)}" data-payload="${esc(JSON.stringify(payload))}" ${disabled?'disabled':''}>${esc(label)}</button>`;
const field=(label,name,type='text',extra='')=>`<label>${esc(label)}<input name="${esc(name)}" type="${type}" ${extra} data-casino-draft></label>`;
const area=(label,name,max=1000)=>`<label>${esc(label)}<textarea name="${esc(name)}" maxlength="${max}" required data-casino-draft></textarea></label>`;
const form=(kind,body,label)=>`<form data-casino-form="${kind}">${body}<button class="casino-action" type="submit">${esc(label)}</button></form>`;
const name=id=>state?.characters?.find(c=>c.id===id)?.name||state?.participants?.find(m=>m.id===id)?.name||state?.members?.find(m=>m.id===id)?.name||id;
const option=(id,label)=>`<option value="${esc(id)}">${esc(label)}</option>`;
const people=(key,filter=()=>true)=>`<label>Personne<select name="${esc(key)}" data-casino-draft>${(state.characters||[]).filter(filter).map(c=>option(c.id,c.name)).join('')}</select></label>`;
const section=(title,body)=>`<section class="casino-box"><h2>${esc(title)}</h2>${body}</section>`;
function welcome(){return `<h1>Une table à Macao</h1><p>Un écran par participant. Le casino et le bureau d’enquête jouent dans deux espaces séparés.</p>
 <div class="casino-entry-options"><section class="casino-entry-option" aria-labelledby="casino-create-title"><h2 id="casino-create-title">Organiser une partie</h2><p>Tu es l’hôte : crée la table, puis partage son code avec les autres participants.</p>${form('create',field('Ton prénom d’hôte','name','text','maxlength="22" required autocomplete="given-name"'),'Créer une table privée')}</section>
 <section class="casino-entry-option" aria-labelledby="casino-join-title"><h2 id="casino-join-title">Rejoindre des amis</h2><p>Un hôte a déjà créé la table ? Entre son code et ton prénom.</p>${form('join',field('Code de la table','inviteCode','text','maxlength="10" required autocapitalize="characters" value="'+esc(joinDraft?.inviteCode||'')+'"')+field('Ton prénom','name','text','maxlength="22" required value="'+esc(joinDraft?.name||'')+'"'),'Rejoindre la table')}</section></div>
 ${load()?'<button class="casino-action" data-casino-action="resume">Reprendre mon personnage</button>':''}
 <details><summary>Reprendre sur un autre appareil</summary>${form('recover',area('Ta clé personnelle','recovery',110),'Reprendre ma partie')}</details>`}
function lobby(){const own=state.members.find(m=>m.id===state.viewer);return `<h1>Table ${esc(state.inviteCode)}</h1><button class="casino-action" data-casino-action="invite">Copier le code de la table</button><output data-casino-invite></output><p>4 à 7 personnages au casino, 3 enquêteurs et jusqu’à 2 magistrats supplémentaires. Les invités rejoignent gratuitement la table de l’hôte.</p>
 <ul class="casino-members">${state.members.map(m=>`<li><b>${esc(m.name)}</b><span>${esc(roles[m.role])}</span><span>${m.ready?'Prêt':'En préparation'}</span></li>`).join('')}</ul>
 ${form('role',`<label>Ta fonction<select name="role">${Object.entries(roles).map(([r,label])=>`<option value="${r}" ${own.role===r?'selected':''}>${label}</option>`).join('')}</select></label>`,'Choisir cette fonction')}
 <button class="casino-action" data-casino-action="ready">${own.ready?'Modifier ma préparation':'Je suis prêt'}</button>
 ${state.isHost?'<button class="casino-action" data-casino-action="start">Distribuer les personnages</button>':''}
 <p>Les personnages et les éventuelles missions d’infiltration sont attribués au lancement.</p>`}
function card(){const c=state.ownCard;return section(c.name,`<strong class="casino-role">${esc(roles[c.title]||c.title)}</strong><p>${esc(c.brief)}</p>${c.objective?`<h3>Ton objectif</h3><p>${esc(c.objective)}</p>`:''}
 ${(c.relations||[]).map(r=>`<article><h3>${esc(name(r.target))}</h3><p>${esc(r.text)}</p></article>`).join('')}
 ${state.ownUndercoverBrief?`<div class="casino-secret"><strong>Mission confidentielle</strong><p>Seul ton personnage voit cette mission. Les observations reçues par le bureau restent non confirmées tant qu'elles ne sont pas recoupées.</p>${state.chapter===1?form('intel',people('subjectId',c=>c.id!==state.viewer)+area('Renseignement à transmettre discrètement','text',1000),'Transmettre au bureau'):''}</div>`:''}
 ${state.continuityRole?'<p>Tu poursuis comme témoin de continuité : rapporte des observations publiques au bureau.</p>':''}`)+
 section('Ce qui se passe',state.publicEvents.map(e=>`<p>${esc(e.text)}</p>`).join(''))+
 section('Rencontres',(state.npcEvents||[]).map(e=>`<p><b>${esc(name(e.npcId))}</b> · ${esc(e.text)}</p>`).join('')+(state.npcMoves||[]).map(m=>button(m.label,'NPC_MOVE',{moveId:m.id})).join('')+(state.npcOffers||[]).map(o=>`<article><p>${esc(o.terms)} · ${o.price} jetons virtuels</p>${button(o.label,'ACCEPT_NPC_OFFER',{offerId:o.id})}</article>`).join(''))}
const cardLabel=c=>{const ranks=['2','3','4','5','6','7','8','9','10','V','D','R','A'],suits=['♣','♦','♥','♠'];return ranks[c%13]+suits[Math.floor(c/13)]};
function table(){const h=state.poker,turn=h?.turn===state.viewer;return section('Poker fermé · jetons virtuels',`<p>Une donne de cinq cartes, un échange, puis un tour de mises plafonnées à 20 jetons. Une seule ouverture de mise, sans relance. Aucune valeur monétaire.</p>
 ${h?`<p>Pot : <b>${h.pot}</b> · ${h.stage==='settled'?'Main terminée':'Tour de '+esc(name(h.turn))}${h.deadline?` · ${Math.max(0,Math.ceil((h.deadline-Date.now())/1000))} s restantes`:''}</p>
 <div class="casino-cards">${h.ownCards.map((c,i)=>`<label class="casino-playing-card">${esc(cardLabel(c))}${turn&&h.stage==='draw'?`<input type="checkbox" name="discard" value="${i}" aria-label="Échanger ${esc(cardLabel(c))}">`:''}</label>`).join('')}</div>
 ${turn&&h.stage==='draw'?`<p>Choisis jusqu’à ${h.maxDraw} cartes à échanger, ou garde ta main.</p><button class="casino-action" data-casino-action="draw">Confirmer ma main</button>`:''}
 ${turn&&h.stage==='bet'?(h.bets[state.viewer]===h.highestBet?button('Parole','POKER_ACTION',{action:'check'}):button('Suivre','POKER_ACTION',{action:'call'}))+button('Se coucher','POKER_ACTION',{action:'fold'})+(h.highestBet===0?form('bet',field('Mise (1 à 20)','amount','number','min="1" max="20" required'),'Miser'):''):''}
 ${h.stage==='settled'?`<p>Gagnant(s) : ${h.winners.map(id=>esc(name(id))).join(', ')}</p>${Object.entries(h.showdown).map(([id,cards])=>`<p>${esc(name(id))} · ${cards.map(cardLabel).map(esc).join(' ')}</p>`).join('')}${state.isHost&&state.chapter===1&&state.phase>=2?button('Nouvelle main collective','START_POKER'):''}`:''}`:''}`)+
 (state.camp==='casino'&&state.chapter===1&&state.phase>=2?section('Machine à sous',`<p>Trois Dragons : ×30 ; autre triple : ×8 ; paire : mise rendue ; autre tirage : 0. Mise maximale : 20 jetons.</p>${form('slot',field('Jetons à miser','wager','number','min="1" max="20" required'),'Faire tourner')}${state.ownSlotResult?`<p>${state.ownSlotResult.reels.map(esc).join(' · ')} — gain : ${state.ownSlotResult.payout}</p>`:''}`):'')}
function registry(){return section('Registre des engagements',`<p>Vous pouvez négocier oralement. Une inscription engage uniquement les signataires ; le territoire nécessite ensuite son transfert explicite.</p>
 ${(state.agreements||[]).map(a=>`<article><b>${a.visibility==='private'?'Accord confidentiel':'Accord public'}</b>${a.territoryId?`<p>Territoire concerné : ${esc(state.territories.find(t=>t.id===a.territoryId)?.name||a.territoryId)}</p>`:''}<p>${esc(a.terms)}</p><p>${a.participants.map(id=>esc(name(id))).join(', ')} · ${a.signatures.length}/${a.participants.length} signatures</p>${a.status==='pending'&&a.participants.includes(state.viewer)&&!a.signatures.includes(state.viewer)?button('Signer','SIGN_AGREEMENT',{recordId:a.id}):''}${a.status==='signed'&&a.participants.includes(state.viewer)&&!a.breachedBy.includes(state.viewer)?button('Rompre cet accord','BREAK_AGREEMENT',{recordId:a.id}):''}</article>`).join('')}
 ${state.camp==='casino'?form('agreement',`<label>Type<select name="kind">${['alliance','non_aggression','debt','territory','influence','succession','custom'].map(k=>option(k,k)).join('')}</select></label><label>Territoire concerné (si accord territorial)<select name="territoryId"><option value="">— Aucun —</option>${state.territories.map(t=>option(t.id,t.name)).join('')}</select></label><label>Visibilité<select name="visibility">${option('private','Signataires uniquement')}${option('public','Public')}</select></label><fieldset><legend>Autres signataires</legend>${state.characters.filter(c=>!c.npc&&c.id!==state.viewer).map(c=>`<label class="casino-inline"><input type="checkbox" name="participants" value="${esc(c.id)}">${esc(c.name)}</label>`).join('')}</fieldset>${area('Engagement négocié','terms')}`,'Proposer et signer'):''}`)}
function network(){return section('Réputations et positions',`<div class="casino-roster">${state.characters.map(c=>`<article><h3>${esc(c.name)} ${c.npc?'<small>PNJ</small>':''}</h3><p>${esc(statuses[c.status]||c.status)} · Réputation ${c.reputation} · Légitimité ${c.legitimacy} · Influence ${c.influence}${c.chips!==undefined?' · '+c.chips+' jetons':''}</p></article>`).join('')}</div>`)+
 section('Succession',`<p>${state.claims.map(c=>esc(name(c.id))).join(', ')||'Aucune prétention enregistrée.'}</p>${state.namedSuccessor?`<p>Nomination contestable : ${esc(name(state.namedSuccessor))}</p>`:''}${state.camp==='casino'?(state.claims.some(c=>c.id===state.viewer)?'':button('Revendiquer la succession','CLAIM_SUCCESSION'))+form('loyalty',people('to',c=>c.id!==state.viewer&&c.status==='free'),'Déclarer mon soutien')+(state.claims.some(c=>c.id===state.viewer)&&!state.splitClaim?form('split',field('Nom de la branche','name','text','maxlength="120" required'),'Fonder une branche dissidente'):'')+(state.splitClaim&&state.splitClaim.founder!==state.viewer&&!state.splitClaim.acceptedSupporters.includes(state.viewer)?button('Rejoindre la branche dissidente','JOIN_SPLIT'):'')+(state.chapter===1&&state.phase===3?form('wager',people('to',c=>!c.npc&&c.id!==state.viewer),'Engager mon droit à la succession'):''):''}
 ${Object.entries(state.successionWagers||{}).filter(([,w])=>w.to===state.viewer&&w.status==='pending').map(([from])=>button('Accepter le droit engagé par '+name(from),'ACCEPT_SUCCESSION_WAGER',{from})).join('')}`)+
 section('Territoires',(state.territories||[]).map(t=>`<article><h3>${esc(t.name)}</h3><p>Contrôle : ${esc(name(t.controller))}</p>${state.camp==='casino'?button('Revendiquer','CLAIM_TERRITORY',{territoryId:t.id}):''}${t.controller===state.viewer?form('territory',`<input type="hidden" name="territoryId" value="${esc(t.id)}">${people('to',c=>!c.npc&&c.id!==state.viewer)}<label>Accord signé<select name="agreementId">${state.agreements.filter(a=>a.kind==='territory'&&a.status==='signed').map(a=>option(a.id,a.terms)).join('')}</select></label>`,'Transférer selon l’accord'):''}</article>`).join(''))+
 (state.camp==='casino'?section('Négocier',form('transfer',people('to',c=>!c.npc&&c.id!==state.viewer)+field('Jetons à transmettre','amount','number','min="1" required'),'Transmettre les jetons')+form('npc',people('npcId',c=>c.npc)+area('Ta demande au personnage','text',700),'Prendre contact')):'')}
function evidencePicker(){return `<fieldset><legend>Sources à joindre</legend>${(state.evidence||[]).map(e=>`<label class="casino-inline" data-casino-proof-label><input type="checkbox" name="evidenceIds" value="${esc(e.id)}" data-subject="${esc(e.subjectId)}" data-offence="${esc(e.offence)}">${esc(name(e.subjectId))} · ${esc(e.description)}</label>`).join('')}</fieldset>`}
const offencePicker=field=>`<label>Infraction fondée sur les preuves<select name="${esc(field)}" data-casino-offence data-casino-draft required>${[...new Set((state.evidence||[]).map(e=>e.offence))].map(id=>option(id,id)).join('')}</select></label>`;
function bureau(){return section('Bureau d’enquête',`<p>Les déclarations restent distinctes des pièces corroborées. Une arrestation n’équivaut pas à une condamnation.</p>
 ${(state.dossiers||[]).map(d=>`<article><h3>${esc(name(d.subjectId))} · ${esc(d.title)}</h3><p>${esc(d.context)}</p></article>`).join('')}
 ${(state.intel||[]).map(i=>`<p>Observation concernant <b>${esc(name(i.subjectId))}</b> : ${esc(i.text)} — ${i.reviewedBy?(i.checked?'Recoupement concordant':'Vérification non concluante'):'Non vérifiée'}</p>`).join('')}
 ${['analyst','investigator'].includes(state.role)?(state.intel||[]).filter(i=>!i.reviewedBy).map(i=>form('review-intel','<input type="hidden" name="reportId" value="'+esc(i.id)+'"><label>Résultat<select name="confirmed">'+option('false','Non corroboré')+option('true','Concordance documentaire')+'</select></label><fieldset><legend>Pièces consultées</legend>'+(state.evidence||[]).filter(e=>e.subjectId===i.subjectId).map(e=>'<label class="casino-inline"><input type="checkbox" name="evidenceIds" value="'+esc(e.id)+'">'+esc(e.description)+'</label>').join('')+'</fieldset>'+area('Motivation','reasoning',500),'Vérifier le renseignement : '+name(i.subjectId))).join(''):''}
 ${(state.evidence||[]).map(e=>`<article><h3>${esc(name(e.subjectId))}</h3><p>${esc(e.description)}</p><small>${esc(e.offence)} · source ${esc(e.sourceId)}</small></article>`).join('')}
 ${state.role==='agent'?(state.agentPuzzles||[]).map(q=>form('deduction',`<p>${esc(q.question)}</p><label>Ta déduction<select name="answer">${q.options.map(o=>option(o.id,o.label)).join('')}</select></label>`,'Valider ma déduction')).join('')+(state.chapter===1&&state.phase===3?button('Localiser la salle','LOCATE_ROOM'):'')+(state.fallbackHint?`<p>${esc(state.fallbackHint)}</p>`:''):''}
 ${['investigator','prosecutor'].includes(state.role)&&state.chapter>=2?form('interpellation',people('subjectId')+offencePicker('allegedOffence')+area('Motivation personnelle de la demande','reasoning',700)+evidencePicker(),'Demander une interpellation'):''}
 ${(state.requests||[]).map(r=>`<article><p>Demande : ${esc(name(r.subjectId))} · ${esc(r.reasoning)}</p>${state.role==='agent'&&!r.executed?button('Procéder personnellement à l’interpellation','INTERPELLATE',{requestId:r.id}):''}</article>`).join('')}
 ${['analyst','investigator'].includes(state.role)?form('map',people('subject')+people('target')+field('Relation étayée','relation','text','maxlength="100" required')+offencePicker('offence')+evidencePicker(),'Inscrire au schéma criminel'):''}
 ${(state.organigram||[]).map(e=>`<p>${esc(name(e.subject))} → ${esc(e.relation)} → ${esc(name(e.target))}</p>`).join('')}
 ${['investigator','prosecutor'].includes(state.role)&&state.chapter>=2?form('hearing',people('subjectId')+offencePicker('offence')+area('Accusation à discuter','accusation')+evidencePicker(),'Ouvrir une audition contradictoire'):''}
 ${form('note',`<label>Tes notes privées<textarea name="text" maxlength="3000" data-casino-draft>${esc(state.ownNote)}</textarea></label>`,'Enregistrer mes notes')}`)}
function setupEvidenceForm(f){
 const suspect=f.querySelector('select[name="subjectId"],select[name="subject"]'),offence=f.querySelector('[data-casino-offence]');
 if(!suspect||!offence)return;
 const update=()=>{
  const records=(state.evidence||[]).filter(e=>e.subjectId===suspect.value),valid=new Set();
  for(const name of new Set(records.map(e=>e.offence))){
   if(new Set(records.filter(e=>e.offence===name).map(e=>e.independenceGroup||e.sourceId)).size>=2)valid.add(name);
  }
  for(const opt of offence.options)opt.disabled=!valid.has(opt.value);
  if(!valid.has(offence.value))offence.value=[...valid][0]||'';
  for(const input of f.querySelectorAll('input[name="evidenceIds"]')){
   const relevant=input.dataset.subject===suspect.value&&input.dataset.offence===offence.value;
   input.disabled=!relevant;if(!relevant)input.checked=false;
   input.closest('[data-casino-proof-label]').hidden=!relevant;
  }
  let notice=f.querySelector('[data-casino-proof-notice]');
  if(!notice){notice=document.createElement('p');notice.dataset.casinoProofNotice='';f.querySelector('fieldset')?.insertAdjacentElement('beforebegin',notice)}
  if(notice)notice.textContent=valid.size?'Choisis au moins deux sources indépendantes pour cette infraction.':'Aucune infraction suffisamment recoupée pour ce personnage à cette phase.';
 };
 f.addEventListener('change',event=>{if(event.target===suspect||event.target===offence)update()});update();
}
function justice(){return section(state.camp==='casino'?'Messages et espace Prison':'Auditions et messages',`
 ${(state.messages||[]).map(m=>`<article><b>${esc(name(m.from))}</b><p>${esc(m.text)}</p><small>Déclaration à vérifier</small></article>`).join('')}
 ${state.camp==='casino'?form('message',`<label>Destination<select name="to">${option('bureau','Bureau d’enquête')}${state.characters.filter(c=>!c.npc&&c.id!==state.viewer).map(c=>option(c.id,c.name)).join('')}</select></label><label>Démarche<select name="kind">${[['contact','Prendre contact'],['cooperate','Coopérer / dénoncer'],['allies','Négocier avec un allié'],['appeal','Contester ma détention'],['witness','Témoigner après un changement de fonction']].map(([id,label])=>option(id,label)).join('')}</select></label>${area('Ton message','text',700)}`,'Transmettre'):
 form('bureau-message',people('to',c=>!c.npc)+area('Message au personnage','text',700),'Transmettre')}
 ${(state.hearings||[]).map(h=>`<article><h3>Audition de ${esc(name(h.subjectId))}</h3><p>${esc(h.accusation)}</p><p>Défense : ${esc(h.defence||'En attente')}</p>${h.subjectId===state.viewer?form('defence',`<input type="hidden" name="hearingId" value="${esc(h.id)}">${area('Ta défense','text',2000)}`,'Enregistrer ma défense'):''}${state.role==='judge'?form('ruling',`<input type="hidden" name="hearingId" value="${esc(h.id)}"><label>Décision<select name="decision">${option('acquit','Acquitter')}${option('convict','Condamner')}${option('release','Libérer')}</select></label>${area('Motivation','reasoning',1500)}`,'Prononcer la décision')+form('detain',`<input type="hidden" name="subjectId" value="${esc(h.subjectId)}">${area('Base de la mesure provisoire','judicialBasis',700)}`,'Autoriser une détention'):''}</article>`).join('')}
 ${(state.rulings||[]).map(r=>`<p>${esc(name(r.subjectId))} · ${esc(r.decision)} · ${esc(r.reasoning)}</p>`).join('')}`)+
 section('Négociations confidentielles',(state.camp==='casino'?form('corruption',`<label>Destinataire<select name="to">${state.bureauRecipients?.map(m=>option(m.id,m.name)).join('')||''}</select></label>${field('Jetons engagés','amount','number','min="1" required')}${area('Ce que tu proposes','terms')}`,'Faire une offre personnelle'):'')+
 (state.corruption||[]).map(o=>`<article><p>${esc(o.terms)} · ${o.amount} jetons</p>${o.to===state.viewer&&o.status==='offered'?button('Refuser','ANSWER_CORRUPTION',{offerId:o.id,accept:false})+button('Accepter et en assumer les conséquences','ANSWER_CORRUPTION',{offerId:o.id,accept:true}):esc(o.status)}${!o.disclosed&&[o.from,o.to].includes(state.viewer)?button('Signaler cette offre','DISCLOSE_CORRUPTION',{offerId:o.id}):''}</article>`).join(''))}
function finale(){const f=state.finale;return section('Le dénouement',`<p>${esc(({split:'Yonghe se scinde.',recognised_claim:'Une prétention rassemble soutiens et territoires.',dragon_retained:'Le Vieux Dragon se maintient.',collapse:'Aucune autorité durable ne s’impose.'})[f.political])}</p>${f.successor?`<p>Successeur reconnu : ${esc(name(f.successor))}</p>`:''}${f.personalOutcome?`<article><h3>Ton bilan personnel</h3>${f.personalOutcome.role?`<p>Fonction : ${esc(roles[f.personalOutcome.role]||f.personalOutcome.role)} · Renseignements examinés : ${f.personalOutcome.verifiedReports} · Relations documentées : ${f.personalOutcome.mappedRelations} · Auditions : ${f.personalOutcome.totalHearings} · Décisions : ${f.personalOutcome.rulings}</p>`:`<p>${f.personalOutcome.successor?'Tu es le successeur reconnu.':f.personalOutcome.claimant?'Tu as revendiqué le pouvoir sans être reconnu comme successeur.':'Tu n’as pas été reconnu comme successeur.'}</p><p>Position finale : ${esc(statuses[f.personalOutcome.status]||f.personalOutcome.status)} · Réputation ${f.personalOutcome.reputation} · Légitimité ${f.personalOutcome.legitimacy} · Influence ${f.personalOutcome.influence}</p><p>Alliés indépendants : ${f.personalOutcome.allies} · Territoires : ${f.personalOutcome.territories} · Jetons : ${f.personalOutcome.chips}${f.personalOutcome.dissident?' · Participant à une dissidence':''}</p>`}</article>`:''}${f.judicial.map(r=>`<p>${esc(name(r.subjectId))} · ${esc(r.decision)} · ${esc(r.reasoning)}</p>`).join('')}${(f.organigram||[]).map(e=>`<p>${esc(name(e.subject))} → ${esc(e.relation)} → ${esc(name(e.target))} · ${e.corroborated?'confirmé':'non confirmé'}</p>`).join('')}`)}
function render(){if(!active)return;const root=$('#app');if(!root)return;
 const drafts=Array.from(root.querySelectorAll('[data-casino-draft]')).map(e=>({name:e.name,form:e.closest('form')?.dataset.casinoForm,value:e.value}));
 const toggles=$('form input[type=checkbox]',root).map(e=>({name:e.name,form:e.closest('form')?.dataset.casinoForm,value:e.value,checked:e.checked}));
 const focus=document.activeElement,focused=focus?.name?{name:focus.name,form:focus.closest('form')?.dataset.casinoForm,start:focus.selectionStart,end:focus.selectionEnd}:null;
 const tabs=state&&state.status!=='lobby'?[['card','Ma fiche'],['table','Jeux'],['registry','Registre'],['network','Réseaux'],...(state.camp==='bureau'?[['bureau','Enquête']]:[]),['justice',state.camp==='casino'?'Prison / contacts':'Auditions']]:[];
 const body=!state?welcome():state.status==='lobby'?lobby():state.status==='finished'?finale():`<div class="casino-tabs" role="tablist">${tabs.map(([id,label])=>`<button type="button" role="tab" aria-selected="${tab===id}" data-casino-tab="${id}">${label}</button>`).join('')}</div>${({card,table,registry,network,bureau,justice}[tab]||card)()}`;
 root.innerHTML=`<main class="casino-page casino-live" id="${ROOT}"><header class="casino-live-top"><button class="casino-action" data-casino-action="close">← CASINO</button><span>HÉRITAGE · CASINO${state?.chapter?' · '+state.chapter+'/'+state.phase:''}</span><span data-casino-connection role="status"></span></header>
 ${state?.phaseTitle?`<h1>${esc(state.phaseTitle)}</h1><p>${esc(state.name)} · ${state.camp==='bureau'?'Bureau d’enquête':'Casino'}</p>`:''}
 ${problem?`<p class="casino-error" role="alert">${esc(message(problem))}</p>`:''}${pending&&!busy?'<button class="casino-action" data-casino-action="retry">Réessayer la même action</button>':''}
 <fieldset class="casino-content" ${busy||pending?'disabled':''}>${body}</fieldset>
 ${state?.isHost&&state.status==='playing'?`<section class="casino-phase-controls">${state.hostCanLocate?button('Poursuivre via une voie de secours','HOST_AUTHORIZE_CONTINUITY'):''}${state.hostCanCloseCourt?button('Clore les audiences en attente après délai','HOST_COURT_CONTINUITY'):''}${state.hostCanCloseDefence?(state.hostPendingHearings||[]).map(h=>button('Audience en attente : '+name(h.subjectId),'HOST_CLOSE_ABSENT_HEARING',{hearingId:h.id})).join(''):''}${advanceConfirm?'<p class="casino-phase-warning" role="status">Confirmer mettra fin aux échanges de cette phase pour tous les joueurs. Vérifie que les participants ont terminé leurs actions.</p>':''}${button(advanceConfirm?(state.chapter===3&&state.phase===2?'Confirmer la clôture':'Confirmer le passage'):(state.chapter===3&&state.phase===2?'Clore la campagne':'Passer à la phase suivante'),state.chapter===3&&state.phase===2?'FINISH_CAMPAIGN':'ADVANCE_PHASE')}${advanceConfirm?'<button type="button" class="casino-action" data-casino-action="cancel-advance">Annuler</button>':''}</section>`:''}
 ${state?'<details class="casino-recovery"><summary>Ma clé de reprise personnelle</summary><p>Cette clé ouvre ton personnage sur un autre appareil. Garde-la pour toi et conserve-la avant de changer de table.</p><button class="casino-action" data-casino-action="copy">Copier ma clé personnelle</button><output data-casino-key></output></details><button class="casino-action" data-casino-action="switch" '+(busy||pending?'disabled':'')+'>'+(state.status==='finished'?'Nouvelle partie':'Changer de table')+'</button>':''}</main>`;
 for(const d of drafts){const el=$('[data-casino-draft]',root).find(e=>e.name===d.name&&e.closest('form')?.dataset.casinoForm===d.form);if(el)el.value=d.value}
 for(const item of toggles){const el=$('form input[type=checkbox]',root).find(e=>e.name===item.name&&e.value===item.value&&e.closest('form')?.dataset.casinoForm===item.form);if(el)el.checked=item.checked}
 if(focused){const el=$$('[data-casino-draft]',root).find(e=>e.name===focused.name&&e.closest('form')?.dataset.casinoForm===focused.form);if(el){el.focus({preventScroll:true});if(el.setSelectionRange&&typeof focused.start==='number')try{el.setSelectionRange(focused.start,focused.end)}catch{}}}
 for(const f of root.querySelectorAll('form[data-casino-form="interpellation"],form[data-casino-form="map"],form[data-casino-form="hearing"]'))setupEvidenceForm(f);
 connection();
}
async function open(entry){active=true;generation++;state=null;tab='card';busy=false;polling=null;advanceConfirm=false;joinDraft=entry?.fresh?entry:null;credentials=entry?.fresh?null:load();problem='';pending=null;syncedAt=0;render();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden)sync()},1200);if(credentials)await sync()}
function close(){active=false;generation++;clearInterval(timer);timer=null;state=null;pending=null;busy=false;polling=null;window.IGR_CASINO_HERITAGE?.open()}
document.addEventListener('click',async event=>{
 const legacy=event.target.closest?.('button[onclick*="joinRoom("]');
 if(legacy&&/^C[A-Z2-9]{9}$/.test($('#joinCode')?.value.trim().toUpperCase()||'')){
  event.preventDefault();event.stopImmediatePropagation();return open({fresh:true,inviteCode:$('#joinCode').value.trim().toUpperCase(),name:$('#joinPseudo')?.value.trim()||''});
 }
 const el=event.target.closest?.('[data-casino-action],[data-casino-command],[data-casino-tab],[data-casino-live]');if(!el)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(el.hasAttribute('data-casino-live'))return open(el.hasAttribute('data-casino-join')?{fresh:true,inviteCode:$('#joinCode')?.value.trim().toUpperCase()||'',name:$('#joinPseudo')?.value.trim()||''}:undefined);if(!active)return;
 if(el.dataset.casinoTab){tab=el.dataset.casinoTab;render();return}
 if(el.dataset.casinoCommand){if(!busy&&!pending){
   if(['ADVANCE_PHASE','FINISH_CAMPAIGN'].includes(el.dataset.casinoCommand)&&!advanceConfirm){advanceConfirm=true;render();return}
   advanceConfirm=false;await mutate({op:'command',type:el.dataset.casinoCommand,payload:JSON.parse(el.dataset.payload||'{}')})
  }return}
 switch(el.dataset.casinoAction){
  case 'close':close();break;case 'cancel-advance':advanceConfirm=false;render();break;case 'resume':credentials=load();await sync();break;case 'retry':await mutate({},true);break;
  case 'switch':if(busy||pending)break;generation++;state=null;credentials=null;joinDraft=null;problem='';tab='card';render();break;
  case 'ready':await mutate({op:'ready',ready:!state.members.find(m=>m.id===state.viewer).ready});break;
  case 'start':await mutate({op:'start'});break;
  case 'draw':await mutate({op:'command',type:'POKER_ACTION',payload:{action:'draw',discard:$$('input[name="discard"]:checked').map(e=>Number(e.value))}});break;
  case 'invite':{try{await navigator.clipboard.writeText(state.inviteCode);$('[data-casino-invite]').textContent='Code copié.'}catch{$('[data-casino-invite]').textContent=state.inviteCode}break}
  case 'copy':{const key=credentials.roomId+':'+credentials.sessionToken;try{await navigator.clipboard.writeText(key);$('[data-casino-key]').textContent='Clé copiée.'}catch{$('[data-casino-key]').textContent=key}break}
 }
},true);
document.addEventListener('submit',async event=>{
 const f=event.target.closest?.('[data-casino-form]');if(!f||!active)return;event.preventDefault();event.stopImmediatePropagation();if(busy||pending)return;
 const data=new FormData(f),p=Object.fromEntries(data),kind=f.dataset.casinoForm;
 if(kind==='create'){
  let profile;try{profile=JSON.parse(localStorage.getItem('igr_social_identity_v1')||'null')}catch{}
  if(!profile?.id||!profile?.token){problem='Un profil possédant l’accès Héritage est nécessaire pour créer la table.';render();return}
  await mutate({op:'create',roomId:crypto.randomUUID(),sessionToken:freshToken(),name:p.name,profileId:profile.id,profileToken:profile.token});return;
 }
 if(kind==='join'){await mutate({op:'join',roomId:undefined,sessionToken:freshToken(),inviteCode:p.inviteCode.trim().toUpperCase(),name:p.name});return}
 if(kind==='recover'){
  const [roomId,sessionToken]=p.recovery.trim().split(':');if(!/^[0-9a-f-]{36}$/.test(roomId)||!/^[a-f0-9]{64}$/.test(sessionToken)){problem='Clé de reprise invalide.';render();return}
  generation++;state=null;credentials={roomId,sessionToken};save();await sync();return;
 }
 if(kind==='role'){await mutate({op:'role',role:p.role});return}
 const commands={'review-intel':'REVIEW_INTEL',intel:'REPORT_INTEL',bet:'POKER_ACTION',slot:'SLOT_SPIN',agreement:'PROPOSE_AGREEMENT',loyalty:'PLEDGE_LOYALTY',split:'SPLIT_FACTION',wager:'PLEDGE_SUCCESSION',territory:'TRANSFER_TERRITORY',transfer:'TRANSFER_CHIPS',npc:'ASK_NPC',deduction:'AGENT_DECISION',interpellation:'REQUEST_INTERPELLATION',map:'MAP_RELATION',hearing:'OPEN_HEARING',note:'NOTE',message:'MESSAGE','bureau-message':'BUREAU_MESSAGE',defence:'DEFENCE',ruling:'RULING',detain:'DETAIN',corruption:'OFFER_CORRUPTION'};
 if(kind==='agreement'){p.recordId=crypto.randomUUID();p.participants=[state.viewer,...data.getAll('participants')]}
 if(['interpellation','map','hearing','review-intel'].includes(kind))p.evidenceIds=data.getAll('evidenceIds');if(kind==='review-intel')p.confirmed=p.confirmed==='true';
 if(kind==='bet')p.action='bet';for(const k of ['amount','wager'])if(k in p)p[k]=Number(p[k]);
 await mutate({op:'command',type:commands[kind],payload:p});
},true);
window.addEventListener('online',()=>{if(active)sync()});window.addEventListener('pageshow',()=>{if(active)sync()});document.addEventListener('visibilitychange',()=>{if(active&&!document.hidden)sync()});
window.IGR_CASINO_CLIENT=Object.freeze({version:'105.4',open,close,sync});
})();
