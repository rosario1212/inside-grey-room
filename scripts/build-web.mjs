import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'dist');
const runtimeFiles=[
 'index.html','en.html','styles-v11.css','polish-v12.css','ui-polish-v12.css','gameplay-flow-v13.css','dlc-experience-v13.css','lobby-ui-fix-v13.css','startup-stability-v13-3.css','heritage-v13-5.css','heritage-premium-v13-6.css','omerta-v12.css','omerta-polish-v12.css','role-tree-polish-v12-29.css','omerta-v12-30.css','omerta-v12-40.css','terror-v12-40.css','dlc-suite-v12-40.css','live-cell-v12-44.css','dlc-profile-ui-v12-44.css','dlc-invites-v12-45.css','dlc-copy-v12-46.css',
 'app-v11.js','qa-fixes-v12.js','investigation-sheet-v12.js','video-v12-3.js','turn-v12-4.js','profile-dossier-v12.js','playstore-ready-v12.js','social-v12.js','notifications-v12.js','native-lifecycle-v12.js','runtime-optimization-v12.js','gameplay-simple-v12.js','apple-ui-stability-v12.js','gameplay-clean-v12.js',
 'scenario-flow-v13.js','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js','startup-stability-v13-3.js','heritage-v13-5.js','heritage-premium-v13-6.js','scenario-replay-contracts-v13.json',
 'i18n-en-v12.js','language-v12.js','rules-v12.js','locale-settings-v12.js','ui-polish-v12.js','locale-runtime-v12-23.js','omerta-v12.js','omerta-polish-v12.js','omerta-hotfix-v12.js','role-tree-polish-v12-29.js','omerta-v12-30.js','omerta-v12-39.js','terror-v12-37.js','dlc-suite-v12-37.js','live-cell-v12-44.js','dlc-profile-ui-v12-44.js','dlc-invites-v12-45.js','dlc-copy-v12-46.js','service-worker.js',
 'manifest.webmanifest','privacy.html','terms.html','delete-account.html','support.html'
];
async function exists(file){try{await stat(file);return true}catch{return false}}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});const searchableText=[];
for(const name of runtimeFiles){const src=path.join(root,name);if(!(await exists(src)))throw new Error(`Missing web runtime file: ${name}`);const dst=path.join(out,name);await mkdir(path.dirname(dst),{recursive:true});await cp(src,dst,{recursive:true});searchableText.push(await readFile(src,'utf8'))}

const premiumHead=[
 '  <link rel="stylesheet" href="startup-stability-v13-3.css?v=v13.6-heritage-premium">',
 '  <link rel="stylesheet" href="heritage-v13-5.css?v=v13.6-heritage-premium">',
 '  <link rel="stylesheet" href="heritage-premium-v13-6.css?v=v13.6-heritage-premium">'
].join('\n');
const premiumScripts=[
 '  <script src="startup-stability-v13-3.js?v=v13.6-heritage-premium"></script>',
 '  <script src="heritage-v13-5.js?v=v13.6-heritage-premium"></script>',
 '  <script src="heritage-premium-v13-6.js?v=v13.6-heritage-premium"></script>'
].join('\n');
for(const page of ['index.html','en.html']){
  const target=path.join(out,page);let html=await readFile(target,'utf8');
  if(!html.includes('heritage-premium-v13-6.css'))html=html.replace('</head>',`${premiumHead}\n</head>`);
  if(!html.includes('heritage-premium-v13-6.js'))html=html.replace('</body>',`${premiumScripts}\n</body>`);
  await writeFile(target,html,'utf8');
}

const assetRefs=new Set();for(const text of searchableText)for(const match of text.matchAll(/assets\/[A-Za-z0-9._\/-]+/g))assetRefs.add(match[0]);let assetBytes=0;
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
console.log(`Inside Grey Room web bundle ready: ${out}`);console.log(`Runtime files: ${runtimeFiles.length} · assets: ${assetRefs.size} · ${(assetBytes/1024/1024).toFixed(2)} MiB assets`);
