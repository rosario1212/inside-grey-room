import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const target=path.resolve(process.argv[2]||'dist');
const root=process.cwd(),script='common-dossier-v106.js',version='v106-common-dossier';
const exists=async x=>{try{await stat(x);return true}catch{return false}};
if(!(await exists(target)))throw Error('Missing built target '+target);
const source=path.join(root,script);
const check=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
if(check.status)throw Error(check.stderr||'v106 invalid JS');
await copyFile(source,path.join(target,script));
for(const name of ['index.html','en.html']){
 const file=path.join(target,name);let html=await readFile(file,'utf8');
 html=html.replace(/\s*<script\b[^>]+src=["']common-dossier-v106\.js[^"']*["'][^>]*><\/script>/gi,'');
 html=html.replace(/notifications-v12\.js\?v=[^"']+/g,`notifications-v12.js?v=${version}`);
 html=html.replace('</body>',`  <script src="${script}?v=${version}"></script>\n</body>`);
 if(!html.includes('common-dossier-v106.js?v=v106-common-dossier'))throw Error('v106 runtime missing from '+name);
 await writeFile(file,html,'utf8');
}
const worker=path.join(target,'service-worker.js');
if(await exists(worker)){
 let sw=await readFile(worker,'utf8');
 sw=sw.replace(/const CACHE='[^']*';/,`const CACHE='igr-${version}';`);
 sw=sw.replace(/\/notifications-v12\.js\?v=[^'"]+/g,`/notifications-v12.js?v=${version}`);
 sw=sw.replace(/\s*['"]\/common-dossier-v106\.js\?v=[^'"]+['"],?\s*/g,'\n');
 sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${script}?v=${version}',`);
 await writeFile(worker,sw,'utf8');
}
const app=path.join(target,'app-v11.js');
if(await exists(app)){
 let s=await readFile(app,'utf8');
 s=s.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${version}`);
 await writeFile(app,s,'utf8');
}
console.log('v106 private notifications and public dossier bundled in '+target);