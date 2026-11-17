/* v772: authorized live cast labels. S1/S2/S3 are internal slots, never player-facing. */
(()=>{
 'use strict';
 const VERSION='772.1-cast';
 let activeKey='',names=null,loading=false,failedKey='',queued=false;
 const isLive=()=>window.STATE?.view==='game'&&!!window.STATE?.room&&!!window.STATE?.token;
 const currentKey=()=>String(window.STATE?.room||'')+'|'+String(window.STATE?.token||'')+'|'+String(window.STATE?.sync?.room?.state?.match_no||1);
 async function readNames(){
   if(!isLive()||loading)return;
   const k=currentKey();
   if(names&&activeKey===k)return;
   if(failedKey===k)return;
   activeKey=k;loading=true;
   try{
     if(typeof window.rpc!=='function'&&typeof rpc!=='function')return;
     const result=await (typeof rpc==='function'?rpc:window.rpc)('igr_v772_public_cast',{p_code:STATE.room,p_player_token:STATE.token});
     if(currentKey()!==k)return;
     const out={};
     for(let i=1;i<=9;i++){
       const v=String(result?.['S'+i]||'').trim();
       if(v&&v.length<=32)out['S'+i]=v;
     }
     names=out;
     applyNames();
   }catch(err){failedKey=k;console.warn('[IGR v772] cast labels unavailable',err?.message||err);}
   finally{loading=false;}
 }
 function applyNames(){
   if(!isLive())return;
   const k=currentKey();
   if(activeKey!==k){names=null;failedKey='';activeKey=k;}
   if(!names){void readNames();return;}
   const app=document.querySelector('#app .game-v11');
   if(!app)return;
   const roots=app.querySelectorAll('.igr106-common,.igr106-public-teaser,.igr634-workspace,.private-card-v11,.phase-explain,.igr001-reports,.igr106-action-panel');
   for(const root of roots){
     const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
     let node;while((node=walker.nextNode())){
       const parent=node.parentElement;
       if(!parent||parent.closest('script,style,textarea,input,select,option,code,[contenteditable="true"]'))continue;
       const before=node.nodeValue||'';
       if(!/\bS[1-9]\b/.test(before))continue;
       const after=before.replace(/\bS[1-9]\b/g,slot=>names[slot]||slot);
       if(after!==before)node.nodeValue=after;
     }
   }
 }
 function schedule(){
   if(queued)return;queued=true;
   queueMicrotask(()=>{queued=false;applyNames();});
 }
 function boot(){
   const root=document.getElementById('app');
   if(!root)return;
   const observer=new MutationObserver(schedule);
   observer.observe(root,{childList:true,subtree:true,characterData:true});
   schedule();
   window.addEventListener('pageshow',schedule,{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.IGR_CAST_V772=Object.freeze({version:VERSION});
})();