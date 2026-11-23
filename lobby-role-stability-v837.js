/* v837 — stop iOS Safari from jumping when a player selects/changes a
   role in the regular dossier lobby (001–034).
   v816 covered Héritage and Casino but not .lobby-v11. Presentation only:
   no phase, RPC, room or role state is touched. */
(()=>{
'use strict';
if(window.IGR_CLASSIC_ROLE_STABILITY_V837)return;
const selector='#app .lobby-v11[data-igr-scenario-id] .role-choice-zone';
const action='.role-choice-card[data-role-id],.role-choice-card.random-role-card,.igr-random-role-cta,.igr-choice-status-button';
const app=()=>document.getElementById('app');
const state=()=>{try{return typeof STATE!=='undefined'?STATE:window.STATE}catch{return window.STATE}};
let lock=null,queued=false,observer=null;
function current(){
 const zone=document.querySelector(selector);
 if(!zone||state()?.view!=='lobby'||!state()?.room)return null;
 const lobby=zone.closest('.lobby-v11');
 return {zone,lobby,key:[
  String(state().room),
  String(lobby?.dataset.igrScenarioId||''),
  String(lobby?.querySelector('.lobby-code strong')?.textContent||'').trim()
 ].join('|')};
}
function buttonOf(target){
 const button=target?.closest?.(action);
 if(!button||button.disabled||!button.closest('.lobby-v11 .role-choice-zone'))return null;
 return button;
}
function cancel(){
 const old=lock;lock=null;
 if(!old)return;
 clearTimeout(old.failsafe);clearTimeout(old.settle);clearTimeout(old.post);
 if(old.root?.isConnected){
  old.root.style.minHeight=old.minHeight;
  old.root.style.overflowAnchor=old.anchor;
 }
 if(old.frame)cancelAnimationFrame(old.frame);
 if(old.second)cancelAnimationFrame(old.second);
}
function restore(){
 const l=lock,now=current();
 if(!l)return;
 if(!now||now.key!==l.key||l.root!==app()){cancel();return}
 if(Math.abs(window.scrollY-l.y)>1){
  const doc=document.documentElement,prev=doc.style.scrollBehavior;
  doc.style.scrollBehavior='auto';
  try{window.scrollTo({left:0,top:l.y,behavior:'instant'})}
  catch(_){window.scrollTo(0,l.y)}
  doc.style.scrollBehavior=prev;
 }
}
function schedule(){
 if(queued||!lock)return;
 queued=true;
 requestAnimationFrame(()=>{
  queued=false;
  if(!lock)return;
  restore();
  if(!lock)return;
  requestAnimationFrame(()=>{if(lock)restore()});
 });
}
function begin(target){
 const button=buttonOf(target),now=current(),root=app();
 if(!button||!now||!root||!now.zone.contains(button))return;
 // Avoid rearming on touchstart + pointerdown + click for one tap.
 if(lock&&lock.key===now.key&&lock.originalZone.isConnected)return;
 cancel();
 const y=Math.max(0,window.scrollY);
 const initialMinHeight=root.style.minHeight;
 const anchor=root.style.overflowAnchor;
 // Hold the document's height during the full innerHTML replacement. The
 // previous v13 wrapper restores minHeight too early for WebKit layout/focus.
 const measured=Math.max(root.getBoundingClientRect().height,root.scrollHeight);
 root.style.minHeight=Math.ceil(Math.max(measured,y+window.innerHeight+96))+'px';
 root.style.overflowAnchor='none';
 const l={root,key:now.key,originalZone:now.zone,y,minHeight:initialMinHeight,anchor,
  frame:0,second:0,failsafe:0,settle:0,post:0};
 lock=l;
 l.failsafe=setTimeout(()=>{if(lock===l){restore();cancel()}},9000);
 schedule();
}
function onRoleTouch(event){
 if(buttonOf(event.target))begin(event.target);
}
function onRoleClick(event){
 const button=buttonOf(event.target);
 if(!button)return;
 if(event.detail>0)begin(event.target);
 // A touch-triggered focus restoration on a newly rendered role button can
 // trigger WebKit's native scroll-to-focus despite focus({preventScroll:true}).
 // Keyboard clicks (detail=0) retain their accessible focus.
 if(event.detail>0&&document.activeElement===button)button.blur();
 schedule();
}
function changed(){
 if(!lock)return;
 const now=current();
 if(!now||now.key!==lock.key){cancel();return}
 restore();schedule();
 if(!lock)return;
 if(!lock.originalZone.isConnected){
  const ref=lock;
  clearTimeout(ref.settle);
  ref.settle=setTimeout(()=>{
   if(lock!==ref)return;
   restore();
   // Catch one final iOS focus/scroll anchoring adjustment before unlocking.
   ref.post=setTimeout(()=>{if(lock===ref){restore();cancel()}},200);
  },850);
 }
}
function init(){
 const root=app();if(!root)return;
 document.addEventListener('touchstart',onRoleTouch,{capture:true,passive:true});
 document.addEventListener('pointerdown',onRoleTouch,true);
 document.addEventListener('click',onRoleClick,true);
 // Never fight intentional scrolling, keyboard navigation or a real screen change.
 document.addEventListener('touchmove',cancel,{capture:true,passive:true});
 document.addEventListener('wheel',cancel,{capture:true,passive:true});
 document.addEventListener('keydown',event=>{
  if(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' ','Enter'].includes(event.key))cancel();
 },true);
 window.addEventListener('pagehide',cancel,{passive:true});
 observer=new MutationObserver(changes=>{
  if(lock&&changes.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))changed();
 });
 observer.observe(root,{subtree:true,childList:true});
}
window.IGR_CLASSIC_ROLE_STABILITY_V837=Object.freeze({version:'837.0',isActive:()=>!!lock});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
