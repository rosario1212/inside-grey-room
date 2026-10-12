import {copyFile,readFile,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v71-heritage-release',CACHE='igr-v71-heritage-release',pages=['index.html','en.html'];
const bump=['heritage-play-v13-7.js','play-modes-v13-8.js','heritage-maitre-data-v34.js','heritage-maitre-v34.js','heritage-maitre-online-v34-4.js','heritage-audit-v55.js','heritage-context-v71.js'];
const exists=async p=>{try{await stat(p);return true}catch{return false}};
const escapeRe=s=>String(s).replace(/[.*+?^$()|[\]\\]/g,'\\$&');
if(!(await exists(path.join(root,'heritage-context-v71.js'))))throw new Error('v71 context source missing');
if(!(await exists(path.join(target,'heritage-context-v71.js'))))await copyFile(path.join(root,'heritage-context-v71.js'),path.join(target,'heritage-context-v71.js'));
for(const name of pages){
 const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');
 for(const asset of bump){
   const safe=escapeRe(asset),re=new RegExp('(<script[^>]+src=["\\\']'+safe+')(?:\\?[^"\\\']*)?(["\\\'][^>]*><\\/script>)','gi');
   html=html.replace(re,'$1?v='+VERSION+'$2');
 }
 if(!html.includes('heritage-context-v71.js')){
   html=html.replace(/(<script[^>]+src=["']play-modes-v13-8\.js[^>]*><\/script>)/i,'  <script src="heritage-context-v71.js?v='+VERSION+'"></script>\n$1');
 }
 await writeFile(file,html,'utf8');
}
const app=path.join(target,'app-v11.js');if(await exists(app)){let s=await readFile(app,'utf8');s=s.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+VERSION);await writeFile(app,s,'utf8')}
const swp=path.join(target,'service-worker.js');
if(await exists(swp)){
 let sw=await readFile(swp,'utf8');sw=sw.replace(/const CACHE='[^']+';/,"const CACHE='"+CACHE+"';");
 for(const asset of bump){
   const safe=escapeRe(asset),re=new RegExp('/'+safe+'\\?v=[^\\\'"]+','g');sw=sw.replace(re,'/'+asset+'?v='+VERSION);
 }
 if(!sw.includes('/heritage-context-v71.js?v='+VERSION))sw=sw.replace("  '/', '/index.html', '/en.html',","  '/', '/index.html', '/en.html',\n  '/heritage-context-v71.js?v="+VERSION+"',");
 await writeFile(swp,sw,'utf8');
}
console.log('Inside Grey Room '+VERSION+': HÉRITAGE gameplay release layer applied to '+target);
