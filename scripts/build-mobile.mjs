import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'www');

// Web/PWA playtests may keep the private DLC invite workflow. Native store
// builds must not ship a code/key based premium-unlock mechanism. Premium
// ownership may still be granted server-side to pre-authorized testers, and
// the future StoreKit / Google Play Billing adapter can grant the same access.
const legacyStoreExcluded=new Set(['dlc-invites-v12-45.js','dlc-invites-v12-45.css']);

const files=[
 'index.html','en.html','styles-v11.css','polish-v12.css','ui-polish-v12.css','gameplay-flow-v13.css','dlc-experience-v13.css','lobby-ui-fix-v13.css','startup-stability-v13-3.css','heritage-v13-5.css','heritage-premium-v13-6.css','heritage-play-v13-7.css','play-modes-v13-8.css','omerta-v12.css','omerta-polish-v12.css','role-tree-polish-v12-29.css','omerta-v12-30.css','omerta-v12-40.css','terror-v12-40.css','dlc-suite-v12-40.css','live-cell-v12-44.css','dlc-profile-ui-v12-44.css','dlc-copy-v12-46.css',
 'app-v11.js','qa-fixes-v12.js','investigation-sheet-v12.js','video-v12-3.js','turn-v12-4.js','profile-dossier-v12.js','playstore-ready-v12.js','social-v12.js','notifications-v12.js','native-lifecycle-v12.js','runtime-optimization-v12.js','gameplay-simple-v12.js','apple-ui-stability-v12.js','gameplay-clean-v12.js',
 'scenario-flow-v13.js','gameplay-flow-v13.js','dlc-experience-v13.js','lobby-ui-fix-v13.js','startup-stability-v13-3.js','heritage-v13-5.js','heritage-premium-v13-6.js','heritage-play-v13-7.js','play-modes-v13-8.js','scenario-replay-contracts-v13.json',
 'i18n-en-v12.js','language-v12.js','rules-v12.js','locale-settings-v12.js','ui-polish-v12.js','locale-runtime-v12-23.js','omerta-v12.js','omerta-polish-v12.js','omerta-hotfix-v12.js','role-tree-polish-v12-29.js','omerta-v12-30.js','omerta-v12-39.js','terror-v12-37.js','dlc-suite-v12-37.js','live-cell-v12-44.js','dlc-profile-ui-v12-44.js','dlc-copy-v12-46.js','native-store-boundary-v14.js',
 'manifest.webmanifest','privacy.html','terms.html','delete-account.html','support.html'
];
async function exists(p){try{await stat(p);return true}catch{return false}}
const indexHtml=await readFile(path.join(root,'index.html'),'utf8'),declared=new Set(files);
for(const match of indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const raw=match[1];if(!raw||/^(?:https?:|data:|blob:|#)/i.test(raw))continue;
 let relative=raw.split(/[?#]/,1)[0];if(relative.startsWith('./'))relative=relative.slice(2);
 if(!relative||relative.startsWith('assets/')||legacyStoreExcluded.has(relative))continue;
 if(!declared.has(relative))throw new Error(`Mobile runtime list is out of sync with index.html: ${relative}`)
}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});const runtimeText=[];
for(const name of files){const src=path.join(root,name);if(!(await exists(src)))throw new Error(`Missing mobile runtime file: ${name}`);await cp(src,path.join(out,name),{recursive:true});runtimeText.push(await readFile(src,'utf8'))}

const premiumHead=[
 '  <link rel="stylesheet" href="startup-stability-v13-3.css?v=v13.8-dual-play">',
 '  <link rel="stylesheet" href="heritage-v13-5.css?v=v13.8-dual-play">',
 '  <link rel="stylesheet" href="heritage-premium-v13-6.css?v=v13.8-dual-play">',
 '  <link rel="stylesheet" href="heritage-play-v13-7.css?v=v13.8-dual-play">',
 '  <link rel="stylesheet" href="play-modes-v13-8.css?v=v13.8-dual-play">'
].join('\n');
const premiumScripts=[
 '  <script src="startup-stability-v13-3.js?v=v13.8-dual-play"></script>',
 '  <script src="heritage-v13-5.js?v=v13.8-dual-play"></script>',
 '  <script src="heritage-premium-v13-6.js?v=v13.8-dual-play"></script>',
 '  <script src="heritage-play-v13-7.js?v=v13.8-dual-play"></script>',
 '  <script src="play-modes-v13-8.js?v=v13.8-dual-play"></script>'
].join('\n');
const storeBoundary='  <script src="native-store-boundary-v14.js?v=v14-store-boundary"></script>';
const legacyTagPatterns=[
 /\s*<link[^>]+href=["']dlc-invites-v12-45\.css[^"']*["'][^>]*>\s*/gi,
 /\s*<script[^>]+src=["']dlc-invites-v12-45\.js[^"']*["'][^>]*><\/script>\s*/gi
];
for(const page of ['index.html','en.html']){
  const target=path.join(out,page);let html=await readFile(target,'utf8');
  for(const pattern of legacyTagPatterns)html=html.replace(pattern,'\n');
  if(!html.includes('play-modes-v13-8.css'))html=html.replace('</head>',`${premiumHead}\n</head>`);
  if(!html.includes('play-modes-v13-8.js'))html=html.replace('</body>',`${premiumScripts}\n</body>`);
  if(!html.includes('native-store-boundary-v14.js'))html=html.replace('</body>',`${storeBoundary}\n</body>`);
  await writeFile(target,html,'utf8');
}

for(const excluded of legacyStoreExcluded){
  if(await exists(path.join(out,excluded)))throw new Error(`Legacy premium unlock file leaked into native store bundle: ${excluded}`);
}
for(const page of ['index.html','en.html']){
  const html=await readFile(path.join(out,page),'utf8');
  if(/dlc-invites-v12-45\.(?:js|css)/i.test(html))throw new Error(`${page}: legacy DLC code unlock reference leaked into native store bundle`);
  if(!html.includes('native-store-boundary-v14.js'))throw new Error(`${page}: native store commerce boundary missing`);
}

const assetRefs=new Set();for(const text of runtimeText)for(const match of text.matchAll(/assets\/[A-Za-z0-9._\/-]+/g))assetRefs.add(match[0]);let assetBytes=0;
for(const relative of [...assetRefs].sort()){const src=path.join(root,relative);if(!(await exists(src)))throw new Error(`Missing referenced mobile asset: ${relative}`);const dst=path.join(out,relative);await mkdir(path.dirname(dst),{recursive:true});await cp(src,dst);assetBytes+=(await stat(src)).size}
console.log(`Inside Grey Room mobile store bundle ready: ${out}`);console.log(`Runtime files: ${files.length} · assets: ${assetRefs.size} · ${(assetBytes/1024/1024).toFixed(2)} MiB assets · legacy code unlock excluded`);
