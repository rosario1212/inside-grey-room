import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v55-heritage-audit',CACHE='igr-v55-heritage-audit';
const runtime='heritage-audit-v55.js',style='heritage-audit-v55.css',pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const n of [runtime,style])if(!(await exists(path.join(root,n))))throw new Error(`v55 source missing: ${n}`);
const syntax=spawnSync(process.execPath,['--check',path.join(root,runtime)],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr||syntax.stdout);
await copyFile(path.join(root,runtime),path.join(target,runtime));await copyFile(path.join(root,style),path.join(target,style));
for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');
  html=html.replace(/\s*<link[^>]+href=["']heritage-audit-v55\.css[^"']*["'][^>]*>\s*/gi,'\n').replace('</head>',`  <link rel="stylesheet" href="${style}?v=${VERSION}">\n</head>`);
  html=html.replace(/\s*<script[^>]+src=["']heritage-audit-v55\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n').replace('</body>',`  <script src="${runtime}?v=${VERSION}"></script>\n</body>`);
  await writeFile(file,html,'utf8');
}
const app=path.join(target,'app-v11.js');if(await exists(app)){let s=await readFile(app,'utf8');s=s.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);await writeFile(app,s,'utf8')}
const swp=path.join(target,'service-worker.js');if(await exists(swp)){let sw=await readFile(swp,'utf8');sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);if(!sw.includes(`/${runtime}?v=${VERSION}`))sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtime}?v=${VERSION}','/${style}?v=${VERSION}',`);await writeFile(swp,sw,'utf8')}
console.log(`Inside Grey Room ${VERSION}: HÉRITAGE multiplayer + MAÎTRE compact UI applied to ${process.argv[2]||'dist'}`);
