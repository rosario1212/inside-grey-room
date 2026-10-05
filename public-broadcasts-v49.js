/* Inside Grey Room v49 â€” public broadcasts
   Breaking News + publicly presented Expert analyses are visible to every role.
   Suspects archive them in Chronologie; investigation roles retain them in Ã‰lÃ©ments d'enquÃªte.
*/
(()=>{
'use strict';
const VERSION='v49-public-broadcasts';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null,room=()=>sync()?.room||null,me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'',code=()=>S()?.room||room()?.code||'',token=()=>S()?.token||'';
const fr=()=>window.IGR_LOCALE!=='en',copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const publicTypes=new Set(['breaking_news','expert_public']);
const investigationCamp=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const broadcasts=()=>Array.isArray(sync()?.events)?sync().events.filter(e=>publicTypes.has(String(e?.event_type||''))):[];
const time=iso=>{try{return new Date(iso).toLocaleTimeString(fr()?'fr-FR':'en-GB',{hour:'2-digit',minute:'2-digit'})}catch(_){return'--:--'}};
const label=e=>e?.event_type==='breaking_news'?copy('BREAKING NEWS','BREAKING NEWS'):copy('EXPERTISE PUBLIQUE','PUBLIC EXPERT FINDING');
let expertState=null,expertLoading=false,lastExpertPublicId=0;
async function rpc49(name,args={}){if(¶»§q«^