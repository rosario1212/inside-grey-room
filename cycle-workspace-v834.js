/* v834: Dedicated Cycle tab. Rendering only: reuse role-authorized HTML and
   existing server actions; no RPC, timer, evidence or victory rule changes. */
(()=>{
'use strict';
if(window.IGR_CYCLE_WORKSPACE_V834)return;
const state=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
const en=()=>window.IGR_LOCALE==='en';
const tr=(fr,eng)=>en()?eng:fr;
const role=()=>String(state()?.sync?.player?.public_role||state()?.role||'');
const lead=()=>['enqueteur','analyste','procureur','inspecteur','expert','juge'].includes(role());
function isAction(node){
 if(node.nodeType!==1)return false;
 if(node.matches('.phase-explain,.action-section,.qcm-v11,.request-box,.final-form,.locked-state,.trame-focus,.igr771-disclosure,.igr827-investigator-controls,.igr829-quiz'))return true;
 return !!node.querySelector('button[onclick],button[type="submit"],select,textarea,[data-cycle-action]');
}
function header(cycle){
 const node=document.createElement('header');node.className='igr834-heading';
 const small=document.createElement('small');small.textContent=tr('ESPACE DE JEU','GAME WORKSPACE');
 const title=document.createElement('h2');title.textContent=cycle?tr('Cycle · Actions','Cycle · Actions'):tr('Enquête · Dossier et notes','Investigation · Evidence and notes');
 const desc=document.createElement('p');desc.textContent=cycle?
  tr('Interrogatoires, confrontations, vérifications, décisions et nouvelles trames.','Interviews, confrontations, investigations, decisions and new story events.'):
  tr('Consulte les preuves et les notes. Les décisions se prennent dans Cycle.','Review evidence and notes. Make decisions in Cycle.');
 node.append(small,title,desc);return node;
}
function partition(html,tab){
 const template=document.createElement('template');template.innerHTML=String(html??'');
 const cycle=tab==='cycle',source=template.content.querySelector('.igr634-workspace');
 const out=document.createElement('div');out.className='igr834-workspace '+(cycle?'igr834-cycle':'igr834-enquiry');
 out.appendChild(header(cycle));let count=0;
 if(source&&lead()){
  const group=cycle?new Set(['priority','interviews','actions']):new Set(['evidence','notebook','personal']);
  for(const child of [...source.children]){
   const key=child.dataset?.igr634Group||child.id?.replace(/^igr634-/,'')|| (child.classList.contains('igr634-priority')?'priority':child.classList.contains('igr634-interviews')?'interviews':'');
   if(group.has(key)){out.appendChild(child);count++}
  }
  // Ancillary, role-authorized panels must never be lost.
  for(const child of [...template.content.childNodes]){
   if(child===source){child.remove();continue}
   if(child.nodeType!==1)continue;
   if(isAction(child)===cycle){out.appendChild(child);count++}
  }
 }else{
  for(const child of [...template.content.childNodes]){
   if(child.nodeType!==1)continue;
   if(isAction(child)===cycle){out.appendChild(child);count++}
  }
 }
 if(!count){
  const empty=document.createElement('p');empty.className='igr834-empty';
  empty.textContent=cycle?tr('Aucune décision à prendre actuellement pour ton rôle.','No current decision for your role.'):
    tr('Les éléments consultables apparaîtront ici lorsqu’ils seront disponibles.','Available case information will appear here.');
  out.appendChild(empty);
 }
 return out.outerHTML;
}
const oldTabs=typeof gameTabs==='function'?gameTabs:window.gameTabs;
if(typeof oldTabs==='function'){
 const wrapped=function(...args){
  const tabs=[...(oldTabs.apply(this,args)||[])];if(tabs.some(x=>x?.id==='cycle'))return tabs;
  const index=tabs.findIndex(x=>x?.id==='card');
  tabs.splice(index<0?0:index+1,0,{id:'cycle',label:'Cycle'});return tabs;
 };
 try{gameTabs=wrapped}catch(_){}window.gameTabs=wrapped;
}
const oldPanel=typeof renderGameTab==='function'?renderGameTab:window.renderGameTab;
if(typeof oldPanel==='function'){
 const wrapped=function(...args){
  const s=state(),tab=s?.tab;
  if(!['cycle','investigation'].includes(tab))return oldPanel.apply(this,args);
  let original;
  try{
   // Give all existing investigator/suspect wrappers their usual tab state.
   if(tab==='cycle')s.tab='investigation';
   original=oldPanel.apply(this,args);
  }finally{if(tab==='cycle')s.tab='cycle'}
  try{return partition(original,tab)}
  catch(error){console.warn('[IGR v834] fallback',error);return original}
 };
 try{renderGameTab=wrapped}catch(_){}window.renderGameTab=wrapped;
}
const oldRender=typeof renderGame==='function'?renderGame:window.renderGame;
if(typeof oldRender==='function'){
 const wrapped=function(...args){
  const result=oldRender.apply(this,args);
  // No duplicate "Action en cours" controls above the tabs for base roles.
  if(['enqueteur','analyste','suspect'].includes(role()))
   document.querySelector('#app main.game-v11 .igr106-action-panel')?.remove();
  return result;
 };
 try{renderGame=wrapped}catch(_){}window.renderGame=wrapped;
}
window.IGR_CYCLE_WORKSPACE_V834=Object.freeze({version:'834.0',partition});
})();