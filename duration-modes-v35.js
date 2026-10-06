/* Inside Grey Room — v35.2 duration modes + timer end alarm */
(()=>{
'use strict';
const STORE_KEY='igr_duration_modes_v35';
const MODES={
 short:{estimate:'≈ 40–55 min',preInvestigation:120,interrogation:360,cycleDebrief:90,confrontation:120,assembly:150,judicialShort:90,judicialLong:120,witness:180,finalDebrief:120},
 long:{estimate:'≈ 70–90 min',preInvestigation:180,interrogation:360,cycleDebrief:120,confrontation:240,assembly:240,judicialShort:120,judicialLong:240,witness:240,finalDebrief:240},
 legacy:{estimate:'',preInvestigation:120,interrogation:360,cycleDebrief:120,confrontation:240,assembly:240,judicialShort:120,judicialLong:180,witness:240,finalDebrief:120}
};
window.IGR_DURATION_MODES_V35={version:'35.2-duration-lobby',modes:MODES,defaultMode:'long',estimate};
function state(){try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch{return window.STATE||null}}
function store(){try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}}
function en(){return (window.IGR_LOCALE||document.documentElement.lang||'fr').toLowerCase().startsWith('en')}
function choices(){try{return JSON.parse(store().getItem(STORE_KEY)||'{}')||{}}catch{return{}}}
function mode(v){return v==='short'||v==='long'?v:'long'}
function selected(id){return mode(choices()[String(id||'')])}
function save(id,m){const x=choices();x[String(id||'')]=mode(m);try{store().setItem(STORE_KEY,JSON.stringify(x))}catch{}}
function roomMode(){const v=state()?.sync?.room?.state?.duration_mode;return v==='short'||v==='long'?v:'legacy'}
function cfg(){return MODES[roomMode()]||MODES.legacy}
function mmss(s){s=Math.max(0,Number(s)||0);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function compact(s){s=Math.max(0,Number(s)||0);const m=Math.floor(s/60),r=s%60;return r?`${m} min ${String(r).padStart(2,'0')}`:`${m} min`}
function currentScenarioId(){return String(state()?.sync?.room?.scenario_id||state()?.scenarioId||state()?.selectedScenario||'')}
let pendingMode=null;
function effectiveMode(id){
 const sid=String(id||'');
 if(pendingMode&&pendingMode.id===sid)return pendingMode.mode;
 const r=roomMode();
 if(r==='short'||r==='long')return r;
 return selected(sid);
}
function estimate(m){const roster=state()?.sync?.players||[];if(!roster.length)return MODES[m].estimate;const speech=m==='short'?1:2,defense=m==='short'?2:5;let audiences=0,suspects=0,lawyers=0;for(const p of roster){const role=p.public_role==='en_attente'?p.preferred_role:p.public_role;if(['enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste'].includes(role))audiences++;if(role==='suspect')suspects++;if(role==='maitre')lawyers++;}if(!suspects||!audiences)return MODES[m].estimate;const delta=audiences*speech+suspects*defense+lawyers*speech-(3*speech+3*defense+speech);return `≈ ${Math.max(m==='short'?25:45,(m==='short'?40:70)+delta)}–${Math.max(m==='short'?35:55,(m==='short'?55:90)+delta)} min`}
function tabs(id){
 const sid=String(id||''),m=effectiveMode(sid),readOnly=!state()?.hostToken;
 const ownerHint=readOnly?(en()?'Selected by the host':'Choisi par l’hôte'):'';
 return `<div class="igr-duration-v35 igr-duration-lobby-v35" data-duration-for="${sid}" role="group" aria-label="${en()?'Game duration':'Durée de la partie'}"><button type="button" class="igr-duration-tab-v35 ${m==='short'?'is-active':''}" data-mode="short" aria-pressed="${m==='short'}" ${readOnly?'disabled aria-disabled="true"':''} ${ownerHint?`title="${ownerHint}"`:''} onclick="igrSetDurationModeV35(event,'${sid}','short')"><span>${en()?'SHORT':'COURT'}</span><small>${estimate('short')}</small></button><button type="button" class="igr-duration-tab-v35 ${m==='long'?'is-active':''}" data-mode="long" aria-pressed="${m==='long'}" ${readOnly?'disabled aria-disabled="true"':''} ${ownerHint?`title="${ownerHint}"`:''} onclick="igrSetDurationModeV35(event,'${sid}','long')"><span>LONG</span><small>${estimate('long')}</small></button><small class="igr-duration-note">${en()?'Estimate for selected roles, excluding manual pauses and extended waiting.':'Estimation selon les rôles choisis, hors pauses et attentes prolongées.'}</small></div>`;
}
function cleanupScenarioSelectors(){
 document.querySelectorAll('.scenario-list .igr-duration-v35,.scenario-list-v10-13 .igr-duration-v35').forEach(node=>node.remove());
}
function refresh(id){
 const sid=String(id||''),activeMode=effectiveMode(sid),readOnly=!state()?.hostToken;
 document.querySelectorAll(`.igr-duration-v35[data-duration-for="${sid}"]`).forEach(g=>g.querySelectorAll('[data-mode]').forEach(b=>{
  const small=b.querySelector('small');if(small)small.textContent=estimate(b.dataset.mode);const active=b.dataset.mode===activeMode;
  b.classList.toggle('is-active',active);
  b.setAttribute('aria-pressed',String(active));
  if(g.classList.contains('igr-duration-lobby-v35')){
   b.disabled=readOnly;
   b.setAttribute('aria-disabled',String(readOnly));
  }
 }));
}
function mountLobbySelector(){
 cleanupScenarioSelectors();
 const panel=document.querySelector('.lobby-v11');
 const code=panel?.querySelector('.lobby-code');
 if(!panel||!code)return;
 const id=currentScenarioId();
 if(!/^\d{3}$/.test(id))return;
 let node=panel.querySelector('.igr-duration-lobby-v35');
 if(!node){
  const wrap=document.createElement('div');
  wrap.innerHTML=tabs(id);
  node=wrap.firstElementChild;
  code.insertAdjacentElement('beforebegin',node);
 }else if(node.dataset.durationFor!==id){
  const wrap=document.createElement('div');
  wrap.innerHTML=tabs(id);
  node.replaceWith(wrap.firstElementChild);
 }else refresh(id);
}
let syncingMode=false;
window.igrSetDurationModeV35=async(ev,id,m)=>{
 ev?.preventDefault?.();ev?.stopPropagation?.();
 const sid=String(id||''),chosen=mode(m),s=state();
 if(!s?.room||!s?.hostToken){refresh(sid);return}
 if(syncingMode)return;
 const before=effectiveMode(sid);
 pendingMode={id:sid,mode:chosen};save(sid,chosen);refresh(sid);
 const rpcFn=typeof rpc==='function'?rpc:window.rpc;
 if(typeof rpcFn!=='function'){pendingMode=null;save(sid,before);refresh(sid);return}
 syncingMode=true;
 try{
  await rpcFn('igr_v35_set_duration_mode',{p_code:s.room,p_host_token:s.hostToken,p_mode:chosen});
  const syncFn=typeof syncNow==='function'?syncNow:window.syncNow;
  if(typeof syncFn==='function')await syncFn(true);
 }catch(err){
  console.warn('[IGR v35.2] duration mode sync',err);
  save(sid,before);
  const toastFn=typeof toast==='function'?toast:window.toast;
  if(typeof toastFn==='function')toastFn(en()?'Duration mode could not be saved.':'Le format de durée n’a pas pu être enregistré.');
 }finally{
  pendingMode=null;syncingMode=false;refresh(sid);queueMicrotask(mountLobbySelector);
 }
};
new MutationObserver(()=>queueMicrotask(mountLobbySelector)).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',mountLobbySelector,{once:true});setTimeout(mountLobbySelector,0);

function timeReplace(html,patterns,seconds){let out=String(html??'');for(const p of patterns)out=out.replace(p,mmss(seconds));return out}
const baseLabel=window.phaseLabel;
if(typeof baseLabel==='function')window.phaseLabel=function(ph){const out=baseLabel.apply(this,arguments);if(roomMode()==='legacy')return out;const c=cfg();if(ph==='initial_debrief')return `${en()?'PRE-INVESTIGATION':'PRÉ-ENQUÊTE'} · ${mmss(c.preInvestigation)}`;if(ph==='cycle_debrief')return `${en()?'DEBRIEF':'DÉBRIEF'} · ${mmss(c.cycleDebrief)}`;if(ph==='final_debrief')return `${en()?'FINAL DEBRIEF':'DERNIER DÉBRIEF'} · ${mmss(c.finalDebrief)}`;return out};
const baseInstruction=window.phaseInstruction;
if(typeof baseInstruction==='function')window.phaseInstruction=function(role,phase,target){let html=baseInstruction.apply(this,arguments),c=cfg();if(phase==='initial_debrief')html=timeReplace(html,[/0[23]:00/g],c.preInvestigation);else if(phase==='interrogation')html=timeReplace(html,[/0[568]:00/g],c.interrogation);else if(phase==='cycle_debrief')html=timeReplace(html,[/02:00/g,/01:30/g],c.cycleDebrief);else if(phase==='event_confrontation')html=timeReplace(html,[/0[234]:00/g],c.confrontation);else if(phase==='event_assembly')html=timeReplace(html,[/0[234]:00/g,/02:30/g],c.assembly);else if(phase==='event_requete'||phase==='event_saisine')html=timeReplace(html,[/0[1234]:00/g,/01:30/g],c.judicialShort);else if(phase==='annex_juge')html=timeReplace(html,[/0[234]:00/g],c.judicialLong);else if(phase==='annex_temoin')html=timeReplace(html,[/0[234]:00/g],c.witness);else if(phase==='final_debrief')html=timeReplace(html,[/0[234]:00/g],c.finalDebrief);return html};
const baseInterSelect=window.renderInterrogationSelect;
if(typeof baseInterSelect==='function')window.renderInterrogationSelect=function(){let html=String(baseInterSelect.apply(this,arguments)??''),s=cfg().interrogation;return timeReplace(html.replace(/Convoquer · (?:5|6|8) min/g,`Convoquer · ${compact(s)}`),[/0[568]:00/g],s)};
const baseInvestigation=window.renderInvestigationTab;
if(typeof baseInvestigation==='function')window.renderInvestigationTab=function(){let html=String(baseInvestigation.apply(this,arguments)??''),c=cfg();return html.replace(/Convoquer · (?:5|6|8) min/g,`Convoquer · ${compact(c.interrogation)}`).replace(/Convoquer les deux joueurs · (?:2|3|4) min(?: 30)?/g,`Convoquer les deux joueurs · ${compact(c.confrontation)}`).replace(/Ouvrir l[’']Assemblée · (?:2|3|4) min(?: 30)?/g,`Ouvrir l’Assemblée · ${compact(c.assembly)}`)};

let ac=null;
function soundOn(){try{return !(window.SOUND&&window.SOUND.enabled===false)&&state()?.settings?.sound!==false}catch{return true}}
function audio(){if(!soundOn())return null;try{if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C()}if(ac.state==='suspended')ac.resume().catch(()=>{});return ac}catch{return null}}
function beep(){const a=audio();if(!a||a.state==='closed')return;try{const n=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(880,n);g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.07,n+.012);g.gain.exponentialRampToValueAtTime(.0001,n+.22);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+.23)}catch{}}
document.addEventListener('pointerdown',audio,{capture:true,once:true,passive:true});document.addEventListener('keydown',audio,{capture:true,once:true});
let key='',prev=null,fired='';
function snap(){const s=state(),r=s?.sync?.room;if(!r?.phase_ends_at)return null;const end=Date.parse(r.phase_ends_at);if(!Number.isFinite(end))return null;return {key:`${r.code||s?.room||''}|${r.phase||''}|${r.phase_started_at||''}|${r.phase_ends_at}`,seconds:Math.max(0,Math.ceil((end-(Date.now()+(Number(s?.serverOffset)||0)))/1000))}}
setInterval(()=>{const x=snap();if(!x){key='';prev=null;return}if(x.key!==key){key=x.key;prev=x.seconds;return}if(prev!==null&&prev>0&&x.seconds===0&&fired!==x.key){fired=x.key;beep()}prev=x.seconds},250);
})();
