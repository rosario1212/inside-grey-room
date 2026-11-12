/* Inside Grey Room 006 — private, sealed, evidence-sensitive debrief v284.
   Responses are never scored client-side; the server selects next-cycle optional leads.
   This integration wraps the existing debrief so narrative pressure remains independent. */
(() => {
  'use strict';
  if (typeof renderDebriefForm !== 'function' || typeof submitDebrief !== 'function') return;
  const previousRender = renderDebriefForm;
  const previousSubmit = submitDebrief;
  let submitting = false;

  const cause = {
    id: 'cause', title: 'Quelle hypothèse explique le mieux la dernière seconde ?',
    choices: [
      ['unsure', 'Impossible à établir pour le moment'],
      ['slip', 'Recul puis glissade, sans contact final établi'],
      ['hugo_push', 'Poussée de Hugo sur Noé'],
      ['eliott_jacket', 'Intervention d’Eliott sur la veste de Noé']
    ]
  };
  const questionnaires = {
    1: [
      {id:'photo',title:'Que démontre la photo prise à 15 h 42 ?',choices:[
        ['unsure','Je ne peux pas conclure'],['only_timestamp','Une présence commune à un instant précis'],['proves_peace','L’absence de conflit pendant toute la randonnée']]},
      {id:'call',title:'Que peut-on établir au sujet de l’alerte ?',choices:[
        ['unsure','Je ne peux pas conclure'],['fixed_1617','Un appel depuis le chalet à 16 h 17'],['no_call','Aucun secours n’a été contacté']]},
      {id:'statements',title:'Que prouvent les trois premières auditions ?',choices:[
        ['unsure','Je ne peux pas conclure'],['claims_not_proof','Ce qui a été déclaré, sans garantir que ce soit vrai'],['prove_accident','Que la chute a nécessairement été accidentelle']]},
      cause
    ],
    2: [
      {id:'challenge',title:'Quel constat retenir sur le défi photo ?',choices:[
        ['unsure','Je ne peux pas conclure'],['targeted_after_success','Les quatre l’ont accompli, puis Noé a subi une pression ciblée'],['voluntary_second','Noé a spontanément demandé un second défi']]},
      {id:'camera',title:'Quelle est la limite de la vidéo de Mathis ?',choices:[
        ['unsure','Je ne peux pas conclure'],['cuts_before_fall','Elle s’arrête avant le geste de la chute'],['films_fall','Elle montre le contact final avec Noé']]},
      {id:'mathis',title:'Que pouvait observer Mathis après l’altercation ?',choices:[
        ['unsure','Je ne peux pas conclure'],['partial_view','Sa vision du dernier geste était limitée'],['saw_final_contact','Il a observé sans obstacle le contact final']]},
      cause
    ]
  };
  const active = () => {
    const d = STATE?.sync || {};
    return d.room?.scenario_id === '006'
      && d.scenario?.investigation_006_detailed === true
      && d.room?.phase === 'cycle_debrief'
      && [1,2].includes(Number(d.room.cycle))
      && ['enqueteur','analyste'].includes(d.player?.public_role);
  };
  const alreadySubmitted = type => (STATE?.sync?.my_actions || []).some(a =>
    a.action_type === type && Number(a.cycle) === Number(STATE?.sync?.room?.cycle));

  const questionsHtml = cycle => `<section class="igr284-questionnaire" aria-label="Hypothèses provisoires scellées">
    <div class="igr284-header"><small>EXAMEN DES FAITS · CYCLE ${cycle}</small><h3>Ce que tu tiens pour établi</h3>
    <p>Décris ta propre lecture. L’enquêteur et l’analyste répondent séparément. Ces positions restent scellées et guident discrètement les pièces facultatives du prochain cycle. « Impossible à établir » est une réponse valide.</p></div>
    ${questionnaires[cycle].map((q,i) => `<div class="field">
      <label for="igr284_${q.id}">${i+1} · ${q.title}</label>
      <select id="igr284_${q.id}" data-igr284-answer="${q.id}">
        ${q.choices.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}
      </select>
    </div>`).join('')}
    <div class="igr284-note">Aucun score, indice de justesse ou verdict provisoire ne sera affiché.</div>
  </section>`;

  renderDebriefForm = function (...args) {
    const base = previousRender.apply(this,args);
    if (!active() || alreadySubmitted('debrief')) return base;
    const supplement = alreadySubmitted('006_detail_report')
      ? '<div class="locked-state">Tes réponses factuelles sont scellées.</div>'
      : questionsHtml(Number(STATE.sync.room.cycle));
    const button = '<button class="btn primary block" onclick="submitDebrief()">';
    return base.includes(button) ? base.replace(button,supplement+button) : base+supplement;
  };

  submitDebrief = async function (...args) {
    if (!active() || alreadySubmitted('006_detail_report')) return previousSubmit.apply(this,args);
    if (submitting) return;
    submitting = true;
    try {
      const cycle = Number(STATE.sync.room.cycle);
      const answers = {};
      for (const q of questionnaires[cycle]) {
        const element = document.getElementById('igr284_'+q.id);
        if (!element) throw new Error('Missing detail response '+q.id);
        answers[q.id] = element.value || 'unsure';
      }
      await rpc('igr_v284_006_submit_detail',{
        p_code: STATE.room,
        p_player_token: STATE.token,
        p_answers: answers
      });
      await previousSubmit.apply(this,args);
    } catch (error) {
      console.error('006 sealed debrief',error);
      if (typeof toast === 'function') toast('La lecture factuelle n’a pas été enregistrée. Réessaie.');
    } finally {
      submitting = false;
    }
  };

  const style = document.createElement('style');
  style.textContent = `
.igr284-questionnaire{margin:12px 0 17px;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(255,255,255,.025)}
.igr284-header small{color:#9da8b1;font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.12em}
.igr284-header h3{margin:7px 0;font-size:17px}
.igr284-header p{margin:0 0 14px;color:#a2aab2;font-size:11px;line-height:1.6}
.igr284-questionnaire .field{margin-top:11px}
.igr284-questionnaire label{display:block;font-size:12px;margin-bottom:6px}
.igr284-questionnaire select{width:100%;min-height:43px}
.igr284-note{margin-top:12px;color:#7e8892;font-size:10px;line-height:1.5}
`;
  document.head.appendChild(style);
})();