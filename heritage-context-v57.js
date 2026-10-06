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
