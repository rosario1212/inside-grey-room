/* Inside Grey Room v34.9 — MAÎTRE approved poster asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:'/assets/heritage-maitre-01-le-client-hd-v77.webp?v=v77-heritage-clarity',
  2:'/assets/heritage-maitre-02-le-deal-hd-v79.webp?v=v79-audit-fixes',
  3:'/assets/heritage-maitre-03-deux-choix-hd-v79.webp?v=v79-audit-fixes',
  4:'/assets/heritage-maitre-04-le-proces-hd-v79.webp?v=v79-audit-fixes',
  5:'/assets/heritage-maitre-05-l-honneur-hd-v79.webp?v=v79-audit-fixes'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
