/* Inside Grey Room v12.23 — authoritative English home/lobby locale + safe Home navigation. */
(()=>{
  const isEN=()=>window.IGR_LOCALE==='en';
  const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};

  /* Going Home must suspend the active room watcher. Otherwise an in-flight sync
     can route the player straight back into the lobby/game after tapping Home. */
  const previousGoHome=window.goHome;
  if(typeof previousGoHome==='function')window.goHome=function(...args){
    try{if(typeof stopRoomWatcher==='function')stopRoomWatcher()}catch(_){}
    const out=previousGoHome.apply(this,args);
    try{if(typeof stopRoomWatcher==='function')stopRoomWatcher()}catch(_){}
    try{STATE.view='home';if(STATE.room&&typeof saveSession==='function')saveSession()}catch(_){}
    return out;
  };

  function localizeHome(){
    if(!isEN()||STATE?.view!=='home')return;
    const root=document.querySelector('.home-card');if(!root)return;
    setText(root.querySelector('.home-subcopy'),'Psychological thriller');
    const resume=root.querySelector('.home-actions > .btn.primary.block, .home-actions-v10-13 > .btn.primary.block');
    if(resume)setText(resume,'Resume my room');
    const actions=[...root.querySelectorAll('.home-action')];
    const copy=[
      ['Create a game','Choose a case.'],
      ['Join a game','Enter a room code.'],
      ['Game rules','Flow, roles and end of game.'],
      ['Profile','Photo, nickname and progress.']
    ];
    actions.forEach((action,i)=>{if(!copy[i])return;setText(action.querySelector('h3'),copy[i][0]);setText(action.querySelector('p'),copy[i][1])});
    const utility=[...root.querySelectorAll('.home-utility-links button')];
    setText(utility[0],'⚙ Settings');setText(utility[1],'Privacy · Security');
  }

  function lobbyStartLabel(d){
    const count=d.players?.length||0,min=d.room?.min_players||0,remaining=Math.max(0,min-count),missing=(d.players||[]).filter(p=>!p.preferred_role).length;
    if(count<min)return `${remaining} more player${remaining===1?'':'s'}`;
    if(missing)return `Start · ${missing} role${missing===1?'':'s'} assigned at random`;
    return 'Start the case';
  }

  function localizeLobby(){
    if(!isEN()||STATE?.view!=='lobby')return;
    const d=STATE?.sync,root=document.querySelector('.lobby-v11');if(!d||!root)return;
    const code=String(d.room?.code||STATE.room||'');
    setText(document.querySelector('.lobby-head .kicker'),`Room ${code}`);
    setText(document.querySelector('.lobby-case-preview > span'),'PUBLIC PREVIEW · SPOILER-FREE');
    setText(document.querySelector('.lobby-head > .btn'),'Leave');

    const count=d.players?.length||0;
    setText(root.querySelector('.lobby-status strong'),`${count} present`);
    root.querySelectorAll('.lobby-role-pending').forEach(el=>setText(el,'Assigned at launch'));

    const rows=[...root.querySelectorAll('.lobby-player-live')];
    rows.forEach((row,i)=>{
      const p=d.players?.[i],btn=row.querySelector('.lobby-profile-btn');
      if(btn&&p)setText(btn,String(p.id)===String(d.player?.id)?'Your case':'Case');
    });

    setText(root.querySelector('.role-choice-zone .section-title h2'),'Choose your role');
    setText(root.querySelector('.role-choice-zone .section-title span'),'First pick reserved');
    setText(root.querySelector('.role-choice-help'),'Choose a role if you have a preference. At launch, every player without a choice automatically receives a random available public role. Secret identities and the Spy remain hidden and are assigned by the server.');

    const random=root.querySelector('.random-role-card');
    if(random){
      setText(random.querySelector('b'),'Random choice');
      setText(random.querySelector('small'),'Uniform draw among the public roles still available. Every role type has exactly one chance in the draw. The Spy remains secret.');
      setText(random.querySelector('em'),'RANDOM');
    }
    root.querySelectorAll('.role-choice-card:not(.random-role-card)').forEach(card=>{
      const state=card.querySelector('em');if(!state)return;
      if(card.classList.contains('selected'))setText(state,'YOUR ROLE');
      else if(card.classList.contains('full'))setText(state,'FULL');
    });

    const start=root.querySelector(':scope > .btn.primary.block');
    if(start)setText(start,lobbyStartLabel(d));
    const waiting=root.querySelector(':scope > .waiting-pulse');if(waiting)setText(waiting,'Waiting for the host…');
  }

  function localizeLateEnglishUI(root=document){
    if(!isEN())return;
    root.querySelectorAll?.('.lobby-profile-btn').forEach(btn=>{
      const row=btn.closest('.lobby-player-live'),rows=[...document.querySelectorAll('.lobby-player-live')],i=rows.indexOf(row),p=STATE?.sync?.players?.[i];
      if(p)setText(btn,String(p.id)===String(STATE?.sync?.player?.id)?'Your case':'Case');
    });
    const replacements=new Map([
      ['Reprendre ma cellule','Resume my room'],['Choisis ton rôle','Choose your role'],['Premier choix réservé','First pick reserved'],
      ['Attribué au lancement','Assigned at launch'],['TON DOSSIER','YOUR CASE'],['Dossier','Case'],['TON RÔLE','YOUR ROLE'],['COMPLET','FULL'],
      ['Choix aléatoire','Random choice'],['AU HASARD','RANDOM'],['En attente de l’hôte…','Waiting for the host…'],
      ['APERÇU PUBLIC · SANS SPOILER','PUBLIC PREVIEW · SPOILER-FREE']
    ]);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];let node;
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(n=>{const raw=n.nodeValue||'',trim=raw.trim();if(replacements.has(trim))n.nodeValue=raw.replace(trim,replacements.get(trim))});
  }

  const previousRenderHome=window.renderHome;
  if(typeof previousRenderHome==='function')window.renderHome=function(...args){const out=previousRenderHome.apply(this,args);localizeHome();queueMicrotask(localizeHome);return out};
  const previousRenderLobby=window.renderLobby;
  if(typeof previousRenderLobby==='function')window.renderLobby=function(...args){const out=previousRenderLobby.apply(this,args);localizeLobby();queueMicrotask(localizeLobby);return out};

  const observer=new MutationObserver(records=>{
    if(!isEN())return;
    let root=document;
    for(const record of records){const el=[...record.addedNodes].find(n=>n.nodeType===Node.ELEMENT_NODE);if(el){root=el;break}}
    queueMicrotask(()=>{localizeHome();localizeLobby();localizeLateEnglishUI(root)});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  localizeHome();localizeLobby();localizeLateEnglishUI(document);
})();
