/* Inside Grey Room v71 — public HÉRITAGE carry sync.
   Only public campaign state is published. Hidden MAÎTRE canon/variant is never sent. */
(()=>{'use strict';
const VERSION='71.0-heritage-carry';
const readSession=()=>{try{return JSON.parse((typeof STORAGE!=='undefined'?STORAGE:localStorage).getItem('igr_heritage_online_v13_8')||'null')}catch{return null}};
function snapshot(id){
  const s=window.IGR_HERITAGE?.get?.(id);if(!s)return null;
  const out={id,completed:Array.isArray(s.completed)?s.completed:[]};
  if(id==='cendres'){
    out.cendres={flags:s.cendres?.flags||{},crisis:s.cendres?.crisis||{},network:s.cendres?.network||{nodes:[],links:[]}};
  }else if(id==='kuroi'){
    out.kuroi={
      flags:s.kuroi?.flags||{},
      debts:(s.kuroi?.debts||[]).filter(d=>!d.private),
      chronicle:(s.kuroi?.chronicle||[]).filter(e=>e.visibility!=='private')
    };
  }else if(id==='maitre'){
    const m=s.maitre||{},traces=(m.traces||[]).filter(t=>t.category==='conclusion');
    out.maitre={facts:m.facts||[],links:m.links||[],relationships:m.relationships||{},reputation:m.reputation||{},decisions:m.decisions||{},traces};
    out.summary=traces.map(t=>`Dossier ${t.chapter} : ${t.title}. ${t.detail}`).join(' · ').slice(0,6000);
  }
  return out;
}
async function publish(){
  const s=readSession();if(!s?.hostToken||!s?.campaign)return false;
  const context=snapshot(s.campaign);if(!context)return false;
  await rpc('igr_heritage_online_context_v57',{p_code:s.code,p_host_token:s.hostToken,p_context:context});
  return true;
}
window.IGR_HERITAGE_CONTEXT_V71=Object.freeze({version:VERSION,snapshot,publish});
})();