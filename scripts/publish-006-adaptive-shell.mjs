// Publish a unique, cache-safe public entrypoint for Scenario 006 adaptive investigations.
// Keep the existing Omerta immutable release and legacy app assets intact.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const dest=path.resolve(process.argv[2]||'dist');
const tag='nine-cases-v362-20261113';
const appName='app-v11-'+tag+'.js';
const appSource=await readFile(path.join(dest,'app-v11.js'),'utf8');
assert(appSource.includes('investigation_006_adaptive'),'Scenario 006 adaptive UI missing');
assert(appSource.includes('optionalUsed006'),'Scenario 006 optional limit missing');
const questionnaire=await readFile(path.join(dest,'investigation-accuracy-v284.js'),'utf8');
const detailedFive=await readFile(path.join(dest,'investigation-deep-v286.js'),'utf8');
const detailedSeven=await readFile(path.join(dest,'investigation-007-v289.js'),'utf8');
const detailedEight=await readFile(path.join(dest,'investigation-008-v310.js'),'utf8');
const detailedNine=await readFile(path.join(dest,'investigation-009-v340.js'),'utf8');
const detailedTen=await readFile(path.join(dest,'investigation-010-v361.js'),'utf8');
assert(detailedTen.includes('igr_v361_010_submit_detail'),'010 sealed questionnaire missing');
assert(appSource.includes('investigation_010_adaptive'),'010 adaptive UI missing');
assert(detailedNine.includes('igr_v340_009_submit_detail'),'009 sealed questionnaire missing');
assert(appSource.includes('investigation_009_adaptive'),'009 adaptive UI missing');
assert(detailedEight.includes('igr_v310_008_submit_detail'),'008 sealed questionnaire missing');
assert(appSource.includes('investigation_008_adaptive'),'008 adaptive UI missing');
assert(detailedSeven.includes('igr_v289_007_submit_detail'),'007 adaptive sealed questionnaire missing');
assert(appSource.includes('investigation_007_adaptive'),'007 adaptive UI missing');
assert(detailedFive.includes('igr_v286_submit_detail'),'Five-case detailed scoring UI missing');
assert(appSource.includes('investigation_deep_v286'),'Five-case optional investigation interface missing');
assert(questionnaire.includes('igr_v284_006_submit_detail'),'Detailed 006 questionnaire bundle missing');
await writeFile(path.join(dest,appName),appSource,'utf8');

for(const page of ['index.html','en.html']){
 const file=path.join(dest,page);
 let html=await readFile(file,'utf8');
 if(page==='index.html'){
 assert(html.includes('omerta-v12-omerta-editorial-20261109.js'),'Must retain the certified Omerta entrypoint');
 assert(html.includes('investigation-accuracy-v284.js?v=006-detail-v284-20261112'),'006 accuracy client not present in entrypoint');
 assert(html.includes('investigation-deep-v286.js?v=nine-cases-v362-20261113'),'Five-case questionnaire not present in entrypoint');
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
const tenCachePath='/investigation-010-v361.js?v=nine-cases-v362-20261113';
if(!sw.includes(tenCachePath)){
 assert(sw.includes('const SHELL=['),'PWA shell missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${tenCachePath}',`);
}
const nineCachePath='/investigation-009-v340.js?v=nine-cases-v362-20261113';
if(!sw.includes(nineCachePath)){
 assert(sw.includes('const SHELL=['),'PWA shell missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${nineCachePath}',`);
}
const eightCachePath='/investigation-008-v310.js?v=nine-cases-v362-20261113';
if(!sw.includes(eightCachePath)){
 assert(sw.includes('const SHELL=['),'PWA shell missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${eightCachePath}',`);
}
const sevenCachePath='/investigation-007-v289.js?v=nine-cases-v362-20261113';
if(!sw.includes(sevenCachePath)){
 assert(sw.includes('const SHELL=['),'PWA manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${sevenCachePath}',`);
}
const fiveCachePath='/investigation-deep-v286.js?v=nine-cases-v362-20261113';
if(!sw.includes(fiveCachePath)){
 assert(sw.includes('const SHELL=['),'PWA manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${fiveCachePath}',`);
}
sw=sw.replace("const CACHE='igr-santoro-display-audit-20261108'", "const CACHE='igr-santoro-display-audit-20261108-nine-cases-v362-20261113'");
assert(sw.includes("const CACHE='igr-santoro-display-audit-20261108-nine-cases-v362-20261113'"),'PWA cache version did not advance');
await writeFile(swFile,sw,'utf8');
console.log('Scenario 006 immutable app and homepage published:',tag);
