/* Inside Grey Room v818 — Héritage navigation clarity.
   Progressive enhancement only: original campaign cards keep their handlers. */
(()=>{
'use strict';
const CAMPAIGNS=[
 {id:'cendres',name:'CENDRES',meta:'5 dossiers',selector:'[data-hp-campaign="cendres"]'},
 {id:'kuroi',name:'KUROI',meta:'5 dossiers',selector:'[data-hp-campaign="kuroi"]'},
 {id:'maitre',name:'MAÎTRE',meta:'Campagne III',selector:'[data-maitre-open="campaign"]'},
 {id:'casino',name:'CASINO',meta:'3 scénarios',selector:'[data-casino-nav="campaign"]'}
];
const $=(s,p=document)=>p.querySelector(s);
let queued=false;
function quickNav(hub){
 const grid=$('.hplay-hub-grid',hub);if(!grid)return;
 let nav=$('.hu-quick-nav',hub);
 if(!nav){
  nav=document.createElement('nav');
  nav.className='hu-quick-nav';
  nav.setAttribute('aria-label','Accès rapide aux campagnes Héritage');
  const heading=document.createElement('div');
  heading.className='hu-quick-heading';
  const title=document.createElement('strong');title.textContent='CHOISIR UNE CAMPAGNE';
  const note=document.createElement('span');note.textContent='Accès direct';
  heading.append(title,note);
  const list=document.createElement('div');list.className='hu-quick-list';
  CAMPAIGNS.forEach((entry,i)=>{
   const btn=document.createElement('button');btn.type='button';
   btn.className='hu-quick-button';btn.dataset.huCampaign=entry.id;
   btn.setAttribute('aria-label','Ouvrir '+entry.name);
   const number=document.createElement('span');number.className='hu-quick-number';number.textContent=String(i+1).padStart(2,'0');
   const content=document.createElement('span');content.className='hu-quick-copy';
   const label=document.createElement('b');label.textContent=entry.name;
   const meta=document.createElement('small');meta.textContent=entry.meta;
   content.append(label,meta);
   btn.append(number,content);list.append(btn);
  });
  nav.append(heading,list);
  grid.insertAdjacentElement('beforebegin',nav);
 }
 CAMPAIGNS.forEach(entry=>{
  const card=$(entry.selector,grid);
  const btn=$('[data-hu-campaign="'+entry.id+'"]',nav);
  if(!btn)return;
  const disabled=!card||card.disabled;
  if(btn.disabled!==disabled)btn.disabled=disabled;
  if(disabled)btn.title='Campagne en cours de chargement';
  else btn.removeAttribute('title');
  // Reflect the real persistent CENDRES/KUROI counters, never invent progress.
  if(card&&entry.id!=='maitre'&&entry.id!=='casino'){
   const counter=$('.hplay-campaign-foot b',card)?.textContent?.trim();
   const caption=$('.hu-quick-copy small',btn);
   if(counter&&caption&&caption.textContent!==counter)caption.textContent=counter;
  }
 });
}
function progress(root){
 const hub=$('main.hplay-hub',root);
 if(hub)quickNav(hub);
 root.querySelectorAll('.hj-progress-label>span').forEach(label=>{
  if(label.textContent.trim()==='PARCOURS')label.textContent='LANCER UNE PARTIE';
 });
}
function casinoActions(root){
 root.querySelectorAll('main.casino-page .casino-launch-button[data-casino-live]').forEach(btn=>{
  const text='Créer ou reprendre une partie';
  if(btn.textContent.trim()!==text)btn.textContent=text;
 });
}
function decorate(){
 const root=$('#app');if(!root)return;
 progress(root);casinoActions(root);
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;decorate()});
}
function handleClick(event){
 const button=event.target.closest?.('.hu-quick-button[data-hu-campaign]');
 if(!button)return;
 const hub=button.closest('.hplay-hub');
 if(!hub)return;
 const entry=CAMPAIGNS.find(x=>x.id===button.dataset.huCampaign);
 if(!entry)return;
 event.preventDefault();event.stopPropagation();
 const card=$(entry.selector,$('.hplay-hub-grid',hub)||hub);
 if(card&&!card.disabled)card.click();
}
function boot(){
 const root=$('#app');if(!root)return;
 document.addEventListener('click',handleClick,true);
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.IGR_HERITAGE_UI_V818=Object.freeze({version:'818',refresh:schedule});
})();
