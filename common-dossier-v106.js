/* v106 — role-safe public dossier / confidential fiche / in-phase actions.
   Requires igr_v106_common_dossier RPC. NO secret manuscript is bundled. */
(()=>{
'use strict';
const V='v106';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
const game=()=>S()?.sync||null;
const role=()=>game()?.player?.public_role||S()?.role||'';
const AUTH=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const isInquiry=()=>AUTH.has(role());
const tr=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeCycle=v=>[1,2,3].includes(Number(v))?Number(v):null;

// v774: concise, reversible card previews; original evidence remains accessible.
const case004Briefs={
 'appel entre les proches':'Les deux proches se sont appelés après leurs messages. Les relevés ne disent pas ce qu’ils se sont dit.',
 'deux alertes distinctes':'Deux personnes ont reçu des alertes différentes après la rupture du premier suspect. Le contenu de leurs échanges reste inconnu.',
 'journal des destinataires':'Aucun transfert des deux alertes à l’ex-partenaire n’apparaît dans les relevés. Il a toutefois pu être informé autrement.'
};
function readableTitle(value){
 const v=String(value||'').trim();
 return v.length>5&&v===v.toLocaleUpperCase('fr')?v.slice(0,1)+v.slice(1).toLocaleLowerCase('fr'):v;
}
function conciseCaseText(value,title){
 const full=String(value??'').replace(/\s+/g,' ').trim();
 if(!full)return '';
 const id=String(game()?.room?.scenario_id||'');
 const key=String(title||'').trim().toLocaleLowerCase('fr');
 if(id==='004'&&case004Briefs[key])return case004Briefs[key];
 if(full.length<=165)return full;
 const parts=full.match(/[^.!?]+(?:[.!?]+[»”']?|$)/g)||[full];
 let brief=String(parts[0]||'').trim(),next=String(parts[1]||'').trim();
 if(next&&brief.length<96&&(brief+' '+next).length<=170)brief+=' '+next;
 if(brief.length>175){
  const cut=brief.slice(0,172);
  const punctuation=Math.max(cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf(': '));
  const boundary=punctuation>=92?punctuation:cut.lastIndexOf(' ');
  brief=(boundary>=80?cut.slice(0,boundary):cut).replace(/[,;:\s]+$/,'')+'…';
 }
 return brief;
}
function expandableCopy(full,brief,kind='evidence'){
 if(!full||full.replace(/\s+/g,' ').trim()===brief)return '';
 return '<details class="igr774-detail" data-copy-kind="'+esc(kind)+'"><summary>'+esc(tr('Voir le texte complet','Read the full text'))+'</summary><p>'+esc(full)+'</p></details>';
}

let cache={key:'',data:null,last:0,busy:false,err:false};
function key(){const d=game();return d?.room?.code&&S()?.token?d.room.code+':'+d.player.id+':'+String(d.room.state?.match_no||1):''}
function visibleTab(id){if(id==='chronology')return false;if(id==='investigation')return isInquiry();return true}
function sanitizeTab(){const state=S();if(state&&!visibleTab(state.tab))state.tab='timeline'}
async function syncPublic(force=false){
 const d=game(),k=key();if(!k||!d||d.room.status==='lobby')return;
 if(cache.key!==k)cache={key:k,data:null,last:0,busy:false,err:false};
 if(cache.busy||(!force&&Date.now()-cache.last<2600))return;
 cache.busy=true;cache.last=Date.now();
 try{
  const result=await rpc('igr_v106_common_dossier',{p_code:d.room.code,p_player_token:S().token});
  if(k!==key())return;
  if(!result||result.room_code!==d.room.code||!Array.isArray(result.events))throw Error('Invalid public dossier response');
  const previous=cache.data;
  const changed=JSON.stringify(previous)!==JSON.stringify(result);
  if(previous){const ids=new Set(previous.events.map(e=>String(e.id)));window.IGR_NOTIFICATIONS?.publicUpdates?.({roomCode:d.room.code,playerId:d.player.id,events:result.events.filter(e=>!ids.has(String(e.id)))});}
  cache.data=result;cache.err=false;
  window.IGR_NOTIFICATIONS?.refreshBadges?.();
  if(changed&&S()?.view==='game'&&S()?.tab==='timeline'){
   const root=document.querySelector('#app .game-panel-v11');
   if(root)root.innerHTML=publicHtml();
  }
 }catch(error){if(k===key()){cache.err=true;console.warn('[IGR v106] public dossier unavailable',error?.message||error)}}
 finally{cache.busy=false}
}
/* The public RPC is the single source of truth for all dossier counters.
   Avoid repeating the opening context when it has already been printed as premise. */
function publicEntries(data){
 const context=String(data?.context||'').trim().replace(/\s+/g,' ').normalize('NFKC').toLocaleLowerCase();
 return (Array.isArray(data?.events)?data.events:[]).filter(e=>{
   const normalized=String(e?.text||'').trim().replace(/\s+/g,' ').normalize('NFKC').toLocaleLowerCase();
   const title=String(e?.title||'').trim().toLocaleLowerCase();
   const sameOpening=e?.event_type==='context'&&((context&&normalized===context)||title==='contexte');
   const redundantCycleSummary=e?.event_type==='public_notice' && /^Bilan public\s*[·-]\s*cycle\s*\d+/i.test(String(e?.title||''));
   return !sameOpening && !redundantCycleSummary;
 });
}
function visibleEventIds(){
 const data=cache.key===key()?cache.data:null;
 if(!data)return null;
 return publicEntries(data).map(e=>String(e.id)).filter(Boolean);
}
function publicHtml(){
 const d=game();if(!d)return '';
 const a=cache.key===key()?cache.data:null;
 const rawContext=String(a?.context??d.scenario?.context??'').trim();
 const context=String(d.room.scenario_id)==='004'
  ?tr('Sofia est morte après une nuit de détresse. Trois proches apparaissent dans le dossier. Ils ont reçu des informations différentes, à des moments différents. La Grey Room doit reconstruire les appels, les silences et les décisions.','Sofia died after a night of distress. Three people close to her appear in the case. They learned different things at different times. The Grey Room must reconstruct the calls, silences and decisions.')
  :rawContext;
 const events=publicEntries(a).slice().reverse();
 const history=events.map(e=>{
  const c=safeCycle(e.cycle),press=e.event_type==='breaking_news'||e.press_claim;
  const type=press?tr('PUBLICATION DU JOURNALISTE','PRESS PUBLICATION'):e.event_type==='public_notice'?tr('BILAN PUBLIC DU CYCLE','PUBLIC CYCLE SUMMARY'):e.event_type==='public_evidence'?tr('PIÈCE COMMUNIQUÉE · À RECOUPER','SHARED DOCUMENT · CHECK THE SOURCE'):e.verified?tr('ÉLÉMENT VÉRIFIÉ','VERIFIED FINDING'):tr('INFORMATION PUBLIQUE','PUBLIC INFORMATION');
  // Only the authenticated public dossier RPC can populate this screen.
  // Documents voluntarily disclosed to all remain available without burying the
  // other public updates in long paragraphs on a narrow phone.
  const published=e.event_type==='public_evidence';
  const full=String(e.text||'').trim(),brief=conciseCaseText(full,e.title);
  const body=published
   ?'<p class="igr774-brief">'+esc(brief)+'</p>'+expandableCopy(full,brief,'public')
   :'<p>'+esc(full)+'</p>';
  return '<article class="igr106-event" data-igr-event-id="'+esc(e.id)+'" data-cycle="'+(c||0)+'" data-public-document="'+(published?'true':'false')+'"><div class="igr106-meta"><span>'+esc(type)+'</span><span>'+esc(c?tr('CYCLE ','CYCLE ')+c:tr('DATE NON PRÉCISÉE','DATE UNSPECIFIED'))+'</span></div><h4>'+esc(e.title||tr('Nouvelle information','Case update'))+'</h4>'+body+(press?'<small>'+esc(e.verified?tr('Publication scénarisée · à recouper','Scripted publication · verify independently'):tr('Déclaration journalistique · non vérifiée','Press claim · unverified'))+'</small>':'')+'</article>';
 }).join('');
 return '<section class="igr106-common" aria-label="'+esc(tr('Dossier commun','Shared case file'))+'"><header><small>'+esc(tr('ACCESSIBLE À TOUS LES RÔLES','VISIBLE TO ALL ROLES'))+'</small><h2>'+esc(tr('Dossier commun','Shared case file'))+'</h2></header><article class="igr106-premise"><h3>'+esc(tr('Situation connue de tous','Shared starting situation'))+'</h3><p>'+esc(context||tr('Le dossier sera présenté au lancement de la partie.','The case will be introduced when play begins.'))+'</p></article><div class="igr106-events"><h3>'+esc(tr('Publications et faits partagés','Shared news and events'))+'</h3>'+(cache.err&&!a?'<p class="igr106-muted">'+esc(tr('Connexion au dossier commun indisponible. Réessai automatique.','Shared case file temporarily unavailable. Retrying.'))+'</p>':!a?'<p class="igr106-muted">'+esc(tr('Synchronisation des informations publiques…','Loading public updates…'))+'</p>':history||'<p class="igr106-muted">'+esc(tr('Aucune nouvelle information publique pour le moment.','No new shared update yet.'))+'</p>')+'</div></section>';
}
const origTabs=typeof gameTabs==='function'?gameTabs:null;
if(origTabs){const wrapper=function(){
 const tabs=[...(origTabs.apply(this,arguments)||[])];
 if(!tabs.some(t=>t?.id==='timeline'))tabs.push({id:'timeline',label:'Dossier commun'});
 const visible=tabs.filter(t=>visibleTab(t?.id));
 const common=visible.find(t=>t?.id==='timeline');
 const ordered=visible.filter(t=>t?.id!=='timeline');
 const inquiry=ordered.findIndex(t=>t?.id==='investigation');
 const card=ordered.findIndex(t=>t?.id==='card');
 ordered.splice(inquiry>=0?inquiry+1:card>=0?card+1:0,0,common);
 return ordered.map(t=>t?.id==='card'?{...t,label:tr('Ma fiche','My role')}:t?.id==='timeline'?{...t,label:tr('Dossier commun','Shared case file')}:t?.id==='investigation'?{...t,label:tr('Enquête','Investigation')}:t);
};try{gameTabs=wrapper}catch{}window.gameTabs=wrapper;}
const origCard=typeof privateCardHtml==='function'?privateCardHtml:null;
if(origCard){const wrapper=function(){
 const html=String(origCard.apply(this,arguments)??'');
 try{
  const t=document.createElement('template');t.innerHTML=html;
  const card=t.content.querySelector('.private-card-v11');if(!card)return html;
  const blocks=[...card.querySelectorAll('.private-block')];
  let stack=null;
  for(const block of blocks){
   const title=block.querySelector('h4')?.textContent?.trim()||'';
   if(!title)continue;
   if(/^(TA PLACE|YOUR PLACE)$/i.test(title))continue;
   if(!stack){stack=document.createElement('div');stack.className='igr106-facts';}
   const details=document.createElement('details');details.className='igr106-fact';
   const summary=document.createElement('summary');summary.textContent=title;
   // The essentials should be readable without repeatedly opening accordions.
   details.open=/^(TON RÔLE|QUI TU ES|CE QUI S[’']EST PASSÉ|CE QUE TU AS FAIT|TON HISTOIRE|CE QUE TU CACHES)$/i.test(title);
   details.appendChild(summary);const body=document.createElement('div');body.className='igr106-fact-body';
   for(const child of [...block.childNodes])if(child.nodeType!==1||child.tagName!=='H4')body.appendChild(child.cloneNode(true));
   // Long player-card paragraphs show their opening; the whole original stays one tap away.
   for(const paragraph of [...body.querySelectorAll('p')]){
    if(paragraph.children.length)continue;
    const original=String(paragraph.textContent||'').trim();
    if(original.length<=195)continue;
    const short=conciseCaseText(original,title);
    if(short===original)continue;
    paragraph.textContent=short;
    const more=document.createElement('details');more.className='igr774-detail';
    const heading=document.createElement('summary');heading.textContent=tr('Voir le texte complet','Read the full text');
    const rest=document.createElement('p');rest.textContent=original;
    more.append(heading,rest);paragraph.after(more);
   }
   details.appendChild(body);stack.appendChild(details);block.remove();
  }
  if(stack){const foot=card.querySelector('.private-foot');if(foot)card.insertBefore(stack,foot);else card.appendChild(stack)}
  return t.innerHTML;
 }catch(err){console.warn('[IGR v106] card fallback',err);return html}
};try{privateCardHtml=wrapper}catch{}window.privateCardHtml=wrapper;}

/* v771: two distinct investigators must authorize a public release. */
let disclosure={key:'',data:null,last:0,busy:false,error:false};
function disclosureRows(){
 if(disclosure.error)return '<p class="igr771-status">'+esc(tr('Propositions indisponibles. Réessai automatique.','Proposals unavailable. Retrying.'))+'</p>';
 if(!disclosure.data)return '<p class="igr771-status">'+esc(tr('Recherche des éléments autorisés…','Loading eligible findings…'))+'</p>';
 const rows=(disclosure.data.candidates||[]).filter(x=>!x.published).slice(0,6);
 if(!rows.length)return '<p class="igr771-status">'+esc(tr('Aucun élément éligible pour le moment. Poursuis les vérifications.','No eligible finding yet. Continue checking leads.'))+'</p>';
 return rows.map(x=>{
  const id=Number(x.id);
  if(!Number.isSafeInteger(id)||id<1)return '';
  const required=Number(x.required_votes)===1?1:2, votes=Math.max(0,Math.min(required,Number(x.votes)||0)),voted=Boolean(x.mine);
  const label=voted?(votes>=required?tr('Finaliser la publication','Finish publication'):tr('Accord enregistré','Approval recorded')):required===1?tr('Publier pour tous','Publish for everyone'):votes===0?tr('Proposer la publication','Propose publication'):tr('Approuver la publication','Approve publication');
  const full=String(x.text||'').trim(),brief=conciseCaseText(full,x.title);
  return '<article class="igr771-option"><div class="igr771-option-head"><strong>'+esc(readableTitle(x.title||tr('Élément officiel','Official finding')))+'</strong><small>'+votes+'/'+required+'</small></div><p class="igr774-brief">'+esc(brief)+'</p>'+expandableCopy(full,brief)+'<button type="button" class="btn ghost small" data-igr771-vote="'+id+'" onclick="igr771Vote('+id+')" '+(voted&&votes<required?'disabled':'')+'>'+esc(label)+'</button></article>';
 }).join('');
}
function disclosurePanel(){
 return '<section class="igr771-disclosure"><details><summary>'+esc(tr('Partager une pièce au Dossier commun','Share a document with everyone'))+'</summary><div class="igr771-inside"><p>'+esc(tr('Deux accords pour publier (un seul si tu es l’unique enquêteur autorisé). Visible par tous, suspects compris. Maximum : 2 pièces par cycle.','Two approvals to publish (one if you are the only eligible investigator). Everyone, including suspects, can read it. Maximum: 2 documents per cycle.'))+'</p><div class="igr771-options">'+disclosureRows()+'</div></div></details></section>';
}
function renderDisclosure(){
 const el=document.querySelector('#app .igr771-options');
 if(el){const h=disclosureRows();if(el.innerHTML!==h)el.innerHTML=h}
}
async function syncDisclosure(force=false){
 const d=game(),k=key();
 if(!isInquiry()||!d||d.room.status!=='playing'||!k)return;
 if(disclosure.key!==k)disclosure={key:k,data:null,last:0,busy:false,error:false};
 if(disclosure.busy||(!force&&Date.now()-disclosure.last<8500))return;
 disclosure.busy=true;disclosure.last=Date.now();
 try{
  const r=await rpc('igr_v771_dossier_candidates',{p_code:d.room.code,p_player_token:S().token});
  if(k!==key())return;
  if(!r||!Array.isArray(r.candidates))throw Error('Invalid disclosure response');
  disclosure.data=r;disclosure.error=false;renderDisclosure();
 }catch(err){if(k===key()){disclosure.error=true;renderDisclosure();console.warn('[IGR v771] candidates',err?.message||err)}}
 finally{disclosure.busy=false}
}
window.igr771Vote=async function(id){
 const d=game(),k=key(),eventId=Number(id);
 if(!isInquiry()||!d||d.room.status!=='playing'||!Number.isSafeInteger(eventId)||eventId<1)return;
 const c=(disclosure.data?.candidates||[]).find(x=>Number(x.id)===eventId);
 if(!c||c.published)return;
 const required=Number(c.required_votes)===1?1:2;
 if(c.mine&&Number(c.votes)<required)return;
 const publishing=Number(c.votes)+(c.mine?0:1)>=required;
 if(publishing&&typeof window.confirm==='function'&&!window.confirm(tr('Publier cette pièce pour TOUS les joueurs, suspects compris ?','Publish this document to ALL players, including suspects?')))return;
 const b=document.querySelector('[data-igr771-vote="'+eventId+'"]');if(b)b.disabled=true;
 try{
  const r=await rpc('igr_v771_dossier_vote',{p_code:d.room.code,p_player_token:S().token,p_event_id:eventId});
  if(k!==key())return;
  if(typeof toast==='function')toast(r?.status==='published'?tr('Pièce publiée dans le Dossier commun.','Document published in the shared case file.'):tr('Accord enregistré. Une deuxième validation est nécessaire.','Approval saved. A second approval is needed.'));
  await syncDisclosure(true);
  if(r?.status==='published')await syncPublic(true);
 }catch(err){if(typeof toast==='function')toast(tr('Publication impossible : droits, quota ou connexion à vérifier.','Could not publish: check permissions, quota or connection.'));console.warn('[IGR v771] vote',err?.message||err);await syncDisclosure(true)}
};

const origTab=typeof renderGameTab==='function'?renderGameTab:null;
if(origTab){const wrapper=function(){
 sanitizeTab();
 if(S()?.tab==='timeline')return publicHtml();
 let result=origTab.apply(this,arguments);
 if(S()?.tab==='investigation'&&isInquiry())result=disclosurePanel()+result;
 if(S()?.tab==='investigation'&&isInquiry()&&role()!=='enqueteur'){
  const extra=window.IGR_INVESTIGATION_V42?.renderElementsTab?.()||'';
  return extra?'<section class="igr106-inquiry-evidence"><h3>'+esc(tr('Preuves et éléments reçus','Evidence and findings'))+'</h3>'+extra+'</section>'+result:result;
 }
 return result;
};try{renderGameTab=wrapper}catch{}window.renderGameTab=wrapper;}
function actionHtml(){
 const d=game();if(!d||d.room.status!=='playing'||d.room.phase==='role_reading')return '';
 if(isInquiry())return '<button class="btn ghost small igr106-go-enquiry" type="button" onclick="setTab(\'investigation\')">'+esc(tr('Ouvrir les actions d’enquête','Open investigation actions'))+'</button>';
 if(role()==='journaliste'&&d.room.phase==='locking')return typeof renderInvestigationTab==='function'?String(renderInvestigationTab()||''):'';
 if(role()==='journaliste'){
  return '<button class="btn ghost small" type="button" onclick="setTab(\'press50\')">'+esc(tr('Ouvrir Presse et publier','Open Press and publish'))+'</button>';
 }
 return typeof renderInvestigationTab==='function'?String(renderInvestigationTab()||''):'';
}
const origRender=typeof renderGame==='function'?renderGame:null;
if(origRender){const wrapper=function(){
 sanitizeTab();const result=origRender.apply(this,arguments);
 try{
  const d=game(),main=document.querySelector('#app .game-v11'),tabs=main?.querySelector('.tabs-v11');
  if(main&&tabs&&d?.room?.status==='playing'){
   const aside=document.createElement('details');aside.className='igr106-action-panel';
   const phase=d.room.phase||'';
   const important=['interrogation','interrogation_select','provisional_lock','defense','locking','cycle_debrief','event_select'].includes(phase);
   if(important&&!isInquiry())aside.open=true;
   const summary=document.createElement('summary');
   const notice=typeof rolePhaseNotice==='function'?rolePhaseNotice(d):null;
   const heading=document.createElement('b');heading.textContent=tr('Action en cours','Current action');
   summary.appendChild(heading);
   if(notice?.text){
    const hint=document.createElement('small');hint.className='igr106-current-action';
    hint.textContent=String(notice.text).replace(/<[^>]*>/g,'').slice(0,145);
    summary.appendChild(hint);
   }
   aside.appendChild(summary);
   const content=document.createElement('div');content.className='igr106-actions-inner';content.innerHTML=actionHtml();aside.appendChild(content);
   tabs.before(aside);
   // Public information only: the private state is never used in this banner.
   if(S()?.tab!=='timeline'){
    const teaser=document.createElement('aside');
    teaser.className='igr106-public-teaser';
    const concise=String(d.room.scenario_id)==='004'
     ?tr('Sofia est morte après une nuit de détresse. Trois proches ont reçu des informations différentes, à des moments différents.','Sofia died after a night of distress. Three people close to her learned different things at different times.')
     :(typeof publicScenarioSummary==='function'?String(publicScenarioSummary(d.room.scenario_id)||''):String(d.scenario?.context||''));
    const title=document.createElement('strong');title.textContent=tr('SITUATION CONNUE DE TOUS','SHARED STARTING SITUATION');
    const paragraph=document.createElement('p');paragraph.textContent=concise;
    const go=document.createElement('button');go.type='button';go.className='igr106-public-open';
    go.textContent=tr('Voir les faits partagés','See shared facts');
    go.addEventListener('click',()=>setTab('timeline'));
    teaser.append(title,paragraph,go);aside.before(teaser);
   }
   // The investigation workspace already provides the active actions. Do not duplicate them.
   if(isInquiry())aside.remove();
  }
  if(S()?.tab==='timeline')void syncPublic();
  if(S()?.tab==='investigation'&&isInquiry())void syncDisclosure();
 }catch(err){console.warn('[IGR v106] action fallback',err)}
 return result;
};try{renderGame=wrapper}catch{}window.renderGame=wrapper;}
window.setInterval(()=>{const d=game();if(d&&S()?.view==='game'&&d.room.status==='playing'){void syncPublic();if(S()?.tab==='investigation'&&isInquiry())void syncDisclosure();}},4300);
const style=document.createElement('style');style.id='igr106-css';style.textContent=`
.igr106-common{max-width:940px;margin:auto;display:grid;gap:16px}
.igr106-common header small{font-size:.66rem;letter-spacing:.13em;color:#9ca2a6}
.igr106-common h2{font-size:1.3rem;margin:5px 0 0}
.igr106-premise,.igr106-event{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px}
.igr106-premise h3,.igr106-events h3{font-size:.95rem;margin:0 0 10px}
.igr106-premise p,.igr106-event p{white-space:pre-wrap;line-height:1.55;margin:8px 0}
.igr106-events{display:grid;gap:10px}
.igr106-event{border-left:3px solid #777e85}.igr106-event[data-cycle="1"]{border-left-color:#a8a49c}.igr106-event[data-cycle="2"]{border-left-color:#c89f64}.igr106-event[data-cycle="3"]{border-left-color:#b96565}
.igr106-meta{display:flex;justify-content:space-between;gap:9px;flex-wrap:wrap;font-size:.64rem;letter-spacing:.08em;color:#a9b0b6}
.igr106-event h4{font-size:.96rem;margin:9px 0 5px}.igr106-event small,.igr106-muted{color:#a8afb4;line-height:1.4}
.igr106-common,.igr106-events,.igr106-premise,.igr106-event{min-width:0;max-width:100%;box-sizing:border-box}
.igr106-premise p,.igr106-event h4,.igr106-event p,.igr106-meta span{overflow-wrap:anywhere}
.igr106-public-document{margin:10px 0 0;border-top:1px solid rgba(255,255,255,.10);padding-top:9px}
.igr106-public-document summary{cursor:pointer;list-style-position:inside;font-size:.82rem;font-weight:700;line-height:1.5;color:#b7cbcf;touch-action:manipulation}
.igr106-public-document[open] summary{margin-bottom:8px}
.igr106-public-document p{margin:0;white-space:pre-wrap;line-height:1.55;color:#d5dadd}
.igr106-event[data-public-document="true"]{border-left-color:#82aeb2}
.igr106-action-panel{margin:8px 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.025)}
.igr106-action-panel>summary{padding:11px 13px;cursor:pointer;font-weight:700;font-size:.86rem}
.igr106-actions-inner{padding:9px 13px 14px}.igr106-actions-inner .phase-explain{margin-top:0}
.igr106-facts{display:grid;gap:7px;margin:12px 0}.igr106-fact{border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.02)}.igr106-fact>summary{cursor:pointer;padding:12px 13px;font-weight:700;letter-spacing:.04em;font-size:.81rem}.igr106-fact-body{padding:0 13px 13px;line-height:1.5}.igr106-fact-body p{margin:0}
.igr106-inquiry-evidence{margin-bottom:14px}
.igr771-disclosure{margin:0 0 14px;border:1px solid rgba(192,180,154,.28);border-radius:13px;background:rgba(192,180,154,.045)}
.igr771-disclosure>details>summary{padding:13px 14px;cursor:pointer;font-weight:700}
.igr771-inside{padding:0 13px 14px}.igr771-inside>p{font-size:.8rem;line-height:1.5;color:#b5b9bc;margin:0 0 11px}
.igr771-options{display:grid;gap:9px}.igr771-option{padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.16)}
.igr771-option-head{display:flex;align-items:start;justify-content:space-between;gap:9px}.igr771-option-head strong{font-size:.84rem}.igr771-option-head small{color:#d6c2a0}
.igr771-option p{font-size:.8rem;line-height:1.45;color:#b8bec2;margin:6px 0 10px}
.igr771-option button{min-height:36px;max-width:100%;white-space:normal}
.igr771-option .igr774-brief,.igr106-event .igr774-brief{font-size:.85rem;line-height:1.43;color:#e2e5e6;margin:7px 0 9px}
.igr771-option-head strong{line-height:1.3;overflow-wrap:anywhere}
.igr774-detail{margin:3px 0 12px;border-top:1px solid rgba(255,255,255,.07);padding-top:6px}
.igr774-detail>summary{cursor:pointer;font-size:.78rem;color:#c9baa0;line-height:1.5}
.igr774-detail>p{margin:8px 0!important;color:#b5bec5!important;overflow-wrap:anywhere;white-space:pre-wrap}
.igr106-fact-body .igr774-detail{margin-bottom:8px}
@media(max-width:600px){.igr771-option{padding:11px}.igr771-option-head strong{font-size:.82rem}.igr771-inside{padding:0 11px 12px}}
@media(max-width:600px){.igr106-premise,.igr106-event{padding:12px}.igr106-action-panel{margin:8px 0}.igr106-common{gap:11px}}
`;document.head.appendChild(style);
window.IGR_COMMON_DOSSIER_V106=Object.freeze({version:V,isInquiry,publicHtml,syncPublic,visibleEventIds});
console.info('[IGR v106] public/private separation active');
})();