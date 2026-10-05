import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v42-investigation-elements';
const CACHE='igr-v42-investigation-elements';
const runtimeName='investigation-elements-v42.js';
const runtimeSource=path.join(root,runtimeName);
const swTarget=path.join(target,'service-worker.js');
const appTarget=path.join(target,'app-v11.js');
const pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v42 target missing: ${target}`);
if(!(await exists(runtimeSource)))throw new Error(`${runtimeName} missing`);
const parsed=spawnSync(process.execPath,['--check',runtimeSource],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`${runtimeName} syntax error: ${parsed.stderr||parsed.stdout}`);
await copyFile(runtimeSource,path.join(target,runtimeName));

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']investigation-elements-v42\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  const v41=/authoritative-runtime-v41\.js/i.test(html);
  if(!v41)throw new Error(`${name}: authoritative-runtime-v41.js must load before v42`);
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

// Force installed PWAs to discover the new runtime and cache namespace.
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
  if(!html.includes(`${runtimeName}?v=${VERSION}`))throw new Error(`${name}: v42 runtime missing`);
  const v41Pos=html.lastIndexOf('authoritative-runtime-v41.js');
  const v42Pos=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);
  if(v41Pos<0||v42Pos<v41Pos)throw new Error(`${name}: v42 must load after v41`);
  const after=html.slice(v42Pos+`${runtimeName}?v=${VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v42 is not the last external script`);
}

if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${VERSION}`))throw new Error('app-v11.js service-worker registration is stale after v42');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker cache namespace is stale after v42');
  if(!sw.includes(`/${runtimeName}?v=${VERSION}`))throw new Error('service-worker does not precache v42 runtime');
}

console.log(`Inside Grey Room ${VERSION}: investigation elements applied to ${process.argv[2]||'dist'}`);
