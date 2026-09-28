/* Inside Grey Room v12.13 — clean live gameplay
   Goals:
   - no manual refresh during a live room
   - role choice can be cancelled before launch
   - evidence-only Fil; operational room history moved to Partie
   - investigation-only notifications, one compact banner at a time
   - robust audio recovery button
   - immediate viewer teardown when the Investigator stops/cuts video
   - no shared investigation-focus UI
*/
(() => {
  const REV = 'v12.13-clean-live-20260928-1';
  const EVIDENCE_TYPES = new Set(['trame','breaking_news','field','expert','judge']);
  const OPERATION_TYPES = new Set(['room_created','player_joined','roles_distributed','context','phase','cycle','interrogation','video','reveal']);
  let cleanSyncBusy = false;
  let lastEvidenceId = null;
  let notifyTimer = null;
  let audioWakeBusy = false;

  const esc = v => (typeof h === 'function' ? h(String(v ?? '')) : String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));

  /* ---------- reliable foreground sync ---------- */
  try { stopRoomWatcher?.(); } catch (_) {}
  try {
    startRoomWatcher = function(){
      if (STATE?.watcher) {
        try { clearInterval(STATE.watcher); clearTimeout(STATE.watcher); } catch (_) {}
        STATE.watcher = null;
      }
    };
  } catch (_) {}

  async function cleanSync(force=false){
    if (cleanSyncBusy || !globalThis.STATE?.room || !globalThis.STATE?.token) return;
    cleanSyncBusy = true;
    try {
      await syncNow(!!force);
      decorateLobbyRole();
      removeInvestigationFocus();
      scanEvidenceNotifications();
    } catch (_) {
    } finally {
      cleanSyncBusy = false;
    }
  }

  const liveTimer = setInterval(() => {
    if (!globalThis.STATE?.room || !globalThis.STATE?.token) return;
    if (document.hidden) return;
    void cleanSync(false);
  }, 650);
  window.addEventListener('pageshow',()=>void cleanSync(true),{passive:true});
  window.addEventListener('focus',()=>void cleanSync(true),{passive:true});
  window.addEventListener('online',()=>void cleanSync(true),{passive:true});
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) void cleanSync(true); },{passive:true});

  /* ---------- role select / unselect ---------- */
  if (typeof chooseLobbyRole === 'function') {
    chooseLobbyRole = async function(role){
      const me = (STATE?.sync?.players||[]).find(p=>String(p.id)===String(STATE?.sync?.player?.id));
      const current = me?.preferred_role || STATE?.sync?.player?.preferred_role || null;
      const clearing = String(current||'') === String(role||'');
      try {
        await rpc('igr_v4_choose_role',{
          p_code:STATE.room,
          p_player_token:STATE.token,
          p_role:clearing?'':role
        });
        await syncNow(true);
        decorateLobbyRole();
        toast(clearing ? 'Choix de rôle annulé.' : `Rôle choisi : ${publicRoleLabel(role)}`);
      } catch (e) {
        console.error(e);
        toast(clearing ? 'Impossible d’annuler ce choix.' : 'Ce rôle vient d’être pris ou n’est pas disponible.');
      }
    };
  }

  function decorateLobbyRole(){
    try {
      document.querySelectorAll('.role-choice-card.selected em').forEach(el=>{ el.textContent='SE DÉSISTER'; });
      document.querySelectorAll('.role-choice-card.selected').forEach(el=>{
        el.setAttribute('aria-label','Rôle sélectionné. Appuyer pour se désister.');
        el.title='Appuyer pour se désister';
      });
    } catch (_) {}
  }

  /* ---------- remove shared discussion-focus selector ---------- */
  function removeInvestigationFocus(){
    try { document.querySelectorAll('.investigation-sheet,.investigation-focus-controls,.investigation-focus-current,.investigation-focus-readonly').forEach(el=>el.remove()); } catch (_) {}
  }
  const focusObserver = new MutationObserver(()=>{ decorateLobbyRole(); removeInvestigationFocus(); });
  focusObserver.observe(document.documentElement,{subtree:true,childList:true});

  /* ---------- evidence-only Fil ---------- */
  function evidenceEvents(){
    const role = STATE?.sync?.player?.public_role || STATE?.role;
    return (STATE?.sync?.events||[]).filter(e => {
      if (!EVIDENCE_TYPES.has(String(e.event_type||''))) return false;
      if (e.event_type==='trame' && typeof canInvestigationChannel==='function' && !canInvestigationChannel(role)) return false;
      return true;
    });
  }

  function eventText(e){
    const p=e?.payload||{};
    return String(p.text||p.summary||'').trim();
  }

  function evidenceLabel(e){
    const p=e?.payload||{};
    if(e.event_type==='trame') return p.title||'Nouvel élément';
    if(e.event_type==='breaking_news') return p.title||'Breaking News';
    if(e.event_type==='field') return p.title||'Retour terrain';
    if(e.event_type==='expert') return p.title||'Expertise';
    if(e.event_type==='judge') return p.title||'Information judiciaire';
    return p.title||'Élément d’enquête';
  }

  if (typeof renderTimelineTab === 'function') {
    renderTimelineTab = function(){
      const events=evidenceEvents().slice().reverse();
      if(!events.length) return '<div class="empty-state">Aucun nouvel élément d’enquête.</div>';
      return `<div class="timeline timeline-v11 evidence-only-feed">${events.map(e=>`<div class="event ${e.event_type==='trame'?'trame':e.event_type==='breaking_news'?'news':''}"><div class="event-head">${esc(evidenceLabel(e))} · ${typeof clock==='function'?clock(e.created_at):''}</div><div class="event-body">${esc(eventText(e))}</div></div>`).join('')}</div>`;
    };
  }

  function operationTitle(e){
    const p=e?.payload||{};
    const type=String(e?.event_type||'');
    const defaults={
      room_created:'Cellule créée',player_joined:'Joueur arrivé',roles_distributed:'Rôles distribués',
      context:'Dossier ouvert',phase:'Changement de phase',cycle:'Nouveau cycle',
      interrogation:'Interrogatoire',video:'Flux',reveal:'Révélation finale'
    };
    return String(p.title||defaults[type]||'Mise à jour de partie');
  }

  function renderPartyTab(){
    const d=STATE?.sync;
    const ops=(d?.events||[]).filter(e=>OPERATION_TYPES.has(String(e.event_type||''))).slice(-18).reverse();
    const players=(d?.players||[]).length;
    const currentPhase=typeof phaseLabel==='function'?phaseLabel(d?.room?.phase):String(d?.room?.phase||'');
    const log=ops.length?ops.map(e=>`<div class="party-log-row"><b>${esc(operationTitle(e))}</b><span>${esc(eventText(e))}</span><small>${typeof clock==='function'?clock(e.created_at):''}</small></div>`).join(''):'<div class="empty-state">Aucun événement de partie.</div>';
    const rulesHtml=(typeof RULES!=='undefined'&&Array.isArray(RULES))?RULES.map(r=>`<div class="rule"><h3>${esc(r.title)}</h3><p>${(r.items||[]).map(i=>`• ${esc(i)}`).join('<br>')}</p></div>`).join(''):'';
    return `<div class="party-tab-clean"><div class="party-status-clean"><b>${esc(currentPhase)}</b><span>Cycle ${Number(d?.room?.cycle||0)}/3 · ${players} joueur${players>1?'s':''}</span></div><details class="party-history"><summary>Historique de la partie</summary><div class="party-log">${log}</div></details><details class="party-rules"><summary>Règles</summary><div class="rule-list">${rulesHtml}</div></details></div>`;
  }

  if (typeof gameTabs === 'function') {
    const baseGameTabs=gameTabs;
    gameTabs=function(){
      return baseGameTabs().map(x=>x.id==='rules'?{...x,label:'Partie'}:x);
    };
  }
  if (typeof renderGameTab === 'function') {
    const baseRenderGameTab=renderGameTab;
    renderGameTab=function(){
      if(STATE?.tab==='rules') return renderPartyTab();
      return baseRenderGameTab.apply(this,arguments);
    };
  }

  /* ---------- quiet investigation notifications ---------- */
  function notificationHost(){
    let el=document.getElementById('igrEvidenceNotice');
    if(!el){
      el=document.createElement('button');
      el.id='igrEvidenceNotice';el.type='button';el.className='igr-evidence-notice';el.hidden=true;
      el.onclick=()=>{ el.hidden=true; try{ setTab('timeline'); }catch(_){} };
      document.body.appendChild(el);
    }
    return el;
  }
  function showEvidenceNotice(e){
    const el=notificationHost();
    el.innerHTML=`<small>ENQUÊTE</small><b>${esc(evidenceLabel(e))}</b>${eventText(e)?`<span>${esc(eventText(e).slice(0,140))}</span>`:''}`;
    el.hidden=false;
    clearTimeout(notifyTimer);
    notifyTimer=setTimeout(()=>{el.hidden=true;},4600);
    if(document.hidden && 'Notification' in window && Notification.permission==='granted'){
      try{new Notification(evidenceLabel(e),{body:eventText(e).slice(0,160),tag:`igr-evidence-${e.id}`,renotify:false});}catch(_){}
    }
  }
  function scanEvidenceNotifications(){
    const all=evidenceEvents();
    if(!all.length) return;
    const maxId=Math.max(...all.map(e=>Number(e.id)||0));
    if(lastEvidenceId===null){ lastEvidenceId=maxId; return; }
    const fresh=all.filter(e=>(Number(e.id)||0)>lastEvidenceId);
    lastEvidenceId=Math.max(lastEvidenceId,maxId);
    if(fresh.length) showEvidenceNotice(fresh[fresh.length-1]);
  }
  try { document.getElementById('igrNotifyBell')?.remove(); document.getElementById('igrAlertStack')?.remove(); } catch (_) {}

  /* ---------- robust audio wake control ---------- */
  if (typeof activateInGameAudio === 'function') {
    const baseActivateInGameAudio=activateInGameAudio;
    activateInGameAudio=async function(){
      if(audioWakeBusy) return;
      audioWakeBusy=true;
      try{return await baseActivateInGameAudio.apply(this,arguments)}
      finally{setTimeout(()=>{audioWakeBusy=false;},180)}
    };
  }
  if (typeof showAudioWakePrompt === 'function') {
    showAudioWakePrompt=function(label='Touchez pour réactiver le son'){
      const old=document.getElementById('audioWakePrompt');
      if(old) old.remove();
      const el=document.createElement('button');
      el.id='audioWakePrompt';el.type='button';el.className='audio-wake-prompt show igr-audio-wake-clean';el.textContent=label;
      let fired=false;
      const fire=ev=>{
        ev?.preventDefault?.();ev?.stopPropagation?.();
        if(fired||audioWakeBusy)return;
        fired=true;
        Promise.resolve(activateInGameAudio()).finally(()=>{setTimeout(()=>{fired=false;},240)});
      };
      el.addEventListener('pointerup',fire,{passive:false});
      el.addEventListener('click',fire,{passive:false});
      document.body.appendChild(el);
    };
  }

  /* ---------- immediate video teardown ---------- */
  function observerIds(){
    const me=STATE?.sync?.player?.id;
    return (STATE?.sync?.players||[]).filter(p=>String(p.id)!==String(me)&&typeof canVideo==='function'&&canVideo(p.public_role)).map(p=>p.id);
  }
  async function sendHangups(){
    const ids=observerIds();
    await Promise.allSettled(ids.map(id=>rpc('igr_v4_signal_send',{p_code:STATE.room,p_player_token:STATE.token,p_to:id,p_type:'hangup',p_payload:{reason:'investigator_stopped',rev:REV}})));
  }
  function optimisticVideoOff(cut=false){
    try{
      const st=STATE?.sync?.room?.state;
      if(st){st.video_active=false;if(!cut)st.video_cut_until=null;}
      const rv=document.getElementById('remoteVideo');if(rv){try{rv.pause()}catch(_){};rv.srcObject=null;}
    }catch(_){}
  }
  if(typeof stopVideo==='function'){
    stopVideo=async function(){
      optimisticVideoOff(false);
      try{stopLocalCapture();}catch(_){}
      try{if(STATE?.tab==='video')renderGame();}catch(_){}
      const server=rpc('igr_v4_video_set',{p_code:STATE.room,p_player_token:STATE.token,p_active:false,p_confidential_cut:false});
      await Promise.allSettled([sendHangups(),server]);
      await syncNow(true);
    };
  }
  if(typeof confidentialCut==='function'){
    confidentialCut=async function(){
      optimisticVideoOff(true);
      try{stopLocalCapture();}catch(_){}
      try{if(STATE?.tab==='video')renderGame();}catch(_){}
      const server=rpc('igr_v4_video_set',{p_code:STATE.room,p_player_token:STATE.token,p_active:false,p_confidential_cut:true});
      await Promise.allSettled([sendHangups(),server]);
      await syncNow(true);
    };
  }
  if(typeof handleSignal==='function'){
    const baseHandleSignal=handleSignal;
    handleSignal=async function(s){
      if(String(s?.signal_type||'')==='hangup'){
        const from=s?.from_player_id;
        try{closePeer(from);}catch(_){}
        try{if(VIDEO?.remoteStream){VIDEO.remoteStream.getTracks().forEach(t=>t.stop());VIDEO.remoteStream=null;}}catch(_){}
        optimisticVideoOff(false);
        try{if(STATE?.tab==='video')renderGame();}catch(_){}
        return;
      }
      return baseHandleSignal.apply(this,arguments);
    };
  }

  const style=document.createElement('style');
  style.id='igr-clean-live-style';
  style.textContent=`
    .investigation-sheet,.investigation-focus-controls,.investigation-focus-current,.investigation-focus-readonly{display:none!important}
    .igr-audio-wake-clean{pointer-events:auto!important;touch-action:manipulation!important;z-index:1600!important;cursor:pointer!important}
    .igr-evidence-notice{position:fixed;z-index:1200;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;transform:translateX(-50%);width:min(90vw,430px);border:1px solid rgba(215,225,232,.22);border-radius:12px;background:rgba(7,10,12,.96);box-shadow:0 14px 36px rgba(0,0,0,.35);padding:10px 12px;color:#eef2f4;text-align:left;display:grid;gap:3px;touch-action:manipulation}.igr-evidence-notice[hidden]{display:none}.igr-evidence-notice small{font:800 8px 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#8c9aa4}.igr-evidence-notice b{font-size:11px}.igr-evidence-notice span{font-size:9px;line-height:1.4;color:#9aa5ad}
    .party-status-clean{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 13px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.018)}.party-status-clean b{font-size:12px}.party-status-clean span{font-size:9px;color:#7d8991}.party-history,.party-rules{margin-top:10px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.012)}.party-history>summary,.party-rules>summary{cursor:pointer;padding:12px 13px;font-size:11px;font-weight:700;list-style:none}.party-history>summary::-webkit-details-marker,.party-rules>summary::-webkit-details-marker{display:none}.party-log{padding:0 11px 11px;display:grid;gap:7px}.party-log-row{display:grid;grid-template-columns:1fr auto;gap:3px 10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.05)}.party-log-row b{font-size:10px}.party-log-row span{grid-column:1/-1;color:#7e8991;font-size:9px;line-height:1.4}.party-log-row small{grid-row:1;grid-column:2;color:#5d6870;font-size:8px}.party-rules .rule-list{padding:0 11px 11px}.evidence-only-feed .event{margin-bottom:8px}
    .role-choice-card.selected em{font-weight:800}
  `;
  document.head.appendChild(style);

  decorateLobbyRole();
  removeInvestigationFocus();
  scanEvidenceNotifications();
})();
