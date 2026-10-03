/* Inside Grey Room v34.9 — MAÎTRE final poster + multiplayer bridge */
(()=>{
'use strict';
const POSTER_VERSION='v34.9-maitre-theme-posters';
const posterMap={
  '01-le-client':'/assets/heritage-maitre-01-le-client-final.webp',
  '02-le-deal':'/assets/heritage-maitre-02-le-deal-final.webp',
  '03-deux-choix':'/assets/heritage-maitre-03-deux-choix-final.webp',
  '04-le-proces':'/assets/heritage-maitre-04-le-proces-final.webp',
  '05-l-honneur':'/assets/heritage-maitre-05-l-honneur-final.webp'
};
function absolutePoster(src=''){
  const hit=Object.entries(posterMap).find(([key])=>String(src).includes(`heritage-maitre-${key}`));
  return hit?`${hit[1]}?v=${POSTER_VERSION}`:src;
}
function repairPosters(root=document){
  root.querySelectorAll('img').forEach(img=>{
    const src=img.getAttribute('src')||'';
    if(!src.includes('heritage-maitre-'))return;
    const fixed=absolutePoster(src);
    if(fixed&&src!==fixed)img.src=fixed;
    img.decoding='async';
    img.loading=img.closest('.hplay-campaign-hero,.hplay-poster')?'eager':'lazy';
  });
}
function bridgeMultiplayer(root=document){
  const page=root.querySelector('.maitre-page.hplay-dossier')||document.querySelector('.maitre-page.hplay-dossier');
  if(!page)return;
  const box=page.querySelector('.hplay-launch-box');
  const launch=box?.querySelector('.hplay-launch');
  if(!box||!launch||box.dataset.maitreMultiBridge==='1'||box.dataset.maitreNet==='1')return;
  launch.dataset.campaign='maitre';
  if(!launch.dataset.chapter){
    const m=(page.querySelector('.hplay-mode')?.textContent||'').match(/(\d+)/);
    if(m)launch.dataset.chapter=String(Number(m[1]));
  }
  const clone=launch.cloneNode(true);
  launch.replaceWith(clone);
  box.dataset.maitreMultiBridge='1';
  queueMicrotask(()=>{
    if(!box.querySelector('.dual-mode-chooser')&&!box.querySelector('.heritage-dual-row')){
      const note=document.createElement('div');
      note.className='maitre-multi-pending';
      note.innerHTML='<b>MULTIJOUEUR EN LIGNE</b><span>Le mode en ligne se charge…</span>';
      box.appendChild(note);
      setTimeout(()=>{if(box.querySelector('.dual-mode-chooser,.heritage-dual-row'))note.remove()},250);
    }
  });
}
function apply(root=document){repairPosters(root);bridgeMultiplayer(root)}
const observer=new MutationObserver(records=>{
  let relevant=false;
  for(const r of records){if(r.addedNodes?.length){relevant=true;break}}
  if(relevant)queueMicrotask(()=>apply(document));
});
function boot(){apply(document);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',()=>setTimeout(()=>apply(document),0),{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
