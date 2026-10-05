/* Inside Grey Room v42 — investigation clarity and suspect continuity.
   Loaded after authoritative-runtime-v41.js.
   - FIL -> ÉLÉMENTS D’ENQUÊTE with two scenario context cards + revealed elements.
   - Suspect-only CHRONOLOGIE tab built from the private canonical card.
   - Explicit names for interrogations/confrontations and provisional speakers.
   - Removes the duplicate event-select summary, fixes Flux copy, moves OBJECTIF to the bottom.
   - Keeps one compact Settings button visible during live play.
*/
(()=>{
'use strict';
const VERSION='v42-investigation-ui';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'';
const scenarioId=()=>String(room()?.scenario_id||S()?.scenarioId||'');
const core=()=>CORE.has(scenarioId());
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canSeeEvidence=r=>['enqueteur','analyste','procureur','juge','inspecteur','expert','journaliste','maitre'].includes(r);
const playerById=id=>(sync()?.players||[]).find(p=>String(p.id)===String(id));
const targetName=id=>playerById(id)?.pseudo||(sync()?.suspects||[]).find(p=>String(p.id)===String(id))?.pseudo||'';

const CONTEXT_HINTS={
'001':`Fenêtre à reconstruire : <b>02 h 11–03 h 10</b>. Les versions doivent préciser les arrivées, départs et passages autour de la chambre 222. Les horaires plus précis révélés ensuite doivent rester compatibles avec cette fenêtre.`,
'002':`Reconstituez les derniers contacts avec Léon : pressions, demandes d’aide, silences et possibilités concrètes d’intervention. Le dossier porte sur la responsabilité avant sa mort, pas sur la recherche d’un meurtrier.`,
'003':`Séparez quatre maillons : recherche, accès au matériel, transfert et alertes. Pour chaque étape, distinguez ce qui était connu avant l’attaque de ce qui a été dissimulé après.`,
'004':`Trois personnes ont reçu un appel ou une demande d’aide de Sofia. Comparez l’ordre des contacts, ce que chacune comprend de son état et la fenêtre dans laquelle une intervention restait possible.`,
'005':`Distinguez la mort d’Adrian de la mise en scène du Masque Blanc. Le symbole, les objets et le décor sont des faits à dater ; leur présence ne désigne pas automatiquement l’auteur du meurtre.`,
'006':`La nuit du chalet doit être reconstruite dans l’ordre : dispute, chute, réactions du groupe et éventuel appel aux secours. Cinq années de silence peuvent avoir déformé les souvenirs sans effacer les faits matériels.`,
'007':`Séparez les intérêts financiers, les liens familiaux et les actes commis autour du décès. Testament, dette et filiation peuvent modifier les mobiles sans prouver à eux seuls une responsabilité.`,
'008':`Les déclarations portent sur les mêmes faits mais leurs horaires ne sont pas tous compatibles. Notez précisément ce que chaque personne affirme avoir vu, fait ou appris, puis confrontez les contradictions.`,
'009':`Le retrait de consentement précède l’incident. Reconstituez ensuite la poursuite du protocole, les décisions cliniques, la chute et les modifications éventuelles des dossiers.`,
'010':`Point fixe du dossier : <b>13 h 54</b>, la paroi est ouverte alors que Nora respire encore. L’enquête doit établir qui pouvait accéder au mur, entendre les bruits et comprendre ce qui se passait avant et après cette heure.`,
'011':`L’opération couvre <b>36 heures</b>. Classez chaque fait dans la chaîne commandement → transmission → exécution → rapport afin de distinguer ordre initial, dépassement et dissimulation.`,
'012':`Sacha est retenu pendant près de <b>20 heures</b>. Reconstituez la confiscation du téléphone, les violences, l’enfermement, les possibilités d’intervention et le moment de l’évasion.`,
'013':`Le tir est certain ; la chaîne qui l’a rendu possible l’est moins. Reliez recrutement, financement, véhicule, accès et faille de sécurité sans confondre exécution matérielle et préparation.`,
'014':`La fuite s’est construite par étapes : extraction de pages, reconstitution d’une liste, circulation du dossier et falsification de journaux. Chaque étape peut avoir un auteur et un niveau de connaissance différents.`,
'015':`Reconstituez la suite : alertes médicales, demande de suspension, décision de poursuivre, décès puis modification de notes. Le moment où chacun apprend le risque est central.`,
'016':`La vidéo documente l’enlèvement, la drogue et l’humiliation, puis s’arrête avant le geste fatal. Distinguez ce qui est visible à l’écran de ce qui se produit immédiatement après, hors champ.`,
'017':`Replacez dans l’ordre la séquestration, les menaces, le paiement, la mort et la libération. Un accord de silence ou un acte de survie n’a pas nécessairement le même poids que la violence principale.`,
'018':`Deux questions doivent rester séparées : qui a causé la mort et qui a organisé la scène des neuf assiettes. Le déplacement du corps, les objets et les accès servent à dater ces deux séquences.`,
'019':`Le lanceur d’alerte devait parler pendant le gala. Distinguez la décision de le faire taire, les moyens mis en place, l’accès à la victime et le geste qui cause réellement la mort.`,
'020':`Reconstituez la catastrophe par chaîne : départ du feu, détection, sorties, systèmes de sécurité, décision d’évacuation et retard accumulé. Le bilan de <b>327 morts</b> ne s’explique pas par un seul maillon.`,
'021':`L’enveloppe disparaît avant d’atteindre Enzo Rinaldi. Séparez les faits déjà établis des déclarations intéressées et notez qui possède réellement l’information permettant de négocier avec la justice.`,
'022':`Le meurtre interne fissure la Famiglia. Cartographiez ce que chacun sait, ce qu’il a vu directement et ce qu’il tient d’un autre membre ; une accusation n’est pas une preuve.`,
'023':`Une réunion devait empêcher une guerre et un siège reste vide. Replacez les prises de position avant l’appel annonçant qu’Adriano Verri a été touché, puis distinguez succession, territoire et violence.`,
'024':`Un membre arrêté peut parler, négocier sa peine et demander une protection. Suivez séparément les informations données à la justice, les réactions de la Famiglia et les engagements pris par chaque camp.`,
'025':`Quatre dossiers antérieurs convergent. Distinguez les ordres attribués à Vittorio Verri des actes commis de leur propre initiative par ses hommes et des récits reconstruits après coup.`,
'026':`La ville est partiellement hors contrôle et trois membres présumés de l’organisation sont détenus. L’enquête porte sur des atrocités passées tandis qu’une cellule encore active se rapproche : ne mélangez pas urgence présente et responsabilité canonique.`,
'027':`L’enquête doit d’abord établir les responsabilités dans les massacres. La décision militaire sur une frappe potentielle vient ensuite et doit tenir compte séparément de la présence possible de civils et d’otages.`,
'028':`Le périmètre protégé tient encore, les communications deviennent intermittentes et une cellule intérieure est soupçonnée. Comparez les versions des trois prisonniers avec les événements du périmètre sans supposer qu’ils disposent tous des mêmes informations.`,
'029':`Les représailles contre l’enquête créent de la pression mais ne modifient jamais la vérité du dossier. Distinguez les exécutions déjà commises des menaces ou actions destinées à faire dérailler l’enquête.`,
'030':`L’infiltration du système judiciaire peut prendre plusieurs formes : corruption, peur, opportunisme ou décision juridiquement défendable. Reliez chaque décision à son intérêt, son contexte et aux preuves disponibles.`,
'031':`La disparition d’un proche transforme une procédure en dette personnelle. Distinguez les actes commis pour le réseau, ceux commis par loyauté et ceux motivés par une vengeance ou une contrainte individuelle.`,
'032':`Les archives sont la référence commune : arrestations, disparitions et ordres partiels. Les accusations croisées doivent être confrontées aux documents, à leur date et à la chaîne de transmission.`,
'033':`Les liens familiaux ne prouvent pas le pouvoir. Reconstituez qui occupait chaque poste, qui pouvait réellement décider et comment les ordres circulaient entre les membres de la famille oligarchique.`,
'034':`Les dossiers utilisent des surnoms dont le sens change selon les opérations. Croisez alias, fonctions officielles, périodes et décisions avant d’attribuer un acte à une personne précise.`
};
const CONTEXT_HINTS_EN={
'001':'Timeline to reconstruct: <b>02:11–03:10</b>. Each version must account for arrivals, departures and movement around room 222. More precise times revealed later must remain compatible with this window.'
};
function scenarioObject(){
  try{return typeof scenario==='function'?scenario(scenarioId()):null}catch(_){return null}
}
function contextCards(){
  const d=sync(),sc=scenarioObject()||{};
  const situation=clean(d?.scenario?.context||sc.context||sc.short||copy('Le dossier est ouvert.','The case is open.'));
  const known=fr()?(CONTEXT_HINTS[scenarioId()]||clean(sc.short)||situation):(CONTEXT_HINTS_EN[scenarioId()]||clean(sc.short)||situation);
  return [
    {kicker:copy('CONTEXTE 1','CONTEXT 1'),title:copy('SITUATION','SITUATION'),text:situation},
    {kicker:copy('CONTEXTE 2','CONTEXT 2'),title:copy('REPÈRES DE DÉPART','STARTING POINTS'),text:known,html:true}
  ];
}
function renderContextCards(){
  return `<div class="v42-context-grid">${contextCards().map(c=>`<article class="v42-context-card"><small>${esc(c.kicker)}</small><h3>${esc(c.title)}</h3><p>${c.html?c.text:esc(c.text)}</p></article>`).join('')}</div>`;
}
const ADMIN_EVENTS=new Set(['message','phase','cycle','ready','timer','score','join','leave','role']);
function revealedElements(){
  return (sync()?.events||[]).filter(e=>{
    if(ADMIN_EVENTS.has(String(e?.event_type||'')))return false;
    const p=e?.payload||{};
    return !!clean(p.title||p.text||p.summary);
  });
}
function eventClass(e){
  const t=String(e?.event_type||'');
  return t==='trame'?'trame':t==='breaking_news'?'news':t==='reveal'?'urgent':'';
}
function eventClock(iso){try{return new Date(iso).toLocaleTimeString(fr()?'fr-FR':'en-GB',{hour:'2-digit',minute:'2-digit'})}catch(_){return'--:--'}}
function evidenceCardHtml(e){const p=e.payload||{};return `<article class="v42-evidence ${eventClass(e)}"><div class="v42-evidence-meta"><span>${esc(p.title||e.event_type||copy('ÉLÉMENT','ELEMENT'))}</span><time>${esc(eventClock(e.created_at))}</time></div><p>${esc(p.text||p.summary||'')}</p></article>`}
function renderElementsTab(){
 const r=role(),events=revealedElements(),visible=canSeeEvidence(r)?events:events.filter(e=>String(e.event_type||'')!=='trame'),ordered=visible.slice().reverse(),recent=ordered.slice(0,4),older=ordered.slice(4);
 return `<section class="v42-elements" aria-label="${esc(copy('Éléments d’enquête','Investigation elements'))}"><div class="v42-elements-head"><div><span>${esc(copy('DOSSIER COMMUN','SHARED CASE FILE'))}</span><h2>${esc(copy('Éléments d’enquête','Investigation elements'))}</h2></div><small>${esc(copy('Contexte + éléments révélés','Context + revealed elements'))}</small></div>${renderContextCards()}<div class="v42-evidence-head"><span>${esc(copy('ÉLÉMENTS RÉVÉLÉS','REVEALED ELEMENTS'))}</span><small>${visible.length}</small></div>${visible.length?`<div class="v42-evidence-list">${recent.map(evidenceCardHtml).join('')}${older.length?`<details class="v42-evidence-history"><summary><span>${esc(copy('Éléments précédents','Earlier elements'))}</span><b>${older.length}</b></summary><div>${older.map(evidenceCardHtml).join('')}</div></details>`:''}</div>`:`<div class="v42-empty">${esc(canSeeEvidence(r)?copy('Les nouveaux indices et trames apparaîtront ici au fil des cycles.','New clues and story elements will appear here as the cycles progress.'):copy('Les éléments réservés à l’enquête ne sont pas affichés. Le contexte commun reste accessible ici.','Investigation-only elements are hidden. Shared context remains available here.'))}</div>`}</section>`;
}
function chronologyRows(text){
  const raw=String(text||'').trim();if(!raw)return'';
  const parts=raw.split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
  return parts.map((line,i)=>{
    const m=line.match(/^(?:À|A|Vers|Environ|Around|At)?\s*(\d{1,2}\s*(?:h|:|H)\s*\d{0,2}|\d{1,2}:\d{2})\b/i);
    const when=m?m[1].replace(/\s+/g,' ').trim():String(i+1).padStart(2,'0');
    const body=m?clean(line.slice(m[0].length).replace(/^\s*[,·:;-]?\s*/,'')):line;
    return `<div class="v42-chrono-row"><div class="v42-chrono-dot"></div><time>${esc(when)}</time><p>${esc(body||line)}</p></div>`;
  }).join('');
}
function renderSuspectChronology(){
  const ps=me()?.private_state||{};
  const chronology=clean(ps.chronology);
  const maintain=clean(ps.position||ps.anchors||ps.objective_main);
  const anchors=clean(ps.anchors);
  return `<section class="v42-chronology">
    <div class="v42-elements-head"><div><span>${esc(copy('OUTIL PRIVÉ','PRIVATE TOOL'))}</span><h2>${esc(copy('Chronologie','Timeline'))}</h2></div><small>${esc(copy('Ta version canonique','Your canonical version'))}</small></div>
    <div class="v42-chrono-card"><div class="v42-chrono-list">${chronology?chronologyRows(chronology):`<div class="v42-empty">${esc(copy('Aucune chronologie détaillée sur cette carte.','No detailed timeline on this card.'))}</div>`}</div></div>
    ${anchors?`<article class="v42-version-card"><small>${esc(copy('REPÈRES SÛRS','SAFE ANCHORS'))}</small><p>${esc(anchors)}</p></article>`:''}
    ${maintain?`<article class="v42-version-card strong"><small>${esc(copy('VERSION À TENIR','VERSION TO MAINTAIN'))}</small><p>${esc(maintain)}</p></article>`:''}
    <div class="v42-private-note">${esc(copy('Privé : cet écran n’ajoute aucun fait. Il réorganise uniquement les informations déjà présentes sur ta carte de rôle.','Private: this screen adds no facts. It only reorganizes information already present on your role card.'))}</div>
  </section>`;
}

const baseGameTabs=typeof gameTabs==='function'?gameTabs:null;
if(baseGameTabs){
  const v42GameTabs=function(){
    let tabs=(baseGameTabs.apply(this,arguments)||[]).map(t=>t?.id==='timeline'?{...t,label:copy('Éléments d’enquête','Investigation elements')}:t);
    if(role()==='suspect'&&!tabs.some(t=>t?.id==='chronology')){
      const cardIndex=tabs.findIndex(t=>t?.id==='card');
      tabs=[...tabs];tabs.splice(cardIndex>=0?cardIndex+1:0,0,{id:'chronology',label:copy('Chronologie','Timeline')});
    }
    return tabs;
  };
  try{gameTabs=v42GameTabs}catch(_){}window.gameTabs=v42GameTabs;
}
const baseRenderGameTab=typeof renderGameTab==='function'?renderGameTab:null;
if(baseRenderGameTab){
  const v42RenderGameTab=function(){
    let html;
    if(S()?.tab==='timeline')html=renderElementsTab();
    else if(S()?.tab==='chronology'&&role()==='suspect')html=renderSuspectChronology();
    else html=baseRenderGameTab.apply(this,arguments);
    if(role()==='suspect'&&room()?.phase==='trame'){
      const notice=`<div class="v42-suspect-notice"><small>${esc(copy('MISE À JOUR','CASE UPDATE'))}</small><b>${esc(copy('Un nouvel élément a été révélé aux enquêteurs.','A new element has been revealed to the investigators.'))}</b><span>${esc(copy('Maintiens une version cohérente avec ta chronologie et ta carte.','Keep your version consistent with your timeline and card.'))}</span></div>`;
      if(!String(html).includes('v42-suspect-notice'))html=notice+html;
    }
    return html;
  };
  try{renderGameTab=v42RenderGameTab}catch(_){}window.renderGameTab=v42RenderGameTab;
}

const basePrivate=typeof privateCardHtml==='function'?privateCardHtml:null;
if(basePrivate){
  const v42PrivateCard=function(){
    const html=String(basePrivate.apply(this,arguments)??'');if(!html||!core())return html;
    try{
      const t=document.createElement('template');t.innerHTML=html;
      const card=t.content.querySelector('.private-card-v11');
      const summary=t.content.querySelector('.role-summary');
      if(card&&summary){
        const ps=me()?.private_state||{};
        const objective=clean(ps.objective_main)||clean(summary.querySelector('span')?.textContent);
        const b=summary.querySelector('b'),span=summary.querySelector('span');
        if(b)b.textContent=copy('OBJECTIF','OBJECTIVE');if(span&&objective)span.textContent=objective;
        summary.classList.add('v42-objective-bottom');
        const foot=card.querySelector('.private-foot');
        if(foot)card.insertBefore(summary,foot);else card.appendChild(summary);
      }
      return t.innerHTML;
    }catch(_){return html}
  };
  try{privateCardHtml=v42PrivateCard}catch(_){}window.privateCardHtml=v42PrivateCard;
}

function currentInterrogated(){return targetName(room()?.state?.current_target)}
function confrontationNames(){
  const ids=Array.isArray(room()?.state?.event_targets)?room().state.event_targets:[];
  return ids.map(targetName).filter(Boolean);
}
function oralSpeaker(){const st=room()?.state||{},q=Array.isArray(st.oral_queue)?st.oral_queue:[],i=Number(st.oral_index||0);return q[i]||null}
const basePhaseLabel=typeof phaseLabel==='function'?phaseLabel:null;
if(basePhaseLabel){
  const v42PhaseLabel=function(ph){
    if(core()&&ph==='trame'&&role()==='suspect')return copy('MISE À JOUR DE L’ENQUÊTE','CASE UPDATE');
    if(core()&&ph==='trame')return copy('NOUVEL ÉLÉMENT D’ENQUÊTE','NEW INVESTIGATION ELEMENT');
    return basePhaseLabel.apply(this,arguments);
  };
  try{phaseLabel=v42PhaseLabel}catch(_){}window.phaseLabel=v42PhaseLabel;
}
const baseInstruction=typeof phaseInstruction==='function'?phaseInstruction:null;
if(baseInstruction){
  const v42Instruction=function(r,ph,target){
    if(core()&&ph==='interrogation'){
      const name=currentInterrogated();
      if(r==='enqueteur')return `<p><b>${esc(copy('Interrogatoire de','Interrogation of'))} ${esc(name||copy('la personne convoquée','the summoned person'))}.</b> ${esc(copy('Conduis l’entretien et termine-le quand tu le souhaites. Le chrono est commun.','Conduct the interview and end it whenever you want. The timer is shared.'))}</p>`;
      if(String(me()?.id)===String(room()?.state?.current_target))return `<p><b>${esc(copy('Tu es convoqué :','You are summoned:'))} ${esc(name||me()?.pseudo||'')}.</b> ${esc(copy('Reste cohérent avec ta carte et ta chronologie.','Stay consistent with your card and timeline.'))}</p>`;
    }
    if(core()&&ph==='event_confrontation'){
      const names=confrontationNames();
      const label=names.length?names.join(' · '):copy('deux personnes convoquées','two summoned people');
      return `<p><b>${esc(copy('CONFRONTATION · 04:00 ·','CONFRONTATION · 04:00 ·'))} ${esc(label)}.</b> ${esc(copy('Deux versions sont mises face à face. Aucun écran ne remplace l’échange.','Two versions are put face to face. No screen replaces the exchange.'))}</p>`;
    }
    if(core()&&ph==='provisional_orals'){
      const sp=oralSpeaker();
      if(sp)return `<p><b>${esc(copy('Prise de parole :','Speaker:'))} ${esc(sp.pseudo||'')} · ${esc(typeof publicRoleLabel==='function'?publicRoleLabel(sp.role):sp.role||'')}.</b> ${esc(copy('Les autres joueurs écoutent cette conclusion provisoire avant le passage au suivant.','Other players listen to this provisional conclusion before the next speaker.'))}</p>`;
    }
    if(core()&&ph==='trame'&&r==='suspect')return `<p><b>${esc(copy('Un nouvel élément a été révélé aux enquêteurs.','A new element has been revealed to the investigators.'))}</b> ${esc(copy('Tu n’en vois pas le contenu. Maintiens une version cohérente avec ta chronologie.','You cannot see its content. Keep your version consistent with your timeline.'))}</p>`;
    return baseInstruction.apply(this,arguments);
  };
  try{phaseInstruction=v42Instruction}catch(_){}window.phaseInstruction=v42Instruction;
}

const baseInvestigation=typeof renderInvestigationTab==='function'?renderInvestigationTab:null;
if(baseInvestigation){
  const v42Investigation=function(){
    let html=String(baseInvestigation.apply(this,arguments)??'');
    if(core()&&room()?.phase==='event_select'){
      try{const t=document.createElement('template');t.innerHTML=html;t.content.querySelectorAll('.v41-event-head').forEach(x=>x.remove());html=t.innerHTML}catch(_){}
    }
    return html;
  };
  try{renderInvestigationTab=v42Investigation}catch(_){}window.renderInvestigationTab=v42Investigation;
}

const baseVideo=typeof renderVideoTab==='function'?renderVideoTab:null;
if(baseVideo){
  const v42Video=function(){
    let html=String(baseVideo.apply(this,arguments)??'');
    html=html.replace(/interrogatoires?\s+de\s+\d+\s*(?:minutes?|min)\.?/gi,m=>/^interrogatoire\b/i.test(m)?copy('interrogatoire.','interrogation.'):copy('interrogatoires.','interrogations.'));
    return html;
  };
  try{renderVideoTab=v42Video}catch(_){}window.renderVideoTab=v42Video;
}

function pickerNames(){
  const inter=document.getElementById('igrV41InterTarget');
  if(inter){
    const box=inter.closest('.v41-event-picker');
    if(box){
      let row=box.querySelector('.v42-picker-names');if(!row){row=document.createElement('div');row.className='v42-picker-names';inter.before(row)}
      const name=inter.selectedOptions?.[0]?.textContent||'';row.innerHTML=`<span>${esc(copy('Personne convoquée','Summoned person'))}</span><b>${esc(name)}</b>`;
      const btn=box.querySelector('button.primary');if(btn)btn.textContent=`${copy('Convoquer','Call in')} ${name}`.trim();
    }
  }
  const a=document.getElementById('igrV41ConfrontA'),b=document.getElementById('igrV41ConfrontB');
  if(a&&b){
    const box=a.closest('.v41-event-picker');if(box){
      let row=box.querySelector('.v42-picker-names');if(!row){row=document.createElement('div');row.className='v42-picker-names';a.before(row)}
      const an=a.selectedOptions?.[0]?.textContent||'',bn=b.selectedOptions?.[0]?.textContent||'';row.innerHTML=`<span>${esc(copy('Personnes convoquées','Summoned people'))}</span><b>${esc([an,bn].filter(Boolean).join(' · '))}</b>`;
      const btn=box.querySelector('button.primary');if(btn)btn.textContent=`${copy('Convoquer','Call in')} ${[an,bn].filter(Boolean).join(' + ')}`.trim();
    }
  }
}
document.addEventListener('change',e=>{if(e.target?.matches?.('#igrV41InterTarget,#igrV41ConfrontA,#igrV41ConfrontB'))pickerNames()});

let settingQueued=false;
function ensureSettings(){
  if(room()?.status!=='playing')return;
  const root=document.getElementById('app');if(!root)return;
  let btn=root.querySelector('#igrTopSettings')||root.querySelector('#igrTopSettingsV42');
  const quit=[...root.querySelectorAll('button,a,[role="button"]')].find(el=>/quitter|leave/i.test(clean(el.textContent)));
  const actions=quit?.parentElement||root.querySelector('.top-actions')||root.querySelector('.topbar');
  if(!actions)return;
  if(!btn){btn=document.createElement('button');btn.id='igrTopSettingsV42';btn.type='button'}
  if(quit&&btn.parentElement!==actions)actions.insertBefore(btn,quit);else if(!btn.parentElement)actions.prepend(btn);
  btn.className='pill-btn igr-top-settings v42-settings';btn.innerHTML='<span aria-hidden="true">⚙</span>';
  btn.setAttribute('aria-label',copy('Paramètres','Settings'));btn.setAttribute('title',copy('Paramètres','Settings'));
  btn.onclick=()=>{try{if(typeof openSettings==='function')openSettings();else if(typeof window.openSettings==='function')window.openSettings()}catch(e){console.error('[IGR v42] settings',e)}};
  for(const other of [...actions.querySelectorAll('button,a,[role="button"]')]){
    if(other!==btn&&(/paramètres|settings/i.test(clean(other.textContent))||/openSettings/i.test(other.getAttribute?.('onclick')||'')))other.remove();
  }
}
function postRender(){pickerNames();ensureSettings()}
function queuePost(){if(settingQueued)return;settingQueued=true;requestAnimationFrame(()=>{settingQueued=false;postRender()})}
const baseRenderGame=typeof renderGame==='function'?renderGame:null;
if(baseRenderGame){
  const v42RenderGame=function(){const out=baseRenderGame.apply(this,arguments);queuePost();return out};
  try{renderGame=v42RenderGame}catch(_){}window.renderGame=v42RenderGame;
}
const app=document.getElementById('app');if(app&&window.MutationObserver)new MutationObserver(queuePost).observe(app,{childList:true,subtree:true});
addEventListener('pageshow',queuePost,{passive:true});setTimeout(queuePost,0);setTimeout(queuePost,350);

const style=document.createElement('style');style.dataset.igrV42=VERSION;style.textContent=`
.v42-elements,.v42-chronology{display:grid;gap:15px}.v42-elements-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.v42-elements-head>div{display:grid;gap:3px}.v42-elements-head span,.v42-evidence-head span,.v42-context-card>small,.v42-version-card>small,.v42-suspect-notice>small{font:700 10px 'IBM Plex Mono',monospace;letter-spacing:.15em;color:#7e8993}.v42-elements-head h2{margin:0;font-size:24px}.v42-elements-head>small{color:#7e8993}.v42-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v42-context-card{padding:17px;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:#0d1217}.v42-context-card h3{margin:6px 0 8px;font-size:18px}.v42-context-card p{margin:0;color:#b0b8c0;line-height:1.55}.v42-evidence-head{display:flex;align-items:center;justify-content:space-between;margin-top:2px}.v42-evidence-head small{min-width:26px;text-align:center;padding:4px 7px;border:1px solid rgba(255,255,255,.1);border-radius:999px}.v42-evidence-list{display:grid;gap:9px}.v42-evidence{padding:14px 15px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:#0b1015}.v42-evidence-meta{display:flex;justify-content:space-between;gap:12px}.v42-evidence-meta span{font-weight:800}.v42-evidence-meta time{color:#7c8791;font:700 10px 'IBM Plex Mono',monospace}.v42-evidence p{margin:6px 0 0;color:#a4adb6;line-height:1.48}.v42-evidence.trame{border-left:3px solid #c7ced4}.v42-evidence.news{border-left:3px solid #8d98a2}.v42-evidence.urgent{border-left:3px solid #e8edf0}.v42-empty,.v42-private-note{padding:14px;border:1px dashed rgba(255,255,255,.09);border-radius:13px;color:#7e8993;line-height:1.5}.v42-chrono-card,.v42-version-card{padding:16px;border:1px solid rgba(255,255,255,.10);border-radius:17px;background:#0d1217}.v42-chrono-list{display:grid}.v42-chrono-row{position:relative;display:grid;grid-template-columns:82px 1fr;gap:14px;padding:9px 0 9px 24px}.v42-chrono-row:not(:last-child):before{content:'';position:absolute;left:6px;top:22px;bottom:-12px;width:1px;background:rgba(255,255,255,.28)}.v42-chrono-dot{position:absolute;left:1px;top:17px;width:11px;height:11px;border-radius:50%;background:#eef1f3}.v42-chrono-row time{align-self:start;padding:7px 9px;border:1px solid rgba(255,255,255,.1);border-radius:999px;text-align:center;font:700 12px 'IBM Plex Mono',monospace}.v42-chrono-row p{margin:6px 0;color:#b8c0c7;line-height:1.45}.v42-version-card{display:grid;gap:7px}.v42-version-card p{margin:0;color:#aeb7bf;line-height:1.55}.v42-version-card.strong{border-color:rgba(255,255,255,.18)}.v42-suspect-notice{display:grid;gap:5px;padding:14px 15px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:#0d1217}.v42-suspect-notice b{font-size:14px}.v42-suspect-notice span{color:#9da7b0}.v42-objective-bottom{order:99;margin-top:15px!important;padding-top:16px!important;border-top:1px solid rgba(255,255,255,.12)!important}.v42-objective-bottom b{letter-spacing:.14em}.v42-picker-names{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:7px 2px 2px;color:#a7b0b8}.v42-picker-names span{font-size:11px}.v42-picker-names b{color:#f1f3f4;font-size:13px;text-align:right}.v42-settings{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;border-radius:999px!important}.v42-settings span{font-size:18px;line-height:1}.v41-event-panel>.v41-event-head{display:none!important}
@media(max-width:700px){.v42-context-grid{grid-template-columns:1fr}.v42-elements-head{align-items:flex-end}.v42-elements-head h2{font-size:21px}.v42-elements-head>small{font-size:9px}.v42-chrono-row{grid-template-columns:74px 1fr;gap:10px;padding-left:21px}.v42-settings{width:42px!important;height:42px!important;min-width:42px!important}}
`;
document.head.appendChild(style);
window.IGR_INVESTIGATION_V42=Object.freeze({version:VERSION,renderElementsTab,renderSuspectChronology,ensureSettings,contextCards,getState:S});
console.info(`[IGR ${VERSION}] active`);
})();
