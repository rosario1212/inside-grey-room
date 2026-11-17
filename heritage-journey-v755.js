/* Héritage v765 — dossier-first modes, consistent Return and stabilized scrolling. */
(()=>{
'use strict';
const labels=['CAMPAGNES','DOSSIERS','MODE','PRÉPARATION','LOBBY'];
const $=(q,p=document)=>p.querySelector(q);
const $$=(q,p=document)=>Array.from(p.querySelectorAll(q));
let joinReturn=null, lastRoute='';
const markup=(step,local=false)=>{const steps=local?['CAMPAGNES','DOSSIERS','MODE','JOUEURS']:labels;return '<nav class="hj-progress'+(local?' hj-progress-local':'')+'" aria-label="Parcours Héritage"><div class="hj-progress-label"><span>PARCOURS</span><b>ÉTAPE '+(step+1)+'/'+steps.length+' · '+steps[step]+'</b></div><ol>'+steps.map((label,i)=>'<li class="'+(i<step?'is-done':i===step?'is-current':'')+'" '+(i===step?'aria-current="step"':'')+'><span aria-hidden="true">'+(i<step?'✓':i+1)+'</span><b>'+label+'</b></li>').join('')+'</ol></nav>'}
function stage(main){
 if(main.matches('.hplay-hub'))return 0;
 if(main.matches('.hplay-campaign'))return 1;
 if(main.matches('.hplay-dossier'))return 2;
 if(main.matches('.hplay-setup')||$('.hnet-create',main))return 3;
 if($('.hnet-lobby',main))return 4;
 return -1;
}
function styleModeButtons(main){
 $$('.heritage-dual-row > button',main).forEach(btn=>{
  if(btn.dataset.hjStyled)return;
  const text=(btn.textContent||'').trim();
  const online=btn.classList.contains('heritage-online-btn')||/en ligne|multijoueur/i.test(text)||['create','resume'].includes(btn.dataset.mnet);
  const resume=/reprendre/i.test(text);
  const title=online?(resume?'REPRENDRE EN LIGNE':'EN LIGNE'):(resume?'REPRENDRE EN LOCAL':'EN LOCAL');
  const detail=online?'UN ÉCRAN PAR JOUEUR':'UN TÉLÉPHONE À TABLE';
  const icon=online
   ?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19v-2.5a5.5 5.5 0 0 1 11 0V19M16.5 5.8a3 3 0 0 1 0 5.8M18 13.7a4.4 4.4 0 0 1 2.5 4V19"/></svg>'
   :'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18.5h4"/></svg>';
  btn.classList.add(online?'hj-mode-online':'hj-mode-local');
  btn.innerHTML='<span class="hj-mode-icon" aria-hidden="true">'+icon+'</span><span class="hj-mode-copy"><strong>'+title+'</strong><small>'+detail+'</small></span><span class="hj-mode-chevron" aria-hidden="true">›</span>';
  btn.setAttribute('aria-label',title+' — '+detail.toLowerCase());
  btn.dataset.hjStyled='1';
 });
}

/* Presentation-only enhancements: values are read from the visible authoritative lobby. */
function progressMeter(target,anchor,count,min,max){
 if(!target||!anchor||!Number.isFinite(count)||count<0||count>max||$('.hj-table-meter',target))return;
 const meter=document.createElement('div');meter.className='hj-table-meter';
 const track=document.createElement('div');track.className='hj-table-track';track.setAttribute('aria-hidden','true');
 const fill=document.createElement('i');fill.style.width=Math.round(100*count/max)+'%';track.appendChild(fill);
 const caption=document.createElement('div');caption.className='hj-table-caption';
 const status=document.createElement('b');status.textContent=count<min
  ?'Encore '+(min-count)+' participant'+(min-count>1?'s':'')+' à inviter'
  :'Effectif minimum atteint';
 const seats=document.createElement('small');seats.textContent=count+'/'+max+' joueurs';
 caption.append(status,seats);meter.append(track,caption);anchor.insertAdjacentElement('afterend',meter);
}
function enrichHeritageLobby(main){
 const lobby=$('.hnet-lobby',main);if(!lobby)return;
 const title=$('.hnet-title',lobby);
 const match=title?.textContent?.match(/([0-9]+)\s*\/\s*7\s*joueurs/i);
 // Keep the native counter. Adding a meter after rendering shifts the role cards.
 const grid=$('.hnet-role-grid',lobby),selected=$('.hnet-selected-role',lobby);
 // Always place the current public selection before the complete role list.
 // Native templates already place the public selection above the cards.
 Array.from(lobby.querySelectorAll('.hnet-role-card')).forEach(card=>{
  if(card.classList.contains('hnet-role-random')||$('.hj-role-description',card))return;
  const publicLabel=card.getAttribute('aria-label')||'';
  const description=publicLabel.split(' — ').slice(1).join(' — ').trim();
  if(description&&description.length<=140){
   const helper=document.createElement('small');helper.className='hj-role-description';helper.textContent=description;
   const stars=$('.hnet-stars',card);
   if(stars)stars.insertAdjacentElement('beforebegin',helper);else card.appendChild(helper);
  }
  const stars=$('.hnet-stars',card);
  if(stars&&!stars.title)stars.title='Activité estimée, pas puissance';
 });
 const picked=$('.hnet-role-card[aria-pressed="true"]',lobby);
 if(picked)picked.setAttribute('data-hj-picked','true');
}
function enrichCasinoLobby(casino){
 const roleZone=$('.casino-role-choice-zone',casino);
 const choice=roleZone&&$('.casino-selected-role',roleZone),groups=roleZone&&$('.casino-role-choice-group',roleZone);
 // Casino keeps its role summary in the render template, not in a deferred move.
 const panel=$('.casino-lobby-top',casino);if(!panel)return;
 const match=panel.textContent.match(/([0-9]+)\s*\/\s*12\s*joueurs/i);
 const anchor=$('.casino-lobby-access',panel);
 // An extra meter duplicates the counter and shifts the live lobby.
}

/* One direct joining action on the Heritage hub and every non-Casino campaign.
   The existing verified Join screen owns code validation and room restoration. */
function enhanceCampaignJoin(root){
 const hub=$('main.hplay-hub',root),campaign=$('main.hplay-campaign',root);
 const targets=[
  hub&&$('.hplay-hub-intro',hub),
  campaign&&$('.hplay-campaign-hero',campaign)
 ].filter(Boolean);
 for(const target of targets){
  const parent=target.parentElement;
  if(parent?.querySelector('.hj-join-entry'))continue;
  const button=document.createElement('button');
  button.type='button';button.className='hj-join-entry';
  button.dataset.hjJoin='1';
  button.textContent='Rejoindre une partie';
  button.setAttribute('aria-label','Rejoindre une partie Héritage avec un code');
  target.insertAdjacentElement('afterend',button);
 }
}
function handleJoinClick(event){
 const button=event.target.closest?.('[data-hj-join]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 const origin=button.closest('main.hplay');
 joinReturn=origin?{campaign:journeyCampaign(origin),isHub:origin.classList.contains('hplay-hub')}:null;
 if(typeof goJoin==='function')goJoin();
 else if(typeof renderJoin==='function')renderJoin();
 const join=$('#joinCode');
 if(join){join.maxLength=10;join.placeholder='Code d’invitation'}
 const heading=$('.page-head h1');
 if(heading)heading.textContent='Rejoindre une partie';
 const kicker=$('.page-head .kicker');
 if(kicker)kicker.textContent='HÉRITAGE';
}
/* A primary play action sits beside (rather than below) the existing Join action. */
function enhanceCampaignStart(root){
 const main=$('main.hplay-campaign',root),hero=main&&$('.hplay-campaign-hero',main);
 if(!hero)return;
 let row=$('.hj-campaign-actions',main);
 if(!row){row=document.createElement('div');row.className='hj-campaign-actions';hero.insertAdjacentElement('afterend',row)}
 let play=$('.hj-campaign-play',row);
 if(!play){play=document.createElement('button');play.type='button';play.className='hj-campaign-play';play.dataset.hjPlay='1';row.appendChild(play)}
 const active=$('.hplay-case.is-current:not(:disabled)',main);
 const resumed=active&&/PARTIE EN COURS/i.test(active.textContent||'');
 const label=active?(resumed?'Reprendre le dossier actif':'Jouer le dossier actif'):'Choisir un dossier';
 if(play.textContent!==label)play.textContent=label;
 const join=$('.hj-join-entry',main);
 if(join&&join.parentElement!==row)row.appendChild(join);
}
function moveDossierPlayChoices(root){
 const main=$('main.hplay-dossier',root),grid=main&&$('.hplay-dossier-grid',main),box=main&&$('.hplay-launch-box',main);
 const copy=grid&&$('.hplay-dossier-copy',grid);
 if(!grid||!box||!copy)return;
 // Poster → dossier title → mode selection → narrative.
 // Keep the chooser in its natural reading order, not above the artwork.
 const title=$('h1',copy);
 if(title&&box.previousElementSibling!==title)title.insertAdjacentElement('afterend',box);
 else if(!title&&box.parentElement!==copy)copy.prepend(box);
 if(!box.classList.contains('hj-dossier-entry'))box.classList.add('hj-dossier-entry');
}
function journeyCampaign(main){
 if(main.classList.contains('maitre-page')||main.classList.contains('hplay-theme-maitre'))return 'maitre';
 if(main.classList.contains('hplay-theme-cendres'))return 'cendres';
 if(main.classList.contains('hplay-theme-kuroi'))return 'kuroi';
 return '';
}
function journeyBack(main){
 return $('.hplay-back[data-hp-action="chapter"],.hplay-back[data-maitre-action="chapter"],#hnetBack',main);
}
function canNavigateBack(main,from,to){
 if(!main||to>=from||$('.hnet-lobby',main))return false;
 if(to===0)return typeof window.IGR_HERITAGE_PLAY?.open==='function';
 const id=journeyCampaign(main);
 if(to===1)return id==='maitre'
  ?typeof window.IGR_HERITAGE_MAITRE?.open==='function'
  :!!id&&typeof window.IGR_HERITAGE_PLAY?.openCampaign==='function';
 if(to===2)return !!journeyBack(main);
 return false;
}
function makeProgressClickable(main){
 const nav=$('.hj-progress',main),from=stage(main);
 if(!nav||from<1)return;
 $$('ol > li.is-done',nav).forEach(li=>{
  if(li.querySelector('button'))return;
  const to=Array.from(li.parentElement.children).indexOf(li);
  if(!canNavigateBack(main,from,to))return;
  const label=$('b',li)?.textContent||'étape précédente';
  const button=document.createElement('button');
  button.type='button';button.className='hj-step-link';button.dataset.hjStep=String(to);
  button.setAttribute('aria-label','Revenir à '+label.toLowerCase());
  while(li.firstChild)button.appendChild(li.firstChild);
  li.appendChild(button);
 });
}
function handleStartClick(event){
 const button=event.target.closest?.('[data-hj-play]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 const main=button.closest('main.hplay-campaign'),active=main&&$('.hplay-case.is-current:not(:disabled)',main);
 if(active){active.click();return}
 const first=main&&$('.hplay-case:not(:disabled)',main);
 if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.focus({preventScroll:true})}
}
function handleProgressClick(event){
 const button=event.target.closest?.('[data-hj-step]');
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 const main=button.closest('main.hplay,main.hnet'),from=main&&stage(main),to=Number(button.dataset.hjStep);
 if(!canNavigateBack(main,from,to))return;
 if(to===0){window.IGR_HERITAGE_PLAY.open();return}
 if(to===1){
  const id=journeyCampaign(main);
  if(id==='maitre')window.IGR_HERITAGE_MAITRE.open();
  else window.IGR_HERITAGE_PLAY.openCampaign(id);
  return;
 }
 if(to===2)journeyBack(main)?.click();
}
/* Join is a sub-screen of the campaign: Back returns to that context. */
function enhanceJoinBack(root){
 const code=$('#joinCode',root),page=code?.closest('main.page');
 if(!page)return;
 const head=$('.page-head',page),home=head&&$('button[onclick*="goHome"]',head);
 if(!home||home.dataset.hjReturn)return;
 home.removeAttribute('onclick');home.dataset.hjReturn='1';home.type='button';
 home.textContent='← Retour';
 home.setAttribute('aria-label',joinReturn?'Retour à la campagne précédente':'Retour à l’accueil');
}
function handleJoinBack(event){
 const btn=event.target.closest?.('[data-hj-return]');
 if(!btn)return;
 event.preventDefault();event.stopImmediatePropagation();
 const origin=joinReturn;joinReturn=null;
 if(origin?.isHub&&window.IGR_HERITAGE_PLAY?.open){window.IGR_HERITAGE_PLAY.open();return}
 if(origin?.campaign==='maitre'&&window.IGR_HERITAGE_MAITRE?.open){window.IGR_HERITAGE_MAITRE.open();return}
 if(origin?.campaign&&window.IGR_HERITAGE_PLAY?.openCampaign){window.IGR_HERITAGE_PLAY.openCampaign(origin.campaign);return}
 if(typeof goHome==='function')goHome();
}
/* Real screen transitions start at top; lobby refreshes never reset scroll.
   Returning from a case detail to the list retains deliberate list position. */
function routeKey(root){
 const main=$('main',root);
 if(!main){
  if($('.home',root))return 'base:home';
  try{if(typeof STATE!=='undefined'&&STATE?.view)return 'base:'+STATE.view}catch(_){}
  return '';
 }
 if(main.classList.contains('hplay-hub'))return 'heritage:hub';
 if(main.classList.contains('hplay-campaign'))return 'heritage:'+journeyCampaign(main)+':campaign';
 if(main.classList.contains('hplay-dossier'))return 'heritage:'+journeyCampaign(main)+':dossier:'+($('.hplay-mode',main)?.textContent||'');
 if(main.classList.contains('hplay-setup'))return 'heritage:'+journeyCampaign(main)+':setup';
 if(main.classList.contains('hplay-reveal'))return 'heritage:reveal';
 if(main.classList.contains('hplay-session'))return 'heritage:session';
 if(main.classList.contains('hplay-decision'))return 'heritage:decision';
 if(main.classList.contains('hplay-result'))return 'heritage:result';
 if(main.classList.contains('hnet')){
  if($('.hnet-lobby',main))return 'heritage:online:lobby';
  if($('.hnet-create',main))return 'heritage:online:create';
  return 'heritage:online:other';
 }
 if(main.classList.contains('casino-live')){
  if($('.casino-lobby-top',main))return 'casino:lobby';
  if($('.casino-entry-options',main))return 'casino:entry';
  return 'casino:play:'+(main.querySelector('.casino-tabs [aria-selected="true"]')?.textContent||'');
 }
 if(main.classList.contains('casino-page'))return 'casino:'+String(main.dataset.casinoPage||'campaign');
 if(main.classList.contains('page-create-v10-13'))return 'scenarios:list';
 if(main.classList.contains('page-confirm-v10-13'))return 'scenarios:detail';
 if($('#joinCode',main))return 'join';
 try{if(typeof STATE!=='undefined'&&STATE?.view)return 'base:'+STATE.view}
 catch(_){}
 return 'page:'+main.className;
}
function scrollWithoutAnimation(y){
 const doc=document.documentElement,old=doc.style.scrollBehavior;
 doc.style.scrollBehavior='auto';
 try{window.scrollTo({top:Math.max(0,y),left:0,behavior:'instant'})}
 catch(_){window.scrollTo(0,Math.max(0,y))}
 doc.style.scrollBehavior=old;
}
function recordViewChange(root){
 const next=routeKey(root);if(!next||next===lastRoute)return;
 const previous=lastRoute;lastRoute=next;
 if(previous&&!(next==='scenarios:list'&&(previous==='scenarios:detail'||previous==='base:lobby'||previous.startsWith('page:localplay'))))scrollWithoutAnimation(0);
 if(previous==='join'&&next!=='join')joinReturn=null;
}
function decorate(){
 const root=$('#app');if(!root)return;
 enhanceJoinBack(root);
 const main=$('main.hplay,main.hnet',root);
 if(main){
  const index=stage(main),head=$(':scope > .hplay-top,:scope > .hnet-head',main);
  if(index>=0&&head&&!$('.hj-progress',main))head.insertAdjacentHTML('afterend',markup(index,main.matches('.hplay-setup')));
  styleModeButtons(main);
  enhanceCampaignJoin(root);
  enhanceCampaignStart(root);
  moveDossierPlayChoices(root);
  makeProgressClickable(main);
  enrichHeritageLobby(main);
  const copy=$('.hnet-code-copy',main);
  if(copy&&!copy.title)copy.title='Copier le code pour inviter les joueurs';
 }
 const casino=$('#casino-live-v105');
 if(casino)enrichCasinoLobby(casino);
 // The public Casino create/join selector is a single decision, not a
 // five-stage route: keep the progress navigator only for an active lobby.
 if(casino&&$('.casino-lobby-top',casino)&&!$('.hj-progress',casino))
  $('.casino-lobby-top',casino).insertAdjacentHTML('beforebegin',markup(4));
}
let frame=0;
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;decorate()})}
function boot(){const root=$('#app');if(!root)return;document.addEventListener('click',handleJoinClick,true);document.addEventListener('click',handleStartClick,true);document.addEventListener('click',handleProgressClick,true);document.addEventListener('click',handleJoinBack,true);new MutationObserver(()=>{recordViewChange(root);schedule()}).observe(root,{subtree:true,childList:true});recordViewChange(root);schedule();window.addEventListener('pageshow',schedule,{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();