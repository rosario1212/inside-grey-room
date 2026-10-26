/* Inside Grey Room — OMERTA / Santoro family chart v7 (public information only).
 * Replaces old cross-episode campaign-status tree without exposing private
 * cooperation, accusations, killings, character statuses or variant secrets.
 * Story data staged on PR #374; backend public packs must match Santoro before release.
 */
(() => {
  'use strict';
  const IDS=new Set(['021','022','023','024','025']);
  const people=[
    {id:'vittorio',name:'Vittorio Santoro',rank:'BOSS',branch:'administration',note:'Autorité de la Famiglia. Son nom ne prouve pas qu’il a ordonné un acte.'},
    {id:'matteo',name:'Matteo Bellini',rank:'CONSIGLIERE',branch:'administration',note:'Conseiller et médiateur du Don. Il ne connaît pas automatiquement les secrets des crews.'},
    {id:'underboss',name:'Poste non confirmé',rank:'UNDERBOSS',branch:'administration',note:'La fonction de second n’est pas attribuée automatiquement au fils du Don.'},
    {id:'enzo',name:'Enzo Rinaldi',rank:'CAPOREGIME',branch:'crew-rinaldi',note:'Dirige le crew Rinaldi et répond de ses propres hommes.'},
    {id:'luca',name:'Luca Moretti',rank:'SOLDATO',branch:'crew-rinaldi',note:'Membre initié lié au crew Rinaldi.'},
    {id:'paolo',name:'Paolo Serra',rank:'ASSOCIATO',branch:'crew-rinaldi',note:'Associé non initié, lié aux activités du crew.'},
    {id:'salvatore',name:'Salvatore Greco',rank:'ASSOCIATO',branch:'crew-rinaldi',note:'Associé financier. Ses fonctions ne lui donnent pas le rang de soldato.'},
    {id:'rocco',name:'Rocco Fiore',rank:'CAPOREGIME',branch:'crew-fiore',note:'Dirige un autre crew ; liens et actes précis relèvent du dossier joué.'},
    {id:'giuseppe',name:'Giuseppe Ferraro',rank:'CAPOREGIME',branch:'crew-ferraro',note:'Responsable d’un crew distinct, sans conséquence importée d’une autre affaire.'},
    {id:'adriano',name:'Adriano Santoro',rank:'FAMILLE DE SANG',branch:'blood',note:'Fils de Vittorio ; la filiation ne lui attribue aucun rang de commandement.'},
    {id:'elena',name:'Elena Santoro',rank:'FAMILLE DE SANG',branch:'blood',note:'Fille de Vittorio ; aucun rang criminel supposé.'}
  ];
  const byId=Object.fromEntries(people.map(x=>[x.id,x]));
  const scriptVersion='omerta-santoro-v7';
  function el(tag,className,text){
    const n=document.createElement(tag);
    if(className)n.className=className;
    if(text!==undefined)n.textContent=text;
    return n;
  }
  function currentId(){
    try {
      // STATE is a top-level lexical in app-v11.js and may NOT be window.STATE.
      const s=(typeof STATE!=='undefined' && STATE)?STATE:(window.STATE||{});
      return String(s.sync?.room?.scenario_id || s.scenarioId || s.selectedScenario || '');
    } catch(_){return ''}
  }
  function en(){return String(document.documentElement.lang||'').toLowerCase().startsWith('en')}
  const englishNotes={
    vittorio:'The head of the Family. His name alone does not prove he ordered an act.',
    matteo:'Trusted adviser and mediator. He does not automatically know every crew secret.',
    underboss:'The second-in-command position is not automatically inherited by the Don’s son.',
    enzo:'Capo of the Rinaldi crew, responsible for the people reporting to him.',
    luca:'Initiated member associated with the Rinaldi crew.',
    paolo:'Non-initiated associate connected to the crew.',
    salvatore:'Financial associate. Handling money does not make him an initiated soldier.',
    rocco:'Leads another crew; specific acts depend on the current case only.',
    giuseppe:'Capo of a separate crew, with no outcomes imported from another case.',
    adriano:'Vittorio’s son; blood ties do not automatically grant a command rank.',
    elena:'Vittorio’s daughter; no criminal rank is implied.'
  };
  const englishGroups={
    'Conseil et second':'Counsel and second-in-command',
    'Crew Rinaldi':'Rinaldi crew',
    'Crew Fiore':'Fiore crew',
    'Crew Ferraro':'Ferraro crew',
    'Ses enfants (sans titre automatique)':'His children (no automatic criminal rank)'
  };
  function tr(fr,english){return en()?english:fr}
  function node(id){
    const p=byId[id];
    const card=el('div','os7-person os7-'+p.rank.toLowerCase().replace(/[^a-z]+/g,'-'));
    card.append(el('strong','',id==='underboss'?tr(p.name,'Not confirmed'):p.name),el('small','',p.rank),el('p','',en()?englishNotes[id]:p.note));
    return card;
  }
  function title(text){return el('h3','',text)}
  function group(label,ids){
    const g=el('section','os7-crew');
    g.appendChild(title(en()?(englishGroups[label]||label):label));
    const cards=el('div','os7-crew-members');
    ids.forEach(id=>cards.appendChild(node(id)));
    g.appendChild(cards);
    return g;
  }
  function open(){
    document.querySelector('.omerta-tree-modal')?.remove();
    const previousFocus=document.activeElement;
    const modal=el('div','modal omerta-tree-modal omerta-santoro-tree-modal');
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',tr('Arbre de la Famiglia Santoro','Santoro Family Chart'));
    const box=el('div','modal-box omerta-tree-box os7-box');
    const heading=el('div','os7-heading');
    heading.append(el('div','os7-overline',tr('OMERTÀ · DOSSIER PUBLIC','OMERTÀ · PUBLIC FAMILY RECORD')),el('h2','','LA FAMIGLIA SANTORO'));
    heading.appendChild(el('p','',tr('Organigramme partiel — rangs connus. Aucun indic, statut secret ou résultat d’une autre affaire n’est affiché.','Partial organization chart — known ranks only. No informants, private outcomes or other-case results are displayed.')));
    box.appendChild(heading);
    const tabs=el('div','os7-tabs');tabs.setAttribute('role','tablist');
    const body=el('div','os7-panels');
    const auth=el('section','os7-panel');auth.id='os7-hierarchy';
    auth.appendChild(title(tr('Organisation criminelle','Criminal organization')));
    const boss=el('div','os7-topboss');boss.appendChild(node('vittorio'));auth.appendChild(boss);
    const direction=el('div','os7-command');direction.appendChild(group('Conseil et second', ['matteo','underboss']));auth.appendChild(direction);
    const crews=el('div','os7-crews');
    crews.appendChild(group('Crew Rinaldi', ['enzo','luca','paolo','salvatore']));
    crews.appendChild(group('Crew Fiore', ['rocco']));
    crews.appendChild(group('Crew Ferraro', ['giuseppe']));
    auth.appendChild(crews);
    auth.appendChild(el('p','os7-note',tr('Les associés ne sont pas des membres initiés. Les liens indiquent une appartenance au crew, jamais une culpabilité.','Associates are not initiated members. These links show crew affiliations, never evidence of guilt.')));
    const blood=el('section','os7-panel');blood.id='os7-blood';blood.hidden=true;
    blood.appendChild(title(tr('Famille de sang','Blood family')));
    const father=el('div','os7-topboss');father.appendChild(node('vittorio'));blood.appendChild(father);
    const children=el('div','os7-command');children.appendChild(group('Ses enfants (sans titre automatique)', ['adriano','elena']));blood.appendChild(children);
    blood.appendChild(el('p','os7-note',tr('Un lien de parenté n’établit aucun titre criminel, aucun acte ni aucune implication dans un dossier.','Being related does not prove membership, criminal responsibility or involvement in any case.')));
    const configurations=[
      {label:tr('HIÉRARCHIE','HIERARCHY'),panel:auth},
      {label:tr('FAMILLE DE SANG','BLOOD FAMILY'),panel:blood}
    ];
    function choose(which){
      configurations.forEach((c,i)=>{
        const selected=i===which;c.panel.hidden=!selected;
        c.button.setAttribute('aria-selected',String(selected));
        c.button.tabIndex=selected?0:-1;
      });
    }
    configurations.forEach((c,i)=>{
      const b=el('button','os7-tab',c.label);
      b.type='button';b.setAttribute('role','tab');
      b.setAttribute('aria-controls',c.panel.id);b.setAttribute('aria-selected',String(i===0));
      b.addEventListener('click',()=>choose(i));c.button=b;tabs.appendChild(b);
      c.panel.setAttribute('role','tabpanel');c.panel.setAttribute('aria-label',c.label);body.appendChild(c.panel);
    });
    box.append(tabs,body);
    const foot=el('div','os7-footer');foot.appendChild(el('span','',tr('Contexte commun aux cinq enquêtes · Aucun état importé','Shared world across five cases · No imported outcomes')));
    const close=el('button','btn ghost',tr('Fermer','Close'));close.type='button';
    const destroy=()=>{modal.remove();if(previousFocus?.focus)previousFocus.focus()};
    close.addEventListener('click',destroy);foot.appendChild(close);box.appendChild(foot);
    modal.appendChild(box);modal.addEventListener('click',e=>{if(e.target===modal)destroy()});
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();destroy()}
      if(e.key==='Tab'){
        const buttons=[...modal.querySelectorAll('button:not([disabled])')];
        const first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    });
    document.body.appendChild(modal);configurations[0].button.focus();
    return modal;
  }
  window.igrOmertaOpenFamilyTree=function(){
    // Other DLCs do not call this button; never fall back to legacy OMERTA
    // campaign-state renderer, even if selectedScenario is temporarily unset.
    const id=currentId();
    if(id && !IDS.has(id))return;
    return open();
  };
  window.IGR_OMERTA_SANTORO_PUBLIC_FAMILY=Object.freeze({
    version:scriptVersion,
    ids:Object.freeze(people.map(p=>p.id)),
    ranks:Object.freeze(people.map(p=>p.rank)),
    containsSecrets:false,
    crossEpisodeStatuses:false
  });
})();
