/* Inside Grey Room v12.22 — locale integrity, launch routing, header and settings polish. */
(()=>{
  const locale=()=>window.IGR_LOCALE==='en'?'en':'fr';
  const isEN=()=>locale()==='en';

  const ROLES={
    fr:{
      enqueteur:{label:'Enquêteur',win:'Reconstitue les faits et attribue la bonne responsabilité à chacun.',body:'Tu mènes les interrogatoires, choisis certaines décisions d’enquête et livres la reconstruction finale des faits.'},
      analyste:{label:'Analyste',win:'Aide à reconstruire les faits sans te laisser piéger par les apparences.',body:'Tu repères les contradictions, les changements de version et aides l’Enquêteur à reconstruire le dossier.'},
      suspect:{label:'Suspect',win:'Fais reconnaître exactement ce que tu as fait — ni plus, ni moins.',body:'Tu peux mentir, minimiser, accuser ou avouer une partie si ton rôle le permet. Tu n’inventes jamais une preuve.'},
      maitre:{label:'Avocat',win:'Évite que tes clients soient accusés de faits qu’ils n’ont pas commis.',body:'Tu défends tes clients avec les faits disponibles. Tu argumentes, tu n’inventes pas.'},
      procureur:{label:'Procureur',win:'Fais reconnaître les responsabilités sans accuser au-delà des faits.',body:'Tu peux mener des entretiens ciblés et mettre les versions sous pression.'},
      juge:{label:'Juge',win:'Rends le bon jugement sans dépasser tes accès confidentiels.',body:'Tu peux ouvrir certaines informations protégées et rendre ton propre jugement.'},
      journaliste:{label:'Journaliste',win:'Publie les bonnes informations sans perdre ta crédibilité.',body:'Tu peux publier une Breaking News par cycle et envoyer des messages privés.'},
      inspecteur:{label:'Inspecteur',win:'Choisis les bonnes pistes et établis les faits matériels importants.',body:'Tu peux mener une action de terrain par cycle.'},
      expert:{label:'Expert',win:'Interprète correctement les preuves techniques.',body:'Tu peux lancer une analyse par cycle. Tu établis des faits, pas un coupable.'},
      temoin:{label:'Témoin',win:'Reste cohérent avec ce que tu sais réellement.',body:'Tu peux être entendu puis devenir personne d’intérêt.'},
      espion:{label:'Espion',win:'Accomplis ta mission sans être démasqué.',body:'Ton rôle public est une couverture. Tu n’inventes jamais de preuve.'}
    },
    en:{
      enqueteur:{label:'Investigator',win:'Reconstruct the facts and assign the correct level of responsibility to each person.',body:'You lead interrogations, choose certain investigative decisions and deliver the final factual reconstruction.'},
      analyste:{label:'Analyst',win:'Help reconstruct the facts without being trapped by appearances.',body:'You track contradictions and changes in testimony, and help the Investigator reconstruct the case.'},
      suspect:{label:'Suspect',win:'Make the room recognise exactly what you did — no more and no less.',body:'You may lie, minimise, accuse or partly admit when your role allows it. You never invent evidence.'},
      maitre:{label:'Defence Counsel',win:'Prevent your clients from being blamed for acts they did not commit.',body:'You defend your clients with the available facts. You argue; you do not invent.'},
      procureur:{label:'Prosecutor',win:'Establish responsibility without accusing beyond the facts.',body:'You can conduct focused interviews and put versions under procedural pressure.'},
      juge:{label:'Judge',win:'Reach the correct ruling without exceeding your confidential access.',body:'You may open certain protected information and deliver your own ruling.'},
      journaliste:{label:'Journalist',win:'Publish the right information without losing credibility.',body:'You may publish one Breaking News item per cycle and send private messages.'},
      inspecteur:{label:'Field Inspector',win:'Choose the right leads and establish the important physical facts.',body:'You may conduct one field action per cycle.'},
      expert:{label:'Expert',win:'Interpret technical evidence correctly.',body:'You may launch one analysis per cycle. You establish facts, not a culprit.'},
      temoin:{label:'Witness',win:'Stay consistent with what you genuinely know.',body:'You may be interviewed and can later become a person of interest.'},
      espion:{label:'Spy',win:'Complete your mission without being exposed.',body:'Your public role is a cover. You never invent evidence.'}
    }
  };

  function applyRoleLocale(){
    try{
      const copy=ROLES[locale()];
      Object.entries(copy).forEach(([key,value])=>{if(ROLE_INFO?.[key])Object.assign(ROLE_INFO[key],value)});
    }catch(_){}
  }

  const FR_EXACT=new Map([
    ['Investigator','Enquêteur'],['Analyst','Analyste'],['Defence Counsel','Avocat'],['Prosecutor','Procureur'],['Judge','Juge'],['Journalist','Journaliste'],['Field Inspector','Inspecteur'],['Expert / Forensic Doctor','Expert'],['Witness','Témoin'],['Spy','Espion'],
    ['You lead interrogations, choose certain investigative decisions and deliver the final factual reconstruction.','Tu mènes les interrogatoires, choisis certaines décisions d’enquête et livres la reconstruction finale des faits.'],
    ['You observe interrogations, use the Investigation Channel and take part in side interviews with the Investigator.','Tu observes les interrogatoires, repères les contradictions et aides l’Enquêteur.'],
    ['Required','Obligatoires'],['Optional','Facultatifs'],['Settings','Paramètres'],['Game rules','Règles du jeu'],['Home','Accueil']
  ]);
  const EN_EXACT=new Map([
    ['Enquêteur','Investigator'],['Analyste','Analyst'],['Avocat','Defence Counsel'],['Procureur','Prosecutor'],['Juge','Judge'],['Journaliste','Journalist'],['Inspecteur','Field Inspector'],['Expert','Expert'],['Témoin','Witness'],['Espion','Spy'],
    ['Paramètres','Settings'],['Règles du jeu','Game rules'],['Accueil','Home'],['Obligatoires','Required'],['Facultatifs','Optional']
  ]);

  function patchText(root=document){
    const map=isEN()?EN_EXACT:FR_EXACT;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const tag=node.parentElement?.tagName;
      return ['SCRIPT','STYLE','TEXTAREA','OPTION'].includes(tag)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];let node;while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(n=>{
      const raw=n.nodeValue||'',trim=raw.trim();
      if(!map.has(trim))return;
      n.nodeValue=raw.replace(trim,map.get(trim));
    });
    root.querySelectorAll?.('[aria-label],[title],[placeholder]').forEach(el=>{
      ['aria-label','title','placeholder'].forEach(attr=>{
        if(!el.hasAttribute(attr))return;
        const raw=el.getAttribute(attr)||'',trim=raw.trim();
        if(map.has(trim))el.setAttribute(attr,raw.replace(trim,map.get(trim)));
      });
    });
  }

  function cleanLegacyLocaleControls(){
    document.querySelectorAll('.modal-box').forEach(box=>{
      if(box.closest('.igr-settings-modal'))return;
      box.querySelectorAll(':scope > .security-settings-actions.locale-setting').forEach(el=>el.remove());
      if(!box.querySelector('.igr-locale-sentinel')){
        const sentinel=document.createElement('span');
        sentinel.className='locale-setting igr-locale-sentinel';sentinel.hidden=true;
        box.prepend(sentinel);
      }
    });
  }

  let patching=false;
  function patchUI(root=document){
    if(patching)return;patching=true;
    try{applyRoleLocale();patchText(root);cleanLegacyLocaleControls()}finally{patching=false}
  }

  /* Always enter through Door -> Menu. A saved room remains available through
     "Reprendre ma cellule" instead of auto-routing the player into it. */
  let localNavigationLock=true;
  const baseRoute=window.routeFromServer;
  if(typeof baseRoute==='function')window.routeFromServer=function(...args){
    if(localNavigationLock)return;
    return baseRoute.apply(this,args);
  };

  function lockLocal(){localNavigationLock=true}
  function unlockSession(){localNavigationLock=false}

  const baseShowIntro=window.showIntroGate;
  if(typeof baseShowIntro==='function')window.showIntroGate=function(...args){
    lockLocal();
    try{STATE.view='home';renderHome()}catch(_){}
    return baseShowIntro.apply(this,args);
  };
  const baseCompleteIntro=window.completeIntroEntry;
  if(typeof baseCompleteIntro==='function')window.completeIntroEntry=function(...args){
    lockLocal();
    try{STATE.view='home';renderHome()}catch(_){}
    const result=baseCompleteIntro.apply(this,args);queueMicrotask(()=>patchUI(document));return result;
  };
  for(const name of ['goHome','goCreate','goJoin','goRules','goProfile']){
    const original=window[name];if(typeof original!=='function')continue;
    window[name]=function(...args){lockLocal();return original.apply(this,args)};
  }
  for(const name of ['createRoom','joinRoom']){
    const original=window[name];if(typeof original!=='function')continue;
    window[name]=function(...args){try{stopRoomWatcher?.()}catch(_){}unlockSession();return original.apply(this,args)};
  }
  const baseResume=window.resumeSession;
  if(typeof baseResume==='function')window.resumeSession=function(...args){unlockSession();return baseResume.apply(this,args)};

  function settingsCopy(){
    return isEN()?{
      kicker:'SETTINGS',title:'Settings',general:'General',generalHint:'Language & interface',language:'Language',languageHelp:'Choose the language used throughout the game.',audio:'Audio',audioHint:'Soundscape',sound:'Enable sound',soundHelp:'Changes are heard immediately.',master:'Main volume',ambience:'Ambience',effects:'Effects & alerts',notifications:'Notifications',notificationsHint:'Alerts & device',notificationsHelp:'Choose in-game, sound, vibration and system alerts.',configure:'Configure',privacy:'Privacy & account',privacyHint:'Your data',privacyData:'Privacy and data',account:'Account & recovery',safety:'Room safety',support:'Support & legal',supportHint:'Help',supportButton:'Support',legal:'Terms & privacy',done:'Done',saved:'Settings saved.'
    }:{
      kicker:'PARAMÈTRES',title:'Paramètres',general:'Général',generalHint:'Langue & interface',language:'Langue',languageHelp:'Choisis la langue utilisée dans toute l’application.',audio:'Audio',audioHint:'Ambiance sonore',sound:'Activer le son',soundHelp:'Les changements sont audibles immédiatement.',master:'Volume général',ambience:'Ambiance',effects:'Effets & alertes',notifications:'Notifications',notificationsHint:'Alertes & appareil',notificationsHelp:'Règle les alertes en jeu, le son, la vibration et les notifications système.',configure:'Configurer',privacy:'Confidentialité & compte',privacyHint:'Tes données',privacyData:'Confidentialité et données',account:'Compte & récupération',safety:'Sécurité de la cellule',support:'Support & légal',supportHint:'Aide',supportButton:'Support',legal:'Conditions & confidentialité',done:'Terminé',saved:'Paramètres enregistrés.'
    };
  }

  window.igrSettingsOpenNotifications=function(){try{closeSettings()}catch(_){document.querySelector('.modal')?.remove()}window.igrOpenNotificationSettings?.()};
  window.igrSettingsOpenPrivacy=function(){try{closeSettings()}catch(_){}window.openPrivacy?.()};
  window.igrSettingsOpenAccount=function(){try{closeSettings()}catch(_){}window.igrOpenAccountCenter?.()};
  window.igrSettingsOpenSafety=function(){try{closeSettings()}catch(_){}window.openSafety?.()};
  window.igrSettingsOpenSupport=function(){try{closeSettings()}catch(_){}window.openSupport?.()};
  window.igrSettingsOpenLegal=function(){try{closeSettings()}catch(_){}if(typeof window.igrOpenLegalCenter==='function')window.igrOpenLegalCenter();else window.open?.('terms.html','_blank','noopener')};

  window.openSettings=function(){
    if(document.querySelector('.modal'))return;
    const c=settingsCopy(),en=isEN();
    const account=typeof window.igrOpenAccountCenter==='function';
    const legal=typeof window.igrOpenLegalCenter==='function';
    const notify=typeof window.igrOpenNotificationSettings==='function';
    document.body.insertAdjacentHTML('beforeend',`<div class="modal igr-settings-modal" onclick="if(event.target===this)closeSettings()"><div class="modal-box igr-settings-box" role="dialog" aria-modal="true" aria-label="${c.title}" tabindex="-1">
      <div class="igr-settings-head"><div><div class="kicker">${c.kicker}</div><h2>${c.title}</h2></div><button class="igr-settings-close" type="button" aria-label="${en?'Close':'Fermer'}" onclick="closeSettings()">×</button></div>
      <div class="igr-settings-body">
        <section class="igr-settings-section"><div class="igr-settings-section-title"><h3>${c.general}</h3><span>${c.generalHint}</span></div><div class="igr-setting-row locale-setting"><div class="igr-setting-copy"><b>${c.language}</b><small>${c.languageHelp}</small></div><div class="igr-locale-segment" role="group" aria-label="${c.language}"><button type="button" aria-pressed="${!en}" onclick="igrSetLocale('fr')">Français</button><button type="button" aria-pressed="${en}" onclick="igrSetLocale('en')">English</button></div></div></section>
        <section class="igr-settings-section"><div class="igr-settings-section-title"><h3>${c.audio}</h3><span>${c.audioHint}</span></div><div class="igr-setting-row"><div class="igr-setting-copy"><b>${c.sound}</b><small>${c.soundHelp}</small></div><label class="igr-settings-switch"><input id="soundOn" aria-label="${c.sound}" type="checkbox" ${SOUND.enabled?'checked':''} onchange="liveSoundToggle(this.checked)"><span aria-hidden="true"></span></label></div><div class="igr-audio-row"><label for="master">${c.master}</label><span id="masterValue" class="igr-audio-value">${Math.round(SOUND.master*100)} %</span><input id="master" type="range" min="0" max="1" step=".01" value="${SOUND.master}" oninput="liveSoundRange('master',this.value)"></div><div class="igr-audio-row"><label for="ambience">${c.ambience}</label><span id="ambienceValue" class="igr-audio-value">${Math.round(SOUND.ambience*100)} %</span><input id="ambience" type="range" min="0" max="1" step=".01" value="${SOUND.ambience}" oninput="liveSoundRange('ambience',this.value)"></div><div class="igr-audio-row"><label for="effects">${c.effects}</label><span id="effectsValue" class="igr-audio-value">${Math.round(SOUND.effects*100)} %</span><input id="effects" type="range" min="0" max="1" step=".01" value="${SOUND.effects}" oninput="liveSoundRange('effects',this.value)"></div></section>
        ${notify?`<section class="igr-settings-section"><div class="igr-settings-section-title"><h3>${c.notifications}</h3><span>${c.notificationsHint}</span></div><div class="igr-setting-row"><div class="igr-setting-copy"><b>${c.notifications}</b><small>${c.notificationsHelp}</small></div><button class="btn ghost small" type="button" onclick="igrSettingsOpenNotifications()">${c.configure}</button></div></section>`:''}
        <section class="igr-settings-section"><div class="igr-settings-section-title"><h3>${c.privacy}</h3><span>${c.privacyHint}</span></div><div class="igr-settings-nav"><button type="button" onclick="igrSettingsOpenPrivacy()">${c.privacyData}</button>${account?`<button type="button" onclick="igrSettingsOpenAccount()">${c.account}</button>`:''}${STATE.room&&STATE.token?`<button type="button" onclick="igrSettingsOpenSafety()">${c.safety}</button>`:''}</div></section>
        <section class="igr-settings-section"><div class="igr-settings-section-title"><h3>${c.support}</h3><span>${c.supportHint}</span></div><div class="igr-settings-nav"><button type="button" onclick="igrSettingsOpenSupport()">${c.supportButton}</button>${legal?`<button type="button" onclick="igrSettingsOpenLegal()">${c.legal}</button>`:''}</div></section>
      </div>
      <div class="igr-settings-footer"><button class="btn primary block" type="button" onclick="saveSettings()">${c.done}</button></div>
    </div></div>`);
    const modal=document.querySelector('.igr-settings-modal');
    try{trapDialogFocus?.(modal)}catch(_){}
    patchUI(modal||document);
  };

  window.saveSettings=function(){
    const sound=byId('soundOn'),master=byId('master'),ambience=byId('ambience'),effects=byId('effects');
    if(sound)SOUND.enabled=!!sound.checked;
    if(master)SOUND.master=+master.value;
    if(ambience)SOUND.ambience=+ambience.value;
    if(effects)SOUND.effects=+effects.value;
    setPref('igr_v9_sound_enabled',SOUND.enabled);setPref('igr_v9_master',SOUND.master);setPref('igr_v9_ambience',SOUND.ambience);setPref('igr_v9_effects',SOUND.effects);
    updateGains();if(SOUND.enabled)ensureAmbient(activeSoundPreset());else stopAmbient();
    closeSettings();toast(settingsCopy().saved);
  };

  /* Keep role text and legacy modal remnants clean after every dynamic render. */
  const observer=new MutationObserver(records=>{
    let root=null;
    for(const record of records){for(const n of record.addedNodes){if(n.nodeType===Node.ELEMENT_NODE){root=n;break}}if(root)break}
    queueMicrotask(()=>patchUI(root||document));
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  for(const name of ['renderHome','renderCreateList','renderCreateConfirm','renderJoin','renderRules','renderProfile','renderLobby','renderBriefing','renderRole','renderGame']){
    const original=window[name];if(typeof original!=='function')continue;
    window[name]=function(...args){applyRoleLocale();const out=original.apply(this,args);queueMicrotask(()=>patchUI(document));return out};
  }

  applyRoleLocale();
  try{STATE.view='home';renderHome()}catch(_){}
  patchUI(document);
})();
