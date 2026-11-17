/* Inside Grey Room v772 — compact role reminders and investigation evidence.
   Cast aliases and the official countdown are handled by cast-names-v772 and idle-choice-v772. */
(()=>{
'use strict';
if(window.IGR_INVESTIGATION_V772)return;
let queued=false;
function compact(){
 const root=document.querySelector('#app .game-v11');
 if(!root)return;
 for(const guide of root.querySelectorAll('.igr50-role-guide')){
  if(guide.closest('.igr772-guide'))continue;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='igr772-guide';summary.textContent='Rappels du rôle';
  guide.before(details);details.append(summary,guide);
 }
 for(const section of root.querySelectorAll('.igr001-reports')){
  const h=section.querySelector(':scope > h3');if(!h)continue;
  const count=(h.textContent.match(/\d+/)||[])[0];
  const header=section.closest('#igr634-evidence')?.querySelector('summary');
  if(header&&count&&!header.querySelector('.igr772-piece-count')){
   const badge=document.createElement('small');badge.className='igr772-piece-count';
   badge.textContent=count+' pièce'+(count==='1'?'':'s');header.appendChild(badge);
  }
  h.classList.add('igr772-repeated-title');
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;compact();});}
function start(){
 const app=document.querySelector('#app');
 if(app&&window.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.IGR_INVESTIGATION_V772=Object.freeze({version:'v772',refresh:schedule});
})();