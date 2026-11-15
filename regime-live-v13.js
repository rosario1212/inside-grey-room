/* Inside Grey Room — LE RÉGIME v13 shared trial and pursuit candidate.
 * GATED: without a server-pinned private Regime room this renders nothing.
 * Public UI cannot load the variant, sealed truth, active hiding network or
 * another player's private instructions.
 */
(()=>{
'use strict';
const VERSION='regime-v13-candidate';
const ids=new Set(['032','033','034']);
const me=()=>{try{return STATE?.sync?.player||null}catch{return null}};
const room=()=>{try{return STATE?.sync?.room||null}catch{return null}};
const session=()=>{try{return STATE||null}catch{return null}};
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const can=()=>ids.has(String(room()?.scenario_id||''))&&
 room()?.status==='playing'&&session()?.view==='game'&&
 room()?.state?.regime_v13_active===true;
let cache=null,lastPoll=0,lastKey='',inflight=false,lastRender='';
function key(){return [session()?.room,session()?.token,room()?.cycle,room()?.phase].join(':')}
function pending(){return (cache?.pending_mandates||[]).filter(x=>x.status==='awaiting_judge')}
const thisActor=()=>cache?.actor_id||'';
const isRole=r=>me()?.public_role===r;
const cast=()=>Array.isArray(cache?.cast)?cache.cast:[];
const person=id=>cast().find(p=>p.actor_id===id)?.pseudo||id;
const req=()=>globalThis.crypto?.randomUUID?.()||('igr-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const rpcSafe=async(name,args)=>{
 if(typeof window.rpc!=='function')throw Error('Connexion au serveur indisponible');
 return window.rpc(name,{p_code:session().room,p_player_token:session().token,...args});
};
function toast(s){window.toast?.(s)}
async function call(name,args){
 try{const result=await rpcSafe(name,args);toast('Action enregistrée.');cache=null;lastRender='';
 await window.syncNow?.(true);await poll(true);return result}
 catch(e){toast(e?.message||'Action refusée par le serveur');return null}
}
async function poll(force=false){
 if(!can()){cache=null;document.getElementById('igr-regime-v13')?.remove();return}
 const k=key(),now=Date.now();
 if(!force&&inflight)return;
 if(!force&&k===lastKey&&now-lastPoll<3800)return;
 lastPoll=now;lastKey=k;inflight=true;
 try{
  const result=await rpcSafe('igr_regime_v13_state',{});
  if(k!==key())return;
  cache=result?.enabled===true?result:null;
  render();
 }catch(e){cache=null;document.getElementById('igr-regime-v13')?.remove()}
 finally{inflight=false}
}
function button(label,action,attrs=''){return '<button type="button" data-igr-regime="'+esc(action)+'" '+attrs+'>'+esc(label)+'</button>'}
function section(title,body,klass=''){return '<section class="igr-rg13-section '+klass+'"><h4>'+esc(title)+'</h4>'+body+'</section>'}
function labelFor(s){return ({enqueteur:'ENQUÊTEUR',analyste:'ANALYSTE',juge:'JUGE',procureur:'PROCUREUR',suspect:'SUSPECT'})[s]||s}
function myCard(){
 const c=cache?.my_card;if(!c)return '';
 let out='<p class="igr-rg13-muted"><b>'+esc(c.identity)+'</b></p>';
 out+='<details><summary>Ce que tu sais</summary><p>'+esc(c.what_you_know)+'</p></details>';
 out+='<details><summary>Ce que tu caches</summary><p>'+esc(c.what_you_hide)+'</p></details>';
 out+='<p><b>Ton objectif :</b> '+esc(c.objective)+'</p>';
 return section('TON PERSONNAGE',out);
}

function scene(){
 const beat=cache?.scene;
 if(!beat||Number(beat.cycle)!==Number(cache.cycle))return '';
 return '<section class="igr-rg13-scene" aria-label="Scène du cycle">'+
  '<small>KARSANE · RECONSTITUTION DU CYCLE '+esc(beat.cycle)+'</small>'+
  '<h4>'+esc(beat.title)+'</h4><p>'+esc(beat.text)+'</p>'+
  '<span>Constat de contexte · pas une preuve d’identité ou de culpabilité</span></section>';
}
function capturedDefense(){
 const d=cache?.my_captured_objective;
 if(!d)return '';
 if(cache.my_captured_response_used)return section('DÉFENSE D’UN DIRIGEANT CAPTURÉ',
  '<p>Ton intervention pour ce cycle est enregistrée. Le tribunal pourra la confronter à des pièces indépendantes.</p>');
 const others=cast().filter(x=>x.actor_id!==thisActor());
 const options=others.map(x=>'<option value="'+esc(x.actor_id)+'">'+esc(x.pseudo)+'</option>').join('');
 return section('DÉFENSE APRÈS ARRESTATION · CYCLE '+esc(cache.cycle),
  '<p>'+esc(d.objective)+'</p>'+
  '<p><b>Acte discuté :</b> '+esc(d.act_title)+'. Tu ne contestes ici que la personne ayant donné cet ordre précis.</p>'+
  '<label>Qui aurait personnellement donné cet ordre ?<select id="igrRgCapturedOrderer">'+options+'</select></label>'+
  '<label>Ta déclaration datée<textarea id="igrRgCapturedStatement" rows="3" maxlength="350" '+
   'placeholder="Explique en quoi cet ordre ne venait pas de toi et cite un fait vérifiable"></textarea></label>'+
  '<p>Tu disposes d’un choix par cycle après arrestation. Un extrait authentique peut aussi révéler des éléments qui t’accablent.</p>'+
  button('PRODUIRE UN EXTRAIT AUTHENTIQUE','captured-exhibit')+
  button('DÉPOSER UNE CONTESTATION','captured-challenge'));
}
function alliance(){
 if(!cache?.my_fugitive_options?.length&&!['vahran_director','interior_minister',
 'presidential_heir','defense_minister','fallen_president','presidential_security'].includes(thisActor()))return '';
 if(cache?.my_alliance_choice)return section('L’ALLIANCE','<p>Ton choix a été enregistré. Les décisions des autres fugitifs restent secrètes.</p>');
 if(Number(cache?.cycle)>1)return '';
 return section('ALLIANCE SECRÈTE',
 '<p>Rejoindre le même réseau uniquement si les deux dirigeants l’acceptent. Sinon, ils fuient séparément.</p>'+
 button('SE REGROUPER','alliance-together')+
 button('SE SÉPARER','alliance-apart'),'igr-rg13-alliance');
}
function actions(){
 if(!Array.isArray(cache?.my_fugitive_options)||!cache.my_fugitive_options.length)return '';
 if(cache.my_fugitive_decision_used)return section('CONTRE-DÉCISION','<p>Une décision a déjà été enregistrée pour ce cycle.</p>');
 return section('DÉCISION DE FUITE · CYCLE '+cache.cycle,
 '<p>Chaque décision présente un bénéfice et un coût. Le résultat peut modifier la traque immédiatement.</p>'+
 '<div class="igr-rg13-choices">'+cache.my_fugitive_options.map(a=>'<article><b>'+esc(a.label)+'</b>'+
 '<p>'+esc(a.effect_description||'')+'</p><small>CONTREPARTIE : '+esc(a.cost_description||'')+'</small>'+
 button('CONFIRMER','move','data-option-id="'+esc(a.id)+'"')+'</article>').join('')+'</div>');
}
function investigations(){
 if(!['enqueteur','analyste'].includes(cache?.role)||!Array.isArray(cache?.offered_investigations))return '';
 if(cache.investigation_used_this_cycle)return section('INVESTIGATION',
 '<p>Le camp Enquête a déjà sélectionné son investigation collective de ce cycle.</p>');
 return section('INVESTIGATIONS · CYCLE '+cache.cycle,
 '<p>Choisissez un seul axe. Les pièces garanties continuent de paraître indépendamment de vos choix.</p>'+
 '<div class="igr-rg13-choices">'+cache.offered_investigations.map(x=>
 '<article><b>'+esc(x.label)+'</b>'+button('EXAMINER','investigate','data-option-id="'+esc(x.id)+'"')+'</article>').join('')+'</div>');
}
function evidence(){
 const docs=Array.isArray(cache?.public_evidence)?cache.public_evidence:[];
 if(!docs.length)return '';
 return section('DOSSIER DES PREUVES · '+docs.length+' pièces',
 '<details><summary>Ouvrir les documents publiés</summary>'+
 docs.map(d=>'<div class="igr-rg13-proof"><small>'+esc(d.kind==='capture'?'PISTE DE TRAQUE':'PIÈCE D’ENQUÊTE')+
 ' · '+esc(d.source||d.origin||'Document public')+'</small><strong>'+esc(d.title||'Document')+'</strong>'+
 '<p>'+esc(d.text||'')+'</p>'+(d.kind==='capture'&&d.network_label?'<p><b>Refuge : '+esc(d.network_label)+'</b></p>':'')+'</div>').join('')+'</details>');
}
function warrants(){
 if(!isRole('enqueteur'))return '';
 const suspects=cast().slice(0,2);
 const clues=(cache?.public_evidence||[]).filter(x=>x.kind==='capture'&&x.network_id);
 const hideouts=Array.isArray(cache?.public_networks)?cache.public_networks:[];
 const choices=clues.map(x=>'<option value="'+esc(x.id)+'" data-target="'+
  esc(x.target_id)+'" data-network="'+esc(x.network_id)+'">'+
  esc(person(x.target_id))+' · '+esc(x.network_label||x.network_id)+
  ' · '+esc(x.source||x.id)+'</option>').join('');
 return section('MANDATS D’INTERPELLATION',
 '<p>Choisis un refuge réel et deux traces datées de sources indépendantes, concernant le même fugitif et ce refuge. Les lieux possibles sont connus, mais pas les cachettes utilisées.</p>'+
 '<div class="igr-rg13-form"><label>Cible<select id="igrRgTarget">'+
 suspects.map(x=>'<option value="'+esc(x.actor_id)+'">'+esc(x.pseudo)+'</option>').join('')+'</select></label>'+
 '<label>Refuge à vérifier<select id="igrRgTrack">'+
 hideouts.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join('')+'</select></label>'+
 '<label>Première trace<select id="igrRgE1"><option value="">— Première source —</option>'+
 choices+'</select></label>'+
 '<label>Deuxième trace<select id="igrRgE2"><option value="">— Seconde source indépendante —</option>'+
 choices+'</select></label>'+
 button('SOUMETTRE LE MANDAT AU JUGE','warrant')+'</div>');
}
function judge(){
 if(!isRole('juge'))return '';
 const list=pending();
 return section('CONTRÔLE JUDICIAIRE',
 list.length?list.map(x=>'<article class="igr-rg13-warrant"><b>'+esc(person(x.target_id))+'</b>'+
 '<p>Hypothèse : '+esc(x.track_choice==='together'?'Réseau commun':'Réseaux séparés')+
 ' · Pièces : '+esc((x.evidence_ids||[]).join(', '))+'</p>'+
 button('RECEVOIR LE MANDAT','judge-allow','data-mandate-id="'+esc(x.id)+'"')+
 button('ÉMETTRE UNE OBJECTION','judge-contest','data-mandate-id="'+esc(x.id)+'"')+
 '</article>').join(''):'<p>Aucun mandat en attente. Les preuves scellées demeurent inconnues du Juge.</p>');
}
function third(){
 if(!cache?.my_mission)return '';
 const m=cache.my_mission;
 if(cache.third_submitted)return section('MISSION PERSONNELLE','<p>Ta pièce ou ta défense a été enregistrée. Prépare ta déclaration au tribunal.</p>');
 const coop=m.assigned_path==='cooperate';
 return section('TROISIÈME SUSPECT · '+(coop?'COOPÉRATION':'PROTECTION'),
 '<p>Tu dois intervenir avant la fin du cycle 2. Ton résultat est indépendant des captures des dirigeants.</p>'+
 (coop?'<p>Remettre la pièce authentique issue de ton dossier. Sa publication pourra aussi te compromettre.</p>'+
 button('REMETTRE L’ORIGINAL','third-submit'):
 '<label>Ta défense sur l’acte désigné<textarea id="igrRgDefense" maxlength="600" rows="3" placeholder="Explique ta responsabilité et conteste les accusations précises"></textarea></label>'+
 button('DÉPOSER LA DÉFENSE','third-submit')));
}
function court(){
 if(cache?.phase!=='regime_court')return '';
 const c=cache?.court||{},long=Number(c.duration_minutes)===14;
 const calls=c.called||[],stage=c.stage_actual||'opening';
 const arrested=cache?.arrests||{};
 const present=cast().filter((person,i)=>i===2||Object.hasOwn(arrested,person.actor_id));
 const absent=cast().filter((person,i)=>i<2&&!Object.hasOwn(arrested,person.actor_id));
 const current=c.current?.actor_id,exchanges=Array.isArray(c.exchanges)?c.exchanges:[];
 const stageLabels={opening:'OUVERTURE DU PROCÈS',defenses:'DÉCLARATIONS DES ACCUSÉS',
 confrontation:'CONFRONTATION · QUESTIONS ET OBJECTIONS',closing:'CLÔTURE DU JUGE',
 vote:'DÉLIBÉRATION · VOTE FINAL'};
 const judgeUI=isRole('juge')&&stage==='defenses'?
  '<div class="igr-rg13-call"><b>APPEL À LA BARRE · UNE PERSONNE PAR CRÉNEAU</b>'+
   present.filter(x=>!calls.includes(x.actor_id)).map(x=>
    button('APPELER '+x.pseudo,'court-call','data-actor-id="'+esc(x.actor_id)+'"')).join('')+
   '</div>':'';
 const courtroomRoles=new Set(['enqueteur','analyste','procureur']);
 const myPresent=cache?.role==='suspect'&&present.some(x=>x.actor_id===thisActor());
 const myAccusation=courtroomRoles.has(cache?.role);
 const ruled=new Set(exchanges.filter(x=>x.kind==='ruling').map(x=>x.reply_to));
 const discussion=stage==='confrontation'?
  section('CONTRE-INTERROGATOIRE',
   '<p>Le Juge dirige les échanges. Questions, réponses et objections sont visibles par tous; aucune intervention ne modifie les preuves scellées.</p>'+
   '<div class="igr-rg13-exchanges">'+(exchanges.length?
     exchanges.slice(-18).map(x=>'<article><small>'+esc(x.pseudo)+' · '+esc(
      {question:'QUESTION',reply:'RÉPONSE',objection:'OBJECTION',ruling:'DÉCISION DU JUGE'}[x.kind]||x.kind)+
      '</small><p>'+esc(x.text)+'</p></article>').join(''):
     '<p>Aucune intervention consignée dans cette confrontation.</p>')+'</div>'+
   ((myAccusation||myPresent)?
     '<label>Intervention<textarea rows="2" maxlength="280" id="igrRgExchangeText" placeholder="Cite un fait précis et pose une question courte"></textarea></label>'+
     (myAccusation?button('POSER UNE QUESTION','court-question'):'')+
     (myPresent?button('RÉPONDRE','court-reply'):'')+
     button('SOULEVER UNE OBJECTION','court-objection'):'')+
   (isRole('juge')?
     exchanges.filter(x=>x.kind==='objection'&&!ruled.has(x.id)).map(x=>
      '<article class="igr-rg13-ruling"><strong>Objection de '+esc(x.pseudo)+'</strong>'+
      '<p>'+esc(x.text)+'</p>'+
      button('ACCUEILLIR','court-sustain','data-reply-to="'+esc(x.id)+'"')+
      button('REJETER','court-overrule','data-reply-to="'+esc(x.id)+'"')+'</article>').join(''):'')
   ):'';
 const docs=Array.isArray(cache?.public_evidence)?cache.public_evidence:[];
 const acts=Array.isArray(cache?.court_acts)?cache.court_acts:[];
 const options='<option value="unknown">NON ÉTABLI</option>'+cast().map(x=>
  '<option value="'+esc(x.actor_id)+'">'+esc(x.pseudo)+'</option>').join('');
 const select=(id,name)=>'<select data-court-act="'+esc(id)+'" data-court-field="'+name+'">'+options+'</select>';
 const proofOptions='<option value="">— Choisir une pièce —</option>'+
  docs.filter(x=>x.kind!=='capture').map(x=>
   '<option value="'+esc(x.id)+'">'+esc(x.title||x.id)+'</option>').join('');
 const reconstruction=['enqueteur','analyste'].includes(cache.role)?
 section('RECONSTITUTION DES QUATRE ACTES',
  cache.my_reconstruction_submitted?
   '<p>Ta reconstitution a été déposée. Le serveur garde le résultat scellé jusqu’à la révélation.</p>':
  '<p>Prépare les quatre attributions pendant les débats. Deux sources indépendantes par acte sont nécessaires. Le vote 0–2 habituel suivra ce procès.</p>'+
  acts.map(x=>'<article class="igr-rg13-act"><h5>'+esc(x.title)+'</h5>'+
    '<div class="igr-rg13-grid"><label>Ordonne'+select(x.id,'orderedBy')+'</label>'+
    '<label>Transmet'+select(x.id,'transmittedBy')+'</label>'+
    '<label>Exécute'+select(x.id,'executedBy')+'</label>'+
    '<label>Sait et contrôle'+select(x.id,'knewAndControlledBy')+'</label>'+
    '<label>Source 1<select data-court-act="'+esc(x.id)+'" data-court-field="evidence1">'+proofOptions+'</select></label>'+
    '<label>Source 2<select data-court-act="'+esc(x.id)+'" data-court-field="evidence2">'+proofOptions+'</select></label></div></article>').join('')+
    button('DÉPOSER LA RECONSTITUTION','reconstruct')):'';
 const thirdMission=cache?.my_mission;
 const thirdFinal=cache.role==='suspect'&&thirdMission?.assigned_path==='cooperate'?
 section('DÉCLARATION PERSONNELLE DU TROISIÈME SUSPECT',
  cache.my_third_final_submitted?
   '<p>Ta déclaration finale est enregistrée.</p>':
  '<p>Identifie le donneur d’ordre et reconnais ton implication. Tu peux gagner même si l’enquête se trompe.</p>'+
  '<label>Qui a réellement donné l’ordre ?<select id="igrRgThirdOrdered">'+options+'</select></label>'+
  '<label>Quelle a été ton implication ?<select id="igrRgThirdPart">'+
  '<option value="order">Donner l’ordre</option>'+
  '<option value="transmission">Transmettre</option>'+
  '<option value="execution">Exécuter</option>'+
  '<option value="knowledge">Savoir et pouvoir agir</option>'+
  '<option value="none">Aucune participation établie</option></select></label>'+
  button('VALIDER MA DÉCLARATION','third-final')):'';
 const count=Math.max(0,Number(c.stage_seconds_remaining)||0);
 return '<section class="igr-rg13-court"><header><small>TRIBUNAL SPÉCIAL · KARSANE</small>'+
  '<h2>LES ACCUSÉS À LA BARRE</h2><p>'+esc(long?
   'PROCÈS LONG · 14 MINUTES · 5 MINUTES DE CONFRONTATION':
   'PROCÈS COURT · 8 MINUTES')+'</p>'+
  '<strong id="igrRgCourtClock">—</strong><div class="igr-rg13-stage">'+esc(stageLabels[stage]||stage)+
  ' · '+Math.floor(count/60)+':'+String(count%60).padStart(2,'0')+'</div></header>'+
  '<div class="igr-rg13-bench"><div class="igr-rg13-judge">⚖ JUGE'+
  '<br><small>Présidence de séance</small></div>'+
  '<div class="igr-rg13-sides"><div><b>ACCUSATION</b>'+
  '<p>Enquêteur · Analyste · Procureur facultatif</p></div>'+
  '<div><b>MIS EN CAUSE</b>'+present.map(x=>
   '<p>'+esc(x.pseudo)+(current===x.actor_id?' · À LA BARRE':'')+'</p>').join('')+
   absent.map(x=>'<p class="igr-rg13-absent">'+esc(x.pseudo)+' · EN FUITE (siège vide)</p>').join('')+
  '</div></div><div class="igr-rg13-bar">BARRE · '+esc(current?person(current):'En attente de l’appel')+
  '<span id="igrRgBarClock"></span></div></div>'+
  judgeUI+discussion+thirdFinal+reconstruction+'</section>';
}
function events(){
 const rows=cache?.events||[];if(!rows.length)return '';
 return section('JOURNAL DE KARSANE',
 rows.slice(-5).reverse().map(x=>
 '<article class="igr-rg13-news"><small>'+esc(x.type==='public_bulletin'?'ÉDITION SPÉCIALE':'DÉPÊCHE')+'</small>'+
 '<b>'+esc(x.title||'Nouvel événement confirmé')+'</b><p>'+esc(x.text||x.description||'')+'</p></article>').join(''));
}
function render(){
 if(!can()||!cache?.enabled){document.getElementById('igr-regime-v13')?.remove();return}
 const k=key()+'|'+JSON.stringify(cache);
 if(k===lastRender){tick();return}lastRender=k;
 const after=document.querySelector('.phase-strip')||document.querySelector('#game');
 if(!after)return;
 const previous=document.getElementById('igr-regime-v13');
 const preserved=new Map();
 if(previous){
  previous.querySelectorAll('[data-court-act],#igrRgExchangeText,#igrRgThirdOrdered,#igrRgThirdPart,#igrRgDefense,#igrRgCapturedOrderer,#igrRgCapturedStatement,#igrRgTarget,#igrRgTrack,#igrRgE1,#igrRgE2').forEach(el=>{
   const k=el.hasAttribute('data-court-act')?
     el.getAttribute('data-court-act')+'|'+el.getAttribute('data-court-field'):el.id;
   preserved.set(k,el.value);
  });
 }
 previous?.remove();
 const root=document.createElement('div');
 root.id='igr-regime-v13';
 root.className='igr-rg13-root';
 const phase=cache.phase;
 root.innerHTML='<header class="igr-rg13-banner"><small>LE RÉGIME · '+esc(cache.scenario_id)+' · CYCLE '+esc(cache.cycle)+'/3</small>'+
 '<h3>'+esc(phase==='regime_court'?'LE TRIBUNAL DE KARSANE':'LA CHUTE DE KARSANE')+'</h3>'+
 '<p>Les décisions des joueurs influencent la traque. Les faits historiques restent scellés.</p></header>'+
 scene()+(phase==='regime_court'?court()+capturedDefense():myCard()+alliance()+actions()+capturedDefense()+investigations()+third()+warrants()+judge())+
 evidence()+events();
 after.insertAdjacentElement('afterend',root);
 root.querySelectorAll('[data-court-act],#igrRgExchangeText,#igrRgThirdOrdered,#igrRgThirdPart,#igrRgDefense,#igrRgCapturedOrderer,#igrRgCapturedStatement,#igrRgTarget,#igrRgTrack,#igrRgE1,#igrRgE2').forEach(el=>{
  const k=el.hasAttribute('data-court-act')?
   el.getAttribute('data-court-act')+'|'+el.getAttribute('data-court-field'):el.id;
  if(preserved.has(k))el.value=preserved.get(k);
 });
 tick();
}
function tick(){
 const clock=document.getElementById('igrRgCourtClock');
 if(clock&&room()?.phase_ends_at){
 const ms=Math.max(0,Date.parse(room().phase_ends_at)-Date.now());
 const s=Math.ceil(ms/1000);
 clock.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
 }
 const bar=document.getElementById('igrRgBarClock'),cur=cache?.court?.current;
 if(bar&&cur?.started_at){
 const s=Math.max(0,Math.ceil((Date.parse(cur.started_at)+Number(cur.seconds||0)*1000-Date.now())/1000));
 bar.textContent=' · '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 }
}
function control(id){return document.getElementById(id)?.value||''}
document.addEventListener('click',async(ev)=>{
 const el=ev.target?.closest?.('[data-igr-regime]');if(!el||!document.getElementById('igr-regime-v13')?.contains(el)||!cache?.enabled)return;
 const action=el.dataset.igrRegime;
 el.disabled=true;
 const id=req(),args={p_request_id:id};
 try{
  if(action==='alliance-together'||action==='alliance-apart'){
   await call('igr_regime_v13_action',{...args,p_kind:'alliance',p_payload:{choice:action.endsWith('together')?'together':'apart'}});
  }else if(action==='move'||action==='investigate'){
   await call('igr_regime_v13_action',{...args,p_kind:action==='move'?'fugitive_choice':'investigate',p_payload:{option_id:el.dataset.optionId}});
  }else if(action==='captured-exhibit'||action==='captured-challenge'){
   const statement=control('igrRgCapturedStatement').trim();
   if(statement.length<30){toast('Décris précisément ton argument en au moins 30 caractères.');return;}
   await call('igr_regime_v13_action',{...args,p_kind:'captured_response',
    p_payload:{mode:action==='captured-exhibit'?'authentic_exhibit':'contested_declaration',
      claimed_orderer:control('igrRgCapturedOrderer'),statement}});
  }else if(action==='third-submit'){
   await call('igr_regime_v13_action',{...args,p_kind:'third_submission',p_payload:{defense:control('igrRgDefense')}});
  }else if(action==='warrant'){
   const e1=control('igrRgE1'),e2=control('igrRgE2'),target=control('igrRgTarget');
   if(!e1||!e2||e1===e2){toast('Sélectionne deux traces distinctes.');return}
   const doc1=(cache.public_evidence||[]).find(x=>x.id===e1),doc2=(cache.public_evidence||[]).find(x=>x.id===e2);
   if(!doc1||!doc2||doc1.target_id!==target||doc2.target_id!==target||
      doc1.network_id!==control('igrRgTrack')||doc2.network_id!==control('igrRgTrack')||
      doc1.source===doc2.source){
     toast('Les deux traces doivent concerner la même personne et le même refuge, avec deux sources indépendantes.');return;
   }
   await call('igr_regime_v13_warrant',{...args,p_target_id:target,p_track_choice:control('igrRgTrack'),p_evidence_ids:[e1,e2]});
  }else if(action==='judge-allow'||action==='judge-contest'){
   await call('igr_regime_v13_judge_review',{...args,p_mandate_id:el.dataset.mandateId,
    p_decision:action==='judge-allow'?'allow':'contest'});
  }else if(action==='court-call'){
   await call('igr_regime_v13_court_call',{...args,p_actor_id:el.dataset.actorId});
  }else if(action==='third-final'){
   await call('igr_regime_v13_third_final',{...args,p_ordered_by:control('igrRgThirdOrdered'),
      p_own_participation:control('igrRgThirdPart')});
  }else if(['court-question','court-reply','court-objection','court-sustain','court-overrule'].includes(action)){
   const kinds={ 'court-question':'question','court-reply':'reply',
    'court-objection':'objection','court-sustain':'ruling','court-overrule':'ruling'};
   const msg=action==='court-sustain'?'sustained':
      action==='court-overrule'?'overruled':control('igrRgExchangeText');
   await call('igr_regime_v13_court_exchange',{...args,p_kind:kinds[action],
       p_message:msg,p_reply_to:el.dataset.replyTo||null});
  }else if(action==='reconstruct'){
   const answers=(cache?.court_acts||[]).map(a=>{
    const row={actId:a.id};
    for(const field of ['orderedBy','transmittedBy','executedBy','knewAndControlledBy','evidence1','evidence2'])
      row[field]=document.querySelector('[data-court-act="'+CSS.escape(a.id)+'"][data-court-field="'+field+'"]')?.value||'';
    row.evidenceIds=[row.evidence1,row.evidence2].filter(Boolean);
    delete row.evidence1;delete row.evidence2;return row;
   });
   if(answers.length!==4||answers.some(a=>a.evidenceIds.length!==2||a.evidenceIds[0]===a.evidenceIds[1])){
    toast('Deux sources distinctes sont nécessaires pour chacun des quatre actes.');return;
   }
   await call('igr_regime_v13_reconstruct',{...args,p_answers:answers});
  }
 }finally{if(el.isConnected)el.disabled=false}
});
const currentGame=typeof window.renderGame==='function'?window.renderGame:(typeof renderGame==='function'?renderGame:null);
if(currentGame){
 const wrapped=function(){const result=currentGame.apply(this,arguments);setTimeout(()=>{render();poll(false)},0);return result};
 try{renderGame=wrapped}catch(_){}window.renderGame=wrapped;
}
setInterval(()=>{if(can()){tick();poll(false)}else document.getElementById('igr-regime-v13')?.remove()},1000);
window.IGR_REGIME_V13=Object.freeze({version:VERSION,refresh:()=>poll(true)});
})();