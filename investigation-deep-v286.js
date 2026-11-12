/* IGR 001–005 v286 · Detailed, individually sealed, scenario-specific investigation hypotheses.
   No truth values, secret variant IDs, grades or steering logic may be placed in the browser.
   A server-only comparison of two independent reports influences next-cycle optional evidence. */
(() => {
 'use strict';
 if (typeof renderDebriefForm!=='function'||typeof submitDebrief!=='function') return;
 const oldRender=renderDebriefForm,oldSubmit=submitDebrief;
 let busy=false;
 const Q={
 '001':{
  1:[
   ['Que prouvent les images du palier ?', ['Des passages, pas la scène du coup','L’identité de la personne qui tenait l’Opinel','L’heure médicale exacte de la blessure']],
   ['La moto encore garée établit-elle l’entrée dans la chambre 222 ?', ['Non, uniquement une présence dans les environs','Oui, le client est entré dans la chambre','Oui, il a touché le couteau']],
   ['Que rapporte directement la voisine ?', ['Des sons, pas le geste mortel','Une identification certaine de l’auteur','Une datation médicale précise']],
   ['Le bruit vers 03 h 05 suffit-il à dater la blessure ?', ['Il prouve un coup avant 02 h 30','Il prouve un coup vers 03 h 05','Non, une autre preuve est nécessaire']]
  ],
  2:[
   ['Quel moment est le mieux compatible avec les constatations sur la blessure ?', ['La première dispute','La lutte tardive','Aucune chronologie matérielle ne peut être discutée']],
   ['Que peut-on tirer de la poignée intérieure ?', ['Des traces compatibles avec l’entrée du client','Des passages sans attribution individuelle exclusive','Une preuve que le client a utilisé le couteau']],
   ['Que ressort-il du téléphone de Maël ?', ['Un ordre d’effacer un enregistrement pendant la séquence tardive','Un différend et une seconde visite sans preuve de nouveau coup','Une intimidation tardive sans identification du dernier geste']],
   ['Quel mécanisme du coup est actuellement le plus étayé ?', ['Un coup porté par S1','Un coup porté par S2','Une intervention de S3 qui dévie le bras armé']]
  ]
 },
 '002':{
  1:[
   ['Que permettent d’établir les messages conservés ?', ['Leurs contenus et dates','Une volonté de provoquer la mort','Une cause unique du suicide']],
   ['Quel est le rôle du témoignage du voisin ?', ['Décrire une observation limitée','Prouver une demande d’urgence explicite','Démontrer qu’une intervention aurait réussi']],
   ['Un accusé de réception prouve-t-il la compréhension ?', ['Non, il faut une preuve supplémentaire','Oui, nécessairement','Il ne prouve même pas la transmission']],
   ['Une cause unique du suicide est-elle établie ?', ['Oui, un seul événement l’explique','Non, les causes individuelles restent incertaines','Oui, le dernier proche présent en est la cause']]
  ],
  2:[
   ['Qui a reçu la demande explicite d’aide ou de relais ?', ['Aucun des proches selon les pièces établies','S3','S4']],
   ['Que montrent les humiliations ou divulgations documentées ?', ['Des comportements réels sans causalité exclusive démontrée','La cause certaine du suicide','Aucun comportement vérifiable']],
   ['Une absence d’appel prouve-t-elle ce qu’aurait changé une aide ?', ['Non, l’issue contrefactuelle reste incertaine','Oui, l’issue aurait été différente avec certitude','Non, aucune omission ne peut être établie']],
   ['Quelle ligne de responsabilité faut-il surtout confronter ?', ['Les humiliations publiques','La non-transmission d’une alerte connue','La fin de la colocation']]
  ]
 },
 '003':{
  1:[
   ['Quelle valeur donner à une signature ?', ['La preuve d’un acte administratif déterminé','La preuve de participation à l’attentat','Aucune valeur documentaire']],
   ['Comment traiter les avertissements scientifiques ?', ['Comme des documents à rapprocher des décisions','Comme des informations inventées sans trace','Comme une preuve automatique de sabotage terroriste']],
   ['Un lien matériel entre Helios et la gare établit-il la complicité ?', ['Non, il faut identifier les actes et leurs auteurs','Oui, les trois suspects sont complices','Non, aucun lien matériel ne peut exister']],
   ['Comment lire les décisions successives ?', ['Séparer réception, signature et départ','Les tenir pour simultanées','Ne retenir que les propos politiques']]
  ],
  2:[
   ['S1 avait-il lu l’avertissement original avant de décider ?', ['Oui, une lecture est établie','Non, la version reçue ne le contenait pas','Les éléments ne démontrent pas cette lecture']],
   ['Quel acte de S2 est le mieux documenté ?', ['Validation d’une information mensongère','Autorisation du transport malgré le danger connu','Aucune décision signée']],
   ['Quel acte de S3 est le mieux documenté ?', ['Suppression d’un avertissement','Réception d’un avertissement sans relais','Aucun acte vérifiable']],
   ['Les pièces prouvent-elles que les suspects ont voulu l’attentat ?', ['Oui, leur responsabilité matérielle suffit','Non, une telle intention n’est pas démontrée','Oui, leur ambition politique suffit']]
  ]
 },
 '004':{
  1:[
   ['Pourquoi l’ordre des appels est-il essentiel ?', ['Il précise qui pouvait agir à quel moment','Les trois proches ont reçu une alerte identique','Les horaires n’influencent aucune responsabilité']],
   ['Un message reçu équivaut-il à une connaissance partagée ?', ['Non, la transmission doit être établie','Oui, tous les proches savaient','Les accusés de réception sont inutiles']],
   ['Une présence près de l’immeuble suffit-elle ?', ['Non, elle ne prouve pas une alerte connue','Oui, elle démontre une omission volontaire','Elle prouve nécessairement une fausse déclaration']],
   ['Peut-on établir avec certitude une issue alternative ?', ['Non, seulement certaines possibilités d’intervention','Oui, un appel aurait nécessairement empêché le décès','Non, aucune décision ne peut être évaluée']]
  ],
  2:[
   ['Quelle information S1 avait-il pendant la fenêtre critique ?', ['Une alerte suffisamment précise pour agir','Il avait quitté la conversation avant les nouvelles alertes','Aucune information ne peut être identifiée']],
   ['Que prouvent les échanges entre proches ?', ['Une coordination des destinataires S2 et S3 sans relais établi','Aucune coordination vérifiable de ces deux personnes','Une instruction de S1 de ne rien faire']],
   ['Quelle valeur accorder à la présence près de l’immeuble ?', ['Elle prouve une intervention précoce','Le passage est tardif par rapport aux derniers contacts','Les pièces n’en établissent pas assez la portée']],
   ['Quelle omission principale ressort de la chronologie ?', ['Une omission de S1','Une attente partagée entre S2 et S3','Une omission de S3 seul']]
  ]
 },
 '005':{
  1:[
   ['Que démontre la présence d’un masque blanc ?', ['La présence d’un objet identifiable, pas son auteur','Que l’auteur original a tué Keller','Que le fabricant du masque est le meurtrier']],
   ['Pourquoi comparer les horaires et les images ?', ['Pour contrôler les possibilités matérielles de déplacement','Parce que les horaires n’ont aucune importance','Parce qu’ils permettent de lire l’intention du meurtrier']],
   ['Les griefs liés à Mara suffisent-ils à désigner un meurtrier ?', ['Non, un mobile ne prouve pas un geste','Oui, son veuf est nécessairement coupable','Oui, tous les suspects ont participé']],
   ['Combien de personnes ont porté les coups mortels à Keller ?', ['Une seule selon le dossier','Deux personnes','Trois personnes']]
  ],
  2:[
   ['Qui les éléments rapprochent-ils du meurtre de Keller ?', ['Le directeur artistique (S1)','L’agent de sécurité (S2)','Le veuf de Mara (S3)']],
   ['Qui peut-on identifier comme auteur du Masque Blanc original ?', ['Le directeur artistique (S1)','L’agent de sécurité (S2)','Impossible à établir à partir de ce dossier']],
   ['Quelle lecture de la place du masque est la plus cohérente ?', ['Une installation pour simuler un autre meurtrier après les coups','Le meurtrier l’a porté, puis laissé sur place','Un tiers l’a déplacé après avoir découvert les coups']],
   ['À quel moment les coups mortels semblent-ils survenir ?', ['Vers 21 h 14','Vers 20 h 56','Vers 21 h 01']]
  ]
 }
 };
 const active=()=>{
  const d=STATE?.sync,sc=d?.room?.scenario_id,cycle=Number(d?.room?.cycle);
  return !!d&&Q[sc]&&d.scenario?.investigation_deep_v286===true
   &&d.room?.phase==='cycle_debrief'&&[1,2].includes(cycle)
   &&['enqueteur','analyste'].includes(d.player?.public_role);
 };
 const submitted=kind=>(STATE?.sync?.my_actions||[]).some(a=>a.action_type===kind
   &&Number(a.cycle)===Number(STATE.sync?.room?.cycle));
 const html=()=>`<section class="igr286-sheet">
  <small>LECTURE DES PIÈCES · RÉPONSES INDIVIDUELLES SCELLÉES</small>
  <h3>Que crois-tu pouvoir démontrer ?</h3>
  <p>L’enquêteur et l’analyste répondent séparément, d’après les pièces accessibles. Le MJ peut faire apparaître au cycle suivant un recoupement différent, mais ne donne jamais le score de justesse. « Impossible à établir » reste un choix valable.</p>
  ${Q[STATE.sync.room.scenario_id][Number(STATE.sync.room.cycle)].map((q,i)=>`
   <div class="field"><label for="igr286_q${i+1}">${i+1} · ${q[0]}</label>
    <select id="igr286_q${i+1}">
     <option value="u">Impossible à établir actuellement</option>
     ${q[1].map((v,j)=>`<option value="${'abc'[j]}">${v}</option>`).join('')}
    </select>
   </div>`).join('')}
  <p class="igr286-discretion">Ces réponses ne constituent pas un verdict. Aucune bonne réponse ne sera signalée avant la révélation.</p>
 </section>`;
 renderDebriefForm=function(...args){
  const base=oldRender.apply(this,args);
  if(!active()||submitted('debrief'))return base;
  const block=submitted('v286_detail_report')
    ?'<div class="locked-state">Ta lecture des faits est scellée.</div>':html();
  const button='<button class="btn primary block" onclick="submitDebrief()">';
  return base.includes(button)?base.replace(button,block+button):base+block;
 };
 submitDebrief=async function(...args){
  if(!active()||submitted('v286_detail_report'))return oldSubmit.apply(this,args);
  if(busy)return;
  busy=true;
  try{
   const answers={};
   for(let n=1;n<=4;n++){
    const el=document.getElementById('igr286_q'+n);
    if(!el)throw Error('Missing sealed answer');
    answers['q'+n]=el.value||'u';
   }
   await rpc('igr_v286_submit_detail',{p_code:STATE.room,p_player_token:STATE.token,p_answers:answers});
   return await oldSubmit.apply(this,args);
  }catch(error){
   console.error('IGR v286 detail',error);
   if(typeof toast==='function')toast('La lecture des pièces n’a pas été enregistrée. Réessaie.');
  }finally{busy=false;}
 };
 const style=document.createElement('style');
 style.textContent=`
.igr286-sheet{margin:12px 0 17px;padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(255,255,255,.025)}
.igr286-sheet>small{color:#9ba7b1;font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.09em}
.igr286-sheet h3{margin:7px 0;font-size:17px}
.igr286-sheet p{color:#aab2ba;font-size:11px;line-height:1.6;margin:6px 0 12px}
.igr286-sheet label{display:block;margin-bottom:6px;font-size:12px}
.igr286-sheet .field{margin-top:13px}
.igr286-sheet select{width:100%;min-height:44px}
.igr286-sheet .igr286-discretion{font-size:10px;color:#7d8790;margin-top:12px}
 `;
 document.head.appendChild(style);
})();
