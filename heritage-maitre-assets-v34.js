/* Inside Grey Room v34.3 — MAÎTRE final poster asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:'/assets/heritage-maitre-01-le-client.webp?v=v34.3-maitre-polish',
  2:'/assets/heritage-maitre-02-le-deal.webp?v=v34.3-maitre-polish',
  3:'/assets/heritage-maitre-03-deux-choix.webp?v=v34.3-maitre-polish',
  4:'/assets/heritage-maitre-04-le-proces.webp?v=v34.3-maitre-polish',
  5:'/assets/heritage-maitre-05-l-honneur.webp?v=v34.3-maitre-polish'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
