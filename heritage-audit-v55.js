/* Inside Grey Room v55 — HÉRITAGE audit + multiplayer clarity
   Keeps campaign mechanics intact while making online play phone-first,
   role-aware and consistent across CENDRES, KUROI and MAÎTRE. */
(()=>{
'use strict';
const VERSION='55.0-heritage-audit';
const ONLINE_KEY='igr_heritage_online_v13_8';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const store=()=>{try{return typeof STORAGE!=='undefined'?STORAGE:localStorage}catch{return localStorage}};
const read=k=>{try{return JSON.parse(store().getItem(k)||'null')}catch{return null}};
const session=()=>read(ONLINE_KEY);
const rpcx=(name,args)=>typeof rpc==='function'?rpc(name,args):Promise.reject(new Error('rpc unavailable'));
const toastx=m=>{try{toast?.(m)}catch{}};
let syncBusy=false,scheduled=false;

function roleCard(d){
  const campaign=d?.room?.campaign_id,roleId=d?.player?.role_id,chapter=Number(d?.room?.chapter||1);
  if(!campaign||!roleId)return null;
  if(campaign==='maitre')return window.IGR_HERITAGE_MAITRE_ONLINE?.roleCard?.(chapter,roleId,d.room.maitre_variant)||null;
  return window.IGR_HERITAGE_PLAY?.roleCard?.(campaign,chapter,roleId)||null;
}
function campaignName(id){
  if(id==='maitre')return 'MAÎTRE';
  return window.IGR_HERITAGE?.campaigns?.[id]?.title||String(id||'HÉRITAGE').toUpperCase();
}
function cleanup(root){$$('[data-h55-injected]',root).forEach(n=>n.remove())}
function playerStrip(d){
  const card=roleCard(d);if(!card)return '';
  return `<section class="h55-player-strip" data-h55-injected="1">
    <div class="h55-player-id"><span>TON RÔLE</span><strong>${esc(card.name)}</strong><small>${esc(d.player.pseudo||'')}</small></div>
    <div class="h55-focus"><span>À FAIRE MAINTENANT</span><p>${esc(card.objective||card.public||'Participe au recoupement.')}</p></div>
    <details class="h55-my-card"><summary>MA CARTE PRIVÉE</summary><div><b>${esc(card.public||'')}</b>${card.secret?`<p><span>INFORMATION</span>${esc(card.secret)}</p>`:''}${card.objective?`<p><span>OBJECTIF</span>${esc(card.objective)}</p>`:''}</div></details>
  </section>`;
}
function roster(d){
  const rows=(d.players||[]).map(p=>`<div class="${p.id===d.player.id?'is-me':''}"><b>${esc(p.pseudo)}</b><span>${esc((p.role_id||'').replaceAll('_',' ').toUpperCase()||'RÔLE')}</span></div>`).join('');
  return `<details class="h55-roster" data-h55-injected="1"><summary>TABLE · ${(d.players||[]).length} JOUEURS</summary><div>${rows}</div></details>`;
}
function markOnlinePage(page,d){
  if(!page)return false;
  const stamp=[d.room.stage,d.room.phase_index,d.room.decision_id,d.player.role_id,(d.players||[]).map(p=>`${p.id}:${p.role_id}:${p.ready}`).join('|')].join('::');
  if(page.dataset.h55Stamp===stamp)return false;
  page.dataset.h55Stamp=stamp;
  page.classList.add('heritage-v55-online');
  cleanup(page);
  return true;
}
function enhanceRoleReading(d){
  const page=$('.hplay-reveal');if(!page)return;
  page.classList.add('heritage-v55-online','heritage-v55-role');
  const head=$('.hplay-mode',page);
  if(head)head.textContent=`EN LIGNE · ${d.players.filter(p=>p.ready).length}/${d.players.length} PRÊTS`;
  const closed=$('.hplay-private.is-closed',page);
  if(closed){
    const eyebrow=$('.hplay-eyebrow',closed),p=$('p',closed);
    if(eyebrow)eyebrow.textContent='TA CARTE PRIVÉE';
    if(p)p.textContent='Visible uniquement sur ce téléphone.';
  }
}
function enhancePlay(d){
  const s=session();if(!s)return;
  const page=$('.hplay-session');if(!page||!markOnlinePage(page,d))return;
  const head=$('.hplay-session-head',page);
  if(head){
    head.classList.add('h55-now-head');
    head.insertAdjacentHTML('beforebegin',playerStrip(d));
  }else page.insertAdjacentHTML('afterbegin',playerStrip(d));
  const grid=$('.hplay-session-grid',page)||$('.hplay-table-card',page)?.parentElement;
  if(grid)grid.insertAdjacentHTML('afterend',roster(d));else page.insertAdjacentHTML('beforeend',roster(d));
  const table=$('.hplay-table-card',page);
  if(table){
    const label=$(':scope > span',table);
    if(label)label.textContent='MAINTENANT';
  }
  const mode=$('.hplay-mode',page);
  if(mode){
    const total=d.room.campaign_id==='maitre'?3:4;
    const word=d.room.campaign_id==='maitre'?'CYCLE':'PHASE';
    mode.textContent=`EN LIGNE · ${word} ${Number(d.room.phase_index||0)+1}/${total}`;
  }
}
function enhanceMaitreDecision(d){
  if(d.room.campaign_id!=='maitre')return;
  const page=$('.maitre-page.mnet.hplay-decision,.maitre-page.hplay-decision');
  if(!page||!markOnlinePage(page,d))return;
  const judge=(d.players||[]).find(p=>p.role_id==='juge');
  const canLock=d.player.role_id==='juge'||(!judge&&d.player.is_host);
  const head=$('.hplay-decision-head',page);
  if(head){
    head.querySelector('p')?.remove();
    head.insertAdjacentHTML('beforeend',`<div class="h55-decision-owner" data-h55-injected="1"><b>${canLock?'TU ES LE JUGE':'DÉCISION DU JUGE'}</b><span>${canLock?'Choisis la conclusion qui correspond uniquement à ce qui a été établi pendant l’audience.':judge?`${esc(judge.pseudo)} verrouille la conclusion.`:'Le Juge est absent : l’hôte reprend le verrouillage.'}</span></div>`);
  }
  const options=$('.hplay-options',page);
  if(options)$$('button',options).forEach(btn=>{
    const id=btn.dataset.id||btn.dataset.h55Decide;
    if(!id)return;
    btn.removeAttribute('data-mnet');
    btn.dataset.h55Decide=id;
    btn.disabled=!canLock;
    const i=$('i',btn);if(i)i.textContent=canLock?'VERROUILLER →':'EN ATTENTE DU JUGE';
  });
  const mode=$('.hplay-mode',page);if(mode)mode.textContent='EN LIGNE · JUGEMENT';
}
function enhanceLobby(d){
  if(d.room.campaign_id!=='maitre')return;
  const page=$('.hnet.hplay-theme-maitre,.hnet .hplay-theme-maitre')||$('.hnet');
  if(!page||page.querySelector('.h55-maitre-lobby-note'))return;
  const title=$('.hnet-title',page);if(!title)return;
  title.insertAdjacentHTML('beforeend','<div class="h55-maitre-lobby-note" data-h55-injected="1"><b>HÔTE = AVOCAT PRINCIPAL</b><span>La campagne appartient à l’Avocat. Les autres rôles seront attribués aléatoirement au lancement.</span></div>');
}
function enhanceResult(d){
  const page=$('.hplay-result');if(!page||!markOnlinePage(page,d))return;
  page.insertAdjacentHTML('afterbegin',`<div class="h55-result-context" data-h55-injected="1"><span>${esc(campaignName(d.room.campaign_id))}</span><b>${esc(roleCard(d)?.name||'')}</b></div>`);
}
async function decideMaitre(button){
  const s=session();if(!s||s.campaign!=='maitre'||button.disabled)return;
  button.disabled=true;
  try{
    await rpcx('igr_heritage_online_decide_v55',{p_code:s.code,p_player_token:s.token,p_option_id:button.dataset.h55Decide});
    window.IGR_HERITAGE_MAITRE_ONLINE?.resume?.();
  }catch(err){
    console.error(err);button.disabled=false;
    toastx(/judge/i.test(err?.message||'')?'Seul le Juge peut verrouiller la conclusion.':'Décision impossible.');
  }
}
async function syncOnline(){
  const s=session();if(!s||syncBusy||document.hidden)return;
  const relevant=$('.hnet,.hplay-reveal,.hplay-session,.hplay-decision,.hplay-result');
  if(!relevant)return;
  syncBusy=true;
  try{
    const d=await rpcx('igr_heritage_online_sync',{p_code:s.code,p_player_token:s.token});
    if(!d?.room)return;
    if(d.room.stage==='lobby')enhanceLobby(d);
    if(d.room.stage==='role_reading')enhanceRoleReading(d);
    if(d.room.stage==='play')enhancePlay(d);
    if(d.room.stage==='decision')enhanceMaitreDecision(d);
    if(d.room.stage==='reveal')enhanceResult(d);
  }catch(err){console.warn('[HÉRITAGE v55]',err?.message||err)}
  finally{syncBusy=false}
}
function simplifyMaitreCampaign(){
  const page=$('.maitre-page.hplay-campaign');if(!page||page.dataset.h55Compact)return;
  page.dataset.h55Compact='1';page.classList.add('heritage-v55-maitre-campaign');
  const layout=$('.hplay-campaign-layout',page),side=$('.hplay-side',page),trace=$('.maitre-trace-panel',page),links=$('.maitre-link-panel',page);
  if(!layout||(!side&&!trace&&!links))return;
  const details=document.createElement('details');details.className='h55-dossier-live';details.dataset.h55Injected='1';
  details.innerHTML='<summary><span>DOSSIER VIVANT</span><b>TRACES · LIENS · RÉPUTATION</b><i>OUVRIR</i></summary><div class="h55-dossier-live-body"></div>';
  const body=$('.h55-dossier-live-body',details);
  if(side)body.appendChild(side);if(trace)body.appendChild(trace);if(links)body.appendChild(links);
  layout.insertAdjacentElement('afterend',details);
}
function collapseMobileCampaign(){
  if(!matchMedia('(max-width:760px)').matches)return;
  const page=$('.hplay-campaign:not(.maitre-page)');if(!page||page.dataset.h55Compact)return;
  const side=$('.hplay-side',page),layout=$('.hplay-campaign-layout',page);if(!side||!layout)return;
  page.dataset.h55Compact='1';
  const d=document.createElement('details');d.className='h55-mobile-carry';d.dataset.h55Injected='1';
  d.innerHTML='<summary><span>HÉRITAGE ACTIF</span><b>VOIR L’ÉTAT DE LA CAMPAGNE</b></summary><div></div>';
  $('div',d).appendChild(side);layout.insertAdjacentElement('afterend',d);
}
function schedule(){
  if(scheduled)return;scheduled=true;
  queueMicrotask(()=>{scheduled=false;simplifyMaitreCampaign();collapseMobileCampaign();void syncOnline()});
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-h55-decide]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();void decideMaitre(b);
},true);
const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.addEventListener('pageshow',schedule,{passive:true});
schedule();
window.IGR_HERITAGE_V55=Object.freeze({version:VERSION,refresh:syncOnline});
})();
