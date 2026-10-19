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
  const changed=JSON.stringify(cache.data)!==JSON.stringify(result);
  cache.data=result;cache.err=false;
  if(changed&&S()?.view==='game'&&S()?.tab==='timeline'){
   const root=document.querySelector('#app .game-panel-v11');
   if(root)root.innerHTML=publicHtml();
  }
 }catch(error){if(k===key()){cache.err=true;console.warn('[IGR v106] public dossier unavailable',error?.message||error)}}
 finally{cache.busy=false}
}
function publicHtml(){
 const d=game();if(!d)return '';
 const a=cache.key===key()?cache.data:null;
 const context=String(a?.context??d.scenario?.context??'').trim();
 const events=(a?.events||[]).slice().reverse();
 const history=events.map(e=>{
  const c=safeCycle(e.cycle),press=e.event_type==='breaking_news'||e.press_claim;
  const type=press?tr('PUBLICATION DU JOURNALISTE','PRESS PUBLICATION'):e.verified?tr('FAIT CONFIRMÉ','VERIFIED FACT'):tr('INFORMATION PUBLIQUE','PUBLIC INFORMATION');
  return '<article class="igr106-event" data-cycle="'+(c||0)+'"><div class="igr106-meta"><span>'+esc(type)+'</span><span>'+esc(c?tr('CYCLE ','CYCLE ')+c:tr('DATE NON CLASSÉE','CYCLE UNKNOWN'))+'</span></div><h4>'+esc(e.title||tr('Nouvelle information','Case update'))+'</h4><p>'+esc(e.text||'')+'</p>'+(press?'<small>'+esc(e.verified?tr('Publication scénarisée · à recouper','Scripted publication · verify independently'):tr('Déclaration journalistique · non vérifiée','Press claim · unverified'))+'</small>':'')+'</article>';
 }).join('');
 return '<section class="igr106-common" aria-label="'+esc(tr('Dossier commun','Shared case file'))+'"><header><small>'+esc(tr('ACCESSIBLE À TOUS LES RÔLES','VISIBLE TO ALL ROLES'))+'</small><h2>'+esc(tr('Dossier commun','Shared case file'))+'</h2></header><article class="igr106-premise"><h3>'+esc(tr('Situation connue de tous','Shared starting situation'))+'</h3><p>'+esc(context||tr('Le dossier sera présenté au lancement de la partie.','The case will be introduced when play begins.'))+'</p></article><div class="igr106-events"><h3>'+esc(tr('Publications et faits partagés','Shared news and events'))+'</h3>'+(cache.err&&!a?'<p class="igr106-muted">'+esc(tr('Connexion au dossier commun indisponible. Réessai automatique.','Shared case file temporarily unavailable. Retrying.'))+'</p>':!a?'<p class="igr106-muted">'+esc(tr('Synchronisation des informations publiques…','Loading public updates…'))+'</p>':history||'<p class="igr106-muted">'+esc(tr('Aucune nouvelle information publique pour le moment.','No new shared update yet.'))+'</p>')+'</div></section>';
}
const origTabs=typeof gameTabs==='function'?gameTabs:null;
if(origTabs){const wrapper=function(){const tabs=[...(origTabs.apply(this,arguments)||[])];if(!tabs.some(t=>t?.id==='timeline')){const i=tabs.findIndex(t=>t?.id==='card');tabs.splice(i>=0?i+1:0,0,{id:'timeline',label:'Dossier commun'});}return tabs.filter(x=>visibleTab(x?.id)).map(t=>t?.id==='card'?{...t,label:tr('Ma fiche','My role')}:t?.id==='timeline'?{...t,label:tr('Dossier commun','Shared case file')}:t?.id==='investigation'?{...t,label:tr('Enquête','Investigation')}:t)};try{gameTabs=wrapper}catch{}window.gameTabs=wrapper;}
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
   details.appendChild(summary);const body=document.createElement('div');body.className='igr106-fact-body';
   for(const child of [...block.childNodes])if(child.nodeType!==1||child.tagName!=='H4')body.appendChild(child.cloneNode(true));
   details.appendChild(body);stack.appendChild(details);block.remove();
  }
  if(stack){const foot=card.querySelector('.private-foot');if(foot)card.insertBefore(stack,foot);else card.appendChild(stack)}
  return t.innerHTML;
 }catch(err){console.warn('[IGR v106] card fallback',err);return html}
};try{privateCardHtml=wrapper}catch{}window.privateCardHtml=wrapper;}
const origTab=typeof renderGameTab==='function'?renderGameTab:null;
if(origTab){const wrapper=function(){
 sanitizeTab();
 if(S()?.tab==='timeline')return publicHtml();
 const result=origTab.apply(this,arguments);
 if(S()?.tab==='investigation'&&isInquiry()){
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
   const summary=document.createElement('summary');summary.textContent=tr('Action en cours','Current action');aside.appendChild(summary);
   const content=document.createElement('div');content.className='igr106-actions-inner';content.innerHTML=actionHtml();aside.appendChild(content);
   tabs.before(aside);
  }
  if(S()?.tab==='timeline')void syncPublic();
 }catch(err){console.warn('[IGR v106] action fallback',err)}
 return result;
};try{renderGame=wrapper}catch{}window.renderGame=wrapper;}
window.setInterval(()=>{const d=game();if(d&&S()?.view==='game'&&d.room.status==='playing')void syncPublic();},4300);
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
.igr106-action-panel{margin:8px 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.025)}
.igr106-action-panel>summary{padding:11px 13px;cursor:pointer;font-weight:700;font-size:.86rem}
.igr106-actions-inner{padding:9px 13px 14px}.igr106-actions-inner .phase-explain{margin-top:0}
.igr106-facts{display:grid;gap:7px;margin:12px 0}.igr106-fact{border:1px solid rgba(255,255,255,.11);border-radius:10px;background:rgba(255,255,255,.02)}.igr106-fact>summary{cursor:pointer;padding:12px 13px;font-weight:700;letter-spacing:.04em;font-size:.81rem}.igr106-fact-body{padding:0 13px 13px;line-height:1.5}.igr106-fact-body p{margin:0}
.igr106-inquiry-evidence{margin-bottom:14px}
@media(max-width:600px){.igr106-premise,.igr106-event{padding:12px}.igr106-action-panel{margin:8px 0}.igr106-common{gap:11px}}
`;document.head.appendChild(style);
window.IGR_COMMON_DOSSIER_V106=Object.freeze({version:V,isInquiry,publicHtml,syncPublic});
console.info('[IGR v106] public/private separation active');
})();