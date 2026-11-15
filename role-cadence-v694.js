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

const ROLE_TIPS_EN={
 analyste:[
  'Cycle 1: identify two dated contradictions and separate observations from interpretations.',
  'Cycle 2: challenge your leading hypothesis using a second independent source.',
  'Cycle 3: state what remains uncertain before recommending responsibility levels.'
 ],
 expert:[
  'Cycle 1: choose a technical question and explain what your analysis can establish.',
  'Cycle 2: select a useful analysis; your counter-analysis is limited to once per game.',
  'Cycle 3: clarify technical limits and share only authorized conclusions.'
 ],
 inspecteur:[
  'Cycle 1: explore up to three distinct locations and share actionable findings.',
  'Cycle 2: investigate unresolved areas without revisiting locations.',
  'Cycle 3: rank the physical findings relevant to the final assessment.'
 ],
 temoin:[
  'Cycle 1: clearly separate what you witnessed from what you only heard.',
  'Cycle 2: correct misinterpretations without adding facts absent from your card.',
  'Cycle 3: request a hearing or publish a statement when your account is distorted.'
 ],
 juge:[
  'Cycle 1: assess requests; your three protection points are limited.',
  'Cycle 2: settle procedural disputes without directing interrogations.',
  'Cycle 3: ensure every final responsibility level has evidentiary support.'
 ],
 procureur:[
  'Cycle 1: identify conflicting interests. Informal negotiations are untimed.',
  'Cycle 2: seek cooperation grounded in facts, never binding the Judge.',
  'Cycle 3: separate defensible allegations from suspicion before locking.'
 ],
 maitre:[
  'Cycle 1: choose one official client; that choice is final.',
  'Cycle 2: challenge the precise allegations against your client.',
  'Cycle 3: prepare the final defense and the limits of your client’s responsibility.'
 ],
 journaliste:[
  'Cycle 1: follow an independent lead and record the source behind your reports.',
  'Cycle 2: seek a second source before making a serious public allegation.',
  'Cycle 3: prepare your personal final angle; a publication is not a verdict.'
 ],
 enqueteur:[
  'Cycle 1: organize comparable interrogations and involve specialists.',
  'Cycle 2: prioritize testable contradictions; stress is not proof.',
  'Cycle 3: delegate verification before locking your conclusion.'
 ],
 suspect:[
  'Cycle 1: tell a consistent story without revealing all your secrets.',
  'Cycle 2: adapt your defense to evidence already disclosed, not invented evidence.',
  'Cycle 3: defend your actual responsibility level and anticipate objections.'
 ],
 officier_liaison:[
  'Cycle 1: monitor your three military alerts and interview one suspect.',
  'Cycle 2: make three further orders, interview a new suspect and join one confrontation if available.',
  'Cycle 3: your final three orders affect the capital; interview a third distinct suspect.'
 ]
};
const isEnglish=()=>window.IGR_LOCALE==='en';
const tr=(f,e)=>isEnglish()?e:f;
const escapeText=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache={key:'',value:null,time:0,receivedAt:0,pending:false,error:false};
const room=()=>typeof STATE!=='undefined'?STATE?.sync?.room:null;
const player=()=>typeof STATE!=='undefined'?STATE?.sync?.player:null;
const key=()=>[STATE?.room,STATE?.token,room()?.cycle].join('|');
const officer=()=>!document.querySelector('script[src*="terror-command-v694.js"]')&&player()?.public_role==='officier_liaison'&&['026','027','028'].includes(String(room()?.scenario_id));
const secs=(iso,serverNow)=>Math.max(0,Math.ceil((Date.parse(iso)-(Date.now()+Date.parse(serverNow)-cache.receivedAt))/1000));
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
  .then(v=>{if(k!==key())return;cache.value=v;cache.receivedAt=Date.now();cache.error=false;
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
 if(!old||!s||cache.error)return; // Legacy panel remains only when server v694 is unavailable.
 old.style.display='none';
 if(!s.enabled){
  const note=document.createElement('section');note.id='igr694Military';note.className='igr694-command';
  note.innerHTML='<small>ÉTAT-MAJOR D’ALMIZIA</small><p>Les ordres s’ouvrent après l’Assemblée d’enquête. Aucun chrono ne court pendant cette phase de préparation ou de clôture.</p>';
  old.insertAdjacentElement('afterend',note);return;
 }
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
 const tips=(isEnglish()?ROLE_TIPS_EN:ROLE_TIPS)[p?.public_role];if(!tips)return;
 const host=document.getElementById('igr51Now')||document.querySelector('.phase-strip');
 if(!host)return;
 const el=document.createElement('aside');el.id='igr694RoleTip';el.className='igr694-role-tip';
 const c=Math.max(1,Math.min(3,Number(r.cycle)||1));
 el.innerHTML='<small>'+tr('REPÈRE DE RÔLE · CYCLE ','ROLE GUIDE · CYCLE ')+c+'/3</small><p>'+escapeText(tips[c-1])+'</p>';
 host.insertAdjacentElement('afterend',el);
}

let workingText='',workingKey='';
function initiative(){
 const d=STATE?.sync,role=d?.player?.public_role,cycle=Number(d?.room?.cycle)||1;
 const k=[STATE?.room,d?.player?.id,cycle].join('|');
 if(workingKey!==k){workingKey=k;workingText='';}
 const forbidden=['briefing','role_reading','pre_investigation','investigation_assembly','cycle_debrief','trame','provisional_orals','provisional_lock','defense','locking','reveal','closed','final_audience','final_suspect_defenses','final_debrief','judge_speech','judge_integrity_vote'];
 if(STATE?.view!=='game'||d?.room?.status!=='playing'||forbidden.includes(String(d?.room?.phase||''))||!['analyste','temoin'].includes(role))return;
 const used=Array.isArray(d.my_actions)&&d.my_actions.some(a=>a.action_type==='igr_v694_role_initiative'&&Number(a.cycle)===cycle);
 const old=document.getElementById('igr694Initiative');
 if(old&&old.dataset.cycle===String(cycle)&&old.dataset.used===String(used))return;
 old?.remove();
 const host=document.getElementById('igr694RoleTip')||document.getElementById('igr51Now')||document.querySelector('.phase-strip');
 if(!host)return;
 const area=document.createElement('section');area.id='igr694Initiative';area.className='igr694-role-tip igr694-initiative';
 area.dataset.cycle=String(cycle);area.dataset.used=String(used);
 if(used){area.innerHTML='<small>'+tr('INITIATIVE DU CYCLE','CYCLE INITIATIVE')+'</small><p>'+tr('Ton intervention a été enregistrée pour ce cycle.','Your initiative has been recorded for this cycle.')+'</p>';host.insertAdjacentElement('afterend',area);return;}
 const analyst=role==='analyste';
 area.innerHTML='<small>'+ (analyst?tr('NOTE DE RECOUPEMENT','CROSS-CHECK NOTE'):tr('PAROLE DU TÉMOIN','WITNESS STATEMENT'))+
  tr(' · 1 intervention par cycle',' · 1 initiative per cycle')+'</small>'+
  '<p>'+(analyst?tr('Formule une contradiction précise à tester. Cette note est publique et ne constitue pas une preuve.','Submit a specific contradiction to test. This note is public and is not evidence.'):
   tr('Tu peux demander à être entendu ou formuler une déclaration personnelle. Rien n’est confirmé automatiquement par le système.','You may request a hearing or make a personal statement. The system does not automatically verify your account.'))+'</p>'+
  '<textarea id="igr694InitiativeText" rows="3" maxlength="220" placeholder="'+(analyst?tr('Indique un horaire, une source ou un propos à vérifier…','Specify a time, source or statement to verify…'):
   tr('Indique seulement ce que ton personnage peut savoir…','State only what your character may know…'))+'"></textarea>'+
  '<div class="igr694-initiative-actions">'+(analyst?
   '<button type="button" onclick="igr694Initiative(\'recoupement\')">'+tr('Partager ce point à vérifier','Share this cross-check')+'</button>':
   '<button type="button" onclick="igr694Initiative(\'demande_audition\')">'+tr('Demander à être entendu','Request a hearing')+'</button>'+
   '<button type="button" onclick="igr694Initiative(\'declaration\')">'+tr('Déposer une déclaration','Publish a statement')+'</button>')+'</div>';
 host.insertAdjacentElement('afterend',area);
 const ta=area.querySelector('textarea');ta.value=workingText;ta.addEventListener('input',()=>{workingText=ta.value;});
}
window.igr694Initiative=async action=>{
 const pane=document.getElementById('igr694Initiative');
 if(!pane)return;
 const ta=pane.querySelector('textarea'),note=ta?.value||'';
 pane.querySelectorAll('button').forEach(x=>x.disabled=true);
 try{
  const result=await rpc('igr_v694_role_initiative',{p_code:STATE.room,p_player_token:STATE.token,p_action:action,p_note:note});
  workingText='';pane.remove();
  if(typeof syncNow==='function')await syncNow(true);
  if(typeof toast==='function')toast(tr('Intervention enregistrée.','Initiative recorded.'));
  if(typeof renderCurrent==='function')renderCurrent();
 }catch(e){
  console.warn('v694 role initiative rejected',e);
  pane.querySelectorAll('button').forEach(x=>x.disabled=false);
  if(typeof toast==='function')toast(tr('Action refusée : texte trop court, phase close ou initiative déjà utilisée.','Action rejected: text too short, phase closed or initiative already used.'));
 }
};
if(typeof renderGame==='function'){
 const earlier=renderGame;renderGame=function(){earlier.apply(this,arguments);guide();showMilitary();initiative();};
}
window.setInterval(()=>{if(!officer()||STATE?.view!=='game')return;
 updateCountdown();if(room()?.status==='playing'&&Date.now()-cache.time>=3500)fetchMilitary();},1000);
})();