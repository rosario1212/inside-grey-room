import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v46-1-long-timers';
const CACHE='igr-v46-1-long-timers';
const runtimeName='timer-runtime-v46.js';
const source=path.join(root,runtimeName);
const appTarget=path.join(target,'app-v11.js');
const swTarget=path.join(target,'service-worker.js');
const exists=async file=>{try{await stat(file);return true}catch{return false}};
if(!(await exists(target)))throw new Error(`Timer v46 target missing: ${target}`);
if(!(await exists(source)))throw new Error('Timer v46 source missing');
await copyFile(source,path.join(target,runtimeName));

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

const script=`  <script src="${runtimeName}?v=${VERSION}"></script>`;
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']timer-runtime-v46\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`${script}\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(new RegExp(`^\\s*['\"]/${runtimeName.replace(/\./g,'\\.')}\\?v=[^'\"]+['\"],?\\s*$`,'gmi'),'');
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtimeName}?v=${VERSION}',`);
  await writeFile(swTarget,sw,'utf8');
}

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const marker=`${runtimeName}?v=${VERSION}`;
  const pos=html.lastIndexOf(marker);
  if(pos<0)throw new Error(`${page}: v46.1 timer runtime missing`);
  const after=html.slice(pos+marker.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${page}: v46.1 timer runtime must be the final external script`);
}
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('service worker registration is stale after v46.1');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service worker cache namespace is stale after v46.1');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`))throw new Error('service worker does not precache v46.1 timer runtime');
}
console.log(`Inside Grey Room timer runtime v46.1 applied to ${target}`);
