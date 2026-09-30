import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const runtimeFiles = [
  'index.html','en.html','styles-v11.css','polish-v12.css','ui-polish-v12.css','omerta-v12.css','app-v11.js','qa-fixes-v12.js',
  'investigation-sheet-v12.js','video-v12-3.js','turn-v12-4.js','profile-dossier-v12.js',
  'playstore-ready-v12.js','social-v12.js','notifications-v12.js','native-lifecycle-v12.js',
  'runtime-optimization-v12.js','gameplay-simple-v12.js','apple-ui-stability-v12.js','gameplay-clean-v12.js',
  'i18n-en-v12.js','language-v12.js','rules-v12.js','locale-settings-v12.js','ui-polish-v12.js','locale-runtime-v12-23.js','omerta-v12.js','service-worker.js',
  'manifest.webmanifest','privacy.html','terms.html','delete-account.html','support.html'
];
async function exists(file){try{await stat(file);return true}catch{return false}}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const searchableText=[];
for(const name of runtimeFiles){const src=path.join(root,name);if(!(await exists(src)))throw new Error(`Missing web runtime file: ${name}`);const dst=path.join(out,name);await mkdir(path.dirname(dst),{recursive:true});await cp(src,dst,{recursive:true});searchableText.push(await readFile(src,'utf8'))}
const assetRefs=new Set();
for(const text of searchableText)for(const match of text.matchAll(/assets\/[A-Za-z0-9._\/-]+/g))assetRefs.add(match[0]);
let assetBytes=0;
for(const relative of [...assetRefs].sort()){const src=path.join(root,relative);if(!(await exists(src)))throw new Error(`Missing referenced web asset: ${relative}`);const dst=path.join(out,relative);await mkdir(path.dirname(dst),{recursive:true});await cp(src,dst);assetBytes+=(await stat(src)).size}
const cloudflareHeaders=`
/*
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  X-Permitted-Cross-Domain-Policies: none
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), bluetooth=(), serial=()
  X-Frame-Options: DENY
  Cross-Origin-Resource-Policy: same-origin

/service-worker.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

/manifest.webmanifest
  Cache-Control: public, max-age=0, must-revalidate
  Content-Type: application/manifest+json; charset=utf-8

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/en.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
await writeFile(path.join(out,'_headers'),cloudflareHeaders.trimStart(),'utf8');
console.log(`Inside Grey Room web bundle ready: ${out}`);
console.log(`Runtime files: ${runtimeFiles.length} · assets: ${assetRefs.size} · ${(assetBytes/1024/1024).toFixed(2)} MiB assets`);
