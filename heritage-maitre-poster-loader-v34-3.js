/* Inside Grey Room v34.3 — robust MAÎTRE poster loader */
(()=>{
'use strict';
const VERSION='v34.3-maitre-posters';
const parts={1:4,2:5,3:3,4:4,5:3};
const cache=new Map();
const marker=n=>`#igr-maitre-${n}`;
const placeholder=n=>`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 16'%3E%3Crect width='9' height='16' fill='%23f4f0e8'/%3E%3C/svg%3E${marker(n)}`;
function targetIndex(src=''){for(let n=1;n<=5;n++)if(String(src).includes(marker(n)))return n;return 0}
async function build(n){
  if(cache.has(n))return cache.get(n);
  const jobs=[];
  for(let i=1;i<=parts[n];i++)jobs.push(fetch(`assets/heritage-maitre-0${n}-part-${i}.b64?v=${VERSION}`,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`poster ${n}.${i} ${r.status}`);return r.text()}));
  const p=Promise.all(jobs).then(xs=>`data:image/webp;base64,${xs.join('').replace(/\s+/g,'')}`);
  cache.set(n,p);return p;
}
function replace(root=document){
  root.querySelectorAll?.('img').forEach(img=>{
    const n=targetIndex(img.getAttribute('src')||img.src);if(!n||img.dataset.maitrePosterLoading)return;
    img.dataset.maitrePosterLoading='1';
    build(n).then(url=>{img.src=url;img.removeAttribute('data-maitre-poster-loading');img.dataset.maitrePosterReady='1'}).catch(err=>{console.error('[MAÎTRE poster]',err);img.removeAttribute('data-maitre-poster-loading')});
  });
}
function installMap(){
  const data=window.IGR_HERITAGE_MAITRE_DATA;if(!data?.META)return false;
  const paths={1:placeholder(1),2:placeholder(2),3:placeholder(3),4:placeholder(4),5:placeholder(5)};
  const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
  const META=Object.freeze({...data.META,cover:paths[1],chapters});
  window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
  return true;
}
function startDom(){
  replace();
  const obs=new MutationObserver(ms=>{for(const m of ms)for(const node of m.addedNodes)if(node.nodeType===1){if(node.matches?.('img'))replace(node.parentElement||document);else replace(node)}});obs.observe(document.documentElement,{childList:true,subtree:true});
}
if(!installMap())throw new Error('[MAÎTRE poster] data must load before poster loader');
[1,2,3,4,5].forEach(n=>build(n).catch(err=>console.error('[MAÎTRE poster preload]',err)));
window.IGR_HERITAGE_MAITRE_POSTERS=Object.freeze({version:VERSION,build,placeholder});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startDom,{once:true});else startDom();
})();
