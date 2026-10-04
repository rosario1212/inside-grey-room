/* Inside Grey Room — v38 gameplay UI state repair
   - Scenario-aware suspect objectives for dossiers 001–034.
   - Event-select always renders human copy + authoritative server options.
   - Investigator cards no longer show an empty "what you hide" block.
   - Adds an in-game Settings control at the top of active games.
*/
(()=>{
'use strict';
const VERSION='v38-gameplay-ui-state';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const $=id=>document.getElementById(id);
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase();
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const room=()=>window.STATE?.sync?.room||null;
const role=()=>window.STATE?.sync?.player?.public_role||window.STATE?.role||'';
const scenarioId=()=>String(room()?.scenario_id||window.STATE?.scenarioId||'');
const isCore=()=>CORE.has(scenarioId());
const isPlaying=()=>room()?.status==='playing';

function isLegacyObjective(v){
  const s=norm(v);
  return !s || s.includes('fais reconnaitre exactement ce que tu as fait') || s.includes('ni plus, ni moins') || s.includes('admit exactly what you did') || s.includes('no more, no less');
}

function suspectObjective(ps={}){
  const explicit=clean(ps.objective_main);
  if(explicit&&!isLegacyObjective(explicit))return explicit;
  const position=clean(ps.position);
  const text=norm([ps.place,ps.chronology,ps.hide,ps.anchors,ps.position].filter(Boolean).join(' '));
  let lead='';

  const death=/\b(tue|tuer|mortel|meurtre|assassinat|poignard|tir|etrangl|empoisonn|incendie volontaire|coup fatal|geste fatal)\b/;
  const coercion=/\b(pression|menac|contraint|force|violence|frappe|enferm|retenu|sequestr|humili|drogue|ordre|ordon|finance|organis|facilit|autorise)\b/;
  const omission=/\b(inaction|attend|retard|refus|laisse faire|n'interviens|ne repond|ignore|alerte|secours|pouvais intervenir)\b/;
  const conceal=/\b(cache|efface|supprime|retouche|falsifi|modifie|reecrit|dissimule|mensonge|menti|detruit|rapport|journal|logs?|preuve)\b/;
  const money=/\b(heritage|testament|beneficiaire|financier|dette|argent|patrimoine|succession)\b/;
  const familySecret=/\b(filiation|secret familial|parent|heritier|heritage)\b/;
  const notMain=/\b(n'as pas tue|n'a pas tue|pas tue|pas le meurtre|pas responsable de la mort|n'as pas cause la mort|n'a pas cause la mort|signature est vraie|pas falsifie|n'as jamais|n'a jamais)\b/;

  if(death.test(text)&&!notMain.test(text)){
    lead=copy('Minimise tes faits et évite de te faire attribuer plus que ce que tu as réellement commis.','Minimise what you did and avoid being blamed for more than you actually did.');
  }else if(omission.test(text)){
    lead=copy('Justifie ton inaction ou ton retard et minimise ta part de responsabilité.','Justify your inaction or delay and minimise your share of responsibility.');
  }else if(conceal.test(text)&&familySecret.test(text)){
    lead=copy('Minimise ce que tu as caché ou effacé et protège ton secret sans te faire attribuer le fait principal.','Minimise what you hid or erased and protect your secret without being blamed for the main act.');
  }else if(coercion.test(text)&&money.test(text)){
    lead=copy('Minimise la pression que tu as exercée et distingue ton intérêt personnel de toute responsabilité dans la mort.','Minimise the pressure you applied and separate your personal interest from responsibility for the death.');
  }else if(conceal.test(text)){
    lead=copy('Minimise ta dissimulation et sépare-la clairement du fait principal.','Minimise your concealment and clearly separate it from the main act.');
  }else if(coercion.test(text)){
    lead=copy('Minimise ta part de responsabilité et distingue tes actes de ceux des autres.','Minimise your share of responsibility and distinguish your acts from those of others.');
  }else if(money.test(text)){
    lead=copy('Explique ton intérêt personnel sans le laisser devenir une preuve de culpabilité.','Explain your personal interest without letting it become proof of guilt.');
  }else if(notMain.test(text)){
    lead=copy('Écarte l’accusation principale et limite ta responsabilité aux faits que tu as réellement commis.','Deflect the main accusation and limit your responsibility to what you actually did.');
  }else{
    lead=copy('Minimise ta responsabilité sans contredire les faits de ta carte.','Minimise your responsibility without contradicting the facts on your card.');
  }
  return position?`${lead} ${position}`:lead;
}

function rewritePrivateCard(html){
  if(!isCore())return html;
  try{
    const t=document.createElement('template');
    t.innerHTML=String(html??'');
    const pub=role();
    if(pub==='suspect'&&window.STATE?.sync?.player?.secret_role!=='espion'){
      const ps=window.STATE?.sync?.player?.private_state||{};
      const summary=t.content.querySelector('.role-summary span');
      if(summary)summary.textContent=suspectObjective(ps);
    }
    if(pub==='enqueteur'){
      const headings=[...t.content.querySelectorAll('b')];
      for(const b of headings){
        const label=norm(b.textContent);
        if(label==='ce que tu gardes pour toi'||label==='what you keep to yourself'||label==='what you hide'){
          let node=b.parentElement;
          while(node&&node.parentElement&&!node.classList.contains('private-card-v11')&&!/(value|block|card)/i.test(node.className||''))node=node.parentElement;
          if(node&&node.classList.contains('private-card-v11'))node=b.parentElement;
          node?.remove();
        }
      }
    }
    return t.innerHTML;
  }catch{return String(html??'')}
}

const basePrivate=window.privateCardHtml;
if(typeof basePrivate==='function')window.privateCardHtml=function(){return rewritePrivateCard(basePrivate.apply(this,arguments))};

const EVENT_LABELS={
 event_select:['CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'],
 event_confrontation:['CONFRONTATION','CONFRONTATION'],event_assembly:['ASSEMBLÉE','ASSEMBLY'],
 event_analysis:['ANALYSE DU DOSSIER','CASE ANALYSIS'],event_signature:['ACTION SIGNATURE','SIGNATURE ACTION'],
 event_negociation:['NÉGOCIATION','NEGOTIATION'],event_requete:['REQUÊTE','MOTION'],event_saisine:['SAISINE','REFERRAL'],
 event_enquete_croisee:['ENQUÊTE CROISÉE','CROSS-INVESTIGATION']
};
const basePhaseLabel=window.phaseLabel;
window.phaseLabel=function(ph){
  if(isCore()&&EVENT_LABELS[ph])return copy(...EVENT_LABELS[ph]);
  return typeof basePhaseLabel==='function'?basePhaseLabel.apply(this,arguments):String(ph||copy('PARTIE','GAME')).toUpperCase();
};

function eventProgress(){const st=room()?.state||{},u=Number(st.event_slots_used||0),n=Number(st.event_slots_total||0);return n?`${Math.min(u,n)}/${n}`:''}
const baseInstruction=window.phaseInstruction;
window.phaseInstruction=function(r,ph,target){
  if(isCore()&&ph==='event_select')return r==='enqueteur'
    ? `<p>${copy('Choisis le prochain événement du cycle. Les options disponibles sont celles autorisées par le dossier et les rôles présents.','Choose the next event in the cycle. Available options are those allowed by the case and present roles.')} ${eventProgress()?`<b>${copy('Progression','Progress')} : ${esc(eventProgress())}.</b>`:''}</p>`
    : `<p>${copy('L’Enquêteur choisit le prochain événement du cycle.','The Investigator is choosing the next event in the cycle.')}</p>`;
  return typeof baseInstruction==='function'?baseInstruction.apply(this,arguments):'<p></p>';
};

function eventOptions(){const v=room()?.state?.event_options;return Array.isArray(v)?v:[]}
function suspects(){return Array.isArray(window.STATE?.sync?.suspects)?window.STATE.sync.suspects:[]}
function suspectOptions(exclude=''){return suspects().filter(x=>String(x.id)!==String(exclude)).map(x=>`<option value="${esc(x.id)}">${esc(x.pseudo)}</option>`).join('')}
function genericEvent(o){return `<button class="btn v38-event-btn" type="button" onclick="igr38StartEvent('${esc(o.key)}')"><b>${esc(o.label||o.key)}</b><small>${esc(o.hint||copy('Événement du cycle','Cycle event'))}</small></button>`}
function confrontation(o){const ss=suspects();if(ss.length<2)return'';return `<div class="v38-target-picker"><b>${esc(o.label||'CONFRONTATION')}</b><small>${esc(o.hint||'')}</small><select id="igr38ConfrontA">${suspectOptions()}</select><select id="igr38ConfrontB">${suspectOptions(ss[0]?.id)}</select><button class="btn primary" type="button" onclick="igr38StartConfrontation()">${copy('Convoquer les deux joueurs','Call both players')}</button></div>`}
function interrogation(o){if(!suspects().length)return'';return `<div class="v38-target-picker"><b>${esc(o.label||copy('INTERROGATOIRE','INTERROGATION'))}</b><small>${esc(o.hint||'')}</small><select id="igr38InterTarget">${suspectOptions()}</select><button class="btn primary" type="button" onclick="igr38StartInterrogation()">${copy('Convoquer','Call in')}</button></div>`}
function assembly(o){
  const people=(window.STATE?.sync?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role));
  if(Number(room()?.cycle||0)<3)return genericEvent(o);
  return `<div class="v38-target-picker"><b>${esc(o.label||copy('ASSEMBLÉE','ASSEMBLY'))}</b><small>${esc(o.hint||'')}</small><div class="v38-assembly-list">${people.map(p=>`<label><input type="checkbox" data-igr38-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" type="button" onclick="igr38StartAssembly()">${copy('Ouvrir l’Assemblée','Open Assembly')}</button></div>`;
}
function eventPanel(){
  const opts=eventOptions();
  if(!opts.length)return `<div class="locked-state v38-event-empty"><b>${copy('Événements en cours de chargement.','Events are loading.')}</b><br><button class="btn ghost small" type="button" onclick="igr38ReloadEvents()">${copy('Recharger les événements','Reload events')}</button></div>`;
  let special='',buttons=[];
  for(const o of opts){if(o.key==='confrontation')special+=confrontation(o);else if(o.key==='interrogation')special+=interrogation(o);else if(o.key==='assembly')special+=assembly(o);else buttons.push(genericEvent(o))}
  return `<div class="v38-event-panel"><div class="v38-event-head"><strong>${copy('ÉVÉNEMENTS DU CYCLE','CYCLE EVENTS')}</strong><span>${eventProgress()?`${esc(eventProgress())} ${copy('actions utilisées','actions used')} · `:''}${copy('Choisis la prochaine scène.','Choose the next scene.')}</span></div>${buttons.length?`<div class="v38-event-grid">${buttons.join('')}</div>`:''}${special}</div>`;
}
async function startEvent(key,targets=[]){
  try{if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));await window.rpc('igr_v13_start_event',{p_code:window.STATE.room,p_player_token:window.STATE.token,p_event:key,p_targets:targets});await window.syncNow?.(true)}catch(e){console.error('[IGR v38] start event',e);window.toast?.(e?.message||copy('Événement impossible.','Unable to start event.'))}
}
window.igr38StartEvent=(key)=>startEvent(key,[]);
window.igr38StartConfrontation=()=>{const a=$('igr38ConfrontA')?.value,b=$('igr38ConfrontB')?.value;if(!a||!b||a===b)return window.toast?.(copy('Choisis deux personnes différentes.','Choose two different people.'));return startEvent('confrontation',[a,b])};
window.igr38StartInterrogation=()=>{const t=$('igr38InterTarget')?.value;if(!t)return;return startEvent('interrogation',[t])};
window.igr38StartAssembly=()=>startEvent('assembly',[...document.querySelectorAll('[data-igr38-assembly]:checked')].map(x=>x.value));
window.igr38ReloadEvents=async()=>{try{await window.syncNow?.(true);healEventSelect()}catch(e){console.error(e)}};

const baseInvestigation=window.renderInvestigationTab;
window.renderInvestigationTab=function(){
  if(isCore()&&room()?.phase==='event_select')return eventPanel();
  return typeof baseInvestigation==='function'?baseInvestigation.apply(this,arguments):'';
};

function settingsOverlay(){
  let overlay=$('igrGameSettingsOverlay');
  if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id='igrGameSettingsOverlay';overlay.className='igr38-settings-overlay';overlay.hidden=true;
  overlay.innerHTML=`<div class="igr38-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="igr38SettingsTitle"><div class="igr38-settings-title"><div><span>${copy('PARTIE','GAME')}</span><h2 id="igr38SettingsTitle">${copy('Paramètres','Settings')}</h2></div><button type="button" class="igr38-settings-close" aria-label="${copy('Fermer','Close')}">×</button></div><div class="igr38-setting-row"><div><b>${copy('Langue','Language')}</b><small>${copy('Change l’interface du jeu.','Change the game interface.')}</small></div><div class="igr38-lang"><button type="button" data-locale="fr">FR</button><button type="button" data-locale="en">EN</button></div></div><div class="igr38-setting-row"><div><b>${copy('Recharger la partie','Reload game')}</b><small>${copy('Récupère immédiatement le dernier état du serveur.','Immediately fetch the latest server state.')}</small></div><button type="button" class="igr38-reload">${copy('Recharger','Reload')}</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.igr38-settings-close')?.addEventListener('click',()=>overlay.hidden=true);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true});
  overlay.querySelectorAll('[data-locale]').forEach(btn=>{btn.classList.toggle('active',btn.dataset.locale===(window.IGR_LOCALE||'fr'));btn.addEventListener('click',()=>window.igrSetLocale?.(btn.dataset.locale))});
  overlay.querySelector('.igr38-reload')?.addEventListener('click',async()=>{overlay.hidden=true;try{await window.syncNow?.(true);window.renderGame?.()}catch{location.reload()}});
  return overlay;
}
function openSettings(){const o=settingsOverlay();o.hidden=false}
function ensureSettings(){
  const old=$('igrGameSettings');
  if(!isPlaying()){old?.remove();$('igrGameSettingsOverlay')?.remove();return}
  if(old)return;
  const quit=[...document.querySelectorAll('button,a')].find(x=>/quitter|quit/i.test(clean(x.textContent)));
  const bell=$('igrNotifyBell');
  const host=quit?.parentElement||bell?.parentElement||document.querySelector('#app .topbar')||document.querySelector('#app');
  if(!host)return;
  const b=document.createElement('button');b.id='igrGameSettings';b.className='igr38-game-settings';b.type='button';b.setAttribute('aria-label',copy('Paramètres','Settings'));b.innerHTML=`<span aria-hidden="true">⚙</span><b>${copy('Paramètres','Settings')}</b>`;b.addEventListener('click',openSettings);
  if(quit&&quit.parentElement===host)host.insertBefore(b,quit);else host.appendChild(b);
}

function healEventSelect(){
  if(!isCore()||room()?.phase!=='event_select')return;
  ensureSettings();
  const raw=[...document.querySelectorAll('#app *')].filter(el=>el.children.length===0&&norm(el.textContent)==='event_select');
  raw.forEach(el=>{el.textContent=copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE')});
  const stale=[...document.querySelectorAll('#app p,#app span,#app div')].filter(el=>el.children.length===0&&norm(el.textContent)==='la partie continue.');
  stale.forEach(el=>{el.textContent=copy('Choisis le prochain événement du cycle.','Choose the next event in the cycle.')});
  const content=document.querySelector('.investigation-panel,.investigation-content,[data-tab-panel="investigation"],#investigationTab');
  if(content&&!content.querySelector('.v38-event-panel,.v38-event-empty'))content.innerHTML=eventPanel();
}

const css=document.createElement('style');css.id='igr38GameplayStyle';css.textContent=`
#igrGameSettings.igr38-game-settings{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 15px;border:1px solid #303740;border-radius:999px;background:#090d11;color:#edf1f4;font:700 13px/1 system-ui,-apple-system,sans-serif;letter-spacing:.04em;white-space:nowrap}#igrGameSettings span{font-size:18px}.igr38-settings-overlay[hidden]{display:none!important}.igr38-settings-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom))}.igr38-settings-sheet{width:min(560px,100%);background:#0c1116;border:1px solid #303740;border-radius:28px;padding:22px;color:#f3f5f7;box-shadow:0 30px 90px rgba(0,0,0,.6)}.igr38-settings-title{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}.igr38-settings-title span{font:700 11px/1.4 ui-monospace,monospace;letter-spacing:.22em;color:#8e9aa5}.igr38-settings-title h2{margin:4px 0 0;font-size:28px}.igr38-settings-close{width:44px;height:44px;border-radius:50%;border:1px solid #303740;background:#11171d;color:#fff;font-size:28px}.igr38-setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 0;border-top:1px solid #242b32}.igr38-setting-row b,.igr38-setting-row small{display:block}.igr38-setting-row small{margin-top:5px;color:#8e9aa5}.igr38-lang{display:flex;gap:7px}.igr38-lang button,.igr38-reload{border:1px solid #39424b;border-radius:14px;background:#11171d;color:#fff;padding:11px 13px;font-weight:800}.igr38-lang button.active{background:#f0f2f4;color:#080b0e}.v38-event-panel{display:grid;gap:14px}.v38-event-head{display:grid;gap:5px;padding:18px;border:1px solid #2c343c;border-radius:20px;background:#10161c}.v38-event-head strong{font-size:20px}.v38-event-head span,.v38-target-picker small{color:#9ba5ae}.v38-event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v38-event-btn{display:flex!important;flex-direction:column;align-items:flex-start!important;gap:6px;text-align:left!important;min-height:88px}.v38-event-btn small{white-space:normal;color:#9ba5ae}.v38-target-picker{display:grid;gap:10px;padding:16px;border:1px solid #2c343c;border-radius:20px;background:#0d1217}.v38-target-picker select{width:100%;min-height:48px;border:1px solid #39424b;border-radius:13px;background:#080c10;color:#fff;padding:0 12px}.v38-assembly-list{display:grid;gap:8px}.v38-assembly-list label{display:flex;gap:9px;align-items:center}@media(max-width:700px){#igrGameSettings.igr38-game-settings{width:48px;padding:0;justify-content:center}#igrGameSettings b{display:none}.igr38-settings-sheet{border-radius:24px}.igr38-setting-row{align-items:flex-start;flex-direction:column}.v38-event-grid{grid-template-columns:1fr}}
`;document.head.appendChild(css);

let healing=false;
const heal=()=>{if(healing)return;healing=true;requestAnimationFrame(()=>{healing=false;ensureSettings();healEventSelect()})};
new MutationObserver(heal).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('igr:sync',heal);window.addEventListener('load',heal);setTimeout(heal,250);setTimeout(heal,1200);
window.IGR_GAMEPLAY_STATE_V38={version:VERSION,suspectObjective,eventPanel,heal};
})();
