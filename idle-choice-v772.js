/* v772 — visible phase clock. The database, not this script, decides on expiry. */
(()=>{
 'use strict';
 let expirySig='',requestedSig='',deadline=0;
 const phases={interrogation_select:'Prochain interrogatoire',event_select:'Prochain événement'};
 const state=()=>window.STATE?.sync||null;
 const print=()=>{
   const d=state(),r=d?.room,phase=r?.phase||'';
   const old=document.getElementById('igr772-idle-clock');
   if(!phases[phase]||r?.status!=='playing'||!r?.phase_ends_at){
     old?.remove();expirySig='';deadline=0;return;
   }
   const parent=document.querySelector('#app .game-v11 .phase-explain')||document.querySelector('#app .game-v11 .igr106-action-panel');
   if(!parent){old?.remove();return;}
   const sig=[r.code,r.cycle,r.phase,r.phase_started_at,r.phase_ends_at].join('|');
   if(sig!==expirySig){
     expirySig=sig;requestedSig='';
     const remaining=Date.parse(r.phase_ends_at)-Date.parse(d.server_now||new Date().toISOString());
     deadline=Date.now()+Math.max(0,Number.isFinite(remaining)?remaining:60000);
   }
   let panel=old;
   if(!panel){
      panel=document.createElement('div');
      panel.id='igr772-idle-clock';panel.className='igr772-idle-clock';
      panel.setAttribute('role','status');panel.setAttribute('aria-live','off');
   }
   if(panel.parentElement!==parent)parent.appendChild(panel);
   const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
   panel.innerHTML='<span>'+phases[phase]+'</span><strong>'+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+'</strong><small>'+ (seconds?'Sans choix, une action éligible sera lancée automatiquement.':'Choix automatique en cours…')+'</small>';
   if(seconds===0&&requestedSig!==sig){
     requestedSig=sig;
     if(typeof window.syncNow==='function')Promise.resolve(window.syncNow(true)).catch(()=>{});
   }
 };
 const boot=()=>{
   const root=document.getElementById('app');
   if(!root)return;
   const obs=new MutationObserver(()=>{if(document.querySelector('#app .game-v11'))print();});
   obs.observe(root,{childList:true,subtree:false});
   window.setInterval(print,1000);print();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.IGR_IDLE_TIMER_V772=Object.freeze({version:'772.1'});
})();