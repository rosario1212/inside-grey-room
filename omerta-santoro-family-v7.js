/* OMERTA V9 — Player-owned public mafia ranks.
 * The participants keep their own pseudo and personality. No actor or fixed
 * fictional identity is placed into a playable rank.
 * No private_state, secret_role, hidden informer, or campaign-status reads.
 */
(()=>{
 'use strict';
 const IDS=new Set(['021','022','023','024','025']);
 const RANKS=[
  {key:'don',label:'Don Santoro',english:'Don Santoro'},
  {key:'consigliere',label:'Consigliere',english:'Consigliere'},
  {key:'sottocapo',label:'Sottocapo',english:'Underboss'},
  {key:'caporegime',label:'Capo',english:'Capo'},
  {key:'uomo_onore',label:'Soldato',english:'Soldier'},
  {key:'associato',label:'Associato',english:'Associate'},
  {key:'contabile',label:'Contabile',english:'Accountant'}
 ];
 const BLOOD=[{name:'Adriano Santoro',relation:'Fils',english:'Son'},
              {name:'Elena Santoro',relation:'Fille',english:'Daughter'}];
 const allow=new Set(RANKS.map(r=>r.key));
 const isEn=()=>/^en/i.test(document.documentElement.lang||window.IGR_LOCALE||'fr');
 const tr=(fr,en)=>isEn()?en:fr;
 const E=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
 function state(){try{return typeof STATE!=='undefined'?STATE:(window.STATE||{})}catch(_){return window.STATE||{}}}
 function activeScenario(){const s=state();return String(s.sync?.room?.scenario_id||s.scenarioId||s.selectedScenario||'')}
 function visiblePlayers(){
   const d=state().sync;
   if(!d||!IDS.has(String(d.room?.scenario_id)))return [];
   const list=Array.isArray(d.players)?d.players:[];
   // Combine current player only when already listed, and use publicly selected
   // preferred_role, never the private or secret role stored on the client.
   return list.map(p=>({pseudo:String(p?.pseudo||'').trim(),role:String(p?.preferred_role||'').trim(),id:String(p?.id||'')}));
 }
 function holders(players){
  const result=Object.fromEntries(RANKS.map(r=>[r.key,[]]));
  for(const p of Array.isArray(players)?players:[]){
    const rank=String(p?.role||p?.preferred_role||'').toLowerCase().trim();
    if(!allow.has(rank))continue;
    const pseudo=String(p?.pseudo||'').trim().slice(0,64);
    if(pseudo)result[rank].push(pseudo);
  }
  return result;
 }
 function rankCard(rank,roster){
  const card=E('article','os7-person os7-rank-'+rank.key);
  card.appendChild(E('strong','',isEn()?rank.english:rank.label));
  const list=roster[rank.key]||[];
  const assigned=list.length?list.join(' · '):tr('Non attribué dans cette partie','Not assigned in this game');
  card.appendChild(E('small','os9-player-name',assigned));
  if(rank.key==='don')card.appendChild(E('p','',tr('Nom de Famiglia, pas identité imposée au joueur.','Family title, not an imposed player identity.')));
  return card;
 }
 function section(title,cards){
  const div=E('section','os7-crew');div.appendChild(E('h3','',title));
  const body=E('div','os7-crew-members');cards.forEach(c=>body.appendChild(c));div.appendChild(body);return div;
 }
 function scene(){
  document.querySelector('.omerta-tree-modal')?.remove();
  const previousFocus=document.activeElement;
  const modal=E('div','modal omerta-tree-modal omerta-santoro-tree-modal');
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label',tr('Arbre de la Famiglia Santoro','Santoro family chart'));
  const box=E('div','modal-box omerta-tree-box os7-box');
  const heading=E('div','os7-heading');
  heading.appendChild(E('div','os7-overline','OMERTÀ · SANTORO'));
  heading.appendChild(E('h2','',tr('La Famiglia · Rangs et joueurs','The family · Ranks and players')));
  heading.appendChild(E('p','',tr('Les rangs appartiennent aux joueurs de cette partie. Personne ne doit imiter un personnage.','Roles belong to the players in this game. No one has to impersonate a character.')));
  box.appendChild(heading);
  const roster=holders(visiblePlayers());
  const tabs=E('div','os7-tabs');tabs.setAttribute('role','tablist');
  const panelHolder=E('div','os7-panels');
  const mafia=E('section','os7-panel');mafia.id='os9-mafia';mafia.setAttribute('role','tabpanel');
  const boss=E('div','os7-topboss');boss.appendChild(rankCard(RANKS[0],roster));mafia.appendChild(boss);
  const command=E('div','os7-command');command.appendChild(section(tr('Direction','Leadership'),[rankCard(RANKS[1],roster),rankCard(RANKS[2],roster)]));mafia.appendChild(command);
  const crews=E('div','os7-crews os9-positions');
  crews.appendChild(section(tr('Crew · commandement','Crew · command'),[rankCard(RANKS[3],roster)]));
  crews.appendChild(section(tr('Membres initiés','Initiated members'),[rankCard(RANKS[4],roster)]));
  crews.appendChild(section(tr('Associés et comptes','Associates and accounts'),[rankCard(RANKS[5],roster),rankCard(RANKS[6],roster)]));
  mafia.appendChild(crews);
  mafia.appendChild(E('p','os7-note',tr('Les rangs sans titulaire restent non attribués. Les enquêteurs et rôles secrets ne sont jamais affichés.','Unassigned ranks remain empty. Investigators and secret roles are never displayed.')));
  const blood=E('section','os7-panel');blood.id='os9-blood';blood.setAttribute('role','tabpanel');blood.hidden=true;
  const dad=E('div','os7-topboss');
  dad.appendChild(E('article','os7-person os7-rank-don'));
  dad.firstChild.appendChild(E('strong','','Don Santoro'));
  dad.firstChild.appendChild(E('small','',tr('Famille de sang','Blood family')));
  blood.appendChild(dad);
  const sons=E('div','os7-command');sons.appendChild(section(tr('Enfants du Don','The Don’s children'),BLOOD.map(p=>{
    const div=E('article','os7-person os9-blood');
    div.append(E('strong','',p.name),E('small','',isEn()?p.english:p.relation));return div;
  })));blood.appendChild(sons);
  blood.appendChild(E('p','os7-note',tr('Les membres de sang sont des personnes du contexte, pas des personnages attribués ni des rangs criminels.','Blood relatives belong to the story setting. They are not playable identities or automatic criminal ranks.')));
  const defs=[{label:tr('Hiérarchie','Hierarchy'),panel:mafia},{label:tr('Famille de sang','Blood family'),panel:blood}];
  const buttons=[];
  function switchTo(idx){defs.forEach((x,i)=>{x.panel.hidden=i!==idx;buttons[i].setAttribute('aria-selected',String(i===idx));buttons[i].tabIndex=i===idx?0:-1})}
  defs.forEach((x,i)=>{
   const b=E('button','os7-tab',x.label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-controls',x.panel.id);
   b.addEventListener('click',()=>switchTo(i));buttons.push(b);tabs.appendChild(b);panelHolder.appendChild(x.panel);
  });switchTo(0);box.append(tabs,panelHolder);
  const footer=E('div','os7-footer');
  footer.appendChild(E('span','',tr('La hiérarchie reflète cette partie uniquement · Aucun statut d’autres dossiers','This game only · No status imported from other cases')));
  const close=E('button','btn ghost',tr('Fermer','Close'));close.type='button';
  const destroy=()=>{modal.remove();previousFocus?.focus?.()};
  close.addEventListener('click',destroy);footer.appendChild(close);box.appendChild(footer);
  modal.appendChild(box);modal.addEventListener('click',e=>{if(e.target===modal)destroy()});
  modal.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();destroy()}
   if(e.key==='Tab'){const all=[...modal.querySelectorAll('button:not([disabled])')];
    if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1).focus()}
    else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0].focus()}
   }
  });
  document.body.appendChild(modal);buttons[0].focus();
  return modal;
 }
 window.igrOmertaOpenFamilyTree=function(){
  if(activeScenario() && !IDS.has(activeScenario()))return;
  return scene();
 };
 function updateGameShortcut(){
  const old=document.getElementById('os9-tree-open');
  const s=state(),id=activeScenario();
  const active=IDS.has(id) && s.sync?.room?.scenario_id===id && ['game','role','briefing'].includes(s.view);
  if(!active){old?.remove();return}
  if(old)return;
  const btn=E('button','os9-tree-shortcut',tr('Arbre Santoro','Santoro tree'));
  btn.type='button';btn.id='os9-tree-open';
  btn.setAttribute('aria-label',tr('Ouvrir l’arbre de la Famiglia','Open family organization chart'));
  btn.addEventListener('click',()=>scene());
  document.body.appendChild(btn);
 }
 let queued=false;
 function schedule(){
  if(queued)return;queued=true;
  (window.requestAnimationFrame||((fn)=>setTimeout(fn,0)))(()=>{queued=false;updateGameShortcut()});
 }
 function observe(){
  if(!document.body)return;
  const observer=new MutationObserver(()=>schedule());
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  schedule();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});
 else observe();
 window.IGR_OMERTA_SANTORO_PUBLIC_FAMILY=Object.freeze({
   version:'v9-player-ranks',
   ranks:Object.freeze(RANKS.map(r=>r.key)),
   holders:holders,
   containsSecrets:false,
   crossEpisodeStatuses:false
 });
})();
