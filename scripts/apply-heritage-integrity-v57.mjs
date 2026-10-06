import {copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),version='v57-heritage-integrity-ui3';
const scripts=['heritage-v13-5.js','heritage-play-v13-7.js','heritage-maitre-v34.js','heritage-maitre-data-v34.js','heritage-maitre-online-v34-4.js','heritage-audit-v55.js','play-modes-v13-8.js'];
for(const file of ['heritage-context-v57.js','heritage-integrity-v57.css'])await copyFile(path.join(root,file),path.join(target,file));
for(const page of ['index.html','en.html']){let html=await readFile(path.join(target,page),'utf8');for(const file of scripts){const re=new RegExp('('+file.replaceAll('.','\\.')+')(?:\\?[^"\']*)?(["\'])','g');html=html.replace(re,'$1?v='+version+'$2')}
html=html.replace('</head>','<link rel="stylesheet" href="heritage-integrity-v57.css?v='+version+'">\n</head>').replace('</body>','<script src="heritage-context-v57.js?v='+version+'"></script>\n</body>');await writeFile(path.join(target,page),html)}
const app=path.join(target,'app-v11.js');await writeFile(app,(await readFile(app,'utf8')).replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+version));
const sw=path.join(target,'service-worker.js');if(await stat(sw).then(()=>true,()=>false))await writeFile(sw,(await readFile(sw,'utf8')).replace(/const CACHE='[^']+';/,"const CACHE='igr-"+version+"';"));
console.log('HÉRITAGE v57: campaign integrity, online context and contemporary copy applied');
