import {copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist'),src='cartel029-v121.js',v='v147-cartel029-client-guards';
await stat(target);
const check=spawnSync(process.execPath,['--check',src],{encoding:'utf8'});
if(check.status)throw Error('CARTEL029 v121 syntax: '+check.stderr);
await copyFile(src,path.join(target,src));
for(const name of ['index.html','en.html']){
 const file=path.join(target,name);let html=await readFile(file,'utf8');
 html=html.replace(/\s*<script[^>]*src=["']cartel029-v121\.js[^"']*["'][^>]*><\/script>/g,'');
 // Bust the core application bundle too: the mandatory-role fix lives in
 // app-v11.js, not in the CARTEL add-on loaded afterwards.
 html=html.replace(/(src=["']app-v11\.js\?v=)[^"']+/g,(_full,prefix)=>prefix+v);
 html=html.replace(/(src=["']cartel029-v107\.js\?v=)[^"']+/g,(_full,prefix)=>prefix+v);
 html=html.replace('</body>',`<script src="${src}?v=${v}"></script>\n</body>`);
 await writeFile(file,html,'utf8');
}
try{const swFile=path.join(target,'service-worker.js');let sw=await readFile(swFile,'utf8');
 sw=sw.replace(/const CACHE='[^']*';/,`const CACHE='igr-${v}';`);
 sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${src}?v=${v}',`);
 await writeFile(swFile,sw,'utf8');
}catch(e){if(e.code!=='ENOENT')throw e}
const app=path.join(target,'app-v11.js');let a=await readFile(app,'utf8');
a=a.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${v}`);
await writeFile(app,a,'utf8');
console.log('CARTEL029 v121 bundled');
