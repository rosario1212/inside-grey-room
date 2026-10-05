/* Inside Grey Room v13.7 — MODE HÉRITAGE playable campaign layer
   Additive runtime: keeps the premium gate and the existing persistence API,
   but replaces the Heritage campaign/dossier presentation with a playable,
   pass-and-play campaign session designed for one shared phone at the table.
*/
(()=>{
'use strict';

const VERSION='13.7-heritage-play';
const LIVE_KEY='igr_heritage_live_v2';
const CAMPAIGN_IDS=['cendres','kuroi'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const txt=(v,n=240)=>String(v??'').trim().slice(0,n);
const clone=v=>JSON.parse(JSON.stringify(v));
const api=()=>window.IGR_HERITAGE;
const isFr=()=>window.IGR_LOCALE!=='en';

const ROLES={
  cendres:[
    {id:'chef',name:'CHEF DE CELLULE',public:'Coordonne les décisions et tranche quand le groupe se divise.'},
    {id:'sigint',name:'ANALYSTE SIGINT',public:'Lit les horaires, communications et anomalies techniques.'},
    {id:'terrain',name:'AGENT TERRAIN',public:'Connaît les lieux, filatures et contraintes opérationnelles.'},
    {id:'source',name:'OFFICIER TRAITANT',public:'Évalue les sources humaines, leurs motifs et leurs mensonges.'},
    {id:'liaison',name:'LIAISON VESPER',public:'Représente les autorités et mesure le coût politique des erreurs.'},
    {id:'legal',name:'ANALYSTE JUDICIAIRE',public:'Sépare preuve expl���q�^