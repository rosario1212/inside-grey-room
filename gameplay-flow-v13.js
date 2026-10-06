(()=>{
'use strict';
const CFG=window.IGR_V13_FLOW;
if(!CFG){console.warn('[IGR v13] scenario-flow-v13.js manquant');return}
const V='13.0-flow-candidate';
const base={
 phaseLabel:window.phaseLabel,
 phaseInstruction:window.phaseInstruction,
 renderInvestigationTab:window.renderInvestigationTab,
 renderInterrogationSelect:window.renderInterrogationSelect,
 renderDebriefForm:window.renderDebriefForm,
 submitDebrief:window.submitDebrief,
 privateCardHtml:window.privateCardHtml,
 phaseTimerControl:window.phaseTimerControl,
 phaseCanAdvance:window.phaseCanAdvance
};
function core(){const id=window.STATE?.sync?.room?.scenario_id||window.STATE?.scenarioId;return CFG.coreScenarioIds.includes(String(id||''))}
function role(){return window.STATE?.sync?.player?.public_role||window.STATE?.role||''}
function room(){return window.STATE?.sync?.room||null}
function esc(x){return typeof window.h==='function'?window.h(String(x??'')):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function playerById(id){return (window.STATE?.sync?.players||[]).find(p=>p.id===id)}
function isParticipant(){const ids=room()?.state?.event_participants||[];return ids.includes(window.STATE?.playerId)}
function isEventTarget(){const ids=room()?.state?.event_targets||[];return ids.includes(window.STATE?.playerId)}
function eventSlotsText(){const st=room()?.state||{},used=+st.event_slots_used||0,total=+st.event_slots_total||0;return total?`${Math.min(used,total)}/${total}`:''}

window.phaseLabel=phaseLabel=function(ph){
 if(!core())return base.phaseLabel?base.phaseLabel(ph):(ph||'PARTIE').toUpperCase();
 const m={
  initial_debrief:'PRÉ-ENQUÊTE',cycle_debrief:'DÉBRIEF · 2 MIN',event_select:'CHOIX DE L’ÉVÉNEMENT',
  event_confrontation:'CONFRONTATION',event_assembly:'ASSEMBLÉE',event_negociation:'NÉGOCIATION',event_requete:'REQUÊTE',event_saisine:'SAISINE',event_enquete_croisee:'ENQUÊTE CROISÉE'
 };
 return m[ph]||(base.phaseLabel?base.phaseLabel(ph):(ph||'PARTIE').toUpperCase());
};

function preInvestigationCopy(r){
 if(['enqueteur','analyste'].includes(r))return `<div class="v13-preinvestigation"><div class="v13-cold-banner"><strong>03:00</strong>${r==='analyste'?'Gère le rythme. Prépare les contradictions à surveiller.':'Prépare la première convocation. Tu décideras qui entre.'}</div><p>Aucune convocation avant 00:00. Parlez uniquement de ce que le dossier vous permet déjà de savoir.</p></div>`;
 if(r==='suspect')return `<div class="v13-preinvestigation"><div class="v13-cold-banner"><strong>SALLE D’ATTENTE</strong>Vous pouvez parler librement.</div><p>Vous pouvez vous connaître déjà ou vous découvrir ici. Utilise uniquement les relations et faits de ta carte. Tu peux mentir à l’oral. Tu n’inventes jamais une preuve.</p><div class="v13-social-note">La partie a commencé. Observe qui parle avec qui, ce qui est évité et ce que chacun cherche à protéger.</div></div>`;
 if(r==='maitre')return `<div class="v13-preinvestigation"><div class="v13-cold-banner"><strong>AVOCAT</strong>La pré-enquête a commencé.</div><p>Si le scénario le permet, rejoins ton ou tes clients en Salle d’attente. Écoute avant de conseiller. L’application ne vous dicte pas la conversation.</p></div>`;
 const copy={juge:'Rejoins ton cabinet. Lis ce qui t’est accessible. Tu restes propre en apparence, quelles que soient tes instructions privées.',procureur:'Rejoins ton bureau. Prépare ta lecture du dossier et les responsabilités que tu pourras soutenir.',expert:'Prépare ton cadre technique. Tu peux observer plus tard si le scénario l’autorise, sans intervenir spontanément.',inspecteur:'Prépare ton travail de terrain. Tu pourras circuler quand le dossier l’autorise.',journaliste:'Observe déjà les relations et les déplacements. Ta première matière est humaine.',temoin:'Prépare exactement ce que tu sais. N’ajoute rien à ce que tu n’as pas vu.'};
 return `<div class="v13-preinvestigation"><div class="v13-cold-banner"><strong>${esc(r.toUpperCase())}</strong>${esc(copy[r]||'Prends ta place. La partie a déjà commencé.')}</div></div>`;
}

window.phaseInstruction=phaseInstruction=function(r,ph,target){
 if(!core())return base.phaseInstruction?base.phaseInstruction(r,ph,target):'<p>Partie synchronisée.</p>';
 if(ph==='initial_debrief')return preInvestigationCopy(r);
 if(ph==='interrogation_select'){
  const st=room()?.state||{},left=Math.max(0,(+st.interrogation_limit||0)-(+st.interrogation_count||0));
  return r==='enqueteur'?`<p><b>CONVOQUER.</b> Il reste ${left} fenêtre${left>1?'s':''} d’interrogatoire dans ce cycle. Tu choisis qui entre. L’Analyste gère le rythme s’il est présent.</p>`:`<p>L’Enquêteur choisit la prochaine convocation. La Salle d’attente reste libre pendant ce temps.</p>`;
 }
 if(ph==='interrogation'){
  if(r==='enqueteur')return `<p>Conduis l’interrogatoire. <b>08:00 signifie 08:00.</b> Aucun arrêt anticipé.</p>`;
  if(r==='analyste')return `<p>Gère le temps. Observe les contradictions. L’Enquêteur reste concentré sur la personne en face.</p>`;
  if(target?.id===window.STATE?.playerId)return `<p>Tu es dans la Grey Room. Sauve ta peau. Tu peux mentir, minimiser ou accuser. Tu n’inventes aucune preuve.</p>`;
  if(r==='expert')return `<p>Si tu as été admis comme observateur, reste silencieux. Tu n’interviens que lorsqu’une expertise t’est formellement demandée.</p>`;
  return `<p>Un interrogatoire est en cours. Les échanges libres continuent hors de la Grey Room.</p>`;
 }
 if(ph==='cycle_debrief')return ['enqueteur','analyste'].includes(r)?`<p>Deux questions. Réponds séparément. Le chrono reste ouvert jusqu’à 00:00, même si les réponses sont déjà envoyées.</p>`:`<p>Le noyau d’enquête dispose de 02:00. Continue ton jeu humain si ton espace le permet.</p>`;
 if(ph==='event_select')return r==='enqueteur'?`<p>Choisis le prochain événement. Le scénario et les rôles présents limitent les options. ${eventSlotsText()?`Progression : ${eventSlotsText()}.`:''}</p>`:`<p>L’Enquêteur compose la suite du cycle. Reste dans ton espace de jeu jusqu’à une convocation éventuelle.</p>`;
 if(ph==='event_confrontation')return isEventTarget()?`<p><b>CONFRONTATION.</b> Tu es convoqué dans la Grey Room. Trois minutes. Aucun écran ne remplace l’échange.</p>`:`<p>Une confrontation est en cours dans la Grey Room.</p>`;
 if(ph==='event_assembly')return isParticipant()?`<p><b>ASSEMBLÉE.</b> Tu es admis. Expose uniquement ce qui sert la décision collective.</p>`:`<p>Une Assemblée est en cours. Tu n’y es pas admis.</p>`;
 if(ph==='event_negociation')return isParticipant()?`<p><b>NÉGOCIATION.</b> Avocat et Procureur parlent. L’application ne négocie pas à leur place.</p>`:`<p>Une négociation se déroule hors de toi.</p>`;
 if(ph==='event_requete')return isParticipant()?`<p><b>REQUÊTE.</b> L’Avocat saisit le Juge. Le Juge tranche à partir des faits et de ses instructions privées.</p>`:`<p>Une requête est examinée.</p>`;
 if(ph==='event_saisine')return isParticipant()?`<p><b>SAISINE.</b> Le Procureur demande une décision au Juge.</p>`:`<p>Une saisine est examinée.</p>`;
 if(ph==='event_enquete_croisee')return isParticipant()?`<p><b>ENQUÊTE CROISÉE.</b> Inspecteur et Journaliste travaillent sur la même piste. Ils peuvent collaborer sans se faire automatiquement confiance.</p>`:`<p>Une enquête croisée est en cours.</p>`;
 return base.phaseInstruction?base.phaseInstruction(r,ph,target):'<p>Partie synchronisée par le serveur.</p>';
};

window.renderInterrogationSelect=renderInterrogationSelect=function(){
 if(!core())return base.renderInterrogationSelect?base.renderInterrogationSelect():'';
 const d=STATE.sync,st=d.room.state||{},heard=st.heard||[],limit=+st.interrogation_limit||0,count=+st.interrogation_count||0,left=Math.max(0,limit-count);
 const remaining=d.suspects.filter(s=>!heard.includes(s.id));
 return `<div class="action-section"><h3>CONVOQUER</h3><p class="choice-helper">${left} fenêtre${left>1?'s':''} restante${left>1?'s':''}. L’ordre est ton choix. La responsabilité réelle n’est jamais déduite de cet écran.</p>${left&&remaining.length?remaining.map(s=>`<button class="choice-row" onclick="startInterrogation('${s.id}')"><span>${esc(s.pseudo)}</span><b>Convoquer · 8 min</b></button>`).join(''):`<div class="locked-state">Aucune autre convocation dans ce cycle.</div>`}</div>`;
};

window.renderDebriefForm=renderDebriefForm=function(){
 if(!core())return base.renderDebriefForm?base.renderDebriefForm():'';
 if(typeof myAction==='function'&&myAction('debrief'))return `<div class="locked-state">Réponses enregistrées. Le débrief reste ouvert jusqu’à 00:00.</div>`;
 return `<div class="qcm-v11"><div class="field"><label for="qConvergence">1 · Vous vous rapprochez d’une conclusion ?</label><select id="qConvergence"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div><div class="field"><label for="qConfusion">2 · Le dossier reste difficile à relier ?</label><select id="qConfusion"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div><button class="btn primary block" onclick="submitDebrief()">Transmettre au MJ</button></div>`;
};
window.submitDebrief=submitDebrief=async function(){
 if(!core())return base.submitDebrief?base.submitDebrief():undefined;
 try{await rpc('igr_v4_submit_debrief',{p_code:STATE.room,p_player_token:STATE.token,p_convergence:+byId('qConvergence').value,p_confusion:+byId('qConfusion').value,p_axis:''});await syncNow(true)}catch(e){console.error(e);toast('Réponse déjà envoyée ou phase terminée.')}
};

function eventOption(key){return (room()?.state?.event_options||[]).find(x=>x.key===key)}
function optionButton(o){return `<button class="btn v13-event-btn" onclick="igr13StartEvent('${esc(o.key)}')"><b>${esc(o.label||CFG.eventLabels[o.key]||o.key)}</b><small>${esc(o.hint||'Événement annexe')}</small></button>`}
function suspectOptions(exclude){return (STATE.sync?.suspects||[]).filter(x=>x.id!==exclude).map(x=>`<option value="${esc(x.id)}">${esc(x.pseudo)}</option>`).join('')}
function renderConfrontationPicker(o){const ss=STATE.sync?.suspects||[];if(ss.length<2)return'';return `<div class="v13-target-picker"><b>${esc(o.label||'CONFRONTATION')}</b><select id="v13ConfrontA">${suspectOptions()}</select><select id="v13ConfrontB">${suspectOptions(ss[0]?.id)}</select><button class="btn primary" onclick="igr13StartConfrontation()">Convoquer les deux joueurs · 3 min</button></div>`}
function renderInterrogationEvent(o){return `<div class="v13-target-picker"><b>${esc(o.label||'INTERROGATOIRE')}</b><select id="v13EventInterTarget">${suspectOptions()}</select><button class="btn primary" onclick="igr13StartEventInterrogation()">Convoquer · 8 min</button></div>`}
function assemblyEligible(){return (STATE.sync?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role))}
function renderAssembly(o){if(+room()?.cycle<3)return optionButton(o);const people=assemblyEligible();return `<div class="v13-target-picker"><b>ASSEMBLÉE FINALE</b><p class="choice-helper">Cycle 3 : l’Enquêteur peut restreindre l’accès. L’Analyste reste requis s’il existe.</p><div class="v13-assembly-list">${people.map(p=>`<label class="v13-assembly-person"><input type="checkbox" data-v13-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" onclick="igr13StartAssembly()">Ouvrir l’Assemblée · 3 min</button></div>`}
function renderEventSelect(){
 const opts=room()?.state?.event_options||[];
 if(!opts.length)return `<div class="locked-state">Aucun événement compatible. Le serveur doit recalculer les options.</div>`;
 let special='',buttons=[];
 for(const o of opts){if(o.key==='confrontation')special+=renderConfrontationPicker(o);else if(o.key==='interrogation')special+=renderInterrogationEvent(o);else if(o.key==='assembly')special+=renderAssembly(o);else buttons.push(optionButton(o))}
 return `<div class="v13-event-panel"><div class="v13-cold-banner"><strong>ÉVÉNEMENTS</strong>${eventSlotsText()} utilisés. Le téléphone choisit la scène ; les joueurs la jouent.</div>${buttons.length?`<div class="v13-event-grid">${buttons.join('')}</div>`:''}${special}</div>`;
}
window.igr13StartEvent=async function(key,targets=[]){try{await rpc('igr_v13_start_event',{p_code:STATE.room,p_player_token:STATE.token,p_event:key,p_targets:targets});await syncNow(true)}catch(e){console.error(e);toast(e?.message||'Événement impossible.')}};
window.igr13StartConfrontation=function(){const a=byId('v13ConfrontA')?.value,b=byId('v13ConfrontB')?.value;if(!a||!b||a===b){toast('Choisis deux personnes différentes.');return}return window.igr13StartEvent('confrontation',[a,b])};
window.igr13StartEventInterrogation=function(){const t=byId('v13EventInterTarget')?.value;if(!t)return;return window.igr13StartEvent('interrogation',[t])};
window.igr13StartAssembly=function(){const ids=[...document.querySelectorAll('[data-v13-assembly]:checked')].map(x=>x.value);return window.igr13StartEvent('assembly',ids)};

function renderJournalistInvestigation(){
 if(role()!=='journaliste')return'';
 const done=typeof myAction==='function'?myAction('journalist_investigation'):null;
 if(done){const lead=done.payload?.lead||{};return `<div class="action-section"><h3>ENQUÊTE JOURNALISTIQUE</h3><div class="v13-cold-banner"><strong>${esc(lead.title||'RÉSULTAT')}</strong>${esc(lead.text||'Aucun élément supplémentaire vérifiable.')}</div></div>`}
 const targets=(STATE.sync?.players||[]).filter(p=>p.id!==STATE.playerId);
 return `<div class="action-section"><h3>ENQUÊTER SUR UNE PERSONNE</h3><p class="choice-helper">Le résultat reste canonique et incomplet. Il ne révèle jamais directement un objectif privé.</p><select id="v13JournalTarget">${targets.map(p=>`<option value="${esc(p.id)}">${esc(p.pseudo)} · ${esc(p.public_role)}</option>`).join('')}</select><select id="v13JournalAngle"><option value="relations">Relations</option><option value="interets">Intérêts</option><option value="incoherences">Incohérences</option><option value="passe">Passé</option><option value="contacts">Contacts</option><option value="conflit">Conflit d’intérêts</option></select><button class="btn primary block" onclick="igr13JournalistInvestigate()">Enquêter</button></div>`;
}
window.igr13JournalistInvestigate=async function(){try{const res=await rpc('igr_v13_journalist_investigate',{p_code:STATE.room,p_player_token:STATE.token,p_target:byId('v13JournalTarget').value,p_angle:byId('v13JournalAngle').value});if(res?.lead?.title)toast(res.lead.title);await syncNow(true)}catch(e){console.error(e);toast(e?.message||'Enquête impossible.')}};

function renderJudicialOutcome(ph,r){
 const allowed=(ph==='event_negociation'&&r==='procureur')||(['event_requete','event_saisine'].includes(ph)&&r==='juge');if(!allowed)return'';
 const done=(STATE.sync?.my_actions||[]).find(a=>a.cycle===room()?.cycle&&a.action_type===`v13_outcome_${ph}`);if(done)return `<div class="locked-state">Décision enregistrée : ${esc(done.payload?.outcome||'enregistrée')}.</div>`;
 return `<div class="action-section"><h3>VERROUILLER L’ISSUE</h3><button class="btn block" onclick="igr13RecordOutcome('accepted')">ACCEPTER</button><button class="btn danger block" onclick="igr13RecordOutcome('refused')">REFUSER</button></div>`;
}
window.igr13RecordOutcome=async function(outcome){try{await rpc('igr_v13_record_judicial_outcome',{p_code:STATE.room,p_player_token:STATE.token,p_outcome:outcome,p_note:''});await syncNow(true)}catch(e){console.error(e);toast(e?.message||'Décision impossible.')}};

window.renderInvestigationTab=renderInvestigationTab=function(){
 if(!core())return base.renderInvestigationTab?base.renderInvestigationTab():'';
 const d=STATE.sync,r=d.room,me=d.player,rr=me.public_role,ph=r.phase,target=typeof currentTarget==='function'?currentTarget():null;
 let body=`<div class="phase-explain"><h2>${esc(phaseLabel(ph))}</h2>${phaseInstruction(rr,ph,target)}</div>`;
 if((d.pending_requests||[]).length&&typeof renderPendingRequests==='function')body+=renderPendingRequests();
 if(ph==='interrogation_select'&&rr==='enqueteur')body+=renderInterrogationSelect();
 if(ph==='cycle_debrief'&&['enqueteur','analyste'].includes(rr))body+=renderDebriefForm();
 if(ph==='event_select'&&rr==='enqueteur')body+=renderEventSelect();
 if(ph==='annex_inspecteur'&&rr==='inspecteur'&&typeof renderSpecialChoices==='function')body+=renderSpecialChoices('field',d.scenario.field_actions,'CHOISIR UNE ACTION DE TERRAIN');
 if(ph==='annex_expert'&&rr==='expert'&&typeof renderSpecialChoices==='function')body+=renderSpecialChoices('expert',d.scenario.expert_actions,'CHOISIR UNE ANALYSE');
 if(ph==='annex_juge'&&rr==='juge'&&typeof renderJudgeChoices==='function')body+=renderJudgeChoices();
 if(ph==='annex_procureur'&&rr==='procureur'&&typeof renderProsecutorPanel==='function')body+=renderProsecutorPanel();
 if(ph==='annex_temoin'&&rr==='enqueteur'&&typeof renderWitnessPanel==='function')body+=renderWitnessPanel();
 if(ph==='annex_journaliste'&&rr==='journaliste')body+=renderJournalistInvestigation();
 if(ph==='event_enquete_croisee'&&rr==='inspecteur'&&typeof renderSpecialChoices==='function')body+=renderSpecialChoices('field',d.scenario.field_actions,'CHOISIR UNE ACTION DE TERRAIN');
 if(ph==='event_enquete_croisee'&&rr==='journaliste')body+=renderJournalistInvestigation();
 body+=renderJudicialOutcome(ph,rr);
 if(rr==='journaliste'&&['interrogation_select','interrogation','cycle_debrief','event_select','event_confrontation','event_assembly','event_enquete_croisee','annex_inspecteur','annex_procureur','annex_juge','annex_temoin','annex_journaliste','annex_expert'].includes(ph)&&typeof renderBreakingPanel==='function')body+=renderBreakingPanel();
 if(ph==='provisional_lock'&&rr==='enqueteur'&&typeof renderProvisionalForm==='function')body+=renderProvisionalForm();
 if(ph==='locking'&&['enqueteur','analyste','procureur','juge','journaliste'].includes(rr)&&typeof renderFinalLockForm==='function')body+=renderFinalLockForm();
 if((ph==='reveal'||r.status==='finished')&&typeof renderReveal==='function')body+=renderReveal();
 return body;
};

window.privateCardHtml=privateCardHtml=function(){
 const out=base.privateCardHtml?base.privateCardHtml():'';if(!core())return out;
 const ps=STATE.sync?.player?.private_state||{};const primary=String(ps.objective_main||'').replace(/\s+/g,' ').trim(),secondary=String(ps.objective_secondary||'').replace(/\s+/g,' ').trim();
 if(!secondary||secondary.toLocaleLowerCase('fr')===primary.toLocaleLowerCase('fr'))return out;
 const block=`<div class="v13-objectives"><div class="v13-objective v13-objective-secondary"><b>OBJECTIF SECONDAIRE</b><p>${esc(ps.objective_secondary)}</p></div></div>`;
 return out.includes('<div class="private-foot">')?out.replace('<div class="private-foot">',block+'<div class="private-foot">'):block+out;
};

window.phaseTimerControl=phaseTimerControl=function(){if(core())return'';return base.phaseTimerControl?base.phaseTimerControl():''};
window.phaseCanAdvance=phaseCanAdvance=function(){if(!core())return base.phaseCanAdvance?base.phaseCanAdvance():false;const ph=room()?.phase;return !!(STATE.hostToken&&['provisional_lock','locking'].includes(ph))};

console.info(`[IGR ${V}] flow overlay actif pour 001–020`);
})();
