/* Héritage v757 — consistent pregame hierarchy, four local steps and safe DOM enhancement. */
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
  btn.innerHTML='<span class="hj-mode-icon" aria-hidden="true">'+(online?'◎':'◇')+'</span><span class="hj-mode-copy"><strong>'+title+'</strong><small>'+detail+'</small></span><span class="hj-mode-chevron" aria-hidden="true">›</span>';
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

function decorate(){
 const root=$('#app');if(!root)return;
 const main=$('main.hplay,main.hnet',root);
 if(main){
  const index=stage(main),head=$(':scope > .hplay-top,:scope > .hnet-head',main);
  if(index>=0&&head&&!$('.hj-progress',main))head.insertAdjacentHTML('afterend',markup(index,main.matches('.hplay-setup')));
  styleModeButtons(main);
  enrichHeritageLobby(main);
  const copy=$('.hnet-code-copy',main);
  if(copy&&!copy.title)copy.title='Copier le code pour inviter les joueurs';
 }
 const casino=$('#casino-live-v105');
 if(casino)enrichCasinoLobby(casino);
 if(casino&&!$('.hj-progress',casino)){
  const lobby=$('.casino-lobby-top',casino),entry=$('.casino-entry-options',casino);
  const anchor=lobby||entry;
  if(anchor)anchor.insertAdjacentHTML('beforebegin',markup(lobby?4:3));
 }
}
let frame=0;
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;decorate()})}
function boot(){const root=$('#app');if(!root)return;new MutationObserver(schedule).observe(root,{subtree:true,childList:true});schedule();window.addEventListener('pageshow',schedule,{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();