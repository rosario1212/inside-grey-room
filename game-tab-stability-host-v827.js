/* v827: stable in-game tabs + investigator-only stopping of interviews/confrontations */
(()=>{
'use strict';
if(window.IGR_GAME_TABS_HOST_V827)return;
const root=()=>document.getElementById('app');
const S=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE;}catch(_){return window.STATE;}};
const game=()=>root()?.querySelector('main.game-v11');
const room=()=>S()?.sync?.room;
const investigator=()=>room()?.status==='playing' && (S()?.sync?.player?.public_role||S()?.role)==='enqueteur';
const en=()=>window.IGR_LOCALE==='en';
let lock=null,finishing=false;
let tapY=null,tapAt=0;
// iOS Safari can scroll an element into view on pointer down, before click.
document.addEventListener('pointerdown',event=>{
 if(event.target?.closest?.('main.game-v11 .tabs-v11 .tab')){
   tapY=Math.max(0,window.scrollY);
   tapAt=performance.now();
 }
},true);
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
 if(S()?.tab===tab)return;
 const y=tapY!==null && performance.now()-tapAt<1400 ? tapY : Math.max(0,scrollY);
 tapY=null;
 const navBefore=game()?.querySelector('.tabs-v11');
 const x=navBefore?.scrollLeft||0;
 retain(y);
 // No forced jump to the page top and no focus-triggered scrolling.
 S().tab=tab;
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
// Preserve enough height while the game remains active; ordinary scrolling
// stays fully enabled and never triggers a delayed scroll clamp.
if(root())new MutationObserver(()=>{if(lock&&!game())release();})
 .observe(root(),{subtree:false,childList:true});
const legacyPanel=window.renderInvestigationTab;
if(typeof legacyPanel==='function'){
 window.renderInvestigationTab=function(){
   const out=String(legacyPanel.apply(this,arguments)||'');
   if(!investigator()||room()?.phase!=='event_confrontation')return out;
   const label=en()?'End confrontation':'Terminer la confrontation';
   return out+'<section class="action-section igr827-investigator-controls"><button type="button" class="btn danger block" onclick="igr827InvestigatorEndConfrontation()">'+label+'</button></section>';
 };
}
// The investigator already has the canonical, server-authorized
// endInterrogation() control. No host token is required or exposed.
window.igr827InvestigatorEndConfrontation=async function(){
 if(finishing||!investigator()||room()?.phase!=='event_confrontation')return;
 const title=en()?'End this confrontation?':'Terminer cette confrontation ?';
 const detail=en()?'This confrontation will end for everybody, and will count toward the cycle limit.':
   'La confrontation prendra fin pour tous et restera comptabilisée dans le cycle.';
 const accepted=typeof window.appConfirm==='function'
   ? await window.appConfirm({title,text:detail,confirmLabel:en()?'End now':'Terminer maintenant'})
   : window.confirm(title+'\n'+detail);
 if(!accepted||!investigator()||room()?.phase!=='event_confrontation')return;
 finishing=true;
 try{
   await window.rpc('igr_v827_end_confrontation',{p_code:S().room,p_player_token:S().token});
   await window.syncNow(true);
 }catch(error){
   console.error('[IGR v827] investigator confrontation end',error);
   if(typeof window.toast==='function')window.toast(error?.message||(en()?'Unable to end this confrontation.':'Impossible de terminer cette confrontation.'));
 }finally{finishing=false;}
};
// Host remains sole owner of "Étape suivante", but must not use
// this shortcut to replace an investigator's live conversation controls.
const originalCanAdvance=window.phaseCanAdvance;
if(typeof originalCanAdvance==='function')window.phaseCanAdvance=function(){
 if(['interrogation','event_confrontation'].includes(room()?.phase))return false;
 // v830: final ballots are individual decisions. The host has no
 // shortcut to reveal a reconstruction before the required votes exist.
 if(room()?.phase==='locking'&&
   (room()?.state?.v52_final_reassessment===true||
    room()?.state?.v52_final_reassessment==='true'))return false;
 return originalCanAdvance.apply(this,arguments);
};
const legacyInstruction=window.phaseInstruction;
if(typeof legacyInstruction==='function')window.phaseInstruction=function(){
 const text=legacyInstruction.apply(this,arguments);
 return typeof text==='string'?text.replace('Aucun arrêt anticipé.',"L'Enquêteur peut arrêter cet interrogatoire avant la fin."):text;
};
window.IGR_GAME_TABS_HOST_V827=Object.freeze({version:'827.1',investigatorEnds:true,hostSkips:true});
})();