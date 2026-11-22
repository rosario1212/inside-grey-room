/* v827: stable in-game tabs + host-only early stopping of interviews/confrontations */
(()=>{
'use strict';
if(window.IGR_GAME_TABS_HOST_V827)return;
const root=()=>document.getElementById('app');
const game=()=>root()?.querySelector('main.game-v11');
const room=()=>window.STATE?.sync?.room;
const host=()=>!!(window.STATE?.hostToken&&room()?.status==='playing');
const en=()=>window.IGR_LOCALE==='en';
let lock=null,finishing=false;
function release(){
 if(lock?.el?.isConnected)lock.el.style.minHeight=lock.old;
 lock=null;
}
function retain(y){
 const el=root();if(!el)return;
 if(!lock||lock.el!==el){release();lock={el,old:el.style.minHeight};}
 el.style.minHeight=Math.ceil(y+innerHeight+12)+'px';
}
function restore(y){
 if(!game()){release();return;}
 if(Math.abs(scrollY-y)<2)return;
 const html=document.documentElement,previous=html.style.scrollBehavior;
 html.style.scrollBehavior='auto';
 try{scrollTo({top:y,left:0,behavior:'instant'});}catch(_){scrollTo(0,y);}
 html.style.scrollBehavior=previous;
}
const legacySetTab=window.setTab;
if(typeof legacySetTab==='function')window.setTab=function(tab){
 if(!game()||typeof window.renderGame!=='function'||typeof window.saveSession!=='function')
   return legacySetTab.apply(this,arguments);
 if(window.STATE?.tab===tab)return;
 const y=Math.max(0,scrollY),navBefore=game()?.querySelector('.tabs-v11');
 const x=navBefore?.scrollLeft||0;
 retain(y);
 // No forced jump to the page top and no focus-triggered scrolling.
 window.STATE.tab=tab;
 window.saveSession();
 window.renderGame();
 const nav=game()?.querySelector('.tabs-v11');
 if(nav){
   nav.scrollLeft=x;
   const selected=nav.querySelector('.tab.active');
   if(selected){
     const box=nav.getBoundingClientRect(),item=selected.getBoundingClientRect();
     if(item.left<box.left)nav.scrollLeft-=box.left-item.left;
     else if(item.right>box.right)nav.scrollLeft+=item.right-box.right;
   }
 }
 restore(y);
 requestAnimationFrame(()=>{restore(y);requestAnimationFrame(()=>restore(y));});
};
document.addEventListener('touchmove',release,{passive:true});
document.addEventListener('wheel',release,{passive:true});
document.addEventListener('keydown',e=>{
 if(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(e.key))release();
},true);
if(root())new MutationObserver(()=>{if(lock&&!game())release();})
 .observe(root(),{subtree:false,childList:true});
const legacyPanel=window.renderInvestigationTab;
if(typeof legacyPanel==='function'){
 const oldEnd=/<button\b(?=[^>]*onclick=["']endInterrogation\(\)["'])[^>]*>[\s\S]*?<\/button>/gi;
 window.renderInvestigationTab=function(){
   const out=String(legacyPanel.apply(this,arguments)||'').replace(oldEnd,'');
   const phase=room()?.phase;
   if(!host()||!['interrogation','event_confrontation'].includes(phase))return out;
   const confront=phase==='event_confrontation';
   const label=confront?(en()?'End confrontation':'Terminer la confrontation'):(en()?'End interrogation':'Terminer l’interrogatoire');
   return out+'<section class="action-section igr827-host-controls"><button type="button" class="btn danger block" onclick="igr827HostFinish(\''+phase+'\')">'+label+'</button></section>';
 };
}
window.endInterrogation=function(){return window.igr827HostFinish('interrogation');};
window.igr827HostFinish=async function(expectedPhase){
 if(finishing||!host()||room()?.phase!==expectedPhase)return;
 const confront=expectedPhase==='event_confrontation';
 const title=confront?(en()?'End this confrontation?':'Terminer cette confrontation ?'):(en()?'End this interrogation?':'Terminer cet interrogatoire ?');
 const detail=en()?'This phase will end for everybody and will count toward the cycle limit.':'Cette phase prendra fin pour tous et restera comptabilisée dans le cycle.';
 const accepted=typeof window.appConfirm==='function'
   ? await window.appConfirm({title,text:detail,confirmLabel:en()?'End now':'Terminer maintenant'})
   : window.confirm(title+'\n'+detail);
 if(!accepted||!host()||room()?.phase!==expectedPhase)return;
 finishing=true;
 try{
   await window.rpc('igr_v4_advance_phase',{p_code:window.STATE.room,p_host_token:window.STATE.hostToken});
   await window.syncNow(true);
 }catch(error){
   console.error('[IGR v827] host end',error);
   if(typeof window.toast==='function')window.toast(error?.message||(en()?'Unable to end this phase.':'Impossible de terminer cette phase.'));
 }finally{finishing=false;}
};
const legacyInstruction=window.phaseInstruction;
if(typeof legacyInstruction==='function')window.phaseInstruction=function(){
 const text=legacyInstruction.apply(this,arguments);
 return typeof text==='string'?text.replace('Aucun arrêt anticipé.',"L'hôte peut y mettre fin plus tôt."):text;
};
window.IGR_GAME_TABS_HOST_V827=Object.freeze({version:'827.0',hostOnly:true});
})();