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
const mobileCss=await read('mobile-ui-v28.css');
const desktopCss=await read('screen-polish-v73.css');
assert(app.includes('function scenarioCardTeaser(raw)'), 'Missing global scenario teaser function');
for(const [label,source] of [['classics',app],['DLC',dlc],['premium catalogue',premium]]){
 assert(source.includes('class="igr-card-excerpt"'),label+' card must show a teaser');
 assert(source.includes('scenarioCardTeaser(sc.short)'),label+' card must display the same teaser logic');
}
const start=app.indexOf('function scenarioCardTeaser(raw)');
const end=app.indexOf('\nconst ADVANCED_SCENARIO_IDS=',start);
assert(start>=0&&end>start,'Cannot locate pure card teaser implementation');
const context={window:{innerWidth:360}};
new Script(app.slice(start,end)+'\n;globalThis.catalogueTeaser=scenarioCardTeaser;').runInNewContext(context);
const example='Deux dirigeants en fuite. Les enquêteurs recoupent les archives et les responsabilités judiciaires.';
const phoneTeaser=context.catalogueTeaser(example);
assert(phoneTeaser.endsWith('…')&&phoneTeaser.length<example.length,
 'Narrow iPhone preview must end in an explicit ellipsis and remain concise');
assert(!phoneTeaser.endsWith(' …'),'Ellipsis should attach naturally to the last word');
context.window.innerWidth=1200;
assert(context.catalogueTeaser(example).endsWith('…'),'Desktop preview still signals more detail');
assert.equal(context.catalogueTeaser('Déposition scellée.'),'Déposition scellée…',
 'Short previews also clearly lead into the dossier detail');
assert(mobileCss.includes('v163 — unified mobile dossiers'),'Final universal mobile styling missing');
assert(mobileCss.includes('min-height:202px!important'),'Cards must expand below a safe minimum');
assert(mobileCss.includes('height:auto!important'),'Never fix the scenario card height');
assert(mobileCss.includes('.scenario--compact.regime-scenario'),'Regime must share the universal layout');
assert(mobileCss.includes('.scenario-body>p.igr-card-excerpt'),'Multi-line previews must be clamped');
assert(mobileCss.includes('-webkit-line-clamp:3!important'),'Preview must be at most three lines');
assert(mobileCss.lastIndexOf('v163 — unified mobile dossiers')>
       mobileCss.lastIndexOf('height:190px!important'),
 'Unified overrides must be loaded after the old fixed-height rule');
assert(desktopCss.includes('v163: the widescreen two-column browser'),
 'Desktop must keep the same adaptive card proportions');
console.log('PASS v163 — classic and DLC previews render explicit … and fluid cards across web/native');

console.log('PASS v702 '+report.platform+' — CSS '+main.before.css+'→'+main.after.css+
 ' / JS '+main.before.js+'→'+main.after.js+
 ' / resource requests −'+main.requestReduction+
 ' / grouped raw '+rawBefore+'→'+rawAfter+' B'+
 ' / grouped Brotli '+brBefore+'→'+brAfter+' B');
