import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v41-authoritative-ui';
const CACHE='igr-v41-authoritative-ui';
const runtimeName='authoritative-runtime-v41.js';
const runtimeSource=path.join(root,runtimeName);
const swTarget=path.join(target,'service-worker.js');
const appTarget=path.join(target,'app-v11.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v41 target missing: ${target}`);
if(!(await exists(runtimeSource)))throw new Error(`${runtimeName} missing`);
const parsed=spawnSync(process.execPath,['--check',runtimeSource],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`${runtimeName} syntax error: ${parsed.stderr||parsed.stdout}`);
await copyFile(runtimeSource,path.join(target,runtimeName));

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  // Remove historical live-game overlays. v41 is the only final owner.
  html=html.replace(/\s*<script[^>]+src=["'](?:gameplay-state-fix-v3[78]|authoritative-runtime-v(?:39|40|41))\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

// Force installed PWAs to discover a new service worker URL.
if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  const runtimeEntry=`  '/${runtimeName}?v=${VERSION}',`;
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`)){
    sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n${runtimeEntry}`);
  }
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  if(!html.includes(`${runtimeName}?v=${VERSION}`))throw new Error(`${name}: v41 runtime missing`);
  if(/gameplay-state-fix-v3[78]\.js|authoritative-runtime-v(?:39|40)\.js/i.test(html))throw new Error(`${name}: legacy live-game overlay still loaded`);
  const pos=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);
  const after=html.slice(pos);
  if(/<script[^>]+src=/i.test(after.replace(new RegExp(`<script[^>]+src=["']${runtimeName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[^>]*><\\/script>`,'i'),'')))throw new Error(`${name}: v41 is not the last external script`);
}
const finalRuntime=await readFile(path.join(target,runtimeName),'utf8');
for(const marker of ['IGR_AUTHORITATIVE_V41','objective_main',"room()?.phase==='event_select'",'igrTopSettings',"typeof STATE!=='undefined'"]){
  if(!finalRuntime.includes(marker))throw new Error(`v41 runtime missing marker: ${marker}`);
}
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('app-v11.js service-worker registration is stale');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker cache namespace is stale');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`))throw new Error('service-worker does not precache v41 runtime');
}
console.log(`Inside Grey Room ${VERSION}: consolidated authoritative UI applied to ${process.argv[2]||'dist'}`);
