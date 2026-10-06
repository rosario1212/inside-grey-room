import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)},read=p=>readFile(path.join(root,p),'utf8');
const css=await read('heritage-audit-v57.css');
const play=await read('heritage-play-v13-7.js');
const legacy=await read('heritage-v13-5.js');
const modes=await read('play-modes-v13-8.js');
for(const token of [
  '.maitre-page .hplay-campaign-hero,',
  'height:210px!important',
  'grid-template-columns:58px minmax(0,1fr) 18px!important',
  'width:58px!important;height:86px!important',
  'grid-template-columns:minmax(220px,340px) minmax(0,1fr)!important',
  'height:220px!important',
  '.maitre-page.hnet .hnet-lobby',
  'background:#f8f4ec!important'
])ok(css.includes(token),'MAÎTRE v57 layout/color token missing: '+token);
ok(css.includes('.hplay-campaign-definition'),'CENDRES campaign-definition styling missing');
for(const bad of ['VESPER','ORPHÉE','CERBÈRES','ARKEN'])for(const [name,src] of [['heritage-play-v13-7.js',play],['heritage-v13-5.js',legacy],['play-modes-v13-8.js',modes]])ok(!src.includes(bad),name+' still exposes fictional label '+bad);
for(const token of [
  'CONTRE-ESPIONNAGE / SERVICE NATIONAL',
  'service de renseignement',
  'IDENTITÉ DE COUVERTURE PARTAGÉE',
  'RESPONSABLE DES HABILITATIONS',
  'ANCIENNE GALERIE HYDROÉLECTRIQUE'
])ok(play.includes(token),'Concrete CENDRES copy missing: '+token);
ok(play.includes('hplay-campaign-definition'),'CENDRES campaign frame is not rendered');
ok(legacy.includes("mechanic:'CARTE DE CONTRE-INGÉRENCE'"),'legacy CENDRES mechanic remains fictional');
ok(modes.includes("title:'RESPONSABLE DES HABILITATIONS'"),'online CENDRES result copy remains stale');
try{
  await stat(path.join(target,'index.html'));
  const html=await readFile(path.join(target,'index.html'),'utf8'),sw=await readFile(path.join(target,'service-worker.js'),'utf8');
  ok(html.includes('heritage-audit-v57.css?v=v57-heritage-audit'),'dist missing v57 Heritage CSS');
  for(const asset of ['heritage-v13-5.js','heritage-play-v13-7.js','play-modes-v13-8.js'])ok(html.includes(asset+'?v=v57-heritage-audit'),'dist did not cache-bust '+asset);
  ok(sw.includes("const CACHE='igr-v57-heritage-audit';"),'service worker cache not bumped to v57');
  ok(sw.includes('/heritage-audit-v57.css?v=v57-heritage-audit'),'service worker missing v57 CSS');
  for(const asset of ['heritage-v13-5.js','heritage-play-v13-7.js','play-modes-v13-8.js'])ok(sw.includes('/'+asset+'?v=v57-heritage-audit'),'service worker did not cache-bust '+asset);
}catch{}
if(fail.length){console.error('\nHÉRITAGE v57 audit check FAILED:\n- '+fail.join('\n- '));process.exit(1)}
console.log('HÉRITAGE v57 audit checks OK');