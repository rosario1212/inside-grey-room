// Upgrade the v51 rulebook asset version after all legacy build checks.
import {readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist');
const exists=async x=>{try{await stat(x);return true}catch{return false}};
const version='v696-rolebook';
const networkVersion='v701-network-resilience-20261115';
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);if(!await exists(file))continue;
 let content=await readFile(file,'utf8');
 content=content.replace(/self-guided-rules-v51\.js\?v=[A-Za-z0-9._-]+/g,'self-guided-rules-v51.js?v='+version);
 // Deliver the fixed runtime to installed PWAs instead of reusing old asset URLs.
 content=content.replace(/live-cell-v12-44\.js\?v=[A-Za-z0-9._-]+/g,'live-cell-v12-44.js?v='+networkVersion);
 content=content.replace(/(app-v11(?:-terror-live-v694-20261115)?\.js\?v=[A-Za-z0-9._-]+)(?:&sync=[A-Za-z0-9._-]+)?/g,(_,url)=>url+'&sync='+networkVersion);
 if(!content.includes('self-guided-rules-v51.js?v='+version))throw new Error('Missing rolebook entry in '+page);
 await writeFile(file,content,'utf8');
 // Keep Cloudflare Worker shell aliases byte-identical to the published homepage.
 for(const alias of [page.replace('.html','-latest-release.txt'),page.replace('.html','-terror-live-v694-20261115.txt')]){
  const dest=path.join(target,alias);
  if(await exists(dest))await writeFile(dest,content,'utf8');
 }
}
const swFile=path.join(target,'service-worker.js');
if(await exists(swFile)){
 let s=await readFile(swFile,'utf8');
 s=s.replace(/\/self-guided-rules-v51\.js\?v=[A-Za-z0-9._-]+/g,'/self-guided-rules-v51.js?v='+version);
 s=s.replace(/\/live-cell-v12-44\.js\?v=[A-Za-z0-9._-]+/g,'/live-cell-v12-44.js?v='+networkVersion);


 await writeFile(swFile,s,'utf8');
}
const appFile=path.join(target,'app-v11.js');
if(await exists(appFile)){
 let a=await readFile(appFile,'utf8');
 a=a.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+version);
 await writeFile(appFile,a,'utf8');
}
console.log('Rulebook v696 cache and entrypoints updated in '+target);
