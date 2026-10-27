/* Final presentation-only pass. Runs after all case/DLC/runtime assemblers. */
import {copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v632-iphone-live-ux';
const ASSETS=['live-game-ux-v632.css','live-game-ux-v632.js'];
await stat(target);
for(const asset of ASSETS){
  const source=path.join(root,asset);
  await stat(source);
  if(asset.endsWith('.js')){
    const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
    if(parsed.status!==0)throw Error('Invalid UX runtime: '+parsed.stderr);
  }
  await copyFile(source,path.join(target,asset));
}
for(const page of ['index.html','en.html']){
  const filename=path.join(target,page);
  let html=await readFile(filename,'utf8');
  html=html.replace(/\s*<link[^>]+href=["']live-game-ux-v632\.css[^"']*["'][^>]*>/gi,'');
  html=html.replace(/\s*<script[^>]+src=["']live-game-ux-v632\.js[^"']*["'][^>]*><\/script>/gi,'');
  html=html.replace('</head>',`  <link rel="stylesheet" href="live-game-ux-v632.css?v=${VERSION}">\n</head>`);
  html=html.replace('</body>',`  <script src="live-game-ux-v632.js?v=${VERSION}"></script>\n</body>`);
  await writeFile(filename,html,'utf8');
}
const workerFile=path.join(target,'service-worker.js');
try{
  let sw=await readFile(workerFile,'utf8');
  sw=sw.replace(/const CACHE='[^']*';/,`const CACHE='igr-${VERSION}';`);
  for(const asset of ASSETS){
    sw=sw.replace(new RegExp("['\"]/\\/"+asset.replaceAll('.','\\.')+"\\?v=[^'\"]+['\"],?",'g'),'');
    sw=sw.replace('const SHELL=[',`const SHELL=[\n  '/${asset}?v=${VERSION}',`);
  }
  await writeFile(workerFile,sw,'utf8');
}catch(e){if(e?.code!=='ENOENT')throw e}
const appFile=path.join(target,'app-v11.js');
let app=await readFile(appFile,'utf8');
app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
await writeFile(appFile,app,'utf8');
console.log('iPhone live-game UX pass applied to '+path.basename(target));
