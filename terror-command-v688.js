/* Terror DLC v688 — accountable military decisions and consequences, all geography fictitious. */
(()=>{
'use strict';
const TERROR=new Set(['026','027','028']);
const cache=new Map();
const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,'');
const context=()=>STATE?.sync;
const isTerror=()=>TERROR.has(String(context()?.room?.scenario_id||''));
const officer=()=>context()?.player?.public_role==='officier_liaison';
const key=()=>[STATE.room,STATE.token,context()?.room?.cycle].join('|');
const currentPhase=()=>String(context()?.room?.phase||'');
const canChoose=()=>!['cycle_debrief','trame','locking','reveal'].includes(currentPhase());
const failTexts={
'026':{
  title:'LA VILLE TOMBE · LE FDR EFFACE LES PREUVES',
  text:'Le dernier secteur de la capitale cesse de répondre. Le FDR prend la Grey Room, saisit les archives et fait sortir tous les occupants de leurs cellules. Enquêteurs et détenus sont maltraités et forcés de signer de faux aveux. Au matin, ils sont exécutés sommairement. Les rebelles annoncent que le tribunal n’a jamais existé. Les copies sauvegardées hors de la capitale sont les seuls éléments qui puissent encore contredire ce mensonge.'},
'027':{
  title:'LA ZONE ROUGE · LE MENSONGE DEVIENT OFFICIEL',
  text:'La capitale tombe. Le FDR capture les occupants de la Grey Room, les sépare et les soumet à des interrogatoires coercitifs pour leur faire confirmer une version fabriquée du sort des civils. Les captifs sont maltraités, puis exécutés sommairement. Les rebelles diffusent ensuite leurs déclarations forcées comme preuve de victoire, privant les familles de toute réponse fiable.'},
'028':{
  title:'DERNIER PÉRIMÈTRE · PLUS AUCUNE LIAISON',
  text:'Le dernier message de l’état-major s’interrompt. Le FDR franchit les portes, capture enquêteurs et détenus et recherche les dossiers sous la menace. Après les mauvais traitements et les interrogatoires forcés, tous les captifs sont exécutés sommairement. Le FDR affirme qu’un réseau intérieur a tout permis ; selon la vérité du dossier, ce récit peut n’être qu’une dernière intimidation.'}
};
function report(){
 const d=context();if(!d||!isTerror()||STATE.view!=='game'||!officer()||d.room.status!=='playing'||Number(d.room.cycle)<1)return;
 document.getElementById('terrorV688Military')?.remove();
 document.getElementById('terrorV693Visit')?.remove();
 const parent=document.getElementById('terrorV681Board')||document.querySelector('.phase-strip');
 if(!parent)return;
 const k=key();let info=cache.get(k);
 if(!info){
   info={loading:true};cache.set(k,info);
   rpc('igr_v688_terror_operations',{p_code:STATE.room,p_player_token:STATE.token})
   .then(result=>{
     cache.set(k,result||{enabled:false});
     if(STATE.view==='game'&&key()===k)renderCurrent();
   }).catch(err=>{
     console.warn('terror military choices',err);
     cache.set(k,{enabled:false,error:true});
     if(STATE.view==='game'&&key()===k)renderCurrent();
   });
 }
 info=cache.get(k);
 const el=document.createElement('section');el.id='terrorV688Military';el.className='terror-v688-command';
 const options=Array.isArray(info?.choices)?info.choices:[];
 const sealed=String(info?.already_chosen||'');
 const choiceLabel=options.find(o=>o.id===sealed)?.name||sealed;
 const grade={aucune_synthese:'Aucun cycle encore évalué — opérations de reprise indisponibles',
   incertaine:'Dernière synthèse : fiabilité insuffisante',
   partielle:'Dernière synthèse : fiabilité partielle',
   fiable:'Dernière synthèse : vérifiée par la liaison nationale'}[info?.previous_quality]||'Évaluation des renseignements par l’état-major';
 const cards=options.map(o=>'<button type="button" class="terror-v688-option" '+(!canChoose()||!!sealed?'disabled':'')+
   ' onclick="terrorV688Choose(\''+esc(o.id)+'\')">'+
   '<b>'+esc(o.name)+'</b><small>'+esc(o.risk||'')+'</small></button>').join('');
 el.innerHTML='<div class="terror-v688-command-head"><small>ÉTAT-MAJOR D’ALMIZIA · ORDRE MILITAIRE</small><strong>VOTRE DÉCISION MODIFIE LE SIÈGE</strong></div>'+
   '<p>Vous disposez d’un choix par cycle. Le camp d’enquête établit les faits ; vous décidez de leur exploitation. Une nouvelle information fiable peut débloquer une reconquête au cycle suivant. Un ordre imprudent peut aggraver le sort de la capitale.</p>'+
   '<div class="terror-v688-intel">'+esc(grade)+'</div>'+
   (info?.loading?'<p>Consultation des restrictions établies par l’état-major…</p>':
    !info?.enabled?'<p>Les opérations sont indisponibles dans cette phase.</p>':
    sealed?'<div class="terror-v688-confirm">ORDRE VALIDÉ · '+esc(choiceLabel)+'</div>':
    !canChoose()?'<div class="terror-v688-intel">Fenêtre de décision close pour ce cycle.</div>':
    '<div class="terror-v688-choice-grid">'+cards+'</div>')+
   '<small class="terror-v688-note">L’ordre est public. Le résultat dépend aussi des réponses de l’Enquêteur et de l’Analyste, que vous ne pouvez pas modifier.</small>';

 parent.insertAdjacentElement('afterend',el);
 // A second, independently limited power: join one currently active hearing
 // or confrontation at cycles 2 and 3, with no access to secret truth.
 if(Number(d.room.cycle)>=2){
   const phase=String(d.room.phase||'');
   const liveHearing=phase==='interrogation'||phase==='event_confrontation';
   const visit=d.room.state?.terror_v693_officer_visit;
   const oldAction=Array.isArray(d.my_actions)&&d.my_actions.some(a=>a.action_type==='terror_v693_officer_join'&&Number(a.cycle)===Number(d.room.cycle));
   const used=oldAction||(Number(visit?.cycle)===Number(d.room.cycle)&&visit?.visitor_id===d.player.id);
   const sessionCurrent=used&&visit?.visitor_id===d.player.id&&
       Date.parse(visit.session_started_at)===Date.parse(d.room.phase_started_at);
   const hearingName=phase==='event_confrontation'?'confrontation':'interrogatoire';
   const defaultFocus=d.room.scenario_id==='026'?'source':d.room.scenario_id==='027'?'civils':'acces';
   const focusOptions=[
     {id:'source',label:'Contrôler la source et sa date'},
     {id:'civils',label:'Préciser les risques pour les civils'},
     {id:'acces',label:'Vérifier un accès ou une liaison'}
   ];
   const visitPanel=document.createElement('section');
   visitPanel.id='terrorV693Visit';visitPanel.className='terror-v693-visit';
   visitPanel.innerHTML='<div class="terror-v693-visit-head"><small>INTERVENTION MILITAIRE · CYCLE '+Number(d.room.cycle)+'/3</small><strong>UNE AUDITION OU CONFRONTATION PAR CYCLE</strong></div>'+
    '<p>Tu peux entrer une seule fois dans une séance déjà ouverte, demander un fait vérifiable et en tenir compte avant de donner ton ordre. Cela ne crée pas une preuve et ne transfère pas l’interrogatoire à l’état-major.</p>'+
    (used?
       '<div class="terror-v688-confirm">INTERVENTION UTILISÉE'+(sessionCurrent?' · TU PARTICIPES À CETTE SÉANCE':'')+'</div>'+
       (sessionCurrent?'<p class="terror-v693-question">'+esc(visit.question||'')+'</p>':'')+
       (sessionCurrent&&phase==='interrogation'&&typeof canVideo==='function'&&canVideo('officier_liaison')?
         '<button type="button" class="terror-v693-button" onclick="setTab(\\'video\\')">Accéder au flux direct de cette audition</button>':''):
      liveHearing?
       '<label for="terrorV693Focus">Angle de ta question</label>'+
       '<select id="terrorV693Focus">'+focusOptions.map(o=>'<option value="'+o.id+'"'+(o.id===defaultFocus?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>'+
       '<button type="button" class="terror-v693-button" onclick="terrorV693Join()">Rejoindre cet '+esc(hearingName)+'</button>':
       '<div class="terror-v688-intel">Aucune séance ouverte pour le moment. Tu peux réserver ton intervention pour un interrogatoire ou une confrontation ultérieur(e) de ce cycle.</div>')+
     '<small>Cette intervention ne consomme pas ton ordre militaire. La retransmission vidéo n’est disponible que lors d’un interrogatoire actif et autorisé.</small>';
   el.insertAdjacentElement('afterend',visitPanel);
 }
}

window.terrorV693Join=async()=>{
 const d=context(),phase=d?.room?.phase;
 if(!officer()||Number(d?.room?.cycle)<2||!['interrogation','event_confrontation'].includes(phase))return;
 const focus=document.getElementById('terrorV693Focus')?.value||'source';
 const button=document.querySelector('#terrorV693Visit .terror-v693-button');
 if(button)button.disabled=true;
 try{
   const reply=await rpc('igr_v693_terror_officer_join',{
     p_code:STATE.room,p_player_token:STATE.token,
     p_focus:focus,p_phase_started_at:d.room.phase_started_at
   });
   await syncNow(true);
   if(phase==='interrogation'&&typeof canVideo==='function'&&canVideo('officier_liaison')){
     STATE.tab='video';
     renderCurrent();
   }
   toast('Intervention officielle enregistrée : une question ciblée, une seule séance pour ce cycle.');
 }catch(err){
   console.warn('officer hearing access denied',err);
   toast('Intervention indisponible : séance terminée, rôle non autorisé ou quota déjà utilisé.');
   if(button)button.disabled=false;
 }
};
window.terrorV688Choose=async choice=>{
 if(!officer()||!['tenir','proteger','reconquerir'].includes(choice))return;
 try{
  await rpc('igr_v688_terror_choose_operation',{p_code:STATE.room,p_player_token:STATE.token,p_choice:choice});
  cache.delete(key());await syncNow(true);
  toast('Ordre transmis à l’état-major. La capitale connaîtra son bilan en fin de cycle.');
 }catch(err){console.error('military decision',err);toast('Ordre impossible : renseignements insuffisants ou fenêtre de décision close.');}
};
const makeDefeat=()=>{
 const d=context();
 if(!d||!isTerror()||d.room.status!=='finished')return '';
 if(d.room.state?.terror_v681?.terminal_outcome!=='front_at_gates')return '';
 const e=failTexts[String(d.room.scenario_id)]||failTexts['026'];
 const city=String(d.room.state?.terror_v681?.city||'la capitale');
 return '<section class="terror-v688-capture" role="status"><small>DERNIÈRE CAPITALE D’ALMIZIA · '+esc(city)+'</small>'+
  '<h2>'+esc(e.title)+'</h2><p>'+esc(e.text)+'</p>'+
  '<div class="terror-v688-surrender">DÉFAITE COLLECTIVE · EXÉCUTIONS SOMMAIRES · AUCUN SURVIVANT DANS LA GREY ROOM</div></section>';
};
if(typeof renderGame==='function'){
 const prior=renderGame;renderGame=function(){prior.apply(this,arguments);report();};
}
if(typeof renderReveal==='function'){
 const prior=renderReveal;renderReveal=function(){return makeDefeat()+prior.apply(this,arguments);};
}
})();
