/* Héritage v762 — clear campaign join shortcuts and compact Casino entry. */
(()=>{
'use strict';
const labels=['CAMPAGNES','DOSSIERS','MODE','PRÉPARATION','LOBBY'];
const $=(q,p=document)=>p.querySelector(q);
const $$=(q,p=document)=>Array.from(p.querySelectorAll(q));
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
 if(match){progressMeter(lobby,title,Number(match[1]),5,7);title?.querySelector('p')?.classList.add('hj-counter-moved')}
 const grid=$('.hnet-role-grid',lobby),selected=$('.hnet-selected-role',lobby);
 // Always place the current public selection before the complete role list.
 if(grid&&selected&&selected.nextElementSibling!==grid)grid.insertAdjacentElement('beforebegin',selected);
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
 if(choice&&groups&&choice.nextElementSibling!==groups)groups.insertAdjacentElement('beforebegin',choice);
 const panel=$('.casino-lobby-top',casino);if(!panel)return;
 const match=panel.textContent.match(/([0-9]+)\s*\/\s*12\s*joueurs/i);
 const anchor=$('.casino-lobby-access',panel);
 if(match&&anchor)progressMeter(panel,anchor,Number(match[1]),7,12);
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
  if(parent?.querySelector(':scope > .hj-join-entry'))continue;
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
 if(typeof goJoin==='function')goJoin();
 else if(typeof renderJoin==='function')renderJoin();
 const join=$('#joinCode');
 if(join){join.maxLength=10;join.placeholder='Code d’invitation'}
 const heading=$('.page-head h1');
 if(heading)heading.textContent='Rejoindre une partie';
 const kicker=$('.page-head .kicker');
 if(kicker)kicker.textContent='HÉRITAGE';
}
function decorate(){
 const root=$('#app');if(!root)return;
 const main=$('main.hplay,main.hnet',root);
 if(main){
  const index=stage(main),head=$(':scope > .hplay-top,:scope > .hnet-head',main);
  if(index>=0&&head&&!$('.hj-progress',main))head.insertAdjacentHTML('afterend',markup(index,main.matches('.hplay-setup')));
  styleModeButtons(main);
  enhanceCampaignJoin(root);
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
function boot(){const root=$('#app');if(!root)return;document.addEventListener('click',handleJoinClick,true);new MutationObserver(schedule).observe(root,{subtree:true,childList:true});schedule();window.addEventListener('pageshow',schedule,{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();