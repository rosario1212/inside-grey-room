/* Inside Grey Room — HÉRITAGE / CASINO v91
 * Public campaign catalog. The separate client receives server projections.
 * Private stories are selected and retained exclusively by the server.
 */
(()=>{'use strict';
const VERSION='91.3-casino-heritage';
const ROOT='casino-heritage-v91';
const POSTER_BASE='assets/casino/';
const CHAPTERS=Object.freeze([
  {number:1,title:'LES PORTES DE L’IMPÉRIAL',image:'scenario-1.webp',phases:['LES GRANDES MISES','LES DETTES DU DRAGON','LA PORTE DU DRAGON'],summary:'Une soirée privée, des ambitions incompatibles et des engagements qui peuvent changer le destin de Yonghe.'},
  {number:2,title:'LA CHUTE DE L’IMPÉRIAL',image:'scenario-2.webp',phases:['L’INTERVENTION','LES AUDITIONS','LA DÉTENTION'],summary:'Un bureau d’enquête tente de reconstituer les réseaux de Macao. Les preuves, et non les rumeurs, déterminent les interpellations.'},
  {number:3,title:'LE DERNIER DRAGON',image:'scenario-3.webp',phases:['L’AUDIENCE','LA SUCCESSION'],summary:'Alliances, procès et luttes d’influence détermineront qui peut réellement gouverner Yonghe.'}
]);
const clone=value=>JSON.parse(JSON.stringify(value));
const $=(s,r=document)=>r.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Unequal panel boundaries from the approved 1536 × 1024 original sheet.
// Keep the source intact: the viewport isolates each composition at render time.
const POSTERS=Object.freeze({'campagne.webp':[0,435],'scenario-1.webp':[435,368],'scenario-2.webp':[803,381],'scenario-3.webp':[1184,352]});
function artwork(file,alt=''){const [x,width]=POSTERS[file];return `<span class="casino-poster" style="--poster-x:${x};--poster-width:${width}"><img src="${POSTER_BASE}approved-posters-v105-2.webp" alt="${safe(alt)}" width="1536" height="1024" loading="eager" decoding="async"></span>`}
function shellPut(html){const root=$('#app');if(!root)return false;root.innerHTML=typeof shell==='function'?shell(html,false):'<div class="app">'+html+'</div>';try{window.scrollTo({top:0,behavior:'auto'})}catch{}return true}
function top(back){return `<header class="hplay-top casino-top"><button class="hplay-back" data-casino-nav="${back}">← <span>${back==='hub'?'MODE HÉRITAGE':'CASINO'}</span></button><div class="hplay-mode">HÉRITAGE · CASINO</div></header>`}
function isOwnPage(){return !!$('.casino-page[data-casino-page]')}
function renderCampaign(){const chapters=CHAPTERS.map(c=>`<button type="button" class="casino-dossier" data-casino-chapter="${c.number}">
    <span class="casino-dossier-poster">${artwork(c.image)}</span>
    <span class="casino-dossier-content"><small>SCÉNARIO ${c.number}</small><strong>${safe(c.title)}</strong><span>${safe(c.summary)}</span><em>EXPLORER LE DOSSIER →</em></span></button>`).join('');
 return shellPut(`<main class="page hplay casino-page" data-casino-page="campaign">${top('hub')}
   <div class="casino-intro"><figure class="casino-hero">${artwork('campagne.webp','Affiche de la campagne Casino')}</figure>
   <header class="casino-heading"><span>MACAO · SYNDICAT YONGHE</span><h1>CASINO</h1><p>Trois scénarios liés. Le casino, la guerre de succession et l’enquête évoluent au gré des alliances et des décisions.</p></header></div>
   <section class="casino-public-note"><strong>UNE CAMPAGNE · TROIS SCÉNARIOS</strong><span>De la première mise au verdict final, les décisions et les alliances se poursuivent dans la même partie. 7 à 12 participants, chacun sur son écran.</span></section>
   <div class="casino-launch"><button class="casino-action" type="button" data-casino-live>Jouer la campagne</button><p>Créer une table, rejoindre des amis ou reprendre une partie.</p></div>
   <section class="casino-chapters" aria-label="Scénarios de la campagne Casino">${chapters}</section>
   <section class="casino-pillars"><div><b>LA PAROLE</b><p>Alliances et accords oraux ou signés, consignés dans le Registre.</p></div><div><b>LE RISQUE</b><p>Poker au premier cycle ; ensuite, jeux et négociations au choix.</p></div><div><b>LES CONSÉQUENCES</b><p>Réputation, territoires, témoignages, arrestations et succession.</p></div></section>
 </main>`)}
function renderChapter(n){const ch=CHAPTERS.find(x=>x.number===n);if(!ch)return renderCampaign();const phases=ch.phases.map((name,i)=>`<div class="casino-phase"><b>${i+1}</b><strong>${safe(name)}</strong></div>`).join('');
 return shellPut(`<main class="page hplay casino-page" data-casino-page="chapter">${top('campaign')}
 <header class="casino-heading"><span>CASINO · SCÉNARIO ${ch.number}</span><h1>${safe(ch.title)}</h1><p>${safe(ch.summary)}</p></header>
 <figure class="casino-chapter-cover">${artwork(ch.image,'Affiche de '+ch.title)}</figure>
 <section class="casino-public-note"><strong>PRÉPARATION CONFIDENTIELLE</strong><span>Les identités criminelles et les dossiers d’enquête seront attribués à partir des noms des joueurs. Aucun prénom imposé ne remplace celui d’un participant. Les informations du bureau et du casino resteront séparées côté serveur.</span></section>
 <section class="casino-phases"><h2>Progression · ${ch.phases.length} phases</h2>${phases}</section>
 <div class="casino-launch casino-chapter-launch"><button class="casino-action" type="button" data-casino-live>JOUER LA CAMPAGNE</button><p>Les trois scénarios se suivent dans l’ordre. Une partie en cours reprend automatiquement au bon chapitre.</p></div>
 </main>`)}
function patchHub(){const hub=$('.hplay-hub-grid')||$('.heritage-campaign-grid');if(!hub||hub.querySelector('[data-casino-nav="campaign"]'))return;
 const card=document.createElement('button');card.type='button';card.className='hplay-campaign-card casino-entry';card.dataset.casinoNav='campaign';card.innerHTML=`${artwork('campagne.webp')}<span class="hplay-campaign-body"><em>MACAO · TRIADES · PÈGRE INTERNATIONALE</em><strong>CASINO</strong><small>Guerre de succession, jeux, accords et enquête internationale.</small><span class="hplay-campaign-foot"><b>3 SCÉNARIOS</b><i>EXPLORER →</i></span></span>`;
 hub.appendChild(card);
}
function patchJoin(){const input=$('#joinCode');if(!input)return;input.maxLength=10;
 if($('#casino-guest-entry'))return;
 const entry=document.createElement('button');entry.id='casino-guest-entry';entry.type='button';entry.className='btn ghost block';entry.dataset.casinoLive='';entry.dataset.casinoJoin='';entry.textContent='Rejoindre une table CASINO';
 input.closest('.panel')?.appendChild(entry);
}
function handleClick(event){const target=event.target.closest?.('[data-casino-nav],[data-casino-chapter]');if(!target)return;event.preventDefault();event.stopImmediatePropagation();
 if(target.dataset.casinoChapter){renderChapter(Number(target.dataset.casinoChapter));return}
 if(target.dataset.casinoNav==='hub'){if(window.IGR_HERITAGE_PLAY?.open)window.IGR_HERITAGE_PLAY.open();else window.IGR_HERITAGE?.open?.();return}
 renderCampaign();}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;patchHub();patchJoin()})}
function boot(){document.addEventListener('click',handleClick,true);const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});patchHub();patchJoin();window.addEventListener('pageshow',schedule,{passive:true})}
window.IGR_CASINO_HERITAGE=Object.freeze({version:VERSION,launchReady:true,chapters:clone(CHAPTERS),open:renderCampaign,openChapter:renderChapter});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
