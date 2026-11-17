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

/* v773 — Investigator cards: distinct incident, verified starting knowledge,
   and practical line. No variant/answer-key data or other player's card is used. */
function v773SplitSentences(value){
 return String(value||'').replace(/\s+/g,' ').trim()
  .split(/(?<=[.!?])\s+(?=[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŒ])/u)
  .map(x=>x.trim()).filter(Boolean);
}
function v773Norm(value){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[’]/g,"'").toLowerCase().replace(/\s+/g,' ').trim();
}
function v773Directive(value){
 const s=v773Norm(value);
 return /^(?:(?:la|le) (?:grey room|enquete|mission|procedure|dossier|rapport) (?:doit|devra|vise|consiste)|il faut\b|a toi de\b|tu dois\b|tu devras\b|tu peux\b|pour chaque\b|attention\b|ne (?:confonds|transforme|suppose|deduis|sacrifie|cherche|fais|prends)\b|(?:reconstitue|reconstruis|separe|distingue|compare|croise|recoupe|fais|verifie|etablis|cherche|identifie|demande|mets|maintien|tiens|traite|note|observe|questionne|evite|controle|priorise|classe|remonte|examine|garde)\b|(?:qui|comment|pourquoi|quand|quels?|quelles?)\b)/.test(s);
}
function v773Distinct(items){
 const seen=[];
 return items.map(x=>String(x||'').trim()).filter(x=>{
  if(!x)return false;
  const key=v773Norm(x).replace(/[.?!;,:\s]+$/,'');
  if(seen.some(k=>k===key||k.length>34&&key.length>34&&(k.includes(key)||key.includes(k))))return false;
  seen.push(key);return true;
 });
}
function v773InvestigatorSummary(chronology,anchors,position,publicContext=''){
 const all=v773SplitSentences(chronology||publicContext),facts=[],guidance=[];
 for(const s of all)(v773Directive(s)?guidance:facts).push(s);
 if(!facts.length){
  for(const s of v773SplitSentences(publicContext))(v773Directive(s)?guidance:facts).push(s);
 }
 const incident=facts.shift()||'';
 let knowledge=v773Distinct(facts);
 if(!knowledge.length){
  const extra=v773SplitSentences(publicContext).filter(s=>!v773Directive(s));
  knowledge=v773Distinct(extra.filter(s=>v773Norm(s)!==v773Norm(incident))).slice(0,2);
 }
 let line=v773Distinct([anchors,position,...guidance]);
 if(!knowledge.length){
  const anchorFacts=v773SplitSentences(anchors).filter(s=>!v773Directive(s));
  if(anchorFacts.length){
   knowledge=[anchorFacts[0]];
   line=v773Distinct([position,...guidance,...v773SplitSentences(anchors).filter(s=>s!==anchorFacts[0])]);
  }
 }
 return {incident,knowledge:v773Distinct(knowledge).filter(s=>v773Norm(s)!==v773Norm(incident)),line};
}
function v773InstallInvestigatorCard(){
 const previous=window.privateCardHtml;
 if(typeof previous!=='function')return;
 window.privateCardHtml=function(){
  const html=previous.apply(this,arguments);
  const state=typeof STATE==='object'&&STATE?STATE:window.STATE;
  const data=state?.sync,player=data?.player,privateState=player?.private_state||{};
  if(player?.public_role!=='enqueteur'||typeof html!=='string')return html;
  const context=data?.scenario?.context
    ||(typeof currentScenario==='function'?currentScenario()?.context:'')||'';
  const summary=v773InvestigatorSummary(privateState.chronology,privateState.anchors,privateState.position,context);
  if(!summary.incident&&!summary.knowledge.length)return html;
  const fragment=document.createElement('template');fragment.innerHTML=html;
  const card=fragment.content.querySelector('.private-card-v11');
  if(!card)return html;
  const blocks=[...card.querySelectorAll('.private-block')];
  const lookup=(labels)=>blocks.find(el=>labels.includes(v773Norm(el.querySelector('h4')?.textContent).toUpperCase()));
  // Only the Investigator's shared sections are rewritten. Suspects, spy cards,
  // authored relationships and privileged information keep their renderers.
  function findSection(...labels){
   return blocks.find(el=>labels.some(label=>v773Norm(el.querySelector('h4')?.textContent)===v773Norm(label)));
  }
  const incidentSection=findSection('CE QUI S’EST PASSÉ','WHAT HAPPENED');
  let knowledgeSection=findSection('CE QUE TU SAIS','WHAT YOU KNOW');
  let lineSection=findSection('TA LIGNE','YOUR LINE');
  if(!incidentSection)return html;
  card.classList.add('igr-v773-investigator');
  const reset=(block,type,title)=>{
   if(!block){
    block=document.createElement('div');block.className='private-block';
    const h=document.createElement('h4');h.textContent=title;block.appendChild(h);
   }
   block.classList.add(type);
   const heading=block.querySelector('h4');
   if(heading)heading.textContent=title;
   block.replaceChildren(...(heading?[heading]:[]));
   return block;
  };
  reset(incidentSection,'igr-v773-incident','CE QUI S’EST PASSÉ');
  const lead=document.createElement('p');lead.className='igr-v773-incident-copy';
  lead.textContent=summary.incident;incidentSection.append(lead);
  knowledgeSection=reset(knowledgeSection,'igr-v773-known','CE QUE TU SAIS');
  if(summary.knowledge.length){
   const list=document.createElement('ul');list.className='igr-v773-fact-list';
   for(const fact of summary.knowledge){
    const li=document.createElement('li');li.textContent=fact;list.appendChild(li);
   }
   knowledgeSection.appendChild(list);
  }else{
   const note=document.createElement('p');note.className='igr-v773-neutral';
   note.textContent='Les informations disponibles ne permettent pas encore de départager les responsabilités.';
   knowledgeSection.appendChild(note);
  }
  incidentSection.after(knowledgeSection);
  lineSection=reset(lineSection,'igr-v773-line','TA LIGNE');
  if(summary.line.length){
   const list=document.createElement('ul');list.className='igr-v773-line-list';
   for(const item of summary.line){const li=document.createElement('li');li.textContent=item;list.appendChild(li);}
   lineSection.appendChild(list);
  }else{
   const p=document.createElement('p');p.textContent='Recoupe les versions avec les éléments du dossier avant de conclure.';
   lineSection.appendChild(p);
  }
  knowledgeSection.after(lineSection);
  return fragment.innerHTML;
 };
}
v773InstallInvestigatorCard();

window.IGR_INVESTIGATION_V772=Object.freeze({version:'v772',refresh:schedule});
})();