/* Inside Grey Room v816 — preserve the viewport when choosing / drawing a role.
   The online lobbies replace their entire DOM after RPC syncs. iOS Safari may
   clamp scrollY while that DOM is empty; role cards also move as labels change.
   Capture the user's viewport before focus/default click and restore it only
   while the same lobby is being refreshed, never across a real navigation. */
(()=>{
'use strict';
const $=(q,root=document)=>root?.querySelector?.(q)||null;
const LOBBIES=Object.freeze({
 heritage:{selector:'main.hnet .hnet-lobby',action:'[data-hnet="role"],[data-mnet="role"]'},
 casino:{selector:'main.casino-live .casino-role-choice-zone',action:'[data-casino-action="select-role"]'}
});
let hold=null,observer=null;
function app(){return document.getElementById('app')}
function laneFrom(target){
 if(!target?.closest)return null;
 for(const [kind,meta] of Object.entries(LOBBIES)){
  const action=target.closest(meta.action);
  if(action&&!action.disabled&&action.closest(meta.selector))return kind;
 }
 return null;
}
function identity(kind,root){
 if(kind==='heritage'){
  const main=$(LOBBIES.heritage.selector,root)?.closest('main');
  return (main?.className||'')+'|'+($('.hnet-code > strong',main)?.textContent||'').trim();
 }
 if(kind==='casino'){
  const main=$(LOBBIES.casino.selector,root)?.closest('main');
  return (main?.id||'')+'|'+($('.casino-lobby-access h1',main)?.textContent||'').trim();
 }
 return '';
}
function cancel(){
 if(!hold)return;
 const previous=hold;hold=null;
 clearTimeout(previous.timeout);
 clearTimeout(previous.settle);
 if(previous.frame)cancelAnimationFrame(previous.frame);
 if(previous.second)cancelAnimationFrame(previous.second);
 if(previous.root?.isConnected){
  previous.root.style.minHeight=previous.minHeight;
 }
}
function restore(){
 const h=hold;if(!h)return;
 const lane=$(LOBBIES[h.kind].selector,h.root);
 if(!lane||identity(h.kind,h.root)!==h.identity){cancel();return}
 if(Math.abs(window.scrollY-h.y)>1){
  const html=document.documentElement,oldBehavior=html.style.scrollBehavior;
  html.style.scrollBehavior='auto';
  try{window.scrollTo({top:h.y,left:0,behavior:'instant'})}
  catch(_){window.scrollTo(0,h.y)}
  html.style.scrollBehavior=oldBehavior;
 }
}
function schedule(){
 const h=hold;if(!h||h.frame)return;
 h.frame=requestAnimationFrame(()=>{
  if(hold!==h)return;
  h.frame=0;restore();
  if(hold!==h)return;
  // Other UI decorators append the journey and selection hints in an rAF.
  h.second=requestAnimationFrame(()=>{
   if(hold!==h)return;
   h.second=0;restore();
  });
 });
}
function changed(){
 const h=hold;if(!h)return;
 if(!$(LOBBIES[h.kind].selector,h.root)||identity(h.kind,h.root)!==h.identity){cancel();return}
 restore();
 schedule();
 // Do not unlock on an unrelated pending badge: the server RPC is still running.
 if(!h.originalLobby.isConnected){
  clearTimeout(h.settle);
  h.settle=setTimeout(()=>{if(hold===h){restore();cancel()}},650);
 }
}
function begin(kind){
 const root=app(),meta=LOBBIES[kind],lobby=root&&$(meta.selector,root);
 if(!lobby)return;
 if(hold&&hold.kind===kind&&hold.root===root&&hold.originalLobby.isConnected)return;
 cancel();
 const y=Math.max(0,window.scrollY),minHeight=root.style.minHeight;
 const measured=root.getBoundingClientRect().height;
 root.style.minHeight=Math.ceil(Math.max(measured,y+window.innerHeight+16))+'px';
 const h={kind,root,originalLobby:lobby,identity:identity(kind,root),y,minHeight,frame:0,second:0,timeout:0,settle:0};
 hold=h;
 h.timeout=setTimeout(()=>{if(hold===h)cancel()},12000);
 schedule();
}
function onPointerDown(event){
 const kind=laneFrom(event.target);if(kind)begin(kind);
}
function onClick(event){
 const kind=laneFrom(event.target);
 if(kind&&(!hold||hold.kind!==kind))begin(kind);
}
function init(){
 const root=app();if(!root)return;
 document.addEventListener('pointerdown',onPointerDown,true);
 document.addEventListener('click',onClick,true);
 // A deliberate scroll cancels the lock; users must never be trapped.
 document.addEventListener('touchmove',cancel,{passive:true,capture:true});
 document.addEventListener('wheel',cancel,{passive:true,capture:true});
 document.addEventListener('keydown',event=>{
  if(['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key)&&hold)cancel();
 },true);
 observer=new MutationObserver(mutations=>{
  if(!hold)return;
  if(mutations.some(m=>m.type==='childList'&&(m.addedNodes.length||m.removedNodes.length)))changed();
 });
 observer.observe(root,{subtree:true,childList:true});
 window.addEventListener('pagehide',cancel,{passive:true});
}
window.IGR_ROLE_VIEWPORT_V816=Object.freeze({version:'816.0',isActive:()=>!!hold});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();