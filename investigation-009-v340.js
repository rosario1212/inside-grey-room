/* IGR v340 — Le Sujet 17: sealed, player-specific hypothesis survey.
   No canonical answers, hidden variant, verdict, or correctness signal belongs in this asset.
   The server ranks two optional leads using only room-pinned private documents. */
(()=>{
 'use strict';
 if(typeof renderDebriefForm!=='function'||typeof submitDebrief!=='function')return;
 const priorRender=renderDebriefForm,priorSubmit=submitDebrief;
 let busy=false;
 const Q={
  1:[
   ['Que signifie un retrait de consentement clairement exprimé ?',[
    'Un accord tacite pour prolonger l’étude',
    'Un arrêt de la participation, sans exiger de justification',
    'Une pause que la hiérarchie peut annuler']],
   ['Que permet de constater un accusé de réception technique ?',[
    'La réception d’un message, pas l’intention de son lecteur',
    'La pleine adhésion du destinataire',
    'La vérité médicale du contenu']],
   ['Quelle preuve doit être recherchée avant d’attribuer une décision ?',[
    'Une impression sur le caractère du médecin',
    'Une signature ou instruction avec une chronologie vérifiable',
    'Le seul récit fait après la chute']],
   ['Les souvenirs après la chute permettent-ils de dater à eux seuls les décisions précédentes ?',[
    'Oui, ils remplacent les journaux',
    'Non, ils doivent être confrontés aux archives antérieures',
    'Oui, si la personne paraît sincère']]
  ],
  2:[
   ['Quelle conclusion est réellement appuyée par les pièces à ce stade ?',[
    'ORPHÉE a continué après le retrait ; il reste à attribuer précisément les validations',
    'Le retrait n’a d’effet que si le médecin s’en souvient après la chute',
    'L’ouverture d’une porte de service identifie l’auteur de la décision de poursuite']],
   ['Comment distinguer une directive institutionnelle et son exécution clinique ?',[
    'Elles peuvent engager des responsabilités distinctes selon les décisions et actes établis',
    'Seule la personne qui transmet la directive peut être responsable',
    'Une amnésie postérieure supprime automatiquement toute responsabilité clinique']],
   ['Une démarche d’aide non autorisée prouve-t-elle la poursuite du protocole ?',[
    'Non, l’accès irrégulier et la décision de poursuivre sont distincts',
    'Oui, toute irrégularité désigne le responsable',
    'Oui, si le témoin n’a pas gardé une copie']],
   ['Que démontre la concordance de plusieurs observations cliniques après l’accident ?',[
    'Le contenu exact de décisions devenues oubliées',
    'La crédibilité du trouble, pas l’annulation des actes antérieurs',
    'Une preuve de simulation volontaire']]
  ]
 };
 const active=()=>{
  const d=STATE?.sync||{},c=Number(d.room?.cycle);
  return d.room?.scenario_id==='009'&&d.scenario?.investigation_009_detailed===true
   &&d.room?.phase==='cycle_debrief'&&[1,2].includes(c)
   &&['enqueteur','analyste'].includes(d.player?.public_role);
 };
 const hasReport=type=>(STATE?.sync?.my_actions||[]).some(a=>a.action_type===type
   &&Number(a.cycle)===Number(STATE?.sync?.room?.cycle));
 const sheet=()=>`<section class="igr310-sheet">
  <small>LE SUJET 17 · HYPOTHÈSES SCELLÉES</small>
  <h3>Que permettent réellement d'affirmer les pièces ?</h3>
  <p>L’Enquêteur et l’Analyste répondent séparément. Vos lectures du consentement, des ordres et du trouble de mémoire orientent les vérifications du cycle suivant sans jamais montrer de score ni de correction. Une piste est sélectionnée indépendamment de vos réponses.</p>
  ${Q[Number(STATE.sync.room.cycle)].map((q,i)=>`<div class="field">
   <label for="igr310_009_q${i+1}">${i+1} · ${q[0]}</label>
   <select id="igr310_009_q${i+1}">
    <option value="u">Impossible à établir actuellement</option>
    ${q[1].map((x,j)=>`<option value="${'abc'[j]}">${x}</option>`).join('')}
   </select></div>`).join('')}
  <p class="igr310-disclaimer">Ces réponses individuelles restent scellées et ne peuvent pas être corrigées après envoi.</p>
 </section>`;
 renderDebriefForm=function(...args){
  const base=priorRender.apply(this,args);
  if(!active()||hasReport('debrief'))return base;
  const block=hasReport('v340_009_detail_report')
   ?'<div class="locked-state">Ta lecture de D-14 a été scellée.</div>':sheet();
  const button='<button class="btn primary block" onclick="submitDebrief()">';
  return base.includes(button)?base.replace(button,block+button):base+block;
 };
 submitDebrief=async function(...args){
  if(!active()||hasReport('v340_009_detail_report'))return priorSubmit.apply(this,args);
  if(busy)return;
  busy=true;
  try{
   const answers={};
   for(let n=1;n<=4;n++){
    const input=document.getElementById('igr310_009_q'+n);
    if(!input)throw Error('Missing 009 sealed answer');
    answers['q'+n]=input.value||'u';
   }
   await rpc('igr_v340_009_submit_detail',
    {p_code:STATE.room,p_player_token:STATE.token,p_answers:answers});
   return await priorSubmit.apply(this,args);
  }catch(err){
   console.error('Le Sujet 17 detailed hypothesis',err);
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
