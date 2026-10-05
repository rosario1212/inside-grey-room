import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v48-institution-3min';
const CACHE='igr-v48-institution-3min';
const judgeName='judicial-runtime-v44.js';
const prosecutorName='prosecutor-runtime-v47.js';
const judgeTarget=path.join(target,judgeName);
const prosecutorTarget=path.join(target,prosecutorName);
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const replaceRequired=(text,from,to,label)=>{
  const next=text.replace(from,to);
  if(next===text)throw new Error(`v48 patch target missing: ${label}`);
  return next;
};

for(const f of [judgeTarget,prosecutorTarget])if(!(await exists(f)))throw new Error(`v48 runtime missing: ${f}`);

let judge=await readFile(judgeTarget,'utf8');
judge=replaceRequired(judge,'AU CABINET DU JUGE · 2 MIN MAX','AU CABINET DU JUGE · 3 MIN MAX','judge active duration');
judge=replaceRequired(judge,'Convoquer · 2 min','Convoquer · 3 min','judge summon button');
await writeFile(judgeTarget,judge,'utf8');

let prosecutor=await readFile(prosecutorTarget,'utf8');
prosecutor=prosecutor.replace(/FREE-only 2-minute interviews/g,'FREE-only 3-minute interviews');
prosecutor=replaceRequired(prosecutor,'Entretien du Parquet · 2 min','Entretien du Parquet · 3 min','prosecutor pending duration');
prosecutor=replaceRequired(prosecutor,'pendant les 2 minutes.','pendant les 3 minutes.','lawyer accompaniment duration');
prosecutor=replaceRequired(prosecutor,'ENTRETIEN DU PARQUET · 2 MIN MAX','ENTRETIEN DU PARQUET · 3 MIN MAX','prosecutor active duration');
prosecutor=replaceRequired(prosecutor,'Convoquer · 2 min','Convoquer · 3 min','prosecutor summon button');
prosecutor=replaceRequired(
  prosecutor,
  'Les anciennes demandes ciblées de 3 minutes sont remplacées par les convocations de 2 minutes.',
  'Les anciennes demandes ciblées accepter/refuser sont remplacées par les convocations de 3 minutes.',
  'legacy prosecutor panel copy'
);
await writeFile(prosecutorTarget,prosecutor,'utf8');

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(new RegExp(`${judgeName.replace(/\./g,'\\.')}\\?v=[A-Za-z0-9._-]+`,'g'),`${judgeName}?v=${VERSION}`);
  html=html.replace(new RegExp(`${prosecutorName.replace(/\./g,'\\.')}\\?v=[A-Za-z0-9._-]+`,'g'),`${prosecutorName}?v=${VERSION}`);
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(new RegExp(`/${judgeName.replace(/\./g,'\\.')}\\?v=[A-Za-z0-9._-]+`,'g'),`/${judgeName}?v=${VERSION}`);
  sw=sw.replace(new RegExp(`/${prosecutorName.replace(/\./g,'\\.')}\\?v=[A-Za-z0-9._-]+`,'g'),`/${prosecutorName}?v=${VERSION}`);
  await writeFile(swTarget,sw,'utf8');
}

console.log(`Inside Grey Room ${VERSION}: Judge + Prosecutor interviews set to 3 minutes in ${process.argv[2]||'dist'}`);
