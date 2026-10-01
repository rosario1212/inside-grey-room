(()=>{
'use strict';
const VERSION='13.3-startup-stability';
let wakeInFlight=null;
let lastRecovery=0;

function soundAvailable(){return typeof SOUND!=='undefined'&&SOUND&&SOUND.enabled!==false}
function introBusy(){return typeof INTRO!=='undefined'&&INTRO&&(INTRO.active||INTRO.playing)}
function preset(){try{return typeof activeSoundPreset==='function'?activeSoundPreset():'menu'}catch{return 'menu'}}
function prime(){try{if(typeof primeAudioOutput==='function')primeAudioOutput()}catch{}}
function gains(){try{if(typeof updateGains==='function')updateGains()}catch{}}
function ensure(){
  if(!soundAvailable()||document.visibilityState!=='visible'||introBusy())return;
  try{
    const p=preset();if(p==='silent')return;
    if(typeof ensureAmbient==='function')ensureAmbient(p);
  }catch(err){console.warn('[Startup v13.3] ambient recovery',err)}
}
async function hardWake(){
  if(!soundAvailable())return true;
  try{
    if(typeof initAudio==='function')initAudio();
    if(typeof SOUND==='undefined'||!SOUND.ctx)return false;
    if(SOUND.ctx.state==='closed'){
      try{if(typeof disposeAudioEngine==='function')disposeAudioEngine()}catch{}
      if(typeof initAudio==='function')initAudio();
    }
    const ctx=SOUND.ctx;if(!ctx)return false;
    if(ctx.state!=='running'){
      try{await ctx.resume()}catch{}
    }
    if(ctx.state!=='running')return false;
    prime();gains();
    const p=preset();if(p!=='silent'&&typeof ensureAmbient==='function')ensureAmbient(p);
    return true;
  }catch(err){console.warn('[Startup v13.3] hard wake failed',err);return false}
}

try{
  const base=typeof wakeAudioFromGesture==='function'?wakeAudioFromGesture:null;
  if(base){
    wakeAudioFromGesture=async function(){
      if(wakeInFlight)return wakeInFlight;
      wakeInFlight=(async()=>{
        let ok=false;
        try{ok=await base.apply(this,arguments)}catch(err){console.warn('[Startup v13.3] native wake failed',err)}
        if(!ok)ok=await hardWake();
        return !!ok;
      })();
      try{return await wakeInFlight}finally{wakeInFlight=null}
    };
  }
}catch(err){console.warn('[Startup v13.3] wake serialization unavailable',err)}

function recoverAfterEntry(){
  const stamp=performance.now();lastRecovery=stamp;
  [60,260,760,1500].forEach(delay=>setTimeout(()=>{if(lastRecovery!==stamp)return;ensure()},delay));
}
try{
  const baseComplete=typeof completeIntroEntry==='function'?completeIntroEntry:null;
  if(baseComplete){
    completeIntroEntry=function(){const out=baseComplete.apply(this,arguments);recoverAfterEntry();return out};
  }
}catch(err){console.warn('[Startup v13.3] intro completion hook unavailable',err)}

// A pointer/touch on the entrance remains the only iOS-unlock gesture. We only prime;
// the existing intro handler still owns animation, routing and sound policy.
function primeEntranceGesture(e){
  const target=e.target?.closest?.('#introEnterBtn');if(!target||target.disabled)return;
  try{if(typeof primeNarrationFromGesture==='function')primeNarrationFromGesture()}catch{}
  try{if(typeof wakeAudioFromGesture==='function')void wakeAudioFromGesture()}catch{}
}
if(window.PointerEvent)document.addEventListener('pointerdown',primeEntranceGesture,{capture:true,passive:true});
else document.addEventListener('touchstart',primeEntranceGesture,{capture:true,passive:true});

function visibleRecovery(){
  if(document.visibilityState!=='visible'||introBusy())return;
  setTimeout(()=>{ensure()},140);
}
window.addEventListener('pageshow',visibleRecovery,{passive:true});
window.addEventListener('focus',visibleRecovery,{passive:true});
document.addEventListener('visibilitychange',visibleRecovery,{passive:true});

window.IGR_STARTUP_STABILITY=Object.freeze({version:VERSION,recover:ensure,wake:hardWake});
})();
