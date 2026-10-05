/* Inside Grey Room â€” v51 Self-Guided Rules
   Clear autonomous rulebook, contextual phase guidance and lawyer consultation clarification.
*/
(()=>{
'use strict';
const VERSION='v51-self-guided-rules';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null,room=()=>sync()?.room||null,me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'',players=()=>Array.isArray(sync()?.players)?sync().players:[];
const fr=()=>window.IGR_LOCALE!=='en',copy=(a,b)=>fr()?a:b;
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INVESTIGATION=new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']);
const FINAL_LOCKERS=new Set(['enqueteur','analyste','procureur','juge','journaliste']);
const ACTIVITY={enqueteur:4,suspect:4,procureur:3,juge:3,maitre:3,journaliste:3,inspecteur:3,analyste:2,expert:1,temoin:2};
const LABELS={enqueteur:'EnquÃªteur',analyste:'Analyste',suspect:'Suspect',maitre:'Avocat',procureur:'Procureur',juge:'Juge',journaliste:'Journaliste',inspecteur:'Inspecteur',expert:'Expert',temoin:'TÃ©moin'};
const stars=n=>'â˜…'.repeat(Math.max(0,Math.min(4,+n||0)))+'â˜†'.repeat(Math.max(0,4-(+n||0)));
const roleLabel=r=>LABELS[r]||r;
const currentTarget=()=>String(room()?.state?.current_target||'');
const targetIds=()=>{const v=room()?.s¶»§q«^