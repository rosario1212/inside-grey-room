/* Inside Grey Room — v37 suspect objectives + cycle event-select recovery
   - Core cases 001–020: suspect objective now follows the private facts/defence line.
   - Restores human labels/copy for directed event phases after the language layer.
   - Renders the cycle 2/3 event chooser directly from authoritative room.state.event_options.
*/
(()=>{
'use strict';
const VERSION='v37-objective-event-select';
const CORE_STANDARD=new Set(Array.from({length:20},(_,i)=>String(i+1).padStart(3,'0')));
const $=id=>document.getElementById(id);
const en=()=>window.IGR_LOCALE==='en';
const copy=(fr,enText)=>en()?enText:fr;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').toLowerCase();

function scenarioId(){return String(window.STATE?.sync?.room?.scenario_id||window.STATE?.scenarioId||'')}
function isCoreStandard(){return CORE_STANDARD.has(scenarioId())}
function room(){return window.STATE?.sync?.room||null}
function role(){return window.STATE?.sync?.player?.public_role||window.STATE?.role||''}
function eventProgress(){
  const st=room()?.state||{},used=Number(st.event_slots_used||0),total=Number(st.event_slots_total||0);
  return total?`${Math.min(used,total)}/${total}`:'';
}

/* ------------------------------------------------------------------
   SUSPECT OBJECTIVE
   The private defence line is already scenario-specific. The lead sentence
   makes the actual gameplay objective explicit instead of giving every suspect
   the same generic "ni plus, ni moins" instruction.
------------------------------------------------------------------ */
function suspectObjective(ps={}){
  if(clean(ps.objective_main))return clean(ps.objective_main);
  const position=clean(ps.position);
  const text=norm([ps.place,ps.chronology,ps.hide,ps.anchors,ps.position].filter(Boolean).join(' '));

  const lethal=/\b(meurtrier|meurtre est ton choix|tu as tue|auteur du tir mortel|tire volontairement|coup qui tue|geste mortel|violence letale|decides? de (?:la|le) tuer|frappes? jusqu a (?:la|le) tuer|porte volontairement le coup|declenche le premier feu)\b/;
  const direct=/\b(actions? n etaient pas autorisees?|vas plus loin que l ordre|depasses? (?:le|l )?ordre|frappes?|verrouilles?|refermes? volontairement|sequestration|enfermement|retenu contre son gre|vends? la liste|vendu la faille|falsifies? les acces|allumes? volontairement|organises? le reglement de compte)\b/;
  const omission=/\b(inaction|retard(?:e|es|ait|es)?|attends?|attendu|refus(?:e|es|ait)?|n intervient pas|ne pas intervenir|laisse faire|laisse volontairement|ignore(?:s|e|e)? (?:une|l )?alerte|choisis? de ne pas|n as pas alerte|n as pas appele|retarde les secours|retard des secours)\b/;
  const clearOfMain=/\b(n as pas tue|n as pas cause la mort|n as pas participe au fait principal|n etais pas present au meurtre|n etais pas la quand le meurtre|n as pas porte le geste fatal|n as pas porte le coup|n as ni ordonne ni porte|pas le crime principal|pas un meurtre|pas le meurtre|pas la vente|n as pas livre la liste|n as pas pris la decision clinique|n as pas provoque la poursuite|n as pas fourni les medicaments|n as jamais ouvert la porte)\b/;
  const organiser=/\b(organises?|coordonne|finances?|donnes? l ordre|ordonnes?|autorises?|facilites?|maintiens?|maintenir|programme|commandement|ordre risque|pression que tu as commandee|fournis?|rends? possible)\b/;
  const cover=/\b(dissimulation|reecriture|retouche|falsification|falsifies?|modifies? (?:un|des|les) (?:rapport|journaux|logs|notes)|destruction de preuves|supprimer? (?:deux )?messages?|achat du silence|acheter son silence|mensonge sous serment|caches? le document)\b/;

  let lead;
  if(lethal.test(text)||direct.test(text)){
    lead=copy('Minimise tes faits.','Minimise what you did.');
  }else if(omission.test(text)){
    lead=copy('Justifie ton inaction ou ton retard et minimise ta responsabilité.','Justify your inaction or delay and minimise your responsibility.');
  }else if(clearOfMain.test(text)){
    lead=copy('Écarte l’accusation principale et limite ta responsabilité aux faits secondaires.','Deflect the main accusation and limit your responsibility to the secondary facts.');
  }else if(organiser.test(text)){
    lead=copy('Minimise ta part de responsabilité et distingue tes décisions de celles des autres.','Minimise your share of responsibility and separate your decisions from those of others.');
  }else if(cover.test(text)){
    lead=copy('Minimise ta dissimulation et sépare-la du fait principal.','Minimise your concealment and separate it from the main act.');
  }else{
    lead=copy('Minimise ta responsabilité sans contredire les faits de ta carte.','Minimise your responsibility without contradicting the facts on your card.');
  }
  return position?`${lead} ${position}`:lead;
}

const basePrivateCard=window.privateCardHtml;
if(typeof basePrivateCard==='function'){
  window.privateCardHtml=function(){
    const html=String(basePrivateCard.apply(this,arguments)??'');
    if(!isCoreStandard()||role()!=='suspect'||window.STATE?.sync?.player?.secret_role==='espion')return html;
    const ps=window.STATE?.sync?.player?.private_state||{};
    const objective=suspectObjective(ps);
    if(!objective)return html;
    try{
      const t=document.createElement('template');t.innerHTML=html;
      const summary=t.content.querySelector('.role-summary span');
      if(!summary)return html;
      summary.textContent=objective;
      return t.innerHTML;
    }catch{return html}
  };
}

/* ------------------------------------------------------------------
   DIRECTED EVENT COPY
   language-v12 deliberately owns the general French copy, but it predates the
   directed event phases. Re-assert those labels after every late runtime layer.
------------------------------------------------------------------ */
const basePhaseLabel=window.phaseLabel;
if(typeof basePhaseLabel==='function'){
  window.phaseLabel=function(ph){
    if(isCoreStandard()){
      const labels={
        event_select:copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'),
        event_confrontation:copy('CONFRONTATION','CONFRONTATION'),
        event_assembly:copy('ASSEMBLÉE','ASSEMBLY'),
        event_analysis:copy('ANALYSE DU DOSSIER','CASE ANALYSIS'),
        event_signature:copy('ACTION SIGNATURE','SIGNATURE ACTION'),
        event_negociation:copy('NÉGOCIATION','NEGOTIATION'),
        event_requete:copy('REQUÊTE','MOTION'),
        event_saisine:copy('SAISINE','REFERRAL'),
        event_enquete_croisee:copy('ENQUÊTE CROISÉE','CROSS-INVESTIGATION')
      };
      if(labels[ph])return labels[ph];
    }
    return basePhaseLabel.apply(this,arguments);
  };
}

const basePhaseInstruction=window.phaseInstruction;
if(typeof basePhaseInstruction==='function'){
  window.phaseInstruction=function(r,ph,target){
    if(!isCoreStandard())return basePhaseInstruction.apply(this,arguments);
    if(ph==='event_select')return r==='enqueteur'
      ? `<p>${copy('Choisis le prochain événement du cycle. Les options ci-dessous viennent directement du serveur.','Choose the next event in the cycle. The options below come directly from the server.')} ${eventProgress()?`<b>${copy('Progression','Progress')}: ${esc(eventProgress())}.</b>`:''}</p>`
      : `<p>${copy('L’Enquêteur choisit le prochain événement du cycle. Reste dans ton espace de jeu jusqu’à une éventuelle convocation.','The Investigator is choosing the next event in the cycle. Stay in your play space until you are called.')}</p>`;
    if(ph==='event_confrontation')return `<p><b>${copy('CONFRONTATION.','CONFRONTATION.')}</b> ${copy('Deux versions sont mises face à face. Aucun écran ne remplace l’échange.','Two versions are put face to face. The screen does not replace the conversation.')}</p>`;
    if(ph==='event_assembly')return `<p><b>${copy('ASSEMBLÉE.','ASSEMBLY.')}</b> ${copy('Mettez en commun uniquement ce qui sert la décision collective.','Share only what helps the collective decision.')}</p>`;
    if(ph==='event_analysis')return `<p><b>${copy('ANALYSE DU DOSSIER.','CASE ANALYSIS.')}</b> ${copy('Reliez la chronologie, les contradictions et vos priorités avant de poursuivre.','Connect the timeline, contradictions and priorities before continuing.')}</p>`;
    if(ph==='event_negociation')return `<p><b>${copy('NÉGOCIATION.','NEGOTIATION.')}</b> ${copy('Avocat et Procureur négocient à partir des faits disponibles.','Defence Counsel and Prosecutor negotiate from the available facts.')}</p>`;
    if(ph==='event_requete')return `<p><b>${copy('REQUÊTE.','MOTION.')}</b> ${copy('L’Avocat saisit le Juge, qui tranche à partir du dossier.','Defence Counsel asks the Judge for a ruling based on the case.')}</p>`;
    if(ph==='event_saisine')return `<p><b>${copy('SAISINE.','REFERRAL.')}</b> ${copy('Le Procureur demande une décision au Juge.','The Prosecutor asks the Judge for a ruling.')}</p>`;
    if(ph==='event_enquete_croisee')return `<p><b>${copy('ENQUÊTE CROISÉE.','CROSS-INVESTIGATION.')}</b> ${copy('Inspecteur et Journaliste travaillent sur la même piste avec des intérêts distincts.','Inspector and Journalist work the same lead with different interests.')}</p>`;
    return basePhaseInstruction.apply(this,arguments);
  };
}

/* ------------------------------------------------------------------
   EVENT SELECT UI
   This intentionally reads room.state.event_options, the authoritative list
   already written by igr_v13_enter_event_select. It does not invent options.
------------------------------------------------------------------ */
function eventOptions(){const v=room()?.state?.event_options;return Array.isArray(v)?v:[]}
function suspects(){return Array.isArray(window.STATE?.sync?.suspects)?window.STATE.sync.suspects:[]}
function suspectOptions(exclude=''){
  return suspects().filter(x=>String(x.id)!==String(exclude)).map(x=>`<option value="${esc(x.id)}">${esc(x.pseudo)}</option>`).join('');
}
function genericEventButton(o){
  return `<button class="btn v13-event-btn" type="button" onclick="igr37StartEvent('${esc(o.key)}')"><b>${esc(o.label||o.key)}</b><small>${esc(o.hint||copy('Événement du cycle','Cycle event'))}</small></button>`;
}
function confrontationPicker(o){
  const ss=suspects();if(ss.length<2)return'';
  return `<div class="v13-target-picker"><b>${esc(o.label||copy('CONFRONTATION','CONFRONTATION'))}</b><small>${esc(o.hint||'')}</small><select id="igr37ConfrontA">${suspectOptions()}</select><select id="igr37ConfrontB">${suspectOptions(ss[0]?.id)}</select><button class="btn primary" type="button" onclick="igr37StartConfrontation()">${copy('Convoquer les deux joueurs','Call both players')}</button></div>`;
}
function interrogationPicker(o){
  if(!suspects().length)return'';
  return `<div class="v13-target-picker"><b>${esc(o.label||copy('INTERROGATOIRE','INTERROGATION'))}</b><small>${esc(o.hint||'')}</small><select id="igr37InterTarget">${suspectOptions()}</select><button class="btn primary" type="button" onclick="igr37StartInterrogation()">${copy('Convoquer','Call in')}</button></div>`;
}
function assemblyPicker(o){
  const people=(window.STATE?.sync?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role));
  if(Number(room()?.cycle||0)<3)return genericEventButton(o);
  return `<div class="v13-target-picker"><b>${esc(o.label||copy('ASSEMBLÉE','ASSEMBLY'))}</b><small>${esc(o.hint||'')}</small><div class="v13-assembly-list">${people.map(p=>`<label class="v13-assembly-person"><input type="checkbox" data-igr37-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" type="button" onclick="igr37StartAssembly()">${copy('Ouvrir l’Assemblée','Open Assembly')}</button></div>`;
}
function eventPanel(){
  const opts=eventOptions();
  if(!opts.length)return `<div class="locked-state igr37-event-empty"><b>${copy('Événements non chargés.','Events not loaded.')}</b><br><button class="btn ghost small" type="button" onclick="igr37ReloadEvents()">${copy('Recharger','Reload')}</button></div>`;
  let special='',buttons=[];
  for(const o of opts){
    if(o.key==='confrontation')special+=confrontationPicker(o);
    else if(o.key==='interrogation')special+=interrogationPicker(o);
    else if(o.key==='assembly')special+=assemblyPicker(o);
    else buttons.push(genericEventButton(o));
  }
  const progress=eventProgress();
  return `<div class="v13-event-panel igr37-event-panel"><div class="v13-cold-banner"><strong>${copy('ÉVÉNEMENTS DU CYCLE','CYCLE EVENTS')}</strong>${progress?`${esc(progress)} ${copy('utilisés','used')}. `:''}${copy('Choisis la prochaine scène.','Choose the next scene.')}</div>${buttons.length?`<div class="v13-event-grid">${buttons.join('')}</div>`:''}${special}</div>`;
}

async function startEvent(key,targets=[]){
  try{
    if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
    await window.rpc('igr_v13_start_event',{p_code:window.STATE.room,p_player_token:window.STATE.token,p_event:key,p_targets:targets});
    if(typeof window.syncNow==='function')await window.syncNow(true);
  }catch(err){console.error('[IGR v37] event start',err);if(typeof window.toast==='function')window.toast(err?.message||copy('Événement impossible.','Unable to start event.'))}
}
window.igr37StartEvent=(key)=>startEvent(key,[]);
window.igr37StartConfrontation=()=>{
  const a=$('igr37ConfrontA')?.value,b=$('igr37ConfrontB')?.value;
  if(!a||!b||a===b){window.toast?.(copy('Choisis deux personnes différentes.','Choose two different people.'));return}
  return startEvent('confrontation',[a,b]);
};
window.igr37StartInterrogation=()=>{const t=$('igr37InterTarget')?.value;return t?startEvent('interrogation',[t]):undefined};
window.igr37StartAssembly=()=>startEvent('assembly',[...document.querySelectorAll('[data-igr37-assembly]:checked')].map(x=>x.value));
window.igr37ReloadEvents=async()=>{
  try{if(typeof window.syncNow==='function')await window.syncNow(true);if(typeof window.renderGame==='function')window.renderGame()}catch(err){console.warn('[IGR v37] event reload',err)}
};

function eventSelectInvestigation(){
  const r=role();
  let body=`<div class="phase-explain"><h2>${esc(window.phaseLabel?.('event_select')||copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'))}</h2>${window.phaseInstruction?.(r,'event_select',null)||''}</div>`;
  if((window.STATE?.sync?.pending_requests||[]).length&&typeof window.renderPendingRequests==='function')body+=window.renderPendingRequests();
  if(r==='enqueteur')body+=eventPanel();
  return body;
}

const baseInvestigation=window.renderInvestigationTab;
if(typeof baseInvestigation==='function'){
  window.renderInvestigationTab=function(){
    if(isCoreStandard()&&room()?.phase==='event_select')return eventSelectInvestigation();
    return baseInvestigation.apply(this,arguments);
  };
}

const baseGameTab=window.renderGameTab;
if(typeof baseGameTab==='function'){
  window.renderGameTab=function(){
    if(isCoreStandard()&&window.STATE?.tab==='investigation'&&room()?.phase==='event_select')return eventSelectInvestigation();
    return baseGameTab.apply(this,arguments);
  };
}

window.IGR_GAMEPLAY_FIX_V37=Object.freeze({version:VERSION,suspectObjective,eventPanel});
console.info(`[IGR ${VERSION}] suspect objective + event-select recovery active`);
})();
