import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v50-natural-role-gameplay';
const CACHE='igr-v50-natural-role-gameplay';
const runtimeName='natural-role-gameplay-v50.js';
const source=path.join(root,runtimeName);
const dest=path.join(target,runtimeName);
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v50 target missing: ${target}`);
if(!(await exists(source)))throw new Error(`${runtimeName} missing`);
const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`${runtimeName} syntax error: ${parsed.stderr||parsed.stdout}`);
await copyFile(source,dest);

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']natural-role-gameplay-v50\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(/^\s*['"]\/natural-role-gameplay-v50\.js\?v=[^'"]+['"],?\s*$/gmi,'');
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtimeName}?v=${VERSION}',`);
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v49=html.lastIndexOf('public-broadcasts-v49.js');
  const v50=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);
  if(v49<0||v50<0||v49>=v50)throw new Error(`${name}: expected v50 after v49 public broadcast runtime`);
  const after=html.slice(v50+`${runtimeName}?v=${VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v50 runtime is not the last external script`);
}

if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('service worker registration is stale after v50');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('v50 cache namespace missing');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`))throw new Error('v50 runtime missing from service-worker precache');
}
console.log(`Inside Grey Room ${VERSION}: natural role runtime applied to ${process.argv[2]||'dist'}`);
