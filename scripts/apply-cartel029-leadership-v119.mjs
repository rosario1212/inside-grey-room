import {readFile,copyFile,writeFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist'),src='cartel029-leadership-v119.js',v='v119-cartel';
await stat(target);
const check=spawnSync(process.execPath,['--check',src],{encoding:'utf8'});
if(check.status)throw Error('v119 invalid JS: '+check.stderr);
await copyFile(src,path.join(target,src));
for(const filename of ['index.html','en.html']){
 const file=path.join(target,filename);let html=await readFile(file,'utf8');
 html=html.replace(/\s*<script[^>]*src=["']cartel029-leadership-v119\.js[^"']*["'][^>]*><\/script>/g,'');
 html=html.replace('</body>',`  <script src="${src}?v=${v}"></script>\n</body>`);
 await writeFile(file,html,'utf8');
}
try{
 const file=path.join(target,'service-worker.js');let s=await readFile(file,'utf8');
 s=s.replace(/const CACHE='[^']*';/,`const CACHE='igr-${v}';`);
 s=s.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${src}?v=${v}',`);
 await writeFile(file,s,'utf8');
}catch(e){if(e.code!=='ENOENT')throw e}
console.log('Cartel 029 v119 gated leadership UI built');
