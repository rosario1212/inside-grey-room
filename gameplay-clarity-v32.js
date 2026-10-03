/* Inside Grey Room — gameplay clarity v32
   - Makes OMERTÀ irreversible actions explicit instead of using a generic CTA.
   - Moves personal notes out of the private card into a dedicated tab for every scenario.
   - Keeps notes local to the device/session policy already enforced by index.html.
*/
(() => {
  'use strict';

  const OMERTA_IDS = new Set(['021', '022', '023', '024', '025']);
  const LEGACY_NOTE_PREFIX = 'igr_v11_note_';
  const NOTE_PREFIX = 'igr_v11_notes_';

  const locale = () => (window.IGR_LOCALE === 'en' ? 'en' : 'fr');
  const copy = (fr, en) => (locale() === 'en' ? en : fr);

  function currentScenarioId() {
    return String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || STATE?.selectedScenario || '');
  }

  function isOmerta() {
    return OMERTA_IDS.has(currentScenarioId());
  }

  function currentOmertaRole() {
    const player = STATE?.sync?.player || {};
    const privateState = player.private_state || {};
    return String(privateState.omerta_preferred_role || player.secret_role || player.public_role || STATE?.role || '');
  }

  function decisionCtaLabel() {
    const role = currentOmertaRole();
    if (role === 'enqueteur') {
      return copy('Gérer une protection', 'Manage protection');
    }
    if (['caporegime', 'consigliere', 'sottocapo', 'don'].includes(role)) {
      return copy('Ouvrir les actions Famiglia', 'Open Famiglia actions');
    }
    return copy('Révéler / demander une protection', 'Reveal / request protection');
  }

  function decisionDockHtml() {
    return `<div class="omerta-decision-dock omerta-decision-dock-v32">
      <div class="omerta-decision-copy-v32">
        <span class="omerta-decision-kicker-v32">${copy('DÉCISIONS OMERTÀ', 'OMERTÀ DECISIONS')}</span>
        <strong>${copy('Discute d’abord hors écran.', 'Talk first, away from the screen.')}</strong>
        <p>${copy(
          'Pose le téléphone pendant l’échange. Reviens ici seulement pour enregistrer une conséquence qui compte réellement dans la partie.',
          'Put the phone down during the discussion. Return here only to record a consequence that actually matters in the game.'
        )}</p>
      </div>
      <button class="btn primary small omerta-decision-cta-v32" type="button" onclick="igrOmertaOpenDecision()">${h(decisionCtaLabel())}</button>
    </div>`;
  }

  if (typeof privateCardHtml === 'function') {
    const basePrivateCardHtml = privateCardHtml;
    privateCardHtml = function () {
      const html = basePrivateCardHtml.apply(this, arguments);
      if (!isOmerta() || typeof html !== 'string') return html;
      const marker = '<div class="omerta-decision-dock">';
      const start = html.lastIndexOf(marker);
      if (start < 0) return html;
      return html.slice(0, start) + decisionDockHtml();
    };
  }

  function noteKey() {
    return `${NOTE_PREFIX}${STATE?.room || 'local'}_${STATE?.playerId || 'player'}`;
  }

  function legacyNoteKey() {
    return `${LEGACY_NOTE_PREFIX}${STATE?.room || 'local'}_${STATE?.playerId || 'player'}`;
  }

  function readPrivateNotes() {
    const key = noteKey();
    let value = STORAGE.getItem(key);
    if (value !== null && value !== undefined) return String(value);
    const legacy = STORAGE.getItem(legacyNoteKey());
    if (legacy !== null && legacy !== undefined && String(legacy).length) {
      STORAGE.setItem(key, String(legacy));
      STORAGE.removeItem(legacyNoteKey());
      return String(legacy);
    }
    return '';
  }

  function notesStatus(text) {
    const el = document.getElementById('privateNotesStatusV32');
    if (el) el.textContent = text;
  }

  window.igrSavePrivateNotesV32 = function (textarea) {
    STORAGE.setItem(noteKey(), textarea?.value || '');
    notesStatus(copy('Sauvegardé automatiquement', 'Saved automatically'));
  };

  window.igrClearPrivateNotesV32 = async function () {
    let ok = false;
    const title = copy('Effacer les notes ?', 'Clear notes?');
    const text = copy(
      'Toutes tes notes personnelles pour cette partie seront supprimées de cet appareil.',
      'All your personal notes for this game will be removed from this device.'
    );
    try {
      if (typeof appConfirm === 'function') {
        ok = await appConfirm({ title, text, confirmLabel: copy('Effacer', 'Clear'), danger: true });
      } else {
        ok = window.confirm(text);
      }
    } catch (_) {
      ok = window.confirm(text);
    }
    if (!ok) return;
    STORAGE.removeItem(noteKey());
    STORAGE.removeItem(legacyNoteKey());
    const textarea = document.getElementById('privateNotesV32');
    if (textarea) textarea.value = '';
    notesStatus(copy('Notes effacées', 'Notes cleared'));
    if (typeof toast === 'function') toast(copy('Notes personnelles effacées.', 'Personal notes cleared.'));
  };

  window.renderNotesTabV32 = function () {
    const note = readPrivateNotes();
    return `<div class="private-notes notes-tab-v32">
      <div class="section-title notes-title-v32">
        <div>
          <span class="notes-kicker-v32">${copy('OUTIL PERSONNEL', 'PERSONAL TOOL')}</span>
          <h2>${copy('Notes personnelles', 'Personal notes')}</h2>
        </div>
        <span class="notes-privacy-v32">${copy('Privées · cet appareil', 'Private · this device')}</span>
      </div>
      <p class="notes-help-v32">${copy(
        'Note ici les horaires, contradictions, hypothèses et points à vérifier. Ces notes ne modifient jamais le dossier et ne sont envoyées à aucun autre joueur.',
        'Write down timelines, contradictions, hypotheses and points to verify. These notes never change the case and are not sent to any other player.'
      )}</p>
      <textarea id="privateNotesV32" maxlength="5000" oninput="igrSavePrivateNotesV32(this)" placeholder="${h(copy(
        'Horaires, contradictions, hypothèses, questions à poser…',
        'Timelines, contradictions, hypotheses, questions to ask…'
      ))}">${h(note)}</textarea>
      <div class="notes-actions-v32">
        <small id="privateNotesStatusV32">${copy('Sauvegarde automatique', 'Autosave')}</small>
        <button class="btn ghost small" type="button" onclick="igrClearPrivateNotesV32()">${copy('Effacer', 'Clear')}</button>
      </div>
    </div>`;
  };

  if (typeof renderCardTab === 'function') {
    renderCardTab = function () { return privateCardHtml(); };
  }

  if (typeof gameTabs === 'function') {
    const baseGameTabs = gameTabs;
    gameTabs = function () {
      const tabs = baseGameTabs.apply(this, arguments) || [];
      if (tabs.some(tab => tab?.id === 'notes')) return tabs;
      const notesTab = { id: 'notes', label: copy('Notes', 'Notes') };
      const channelIndex = tabs.findIndex(tab => tab?.id === 'channel');
      const investigationIndex = tabs.findIndex(tab => tab?.id === 'investigation');
      const insertAfter = channelIndex >= 0 ? channelIndex : investigationIndex;
      const next = [...tabs];
      if (insertAfter >= 0) next.splice(insertAfter + 1, 0, notesTab);
      else next.splice(Math.min(1, next.length), 0, notesTab);
      return next;
    };
  }

  if (typeof renderGameTab === 'function') {
    const baseRenderGameTab = renderGameTab;
    renderGameTab = function () {
      if (STATE?.tab === 'notes') return window.renderNotesTabV32();
      return baseRenderGameTab.apply(this, arguments);
    };
  }
})();

/* v34 directed-cycle compatibility: authoritative timings and defense identity. */
(() => {
  'use strict';
  const directed = () => Array.isArray(window.IGR_V13_FLOW?.coreScenarioIds) && window.IGR_V13_FLOW.coreScenarioIds.includes(String(STATE?.sync?.room?.scenario_id || STATE?.scenarioId || ''));
  const defender = () => {
    const st = STATE?.sync?.room?.state || {};
    const q = Array.isArray(st.defense_queue) ? st.defense_queue : [];
    const item = q[Number(st.defense_index || 0)] || null;
    return { id: st.defense_current_id || item?.id || '', pseudo: st.defense_current_pseudo || item?.pseudo || '' };
  };
  const defenseBanner = () => {
    const d = defender();
    if (!d.pseudo) return '';
    return `<div class="speaker-card active"><small>À LA PAROLE · DERNIÈRE DÉFENSE</small><strong>${h(d.pseudo)}</strong><span>03:00 · l’Avocat éventuel partage ce temps.</span></div>`;
  };

  if (typeof phaseInstruction === 'function') {
    const basePhaseInstruction = phaseInstruction;
    phaseInstruction = function (role, ph, target) {
      if (!directed()) return basePhaseInstruction.apply(this, arguments);
      if (ph === 'initial_debrief') return ['enqueteur','analyste'].includes(role)
        ? '<p><b>DÉBRIEF INITIAL · 02:00.</b> Posez seulement les bases : chronologie, inconnues et première stratégie.</p>'
        : '<p>Prépare ta stratégie. Le débrief initial dure 02:00 et se déroule sans toi.</p>';
      if (ph === 'interrogation') {
        if (role === 'enqueteur') return '<p>Conduis l’interrogatoire. <b>06:00 signifie 06:00.</b> Le chrono est commun.</p>';
        if (role === 'analyste') return '<p>Gère le rythme et note les contradictions pendant les 06:00.</p>';
      }
      if (ph === 'cycle_debrief') return ['enqueteur','analyste'].includes(role)
        ? '<p><b>DÉBRIEF · 02:00.</b> Répondez séparément. Le chrono ne se raccourcit pas après l’envoi.</p>'
        : '<p>Le noyau d’enquête dispose de 02:00 avant la suite.</p>';
      if (ph === 'event_confrontation') return '<p><b>CONFRONTATION · 04:00.</b> Deux versions sont mises face à face. Aucun écran ne remplace l’échange.</p>';
      if (ph === 'event_assembly') return '<p><b>ASSEMBLÉE · 04:00.</b> Les participants admis mettent en commun ce qui sert la décision.</p>';
      if (ph === 'event_analysis') return '<p><b>ANALYSE DU DOSSIER · 04:00.</b> Le noyau d’enquête choisit ce qu’il veut relier avant de poursuivre.</p>';
      if (ph === 'event_signature') return '<p><b>ACTION SIGNATURE · 04:00.</b> Utilise la mécanique propre à ce DLC ; ce choix consomme une action du cycle.</p>';
      if (ph === 'defense') {
        const d = defender();
        return d.pseudo
          ? `<p><b>À LA PAROLE : ${h(d.pseudo)}.</b> Dernière défense : 03:00. L’Avocat éventuel partage ce temps.</p>`
          : '<p>Dernières défenses · 03:00 par personne accusée.</p>';
      }
      if (ph === 'final_debrief') return ['enqueteur','analyste','procureur'].includes(role)
        ? '<p><b>DERNIER DÉBRIEF · 02:00.</b> Aucun fait nouveau ne peut entrer dans le dossier.</p>'
        : '<p>Le dernier débrief dure 02:00 et se déroule sans toi.</p>';
      return basePhaseInstruction.apply(this, arguments);
    };
    window.phaseInstruction = phaseInstruction;
  }

  if (typeof renderInterrogationSelect === 'function') {
    const baseRenderInterrogationSelect = renderInterrogationSelect;
    renderInterrogationSelect = function () {
      const html = baseRenderInterrogationSelect.apply(this, arguments);
      return directed() && typeof html === 'string' ? html.replaceAll('8 min','6 min').replaceAll('08:00','06:00') : html;
    };
    window.renderInterrogationSelect = renderInterrogationSelect;
  }

  if (typeof renderInvestigationTab === 'function') {
    const baseRenderInvestigationTab = renderInvestigationTab;
    renderInvestigationTab = function () {
      let html = baseRenderInvestigationTab.apply(this, arguments);
      if (!directed() || typeof html !== 'string') return html;
      html = html.replaceAll('Convoquer · 8 min','Convoquer · 6 min')
        .replaceAll('Convoquer les deux joueurs · 3 min','Convoquer les deux joueurs · 4 min')
        .replaceAll('Ouvrir l’Assemblée · 3 min','Ouvrir l’Assemblée · 4 min')
        .replaceAll('08:00','06:00')
        .replaceAll('Trois minutes','Quatre minutes')
        .replaceAll('3 minutes','4 minutes');
      return html;
    };
    window.renderInvestigationTab = renderInvestigationTab;
  }

  if (typeof renderGameTab === 'function') {
    const baseDirectedRenderGameTab = renderGameTab;
    renderGameTab = function () {
      const html = baseDirectedRenderGameTab.apply(this, arguments);
      if (!directed() || STATE?.sync?.room?.phase !== 'defense' || typeof html !== 'string') return html;
      const banner = defenseBanner();
      return banner && !html.includes('À LA PAROLE · DERNIÈRE DÉFENSE') ? banner + html : html;
    };
    window.renderGameTab = renderGameTab;
  }
})();
