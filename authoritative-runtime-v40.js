/* Inside Grey Room v40 — authoritative live-game UI.
   Loaded last from index.html so older language/gameplay layers cannot overwrite it.
   Important: app-v11 declares STATE as a global lexical const, not window.STATE. */
(()=>{
'use strict';
const VERSION='v40-authoritative-ui';
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

/* Human labels for the directed event phases. */
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
const v40PhaseLabel=function(ph){
  if(core()&&PHASE_LABELS[ph])return copy(...PHASE_LABELS[ph]);
  return basePhaseLabel?basePhaseLabel.apply(this,arguments):String(ph||copy('PARTIE','GAME')).toUpperCase();
};
try{phaseLabel=v40PhaseLabel}catch(_){}
window.phaseLabel=v40PhaseLabel;

const baseInstruction=typeof phaseInstruction==='function'?phaseInstruction:null;
const v40Instruction=function(r,ph,target){
  if(core()&&ph==='event_select'){
    const st=room()?.state||{},used=Number(st.event_slots_used||0),total=Number(st.event_slots_total||0);
    const progress=total?` <b>${copy('Progression','Progress')} : ${Math.min(used,total)}/${total}.</b>`:'';
    return r==='enqueteur'
      ? `<p>${copy('Choisis le prochain événement du cycle. Les choix ci-dessous viennent du serveur.','Choose the next event in the cycle. The choices below come directly from the server.')}${progress}</p>`
      : `<p>${copy('L’Enquêteur choisit le prochain événement du cycle.','The Investigator is choosing the next event in the cycle.')}</p>`;
  }
  return baseInstruction?baseInstruction.apply(this,arguments):'<p></p>';
};
try{phaseInstruction=v40Instruction}catch(_){}
window.phaseInstruction=v40Instruction;

/* Private cards: suspect objective comes from the authoritative scenario pack.
   Investigator never receives a meaningless "what you hide" block. */
const basePrivate=typeof privateCardHtml==='function'?privateCardHtml:null;
const v40PrivateCard=function(){
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
        if(title==='ce que tu gardes pour toi'||title==='what you keep to yourself'||title==='what you hide')block.remove();
      }
    }
    return t.innerHTML;
  }catch(_){return html}
};
try{privateCardHtml=v40PrivateCard}catch(_){}
window.privateCardHtml=v40PrivateCard;

/* Authoritative cycle-event selection. */
const suspects=()=>Array.isArray(sync()?.suspects)?sync().suspects:[];
const eventOptions=()=>Array.isArray(room()?.state?.event_options)?room().state.event_options:[];
const optionList=(exclude='')=>suspects().filter(x=>String(x.id)!==String(exclude)).map(x=>`<option value="${esc(x.id)}">${esc(x.pseudo)}</option>`).join('');
const progress=()=>{const st=room()?.state||{},u=Number(st.event_slots_used||0),n=Number(st.event_slots_total||0);return n?`${Math.min(u,n)}/${n}`:''};
const genericEvent=o=>`<button class="btn v40-event-btn" type="button" onclick="igrV40StartEvent('${esc(o.key)}')"><b>${esc(o.label||o.key)}</b><small>${esc(o.hint||copy('Événement du cycle','Cycle event'))}</small></button>`;
const interrogation=o=>suspects().length?`<div class="v40-event-picker"><b>${esc(o.label||copy('INTERROGATOIRE','INTERROGATION'))}</b><small>${esc(o.hint||'')}</small><select id="igrV40InterTarget">${optionList()}</select><button class="btn primary" type="button" onclick="igrV40StartInterrogation()">${copy('Convoquer','Call in')}</button></div>`:'';
const confrontation=o=>suspects().length>1?`<div class="v40-event-picker"><b>${esc(o.label||'CONFRONTATION')}</b><small>${esc(o.hint||'')}</small><select id="igrV40ConfrontA">${optionList()}</select><select id="igrV40ConfrontB">${optionList(suspects()[0]?.id)}</select><button class="btn primary" type="button" onclick="igrV40StartConfrontation()">${copy('Convoquer les deux joueurs','Call both players')}</button></div>`:'';
function assembly(o){
  const people=(sync()?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role));
  if(Number(room()?.cycle||0)<3)return genericEvent(o);
  return `<div class="v40-event-picker"><b>${esc(o.label||copy('ASSEMBLÉE','ASSEMBLY'))}</b><small>${esc(o.hint||'')}</small><div class="v40-assembly">${people.map(p=>`<label><input type="checkbox" data-v40-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" type="button" onclick="igrV40StartAssembly()">${copy('Ouvrir l’Assemblée','Open Assembly')}</button></div>`;
}
function eventPanel(){
  const opts=eventOptions();
  if(!opts.length)return `<div class="locked-state v40-event-empty"><b>${copy('Aucun événement reçu du serveur.','No events received from the server.')}</b><br><button class="btn ghost small" type="button" onclick="igrV40ReloadEvents()">${copy('Recharger','Reload')}</button></div>`;
  const buttons=[],special=[];
  for(const o of opts){
    if(o.key==='interrogation')special.push(interrogation(o));
    else if(o.key==='confrontation')special.push(confrontation(o));
    else if(o.key==='assembly')special.push(assembly(o));
    else buttons.push(genericEvent(o));
  }
  return `<div class="v40-event-panel"><div class="v40-event-head"><strong>${copy('ÉVÉNEMENTS DU CYCLE','CYCLE EVENTS')}</strong><span>${progress()?`${esc(progress())} ${copy('actions utilisées','actions used')} · `:''}${copy('Choisis la prochaine scène.','Choose the next scene.')}</span></div>${buttons.length?`<div class="v40-event-grid">${buttons.join('')}</div>`:''}${special.join('')}</div>`;
}
let eventStartBusy=false;
function setEventStartBusy(busy){
  const panel=document.querySelector('.v40-event-panel');
  if(!panel)return;
  if(busy)panel.setAttribute('aria-busy','true');else panel.removeAttribute('aria-busy');
  panel.querySelectorAll('button,select,input').forEach(el=>{
    if(busy){
      if(el.dataset.igrV40WasDisabled===undefined)el.dataset.igrV40WasDisabled=el.disabled?'1':'0';
      el.disabled=true;
    }else if(el.dataset.igrV40WasDisabled!==undefined){
      el.disabled=el.dataset.igrV40WasDisabled==='1';
      delete el.dataset.igrV40WasDisabled;
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
  }catch(e){console.error('[IGR v40] event',e);if(typeof toast==='function')toast(e?.message||copy('Événement impossible.','Unable to start event.'))}
  finally{eventStartBusy=false;setEventStartBusy(false)}
}
window.igrV40StartEvent=key=>startEvent(key,[]);
window.igrV40StartInterrogation=()=>{const t=document.getElementById('igrV40InterTarget')?.value;if(t)return startEvent('interrogation',[t])};
window.igrV40StartConfrontation=()=>{const a=document.getElementById('igrV40ConfrontA')?.value,b=document.getElementById('igrV40ConfrontB')?.value;if(!a||!b||a===b){if(typeof toast==='function')toast(copy('Choisis deux personnes différentes.','Choose two different people.'));return}return startEvent('confrontation',[a,b])};
window.igrV40StartAssembly=()=>startEvent('assembly',[...document.querySelectorAll('[data-v40-assembly]:checked')].map(x=>x.value));
window.igrV40ReloadEvents=async()=>{try{if(typeof syncNow==='function')await syncNow(true);if(typeof renderGame==='function')renderGame()}catch(e){console.error(e)}};

const baseInvestigation=typeof renderInvestigationTab==='function'?renderInvestigationTab:null;
const v40Investigation=function(){
  if(core()&&room()?.phase==='event_select'){
    const intro=`<div class="phase-explain"><h2>${esc(copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'))}</h2>${v40Instruction(role(),'event_select',null)}</div>`;
    return role()==='enqueteur'?intro+eventPanel():intro;
  }
  return baseInvestigation?baseInvestigation.apply(this,arguments):'';
};
try{renderInvestigationTab=v40Investigation}catch(_){}
window.renderInvestigationTab=v40Investigation;

/* Settings is always available during a live match. */
let queued=false;
function ensureSettings(){
  if(room()?.status!=='playing')return;
  const topbar=document.querySelector('#app .topbar');
  if(!topbar)return;
  let actions=topbar.querySelector('.top-actions');
  if(!actions){actions=document.createElement('div');actions.className='top-actions';topbar.appendChild(actions)}
  let btn=actions.querySelector('#igrTopSettings');
  if(!btn){btn=document.createElement('button');actions.prepend(btn)}
  btn.id='igrTopSettings';btn.type='button';btn.className='pill-btn igr-top-settings';
  btn.innerHTML='<span aria-hidden="true">⚙</span>';
  btn.setAttribute('aria-label',copy('Paramètres','Settings'));btn.setAttribute('title',copy('Paramètres','Settings'));
  btn.onclick=()=>{try{if(typeof openSettings==='function')openSettings();else if(typeof window.openSettings==='function')window.openSettings()}catch(e){console.error('[IGR v40] settings',e)}};
}
function queueSettings(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureSettings()})}
const baseRenderGame=typeof renderGame==='function'?renderGame:null;
if(baseRenderGame){
  const v40RenderGame=function(){const out=baseRenderGame.apply(this,arguments);queueSettings();return out};
  try{renderGame=v40RenderGame}catch(_){}
  window.renderGame=v40RenderGame;
}
const app=document.getElementById('app');
if(app&&window.MutationObserver)new MutationObserver(queueSettings).observe(app,{childList:true,subtree:true});
addEventListener('pageshow',queueSettings,{passive:true});
setTimeout(queueSettings,0);setTimeout(queueSettings,400);

const style=document.createElement('style');
style.dataset.igrV40=VERSION;
style.textContent=`
.v40-event-panel{display:grid;gap:14px;transition:opacity .12s ease}.v40-event-panel[aria-busy="true"]{opacity:.72;pointer-events:none}.v40-event-head,.v40-event-picker{display:grid;gap:8px;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:#0d1217}.v40-event-head span,.v40-event-picker small{color:#9ba5ae}.v40-event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v40-event-btn{display:flex!important;flex-direction:column;align-items:flex-start!important;gap:6px;text-align:left!important;min-height:82px}.v40-event-btn small{white-space:normal;color:#9ba5ae}.v40-event-picker select{min-height:48px;border:1px solid #39424b;border-radius:13px;background:#080c10;color:#fff;padding:0 12px}.v40-assembly{display:grid;gap:8px}.v40-assembly label{display:flex;gap:9px;align-items:center}#igrTopSettings{display:inline-flex!important;align-items:center;justify-content:center;min-width:48px}@media(max-width:700px){.v40-event-grid{grid-template-columns:1fr}#igrTopSettings{width:48px;height:48px;padding:0}}
`;
document.head.appendChild(style);
window.IGR_AUTHORITATIVE_V40=Object.freeze({version:VERSION,eventPanel,ensureSettings});
console.info(`[IGR ${VERSION}] active`);
})();