/* TERROR v694: three live military orders/cycle; separate witness visits and confrontations. */
(()=>{
'use strict';
const scenarios=new Set(['026','027','028']),cache=new Map();
const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx=()=>STATE?.sync;
const officer=()=>scenarios.has(String(ctx()?.room?.scenario_id||''))&&ctx()?.player?.public_role==='officier_liaison';
const key=()=>[STATE.room,STATE.token,ctx()?.room?.cycle].join(':');
const allowed=()=>officer()&&STATE?.view==='game'&&ctx()?.room?.status==='playing';
const isHearing=()=>['interrogation','event_confrontation'].includes(ctx()?.room?.phase);
let lastPoll=0,busy=false,lastShown='';
function poll(force=false){
 if(!allowed())return;
 const now=Date.now();if(busy||(!force&&now-lastPoll<5000))return;
 lastPoll=now;busy=true;const k=key();
 rpc('igr_v694_terror_orders',{p_code:STATE.room,p_player_token:STATE.token})
 .then(data=>{
   if(!allowed()||key()!==k)return;
   const prior=JSON.stringify(cache.get(k)||{});
   cache.set(k,data||{enabled:false});
   if(prior!==JSON.stringify(data||{})&&typeof renderCurrent==='function')renderCurrent();
 }).catch(err=>{console.warn('terror v694 command unavailable',err);
   if(key()===k)cache.set(k,{enabled:false,error:true});
 }).finally(()=>{busy=false});
}
function countdown(){
 const el=document.getElementById('terrorV694Countdown');
 if(!el)return;
 const x=cache.get(key()),a=x?.active;
 if(!a||!a.expires_at){el.textContent='—';return}
 if(isHearing()||a.paused_at){el.textContent='EN PAUSE · SÉANCE EN COURS';return}
 const sec=Math.max(0,Math.ceil((Date.parse(a.expires_at)-Date.now())/1000));
 el.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 if(sec===0)poll(true);
}
window.terrorV694Confirm=async(slot,choice)=>{
 if(!allowed())return;
 const a=cache.get(key())?.active;
 if(Number(a?.slot)!==Number(slot)||isHearing())return;
 for(const el of document.querySelectorAll('.terror-v694-command button'))el.disabled=true;
 try{
  const res=await rpc('igr_v694_terror_confirm',{p_code:STATE.room,p_player_token:STATE.token,p_slot:Number(slot),p_choice:choice});
  cache.delete(key());await syncNow(true);poll(true);
  toast(res?.result?.auto?'Délai dépassé : ordre de sécurité automatiquement appliqué.':'Ordre exécuté : les conséquences sont visibles immédiatement.');
 }catch(err){console.error('terror confirm',err);toast('Cet ordre a expiré ou ne correspond plus à la situation actuelle.');poll(true);}
};
window.terrorV694Join=async(kind)=>{
 if(!allowed()||!isHearing())return;
 const d=ctx(),focus=document.getElementById('terrorV694Focus')?.value||'source';
 const expected=kind==='confrontation'?'event_confrontation':'interrogation';
 if(d.room.phase!==expected)return;
 const name=kind==='confrontation'?'igr_v694_officer_confront':'igr_v693_terror_officer_join';
 try{
  const res=await rpc(name,{p_code:STATE.room,p_player_token:STATE.token,p_focus:focus,
     p_phase_started_at:d.room.phase_started_at});
  await syncNow(true);
  if(kind==='interrogation'&&typeof canVideo==='function'&&canVideo('officier_liaison')){
   STATE.tab='video';renderCurrent();
  }
  toast(kind==='confrontation'?'Participation à la confrontation enregistrée.':'Question au suspect enregistrée.');
 }catch(err){console.warn('terror v694 session denied',err);
  toast('Intervention refusée : suspect déjà rencontré, séance close ou quota utilisé.');
 }
};
function sessions(){
 const d=ctx(),cy=Number(d.room.cycle),phase=d.room.phase,actions=Array.isArray(d.my_actions)?d.my_actions:[];
 const visit=actions.some(a=>a.action_type==='terror_v693_officer_join'&&Number(a.cycle)===cy);
 const confrontation=actions.some(a=>a.action_type==='terror_v694_officer_confront'&&Number(a.cycle)===cy);
 const live=phase==='interrogation'||phase==='event_confrontation';
 const category=phase==='interrogation'?'interrogation':'confrontation';
 const used=category==='interrogation'?visit:confrontation;
 let html='<div class="terror-v694-hearings"><h4>INTERVENTIONS · CYCLE '+cy+'</h4>'+
  '<p>Un suspect différent par cycle. La participation à une confrontation aux cycles 2 et 3 dispose de son propre quota.</p>'+
  '<small>Suspect : '+(visit?'déjà visité':'visite disponible')+' · Confrontation : '+(cy<2?'à partir du cycle 2':confrontation?'déjà utilisée':'disponible')+'</small>';
 if(live&&(!used)&&(category==='interrogation'||cy>=2)){
  html+='<div class="terror-v694-hearing-action"><label for="terrorV694Focus">Question prioritaire</label>'+
   '<select id="terrorV694Focus"><option value="source">Fiabilité du renseignement</option>'+
   '<option value="civils">Civils et personnes détenues</option><option value="acces">Accès et communications</option></select>'+
   '<button type="button" onclick="terrorV694Join(\''+category+'\')">Rejoindre cette '+(category==='interrogation'?'audition':'confrontation')+'</button></div>';
 }
 if(live&&used)html+='<p class="terror-v694-confirmed">Ton intervention a déjà été utilisée pour ce type de séance.</p>';
 html+='</div>';return html;
}
function render(){
 document.getElementById('terrorV694Panel')?.remove();
 if(!allowed())return;
 // Prevent old one-order-one-visit controls from appearing alongside v694.
 document.getElementById('terrorV688Military')?.remove();
 document.getElementById('terrorV693Visit')?.remove();
 const parent=document.getElementById('terrorV681Board')||document.querySelector('.phase-strip');
 if(!parent)return;
 const d=ctx(),c=cache.get(key()),active=c?.active,closed=c?.cycle_closed;
 const last=d.room.state?.terror_v694?.last_result||c?.last_result;
 const progress=Number(c?.completed||0);
 const pane=document.createElement('section');pane.id='terrorV694Panel';pane.className='terror-v694-command';
 let html='<header><small>ALMIZIA · ÉTAT-MAJOR · OFFICIER</small>'+
  '<strong>COMMANDER LE SIÈGE</strong></header>'+
  '<p>Trois décisions par cycle. Les alertes surviennent à des moments variables, sans interrompre les interrogatoires. Chaque ordre change aussitôt la situation de la capitale.</p>'+
  '<div class="terror-v694-progress">ORDRES CONFIRMÉS · '+progress+' / 3 · CYCLE '+d.room.cycle+' / 3</div>';
 if(active&&typeof active==='object'&&!closed){
  const options=Array.isArray(c?.options)?c.options:[];
  html+='<div class="terror-v694-alert" role="alert"><strong>ORDRE '+esc(active.slot)+' / 3 · DÉCISION REQUISE</strong>'+
   '<div class="terror-v694-timer" id="terrorV694Countdown">—</div>'+
   (isHearing()?'<p>Séance en cours : le compte à rebours est suspendu.</p>':'<p>Confirme un ordre avant l expiration du délai.</p>')+
   '<div class="terror-v694-options">'+options.map(o=>'<button type="button" '+(isHearing()?'disabled ':'')+
   'onclick="terrorV694Confirm('+Number(active.slot)+',\''+esc(o.id)+'\')">'+esc(o.label)+'</button>').join('')+'</div></div>';
 } else if(closed){
  html+='<p class="terror-v694-idle">Cycle clos : les décisions non prises sont réglées par le protocole de sécurité.</p>';
 } else if(progress>=3){
  html+='<p class="terror-v694-idle">Tes trois ordres sont terminés. Observe la capitale et prépare le cycle suivant.</p>';
 } else {
  html+='<p class="terror-v694-idle">En attente d une nouvelle alerte militaire… Les ordres ne sont pas annoncés à l avance.</p>';
 }
 if(last&&last.label){
  html+='<div class="terror-v694-result"><b>DERNIÈRE RÉPERCUSSION IMMÉDIATE · '+esc(last.label)+'</b>'+
  '<p>'+esc(last.text||'')+'</p><span>Secteurs défendus : '+Number(last.controlled)+'/12 · Services civils : '+
  Number(last.civilian_services)+'/6 · Pression : '+Number(last.pressure)+'/100</span></div>';
 }
 html+=sessions();
 pane.innerHTML=html;
 parent.insertAdjacentElement('afterend',pane);
 countdown();
}
if(typeof renderGame==='function'){
 const previous=renderGame;
 renderGame=function(){previous.apply(this,arguments);render();};
}
window.setInterval(()=>{
 if(!allowed())return;
 countdown();poll(false);
},1000);
})();
