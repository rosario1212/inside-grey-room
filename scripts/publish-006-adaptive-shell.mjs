// Publish a unique, cache-safe public entrypoint for Scenario 006 adaptive investigations.
// Keep the existing Omerta immutable release and legacy app assets intact.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const dest=path.resolve(process.argv[2]||'dist');
const tag='terror-live-v694-20261115';
const crisisCssPath='/terror-crisis-v696.css?v=terror-carbon-v697-20261115';
const crisisHtmlStyle=/terror-crisis-v696\.css\?v=[^"'<>\s]+/g;
const appName='app-v11-'+tag+'.js';
const appSource=await readFile(path.join(dest,'app-v11.js'),'utf8');
assert(appSource.includes('investigation_006_adaptive'),'Scenario 006 adaptive UI missing');
assert(appSource.includes('igr_v650_case_quiz_get') && appSource.includes('igr_v650_case_quiz_submit'),
  'v650 sealed factual debrief must survive all build passes');
assert(appSource.includes("tenCaseV361?'igr_v361_010_investigate'"),
  '010 adaptive investigations must survive all build passes');
assert(appSource.includes("investigate017Choice('${h(choice.id)}')"),
  '017 direct evidence-choice buttons must survive all build passes');
assert(appSource.includes("['010','012','013','014','015','016','017'].includes(sid)"),
  'v650 debrief must not duplicate the existing 007–009 specialist forms');
assert(appSource.includes('optionalUsed006'),'Scenario 006 optional limit missing');
assert(appSource.includes('igr_v650_018_hypothesis_submit') && appSource.includes('thisCycle.length>=1'), '018 adaptive one-piece client missing');
assert(appSource.includes('igr_v665_019_hypothesis_submit') && appSource.includes('igr_v665_019_investigate_choice'), '019 three-killer adaptive UI missing');
assert(appSource.includes('igr_v675_020_hypothesis_submit') && appSource.includes('igr_v675_020_investigate_choice'), '020 three-origin adaptive UI missing');
assert(appSource.includes('authorized_stage_effect'), '020 stage accident verdict option missing');
const terrorCity=await readFile(path.join(dest,'terror-live-v681.js'),'utf8');
assert(terrorCity.includes('igr_v681_terror_set_city') && terrorCity.includes('igr_v681_terror_submit_quiz'), 'terror live city + sealed quiz missing');
const terrorFront=await readFile(path.join(dest,'terror-front-v682.js'),'utf8');
assert(terrorFront.includes("RÉPUBLIQUE D’ALMIZIA") && terrorFront.includes('terror_v683_sector_recovered') && terrorFront.includes('base militaire de Ferra'), 'FDR country/base/reconquest UI missing');
const terrorCommand=await readFile(path.join(dest,'terror-command-v688.js'),'utf8');
assert(terrorCommand.includes('terrorV693Join') && terrorCommand.includes('terrorV693Visit'),'Terror officer hearing participation must be bundled');
assert(terrorCommand.includes('igr_v688_terror_choose_operation') && terrorCommand.includes('terror-v688-capture'), 'Terror commander and captivity presentation missing');
const terrorV694=await readFile(path.join(dest,'terror-command-v694.js'),'utf8');
assert(terrorV694.includes('igr_v694_terror_confirm')&&terrorV694.includes('terrorV694Join'),'v694 gameplay UI missing');
const crisisCss=await readFile(path.join(dest,'terror-crisis-v696.css'),'utf8');
assert(crisisCss.includes('data-igr-lobby-theme="terror"') && crisisCss.includes('terror-v681-city-lobby') && crisisCss.includes('igr-duration-tab-v35'), 'TERREUR premium crisis UI missing');
let terrorHtml=await readFile(path.join(dest,'index.html'),'utf8');
assert(terrorHtml.includes('terror-crisis-v696.css?v=v87-canonical-narrative'), 'Expect finalized premium CSS before carbon cache-bust');
terrorHtml=terrorHtml.replace(crisisHtmlStyle,'terror-crisis-v696.css?v=terror-carbon-v697-20261115');
await writeFile(path.join(dest,'index.html'),terrorHtml,'utf8');
assert(terrorHtml.includes('terror-crisis-v696.css'), 'TERREUR crisis CSS missing from public entrypoint');
assert(terrorHtml.includes('terror-live-v681.js') && terrorHtml.includes('terror-live-v681.css'), 'terror shared city widget not included in published entrypoint');
assert(terrorHtml.includes('terror-front-v682.js') && terrorHtml.includes('terror-front-v682.css'),'FDR public story and siege assets missing');
assert(terrorHtml.includes('terror-command-v688.js') && terrorHtml.includes('terror-command-v688.css'),'Terror military choice assets missing in production entrypoint');
assert(terrorHtml.includes('terror-command-v694.js')&&terrorHtml.includes('terror-command-v694.css'),'v694 immediate command UI missing from release');
const questionnaire=await readFile(path.join(dest,'investigation-accuracy-v284.js'),'utf8');
const detailedFive=await readFile(path.join(dest,'investigation-deep-v286.js'),'utf8');
const detailedSeven=await readFile(path.join(dest,'investigation-007-v289.js'),'utf8');
const detailedEight=await readFile(path.join(dest,'investigation-008-v310.js'),'utf8');
const detailedNine=await readFile(path.join(dest,'investigation-009-v340.js'),'utf8');
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
 assert(html.includes('investigation-deep-v286.js?v=nine-cases-v347-20261113'),'Five-case questionnaire not present in entrypoint');
}
 if(page==='index.html')assert(/app-v11\.js\?v=[^"'<>\s]+/.test(html),'Current app script reference missing');
 html=html.replace(/app-v11\.js\?v=[^"'<>\s]+/,appName+'?v='+tag);
 await writeFile(file,html,'utf8');
 await writeFile(path.join(dest,page.replace('.html','-'+tag+'.txt')),html,'utf8');
 // Stable internal shell alias: the Worker never needs to guess a build tag.
 await writeFile(path.join(dest,page.replace('.html','-latest-release.txt')),html,'utf8');
}
const swFile=path.join(dest,'service-worker.js');
let sw=await readFile(swFile,'utf8');
sw=sw.replace(/\/terror-crisis-v696\.css\?v=[^"'\s,]+/g,crisisCssPath);
const newCachePath='/'+appName+'?v='+tag;
if(!sw.includes(crisisCssPath)){
 assert(sw.includes('const SHELL=['),'PWA manifest missing for TERREUR visuals');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${crisisCssPath}',`);
}
if(!sw.includes(newCachePath)){
 assert(sw.includes('const SHELL=['),'Service worker precache list missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${newCachePath}',`);
}
const questionCachePath='/investigation-accuracy-v284.js?v=006-detail-v284-20261112';
if(!sw.includes(questionCachePath)){
 assert(sw.includes('const SHELL=['),'Service worker manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${questionCachePath}',`);
}
const nineCachePath='/investigation-009-v340.js?v=nine-cases-v347-20261113';
if(!sw.includes(nineCachePath)){
 assert(sw.includes('const SHELL=['),'PWA shell missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${nineCachePath}',`);
}
const eightCachePath='/investigation-008-v310.js?v=nine-cases-v347-20261113';
if(!sw.includes(eightCachePath)){
 assert(sw.includes('const SHELL=['),'PWA shell missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${eightCachePath}',`);
}
const sevenCachePath='/investigation-007-v289.js?v=nine-cases-v347-20261113';
if(!sw.includes(sevenCachePath)){
 assert(sw.includes('const SHELL=['),'PWA manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${sevenCachePath}',`);
}
const fiveCachePath='/investigation-deep-v286.js?v=nine-cases-v347-20261113';
if(!sw.includes(fiveCachePath)){
 assert(sw.includes('const SHELL=['),'PWA manifest missing');
 sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${fiveCachePath}',`);
}
for(const asset of ['/terror-command-v694.js?v=terror-live-v694-20261115','/terror-command-v694.css?v=terror-live-v694-20261115','/terror-live-v681.js?v=terror-capital-v691-20261115','/terror-live-v681.css?v=terror-city-v681-20261114','/terror-front-v682.js?v=terror-officer-v693-20261115','/terror-front-v682.css?v=terror-capital-v691-20261115','/terror-command-v688.js?v=terror-officer-v693-20261115','/terror-command-v688.css?v=terror-officer-v693-20261115']){
 if(!sw.includes(asset)){
  assert(sw.includes('const SHELL=['),'PWA shell missing');
  sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${asset}',`);
 }
}
sw=sw.replace(/const CACHE='[^']+'/,"const CACHE='igr-santoro-display-audit-20261108-"+tag+"'");
assert(sw.includes("const CACHE='igr-santoro-display-audit-20261108-"+tag+"'"),'PWA must preserve immutable app release cache while versioning the CSS URL');
await writeFile(swFile,sw,'utf8');
console.log('Scenario 006 immutable app and homepage published:',tag);
