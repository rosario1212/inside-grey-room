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
assert(app.includes('function scenarioCardTeaser(raw,maxWords=30)'), 'Missing shared bounded scenario teaser function');
assert(app.includes('scenarioCardTeaser(sc.short)'), 'Classic cards must use the shared 30-word preview');
for(const [label,source] of [['DLC',dlc],['premium catalogue',premium]]){
 assert(source.includes('class="igr-card-excerpt"'),label+' card must show a teaser');
 assert(source.includes('scenarioCardTeaser(sc.short,19)'),label+' card must use the shorter DLC-specific preview');
 assert(source.includes('class="igr-poster-full"')&&!source.includes('class="igr-poster-ambient"'),
   label+' must use only one full-bleed poster, without inset or duplicate thumbnail');
}
assert(app.includes('class="igr-poster-full"')&&!app.includes('class="igr-poster-ambient"'),
 'Classic 001-020 must render one edge-to-edge full artwork without a miniature');
assert(app.includes('src="${scenarioArt(sc.id)}"'),
 'Classic cards must load original uncropped artwork, not reuse cropped thumbnails as foreground');
const start=app.indexOf('function scenarioCardTeaser(raw,maxWords=30)');
const end=app.indexOf('\nconst ADVANCED_SCENARIO_IDS=',start);
assert(start>=0&&end>start,'Cannot locate pure card teaser implementation');
const context={window:{innerWidth:360}};
new Script(app.slice(start,end)+'\n;globalThis.catalogueTeaser=scenarioCardTeaser;').runInNewContext(context);
const example='Deux dirigeants en fuite. Les enquêteurs recoupent les archives et les responsabilités judiciaires.';
assert.equal(context.catalogueTeaser(example),example,
  'Short synopsis must stay intact on iPhone');
context.window.innerWidth=1200;
assert.equal(context.catalogueTeaser(example),example,
  'Desktop catalogue must preserve the same full description');
assert.equal(context.catalogueTeaser('Déposition scellée.'),'Déposition scellée.',
  'Short public descriptions must never acquire a fabricated ellipsis');
assert.equal(context.catalogueTeaser('  Deux  phrases.  '),'Deux phrases.',
  'Whitespace normalization must preserve short synopses');
const longSynopsis=Array.from({length:45},(_,i)=>'mot'+i).join(' ');
assert.equal(context.catalogueTeaser(longSynopsis).split(/\s+/).length,30,
  'Catalogue previews are capped at 30 words across all screen widths');
assert(context.catalogueTeaser(longSynopsis).endsWith('…'),
  'Long catalogue previews must signal that more detail is available');
assert.equal(context.catalogueTeaser(longSynopsis,19).split(/\s+/).length,19,
  'DLC previews must stay within 19 words');
assert(context.catalogueTeaser('Plusieurs responsables sont interrogés dans une ville coupée du monde. Les enquêteurs cherchent qui a donné les ordres. La suite reste confidentielle.',19).endsWith('.'),
  'DLC catalogue previews should use a complete sentence whenever one fits the word budget');
assert(context.catalogueTeaser('Le FDR a pris presque tout Almizia. Des fonctionnaires ont été exécutés, des familles déplacées et des noms effacés des registres. Trois captifs racontent la suite.',19).split(/\s+/).length<=19,
  'When a longer sentence does not fit, the DLC teaser must still respect its word budget');
assert(app.includes('<p class="confirm-copy">${h(sc.context)}</p>'),
  'The selected dossier must retain the complete narrative context');
const fullCopyCss=await read('catalog-descriptions-v1.css');
assert(mobileCss.includes('v163 — unified mobile dossiers'),'Existing universal mobile structure missing');
assert(mobileCss.includes('height:auto!important'),'Cards must retain fluid heights');
assert(mobileCss.includes('.scenario--compact.regime-scenario'),'Regime must share the universal layout');
assert(desktopCss.includes('v163: the widescreen two-column browser'),
  'Desktop must keep adaptive card proportions');
assert(fullCopyCss.includes('p.igr-card-excerpt')&&fullCopyCss.includes('-webkit-line-clamp:unset!important'),
  'Final catalogue CSS must override the historical three-line truncation');
assert(fullCopyCss.includes('max-height:none!important')&&fullCopyCss.includes('height:auto!important'),
  'Cards and summary paragraphs must grow with their public copy');
assert(fullCopyCss.includes('FAMILY POSTER SYSTEM v11')&&fullCopyCss.includes('object-fit:contain!important'),
  'Catalogue must use independently sized family poster templates without artwork distortion');
for(const family of ['omerta','terror','cartel','regime']){
  assert(fullCopyCss.includes('article.scenario.scenario--art.scenario--compact.'+family+'-scenario'),
    'Dedicated poster template missing for '+family);
}
assert(fullCopyCss.includes('--igr-poster-ratio:724/960'),
  'Cartel art must keep its original 724×960 aspect ratio');
assert(!fullCopyCss.includes('object-fit:fill!important'),
  'Stretch-to-card legacy poster formatting must be removed');
assert(!fullCopyCss.includes('Unified full-frame poster v7'),
  'Obsolete inset-poster styles must be removed rather than stacked');
assert(html.includes('catalog-descriptions-v1.css') || report.bundles.some(b=>
  b.sourceUrls?.some(url=>url.startsWith('catalog-descriptions-v1.css'))),
  'Full-length dossier styles must be included in the published bundle');
console.log('PASS v163 — complete public previews and fluid, untruncated cards across web/native');

console.log('PASS v702 '+report.platform+' — CSS '+main.before.css+'→'+main.after.css+
 ' / JS '+main.before.js+'→'+main.after.js+
 ' / resource requests −'+main.requestReduction+
 ' / grouped raw '+rawBefore+'→'+rawAfter+' B'+
 ' / grouped Brotli '+brBefore+'→'+brAfter+' B');
