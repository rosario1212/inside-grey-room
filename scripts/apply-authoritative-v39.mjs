import { readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v39-authoritative-ui';
const CACHE='igr-v39-authoritative-ui';
const runtimeSource=path.join(root,'authoritative-runtime-v39.js');
const languageTarget=path.join(target,'language-v12.js');
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v39 target missing: ${target}`);
if(!(await exists(runtimeSource)))throw new Error('authoritative-runtime-v39.js missing');
const parsed=spawnSync(process.execPath,['--check',runtimeSource],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`authoritative-runtime-v39.js syntax error: ${parsed.stderr||parsed.stdout}`);
const patch=await readFile(runtimeSource,'utf8');

if(!(await exists(languageTarget)))throw new Error(`${target}: language-v12.js missing`);
let language=await readFile(languageTarget,'utf8');
if(!language.includes('IGR_AUTHORITATIVE_V39'))language=`${language.trimEnd()}\n\n${patch.trim()}\n`;
await writeFile(languageTarget,language,'utf8');

// Keep the established app-v11.js URL but make it request a new SW script URL.
// This lets an older installed shell discover v39 without needing a new HTML tag.
if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  // v39 is carried by the already-established language-v12.js path. Remove
  // additive v37/v38 overlays so there is one authoritative gameplay owner.
  html=html.replace(/\s*<script[^>]+src=["']gameplay-state-fix-v3[78]\.js[^"']*["'][^>]*><\/script>\s*/g,'\n');
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  await writeFile(swTarget,sw,'utf8');
}

// Validate the exact deployed paths, not only the source patch.
const finalLanguage=await readFile(languageTarget,'utf8');
if(!finalLanguage.includes('IGR_AUTHORITATIVE_V39'))throw new Error('language-v12.js did not receive v39');
if(!finalLanguage.includes("room()?.phase==='event_select'"))throw new Error('v39 event-select owner missing');
if(!finalLanguage.includes("pub==='enqueteur'"))throw new Error('v39 investigator-card repair missing');
if(!finalLanguage.includes('objective_main'))throw new Error('v39 suspect objective owner missing');
if(!finalLanguage.includes('igrTopSettings'))throw new Error('v39 in-game settings repair missing');
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('app-v11.js service-worker registration is stale');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker cache namespace is stale');
}
for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  if(/gameplay-state-fix-v3[78]\.js/.test(html))throw new Error(`${name}: legacy gameplay overlay still loaded`);
}
console.log(`Inside Grey Room ${VERSION}: authoritative UI owner applied to ${process.argv[2]||'dist'}`);
