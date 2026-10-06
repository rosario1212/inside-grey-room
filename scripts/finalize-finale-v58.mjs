import {readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist'),version='v58-stable-finale-six-protections';
const assets=['final-audience-v52.js','self-guided-rules-v51.js','judicial-runtime-v44.js','duration-modes-v35.js'];
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);let s=await readFile(file,'utf8');
 for(const asset of assets)s=s.replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\'<> ]+','g'),asset+'?v='+version);
 await writeFile(file,s);
}
const file=path.join(target,'service-worker.js');if(await stat(file).catch(()=>null)){let sw=await readFile(file,'utf8');
sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='igr-${version}';`);
for(const asset of assets)sw=sw.replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\'<> ]+','g'),asset+'?v='+version);
await writeFile(file,sw);}
const app=path.join(target,'app-v11.js');await writeFile(app,(await readFile(app,'utf8')).replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+version));
console.log('v58 final cache revision applied');
