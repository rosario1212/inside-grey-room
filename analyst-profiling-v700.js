/* Inside Grey Room v700 — Analyst's two-question profiles. Protected server data. */
(()=>{
'use strict';
const VERSION='v700-analyst-profiling';
const fr=()=>window.IGR_LOCALE!=='en';
const tr=(f,e)=>fr()?f:e;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const Q1=()=>tr('Quelle motivation ou stratégie psychologique semble guider ce suspect ?',
 'What psychological motivation or coping strategy might explain this suspect’s behaviour?');
const Q2=()=>tr('Quels propos ou faits connus appuient ou fragilisent ton hypothèse ?',
 'Which statements or known facts support or weaken your hypothesis?');
const S=()=>typeof STATE==='undefined'?null:STATE;

// v701: Short, forensic-interview-style prompts, tied only to visible case events.
// No psychological diagnosis or automatic inference of guilt.
const PROMPTS={
 fr:{
  1:{
   base:['Que cherche-t-il à protéger ?','Quelle peur pourrait guider ses choix ?'],
   statement:['Quelle image veut-il imposer ?','Quel besoin traverse son récit ?'],
   interview:['Qui cherche-t-il à convaincre ?','Quelle vulnérabilité pourrait guider ses réponses ?'],
   confrontation:['Que protège-t-il face aux autres ?','Quelle loyauté pourrait peser sur lui ?'],
   evidence:['Quel intérêt semble le plus menacé ?','Quelle inquiétude les éléments rendent-ils plausible ?']
  },
  2:{
   base:['Quel intérêt oriente maintenant son attitude ?','Quelle part de son comportement reste ambiguë ?'],
   statement:['Que cherche-t-il à faire accepter ?','Quelle responsabilité accepte-t-il de regarder en face ?'],
   interview:['Comment gère-t-il les questions insistantes ?','Quelle image de lui-même défend-il ?'],
   confrontation:['Que craint-il de perdre face à l’autre ?','Quelle tension pèse sur ses justifications ?'],
   evidence:['Comment peut-il vivre ces nouvelles informations ?','Quelle défense psychologique pourrait apparaître ?']
  },
  3:{
   base:['Quelle motivation domine ton portrait final ?','Quelle hypothèse reste psychologiquement fragile ?'],
   statement:['Comment son récit a-t-il évolué ?','Quel besoin semble persister dans ses justifications ?'],
   interview:['Quelle stratégie de protection semble persister ?','Quel doute subsiste après ses réponses ?'],
   confrontation:['Quelle posture conserve-t-il sous pression ?','Quel conflit intérieur paraît encore plausible ?'],
   evidence:['Quelles motivations résistent aux derniers éléments ?','Quel aspect de lui reste inexpliqué ?']
  }
 },
 en:{
  1:{
   base:['What is this suspect trying to protect?','What fear might drive their choices?'],
   statement:['What image are they trying to project?','What need runs through their account?'],
   interview:['Whom are they trying to convince?','What vulnerability might shape their answers?'],
   confrontation:['What are they defending before the others?','What loyalty might weigh on them?'],
   evidence:['Which interest now seems most threatened?','What fear might the evidence suggest?']
  },
  2:{
   base:['Which interest now shapes their behaviour?','What remains ambiguous about their conduct?'],
   statement:['What are they trying to make believable?','What responsibility are they willing to consider?'],
   interview:['How do they handle persistent questioning?','What self-image are they protecting?'],
   confrontation:['What do they fear losing in confrontation?','What tension shapes their explanations?'],
   evidence:['How might these new facts affect them?','What psychological defense could be emerging?']
  },
  3:{
   base:['What motivation dominates your final portrait?','Which psychological hypothesis remains fragile?'],
   statement:['How has their account evolved?','Which need persists through their explanations?'],
   interview:['What protective strategy seems to persist?','What uncertainty remains after their answers?'],
   confrontation:['What stance persists under pressure?','What internal conflict still seems plausible?'],
   evidence:['Which motives withstand the latest evidence?','What aspect of their behaviour remains unexplained?']
  }
 }
};
const wordCount=text=>{const value=String(text??'').trim();return value?value.split(/\s+/u).length:0};
function questionText(code){
 const m=/^c([123])_(base|statement|interview|confrontation|evidence)_([12])$/.exec(String(code||''));
 return m?PROMPTS[fr()?'fr':'en'][Number(m[1])][m[2]][Number(m[3])-1]:null;
}
function pointsToSuspect(evt,suspect){
 const p=evt?.payload||{},id=String(suspect.id),name=String(suspect.pseudo||'').toLowerCase().trim();
 const ids=[p.target_id,p.suspect_id,p.player_id,p.author_id,p.subject_id,p.target];
 const arrays=[p.targets,p.target_ids,p.participants,p.suspects,p.player_ids];
 return ids.some(value=>String(value||'')===id)||
  arrays.some(value=>Array.isArray(value)&&value.some(v=>String(v?.id||v||'')===id))||
  (name!==''&&[p.pseudo,p.suspect_pseudo,p.target_pseudo].some(v=>String(v||'').toLowerCase().trim()===name));
}
function promptKind(suspect,cycle){
 const events=Array.isArray(S()?.sync?.events)?S().sync.events:[];
 const relevant=events.filter(e=>Number(e.cycle)===cycle&&pointsToSuspect(e,suspect));
 const isKind=(e,pattern)=>pattern.test([e.event_type,e.payload?.event,e.payload?.key,e.payload?.title].filter(Boolean).join(' ').toLowerCase());
 if(relevant.some(e=>isKind(e,/confrontation/)))return 'confrontation';
 if(relevant.some(e=>isKind(e,/^statement_|déclaration|declaration|déposition|deposition/)))return 'statement';
 if(relevant.some(e=>isKind(e,/interrogatoire|interrogation|audition/)))return 'interview';
 if(events.some(e=>Number(e.cycle)===cycle&&/^(investigation_|trame$|breaking_news$|public_evidence$)/.test(String(e.event_type||''))))
  return 'evidence';
 return 'base';
}
const pinnedQuestions=new Map();
function questionsFor(suspect,cycle){
 const id=String(suspect.id),old=record(id,cycle),k=draftKey(id);
 if(old?.question_one_code&&old?.question_two_code){
  return {one:{code:old.question_one_code,text:questionText(old.question_one_code)||Q1()},
   two:{code:old.question_two_code,text:questionText(old.question_two_code)||Q2()}};
 }
 if(pinnedQuestions.has(k))return pinnedQuestions.get(k);
 const context=promptKind(suspect,cycle);
 const oneCode='c'+cycle+'_'+context+'_1',twoCode='c'+cycle+'_'+context+'_2';
 return {one:{code:oneCode,text:questionText(oneCode)||Q1()},
  two:{code:twoCode,text:questionText(twoCode)||Q2()}};
}

const R=()=>S()?.sync?.room;
const P=()=>S()?.sync?.player;
const visible=()=>!!R()&&(R().status==='finished'||(P()?.public_role==='analyste'&&R().status==='playing'));
const key=()=>[S()?.room,S()?.token,R()?.state?.match_no||1].join('|');
let currentKey='',data=null,fetchedAt=0,pending=false;
const drafts=new Map();
const draftKey=id=>[key(),R()?.cycle,id].join('|');
function activate(){
 const k=key();if(currentKey!==k){currentKey=k;data=null;fetchedAt=0;pending=false;drafts.clear();pinnedQuestions.clear()}
}
function records(id){return (data?.profiles||[]).filter(p=>p.suspect_id===id)}
function record(id,cycle){return records(id).find(p=>Number(p.cycle)===Number(cycle))}
function report(){
 if(!data?.published)return '';
 const roster=(data.suspects||[]).length?data.suspects:(data.profiles||[]).reduce((out,p)=>{
  if(!out.some(x=>String(x.id)===String(p.suspect_id)))out.push({id:p.suspect_id,pseudo:p.suspect_pseudo});
  return out;
 },[]);
 const content=roster.map(suspect=>{
  const items=records(String(suspect.id));
  return '<details class="igr700-report-person"><summary>'+safe(suspect.pseudo)+' · '+items.length+'/3 '+tr('cycles remplis','completed cycles')+'</summary>'+
   [1,2,3].map(c=>{
    const x=items.find(v=>Number(v.cycle)===c);
    if(!x)return '<div class="igr700-entry"><small>'+tr('CYCLE','CYCLE')+' '+c+'</small><p class="igr700-muted">'+
     tr('Profil non complété.','Profile not completed.')+'</p></div>';
    return '<div class="igr700-entry"><small>'+tr('CYCLE','CYCLE')+' '+c+'</small>'+
     '<p><b>'+safe(questionText(x.question_one_code)||Q1())+'</b> '+safe(x.answer_one)+'</p>'+
     '<p><b>'+safe(questionText(x.question_two_code)||Q2())+'</b> '+safe(x.answer_two)+'</p></div>';
   }).join('')+'</details>';
 }).join('');
 return '<section class="igr700-report"><div class="igr700-head"><small>'+tr('ARCHIVES DU DOSSIER','CASE ARCHIVES')+'</small>'+
 '<h3>'+tr('Profils psychologiques de l’Analyste','Analyst psychological profiles')+'</h3>'+
 '<p>'+tr('Portraits subjectifs de personnages fictifs, rédigés sur trois cycles. Ni diagnostics, ni preuves. Aucune incidence sur la victoire.',
  'Subjective portraits of fictional characters, written across three cycles. No diagnoses or evidence. No impact on victory.')+'</p></div>'+
 (content||'<p class="igr700-muted">'+tr('Aucun suspect à profiler.','No suspects to profile.')+'</p>')+'</section>';
}
function tabHtml(){
 if(!visible())return '<div class="locked-state">'+tr('Profilage indisponible.','Profiling unavailable.')+'</div>';
 if(R()?.status==='finished')return data?.published?report():
  '<section id="igr700-loading"><h2>'+tr('Profils psychologiques','Psychological profiles')+'</h2><p>'+tr('Chargement des archives…','Loading archives…')+'</p></section>';
 if(!data)return '<section id="igr700-loading"><h2>'+tr('Profilage · Analyste','Profiling · Analyst')+
  '</h2><p>'+tr('Chargement des suspects…','Loading suspects…')+'</p></section>';
 const cycle=Number(R()?.cycle)||1,available=data.can_write===true;
 const suspects=data.suspects||[];
 const done=suspects.filter(s=>record(String(s.id),cycle)).length;
 return '<section class="igr700-panel"><header class="igr700-head"><small>'+
  tr('OUTIL DE L’ANALYSTE · CYCLE ','ANALYST DESK · CYCLE ')+cycle+'/3</small>'+
  '<h2>'+tr('Profilage psychologique','Psychological profiling')+'</h2>'+
  '<p>'+tr('Obligatoire : deux réponses de 10 mots minimum par suspect, à chaque cycle. Questions courtes adaptées aux faits visibles. Aucun diagnostic, aucune détection du mensonge.',
  'Required: two answers of at least 10 words per suspect, each cycle. Short questions adapted to visible events. No diagnosis or lie detection.')+'</p>'+
  '<div class="igr700-progress">'+done+' / '+suspects.length+' '+tr('profils obligatoires enregistrés','required profiles saved')+'</div></header>'+
 suspects.map(s=>{
  const sid=String(s.id),old=record(sid,cycle),pair=questionsFor(s,cycle),draft=drafts.get(draftKey(sid))||{one:'',two:''};
  const history=records(sid).filter(x=>Number(x.cycle)<cycle).map(x=>
   '<details class="igr700-old"><summary>'+tr('Relire le cycle ','Review cycle ')+safe(x.cycle)+'</summary>'+
    '<p><b>'+safe(questionText(x.question_one_code)||Q1())+'</b> '+safe(x.answer_one)+'</p>'+ 
    '<p><b>'+safe(questionText(x.question_two_code)||Q2())+'</b> '+safe(x.answer_two)+'</p></details>').join('');
  return '<article class="igr700-person"><div class="igr700-person-head"><h3>'+safe(s.pseudo)+'</h3><span>'+
   (old?tr('ENREGISTRÉ','SAVED'):tr('À REMPLIR','PENDING'))+'</span></div>'+
   (old?'<div class="igr700-saved"><p><b>'+safe(pair.one.text)+'</b> '+safe(old.answer_one)+'</p>'+ 
     '<p><b>'+safe(pair.two.text)+'</b> '+safe(old.answer_two)+'</p></div>':
    available?'<div class="igr700-fields"><label>'+safe(pair.one.text)+
     '<textarea id="igr700-one-'+safe(sid)+'" rows="2" maxlength="180" data-igr700-suspect="'+safe(sid)+'" data-igr700-field="one" placeholder="'+tr('Au moins 10 mots…','At least 10 words…')+'">'+safe(draft.one)+'</textarea><small class="igr701-counter">'+wordCount(draft.one)+' / 10 '+tr('mots minimum','words minimum')+'</small></label>'+
     '<label>'+safe(pair.two.text)+
     '<textarea id="igr700-two-'+safe(sid)+'" rows="2" maxlength="180" data-igr700-suspect="'+safe(sid)+'" data-igr700-field="two" placeholder="'+tr('Au moins 10 mots…','At least 10 words…')+'">'+safe(draft.two)+'</textarea><small class="igr701-counter">'+wordCount(draft.two)+' / 10 '+tr('mots minimum','words minimum')+'</small></label>'+
     '<button type="button" class="igr700-submit" data-igr700-save="'+safe(sid)+'">'+
       tr('Enregistrer ce profil','Save this profile')+'</button></div>':
    '<p class="igr700-muted">'+tr('Les réponses ne sont plus modifiables pendant cette phase.','Answers cannot be edited during this phase.')+'</p>')+
    history+'</article>';
 }).join('')+
 '<p class="igr700-footer">'+tr('Les réponses restent privées pendant la partie. Tous les joueurs pourront les consulter après la révélation finale. Aucun score ni verdict n’est modifié.',
 'Answers remain private during play. All players can read them after the final reveal. Scores and verdicts are not changed.')+'</p></section>';
}
function updatePanels(){
 if(S()?.view!=='game')return;
 const root=document.querySelector('.game-panel-v11');
 if(S()?.tab==='profiling'&&root){
  root.innerHTML=tabHtml();
 }
 const reveal=document.querySelector('.reveal-v11');
 if(reveal&&R()?.status==='finished'){
  let el=reveal.querySelector('#igr700-final-public');
  if(!el){el=document.createElement('div');el.id='igr700-final-public';const exit=reveal.querySelector('button[onclick^="leaveRoom"]');if(exit)reveal.insertBefore(el,exit);else reveal.appendChild(el)}
  el.innerHTML=data?.published?report():'<div class="igr700-report igr700-muted">'+
    tr('Chargement des profils psychologiques…','Loading psychological profiles…')+'</div>';
 }
}
async function refresh(force=false){
 if(!visible()||!S()?.room||!S()?.token)return;
 activate();
 const before=key();
 if(pending||(!force&&data&&Date.now()-fetchedAt<12000))return;
 pending=true;
 try{
  const next=await rpc('igr_v700_psych_profiles',{p_code:S().room,p_player_token:S().token});
  if(before!==key())return;
  const changed=JSON.stringify(data)!==JSON.stringify(next);
  data=next;fetchedAt=Date.now();if(changed)updatePanels();
 }catch(e){
  if(before===key()&&S()?.tab==='profiling'){
   const root=document.querySelector('.game-panel-v11');
   if(root)root.innerHTML='<div class="locked-state">'+
    tr('Impossible de charger les profils. Réessaie après reconnexion.',
       'Unable to load profiles. Try again after reconnecting.')+'</div>';
  }
  console.warn('v700 profiling request failed',e);
 }finally{if(before===key())pending=false}
}
function mount(){
 if(!visible())return;
 activate();
 // Do not poll a new endpoint in ordinary investigation tabs.
 if(S()?.tab==='profiling'||(R()?.status==='finished'&&document.querySelector('.reveal-v11'))){
  if(R()?.status==='finished')updatePanels();
  void refresh();
 }
}
document.addEventListener('input',e=>{
 const el=e.target?.closest?.('[data-igr700-field]');if(!el)return;
 const id=el.dataset.igr700Suspect,field=el.dataset.igr700Field;
 if(!['one','two'].includes(field))return;
 const k=draftKey(id),draft=drafts.get(k)||{one:'',two:''};
 if(!pinnedQuestions.has(k)){
  const suspect=(data?.suspects||[]).find(x=>String(x.id)===id);
  if(suspect)pinnedQuestions.set(k,questionsFor(suspect,Number(R()?.cycle)||1));
 }
 draft[field]=el.value;drafts.set(k,draft);
 const counter=el.closest('label')?.querySelector('.igr701-counter');
 if(counter)counter.textContent=wordCount(el.value)+' / 10 '+tr('mots minimum','words minimum');
});
document.addEventListener('click',async e=>{
 const btn=e.target?.closest?.('[data-igr700-save]');if(!btn)return;
 e.preventDefault();
 if(btn.disabled||!visible()||P()?.public_role!=='analyste'||!data?.can_write)return;
 const id=btn.dataset.igr700Save,root=btn.closest('.igr700-person');
 const one=root?.querySelector('[data-igr700-field="one"]')?.value.trim()||'';
 const two=root?.querySelector('[data-igr700-field="two"]')?.value.trim()||'';
 if([one,two].some(x=>wordCount(x)<10||x.length>180)){
  window.toast?.(tr('Chaque réponse doit contenir au moins 10 mots (180 caractères maximum).',
   'Each answer needs at least 10 words (180 characters maximum).'));return;
 }
 btn.disabled=true;
 try{
  const suspect=(data?.suspects||[]).find(x=>String(x.id)===id);
  if(!suspect)throw new Error('unknown suspect');
  const pair=questionsFor(suspect,Number(R()?.cycle)||1);
  await rpc('igr_v701_submit_psych_profile',{p_code:S().room,p_player_token:S().token,
   p_suspect_id:id,p_answer_one:one,p_answer_two:two,
   p_question_one_code:pair.one.code,p_question_two_code:pair.two.code});
  drafts.delete(draftKey(id));pinnedQuestions.delete(draftKey(id));data=null;fetchedAt=0;
  window.toast?.(tr('Profil enregistré pour ce cycle.','Profile saved for this cycle.'));
  await refresh(true);
 }catch(err){
  console.warn('v700 profile rejected',err);
  window.toast?.(tr('Enregistrement refusé : phase close, profil déjà enregistré ou connexion indisponible.',
   'Save rejected: phase closed, duplicate profile or connection unavailable.'));
  if(btn.isConnected)btn.disabled=false;
 }
});
if(typeof gameTabs==='function'){
 const old=gameTabs;
 gameTabs=function(){
  const tabs=old.apply(this,arguments);
  if(visible()&&!tabs.some(t=>t.id==='profiling')){
   tabs.splice(1,0,{id:'profiling',label:tr('Profilage','Profiling')});
  }
  return tabs;
 };
}
if(typeof renderGameTab==='function'){
 const old=renderGameTab;
 renderGameTab=function(){
  if(S()?.tab==='profiling')return tabHtml();
  return old.apply(this,arguments);
 };
}
if(typeof renderGame==='function'){
 const old=renderGame;
 renderGame=function(){old.apply(this,arguments);mount()};
}
window.IGR_ANALYST_PROFILING_V700=Object.freeze({version:'v701-adaptive-profiling',questions:[Q1,Q2],promptKind,questionText,questionsFor,wordCount,renderReport:report,refresh});
})();
