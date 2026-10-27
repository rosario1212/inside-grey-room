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
