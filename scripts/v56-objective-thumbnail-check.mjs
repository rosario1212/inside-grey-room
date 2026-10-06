import {readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),fail=[];
const ok=(v,m)=>{if(!v)fail.push(m)},read=p=>readFile(path.join(root,p),'utf8');
for(const p of ['objective-dedupe-v56.js','scripts/apply-objective-dedupe-v56.mjs']){
 const r=spawnSync(process.execPath,['--check',path.join(root,p)],{encoding:'utf8'});
 ok(r.status===0,p+' syntax: '+(r.stderr||r.stdout));
}
const flow=await read('gameplay-flow-v13.js');
const judge=await read('judicial-runtime-v44.js');
const proc=await read('prosecutor-runtime-v47.js');
const omerta=await read('omerta-v12.js');
const op=await read('omerta-polish-v12.js');
const hp=await read('heritage-play-v13-7.js');
const meta=await read('heritage-v13-5.js');
const maitre=await read('heritage-maitre-v34.js');
const runtime=await read('objective-dedupe-v56.js');
ok(!flow.includes('OBJECTIF PRINCIPAL</b>'),'classic primary objective is still duplicated');
ok(flow.includes('v13-objective-secondary'),'distinct secondary objective must remain available');
ok(!judge.includes('OBJECTIF PRIVÉ DU JUGE'),'Judge private objective duplicate remains');
ok(judge.includes('CABINET DU JUGE'),'Judge operational helper missing');
ok(!proc.includes('DOSSIER DU PARQUET</small><p>'),'Prosecutor helper still repeats objectives');
ok(!omerta.includes('ps.omerta_objective?'),'OMERTA role overlay still conditionally renders a second objective');
ok(op.includes('CONSÉQUENCES FIXES')&&!op.includes('<span>OBJECTIF</span><b>'),'OMERTA fixed-facts card still repeats objective');
ok(runtime.includes("ROLE_IDS=['enqueteur','analyste','suspect','maitre','procureur','juge','inspecteur','expert','journaliste','temoin']"),'not all public roles are covered');
ok(runtime.includes('ensureSecondary'),'secondary objective safeguard missing');
ok(hp.includes('hplay-case-poster"><img src=')&&!hp.includes('hplay-case-poster hplay-case-lite'),'real CENDRES/KUROI thumbnails not restored');
for(const id of ['035','036','037','038','039','040','041','042','043','044'])ok(meta.includes("scenarioId:'"+id+"'"),'Heritage metadata missing '+id);
for(const asset of ['heritage-cendres-01-personne-n-existe.webp','heritage-cendres-02-04-17.webp','heritage-cendres-03-la-chambre.webp','heritage-cendres-04-cendres.webp','heritage-cendres-05-point-zero.webp','heritage-kuroi-01-l-oyabun.webp','heritage-kuroi-02-giri.webp','heritage-kuroi-03-les-mains-sales.webp','heritage-kuroi-04-la-dette.webp','heritage-kuroi-05-le-conseil.webp']){
 try{await stat(path.join(root,'assets',asset))}catch{fail.push('missing Heritage artwork '+asset)}
}
ok(maitre.includes('hplay-case-poster"><img src=')&&!maitre.includes('hplay-case-lite'),'MAITRE progression must keep real poster thumbnails');
try{
 await stat(path.join(target,'index.html'));
 const html=await readFile(path.join(target,'index.html'),'utf8');
 const sw=await readFile(path.join(target,'service-worker.js'),'utf8');
 ok(html.includes('objective-dedupe-v56.css?v=v56-objective-dedupe'),'dist missing v56 CSS');
 ok(html.includes('objective-dedupe-v56.js?v=v56-objective-dedupe'),'dist missing v56 runtime');
 ok(html.lastIndexOf('objective-dedupe-v56.js')>html.lastIndexOf('gameplay-polish-v53.js'),'v56 must load after gameplay layers');
 for(const asset of ['gameplay-flow-v13.js','judicial-runtime-v44.js','prosecutor-runtime-v47.js','omerta-v12.js','omerta-polish-v12.js'])ok(html.includes(asset+'?v=v56-objective-dedupe'),'dist did not cache-bust '+asset);
 ok(html.includes('heritage-play-v13-7.js?v=v56-objective-dedupe')||html.includes('heritage-play-v13-7.js?v=v57-heritage-audit'),'Heritage play asset is older than v56');
 ok(sw.includes("const CACHE='igr-v56-objective-dedupe';")||sw.includes("const CACHE='igr-v57-heritage-audit';"),'service worker cache is older than v56');
}catch{}
if(fail.length){console.error('\nObjective/thumbnail v56 check FAILED:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Objective/thumbnail v56 checks OK');