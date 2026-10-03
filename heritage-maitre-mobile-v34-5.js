/* Inside Grey Room v34.8 — MAÎTRE mobile visual recovery */
(()=>{'use strict';
const VERSION='v34.8-maitre-ui';
const posters={
  'LE CLIENT':`/assets/heritage-maitre-01-le-client-final.webp?v=${VERSION}`,
  'LE DEAL':`/assets/heritage-maitre-02-le-deal-final.webp?v=${VERSION}`,
  'DEUX CHOIX':`/assets/heritage-maitre-03-deux-choix-final.webp?v=${VERSION}`,
  'LE PROCÈS':`/assets/heritage-maitre-04-le-proces-final.webp?v=${VERSION}`,
  'L’HONNEUR':`/assets/heritage-maitre-05-l-honneur-final.webp?v=${VERSION}`
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
    if(img.getAttribute('src')!==expected){img.removeAttribute('srcset');img.src=expected;}
    img.onerror=()=>{img.onerror=null;img.removeAttribute('srcset');img.src=expected;};
    img.decoding='async';
  });
}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',schedule,{once:true});window.addEventListener('pageshow',schedule,{passive:true});schedule();
})();
