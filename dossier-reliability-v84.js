/* Inside Grey Room — v84 last-mile canonical presentation layer.
   Apply after every role/gameplay extension. No change to canonical scenario facts. */
(() => {
  'use strict';
  const VERSION='v84-dossier-reliability';
  const fr=()=>window.IGR_LOCALE!=='en';
  const copy=(a,b)=>fr()?a:b;
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const normalized=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').replace(/’/g,"'").toLowerCase();
  const mk=(tag,className,content)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!=null)node.textContent=String(content);
    return node;
  };

  function linkFromFact(text){
    const value=normalized(text);
    if(/(?:est|c'est) ta soeur\b/.test(value))return copy('C’est ta sœur.','She is your sister.');
    if(/(?:est|c'est) ton frere\b/.test(value))return copy('C’est ton frère.','He is your brother.');
    if(/tu ne (?:le|la|les) connais pas|vous ne vous connaissez pas/.test(value))return copy('Vous ne vous connaissez pas.','You do not know each other.');
    if(/tu (?:le|la) connais (?:peu|a peine)|tu (?:le|la) connais tres peu/.test(value))return copy('Vous vous connaissez peu.','You barely know each other.');
    if(/tu n'as aucun lien|aucun lien personnel|sans lien personnel/.test(value))return copy('Aucun lien personnel établi.','No established personal connection.');
    if(/jamais rencontre|pas rencontre personnellement/.test(value))return copy('Vous ne vous êtes jamais rencontrés.','You have never met.');
    if(/sans identification certaine|ignore son identite|pas avec certitude l'identite/.test(value))return copy('Tu ne peux pas l’identifier avec certitude.','You cannot identify them with certainty.');
    if(/vous travaillez dans la meme structure|meme service|meme institution/.test(value))return copy('Même structure : vous avez pu vous croiser.','Same organization: you may have crossed paths.');
    if(/tu lui as (?:demande|confie)|il t'a confirme|elle t'a confirme|vous vous etes rencontres/.test(value))return copy('Vous avez déjà été en contact.','You have been in contact.');
    return copy('Lien personnel non établi dans les faits disponibles.','Personal link not established by known facts.');
  }

  function splitNarrative(raw){
    const source=String(raw||'');
    const match=source.match(/(?:À mettre sur la table|A mettre sur la table)\s*[—–:\-]\s*/i);
    const factual=match?source.slice(0,match.index):source;
    const question=match?source.slice(match.index+match[0].length):'';
    return {
      fact:clean(factual.replace(/^\s*Ton point de départ\s*[—–:\-]\s*/i,'')),
      question:clean(question)
    };
  }
  function label(text){return mk('small','igr84-relation-label',text)}
  function relationCard(name,source,explicit){
    const {fact,question}=splitNarrative(source);
    const card=mk('article','igr84-relation-card');
    const head=mk('div','igr84-relation-head');
    head.append(mk('strong','igr84-relation-name',name||copy('Personne','Person')));
    head.append(label(copy('VOTRE LIEN','YOUR CONNECTION')));
    head.append(mk('p','igr84-relation-link',explicit||linkFromFact(fact)));
    card.append(head);
    if(fact){
      const facts=mk('div','igr84-relation-facts');
      facts.append(label(copy('CE QUE TU SAIS DE CETTE PERSONNE','WHAT YOU KNOW ABOUT THIS PERSON')));
      facts.append(mk('p','igr84-relation-text',fact));
      card.append(facts);
    }
    if(question){
      const prompt=mk('div','igr84-relation-prompt');
      prompt.append(label(copy('CE QUE TU PEUX LUI DEMANDER','WHAT YOU CAN ASK')));
      prompt.append(mk('p','igr84-relation-text',question));
      card.append(prompt);
    }
    return card;
  }

  function patchRelations(root){
    let changed=false;
    const blocks=root.querySelectorAll?.('.private-card-v11 .private-block,.private-card-v11 .igr82-relations')||[];
    for(const block of blocks){
      const heading=block.querySelector('h4');
      if(normalized(heading?.textContent)!=='tes relations')continue;
      if(block.querySelector('.igr84-relation-list'))continue;
      const old=Array.from(block.querySelectorAll(':scope > .relation-line'));
      if(old.length){
        const list=mk('div','igr84-relation-list');
        for(const item of old){
          const name=clean(item.querySelector('b')?.textContent||'');
          const narrative=clean(item.querySelector('span')?.textContent||item.textContent);
          list.append(relationCard(name,narrative));
        }
        old.forEach(item=>item.remove());
        block.append(list);
        block.classList.add('igr84-relations');
        changed=true;
      }else if(block.querySelector('.igr82-relation')){
        block.querySelectorAll('.igr82-relation').forEach(card=>{
          const fact=card.querySelector('.igr82-relation-fact');
          const prompt=card.querySelector('.igr82-relation-question span');
          const factTitle=card.querySelector('.igr82-relation-eyebrow');
          const factualLabel=copy('CE QUE TU SAIS DE CETTE PERSONNE','WHAT YOU KNOW ABOUT THIS PERSON');
          const questionLabel=copy('CE QUE TU PEUX LUI DEMANDER','WHAT YOU CAN ASK');
          if(factTitle && factTitle.textContent!==factualLabel){factTitle.textContent=factualLabel;changed=true}
          if(prompt && prompt.textContent!==questionLabel){prompt.textContent=questionLabel;changed=true}
        });
      }
    }
    return changed;
  }

  const corrections={
    investigation_assembly:['ASSEMBLÉE DU CAMP ENQUÊTE','INVESTIGATION ASSEMBLY'],
    investigation_select:['PRÉPARATION DE L’INTERROGATOIRE','INTERROGATION PREPARATION'],
    next_interrogation:['PROCHAIN INTERROGATOIRE','NEXT INTERROGATION'],
    investigation_free:['ENQUÊTE LIBRE','FREE INVESTIGATION'],
    event_select:['CHOIX DE L’ÉVÉNEMENT','EVENT SELECTION'],
    event_assembly:['ASSEMBLÉE','ASSEMBLY'],
    final_suspect_defenses:['DERNIÈRES DÉFENSES','FINAL DEFENCES'],
    final_audience:['AUDIENCE FINALE','FINAL HEARING']
  };
  function readablePhase(value,previous){
    const key=String(value||'').toLowerCase();
    if(corrections[key])return copy(...corrections[key]);
    const fallback=previous?previous(value):String(value||'');
    // Never expose unknown backend identifiers as raw snake_case.
    if(/^[a-z]+(?:_[a-z0-9]+)+$/i.test(fallback))return fallback.replace(/_/g,' ').toUpperCase();
    return fallback;
  }

  function timelineNumbers(){
    let state=null;try{state=typeof STATE!=='undefined'?STATE:null}catch(_){}
    if(state?.tab!=='timeline')return;
    const panel=document.querySelector('#app .game-panel-v11');
    if(!panel || !/chronolog/i.test(panel.textContent||''))return;
    // Within this tab, isolated integer chips are ordinal steps, not times.
    // Only replace short numbered badges in timeline/list rows. Never add a time.
    panel.querySelectorAll('.timeline li,.timeline [class*="step"],[class*="chrono"] li,[class*="chrono"] [class*="step"]').forEach(row=>{
      const candidate=row.querySelector('time,b,small,.time-pill,.timeline-time,[class*="badge"]');
      if(!candidate||candidate.children.length||candidate.dataset.igr84Ordinal)return;
      const text=clean(candidate.textContent);
      if(/^\d{1,2}$/.test(text)){
        candidate.dataset.igr84Ordinal='1';
        candidate.textContent=copy('ÉTAPE '+Number(text),'STEP '+Number(text));
      }
    });
  }

  function polish(){
    const root=document.getElementById('app');if(!root)return;
    patchRelations(root);
    timelineNumbers();
    const phase=root.querySelector('.phase-strip strong');
    if(phase && /_/.test(phase.textContent||'')){
      const key=clean(phase.textContent).toLowerCase();
      phase.textContent=readablePhase(key);
    }
  }

  // Called on the actual final renderer, rather than patching only app-v11
  // while later DLC and role modules still replace its output.
  function wrapRenderer(name){
    let base=null;
    try{base=window[name]}catch(_){}
    if(typeof base!=='function'||base.__igr84)return;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      if(name==='privateCardHtml'&&typeof result==='string'){
        const tpl=document.createElement('template');
        tpl.innerHTML=result;
        patchRelations(tpl.content);
        return tpl.innerHTML;
      }
      if(name!=='privateCardHtml')queuePolish();
      return result;
    };
    Object.defineProperty(wrapped,'__igr84',{value:true});
    try{window[name]=wrapped}catch(_){}
    try{
      if(name==='privateCardHtml')privateCardHtml=wrapped;
      if(name==='renderGame')renderGame=wrapped;
      if(name==='renderRole')renderRole=wrapped;
    }catch(_){}
  }
  let queued=false;
  function queuePolish(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;polish()});
  }
  wrapRenderer('privateCardHtml');
  wrapRenderer('renderGame');
  wrapRenderer('renderRole');

  try{
    const base=typeof phaseLabel==='function'?phaseLabel:null;
    if(base&&!base.__igr84){
      const wrapper=function(value){return readablePhase(value,x=>base.call(this,x))};
      Object.defineProperty(wrapper,'__igr84',{value:true});
      phaseLabel=wrapper;window.phaseLabel=wrapper;
    }
  }catch(_){}

  const app=document.getElementById('app');
  if(app&&window.MutationObserver){
    // The callback changes only old relation markup or isolated time chips.
    // No unconditional innerHTML rewrite, avoiding the iOS observer loop.
    const observer=new MutationObserver(records=>{
      if(records.some(r=>r.addedNodes.length))queuePolish();
    });
    observer.observe(app,{childList:true,subtree:true});
  }
  window.addEventListener('igr:sync',queuePolish,{passive:true});
  window.addEventListener('pageshow',queuePolish,{passive:true});
  queuePolish();
  window.IGR_DOSSIER_RELIABILITY_V84=Object.freeze({version:VERSION,splitNarrative,linkFromFact,readablePhase,refresh:queuePolish});
})();