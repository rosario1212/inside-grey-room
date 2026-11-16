// v725 — native artwork fit for Base 009–020 and every DLC.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=name=>readFileSync(name,'utf8');
const css=read('catalog-descriptions-v1.css');
const app=read('app-v11.js');
const omerta=read('omerta-v12.js');
const omertaHQ=read('omerta-v12-39.js');
const terror=read('terror-v12-37.js');
const dlc=read('dlc-suite-v12-37.js');
const premium=read('premium-access-sync-v17.js');
const fullArt='src="$'+'{scenarioArt(sc.id)}"';
const thumbnail='src="$'+'{scenarioThumbArt(sc.id)}"';
assert(css.includes('CATALOGUE FIT v13'));
assert(css.includes('grid-template-areas:"poster content" "metadata metadata"'));
assert(css.includes('--igr-poster-ratio:1086/1448'));
assert(css.includes('--igr-poster-ratio:724/960'));
assert(css.includes('object-fit:contain!important'));
assert(css.includes('-webkit-line-clamp:3!important'));
assert(css.includes('grid-area:metadata!important'));
for(const [label,source] of [['BASE',app],['OMERTÀ',omerta],['TERREUR',terror],['CARTEL/RÉGIME',dlc]]){
  assert(source.includes(fullArt),label+' needs full artwork');
  assert(!source.includes(thumbnail),label+' must not use thumbnail artwork');
}
assert(premium.includes("function artFor(id){try{return typeof scenarioArt==='function'?scenarioArt(id):''}"));
assert(omertaHQ.includes("scenarioThumbArt = function(id){ return isOmerta(id) ? ART[String(id)] : previousThumb(id); }"));
assert(!omertaHQ.includes('v53LightThumb'));
assert(app.includes('const PUBLIC_LOBBY_SUMMARIES'), 'Keep canonical dossier copy intact');
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
assert(read('index.html').includes('catalog-descriptions-v1.css?v=v725-poster-native-fit-20261116'));
console.log('PASS v725: full 009–034 posters, native ratio, no placeholders and stable metadata footer.');
