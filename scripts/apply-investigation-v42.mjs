import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const BASE_VERSION='v42-investigation-ui';
const AUDIT_VERSION='v42.1-investigation-audit';
const CACHE='igr-v42-investigation-ui';
const runtimeName='investigation-runtime-v42.js';
const auditName='investigation-audit-v42-1.js';
const runtimeSource=path.join(root,runtimeName);
const auditSource=path.join(root,auditName);
const swTarget=path.join(target,'service-worker.js');
const appTarget=path.join(target,'app-v11.js');
const pages=['index.html','en.html'];
const exists=async file=>{try{await stat(file);return true}catch{return false}};

if(!(await exists(target)))throw new Error(`v42 target missing: ${target}`);
for(const source of [runtimeSource,auditSource])if(!(await exists(source)))throw new Error(`${path.basename(source)} missing`);
for(const source of [runtimeSource,auditSource]){
  const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
  if(parsed.status!==0)throw new Error(`${path.basename(source)} syntax error: ${parsed.stderr||parsed.stdout}`);
}
await copyFile(runtimeSource,path.join(target,runtimeName));
await copyFile(auditSource,path.join(target,auditName));

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(/\s*<script[^>]+src=["']investigation-runtime-v42\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace(/\s*<script[^>]+src=["']investigation-audit-v42-1\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  html=html.replace('</body>',`  <script src="${runtimeName}?v=${BASE_VERSION}"></script>\n  <script src="${auditName}?v=${AUDIT_VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

if(await exists(appTarget)){
  let app=await readFile(appTarget,'utf8');
  app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${AUDIT_VERSION}`);
  await writeFile(appTarget,app,'utf8');
}

if(await exists(swTarget)){
  let sw=await readFile(swTarget,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replace(/^\s*['"]\/investigation-runtime-v42\.js\?v=[^'"]+['"],?\s*$/gmi,'');
  sw=sw.replace(/^\s*['"]\/investigation-audit-v42-1\.js\?v=[^'"]+['"],?\s*$/gmi,'');
  const entries=`  '/${runtimeName}?v=${BASE_VERSION}',\n  '/${auditName}?v=${AUDIT_VERSION}',`;
  sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n${entries}`);
  await writeFile(swTarget,sw,'utf8');
}

for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const v41=html.lastIndexOf('authoritative-runtime-v41.js?v=v41-authoritative-ui');
  const v42=html.lastIndexOf(`${runtimeName}?v=${BASE_VERSION}`);
  const audit=html.lastIndexOf(`${auditName}?v=${AUDIT_VERSION}`);
  if(v41<0||v42<0||audit<0||!(v41<v42&&v42<audit))throw new Error(`${name}: bad v41/v42/audit runtime order`);
  const after=html.slice(audit+`${auditName}?v=${AUDIT_VERSION}`.length);
  if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v42.1 audit runtime is not the last external script`);
}

const finalRuntime=await readFile(path.join(target,runtimeName),'utf8');
for(const marker of ['IGR_INVESTIGATION_V42','Éléments d’enquête','Chronologie','v42-objective-bottom','v42-picker-names','igrTopSettingsV42']){
  if(!finalRuntime.includes(marker))throw new Error(`v42 runtime missing marker: ${marker}`);
}
const finalAudit=await readFile(path.join(target,auditName),'utf8');
for(const marker of ['IGR_INVESTIGATION_AUDIT_V42_1','interrogation_seconds','CONTEXT_SITUATIONS_EN','CONTEXT_HINTS_EN','durationLabel']){
  if(!finalAudit.includes(marker))throw new Error(`v42.1 audit runtime missing marker: ${marker}`);
}
if(await exists(appTarget)){
  const app=await readFile(appTarget,'utf8');
  if(!app.includes(`/service-worker.js?v=${AUDIT_VERSION}`))throw new Error('app-v11.js service-worker registration is stale after v42.1');
}
if(await exists(swTarget)){
  const sw=await readFile(swTarget,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker cache namespace is stale after v42.1');
  if(!sw.includes(`/${runtimeName}?v=${BASE_VERSION}`))throw new Error('service-worker does not precache v42 runtime');
  if(!sw.includes(`/${auditName}?v=${AUDIT_VERSION}`))throw new Error('service-worker does not precache v42.1 audit runtime');
}
console.log(`Inside Grey Room ${AUDIT_VERSION}: investigation audit overlay applied to ${process.argv[2]||'dist'}`);
