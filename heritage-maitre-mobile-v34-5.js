/* Inside Grey Room v34.9 — MAÎTRE mobile visual recovery */
(()=>{'use strict';
function repair(root=document){
  if(!root.querySelector?.('.maitre-page,.maitre-hub-card'))return;
  root.querySelectorAll?.('.maitre-page .hplay-poster img,.maitre-page .hplay-case-poster img,.maitre-page .hplay-campaign-hero img,.maitre-hub-card>img').forEach(img=>{
    const current=img.getAttribute('src')||'';
    const number=Number(current.match(/heritage-maitre-(\d{2})-/)?.[1]);
    const expected=window.IGR_HERITAGE_MAITRE_DATA?.META?.chapters?.find(ch=>ch.n===number)?.poster;
    if(!expected)return;
    if(current!==expected)img.src=expected;
    img.decoding='async';
  });
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
