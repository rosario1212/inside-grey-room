import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'www');
const files = [
  'index.html',
  'en.html',
  'styles-v11.css',
  'polish-v12.css',
  'app-v11.js',
  'qa-fixes-v12.js',
  'investigation-sheet-v12.js',
  'video-v12-3.js',
  'turn-v12-4.js',
  'profile-dossier-v12.js',
  'playstore-ready-v12.js',
  'social-v12.js',
  'notifications-v12.js',
  'native-lifecycle-v12.js',
  'runtime-optimization-v12.js',
  'gameplay-simple-v12.js',
  'apple-ui-stability-v12.js',
  'gameplay-clean-v12.js',
  'i18n-en-v12.js',
  'language-v12.js',
  'manifest.webmanifest',
  'privacy.html',
  'terms.html',
  'delete-account.html',
  'support.html'
];

async function exists(p){try{await stat(p);return true}catch{return false}}

// Keep the native bundle in lockstep with the current web runtime. If index.html
// starts referencing a new root-level JS/CSS/manifest file, fail the build instead
// of silently producing a broken Android/iOS WebView bundle.
const indexHtml = await readFile(path.join(root, 'index.html'), 'utf8');
const declared = new Set(files);
for (const match of indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const raw = match[1];
  if (!raw || /^(?:https?:|data:|blob:|#)/i.test(raw)) continue;
  const relative = raw.split(/[?#]/, 1)[0].replace(/^.//, '');
  if (!relative || relative.startsWith('assets/')) continue;
  if (!declared.has(relative)) {
    throw new Error(`Mobile runtime list is out of sync with index.html: ${relative}`);
  }
}

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

const runtimeText=[];
for(const name of files){
  const src=path.join(root,name);
  if(!(await exists(src)))throw new Error(`Missing mobile runtime file: ${name}`);
  await cp(src,path.join(out,name),{recursive:true});
  runtimeText.push(await readFile(src,'utf8'));
}

// Do not ship the repository's historical artwork revisions in every APK/IPA.
// Only files that are actually referenced by the current runtime are copied.
const assetRefs=new Set();
for(const text of runtimeText){
  for(const match of text.matchAll(/assets/[A-Za-z0-9._/-]+/g))assetRefs.add(match[0]);
}

let assetBytes=0;
for(const relative of [...assetRefs].sort()){
  const src=path.join(root,relative);
  if(!(await exists(src)))throw new Error(`Missing referenced mobile asset: ${relative}`);
  const dst=path.join(out,relative);
  await mkdir(path.dirname(dst),{recursive:true});
  await cp(src,dst);
  assetBytes+=(await stat(src)).size;
}

console.log(`Inside Grey Room mobile bundle ready: ${out}`);
console.log(`Runtime files: ${files.length} · assets: ${assetRefs.size} · ${(assetBytes/1024/1024).toFixed(2)} MiB assets`);
