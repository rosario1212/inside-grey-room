import {copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist'),src='cartel029-v107.js',v='v107-cartel029-attention2';
await stat(target);const file=path.join(process.cwd(),src);
const parsed=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
if(parsed.status)throw Error('029 runtime JS invalid: '+parsed.stderr);
await copyFile(file,path.join(target,src));
for(const name of ['index.html','en.html']){
 const loc=path.join(target,name);let h=await readFile(loc,'utf8');
 h=h.replace(/\s*<script[^>]*src=['"]cartel029-v107\.js[^'"]*['"][^>]*><\/script>/g,'');
 h=h.replace('</body>',`  <script src="${src}?v=${v}"></script>\n</body>`);
 await writeFile(loc,h,'utf8');
}
const sw=path.join(target,'service-worker.js');
try{
 let data=await readFile(sw,'utf8');
 data=data.replace(/const CACHE='[^']*';/, `const CACHE='igr-${v}';`);
 data=data.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${src}?v=${v}',`);
 await writeFile(sw,data,'utf8');
}catch(e){if(e.code!=='ENOENT')throw e}
const app=path.join(target,'app-v11.js');
let text=await readFile(app,'utf8');
text=text.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${v}`);
await writeFile(app,text,'utf8');
console.log('CARTEL 029 v107 runtime ready');
