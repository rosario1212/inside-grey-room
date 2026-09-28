/* Inside Grey Room — shared investigation sheet v12.10
   Gives the Investigator one neutral, public discussion focus per cycle.
   It never scores suspects, reveals hidden information, or steers adaptive trames.
*/
(() => {
  if (typeof renderInvestigationTab !== 'function') return;

  const OPTIONS = [
    { key: 'libre', label: 'Discussion libre', detail: 'Aucune ligne imposée. Le groupe suit la piste qu’il veut.' },
    { key: 'chronologie', label: 'Chronologie', detail: 'Ordre des faits, horaires et fenêtres de temps.' },
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
    const room = STATE?.sync?.room;
    const stored = room?.state?.investigation_focus;
    if (!room || !stored || Number(stored.cycle) !== Number(room.cycle)) return BY_KEY.get('libre');
    return BY_KEY.get(String(stored.key || '')) || BY_KEY.get('libre');
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
    const cycle = Number(d.room.cycle) || 1;
    const stored = d.room.state?.investigation_focus;
    const currentCycleSelection = stored && Number(stored.cycle) === cycle;

    return `<section class="investigation-sheet" aria-label="Fiche d’enquête commune">
      <div class="investigation-sheet-head">
        <div><div class="kicker">FICHE D’ENQUÊTE · COMMUNE</div><h3>Ligne directrice</h3></div>
        <span class="investigation-sheet-cycle">CYCLE ${h(cycle)}/3</span>
      </div>
      <div class="investigation-focus-current ${active.key === 'libre' ? 'free' : ''}">
        <small>LIGNE ACTUELLE</small>
        <strong>${h(active.label)}</strong>
        <p>${currentCycleSelection && active.key !== 'libre'
          ? 'Orientation déclarée par l’Enquêteur. Elle ne désigne ni une piste importante, ni un suspect, ni une conclusion.'
          : 'Aucune direction n’est imposée. La discussion reste entièrement libre.'}</p>
      </div>
      ${isInvestigator ? `<div class="investigation-focus-controls">
        <div class="investigation-focus-copy"><b>Choisir le sujet de discussion</b><span>Un seul sujet à la fois. Tu peux le changer à tout moment ou revenir à « Discussion libre ».</span></div>
        <div class="investigation-focus-grid">${renderFocusButtons(active.key)}</div>
      </div>` : `<div class="investigation-focus-readonly">L’Enquêteur peut changer cette ligne. Tous les rôles voient la même fiche.</div>`}
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
      toast(option.key === 'libre' ? 'Discussion libre.' : `Ligne d’enquête : ${option.label}.`);
    } catch (error) {
      console.error('investigation focus', error);
      toast('Impossible de modifier la ligne d’enquête.');
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
.investigation-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.investigation-sheet-head h3{margin:5px 0 0;font-size:20px}.investigation-sheet-cycle{padding:6px 8px;border:1px solid rgba(255,255,255,.08);border-radius:999px;color:#89939c;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.1em;white-space:nowrap}
.investigation-focus-current{margin-top:13px;padding:14px 15px;border-left:3px solid #c9d0d6;background:rgba(255,255,255,.025);border-radius:0 12px 12px 0}.investigation-focus-current.free{border-left-color:#59636d}.investigation-focus-current small{display:block;color:#717c86;font:700 8px 'IBM Plex Mono',monospace;letter-spacing:.12em}.investigation-focus-current strong{display:block;margin-top:5px;font-size:18px}.investigation-focus-current p{margin:7px 0 0;color:#909aa4;font-size:11px;line-height:1.55}
.investigation-focus-controls{margin-top:14px;padding-top:13px;border-top:1px solid rgba(255,255,255,.06)}.investigation-focus-copy{display:grid;gap:4px;margin-bottom:10px}.investigation-focus-copy b{font-size:12px}.investigation-focus-copy span,.investigation-focus-readonly{color:#77818b;font-size:10px;line-height:1.5}
.investigation-focus-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.investigation-focus-choice{appearance:none;text-align:left;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.014);color:#dfe4e8;cursor:pointer;touch-action:manipulation}.investigation-focus-choice b{display:block;font-size:11px}.investigation-focus-choice span{display:block;margin-top:4px;color:#737e88;font-size:9px;line-height:1.45}.investigation-focus-choice.active{border-color:#aab3bb;background:rgba(255,255,255,.055)}.investigation-focus-choice:disabled{opacity:.55;cursor:wait}.investigation-focus-choice:focus-visible{outline:none;box-shadow:0 0 0 2px rgba(240,241,242,.2)}
.investigation-focus-readonly{margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.055)}
@media(max-width:620px){.investigation-focus-grid{grid-template-columns:1fr}.investigation-sheet{padding:15px}}
`;
  document.head.appendChild(style);
})();
