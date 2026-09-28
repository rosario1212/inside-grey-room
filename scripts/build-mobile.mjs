import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'www');
const files = [
  'index.html',
  'styles-v11.css',
  'app-v11.js',
  'qa-fixes-v12.js',
  'video-v12-3.js',
  'profile-dossier-v12.js',
  'playstore-ready-v12.js',
  'social-v12.js',
  'notifications-v12.js',
  'manifest.webmanifest',
  'privacy.html',
  'terms.html',
  'delete-account.html',
  'support.html'
];
async function exists(p){try{await stat(p);return true}catch{return false}}
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const name of files){
  const src=path.join(root,name);
  if(!(await exists(src)))throw new Error(`Missing mobile runtime file: ${name}`);
  await cp(src,path.join(out,name),{recursive:true});
}
const assets=path.join(root,'assets');
if(!(await exists(assets)))throw new Error('Missing assets directory');
await cp(assets,path.join(out,'assets'),{recursive:true});
console.log(`Inside Grey Room mobile bundle ready: ${out}`);
