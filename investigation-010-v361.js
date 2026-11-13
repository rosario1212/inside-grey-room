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
      "Que faut-il confronter pour établir comment le local est devenu inaccessible ?",
      [
        "Les déclarations des proches suffisent à prouver la cause",
        "Les états du mécanisme, les commandes et leurs horaires doivent être recoupés",
        "Le porteur d’un badge est automatiquement responsable de tout le verrouillage"
      ]
    ],
    [
      "Une utilisation de badge permet-elle, à elle seule, d’identifier un geste précis ?",
      [
        "Oui, puisqu’un badge ne peut jamais être utilisé par quelqu’un d’autre",
        "Non, l’accès doit être confronté aux autres traces disponibles",
        "Oui, seulement si une personne est partie avant la ronde"
      ]
    ],
    [
      "Pourquoi vérifier également la sortie intérieure du local ?",
      [
        "Pour déterminer si Nora pouvait ouvrir elle-même",
        "Pour démontrer à elle seule une intention de séquestration",
        "Pour rendre inutiles les autres documents"
      ]
    ],
    [
      "Comment interpréter des coups étouffés sans origine localisée ?",
      [
        "Comme une preuve que le témoin connaissait la victime",
        "Comme un élément dénué de toute valeur",
        "Comme un signal à recouper avec le contexte et les informations reçues ensuite"
      ]
    ]
  ],
  "2": [
    [
      "Comment distinguer ce qui s’est passé avant et pendant l’ouverture de 13 h 54 ?",
      [
        "Il faut traiter les deux fermetures comme un seul acte",
        "Il faut confronter horaires, sources et acteurs pour chaque décision",
        "Il faut attribuer automatiquement la seconde fermeture au premier responsable du site"
      ]
    ],
    [
      "Quelle preuve permet de juger si une personne savait Nora présente et consciente ?",
      [
        "Son poste ou sa fonction suffisent",
        "Une perception directe, un message consulté ou des traces concordantes",
        "Le simple fait d’avoir entendu un bruit indéterminé"
      ]
    ],
    [
      "Pour qualifier l’absence de secours, que faut-il vérifier ?",
      [
        "Le moment de connaissance, la possibilité d’agir et les traces d’alerte",
        "Uniquement les rumeurs entre collègues",
        "Uniquement l’identité de la personne chargée du bâtiment"
      ]
    ],
    [
      "Deux fermetures du même local impliquent-elles nécessairement le même responsable ?",
      [
        "Oui, parce que le verrou est unique",
        "Impossible de les distinguer quelle que soit la qualité des preuves",
        "Non, il faut distinguer les décisions et les connaissances successives"
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
  <h3>Quels faits peux-tu soutenir ?</h3>
  <p>L’Enquêteur et l’Analyste répondent séparément. Les pistes facultatives du prochain cycle peuvent changer en fonction de vos lectures, mais aucune correction ni note de justesse n’apparaîtra. Une piste est sélectionnée indépendamment de vos réponses.</p>
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
