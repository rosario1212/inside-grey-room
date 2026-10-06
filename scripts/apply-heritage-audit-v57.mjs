import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v57-heritage-audit',CACHE='igr-v57-heritage-audit',style='heritage-audit-v57.css',pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
if(!(await exists(path.join(root,style))))throw new Error('v57 source missing: '+style);
await copyFile(path.join(root,style),path.join(target,style));
const bump=['heritage-v13-5.js','heritage-play-v13-7.js','play-modes-v13-8.js'];
for(const name of pages){
  const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');
  for(const asset of bump){
    const safe=asset.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
    const re=new RegExp('(<script[^>]+src=["\\\']'+safe+')(?:\\?[^"\\\']*)?(["\\\'][^>]*><\\/script>)','gi');
    html=html.replace(re,'$1?v='+VERSION+'$2');
  }
  html=html.replace(/\s*<link[^>]+href=["']heritage-audit-v57\.css[^"']*["'][^>]*>\s*/gi,'\n').replace('</head>','  <link rel="stylesheet" href="'+style+'?v='+VERSION+'">\n</head>');
  await writeFile(file,html,'utf8');
}
const app=path.join(target,'app-v11.js');if(await exists(app)){let s=await readFile(app,'utf8');s=s.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+VERSION);await writeFile(app,s,'utf8')}
const swp=path.join(target,'service-worker.js');if(await exists(swp)){
  let sw=await readFile(swp,'utf8');sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='"+CACHE+"';");
  for(const asset of bump){
    const safe=asset.replace(/[.*+?^$()|[\\]\\]/g,'\\\\const swp=path.join(target,'service-worker.js');if(await exists(swp)){
  let sw=await readFile(swp,'utf8');sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='"+CACHE+"';");
  if(!sw.includes('/'+style+'?v='+VERSION))sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/"+style+"?v="+VERSION+"',");
  await writeFile(swp,sw,'utf8');
}');
    const re=new RegExp('/'+safe+'\\?v=[^\\\'"]+','g');
    sw=sw.replace(re,'/'+asset+'?v='+VERSION);
  }
  if(!sw.includes('/'+style+'?v='+VERSION))sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/"+style+"?v="+VERSION+"',");
  await writeFile(swp,sw,'utf8');
}
console.log('Inside Grey Room '+VERSION+': HÉRITAGE MAÎTRE layout/colors + concrete CENDRES applied to '+(process.argv[2]||'dist'));