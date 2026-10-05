/* Inside Grey Room — OMERTÀ v12.39
   HQ posters · safer scenario detection · universal choice-status card · fuller red cell theme. */
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
  const THUMB = Object.freeze({
    '021':'assets/scenario-thumb-021-v53.webp?v=v53-thumbs',
    '022':'assets/scenario-thumb-022-v53.webp?v=v53-thumbs',
    '023':'assets/scenario-thumb-023-v53.webp?v=v53-thumbs',
    '024':'assets/scenario-thumb-024-v53.webp?v=v53-thumbs',
    '025':'assets/scenario-thumb-025-v53.webp?v=v53-thumbs'
  });
  const DRAW_MIN_MS = 620;
  const DRAW_RESULT_MS = 760;

  const ROLE_COPY = Object.freeze({
    enqueteur:{body:'Tu conduis les interrogatoires, décides certaines orientations de l’enquête et portes la reconstruction finale. Dans OMERTÀ, tu dois distinguer aveu sincère, peur et calcul.'},
    analyste:{body:'Tu repères les contradictions, les changements de version et les liens discrets entre les faits. Tu aides l’Enquêteur à remonter la chaîne des responsabilités.'},
    suspect:{body:'Tu protèges ta position selon ce que ton identité permet : nier, minimiser, négocier, ���q�^