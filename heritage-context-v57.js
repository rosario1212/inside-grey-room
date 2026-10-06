/* Public campaign context only: never publish the hidden MAÎTRE variant. */
(()=>{'use strict';
const read=()=>{try{return JSON.parse((typeof STORAGE!=='undefined'?STORAGE:localStorage).getItem('igr_heritage_online_v13_8')||'null')}catch{return null}};
function snapshot(id){const s=window.IGR_HERITAGE?.get?.(id);if(!s)return null;const out={id,completed:s.completed||[]};
if(id==='cendres')out.cendres={flags:s.cendres?.flags||{},crisis:s.cendres?.crisis||{},network:s.cendres?.network||{nodes:[],links:[]}};
if(id==='kuroi')out.kuroi={flags:s.kuroi?.flags||{},debts:(s.kuroi?.debts||[]).filter(d=>!d.private),chronicle:(s.kuroi?.chronicle||[]).filter(e=>e.visibility!=='private')};
if(id==='maitre'){const m=s.maitre||{};out.maitre={facts:m.facts||[],links:m.links||[],relationships:m.relationships||{},reputation:m.reputation||{},decisions:m.decisions||{},traces:(m.traces||[]).filter(t=>t.category==='conclusion')};out.summary=out.maitre.traces.map(t=>`Dossier ${t.chapter} : ${t.title}. ${t.detail}`).join(' · ').slice(0,6000)}
return out}
async function publish(){const s=read();if(!s?.hostToken)return;const context=snapshot(s.campaign);if(!context)return;try{await rpc('igr_heritage_online_context_v57',{p_code:s.code,p_host_token:s.hostToken,p_context:context})}catch(e){console.warn('[HÉRITAGE contexte]',e);throw e}}
window.IGR_HERITAGE_CONTEXT_V57=Object.freeze({snapshot,publish});
})();

/* Concise campaign framing, shared by the hub, dossier and opening phase. */
(()=>{'use strict';
const frames={
 cendres:'Vous enquêtez au sein d’un service de renseignement sur des identités falsifiées et des accès détournés. Chaque rôle apporte des informations à recouper. Le groupe choisit une conclusion ; les erreurs et les preuves retenues influencent les dossiers suivants.',
 kuroi:'Au Japon, le chef d’un clan est assassiné. Les deux clans et la police reconstituent les faits avec des informations différentes. Le groupe choisit une conclusion ; les accusations, les dettes et les relations influencent les dossiers suivants.',
 maitre:'Une enquête fiscale révèle des liens avec un réseau criminel. La défense et l’accusation confrontent leurs informations ; le Juge tranche sur les éléments présentés. Les faits retenus, les relations et les décisions influencent les dossiers suivants.'
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function refresh(){const page=document.querySelector('.hplay-campaign,.hplay-dossier,.hplay-session');if(!page||page.querySelector('[data-heritage-frame]'))return;
const id=page.classList.contains('hplay-theme-cendres')?'cendres':page.classList.contains('hplay-theme-kuroi')?'kuroi':page.classList.contains('hplay-theme-maitre')?'maitre':null;if(!id)return;
if(page.classList.contains('hplay-session')){const mode=page.querySelector('.hplay-mode')?.textContent||'';if(!/(?:PHASE|CYCLE)\s+1\/|CYCLE I\b/.test(mode))return}
const frame=frames[id],block=document.createElement('section');block.className='hplay-campaign-definition h57-campaign-frame';block.dataset.heritageFrame=id;
block.innerHTML='<b>CADRE DE LA CAMPAGNE</b><span>'+esc(frame)+'</span>';
const existing=page.querySelector('.hplay-campaign-definition');if(existing){existing.replaceWith(block);return}
const anchor=page.querySelector('.hplay-campaign-title,.hplay-dossier-copy,.hplay-session-head');if(anchor)anchor.insertAdjacentElement('afterend',block);else page.appendChild(block)}
let pending=false;const schedule=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refresh()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('igr-heritage-sync',schedule);schedule();
})();
