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
      title:'LE FRONT PREND LA VILLE',
      detail:'La Grey Room reconstitue les persécutions et les responsabilités. Les services civils tombent les uns après les autres.',
      risk:'Les anciens membres du Front n’obtiendront aucune protection automatique si ses forces prennent le bâtiment.'},
    '027':{
      title:'LE FRONT RESSERRE L’ÉTAU',
      detail:'Les renseignements contradictoires peuvent modifier la recommandation de crise. Les civils restent au cœur de la décision.',
      risk:'Les détenus disposent de renseignements dont l’actualité est incertaine; un mauvais choix peut aggraver leur situation.'},
    '028':{
      title:'LE FRONT AUX ABORDS DU CENTRE',
      detail:'La dernière liaison est fragile. Une présence intérieure est soupçonnée, mais son existence doit rester prouvée.',
      risk:'La fidélité au Front ne dit pas qui contrôlera la porte ni si l’un des captifs sera épargné.'}
  };
  const fallEvents=new Set(['terror_v682_sector_lost','terror_v682_at_gates','terror_v682_final_status']);
  function frontBoard(){
    if(!inDlc()||STATE?.view!=='game')return;
    const d=STATE?.sync,board=document.getElementById('terrorV681Board');
    if(!d||!board)return;
    document.getElementById('terrorV682Front')?.remove();
    document.getElementById('terrorV682Immediate')?.remove();
    document.getElementById('terrorV682Private')?.remove();
    const t=state(),city=e(t.city||'la ville'),controlled=Number(t.controlled??12);
    const atGates=controlled<=0||t.terminal_outcome==='front_at_gates';
    const outcome=String(t.terminal_outcome||'');
    const epis=episodeCopy[scen()]||episodeCopy['026'];
    const div=document.createElement('section');
    div.className='terror-v682-front';
    div.id='terrorV682Front';
    div.setAttribute('aria-label','Organisation responsable du siège');
    div.innerHTML='<div class="terror-v682-kicker"><span>ORGANISATION HOSTILE IDENTIFIÉE</span><span>FDR · DOSSIER '+e(scen())+'</span></div>'+
       '<div class="terror-v682-name"><b>LE FRONT DE LA RESTAURATION</b><span>LE FRONT</span></div>'+
       '<p>'+e(epis.detail)+' La ville de '+city+' est représentée par douze secteurs fictifs; ces bulletins ne localisent aucun lieu réel.</p>'+
       '<details><summary>Pourquoi le Front veut atteindre la Grey Room</summary>'+
       '<p>Une coalition de factions armées et d’anciens responsables compromis a promis de restaurer l’ordre. Elle a pris le contrôle de services publics et fait disparaître des opposants. La Grey Room conserve des archives, des dépositions et des documents qui pourraient établir ses crimes. Le Front veut empêcher que ces pièces survivent.</p></details>';
    board.insertAdjacentElement('beforebegin',div);
    const events=Array.isArray(d.events)?d.events:[];
    const latest=events.slice().reverse().find(x=>fallEvents.has(x.event_type));
    if(latest){
      const card=document.createElement('aside');card.id='terrorV682Immediate';
      card.className='terror-v682-breaking'+(latest.event_type==='terror_v682_at_gates'?' terror-v682-urgent':'');
      card.innerHTML='<div class="terror-v682-live-dot" aria-hidden="true"></div><div>'+
      '<small>DERNIER BULLETIN · PUBLIC POUR TOUS LES JOUEURS</small>'+
      '<b>'+e(latest.payload?.title||'SITUATION EN COURS')+'</b>'+
      '<p>'+e(latest.payload?.text||'')+'</p></div>';
      board.insertAdjacentElement('afterend',card);
    }
    if(atGates){
      const gate=document.createElement('section');
      gate.className='terror-v682-gates';
      gate.id='terrorV682Gates';
      gate.setAttribute('role','status');
      gate.innerHTML='<div class="terror-v682-gate-label">PÉRIMÈTRE EXTÉRIEUR ROMPU</div>'+
       '<strong>LE FRONT EST AUX PORTES</strong>'+
       '<p>Les derniers secteurs administrés sont tombés. Les portes de la Grey Room sont fermées, les communications ne garantissent plus aucune extraction. Tous les prisonniers sont en danger, même ceux qui sont restés fidèles au Front.</p>'+
       '<div class="terror-v682-gate-sub">'+(outcome==='front_at_gates'?
         'DÉFAITE COLLECTIVE · LE SORT DES PRÉSENTS RESTE INCERTAIN':
         'ALERTE ACTIVE · L’ENQUÊTE ET LES PREUVES CONTINUENT')+'</div>';
      (document.getElementById('terrorV682Immediate')||board).insertAdjacentElement('afterend',gate);
    }else document.getElementById('terrorV682Gates')?.remove();
    const pressure=Number(t.pressure||0);
    if(pressure>=25){
      const personal=document.createElement('aside');
      personal.id='terrorV682Private';
      personal.className='terror-v682-personal';
      let copy='';
      if(role()==='suspect')copy='Tu es détenu, et le Front se rapproche. Que tu lui sois encore fidèle, que tu l’aies quitté ou que tu n’y aies été lié qu’indirectement, ton sort n’est pas garanti. Joue la peur, la fidélité ou le calcul uniquement selon les informations de ta carte privée. Ton comportement n’est jamais une preuve de culpabilité.';
      else if(['enqueteur','analyste','expert','inspecteur','procureur','juge'].includes(role()))copy='L’enquête n’est plus seulement un dossier : chaque cycle de réponses imprécises augmente le risque que le Front encercle le bâtiment. Continue à distinguer les faits des rumeurs; un suspect qui panique ne devient pas coupable pour cette raison.';
      else copy='Le Front approche. Les renseignements publics sur les secteurs sont accessibles à tous, mais personne ne connaît le destin des témoins ou des détenus en l’absence de confirmation.';
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
        '<p class="terror-v682-lobby-label">MENACE COMMUNE · LE FRONT DE LA RESTAURATION. Les pertes seront visibles par tous; une défaite peut amener ses forces aux portes de la Grey Room.</p>');
    };
  }
})();