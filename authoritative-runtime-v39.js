/* Inside Grey Room v39 — authoritative live-game UI repair.
   Runs from the existing language-v12.js asset so even an older installed PWA
   receives the repair without depending on a newly-added runtime filename. */
(()=>{
'use strict';
const VERSION='v39-authoritative-ui';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase();
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=()=>window.STATE?.sync||null;
const room=()=>data()?.room||null;
const player=()=>data()?.player||null;
const role=()=>player()?.public_role||window.STATE?.role||'';
const scenarioId=()=>String(room()?.scenario_id||window.STATE?.scenarioId||'');
const core=()=>CORE.has(scenarioId());
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;

/* language-v12 predates directed-cycle phases. Restore human labels/copy. */
const previousLabel=window.phaseLabel;
const labels={
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
window.phaseLabel=function(ph){
  if(core()&&labels[ph])return copy(...labels[ph]);
  return typeof previousLabel==='function'?previousLabel.apply(this,arguments):String(ph||copy('PARTIE','GAME')).toUpperCase();
};
try{phaseLabel=window.phaseLabel}catch(_){}

const previousInstruction=window.phaseInstruction;
window.phaseInstruction=function(r,ph,target){
  if(core()&&ph==='event_select'){
    const st=room()?.state||{},used=Number(st.event_slots_used||0),total=Number(st.event_slots_total||0);
    const progress=total?` <b>${copy('Progression','Progress')} : ${Math.min(used,total)}/${total}.</b>`:'';
    return r==='enqueteur'
      ? `<p>${copy('Choisis le prochain événement du cycle. Les choix ci-dessous viennent directement du serveur.','Choose the next event in the cycle. The choices below come directly from the server.')}${progress}</p>`
      : `<p>${copy('L’Enquêteur choisit le prochain événement du cycle.','The Investigator is choosing the next event in the cycle.')}</p>`;
  }
  return typeof previousInstruction==='function'?previousInstruction.apply(this,arguments):'<p></p>';
};
try{phaseInstruction=window.phaseInstruction}catch(_){}

/* The server already sends a scenario-specific objective_main. Use it directly,
   and never show an investigator a fake "what you hide" field. */
const previousPrivate=window.privateCardHtml;
window.privateCardHtml=function(){
  const html=typeof previousPrivate==='function'?String(previousPrivate.apply(this,arguments)??''):'';
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
try{privateCardHtml=window.privateCardHtml}catch(_){}

/* Event choices come exclusively from the authoritative server state. */
const suspects=()=>Array.isArray(data()?.suspects)?data().suspects:[];
const eventOptions=()=>Array.isArray(room()?.state?.event_options)?room().state.event_options:[];
const optionsHtml=(exclude='')=>suspects().filter(s=>String(s.id)!==String(exclude)).map(s=>`<option value="${esc(s.id)}">${esc(s.pseudo)}</option>`).join('');
function eventProgress(){const st=room()?.state||{},u=Number(st.event_slots_used||0),n=Number(st.event_slots_total||0);return n?`${Math.min(u,n)}/${n}`:''}
function genericEvent(o){return `<button class="btn v39-event-btn" type="button" onclick="igrV39StartEvent('${esc(o.key)}')"><b>${esc(o.label||o.key)}</b><small>${esc(o.hint||copy('Événement du cycle','Cycle event'))}</small></button>`}
function interrogation(o){return suspects().length?`<div class="v39-event-picker"><b>${esc(o.label||copy('INTERROGATOIRE','INTERROGATION'))}</b><small>${esc(o.hint||'')}</small><select id="igrV39InterTarget">${optionsHtml()}</select><button class="btn primary" type="button" onclick="igrV39StartInterrogation()">${copy('Convoquer','Call in')}</button></div>`:''}
function confrontation(o){const ss=suspects();return ss.length>1?`<div class="v39-event-picker"><b>${esc(o.label||'CONFRONTATION')}</b><small>${esc(o.hint||'')}</small><select id="igrV39ConfrontA">${optionsHtml()}</select><select id="igrV39ConfrontB">${optionsHtml(ss[0]?.id)}</select><button class="btn primary" type="button" onclick="igrV39StartConfrontation()">${copy('Convoquer les deux joueurs','Call both players')}</button></div>`:''}
function assembly(o){
  const people=(data()?.players||[]).filter(p=>['analyste','procureur','juge','inspecteur','expert','journaliste'].includes(p.public_role));
  if(Number(room()?.cycle||0)<3)return genericEvent(o);
  return `<div class="v39-event-picker"><b>${esc(o.label||copy('ASSEMBLÉE','ASSEMBLY'))}</b><small>${esc(o.hint||'')}</small><div class="v39-assembly">${people.map(p=>`<label><input type="checkbox" data-v39-assembly value="${esc(p.id)}" ${p.public_role==='analyste'?'checked disabled':''}><span>${esc(p.pseudo)} · ${esc(p.public_role)}</span></label>`).join('')}</div><button class="btn primary" type="button" onclick="igrV39StartAssembly()">${copy('Ouvrir l’Assemblée','Open Assembly')}</button></div>`;
}
function eventPanel(){
  const opts=eventOptions();
  if(!opts.length)return `<div class="locked-state v39-event-empty"><b>${copy('Aucun événement reçu du serveur.','No events received from the server.')}</b><br><button class="btn ghost small" type="button" onclick="igrV39ReloadEvents()">${copy('Recharger','Reload')}</button></div>`;
  const buttons=[],special=[];
  for(const o of opts){
    if(o.key==='interrogation')special.push(interrogation(o));
    else if(o.key==='confrontation')special.push(confrontation(o));
    else if(o.key==='assembly')special.push(assembly(o));
    else buttons.push(genericEvent(o));
  }
  return `<div class="v39-event-panel"><div class="v39-event-head"><strong>${copy('ÉVÉNEMENTS DU CYCLE','CYCLE EVENTS')}</strong><span>${eventProgress()?`${esc(eventProgress())} ${copy('actions utilisées','actions used')} · `:''}${copy('Choisis la prochaine scène.','Choose the next scene.')}</span></div>${buttons.length?`<div class="v39-event-grid">${buttons.join('')}</div>`:''}${special.join('')}</div>`;
}
async function startEvent(key,targets=[]){
  try{
    if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));
    await window.rpc('igr_v13_start_event',{p_code:window.STATE.room,p_player_token:window.STATE.token,p_event:key,p_targets:targets});
    await window.syncNow?.(true);
  }catch(e){console.error('[IGR v39] event',e);window.toast?.(e?.message||copy('Événement impossible.','Unable to start event.'))}
}
window.igrV39StartEvent=key=>startEvent(key,[]);
window.igrV39StartInterrogation=()=>{const t=document.getElementById('igrV39InterTarget')?.value;if(t)return startEvent('interrogation',[t])};
window.igrV39StartConfrontation=()=>{const a=document.getElementById('igrV39ConfrontA')?.value,b=document.getElementById('igrV39ConfrontB')?.value;if(!a||!b||a===b)return window.toast?.(copy('Choisis deux personnes différentes.','Choose two different people.'));return startEvent('confrontation',[a,b])};
window.igrV39StartAssembly=()=>startEvent('assembly',[...document.querySelectorAll('[data-v39-assembly]:checked')].map(x=>x.value));
window.igrV39ReloadEvents=async()=>{try{await window.syncNow?.(true);window.renderGame?.()}catch(e){console.error(e)}};

const previousInvestigation=window.renderInvestigationTab;
window.renderInvestigationTab=function(){
  if(core()&&room()?.phase==='event_select'){
    const intro=`<div class="phase-explain"><h2>${esc(copy('CHOIX DE L’ÉVÉNEMENT','EVENT CHOICE'))}</h2>${window.phaseInstruction(role(),'event_select',null)}</div>`;
    return role()==='enqueteur'?intro+eventPanel():intro;
  }
  return typeof previousInvestigation==='function'?previousInvestigation.apply(this,arguments):'';
};
try{renderInvestigationTab=window.renderInvestigationTab}catch(_){}

/* The base shell already has a Settings action, but the navigation CSS only
   exposes #igrTopSettings. Re-identify/recreate it after every live-game render. */
let settingsQueued=false;
function gamePlaying(){return room()?.status==='playing'}
function ensureGameSettings(){
  if(!gamePlaying())return;
  const topbar=document.querySelector('#app .topbar');if(!topbar)return;
  let actions=topbar.querySelector('.top-actions');
  if(!actions){actions=document.createElement('div');actions.className='top-actions';topbar.appendChild(actions)}
  let btn=actions.querySelector('#igrTopSettings')||[...actions.querySelectorAll('button,a,[role="button"]')].find(el=>/paramètres|settings/i.test(clean(el.textContent))||/openSettings/i.test(el.getAttribute?.('onclick')||''));
  if(!btn){btn=document.createElement('button');actions.appendChild(btn)}
  btn.id='igrTopSettings';btn.className='pill-btn igr-top-settings';btn.type='button';
  btn.innerHTML='<span aria-hidden="true">⚙</span>';
  btn.setAttribute('aria-label',copy('Paramètres','Settings'));btn.setAttribute('title',copy('Paramètres','Settings'));
  btn.onclick=()=>{try{if(typeof window.openSettings==='function')window.openSettings();else if(typeof openSettings==='function')openSettings()}catch(e){console.error('[IGR v39] settings',e)}};
}
function queueSettings(){if(settingsQueued)return;settingsQueued=true;requestAnimationFrame(()=>{settingsQueued=false;ensureGameSettings()})}
const previousRenderGame=window.renderGame;
if(typeof previousRenderGame==='function'){
  window.renderGame=function(){const out=previousRenderGame.apply(this,arguments);queueSettings();return out};
  try{renderGame=window.renderGame}catch(_){}
}
const app=document.getElementById('app');
if(app&&window.MutationObserver)new MutationObserver(queueSettings).observe(app,{childList:true,subtree:true});
addEventListener('pageshow',queueSettings,{passive:true});
setTimeout(queueSettings,0);setTimeout(queueSettings,400);

const style=document.createElement('style');style.dataset.igrV39=VERSION;style.textContent=`
.v39-event-panel{display:grid;gap:14px}.v39-event-head,.v39-event-picker{display:grid;gap:8px;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:#0d1217}.v39-event-head span,.v39-event-picker small{color:#9ba5ae}.v39-event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v39-event-btn{display:flex!important;flex-direction:column;align-items:flex-start!important;gap:6px;text-align:left!important;min-height:82px}.v39-event-btn small{white-space:normal;color:#9ba5ae}.v39-event-picker select{min-height:48px;border:1px solid #39424b;border-radius:13px;background:#080c10;color:#fff;padding:0 12px}.v39-assembly{display:grid;gap:8px}.v39-assembly label{display:flex;gap:9px;align-items:center}@media(max-width:700px){.v39-event-grid{grid-template-columns:1fr}}
`;document.head.appendChild(style);
window.IGR_AUTHORITATIVE_V39=Object.freeze({version:VERSION,eventPanel,ensureGameSettings});
console.info(`[IGR ${VERSION}] authoritative live-game repair active`);
})();
