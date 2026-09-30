/* Inside Grey Room — OMERTÀ v12.33
   HQ 021–025 artwork, OMERTÀ-scoped visual identity, resilient cryptographic
   role draw, concrete role copy and non-destructive scenario filters. */
(()=>{
  'use strict';

  const IDS=['021','022','023','024','025'];
  const OMERTA=new Set(IDS);
  const ART={
    '021':'assets/omerta-021-l-enveloppe.webp?v=12.33-hq',
    '022':'assets/omerta-022-omerta.webp?v=12.33-hq',
    '023':'assets/omerta-023-la-table.webp?v=12.33-hq',
    '024':'assets/omerta-024-il-pentito.webp?v=12.33-hq',
    '025':'assets/omerta-025-il-don.webp?v=12.33-hq'
  };
  const DRAW_MIN_MS=560;
  const DRAW_FINAL_MS=760;
  const DRAW_MAX_RETRIES=4;
  const FILTER_KEY='igr_scenario_filter_v1';
  const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
  const state=()=>{try{return typeof STATE!=='undefined'?STATE:null}catch(_){return null}};
  const currentId=()=>String(state()?.sync?.room?.scenario_id||state()?.scenarioId||state()?.selectedScenario||'');
  const isOmerta=id=>OMERTA.has(String(id||''));
  const campaign=()=>state()?.sync?.room?.state?.omerta_campaign||null;

  const OMERTA_ROLE_COPY={
    enqueteur:{body:'Tu conduis les interrogatoires, décides certaines orientations de l’enquête et portes la reconstruction finale. Dans OMERTÀ, tu dois distinguer aveu sincère, peur et calcul.'},
    analyste:{body:'Tu repères les contradictions, les changements de version et les liens discrets entre les faits. Tu aides l’Enquêteur à remonter la chaîne des responsabilités.'},
    suspect:{body:'Tu protèges ta position selon ce que ton identité permet : nier, minimiser, négocier, accuser ou coopérer. Sauver ta peau peut exposer quelqu’un d’autre.'},
    avocat:{body:'Tu protèges ton client, contestes les accusations fragiles et limites les conséquences d’un aveu. Une bonne intervention peut modifier l’équilibre de l’enquête.'},
    maitre:{body:'Tu protèges ton client, contestes les accusations fragiles et limites les conséquences d’un aveu. Une bonne intervention peut modifier l’équilibre de l’enquête.'},
    procureur:{body:'Tu exploites les contradictions et la coopération pour transformer des déclarations en charges solides. Ton objectif est de faire remonter les responsabilités.'},
    juge:{body:'Tu arbitres les décisions qui exigent une autorité neutre. Tu dois séparer preuves, versions intéressées et pression de la Famiglia.'},
    informateur:{body:'Tu possèdes des informations utiles mais leur valeur dépend du moment où tu les livres. Coopérer peut te sauver autant que te condamner.'},
    associato:{body:'Tu occupes le bas de la chaîne et tu connais assez de choses pour devenir utile à plusieurs camps. Tu peux nier, transmettre une information ou coopérer, mais chaque parole augmente ton exposition.'},
    uomo_onore:{body:'Tu appartiens au cercle initié et l’omertà pèse directement sur toi. Tu dois protéger la Famiglia sans transformer une loyauté aveugle en preuve contre toi.'},
    contabile:{body:'Tu vois la Famiglia à travers ses comptes, ses dettes et ses flux d’argent. Tes chiffres peuvent relier des hommes que leurs déclarations essaient de séparer.'},
    pentito:{body:'Tu as choisi ou envisages de coopérer avec la justice pour réduire ta peine. Chaque information livrée renforce ton dossier mais augmente le risque d’être identifié par la Famiglia.'},
    caporegime:{body:'Tu diriges un groupe et dois comprendre qui ment, qui a parlé et qui reste loyal. Une sanction mal fondée peut éliminer un allié et fragiliser ton propre pouvoir.'},
    consigliere:{body:'Tu lis les rapports de force, les silences et les conséquences avant de conseiller le sommet. Ton rôle est de distinguer la peur d’une trahison réelle avant qu’une décision irréversible soit prise.'},
    sottocapo:{body:'Tu fais circuler l’autorité entre le Don et les hommes de terrain. Tu dois préserver la continuité de la Famiglia tout en évitant qu’un ordre ambigu déclenche une guerre interne.'},
    don:{body:'Tu es au sommet, mais tout ce qui est commis en ton nom n’a pas forcément été ordonné par toi. Tu dois identifier ce que tu as voulu, toléré ou laissé faire sans perdre le contrôle de la Famiglia.'}
  };

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
        if(isOmerta(cid)&&img.closest?.('.scenario-hero,.scenario-hero-art,.confirm-art,.section-cover,.briefing-poster'))id=cid;
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

  const previousRoleChoiceSummary=typeof window.roleChoiceSummary==='function'?window.roleChoiceSummary:null;
  if(previousRoleChoiceSummary){
    window.roleChoiceSummary=function(sc,count,players){
      const rows=previousRoleChoiceSummary.call(this,sc,count,players)||[];
      if(!isOmerta(sc?.id))return rows;
      return rows.map(row=>{
        const copy=OMERTA_ROLE_COPY[String(row?.id||'')];
        return copy?{...row,info:{...(row.info||{}),...copy}}:row;
      });
    };
  }

  function pairs(){
    const tree=Array.isArray(campaign()?.family_tree)?campaign().family_tree:[];
    return tree.filter(x=>x?.name&&x?.player).map(x=>({name:String(x.name),player:String(x.player)}));
  }
  function replaceCharacterNames(root){
    if(!root||!isOmerta(currentId()))return;
    const map=pairs();if(!map.length||typeof document.createTreeWalker!=='function')return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
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
    const range=0x100000000,limit=range-(range%length),buffer=new Uint32Array(1);
    do{window.crypto.getRandomValues(buffer)}while(buffer[0]>=limit);
    return buffer[0]%length;
  }

  function roleLabel(id){
    try{
      if(typeof window.publicRoleLabel==='function')return window.publicRoleLabel(id);
      if(typeof window.roleInfo==='function')return window.roleInfo(id)?.label||id;
    }catch(_){}
    return id;
  }
  function randomButton(){return document.querySelector('.role-choice-zone .igr-random-role-cta')}
  const drawVisual={active:false,labels:[],display:'',raf:0,lastTick:0,resetTimer:0};
  function applyDrawVisual(){
    const btn=randomButton();if(!btn)return;
    const target=btn.querySelector('em');btn.disabled=drawVisual.active;
    btn.classList.toggle('is-rolling',drawVisual.active);
    if(drawVisual.active)btn.setAttribute('aria-busy','true');else btn.removeAttribute('aria-busy');
    if(target&&drawVisual.display)target.textContent=drawVisual.display;
  }
  function animationFrame(now){
    if(!drawVisual.active){drawVisual.raf=0;return}
    if(drawVisual.labels.length&&now-drawVisual.lastTick>=72){
      drawVisual.lastTick=now;
      const id=drawVisual.labels[secureIndex(drawVisual.labels.length)];
      drawVisual.display=String(roleLabel(id)||id).toUpperCase();applyDrawVisual();
    }
    drawVisual.raf=requestAnimationFrame(animationFrame);
  }
  function startRolling(labels){
    clearTimeout(drawVisual.resetTimer);drawVisual.active=true;
    drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)));
    drawVisual.display=tr('TIRAGE…','DRAWING…');drawVisual.lastTick=0;applyDrawVisual();
    if(!drawVisual.raf)drawVisual.raf=requestAnimationFrame(animationFrame);
  }
  function setRollingLabels(labels){drawVisual.labels=Array.from(new Set((labels||[]).filter(Boolean)))}
  function finishRolling(label){
    drawVisual.active=false;
    if(drawVisual.raf){cancelAnimationFrame(drawVisual.raf);drawVisual.raf=0}
    drawVisual.display=label||tr('TIRER','DRAW');applyDrawVisual();clearTimeout(drawVisual.resetTimer);
    drawVisual.resetTimer=setTimeout(()=>{if(!drawVisual.active){drawVisual.display=tr('TIRER','DRAW');applyDrawVisual()}},DRAW_FINAL_MS);
  }

  function availableRoleTypes(data){
    const sid=String(data?.room?.scenario_id||''),sc=typeof window.scenario==='function'?window.scenario(sid):null;
    if(!sc)return[];
    const players=Array.isArray(data?.players)?data.players:[];
    const meId=String(data?.player?.id||state()?.playerId||'');
    const listed=players.find(p=>String(p?.id||'')===meId)||{},me={...listed,...(data?.player||{})};
    const summary=typeof window.roleChoiceSummary==='function'?(window.roleChoiceSummary(sc,players.length,players)||[]):[];
    const eligible=summary.filter(x=>{
      if(!x?.id)return false;
      const cap=Number(x.cap),taken=Number(x.taken);
      return Number.isFinite(cap)&&cap>0&&Number.isFinite(taken)&&(taken<cap||me.preferred_role===x.id);
    }).map(x=>String(x.id));
    const unique=Array.from(new Set(eligible));
    const alternatives=me.preferred_role?unique.filter(id=>id!==me.preferred_role):unique;
    return alternatives.length?alternatives:unique;
  }
  async function freshSync(){if(typeof window.syncNow==='function')await window.syncNow(true);return state()?.sync||null}
  async function assignOmertaRole(role){
    if(typeof window.rpc!=='function')throw new Error('rpc_unavailable');
    const s=state();if(!s?.room||!s?.token)throw new Error('session_unavailable');
    return window.rpc('igr_omerta_choose_role',{p_code:s.room,p_player_token:s.token,p_role:role});
  }
  function isConcurrencyError(error){return /taken|pris|unavailable|indisponible|already|composition|capacity|capacit|concurrent|conflict/.test(String(error?.message||error||'').toLowerCase())}
  function myPreferredRole(data){
    const s=state(),id=String(data?.player?.id||s?.playerId||''),listed=(data?.players||[]).find(p=>String(p?.id||'')===id);
    return String(data?.player?.preferred_role||listed?.preferred_role||'');
  }

  const previousRandomRole=typeof window.chooseRandomLobbyRole==='function'?window.chooseRandomLobbyRole:null;
  let randomBusy=false;
  async function chooseRandomOmertaRole(){
    if(randomBusy)return;randomBusy=true;const started=performance.now();
    try{
      let data=state()?.sync||null;startRolling(data?availableRoleTypes(data):[]);
      data=await freshSync();if(!data)throw new Error('no_sync');
      let available=availableRoleTypes(data);setRollingLabels(available);
      for(let attempt=0;attempt<DRAW_MAX_RETRIES;attempt++){
        if(!available.length){
          const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
          finishRolling(tr('AUCUN','NONE'));window.toast?.(tr('Aucun rôle disponible.','No role is available.'));return;
        }
        const picked=available[secureIndex(available.length)];
        try{
          await assignOmertaRole(picked);data=await freshSync();if(!data)throw new Error('no_sync_after_assignment');
          const confirmed=myPreferredRole(data);if(confirmed&&confirmed!==picked)throw new Error('role_sync_conflict');
          const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
          finishRolling(String(roleLabel(picked)||picked).toUpperCase());
          if(typeof window.renderLobby==='function'&&state()?.sync)window.renderLobby(state().sync);
          styleOmerta();window.toast?.(`${tr('Rôle tiré','Role drawn')} : ${roleLabel(picked)}`);return;
        }catch(error){
          if(!isConcurrencyError(error)||attempt===DRAW_MAX_RETRIES-1)throw error;
          data=await freshSync();if(!data)throw error;available=availableRoleTypes(data);setRollingLabels(available);
        }
      }
    }catch(error){
      console.error('OMERTÀ random role',error);try{await freshSync()}catch(_){}
      const elapsed=performance.now()-started;if(elapsed<DRAW_MIN_MS)await new Promise(r=>setTimeout(r,DRAW_MIN_MS-elapsed));
      finishRolling(tr('RÉESSAYER','RETRY'));
      window.toast?.(String(error?.message||'').includes('secure_random_unavailable')?tr('Le tirage sécurisé n’est pas disponible sur cet appareil.','Secure drawing is unavailable on this device.'):tr('Le tirage a été resynchronisé. Réessaie.','The draw was resynchronised. Try again.'));
    }finally{randomBusy=false;queueMicrotask(styleOmerta)}
  }
  window.chooseRandomLobbyRole=async function(){
    if(!isOmerta(currentId()))return previousRandomRole?previousRandomRole.apply(this,arguments):undefined;
    return chooseRandomOmertaRole();
  };

  function markOmertaCells(root=document){
    if(!root?.querySelectorAll)return;
    const active=isOmerta(currentId());document.body?.classList.toggle('igr-omerta-active',active);
    const selector=['.role-choice-card','.roles-row','.omerta-role-status','.omerta-objective-card','.omerta-private-role','.omerta-decision-dock','.omerta-family-node','.omerta-tree-current','.omerta-tree-open','.igr-random-role-cta','.player','.mini','.event'].join(',');
    root.querySelectorAll(selector).forEach(el=>el.classList.toggle('igr-omerta-cell',active));
  }
  function styleOmerta(){
    const btn=randomButton(),mafia=isOmerta(currentId());
    if(btn){
      btn.classList.toggle('is-omerta',mafia);btn.classList.toggle('is-base',!mafia);
      const zone=btn.closest('.role-choice-zone');zone?.classList.toggle('is-omerta-scenario',mafia);zone?.classList.toggle('is-base-scenario',!mafia);
      if(mafia&&!btn.dataset.igrRandomV1233){btn.dataset.igrRandomV1233='1';btn.onclick=event=>{event.preventDefault();void window.chooseRandomLobbyRole()}}
    }
    markOmertaCells(document);applyDrawVisual();
  }

  function annotateScenarioMetadata(){
    try{
      if(typeof SCENARIOS==='undefined'||!Array.isArray(SCENARIOS))return;
      SCENARIOS.forEach(sc=>{
        const n=Number(sc?.id);
        if(n>=1&&n<=8){sc.origin='base';sc.collection='original'}
        else if(n>=9&&n<=20){sc.origin='base';sc.collection='modern'}
        else if(n>=21&&n<=25){sc.origin='dlc';sc.collection='omerta'}
      });
    }catch(error){console.warn('scenario metadata',error)}
  }
  function readFilterState(){
    try{
      const parsed=JSON.parse(sessionStorage.getItem(FILTER_KEY)||'{}');
      return {primary:['all','base','original','modern','dlc'].includes(parsed.primary)?parsed.primary:'all',dlc:['all','omerta'].includes(parsed.dlc)?parsed.dlc:'all'};
    }catch(_){return {primary:'all',dlc:'all'}}
  }
  function writeFilterState(next){try{sessionStorage.setItem(FILTER_KEY,JSON.stringify(next))}catch(_){}}
  function metadataForId(id){
    try{const sc=typeof SCENARIOS!=='undefined'?SCENARIOS.find(x=>String(x.id)===String(id)):null;if(sc?.origin&&sc?.collection)return sc}catch(_){}
    const n=Number(id);if(n>=1&&n<=8)return {origin:'base',collection:'original'};if(n>=9&&n<=20)return {origin:'base',collection:'modern'};if(n>=21&&n<=25)return {origin:'dlc',collection:'omerta'};return {origin:'unknown',collection:'unknown'};
  }
  function createFilterButton(label,value,kind){
    const button=document.createElement('button');button.type='button';button.className='igr-scenario-filter-chip';button.dataset.scenarioFilter=value;button.dataset.filterKind=kind;button.textContent=label;return button;
  }
  function applyScenarioFilters(root,stateFilter){
    if(!root)return;
    const basePanel=root.querySelector('.scenario-panel-v10-13'),omertaSection=root.querySelector('.omerta-dlc-section');let visibleBase=0;
    basePanel?.querySelectorAll('.scenario[id^="scenario-"]').forEach(card=>{
      const id=String(card.id||'').replace('scenario-',''),meta=metadataForId(id);let show=false;
      if(stateFilter.primary==='all'||stateFilter.primary==='base')show=meta.origin==='base';
      else if(stateFilter.primary==='original')show=meta.collection==='original';
      else if(stateFilter.primary==='modern')show=meta.collection==='modern';
      card.hidden=!show;card.setAttribute('aria-hidden',show?'false':'true');if(show)visibleBase++;
    });
    if(basePanel)basePanel.hidden=visibleBase===0;
    const showDlc=(stateFilter.primary==='all'||stateFilter.primary==='dlc')&&(stateFilter.dlc==='all'||stateFilter.dlc==='omerta');
    if(omertaSection){omertaSection.hidden=!showDlc;omertaSection.setAttribute('aria-hidden',showDlc?'false':'true')}
    root.querySelectorAll('.igr-scenario-filter-chip').forEach(button=>{
      const active=button.dataset.filterKind==='primary'?button.dataset.scenarioFilter===stateFilter.primary:button.dataset.scenarioFilter===stateFilter.dlc;
      button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');
    });
    const sub=root.querySelector('.igr-scenario-subfilters');if(sub)sub.hidden=stateFilter.primary!=='dlc';
  }
  function decorateScenarioFilters(){
    const root=document.querySelector('.page-create-v10-13');if(!root)return;annotateScenarioMetadata();
    let filters=root.querySelector('.igr-scenario-filters');
    if(!filters){
      filters=document.createElement('nav');filters.className='igr-scenario-filters';filters.setAttribute('aria-label',tr('Filtrer les scénarios','Filter scenarios'));
      const primary=document.createElement('div');primary.className='igr-scenario-filter-row igr-scenario-primary-filters';
      [[tr('Tous','All'),'all'],[tr('Base','Base'),'base'],['001–008','original'],['009–020','modern'],['DLC','dlc']].forEach(([label,value])=>primary.appendChild(createFilterButton(label,value,'primary')));
      const secondary=document.createElement('div');secondary.className='igr-scenario-filter-row igr-scenario-subfilters';
      [[tr('Tous les DLC','All DLC'),'all'],['OMERTÀ','omerta']].forEach(([label,value])=>secondary.appendChild(createFilterButton(label,value,'dlc')));
      filters.append(primary,secondary);const head=root.querySelector('.page-head');if(head?.nextSibling)root.insertBefore(filters,head.nextSibling);else root.prepend(filters);
      filters.addEventListener('click',event=>{
        const button=event.target.closest('.igr-scenario-filter-chip');if(!button)return;const next=readFilterState();
        if(button.dataset.filterKind==='primary')next.primary=button.dataset.scenarioFilter;else next.dlc=button.dataset.scenarioFilter;
        writeFilterState(next);applyScenarioFilters(root,next);
      });
    }
    applyScenarioFilters(root,readFilterState());
  }

  const oldTree=window.igrOmertaOpenFamilyTree;
  if(typeof oldTree==='function')window.igrOmertaOpenFamilyTree=function(){
    const out=oldTree.apply(this,arguments);
    requestAnimationFrame(()=>{
      const modal=document.querySelector('.omerta-tree-modal');if(!modal)return;modal.classList.add('omerta-tree-responsive','omerta-tree-v1233');
      const subtitle=modal.querySelector('.omerta-tree-head p');if(subtitle)subtitle.textContent=tr('Le personnage porte l’histoire ; son rang, ses liens et ses conséquences deviennent ceux du joueur.','The character carries the story; their rank, links and consequences become the player’s.');
      replaceCharacterNames(modal);const scroll=modal.querySelector('.omerta-org-scroll');if(scroll){scroll.style.overflowX='auto';scroll.style.webkitOverflowScrolling='touch';requestAnimationFrame(()=>{scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)/2)})}markOmertaCells(modal);
    });
    return out;
  };

  function refresh(){repairArtwork(document);styleOmerta();decorateScenarioFilters();replaceCharacterNames(document.getElementById('app'))}
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes?.length))queueMicrotask(refresh)});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',refresh,{once:true});window.addEventListener('pageshow',refresh,{passive:true});setTimeout(refresh,0);setTimeout(refresh,250);
})();
