/* Inside Grey Room v41 — consolidated authoritative live-game UI.
   This is the single final owner for the live private card, directed event choice,
   and in-game Settings button. It intentionally reads the lexical STATE created
   by app-v11.js instead of relying on window.STATE. */
(()=>{
'use strict';
const VERSION='v41-authoritative-ui';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const player=()=>sync()?.player||null;
const role=()=>player()?.public_role||S()?.role||'';
const scenarioId=()=>String(room()?.scenario_id||S()?.scenarioId||'');
const core=()=>CORE.has(scenarioId());
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase();
const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const basePhaseLabel=typeof phaseLabel==='function'?phaseLabel:null;
const PHASE_LABELS={
  event_select:['CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'],
  event_confrontation:['CONFRONTATION','CONFRONTATION'],
  event_assembly:['ASSEMBLÉE','ASSEMBLY'],
  event_analysis:['ANALYSE DU DOSSIER','CASE ANALYSIS'],
  event_signature:['ACTION SIGNATURE','SIGNATURE ACTION'],
  event_negociation:['NÉGOCIATION','NEGOTIATION'],
  event_requete:['REQUÊTE','MOTION'],
  event_saisine:['SAISINE','REFERRAL'],
  event_enquete_croisee:['ENQUÊTE CROISÉE','CROSS-INVESTIGATION']
};
const v41PhaseLabel=function(ph){
  if(core()&&PHASE_LABELS[ph])return copy(...PHASE_LABELS[ph]);
  return basePhaseLabel?basePhaseLabel.apply(this,arguments):String(ph||copy('PARTIE','GAME')).toUpperCase();
};
try{phaseLabel=v41PhaseLabel}catch(_){}
window.phaseLabel=v41PhaseLabel;

const baseInstruction=typeof phaseInstruction==='function'?phaseInstruction:null;
const v41Instruction=function(r,ph,target){
  if(core()&&ph==='event_select'){
    const st=room()?.state||{},used=Number(st.event_slots_used||0),total=Number(st.event_slots_total||0);
    const progress=total?` <b>${copy('Progression','Progress')} : ${Math.min(used,total)}/${total}.</b>`:'';
    return r==='enqueteur'
      ? `<p>${copy('Choisis le prochain événement du cycle. Les choix ci-dessous viennent directement du serveur.','Choose the next event in the cycle. The choices below come directly from the server.')}${progress}</p>`
      : `<p>${copy('L’Enquêteur choisit le prochain événement du cycle.','The Investigator is choosing the next event in the cycle.')}</p>`;
  }
  return baseInstruction?baseInstruction.apply(this,arguments):'<p></p>';
};
try{phaseInstruction=v41Instruction}catch(_){}
window.phaseInstruction=v41Instruction;

const basePrivate=typeof privateCardHtml==='function'?privateCardHtml:null;
const v41PrivateCard=function(){
  const html=basePrivate?String(basePrivate.apply(this,arguments)??''):'';
  if(!html||!core())return html;
  try{
    const p=player()||{},ps=p.private_state||{},pub=p.public_role||'';
    const t=document.createElement('template');
    t.innerHTML=html;
    if(pub==='suspect'&&p.secret_role!=='espion'){
      const objective=clean(ps.objective_main);
      const target=t.content.querySelector('.role-summary span');
      if(objective&&target)target.textContent=objective;
    }
    if(pub==='enqueteur'){
      for(const block of [...t.content.querySelectorAll('.private-block')]){
        const title=norm(block.querySelector('h4')?.textContent);
        if([
          'ce que tu gardes pour toi','ce que tu caches',
          'what you keep to yourself','what you hide'
        ].includes(title))block.remove();
      }
    }
    return t.innerHTML;
  }catch(_){return html}
};
try{privateCardHtml=v41PrivateCard}catch(_){}
window.privateCardHtml=v41PrivateCard;

const suspects=()=>Array.isArray(sync()?.suspects)?sync().suspects:[];
const eventOptions=()=>Array.isArray(room()?.state?.event_options)?room().state.event_options:[];
const optionList=(exclude='')=>suspects().filter(x=>String(x.id)!==String(exclude)).map(x=>`<option value="${esc(x.id)}">${esc(x.pseudo)}</option>`).join('');
const progress=()=>{const st=room()?.state||{},u=Number(st.event_slots_used||0),n=Number(st.event_slots_total||0);return n?`${Math.min(u,n)}/${n}`:''};
const genericEvent=o=>`<button class="btn v41-event-btn" type="button" onclick="igrV41StartEvent('${esc(o.key)}')"><b>${esc(o.label||o.key)}</b><small>${esc(o.hint||copy('Événement du cycle','Cycle event'))}</small></button>`;
const interrogation=o=>suspects().length?`<div class="v41-event-picker"><b>${esc(o.label||copy('INTERROGATOIRE','INTERROGATION'))}</b><small>${esc(o.hint||'')}</small><select id="igrV41InterTarget">${optionList()}</select><button class="btn primary" type="button" onclick="igrV41StartInterrogation()">${copy('Convoquer','Call in')}</button></div>`:'';
const confrontation=o=>suspects().length>1?`<div class="v41-event-picker"><b>${esc(o.label||'CONFRONTATION')}</b><small>${esc(o.hint||'')}</small><select id="igrV41ConfrontA">${optionList()}</select><select id="igrV41ConfrontB">${optionList(suspects()[0]?.id)}</select><button class="btn primary" type="button" onclick="igrV41StartConfrontation()">${copy('Convoquer les deux joueurs','Call both players')}</button></div>`:'';
function assembly(o){
  const people=(sync()?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role));
  if(Number(room()?.cycle||0)<3)return genericEvent(o);
  return `<div class="v41-event-picker"><b>${esc(o.label||copy('ASSEMBLÉE','ASSEMBLY'))}</b><small>${esc(o.hint||'')}</small><div class="v41-assembly">${people.map(p=>`<label><input type="checkbox" data-v41-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" type="button" onclick="igrV41StartAssembly()">${copy('Ouvrir l’Assemblée','Open Assembly')}</button></div>`;
}
function eventPanel(){
  const opts=eventOptions();
  if(!opts.length)return `<div class="locked-state v41-event-empty"><b>${copy('Aucun événement reçu du serveur.','No events received from the server.')}</b><br><button class="btn ghost small" type="button" onclick="igrV41ReloadEvents()">${copy('Recharger','Reload')}</button></div>`;
  const buttons=[],special=[];
  for(const o of opts){
    if(o.key==='interrogation')special.push(interrogation(o));
    else if(o.key==='confrontation')special.push(confrontation(o));
    else if(o.key==='assembly')special.push(assembly(o));
    else buttons.push(genericEvent(o));
  }
  return `<div class="v41-event-panel"><div class="v41-event-head"><strong>${copy('ÉVÉNEMENTS DU CYCLE','CYCLE EVENTS')}</strong><span>${progress()?`${esc(progress())} ${copy('actions utilisées','actions used')} · `:''}${copy('Choisis la prochaine scène.','Choose the next scene.')}</span></div>${buttons.length?`<div class="v41-event-grid">${buttons.join('')}</div>`:''}${special.join('')}</div>`;
}
let eventStartBusy=false;
function setEventStartBusy(busy){
  const panel=document.querySelector('.v41-event-panel');
  if(!panel)return;
  if(busy)panel.setAttribute('aria-busy','true');else panel.removeAttribute('aria-busy');
  panel.querySelectorAll('button,select,input').forEach(el=>{
    if(busy){
      if(el.dataset.igrV41WasDisabled===undefined)el.dataset.igrV41WasDisabled=el.disabled?'1':'0';
      el.disabled=true;
    }else if(el.dataset.igrV41WasDisabled!==undefined){
      el.disabled=el.dataset.igrV41WasDisabled==='1';
      delete el.dataset.igrV41WasDisabled;
    }
  });
}
async function startEvent(key,targets=[]){
  if(eventStartBusy)return;
  eventStartBusy=true;setEventStartBusy(true);
  const st=S();
  try{
    if(!st?.room||!st?.token||typeof rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
    await rpc('igr_v13_start_event',{p_code:st.room,p_player_token:st.token,p_event:key,p_targets:targets});
    if(typeof syncNow==='function')await syncNow(true);
  }catch(e){console.error('[IGR v41] event',e);if(typeof toast==='function')toast(e?.message||copy('Événement impossible.','Unable to start event.'))}
  finally{eventStartBusy=false;setEventStartBusy(false)}
}
window.igrV41StartEvent=key=>startEvent(key,[]);
window.igrV41StartInterrogation=()=>{const t=document.getElementById('igrV41InterTarget')?.value;if(t)return startEvent('interrogation',[t])};
window.igrV41StartConfrontation=()=>{const a=document.getElementById('igrV41ConfrontA')?.value,b=document.getElementById('igrV41ConfrontB')?.value;if(!a||!b||a===b){if(typeof toast==='function')toast(copy('Choisis deux personnes différentes.','Choose two different people.'));return}return startEvent('confrontation',[a,b])};
window.igrV41StartAssembly=()=>startEvent('assembly',[...document.querySelectorAll('[data-v41-assembly]:checked')].map(x=>x.value));
window.igrV41ReloadEvents=async()=>{try{if(typeof syncNow==='function')await syncNow(true);if(typeof renderGame==='function')renderGame()}catch(e){console.error(e)}};

const baseInvestigation=typeof renderInvestigationTab==='function'?renderInvestigationTab:null;
const v41Investigation=function(){
  if(core()&&room()?.phase==='event_select'){
    const intro=`<div class="phase-explain"><h2>${esc(copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'))}</h2>${v41Instruction(role(),'event_select',null)}</div>`;
    return role()==='enqueteur'?intro+eventPanel():intro;
  }
  return baseInvestigation?baseInvestigation.apply(this,arguments):'';
};
try{renderInvestigationTab=v41Investigation}catch(_){}
window.renderInvestigationTab=v41Investigation;

let queued=false;
function ensureSettings(){
  if(room()?.status!=='playing')return;
  const topbar=document.querySelector('#app .topbar');if(!topbar)return;
  let actions=topbar.querySelector('.top-actions');
  if(!actions){actions=document.createElement('div');actions.className='top-actions';topbar.appendChild(actions)}
  let btn=actions.querySelector('#igrTopSettings')||[...actions.querySelectorAll('button,a,[role="button"]')].find(el=>/paramètres|settings/i.test(clean(el.textContent))||/openSettings/i.test(el.getAttribute?.('onclick')||''));
  if(!btn){btn=document.createElement('button');actions.prepend(btn)}
  for(const duplicate of [...actions.querySelectorAll('button,a,[role="button"]')]){
    if(duplicate!==btn&&(/paramètres|settings/i.test(clean(duplicate.textContent))||/openSettings/i.test(duplicate.getAttribute?.('onclick')||'')))duplicate.remove();
  }
  btn.id='igrTopSettings';btn.type='button';btn.className='pill-btn igr-top-settings';
  btn.innerHTML='<span aria-hidden="true">⚙</span>';
  btn.setAttribute('aria-label',copy('Paramètres','Settings'));btn.setAttribute('title',copy('Paramètres','Settings'));
  btn.onclick=()=>{try{if(typeof openSettings==='function')openSettings();else if(typeof window.openSettings==='function')window.openSettings()}catch(e){console.error('[IGR v41] settings',e)}};
}
function queueSettings(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureSettings()})}
const baseRenderGame=typeof renderGame==='function'?renderGame:null;
if(baseRenderGame){
  const v41RenderGame=function(){const out=baseRenderGame.apply(this,arguments);queueSettings();return out};
  try{renderGame=v41RenderGame}catch(_){}
  window.renderGame=v41RenderGame;
}
const app=document.getElementById('app');
if(app&&window.MutationObserver)new MutationObserver(queueSettings).observe(app,{childList:true,subtree:true});
addEventListener('pageshow',queueSettings,{passive:true});
setTimeout(queueSettings,0);setTimeout(queueSettings,400);

const style=document.createElement('style');style.dataset.igrV41=VERSION;style.textContent=`
.v41-event-panel{display:grid;gap:14px;transition:opacity .12s ease}.v41-event-panel[aria-busy="true"]{opacity:.72;pointer-events:none}.v41-event-head,.v41-event-picker{display:grid;gap:8px;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:#0d1217}.v41-event-head span,.v41-event-picker small{color:#9ba5ae}.v41-event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v41-event-btn{display:flex!important;flex-direction:column;align-items:flex-start!important;gap:6px;text-align:left!important;min-height:82px}.v41-event-btn small{white-space:normal;color:#9ba5ae}.v41-event-picker select{min-height:48px;border:1px solid #39424b;border-radius:13px;background:#080c10;color:#fff;padding:0 12px}.v41-assembly{display:grid;gap:8px}.v41-assembly label{display:flex;gap:9px;align-items:center}#igrTopSettings{display:inline-flex!important;align-items:center;justify-content:center;min-width:48px}@media(max-width:700px){.v41-event-grid{grid-template-columns:1fr}#igrTopSettings{width:48px;height:48px;padding:0}}
`;document.head.appendChild(style);
window.IGR_AUTHORITATIVE_V41=Object.freeze({version:VERSION,eventPanel,ensureSettings,getState:S});
console.info(`[IGR ${VERSION}] active`);
})();