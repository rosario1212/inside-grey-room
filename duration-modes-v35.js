/* Inside Grey Room — v35 duration modes + timer end alarm */
(()=>{
'use strict';
const VERSION='35.0-duration-modes';
const STORE_KEY='igr_duration_modes_v35';
const MODES=Object.freeze({
  short:Object.freeze({
    labelFr:'COURT',labelEn:'SHORT',estimate:'≈ 40–55 min',
    preInvestigation:120,interrogation:300,cycleDebrief:90,confrontation:120,assembly:150,
    judicialShort:90,judicialLong:120,witness:180,finalDebrief:120
  }),
  long:Object.freeze({
    labelFr:'LONG',labelEn:'LONG',estimate:'≈ 70–90 min',
    preInvestigation:180,interrogation:480,cycleDebrief:120,confrontation:240,assembly:240,
    judicialShort:120,judicialLong:240,witness:240,finalDebrief:180
  }),
  legacy:Object.freeze({
    labelFr:'LONG',labelEn:'LONG',estimate:'',
    preInvestigation:120,interrogation:360,cycleDebrief:120,confrontation:240,assembly:240,
    judicialShort:120,judicialLong:180,witness:240,finalDebrief:120
  })
});
window.IGR_DURATION_MODES_V35={version:VERSION,modes:MODES,defaultMode:'long'};

function store(){try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}}
function isEnglish(){return (window.IGR_LOCALE||document.documentElement.lang||'fr').toLowerCase().startsWith('en')}
function readChoices(){try{return JSON.parse(store().getItem(STORE_KEY)||'{}')||{}}catch{return{}}}
function writeChoices(map){try{store().setItem(STORE_KEY,JSON.stringify(map))}catch{}}
function normalizeMode(v){return v==='short'||v==='long'?v:'long'}
function selectedModeForScenario(id){return normalizeMode(readChoices()[String(id||'')])}
function saveMode(id,mode){const map=readChoices();map[String(id||'')]=normalizeMode(mode);writeChoices(map)}
function roomMode(){
  const raw=window.STATE?.sync?.room?.state?.duration_mode;
  return raw==='short'||raw==='long'?raw:'legacy';
}
function cfg(mode=roomMode()){return MODES[mode]||MODES.legacy}
function mmss(seconds){seconds=Math.max(0,Number(seconds)||0);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
function compact(seconds){seconds=Math.max(0,Number(seconds)||0);const m=Math.floor(seconds/60),s=seconds%60;return s?`${m} min ${String(s).padStart(2,'0')}`:`${m} min`}
function label(mode){const c=MODES[mode]||MODES.long;return isEnglish()?c.labelEn:c.labelFr}

function scenarioIdFromCell(cell){
  const direct=String(cell?.dataset?.scenarioId||cell?.id||'').match(/(?:scenario-)?(\d{3})/);
  if(direct)return direct[1];
  const click=cell?.getAttribute?.('onclick')||'';const m=click.match(/['\"](\d{3})['\"]/);return m?.[1]||'';
}
function durationTabs(id){
  const chosen=selectedModeForScenario(id);
  return `<div class="igr-duration-v35" data-duration-for="${id}" role="group" aria-label="${isEnglish()?'Game duration':'Durée de la partie'}">
    <button type="button" class="igr-duration-tab-v35 ${chosen==='short'?'is-active':''}" data-mode="short" onclick="event.preventDefault();event.stopPropagation();igrSetDurationModeV35('${id}','short')" aria-pressed="${chosen==='short'}"><span>${isEnglish()?'SHORT':'COURT'}</span><small>${MODES.short.estimate}</small></button>
    <button type="button" class="igr-duration-tab-v35 ${chosen==='long'?'is-active':''}" data-mode="long" onclick="event.preventDefault();event.stopPropagation();igrSetDurationModeV35('${id}','long')" aria-pressed="${chosen==='long'}"><span>LONG</span><small>${MODES.long.estimate}</small></button>
  </div>`;
}
function decorateScenarioCells(){
  document.querySelectorAll('[id^="scenario-"]').forEach(cell=>{
    const id=scenarioIdFromCell(cell);if(!/^0(?:0[1-9]|[12]\d|3[0-4])$/.test(id)||cell.querySelector('.igr-duration-v35'))return;
    const body=cell.querySelector('.scenario-body')||cell.querySelector('.scenario-content')||cell;
    const holder=document.createElement('div');holder.innerHTML=durationTabs(id);const tabs=holder.firstElementChild;
    const tagRow=body.querySelector('.tag-row');if(tagRow?.parentNode)tagRow.insertAdjacentElement('afterend',tabs);else body.appendChild(tabs);
  });
}
function refreshTabs(id){
  document.querySelectorAll(`.igr-duration-v35[data-duration-for="${CSS.escape(String(id))}"]`).forEach(group=>{
    const chosen=selectedModeForScenario(id);
    group.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===chosen;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});
  });
}
window.igrSetDurationModeV35=(id,mode)=>{saveMode(id,mode);refreshTabs(id)};

const observer=new MutationObserver(()=>queueMicrotask(decorateScenarioCells));
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',decorateScenarioCells,{once:true});
setTimeout(decorateScenarioCells,0);

/* Persist the selected preset in the room before the game can start. */
const baseCreateRoom=window.createRoom;
if(typeof baseCreateRoom==='function'){
  window.createRoom=async function(){
    const scenarioId=String(window.STATE?.selectedScenario||window.STATE?.scenarioId||'');
    const mode=selectedModeForScenario(scenarioId);
    const out=await baseCreateRoom.apply(this,arguments);
    if(window.STATE?.room&&window.STATE?.hostToken&&typeof window.rpc==='function'){
      try{
        await window.rpc('igr_v35_set_duration_mode',{p_code:window.STATE.room,p_host_token:window.STATE.hostToken,p_mode:mode});
        if(typeof window.syncNow==='function')await window.syncNow(true);
        if(typeof window.renderLobby==='function')window.renderLobby();
      }catch(error){console.warn('[IGR v35] duration mode sync',error);if(typeof window.toast==='function')window.toast(isEnglish()?'Duration mode could not be saved.':'Le format de durée n’a pas pu être enregistré.');}
    }
    return out;
  };
}

/* Keep visible copy aligned with the server preset. */
function replaceTime(html,patterns,seconds){let out=String(html??'');for(const re of patterns)out=out.replace(re,mmss(seconds));return out}
function replaceMinuteLabel(html,patterns,seconds){let out=String(html??'');for(const re of patterns)out=out.replace(re,compact(seconds));return out}
const basePhaseInstruction=window.phaseInstruction;
if(typeof basePhaseInstruction==='function'){
  window.phaseInstruction=function(role,phase,target){
    let html=basePhaseInstruction.apply(this,arguments);const c=cfg();
    if(phase==='initial_debrief')html=replaceTime(html,[/0[23]:00/g],c.preInvestigation);
    else if(phase==='interrogation')html=replaceTime(html,[/0[568]:00/g],c.interrogation);
    else if(phase==='cycle_debrief')html=replaceTime(html,[/02:00/g,/01:30/g],c.cycleDebrief);
    else if(phase==='event_confrontation')html=replaceTime(html,[/0[234]:00/g],c.confrontation);
    else if(phase==='event_assembly')html=replaceTime(html,[/0[234]:00/g,/02:30/g],c.assembly);
    else if(phase==='event_requete'||phase==='event_saisine')html=replaceTime(html,[/0[1234]:00/g,/01:30/g],c.judicialShort);
    else if(phase==='annex_juge')html=replaceTime(html,[/0[234]:00/g],c.judicialLong);
    else if(phase==='annex_temoin')html=replaceTime(html,[/0[234]:00/g],c.witness);
    else if(phase==='final_debrief')html=replaceTime(html,[/0[23]:00/g],c.finalDebrief);
    return html;
  };
}

const baseInterrogationSelect=window.renderInterrogationSelect;
if(typeof baseInterrogationSelect==='function'){
  window.renderInterrogationSelect=function(){
    let html=baseInterrogationSelect.apply(this,arguments);const sec=cfg().interrogation;
    html=replaceMinuteLabel(html,[/(?:6|8) min/g,/5 min/g],sec);
    html=replaceTime(html,[/0[568]:00/g],sec);return html;
  };
}
const baseInvestigationTab=window.renderInvestigationTab;
if(typeof baseInvestigationTab==='function'){
  window.renderInvestigationTab=function(){
    let html=baseInvestigationTab.apply(this,arguments);const c=cfg();
    html=html.replace(/Convoquer · (?:5|6|8) min/g,`Convoquer · ${compact(c.interrogation)}`)
      .replace(/Convoquer les deux joueurs · (?:2|3|4) min(?: 30)?/g,`Convoquer les deux joueurs · ${compact(c.confrontation)}`)
      .replace(/Ouvrir l[’']Assemblée · (?:2|3|4) min(?: 30)?/g,`Ouvrir l’Assemblée · ${compact(c.assembly)}`);
    return html;
  };
}

/* Short, single, non-looping end-of-timer alarm. The first user gesture unlocks it on iOS. */
let alarmCtx=null;
function audioAllowed(){
  try{if(window.SOUND&&window.SOUND.enabled===false)return false;if(window.STATE?.settings?.sound===false)return false}catch{}
  return true;
}
function ensureAlarmAudio(){
  if(!audioAllowed())return null;
  try{
    if(!alarmCtx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;alarmCtx=new Ctx()}
    if(alarmCtx.state==='suspended')alarmCtx.resume().catch(()=>{});
    return alarmCtx;
  }catch{return null}
}
function playEndAlarm(){
  const ac=ensureAlarmAudio();if(!ac||ac.state==='closed')return;
  try{
    const now=ac.currentTime,osc=ac.createOscillator(),gain=ac.createGain();
    osc.type='triangle';osc.frequency.setValueAtTime(880,now);gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(0.07,now+0.012);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.22);
    osc.connect(gain);gain.connect(ac.destination);osc.start(now);osc.stop(now+0.23);
  }catch{}
}
document.addEventListener('pointerdown',ensureAlarmAudio,{capture:true,once:true,passive:true});
document.addEventListener('keydown',ensureAlarmAudio,{capture:true,once:true});
let timerKey='',previousSeconds=null,alarmFired='';
function timerSnapshot(){
  const room=window.STATE?.sync?.room;if(!room||!room.phase_ends_at)return null;
  const offset=Number(window.STATE?.serverOffset)||0;const end=Date.parse(room.phase_ends_at);if(!Number.isFinite(end))return null;
  const seconds=Math.max(0,Math.ceil((end-(Date.now()+offset))/1000));
  return {key:`${room.code||window.STATE?.room||''}|${room.phase||''}|${room.phase_started_at||''}|${room.phase_ends_at}`,seconds};
}
function watchTimerEnd(){
  const snap=timerSnapshot();if(!snap){timerKey='';previousSeconds=null;return}
  if(snap.key!==timerKey){timerKey=snap.key;previousSeconds=snap.seconds;return}
  if(previousSeconds!==null&&previousSeconds>0&&snap.seconds===0&&alarmFired!==snap.key){alarmFired=snap.key;playEndAlarm()}
  previousSeconds=snap.seconds;
}
setInterval(watchTimerEnd,250);
})();
