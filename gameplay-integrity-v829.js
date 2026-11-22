/* Inside Grey Room v829 — verified activity & safe host recovery.
   Players are enrolled, not necessarily online; no browser-tab inference of absence.
   The server remains the authority for every recovery decision. */
(()=>{
'use strict';
if(window.IGR_AUDIT_V829)return;
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch(_){return window.STATE}};
const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const peers=()=>Array.isArray(latest?.peers)?latest.peers:[];
const inRoom=()=>!!(S()?.room&&S()?.token&&['lobby','briefing','role','game'].includes(S()?.view));
let latest=null,updatedAt=0,lastAttempt=0,pending=false,queued=false;
function fresh(){
 return latest && latest.room_code===String(S()?.room||'') && Date.now()-updatedAt<65000;
}
function updateText(el,text){
 if(el&&el.textContent!==text)el.textContent=text;
}
function mountStatus(parent,id,klass){
 if(!parent)return null;
 let el=parent.querySelector('#'+id);
 if(!el){el=document.createElement('p');el.id=id;el.className=klass;parent.appendChild(el);}
 return el;
}
function updateLobby(){
 const lobby=document.querySelector('#app .lobby-v11');
 if(!lobby)return;
 const roster=S()?.sync?.players||[];
 const status=lobby.querySelector('.lobby-status');
 const node=mountStatus(status,'igr829-lobby-presence','igr829-presence-status');
 if(!fresh()){
  updateText(node,tr('Connexions en cours de vérification','Checking recent activity'));
  return;
 }
 const active=peers().filter(p=>p.active).length;
 updateText(node,tr('Activité récente confirmée : '+active+'/'+roster.length,'Recently active: '+active+'/'+roster.length));
 // The player list is in the same seat order as the authenticated roster.
 const lines=[...lobby.querySelectorAll('.player-line.lobby-player-live')];
 roster.forEach((p,i)=>{
  const line=lines[i];if(!line)return;
  const peer=peers().find(x=>x.id===String(p.id));
  const badge=mountStatus(line,'igr829-player-'+i,'igr829-presence-pill');
  badge.setAttribute('data-presence',peer?.active?'recent':peer?.known?'stale':'unknown');
  updateText(badge,peer?.active?tr('ACTIF RÉCEMMENT','RECENTLY ACTIVE'):
    peer?.known?tr('ACTIVITÉ NON RÉCENTE','NOT RECENTLY ACTIVE'):
    tr('À VÉRIFIER','UNKNOWN'));
 });
}
function updateRecovery(){
 const sel=document.getElementById('igr59Absent');
 if(!sel)return;
 const wrapper=sel.closest('.igr52-card');
 const btn=wrapper?.querySelector('button[data-igr59-recovery-at]');
 if(!btn)return;
 const peer=fresh()?peers().find(x=>x.id===String(sel.value)):null;
 const phaseTime=Number(btn.dataset.igr59RecoveryAt||0);
 const elapsed=Number.isFinite(phaseTime)&&Date.now()>=phaseTime;
 const allowed=!!(peer?.eligible_to_recover&&!peer.active&&elapsed);
 btn.disabled=!allowed;
 btn.setAttribute('aria-disabled',String(!allowed));
 const note=mountStatus(wrapper,'igr829-recovery-check','igr829-recovery-note');
 const message=!fresh()?tr(
    'Vérification de la présence en cours : aucune absence n’est présumée.',
    'Checking activity: absence is not assumed.'
   ):peer?.active?tr(
    'Ce joueur était actif récemment. Impossible de le déclarer absent.',
    'This player was active recently and cannot be marked absent.'
   ):!peer?.eligible_to_recover?tr(
    'L’absence n’est pas confirmée. Patiente et vérifie oralement avant toute action.',
    'Absence is unconfirmed. Wait and check with the group before taking action.'
   ):!elapsed?tr(
    'Délai de la phase en cours : la confirmation est encore verrouillée.',
    'The phase grace period has not elapsed.'
   ):tr(
    'Inactivité prolongée vérifiée. L’hôte doit confirmer la situation avec le groupe et donner un motif.',
    'Prolonged inactivity confirmed. The host must check with the group and provide a reason.'
   );
 updateText(note,message);
}
function render(){
 updateLobby();
 updateRecovery();
}
function scheduleRender(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(()=>{queued=false;render()});
}
async function ping(force=false){
 if(!inRoom()||document.visibilityState==='hidden'||navigator.onLine===false)return;
 const now=Date.now();
 if(pending||now-lastAttempt<(force?9000:22000))return;
 lastAttempt=now;pending=true;
 const targetRoom=String(S().room),targetToken=S().token;
 try{
  const answer=await window.rpc('igr_v829_presence_status',{p_code:targetRoom,p_player_token:targetToken});
  if(S()?.room!==targetRoom||S()?.token!==targetToken)return;
  if(answer?.ok&&Array.isArray(answer.peers)){
   latest=answer;updatedAt=Date.now();
   scheduleRender();
  }
 }catch(e){
  // A network outage never becomes proof of absence.
  console.warn('[IGR v829] status unavailable',String(e?.message||e));
 }finally{pending=false;}
}
function boot(){
 if(!document.getElementById('app'))return;
 const root=document.getElementById('app');
 new MutationObserver(scheduleRender).observe(root,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(e.target?.id==='igr59Absent')scheduleRender()});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){void ping(true);scheduleRender()}
 },{passive:true});
 window.addEventListener('pageshow',()=>{void ping(true);scheduleRender()},{passive:true});
 window.addEventListener('online',()=>{void ping(true);scheduleRender()},{passive:true});
 window.addEventListener('focus',()=>{void ping(true)},{passive:true});
 window.setInterval(()=>{
  if(document.visibilityState==='visible'){
   void ping(false);
   if(fresh())scheduleRender();
  }
 },24000);
 void ping(true);
 scheduleRender();
}
window.IGR_AUDIT_V829=Object.freeze({version:'829.0',ping,render,
 getPresence:()=>fresh()?latest:null});
if(document.readyState==='complete')boot();
else window.addEventListener('load',boot,{once:true});
})();