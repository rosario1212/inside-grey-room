/* Inside Grey Room v828 — editorial and clarity polish for the gameplay audit.
   Does not change permissions: the Investigator ends interviews/confrontations,
   the Host skips other phases. Never alters canonical evidence or role secrets. */
(()=>{
'use strict';
if(window.IGR_GAMEPLAY_AUDIT_V828)return;
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE;}catch(_){return window.STATE;}};
const room=()=>S()?.sync?.room;
const role=()=>S()?.sync?.player?.public_role||S()?.role||'';
const lang=()=>window.IGR_LOCALE==='en'?'en':'fr';
const tr=(fr,en)=>lang()==='en'?en:fr;
const root=()=>document.getElementById('app');
const game=()=>root()?.querySelector('main.game-v11');
const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uniqueNotice=(parent,id,content)=>{
  if(parent&&!parent.querySelector('#'+id)){
    const element=document.createElement('p');
    element.id=id;
    element.className='igr828-roster-note';
    element.textContent=content;
    parent.appendChild(element);
  }
};
function updateRoleCards(){
  const card=root()?.querySelector('.private-card-v11');
  if(!card||card.dataset.igr828Editorial==='1'||role()!=='suspect')return;
  const hint=card.querySelector('.igr82-relation-hint');
  if(hint){
    hint.textContent=tr('Voici ce que tu sais des autres personnes. Tu peux leur parler librement ; seul l’Enquêteur mène les interrogatoires officiels.',
      'Here is what you know about the others. You may speak freely; only the Investigator conducts official interviews.');
  }
  const title=card.querySelector('.igr82-relations > h4');
  if(title)title.textContent=tr('PERSONNES QUE TU CONNAIS','PEOPLE YOU KNOW');
  if(String(room()?.scenario_id)==='001'){
    const identity=card.querySelector('.igr-private-identity > span');
    const currentIdentity=identity?.textContent||'';
    const visitor=/exécutant|visiteur encapuchonné/i.test(currentIdentity);
    if(identity){
      // Only neutralize the private role heading, never the facts or secrets.
      if(/exécutant/i.test(currentIdentity))identity.textContent=tr('Le visiteur recruté','The hired visitor');
      else if(/ancien ami/i.test(currentIdentity))identity.textContent=tr('L’ancien ami de Maël','Maël’s former friend');
      else if(/client de l’hôtel/i.test(currentIdentity))identity.textContent=tr('Le client de l’hôtel','The hotel guest');
    }
    if(visitor){
      const chronology=[...card.querySelectorAll('h4')].find(e=>/CE QUE TU AS FAIT|CHRONOLOGIE|TIMELINE/i.test(e.textContent));
      if(chronology&&!chronology.parentNode.querySelector('.igr828-chronology-note')){
        const note=document.createElement('p');
        note.className='igr828-chronology-note';
        note.textContent=tr('Repère : 02:48 est l’arrivée à l’hôtel ; vers 02:55, l’entrée dans la chambre 222. Ce sont deux moments différents.',
          'Timeline: 02:48 is arrival at the hotel; around 02:55 is entry into room 222. These are distinct events.');
        chronology.after(note);
      }
    }
  }
  card.dataset.igr828Editorial='1';
}
function clarifyInvestigation(){
 const g=game(),panel=g?.querySelector('.game-panel-v11');
 if(!g||!panel||S()?.tab!=='investigation')return;
 if(!panel.querySelector('#igr828-lexicon')){
   const info=document.createElement('details');
   info.id='igr828-lexicon';
   info.className='igr828-lexicon';
   info.innerHTML=tr(
     '<summary>Comprendre les éléments de l’enquête</summary><p><b>Trame</b> : nouvel élément canonique transmis par le MJ (une par cycle). <b>Piste</b> : vérification choisie par l’enquêteur. <b>Pièce</b> : information ou document du dossier. <b>Publication</b> : décision distincte de communiquer une pièce autorisée au groupe.</p>',
     '<summary>Investigation terms</summary><p><b>Story lead</b>: canonical information supplied by the game master (one per cycle). <b>Lead choice</b>: investigation selected by the investigator. <b>Evidence</b>: an item recorded in the case file. <b>Publication</b>: a separate decision to share an authorized item.</p>');
   panel.appendChild(info);
 }
}
function clarifyRoster(){
 if(String(room()?.scenario_id)!=='001')return;
 const suspects=(S()?.sync?.players||[]).filter(p=>p.public_role==='suspect');
 if(suspects.length!==2)return;
 const briefing=game()?.querySelector('.phase-explain');
 if(!briefing)return;
 uniqueNotice(briefing,'igr828-roster-note',tr(
   'L’affaire évoque trois personnes liées à la victime ; deux suspects sont incarnés dans cette cellule. Les autres personnages peuvent être non joueurs.',
   'The case mentions three people linked to the victim; this room has two playable Suspects. Other characters may be non-player characters.'));
}
function patch(){
 if(!root())return;
 updateRoleCards();
 clarifyInvestigation();
 clarifyRoster();
}
function init(){
 if(!root())return;
 const original=window.phaseCanAdvance;
 // A mandatory selection is not an elapsed scene. The Host skips all other
 // eligible phases; the choice itself must be made by the Investigator.
 if(typeof original==='function')window.phaseCanAdvance=function(){
   if(['event_select','interrogation_select'].includes(room()?.phase))return false;
   return original.apply(this,arguments);
 };
 let queued=false;
 const schedule=()=>{
   if(queued)return;
   queued=true;
   requestAnimationFrame(()=>{queued=false;patch();});
 };
 new MutationObserver(schedule).observe(root(),{childList:true,subtree:false});
 schedule();
}
window.IGR_GAMEPLAY_AUDIT_V828=Object.freeze({version:'828.0',patch});
if(document.readyState==='complete')init();
else window.addEventListener('load',init,{once:true});
})();