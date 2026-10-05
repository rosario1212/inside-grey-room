/* Inside Grey Room â€” v50 Natural Role Gameplay
   Natural in-person interactions, investigation assemblies, role activity,
   Expert / Inspector / Journalist active desks, validated conduct penalties.
*/
(()=>{
'use strict';
const VERSION='v50-natural-role-gameplay';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null, room=()=>sync()?.room||null, me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'', players=()=>Array.isArray(sync()?.players)?sync().players:[];
const code=()=>S()?.room||room()?.code||'', token=()=>S()?.token||'';
const fr=()=>window.IGR_LOCALE!=='en', copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INVESTIGATION=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const REPORTERS=new Set(['suspect','enqueteur','analyste','procureur','juge','inspecteur','expert']);
const ACTIVITY={enqueteur:4,suspect:4,procureur:3,juge:3,maitre:3,journaliste:3,inspecteur:3,analyste:2,expert:1,temoin:2};
const ROLE_COPY={
 enq:null,
 enqueteur:copy('Tu diriges la Gray Room, choisis les convocations officielles et portes la reconstruction finale. Hors Gray Room, les Ã©changes sont libres.','You direct the Grey Room, choose official summons and carry the final reconstruction. Outside the Gr¶»§q«^