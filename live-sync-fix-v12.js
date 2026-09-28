/* Inside Grey Room v12.13 — direct live sync heartbeat
   Independent of the legacy watcher so phase/role/room changes appear without reload.
*/
(() => {
  const EVIDENCE_TYPES=new Set(['trame','breaking_news','field','expert','judge']);
  let busy=false,lastEvidence=null,noticeTimer=null;
  const esc=v=>typeof h==='function'?h(String(v??'')):String(v??'');
  function evidence(){
    if(typeof STATE==='undefined'||!STATE.sync)return[];
    const role=STATE.sync?.player?.public_role||STATE.role;
    return (STATE.sync.events||[]).filter(e=>{
      if(!EVIDENCE_TYPES.has(String(e.event_type||'')))return false;
      if(e.event_type==='trame'&&typeof canInvestigationChannel==='function'&&!canInvestigationChannel(role))return false;
      return true;
    });
  }
  function evidenceTitle(e){const p=e?.payload||{};return p.title||(e.event_type==='trame'?'Nouvel élément':e.event_type==='breaking_news'?'Breaking News':e.event_type==='field'?'Retour terrain':e.event_type==='expert'?'Expertise':'Information judiciaire');}
  function evidenceText(e){const p=e?.payload||{};return String(p.text||p.summary||'').trim();}
  function showNotice(e){let el=document.getElementById('igrEvidenceNotice');if(!el){el=document.createElement('button');el.id='igrEvidenceNotice';el.type='button';el.className='igr-evidence-notice';el.onclick=()=>{el.hidden=true;try{setTab('timeline')}catch(_){}};document.body.appendChild(el)}el.innerHTML=`<small>ENQUÊTE</small><b>${esc(evidenceTitle(e))}</b>${evidenceText(e)?`<span>${esc(evidenceText(e).slice(0,140))}</span>`:''}`;el.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{el.hidden=true},4600);}
  function scanEvidence(){const items=evidence();if(!items.length)return;const max=Math.max(...items.map(e=>Number(e.id)||0));if(lastEvidence===null){lastEvidence=max;return}const fresh=items.filter(e=>(Number(e.id)||0)>lastEvidence);lastEvidence=Math.max(lastEvidence,max);if(fresh.length)showNotice(fresh[fresh.length-1]);}
  async function tick(force=false){if(busy||typeof STATE==='undefined'||!STATE.room||!STATE.token)return;busy=true;try{await syncNow(!!force);scanEvidence()}catch(_){}finally{busy=false}}
  setInterval(()=>{if(!document.hidden)void tick(false)},650);
  window.addEventListener('focus',()=>void tick(true),{passive:true});window.addEventListener('pageshow',()=>void tick(true),{passive:true});window.addEventListener('online',()=>void tick(true),{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick(true)},{passive:true});scanEvidence();
})();
