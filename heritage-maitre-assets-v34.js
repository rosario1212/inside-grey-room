/* Inside Grey Room v34 — MAÎTRE asset map */
(()=>{
'use strict';
const data=window.IGR_HERITAGE_MAITRE_DATA;
if(!data?.META)return;
const paths={
  1:'assets/heritage-maitre-01-le-client.svg?v=v34-maitre',
  2:'assets/heritage-maitre-02-le-deal.svg?v=v34-maitre',
  3:'assets/heritage-maitre-03-deux-choix.svg?v=v34-maitre',
  4:'assets/heritage-maitre-04-le-proces.svg?v=v34-maitre',
  5:'assets/heritage-maitre-05-l-honneur.svg?v=v34-maitre'
};
const chapters=Object.freeze(data.META.chapters.map(ch=>Object.freeze({...ch,poster:paths[ch.n]||ch.poster})));
const META=Object.freeze({...data.META,cover:paths[1],chapters});
window.IGR_HERITAGE_MAITRE_DATA=Object.freeze({...data,META});
})();
