import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v36.1-parasite-fix';
const CACHE='igr-v36-1-parasite-fix';

async function exists(file){try{await stat(file);return true}catch{return false}}
function cleanRef(value=''){
  const raw=String(value).trim();
  if(!raw||/^(?:https?:|data:|blob:|#|mailto:|tel:)/i.test(raw))return null;
  return raw.split(/[?#]/,1)[0].replace(/^\.\//,'').replace(/^\//,'')||'index.html';
}
async function requireFile(relative,origin){
  const cleaned=cleanRef(relative);
  if(!cleaned)return;
  const file=path.join(target,cleaned);
  if(!(await exists(file)))throw new Error(`${origin}: missing runtime resource ${relative} -> ${cleaned}`);
}
function escapeRegex(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function addShellEntries(sw,entries){
  const match=sw.match(/const SHELL=\[([\s\S]*?)\];/);
  if(!match)return sw;
  const existing=new Set([...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]));
  const additions=entries.filter(Boolean).filter(ref=>!existing.has(ref));
  if(!additions.length)return sw;
  const body=match[1].trimEnd();
  const comma=body.trim().endsWith(',')?'':',';
  const extra=additions.map(ref=>`  '${String(ref).replaceAll("'","\\'")}'`).join(',\n');
  return sw.replace(match[0],`const SHELL=[${body}${comma}\n${extra}\n];`);
}

if(!(await exists(target)))throw new Error(`Runtime target does not exist: ${target}`);

for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  if(!(await exists(file)))continue;
  let html=await readFile(file,'utf8');
  for(const name of ['live-cell-v12-44.js','runtime-optimization-v12.js','native-lifecycle-v12.js']){
    const escaped=escapeRegex(name);
    html=html.replace(new RegExp(`${escaped}\\?v=[^"']+`,'g'),`${name}?v=${VERSION}`);
  }
  await writeFile(file,html,'utf8');
}

const manifestPath=path.join(target,'manifest.webmanifest');
if(await exists(manifestPath)){
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  for(const icon of manifest.icons||[]){
    const relative=cleanRef(icon.src);
    if(!relative)continue;
    if(!(await exists(path.join(target,relative)))&&/\.png$/i.test(relative)){
      const jpg=relative.replace(/\.png$/i,'.jpg');
      if(await exists(path.join(target,jpg))){
        icon.src=jpg;
        icon.type='image/jpeg';
      }
    }
    if(/\.jpe?g$/i.test(String(icon.src||'')))icon.type='image/jpeg';
    if(/\.png$/i.test(String(icon.src||'')))icon.type='image/png';
  }
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n','utf8');
}

const swPath=path.join(target,'service-worker.js');
if(await exists(swPath)){
  let sw=await readFile(swPath,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);
  sw=sw.replaceAll('/assets/icon-192-v14.png','/assets/icon-192-v14.jpg');
  sw=sw.replaceAll('/assets/icon-512-v14.png','/assets/icon-512-v14.jpg');
  for(const name of ['live-cell-v12-44.js','runtime-optimization-v12.js','native-lifecycle-v12.js']){
    const escaped=escapeRegex(name);
    sw=sw.replace(new RegExp(`${escaped}\\?v=[^']+`,'g'),`${name}?v=${VERSION}`);
  }

  // Optional late-bound runtimes (currently MAÎTRE v34.4) are injected after the base
  // bundle. Add them to the PWA shell only when those files are really present, so a
  // newer campaign patch cannot silently work online while disappearing offline.
  const optionalShell=[];
  const optional=[
    ['heritage-maitre-v34.css','v34.4-maitre-fix'],
    ['heritage-maitre-judicial-v34.css','v34.4-maitre-fix'],
    ['heritage-maitre-polish-v34.css','v34.4-maitre-fix'],
    ['heritage-maitre-data-v34.js','v34.4-maitre-fix'],
    ['heritage-maitre-assets-v34.js','v34.4-maitre-fix'],
    ['heritage-maitre-v34.js','v34.4-maitre-fix'],
    ['heritage-maitre-online-v34-4.js','v34.4-maitre-fix'],
    ['heritage-maitre-polish-v34.js','v34.4-maitre-fix']
  ];
  for(const [name,version] of optional){
    if(await exists(path.join(target,name)))optionalShell.push(`/${name}?v=${version}`);
  }
  for(const name of [
    'heritage-maitre-01-le-client-v34-4.svg',
    'heritage-maitre-02-le-deal-v34-4.svg',
    'heritage-maitre-03-deux-choix-v34-4.svg',
    'heritage-maitre-04-le-proces-v34-4.svg',
    'heritage-maitre-05-l-honneur-v34-4.svg'
  ]){
    if(await exists(path.join(target,'assets',name)))optionalShell.push(`/assets/${name}?v=v34.4-maitre-fix`);
  }
  sw=addShellEntries(sw,optionalShell);
  await writeFile(swPath,sw,'utf8');
}

// Validate the FINAL generated runtime rather than only the source tree. This catches
// broken references introduced by post-build patchers (PWA icons were a real example).
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  if(!(await exists(file)))continue;
  const html=await readFile(file,'utf8');
  const seen=new Set();
  for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const ref=match[1];
    const cleaned=cleanRef(ref);
    if(!cleaned)continue;
    await requireFile(ref,page);
    if(/\.(?:js|css)$/i.test(cleaned)){
      if(seen.has(cleaned))throw new Error(`${page}: duplicate runtime include ${cleaned}`);
      seen.add(cleaned);
    }
  }
}

if(await exists(manifestPath)){
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  for(const icon of manifest.icons||[])await requireFile(icon.src,'manifest.webmanifest');
}

if(await exists(swPath)){
  const sw=await readFile(swPath,'utf8');
  if(!sw.includes(`const CACHE='${CACHE}';`))throw new Error('service-worker.js: stale cache version survived finalization');
  const shell=sw.match(/const SHELL=\[([\s\S]*?)\];/);
  if(!shell)throw new Error('service-worker.js: SHELL precache list not found');
  for(const match of shell[1].matchAll(/['"]([^'"]+)['"]/g))await requireFile(match[1],'service-worker.js SHELL');
  if(await exists(path.join(target,'heritage-maitre-online-v34-4.js'))&&!sw.includes('/heritage-maitre-online-v34-4.js?v=v34.4-maitre-fix')){
    throw new Error('service-worker.js: MAÎTRE v34.4 online runtime missing from final PWA shell');
  }
}

console.log(`Inside Grey Room ${VERSION}: final runtime integrity verified in ${process.argv[2]||'dist'}`);
