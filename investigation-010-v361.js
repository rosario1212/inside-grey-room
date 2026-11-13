/* IGR v361 — Le Local: sealed, player-specific hypothesis survey.
   No canonical answers, hidden variant, verdict, or correctness signal belongs in this asset.
   The server ranks two optional leads using only room-pinned private documents. */
(()=>{
 'use strict';
 if(typeof renderDebriefForm!=='function'||typeof submitDebrief!=='function')return;
 const priorRender=renderDebriefForm,priorSubmit=submitDebrief;
 let busy=false;
 const Q={
  "1": [
    [
      "Selon les premières pièces, quel enchaînement décrit le mieux la fermeture vers 12 h 18 ?",
      [
        "Une porte rabattue à l'issue d'un essai extérieur, malgré une poignée intérieure signalée défectueuse",
        "Une anomalie de registres d'accès suivie d'un conflit, puis d'une fermeture physique",
        "Une fermeture physique suivie d'une restriction exceptionnelle des droits de badges"
      ]
    ],
    [
      "Quel dossier d'accès permet le mieux d'attribuer les premières interventions ?",
      [
        "La fiche d'essai de la porte et les présences de l'équipe technique",
        "L'historique de la console et les modifications de droits des badges",
        "Le journal électronique des entrées et le cahier papier des visiteurs"
      ]
    ],
    [
      "Quel élément matériel empêchait Nora de sortir après la fermeture ?",
      [
        "Un logiciel qui neutralisait une poignée intérieure en bon état",
        "Une béquille intérieure qui ne rétractait plus le pêne mécanique",
        "Un pêne qui se bloquait spontanément alors que le vantail restait ouvert"
      ]
    ],
    [
      "Quelle personne ou trace complémentaire les premiers éléments invitent-ils à confronter ?",
      [
        "La personne ayant modifié une note d'occupation lors de la restriction d'accès",
        "Le prestataire dont l'entrée ne correspond pas au cahier des visiteurs",
        "L'auteur du contrôle d'ouverture intérieure pourtant déclaré conforme"
      ]
    ]
  ],
  "2": [
    [
      "Quel enchaînement des faits recoupe le mieux le second cycle d'investigation ?",
      [
        "Fermeture du vantail, restriction des badges, puis ouverture d'astreinte et communication interne",
        "Contrôle extérieur de la porte, demande de vérification consultée, puis passage d'astreinte",
        "Anomalie d'accès la veille, fermeture de la réserve, puis nouvelle ouverture hors mission"
      ]
    ],
    [
      "Quelle information attribuable à un acteur doit être confrontée en priorité ?",
      [
        "Une consigne de maintien donnée pendant une communication à 13 h 54",
        "Le passage sans mission d'un agent d'astreinte près de la réserve",
        "La consultation à 13 h 37 d'un message demandant de vérifier la présence de Nora"
      ]
    ],
    [
      "Quelle trace fait douter qu'une aide réelle avait été organisée ?",
      [
        "Un brouillon de libération jamais transmis et une tournée sans vérification de la réserve",
        "Une équipe de sécurité annoncée, mais sans confirmation indépendante de son intervention",
        "Un message de vérification ouvert, sans signalement transmis à la sécurité"
      ]
    ],
    [
      "Quelle hypothèse sur la fermeture de 13 h 54 reste compatible avec les preuves de ce cycle ?",
      [
        "Le rappel mécanique du vantail peut expliquer la fermeture, sans justifier le silence ensuite",
        "Une consigne hiérarchique peut expliquer la fermeture, sans interdire matériellement d'appeler la sécurité",
        "Une fermeture effectuée hors mission par un autre intervenant, sans ordre établi à ce stade"
      ]
    ]
  ]
};
 const active=()=>{
  const d=STATE?.sync||{},c=Number(d.room?.cycle);
  return d.room?.scenario_id==='010'&&d.scenario?.investigation_010_detailed===true
   &&d.room?.phase==='cycle_debrief'&&[1,2].includes(c)
   &&['enqueteur','analyste'].includes(d.player?.public_role);
 };
 const hasReport=type=>(STATE?.sync?.my_actions||[]).some(a=>a.action_type===type
   &&Number(a.cycle)===Number(STATE?.sync?.room?.cycle));
 const sheet=()=>`<section class="igr310-sheet">
  <small>LE LOCAL · HYPOTHÈSES SCELLÉES</small>
  <h3>Que révèlent les faits du dossier ?</h3>
  <p>L’Enquêteur et l’Analyste confrontent séparément leurs hypothèses aux preuves déjà disponibles. Les pistes du prochain cycle peuvent aider sur les faits mal interprétés ou encore incertains. Aucune solution ni note de justesse n’est dévoilée pendant la partie ; l’une des pistes reste indépendante de vos réponses.</p>
  ${Q[Number(STATE.sync.room.cycle)].map((q,i)=>`<div class="field">
   <label for="igr310_010_q${i+1}">${i+1} · ${q[0]}</label>
   <select id="igr310_010_q${i+1}">
    <option value="u">Impossible à établir actuellement</option>
    ${q[1].map((x,j)=>`<option value="${'abc'[j]}">${x}</option>`).join('')}
   </select></div>`).join('')}
  <p class="igr310-disclaimer">Ces réponses sont individuelles, scellées et non modifiables.</p>
 </section>`;
 renderDebriefForm=function(...args){
  const base=priorRender.apply(this,args);
  if(!active()||hasReport('debrief'))return base;
  const block=hasReport('v361_010_detail_report')
   ?'<div class="locked-state">Tes hypothèses sur Nora ont été scellées.</div>':sheet();
  const button='<button class="btn primary block" onclick="submitDebrief()">';
  return base.includes(button)?base.replace(button,block+button):base+block;
 };
 submitDebrief=async function(...args){
  if(!active()||hasReport('v361_010_detail_report'))return priorSubmit.apply(this,args);
  if(busy)return;
  busy=true;
  try{
   const answers={};
   for(let n=1;n<=4;n++){
    const input=document.getElementById('igr310_010_q'+n);
    if(!input)throw Error('Missing 010 sealed answer');
    answers['q'+n]=input.value||'u';
   }
   await rpc('igr_v361_010_submit_detail',
    {p_code:STATE.room,p_player_token:STATE.token,p_answers:answers});
   return await priorSubmit.apply(this,args);
  }catch(err){
   console.error('Le Local detailed hypothesis',err);
   if(typeof toast==='function')toast('Le questionnaire scellé n’a pas été enregistré. Réessaie.');
  }finally{busy=false;}
 };
 const css=document.createElement('style');
 css.textContent=`
.igr310-sheet{margin:12px 0 17px;padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(255,255,255,.025)}
.igr310-sheet>small{color:#9ba7b1;font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.09em}
.igr310-sheet h3{margin:7px 0;font-size:17px}
.igr310-sheet p{color:#aab2ba;font-size:11px;line-height:1.6;margin:6px 0 12px}
.igr310-sheet label{display:block;margin-bottom:6px;font-size:12px}
.igr310-sheet .field{margin-top:13px}
.igr310-sheet select{width:100%;min-height:44px}
.igr310-sheet .igr310-disclaimer{font-size:10px;color:#7d8790;margin-top:12px}
 `;
 document.head.appendChild(css);
})();
