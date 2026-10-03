import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.resolve(root,process.argv[2]||'dist');
const runtime=['heritage-maitre-data-v34.js','heritage-maitre-assets-v34.js','heritage-maitre-v34.css','heritage-maitre-judicial-v34.css','heritage-maitre-polish-v34.css','heritage-maitre-ui-v34-8.css','heritage-maitre-v34.js','heritage-maitre-online-v34-4.js','heritage-maitre-polish-v34.js','heritage-maitre-mobile-v34-5.js'];
const posters=['heritage-maitre-01-le-client-final.webp','heritage-maitre-02-le-deal-final.webp','heritage-maitre-03-deux-choix-final.webp','heritage-maitre-04-le-proces-final.webp','heritage-maitre-05-l-honneur-final.webp'];
async function exists(file){try{await stat(file);return true}catch{return false}}
if(!(await exists(out)))throw new Error(`MAÎTRE target does not exist: ${out}`);
for(const name of runtime){const src=path.join(root,name);if(!(await exists(src)))throw new Error(`Missing MAÎTRE runtime: ${name}`);await cp(src,path.join(out,name));}
const assetDir=path.join(out,'assets');await mkdir(assetDir,{recursive:true});
for(const name of posters){const src=path.join(root,'assets',name);if(!(await exists(src)))throw new Error(`Missing MAÎTRE final poster: ${name}`);await cp(src,path.join(assetDir,name));}
const v='v34.8-maitre-ui';
const css=`  <link rel="stylesheet" href="heritage-maitre-v34.css?v=${v}">`,judicialCss=`  <link rel="stylesheet" href="heritage-maitre-judicial-v34.css?v=${v}">`,polishCss=`  <link rel="stylesheet" href="heritage-maitre-polish-v34.css?v=${v}">`,uiCss=`  <link rel="stylesheet" href="heritage-maitre-ui-v34-8.css?v=${v}">`;
const dataTag=`  <script src="heritage-maitre-data-v34.js?v=${v}"></script>`,assetsTag=`  <script src="heritage-maitre-assets-v34.js?v=${v}"></script>`,js=`  <script src="heritage-maitre-v34.js?v=${v}"></script>`,online=`  <script src="heritage-maitre-online-v34-4.js?v=${v}"></script>`,polish=`  <script src="heritage-maitre-polish-v34.js?v=${v}"></script>`,mobile=`  <script src="heritage-maitre-mobile-v34-5.js?v=${v}"></script>`;
for(const page of ['index.html','en.html']){const file=path.join(out,page);let html=await readFile(file,'utf8');
 if(!html.includes('heritage-maitre-v34.css'))html=html.replace('</head>',`${css}\n${judicialCss}\n${polishCss}\n${uiCss}\n</head>`);else{if(!html.includes('heritage-maitre-judicial-v34.css'))html=html.replace('</head>',`${judicialCss}\n</head>`);if(!html.includes('heritage-maitre-polish-v34.css'))html=html.replace('</head>',`${polishCss}\n</head>`);if(!html.includes('heritage-maitre-ui-v34-8.css'))html=html.replace('</head>',`${uiCss}\n</head>`);}
 if(!html.includes('heritage-maitre-data-v34.js'))html=html.replace('</body>',`${dataTag}\n${assetsTag}\n${js}\n${online}\n${polish}\n${mobile}\n</body>`);else{if(!html.includes('heritage-maitre-assets-v34.js'))html=html.replace(/(<script[^>]+heritage-maitre-v34\.js[^>]*><\/script>)/,`${assetsTag}\n$1`);if(!html.includes('heritage-maitre-v34.js'))html=html.replace('</body>',`${js}\n</body>`);if(!html.includes('heritage-maitre-online-v34-4.js'))html=html.replace(/(<script[^>]+heritage-maitre-polish-v34\.js[^>]*><\/script>)/,`${online}\n$1`);if(!html.includes('heritage-maitre-polish-v34.js'))html=html.replace('</body>',`${polish}\n</body>`);if(!html.includes('heritage-maitre-mobile-v34-5.js'))html=html.replace('</body>',`${mobile}\n</body>`);}
 await writeFile(file,html,'utf8');}
console.log(`HÉRITAGE — MAÎTRE v34.8 applied to ${out}: approved posters + full-frame mobile UI + matched multiplayer palette`);
