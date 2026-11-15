/* Inside Grey Room — v52 Final Audience
   Simplified final sequence: role hearing, suspect defences, one final 0..2 responsibility lock.
*/
(()=>{
'use strict';
const VERSION='v52-final-audience';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null,room=()=>sync()?.room||null,me=()=>sync()?.player||null,role=()=>me()?.public_role||S()?.role||'';
const fr=()=>window.IGR_LOCALE!=='en',copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const invRoles=new Set(['enqueteur','analyste','inspecteur','expert','procureur','juge']);
const finalPhases=new Set(['final_audience','final_suspect_defenses','locking']);
const players=()=>Array.isArray(sync()?.players)?sync().players:[],suspects=()=>Array.isArray(sync()?.suspects)?sync().suspects:players().filter(p=>p.public_role==='suspect');
const short=()=>room()?.state?.duration_mode==='short';
const speechMinutes=()=>short()?1:2,defenseMinutes=()=>short()?2:3;
 const speechLabel=()=>judgePresent()?(short()?'1:00':'1:30'):`${speechMinutes()}:00`,defenseLabel=()=>judgePresent()?(short()?'3:00':'4:00'):`${defenseMinutes()}:00`;
 const protectedDefenseSeconds=()=>short()?90:120;
const myId=()=>String(me()?.id||S()?.playerId||''),code=()=>S()?.room||room()?.code||'',token=()=>S()?.token||'';
const actions=()=>Array.isArray(sync()?.my_actions)?sync().my_actions:[];
const hasAction=t=>actions().some(a=>a.action_type===t);
const judgePresent=()=>players().some(p=>p.public_role==='juge');
const specialCartel029=()=>room()?.scenario_id==='029'&&room()?.state?.cartel029_ready===true;
const secsLeft=()=>room()?.phase_ends_at?Math.max(0,Math.ceil((new Date(room().phase_ends_at).getTime()-Date.now())/1000)):0;
const clock=s=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
const labelRole=r=>({enqueteur:'Enquêteur',analyste:'Analyste',inspecteur:'Inspecteur',expert:'Expert',procureur:'Procureur',juge:'Juge',journaliste:'Journaliste',suspect:'Suspect',maitre:'Avocat'})[r]||r;
async function rpc52(name,args={}){if(typeof window.rpc!=='function')throw new Error(copy('Connexion indisponible.','Connection unavailable.'));return window.rpc(name,{p_code:code(),p_player_token:token(),...args})}
function toastErr(e,f){window.toast?.(e?.message||f)}
function qItem(){const st=room()?.state||{},q=Array.isArray(st.v52_queue)?st.v52_queue:[],i=+(st.v52_index||0);return {q,i,item:q[i]||null,status:String(st.v52_status||'waiting')}}
function scaleForm(prefix){return suspects().map(s=>`<label class="igr52-level"><span>${esc(s.pseudo)}</span><select id="${prefix}_${esc(s.id)}" required>${judgePresent()?`<option value="" selected disabled>${copy('Choisir…','Choose…')}</option>`:''}<option value="0">0 · ${copy('Aucune responsabilité','No responsibility')}</option><option value="1">1 · ${copy('Responsabilité secondaire','Secondary responsibility')}</option><option value="2">2 · ${copy('Responsabilité principale','Primary responsibility')}</option></select></label>`).join('')}
function collect(prefix){const out={};for(const s of suspects()){const el=document.getElementById(`${prefix}_${s.id}`);if(!el||!['0','1','2'].includes(el.value))throw new Error(copy('Choix incomplet.','Incomplete choice.'));out[s.id]=+el.value}return out}
window.igr52Audience=async action=>{try{await rpc52('igr_v52_stage_action',{p_action:action,p_levels:null});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Action impossible.','Action unavailable.'))}};
window.igr52Defense=async action=>{try{await rpc52('igr_v52_stage_action',{p_action:action,p_levels:null});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Défense impossible.','Defence unavailable.'))}};
window.igr52Lock=async()=>{try{const special029=judgePresent()&&specialCartel029();const note=(document.getElementById('igr52FinalNote')?.value||'').trim();if(special029&&role()==='journaliste'&&note.length<24)throw new Error(copy('Angle journalistique : 24 caractères minimum.','Journalist angle: at least 24 characters.'));const payload={levels:(special029||role()==='journaliste')?{}:collect('igr52final'),note};await rpc52('igr_v4_lock_final',{p_payload:payload});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Verrouillage impossible.','Unable to lock.'))}};
window.igr52Integrity=async corrupt=>{try{await rpc52('igr_v44_integrity_vote',{p_corrupt:!!corrupt});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Vote impossible.','Vote unavailable.'))}};
window.igr52Terror=async decision=>{try{await rpc52('igr_v33_terror_decide_027',{p_decision:decision});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Recommandation impossible ou évaluations incomplètes.','Recommendation unavailable or assessments incomplete.'))}};

window.igr59Recover=async()=>{try{const id=document.getElementById('igr59Absent')?.value,reason=(document.getElementById('igr59Reason')?.value||'').trim();if(!id||reason.length<8)throw new Error(copy('Choisis le joueur absent et indique un motif (8 caractères minimum).','Choose the absent player and enter a reason (at least 8 characters).'));const name=players().find(p=>String(p.id)===id)?.pseudo||id;if(!window.confirm(copy(`${name} sera déclaré absent pour la fin de partie, sans verdict ni vote inventé. Confirmer ?`,`${name} will be marked absent for the endgame, without an invented verdict or vote. Confirm?`)))return;await window.rpc('igr_v59_host_recover',{p_code:code(),p_host_token:S().hostToken,p_player_id:id,p_reason:reason});await window.syncNow?.(true)}catch(e){toastErr(e,copy('Reprise impossible.','Recovery unavailable.'))}};
function recovery(){if(!S()?.hostToken)return '';const ph=room()?.phase,{item,status}=qItem();const absent=room()?.state?.v59_absent||[];const courtroom=ph==='final_suspect_defenses'&&room()?.state?.v52_stage==='courtroom';const choices=ph==='locking'?(room()?.state?.v59_pending||[]):courtroom?courtDefendants().map(p=>({player_id:p.id,pseudo:p.pseudo})):status==='waiting'&&item?[item]:[];const available=choices.filter(p=>!absent.includes(String(p.player_id||p.id))&&String(p.player_id||p.id)!==myId());if(!available.length)return '';const delay=ph==='locking'?120:60;const at=new Date(room()?.phase_started_at||Date.now()).getTime()+delay*1000;return `<article class="igr52-card"><small>${copy('HÔTE · JOUEUR ABSENT','HOST · ABSENT PLAYER')}</small><p>${copy(`Après ${delay} secondes d’attente, une absence confirmée permet de continuer. Aucune décision ni aucun vote n’est inventé. Le joueur absent ne valide pas son objectif final.`,`After ${delay} seconds of waiting, a confirmed absence allows the game to continue. No decision or vote is invented. The absent player does not validate their final objective.`)}</p><label>${copy('Joueur absent','Absent player')}<select id="igr59Absent">${available.map(p=>`<option value="${esc(p.player_id||p.id)}">${esc(p.pseudo)}</option>`).join('')}</select></label><label>${copy('Motif visible par tous','Reason visible to everyone')}<textarea id="igr59Reason" maxlength="180"></textarea></label><button class="btn danger block" data-igr59-recovery-at="${at}" ${Date.now()<at?'disabled':''} onclick="igr59Recover()">${copy('CONFIRMER L’ABSENCE ET CONTINUER','CONFIRM ABSENCE AND CONTINUE')}</button></article>`}

function flow(){if(judgePresent())return `<div class="igr52-flow"><span class="${room()?.phase==='final_suspect_defenses'?'on':''}">1 · ${copy('Tribunal','Courtroom')}</span><span class="${room()?.phase==='locking'?'on':''}">2 · ${copy('Vote secret','Secret ballot')}</span></div>`;return `<div class="igr52-flow"><span class="${room()?.phase==='final_audience'?'on':''}">1 · ${copy('Audience','Hearing')}</span><span class="${room()?.phase==='final_suspect_defenses'?'on':''}">2 · ${copy('Défenses','Defences')}</span><span class="${room()?.phase==='locking'?'on':''}">3 · ${copy('Décision finale','Final decision')}</span></div>`}
function waitingCard(item,mandatory=false){return `<article class="igr52-card strong"><small>${mandatory?copy('INTERVENTION OBLIGATOIRE','MANDATORY INTERVENTION'):copy('INTERVENTION PROPOSÉE','OPTIONAL INTERVENTION')}</small><h3>${esc(item?.pseudo||'')}</h3><p>${esc(labelRole(item?.role||''))} · ${copy(`${clock(Number(item?.seconds||120))} maximum`,`${clock(Number(item?.seconds||120))} maximum`)}</p></article>`}
function audience(){const {item,status}=qItem();if(!item)return `<div class="locked-state">${copy('Préparation des défenses…','Preparing defences…')}</div>`;const mine=String(item.player_id)===myId(),mandatory=item.required===true&&!judgePresent();
 let body=waitingCard(item,mandatory);
 if(status==='active')body+=`<article class="igr52-live"><small>${copy('PAROLE EN COURS','SPEAKING')}</small><div class="igr52-timer" data-igr52-timer>${clock(secsLeft())}</div><p>${item.role==='juge'?copy('Le Juge peut présenter ses soupçons ou passer son tour. Aucun verdict à l’audience.','The Judge may give provisional suspicions or skip. No verdict at the hearing.'):copy('Expose ton avis provisoire. Tu peux terminer plus tôt ; le tribunal et le vote viennent ensuite.','Give your provisional view. You may finish early; trial and vote follow.')}</p>${mine?`<button class="btn primary block" onclick="igr52Audience('end')">${copy('TERMINER MON INTERVENTION','END MY INTERVENTION')}</button>`:''}</article>`;
 else if(mine)body+=`<div class="igr52-actions"><button class="btn primary" onclick="igr52Audience('start')">${copy(`PRENDRE LA PAROLE · ${speechLabel()}`,`SPEAK · ${speechLabel()}`)}</button><button class="btn ghost" onclick="igr52Audience('skip')">${copy('PASSER','SKIP')}</button></div>`
 else body+=`<div class="locked-state">${copy('En attente de sa décision : parler ou passer.','Waiting for their choice: speak or skip.')}</div>`;
 return body}
function courtroomUnclocked(item,status,mine,myLawyer,witness029){
 const st=room()?.state||{},done=st.v705_defense_done===true,jury=role()==='juge';
 let h=`<article class="igr52-card strong"><small>${witness029?copy('TRIBUNAL · TÉMOIN','COURT · WITNESS'):copy('TRIBUNAL · AUDITION LIBRE','COURT · OPEN HEARING')}</small><h3>${esc(item.pseudo||'')}</h3><p>${item.lawyer_pseudo?copy('Avocat officiel : ','Official Lawyer: ')+esc(item.lawyer_pseudo):copy('Aucun avocat officiel désigné.','No official Lawyer assigned.')}</p><p>${copy('Aucun chronomètre. Tous les joueurs sont réunis ; le Juge donne librement la parole à la défense, aux questions et aux confrontations. Il peut rappeler un autre suspect à tout moment.','No countdown. Everyone stays in the room; the Judge freely invites defence, questions and cross-examination, and may recall a previous Suspect.')}</p></article>`;
 if(status==='waiting'){
  h+=jury?`<button class="btn primary block" onclick="igr52Defense('start')">${copy('OUVRIR LA COMPARUTION','OPEN THE HEARING')}</button>`:`<div class="locked-state">${copy('Le Juge appellera le suspect. Aucun chronomètre ne sera lancé.','The Judge will call the Suspect. No timer will start.')}</div>`;
 }else if(status==='active'){
  h+=`<article class="igr52-live"><small>${copy('DÉBATS EN COURS · SANS CHRONOMÈTRE','HEARING OPEN · NO COUNTDOWN')}</small><p>${done?copy('Le suspect a confirmé avoir terminé sa défense. Le Juge peut poursuivre les questions ou passer à la suite.','The Suspect has finished their defence. The Judge may continue questioning or proceed.'):copy('Le suspect et son avocat peuvent défendre leur version. Les autres joueurs interviennent lorsque le Juge leur donne la parole.','The Suspect and Lawyer may present their case. Other players speak when recognized by the Judge.')}</p>`;
  if(mine)h+=done?`<div class="locked-state">${copy('Défense terminée ; tu peux encore répondre aux questions.','Defence complete; you may still answer questions.')}</div>`:`<button class="btn ghost block" onclick="igr52Defense('defense_done')">${copy('J’AI TERMINÉ MA DÉFENSE / JE GARDE LE SILENCE','I HAVE FINISHED / I CHOOSE SILENCE')}</button>`;
  if(myLawyer)h+=`<p>${copy('Tu peux intervenir pour ton client aussi longtemps que le Juge t’accorde la parole.','You may advocate for your client for as long as the Judge grants the floor.')}</p>`;
  if(jury)h+=`<button class="btn primary block" ${done?'':'disabled'} onclick="igr52Defense('end')">${copy('CLÔTURER CETTE COMPARUTION','CLOSE THIS HEARING')}</button>${done?'':`<p>${copy('La clôture reste bloquée tant que le suspect n’a pas confirmé avoir pu se défendre ou choisi de garder le silence.','The Judge cannot close until the Suspect confirms they have finished or chosen silence.')}</p>`}`;
  h+='</article>';
 }
 return h;
}

/* v708: Judge-led, non-timed courtroom. State is synchronized by player-token RPC.
   The seating chart is guidance only; no positional or speech restrictions. */
window.igr708Court=async(action,item=null)=>{try{
 await rpc52('igr_v708_court_action',{p_action:action,p_item:item});
 await window.syncNow?.(true);
}catch(e){toastErr(e,copy('Action impossible au tribunal.','Courtroom action unavailable.'))}};
const courtStep=()=>String(room()?.state?.v708_court_step||'seating');
const courtArray=k=>Array.isArray(room()?.state?.[k])?room().state[k]:[];
const courtDefendants=()=>players().filter(p=>p.public_role==='suspect');
const courtRoster=roles=>players().filter(p=>roles.includes(p.public_role)).map(p=>esc(labelRole(p.public_role))+' · '+esc(p.pseudo)).join('<br>')||copy('Aucun rôle présent','No assigned role');
function courtroomSeating(){
 const prosecution=['procureur','enqueteur','analyste','inspecteur','expert'],defence=['maitre','suspect'],other=['temoin','journaliste'];
 const members=roles=>players().filter(p=>roles.includes(p.public_role));
 const seats=roles=>members(roles).map(p=>`<span class="igr712-seat-person"><b>${esc(p.pseudo)}</b><small>${esc(labelRole(p.public_role))}</small></span>`).join('')||`<span class="igr712-seat-empty">${copy('Aucun joueur','No player')}</span>`;
 return `<details class="igr708-seating igr712-block" ${courtStep()==='seating'?'open':''}>
 <summary><span class="igr712-summary-icon" aria-hidden="true">⌖</span><span><strong>${copy('Disposition de la salle','Courtroom seating')}</strong><small>${copy('Plan indicatif · places libres','Suggested layout · free seating')}</small></span><span class="igr712-chevron" aria-hidden="true">⌄</span></summary>
 <div class="igr712-seating-inner">
 <div class="igr712-seating-top"><span class="igr712-rail-label">${copy('PRÉSIDENCE','BENCH')}</span><div class="igr708-bench"><span aria-hidden="true">⚖</span><div><strong>${copy('Juge','Judge')}</strong><small>${seats(['juge'])}</small></div></div></div>
 <div class="igr708-sides">
 <section class="igr712-seat-side"><span class="igr712-rail-label">${copy('ACCUSATION','PROSECUTION')}</span><div class="igr712-seat-people">${seats(prosecution)}</div></section>
 <section class="igr712-seat-side"><span class="igr712-rail-label">${copy('DÉFENSE','DEFENCE')}</span><div class="igr712-seat-people">${seats(defence)}</div></section></div>
 ${members(other).length?`<div class="igr712-seating-gallery"><span class="igr712-rail-label">${copy('TÉMOINS ET OBSERVATEURS','WITNESSES AND OBSERVERS')}</span><div class="igr712-seat-people">${seats(other)}</div></div>`:''}
 <p class="igr712-seat-disclaimer">${copy('Ce schéma aide à se placer. Il n’impose aucun déplacement et ne révèle aucune alliance.','This layout is only a guide. It requires no movement and reveals no alliances.')}</p>
 </div></details>`;
}
function courtroomRoleCue(){
 const who=role(),prosecutor=players().some(p=>p.public_role==='procureur'),witness=specialCartel029();
 const cues={
 juge:[copy('Tu présides les débats, tu donnes la parole et tu protèges les dernières interventions. Aucun chronomètre, aucune preuve créée.','You preside and grant the floor. Protect final responses. No countdown or new evidence.')],
 procureur:[copy('Présente les accusations et leurs fondements, interroge les contradictions, puis formule tes réquisitions. Les accords négociés ne sont révélés que si un joueur les expose.','Present charges and supporting evidence, challenge contradictions and give final submissions. Negotiated agreements are not revealed automatically.')],
 enqueteur:[prosecutor?copy('Apporte les faits du dossier et réponds aux contestations du Procureur et de la Défense.','Present case facts and answer challenges from Prosecution and Defence.'):copy('En l’absence de Procureur, présente les accusations et les faits du dossier.','Without a Prosecutor, present the charges and the case facts.')],
 analyste:[copy('Éclaire les déclarations, motivations et contradictions observables. Un profil psychologique n’est pas une preuve de culpabilité.','Discuss observable statements and contradictions. Psychological profiles are not proof of guilt.')],
 inspecteur:[copy('Présente les constatations de terrain réellement obtenues. Distingue observation, hypothèse et rumeur.','Present actual field findings. Separate observations from hypotheses and rumours.')],
 expert:[copy('Présente tes analyses et leurs limites. Une interprétation technique ne décide pas seule de la culpabilité.','Present your analyses and their limits. Technical findings alone cannot establish guilt.')],
 maitre:[copy('Défends ton client officiel ; demande au Juge de pouvoir contester une accusation ou poser des questions. Aucune plaidoirie chronométrée.','Defend your official client and ask the Judge to challenge accusations or question other players. No timed speeches.')],
 suspect:[witness?copy('Réponds comme témoin selon ce que tu sais, ou garde le silence. Tu confirmeras avoir été entendu et avoir eu ton dernier mot.','Answer as a witness about what you know, or remain silent. Confirm your testimony opportunity and final statement.'):copy('Défends ta version, questionne les accusations et choisis ce que tu souhaites révéler. Tu peux aussi garder le silence.','Defend your account and challenge accusations. Choose what to disclose, or remain silent.')],
 journaliste:[copy('Tu peux évoquer tes publications si le Juge t’accorde la parole. Une publication ne vaut pas preuve.','You may discuss your publications if the Judge recognizes you. A report is not automatically evidence.')],
 temoin:[copy('Réponds uniquement sur les faits que tu connais et les déclarations que tu as réellement faites.','Speak only about facts you know and statements you actually made.')]}
 return `<article class="igr52-card igr712-role"><div class="igr712-role-mark" aria-hidden="true">§</div><div><small>${copy('TON RÔLE AU TRIBUNAL','YOUR COURTROOM ROLE')}</small><h3>${esc(labelRole(who))}</h3><p>${(cues[who]||[copy('Interviens si le Juge te donne la parole.','Speak when recognized by the Judge.')]).join(' ')}</p></div></article>`;
}
const courtTopics=[
 ['charges',copy('Accusations : qui est soupçonné, de quoi ?','Charges: who is accused, of what?')],
 ['evidence',copy('Éléments du dossier : quelles pièces soutiennent les accusations ?','Evidence: what supports the charges?')],
 ['contradictions',copy('Contradictions et accords révélés : une confrontation est-elle utile ?','Contradictions and disclosed deals: would a confrontation help?')],
 ['defences',copy('Défenses : chaque suspect a-t-il pu répondre ?','Defence: did every defendant have a chance to answer?')],
 ['submissions',copy('Conclusions : réquisitions et réponse des avocats.','Submissions: prosecution and lawyers respond.')],
 ['last_words',copy('Dernier mot : chaque suspect a-t-il eu cette possibilité ?','Final word: did every defendant have that opportunity?')]
];
function courtroomAgenda(){
 if(role()!=='juge')return '';
 const checked=courtArray('v708_checks');
 return `<section class="igr708-agenda igr712-block" aria-label="${copy('Guide facultatif du Juge','Optional Judge guide')}">
 <header class="igr712-block-head"><div><small>${copy('AIDE-MÉMOIRE · FACULTATIF','OPTIONAL REFERENCE')}</small><h3>${copy('Fil conducteur du juge','Judge’s guide')}</h3></div><span class="igr712-counter">${checked.length} / ${courtTopics.length}</span></header>
 <p class="igr712-guide-note">${copy('Repères à aborder librement. Ces coches ne forcent aucun échange ni aucune révélation.','Suggested discussion topics. Checkmarks never force a speech or reveal information.')}</p>
 <div class="igr712-topic-grid">${courtTopics.map(([id,label],i)=>{const index=label.indexOf(':');const heading=index>=0?label.slice(0,index):label;const detail=index>=0?label.slice(index+1).trim():'';const done=checked.includes(id);
  return `<button type="button" class="igr708-topic ${done?'is-complete':''}" aria-pressed="${done}" onclick="igr708Court('toggle_point','${id}')"><span class="igr712-topic-index">${String(i+1).padStart(2,'0')}</span><span class="igr712-topic-content"><b>${esc(heading)}</b><small>${esc(detail)}</small></span><span class="igr712-topic-check" aria-hidden="true">${done?'✓':'○'}</span></button>`;}).join('')}</div>
 </section>`;
}
function courtroomDefendantProgress(){
 const defendants=courtDefendants(),heard=courtArray('v708_heard'),last=courtArray('v708_last_word'),absent=courtArray('v59_absent');
 const present=defendants.filter(p=>!absent.includes(String(p.id))),countHeard=present.filter(p=>heard.includes(String(p.id))).length,countLast=present.filter(p=>last.includes(String(p.id))).length;
 return `<section class="igr52-card igr712-defendants" aria-label="${copy('Suivi des interventions','Speaking rights status')}">
 <div class="igr712-block-head"><div><small>${copy('DROITS DE LA DÉFENSE','DEFENCE RIGHTS')}</small><h3>${copy('Paroles garanties','Speaking opportunities')}</h3></div><span class="igr712-counter">${countHeard}/${present.length}</span></div>
 <div class="igr712-metrics"><div><b>${countHeard}<span> / ${present.length}</span></b><small>${copy('Défenses proposées','Defence offered')}</small></div><div><b>${countLast}<span> / ${present.length}</span></b><small>${copy('Derniers mots','Final statements')}</small></div></div>
 <div class="igr712-defendant-grid">${defendants.map(p=>{const id=String(p.id),a=absent.includes(id);return `<div class="igr712-defendant ${a?'is-absent':''}"><strong>${esc(p.pseudo)}</strong><div class="igr712-defendant-flags"><span class="${!a&&heard.includes(id)?'done':''}">${a?'—':heard.includes(id)?'✓':'○'} ${copy('Défense','Defence')}</span><span class="${!a&&last.includes(id)?'done':''}">${a?'—':last.includes(id)?'✓':'○'} ${copy('Dernier mot','Final word')}</span></div>${a?`<small>${copy('Absence confirmée par l’hôte','Host-confirmed absence')}</small>`:''}</div>`;}).join('')}</div>
 <p class="igr712-footnote">${copy('Chaque suspect confirme personnellement qu’il a eu la possibilité de parler ou de garder le silence.','Each defendant personally confirms having had a chance to speak or remain silent.')}</p></section>`;
}
function courtroomV708(){
 const step=courtStep(),judge=role()==='juge',defendant=role()==='suspect',heard=courtArray('v708_heard'),last=courtArray('v708_last_word'),absent=courtArray('v59_absent');
 const meHeard=heard.includes(myId()),meLast=last.includes(myId());
 const complete=courtDefendants().every(p=>absent.includes(String(p.id))||(heard.includes(String(p.id))&&last.includes(String(p.id))));
 const phases=[
  ['seating',copy('Installation','Seating')],
  ['opening',copy('Accusations','Charges')],
  ['debate',copy('Débats libres','Open debate')],
  ['conclusions',copy('Conclusions','Submissions')]
 ];
 const stepIndex=Math.max(0,phases.findIndex(([id])=>id===step));
 const titles={
  seating:copy('Prenez place. Le procès commence.','Take your seats. Court is about to begin.'),
  opening:copy('L’accusation expose les faits.','The prosecution presents the case.'),
  debate:copy('Les versions se confrontent.','Accounts are challenged.'),
  conclusions:copy('Les derniers arguments.','Final arguments.')
 };
 const descriptions={
  seating:copy('Le plan est une suggestion. Le juge ouvre la séance lorsque les joueurs sont prêts.','Seating is optional. The Judge opens court when players are ready.'),
  opening:copy('Le procureur présente l’accusation ou, s’il est absent, l’enquêteur.','The Prosecutor presents the charges, or the Investigator if absent.'),
  debate:copy('Questions et confrontations libres. Le juge veille à ce que chacun puisse répondre.','Free questions and challenges. The Judge ensures everyone can respond.'),
  conclusions:copy('Réquisitions, réponse de l’avocat, puis dernier mot de chaque suspect.','Prosecution, lawyer responses and each defendant’s final word.')
 };
 let html=`<section class="igr52-card igr712-hero">
 <div class="igr712-hero-top"><span class="igr712-hero-eyebrow">⚖ ${copy('TRIBUNAL FINAL','FINAL COURTROOM')}</span><span class="igr712-unclocked">◌ ${copy('Aucun chronomètre','No countdown')}</span></div>
 <span class="igr712-hero-number">${String(stepIndex+1).padStart(2,'0')} <span>/ 04</span></span>
 <h2>${esc(titles[step]||titles.seating)}</h2><p>${descriptions[step]||''}</p>
 <nav class="igr712-timeline" aria-label="${copy('Progression du tribunal','Courtroom progression')}">
 ${phases.map(([id,name],i)=>`<div class="igr712-timeline-stage ${i<stepIndex?'is-past':i===stepIndex?'is-active':''}" ${i===stepIndex?'aria-current="step"':''}><span>${i<stepIndex?'✓':String(i+1)}</span><small>${esc(name)}</small></div>`).join('')}
 <div class="igr712-timeline-stage is-future"><span>5</span><small>${copy('Vote secret','Secret ballot')}</small></div></nav>
 </section>`;
 html+=courtroomRoleCue();
 let defendantControls='';
 if(defendant&&!absent.includes(myId())&&['debate','conclusions'].includes(step)&&!meHeard)defendantControls=`<button type="button" class="btn primary block igr712-main-action" onclick="igr708Court('defense_done')">${copy('J’AI PU ME DÉFENDRE / JE GARDE LE SILENCE','I HAVE BEEN HEARD / I CHOOSE SILENCE')}</button>`;
 if(defendant&&!absent.includes(myId())&&step==='conclusions'&&meHeard&&!meLast)defendantControls=`<button type="button" class="btn primary block igr712-main-action" onclick="igr708Court('last_word_done')">${copy('J’AI EU MON DERNIER MOT / JE PASSE','I HAVE HAD MY FINAL WORD / I PASS')}</button>`;
 if(defendant&&['debate','conclusions'].includes(step)){
  html+=`<section class="igr712-controls igr712-participant-controls"><div class="igr712-controls-heading"><small>${copy('VOTRE DÉFENSE','YOUR DEFENCE')}</small><h3>${meLast?copy('Dernier mot confirmé','Final word confirmed'):meHeard?copy('Défense confirmée','Defence confirmed'):copy('À vous de vous exprimer','Your chance to speak')}</h3></div>
  ${defendantControls||`<p class="igr712-note">${copy('Vous avez confirmé cette étape. Les débats restent libres jusqu’à la clôture du juge.','You have confirmed this step. Discussion remains open until the Judge closes court.')}</p>`}</section>`;
 }
 if(judge){
  const command=step==='seating'?`<button type="button" class="btn primary block igr712-main-action" onclick="igr708Court('open')">${copy('OUVRIR LE TRIBUNAL','OPEN COURT')}</button>`:
   step==='opening'?`<button type="button" class="btn primary block igr712-main-action" onclick="igr708Court('next')">${copy('PASSER AUX DÉBATS','OPEN DEBATE')}</button>`:
   step==='debate'?`<button type="button" class="btn primary block igr712-main-action" onclick="igr708Court('next')">${copy('PASSER AUX CONCLUSIONS','MOVE TO FINAL SUBMISSIONS')}</button>`:
   `<div class="igr712-action-row"><button type="button" class="btn ghost block" onclick="igr708Court('back')">${copy('REPRENDRE LES DÉBATS','RETURN TO DEBATE')}</button>
    <button type="button" class="btn primary block igr712-main-action" ${complete?'':'disabled'} onclick="igr708Court('close')">${copy('CLÔTURER ET OUVRIR LE VOTE SECRET','CLOSE COURT AND OPEN SECRET BALLOT')}</button></div>
    ${complete?'':`<p class="igr712-note">${copy('La clôture sera disponible après confirmation des défenses et des derniers mots.','Closure unlocks once defendants confirm their defence and final word.')}</p>`}`;
  html+=`<section class="igr712-controls igr712-judge-controls"><div class="igr712-controls-heading"><small>${copy('DIRECTION DES DÉBATS','PRESIDING CONTROLS')}</small><h3>${copy('La séance vous appartient','Direct the hearing')}</h3></div>${command}</section>`;
 }
 html+=courtroomSeating();
 html+=courtroomAgenda();
 html+=courtroomDefendantProgress();
 return html;
}

function defense(){const {item,status}=qItem();if(!item)return `<div class="locked-state">${copy('Préparation de la suite…','Preparing next step…')}</div>`;const mine=String(item.player_id)===myId(),myLawyer=String(item.lawyer_id||'')===myId();const witness029=judgePresent()&&specialCartel029();if(judgePresent())return courtroomUnclocked(item,status,mine,myLawyer,witness029);let body=`<article class="igr52-card strong"><small>${witness029?copy('TRIBUNAL · TÉMOIN','COURTROOM · WITNESS'):judgePresent()?copy('TRIBUNAL · AUDITION LIBRE','COURTROOM · OPEN HEARING'):copy('DÉFENSE FINALE · FACULTATIVE','FINAL DEFENCE · OPTIONAL')}</small><h3>${esc(item.pseudo||'')}</h3><p>${item.lawyer_pseudo?copy(`Avocat officiel : ${esc(item.lawyer_pseudo)} · les ${defenseLabel()} sont partagées entre défense et avocat.`,`Official lawyer: ${esc(item.lawyer_pseudo)} · the ${defenseLabel()} are shared between defence and lawyer.`):copy('Aucun Avocat officiel rattaché.','No official Lawyer attached.')}</p></article>`;
 if(status==='active')body+=`<article class="igr52-live"><div class="igr52-timer" data-igr52-timer>${clock(secsLeft())}</div><p>${judgePresent()?short()?copy('Le Juge dirige : 1 min 30 de défense avec l’Avocat, 45 s de questions et 45 s de réponse. Tous restent réunis.','Judge presides: 1:30 defence with Lawyer, 0:45 questions and 0:45 reply. Everyone stays together.'):copy('Le Juge dirige : 2 min de défense (avocat officiel inclus), 1 min de questions, 1 min de réponse. Tous restent dans la pièce.','Judge presides: 2 min defence (including official lawyer), 1 min questions, 1 min final reply. Everyone remains present.'):copy('Le suspect répond une dernière fois à l’ensemble de l’enquête. Son Avocat officiel peut intervenir dans le même temps.','The suspect responds one last time to the whole investigation. Their official Lawyer may speak within the same time.')}</p>${judgePresent()?(role()==='juge'?`<p>${short()?copy('Tu peux clôturer après 1 min 30 de défense, ou plus tôt si le Suspect renonce à son temps restant.','You may close after 1:30 of defence, or earlier if the Suspect waives remaining time.'):copy('Tu peux clôturer après 2 min de défense, ou plus tôt si le Suspect renonce à son temps restant.','You may close after 2 min of defence, or earlier if the Suspect waives remaining time.')}</p><button class="btn primary block" data-igr705-close-at="${new Date(room()?.phase_ends_at||Date.now()).getTime()-(short()?90000:120000)}" ${room()?.state?.v705_defense_done||secsLeft()<=protectedDefenseSeconds()?'':'disabled'} onclick="igr52Defense('end')">${copy('CLÔTURER CETTE COMPARUTION','CLOSE THIS APPEARANCE')}</button>`:''):(mine?`<button class="btn primary block" onclick="igr52Defense('end')">${copy('TERMINER MA DÉFENSE','END MY DEFENCE')}</button>`:'' )}${judgePresent()&&mine?(room()?.state?.v705_defense_done?`<div class="igr52-lawyer-note">${copy('Défense terminée ; le Juge poursuit ou clôt la comparution.','Defence finished; the Judge continues or closes the appearance.')}</div>`:`<button class="btn ghost block" onclick="igr52Defense('defense_done')">${copy('J’AI TERMINÉ MA DÉFENSE','I HAVE FINISHED MY DEFENCE')}</button>`):''}${myLawyer?`<div class="igr52-lawyer-note">${copy('Tu accompagnes ton client. Tu partages ses minutes de défense : aucun chrono séparé.','You accompany your client. You share their defence time: there is no separate timer.')}</div>`:''}</article>`;
 else if(mine||(judgePresent()&&role()==='juge'))body+=`<div class="igr52-actions"><button class="btn primary" onclick="igr52Defense('start')">${judgePresent()&&role()==='juge'?copy(`OUVRIR LA COMPARUTION · ${defenseLabel()}`,`OPEN APPEARANCE · ${defenseLabel()}`):copy(`ME DÉFENDRE · ${defenseLabel()}`,`DEFEND MYSELF · ${defenseLabel()}`)}</button>${judgePresent()?'':`<button class="btn ghost" onclick="igr52Defense('skip')">${copy('PASSER','SKIP')}</button>`}</div>`;
 else body+=`<div class="locked-state">${judgePresent()?copy('Le Juge ouvrira la comparution. Le Suspect peut garder le silence, mais ne peut empêcher les questions.','The Judge will open the appearance. The Suspect may remain silent but cannot block questions.'):copy('Le suspect choisit s’il souhaite utiliser sa défense finale.','The suspect decides whether to use their final defence.')}</div>`;
 return body}
function reassessment(){const st=room()?.state||{},special029=judgePresent()&&specialCartel029(),mineInv=invRoles.has(role()),locked=hasAction('final_lock'),voter=['enqueteur','analyste','procureur'].includes(role())&&judgePresent(),voted=hasAction('judge_integrity_vote');let body=(function ballotIntro(){
 const registered=Math.max(0,Number(st.v52_locks_received)||0),required=Math.max(0,Number(st.v52_locks_required)||0);
 const pct=required?Math.min(100,Math.round(registered*100/required)):0;
 const title=special029?copy('Conclusions du rapport — dossier 029','Report conclusions — case 029'):judgePresent()?copy('Vote final individuel et secret','Individual secret final vote'):copy('Réévaluation finale','Final reassessment');
 const subtitle=special029?copy('Les témoins ne sont pas notés sur une échelle de culpabilité ; le rapport propre au dossier détermine la conclusion.','Witnesses are not given guilt scores; this case follows its own report.'):copy('Chaque membre habilité choisit sa lecture. La majorité absolue par suspect détermine le verdict collectif.','Each eligible player makes one choice. A strict majority per suspect decides the team verdict.');
 const choices=special029?'':`<div class="igr712-ballot-scale">
 <div><b>0</b><span>${copy('Aucune','None')}</span></div>
 <div><b>1</b><span>${copy('Secondaire','Secondary')}</span></div>
 <div><b>2</b><span>${copy('Principale','Primary')}</span></div></div>`;
 return `<article class="igr52-card strong igr712-ballot-hero"><small>${copy('APRÈS TOUTES LES DÉFENSES','AFTER ALL DEFENCES')}</small><h3>${title}</h3><p>${subtitle}</p>
 ${choices}
 <p class="igr712-ballot-majority">${special029?copy('Procédure spéciale · aucun classement artificiel des témoins.','Special procedure · witness responsibility is not artificially scored.'):copy('1 personne = 1 voix · ni Juge ni Procureur ne dispose d’un veto · sans majorité, verdict indéterminé.','1 person = 1 vote · no Judge or Prosecutor veto · no majority means unresolved verdict.')}</p>
 <div class="igr712-ballot-status"><div><span>${copy('VALIDATIONS FINALES','FINAL SUBMISSIONS')}</span><b>${registered} / ${required}</b></div><div class="igr712-ballot-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${required}" aria-valuenow="${registered}" aria-label="${copy('Validations reçues','Final submissions received')}"><span style="width:${pct}%"></span></div></div></article>`;
})();
 if(mineInv){body+=locked?`<div class="locked-state">${copy('Ta lecture finale est verrouillée.','Your final reading is locked.')}</div>`:`<div class="igr52-map"><h3>${copy('Ta décision définitive','Your final decision')}</h3>${special029?'':scaleForm('igr52final')}<label><span>${copy('Note courte facultative','Optional short note')}</span><textarea id="igr52FinalNote" maxlength="300"></textarea></label><button class="btn danger block" onclick="igr52Lock()">${copy('VERROUILLER DÉFINITIVEMENT','LOCK DEFINITIVELY')}</button></div>`}
 if(voter)body+=voted?`<div class="locked-state">${copy('Évaluation du Juge enregistrée.','Judge assessment recorded.')}</div>`:`<article class="igr52-card"><small>${copy('ÉVALUATION SECRÈTE DU JUGE','SECRET JUDGE ASSESSMENT')}</small><p>${copy('Le Juge a-t-il volontairement faussé la procédure ? La majorité des votants présents décide (1/1, 2/2, 2/3).','Did the Judge deliberately distort the procedure? The majority of present voters decides (1/1, 2/2, 2/3).')}</p><div class="igr52-actions"><button class="btn danger" onclick="igr52Integrity(true)">${copy('OUI','YES')}</button><button class="btn primary" onclick="igr52Integrity(false)">${copy('NON','NO')}</button></div></article>`;
 if(room()?.scenario_id==='027'&&role()==='inspecteur'&&!st?.terror_runtime?.decision)body+=`<article class="igr52-card"><small>${copy('DOSSIER 027 · RECOMMANDATION EXTÉRIEURE','CASE 027 · EXTERNAL RECOMMENDATION')}</small><p>${copy('Verrouille aussi la recommandation extérieure avant la révélation.','Also lock the external recommendation before the reveal.')}</p><div class="igr52-actions"><button class="btn" onclick="igr52Terror('intervenir')">${copy('Intervenir','Intervene')}</button><button class="btn" onclick="igr52Terror('retarder')">${copy('Retarder','Delay')}</button><button class="btn ghost" onclick="igr52Terror('annuler')">${copy('Annuler','Cancel')}</button></div></article>`;
 if(role()==='journaliste')body+=locked?`<div class="locked-state">${copy('Ton angle final est verrouillé.','Your final angle is locked.')}</div>`:`<article class="igr52-map"><h3>${copy('Ton angle final personnel','Your personal final angle')}</h3><p>${special029?copy('Dossier 029 : défends un angle vérifiable, avec au moins 24 caractères.','Case 029: explain a verifiable angle in at least 24 characters.'):copy('Résume ce que tes publications permettent de conclure, avec au moins 8 caractères.','Summarize what your publications support, using at least 8 characters.')}</p><textarea id="igr52FinalNote" minlength="${special029?24:8}" maxlength="300"></textarea><button class="btn primary block" onclick="igr52Lock()">${copy('VERROUILLER MON ANGLE','LOCK MY ANGLE')}</button></article>`;
 if(!mineInv&&role()!=='journaliste')body+=`<div class="locked-state">${copy('Le camp Enquête verrouille ses dernières lectures. Attends la révélation.','The Investigation side is locking its final readings. Wait for the reveal.')}</div>`;
 return body}
function renderFinal(){
 const ph=room()?.phase;
 const court=ph==='final_suspect_defenses'&&judgePresent()&&room()?.state?.v52_stage==='courtroom';
 const intro=court?'':`<header><small>INSIDE GREY ROOM · FINAL</small><h2>${copy('Fin de l’enquête','End of investigation')}</h2><p>${judgePresent()?copy('Le tribunal commence directement après le cycle 3 : accusations, débats libres, conclusions et vote secret. Sans chronomètre.','The courtroom starts directly after cycle 3: charges, open debates, final submissions and secret voting. No countdown.'):copy('Le dossier est clos. On écoute les lectures, puis les défenses, avant une seule décision finale.','The case is closed. Hear the readings, then the defences, before one final decision.')}</p></header>${flow()}`;
 return `<section class="igr52-page ${court?'igr712-court-page':''}">${intro}${ph==='final_audience'?audience():ph==='final_suspect_defenses'&&judgePresent()&&room()?.state?.v52_stage==='courtroom'?courtroomV708():ph==='final_suspect_defenses'?defense():ph==='locking'?reassessment():''}${recovery()}</section>`;
}

function finalRules(){if(judgePresent())return `<section class="igr52-rules"><h2>${copy('Tribunal unique → Vote secret','Single courtroom → Secret ballot')}</h2><ol><li>${copy('Dès la fin du cycle 3, le Juge ouvre le tribunal. Aucune Audience préalable. Disposition conseillée mais facultative.','Immediately after cycle 3 the Judge opens court. No separate hearing. Seating chart is optional.')}</li><li>${copy('Accusations du Procureur (sinon Enquêteur), débats libres et confrontations sans chronomètre, puis réquisitions, réponses des avocats et dernier mot de chaque suspect.','Charges by the Prosecutor (otherwise Investigator), free debate without a timer, then final submissions, lawyer responses and each defendant’s final word.')}</li><li>${copy('Le Juge suit un aide-mémoire facultatif. L’application enregistre les étapes et les confirmations des suspects, sans enregistrer la parole. Clôture protégée, vote secret après.','The Judge sees an optional checklist. The app tracks stages and defendants’ confirmations, not speech. Protected closure, then secret voting.')}</li></ol><p>${copy('Dossier 029 : rapport et témoins spécifiques conservés. Sans Juge : Audience et défenses habituelles inchangées.','Case 029: its special witness report remains. Without a Judge, the usual hearing and defence remain unchanged.')}</p></section>`;return `<section class="igr52-rules"><div class="igr52-rule-head"><small>${copy('FIN DU CYCLE 3','END OF CYCLE 3')}</small><h2>${copy('Audience finale','Final hearing')}</h2></div><ol><li><b>${copy('Audience des rôles','Role hearing')}</b> — ${copy('Enquêteur → Analyste → Inspecteur → Expert → Procureur → Journaliste (selon les rôles présents). COURT 1 min / LONG 2 min maximum. Chacun peut passer.','Investigator → Analyst → Inspector → Expert → Prosecutor → Journalist (only roles present). SHORT 1 min / LONG 2 min maximum. Everyone may skip.')}</li><li><b>${copy('Défenses des suspects','Suspect defences')}</b> — ${copy('Chaque suspect peut parler 2 minutes en COURT ou 3 en LONG, ou passer. Son Avocat officiel partage ce temps : il n’existe plus de second plaidoyer séparé.','Each suspect may speak for 2 minutes in SHORT or 3 in LONG, or skip. Their official Lawyer shares that time: there is no second separate plea.')}</li><li><b>${copy('Décision finale','Final decision')}</b> — ${copy('Après les défenses, chaque membre habilité du camp Enquête vote secrètement : 0 aucune, 1 secondaire, 2 principale. Une majorité absolue est requise par suspect. Sans majorité : indéterminé. Le Journaliste verrouille séparément son angle.','After defences, eligible Investigation players privately vote 0 none, 1 secondary, 2 primary. A strict majority is required per Suspect; without one, the verdict is unresolved. The Journalist separately locks a personal angle.')}</li></ol><p><b>${copy('Important :','Important:')}</b> ${copy('aucun nouvel élément ne peut être créé après la fermeture du cycle 3.','no new evidence can be created after cycle 3 closes.')}</p></section>`}
function injectNow(){if(!finalPhases.has(room()?.phase)){document.getElementById('igr52Now')?.remove();return;}document.getElementById('igr51Now')?.remove();const host=document.querySelector('.phase-strip');if(!host)return;const text=room().phase==='final_audience'?copy('Suis l’ordre de passage. Parle ou passe lorsque l’application t’appelle. Tous peuvent passer, y compris le Juge.','Follow the speaking order. Speak or skip when the app calls you. Everyone may skip, including the Judge.'):room().phase==='final_suspect_defenses'?judgePresent()?copy('Tribunal unique : le Juge suit les étapes, les défenses et le dernier mot. Aucun chronomètre.','Single courtroom: the Judge directs stages, defence and final word. No countdown.'):copy('Chaque suspect choisit s’il utilise sa défense finale (COURT 2 min / LONG 3 min). L’Avocat officiel partage ce temps.','Each suspect chooses whether to use their final defence (SHORT 2 min / LONG 3 min). The official Lawyer shares that time.'):copy('Après les défenses, le camp Enquête verrouille une seule lecture définitive et le Journaliste son angle personnel.','After the defences, the Investigation side locks one final reading and the Journalist their personal angle.');const existing=document.getElementById('igr52Now');if(existing?.dataset.guidance===text)return;existing?.remove();const e=document.createElement('section');e.dataset.guidance=text;e.id='igr52Now';e.className='igr52-now';e.innerHTML=`<small>${copy('QUE FAIRE MAINTENANT ?','WHAT TO DO NOW?')}</small><p>${esc(text)}</p>`;host.insertAdjacentElement('afterend',e)}
function tickTimers(){document.querySelectorAll('[data-igr705-close-at]').forEach(el=>el.disabled=!(room()?.state?.v705_defense_done||Date.now()>=Number(el.dataset.igr705CloseAt)));document.querySelectorAll('[data-igr59-recovery-at]').forEach(el=>{el.disabled=Date.now()<Number(el.dataset.igr59RecoveryAt)});document.querySelectorAll('[data-igr52-timer]').forEach(el=>el.textContent=clock(secsLeft()));if(finalPhases.has(room()?.phase))document.getElementById('igr51Now')?.remove()}
const v708style=document.createElement('style');v708style.dataset.igrCourtroom='v712';v708style.textContent=`
/* v712 — A spacious, graphite-and-parchment courtroom, no gamified spectacle. */
.igr52-page:has(.igr712-hero){gap:18px;max-width:1000px;margin:0 auto}
.igr52-page .igr712-hero,.igr52-page .igr712-block,.igr52-page .igr712-controls,.igr52-page .igr712-defendants,.igr52-page .igr712-role{box-sizing:border-box;border:1px solid #292d30;border-radius:20px;background:#101214;color:#efede7;box-shadow:0 8px 28px rgba(0,0,0,.12)}
.igr52-page .igr712-hero{padding:clamp(22px,5vw,36px);background:radial-gradient(ellipse at 94% 3%,rgba(184,151,105,.14),transparent 38%),linear-gradient(155deg,#17191a,#090b0d);border-color:#454139;display:grid;gap:15px;position:relative;overflow:hidden}
.igr712-hero:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:#b49a72}
.igr712-hero-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.igr52-page .igr712-hero-eyebrow{font:700 11px 'IBM Plex Mono',monospace;letter-spacing:.14em;color:#d7c09a}
.igr712-unclocked{border:1px solid #4e473b;border-radius:999px;padding:7px 12px;color:#c4c0b7;font-size:11px;letter-spacing:.02em}
.igr712-hero-number{font:600 clamp(38px,8vw,56px) 'IBM Plex Mono',monospace;letter-spacing:-.07em;line-height:1;color:#d5c1a1}
.igr712-hero-number span{font-size:14px;letter-spacing:0;color:#7e8587}
.igr52-page .igr712-hero h2{font-size:clamp(21px,5vw,30px);font-weight:600;line-height:1.2;letter-spacing:-.02em}
.igr52-page .igr712-hero p{color:#c4c7c6;font-size:14px;line-height:1.65;max-width:640px;margin:0}
.igr712-timeline{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:10px}
.igr712-timeline-stage{display:grid;align-content:start;gap:7px;min-width:0}
.igr712-timeline-stage>span{min-width:30px;min-height:30px;display:grid;place-items:center;width:fit-content;padding:0 6px;border:1px solid #33393b;background:#1b2022;border-radius:8px;font:700 12px 'IBM Plex Mono',monospace;color:#9ba2a3}
.igr712-timeline-stage>small{font-size:10px;line-height:1.5;color:#9ca5a7;overflow-wrap:anywhere;letter-spacing:.01em}
.igr712-timeline-stage.is-active>span{border-color:#b89d74;background:#b89d74;color:#141414}
.igr712-timeline-stage.is-active>small{color:#f0eee9;font-weight:650}
.igr712-timeline-stage.is-past>span{color:#d3b991;border-color:#665844}
.igr712-timeline-stage.is-future{opacity:.65}
.igr52-page .igr712-role{display:grid;grid-template-columns:52px minmax(0,1fr);gap:17px;padding:21px 23px}
.igr712-role-mark{width:52px;height:52px;display:grid;place-items:center;border:1px solid #474339;border-radius:14px;background:#24231e;font:500 28px Georgia,serif;color:#dac19c}
.igr52-page .igr712-role h3{font-size:20px;margin:5px 0 7px}
.igr52-page .igr712-role p{font-size:14px;line-height:1.65;color:#c4c9ca;margin:0;max-width:730px}
.igr52-page .igr712-controls{padding:22px 24px;display:grid;gap:17px;border-color:#4c4336;background:linear-gradient(145deg,#1b1a18,#121413)}
.igr712-controls-heading{display:grid;gap:4px}
.igr712-controls-heading h3{font-size:18px;letter-spacing:-.01em;margin:0}
.igr52-page .igr712-main-action{width:100%;min-height:50px!important;white-space:normal;line-height:1.35;padding:13px 16px!important;font-size:13px!important;border-radius:12px}
.igr712-action-row{display:grid;grid-template-columns:1fr 1.45fr;gap:10px}
.igr712-action-row .btn{min-height:50px!important;white-space:normal;line-height:1.4}
.igr52-page .igr712-controls .btn:disabled{opacity:.45;cursor:not-allowed}
.igr712-note,.igr712-footnote{color:#aab0b0;font-size:12px;line-height:1.6;margin:0}
.igr52-page .igr712-block{padding:0;overflow:hidden}
.igr708-seating>summary{list-style:none;display:grid;grid-template-columns:40px minmax(0,1fr) 20px;gap:13px;align-items:center;cursor:pointer;padding:20px 24px}
.igr708-seating>summary::-webkit-details-marker{display:none}
.igr708-seating>summary strong{display:block;font-size:17px;color:#efede7}
.igr708-seating>summary small{display:block;margin-top:3px;font-size:12px;color:#a6acae}
.igr712-summary-icon{width:40px;height:40px;border:1px solid #454039;background:#22211e;border-radius:12px;display:grid;place-items:center;color:#d3b992;font-size:24px}
.igr712-chevron{color:#aaa;font-size:23px;transition:transform .15s ease}
.igr708-seating[open] .igr712-chevron{transform:rotate(180deg)}
.igr712-seating-inner{padding:2px 24px 23px;display:grid;gap:14px}
.igr712-seating-top{display:grid;gap:8px;justify-items:center}
.igr712-rail-label{font:700 10px 'IBM Plex Mono',monospace;color:#c0aa88;letter-spacing:.13em}
.igr708-bench{min-width:min(280px,100%);max-width:100%;display:flex;align-items:center;justify-content:center;gap:15px;text-align:left;padding:16px 22px;border-radius:13px;background:#25231f;border:1px solid #564d40}
.igr708-bench>span{font-size:25px;color:#dbc5a3}
.igr708-bench strong{display:block;color:#faf5eb;font-size:15px}
.igr708-bench small{display:block;margin-top:5px;font-size:12px;color:#c6c4c0}
.igr708-bench .igr712-seat-person{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.igr708-bench .igr712-seat-person b{font-size:12px}
.igr708-bench .igr712-seat-person small{margin:0;font-size:11px}
.igr708-sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.igr712-seat-side,.igr712-seating-gallery{border:1px solid #313638;background:#15191a;border-radius:14px;padding:16px;display:grid;align-content:start;gap:14px;min-width:0}
.igr712-seat-people{display:grid;gap:8px}
.igr712-seat-person{min-width:0;border-radius:10px;padding:10px 11px;background:#222729;border:1px solid #363b3d;display:grid;gap:3px}
.igr712-seat-person b{font-size:12px;color:#f4f1e9;overflow-wrap:anywhere}
.igr712-seat-person small{font-size:11px;color:#aeb6b7}
.igr712-seat-empty{color:#7f8a8c;font-size:12px}
.igr712-seating-gallery .igr712-seat-people{grid-template-columns:repeat(auto-fit,minmax(125px,1fr))}
.igr712-seat-disclaimer{margin:2px 0 0;color:#a0a6a6;font-size:12px;line-height:1.55;text-align:center}
.igr708-agenda{padding:22px 24px!important;display:grid;gap:14px}
.igr712-block-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.igr712-block-head h3{font-size:19px;margin:6px 0 0}
.igr712-counter{display:inline-grid;place-items:center;min-width:55px;padding:8px 10px;border:1px solid #464038;background:#292720;border-radius:9px;font:700 12px 'IBM Plex Mono',monospace;color:#e0c69f}
.igr712-guide-note{font-size:12px;line-height:1.6;color:#a9b0b0;margin:0}
.igr712-topic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.igr708-topic{width:100%;min-height:90px;display:grid;grid-template-columns:27px minmax(0,1fr) 18px;align-items:start;gap:10px;text-align:left;padding:15px;border:1px solid #32393b;border-radius:12px;background:#191e1f;color:#eeece6;cursor:pointer;font:inherit;transition:background .15s ease,border-color .15s ease}
.igr708-topic:hover{background:#242929;border-color:#7a6a51}
.igr708-topic:focus-visible,.igr712-controls button:focus-visible,.igr708-seating summary:focus-visible{outline:2px solid #d9bc8e;outline-offset:3px}
.igr708-topic.is-complete{border-color:#75644a;background:#292720}
.igr712-topic-index{font:700 11px 'IBM Plex Mono',monospace;color:#bbaa8d;margin-top:3px}
.igr712-topic-content{display:grid;gap:6px}
.igr712-topic-content b{font-size:13px;line-height:1.4}
.igr712-topic-content small{color:#abb3b3;font-size:12px;line-height:1.5}
.igr712-topic-check{font-size:19px;color:#d7b98d;line-height:1}
.igr52-page .igr712-defendants{padding:22px 24px;display:grid;gap:16px}
.igr712-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.igr712-metrics>div{background:#1d2223;border:1px solid #303739;border-radius:12px;padding:13px 16px;display:grid;gap:2px}
.igr712-metrics b{font-size:26px;line-height:1.1;font-weight:600;color:#e6d0b0}
.igr712-metrics b span{color:#8b9394;font-size:13px}
.igr712-metrics small{color:#a8b0b0;font-size:11px}
.igr712-defendant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:9px}
.igr712-defendant{display:grid;gap:10px;padding:14px 15px;background:#161a1b;border:1px solid #303739;border-radius:12px;min-width:0}
.igr712-defendant>strong{font-size:14px;overflow-wrap:anywhere}
.igr712-defendant.is-absent{opacity:.62}
.igr712-defendant-flags{display:flex;flex-wrap:wrap;gap:7px}
.igr712-defendant-flags>span{padding:5px 7px;background:#25292a;border-radius:7px;font-size:11px;color:#a4acac}
.igr712-defendant-flags>span.done{color:#e7ceaa;background:#373126}
.igr52-page .igr712-footnote{margin:0}
@media(max-width:680px){
 .igr52-page .igr712-hero,.igr52-page .igr712-role,.igr52-page .igr712-controls,.igr52-page .igr712-defendants{padding:19px}
 .igr708-seating>summary{padding:18px}
 .igr712-seating-inner{padding:0 17px 18px}
 .igr708-agenda{padding:19px!important}
 .igr712-topic-grid{grid-template-columns:1fr}
 .igr712-defendant-grid{grid-template-columns:1fr}
 .igr712-timeline-stage small{font-size:9px}
}
@media(max-width:430px){
 .igr708-sides{grid-template-columns:1fr}
 .igr712-timeline{gap:3px}
 .igr712-timeline-stage>span{min-width:25px;min-height:26px}
 .igr712-hero-top{align-items:flex-start}
 .igr712-action-row{grid-template-columns:1fr}
 .igr52-page .igr712-role{grid-template-columns:40px minmax(0,1fr);gap:11px}
 .igr712-role-mark{width:40px;height:40px;font-size:24px}
}
@media(prefers-reduced-motion:reduce){.igr708-topic,.igr712-chevron{transition:none}}

/* Final secret ballot: large, readable choices and meaningful completion progress. */
.igr52-page .igr712-ballot-hero{padding:clamp(20px,4vw,29px);display:grid;gap:14px;background:linear-gradient(160deg,#1b1e1e,#111414);border-color:#484036}
.igr52-page .igr712-ballot-hero h3{font-size:clamp(21px,4vw,27px);line-height:1.2;letter-spacing:-.02em;color:#f4efe7}
.igr52-page .igr712-ballot-hero>p{font-size:13px;line-height:1.65;color:#c5cccc;max-width:660px;margin:0}
.igr712-ballot-scale{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.igr712-ballot-scale>div{border:1px solid #373d3d;background:#222727;border-radius:12px;padding:15px;display:grid;justify-items:center;gap:7px}
.igr712-ballot-scale b{font:600 24px 'IBM Plex Mono',monospace;color:#e5cba4}
.igr712-ballot-scale span{font-size:12px;line-height:1.4;color:#c4cbca;text-align:center}
.igr52-page .igr712-ballot-majority{padding:12px 14px;border-left:3px solid #b79e78;border-radius:0 9px 9px 0;background:#28251f;font-size:12px;line-height:1.6;color:#ded2bd}
.igr712-ballot-status{display:grid;gap:9px}
.igr712-ballot-status>div:first-child{display:flex;justify-content:space-between;align-items:center;gap:10px}
.igr712-ballot-status>div:first-child span{font:700 10px 'IBM Plex Mono',monospace;letter-spacing:.11em;color:#aeb7b4}
.igr712-ballot-status>div:first-child b{font:700 13px 'IBM Plex Mono',monospace;color:#e2c89e}
.igr712-ballot-bar{height:7px;background:#343a3a;border-radius:30px;overflow:hidden}
.igr712-ballot-bar>span{height:100%;display:block;background:#bda47f;border-radius:inherit;transition:width .2s ease}
.igr52-page:has(.igr712-ballot-hero) .igr52-map{padding:22px 24px;background:#151919;border-color:#343b3b;border-radius:18px;display:grid;gap:16px}
.igr52-page:has(.igr712-ballot-hero) .igr52-map h3{font-size:18px}
.igr52-page:has(.igr712-ballot-hero) .igr52-map textarea{min-height:76px}
@media(max-width:430px){.igr52-page .igr712-ballot-scale>div{padding:12px 7px}.igr52-page:has(.igr712-ballot-hero) .igr52-map{padding:17px}}
@media(prefers-reduced-motion:reduce){.igr712-ballot-bar>span{transition:none}}
`;document.head.appendChild(v708style);
const style=document.createElement('style');style.textContent=`.igr52-page{display:grid;gap:14px}.igr52-page>header,.igr52-card,.igr52-live,.igr52-map,.igr52-rules{padding:15px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:#0a0f14}.igr52-page header small,.igr52-card small,.igr52-live small,.igr52-map small,.igr52-rules small,.igr52-now small{font:700 10px 'IBM Plex Mono',monospace;letter-spacing:.13em;color:#8f99a2}.igr52-page h2,.igr52-page h3,.igr52-rules h2{margin:0}.igr52-page p,.igr52-rules p{color:#aeb7bf;line-height:1.48}.igr52-flow{display:flex;gap:6px;overflow:auto}.igr52-flow span{white-space:nowrap;padding:7px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.09);font-size:11px;color:#78828b}.igr52-flow .on{color:#fff;border-color:rgba(255,255,255,.28);background:#151c22}.igr52-actions{display:flex;gap:8px;flex-wrap:wrap}.igr52-actions>*{flex:1;min-width:135px}.igr52-level{display:grid;grid-template-columns:1fr minmax(150px,220px);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}.igr52-level select,.igr52-map textarea{width:100%}.igr52-map{display:grid;gap:8px}.igr52-timer{font:700 38px 'IBM Plex Mono',monospace;letter-spacing:.03em}.igr52-lawyer-note,.igr52-progress{padding:9px 11px;border:1px solid rgba(255,255,255,.08);border-radius:11px;color:#c7cdd2}.igr52-now{margin:10px 0 12px;padding:11px 13px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#0d1318}.igr52-now p{margin:4px 0 0;color:#c2c9cf}.igr52-rules{margin-top:16px}.igr52-rules ol{padding-left:20px;color:#c8ced3;display:grid;gap:8px}@media(max-width:680px){.igr52-level{grid-template-columns:1fr}.igr52-actions>*{min-width:100%}}`;document.head.appendChild(style);
const basePhaseLabel=typeof window.phaseLabel==='function'?window.phaseLabel:(typeof phaseLabel==='function'?phaseLabel:null);if(basePhaseLabel){const f=function(ph){const labels={final_audience:copy('AUDIENCE FINALE','FINAL HEARING'),final_suspect_defenses:judgePresent()?copy('TRIBUNAL','COURTROOM'):copy('DÉFENSES FINALES','FINAL DEFENCES')};return labels[ph]||basePhaseLabel.apply(this,arguments)};try{phaseLabel=f}catch(_){}window.phaseLabel=f}
const baseTabs=typeof window.gameTabs==='function'?window.gameTabs:(typeof gameTabs==='function'?gameTabs:null);if(baseTabs){const f=function(){const t=baseTabs.apply(this,arguments)||[];if(finalPhases.has(room()?.phase)&&!t.some(x=>x?.id==='final52')){const i=t.findIndex(x=>x?.id==='rules');t.splice(i>=0?i:t.length,0,{id:'final52',label:copy('Finale','Final')})}return t};try{gameTabs=f}catch(_){}window.gameTabs=f}
const baseTab=typeof window.renderGameTab==='function'?window.renderGameTab:(typeof renderGameTab==='function'?renderGameTab:null);if(baseTab){const f=function(){if(['final52','investigation'].includes(S()?.tab)&&finalPhases.has(room()?.phase))return renderFinal();const out=baseTab.apply(this,arguments);if(S()?.tab==='rules')return String(out||'')+finalRules();return out};try{renderGameTab=f}catch(_){}window.renderGameTab=f}
const baseGame=typeof window.renderGame==='function'?window.renderGame:(typeof renderGame==='function'?renderGame:null);let last='';if(baseGame){const f=function(){const ph=room()?.phase;if(finalPhases.has(ph)&&ph!==last){S().tab='final52';last=ph;try{window.saveSession?.()}catch(_){}}const out=baseGame.apply(this,arguments);setTimeout(()=>{injectNow();tickTimers()},0);return out};try{renderGame=f}catch(_){}window.renderGame=f}
const baseRules=typeof window.renderRules==='function'?window.renderRules:(typeof renderRules==='function'?renderRules:null);if(baseRules){const f=function(){const out=baseRules.apply(this,arguments);setTimeout(()=>{const panel=document.querySelector('.page .panel');if(panel&&!panel.querySelector('.igr52-rules'))panel.insertAdjacentHTML('beforeend',finalRules())},0);return out};try{renderRules=f}catch(_){}window.renderRules=f}
setInterval(()=>{tickTimers();injectNow()},1000);
window.IGR_FINAL_AUDIENCE_V52=Object.freeze({version:VERSION,renderFinal,finalRules});
console.info(`[IGR ${VERSION}] active`);
})();
