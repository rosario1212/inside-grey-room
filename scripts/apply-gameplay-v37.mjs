import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime='gameplay-state-fix-v37.js';
const version='v37-objective-event-select';
const cache='igr-v36-1-parasite-fix';

async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(target)))throw new Error(`Gameplay v37 target does not exist: ${target}`);

const source=path.join(root,runtime),destination=path.join(target,runtime);
if(!(await exists(source)))throw new Error(`Gameplay v37 source missing: ${runtime}`);
const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`${runtime}: JavaScript syntax check failed: ${parsed.stderr||parsed.stdout}`);
await copyFile(source,destination);

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(new RegExp(`\\s*<script[^>]+src=["']${runtime.replaceAll('.','\\.')}[^"']*["'][^>]*><\\/script>\\s*`,'g'),'\n');
  const tag=`  <script src="${runtime}?v=${version}"></script>`;
  if(!html.includes('</body>'))throw new Error(`${page}: missing </body> for gameplay v37 injection`);
  html=html.replace('</body>',`${tag}\n</body>`);
  await writeFile(file,html,'utf8');
}

const swPath=path.join(target,'service-worker.js');
if(await exists(swPath)){
  let sw=await readFile(swPath,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${cache}';`);
  const ref=`/${runtime}?v=${version}`;
  const shell=sw.match(/const SHELL=\[([\s\S]*?)\];/);
  if(!shell)throw new Error('service-worker.js: SHELL precache list not found');
  if(!shell[1].includes(ref)){
    const body=shell[1].trimEnd();
    const comma=body.trim().endsWith(',')?'':',';
    sw=sw.replace(shell[0],`const SHELL=[${body}${comma}\n  '${ref}'\n];`);
  }
  await writeFile(swPath,sw,'utf8');
}

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const matches=[...html.matchAll(new RegExp(runtime.replaceAll('.','\\.'),'g'))];
  if(matches.length!==1)throw new Error(`${page}: gameplay v37 must be included exactly once`);
  const tail=html.slice(Math.max(0,html.lastIndexOf('<script')));
  if(!tail.includes(runtime))throw new Error(`${page}: gameplay v37 is not the final runtime script`);
}
if(!(await exists(destination)))throw new Error(`Gameplay v37 runtime copy missing from ${target}`);
console.log(`Inside Grey Room ${version}: suspect objectives + event-select runtime applied to ${process.argv[2]||'dist'}`);
