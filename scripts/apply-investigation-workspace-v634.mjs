/* Last-pass investigation hierarchy. Preserve all existing scenario-specific renderers. */
import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),target=path.resolve(process.argv[2]||'dist');
const VERSION='v634-investigation-workspace';
const assets=['investigation-workspace-v634.css','investigation-workspace-v634.js'];
await stat(target);
for(const asset of assets){
 const source=path.join(root,asset);
 await stat(source);
 if(asset.endsWith('.js')){
  const status=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
  if(status.status!==0)throw new Error('Investigation UX invalid: '+status.stderr);
 }
 await copyFile(source,path.join(target,asset));
}
for(const name of ['index.html','en.html']){
 const f=path.join(target,name);let html=await readFile(f,'utf8');
 html=html.replace(/\s*<link[^>]*href=["']investigation-workspace-v634\.css[^"']*["'][^>]*>/gi,'');
 html=html.replace(/\s*<script[^>]*src=["']investigation-workspace-v634\.js[^"']*["'][^>]*><\/script>/gi,'');
 html=html.replace('</head>',`  <link rel="stylesheet" href="investigation-workspace-v634.css?v=${VERSION}">\n</head>`);
 html=html.replace('</body>',`  <script src="investigation-workspace-v634.js?v=${VERSION}"></script>\n</body>`);
 await writeFile(f,html,'utf8');
}
const swfile=path.join(target,'service-worker.js');
try{
 let sw=await readFile(swfile,'utf8');
 sw=sw.replace(/const CACHE='[^']*';/,`const CACHE='igr-${VERSION}';`);
 for(const asset of assets){
  const old=new RegExp('^\\s*[\\x27\\x22]/'+asset.replaceAll('.','\\.')+'\\?v=[^\\x27\\x22]+[\\x27\\x22],?\\s*$','gmi');
  sw=sw.replace(old,'');
  sw=sw.replace('const SHELL=[',`const SHELL=[\n  '/${asset}?v=${VERSION}',`);
 }
 await writeFile(swfile,sw,'utf8');
}catch(err){if(err?.code!=='ENOENT')throw err}
const core=path.join(target,'app-v11.js');
let app=await readFile(core,'utf8');
app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
await writeFile(core,app,'utf8');
console.log('Investigation workspace '+VERSION+': scenario-neutral hierarchy applied to '+path.basename(target));


/* v635 final UI layer: loaded after every gameplay and investigation stylesheet.
   No changes to room state, private access rules, scenario variants or scoring. */
const polishVersion='v635-reading-stability';
const polishFile='reading-stability-v635.css';
await stat(path.join(root,polishFile));
await copyFile(path.join(root,polishFile),path.join(target,polishFile));
for(const name of ['index.html','en.html']){
 const filename=path.join(target,name);
 let html=await readFile(filename,'utf8');
 html=html.replace(/\s*<link[^>]+href=["']reading-stability-v635\.css[^"']*["'][^>]*>/gi,'');
 html=html.replace('</head>','  <link rel="stylesheet" href="reading-stability-v635.css?v=v635-reading-stability">\n</head>');
 html=html.replace(/app-v11\.js\?v=[^"']+/g,'app-v11.js?v=v635-reading-stability');
 html=html.replace(/notifications-v12\.js\?v=[^"']+/g,'notifications-v12.js?v=v635-reading-stability');
 await writeFile(filename,html,'utf8');
}
try{
 const swFile=path.join(target,'service-worker.js');
 let sw=await readFile(swFile,'utf8');
 sw=sw.replace(/const CACHE='[^']*';/,"const CACHE='igr-v635-reading-stability';");
 sw=sw.replace('const SHELL=[',"const SHELL=[\n  '/reading-stability-v635.css?v=v635-reading-stability',");
 sw=sw.replace(/\/app-v11\.js\?v=[^'"]+/g,'/app-v11.js?v=v635-reading-stability');
 sw=sw.replace(/\/notifications-v12\.js\?v=[^'"]+/g,'/notifications-v12.js?v=v635-reading-stability');
 await writeFile(swFile,sw,'utf8');
}catch(err){if(err.code!=='ENOENT')throw err}
console.log('v635 ergonomic reading/notifications/settings layer applied: '+path.basename(target));

// Final release seal: invalidate installed home-screen PWA scripts consistently.
// Prevent an older iPad asset graph from pairing with the freshly-started host phase.
const release='santoro-display-audit-20261108';
const changedAssets=['investigation-workspace-v634.js','investigation-workspace-v634.css',
 'reading-stability-v635.css','gameplay-flow-v13.js','live-cell-v12-44.js',
 'narrative-dossier-v87.js','app-v11.js'];
const versioned=(source)=>{
 let out=source;
 for(const asset of changedAssets){
  const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  out=out.replace(new RegExp('('+escaped+'\\?v=)[^\\s\x22\x27]+','g'),'$1'+release);
 }
 return out;
};
for(const page of ['index.html','en.html']){
 const filename=path.join(target,page);
 await writeFile(filename,versioned(await readFile(filename,'utf8')),'utf8');
}
try{
 const swFile=path.join(target,'service-worker.js');
 let sw=versioned(await readFile(swFile,'utf8'));
 sw=sw.replace(/const CACHE='[^']*';/,"const CACHE='igr-santoro-display-audit-20261108';");
 await writeFile(swFile,sw,'utf8');
}catch(error){if(error?.code!=='ENOENT')throw error}
const appSourceFile=path.join(target,'app-v11.js');
let currentApp=await readFile(appSourceFile,'utf8');
currentApp=currentApp.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,
 '/service-worker.js?v=santoro-display-audit-20261108');
await writeFile(appSourceFile,currentApp,'utf8');
console.log('Santoro PWA freshness seal applied: '+path.basename(target));


// v834 — last-pass Cycle / Enquête split. Reuses the role-authorized
// investigation renderer; leaves the server as the sole gameplay authority.
const cycleRevision='v834-cycle-workspace-20261122';
const cycleAssets=['cycle-workspace-v834.css','cycle-workspace-v834.js'];
for(const asset of cycleAssets){
 const source=path.join(root,asset);
 await stat(source);
 if(asset.endsWith('.js')){
  const result=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
  if(result.status!==0)throw new Error('v834 Cycle syntax: '+result.stderr);
 }
 await copyFile(source,path.join(target,asset));
}
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);let html=await readFile(file,'utf8');
 html=html.replace(/\s*<link[^>]+href=["']cycle-workspace-v834\.css[^"']*["'][^>]*>/gi,'');
 html=html.replace(/\s*<script[^>]+src=["']cycle-workspace-v834\.js[^"']*["'][^>]*><\/script>/gi,'');
 html=html.replace('</head>','  <link rel="stylesheet" href="cycle-workspace-v834.css?v='+cycleRevision+'">\n</head>');
 html=html.replace('</body>','  <script src="cycle-workspace-v834.js?v='+cycleRevision+'"></script>\n</body>');
 await writeFile(file,html,'utf8');
}
try{
 const file=path.join(target,'service-worker.js');let sw=await readFile(file,'utf8');
 for(const asset of cycleAssets){
  sw=sw.split('\n').filter(line=>!line.includes('/'+asset+'?v=')).join('\n');
  const url='/'+asset+'?v='+cycleRevision;
  sw=sw.replace('const SHELL=[',"const SHELL=[\n  '"+url+"',");
 }
 // Keep the v634 release cache key expected by existing cross-platform gates.
 // The v834 versioned asset URLs are still new SW install entries.
 await writeFile(file,sw,'utf8');
}catch(error){if(error?.code!=='ENOENT')throw error}
console.log('v834 Cycle/Enquête split and mobile roster overlap correction installed.');


// v835 — live-player focus, public party roster and action clarity.
// Install after the v834 tab split; keep underlying phases and RPC handlers unchanged.
const playerFocusRevision='v835-player-focus-20261122';
const playerFocusAssets=['live-player-focus-v835.css','live-player-focus-v835.js'];
for(const asset of playerFocusAssets){
 const src=path.join(root,asset);
 await stat(src);
 if(asset.endsWith('.js')){
  const check=spawnSync(process.execPath,['--check',src],{encoding:'utf8'});
  if(check.status!==0)throw new Error('v835 player focus syntax failed: '+check.stderr);
 }
 await copyFile(src,path.join(target,asset));
}
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);let html=await readFile(file,'utf8');
 html=html.replace(/\s*<link[^>]+href=["']live-player-focus-v835\.css[^"']*["'][^>]*>/gi,'');
 html=html.replace(/\s*<script[^>]+src=["']live-player-focus-v835\.js[^"']*["'][^>]*><\/script>/gi,'');
 html=html.replace('</head>','  <link rel="stylesheet" href="live-player-focus-v835.css?v='+playerFocusRevision+'">\n</head>');
 html=html.replace('</body>','  <script src="live-player-focus-v835.js?v='+playerFocusRevision+'"></script>\n</body>');
 await writeFile(file,html,'utf8');
}
try{
 const file=path.join(target,'service-worker.js');let sw=await readFile(file,'utf8');
 for(const asset of playerFocusAssets){
  sw=sw.split('\n').filter(line=>!line.includes('/'+asset+'?v=')).join('\n');
  sw=sw.replace('const SHELL=[',"const SHELL=[\n  '/"+asset+"?v="+playerFocusRevision+"',");
 }
 // Existing v634 build gates assert the historical cache key; versioned v835
 // resources in the SW manifest still trigger service-worker script updates.
 await writeFile(file,sw,'utf8');
}catch(error){if(error?.code!=='ENOENT')throw error}
const playerFocusQA=spawnSync(process.execPath,
 ['scripts/v835-live-player-focus-check.mjs',target],{encoding:'utf8'});
if(playerFocusQA.status!==0)throw new Error('v835 player focus regression: '+playerFocusQA.stderr);
console.log(playerFocusQA.stdout.trim());
console.log('v835 public live player focus installed: '+path.basename(target));
