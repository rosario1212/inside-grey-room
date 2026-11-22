/* v835 — live interview focus and a truthful public player/party overview.
   Presentation only: read the authorized room snapshot, keep server action
   handlers and never infer hidden roles, presence or player attendance. */
(()=>{
'use strict';
if(window.IGR_LIVE_FOCUS_V835)return;
const getState=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch(_){return window.STATE}};
const en=()=>window.IGR_LOCALE==='en';
const tr=(fr,eng)=>en()?eng:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sync=()=>getState()?.sync;
const room=()=>sync()?.room||{};
const role=()=>String(sync()?.player?.public_role||getState()?.role||'');
const players=()=>Array.isArray(sync()?.players)?sync().players:[];
const same=(a,b)=>String(a??'')===String(b??'');
const ids=values=>Array.isArray(values)?values.map(x=>String(x&&typeof x==='object'?x.id??x.player_id??'':x)):[];
const currentMe=()=>String(sync()?.player?.id||getState()?.playerId||'');
const rosterPerson=id=>players().find(p=>same(p.id,id));
const participantSet=()=>new Set(ids(room().state?.event_participants));
const targets=()=>{
 const ph=String(room().phase||''),st=room().state||{};
 if(ph==='interrogation')return st.current_target?[String(st.current_target)]:[];
 if(ph==='event_confrontation')return ids(st.event_targets).filter(Boolean);
 return [];
};
const publicRoleLabel=r=>{
 const names={enqueteur:['Enquêteur','Investigator'],analyste:['Analyste','Analyst'],suspect:['Suspect','Suspect'],temoin:['Témoin','Witness'],procureur:['Procureur','Prosecutor'],juge:['Juge','Judge'],inspecteur:['Inspecteur','Inspector'],expert:['Expert','Expert'],maitre:['Avocat','Lawyer'],journaliste:['Journaliste','Journalist'],officier_liaison:['Officier de liaison','Liaison officer']};
 return (names[String(r)]||[tr('Participant','Participant'),tr('Participant','Participant')])[en()?1:0];
};
function action(){
 const phase=String(room().phase||''),raw=targets(),confirmed=raw.map(rosterPerson).filter(Boolean);
 const names=confirmed.map(p=>String(p.pseudo||'')).filter(Boolean);
 const me=currentMe();
 if(phase==='interrogation'){
  const subject=names[0]||tr('Suspect convoqué','Summoned suspect');
  const summoned=raw.some(id=>same(me,id));
  return {type:'interrogation',ids:raw,names:[subject],
   label:tr('INTERROGATOIRE EN COURS','INTERVIEW IN PROGRESS'),
   title:summoned?tr('TU ES CONVOQUÉ','YOU ARE SUMMONED'):role()==='enqueteur'?tr('TU INTERROGES','YOU ARE INTERVIEWING'):tr('PERSONNE INTERROGÉE','PERSON BEING INTERVIEWED'),
   detail:summoned?tr('Rejoins la Grey Room maintenant. Réponds selon ta fiche.','Go to the Grey Room now and answer from your card.'):
     role()==='enqueteur'?tr('Conduis cet entretien. Tu peux le terminer depuis Cycle.','Conduct this interview. You can end it from Cycle.'):
     role()==='analyste'?tr('Observe les réponses et relève les contradictions.','Observe answers and note contradictions.'):
     tr('Si tu n’es pas convoqué, continue ton rôle en attendant la suite.','If you are not summoned, continue your role until called.')};
 }
 if(phase==='event_confrontation'){
  const summoned=raw.some(id=>same(me,id));
  return {type:'confrontation',ids:raw,names:names.length?names:[tr('Participants convoqués','Summoned participants')],
   label:tr('CONFRONTATION EN COURS','CONFRONTATION IN PROGRESS'),
   title:summoned?tr('TU ES CONVOQUÉ','YOU ARE SUMMONED'):tr('JOUEURS CONVOQUÉS','SUMMONED PLAYERS'),
   detail:summoned?tr('Rejoins la Grey Room et réponds en respectant ta fiche.','Go to the Grey Room and answer within your card.'):
     role()==='enqueteur'?tr('Dirige l’échange entre les personnes désignées.','Lead the exchange between the designated players.'):
     tr('Seuls les joueurs convoqués ou autorisés prennent part à la confrontation.','Only summoned or authorized players take part in the confrontation.')};
 }
 return null;
}
const avatar=p=>{
 const text=String(p?.pseudo||'?').trim();
 const mark=text.split(/\s+/).slice(0,2).map(w=>w.charAt(0)).join('').slice(0,2).toUpperCase();
 return '<span class="igr835-avatar" aria-hidden="true">'+esc(mark||'?')+'</span>';
};
function publicPresence(p){
 const answer=window.IGR_AUDIT_V829?.getPresence?.();
 if(!answer?.peers||String(answer.room_code)!==String(getState()?.room||''))return '';
 const status=answer.peers.find(x=>same(x.id,p.id));
 if(status?.active)return '<span class="igr835-presence">'+tr('Actif récemment','Recently active')+'</span>';
 return '';
}
function status(p){
 const phase=String(room().phase||''),id=String(p.id??''),r=String(p.public_role||'');
 const isTarget=targets().includes(id);
 if(phase==='interrogation'&&isTarget)return ['interview',tr('Interrogé maintenant','Being interviewed')];
 if(phase==='event_confrontation'&&isTarget)return ['confrontation',tr('Convoqué maintenant','Summoned now')];
 if(phase==='event_assembly'&&ids(room().state?.event_participants).includes(id))
  return ['involved',tr('À l’assemblée','At assembly')];
 if(phase==='event_assembly'&&Array.isArray(room().state?.event_participants)&&!participantSet().has(id))
  return ['neutral',tr('Hors assemblée','Outside assembly')];
 if(phase==='interrogation'&&r==='enqueteur')return ['involved',tr('Conduit l’entretien','Conducting interview')];
 if(phase==='interrogation'&&r==='analyste')return ['involved',tr('Observe l’entretien','Observing interview')];
 if(phase==='event_confrontation'&&r==='enqueteur')return ['involved',tr('Dirige la confrontation','Leading confrontation')];
 if(ids(room().state?.heard).includes(id))return ['heard',tr('Déjà entendu ce cycle','Heard this cycle')];
 if(phase==='interrogation_select'&&r==='enqueteur')
  return ['involved',tr('Choisit le prochain suspect','Choosing next suspect')];
 if(phase==='event_select'&&r==='enqueteur')
  return ['involved',tr('Choisit l’événement','Choosing an event')];
 if(['initial_debrief','cycle_debrief'].includes(phase)&&['enqueteur','analyste'].includes(r))
  return ['involved',tr('En débrief','In debrief')];
 if(phase==='locking'&&['enqueteur','analyste','procureur','juge','journaliste'].includes(r))
  return ['involved',tr('Décision à valider','Decision to confirm')];
 if(phase==='interrogation_select'&&r==='suspect')
  return ['neutral',tr('En attente de convocation','Awaiting summons')];
 return ['neutral',tr('Participe à la partie','In the game')];
}
function phaseName(){
 try{return typeof phaseLabel==='function'?String(phaseLabel(room().phase)):String(room().phase||'').replaceAll('_',' ')}
 catch(_){return String(room().phase||'').replaceAll('_',' ')}
}
function meta(){
 const d=sync(),r=room(),sid=String(r.scenario_id||'');
 let title=d?.scenario?.title||'';
 try{if(!title&&typeof scenario==='function')title=scenario(sid)?.title||''}catch(_){}
 return {sid,title,code:String(r.code||getState()?.room||''),count:players().length,cycle:Number(r.cycle)||0};
}
function badge(text){return '<span class="igr835-meta-tag">'+esc(text)+'</span>'}
function overview(){
 const m=meta(),focus=action();
 const stats=[
  tr('Cycle','Cycle')+' '+(m.cycle||'—')+'/3',
  tr('Phase : ','Phase: ')+phaseName(),
  m.count+' '+tr('joueurs','players')
 ];
 const intro='<section class="igr835-party-overview" aria-label="'+tr('Joueurs et état de la partie','Players and game status')+'">'+
  '<header><small>'+tr('ÉTAT DE LA PARTIE','GAME STATUS')+'</small><h2>'+esc(m.title||tr('Partie en cours','Game in progress'))+'</h2>'+
  '<p>'+tr('Dossier','Case')+' '+esc(m.sid||'—')+' · '+tr('Code','Code')+' <strong>'+esc(m.code||'—')+'</strong></p>'+
  '<div class="igr835-tags">'+stats.map(badge).join('')+'</div></header>'+
  (focus?'<div class="igr835-current-summary">'+esc(focus.label)+' · <strong>'+esc(focus.names.join(' + '))+'</strong></div>':'')+
  '<h3 class="igr835-roster-heading">'+tr('Joueurs dans la partie','Players in the game')+'</h3>'+
  '<div class="igr835-roster">'+players().map((p,i)=>{
   const [kind,label]=status(p),isMe=same(p.id,currentMe()),isHost=p.is_host===true||same(p.id,room().host_player_id)&&room().host_player_id!=null;
   return '<article class="igr835-player '+(kind==='interview'||kind==='confrontation'?'igr835-player-current':'')+'">'+
    avatar(p)+'<div class="igr835-player-copy"><strong>'+esc(String(i+1)+'. '+String(p.pseudo||tr('Joueur','Player')))+(isMe?' <span class="igr835-you">'+tr('(toi)','(you)')+'</span>':'')+'</strong>'+
    '<span>'+esc(publicRoleLabel(p.public_role))+(isHost?' · '+tr('Hôte','Host'):'')+'</span>'+
    publicPresence(p)+'</div><span class="igr835-player-state" data-kind="'+kind+'">'+esc(label)+'</span></article>';
  }).join('')+'</div>'+
  '<p class="igr835-roster-help">'+tr('Les statuts indiquent la participation à la phase, pas une présence en ligne garantie. Les rôles cachés restent privés.','These indicate phase participation, not guaranteed online presence. Hidden roles stay private.')+'</p>'+
  '</section>';
 return intro;
}
function spotlightHtml(focus){
 const names=focus.names.map(n=>'<strong>'+esc(n)+'</strong>').join('<span class="igr835-plus">+</span>');
 return '<section class="igr835-spotlight" id="igr835Spotlight" data-action-type="'+focus.type+'" role="status" aria-label="'+esc(focus.label)+'">'+
  '<small class="igr835-eyebrow"><span class="igr835-pulse" aria-hidden="true"></span>'+esc(focus.label)+'</small>'+
  '<span class="igr835-focused-title">'+esc(focus.title)+'</span><div class="igr835-focus-names">'+names+'</div>'+
  '<p>'+esc(focus.detail)+'</p>'+
  '<button type="button" class="igr835-overview-btn" onclick="setTab(\'rules\')">'+tr('Voir les joueurs et leur statut','See players and status')+'</button></section>';
}
function enhanceParty(content){
 const t=document.createElement('template');t.innerHTML=String(content??'');
 t.content.querySelectorAll('.party-status-clean').forEach(x=>x.remove());
 return overview()+t.innerHTML;
}
const oldTabs=typeof gameTabs==='function'?gameTabs:window.gameTabs;
if(typeof oldTabs==='function'){
 const wrapped=function(...args){
  const a=[...(oldTabs.apply(this,args)||[])];
  return a.map(x=>x?.id==='rules'?{...x,label:tr('Joueurs & partie','Players & game')}:x);
 };
 try{gameTabs=wrapped}catch(_){}window.gameTabs=wrapped;
}
const oldTab=typeof renderGameTab==='function'?renderGameTab:window.renderGameTab;
if(typeof oldTab==='function'){
 const wrapped=function(...args){
  const name=getState()?.tab;
  const base=oldTab.apply(this,args);
  return name==='rules'?enhanceParty(base):base;
 };
 try{renderGameTab=wrapped}catch(_){}window.renderGameTab=wrapped;
}
function phaseGuidance(focus){
 const now=document.querySelector('#app .game-v11 #igr51Now'),who=focus.names.join(' et ');
 if(!now||!focus)return;
 const h=now.querySelector('h3'),p=now.querySelector('p');
 if(!h||!p)return;
 if(focus.type==='interrogation'){
  if(role()==='enqueteur'){h.textContent=tr('Tu interroges ','You are interviewing ')+who;p.textContent=tr('Conduis l’entretien. Le bouton pour terminer se trouve dans Cycle.','Conduct the interview. The end control is in Cycle.')}
  else if(focus.ids.some(id=>same(id,currentMe()))){h.textContent=tr('Tu es interrogé maintenant','You are being interviewed');p.textContent=tr('Rejoins la Grey Room et réponds selon les faits de ta fiche.','Join the Grey Room and answer using your private card.')}
  else if(['suspect','analyste'].includes(role())){h.textContent=tr('Interrogatoire de ','Interview of ')+who;p.textContent=role()==='analyste'?tr('Observe les réponses et prépare les contradictions à relever.','Observe the answers and look for contradictions.'):tr('Tu n’es pas convoqué. Prépare ta version et attends la suite.','You are not summoned. Prepare your account and await the next phase.')}
 }else if(focus.type==='confrontation'){
  if(role()==='enqueteur'){h.textContent=tr('Confrontation : ','Confrontation: ')+who;p.textContent=tr('Dirige cet échange officiel. La commande de fin est dans Cycle.','Lead this exchange. The end control is in Cycle.')}
  else if(focus.ids.some(id=>same(id,currentMe()))){h.textContent=tr('Tu es convoqué à la confrontation','You are summoned to confront');p.textContent=tr('Rejoins la Grey Room pour répondre aux personnes présentes.','Join the Grey Room and answer the other participants.')}
 }
}
function patch(){
 const s=getState(),main=document.querySelector('#app main.game-v11');
 if(!s||!main||!sync()?.room)return;
 const focus=action(),strip=main.querySelector('.phase-strip');
 if(strip){
  const old=main.querySelector('#igr835Spotlight');
  if(focus){
   const signature=JSON.stringify([focus.type,focus.ids,focus.names,focus.title,focus.detail]);
   if(old?.dataset.signature!==signature){
    const node=document.createElement('div');node.innerHTML=spotlightHtml(focus);
    const fresh=node.firstElementChild;fresh.dataset.signature=signature;
    if(old)old.replaceWith(fresh);else strip.insertAdjacentElement('afterend',fresh);
   }
   const banner=main.querySelector('#igr835Spotlight'),now=main.querySelector('#igr51Now');
   if(now&&banner?.nextElementSibling!==now)banner.after(now);
  }else old?.remove();
 }
 const ident=main.querySelector('.game-ident-text');
 if(ident){
  let jump=ident.querySelector('#igr835PartyJump');
  if(!jump){jump=document.createElement('button');jump.type='button';jump.id='igr835PartyJump';jump.className='igr835-party-jump';jump.onclick=()=>{if(typeof setTab==='function')setTab('rules')};ident.appendChild(jump)}
  const count=players().length,text=count+' '+tr('joueurs','players')+' · '+tr('Voir la partie','View game');
  if(jump.textContent!==text)jump.textContent=text;
 }
 const panel=main.querySelector('.game-panel-v11');
 if(panel){
  const mini=panel.querySelector('#igr835MiniFocus');
  if(focus&&['cycle','investigation'].includes(s.tab)){
   const label=focus.type==='interrogation'?tr('Interrogatoire','Interview'):tr('Confrontation','Confrontation');
   const copy=label+' : '+focus.names.join(' + ');
   if(!mini){const div=document.createElement('div');div.id='igr835MiniFocus';div.className='igr835-mini';div.textContent=copy;panel.prepend(div)}
   else if(mini.textContent!==copy)mini.textContent=copy;
  }else mini?.remove();
  if(s.tab==='cycle'){
   const workspace=panel.querySelector('.igr834-cycle');
   if(workspace){
    let guide=workspace.querySelector('#igr835CycleProgress');
    const st=room().state||{},limit=Number(st.interrogation_limit),used=Number(st.interrogation_count),heard=ids(st.heard);
    const pieces=[tr('Cycle','Cycle')+' '+(Number(room().cycle)||'—')+'/3'];
    if(Number.isFinite(limit)&&limit>0&&Number.isFinite(used)&&used>=0)pieces.push(tr('Interrogatoires : ','Interviews: ')+Math.min(used,limit)+'/'+limit);
    else if(heard.length)pieces.push(heard.length+' '+tr('suspect(s) entendu(s)','suspect(s) heard'));
    const label=pieces.join('  ·  ');
    if(!guide){guide=document.createElement('div');guide.id='igr835CycleProgress';guide.className='igr835-cycle-progress';workspace.querySelector('.igr834-heading')?.after(guide)}
    if(guide.textContent!==label)guide.textContent=label;
    const idle=workspace.querySelector('.igr634-interviews');
    if(idle){
     const ph=room().phase;
     const active=['interrogation_select','interrogation','event_confrontation'].includes(ph)||!!idle.querySelector('button,[onclick]');
     idle.classList.toggle('igr835-idle-interviews',!active);
     if(ph==='interrogation'&&focus?.names[0]){
      const heading=idle.querySelector(':scope > h3');
      if(heading)heading.textContent=tr('Interrogatoire · ','Interview · ')+focus.names[0];
     }
    }
    const end=workspace.querySelector('button[onclick*="endInterrogation"]');
    if(end&&focus?.type==='interrogation')end.textContent=tr('Terminer l’interrogatoire de ','End interview with ')+focus.names[0];
    const confrontation=workspace.querySelector('button[onclick*="igr827InvestigatorEndConfrontation"]');
    if(confrontation&&focus?.type==='confrontation')confrontation.textContent=tr('Terminer la confrontation : ','End confrontation: ')+focus.names.join(' + ');
   }
  }
 }
 if(focus)phaseGuidance(focus);
 const rulesPage=panel?.querySelector('.igr835-party-overview');
 if(rulesPage&&s.tab==='rules'){
  const stamp=JSON.stringify([room().phase,room().cycle,room().state?.current_target,room().state?.event_targets,room().state?.heard,players().map(p=>[p.id,p.pseudo,p.public_role])]);
  if(rulesPage.dataset.stamp!==stamp){
   // A state update normally rebuilds the whole tab. Patch only when the
   // current view is stale and a server sync did not trigger a render.
   rulesPage.dataset.stamp=stamp;
  }
 }
 const roleNote=[...main.querySelectorAll('small')].find(x=>x.textContent?.toUpperCase().includes('REPÈRE DE RÔLE'));
 roleNote?.closest('section,article')?.classList.add('igr835-secondary-note');
}
const oldRender=typeof renderGame==='function'?renderGame:window.renderGame;
if(typeof oldRender==='function'){
 const wrapped=function(...args){const result=oldRender.apply(this,args);queue();return result};
 try{renderGame=wrapped}catch(_){}window.renderGame=wrapped;
}
let queued=false;
function queue(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;patch()});
}
function boot(){
 const root=document.getElementById('app');if(!root)return;
 new MutationObserver(queue).observe(root,{subtree:true,childList:true});
 window.addEventListener('igr:sync',queue,{passive:true});
 window.addEventListener('pageshow',queue,{passive:true});
 queue();
}
window.IGR_LIVE_FOCUS_V835=Object.freeze({version:'835.0',action,overview,patch});
if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();