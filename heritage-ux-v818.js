/* Inside Grey Room v818 — Héritage navigation clarity.
   Progressive enhancement only: original campaign cards keep their handlers. */
(()=>{
'use strict';
const $=(s,p=document)=>p.querySelector(s);
let queued=false;
/* The four cinematic campaign posters are the only navigation choices. */
function progress(root){
 const hub=$('main.hplay-hub',root);
 if(hub)hub.querySelector('.hu-quick-nav')?.remove();
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
function boot(){
 const root=$('#app');if(!root)return;
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.IGR_HERITAGE_UI_V818=Object.freeze({version:'820',refresh:schedule});
})();
