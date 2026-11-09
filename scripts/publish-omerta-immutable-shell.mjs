// Final packaging stage: publish immutable public HTML and Omertà JS asset paths.
// The canonical source files and the legacy URLs remain unchanged for compatibility.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const dest=path.resolve(process.argv[2]||'dist');
const tag='omerta-editorial-20261109';
const newScript='omerta-v12-'+tag+'.js';
const source=await readFile(path.join(dest,'omerta-v12.js'),'utf8');
assert(source.includes('Chaque vendredi, des commerçants du quartier remettent leur contribution'),
  'The released Omertà script must contain the approved 021 opening');
assert(source.includes('Vittorio Santoro dirige une famille dont l’autorité repose sur des règles'),
  'The released Omertà script must contain the approved 025 opening');
await writeFile(path.join(dest,newScript),source,'utf8');

const oldScript=/omerta-v12\.js(?=\?v=[^"'< >\s]+)/g;
for(const page of ['index.html','en.html']){
  const file=path.join(dest,page);
  let html=await readFile(file,'utf8');
  if(page==='index.html')assert(oldScript.test(html),'Missing Omertà runtime in main entrypoint');
  oldScript.lastIndex=0;
  html=html.replace(oldScript,newScript);
  await writeFile(file,html,'utf8');
  await writeFile(path.join(dest,page.replace('.html','-'+tag+'.html')),html,'utf8');
}
const swPath=path.join(dest,'service-worker.js');
let sw=await readFile(swPath,'utf8');
const omertaCachePath='/'+newScript+'?v=omerta-full-intros-20261109';
sw=sw.replace(/\\/omerta-v12\\.js\\?v=[^'"]+/g,omertaCachePath);
if(!sw.includes(omertaCachePath)){
  assert(sw.includes('const SHELL=['),'Missing service worker asset manifest');
  sw=sw.replace('const SHELL=[',`const SHELL=[\n  '${omertaCachePath}',`);
}
await writeFile(swPath,sw,'utf8');
console.log('Immutable Omertà entrypoint and runtime published:',tag);
