/* Terror v682 — public fall bulletins and a consequential finale at the Grey Room gates.
   All narrative geography is fictitious, never a real-world tactical map. */
(()=>{
  'use strict';
  const DLC=new Set(['026','027','028']);
  const e=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
  const state=()=>STATE?.sync?.room?.state?.terror_v681||{};
  const inDlc=()=>DLC.has(String(STATE?.sync?.room?.scenario_id||''));
  const role=()=>String(STATE?.sync?.player?.public_role||'');
  const scen=()=>String(STATE?.sync?.room?.scenario_id||'');
  const episodeCopy={
    '026':{
      title:'LE FDR PREND LA VILLE',
      detail:'L'enquête révèle comment le FDR a capturé les institutions. Les pièces authentifiées peuvent aider à restaurer des services civils.',
      risk:'Les anciens membres du Front n’obtiendront aucune protection automatique si ses forces prennent le bâtiment.'},
    '027':{
      title:'LE FDR RESSERRE L’ÉTAU',
      detail:'Les factions du FDR manipulent le renseignement. Les enquêteurs doivent séparer faits, omissions et informations périmées pour protéger les civils.',
      risk:'Les détenus disposent de renseignements dont l’actualité est incertaine; un mauvais choix peut aggraver leur situation.'},
    '028':{
      title:'LE FDR AUX ABORDS DU CENTRE',
      detail:'Le FDR est presque aux portes. Les enquêteurs doivent confirmer ou réfuter une présence intérieure sans céder à une fausse alerte.',
      risk:'La fidélité au Front ne dit pas qui contrôlera la porte ni si l’un des captifs sera épargné.'}
  };
  const fallEvents=new Set(['terror_v682_front_briefing','terror_v681_city_fall','terror_v682_sector_lost','terror_v683_sector_recovered','terror_v688_military_order','terror_v682_at_gates','terror_v682_final_status','terror_v688_captivity']);
  function frontBoard(){
    if(!inDlc()||STATE?.view!=='game')return;
    const d=STATE?.sync,board=document.getElementById('terrorV681Board');
    if(!d||!board)return;
    document.getElementById('terrorV682Front')?.remove();
    document.getElementById('terrorV682Immediate')?.remove();
    document.getElementById('terrorV682Private')?.remove();
    document.getElementById('terrorV682Gates')?.remove();
    document.getElementById('terrorV686Chronicle')?.remove();
    const t=state(),city=e(t.city||'la ville'),controlled=Number(t.controlled??12);
    const atGates=controlled<=0||t.terminal_outcome==='front_at_gates';
    const outcome=String(t.terminal_outcome||'');
    const nationalCounterpush=Math.max(0,Math.min(2,Number(t.counteroffensive||0)));
    const liaisonStatus=String(t.liaison||'active');
    const epis=episodeCopy[scen()]||episodeCopy['026'];
    const div=document.createElement('section');
    div.className='terror-v682-front';
    div.id='terrorV682Front';
    div.setAttribute('aria-label','Organisation responsable du siège');
    div.innerHTML='<div class="terror-v682-kicker"><span>CRISE NATIONALE · RÉPUBLIQUE D’ALMIZIA</span><span>FDR · DOSSIER '+e(scen())+'</span></div>'+
       '<div class="terror-v682-name"><b>FRONT DE LA RESTAURATION</b><span>LE FDR</span></div>'+
       '<p><b>Le FDR est une coalition rebelle armée.</b> Après l’effondrement de la garnison de Ferra, il a pris sa base militaire, récupéré des véhicules blindés et d’importantes réserves. D’anciens soldats ont rejoint ses factions. La capitale '+city+' est la dernière grande ville du pays encore défendue par l’État. Toutes les autres grandes villes sont tombées. La Grey Room conserve des preuves des crimes du FDR.</p>'+
       '<p>'+e(epis.detail)+' La capitale '+city+' tient encore grâce aux forces gouvernementales et à leurs réserves mobiles. Ses douze secteurs représentent une ville fictive de Almizia, sans correspondance géographique réelle.</p>'+
       '<details><summary>Comprendre le pays, la guerre et l’ascension du FDR</summary>'+
       '<p><strong>Il y a quatorze ans.</strong> Un cessez-le-feu met fin à une guerre intérieure, mais les anciennes milices ne sont pas complètement démobilisées. La corruption, les salaires impayés et l’abandon des services publics brisent peu à peu la confiance envers l’État.</p>'+
       '<p><strong>Il y a trois ans.</strong> Des protestations contre l’autorité centrale sont récupérées par une coalition radicalisée. Elle prend le nom de Front de la Restauration. Les habitants l’appellent le FDR. Le groupe promet de rétablir l’ordre, puis impose persécutions, enlèvements et répression.</p>'+
       '<p><strong>Il y a neuf mois.</strong> Le commandement de la base militaire de Ferra se désorganise. Une partie de la garnison déserte et le FDR s’empare de véhicules blindés, de matériel et de réserves. Cette prise le transforme en force armée capable de conquérir les grandes villes.</p>'+
       '<p><strong>Aujourd’hui.</strong> Les autres grandes villes sont tombées. Les forces armées de Almizia résistent dans leur capitale, appuyées par des unités isolées et des réserves hors de la ville. Une synthèse judiciaire vérifiée peut leur permettre de sécuriser puis reprendre un secteur, sans victoire miraculeuse.</p></details>'+
       '<div class="terror-v682-liaison"><small>DERNIÈRE CAPITALE LIBRE · '+city+' · FORCES ARMÉES DE ALMIZIA</small>'+
       '<strong>'+e(liaisonStatus==='lost'?'DERNIÈRE LIAISON ROMPUE':nationalCounterpush>0?'CONTRE-OFFENSIVE EN COURS':'RECOUPEMENT DES INFORMATIONS')+'</strong>'+
       '<p>Vos décisions comptent pour la dernière capitale libre. À chaque cycle, des analyses recoupées donnent aux forces nationales une information à vérifier puis à exploiter ; des conclusions insuffisantes freinent leur réponse, et des erreurs majeures accélèrent le FDR. Chaque perte ou reconquête est rendue publique.</p></div>';
    board.insertAdjacentElement('beforebegin',div);
    const events=Array.isArray(d.events)?d.events:[];
    const latest=events.slice().reverse().find(x=>fallEvents.has(x.event_type));
    const chronicle=events.filter(x=>fallEvents.has(x.event_type)).slice(-5).reverse();
    if(latest){
      const card=document.createElement('aside');card.id='terrorV682Immediate';
      card.className='terror-v682-breaking'+(latest.event_type==='terror_v682_at_gates'?' terror-v682-urgent':'')+(latest.event_type==='terror_v683_sector_recovered'?' terror-v682-recapture':'');
      card.innerHTML='<div class="terror-v682-live-dot" aria-hidden="true"></div><div>'+
      '<small>DERNIER BULLETIN · PUBLIC POUR TOUS LES JOUEURS</small>'+
      '<b>'+e(latest.payload?.title||'SITUATION EN COURS')+'</b>'+
      '<p>'+e(latest.payload?.text||'')+'</p>'+(latest.event_type==='terror_v681_city_fall'&&latest.payload?.correct_answers!==undefined?'<p class="terror-v682-score">Réponses exactes : '+Number(latest.payload.correct_answers)+' / 6 · '+e(latest.payload.effect==='reconquest'?'RECONQUÊTE NATIONALE':latest.payload.effect==='fdr_breakthrough'?'LE FDR ACCÉLÈRE':'DÉFENSE SOUS PRESSION')+'</p>':'')+'</div>';
      board.insertAdjacentElement('afterend',card);
    }

    document.getElementById('terrorV686Chronicle')?.remove();
    if(chronicle.length){
      const headlines=document.createElement('section');
      headlines.id='terrorV686Chronicle';
      headlines.className='terror-v686-chronicle';
      headlines.setAttribute('aria-label','Journal public des pertes et reconquêtes');
      headlines.innerHTML='<div class="terror-v686-chronicle-title">JOURNAL PUBLIC DE LA CAPITALE · '+city+'</div>'+
        chronicle.map(x=>'<div class="terror-v686-news '+(x.event_type==='terror_v683_sector_recovered'?'is-good':x.event_type==='terror_v682_sector_lost'?'is-bad':'is-report')+'"><span>'+e(x.payload?.title||'SITUATION')+'</span><small>'+e(x.payload?.text||'')+'</small></div>').join('');
      (document.getElementById('terrorV682Immediate')||board).insertAdjacentElement('afterend',headlines);
    }

    if(atGates){
      const gate=document.createElement('section');
      gate.className='terror-v682-gates';
      gate.id='terrorV682Gates';
      gate.setAttribute('role','status');
      gate.innerHTML='<div class="terror-v682-gate-label">PÉRIMÈTRE EXTÉRIEUR ROMPU</div>'+
       '<strong>LE FDR EST AUX PORTES</strong>'+
       '<p>Les derniers secteurs administrés sont tombés. Les portes de la Grey Room sont fermées, les communications ne garantissent plus aucune extraction. Tous les prisonniers sont en danger, même ceux qui sont restés fidèles au Front.</p>'+
       '<div class="terror-v682-gate-sub">'+(outcome==='front_at_gates'?
         'DÉFAITE COLLECTIVE · LE SORT DES PRÉSENTS RESTE INCERTAIN':
         'ALERTE ACTIVE · L’ENQUÊTE ET LES PREUVES CONTINUENT')+'</div>';
      (document.getElementById('terrorV682Immediate')||board).insertAdjacentElement('afterend',gate);
    }else document.getElementById('terrorV682Gates')?.remove();
    const pressure=Number(t.pressure||0);
    if(pressure>=25||(Array.isArray(t.history)&&t.history.length>0)){
      const personal=document.createElement('aside');
      personal.id='terrorV682Private';
      personal.className='terror-v682-personal';
      let copy='';
      if(role()==='suspect')copy='Tu es détenu, et le Front se rapproche. Que tu lui sois encore fidèle, que tu l’aies quitté ou que tu n’y aies été lié qu’indirectement, ton sort n’est pas garanti. Joue la peur, la fidélité ou le calcul uniquement selon les informations de ta carte privée. Ton comportement n’est jamais une preuve de culpabilité.';
      else if(['enqueteur','analyste','expert','inspecteur','procureur','juge'].includes(role()))copy='L’enquête n’est plus seulement un dossier : chaque cycle de réponses imprécises augmente le risque que le Front encercle le bâtiment. Continue à distinguer les faits des rumeurs; un suspect qui panique ne devient pas coupable pour cette raison.';
      else copy='Le FDR approche. Les renseignements publics sur les secteurs sont accessibles à tous, mais personne ne connaît le destin des témoins ou des détenus en l’absence de confirmation.';
      personal.innerHTML='<b>'+e(epis.title)+' · '+e(role()==='suspect'?'TON RISQUE PERSONNEL':'RISQUE COLLECTIF')+'</b><p>'+e(copy)+'</p>';
      (document.getElementById('terrorV682Gates')||document.getElementById('terrorV682Immediate')||board).insertAdjacentElement('afterend',personal);
    }
  }
  // This last wrapper composes with v33/v681 and only decorates the all-role public UI.
  if(typeof renderGame==='function'){
    const previous=renderGame;
    renderGame=function(){previous.apply(this,arguments);frontBoard();};
  }
  if(typeof renderLobby==='function'){
    const previous=renderLobby;
    renderLobby=function(){previous.apply(this,arguments);
      if(!inDlc())return;
      const summary=document.querySelector('.lobby-case-preview');
      if(summary&&!summary.querySelector('.terror-v682-lobby-label'))summary.insertAdjacentHTML('beforeend',
        '<p class="terror-v682-lobby-label">MENACE COMMUNE · LE FDR, UNE RÉBELLION ARMÉE NÉE EN ALMIZIA. Les chutes et reprises de secteurs seront visibles de tous ; une défaite amène le FDR aux portes de la Grey Room.</p>');
    };
  }
})();