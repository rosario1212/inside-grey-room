import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist'),VERSION='v56-objective-dedupe',CACHE='igr-v56-objective-dedupe';
const runtime='objective-dedupe-v56.js',style='objective-dedupe-v56.css',pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
for(const n of [runtime,style])if(!(await exists(path.join(root,n))))throw new Error('v56 source missing: '+n);
const syntax=spawnSync(process.execPath,['--check',path.join(root,runtime)],{encoding:'utf8'});if(syntax.status!==0)throw new Error(syntax.stderr||syntax.stdout);
await copyFile(path.join(root,runtime),path.join(target,runtime));await copyFile(path.join(root,style),path.join(target,style));
const bump=['gameplay-flow-v13.js','judicial-runtime-v44.js','prosecutor-runtime-v47.js','omerta-v12.js','omerta-polish-v12.js','heritage-play-v13-7.js'];
for(const name of pages){
 const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');
 for(const asset of bump){
  const safe=asset.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const re=new RegExp('(<script[^>]+src=["\\\']'+safe+')(?:\\?[^"\\\']*)?(["\\\'][^>]*><\\/script>)','gi');
  html=html.replace(re,'$1?v='+VERSION+'$2');
 }
 html=html.replace(/\s*<link[^>]+href=["']objective-dedupe-v56\.css[^"']*["'][^>]*>\s*/gi,'\n').replace('</head>','  <link rel="stylesheet" href="'+style+'?v='+VERSION+'">\n</head>');
 html=html.replace(/\s*<script[^>]+src=["']objective-dedupe-v56\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n').replace('</body>','  <script src="'+runtime+'?v='+VERSION+'"></script>\n</body>');
 await writeFile(file,html,'utf8');
}
const app=path.join(target,'app-v11.js');if(await exists(app)){let s=await readFile(app,'utf8');s=s.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+VERSION);await writeFile(app,s,'utf8')}
const swp=path.join(target,'service-worker.js');if(await exists(swp)){let sw=await readFile(swp,'utf8');sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='"+CACHE+"';");if(!sw.includes('/'+runtime+'?v='+VERSION))sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/"+runtime+"?v="+VERSION+"','/"+style+"?v="+VERSION+"',");await writeFile(swp,sw,'utf8')}
console.log('Inside Grey Room '+VERSION+': objective dedupe + Heritage thumbnails applied to '+(process.argv[2]||'dist'));