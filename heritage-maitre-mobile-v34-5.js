/* Inside Grey Room v34.5 — MAÎTRE mobile visual recovery */
(()=>{'use strict';
const posters={
  'LE CLIENT':'/assets/heritage-maitre-01-le-client-v34-4.svg?v=v34.5',
  'LE DEAL':'/assets/heritage-maitre-02-le-deal-v34-4.svg?v=v34.5',
  'DEUX CHOIX':'/assets/heritage-maitre-03-deux-choix-v34-4.svg?v=v34.5',
  'LE PROCÈS':'/assets/heritage-maitre-04-le-proces-v34-4.svg?v=v34.5',
  'L’HONNEUR':'/assets/heritage-maitre-05-l-honneur-v34-4.svg?v=v34.5'
};
function repair(root=document){
  if(!root.querySelector?.('.maitre-page,.maitre-hub-card'))return;
  root.querySelectorAll?.('.maitre-page img,.maitre-hub-card>img').forEach(img=>{
    const box=img.closest('.hplay-case,.hplay-dossier-grid,.hplay-campaign-hero,.maitre-hub-card');
    const text=(box?.textContent||'').toUpperCase();
    let key=Object.keys(posters).find(k=>text.includes(k));
    if(!key&&img.closest('.hplay-campaign-hero,.maitre-hub-card'))key='LE CLIENT';
    if(!key)return;
    const expected=posters[key];
    if(!img.src.includes('-v34-4.svg'))img.src=expected;
    img.onerror=()=>{img.onerror=null;img.src=expected;};
    img.decoding='async';
  });
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
