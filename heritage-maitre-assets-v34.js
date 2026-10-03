/* Inside Grey Room v34.6 — MAÎTRE final user-approved poster asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:window.__IGR_MAITRE_POSTER_1||'/assets/heritage-maitre-01-le-client-v34-4.svg?v=v34.6-final-posters',
  2:window.__IGR_MAITRE_POSTER_2||'/assets/heritage-maitre-02-le-deal-v34-4.svg?v=v34.6-final-posters',
  3:window.__IGR_MAITRE_POSTER_3||'/assets/heritage-maitre-03-deux-choix-v34-4.svg?v=v34.6-final-posters',
  4:window.__IGR_MAITRE_POSTER_4||'/assets/heritage-maitre-04-le-proces-v34-4.svg?v=v34.6-final-posters',
  5:window.__IGR_MAITRE_POSTER_5||'/assets/heritage-maitre-05-l-honneur-v34-4.svg?v=v34.6-final-posters'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
