/* Inside Grey Room v12.12 — gameplay simplification
   Principle: the app manages time, roles and canonical facts; players manage the discussion.
   Removes the shared "discussion type / investigation focus" chooser and shortens live-game copy.
*/
(() => {
  const REV = 'v12.12-gameplay-simple-20260928-1';

  if (typeof renderInvestigationTab === 'function') {
    const baseRenderInvestigationTab = renderInvestigationTab;
    renderInvestigationTab = function(...args) {
      const html = String(baseRenderInvestigationTab.apply(this, args) || '');
      if (!html.includes('investigation-sheet')) return html;
      const template = document.createElement('template');
      template.innerHTML = html;
      template.content.querySelectorAll('.investigation-sheet').forEach(node => node.remove());
      return template.innerHTML;
    };
  }

  if (typeof phaseInstruction === 'function') {
    const basePhaseInstruction = phaseInstruction;
    phaseInstruction = function(role, ph, target) {
      const name = target?.pseudo ? h(target.pseudo) : 'la personne appelée';
      if (ph === 'role_reading') return `<p>Lis ta carte. Garde tes informations privées.</p>`;
      if (ph === 'initial_debrief') {
        return ['enqueteur','analyste'].includes(role)
          ? `<p>3 min · Échangez vos premières hypothèses.</p>`
          : `<p>Prépare ta version.</p>`;
      }
      if (ph === 'interrogation_select') {
        return role === 'enqueteur'
          ? `<p>Choisis la prochaine personne à interroger.</p>`
          : `<p>L’Enquêteur choisit le prochain interrogatoire.</p>`;
      }
      if (ph === 'interrogation') {
        if (target?.id === STATE?.sync?.player?.id) return `<p>8 min · Tu es interrogé maintenant.</p>`;
        if (role === 'enqueteur') return `<p>8 min · Interroge ${name}. Tu conduis librement l’échange.</p>`;
        if (role === 'analyste') return `<p>Observe. Note les contradictions et les changements de version.</p>`;
        if (['procureur','juge','inspecteur'].includes(role)) return `<p>Suis l’interrogatoire. Le flux apparaît ici s’il est activé.</p>`;
        return `<p>Interrogatoire en cours.</p>`;
      }
      if (ph === 'cycle_debrief') {
        return ['enqueteur','analyste'].includes(role)
          ? `<p>Réponds aux 2 questions rapides. Le MJ règle seulement la pression narrative.</p>`
          : `<p>Court débrief du camp d’enquête.</p>`;
      }
      if (ph === 'trame') {
        const e = typeof latestEvent === 'function' ? latestEvent('trame') : null;
        const card = e && typeof canInvestigationChannel === 'function' && canInvestigationChannel(role)
          ? `<div class="trame-focus"><b>${h(e.payload?.title || 'TRAME')}</b><span>${h(e.payload?.text || '')}</span></div>`
          : '';
        return `<p>Nouvel élément canonique. À vous de l’interpréter.</p>${card}`;
      }
      if (ph === 'reveal') return `<p>Verdict verrouillé. Ouvre maintenant la vérité du dossier.</p>`;
      return basePhaseInstruction.call(this, role, ph, target);
    };
  }

  if (typeof renderDebriefForm === 'function') {
    renderDebriefForm = function() {
      if (typeof myAction === 'function' && myAction('debrief')) return `<div class="locked-state">Débrief envoyé.</div>`;
      return `<div class="qcm-v11 narrative-debrief gameplay-simple-debrief">
        <div class="narrative-debrief-intro"><b>DÉBRIEF · 2 QUESTIONS</b><span>Le MJ ajuste le rythme, jamais votre piste.</span></div>
        <div class="field"><label for="qConvergence">Le groupe converge déjà ?</label><select id="qConvergence"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div>
        <div class="field"><label for="qConfusion">Le dossier reste difficile à relier ?</label><select id="qConfusion"><option value="0">Non</option><option value="1">Un peu</option><option value="2">Oui</option></select></div>
        <button class="btn primary block" onclick="submitDebrief()">Envoyer</button>
      </div>`;
    };
  }

  try {
    if (ROLE_INFO?.enqueteur) ROLE_INFO.enqueteur.body = 'Tu diriges les interrogatoires et portes la reconstruction factuelle finale.';
    if (ROLE_INFO?.analyste) ROLE_INFO.analyste.body = 'Tu observes les interrogatoires, notes les contradictions et aides l’Enquêteur à reconstruire les faits.';
  } catch (_) {}

  const style = document.createElement('style');
  style.dataset.igrGameplaySimple = REV;
  style.textContent = `
    .investigation-sheet,.investigation-focus-controls,.investigation-focus-current,.investigation-focus-readonly{display:none!important}
    .phase-explain{padding:14px 15px!important}
    .phase-explain h2{margin-bottom:7px!important}
    .phase-explain p{margin:0!important;max-width:62ch;line-height:1.48!important}
    .gameplay-simple-debrief .narrative-debrief-intro{margin-bottom:10px}
    .gameplay-simple-debrief .field{margin-bottom:9px}
    .gameplay-simple-debrief label{font-size:11px;line-height:1.35}
    @media(max-width:620px){.phase-explain{padding:12px 13px!important}.phase-explain h2{font-size:18px!important}}
  `;
  document.head.appendChild(style);
})();
