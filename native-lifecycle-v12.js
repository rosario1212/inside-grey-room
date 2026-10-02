/* Inside Grey Room — mobile lifecycle v12.9
   Covers Capacitor AND installed/browser PWAs: pause volatile realtime/media work in background,
   then resync the room, restart the watcher and recover audio when the app becomes usable again.
*/
(() => {
  const cap=globalThis.Capacitor;
  const isNative=!!cap?.isNativePlatform?.();
  const App=isNative&&typeof cap?.registerPlugin==='function'?cap.registerPlugin('App'):null;

  let inactive=false;
  let networkPaused=false;
  let wasLiveVideo=false;
  let resumeInFlight=null;
  let lastResumeAt=0;

  function roomActive(){return typeof STATE!=='undefined'&&!!(STATE?.room&&STATE?.token)}
  function introVisible(){
    const gate=document.getElementById('introGate');
    return !!(gate&&!gate.classList.contains('done')&&gate.getAttribute('aria-hidden')!=='true');
  }
  function markConnection(failed){try{if(typeof connectionStatus==='function')connectionStatus(failed)}catch{}}

  function closeVideoTransport(){
    try{
      if(typeof VIDEO==='undefined'||!VIDEO)return;
      if(VIDEO.pcs instanceof Map){
        for(const pc of VIDEO.pcs.values())try{pc?.close?.()}catch{}
        VIDEO.pcs.clear();
      }
      if(VIDEO.remoteStream?.getTracks){
        for(const track of VIDEO.remoteStream.getTracks())try{track.stop()}catch{}
      }
      VIDEO.remoteStream=null;
    }catch{}
  }

  function suspendRuntime(){
    if(inactive)return;
    inactive=true;
    try{wasLiveVideo=!!(typeof videoState==='function'&&videoState()?.video_active)}catch{wasLiveVideo=false}
    try{if(typeof stopRoomWatcher==='function')stopRoomWatcher()}catch{}
    try{if(typeof cancelBriefingVoice==='function')cancelBriefingVoice()}catch{}
    try{if(typeof stopAmbient==='function')stopAmbient()}catch{}
    try{if(typeof stopLocalCapture==='function')stopLocalCapture()}catch{}
    closeVideoTransport();
  }

  async function recoverAudio(){
    if(document.visibilityState==='hidden'||introVisible())return;
    try{
      const stability=globalThis.IGR_STARTUP_STABILITY;
      if(stability?.wake){
        const ok=await stability.wake();
        if(!ok)stability.recover?.();
        return;
      }
      if(typeof SOUND==='undefined'||!SOUND||SOUND.enabled===false)return;
      if(SOUND.ctx?.state==='suspended'){
        try{await SOUND.ctx.resume()}catch{}
      }
      const preset=typeof activeSoundPreset==='function'?activeSoundPreset():'menu';
      if(preset!=='silent'&&typeof ensureAmbient==='function')ensureAmbient(preset);
    }catch(e){console.warn('mobile audio resume',e)}
  }

  async function performResume(reason){
    if(document.visibilityState==='hidden')return;
    if(navigator.onLine===false){networkPaused=true;markConnection(true);return}

    const returningFromBackground=inactive;
    inactive=false;
    networkPaused=false;

    try{
      if(roomActive()){
        if(typeof syncNow==='function')await syncNow(true);
        if(typeof startRoomWatcher==='function')startRoomWatcher();
        setTimeout(()=>{try{if(typeof manageVideoState==='function')manageVideoState()}catch{}},180);
        if(returningFromBackground&&wasLiveVideo&&STATE?.sync?.player?.public_role==='enqueteur'){
          setTimeout(()=>{try{if(typeof toast==='function')toast('Le flux caméra a été arrêté pendant l’arrière-plan. Réactive-le si l’interrogatoire continue.')}catch{}},450);
        }
      }
    }catch(e){
      console.warn(`mobile resume (${reason})`,e);
      if(roomActive())markConnection(true);
    }

    await recoverAudio();
    wasLiveVideo=false;
  }

  function resumeRuntime(reason='visible',force=false){
    if(document.visibilityState==='hidden')return Promise.resolve();
    const now=Date.now();
    if(resumeInFlight)return resumeInFlight;
    if(!force&&!inactive&&!networkPaused&&now-lastResumeAt<350)return Promise.resolve();
    lastResumeAt=now;
    resumeInFlight=performResume(reason).finally(()=>{resumeInFlight=null});
    return resumeInFlight;
  }

  function pauseForNetwork(){
    networkPaused=true;
    try{if(typeof stopRoomWatcher==='function')stopRoomWatcher()}catch{}
    if(roomActive())markConnection(true);
  }

  function resumeFromNetwork(){
    networkPaused=false;
    if(roomActive())markConnection(false);
    void resumeRuntime('online',true);
  }

  if(App){
    try{App.addListener('appStateChange',({isActive})=>{if(isActive)void resumeRuntime('native-active',true);else suspendRuntime()})}catch{}
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)suspendRuntime();
    else void resumeRuntime('visibility',true);
  },{passive:true});
  window.addEventListener('pagehide',suspendRuntime,{passive:true});
  window.addEventListener('pageshow',()=>{void resumeRuntime('pageshow',true)},{passive:true});
  window.addEventListener('offline',pauseForNetwork,{passive:true});
  window.addEventListener('online',resumeFromNetwork,{passive:true});

  globalThis.IGR_MOBILE_LIFECYCLE=Object.freeze({
    version:'12.9-pwa-resume',
    native:isNative,
    suspend:suspendRuntime,
    resume:()=>resumeRuntime('manual',true)
  });
})();
