/* IGR 007 v289 — sealed investigator/analyst reading of the Testament Gris.
   This browser module contains no variant, answer key, truth, score or steering logic.
   The server selects one targeted and one independent optional trame. */
(() => {
 'use strict';
 if(typeof renderDebriefForm!=='function'||typeof submitDebrief!=='function')return;
 const previousRender=renderDebriefForm,previousSubmit=submitDebrief;
 let pending=false;
 const Q={
  1:[
   ['Que prouve une signature authentifiée ?',[
    'Que le défunt avait librement consenti',
    'Que la signature est réelle, pas que le consentement était libre',
    'Que le signataire a provoqué la chute']],
   ['Qui les premières traces situent-elles hors de la dernière rencontre ?',[
    'Le bénéficiaire du projet','Le gardien des documents','Le proche endetté']],
   ['Que suggèrent les premiers dossiers retrouvés ?',[
    'Un seul conflit, celui du testament',
    'Des conflits distincts dont les mobiles peuvent se recouper',
    'Aucun conflit entre les proches']],
   ['Un intérêt financier suffit-il à attribuer le geste mortel ?',[
    'Oui, toujours','Non, il faut des preuves sur la confrontation',
    'Seulement si la signature est authentique']]
  ],
  2:[
   ['Qui les pièces rapprochent-elles du dernier affrontement ?',[
    'Le bénéficiaire (S1)','Le gardien (S2)','Le proche endetté (S3)']],
   ['Quel document est au cœur de la dernière confrontation ?',[
    'Le testament signé','Une autre pièce familiale (lettre ou filiation)','Le dossier d’une dette']],
   ['Que permettent les passages et traces matérielles ?',[
    'De décrire une présence et des contacts sans lire l’intention',
    'De connaître automatiquement le projet homicide',
    'D’ignorer tous les autres témoignages']],
   ['Une dissimulation postérieure suffit-elle à prouver un homicide ?',[
    'Oui, la dissimulation remplace la preuve du geste',
    'Non, la nature et l’heure de chaque acte doivent être distinctes',
    'Oui, si plusieurs proches ont menti']]
  ]
 };
 const active=()=>{
  const d=STATE?.sync||{},c=Number(d.room?.cycle);
  return d.room?.scenario_id==='007'&&d.scenario?.investigation_007_detailed===true
   &&d.room?.phase==='cycle_debrief'&&[1,2].includes(c)
   &&['enqueteur','analyste'].includes(d.player?.public_role);
 };
 const submitted=k=>(STATE?.sync?.my_actions||[]).some(a=>a.action_type===k&&
  Number(a.cycle)===Number(STATE?.sync?.room?.cycle));
 const form=()=>`<section class="igr289-questionnaire">
  <small>LE TESTAMENT GRIS · LECTURE FACTUELLE SCELLÉE</small>
  <h3>Quelles hypothèses restent défendables ?</h3>
  <p>Réponds individuellement. L’Analyste et l’Enquêteur peuvent penser différemment. Les prochaines trames tiennent compte de vos lectures sans afficher de score, sans annoncer les erreurs et sans changer la vérité. « Impossible à établir » est acceptable.</p>
  ${Q[Number(STATE.sync.room.cycle)].map((q,i)=>`<div class="field">
   <label for="igr289_q${i+1}">${i+1} · ${q[0]}</label>
   <select id="igr289_q${i+1}">
    <option value="u">Impossible à établir actuellement</option>
    ${q[1].map((v,j)=>`<option value="${'abc'[j]}">${v}</option>`).join('')}
   </select></div>`).join('')}
  <p class="igr289-note">Aucune confirmation de justesse n'est donnée avant la fin du scénario.</p>
 </section>`;
 renderDebriefForm=function(...args){
  const base=previousRender.apply(this,args);
  if(!active()||submitted('debrief'))return base;
  const extra=submitted('v289_detail_report')
   ?'<div class="locked-state">Ta lecture des faits est scellée.</div>':form();
  const button='<button class="btn primary block" onclick="submitDebrief()">';
  return base.includes(button)?base.replace(button,extra+button):base+extra;
 };
 submitDebrief=async function(...args){
  if(!active()||submitted('v289_detail_report'))return previousSubmit.apply(this,args);
  if(pending)return;
  pending=true;
  try{
   const answers={};
   for(let i=1;i<=4;i++){
    const el=document.getElementById('igr289_q'+i);
    if(!el)throw Error('Missing sealed 007 answer');
    answers['q'+i]=el.value||'u';
   }
   await rpc('igr_v289_007_submit_detail',{
    p_code:STATE.room,p_player_token:STATE.token,p_answers:answers
   });
   return await previousSubmit.apply(this,args);
  }catch(error){
   console.error('007 sealed questionnaire',error);
   if(typeof toast==='function')toast('Tes réponses factuelles n’ont pas été enregistrées. Réessaie.');
  }finally{pending=false;}
 };
 const style=document.createElement('style');
 style.textContent=`
.igr289-questionnaire{margin:12px 0 17px;padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(255,255,255,.025)}
.igr289-questionnaire>small{color:#9ba7b1;font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.09em}
.igr289-questionnaire h3{margin:7px 0;font-size:17px}
.igr289-questionnaire p{color:#aab2ba;font-size:11px;line-height:1.6;margin:6px 0 12px}
.igr289-questionnaire label{display:block;margin-bottom:6px;font-size:12px}
.igr289-questionnaire .field{margin-top:13px}
.igr289-questionnaire select{width:100%;min-height:44px}
.igr289-questionnaire .igr289-note{font-size:10px;color:#7d8790;margin-top:12px}
 `;
 document.head.appendChild(style);
})();
