import {readFile,writeFile,stat,copyFile} from 'node:fs/promises';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const VERSION='v74-entry-polish2';
const polish='screen-polish-v73.css';
const assets=['app-v11.js','startup-stability-v13-3.css','lobby-ui-fix-v13.js','lobby-ui-fix-v13.css','omerta-v12-30.js','omerta-v12-39.js','dlc-suite-v12-37.js','mobile-ui-v28.js','rules-v12.js','self-guided-rules-v51.js',polish];
const escapeRe=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Run after the existing gameplay/HÉRITAGE layers. Keep their generated code;
// only finalize the URLs and cache for the changed presentation and rules assets.
await copyFile(path.resolve(polish),path.join(target,polish));
for(const asset of assets)await stat(path.join(target,asset));
for(const page of ['index.html','en.html']){
  const file=path.join(target,page);
  let html=await readFile(file,'utf8');
  const redirect=page==='en.html'&&html.includes("location.replace('./')")&&!html.includes('app-v11.js');
  html=html.replace(/\s*<link[^>]+href=["']screen-polish-v73\.css[^"']*["'][^>]*>\s*/gi,'\n');
  if(!redirect)html=html.replace('</head>',`  <link rel="stylesheet" href="${polish}?v=${VERSION}">\n</head>`);
  for(const asset of assets){
    const re=new RegExp(escapeRe(asset)+'\\?v=[^"\'<> ]+','g');
    if(!re.test(html)&&!redirect)throw new Error(`${page}: missing lobby asset ${asset}`);
    html=html.replace(re,asset+'?v='+VERSION);
  }
  // The legacy bootstrap recognizes this ID. Reuse the versioned head stylesheet
  // instead of appending a second copy with the old runtime cache key.
  html=html.replace(/<link\b[^>]+href=["']startup-stability-v13-3\.css[^"']*["'][^>]*>/gi,tag=>tag.includes('id=')?tag:tag.replace('<link','<link id="igr-startup-stability-v13-3-css"'));
  if(!redirect){
    html=html.replace(/\s*<link[^>]+href=["']lobby-ui-fix-v13\.css[^"']*["'][^>]*>\s*/gi,'\n');
    html=html.replace(`  <link rel="stylesheet" href="${polish}`,`  <link rel="stylesheet" href="lobby-ui-fix-v13.css?v=${VERSION}">\n  <link rel="stylesheet" href="${polish}`);
  }
  await writeFile(file,html,'utf8');
}
const appFile=path.join(target,'app-v11.js');
const app=await readFile(appFile,'utf8');
await writeFile(appFile,app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+VERSION),'utf8');
const swFile=path.join(target,'service-worker.js');
try{
  let sw=await readFile(swFile,'utf8');
  sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='igr-${VERSION}';`);
  for(const asset of assets){
    sw=sw.replace(new RegExp('/'+escapeRe(asset)+'\\?v=[^"\']+','g'),'/'+asset+'?v='+VERSION);
    if(!sw.includes('/'+asset+'?v='+VERSION))sw=sw.replace('const SHELL=[',`const SHELL=[\n  '/${asset}?v=${VERSION}',`);
  }
  await writeFile(swFile,sw,'utf8');
}catch(error){if(error.code!=='ENOENT')throw error}
console.log(`Inside Grey Room ${VERSION}: entrance, home viewport, role-choice hierarchy and PWA cache finalized`);
