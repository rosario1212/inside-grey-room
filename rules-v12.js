/* Inside Grey Room v12.21 — player-facing rules. No gameplay logic. */
(()=>{
 const SETUP_FR=[
  {title:'La salle officielle',kicker:'GREY ROOM',body:'Délimitez un espace avec une table et des sièges face à face pour les interrogatoires et les réunions officielles. Lorsqu’une procédure est en cours, seules les personnes convoquées ou autorisées par l’application y prennent place. Les autres restent dans la zone libre.'},
  {title:'La zone libre et les apartés',kicker:'CONFIDENTIALITÉ',body:'Prévoyez une salle d’attente où les joueurs disponibles peuvent discuter, et un endroit à l’écart pour les échanges confidentiels, notamment avec l’Avocat. Séparez les conversations réservées du reste du groupe. Dans une seule pièce, identifiez les zones et éloignez les non-participants lors des apartés ; chacun respecte les échanges auxquels son rôle n’a pas accès.'},
  {title:'Les téléphones',kicker:'MISE EN PLACE',body:'En multijoueur, chaque joueur rejoint la même cellule sur son téléphone, avec une connexion stable et une batterie suffisante. Gardez les cartes et les écrans privés à l’abri des regards. En mode local, lisez votre carte seul, masquez-la avant de passer le téléphone, puis placez au centre uniquement les écrans publics.'},
  {title:'L’ambiance de la salle',kicker:'IMMERSION',body:'Choisissez un lieu calme et une lumière qui permet de lire les écrans et de voir les visages. Une lumière tamisée ou une musique discrète peut accompagner l’installation ; coupez la musique pendant les échanges officiels. Aucun décor ni accessoire n’est nécessaire : l’immersion repose sur les rôles et la discussion.'}
 ];
 const SETUP_EN=[
  {title:'The official room',kicker:'GREY ROOM',body:'Set aside an area with a table and seats facing each other for interrogations and official meetings. During an official procedure, only people summoned or authorized by the app take their places there. Everyone else stays in the free area.'},
  {title:'The free area and private conversations',kicker:'CONFIDENTIALITY',body:'Provide a waiting area where available players can talk, and a separate spot for confidential conversations, including those with the Lawyer. Keep restricted discussions away from the rest of the group. In a single room, identify the areas and move non-participants away during private conversations; everyone respects discussions their role cannot access.'},
  {title:'The phones',kicker:'SETUP',body:'In multiplayer, each player joins the same cell on their phone, with a stable connection and enough battery. Keep private cards and screens out of sight. In local mode, read your card alone, hide it before passing the phone, then place only public screens at the centre of the table.'},
  {title:'The atmosphere',kicker:'IMMERSION',body:'Choose a quiet place with enough light to read screens and see faces. Dim lighting or quiet music may accompany setup; turn the music off during official discussions. No decoration or prop is required: immersion comes from the roles and conversation.'}
 ];
 window.IGR_ROOM_SETUP_RULES=Object.freeze({fr:SETUP_FR,en:SETUP_EN});
 const FR=[
  {title:'1 · Votre mission',items:['La vérité du dossier est fixe, mais personne ne connaît tous les faits.','Enquêteurs : reconstruisez les actes, les horaires et les responsabilités. Suspects : défendez votre version et votre objectif personnel.']},
  {title:'2 · Ta carte privée',items:['Lis uniquement ta propre carte : elle raconte ce que ton personnage sait et a fait. Ne la montre pas.','Tu peux taire des faits ou mentir à l’oral si ton rôle le permet, mais jamais inventer une preuve ou prétendre connaître les secrets des autres.']},
  {title:'3 · Pendant les cycles',items:['Suis l’étape indiquée à l’écran. Interrogatoires, échanges et actions se déroulent selon les rôles présents.','Les nouvelles pièces d’enquête restent accessibles au camp autorisé. Compare leurs heures et leurs sources aux déclarations. Une piste n’est pas une conclusion.']},
  {title:'4 · Ce qui est public ou privé',items:['Le Dossier commun est visible par tous. « Ma fiche » et les informations réservées à ton camp ne le sont pas.','Parle aux autres joueurs lorsque la phase l’autorise. Les apartés ne doivent pas exposer la carte d’un tiers.']},
  {title:'5 · Fin de l’enquête',items:['Chaque suspect peut présenter sa défense selon la procédure de la partie. Les rôles habilités votent ensuite secrètement.','Les responsabilités sont jugées sur les faits et leur degré, pas sur une simple impression ou sur celui qui parle le mieux.']}
 ];
 const EN=[
  {title:'1 · Your mission',items:['The case truth is fixed, but no player knows every fact.','Investigators: reconstruct actions, timelines and responsibility. Suspects: defend your account and personal objective.']},
  {title:'2 · Your private card',items:['Read only your own card. It tells you what your character knows and did. Never show it.','You may withhold facts or lie aloud if your role allows it, but never invent official evidence or claim access to another character’s secrets.']},
  {title:'3 · During the cycles',items:['Follow the current phase. Interviews, conversations and role actions depend on the players present.','Authorized investigators can compare new evidence, timelines and sources against testimony. A lead is not a verdict.']},
  {title:'4 · Public and private',items:['The Shared case file is visible to everyone. Your personal card and team-only information are not.','Speak to other players when the phase allows it. Side conversations must not reveal someone else’s private card.']},
  {title:'5 · The conclusion',items:['Each suspect can give a defence following the current procedure. Authorized roles then vote privately.','Judge the degree of responsibility using evidence, not performance or confidence.']}
 ];
 const active=()=>window.IGR_LOCALE==='en'?EN:FR;

 // In-game quick rules; the exhaustive protocol remains optional for the host.
 const QUICK_FR=[
  {title:'Le principe',items:['Retrouve qui a fait quoi, à quel moment et avec quelles informations. Une accusation doit s’appuyer sur des faits.','Le dossier est fixe, mais chacun ne connaît qu’une partie de l’histoire.']},
  {title:'Ta carte',items:['Elle est privée : ne la montre pas. Ses faits sont vrais pour ton personnage.','Tu peux cacher un fait ou bluffer à l’oral si ton rôle le permet. N’invente jamais de preuves.']},
  {title:'Pendant la partie',items:['Suis la phase affichée, parle aux autres et utilise seulement les actions disponibles sur ton écran.','La Grey Room gère les temps, les convocations et les résultats des vérifications.']},
  {title:'Les informations',items:['Le Dossier commun contient ce que tous les joueurs peuvent consulter.','Les pièces d’enquête doivent être comparées aux déclarations : un indice seul ne désigne pas un responsable.']},
  {title:'La fin',items:['Une fois l’enquête close, aucun nouvel indice ne peut être demandé.','Les défenses précèdent la décision finale. Le jeu évalue la précision des responsabilités, pas une simple intuition.']}
 ];
 const QUICK_EN=[
  {title:'The idea',items:['Find who did what, when, and what they knew. Accusations need evidence.','The truth is fixed, but each player has only part of it.']},
  {title:'Your card',items:['Keep it private. Its facts are true for your character.','You may hide facts or bluff if your role allows it. Never invent evidence.']},
  {title:'During play',items:['Follow the current phase, speak with others and use the actions on your screen.','The app handles timers, summons and investigation outcomes.']},
  {title:'Information',items:['The Shared case file contains what every player may see.','Compare findings with statements. A single clue does not establish responsibility.']},
  {title:'The ending',items:['After investigation closes, no new evidence can be requested.','Defences precede the final decision. Accuracy matters more than a guess.']}
 ];
 const list=()=>{
  const en=window.IGR_LOCALE==='en';
  const quick=en?QUICK_EN:QUICK_FR;
  const cards=quick.map(r=>'<article class="rule"><h3>'+h(r.title)+'</h3><p>'+r.items.map(i=>'• '+h(i)).join('<br>')+'</p></article>').join('');
  const complete=active().map(r=>'<div class="rule"><h3>'+h(r.title)+'</h3><p>'+r.items.map(i=>'• '+h(i)).join('<br>')+'</p></div>').join('');
  return '<section class="igr-quick-rules"><p class="igr-quick-intro">'+(en?'Everything else is explained at the relevant stage.':'Le reste t’est expliqué au moment où tu en as besoin.')+'</p><div class="rule-list">'+cards+'</div><details class="igr-full-rules"><summary>'+(en?'Full protocol and room setup':'Protocole complet et préparation de la salle')+'</summary><div class="rule-list">'+complete+'</div></details></section>';
 };

 try{renderRules=function(){const en=window.IGR_LOCALE==='en';byId('app').innerHTML=shell(`<main class="page"><div class="page-head"><div><div class="kicker">${en?'Rules':'Règles'}</div><h1>${en?'How to enter the Grey Room':'Entrer dans la Grey Room'}</h1></div><button class="btn ghost small" onclick="goHome()">← ${en?'Home':'Accueil'}</button></div><section class="panel">${list()}</section></main>`)}}catch(_){}
 try{const base=renderGameTab;renderGameTab=function(){if(STATE.tab==='rules')return list();return base.apply(this,arguments)}}catch(_){}
})();
