/* Inside Grey Room v42 — Éléments d’enquête.
   Two public opening cards, progressive visible evidence, and objective-at-bottom role cards.
   Editorial guides only contain scenario invariants: never the variable culprit/reveal order. */
(()=>{
  'use strict';

  const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
  const isEn=()=>String(window.IGR_LOCALE||document.documentElement.lang||'fr').toLowerCase().startsWith('en');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const scenarioId=()=>String(window.STATE?.sync?.room?.scenario_id||window.STATE?.scenario||'').padStart(3,'0');

  const GUIDES={
    '001':'La nuit de la chambre 222 doit être reconstruite passage par passage. Chaque suspect défend la chronologie inscrite sur sa carte. Les heures techniques précises — téléphone, accès, parking ou caméra — ne deviennent communes que lorsqu’un élément les établit ici.',
    '002':'Léon est mort après une période de pression et d’isolement. L’enquête doit distinguer ce que chacun savait, ce qu’il pouvait réellement faire et la fenêtre pendant laquelle une intervention restait possible.',
    '003':'La catastrophe vient d’une chaîne de décisions séparées. Reconstituez qui a recherché, validé, transféré, ordonné ou omis d’agir avant de mesurer la responsabilité de chacun.',
    '004':'Les appels de Sofia structurent l’affaire. Comparez l’ordre des demandes d’aide, ce que chaque personne comprend à ce moment-là et la possibilité concrète d’intervenir avant sa mort.',
    '005':'La scène au masque blanc paraît cohérente mais peut orienter trop vite l’enquête. Séparez la mise en scène, les traces matérielles et les comportements avant d’attribuer une intention.',
    '006':'Le dossier est rouvert cinq ans après la chute de Noé. Les souvenirs sont imparfaits : distinguez ce qui est commun aux récits, ce qui a changé avec le temps et ce que le groupe a pu taire ensemble.',
    '007':'Le testament redistribue intérêts, loyautés et mobiles. Une personne peut mentir sur son intérêt financier sans être responsable du fait principal : confrontez document, bénéfice et action réelle.',
    '008':'Le serment rend chaque mensonge important sans en faire automatiquement la preuve centrale. Distinguez faux témoignage, protection d’un tiers et responsabilité dans les faits examinés.',
    '009':'L’enquête porte sur consentement, mémoire et limites du protocole. Les souvenirs fragiles ne sont ni automatiquement faux ni suffisants : croisez-les avec les documents et l’expertise.',
    '010':'Accès, bruits, durée et possibilité d’abandon sont les quatre repères du dossier. Toute conclusion doit expliquer à la fois qui pouvait entrer, ce qui a été entendu et quand une aide restait possible.',
    '011':'Les 36 heures forment une chaîne de commandement. Reconstituez l’ordre des décisions, leurs destinataires, les marges d’initiative et les moments où un ordre a été reformulé ou dépassé.',
    '012':'Dans cette communauté fermée, loyauté et peur peuvent produire le même silence. Distinguez récit collectif, pression, rétention d’information et actes personnellement imputables.',
    '013':'Le dossier combine intention politique, logistique, sécurité et exécution. Ne confondez pas financement, facilitation d’accès, ordre et acte matériel : chaque niveau doit être établi séparément.',
    '014':'Des informations protégées circulent autour du dossier. Une fuite, une source ou une décision sous secret ne prouvent pas seules une corruption : établissez origine, accès, transmission et intérêt.',
    '015':'Le décès survient dans un cadre hospitalier et institutionnel. Séparez les décisions prises avant la mort, les limites du programme et les éventuelles dissimulations intervenues ensuite.',
    '016':'Une vidéo établit une partie de la violence mais pas nécessairement le meurtre. Replacez les images dans la chronologie et cherchez ce qui se passe avant, après et hors champ.',
    '017':'Accords, témoin et téléphone forment les repères du dossier. Une promesse ou un paiement n’a de sens qu’une fois relié à son moment, son destinataire et l’action qu’il devait provoquer.',
    '018':'La scène a pu être déplacée. Distinguez ce qui appartient au lieu de découverte de ce qui renvoie au lieu initial, puis confrontez déplacements, accès et observations de terrain.',
    '019':'Le Grand Bal mêle sécurité, influence et institutions. Reconstituez qui contrôlait réellement chaque accès ou décision au lieu de déduire la responsabilité du seul statut social.',
    '020':'L’incendie et les 327 morts résultent de plusieurs couches de décision. Reconstituez les causes matérielles, les alertes, les arbitrages et les responsabilités sans chercher une explication unique.',
    '021':'Une enveloppe et une circulation d’argent ouvrent l’enquête OMERTÀ. Distinguez qui remet, qui sait, qui transmet et jusqu’où remonte réellement le cercle de connaissance.',
    '022':'Un ordre ambigu précède un meurtre interne. Reconstituez les mots transmis, leurs reformulations et les initiatives prises à chaque niveau avant d’attribuer l’intention finale.',
    '023':'Une négociation autour d’Adriano précède une fuite puis une attaque. Séparez ce qui était sur la table, ce qui a quitté la pièce et qui pouvait exploiter l’information.',
    '024':'La coopération d’un pentito peut être sincère et intéressée à la fois. Vérifiez chaque information livrée, sa date, ce qu’elle lui permet d’obtenir et ce qu’il continue de protéger.',
    '025':'Le sommet de la Famiglia est exposé, mais autorité ne signifie pas ordre explicite pour chaque violence. Distinguez ce qui a été ordonné, toléré, financé ou entrepris au nom du Don.',
    '026':'La ville se désagrège pendant l’enquête. La pression extérieure ne remplace jamais la preuve : distinguez coordination, continuité logistique et influence idéologique avant de fixer les responsabilités.',
    '027':'Une zone contestée contient peut-être des cadres mais aussi des civils. Une information peut être vraie et orientée : vérifiez sa fraîcheur, sa source et l’intérêt de celui qui la fournit.',
    '028':'Le dernier périmètre tient encore tandis que l’organisation abandonne certains détenus. Distinguez coopération réelle, responsabilité passée et soutien actuel à la cellule intérieure.',
    '029':'Des représailles accompagnent l’enquête sur plusieurs exécutions. Séparez financement, ordre initial, escalade et exécution matérielle : l’urgence ne doit pas raccourcir la chaîne de preuve.',
    '030':'Une partie de la justice a été contaminée par argent, peur et influence. Distinguez rencontre, avantage, pression, décision achetée et décision encore défendable juridiquement.',
    '031':'Un enlèvement transforme une dette en négociation. Reconstituez qui s’engage, qui garantit, qui menace et à quel moment une promesse devient une responsabilité dans la suite des faits.',
    '032':'Les archives du palais relient documents, ordres et appareil d’État. Distinguez rédaction, transmission, validation et exécution : un nom dans un dossier ne suffit pas à fixer son niveau de pouvoir.',
    '033':'La dynastie mêle famille, titre et pouvoir réel. Reconstituez qui pouvait décider, qui représentait seulement le régime et qui a utilisé son lien familial comme levier.',
    '034':'Plusieurs personnes ont porté des noms ou fonctions interchangeables. Ne jugez pas l’étiquette : reliez chaque alias à une période, une fonction, des décisions et une capacité réelle d’action.'
  };

  const EN_GUIDE='Use the common facts on the role cards and in the case file. Precise technical evidence becomes shared only when it is revealed in Case Evidence; do not invent missing times, access records or alibis.';
  const OPERATIONAL=new Set(['context','phase','cycle','roles_distributed','briefing','room_created','player_joined','player_left','ready','role_selected','sync','timer','turn']);

  function publicContext(events){
    const live=window.STATE?.sync?.scenario?.context;
    if(live) return live;
    const ctx=(events||[]).find(e=>e?.event_type==='context');
    return ctx?.payload?.text||ctx?.payload?.context||'';
  }

  function participantLine(){
    const suspects=Array.isArray(window.STATE?.sync?.suspects)?window.STATE.sync.suspects:[];
    const names=suspects.map(s=>s?.pseudo).filter(Boolean);
    if(!names.length) return '';
    return isEn()?`Questioned suspects: ${names.join(', ')}.`:`Suspects convoqués : ${names.join(', ')}.`;
  }

  function evidenceEvents(events){
    return (Array.isArray(events)?events:[]).filter(e=>{
      const type=String(e?.event_type||'').toLowerCase();
      if(OPERATIONAL.has(type)) return false;
      const p=e?.payload||{};
      return Boolean(p.title||p.text||p.message||p.body);
    });
  }

  function evidenceCard(e,index){
    const p=e?.payload||{};
    const title=p.title||p.label||(isEn()?'New evidence':'Nouvel élément');
    const text=p.text||p.message||p.body||'';
    const cycle=p.cycle||e?.cycle;
    const type=String(e?.event_type||'').replaceAll('_',' ');
    const meta=[cycle?`${isEn()?'Cycle':'Cycle'} ${cycle}`:'',type].filter(Boolean).join(' · ');
    return `<article class="igr-v42-evidence" data-evidence-index="${index}">
      <div class="igr-v42-evidence-meta">${esc(meta)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </article>`;
  }

  function renderInvestigationElements(){
    const id=scenarioId();
    const events=window.STATE?.sync?.events||[];
    const context=publicContext(events)||(isEn()?'The public case context is not available yet.':'Le contexte public du dossier n’est pas encore disponible.');
    const guide=isEn()?EN_GUIDE:(GUIDES[id]||'Appuyez-vous uniquement sur les informations réellement présentes dans les cartes de rôle et les éléments révélés. Toute heure, tout accès ou tout alibi utilisé par le scénario doit être établi avant de pouvoir être opposé à un joueur.');
    const who=participantLine();
    const evidence=evidenceEvents(events);
    return `<section class="igr-v42-investigation" aria-label="${isEn()?'Case evidence':'Éléments d’enquête'}">
      <div class="igr-v42-context-grid">
        <article class="igr-v42-context-card" data-context-card="1">
          <div class="igr-v42-kicker">${isEn()?'CONTEXT 1/2':'CONTEXTE 1/2'}</div>
          <h3>${isEn()?'Situation':'Situation'}</h3>
          <p>${esc(context)}</p>
        </article>
        <article class="igr-v42-context-card" data-context-card="2">
          <div class="igr-v42-kicker">${isEn()?'CONTEXT 2/2':'CONTEXTE 2/2'}</div>
          <h3>${isEn()?'Common bearings':'Repères communs'}</h3>
          <p>${esc(guide)}</p>
          ${who?`<p class="igr-v42-participants">${esc(who)}</p>`:''}
        </article>
      </div>
      <div class="igr-v42-stream-head">
        <span>${isEn()?'DISCOVERED DURING THE INVESTIGATION':'DÉCOUVERT AU FIL DE L’ENQUÊTE'}</span>
        <strong>${evidence.length}</strong>
      </div>
      <div class="igr-v42-stream">
        ${evidence.length?evidence.map(evidenceCard).join(''):`<div class="igr-v42-empty">${isEn()?'No new evidence has been revealed yet.':'Aucun nouvel élément n’a encore été révélé.'}</div>`}
      </div>
    </section>`;
  }

  if(typeof window.gameTabs==='function'){
    const base=window.gameTabs;
    window.gameTabs=function(){
      const tabs=base.apply(this,arguments);
      return Array.isArray(tabs)?tabs.map(t=>t?.id==='timeline'?{...t,label:isEn()?'Case evidence':'Éléments d’enquête'}:t):tabs;
    };
  }

  if(typeof window.renderTimelineTab==='function'){
    const base=window.renderTimelineTab;
    window.renderTimelineTab=function(){
      if(!CORE.has(scenarioId())) return base.apply(this,arguments);
      return renderInvestigationElements();
    };
  }

  if(typeof window.privateCardHtml==='function'){
    const base=window.privateCardHtml;
    window.privateCardHtml=function(){
      const html=base.apply(this,arguments);
      if(!CORE.has(scenarioId())||typeof html!=='string') return html;
      try{
        const root=document.createElement('div');
        root.innerHTML=html;
        const card=root.querySelector('.private-card-v11');
        const objective=card?.querySelector('.role-summary');
        if(!card||!objective) return html;
        const ps=window.STATE?.sync?.player?.private_state||{};
        const role=window.STATE?.sync?.player?.public_role||window.STATE?.role||'';
        const value=role==='suspect'?(ps.objective_main||ps.position||objective.querySelector('span')?.textContent):objective.querySelector('span')?.textContent;
        const label=objective.querySelector('b');
        const span=objective.querySelector('span');
        if(label) label.textContent=isEn()?'YOUR OBJECTIVE':'TON OBJECTIF';
        if(span&&value) span.textContent=value;
        objective.classList.add('igr-v42-objective');
        const foot=card.querySelector('.private-foot');
        if(foot) card.insertBefore(objective,foot); else card.appendChild(objective);
        return root.innerHTML;
      }catch(_){return html;}
    };
  }

  if(!document.getElementById('igr-v42-investigation-style')){
    const style=document.createElement('style');
    style.id='igr-v42-investigation-style';
    style.textContent=`
      .igr-v42-investigation{display:grid;gap:14px;padding-bottom:22px}
      .igr-v42-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .igr-v42-context-card,.igr-v42-evidence{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.035);border-radius:16px;padding:16px;text-align:left}
      .igr-v42-context-card{min-height:190px}
      .igr-v42-kicker,.igr-v42-evidence-meta,.igr-v42-stream-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55)}
      .igr-v42-context-card h3,.igr-v42-evidence h3{margin:7px 0 8px;font-size:18px;line-height:1.2}
      .igr-v42-context-card p,.igr-v42-evidence p{margin:0;white-space:pre-line;line-height:1.55;color:rgba(255,255,255,.84)}
      .igr-v42-participants{margin-top:12px!important;padding-top:10px;border-top:1px solid rgba(255,255,255,.09);font-size:13px}
      .igr-v42-stream-head{display:flex;align-items:center;justify-content:space-between;padding:4px 2px 0}
      .igr-v42-stream-head strong{font-size:12px;color:rgba(255,255,255,.86)}
      .igr-v42-stream{display:grid;gap:10px}
      .igr-v42-evidence{position:relative}
      .igr-v42-empty{border:1px dashed rgba(255,255,255,.12);border-radius:14px;padding:18px;color:rgba(255,255,255,.52);text-align:center}
      .private-card-v11 .igr-v42-objective{margin-top:18px!important;margin-bottom:10px!important;border-top:1px solid rgba(255,255,255,.16)!important;padding-top:16px!important}
      .private-card-v11 .igr-v42-objective b{letter-spacing:.1em}
      @media(max-width:720px){.igr-v42-context-grid{grid-template-columns:1fr}.igr-v42-context-card{min-height:0}}
    `;
    document.head.appendChild(style);
  }

  window.IGR_INVESTIGATION_V42={version:'42',scenarioGuides:GUIDES,render:renderInvestigationElements};
})();
