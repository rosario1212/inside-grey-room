/* Inside Grey Room — v13.3 lobby navigation + settings access + base-role visual fix
   - Adds real back-to-scenarios and settings actions from the role-selection lobby.
   - Opens the existing Settings modal without leaving or resetting the current room.
   - Returns to the scenario list at the scenario/scroll position previously consulted.
   - Keeps scenarios 001–020 strictly neutral: OMERTÀ red cannot leak into base role selection.
*/
(()=>{
  'use strict';

  const OMERTA_IDS=new Set(['021','022','023','024','025']);
  const BASE_IDS=new Set(Array.from({length:20},(_,i)=>String(i+1).padStart(3,'0')));
  let enhancing=false,enhanceQueued=false;

  const currentScenarioId=()=>String(
    STATE?.sync?.room?.scenario_id ||
    STATE?.scenarioId ||
    STATE?.selectedScenario || ''
  );

  function isLobbyVisible(){
    return !!document.querySelector('.role-choice-zone') && !!STATE?.room;
  }

  function syncLobbyTheme(){
    const sid=currentScenarioId();
    const base=BASE_IDS.has(sid) && isLobbyVisible();
    const omerta=OMERTA_IDS.has(sid) && isLobbyVisible();
    const body=document.body;
    if(!body)return;

    body.classList.toggle('igr-v13-base-lobby',base);

    const zone=document.querySelector('.role-choice-zone');
    if(zone){
      zone.classList.toggle('is-base-scenario',base);
      zone.classList.toggle('is-omerta-scenario',omerta);
    }

    if(base){
      body.classList.remove('igr-theme-omerta','igr-omerta-active','igr-theme-terror','igr-theme-cartel','igr-theme-regime');
      document.documentElement.classList.remove('igr-theme-omerta','igr-omerta-active','igr-theme-terror','igr-theme-cartel','igr-theme-regime');
      document.querySelector('.igr-random-role-cta')?.classList.remove('is-omerta');
      document.querySelector('.igr-random-role-cta')?.classList.add('is-base');
    }
  }

  function stopRoomForScenarioReturn(){
    try{stopRoomWatcher?.()}catch(_){ }
    try{connectionStatus?.(false)}catch(_){ }
    try{VIDEO.lastSignalId=0}catch(_){ }
    try{cancelBriefingVoice?.()}catch(_){ }
    try{AVATARS.map.clear();AVATARS.sig=''}catch(_){ }
    try{
      if(VIDEO.poller){clearInterval(VIDEO.poller);VIDEO.poller=null}
      VIDEO.localStream?.getTracks?.().forEach(track=>{try{track.stop()}catch(_){}});
      VIDEO.localStream=null;
    }catch(_){ }
    try{closeAllPeers?.()}catch(_){ }
  }

  function returnToScenarioList(){
    const sid=currentScenarioId() || '001';
    const savedY=Number(STATE?.createListScrollY);

    stopRoomForScenarioReturn();

    try{
      Object.assign(STATE,{
        view:'create-list',
        selectedScenario:sid,
        scenarioId:sid,
        room:null,
        token:null,
        hostToken:null,
        playerId:null,
        playerPseudo:'',
        role:'suspect',
        players:[],
        tab:'card',
        sync:null,
        syncSig:'',
        cycle:0
      });
      clearSession?.();
      renderCreateList?.();
    }catch(err){
      console.error('back to scenarios',err);
      try{leaveRoom?.()}catch(_){ }
      return;
    }

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const target=document.getElementById(`scenario-${sid}`);
      if(Number.isFinite(savedY) && savedY>0){
        window.scrollTo({top:savedY,behavior:'auto'});
      }else if(target){
        target.scrollIntoView({block:'center',behavior:'auto'});
      }
      if(target){
        target.classList.add('igr-v13-return-target');
        setTimeout(()=>target.classList.remove('igr-v13-return-target'),720);
      }
    }));
  }

  function openLobbySettings(){
    try{
      if(typeof window.openSettings==='function'){
        window.openSettings();
        return;
      }
      toast?.(window.IGR_LOCALE==='en'?'Settings are temporarily unavailable.':'Paramètres momentanément indisponibles.');
    }catch(err){
      console.error('lobby settings',err);
    }
  }

  globalThis.igrBackToScenarios=returnToScenarioList;
  globalThis.igrLobbyOpenSettings=openLobbySettings;

  function enhanceLobby(){
    if(enhancing)return;
    enhancing=true;
    try{
      const zone=document.querySelector('.role-choice-zone');
      const pageHead=zone?.closest('main')?.querySelector('.page-head');
      if(!zone||!pageHead){syncLobbyTheme();return}

      const en=window.IGR_LOCALE==='en';
      let back=pageHead.querySelector('.igr-v13-back-scenarios');
      if(!back){
        const quit=Array.from(pageHead.querySelectorAll('button')).find(btn=>/quitter|leave|exit/i.test(btn.textContent||''));
        back=document.createElement('button');
        back.type='button';
        back.className='btn ghost small igr-v13-back-scenarios';
        back.addEventListener('click',returnToScenarioList);
        if(quit){
          quit.replaceWith(back);
        }else{
          pageHead.appendChild(back);
        }
      }
      back.textContent=en?'← Scenarios':'← Scénarios';
      back.setAttribute('aria-label',en?'Leave this room and return to scenarios':'Quitter cette cellule et revenir aux scénarios');

      let actions=pageHead.querySelector('.igr-v13-lobby-actions');
      if(!actions){
        actions=document.createElement('div');
        actions.className='igr-v13-lobby-actions';
        if(back.parentNode)back.parentNode.insertBefore(actions,back);
        else pageHead.appendChild(actions);
      }
      if(back.parentElement!==actions)actions.appendChild(back);

      let settings=actions.querySelector('.igr-v13-lobby-settings');
      if(!settings){
        settings=document.createElement('button');
        settings.type='button';
        settings.className='btn ghost small igr-v13-lobby-settings';
        settings.addEventListener('click',openLobbySettings);
        actions.appendChild(settings);
      }
      settings.textContent=en?'Settings':'Paramètres';
      settings.setAttribute('aria-label',en?'Open settings without leaving the room':'Ouvrir les paramètres sans quitter la cellule');

      syncLobbyTheme();
    }finally{
      enhancing=false;
    }
  }

  function queueEnhanceLobby(){
    if(enhanceQueued)return;
    enhanceQueued=true;
    const run=()=>{enhanceQueued=false;enhanceLobby()};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else queueMicrotask(run);
  }

  try{
    const previous=renderLobby;
    if(typeof previous==='function'){
      renderLobby=function(){
        const out=previous.apply(this,arguments);
        queueEnhanceLobby();
        return out;
      };
    }
  }catch(err){console.warn('lobby back/settings hook',err)}

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes?.length || m.removedNodes?.length))queueEnhanceLobby();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  const observeBodyTheme=()=>{
    if(!document.body)return;
    const themeObserver=new MutationObserver(()=>{
      const sid=currentScenarioId();
      if(BASE_IDS.has(sid) && isLobbyVisible())syncLobbyTheme();
    });
    themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  };
  if(document.body)observeBodyTheme();
  else document.addEventListener('DOMContentLoaded',observeBodyTheme,{once:true});
  window.addEventListener('pageshow',queueEnhanceLobby,{passive:true});
  document.addEventListener('DOMContentLoaded',queueEnhanceLobby,{once:true});
  setTimeout(queueEnhanceLobby,0);
})();

/* v13.5 — HÉRITAGE + startup fixes bootstrap.
   This file is already referenced by index.html in v13.2, so uploading/replacing it
   activates the new mode without requiring an installer or an index.html edit. */
(()=>{
  'use strict';
  const BUILD='v70-fluidity1';
  const head=document.head||document.documentElement;

  function loadStyle(id,href){
    if(document.getElementById(id))return;
    const link=document.createElement('link');
    link.id=id;link.rel='stylesheet';link.href=href;
    head.appendChild(link);
  }
  function loadScript(id,src){
    return new Promise((resolve,reject)=>{
      if(document.getElementById(id))return resolve();
      const script=document.createElement('script');
      script.id=id;script.src=src;script.async=false;
      script.onload=resolve;script.onerror=()=>reject(new Error(`Unable to load ${src}`));
      (document.body||head).appendChild(script);
    });
  }
  async function bootHeritage(){
    loadStyle('igr-startup-stability-v13-3-css',`startup-stability-v13-3.css?v=${BUILD}`);
    loadStyle('igr-heritage-v13-5-css',`heritage-v13-5.css?v=${BUILD}`);
    try{
      if(!window.IGR_STARTUP_STABILITY)await loadScript('igr-startup-stability-v13-3-js',`startup-stability-v13-3.js?v=${BUILD}`);
      if(!window.IGR_HERITAGE)await loadScript('igr-heritage-v13-5-js',`heritage-v13-5.js?v=${BUILD}`);
    }catch(err){console.error('[IGR v13.5 bootstrap]',err)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootHeritage,{once:true});
  else queueMicrotask(bootHeritage);
})();
