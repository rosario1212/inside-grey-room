/* Inside Grey Room v42 â€” investigation clarity and suspect continuity.
   Loaded after authoritative-runtime-v41.js.
   - FIL -> Ã‰LÃ‰MENTS Dâ€™ENQUÃŠTE with two scenario context cards + revealed elements.
   - Suspect-only CHRONOLOGIE tab built from the private canonical card.
   - Explicit names for interrogations/confrontations and provisional speakers.
   - Removes the duplicate event-select summary, fixes Flux copy, moves OBJECTIF to the bottom.
   - Keeps one compact Settings button visible during live play.
*/
(()=>{
'use strict';
const VERSION='v42-investigation-ui';
const CORE=new Set(Array.from({length:34},(_,i)=>String(i+1).padStart(3,'0')));
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null;
const room=()=>sync()?.room||null;
const me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'';
const scenarioId=()=>String(room()?.scenario_id||S()?.scenarioId||'');
const core=()=>CORE.has(scenarioId());
const fr=()=>window.IGR_LOCALE!=='en';
const copy=(a,b)=>fr()?a:b;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canSeeEvidence=r=>['enqueteur','analyste','procureur','juge','inspecteur','expert','journaliste','maitre'].includes(r);
const playerById=id=>(sync()?.players||[]).find(p=>S¶»§q«^