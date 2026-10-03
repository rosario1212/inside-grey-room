/* Inside Grey Room v34.7 — MAÎTRE approved poster asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:'/assets/heritage-maitre-01-le-client-final.webp?v=v34.7-maitre-real',
  2:'/assets/heritage-maitre-02-le-deal-final.webp?v=v34.7-maitre-real',
  3:'/assets/heritage-maitre-03-deux-choix-final.webp?v=v34.7-maitre-real',
  4:'/assets/heritage-maitre-04-le-proces-final.webp?v=v34.7-maitre-real',
  5:'/assets/heritage-maitre-05-l-honneur-final.webp?v=v34.7-maitre-real'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
