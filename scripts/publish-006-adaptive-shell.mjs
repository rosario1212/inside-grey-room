// Publish a unique, cache-safe public entrypoint for Scenario 006 adaptive investigations.
// Keep the existing Omerta immutable release and legacy app assets intact.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const dest=path.resolve(process.argv[2]||'dist');
const tag='006-detailed-v284-20261112';
const appName='app-v11-'+tag+'.js';
const appSource=await readFile(path.join(dest,'app-v11.js'),'utf8');
assert(appSource.includes('investigation_006_adaptive'),'Scenario 006 adaptive UI missing');
assert(appSource.includes('optionalUsed006'),'Scenario 006 optional limit missing');
const questionnaire=await readFile(path.join(dest,'investigation-accuracy-v284.js'),'utf8');
assert(questionnaire.includes('igr_v284_006_submit_detail'),'Detailed 006 questionnaire bundle missing');
await writeFile(path.join(dest,appName),appSource,'utf8');

for(const page of ['index.html','en.html']){
 const file=path.join(dest,page);
 let html=await readFile(file,'utf8');
 if(page==='index.html'){
 assert(html.includes('omerta-v12-omerta-editorial-20261109.js'),'Must retain the certified Omerta entrypoint');
 assert(html.includes('investigation-accuracy-v284.js?v=006-detail-v284-20261112'),'006 accuracy client not present in entrypoint');
}
 if(page==='index.html')assert(/app-v11\.js\?v=[^"'<>\s]+/.test(html),'Current app script reference missing');
 html=html.replace(/app-v11\.js\?v=[^"'<>\s]+/,appName+'?v='+tag);
 await writeFile(file,html,'utf8');
 await writeFile(path.join(dest,page.replace('.html','-'+tag+'.txt')),html,'utf8');
}
const swFile=path.join(dest,'service-worker.js');
let sw=await readFile(swFile,'utf8');
const newCachePath='/'+appName+'?v='+tag;
if(!sw.includes(newCachePath)){
 assert(sw.includes('const SHELL=['),'Service worker precache list missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${newCachePath}',`);
}
const questionCachePath='/investigation-accuracy-v284.js?v=006-detail-v284-20261112';
if(!sw.includes(questionCachePath)){
 assert(sw.includes('const SHELL=['),'Service worker manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${questionCachePath}',`);
}
await writeFile(swFile,sw,'utf8');
console.log('Scenario 006 immutable app and homepage published:',tag);
