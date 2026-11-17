/* v774 — Investigator opening brief: separate the incident, judicial facts and line.
 * Sources: only this player's authenticated private card and the public case context.
 * Shared cast, suspects' individual cards and separate premium campaigns are untouched.
 */
(function(){
  'use strict';
  function raw(value){
    if(Array.isArray(value))return value.filter(x=>typeof x==='string').join('. ');
    return typeof value==='string'?value.trim():'';
  }
  function sentences(value){
    const text=raw(value).replace(/\s+/g,' ').trim();
    return text?text.split(/(?<=[.!?])\s+(?=[«"“]?[A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ])/u).map(x=>x.trim()).filter(Boolean):[];
  }
  function normalized(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[\u2019]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  }
  function isGuidance(sentence){
    const s=normalized(sentence);
    return /^(?:(?:la )?grey room (?:doit|devra)|l enquete (?:doit|consiste|vise)|tu (?:dois|devras|peux|cherches)|il faut|a toi de|pour chaque|reconstituis|reconstitue|reconstruis|separe|fais|etablis|identifie|distingue|determine|verifie|compare|recoupe|retrouve|confronte|analyse|evite|cherche|reste|maintien|rappelle|ne (?:transforme|confonds|suppose|presume|conclus|deduis|cherche|sacrifie)|ton (?:role|objectif|but) (?:est|consiste))\b/.test(s);
  }
  function unique(list){
    const seen=new Set();
    return list.filter(text=>{
      const key=normalized(text);
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }
  function appendClassified(value,facts,guidance){
    for(const sentence of sentences(value)){
      // A clause like "La porte a été refermée : distingue les responsabilités"
      // contains both a fact and an instruction. Neither may disappear.
      const marker=sentence.indexOf(':');
      if(marker>10&&marker<sentence.length-6){
        const head=sentence.slice(0,marker).trim();
        const tail=sentence.slice(marker+1).trim();
        if(isGuidance(tail)){
          if(head)facts.push(/[.!?]$/.test(head)?head:head+'.');
          guidance.push(tail.charAt(0).toUpperCase()+tail.slice(1));
          continue;
        }
      }
      (isGuidance(sentence)?guidance:facts).push(sentence);
    }
  }
  function buildParts(privateState,publicContext=''){
    const ps=privateState||{},facts=[],guidance=[],anchors=[];
    appendClassified(raw(ps.chronology)||raw(publicContext),facts,guidance);
    appendClassified(ps.anchors,anchors,guidance);
    if(!facts.length)appendClassified(publicContext,facts,guidance);
    const situation=facts.length?[facts[0]]:[];
    let judicial=unique(facts.slice(1).concat(anchors));
    if(!judicial.length){
      const fromContext=[],contextGuidance=[];
      appendClassified(publicContext,fromContext,contextGuidance);
      judicial=unique(fromContext.filter(x=>normalized(x)!==normalized(situation[0]))).slice(0,2);
    }
    if(!judicial.length&&situation.length){
      judicial=['Aucun autre fait distinct n’est précisé sur cette carte à l’ouverture du dossier.'];
    }
    const line=unique(sentences(ps.position).concat(guidance));
    return {
      situation,
      judicial,
      line:line.length?line:['Confronte les déclarations aux éléments du dossier avant de conclure.']
    };
  }
  function section(root,label){
    const wanted=normalized(label);
    for(const title of root.querySelectorAll('h4, summary')){
      if(normalized(title.textContent)!==wanted)continue;
      const parent=title.closest('.private-block, details');
      if(parent)return {parent,title};
    }
    return null;
  }
  function ensureSection(card,label,after){
    const found=section(card,label);
    if(found)return found;
    const parent=document.createElement('div');
    parent.className='private-block';
    const title=document.createElement('h4');
    title.textContent=label;
    parent.appendChild(title);
    const pivot=after||card.querySelector('.role-summary')||card.querySelector('h2');
    if(pivot)pivot.after(parent);else card.appendChild(parent);
    return {parent,title};
  }
  function fill(card,label,values,kind,after){
    const {parent,title}=ensureSection(card,label,after);
    for(const element of Array.from(parent.children))if(element!==title)element.remove();
    const list=document.createElement('ul');
    list.className='igr773-lines igr773-'+kind;
    for(const statement of values){
      const item=document.createElement('li');item.textContent=statement;
      list.appendChild(item);
    }
    parent.appendChild(list);
    return parent;
  }
  const original=window.privateCardHtml;
  if(typeof original!=='function')return;
  window.privateCardHtml=function(){
    const html=original.apply(this,arguments);
    const state=typeof STATE!=='undefined'?STATE:window.STATE;
    const player=state&&state.sync&&state.sync.player;
    if(typeof html!=='string'||!player||!player.private_state||player.public_role!=='enqueteur')return html;
    const container=document.createElement('div');
    container.innerHTML=html;
    const card=container.querySelector('.private-card-v11');
    if(!card)return html;
    const publicContext=(state.sync?.scenario?.context)
      ||(typeof currentScenario==='function'?currentScenario()?.context:'')||'';
    const parts=buildParts(player.private_state,publicContext);
    if(!parts.situation.length&&!parts.judicial.length)return html;
    const role=section(card,'TON RÔLE')?.parent||card.querySelector('.role-summary');
    const situation=fill(card,'CE QUI S’EST PASSÉ',parts.situation,'situation',role);
    if(role)role.after(situation);
    const judicial=fill(card,'CE QUE TU SAIS',parts.judicial,'judicial',situation);
    situation.after(judicial);
    const line=fill(card,'TA LIGNE',parts.line,'line',judicial);
    judicial.after(line);
    card.classList.add('igr773-card');
    return container.innerHTML;
  };
  // Read-only pure classifier for synthetic checks, without loading any game room.
  window.IGRV773CardParts=buildParts;
})();
