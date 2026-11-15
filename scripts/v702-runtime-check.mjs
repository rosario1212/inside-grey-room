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
console.log('PASS v702 '+report.platform+' — CSS '+main.before.css+'→'+main.after.css+
 ' / JS '+main.before.js+'→'+main.after.js+
 ' / resource requests −'+main.requestReduction+
 ' / grouped raw '+rawBefore+'→'+rawAfter+' B'+
 ' / grouped Brotli '+brBefore+'→'+brAfter+' B');
