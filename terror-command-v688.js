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
  title:'LE FDR VOUS FORCE AU SILENCE',
  text:'La Grey Room est prise. Les prisonniers sont détenus, soumis à des interrogatoires coercitifs et à de graves mauvais traitements. Le FDR cherche à effacer les preuves de ses crimes et à obtenir de fausses déclarations. Certaines copies conservées à l’extérieur peuvent encore sauver la mémoire des victimes.'},
'027':{
  title:'LE FDR IMPOSE SA VERSION',
  text:'Les occupants sont faits prisonniers et séparés. Le FDR recourt aux menaces et aux mauvais traitements pour imposer une version manipulée du renseignement. Les omissions et les informations périmées de l’enquête deviennent des moyens de pression contre les captifs.'},
'028':{
  title:'LE DERNIER CONTACT S’EST ÉTEINT',
  text:'Le FDR a pris la Grey Room. Les occupants sont détenus et subissent des mauvais traitements ; la dernière liaison avec l’état-major est interrompue. Une éventuelle complicité intérieure demeure à établir selon la vérité de la partie. Aucune fidélité au FDR ne garantit d’être épargné.'}
};
function report(){
 const d=context();if(!d||!isTerror()||STATE.view!=='game'||!officer()||d.room.status!=='playing'||Number(d.room.cycle)<1)return;
 document.getElementById('terrorV688Military')?.remove();
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
}
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
  '<div class="terror-v688-surrender">DÉFAITE COLLECTIVE · PRISONNIERS DU FDR · AUCUNE SURVIE GARANTIE</div></section>';
};
if(typeof renderGame==='function'){
 const prior=renderGame;renderGame=function(){prior.apply(this,arguments);report();};
}
if(typeof renderReveal==='function'){
 const prior=renderReveal;renderReveal=function(){return makeDefeat()+prior.apply(this,arguments);};
}
})();
