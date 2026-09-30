/* Inside Grey Room — OMERTÀ v12.33
   021–025 canonical artwork routing, OMERTÀ-scoped role copy,
   cryptographic capacity-aware random draw, scenario filters and iPhone/PWA polish. */
(()=>{
  'use strict';

  const IDS=['021','022','023','024','025'];
  const OMERTA=new Set(IDS);
  const ART={
    '021':'assets/omerta-021-l-enveloppe.webp?v=12.33',
    '022':'assets/omerta-022-omerta.webp?v=12.33',
    '023':'assets/omerta-023-la-table.webp?v=12.33',
    '024':'assets/omerta-024-il-pentito.webp?v=12.33',
    '025':'assets/omerta-025-il-don.webp?v=12.33'
  };
  const DRAW_MIN_MS=560;
  const DRAW_FINAL_MS=760;
  const FILTER_KEY='igr_scenario_filter_v1';
  const DLC_FILTER_KEY='igr_dlc_filter_v1';
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const state=()=>window.STATE||null;
  const currentId=()=>String(state()?.sync?.room?.scenario_id||state()?.scenarioId||state()?.selectedScenario||'');
  const isOmerta=id=>OMERTA.has(String(id||''));
  const campaign=()=>state()?.sync?.room?.state?.omerta_campaign||null;

  /* One canonical high-resolution raster path for every 021–025 view. */
  const oldThumb=window.scenarioThumbArt;
  const oldArt=window.scenarioArt;
  if(typeof oldThumb==='function')window.scenarioThumbArt=id=>isOmerta(id)?ART[String(id)]:oldThumb(id);
  if(typeof oldArt==='function')window.scenarioArt=id=>isOmerta(id)?ART[String(id)]:oldArt(id);

  function repairArtwork(root=document){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('img').forEach(img=>{
      const src=String(img.getAttribute('src')||'');
      let id=IDS.find(x=>img.closest?.(`#scenario-${x}`)||src.includes(`omerta-${x}-`)||src.includes(`omerta-${x}.`));
      if(!id){
        const cid=currentId();
        if(isOmerta(cid)&&img.closest?.('.scenario-hero,.scenario-hero-art,.confirm-art,.section-cover'))id=cid;
      }
      if(!id)return;
      if(img.getAttribute('src')!==ART[id])img.setAttribute('src',ART[id]);
      img.removeAttribute('srcset');
      img.decoding='async';
      img.style.objectFit='cover';
      img.style.objectPosition='center';
      img.style.imageRendering='auto';
    });
  }

  /* OMERTÀ copy is contextual: base dossiers keep their existing role descriptions. */
  const ROLE_COPY_FR={
    enqueteur:{body:'Tu conduis les interrogatoires, décides certaines orientations de l’enquête et portes la reconstruction finale. Dans OMERTÀ, tu dois distinguer aveu sincère, peur et calcul.'},
    analyste:{body:'Tu repères les contradictions, les changements de version et les liens discrets entre les faits. Tu aides l’Enquêteur à remonter la chaîne des responsabilités.'},
    suspect:{body:'Tu protèges ta position selon ce que ton identité permet : nier, minimiser, négocier, accuser ou coopérer. Sauver ta peau peut exposer quelqu’un d’autre.'},
    maitre:{label:'Avocat',body:'Tu protèges ton client, contestes les accusations fragiles et limites les conséquences d’un aveu. Une bonne intervention peut modifier l’équilibre de l’enquête.'},
    avocat:{label:'Avocat',body:'Tu protèges ton client, contestes les accusations fragiles et limites les conséquences d’un aveu. Une bonne intervention peut modifier l’équilibre de l’enquête.'},
    procureur:{body:'Tu exploites les contradictions et la coopération pour transformer des déclarations en charges solides. Ton objectif est de faire remonter les responsabilités.'},
    juge:{body:'Tu arbitres les décisions qui exigent une autorité neutre. Tu dois séparer preuves, versions intéressées et pression de la Famiglia.'},
    informateur:{label:'Informateur',body:'Tu possèdes des informations utiles mais leur valeur dépend du moment où tu les livres. Coopérer peut te sauver autant que te condamner.'},
    associato:{body:'Tu n’es pas encore au sommet de la chaîne. Tu peux nier, négocier ou coopérer, mais chaque information livrée modifie ta valeur pour la Famiglia et pour l’enquête.'},
    uomo_onore:{body:'Tu connais les règles de l’omertà et ce qu’elles coûtent. Tu dois protéger ce qui doit l’être sans te condamner pour un acte qui n’est pas le tien.'},
    contabile:{body:'Tu sais où l’argent passe et quels chiffres relient les hommes entre eux. Explique trop peu et tu deviens inutile ; explique trop et tu désignes la chaîne.'},
    caporegime:{body:'Tu surveilles ton crew et cherches l’origine des fuites avant de sanctionner. Une accusation précipitée peut éliminer un loyal et affaiblir ta propre position.'},
    consigliere:{body:'Tu lis les rapports de force et les conséquences indirectes autour du sommet. Ton rôle est de distinguer trahison réelle, peur et manipulation avant qu’une décision devienne irréversible.'},
    sottocapo:{body:'Tu maintiens la chaîne de commandement quand le sommet vacille. Chaque décision doit préserver la continuité sans déclencher une guerre interne inutile.'},
    pentito:{body:'Tu peux échanger des informations contre une réduction de peine et une protection. Chaque révélation utile augmente aussi le risque que la Famiglia identifie la source.'},
    don:{body:'Tu portes l’autorité finale sans connaître chaque acte commis en ton nom. Tu dois distinguer initiative, loyauté, trahison et ordre réellement donné.'}
  };
  const ROLE_COPY_EN={
    enqueteur:{body:'You lead interrogations, choose key investigative directions and carry the final reconstruction. In OMERTÀ, you must separate sincere confession, fear and calculation.'},
    analyste:{body:'You track contradictions, shifting stories and quiet links between facts. You help the Investigator work back through the chain of responsibility.'},
    suspect:{body:'Protect your position as your identity allows: deny, minimize, bargain, accuse or cooperate. Saving yourself can expose someone else.'},
    maitre:{label:'Lawyer',body:'Protect your client, challenge weak accusations and limit the consequences of a confession. A strong intervention can change the balance of the investigation.'},
    avocat:{label:'Lawyer',body:'Protect your client, challenge weak accusations and limit the consequences of a confession. A strong intervention can change the balance of the investigation.'},
    procureur:{body:'Use contradictions and cooperation to turn statements into solid charges. Your goal is to work upward through the chain of responsibility.'},
    juge:{body:'Arbitrate decisions that require neutral authority. Separate evidence, self-serving versions and pressure from the Famiglia.'},
    informateur:{label:'Informant',body:'You hold useful information, but its value depends on when you reveal it. Cooperation can save you as easily as condemn you.'},
    associato:{body:'You are not at the top of the chain. You can deny, bargain or cooperate, but every fact you reveal changes your value to both the Famiglia and the investigation.'},
    uomo_onore:{body:'You know the rules of omertà and their cost. Protect what must stay protected without taking the fall for an act that is not yours.'},
    contabile:{body:'You know where the money moves and which numbers connect people. Explain too little and you become useless; explain too much and you expose the chain.'},
    caporegime:{body:'Watch your crew and identify the source of leaks before you punish. A rushed accusation can remove a loyal man and weaken your own position.'},
    consigliere:{body:'Read the balance of power and the indirect consequences around the top. Separate real betrayal, fear and manipulation before a decision becomes irreversible.'},
    sottocapo:{body:'Keep the chain of command standing when the top wavers. Each decision must preserve continuity without starting an unnecessary internal war.'},
    pentito:{body:'Trade useful information for a reduced sentence and protection. Every valuable disclosure also increases the risk that the Famiglia identifies the source.'},
    don:{body:'You carry final authority without knowing every act committed in your name. Separate initiative, loyalty, betrayal and an order you actually gave.'}
  };
  const baseRoleInfo=window.roleInfo;
  if(typeof baseRoleInfo==='function')window.roleInfo=function(id){
    const base=baseRoleInfo(id);
    const copy=(window.IGR_LOCALE==='en'?ROLE_COPY_EN:ROLE_COPY_FR)[id];
    if(!isOmerta(currentId())||!copy)return base;
    return {...base,...copy};
  };

  function pairs(){
    const tree=Array.isArray(campaign()?.family_tree)?campaign().family_tree:[];
    return tree.filter(x=>x?.name&&x?.player).map(x=>({name:String(x.name),player:String(x.player)}));
  }
  function replaceCharacterNames(root){
    if(!root||!isOmerta(currentId()))return;
    const map=pairs();if(!map.length||typeof document.createTreeWalker!=='function')return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('script,style,textarea,input,select,option'))continue;
      let text=node.nodeValue||'';
      for(const p of map){
        text=text.split(p.name).join(p.player);
        const first=p.name.split(/\s+/)[0];
        if(first&&first.length>3)text=text.replace(new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),p.player);
      }
      node.nodeValue=text;
    }
  }

  function secureIndex(length){
    if(!Number.isInteger(length)||length<1)throw new Error('invalid_random_range');
    if(!window.crypto?.getRandomValues)throw new Error('secure_random_unavailable');
    const max=0x100000000,limit=max-(max%length),buffer=new Uint32Array(1);
    do{window.crypto.getRandomValues(buffer)}while(buffer[0]>=limit);
    return buffer[0]%length;
  }
  function roleLabel(id){
    try{return typeof window.publicRoleLabel==='function'?window.publicRoleLabel(id):(typeof window.roleInfo==='function'?window.roleInfo(id)?.label||id:id)}catch(_){return id}
  }
  function randomButton(){return document.querySelector('.role-choice-zone .igr-random-role-cta')}
  const drawVisual={active:false,labels:[],display:'',raf:0,lastTick:0,resetTimer:0};
  function applyDrawVisual(){
    const btn=randomButton();if(!btn)return;
    const target=btn.querySelector('em');btn.disabled=drawVisual.active;btn.classList.toggle('is-rolling',drawVisual.active);
    if(drawVisual.active)btn.setAttribute('aria-busy','true');else btn.removeAttribute('aria-busy');
    if(target&&drawVisual.display)target.textContent=drawVisual.display;
  }
  function animationFrame(now){
    if(!drawVisual.active){drawVisual.raf=0;return}
    if(drawVisual.labels.length&&now-drawVisual.lastTick>=72){drawVisual.lastTick=now;const id=drawVisual.labels[secureIndex(drawVisual.labels.length)];drawVisual.display=String(roleLabel(id)||id).toUpperCase();applyDrawVisual()}
    drawVisual.raf=requestAnimationFrame(animationFrame);
  }
  function startRolling(labels){
    clearTimeout(drawVisual.resetTimer);drawVisual.active=true;drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)));drawVisual.display=tr('TIRAGE…','DRAWING…');drawVisual.lastTick=0;applyDrawVisual();if(!drawVisual.raf)drawVisual.raf=requestAnimationFrame(animationFrame);
  }
  function setRollingLabels(labels){drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)))}
  function finishRolling(label){
    drawVisual.active=false;if(drawVisual.raf){cancelAnimationFrame(drawVisual.raf);drawVisual.raf=0}drawVisual.display=label||tr('TIRER','DRAW');applyDrawVisual();clearTimeout(drawVisual.resetTimer);drawVisual.resetTimer=setTimeout(()=>{if(!drawVisual.active){drawVisual.display=tr('TIRER','DRAW');applyDrawVisual()}},DRAW_FINAL_MS);
  }
  function availableRoleTypes(data){
    const sid=String(data?.room?.scenario_id||''),sc=typeof window.scenario==='function'?window.scenario(sid):null;if(!sc)return[];
    const players=Array.isArray(data?.players)?data.players:[],meId=String(data?.player?.id||state()?.playerId||'');
    const listed=players.find(p=>String(p?.id||'')===meId)||{},me={...listed,...(data?.player||{})};
    const summary=typeof window.roleChoiceSummary==='function'?(window.roleChoiceSummary(sc,players.length,players)||[]):[];
    const unique=Array.from(new Set(summary.filter(x=>{const cap=Number(x?.cap),taken=Number(x?.taken);return !!x?.id&&Number.isFinite(cap)&&cap>0&&Number.isFinite(taken)&&(taken<cap||me.preferred_role===x.id)}).map(x=>String(x.id))));
    const alternatives=me.preferred_role?unique.filter(id=>id!==me.preferred_role):unique;
    return alternatives.length?alternatives:unique;
  }
  async function freshSync(){if(typeof window.syncNow==='function')try{await window.syncNow(true)}catch(e){console.warn('random role sync',e)}return state()?.sync||null}
  async function chooseRoleDirect(role,sid){
    if(typeof window.rpc!=='function')throw new Error('rpc_unavailable');const s=state();if(!s?.room||!s?.token)throw new Error('session_unavailable');
    return window.rpc(isOmerta(sid)?'igr_omerta_choose_role':'igr_v4_choose_role',{p_code:s.room,p_player_token:s.token,p_role:role});
  }
  function isConcurrencyError(error){return /taken|pris|unavailable|indisponible|already|composition|capacity|capacit|concurrent|conflict/.test(String(error?.message||error||'').toLowerCase())}
  function syncedOwnRole(data){const meId=String(data?.player?.id||state()?.playerId||'');return String(data?.player?.preferred_role||(data?.players||[]).find(p=>String(p?.id||'')===meId)?.preferred_role||'')}

  let randomBusy=false;
  window.chooseRandomLobbyRole=async function(){
    if(randomBusy)return;randomBusy=true;const started=performance.now();
    try{
      startRolling(state()?.sync?availableRoleTypes(state().sync):[]);let data=await freshSync();if(!data)throw new Error('no_sync');let available=availableRoleTypes(data);setRollingLabels(available);
      for(let attempt=0;attempt<5;attempt++){
        if(!available.length){const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));finishRolling(tr('AUCUN','NONE'));window.toast?.(tr('Aucun rôle disponible.','No role is available.'));return}
        const picked=available[secureIndex(available.length)],sid=String(data?.room?.scenario_id||currentId());
        try{
          await chooseRoleDirect(picked,sid);data=await freshSync();if(!data)throw new Error('no_sync_after_assignment');if(syncedOwnRole(data)!==picked)throw new Error('role_assignment_conflict');
          const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));finishRolling(String(roleLabel(picked)||picked).toUpperCase());
          if(typeof window.renderLobby==='function')window.renderLobby(data);styleOmerta();window.toast?.(`${tr('Rôle tiré','Role drawn')} : ${roleLabel(picked)}`);return;
        }catch(e){
          if(!isConcurrencyError(e)&&!String(e?.message||'').includes('role_assignment_conflict'))throw e;if(attempt===4)throw e;data=await freshSync();if(!data)throw e;available=availableRoleTypes(data);setRollingLabels(available);
        }
      }
    }catch(e){
      console.error('random role',e);const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));finishRolling(tr('RÉESSAYER','RETRY'));
      window.toast?.(String(e?.message||'').includes('secure_random_unavailable')?tr('Le tirage sécurisé n’est pas disponible sur cet appareil.','Secure drawing is unavailable on this device.'):tr('Le tirage a été resynchronisé. Réessaie.','The draw was resynced. Try again.'));
    }finally{randomBusy=false;queueMicrotask(styleOmerta)}
  };

  function markOmertaCells(root=document){
    if(!root?.querySelectorAll)return;const active=isOmerta(currentId());document.body?.classList.toggle('igr-omerta-active',active);
    const selector=['.role-choice-card','.roles-row','.omerta-role-status','.omerta-objective-card','.omerta-private-role','.omerta-decision-dock','.omerta-family-node','.omerta-tree-current','.omerta-tree-open','.igr-random-role-cta','.player','.mini','.event'].join(',');
    root.querySelectorAll(selector).forEach(el=>el.classList.toggle('igr-omerta-cell',active));
  }
  function styleOmerta(){
    const btn=randomButton(),mafia=isOmerta(currentId());if(btn){btn.classList.toggle('is-omerta',mafia);btn.classList.toggle('is-base',!mafia);const zone=btn.closest('.role-choice-zone');zone?.classList.toggle('is-omerta-scenario',mafia);zone?.classList.toggle('is-base-scenario',!mafia)}markOmertaCells(document);applyDrawVisual();
  }

  const oldTree=window.igrOmertaOpenFamilyTree;
  if(typeof oldTree==='function')window.igrOmertaOpenFamilyTree=function(){
    const out=oldTree.apply(this,arguments);requestAnimationFrame(()=>{
      const modal=document.querySelector('.omerta-tree-modal');if(!modal)return;modal.classList.add('omerta-tree-responsive','omerta-tree-v1233');
      const subtitle=modal.querySelector('.omerta-tree-head p');if(subtitle)subtitle.textContent=tr('Le personnage porte l’histoire ; son rang, ses liens et ses conséquences deviennent ceux du joueur.','The character carries the story; their rank, links and consequences become the player’s.');
      replaceCharacterNames(modal);const scroll=modal.querySelector('.omerta-org-scroll');if(scroll){scroll.style.overflowX='auto';scroll.style.webkitOverflowScrolling='touch';requestAnimationFrame(()=>{scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)})}markOmertaCells(modal);
    });return out;
  };

  function scenarioMeta(id){
    const n=Number(id);if(n>=1&&n<=8)return{origin:'base',collection:'original'};if(n>=9&&n<=20)return{origin:'base',collection:'second'};if(OMERTA.has(String(id)))return{origin:'dlc',collection:'omerta'};return{origin:'dlc',collection:'other'};
  }
  function storedFilter(){try{const v=sessionStorage.getItem(FILTER_KEY);return['all','base','original','second','dlc'].includes(v)?v:'all'}catch{return'all'}}
  function saveFilter(v){try{sessionStorage.setItem(FILTER_KEY,v)}catch{}}
  function storedDlcFilter(){try{return sessionStorage.getItem(DLC_FILTER_KEY)==='omerta'?'omerta':'all'}catch{return'all'}}
  function saveDlcFilter(v){try{sessionStorage.setItem(DLC_FILTER_KEY,v)}catch{}}
  function applyScenarioFilter(root,filter){
    const cards=[...root.querySelectorAll('article.scenario[id^="scenario-"]')];
    for(const card of cards){
      const id=card.id.replace('scenario-',''),m=scenarioMeta(id);card.dataset.origin=m.origin;card.dataset.collection=m.collection;const dlcFilter=storedDlcFilter();const dlcMatch=dlcFilter==='all'||m.collection===dlcFilter;
      const show=filter==='all'||(filter==='base'&&m.origin==='base')||(filter==='original'&&m.collection==='original')||(filter==='second'&&m.collection==='second')||(filter==='dlc'&&m.origin==='dlc'&&dlcMatch);card.hidden=!show;
    }
    const dlcFilter=storedDlcFilter();
    root.querySelectorAll('.omerta-dlc-section').forEach(section=>{section.dataset.collection='omerta';section.hidden=!['all','dlc'].includes(filter)||(filter==='dlc'&&dlcFilter!=='all'&&dlcFilter!=='omerta')});
    root.querySelectorAll('.scenario-panel-v10-13').forEach(panel=>{panel.hidden=filter==='dlc'});
    root.querySelectorAll('.igr-scenario-filter [data-filter]').forEach(btn=>{const on=btn.dataset.filter===filter;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on))});
    root.querySelectorAll('.igr-dlc-subfilter [data-dlc-filter]').forEach(btn=>{const on=btn.dataset.dlcFilter===dlcFilter;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on))});
    const sub=root.querySelector('.igr-dlc-subfilter');if(sub)sub.hidden=filter!=='dlc';
  }
  function decorateScenarioFilters(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;let bar=root.querySelector('.igr-scenario-filter');
    if(!bar){
      bar=document.createElement('div');bar.className='igr-scenario-filter';bar.setAttribute('aria-label',tr('Filtrer les scénarios','Filter scenarios'));
      bar.innerHTML=`<div class="igr-filter-scroll" role="group"><button type="button" data-filter="all">${tr('TOUS','ALL')}</button><button type="button" data-filter="base">BASE 001–020</button><button type="button" data-filter="original">001–008</button><button type="button" data-filter="second">009–020</button><button type="button" data-filter="dlc">DLC</button></div><div class="igr-dlc-subfilter" hidden><div class="igr-filter-scroll" role="group"><button type="button" data-dlc-filter="all">${tr('TOUS LES DLC','ALL DLC')}</button><button type="button" data-dlc-filter="omerta" class="igr-filter-omerta">OMERTÀ</button></div></div>`;
      const head=root.querySelector('.page-head');head?.insertAdjacentElement('afterend',bar);
      bar.addEventListener('click',e=>{const main=e.target.closest('[data-filter]');if(main){const filter=main.dataset.filter;saveFilter(filter);applyScenarioFilter(root,filter);return}const sub=e.target.closest('[data-dlc-filter]');if(sub){saveDlcFilter(sub.dataset.dlcFilter);applyScenarioFilter(root,'dlc')}});
    }
    applyScenarioFilter(root,storedFilter());
  }

  function refresh(){repairArtwork(document);styleOmerta();replaceCharacterNames(document.getElementById('app'));decorateScenarioFilters()}
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes?.length))queueMicrotask(refresh)});
  observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',refresh,{once:true});window.addEventListener('pageshow',refresh,{passive:true});setTimeout(refresh,0);setTimeout(refresh,250);
})();
