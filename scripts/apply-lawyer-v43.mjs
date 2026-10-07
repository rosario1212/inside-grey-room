import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v43-lawyer-one-client';
const READING_VERSION='v43.1-lawyer-reading';
const V44_VERSION='v44-judge-lawyer';
const CACHE='igr-v44-judge-lawyer';
const runtimeName='lawyer-runtime-v43.js';
const readingName='lawyer-reading-v43-1.js';
const v44Name='judicial-runtime-v44.js';
const source=path.join(root,runtimeName);
const readingSource=path.join(root,readingName);
const v44Source=path.join(root,v44Name);
const dest=path.join(target,runtimeName);
const readingDest=path.join(target,readingName);
const v44Dest=path.join(target,v44Name);
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const replaceRequired=(text,from,to,label)=>{const next=text.replace(from,to);if(next===text)throw new Error(`v43 patch target missing: ${label}`);return next};

if(!(await exists(target)))throw new Error(`v43 target missing: ${target}`);
for(const f of [source,readingSource,v44Source])if(!(await exists(f)))throw new Error(`${path.basename(f)} missing`);
for(const f of [source,readingSource,v44Source]){
  const parsed=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if(parsed.status!==0)throw new Error(`${path.basename(f)} syntax error: ${parsed.stderr||parsed.stdout}`);
}
await copyFile(source,dest);
await copyFile(readingSource,readingDest);
await copyFile(v44Source,v44Dest);

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  if(!app.includes("unique client officiel"))app=replaceRequired(
    app,
    "maitre:{label:'Maître',win:'Protège la responsabilité exacte de tes clients.',body:'Tu défends un ou plusieurs suspects compatibles. Tu n’inventes jamais de faits et tu partages le temps de défense finale de tes clients.'}",
    "maitre:{label:'Maître',win:'Protège la responsabilité exacte de ton unique client officiel.',body:'Les suspects peuvent te solliciter. Après un entretien de 1 minute maximum, tu peux accepter un seul client officiel. Les autres suspects non représentés disposent chacun d’une unique consultation pendant leur propre interrogatoire.'}",
    'lawyer role info'
  );
  if(!app.includes("Avocat : un seul client officiel"))app=replaceRequired(
    app,
    "'Avocat : peut défendre plusieurs clients compatibles ; obligatoire dans le dossier 019.'",
    "'Avocat : un seul client officiel par avocat. Chaque suspect non représenté dispose d’une seule consultation de 1 minute pendant son propre interrogatoire.'",
    'manual lawyer rule'
  );
  app=replaceRequired(
    app,
    "<span>5 minutes · l’Avocat éventuel partage ce temps.</span>",
    "<span>5 minutes · l’Avocat partage ce temps uniquement avec son client officiel.</span>",
    'final defence lawyer copy'
  );
  app=app.replace(
    "{id:'avocat_double_defense',glyph:'⚖',label:'Défense Multiple',desc:'Avocat : protéger exactement au moins deux clients dans la même partie.',ok:p=>hasAchievement(p,'avocat_double_defense')}",
    "{id:'avocat_double_defense',glyph:'⚖',label:'Défense Multiple',desc:'Badge historique de l’ancienne règle multi-clients.',hidden:true,ok:p=>hasAchievement(p,'avocat_double_defense')}"
  );
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${V44_VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']lawyer-runtime-v43\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+src=["']lawyer-reading-v43-1\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+src=["']judicial-runtime-v44\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n  <script src="${readingName}?v=${READING_VERSION}"></script>\n  <script src="${v44Name}?v=${V44_VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  for(const name of [runtimeName,readingName,v44Name])sw=sw.replace(new RegExp(`^\\s*['\"]/${name.replace(/\./g,'\\.')}\\?v=[^'\"]+['\"],?\\s*$`,'gmi'),'');
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtimeName}?v=${VERSION}',\n  '/${readingName}?v=${READING_VERSION}',\n  '/${v44Name}?v=${V44_VERSION}',`);
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v42=html.lastIndexOf('investigation-audit-v42-1.js');
  const v43=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);
  const v431=html.lastIndexOf(`${readingName}?v=${READING_VERSION}`);
  const v44=html.lastIndexOf(`${v44Name}?v=${V44_VERSION}`);
  if(v42<0||v43<0||v431<0||v44<0||!(v42<v43&&v43<v431&&v431<v44))throw new Error(`${name}: bad v42/v43/v43.1/v44 runtime order`);
  const after=html.slice(v44+`${v44Name}?v=${V44_VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v44 judicial runtime is not the last external script`);
}

const finalRuntime=await readFile(dest,'utf8');
for(const marker of ['v43-lawyer-one-client','igr_v43_request_lawyer','igr_v43_accept_lawyer','CONSULTATIONS OFFICIEUSES','Rencontrer · 1 min','AVANT LES CONCLUSIONS PROVISOIRES'])if(!finalRuntime.includes(marker))throw new Error(`v43 runtime missing marker: ${marker}`);
const finalReading=await readFile(readingDest,'utf8');
for(const marker of ['v43.1-lawyer-reading','PENDANT LA LECTURE DES CARTES','renderLawyerTab','igr43-reading-desk'])if(!finalReading.includes(marker))throw new Error(`v43.1 reading bridge missing marker: ${marker}`);
const finalV44=await readFile(v44Dest,'utf8');
for(const marker of ['v44-judge-lawyer','3 protections','igr_v44_summon','igr_v44_request_lawyer_consultation','DÉLIBÉRATION OBLIGATOIRE','judge_integrity_vote'])if(!finalV44.includes(marker))throw new Error(`v44 runtime missing marker: ${marker}`);
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes('unique client officiel'))throw new Error('app lawyer role copy is stale');
  if(app.includes('Avocat : peut défendre plusieurs clients compatibles'))throw new Error('legacy multi-client manual rule still present');
  if(!app.includes(`/service-worker.js?v=${V44_VERSION}`))throw new Error('service worker registration is stale after v44');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service worker cache namespace is stale after v44');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`)||!sw.includes(`/${readingName}?v=${READING_VERSION}`)||!sw.includes(`/${v44Name}?v=${V44_VERSION}`))throw new Error('service worker does not precache lawyer/judicial runtimes');
}
console.log(`Inside Grey Room ${V44_VERSION}: lawyer + judge recalibration applied to ${process.argv[2]||'dist'}`);
