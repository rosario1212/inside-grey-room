import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v47-prosecutor';
const CACHE='igr-v47-prosecutor';
const runtimeName='prosecutor-runtime-v47.js';
const source=path.join(root,runtimeName);
const dest=path.join(target,runtimeName);
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v47 target missing: ${target}`);
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
  html=html.replace(/\s*<script[^>]+src=["']prosecutor-runtime-v47\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(new RegExp(`^\\s*['\"]/${runtimeName.replace(/\./g,'\\.')}\\?v=[^'\"]+['\"],?\\s*$`,'gmi'),'');
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtimeName}?v=${VERSION}',`);
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v44=html.lastIndexOf('judicial-runtime-v44.js');
  const v45=html.lastIndexOf('lawyer-dismissal-v45.js');
  const v46=html.lastIndexOf('timer-runtime-v46.js');
  const v47=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);
  if(v44<0||v45<0||v46<0||v47<0||!(v44<v45&&v45<v46&&v46<v47))throw new Error(`${name}: expected v44 < v45 < v46 < v47 runtime order`);
  const after=html.slice(v47+`${runtimeName}?v=${VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v47 prosecutor runtime is not the last external script`);
}

if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('service worker registration is stale after v47');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service worker cache namespace is stale after v47');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`))throw new Error('service worker does not precache v47 prosecutor runtime');
}
console.log(`Inside Grey Room ${VERSION}: Prosecutor runtime applied to ${process.argv[2]||'dist'}`);
