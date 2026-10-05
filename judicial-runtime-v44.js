/* Inside Grey Room â€” v44 Judge + Lawyer runtime
   Judge: Cabinet, 3 protections, FREE-only summons, joint review, mandatory deliberation,
   final speech and integrity vote. Lawyer: one interrogation-only consultation per non-client.
*/
(()=>{
'use strict';
const VERSION='v44-judge-lawyer';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null, room=()=>sync()?.room||null, me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'', players=()=>Array.isArray(sync()?.players)?sync().players:[];
const fr=()=>window.IGR_LOCALE!=='en', copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=()=>S()?.room||room()?.code||'', token=()=>S()?.token||'', myId=()=>String(me()?.id||S()?.playerId||'');
const phase=()=>String(room()?.phase||''), judgePresent=()=>players().some(p=>p.public_role==='juge'), lawyerPresent=()=>players().some(p=>p.public_role==='maitre');
const judicialRoles=['juge','enqueteur','analyste','procureur','maitre','journaliste'];
const relevant=()=>judgePresent()&&judicialRoles.includes(role()), lawyerRelevant=()=>lawyerPresent()&&['suspect','maitre'].includes(role());
let cache=null,loading=false,last='',queued=false,lastAuto='';
async function rpc44(name,args={}){if(typeof window.rpc!=='function')throw new Er¶»§q«^