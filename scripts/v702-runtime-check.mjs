// v702: validate the published web/native artifacts, not source-only signatures.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {brotliCompressSync,constants as zlibConstants} from 'node:zlib';
import {Script} from 'node:vm';
import path from 'node:path';

const out=path.resolve(process.argv[2]||'dist');
const read=name=>readFile(path.join(out,name),'utf8');
const report=JSON.parse(await read('igr-v702-optimization-report.json'));
assert.equal(report.revision,'v702');
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
const brotli=s=>brotliCompressSync(Buffer.from(s),{params:{[zlibConstants.BROTLI_PARAM_QUALITY]:5}}).length;
assert.equal(report.pages.length,2);
assert(report.bundles.length>2,'No bundle output');
const builtNames=new Set();
for(const item of report.bundles){
 assert.match(item.file,/^igr-v702-(?:css|js)-[a-f0-9]{16}\.(?:css|js)$/);
 assert(!builtNames.has(item.file),'Duplicated bundle filename');builtNames.add(item.file);
 assert(item.sourceUrls.length>=2,'Non-beneficial bundle');
 assert(item.sourceUrls.every(url=>/^[A-Za-z0-9._-]+\.(?:css|js)(?:\?[^#]*)?$/.test(url)),
  'Only public top-level runtime sources may be bundled');
 const original=await Promise.all(item.sourceUrls.map(url=>read(url.split('?')[0])));
 const expected=original.map((source,i)=>item.kind==='js'
   ? '/* IGR v702 '+item.sourceUrls[i].split('?')[0]+' */\n;'+source.trim()+'\n'
   : '/* IGR v702 '+item.sourceUrls[i].split('?')[0]+' */\n'+source.trim()+'\n').join('\n');
 const content=await read(item.file);
 assert.equal(content,expected,item.file+' changed order or content');
 assert.equal(hash(content),item.digest);
 assert.equal(Buffer.byteLength(content),item.bundledBytes);
 assert.equal(brotli(content),item.brotliBundleBytes);
 assert.equal(original.reduce((n,x)=>n+brotli(x),0),item.brotliOriginalBytes);
 if(item.kind==='js')new Script(content,{filename:item.file});
 else assert(!/@(?:import|namespace|charset)\b/i.test(content),'Unsafe CSS directive merged');
}
const pages=Object.fromEntries(report.pages.map(p=>[p.page,p]));
const main=pages['index.html'],english=pages['en.html'];
assert(main.before.css-main.after.css>=5,'CSS request savings too small');
assert(main.before.js-main.after.js>=3,'JS request savings too small');
assert(main.requestReduction>10,'Release did not reduce enough load requests');
assert.equal(english.after.css,0);
assert.equal(english.after.js,0);
const html=await read('index.html'),en=await read('en.html');
assert.equal(await read('index-latest-release.txt'),html,'Cloudflare must serve the optimized main page');
assert.equal(await read('en-latest-release.txt'),en,'Cloudflare must serve the lean English redirect');
assert(en.includes("localStorage.setItem('igr_locale','en')")&&en.includes("location.replace('./')"),
 'The English locale redirect changed behavior');
for(const item of report.bundles){
 assert(html.includes(item.file),'Optimized bundle not requested by the published page: '+item.file);
}
const names=[...html.matchAll(/(?:src|href)="(igr-v702-(?:css|js)-[a-f0-9]{16}\.(?:css|js))"/g)].map(m=>m[1]);
assert.equal(new Set(names).size,names.length,'Duplicate bundle resource loads');
assert.equal(names.length,report.bundles.length,'Bundled files and actual HTML disagree');
const rawBefore=report.bundles.reduce((a,b)=>a+b.originalBytes,0);
const rawAfter=report.bundles.reduce((a,b)=>a+b.bundledBytes,0);
const brBefore=report.bundles.reduce((a,b)=>a+b.brotliOriginalBytes,0);
const brAfter=report.bundles.reduce((a,b)=>a+b.brotliBundleBytes,0);

// v163 visual catalogue contract: assert the *built* web or native artifacts,
// including the source that the final v702 hash bundles into the player UI.
const app=await read('app-v11.js');
const dlc=await read('dlc-suite-v12-37.js');
const premium=await read('premium-access-sync-v17.js');
const cartelRuntime=await read('dlc-suite-v12-37.js');
const cartelServiceWorker=report.platform==='web'?await read('service-worker.js'):null;
for(const id of ['029','030','031']){
  const name='cartel-'+id+'-poster-v2.svg';
  assert(cartelRuntime.includes(name),'Cartel generated gold-framed poster missing from runtime: '+id);
  if(cartelServiceWorker)assert(cartelServiceWorker.includes(name),'PWA cache must retain the generated Cartel poster: '+id);
  const art=await read('assets/'+name);
  assert(art.includes('<svg ')&&art.includes('INSIDE GREY ROOM')&&art.includes('CARTEL'),
    'Cartel generated illustration or original graphic styling missing: '+id);
}
const mobileCss=await read('mobile-ui-v28.css');
const desktopCss=await read('screen-polish-v73.css');
// v728 — approved mockup layout contract. Post-click narrative is unchanged.
assert(app.includes('function scenarioCardTeaser(raw,maxWords=30)'), 'Shared 30-word teaser helper missing');
assert(app.includes("scenarioCardTeaser(typeof scenarioCatalogueSynopsis==='function'?scenarioCatalogueSynopsis(sc):sc.short,30)"),
  'Every Base dossier, including 001–008, must use the same 30-word cap');
for(const [label,source] of [
  ['base',app],['Omertà',await read('omerta-v12.js')],
  ['Terreur',await read('terror-v12-37.js')],
  ['Cartel/Régime',dlc],['premium',premium]
]){
  assert(source.includes('class="igr-poster-full"')&&!source.includes('class="igr-poster-ambient"'),
    label+' must render the full original illustration without a miniature');
  assert(source.includes('</p><div class="tag-row" aria-label="Informations du dossier">'),
    label+' badges must live inside the text block, not in a full-width footer');
  assert(source.includes('</div></div></article>'),
    label+' nested metadata container must close correctly');
  if(label!=='base')assert(source.includes('scenarioCardTeaser(sc.short,30)'),
    label+' must enforce the universal 30-word cap');
}
const teaserStart=app.indexOf('function scenarioCardTeaser(raw,maxWords=30)');
const teaserEnd=app.indexOf('\nconst ADVANCED_SCENARIO_IDS=',teaserStart);
assert(teaserStart>=0&&teaserEnd>teaserStart);
const cx={window:{innerWidth:320}};
new Script(app.slice(teaserStart,teaserEnd)+'\n;globalThis.catalogueTeaser=scenarioCardTeaser;').runInNewContext(cx);
const probe=Array.from({length:46},(_,i)=>'mot'+i).join(' ');
for(const width of [320,375,390,430,768,1440]){
  cx.window.innerWidth=width;
  assert(cx.catalogueTeaser(probe,30).trim().split(/\s+/).length<=30,
    width+'px preview must never exceed 30 words');
}
assert.equal(cx.catalogueTeaser('Deux phrases simples.'),'Deux phrases simples.');
assert(cx.catalogueTeaser(probe,30).endsWith('…'),'Long previews should signal more detail');
assert(app.includes('class="confirm-copy"'),'Post-click dossier context must remain intact');
const familyCss=await read('catalog-descriptions-v1.css');
const finalCss=familyCss.slice(familyCss.indexOf('/* INSIDE GREY ROOM — CATALOGUE v728'));
assert(finalCss.startsWith('/* INSIDE GREY ROOM — CATALOGUE v728'));
assert(finalCss.includes('display:grid!important')&&finalCss.includes('float:none!important'),
 'Posters and texts must occupy independent columns, never wrap below the artwork');
assert(finalCss.includes('grid-template-columns:var(--igr-card-art-width) minmax(0,1fr)!important'),
 'Card geometry must use one fixed left media column');
assert(finalCss.includes('object-fit:contain!important')&&finalCss.includes('aspect-ratio:var(--igr-card-art-ratio)!important'),
 'Full original poster must retain its source content in the family display frame');
assert(finalCss.includes('--igr-card-art-ratio:3/4'),'Base 001–020 must share one 3:4 optical display frame');
assert(!finalCss.includes('#scenario-009')&&!finalCss.includes('#scenario-020'),
 'No private 009–020 geometry must override the 001–020 standard');
for(const [family,ratio] of [
 ['omerta','3/4'],['terror','3/4'],['cartel','724/960'],['regime','3/4']
]){
 assert(finalCss.includes('article.scenario.scenario--art.scenario--compact.'+family+'-scenario'),
  family+' must keep independent styling');
 assert(finalCss.includes('--igr-card-art-ratio:'+ratio),family+' aspect ratio missing');
}
assert(finalCss.includes('var(--igr-cover-url'),'All families need a soft background when text makes a card taller');
assert(!finalCss.includes('object-fit:fill!important'),'Distorted artwork forbidden');
assert(html.includes('catalog-descriptions-v1.css')||report.bundles.some(b=>
  b.sourceUrls?.some(url=>url.startsWith('catalog-descriptions-v1.css'))),
  'The consolidated family stylesheet must reach the published bundle');
console.log('PASS v728 — live 2-column catalogue, uncropped posters, independent DLCs, 30-word previews');

console.log('PASS v702 '+report.platform+' — CSS '+main.before.css+'→'+main.after.css+
 ' / JS '+main.before.js+'→'+main.after.js+
 ' / resource requests −'+main.requestReduction+
 ' / grouped raw '+rawBefore+'→'+rawAfter+' B'+
 ' / grouped Brotli '+brBefore+'→'+brAfter+' B');
