/* Inside Grey Room â€” v47 Prosecutor runtime
   Profiles, FREE-only 2-minute interviews, mandatory Lawyer accompaniment,
   suspect cooperation and final Judge > Prosecutor > Investigator authority display.
*/
(()=>{
'use strict';
const VERSION='v47-prosecutor';
const S=()=>{try{return typeof STATE!=='undefined'?STATE:(window.STATE||null)}catch(_){return window.STATE||null}};
const sync=()=>S()?.sync||null, room=()=>sync()?.room||null, me=()=>sync()?.player||null;
const role=()=>me()?.public_role||S()?.role||'', players=()=>Array.isArray(sync()?.players)?sync().players:[];
const procPresent=()=>players().some(p=>p.public_role==='procureur');
const relevant=()=>procPresent()&&['procureur','suspect','maitre'].includes(role());
const code=()=>S()?.room||room()?.code||'', token=()=>S()?.token||'', myId=()=>String(me()?.id||S()?.playerId||'');
const esc=v=>typeof window.h==='function'?window.h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const left=end=>end?Math.max(0,Math.ceil((new Date(end).getTime()-Date.now())/1000)):0;
const clock=s=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
let cache=null,loading=false,last='',queued=false;
async function rpc47(name,args={}){if(typeof window.rpc!=='function')throw new Error('Connexion indisponible.');return window.rpc(name,{p_code:code(),p_player_token:token(),...args})}
function fail(e,f){window.toast?.(e?.message||f)}
async func¶»§q«^