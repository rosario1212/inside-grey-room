/* Inside Grey Room v53 — gameplay / UI polish.
   Witness rosters and witness content are intentionally untouched. */
(()=>{
'use strict';
if(window.IGR_GAMEPLAY_POLISH_V53)return;
const VERSION='v53-gameplay-polish';
const DENSE_IDS=new Set(['016','019','020','023','024','025','027','030','034']);
const ROLE_MARKS={enqueteur:'⌕',analyste:'◇',suspect:'◌',maitre:'§',procureur:'⚑',juge:'⚖',journaliste:'◈',inspecteur:'⌖',expert:'⌬',temoin:'◍'};
const state=()=>typeof STATE!=='undefined'?STATE:(window.STATE||{});
const sync=()=>state()?.sync||{};
const room=()=>sync()?.room||{};
const me=()=>sync()?.player||{};
const players=()=>Array.isArray(sync()?.players)?sync().players:[];
const role=()=>String(me()?.public_role||state()?.role||'');
const scenarioId=()=>String(room()?.scenario_id||state()?.scenarioId||state()?.selectedScenario||'');
const copy=(fr,en)=>window.IGR_LOCALE==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dense=()=>players().length>=9||DENSE_IDS.has(scenarioId());
const adminEvents=new Set(['message','phase','cycle','ready','timer','score','join','leave','role']);
function evidence(){return (sync()?.events||[]).filter(e=>!adminEvents.has(String(e?.event_type||''))&&String(e?.payload?.title||e?.payload?.text||e?.payload?.summary||'').trim())}
function roleLabel(r){try{return typeof publicRoleLabel==='function'?publicRoleLabel(r):(typeof roleInfo==='functi���q�^