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
const R=()=>S()?.sync?.room;
const P=()=>S()?.sync?.player;
const visible=()=>!!R()&&(R().status==='finished'||(P()?.public_role==='analyste'&&R().status==='playing'));
const key=()=>[S()?.room,S()?.token,R()?.state?.match_no||1].join('|');
let currentKey='',data=null,fetchedAt=0,pending=false;
const drafts=new Map();
const draftKey=id=>[key(),R()?.cycle,id].join('|');
function activate(){
 const k=key();if(currentKey!==k){currentKey=k;data=null;fetchedAt=0;pending=false;drafts.clear()}
}
function records(id){return (data?.profiles||[]).filter(p=>p.suspect_id===id)}
function record(id,cycle){return records(id).find(p=>Number(p.cycle)===Number(cycle))}
function report(){
 if(!data?.published)return '';
 const profiles=data.profiles||[];
 const grouped=new Map();
 for(const item of profiles){
  const sid=String(item.suspect_id||'');
  if(!grouped.has(sid))grouped.set(sid,{name:item.suspect_pseudo||tr('Suspect','Suspect'),items:[]});
  grouped.get(sid).items.push(item);
 }
 const content=[...grouped.values()].map(({name,items})=>
  '<details class="igr700-report-person"><summary>'+safe(name)+' · '+items.length+'/3 '+tr('cycles','cycles')+'</summary>'+
  items.map(x=>'<div class="igr700-entry"><small>'+tr('CYCLE','CYCLE')+' '+safe(x.cycle)+'</small>'+
   '<p><b>'+safe(Q1())+'</b> '+safe(x.answer_one)+'</p>'+
   '<p><b>'+safe(Q2())+'</b> '+safe(x.answer_two)+'</p></div>').join('')+
  '</details>').join('');
 return '<section class="igr700-report"><div class="igr700-head"><small>'+tr('ARCHIVES DU DOSSIER','CASE ARCHIVES')+'</small>'+
 '<h3>'+tr('Profils psychologiques de l’Analyste','Analyst psychological profiles')+'</h3>'+
 '<p>'+tr('Avis subjectifs rédigés pendant les trois cycles. Ils ne sont ni des diagnostics ni des preuves. Ils sont rendus publics après la fin de la partie.',
 'Subjective assessments written across three cycles. They are neither diagnoses nor evidence. They become public only after the game ends.')+'</p></div>'+
 (content||'<p class="igr700-muted">'+tr('Aucun profil n’a été enregistré.','No profiles were recorded.')+'</p>')+'</section>';
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
  '<p>'+tr('Pour chaque suspect : deux réponses courtes (deux lignes chacune), une seule fois par cycle. Appuie-toi sur des comportements et des faits du dossier. Ne pose aucun diagnostic et ne prétends pas déceler le mensonge.',
  'For each suspect, write two brief answers (two lines each), once per cycle. Use case facts and observed behaviour. Do not diagnose people or claim to detect lies.')+'</p>'+
  '<div class="igr700-progress">'+done+' / '+suspects.length+' '+tr('profils du cycle enregistrés','cycle profiles recorded')+'</div></header>'+
 suspects.map(s=>{
  const sid=String(s.id),old=record(sid,cycle),draft=drafts.get(draftKey(sid))||{one:'',two:''};
  const history=records(sid).filter(x=>Number(x.cycle)<cycle).map(x=>
   '<details class="igr700-old"><summary>'+tr('Relire le cycle ','Review cycle ')+safe(x.cycle)+'</summary>'+
    '<p><b>1.</b> '+safe(x.answer_one)+'</p><p><b>2.</b> '+safe(x.answer_two)+'</p></details>').join('');
  return '<article class="igr700-person"><div class="igr700-person-head"><h3>'+safe(s.pseudo)+'</h3><span>'+
   (old?tr('ENREGISTRÉ','SAVED'):tr('À REMPLIR','PENDING'))+'</span></div>'+
   (old?'<div class="igr700-saved"><p><b>1.</b> '+safe(old.answer_one)+'</p><p><b>2.</b> '+safe(old.answer_two)+'</p></div>':
    available?'<div class="igr700-fields"><label>'+safe(Q1())+
     '<textarea id="igr700-one-'+safe(sid)+'" rows="2" maxlength="180" data-igr700-suspect="'+safe(sid)+'" data-igr700-field="one" placeholder="'+tr('Une hypothèse courte…','A short hypothesis…')+'">'+safe(draft.one)+'</textarea></label>'+
     '<label>'+safe(Q2())+
     '<textarea id="igr700-two-'+safe(sid)+'" rows="2" maxlength="180" data-igr700-suspect="'+safe(sid)+'" data-igr700-field="two" placeholder="'+tr('Un fait précis, ou une limite…','A concrete fact or limitation…')+'">'+safe(draft.two)+'</textarea></label>'+
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
  if(!el){el=document.createElement('div');el.id='igr700-final-public';reveal.appendChild(el)}
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
 const k=draftKey(id),draft=drafts.get(k)||{one:'',two:''};draft[field]=el.value;drafts.set(k,draft);
});
document.addEventListener('click',async e=>{
 const btn=e.target?.closest?.('[data-igr700-save]');if(!btn)return;
 e.preventDefault();
 if(btn.disabled||!visible()||P()?.public_role!=='analyste'||!data?.can_write)return;
 const id=btn.dataset.igr700Save,root=btn.closest('.igr700-person');
 const one=root?.querySelector('[data-igr700-field="one"]')?.value.trim()||'';
 const two=root?.querySelector('[data-igr700-field="two"]')?.value.trim()||'';
 if([one,two].some(x=>x.length<12||x.length>180)){
  window.toast?.(tr('Chaque réponse doit compter de 12 à 180 caractères.',
   'Each answer must contain 12 to 180 characters.'));return;
 }
 btn.disabled=true;
 try{
  await rpc('igr_v700_submit_psych_profile',{p_code:S().room,p_player_token:S().token,
   p_suspect_id:id,p_answer_one:one,p_answer_two:two});
  drafts.delete(draftKey(id));data=null;fetchedAt=0;
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
window.IGR_ANALYST_PROFILING_V700=Object.freeze({version:VERSION,questions:[Q1,Q2],renderReport:report,refresh});
})();
