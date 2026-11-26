/* v838 — Mobile live game: visible priorities, accessible destinations.
   Presentation only. Existing role-authorized handlers remain untouched. */
(()=>{
'use strict';
if(window.IGR_INTUITIVE_LIVE_V838)return;
const app=()=>document.getElementById('app');
const state=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch(_){return window.STATE}};
const en=()=>window.IGR_LOCALE==='en';
const tr=(fr,eng)=>en()?eng:fr;
const tabs=['cycle','investigation','channel','card'];
const names={cycle:['Actions','Actions'],investigation:['Preuves','Evidence'],
 channel:['Messages','Messages'],card:['Ma fiche','My card'],
 timeline:['Dossier commun','Shared case file'],video:['Flux vidéo','Video feed'],
 rules:['Joueurs & partie','Players & party'],profiling:['Profilage','Profiling']};
const name=id=>(names[id]||[id,id])[en()?1:0];
const go=id=>{
 if(typeof window.setTab!=='function')return;
 if(state()?.tab!==id)window.setTab(id);
 if(id!=='cycle')return;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const panel=app()?.querySelector('.game-panel-v11');
  const phase=state()?.sync?.room?.phase;
  const selectors={interrogation_select:'button[onclick*="startInterrogation"]',cycle_debrief:'.qcm-v11 select'};
  const control=panel?.querySelector(selectors[phase]||'.action-section button,.igr827-investigator-controls button')||panel;
  if(!control)return;
  for(let parent=control.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  control.focus({preventScroll:true});control.scrollIntoView({block:'center',behavior:'instant'});
 }));
};
const make=(label,klass,id)=>{
 const b=document.createElement('button');b.type='button';b.textContent=label;
 b.className=klass;b.addEventListener('click',()=>go(id));return b;
};
let activeNav=null;
function closeMore(){
 if(!activeNav?.isConnected)return;
 const p=activeNav.querySelector('.igr838-more-panel'),b=activeNav.querySelector('.igr838-more-btn');
 if(p)p.hidden=true;
 if(b)b.setAttribute('aria-expanded','false');
}
function fitMoreMenu(){
 const menu=activeNav?.querySelector('.igr838-more-panel');
 if(!menu||menu.hidden||!window.matchMedia('(max-width:700px)').matches)return;
 const rect=activeNav.getBoundingClientRect();
 const viewport=window.visualViewport;
 const top=viewport?.offsetTop||0;
 const above=Math.max(0,rect.top-top-12);
 const below=Math.max(0,top+(viewport?.height||innerHeight)-rect.bottom-12);
 const opensAbove=below<menu.scrollHeight&&above>below;
 menu.style.top=opensAbove?'auto':'calc(100% + 6px)';
 menu.style.bottom=opensAbove?'calc(100% + 6px)':'auto';
 menu.style.maxHeight=(opensAbove?above:below)+'px';
}
function navigation(main){
 const nav=main.querySelector(':scope > .tabs-v11');if(!nav)return;
 activeNav=nav;
 if(!nav.classList.contains('igr838-ready')){
  nav.classList.add('igr836-nav','igr838-nav','igr838-ready');
  nav.setAttribute('aria-label',tr('Navigation de la partie','Game navigation'));
  const original=[...nav.querySelectorAll(':scope > .tab[data-view]')];
  const extras=original.filter(b=>!tabs.includes(b.dataset.view));
  original.filter(b=>tabs.includes(b.dataset.view)).forEach(b=>{
   b.classList.add('igr838-main-tab');
   b.setAttribute('aria-label',name(b.dataset.view));
   b.textContent=name(b.dataset.view);
  });
  for(const id of tabs){
   const b=original.find(x=>x.dataset.view===id);
   if(b)nav.appendChild(b);
  }
  if(extras.length){
   const toggle=document.createElement('button');
   toggle.type='button';toggle.className='igr838-more-btn';
   toggle.textContent=tr('Plus','More');
   toggle.setAttribute('aria-expanded','false');
   toggle.setAttribute('aria-haspopup','true');
   toggle.setAttribute('aria-controls','igr838MorePanel');
   const menu=document.createElement('div');
   menu.className='igr838-more-panel';menu.id='igr838MorePanel';
   menu.hidden=true;menu.setAttribute('aria-label',tr('Autres rubriques','Other sections'));
   extras.forEach(b=>{
    b.classList.add('igr838-extra-tab');
    b.textContent=name(b.dataset.view);
    b.setAttribute('aria-label',name(b.dataset.view));
    menu.appendChild(b);
   });
   toggle.addEventListener('click',event=>{
    event.stopPropagation();
    menu.hidden=!menu.hidden;
    fitMoreMenu();
    toggle.setAttribute('aria-expanded',String(!menu.hidden));
   });
   nav.append(toggle,menu);
  }
 }
 const count=nav.querySelectorAll(':scope > .igr838-main-tab').length+
  Number(!!nav.querySelector(':scope > .igr838-more-btn'));
 nav.style.setProperty('--igr838-count',Math.max(1,count));
 const selected=!!nav.querySelector('.igr838-more-panel > .tab.active');
 nav.querySelector('.igr838-more-btn')?.classList.toggle('active',selected);
}
function roleHelp(main){
 const tip=main.querySelector('#igr694RoleTip');
 if(!tip)return;
 let details=main.querySelector('#igr836RoleHelp');
 if(!details){
  details=document.createElement('details');details.id='igr836RoleHelp';
  details.className='igr836-role-help';
  details.appendChild(document.createElement('summary'));
  tip.before(details);
 }
 if(tip.parentElement!==details)details.appendChild(tip);
 const text=tr('Conseil de rôle','Role guidance');
 if(!details.firstElementChild?.textContent)details.firstElementChild.textContent=text;
}
function role(){const s=state();return String(s?.sync?.player?.public_role||s?.role||'')}
function focus(){
 const f=window.IGR_LIVE_FOCUS_V835?.action?.();if(!f)return null;
 const me=String(state()?.sync?.player?.id||state()?.playerId||'');
 if(f.ids?.some(id=>String(id)===me)&&role()==='suspect')
  return ['card',tr('Relire ma fiche','Read my card')];
 if(role()==='enqueteur')return ['cycle',tr('Ouvrir les commandes','Open controls')];
 if(role()==='analyste')return ['investigation',tr('Consulter les preuves','Review evidence')];
 return ['card',tr('Consulter ma fiche','View my card')];
}
function status(){
 const ph=String(state()?.sync?.room?.phase||''),r=role();
 const lead=['enqueteur','analyste'].includes(r);
 switch(ph){
 case 'initial_debrief':case 'investigation_assembly':
  return {act:lead,title:lead?tr('Préparer l’enquête','Prepare the investigation'):tr('L’enquête se prépare','The case is being prepared')};
 case 'interrogation_select':
  return {act:r==='enqueteur',title:r==='enqueteur'?tr('Choisir le prochain interrogatoire','Choose the next interview'):tr('L’enquêteur choisit le suspect','The investigator is choosing a suspect')};
 case 'event_select':
  return {act:r==='enqueteur',title:r==='enqueteur'?tr('Choisir le prochain événement','Choose the next event'):tr('Un nouvel événement se prépare','An event is being prepared')};
 case 'cycle_debrief':
  return {act:lead,title:lead?tr('Répondre au débrief du cycle','Complete the cycle debrief'):tr('Débrief du camp Enquête','Investigation team debrief')};
 case 'trame':
  return {act:false,title:tr('Nouvel élément de l’enquête','New development in the case')};
 default:return null;
 }
}
function priority(main){
 const spotlight=main.querySelector('#igr835Spotlight');
 if(spotlight){
  const old=main.querySelector('#igr838Now');old?.remove();
  if(!spotlight.querySelector('.igr838-spotlight-cta')){
   const dst=focus();if(dst)spotlight.appendChild(make(dst[1],'igr838-spotlight-cta',dst[0]));
  }
  return;
 }
 const strip=main.querySelector(':scope > .phase-strip'),cfg=status();
 const old=main.querySelector('#igr838Now');
 if(!strip||!cfg){old?.remove();return}
 const key=JSON.stringify(cfg);
 if(old?.dataset.key===key)return;
 const section=document.createElement('section');section.id='igr838Now';section.className='igr838-now';
 section.dataset.key=key;
 const small=document.createElement('small');
 small.textContent=cfg.act?tr('À TON TOUR','YOUR TURN'):tr('EN CE MOMENT','RIGHT NOW');
 const h=document.createElement('h2');h.textContent=cfg.title;
 const desc=document.createElement('p');
 desc.textContent=cfg.act?tr('La commande correspondante est dans Actions.','The corresponding control is in Actions.'):
  tr('Aucune commande requise pour ton rôle actuellement.','No action required for your role right now.');
 section.append(small,h,desc,make(cfg.act?tr('Ouvrir les actions','Open actions'):tr('Relire ma fiche','Read my card'),
  'igr838-cta',cfg.act?'cycle':'card'));
 if(old)old.replaceWith(section);else strip.insertAdjacentElement('afterend',section);
}
function shortcuts(main){
 const enquiry=main.querySelector(':scope > .game-panel-v11 .igr834-enquiry');
 const head=enquiry?.querySelector(':scope > .igr834-heading');
 if(!head||enquiry.querySelector('#igr838Shortcuts'))return;
 const row=document.createElement('div');row.id='igr838Shortcuts';
 row.className='igr838-shortcuts';
 row.append(make(tr('Dossier commun','Shared case file'),'igr838-shortcut','timeline'),
  make(tr('Joueurs','Players'),'igr838-shortcut igr838-shortcut-muted','rules'));
 head.after(row);
}
function roster(main){
 const jump=main.querySelector('#igr835PartyJump');
 if(!jump)return;
 const n=state()?.sync?.players?.length||0;
 const text=n+' '+tr('joueurs · Voir','players · View');
 if(jump.textContent!==text)jump.textContent=text;
}
let draftScope='';
const answers=new Map();
const answerSelector='.final-form select[id],.final-form textarea[id],.qcm-v11 select[id],.qcm-v11 textarea[id]';
function syncDraftScope(){
 const s=state(),r=s?.sync?.room,p=s?.sync?.player;
 const eligible=s?.view==='game'&&p?.id&&['locking','cycle_debrief'].includes(r?.phase);
 const locked=eligible&&s.sync.my_actions?.some(a=>r.phase==='locking'?a.action_type==='final_lock':a.action_type==='debrief'&&Number(a.cycle)===Number(r.cycle));
 const key=eligible&&!locked?JSON.stringify([s.room,p.id,r.scenario_id,r.cycle,r.phase,r.phase_started_at]):'';
 if(key!==draftScope){answers.clear();draftScope=key}
 return !!key;
}
function captureAnswer(event){
 const field=event.target;
 if(field.matches?.(answerSelector)&&syncDraftScope())answers.set(field.id,field.value);
}
function restoreAnswers(main){
 if(!syncDraftScope()||!answers.size)return;
 for(const field of main.querySelectorAll(answerSelector)){
  if(!answers.has(field.id)||field.disabled)continue;
  const value=answers.get(field.id);
  if(field.options&&!Array.from(field.options).some(option=>option.value===value))continue;
  if(field.value!==value)field.value=value;
 }
}
function patch(){
 const main=app()?.querySelector('main.game-v11');if(!main){syncDraftScope();return}
 restoreAnswers(main);navigation(main);roleHelp(main);priority(main);shortcuts(main);roster(main);
}
let queued=false;
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;patch()});
}
function boot(){
 const root=app();if(!root)return;
 root.addEventListener('input',captureAnswer,true);
 root.addEventListener('change',captureAnswer,true);
 window.addEventListener('resize',fitMoreMenu,{passive:true});
 window.addEventListener('scroll',fitMoreMenu,{passive:true});
 window.visualViewport?.addEventListener('resize',fitMoreMenu,{passive:true});
 new MutationObserver(changes=>{
  if(changes.some(x=>x.type==='childList'&&(x.addedNodes.length||x.removedNodes.length)))schedule();
 }).observe(root,{subtree:true,childList:true});
 document.addEventListener('pointerdown',ev=>{
  if(activeNav?.isConnected&&!activeNav.contains(ev.target))closeMore();
 },true);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeMore()});
 window.addEventListener('igr:sync',schedule,{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();
}
window.IGR_INTUITIVE_LIVE_V838=Object.freeze({version:'838.0',patch});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();