import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(root,process.argv[2]||'dist');
const posterRuntime=[
 'heritage-maitre-poster-1-c1-v34-6.js','heritage-maitre-poster-1-c2-v34-6.js','heritage-maitre-poster-1-c3-v34-6.js',
 'heritage-maitre-poster-2-c1-v34-6.js','heritage-maitre-poster-2-c2-v34-6.js','heritage-maitre-poster-2-c3-v34-6.js',
 'heritage-maitre-poster-3-c1-v34-6.js','heritage-maitre-poster-3-c2-v34-6.js',
 'heritage-maitre-poster-4-c1-v34-6.js','heritage-maitre-poster-4-c2-v34-6.js',
 'heritage-maitre-poster-5-c1-v34-6.js','heritage-maitre-poster-5-c2-v34-6.js'
];
const runtime=[
 'heritage-maitre-data-v34.js',...posterRuntime,'heritage-maitre-assets-v34.js',
 'heritage-maitre-v34.css','heritage-maitre-judicial-v34.css','heritage-maitre-polish-v34.css',
 'heritage-maitre-v34.js','heritage-maitre-online-v34-4.js','heritage-maitre-polish-v34.js','heritage-maitre-mobile-v34-5.js'
];
const fallbackPosters=['heritage-maitre-01-le-client-v34-4.svg','heritage-maitre-02-le-deal-v34-4.svg','heritage-maitre-03-deux-choix-v34-4.svg','heritage-maitre-04-le-proces-v34-4.svg','heritage-maitre-05-l-honneur-v34-4.svg'];
async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(out)))throw new Error(`MAÎTRE target does not exist: ${out}`);
for(const name of runtime){const src=path.join(root,name);if(!(await exists(src)))throw new Error(`Missing MAÎTRE runtime: ${name}`);await cp(src,path.join(out,name));}
const assetDir=path.join(out,'assets');await mkdir(assetDir,{recursive:true});
for(const name of fallbackPosters){const src=path.join(root,'assets',name);if(await exists(src))await cp(src,path.join(assetDir,name));}

const v='v34.6-final-posters';
const css=`  <link rel="stylesheet" href="heritage-maitre-v34.css?v=${v}">`;
const judicialCss=`  <link rel="stylesheet" href="heritage-maitre-judicial-v34.css?v=${v}">`;
const polishCss=`  <link rel="stylesheet" href="heritage-maitre-polish-v34.css?v=${v}">`;
const dataTag=`  <script src="heritage-maitre-data-v34.js?v=${v}"></script>`;
const posterTags=posterRuntime.map(name=>`  <script src="${name}?v=${v}"></script>`).join('\n');
const assetsTag=`  <script src="heritage-maitre-assets-v34.js?v=${v}"></script>`;
const js=`  <script src="heritage-maitre-v34.js?v=${v}"></script>`;
const online=`  <script src="heritage-maitre-online-v34-4.js?v=${v}"></script>`;
const polish=`  <script src="heritage-maitre-polish-v34.js?v=${v}"></script>`;
const mobile=`  <script src="heritage-maitre-mobile-v34-5.js?v=${v}"></script>`;

for(const page of ['index.html','en.html']){
 const file=path.join(out,page);let html=await readFile(file,'utf8');
 if(!html.includes('heritage-maitre-v34.css'))html=html.replace('</head>',`${css}\n${judicialCss}\n${polishCss}\n</head>`);
 else {
  if(!html.includes('heritage-maitre-judicial-v34.css'))html=html.replace('</head>',`${judicialCss}\n</head>`);
  if(!html.includes('heritage-maitre-polish-v34.css'))html=html.replace('</head>',`${polishCss}\n</head>`);
 }
 // Remove older MAÎTRE poster-data injections so the final approved artwork loads exactly once and before the asset mapper.
 html=html.replace(/^\s*<script[^>]+heritage-maitre-poster-[^>]+><\/script>\s*$/gm,'');
 if(!html.includes('heritage-maitre-data-v34.js')){
  html=html.replace('</body>',`${dataTag}\n${posterTags}\n${assetsTag}\n${js}\n${online}\n${polish}\n${mobile}\n</body>`);
 } else {
  if(html.includes('heritage-maitre-assets-v34.js'))html=html.replace(/(<script[^>]+heritage-maitre-assets-v34\.js[^>]*><\/script>)/,`${posterTags}\n$1`);
  else html=html.replace(/(<script[^>]+heritage-maitre-v34\.js[^>]*><\/script>)/,`${posterTags}\n${assetsTag}\n$1`);
  if(!html.includes('heritage-maitre-v34.js'))html=html.replace('</body>',`${js}\n</body>`);
  if(!html.includes('heritage-maitre-online-v34-4.js'))html=html.replace(/(<script[^>]+heritage-maitre-polish-v34\.js[^>]*><\/script>)/,`${online}\n$1`);
  if(!html.includes('heritage-maitre-polish-v34.js'))html=html.replace('</body>',`${polish}\n</body>`);
  if(!html.includes('heritage-maitre-mobile-v34-5.js'))html=html.replace('</body>',`${mobile}\n</body>`);
 }
 await writeFile(file,html,'utf8');
}
console.log(`HÉRITAGE — MAÎTRE v34.6 applied to ${out}: final approved posters embedded, mobile safe areas and online lobby fixes preserved`);
