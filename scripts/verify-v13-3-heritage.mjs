import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

const root=process.cwd(),ok=[],fail=[];
const check=(cond,msg)=>(cond?ok:fail).push(msg);
const text=f=>fs.readFileSync(path.join(root,f),'utf8');
const required=['heritage-v13-3.js','heritage-v13-3.css','startup-stability-v13-3.js','startup-stability-v13-3.css','assets/heritage-cendres-cover.webp','assets/heritage-kuroi-cover.webp','scripts/install-v13-3-heritage.mjs'];
for(const f of required)check(fs.existsSync(path.join(root,f)),`présent: ${f}`);
for(const f of ['heritage-v13-3.js','startup-stability-v13-3.js','scripts/install-v13-3-heritage.mjs']){
  if(fs.existsSync(path.join(root,f))){const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check(r.status===0,`syntaxe JS: ${f}`);if(r.status!==0)console.error(r.stderr)}
}
if(fs.existsSync(path.join(root,'heritage-v13-3.js'))){
  const s=text('heritage-v13-3.js');
  for(const title of ['PERSONNE N’EXISTE','04:17','LA CHAMBRE','CENDRES','POINT ZÉRO','L’OYABUN','GIRI','LES MAINS SALES','LA DETTE','LE CONSEIL'])check(s.includes(title),`titre Héritage: ${title}`);
  check(s.includes("heritage:'Héritage de l’information'"),'CENDRES = héritage information');
  check(s.includes("heritage:'Héritage des relations'"),'KUROI = héritage relations');
  check(s.includes('upsertCendresNode'),'API réseau CERBÈRES');
  check(s.includes('addDebt'),'API registre des dettes');
  check(s.includes("create.insertAdjacentElement('afterend',card)"),'HÉRITAGE placé sous Créer une partie');
  check(!s.includes('SCENARIOS.push'),'aucune injection dans les scénarios 001–034');
}
if(fs.existsSync(path.join(root,'startup-stability-v13-3.js'))){
  const s=text('startup-stability-v13-3.js');
  check(s.includes('wakeInFlight'),'réveil audio sérialisé');
  check(s.includes('completeIntroEntry'),'reprise audio après entrée');
  check(s.includes("document.addEventListener('pointerdown'"),'geste iOS capturé');
  check(!s.includes('setInterval('),'aucun nouvel intervalle audio');
}
if(fs.existsSync(path.join(root,'startup-stability-v13-3.css'))){
  const s=text('startup-stability-v13-3.css');
  check(s.includes('2.6svh'),'bouton ENTRER abaissé');
  check(s.includes('- 2.7svh'),'art de porte remonté');
}
for(const f of ['assets/heritage-cendres-cover.webp','assets/heritage-kuroi-cover.webp']){
  if(fs.existsSync(path.join(root,f)))check(fs.statSync(path.join(root,f)).size<300000,`asset léger <300 KB: ${f}`);
}

// Installer idempotence on a minimal fixture matching v13.2 anchors.
try{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'igr133-'));
  for(const f of required){if(fs.existsSync(path.join(root,f))){const dst=path.join(tmp,f);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(root,f),dst)}}
  fs.writeFileSync(path.join(tmp,'index.html'),`<html><head><link rel="stylesheet" href="lobby-ui-fix-v13.css?v=v13.2-lobby-fix"></head><body><script src="lobby-ui-fix-v13.js?v=v13.2-lobby-fix"></script></body></html>`);
  fs.writeFileSync(path.join(tmp,'en.html'),`<html><head></head><body></body></html>`);
  fs.writeFileSync(path.join(tmp,'service-worker.js'),`const CACHE='igr-v13-2-final-lobby-fix';\nconst SHELL=['/index.html'];`);
  const run=()=>spawnSync(process.execPath,['scripts/install-v13-3-heritage.mjs'],{cwd:tmp,encoding:'utf8'});
  const r1=run(),r2=run();check(r1.status===0&&r2.status===0,'installateur exécutable deux fois');
  const idx=fs.readFileSync(path.join(tmp,'index.html'),'utf8'),sw=fs.readFileSync(path.join(tmp,'service-worker.js'),'utf8');
  check((idx.match(/heritage-v13-3\.js/g)||[]).length===1,'index: JS sans duplication');
  check((idx.match(/heritage-v13-3\.css/g)||[]).length===1,'index: CSS sans duplication');
  check((sw.match(/heritage-v13-3\.js/g)||[]).length===1,'SW: entrée sans duplication');
  fs.rmSync(tmp,{recursive:true,force:true});
}catch(err){fail.push(`fixture installateur: ${err.message}`)}

console.log(ok.map(x=>'✓ '+x).join('\n'));
if(fail.length){console.error('\n'+fail.map(x=>'✗ '+x).join('\n'));process.exit(1)}
console.log(`\n${ok.length} contrôles réussis.`);
