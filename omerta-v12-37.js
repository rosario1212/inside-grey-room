/* Inside Grey Room — OMERTÀ v12.37
   HQ posters · safer scenario detection · top remove-choice card · scoped red page theme. */
(() => {
  'use strict';

  const OMERTA_IDS = new Set(['021','022','023','024','025']);
  const ART = Object.freeze({
    '021':'assets/omerta-021-l-enveloppe.webp?v=12.37-final',
    '022':'assets/omerta-022-omerta.webp?v=12.37-final',
    '023':'assets/omerta-023-la-table.webp?v=12.37-final',
    '024':'assets/omerta-024-il-pentito.webp?v=12.37-final',
    '025':'assets/omerta-025-il-don.webp?v=12.37-final'
  });
  const DRAW_MIN_MS = 620;
  const DRAW_RESULT_MS = 760;

  const ROLE_COPY = Object.freeze({
    enqueteur:{body:'Tu conduis les interrogatoires, décides certaines orientations de l’enquête et portes la reconstruction finale. Dans OMERTÀ, tu dois distinguer aveu sincère, peur et calcul.'},
    analyste:{body:'Tu repères les contradictions, les changements de version et les liens discrets entre les faits. Tu aides l’Enquêteur à remonter la chaîne des responsabilités.'},
    suspect:{body:'Tu protèges ta position selon ce que ton identité permet : nier, minimiser, négocier, accuser ou coopérer. Sauver ta peau peut exposer quelqu’un d’autre.'},
    maitre:{body:'Tu protèges ton client, contestes les accusations fragiles et limites les conséquences d’un aveu. Une bonne intervention peut modifier l’équilibre de l’enquête.'},
    procureur:{body:'Tu exploites les contradictions et la coopération pour transformer des déclarations en charges solides. Ton objectif est de faire remonter les responsabilités.'},
    juge:{body:'Tu arbitres les décisions qui exigent une autorité neutre. Tu dois séparer preuves, versions intéressées et pression de la Famiglia.'},
    informateur:{label:'Informateur',win:'Livre les bonnes informations sans te condamner inutilement.',body:'Tu possèdes des informations utiles mais leur valeur dépend du moment où tu les livres. Coopérer peut te sauver autant que te condamner.'},
    associato:{body:'Tu es encore à la périphérie de la Famiglia. Tu peux nier, coopérer ou protéger les autres, mais chaque détail livré peut te rendre utile à la justice — et visible pour le crew.'},
    uomo_onore:{body:'Ton statut repose sur la loyauté et le silence. Tu peux reconnaître certains faits, mais tu dois décider jusqu’où parler sans exposer la structure que tu protèges.'},
    contabile:{body:'Tu sais ce que les flux d’argent prouvent réellement et ce qu’ils ne prouvent pas. Expliquer un compte peut innocenter un homme, en compromettre un autre ou révéler qui avait accès aux chiffres.'},
    pentito:{body:'Tu coopères pour réduire ta peine et obtenir une protection. Chaque information confirmée t’aide devant la justice mais augmente le risque que la Famiglia identifie la source.'},
    caporegime:{body:'Tu dois protéger ton crew et identifier les fuites sans frapper à l’aveugle. Une sanction contre un loyal affaiblit ta position autant qu’une trahison non détectée.'},
    consigliere:{body:'Tu lis les rapports de force, les silences et les conséquences indirectes. Ton rôle est de protéger l’équilibre de la Famiglia sans confondre peur, manipulation et trahison.'},
    sottocapo:{body:'Tu te situes juste sous le sommet et dois préserver la continuité du commandement. Chaque choix de succession ou de protection peut éviter une guerre interne — ou l’accélérer.'},
    don:{body:'Tu es au sommet, mais tu ne contrôles pas chaque acte commis en ton nom. Tu dois distinguer ce que tu as réellement ordonné, ce que tes hommes ont interprété et qui reste loyal.'}
  });

  const isOmerta = id => OMERTA_IDS.has(String(id || ''));
  const readStateScenarioId = () => String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || STATE?.selectedScenario || '');
  const readTextScenarioId = text => {
    const match = String(text || '').match(/\b(?:dossier|DOSSIER)\s*(\d{3})\b/);
    return match ? match[1] : '';
  };
  function visibleScenarioId(){
    if(document.querySelector('.page-create-v10-13')) return '';
    const attrCandidate = document.querySelector('[data-active-scenario-id],[data-selected-scenario-id],[data-scenario-id],[data-igr-scenario-id].selected,[data-igr-scenario-id][aria-current="true"]');
    const attrId = attrCandidate?.dataset?.activeScenarioId || attrCandidate?.dataset?.selectedScenarioId || attrCandidate?.dataset?.scenarioId || attrCandidate?.dataset?.igrScenarioId || '';
    if(attrId) return String(attrId);
    const textSelectors = [
      '.scenario-hero','.scenario-hero-art','.section-cover','.confirm-art','.briefing-poster',
      '.page-scenario-detail','.page-room','.page-lobby','.scenario-detail',
      'main','#app > div','body > div#app'
    ];
    for(const selector of textSelectors){
      const node = document.querySelector(selector);
      const id = readTextScenarioId(node?.textContent);
      if(id) return id;
    }
    return readStateScenarioId();
  }

  const previousThumb = scenarioThumbArt;
  const previousArt = scenarioArt;
  scenarioThumbArt = function(id){ return isOmerta(id) ? ART[String(id)] : previousThumb(id); };
  scenarioArt = function(id){ return isOmerta(id) ? ART[String(id)] : previousArt(id); };

  function findOmertaImageId(img){
    const closestCard = img.closest?.('[id^="scenario-"]');
    if(closestCard){
      const id = String(closestCard.id || '').replace('scenario-','');
      if(isOmerta(id)) return id;
      return null;
    }
    const explicit = img.closest?.('[data-igr-scenario-id]')?.dataset?.igrScenarioId;
    if(isOmerta(explicit)) return String(explicit);
    const src = String(img.getAttribute('src') || '');
    for(const id of OMERTA_IDS){
      if(src.includes(`omerta-${id}-`) || src.includes(`omerta-${id}.`)) return id;
    }
    const sid = visibleScenarioId();
    if(isOmerta(sid) && img.closest?.('.scenario-hero,.scenario-hero-art,.confirm-art,.section-cover,.briefing-poster')) return sid;
    return null;
  }

  function repairArtwork(root=document){
    if(!root?.querySelectorAll) return;
    root.querySelectorAll('img').forEach(img => {
      const id = findOmertaImageId(img);
      if(!id) return;
      const src = ART[id];
      if(img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.decoding = 'async';
      img.style.imageRendering = 'auto';
      img.dataset.omertaHq = '1';
    });
  }

  const previousRoleInfo = roleInfo;
  roleInfo = function(id){
    const base = previousRoleInfo(id);
    if(!isOmerta(visibleScenarioId())) return base;
    const patch = ROLE_COPY[id];
    return patch ? {...base, ...patch} : base;
  };

  function secureIndex(length){
    if(!Number.isInteger(length) || length < 1) throw new Error('invalid_random_range');
    if(!crypto?.getRandomValues) throw new Error('secure_random_unavailable');
    const max = 0x100000000;
    const limit = max - (max % length);
    const buffer = new Uint32Array(1);
    do { crypto.getRandomValues(buffer); } while(buffer[0] >= limit);
    return buffer[0] % length;
  }

  function roleLabel(id){
    try { return publicRoleLabel(id) || roleInfo(id)?.label || id; } catch { return id; }
  }

  function availableRoleTypes(data){
    const sid = String(data?.room?.scenario_id || visibleScenarioId());
    const sc = scenario(sid);
    const players = Array.isArray(data?.players) ? data.players : [];
    const meId = String(data?.player?.id || STATE.playerId || '');
    const listed = players.find(p => String(p?.id || '') === meId) || {};
    const me = {...listed, ...(data?.player || {})};
    const rows = roleChoiceSummary(sc, players.length, players) || [];
    const unique = [];
    for(const row of rows){
      if(!row?.id) continue;
      const cap = Number(row.cap), taken = Number(row.taken);
      if(!Number.isFinite(cap) || cap < 1 || !Number.isFinite(taken)) continue;
      if(taken < cap || me.preferred_role === row.id){
        const id = String(row.id);
        if(!unique.includes(id)) unique.push(id);
      }
    }
    const alternatives = me.preferred_role ? unique.filter(id => id !== me.preferred_role) : unique;
    return alternatives.length ? alternatives : unique;
  }

  async function freshSync(){
    await syncNow(true);
    return STATE.sync;
  }

  async function chooseRoleOnServer(role, sid){
    const rpcName = isOmerta(sid) ? 'igr_omerta_choose_role' : 'igr_v4_choose_role';
    return rpc(rpcName, {p_code:STATE.room, p_player_token:STATE.token, p_role:role});
  }

  function concurrencyError(error){
    return /taken|pris|unavailable|indisponible|already|composition|capacity|capacit|concurrent|conflict|full|complet/i.test(String(error?.message || error || ''));
  }

  const visual = {active:false, labels:[], raf:0, last:0, index:0, reset:0};
  function randomButton(){ return document.querySelector('.role-choice-zone .igr-random-role-cta,.role-choice-zone .random-role-card'); }
  function applyVisual(text){
    const button = randomButton(); if(!button) return;
    const target = button.querySelector('em') || button.querySelector('strong');
    button.disabled = visual.active;
    button.classList.toggle('is-rolling', visual.active);
    if(visual.active) button.setAttribute('aria-busy','true'); else button.removeAttribute('aria-busy');
    if(target && text) target.textContent = text;
  }
  function tick(now){
    if(!visual.active){ visual.raf = 0; return; }
    if(visual.labels.length && now - visual.last >= 72){
      visual.last = now;
      visual.index = (visual.index + 1) % visual.labels.length;
      applyVisual(String(roleLabel(visual.labels[visual.index]) || '').toUpperCase());
    }
    visual.raf = requestAnimationFrame(tick);
  }
  function startVisual(labels){
    clearTimeout(visual.reset);
    visual.active = true;
    visual.labels = [...new Set(labels || [])];
    visual.index = 0;
    visual.last = 0;
    applyVisual('TIRAGE…');
    if(!visual.raf) visual.raf = requestAnimationFrame(tick);
  }
  function finishVisual(label){
    visual.active = false;
    if(visual.raf){ cancelAnimationFrame(visual.raf); visual.raf = 0; }
    applyVisual(label || 'TIRER');
    clearTimeout(visual.reset);
    visual.reset = setTimeout(() => { if(!visual.active) applyVisual('TIRER'); }, DRAW_RESULT_MS);
  }

  let randomBusy = false;
  chooseRandomLobbyRole = async function(){
    if(randomBusy) return;
    randomBusy = true;
    const started = performance.now();
    try {
      const initial = STATE.sync;
      startVisual(initial ? availableRoleTypes(initial) : []);
      let data = await freshSync();
      if(!data) throw new Error('no_sync');
      let available = availableRoleTypes(data);
      visual.labels = available;
      for(let attempt = 0; attempt < 4; attempt++){
        if(!available.length){
          const wait = Math.max(0, DRAW_MIN_MS - (performance.now() - started));
          if(wait) await new Promise(r => setTimeout(r, wait));
          finishVisual('AUCUN');
          toast('Aucun rôle disponible.');
          return;
        }
        const picked = available[secureIndex(available.length)];
        const sid = String(data.room?.scenario_id || visibleScenarioId());
        try {
          await chooseRoleOnServer(picked, sid);
          await freshSync();
          const wait = Math.max(0, DRAW_MIN_MS - (performance.now() - started));
          if(wait) await new Promise(r => setTimeout(r, wait));
          finishVisual(String(roleLabel(picked)).toUpperCase());
          if(STATE.sync) renderLobby(STATE.sync);
          toast(`Rôle tiré : ${roleLabel(picked)}`);
          return;
        } catch(error){
          if(!concurrencyError(error) || attempt === 3) throw error;
          data = await freshSync();
          available = availableRoleTypes(data);
          visual.labels = available;
        }
      }
    } catch(error){
      console.error('secure random role', error);
      const wait = Math.max(0, DRAW_MIN_MS - (performance.now() - started));
      if(wait) await new Promise(r => setTimeout(r, wait));
      finishVisual('RÉESSAYER');
      toast(String(error?.message || '').includes('secure_random_unavailable') ? 'Le tirage sécurisé n’est pas disponible sur cet appareil.' : 'Le tirage a été resynchronisé. Réessaie.');
    } finally {
      randomBusy = false;
      queueMicrotask(refreshOmertaUi);
    }
  };

  function removeChoiceControl(){
    const candidates = [...document.querySelectorAll('button,a,[role="button"]')];
    return candidates.find(el => !el.classList?.contains('igr-remove-role-cta') && /retirer mon choix/i.test(el.textContent || '')) || null;
  }

  function ensureRemoveChoiceCard(){
    const button = randomButton();
    const zone = button?.closest('.role-choice-zone') || button?.parentElement;
    if(!button || !zone) return;
    let card = zone.querySelector('.igr-remove-role-cta');
    if(!card){
      card = document.createElement('button');
      card.type = 'button';
      card.className = 'igr-remove-role-cta';
      card.innerHTML = '<b>RETIRER MON CHOIX</b><em>Revenir à aucun rôle choisi avant le lancement.</em>';
      zone.insertBefore(card, button);
    }
    const lowerControl = removeChoiceControl();
    const disabled = !lowerControl || lowerControl.matches('[disabled],[aria-disabled="true"]') || /aucun rôle choisi/i.test(document.body?.textContent || '');
    card.disabled = disabled;
    card.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    card.onclick = (event) => {
      event.preventDefault();
      const target = removeChoiceControl();
      if(target && !target.matches('[disabled],[aria-disabled="true"]')) target.click();
      else toast('Aucun rôle à retirer.');
    };
  }

  function markOmertaCells(root=document){
    const active = isOmerta(visibleScenarioId());
    document.body?.classList.toggle('igr-omerta-active', active);
    document.body?.classList.toggle('igr-theme-omerta', active);
    if(!root?.querySelectorAll) return;
    const selectors = [
      '.role-choice-card','.igr-random-role-cta','.omerta-tree-open','.omerta-role-status','.igr-remove-role-cta',
      '.roles-row','.omerta-objective-card','.omerta-private-role','.omerta-decision-dock',
      '.omerta-family-node','.omerta-tree-current','.player','.mini','.event'
    ].join(',');
    root.querySelectorAll(selectors).forEach(el => el.classList.toggle('igr-omerta-cell', active));
  }

  function refreshOmertaUi(){
    repairArtwork(document);
    ensureRemoveChoiceCard();
    markOmertaCells(document);
    const button = randomButton();
    if(button){
      button.classList.toggle('is-omerta', isOmerta(visibleScenarioId()));
      button.classList.toggle('is-base', !isOmerta(visibleScenarioId()));
    }
  }

  const observer = new MutationObserver(mutations => {
    if(mutations.some(m => m.addedNodes?.length || m.type === 'attributes')) queueMicrotask(refreshOmertaUi);
  });
  observer.observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['class','src']});
  document.addEventListener('DOMContentLoaded', refreshOmertaUi, {once:true});
  window.addEventListener('pageshow', refreshOmertaUi, {passive:true});
  setTimeout(refreshOmertaUi, 0);
  setTimeout(refreshOmertaUi, 220);
})();
