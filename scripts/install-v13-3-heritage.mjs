import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const p=f=>path.join(root,f);
const exists=f=>fs.existsSync(p(f));
const read=f=>fs.readFileSync(p(f),'utf8');
const write=(f,s)=>fs.writeFileSync(p(f),s);
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};

const required=[
  'heritage-v13-3.js','heritage-v13-3.css','startup-stability-v13-3.js','startup-stability-v13-3.css',
  'assets/heritage-cendres-cover.webp','assets/heritage-kuroi-cover.webp'
];
for(const f of required)must(exists(f),`Fichier v13.3 absent: ${f}`);

function patchHtml(file){
  if(!exists(file))return {file,skipped:true};
  let html=read(file),changed=false;
  if(!html.includes('heritage-v13-3.css')){
    const anchor='<link rel="stylesheet" href="lobby-ui-fix-v13.css?v=v13.2-lobby-fix">';
    const tags='  <link rel="stylesheet" href="heritage-v13-3.css?v=v13.3-heritage">\n  <link rel="stylesheet" href="startup-stability-v13-3.css?v=v13.3-startup">';
    if(html.includes(anchor))html=html.replace(anchor,`${anchor}\n${tags}`);
    else {must(html.includes('</head>'),`${file}: </head> absent`);html=html.replace('</head>',`${tags}\n</head>`)}
    changed=true;
  }
  if(!html.includes('heritage-v13-3.js')){
    const anchor='<script src="lobby-ui-fix-v13.js?v=v13.2-lobby-fix"></script>';
    const tags='  <script src="heritage-v13-3.js?v=v13.3-heritage"></script>\n  <script src="startup-stability-v13-3.js?v=v13.3-startup"></script>';
    if(html.includes(anchor))html=html.replace(anchor,`${anchor}\n${tags}`);
    else {must(html.includes('</body>'),`${file}: </body> absent`);html=html.replace('</body>',`${tags}\n</body>`)}
    changed=true;
  }
  if(changed)write(file,html);
  return {file,changed};
}

const htmlResults=[patchHtml('index.html'),patchHtml('en.html')];

must(exists('service-worker.js'),'service-worker.js absent');
let sw=read('service-worker.js'),swChanged=false;
must(/const CACHE='igr-[^']+';/.test(sw),'CACHE service worker introuvable');
if(!sw.includes("const CACHE='igr-v13-3-heritage-startup';")){
  sw=sw.replace(/const CACHE='igr-[^']+';/,"const CACHE='igr-v13-3-heritage-startup';");swChanged=true;
}
const shellItems=[
  "'/heritage-v13-3.js?v=v13.3-heritage'",
  "'/heritage-v13-3.css?v=v13.3-heritage'",
  "'/startup-stability-v13-3.js?v=v13.3-startup'",
  "'/startup-stability-v13-3.css?v=v13.3-startup'",
  "'/assets/heritage-cendres-cover.webp?v=v13.3-heritage'",
  "'/assets/heritage-kuroi-cover.webp?v=v13.3-heritage'"
];
const missing=shellItems.filter(x=>!sw.includes(x));
if(missing.length){
  must(/const SHELL=\[([\s\S]*?)\];/.test(sw),'Tableau SHELL introuvable');
  sw=sw.replace(/const SHELL=\[([\s\S]*?)\];/,(_,inside)=>`const SHELL=[${inside.trimEnd()}${inside.trim().endsWith(',')?'':','}\n  ${missing.join(',')}\n];`);
  swChanged=true;
}
if(swChanged)write('service-worker.js',sw);

console.log('Inside Grey Room v13.3 HÉRITAGE installé.');
for(const r of htmlResults)console.log(`${r.file}: ${r.skipped?'absent / ignoré':r.changed?'mis à jour':'déjà à jour'}`);
console.log(`service-worker.js: ${swChanged?'mis à jour':'déjà à jour'}`);
console.log('Aucun fichier gameplay 001–034 ni DLC existant n’a été modifié.');
