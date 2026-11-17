/* Héritage v755 — visual-only navigation, without modifying game state. */
(()=>{
'use strict';
const labels=['CAMPAGNES','DOSSIERS','MODE','PRÉPARATION','LOBBY'];
const $=(q,p=document)=>p.querySelector(q);
const $$=(q,p=document)=>Array.from(p.querySelectorAll(q));
const markup=step=>'<nav class="hj-progress" aria-label="Parcours Héritage"><div class="hj-progress-label"><span>MODE HÉRITAGE</span><b>ÉTAPE '+(step+1)+' / 5</b></div><ol>'+labels.map((label,i)=>'<li class="'+(i<step?'is-done':i===step?'is-current':'')+'" '+(i===step?'aria-current="step"':'')+'><span aria-hidden="true">'+(i<step?'✓':i+1)+'</span><b>'+label+'</b></li>').join('')+'</ol></nav>';
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
function decorate(){
 const root=$('#app');if(!root)return;
 const main=$('main.hplay,main.hnet',root);
 if(main){
  const index=stage(main),head=$(':scope > .hplay-top,:scope > .hnet-head',main);
  if(index>=0&&head&&!$('.hj-progress',main))head.insertAdjacentHTML('afterend',markup(index));
  styleModeButtons(main);
  const copy=$('.hnet-code-copy',main);
  if(copy&&!copy.title)copy.title='Copier le code pour inviter les joueurs';
 }
 const casino=$('#casino-live-v105');
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