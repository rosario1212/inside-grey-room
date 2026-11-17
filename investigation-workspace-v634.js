/* Inside Grey Room v634 — one investigation workspace, instead of an action/evidence/notebook pile.
   Presentation only: existing RPC actions, permissions, notes and timers remain untouched. */
(()=>{
'use strict';
const VERSION='v634-investigation-workspace';
const INVESTIGATION_ROLES=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const LEAD_ROLES=new Set(['enqueteur','analyste']);
const ACTIVE_INTERVIEWS=new Set(['interrogation_select','interrogation','event_select']);
const expanded=new Map();
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
const role=()=>String(S()?.sync?.player?.public_role||S()?.role||'');
const phase=()=>String(S()?.sync?.room?.phase||'');
const eligible=()=>INVESTIGATION_ROLES.has(role());
const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const scope=()=>{const s=S(),r=s?.sync?.room||{};return [r.code||s?.room||'',r.state?.match_no||1,s?.sync?.player?.id||s?.playerId||'',role()].join(':')};
function activeGroup(id,fallback){const k=scope()+':'+id;return expanded.has(k)?expanded.get(k):fallback}
function group(id,title,kicker,content,initiallyOpen=false){
 const block=document.createElement('details');
 block.className='igr634-group';block.dataset.igr634Group=id;
 block.open=activeGroup(id,initiallyOpen);
 const summary=document.createElement('summary');summary.className='igr634-summary';
 summary.innerHTML='<span class="igr634-summary-copy"><small>'+kicker+'</small><strong>'+title+'</strong></span><span class="igr634-chevron" aria-hidden="true">⌄</span>';
 const inside=document.createElement('div');inside.className='igr634-body';
 content.forEach(node=>inside.appendChild(node));
 block.append(summary,inside);return block;
}
function makeEl(tag,klass,text){
 const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=text;return el;
}
function caseActionsHtml(src){
 const t=document.createElement('template');t.innerHTML=src;
 const root=t.content.querySelector('.igr87-dossier');if(!root)return t;
 const noteForm=root.querySelector('.igr87-note-form');
 if(noteForm){
   const title=makeEl('h3','igr634-carnet-label',tr('Consigner une information','Record a finding'));
   noteForm.querySelector('h3')?.remove();
   const d=document.createElement('details');d.className='igr634-add-note';
   const head=document.createElement('summary');head.textContent=tr('Ajouter une annotation au carnet','Add a notebook annotation');
   d.append(head,noteForm);
   const first=root.querySelector('.igr87-common');
   if(first)first.before(d);else root.appendChild(d);
 }
 return t;
}
function categorize(node,buckets,leading){
 if(node.nodeType!==1){if(node.textContent?.trim())buckets.actions.push(node);return}
 const el=node;
 const cl=el.classList;
 if(cl.contains('igr87-dossier')){
   const parsed=caseActionsHtml(el.outerHTML);
   buckets.notebook.push(...Array.from(parsed.content.childNodes));
   return;
 }
 if(cl.contains('igr106-inquiry-evidence')||cl.contains('v42-elements')||cl.contains('igr87-evidence')||
    cl.contains('igr001-reports')||cl.contains('igr82-known')||
    (cl.contains('private-block')&&!cl.contains('igr016-ledger')&&!el.querySelector('button,[type="submit"],select,textarea'))){
   buckets.evidence.push(el);return;
 }
 if(cl.contains('igr016-ledger')){buckets.notebook.push(el);return}
 if(cl.contains('action-section')&&el.querySelector('button')&&(/investigations? complémentaires|pistes|recherches complémentaires|enquête complémentaire/i.test(el.querySelector('h3,h2')?.textContent||'') || !!el.querySelector('[onclick*="investigate"],[onclick*="Investigation"]'))){
   buckets.priority.push(el);return;
 }
 if(el.querySelector('[onclick*="startInterrogation"],[onclick*="endInterrogation"],#igrV41InterTarget,#igrV41ConfrontA,#igrV41ConfrontB')||
    (cl.contains('action-section')&&/interrogatoir|interrogation|convoca/i.test(el.querySelector('h2,h3')?.textContent||''))){
   buckets.interviews.push(el);return;
 }
 if(cl.contains('phase-explain')&&leading&&ACTIVE_INTERVIEWS.has(phase())){
   buckets.interviews.push(el);return;
 }
 buckets.actions.push(el);
}
function organize(raw){
 const lead=LEAD_ROLES.has(role());
 const template=document.createElement('template');template.innerHTML=raw;
 const bucket={priority:[],interviews:[],actions:[],evidence:[],notebook:[]};
 const nodes=Array.from(template.content.childNodes);
 nodes.forEach((node,i)=>categorize(node,bucket,lead));
 const outside=document.createElement('section');
 outside.className='igr634-workspace';outside.dataset.igr634Workspace=role();
 const header=makeEl('header','igr634-head');
 const kicker=makeEl('small','',tr('ESPACE DE TRAVAIL','WORKSPACE'));
 const title=makeEl('h2','',lead?tr('Enquête · actions et découvertes','Investigation · actions and discoveries'):tr('Mes actions et mes éléments','My actions and findings'));
 const description=makeEl('p','',lead?tr('Commence par la phase en cours. Interroge, vérifie une piste, puis compare les pièces aux déclarations.','Start with the current phase: interview, check a lead, then compare findings with statements.'):tr('Ce que tu peux faire maintenant, puis ce que tu as appris.','What you can do now, followed by what you know.'));
 header.append(kicker,title,description);outside.appendChild(header);
 if(bucket.priority.length){
   const priority=makeEl('section','igr634-priority');
   const cycle=Number(S()?.sync?.room?.cycle)||1;
   const sid=String(S()?.sync?.room?.scenario_id||'');
   const sc=S()?.sync?.scenario||{};
   const adaptive=['001','002','003','004','005'].includes(sid)&&sc.investigation_deep_v286===true
    ||sid==='006'&&sc.investigation_006_adaptive===true
    ||sid==='007'&&sc.investigation_007_adaptive===true
    ||sid==='008'&&sc.investigation_008_adaptive===true
    ||sid==='009'&&sc.investigation_009_adaptive===true
    ||sid==='010'&&sc.investigation_010_adaptive===true;
   const reports=(S()?.sync?.events||[]).filter(e=>e.event_type==='investigation_'+sid && Number(e.cycle)===cycle);
   const mainCount=reports.filter(e=>/_([1-9])$/.test(String(e.payload?.id||''))).length;
   const optionalCount=reports.filter(e=>/_(1[0-9]|20)$/.test(String(e.payload?.id||''))).length;
   const label=makeEl('small','igr634-priority-label',tr('PISTES DU CYCLE '+cycle,'CYCLE '+cycle+' LEADS'));
   const title=makeEl('h3','',tr('Choisis une vérification','Choose what to check'));
   const hint=makeEl('p','',tr('Une seule piste au choix par cycle. Confronte cette pièce aux déclarations ; les autres restent cachées.','Choose one lead per cycle. Compare it with statements; other leads stay hidden.'));
    priority.append(label,title,hint,...bucket.priority);outside.appendChild(priority);
 }
 if(lead){
   const area=makeEl('section','igr634-interviews');
   area.id='igr634-interviews';
   const h=makeEl('h3','',tr('Interrogatoires','Interviews'));area.appendChild(h);
   const underway=ACTIVE_INTERVIEWS.has(phase());
   const status=makeEl('p','igr634-subtitle',underway
     ? tr('Convocations et commandes de la phase en cours.','Current phase interviews and controls.')
     : tr('Les convocations apparaîtront ici pendant leur phase.','Summons appear here during the interview phase.'));
   area.appendChild(status);
   if(bucket.interviews.length)bucket.interviews.forEach(el=>area.appendChild(el));
   else area.appendChild(makeEl('p','igr634-empty',tr('Aucun interrogatoire à lancer actuellement.','No interview to start right now.')));
   outside.appendChild(area);
 }
 const makeGroup=(id,title,kicker,arr,isOpen)=>{
   const section=group(id,title,kicker,arr,isOpen);
   section.id='igr634-'+id;outside.appendChild(section);
 };
 if(!bucket.actions.length)bucket.actions.push(makeEl('p','igr634-empty',tr('Aucune décision supplémentaire à prendre dans cette phase.','No additional decision in this phase.')));
 makeGroup('actions',lead?tr('Actions du cycle','Cycle actions'):tr('Mes commandes officielles','My official controls'),tr('À EFFECTUER','TO DO'),bucket.actions,true);
 const hasEvidence=bucket.evidence.length>0;
 if(!bucket.evidence.length)bucket.evidence.push(makeEl('p','igr634-empty',tr('Aucun nouvel élément disponible ici. Consulte aussi le Dossier commun.','No additional finding here. Also check the Shared case file.')));
 makeGroup('evidence',tr('Pièces examinées','Examined evidence'),tr('FAITS ET SOURCES À CONFRONTER','FACTS AND SOURCES TO COMPARE'),bucket.evidence,hasEvidence);
 const noteInfo=makeEl('p','igr634-notice',tr('Notes du camp Enquête. Une note ne constitue pas une preuve.','Investigation team notes. A note is not evidence.'));
 bucket.notebook.unshift(noteInfo);
 makeGroup('notebook',tr('Carnet partagé · camp Enquête','Shared investigation notebook'),tr('NOTES DURABLES · CAMP ENQUÊTE','SAVED TEAM NOTES'),bucket.notebook,false);
 if(typeof window.renderNotesTabV32==='function'){
  const privateEditor=document.createElement('template');
  privateEditor.innerHTML=String(window.renderNotesTabV32()||'');
  const info=makeEl('p','igr634-notice',tr('Notes privées, uniquement sur cet appareil. Le carnet partagé est destiné au camp Enquête.','Private notes on this device only. The shared notebook belongs to the investigation team.'));
  makeGroup('personal',tr('Mes notes personnelles · privées','My private personal notes'),tr('MOI SEUL · CET APPAREIL','ONLY ME · THIS DEVICE'),[info,...Array.from(privateEditor.content.childNodes)],false);
 }
 return outside.outerHTML;
}
const oldTabs=typeof gameTabs==='function'?gameTabs:window.gameTabs;
if(typeof oldTabs==='function'){
 const wrapped=function(...args){
  const tabs=oldTabs.apply(this,args)||[];
  return eligible()?tabs.filter(x=>x?.id!=='notes').map(x=>x?.id==='channel'?{...x,label:tr('Canal · messages','Channel · messages')}:x):tabs;
 };
 try{gameTabs=wrapped}catch(_){}window.gameTabs=wrapped;
}
const oldRenderCard=typeof renderCardTab==='function'?renderCardTab:window.renderCardTab;
if(typeof oldRenderCard==='function'){
 const wrapped=function(...args){
  const html=String(oldRenderCard.apply(this,args)??'');
  if(!eligible())return html;
  const template=document.createElement('template');template.innerHTML=html;
  template.content.querySelectorAll('.private-notes').forEach(n=>n.remove());
  return template.innerHTML;
 };
 try{renderCardTab=wrapped}catch(_){}window.renderCardTab=wrapped;
}
const oldChannel=typeof renderChannelTab==='function'?renderChannelTab:window.renderChannelTab;
if(typeof oldChannel==='function'){
 const wrapped=function(...args){
  const original=String(oldChannel.apply(this,args)??'');
  if(!eligible())return original;
  return '<p class="igr634-channel-help">'+tr('Canal = messages instantanés. Carnet partagé = notes de l’enquête, visibles uniquement par votre camp et conservées dans la partie.','Channel = instant messages. Shared notebook = investigation notes saved for your team during the match.')+'</p>'+original;
 };
 try{renderChannelTab=wrapped}catch(_){}window.renderChannelTab=wrapped;
}
const oldSetTab=typeof setTab==='function'?setTab:window.setTab;
if(typeof oldSetTab==='function'){
 const wrapped=function(id,...args){return oldSetTab.apply(this,[id==='notes'&&eligible()?'investigation':id,...args])};
 try{setTab=wrapped}catch(_){}window.setTab=wrapped;
}
const oldRenderTab=typeof renderGameTab==='function'?renderGameTab:window.renderGameTab;
if(typeof oldRenderTab==='function'){
 const wrapped=function(...args){
  const s=S();
  if(eligible()&&s?.tab==='notes')s.tab='investigation';
  const result=oldRenderTab.apply(this,args);
  if(!eligible()||s?.view!=='game'||s?.tab!=='investigation')return result;
  try{return organize(String(result??''))}catch(err){console.warn('[IGR v634] workspace fallback',err);return result}
 };
 try{renderGameTab=wrapped}catch(_){}window.renderGameTab=wrapped;
}
document.addEventListener('toggle',e=>{
 const d=e.target;
 if(!d?.matches?.('details[data-igr634-group]'))return;
 expanded.set(scope()+':'+d.dataset.igr634Group,Boolean(d.open));
 if(expanded.size>80)expanded.delete(expanded.keys().next().value);
},true);
window.IGR_INVESTIGATION_WORKSPACE_V634=Object.freeze({version:VERSION,eligible,organize});
})();
