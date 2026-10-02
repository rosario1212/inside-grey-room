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

  function roomActive(){return !!(globalThis.STATE?.room&&globalThis.STATE?.token)}
  function introVisible(){
    const gate=document.getElementById('introGate');
    return !!(gate&&!gate.classList.contains('done')&&gate.getAttribute('aria-hidden')!=='true');
  }
  function markConnection(failed){try{globalThis.connectionStatus?.(failed)}catch{}}

  function closeVideoTransport(){
    try{
      const video=globalThis.VIDEO;
      if(video?.pcs instanceof Map){
        for(const pc of video.pcs.values())try{pc?.close?.()}catch{}
        video.pcs.clear();
      }
      if(video?.remoteStream?.getTracks){
        for(const track of video.remoteStream.getTracks())try{track.stop()}catch{}
      }
      if(video)video.remoteStream=null;
    }catch{}
  }

  function suspendRuntime(){
    if(inactive)return;
    inactive=true;
    try{wasLiveVideo=!!globalThis.videoState?.()?.video_active}catch{wasLiveVideo=false}
    try{globalThis.stopRoomWatcher?.()}catch{}
    try{globalThis.cancelBriefingVoice?.()}catch{}
    try{globalThis.stopAmbient?.()}catch{}
    try{globalThis.stopLocalCapture?.()}catch{}
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
      const sound=globalThis.SOUND;
      if(!sound||sound.enabled===false)return;
      if(sound.ctx?.state==='suspended'){
        try{await sound.ctx.resume()}catch{}
      }
      const preset=typeof globalThis.activeSoundPreset==='function'?globalThis.activeSoundPreset():'menu';
      if(preset!=='silent')globalThis.ensureAmbient?.(preset);
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
        await globalThis.syncNow?.(true);
        globalThis.startRoomWatcher?.();
        setTimeout(()=>{try{globalThis.manageVideoState?.()}catch{}},180);
        if(returningFromBackground&&wasLiveVideo&&globalThis.STATE?.sync?.player?.public_role==='enqueteur'){
          setTimeout(()=>globalThis.toast?.('Le flux caméra a été arrêté pendant l’arrière-plan. Réactive-le si l’interrogatoire continue.'),450);
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
    try{globalThis.stopRoomWatcher?.()}catch{}
    if(roomActive())markConnection(true);
  }

  function resumeFromNetwork(){
    networkPaused=false;
    markConnection(false);
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
