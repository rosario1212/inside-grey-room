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
 kuroi:{setting:'Japon, aujourd’hui. Le chef du clan Kurokawa est assassiné. Kurokawa, son rival Arakida et la police doivent reconstituer les faits.',table:'Les clans protègent leurs intérêts. La police enquête. Chaque rôle détient une partie des faits ; aucun camp ne dispose seul de toute la réponse.',stakes:'Le groupe retient une conclusion après discussion. Les dettes, accusations et ruptures reviennent dans les cinq dossiers. Une accusation ne devient pas un fait sans recoupement.'},
 maitre:{setting:'Une enquête fiscale mène à un réseau criminel. Le Client est mis en cause ; son implication reste à établir, acte par acte.',table:'L’Avocat défend, le Client choisit ce qu’il révèle, l’Enquêteur recoupe et le Procureur accuse. Le Juge tranche sur les éléments présentés. L’Associé devient central au troisième dossier.',stakes:'Les admissions, conclusions et relations restent dans la campagne. La défense peut contester et garder sa stratégie privée ; elle ne crée pas de preuves. Le Juge ignore les faits cachés.'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function refresh(){const page=document.querySelector('.hplay-campaign,.hplay-dossier,.hplay-session');if(!page||page.querySelector('[data-heritage-frame]'))return;
const id=page.classList.contains('hplay-theme-kuroi')?'kuroi':page.classList.contains('hplay-theme-maitre')?'maitre':null;if(!id)return;
if(page.classList.contains('hplay-session')){const mode=page.querySelector('.hplay-mode')?.textContent||'';if(!/(?:PHASE|CYCLE)\s+1\/|CYCLE I\b/.test(mode))return}
const frame=frames[id],block=document.createElement('section');block.className='h57-campaign-frame';block.dataset.heritageFrame=id;
block.innerHTML='<h2>Cadre de campagne</h2>'+[['SITUATION',frame.setting],['À LA TABLE',frame.table],['CE QUI RESTE',frame.stakes]].map(([label,text])=>`<div><b>${label}</b><p>${esc(text)}</p></div>`).join('');
const anchor=page.querySelector('.hplay-campaign-hero,.hplay-dossier-grid,.hplay-session-head');if(anchor)anchor.insertAdjacentElement('afterend',block);else page.appendChild(block)}
let pending=false;const schedule=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refresh()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('igr-heritage-sync',schedule);schedule();
})();
