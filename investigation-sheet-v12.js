/* Inside Grey Room — shared investigation repère v12.11
   Optional public reference chosen by the Investigator.
   It is never an objective, never tied to a cycle, and never steers adaptive trames.
*/
(() => {
  if (typeof renderInvestigationTab !== 'function') return;

  const OPTIONS = [
    { key: 'libre', label: 'Discussion libre', detail: 'Aucun repère affiché. Le groupe suit librement ce qui lui paraît important.' },
    { key: 'chronologie', label: 'Chronologie', detail: 'Horaires, ordre des faits et fenêtres de temps.' },
    { key: 'acces', label: 'Accès & déplacements', detail: 'Présences, passages, lieux et possibilités d’accès.' },
    { key: 'temoignages', label: 'Témoignages & versions', detail: 'Ce qui a été raconté, omis ou compris différemment.' },
    { key: 'mobile', label: 'Motifs & intérêts', detail: 'Relations, intérêts et raisons possibles d’agir.' },
    { key: 'materiel', label: 'Éléments matériels', detail: 'Objets, données, traces et documents déjà connus.' },
    { key: 'responsabilite', label: 'Responsabilités', detail: 'Actions, décisions, omissions et degrés d’implication.' }
  ];
  const BY_KEY = new Map(OPTIONS.map(x => [x.key, x]));
  const baseRenderInvestigationTab = renderInvestigationTab;
  let busy = false;

  function roomFocus() {
    const stored = STATE?.sync?.room?.state?.investigation_focus;
    return BY_KEY.get(String(stored?.key || 'libre')) || BY_KEY.get('libre');
  }

  function renderFocusButtons(activeKey) {
    return OPTIONS.map(option => `
      <button type="button" class="investigation-focus-choice ${option.key === activeKey ? 'active' : ''}"
        data-investigation-focus="${option.key}" aria-pressed="${option.key === activeKey ? 'true' : 'false'}">
        <b>${h(option.label)}</b><span>${h(option.detail)}</span>
      </button>`).join('');
  }

  function renderInvestigationSheet() {
    const d = STATE?.sync;
    if (!d?.room || d.room.status !== 'playing' || ['briefing', 'role_reading', 'reveal'].includes(d.room.phase)) return '';

    const active = roomFocus();
    const isInvestigator = d.player?.public_role === 'enqueteur';

    return `<section class="investigation-sheet" aria-label="Repère d’enquête commun">
      <div class="investigation-sheet-head">
        <div><div class="kicker">REPÈRE D’ENQUÊTE · COMMUN</div><h3>Point en cours</h3></div>
        <span class="investigation-sheet-status">FACULTATIF</span>
      </div>
      <div class="investigation-focus-current ${active.key === 'libre' ? 'free' : ''}">
        <small>${active.key === 'libre' ? 'AUCUN REPÈRE' : 'REPÈRE ACTUEL'}</small>
        <strong>${h(active.label)}</strong>
        <p>${active.key === 'libre'
          ? 'L’application ne fixe aucune direction. La discussion orale reste entièrement libre.'
          : 'Repère déclaré par l’Enquêteur. Il peut durer trente secondes ou toute la partie : ce n’est ni un objectif, ni un indice sur la bonne piste, ni une consigne du MJ.'}</p>
      </div>
      ${isInvestigator ? `<div class="investigation-focus-controls">
        <div class="investigation-focus-copy"><b>Afficher un repère au groupe</b><span>Utilise-le seulement si cela aide la discussion. Change-le à n’importe quel moment ou reviens immédiatement à « Discussion libre ». Ce choix ne modifie jamais les trames.</span></div>
        <div class="investigation-focus-grid">${renderFocusButtons(active.key)}</div>
      </div>` : `<div class="investigation-focus-readonly">Visible par tous · modifiable uniquement par l’Enquêteur · sans effet sur le MJ automatique.</div>`}
    </section>`;
  }

  async function setFocus(key) {
    if (busy || STATE?.sync?.player?.public_role !== 'enqueteur') return;
    const option = BY_KEY.get(key);
    if (!option) return;
    busy = true;
    document.querySelectorAll('[data-investigation-focus]').forEach(btn => { btn.disabled = true; });
    try {
      await rpc('igr_v4_set_investigation_focus', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_focus: option.key
      });
      await syncNow(true);
      toast(option.key === 'libre' ? 'Discussion libre.' : `Repère commun : ${option.label}.`);
    } catch (error) {
      console.error('investigation focus', error);
      toast('Impossible de modifier le repère d’enquête.');
    } finally {
      busy = false;
    }
  }

  renderInvestigationTab = function () {
    return renderInvestigationSheet() + baseRenderInvestigationTab();
  };

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-investigation-focus]');
    if (!button) return;
    event.preventDefault();
    void setFocus(button.dataset.investigationFocus || 'libre');
  });

  const style = document.createElement('style');
  style.textContent = `
.investigation-sheet{margin:0 0 16px;padding:17px;border:1px solid rgba(255,255,255,.09);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.012));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
.investigation-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.investigation-sheet-head h3{margin:5px 0 0;font-size:20px}.investigation-sheet-status{padding:6px 8px;border:1px solid rgba(255,255,255,.08);border-radius:999px;color:#76818a;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;white-space:nowrap}
.investigation-focus-current{margin-top:13px;padding:14px 15px;border-left:3px solid #c9d0d6;background:rgba(255,255,255,.025);border-radius:0 12px 12px 0}.investigation-focus-current.free{border-left-color:#59636d}.investigation-focus-current small{display:block;color:#717c86;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.12em}.investigation-focus-current strong{display:block;margin-top:5px;font-size:18px}.investigation-focus-current p{margin:7px 0 0;color:#909aa4;font-size:11px;line-height:1.55}
.investigation-focus-controls{margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.06)}.investigation-focus-copy{display:grid;gap:4px;margin-bottom:10px}.investigation-focus-copy b{font-size:12px}.investigation-focus-copy span,.investigation-focus-readonly{color:#77818b;font-size:10px;line-height:1.5}
.investigation-focus-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.investigation-focus-choice{appearance:none;text-align:left;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.014);color:#dfe4e8;cursor:pointer;touch-action:manipulation}.investigation-focus-choice b{display:block;font-size:11px}.investigation-focus-choice span{display:block;margin-top:4px;color:#737e88;font-size:9px;line-height:1.45}.investigation-focus-choice.active{border-color:#aab3bb;background:rgba(255,255,255,.055)}.investigation-focus-choice:disabled{opacity:.55;cursor:wait}.investigation-focus-choice:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(240,241,242,.2)}
.investigation-focus-readonly{margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.055)}
@media(max-width:620px){.investigation-focus-grid{grid-template-columns:1fr}.investigation-sheet{padding:15px}}
`;
  document.head.appendChild(style);
})();

/* Inside Grey Room — narrative depth v12.11
   The application controls pressure, timing and canonical facts — never the players' interpretation.
   Debriefs measure the state of the room without asking what subject should be investigated.
   Final truth is revealed in synchronized cinematic layers.
*/
(() => {
  if (typeof renderDebriefForm !== 'function' || typeof renderReveal !== 'function') return;

  const basePhaseInstruction = typeof phaseInstruction === 'function' ? phaseInstruction : null;
  const baseRenderReveal = renderReveal;
  let revealBusy = false;

  if (basePhaseInstruction) {
    phaseInstruction = function(role, ph, target) {
      if (ph === 'cycle_debrief') {
        return ['enqueteur','analyste'].includes(role)
          ? `<p>Évalue seulement l’état de la discussion. Le MJ ajuste la pression du prochain élément, jamais le sujet que vous devez suivre.</p>`
          : `<p>L’enquête prend un court temps de recul. Continue à préparer ta version ; aucune « bonne piste » n’est indiquée par l’application.</p>`;
      }
      if (ph === 'trame') {
        if (!canInvestigationChannel(role)) return `<p>Un nouvel élément canonique entre dans le dossier. L’enquête choisit seule ce qu’elle en fait.</p>`;
        const e = latestEvent('trame');
        return `<p>Un fait supplémentaire entre dans le dossier. Il peut confirmer, compliquer ou changer le sens d’un élément déjà connu — sans désigner la piste à suivre.</p>${e?`<div class="trame-focus"><b>${h(e.payload?.title||'TRAME')}</b><span>${h(e.payload?.text||'')}</span></div>`:''}`;
      }
      if (ph === 'reveal') return `<p>Le verdict est verrouillé. La vérité va maintenant s’ouvrir par couches, dans le même ordre pour toute la cellule.</p>`;
      return basePhaseInstruction(role, ph, target);
    };
  }

  renderDebriefForm = function() {
    if (myAction('debrief')) return `<div class="locked-state">Lecture envoyée. Le MJ n’utilise cette réponse que pour régler la pression narrative du prochain élément.</div>`;
    return `<div class="qcm-v11 narrative-debrief">
      <div class="narrative-debrief-intro"><b>ÉTAT DE LA PIÈCE</b><span>Aucune question sur la piste à suivre. Le MJ ne choisit pas votre enquête.</span></div>
      <div class="field"><label for="qConvergence">1 · Le groupe s’est-il déjà figé sur une même explication ?</label><select id="qConvergence"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui, très fortement</option></select></div>
      <div class="field"><label for="qConfusion">2 · Des éléments importants restent-ils difficiles à relier ?</label><select id="qConfusion"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui, fortement</option></select></div>
      <button class="btn primary block" onclick="submitDebrief()">Envoyer au MJ automatique</button>
    </div>`;
  };

  submitDebrief = async function() {
    try {
      await rpc('igr_v4_submit_debrief', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_convergence: +byId('qConvergence').value,
        p_confusion: +byId('qConfusion').value,
        p_axis: ''
      });
      await syncNow(true);
    } catch(e) {
      console.error(e);
      toast('Lecture déjà envoyée ou phase terminée.');
    }
  };

  function revealPayload() {
    const event = latestEvent('reveal');
    return event?.payload || {};
  }

  function revealText(text, responsibilities) {
    if (!text) return '';
    try {
      return typeof revealSummaryWithNames === 'function'
        ? revealSummaryWithNames(String(text), responsibilities || [])
        : String(text);
    } catch {
      return String(text);
    }
  }

  function revealStage() {
    const room = STATE.sync?.room;
    const raw = room?.state?.cinematic_reveal;
    if (!raw) return 0;
    const updated = Date.parse(raw.updated_at || '');
    const started = Date.parse(room.phase_started_at || '');
    if (Number.isFinite(updated) && Number.isFinite(started) && updated + 1000 < started) return 0;
    return Math.max(0, Math.min(4, Number(raw.stage) || 0));
  }

  function canDriveReveal() {
    const d = STATE.sync;
    return !!(STATE.hostToken || d?.player?.is_host || d?.player?.public_role === 'enqueteur');
  }

  async function advanceReveal(stage) {
    if (revealBusy || !canDriveReveal()) return;
    revealBusy = true;
    document.querySelectorAll('[data-reveal-next]').forEach(b => { b.disabled = true; });
    try {
      await rpc('igr_v4_set_reveal_stage', {
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_stage: stage
      });
      await syncNow(true);
      requestAnimationFrame(() => document.querySelector(`[data-reveal-act="${stage}"]`)?.scrollIntoView({behavior:'smooth',block:'start'}));
    } catch (e) {
      console.error('cinematic reveal', e);
      toast('Impossible d’ouvrir la suite de la révélation.');
    } finally {
      revealBusy = false;
    }
  }
  window.igrAdvanceReveal = advanceReveal;

  function verdictRows(responsibilities) {
    return responsibilities.map(x => {
      const guess = Number(x.enqueteur_level);
      return `<div class="cinema-verdict-row"><span>${h(x.pseudo)}</span><b>${guess < 0 ? 'NON VERROUILLÉ' : `${guess}/3 · ${h(responsibilityLabel(guess))}`}</b></div>`;
    }).join('');
  }

  function truthRows(responsibilities) {
    return responsibilities.map(x => `<div class="cinema-truth-row"><span>${h(x.pseudo)}</span><b>${h(x.truth_level)}/3 · ${h(responsibilityLabel(x.truth_level))}</b><small>${h(responsibilityDelta(x.truth_level,x.enqueteur_level))}</small></div>`).join('');
  }

  function characterRows(cinematic, responsibilities) {
    const chars = Array.isArray(cinematic?.characters) ? cinematic.characters : [];
    return chars.map((c, index) => {
      const person = responsibilities[index];
      const name = person?.pseudo || `Suspect ${index + 1}`;
      return `<article class="cinema-character">
        <div class="cinema-character-head"><span>${h(name)}</span><small>${h(c.place || '')}</small></div>
        ${c.hide ? `<div><b>CE QUI ÉTAIT CACHÉ</b><p>${h(revealText(c.hide,responsibilities))}</p></div>` : ''}
        ${c.chronology ? `<div><b>SA CHRONOLOGIE RÉELLE</b><p>${h(revealText(c.chronology,responsibilities))}</p></div>` : ''}
        ${c.anchors ? `<div><b>CE QUE CELA CHANGE</b><p>${h(revealText(c.anchors,responsibilities))}</p></div>` : ''}
      </article>`;
    }).join('');
  }

  function resultsHtml(p, cont) {
    const strength = id => (cont?.winners || []).find(w => String(w.id) === String(id))?.score;
    return `<div class="result-list">${(p.results||[]).map(x=>{const s=strength(x.player_id);return `<div class="result-line ${x.success?'winner':'loser'}"><b>${h(x.pseudo)} · ${h(publicRoleLabel(x.role))}</b><strong>${x.success?'VICTOIRE':'DÉFAITE'}</strong><span>${h(x.text)}</span>${x.success&&s!=null?`<small class="victory-strength">Force de victoire · ${h(s)}/100</small>`:''}</div>`}).join('')}</div>`;
  }

  function act(title, kicker, body, index, open) {
    if (!open) return '';
    return `<section class="cinema-act" data-reveal-act="${index}"><div class="cinema-act-kicker">${h(kicker)}</div><h3>${h(title)}</h3>${body}</section>`;
  }

  function nextControl(stage) {
    if (stage >= 4) return '';
    const labels = ['Révéler la vérité','Reconstruire les faits','Ouvrir les zones cachées','Dernière recontextualisation'];
    if (canDriveReveal()) return `<button class="btn primary block cinema-next" data-reveal-next type="button" onclick="igrAdvanceReveal(${stage+1})">${h(labels[stage])} →</button>`;
    return `<div class="cinema-wait"><span>EN ATTENTE</span><p>L’hôte ou l’Enquêteur ouvre la couche suivante pour toute la cellule.</p></div>`;
  }

  renderReveal = function() {
    const p = revealPayload();
    const truth = STATE.sync?.scenario?.truth || {};
    const cinematic = truth.cinematic;
    if (!cinematic || !Array.isArray(cinematic.timeline)) return baseRenderReveal();

    const responsibilities = p.responsibilities || [];
    const cont = STATE.sync?.room?.state?.continuation;
    const stage = revealStage();
    const summary = revealText(p.summary || truth.summary || 'Révélation en cours…', responsibilities);
    const timeline = cinematic.timeline.map((line,i)=>`<div class="cinema-timeline-row"><span>${String(i+1).padStart(2,'0')}</span><p>${h(revealText(line,responsibilities))}</p></div>`).join('');
    const reframes = (cinematic.reframes || []).map(x=>`<div class="cinema-reframe"><span>↳</span><p>${h(revealText(x,responsibilities))}</p></div>`).join('');

    const act0 = act('Votre verdict','ACTE I',`<p class="cinema-act-copy">Avant la vérité, voici ce que la cellule a verrouillé.</p><div class="cinema-verdict-list">${verdictRows(responsibilities)}</div>`,0,true);
    const act1 = act('Ce qui s’est réellement passé','ACTE II',`<p class="cinema-summary">${h(summary)}</p><div class="cinema-truth-list">${truthRows(responsibilities)}</div>`,1,stage>=1);
    const act2 = act('La chronologie réelle','ACTE III',`<div class="cinema-timeline">${timeline}</div>`,2,stage>=2);
    const act3 = act('Ce que chacun cachait','ACTE IV',`<div class="cinema-characters">${characterRows(cinematic,responsibilities)}</div>${reframes?`<div class="cinema-reframes"><div class="cinema-subtitle">CE QUE LES FAITS CHANGEAIENT DE SENS</div>${reframes}</div>`:''}`,3,stage>=3);
    const accuracy = p.accuracy ? `<div class="accuracy accuracy-clear cinema-accuracy"><span>Responsabilités évaluées exactement</span><b>${h(p.accuracy.exact)} sur ${h(p.accuracy.total)}</b></div>` : '';
    const act4 = act('Le basculement','ACTE V',`<div class="cinema-turn"><small>DERNIÈRE RECONTEXTUALISATION</small><p>${h(revealText(cinematic.turn||'',responsibilities))}</p></div><blockquote class="cinema-final-line">${h(revealText(cinematic.final_line||'',responsibilities))}</blockquote>${accuracy}${resultsHtml(p,cont)}${renderContinuationPanel()}<button class="btn block" onclick="leaveRoom()">Quitter la cellule</button>`,4,stage>=4);

    return `<div class="reveal-v11 cinematic-reveal"><div class="cinema-opening"><div class="kicker">RÉVÉLATION · DOSSIER ${h(STATE.sync?.room?.scenario_id||'')}</div><h2>La vérité ne tombe pas d’un bloc.</h2><p>Elle se reconstruit dans l’ordre des faits.</p></div>${act0}${act1}${act2}${act3}${act4}${nextControl(stage)}</div>`;
  };

  const style = document.createElement('style');
  style.textContent = `
.narrative-debrief-intro{display:grid;gap:4px;margin:0 0 14px;padding:11px 12px;border-left:2px solid rgba(255,255,255,.22);background:rgba(255,255,255,.018)}.narrative-debrief-intro b{font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.13em}.narrative-debrief-intro span{color:#818b94;font-size:10px;line-height:1.5}
.cinematic-reveal{display:grid;gap:15px}.cinema-opening{padding:6px 2px 15px;border-bottom:1px solid rgba(255,255,255,.075)}.cinema-opening h2{margin:7px 0 5px;font-size:25px;line-height:1.12}.cinema-opening p{margin:0;color:#7f8992;font-size:11px}
.cinema-act{position:relative;padding:18px;border:1px solid rgba(255,255,255,.085);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.008));box-shadow:0 14px 40px rgba(0,0,0,.16)}.cinema-act-kicker,.cinema-subtitle{color:#747f88;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.16em}.cinema-act h3{margin:7px 0 13px;font-size:20px}.cinema-act-copy,.cinema-summary{color:#aeb6bd;line-height:1.7;font-size:12px}.cinema-summary{font-size:13px;color:#d4d9dd}
.cinema-verdict-list,.cinema-truth-list{display:grid;gap:7px;margin-top:12px}.cinema-verdict-row,.cinema-truth-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:center;padding:11px 12px;border:1px solid rgba(255,255,255,.06);border-radius:10px;background:rgba(0,0,0,.14)}.cinema-verdict-row span,.cinema-truth-row span{font-weight:700;font-size:12px}.cinema-verdict-row b,.cinema-truth-row b{font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.04em}.cinema-truth-row small{grid-column:1/-1;color:#77828b;font-size:9px}
.cinema-timeline{display:grid;gap:0}.cinema-timeline-row{display:grid;grid-template-columns:34px 1fr;gap:9px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.055)}.cinema-timeline-row:last-child{border-bottom:0}.cinema-timeline-row>span{color:#626d76;font:700 10px 'IBM Plex Mono',monospace;padding-top:2px}.cinema-timeline-row p{margin:0;color:#d2d7db;font-size:12px;line-height:1.65}
.cinema-characters{display:grid;gap:10px}.cinema-character{padding:13px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(0,0,0,.12)}.cinema-character-head{display:grid;gap:3px;padding-bottom:10px;margin-bottom:9px;border-bottom:1px solid rgba(255,255,255,.05)}.cinema-character-head span{font-weight:800;font-size:13px}.cinema-character-head small{color:#747f88;font-size:9px;line-height:1.45}.cinema-character>div:not(.cinema-character-head){margin-top:9px}.cinema-character b{display:block;color:#7e8992;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em}.cinema-character p{margin:4px 0 0;color:#c2c8cd;font-size:10px;line-height:1.6}
.cinema-reframes{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)}.cinema-reframe{display:grid;grid-template-columns:18px 1fr;gap:5px;margin-top:9px}.cinema-reframe span{color:#6f7a83}.cinema-reframe p{margin:0;color:#b5bdc3;font-size:11px;line-height:1.6}
.cinema-turn{padding:15px;border-left:3px solid #d1d5d8;background:rgba(255,255,255,.028)}.cinema-turn small{color:#77828b;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.12em}.cinema-turn p{margin:7px 0 0;font-size:14px;line-height:1.65;color:#e1e4e6}.cinema-final-line{margin:16px 0;padding:18px 4px;border:0;color:#f1f2f3;font-size:18px;font-weight:700;line-height:1.45;text-align:center}.cinema-accuracy{margin-top:12px}
.cinema-next{margin-top:2px}.cinema-wait{padding:14px;text-align:center;border:1px solid rgba(255,255,255,.06);border-radius:12px}.cinema-wait span{font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.14em;color:#717b84}.cinema-wait p{margin:5px 0 0;color:#8a949c;font-size:10px}
@media(max-width:620px){.cinema-act{padding:15px}.cinema-opening h2{font-size:22px}.cinema-verdict-row,.cinema-truth-row{grid-template-columns:1fr}.cinema-verdict-row b,.cinema-truth-row b{justify-self:start}}
`;
  document.head.appendChild(style);
})();
