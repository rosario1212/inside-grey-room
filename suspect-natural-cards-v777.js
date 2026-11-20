/* v777 — Natural suspect cards for every standard dossier and DLC.
 * Presentation only: use this player's authenticated private_state and the
 * already-rendered private card. Never consult other players or the solution.
 */
(function(){
 'use strict';
 const previous=window.privateCardHtml;
 if(typeof previous!=='function')return;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/[’']/g,'').replace(/\s+/g,' ').trim();
 const names={
  story:'TON HISTOIRE',events:'CE QUE TU AS FAIT',known:'CE QUE TU SAIS',
  hidden:'CE QUE TU CACHES',relations:'TES RELATIONS'
 };
 const map={
  'TON HISTOIRE':'story','TON CONTEXTE PERSONNEL':'story','TON RANG ET TA PLACE':'story',
  'CE QUE TU AS FAIT':'events','TA CHRONOLOGIE':'events',
  'TA CHRONOLOGIE PERSONNELLE':'events','CETTE NUIT-LA':'events',
  'CHRONOLOGIE DE TA VARIANTE':'events','TA CHRONOLOGIE DETAILLEE':'events',
  'CE QUE TU SAIS':'known','TES REPERES':'known',
  'CE QUE TU SAIS — TA VARIANTE':'known','CE QUE TU SAIS — DOSSIER 030':'known',
  'CE QUE TU CACHES':'hidden','CE QUE TU GARDES POUR TOI':'hidden',
  'TON SECRET SUR CETTE AFFAIRE':'hidden',
  'SECRET DE TA VARIANTE':'hidden','TON SECRET — DOSSIER 030':'hidden',
  'CE QUE TU CACHES — TA VARIANTE':'hidden','CE QUE TU CACHES — DOSSIER 030':'hidden',
  'TES RELATIONS':'relations','TES CLIENTS':'relations',
  'TA DEFENSE':'guidance','POUR ECHANGER':'guidance','CE QUE TU PEUX DEMANDER':'guidance'
 };
 function groupSections(blocks,key){
  if(!blocks.length)return null;
  const result=document.createElement('div');
  result.className='private-block igr-v777-'+key;
  const title=document.createElement('h4');title.textContent=names[key];result.appendChild(title);
  const seen=new Set();
  for(const block of blocks)for(const child of [...block.children]){
   if(child.tagName==='H4')continue;
   const content=norm(child.textContent);
   if(!content||seen.has(content))continue;
   seen.add(content);result.appendChild(child.cloneNode(true));
  }
  return result.children.length>1?result:null;
 }
 function rankGlossary(state,player){
  const sid=String(state?.sync?.room?.scenario_id||'');
  const ps=player?.private_state||{};
  const identity=norm(ps.identity||ps.variant_card?.identity||ps.place||'');
  const code=String(ps.omerta_preferred_role||ps.rank_code||'').toLowerCase();
  let explanation='';
  if(['021','022','023','024','025'].includes(sid)){
   const roles={
    caporegime:'Caporegime : chef d’une équipe du clan, sous l’autorité du Don.',
    consigliere:'Consigliere : conseiller du chef, sans commandement automatique des hommes.',
    associato:'Associato : associé du clan, sans pouvoir de commandement automatique.',
    uomo_onore:'Soldato : homme du clan chargé d’exécuter des missions confiées.',
    contabile:'Contabile : responsable des comptes et paiements du clan.',
    don:'Don : chef de la famille mafieuse. Famiglia signifie ici le clan.'
   };
   explanation=roles[code]||(/CAPOREGIME/.test(identity)?roles.caporegime:
     /CONSIGLIERE/.test(identity)?roles.consigliere:
     /SOLDATO/.test(identity)?roles.uomo_onore:
     /ASSOCIATO/.test(identity)?roles.associato:
     /\bDON\b/.test(identity)?roles.don:'');
  }else if(['040','041','042','043','044'].includes(sid)){
   if(identity.includes('WAKAGASHIRA'))
    explanation='Wakagashira : bras droit du chef du clan. Oyabun : chef du clan.';
   else if(identity.includes('KOBUN'))
    explanation='Kobun : membre du clan sous les ordres d’un supérieur. Oyabun : chef du clan.';
  }
  if(!explanation)return null;
  const alreadyClear=String(ps.story||'').trim();
  if(alreadyClear.length>=90 && /clan|famille mafieuse|bras droit/i.test(alreadyClear))return null;
  const div=document.createElement('div');div.className='private-block igr-v786-rank-clarity';
  const heading=document.createElement('h4');heading.textContent='TON RANG EN CLAIR';
  const text=document.createElement('p');text.textContent=explanation;
  div.append(heading,text);return div;
 }
 function storyFallback(player){
  const p=player.private_state||{};
  const story=String(p.story||p.v769_story||p.place||'').trim();
  if(!story)return null;
  const div=document.createElement('div');div.className='private-block igr-v777-story';
  const h=document.createElement('h4');h.textContent=names.story;
  const para=document.createElement('p');para.textContent=story;
  div.append(h,para);return div;
 }
 window.privateCardHtml=function(){
  const html=previous.apply(this,arguments);
  const state=typeof STATE!=='undefined'?STATE:window.STATE;
  const player=state?.sync?.player;
  if(typeof html!=='string'||player?.public_role!=='suspect'||!player.private_state)return html;
  const container=document.createElement('div');container.innerHTML=html;
  const card=container.querySelector('.private-card-v11');
  if(!card)return html;
  const sections={story:[],events:[],known:[],hidden:[],relations:[]};
  const opening=[],special=[];
  let identity=null,objective=null;
  for(const child of [...card.children]){
   if(child.matches('.private-foot'))continue;
   if(child.matches('.igr-private-identity')){identity=child;continue;}
   if(child.matches('.igr-private-priority')){objective=child;continue;}
   if(child.matches('header.igr-private-heading')){
    child.querySelector('.igr-private-hint')?.remove();
    opening.push(child);continue;
   }
   if(child.matches('.private-block')){
    const key=map[norm(child.querySelector('h4')?.textContent)]||'';
    if(key==='guidance'){
     if(String(state?.sync?.room?.scenario_id||'')==='030' && norm(child.querySelector('h4')?.textContent)==='POUR ECHANGER')special.push(child);
     continue;
    }
    if(key){sections[key].push(child);continue;}
    special.push(child);continue; // Preserve exceptional secrets or missions.
   }
   opening.push(child);
  }
  const story=groupSections(sections.story,'story')||storyFallback(player);
  // Avoid displaying the same sentence twice as identity and backstory.
  const identityText=norm(identity?.querySelector('span')?.textContent);
  const storyText=norm(story?.textContent);
  if(identity&&(!identityText||!storyText.includes(identityText)))opening.push(identity);
  const ordered=[...opening];
  if(story)ordered.push(story);
  const rankNote=rankGlossary(state,player);
  if(rankNote)ordered.push(rankNote);
  for(const key of ['events','known','hidden','relations']){
   const block=groupSections(sections[key],key);
   if(block)ordered.push(block);
  }
  if(objective){
   const heading=objective.querySelector('b');
   if(heading)heading.textContent='TON OBJECTIF';
   ordered.push(objective);
  }
  ordered.push(...special);
  card.replaceChildren(...ordered);
  card.classList.add('igr-v777-natural-suspect');
  return container.innerHTML;
 };
})();