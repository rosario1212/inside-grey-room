/* Inside Grey Room v34.4 — MAÎTRE corrected poster asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:'/assets/heritage-maitre-01-le-client-v34-4.svg?v=v34.4-maitre-fix',
  2:'/assets/heritage-maitre-02-le-deal-v34-4.svg?v=v34.4-maitre-fix',
  3:'/assets/heritage-maitre-03-deux-choix-v34-4.svg?v=v34.4-maitre-fix',
  4:'/assets/heritage-maitre-04-le-proces-v34-4.svg?v=v34.4-maitre-fix',
  5:'/assets/heritage-maitre-05-l-honneur-v34-4.svg?v=v34.4-maitre-fix'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
