/* Inside Grey Room — native lifecycle v12.8
   Releases live media/background work when the native app is suspended and resyncs on resume.
*/
(() => {
  const cap=globalThis.Capacitor;
  if(!cap?.isNativePlatform?.()||typeof cap.registerPlugin!=='function')return;
  const App=cap.registerPlugin('App');
  let inactive=false;
  let wasLiveVideo=false;

  function suspendNative(){
    if(inactive)return;
    inactive=true;
    try{wasLiveVideo=!!(typeof videoState==='function'&&videoState()?.video_active)}catch{wasLiveVideo=false}
    try{stopRoomWatcher?.()}catch{}
    try{cancelBriefingVoice?.()}catch{}
    try{stopAmbient?.()}catch{}
    try{stopLocalCapture?.()}catch{}
    try{
      if(globalThis.VIDEO?.pcs instanceof Map){
        for(const pc of VIDEO.pcs.values())try{pc?.close?.()}catch{}
        VIDEO.pcs.clear();
      }
      if(VIDEO?.remoteStream?.getTracks)for(const track of VIDEO.remoteStream.getTracks())try{track.stop()}catch{}
      if(VIDEO)VIDEO.remoteStream=null;
    }catch{}
  }

  async function resumeNative(){
    if(!inactive)return;
    inactive=false;
    try{
      if(globalThis.STATE?.room&&STATE?.token){
        await syncNow?.(true);
        startRoomWatcher?.();
        setTimeout(()=>{try{manageVideoState?.()}catch{}},180);
        if(wasLiveVideo&&STATE?.sync?.player?.public_role==='enqueteur'){
          setTimeout(()=>toast?.('Le flux caméra a été arrêté pendant l’arrière-plan. Réactive-le si l’interrogatoire continue.'),450);
        }
      }
    }catch(e){console.warn('native resume',e)}
    wasLiveVideo=false;
  }

  try{App.addListener('appStateChange',({isActive})=>{if(isActive)void resumeNative();else suspendNative()})}catch{}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendNative();else void resumeNative()});
  window.addEventListener('pagehide',suspendNative,{passive:true});
})();
