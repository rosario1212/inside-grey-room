import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const runtime='gameplay-state-fix-v38.js';
const version='v38-gameplay-ui-state';
const cache='igr-v38-gameplay-ui-state';

async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(target)))throw new Error(`Gameplay v38 target does not exist: ${target}`);

const source=path.join(root,runtime),destination=path.join(target,runtime);
if(!(await exists(source)))throw new Error(`Gameplay v38 source missing: ${runtime}`);
const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(`${runtime}: JavaScript syntax check failed: ${parsed.stderr||parsed.stdout}`);
await copyFile(source,destination);

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  html=html.replace(new RegExp(`\\s*<script[^>]+src=["']${runtime.replaceAll('.','\\.')}[^"']*["'][^>]*><\\/script>\\s*`,'g'),'\n');
  const tag=`  <script src="${runtime}?v=${version}"></script>`;
  if(!html.includes('</body>'))throw new Error(`${page}: missing </body> for gameplay v38 injection`);
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
  if(!sw.includes('self.skipWaiting()'))throw new Error('service-worker.js: skipWaiting is required for v38 cache takeover');
  if(!sw.includes('self.clients.claim()'))throw new Error('service-worker.js: clients.claim is required for v38 cache takeover');
  await writeFile(swPath,sw,'utf8');
}

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const matches=[...html.matchAll(new RegExp(runtime.replaceAll('.','\\.'),'g'))];
  if(matches.length!==1)throw new Error(`${page}: gameplay v38 must be included exactly once`);
  const lastRuntime=Math.max(html.lastIndexOf('<script'),html.lastIndexOf(runtime));
  if(lastRuntime<0||!html.slice(lastRuntime).includes(runtime))throw new Error(`${page}: gameplay v38 is not the final runtime script`);
}
if(!(await exists(destination)))throw new Error(`Gameplay v38 runtime copy missing from ${target}`);
console.log(`Inside Grey Room ${version}: gameplay UI repair + fresh PWA cache applied to ${process.argv[2]||'dist'}`);
