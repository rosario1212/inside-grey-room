/* v87 — Investigator's evolving dossier. No new main navigation tab.
   Only server-authorized events and human notes are displayed; never derive secrets
   from suspect private cards or the canonical truth payload. */
(()=>{
'use strict';
const VERSION='v87-canonical-narrative';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch(_){return window.STATE}};
const sync=()=>S()?.sync||null;
const me=()=>sync()?.player||null;
const TEAM_ROLES=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const isInvestigator=()=>TEAM_ROLES.has(me()?.public_role);
const room=()=>sync()?.room||null;
const fr=()=>window.IGR_LOCALE!=='en';
const tr=(a,b)=>fr()?a:b;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const suspects=()=>Array.isArray(sync()?.suspects)?sync().suspects:[];
const cartel029=()=>room()?.scenario_id==='029';
const briefing029=[
  {fr:'Rescapé de Santa Ceniza, évadé avec les deux autres survivants. Il peut témoigner des conditions de captivité et de certaines violences.',en:'Santa Ceniza survivor who escaped with the two other survivors; can describe captivity and some violence.',qFr:'Quels faits as-tu vus toi-même, et lesquels t’ont été rapportés ?',qEn:'Which events did you personally see, and which did you hear about?'},
  {fr:'Rescapé de Santa Ceniza. Il affirme avoir dû tenir des registres de transferts de prisonniers. Leur destination et leur fiabilité restent à vérifier.',en:'Santa Ceniza survivor who says they were forced to maintain prisoner transfer logs; their accuracy and destinations need checking.',qFr:'Quels transferts as-tu consignés, et qui te donnait les instructions ?',qEn:'Which transfers did you record, and who gave instructions?'},
  {fr:'Rescapé de Santa Ceniza. Il affirme avoir entendu des ordres et des surnoms sans toujours voir leurs auteurs.',en:'Santa Ceniza survivor who reports hearing orders and nicknames without necessarily seeing who spoke.',qFr:'Qu’as-tu entendu exactement et peux-tu identifier la personne ?',qEn:'What exactly did you hear, and can you identify the speaker?'},
  {fr:'Témoin venu volontairement. Il affirme connaître La Noria, un autre site du cartel. Il ne faisait pas partie des quatre fugitifs de Santa Ceniza.',en:'Voluntary witness claiming knowledge of La Noria, another cartel site. Not one of the four Santa Ceniza escapees.',qFr:'Comment connais-tu cet autre site, et quels faits peuvent confirmer ton récit ?',qEn:'How do you know the other site, and what evidence supports your account?'}
];
function publicBrief029(index){
 const b=briefing029[index];if(!b)return '';
 return '<div class="igr87-first-brief" style="border:1px solid rgba(196,166,133,.24);border-radius:10px;padding:12px 14px;margin:10px 0;background:rgba(127,89,67,.08)"><small>'+tr('DÉCLARATION DE DÉPART · À VÉRIFIER','INITIAL ACCOUNT · TO VERIFY')+'</small><p>'+esc(tr(b.fr,b.en))+'</p><strong>'+tr('Point utile à éclaircir','Point to clarify')+'</strong><p>'+esc(tr(b.qFr,b.qEn))+'</p></div>';
}

const key=()=>String(room()?.code||'')+':'+String(me()?.id||'');
let keySeen='',notes=[],loading=false,lastFetch=0,loadError='';
function currentNotes(id){
 return notes.filter(n=>String(n.suspect_id||'')===String(id||''));
}
function noteHtml(n){
 const labels={declaration:tr('Déclaration rapportée','Reported statement'),hypothese:tr('Hypothèse personnelle','Personal hypothesis'),question:tr('À vérifier','To verify')};
 return '<li class="igr87-note"><div><b>'+esc(labels[n.kind]||labels.question)+'</b><small>'+esc(n.author||tr('Équipe Enquête','Investigation team'))+' · '+esc(n.created_at?new Date(n.created_at).toLocaleString(fr()?'fr-CH':'en-GB'):'')+'</small></div><p>'+esc(n.text)+'</p></li>';
}
function notesBlock(id){
 const ns=currentNotes(id);
 return ns.length?'<ul class="igr87-notes">'+ns.map(noteHtml).join('')+'</ul>':
  '<p class="igr87-empty">'+tr('Aucune annotation partagée pour le moment.','No shared annotation yet.')+'</p>';
}
const AUTHORITATIVE=new Set(['trame','expert','field','judge','witness','expert_result','field_result','prosecutor_result','breaking_news','reveal','evidence','investigation']);
function releasedEvents(){
 return (sync()?.events||[]).filter(e=>AUTHORITATIVE.has(String(e?.event_type||''))&&e?.payload&&String(e.payload.title||e.payload.text||'').trim());
}
function evidenceHtml(ev){
 const p=ev.payload||{},kind=ev.event_type==='breaking_news'?tr('Publication','Publication'):
   ev.event_type==='trame'?tr('Élément révélé','Revealed element'):tr('Élément de procédure','Procedural element');
 return '<article class="igr87-evidence" data-igr-event-id="'+esc(ev.id)+'"><small>'+esc(kind)+'</small><h4>'+esc(p.title||tr('Nouvel élément','New element'))+'</h4>'+
  '<p>'+esc(p.text||p.summary||'')+'</p></article>';
}
function association(e,ids){
 const p=e.payload||{},target=p.suspect_id||p.target_player_id; // Top-level target_player_id is not included in igr_v4_visible_events.
 return target&&ids.has(String(target))?String(target):null;
}
function personSection(person,linked,index){
 const name=esc(person.pseudo||tr(cartel029()?'Témoin':'Suspect',cartel029()?'Witness':'Suspect')),id=esc(person.id);
 return '<details class="igr87-person"><summary><strong>'+name+'</strong><small>'+
  tr('Identité connue · relation avec les faits à établir','Identity known · connection to the events to be established')+
  '</small></summary><div class="igr87-person-body">'+
  '<p class="igr87-premise">'+tr('Les déclarations sont à confronter aux éléments officiellement révélés. Aucun secret personnel n’est présumé connu.',
  'Statements must be compared to officially revealed elements. No private secret is presumed known.')+'</p>'+
  (cartel029()?publicBrief029(index):'')+
  (linked.length?linked.map(evidenceHtml).join(''):'<p class="igr87-empty">'+tr('Aucun élément officiel attribué à cette personne.','No official element assigned to this person.')+'</p>')+
  '<h4>'+tr('Notes du camp Enquête','Investigation team notes')+'</h4><div data-igr87-notes="'+id+'">'+notesBlock(person.id)+'</div></div></details>';
}
function dossierHtml(){
 const d=sync(),publicContext=d?.scenario?.context||'',people=suspects(),validIds=new Set(people.map(p=>String(p.id)));
 const ev=releasedEvents(),common=ev.filter(e=>!association(e,validIds));
 return '<section class="igr87-dossier" aria-label="'+tr('Carnet évolutif partagé du camp Enquête','Investigation team shared notebook')+'">'+
 '<div class="igr87-title"><div><small>'+tr('CARNET PARTAGÉ · CAMP ENQUÊTE','SHARED NOTEBOOK · INVESTIGATION TEAM')+'</small><h2>'+tr('Personnes et découvertes','People and discoveries')+'</h2></div><span>'+esc(people.length)+' '+(cartel029()?tr('témoins','witnesses'):tr('suspects','suspects'))+'</span></div>'+
 '<details class="igr87-common"><summary>'+tr('Situation connue et éléments communs','Known situation and shared discoveries')+
 ' <small>'+esc(common.length)+'</small></summary><div class="igr87-person-body">'+
 '<p>'+esc(publicContext||tr('Le dossier public sera précisé par l’enquête.','Public context will become clearer during the investigation.'))+'</p>'+
 common.slice(-18).map(evidenceHtml).join('')+'</div></details>'+
 '<div class="igr87-people">'+people.map((p,i)=>personSection(p,ev.filter(e=>association(e,validIds)===String(p.id)),i)).join('')+'</div>'+
 '<form class="igr87-note-form" onsubmit="event.preventDefault();igr87SaveNote(event)"><h3>'+tr('Consigner une information','Record information')+'</h3>'+
 '<p>'+tr('Une déclaration, une hypothèse ou une question n’est jamais automatiquement transformée en preuve.',
 'A statement, hypothesis or question is never automatically turned into evidence.')+'</p>'+
 '<label for="igr87Target">'+tr('À propos de','About')+'</label><select id="igr87Target"><option value="">'+
 tr('Affaire générale','General case')+'</option>'+people.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.pseudo)+'</option>').join('')+'</select>'+
 '<label for="igr87Kind">'+tr('Nature de la note','Type of note')+'</label><select id="igr87Kind">'+
 '<option value="declaration">'+tr('Déclaration entendue','Statement heard')+'</option>'+
 '<option value="hypothese">'+tr('Hypothèse (non prouvée)','Hypothesis (unproven)')+'</option>'+
 '<option value="question">'+tr('Point à vérifier','Point to verify')+'</option></select>'+
 '<label for="igr87Text">'+tr('Contenu','Content')+'</label><textarea id="igr87Text" maxlength="800" required rows="3" placeholder="'+
 tr('Ce que la personne a déclaré, ce qui reste incertain…','What the person said, what remains uncertain…')+'"></textarea>'+
 '<button class="btn primary" type="submit" id="igr87Save">'+tr('Ajouter au carnet','Add to notebook')+'</button>'+
 '<p class="igr87-status" id="igr87Status" role="status">'+esc(loadError||tr('Visible par le camp Enquête uniquement. Enregistré dans cette partie ; une hypothèse ne devient pas une preuve.','Visible only to the investigation team. Saved in this match; a hypothesis does not become evidence.'))+'</p>'+
 '</form><div class="igr87-general-notes"><h4>'+tr('Notes sur l’affaire','Case-wide notes')+'</h4><div data-igr87-notes="">'+notesBlock(null)+'</div></div></section>';
}
function refreshNotes(){
 document.querySelectorAll('[data-igr87-notes]').forEach(el=>{el.innerHTML=notesBlock(el.getAttribute('data-igr87-notes')||null)});
 const status=document.getElementById('igr87Status');if(status&&loadError)status.textContent=loadError;
}
async function loadNotes(force=false){
 if(!isInvestigator()||!room()?.code||!S()?.token||typeof rpc!=='function')return;
 if(keySeen!==key()){keySeen=key();notes=[];lastFetch=0}
 if(loading||(!force&&Date.now()-lastFetch<4500))return;
 loading=true;lastFetch=Date.now();
 try{const out=await rpc('igr_v87_dossier_notes',{p_code:room().code,p_player_token:S().token});
  if(keySeen!==key())return;notes=Array.isArray(out?.notes)?out.notes:[];loadError='';refreshNotes();
 }catch(e){loadError=tr('Carnet synchronisé indisponible pour le moment.','Synced notebook currently unavailable.');refreshNotes();console.warn('[IGR v87] notes',e)}
 finally{loading=false}
}
window.igr87SaveNote=async function(event){
 event?.preventDefault?.();
 if(!isInvestigator())return false;
 const kind=document.getElementById('igr87Kind')?.value,field=document.getElementById('igr87Text'),target=document.getElementById('igr87Target')?.value||null;
 const value=String(field?.value||'').trim(),status=document.getElementById('igr87Status'),button=document.getElementById('igr87Save');
 if(!value||value.length>800||!['declaration','hypothese','question'].includes(kind))return false;
 if(button)button.disabled=true;
 try{
  await rpc('igr_v87_add_dossier_note',{p_code:room().code,p_player_token:S().token,p_suspect_id:target,p_kind:kind,p_text:value});
  if(field)field.value='';
  await loadNotes(true);if(status)status.textContent=tr('Annotation enregistrée.','Note saved.');
 }catch(e){if(status)status.textContent=tr('Impossible d’enregistrer : vérifie la connexion et les droits du rôle.','Could not save: check connection and role permissions.');console.warn('[IGR v87] save',e)}
 finally{if(button)button.disabled=false}
 return false;
};
const originalInvestigation=typeof renderInvestigationTab==='function'?renderInvestigationTab:null;
if(originalInvestigation){
 const wrapped=function(){
  const baseline=String(originalInvestigation.apply(this,arguments)??'');
  return isInvestigator()?dossierHtml()+baseline:baseline;
 };
 try{renderInvestigationTab=wrapped}catch(_){}
 window.renderInvestigationTab=wrapped;
}
const originalGame=typeof renderGame==='function'?renderGame:null;
if(originalGame){
 const wrapped=function(){const result=originalGame.apply(this,arguments);
  if(isInvestigator()&&S()?.tab==='investigation')queueMicrotask(()=>loadNotes());return result;
 };
 try{renderGame=wrapped}catch(_){}
 window.renderGame=wrapped;
}
// Keep the debrief short, but record the actual missing investigation axis.
// Existing two-question override silently sent an empty axis to the director.
const originalDebrief=typeof renderDebriefForm==='function'?renderDebriefForm:null;
if(originalDebrief){
 const wrapped=function(){
  let html=String(originalDebrief.apply(this,arguments)??'');
  if(!html.includes('qConvergence')||html.includes('id="qAxis"'))return html;
  const select='<div class="field"><label for="qAxis">'+tr('Quelle piste manque le plus ?','Which investigative angle is missing?')+
   '</label><select id="qAxis"><option value="chronologie">'+tr('Chronologie','Timeline')+'</option>'+
   '<option value="acces">'+tr('Accès et déplacements','Access and movement')+'</option>'+
   '<option value="mobile">'+tr('Mobile et relations','Motives and relationships')+'</option>'+
   '<option value="materiel">'+tr('Matériel et technique','Physical and technical')+'</option>'+
   '<option value="responsabilite">'+tr('Responsabilités','Responsibilities')+'</option></select></div>';
  html=html.replace(/(<button[^>]+onclick="submitDebrief\(\)"[^>]*>)/,select+'$1');
  return html.replace(/2 QUESTIONS/gi,'3 QUESTIONS');
 };
 try{renderDebriefForm=wrapped}catch(_){}
 window.renderDebriefForm=wrapped;
}
const originalSubmit=typeof submitDebrief==='function'?submitDebrief:null;
if(originalSubmit){
 const wrapped=async function(){
  if(!document.getElementById('qAxis'))return originalSubmit.apply(this,arguments);
  try{
   await rpc('igr_v4_submit_debrief',{p_code:S().room,p_player_token:S().token,
    p_convergence:Number(document.getElementById('qConvergence')?.value||0),
    p_confusion:Number(document.getElementById('qConfusion')?.value||0),
    p_axis:document.getElementById('qAxis').value});
   await syncNow(true);
  }catch(e){console.error(e);if(typeof toast==='function')toast(tr('Débrief déjà envoyé ou phase terminée.','Debrief already sent or phase over.'))}
 };
 try{submitDebrief=wrapped}catch(_){}
 window.submitDebrief=wrapped;
}
window.IGR_NARRATIVE_V87=Object.freeze({version:VERSION,render:dossierHtml,notes:()=>notes.slice(),releasedEvents});
})();
