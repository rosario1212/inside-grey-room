/* IGR v310 — Sous serment: sealed, player-specific hypothesis survey.
   No canonical answers, hidden variant, verdict, or correctness signal belongs in this asset.
   The server ranks two optional leads using only room-pinned private documents. */
(()=>{
 'use strict';
 if(typeof renderDebriefForm!=='function'||typeof submitDebrief!=='function')return;
 const priorRender=renderDebriefForm,priorSubmit=submitDebrief;
 let busy=false;
 const Q={
  1:[
   ['Que prouve, à elle seule, une contradiction d’horaire ?',[
    'Que la personne a manipulé D-14',
    'Qu’une déposition doit être contrôlée par des sources indépendantes',
    'Que le dossier a été volé']],
   ['Que donne normalement un journal technique d’accès ?',[
    'Une trace à recouper, pas le geste exact ni l’intention',
    'La preuve de l’intention du porteur du badge',
    'Un récit infaillible sans vérifier l’horloge']],
   ['Quel est l’intérêt du dossier original D-14 ?',[
    'Contrôler le fait matériel avant d’attribuer la responsabilité',
    'Déclarer tous les témoins menteurs',
    'Ignorer les preuves non matérielles']],
   ['Un mensonge invalide-t-il automatiquement les observations exactes du même témoin ?',[
    'Oui, toutes ses observations deviennent fausses',
    'Non, chaque observation doit être recoupée',
    'Oui, s’il cache une relation privée']]
  ],
  2:[
   ['Comment reconstruire la chronologie de D-14 malgré des déclarations contradictoires ?',[
    'Retenir l’horaire répété par le plus grand nombre de témoins',
    'Comparer les registres, les accès et les contrôles indépendants avant de qualifier l’incident',
    'Conserver l’horaire de la personne qui reconnaît une faute secondaire']],
   ['Quelle distinction est indispensable avant d’attribuer la responsabilité principale ?',[
    'Traiter toute déclaration inexacte comme une preuve de manipulation du dossier',
    'Distinguer les actes matériellement établis, les défauts de contrôle et les pressions sur les dépositions',
    'Attribuer le fait principal au témoin qui possède le plus de secrets']],
   ['Un badge enregistré identifie-t-il à lui seul un geste précis ?',[
    'Non, il localise un accès à recouper',
    'Oui, il prouve la manipulation des scellés',
    'Oui, si un témoin a menti sur son arrivée']],
   ['Qu’établissent avant tout les consignes du préparateur ?',[
    'Qu’il a nécessairement déplacé D-14',
    'Qu’il a tenté d’orienter une déposition',
    'Que toutes les déclarations sont exactes']]
  ]
 };
 const active=()=>{
  const d=STATE?.sync||{},c=Number(d.room?.cycle);
  return d.room?.scenario_id==='008'&&d.scenario?.investigation_008_detailed===true
   &&d.room?.phase==='cycle_debrief'&&[1,2].includes(c)
   &&['enqueteur','analyste'].includes(d.player?.public_role);
 };
 const hasReport=type=>(STATE?.sync?.my_actions||[]).some(a=>a.action_type===type
   &&Number(a.cycle)===Number(STATE?.sync?.room?.cycle));
 const sheet=()=>`<section class="igr310-sheet">
  <small>SOUS SERMENT · HYPOTHÈSES SCELLÉES</small>
  <h3>Quels faits peux-tu soutenir ?</h3>
  <p>L’Enquêteur et l’Analyste répondent séparément. Les pistes facultatives du prochain cycle peuvent changer en fonction de vos lectures, mais aucune correction ni note de justesse n’apparaîtra. Une piste est sélectionnée indépendamment de vos réponses.</p>
  ${Q[Number(STATE.sync.room.cycle)].map((q,i)=>`<div class="field">
   <label for="igr310_008_q${i+1}">${i+1} · ${q[0]}</label>
   <select id="igr310_008_q${i+1}">
    <option value="u">Impossible à établir actuellement</option>
    ${q[1].map((x,j)=>`<option value="${'abc'[j]}">${x}</option>`).join('')}
   </select></div>`).join('')}
  <p class="igr310-disclaimer">Ces réponses sont individuelles, scellées et non modifiables.</p>
 </section>`;
 renderDebriefForm=function(...args){
  const base=priorRender.apply(this,args);
  if(!active()||hasReport('debrief'))return base;
  const block=hasReport('v310_008_detail_report')
   ?'<div class="locked-state">Ta lecture de D-14 a été scellée.</div>':sheet();
  const button='<button class="btn primary block" onclick="submitDebrief()">';
  return base.includes(button)?base.replace(button,block+button):base+block;
 };
 submitDebrief=async function(...args){
  if(!active()||hasReport('v310_008_detail_report'))return priorSubmit.apply(this,args);
  if(busy)return;
  busy=true;
  try{
   const answers={};
   for(let n=1;n<=4;n++){
    const input=document.getElementById('igr310_008_q'+n);
    if(!input)throw Error('Missing 008 sealed answer');
    answers['q'+n]=input.value||'u';
   }
   await rpc('igr_v310_008_submit_detail',
    {p_code:STATE.room,p_player_token:STATE.token,p_answers:answers});
   return await priorSubmit.apply(this,args);
  }catch(err){
   console.error('Sous serment detailed hypothesis',err);
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
