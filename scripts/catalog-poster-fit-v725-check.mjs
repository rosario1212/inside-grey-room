// v727 — one Base poster gabarit; independent DLCs; 30-word cap for all previews.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(name,'utf8');
const css=read('catalog-descriptions-v1.css');
const app=read('app-v11.js');
const omerta=read('omerta-v12.js');
const omertaHQ=read('omerta-v12-39.js');
const terror=read('terror-v12-37.js');
const dlc=read('dlc-suite-v12-37.js');
const premium=read('premium-access-sync-v17.js');
const finalCss=css.slice(css.indexOf('/* INSIDE GREY ROOM — CATALOGUE v728'));
assert(finalCss.startsWith('/* INSIDE GREY ROOM — CATALOGUE v728'));
assert(finalCss.includes('display:grid!important'));
assert(finalCss.includes('float:none!important'));
assert(finalCss.includes('grid-template-columns:var(--igr-card-art-width) minmax(0,1fr)!important'));
assert(finalCss.includes('aspect-ratio:var(--igr-card-art-ratio)!important'));
assert(finalCss.includes('object-fit:contain!important'));
assert(finalCss.includes('--igr-card-art-ratio:3/4'));
assert(finalCss.includes('--igr-card-art-ratio:724/960'));
assert(finalCss.includes('var(--igr-cover-url'));
assert(!finalCss.includes('#scenario-009')&&!finalCss.includes('#scenario-020'));
const fullArt='src="$'+'{scenarioArt(sc.id)}"';
const thumbnail='src="$'+'{scenarioThumbArt(sc.id)}"';
for(const [label,source] of [
 ['BASE',app],['OMERTÀ',omerta],['TERREUR',terror],['CARTEL/RÉGIME',dlc]
]){
  assert(source.includes(fullArt),label+' uses original poster art');
  assert(!source.includes(thumbnail),label+' must not use thumbnails');
}
assert(premium.includes("function artFor(id){try{return typeof scenarioArt==='function'?scenarioArt(id):''}"));
assert(omertaHQ.includes("scenarioThumbArt = function(id){ return isOmerta(id) ? ART[String(id)] : previousThumb(id); }"));
assert(!omertaHQ.includes('v53LightThumb'));
for(const [label,source] of [
 ['Base',app],['Omertà',omerta],['Terreur',terror],['Cartel/Régime',dlc],['Premium',premium]
]){
  assert(source.includes('</p><div class="tag-row" aria-label="Informations du dossier">'),
    label+' must put badges inside the text block');
  assert(source.includes('</div></div></article>'),label+' malformed nesting');
  assert(source.includes('class="igr-card-excerpt"'),label+' must have a teaser');
  if(label==='Base')
    assert(source.includes("scenarioCardTeaser(typeof scenarioCatalogueSynopsis==='function'?scenarioCatalogueSynopsis(sc):sc.short,30)"));
  else
    assert(source.includes('scenarioCardTeaser(sc.short,30)'),label+' must enforce 30 words');
}
assert(app.includes('CATALOGUE_LONGER_INTROS'),'Narrative catalogue copy stays presentation-only');
assert(app.includes("'011':'Pendant trente-six heures"));
const start=app.indexOf('/* Catalogue-only descriptions:');
const end=app.indexOf('function scenarioCardTeaser(',start);
assert(start>=0&&end>start);
const french=vm.runInNewContext(app.slice(start,end)+
 '\nscenarioCatalogueSynopsis({id:"011",short:"Old short description"})',
 {window:{IGR_LOCALE:'fr'}});
assert(french.includes('Trois officiers')&&french.split(/\s+/).length>=25);
const english=vm.runInNewContext(app.slice(start,end)+
 '\nscenarioCatalogueSynopsis({id:"011",short:"English synopsis"})',
 {window:{IGR_LOCALE:'en'}});
assert.equal(english,'English synopsis');
const helperEnd=app.indexOf('\nconst ADVANCED_SCENARIO_IDS=',end);
const teaser=vm.runInNewContext(app.slice(end,helperEnd)+
 '\nscenarioCardTeaser', {window:{}});
for(const n of [0,1,5,20,30,31,45,80]){
 const str=Array.from({length:n},(_,i)=>'mot'+i).join(' ');
 const preview=teaser(str,30);
 assert(preview.trim().split(/\s+/).filter(Boolean).length<=30,
   'Pre-click text exceeds thirty words: '+n);
}
assert(app.includes('const PUBLIC_LOBBY_SUMMARIES'),'Canonical briefings preserved');
function webpSize(file){
  assert(existsSync(file),'Missing artwork: '+file);
  const b=readFileSync(file);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
  const c=b.toString('ascii',12,16);
  if(c==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
  if(c==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
  if(c==='VP8L')return [1+(((b[22]&63)<<8)|b[21]),1+(((b[24]&15)<<10)|(b[23]<<2)|((b[22]&192)>>6))];
  throw new Error('Unsupported WebP codec in '+file+': '+c);
}
const check=(file,w,h)=>assert.deepEqual(webpSize(file),[w,h],file+' dimensions');
for(let i=9;i<=20;i++)check('assets/scenario-'+String(i).padStart(3,'0')+'-v11-6.webp',1086,1448);
for(const name of [
 'omerta-021-l-enveloppe','omerta-022-omerta','omerta-023-la-table',
 'omerta-024-il-pentito','omerta-025-il-don','terror-026-la-ville-tombe',
 'terror-027-la-zone-rouge','terror-028-dernier-perimetre',
 'regime-032-les-archives-du-palais','regime-033-la-dynastie',
 'regime-034-les-noms-quils-portaient'
])check('assets/'+name+'.webp',1086,1448);
for(const id of ['029','030','031']){
 const file='assets/cartel-'+id+'-poster-v2.svg';
 assert(existsSync(file),file+' missing');
 assert(read(file).includes('width="724" height="960"'),file+' ratio');
}
assert(read('index.html').includes('catalog-descriptions-v1.css?v=v728-approved-five-mockups-20261116'));
console.log('PASS v728: source posters, independent five-family cards, responsive grid, 30-word cap.');
