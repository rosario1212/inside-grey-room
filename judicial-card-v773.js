/* v773 — One common, spoiler-safe judicial card for all standard game dossiers.
 * Content only from the current authenticated player's own private_state.
 * The shared suspect sheets and separate Héritage/Casino role renderers are untouched.
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
    return /^(?:(?:la )?grey room (?:doit|devra)|l enquete (?:doit|consiste|vise)|tu (?:dois|devras|peux|cherches)|il faut|reconstituis|reconstruis|etablis|identifie|distingue|determine|verifie|compare|recoupe|retrouve|confronte|analyse|evite|ne (?:transforme|confonds|suppose|presume|conclus|deduis)|ton (?:role|objectif|but) (?:est|consiste))\b/.test(s);
  }
  function unique(list){
    const seen=new Set();
    return list.filter(text=>{
      const key=normalized(text);
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }
  function buildParts(privateState){
    const ps=privateState||{};
    const facts=[],guidance=[];
    for(const sentence of sentences(ps.chronology)){
      (isGuidance(sentence)?guidance:facts).push(sentence);
    }
    const anchors=[];
    for(const sentence of sentences(ps.anchors)){
      (isGuidance(sentence)?guidance:anchors).push(sentence);
    }
    const situationCount=facts.length>2?2:Math.min(1,facts.length);
    const situation=facts.slice(0,situationCount);
    const judicial=unique(facts.slice(situationCount).concat(anchors));
    const line=unique(sentences(ps.position).concat(guidance));
    return {
      situation,
      judicial:judicial.length?judicial:
        (situation.length?["Aucun autre fait précis n’est fourni par cette carte à ce stade."]:[]),
      line
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
  function fill(root,label,values,kind){
    const found=section(root,label);
    if(!found||!values.length)return false;
    const {parent,title}=found;
    for(const element of Array.from(parent.children))if(element!==title)element.remove();
    const list=document.createElement('ul');
    list.className='igr773-lines igr773-'+kind;
    for(const statement of values){
      const item=document.createElement('li');
      item.textContent=statement;
      list.appendChild(item);
    }
    parent.appendChild(list);
    return true;
  }
  const original=window.privateCardHtml;
  if(typeof original!=='function')return;
  window.privateCardHtml=function(){
    const html=original.apply(this,arguments);
    const state=typeof STATE!=='undefined'?STATE:window.STATE;
    const player=state&&state.sync&&state.sync.player;
    if(typeof html!=='string'||!player||!player.private_state||player.public_role==='suspect')return html;
    // The game shares this renderer across its ordinary 001–049 case identifiers;
    // Héritage's bespoke cards never contain the three headings and are left as-is.
    const container=document.createElement('div');
    container.innerHTML=html;
    const card=container.querySelector('.private-card-v11');
    if(!card||!section(card,'CE QUI S’EST PASSÉ')||!section(card,'CE QUE TU SAIS'))return html;
    const parts=buildParts(player.private_state);
    if(!parts.situation.length&&!parts.judicial.length)return html;
    if(parts.situation.length)fill(card,'CE QUI S’EST PASSÉ',parts.situation,'situation');
    if(parts.judicial.length)fill(card,'CE QUE TU SAIS',parts.judicial,'judicial');
    if(parts.line.length)fill(card,'TA LIGNE',parts.line,'line');
    card.classList.add('igr773-card');
    return container.innerHTML;
  };
  // Expose a read-only pure classifier for synthetic, spoiler-free QA.
  window.IGRV773CardParts=buildParts;
})();
