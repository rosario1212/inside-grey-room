/* v694: role clarity and timed military command. Server remains authoritative. */
(()=>{
'use strict';
const ROLE_TIPS={
 analyste:[
  'Cycle 1 : relève deux incohérences datées et distingue constat et interprétation. Propose une première priorité à l’Enquêteur.',
  'Cycle 2 : tente de réfuter votre hypothèse principale par une source indépendante. Demande un recoupement concret.',
  'Cycle 3 : explique ce qui reste incertain et propose des niveaux de responsabilité justifiés.'
 ],
 expert:[
  'Cycle 1 : choisis ton analyse technique sur une question précise. Explique les limites du résultat.',
  'Cycle 2 : utilise une nouvelle analyse pertinente; la contre-expertise est unique pour la partie.',
  'Cycle 3 : vérifie ce que les preuves permettent réellement de conclure et partage un avis technique si nécessaire.'
 ],
 inspecteur:[
  'Cycle 1 : sélectionne jusqu’à trois lieux distincts; transmets les éléments pertinents à l’Enquêteur.',
  'Cycle 2 : enquête sur les zones laissées inexpliquées, sans réexplorer les mêmes lieux.',
  'Cycle 3 : hiérarchise les découvertes déjà obtenues et leur lien avec les responsabilités.'
 ],
 temoin:[
  'Cycle 1 : connais précisément la limite de tes observations. Tu peux demander spontanément à être entendu.',
  'Cycle 2 : corrige les malentendus sur ce que tu sais, sans inventer des faits absents de ta carte.',
  'Cycle 3 : si une accusation déforme ton témoignage, demande à clarifier publiquement tes propos.'
 ],
 juge:[
  'Cycle 1 : traite les requêtes; tes trois points de protection sont une ressource limitée.',
  'Cycle 2 : arbitre les demandes contradictoires sans diriger les interrogatoires.',
  'Cycle 3 : vérifie les bases de chaque responsabilité avant ta décision qui fera autorité.'
 ],
 procureur:[
  'Cycle 1 : identifie les intérêts opposés. Les négociations sont libres, sans rendez-vous chronométré.',
  'Cycle 2 : tente une coopération fondée sur des faits; elle ne lie pas le Juge.',
  'Cycle 3 : distingue l’accusation défendable du simple soupçon avant ton verrouillage.'
 ],
 maitre:[
  'Cycle 1 : choisis ton client officiel en connaissance de cause; ce choix est définitif.',
  'Cycle 2 : vérifie ce qui est réellement reproché à ton client et formule une contestation précise.',
  'Cycle 3 : prépare la défense finale et la limite exacte de sa responsabilité.'
 ],
 journaliste:[
  'Cycle 1 : mène une piste indépendante et documente la base de tes publications.',
  'Cycle 2 : vérifie une deuxième source avant de mettre une accusation publique en circulation.',
  'Cycle 3 : prépare ton angle final; une publication n’est jamais un verdict.'
 ],
 enqueteur:[
  'Cycle 1 : organise des interrogatoires comparables et fais intervenir les spécialistes.',
  'Cycle 2 : priorise les contradictions testables, sans confondre stress et preuve.',
  'Cycle 3 : confie des tâches de vérification aux autres rôles avant de verrouiller.'
 ],
 suspect:[
  'Cycle 1 : établis une version cohérente sans révéler automatiquement tous tes secrets.',
  'Cycle 2 : adapte ta défense aux preuves déjà publiées; n’invente pas de preuve officielle.',
  'Cycle 3 : défends la frontière réelle de ta responsabilité et prépare les objections.'
 ]
};
const escapeText=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&apos;':'&#39;'}[c]));
const cache={key:'',value:null,time:0,pending:false,error:false};
const room=()=>typeof STATE!=='undefined'?STATE?.sync?.room:null;
const player=()=>typeof STATE!=='undefined'?STATE?.sync?.player:null;
const key=()=>[STATE?.room,STATE?.token,room()?.cycle].join('|');
const officer=()=>player()?.public_role==='officier_liaison'&&['026','027','028'].includes(String(room()?.scenario_id));
const secs=(iso,serverNow)=>Math.max(0,Math.ceil((Date.parse(iso)-Date.now()+(Date.now()-Date.parse(serverNow)))/1000));
const clock=x=>String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');
function updateCountdown(){
 const el=document.getElementById('igr694Clock');
 if(!el||!cache.value)return;
 const s=cache.value,seconds=secs(s.ready?s.deadline:s.available_at,s.server_now);
 el.textContent=s.step>3?'ORDRES CLÔTURÉS':(s.ready?'TEMPS RESTANT · ':'OUVERTURE DANS · ')+clock(seconds);
}
function fetchMilitary(){
 if(!officer()||room()?.status!=='playing')return;
 const k=key();if(cache.key!==k){cache.key=k;cache.value=null;cache.time=0;cache.error=false;}
 if(cache.pending||Date.now()-cache.time<3500)return;
 cache.pending=true;cache.time=Date.now();
 rpc('igr_v694_officer_state',{p_code:STATE.room,p_player_token:STATE.token})
  .then(v=>{if(k!==key())return;cache.value=v;cache.error=false;
   if(typeof renderCurrent==='function'&&STATE?.view==='game')renderCurrent();})
  .catch(e=>{cache.error=true;console.warn('v694 officer status',e);})
  .finally(()=>cache.pending=false);
}
function showMilitary(){
 if(!officer()||STATE?.view!=='game'||room()?.status!=='playing')return;
 fetchMilitary();
 const old=document.getElementById('terrorV688Military'),existing=document.getElementById('igr694Military');
 existing?.remove();
 const s=cache.value;
 if(!old||!s?.enabled||cache.error)return; // Legacy panel remains until v694 is available.
 old.style.display='none';
 const el=document.createElement('section');el.id='igr694Military';el.className='igr694-command';
 const stage=Number(s.step)||1,opts=Array.isArray(s.choices)?s.choices:[];
 const current=stage<=3?opts.map(o=>'<button class="igr694-choice" type="button" '+(!s.ready?'disabled':'')+
  ' onclick="igr694Order(\''+escapeText(o.id)+'\')"><b>'+escapeText(o.name)+'</b><small>'+escapeText(o.risk)+'</small></button>').join(''):'';
 const answers=s.decisions||{};
 const rows=[1,2,3].map((n)=>'<span class="'+(answers[n]?'done':'')+'">'+n+': '+escapeText(answers[n]||'à décider')+'</span>').join('');
 el.innerHTML='<header><small>ÉTAT-MAJOR D’ALMIZIA · CYCLE '+escapeText(s.cycle)+'/3</small><h3>'+escapeText(s.title)+'</h3></header>'+
  '<div id="igr694Clock" class="igr694-clock"></div><div class="igr694-progress">'+rows+'</div>'+
  '<p>Trois ordres indépendants : la défense, les civils, puis le renseignement. Une fenêtre ratée n’est pas remplacée par une victoire automatique. Les décisions n’inventent aucune preuve.</p>'+
  (s.ready?'<div class="igr694-grid">'+current+'</div>':stage<=3?'<p class="igr694-hint">Prochaine fenêtre programmée par le serveur.</p>':
   '<p class="igr694-hint">Les trois décisions de ce cycle sont closes. Le prochain bilan territorial tiendra compte des ordres reçus.</p>')+
  '<footer>Services civils protégés : '+escapeText(s.civilian_services)+'/6 · L’ordre territorial et le bilan du front sont rendus publics.</footer>';
 old.insertAdjacentElement('afterend',el);
 updateCountdown();
}
window.igr694Order=async(choice)=>{
 const s=cache.value;if(!s?.ready||!officer())return;
 const buttons=document.querySelectorAll('.igr694-choice');buttons.forEach(b=>b.disabled=true);
 try{
  const r=await rpc('igr_v694_officer_decide',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});
  cache.time=0;cache.value=null;
  if(typeof syncNow==='function')await syncNow(true);
  if(typeof toast==='function')toast(r?.effect||'Ordre officiel enregistré.');
  fetchMilitary();
 }catch(e){
  console.warn('officer command rejected',e);
  if(typeof toast==='function')toast('Décision refusée : fenêtre terminée, ordre déjà donné ou renseignements insuffisants.');
  cache.time=0;fetchMilitary();
 }finally{buttons.forEach(b=>b.disabled=false);}
};
function guide(){
 const r=room(),p=player();if(!r||r.status!=='playing'||STATE?.view!=='game')return;
 document.getElementById('igr694RoleTip')?.remove();
 const tips=ROLE_TIPS[p?.public_role];if(!tips)return;
 const host=document.getElementById('igr51Now')||document.querySelector('.phase-strip');
 if(!host)return;
 const el=document.createElement('aside');el.id='igr694RoleTip';el.className='igr694-role-tip';
 const c=Math.max(1,Math.min(3,Number(r.cycle)||1));
 el.innerHTML='<small>REPÈRE DE RÔLE · CYCLE '+c+'/3</small><p>'+escapeText(tips[c-1])+'</p>';
 host.insertAdjacentElement('afterend',el);
}
if(typeof renderGame==='function'){
 const earlier=renderGame;renderGame=function(){earlier.apply(this,arguments);guide();showMilitary();};
}
window.setInterval(()=>{if(!officer()||STATE?.view!=='game')return;
 updateCountdown();if(room()?.status==='playing'&&Date.now()-cache.time>=3500)fetchMilitary();},1000);
})();