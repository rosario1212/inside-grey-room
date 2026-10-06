import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist');
const version='v63-entrance-harmony';
const assets=['startup-stability-v13-3.css','app-v11.js','playstore-ready-v12.js','duration-modes-v35.js','final-audience-v52.js','self-guided-rules-v51.js','judicial-runtime-v44.js','duration-modes-v35.css','natural-role-gameplay-v50.js'];
for(const page of ['index.html','en.html']){
 const file=path.join(target,page);let s=await readFile(file,'utf8');
 for(const asset of assets)s=s.replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\'<> ]+','g'),asset+'?v='+version);
 const english=page==='en.html';
 if(!s.includes('class="intro-title"'))s=s.replace('<img class="intro-art"', '<h1 class="intro-title"><span>INSIDE</span><span>GREY ROOM</span></h1>\n    <img class="intro-art"');
 s=s.replace('</body>',`<footer class="igr-beta-footer" aria-label="${english?'Beta information':'Informations bêta'}"><span>Inside Grey Room · Bêta 12.11.0</span><a href="support.html" target="_blank" rel="noopener">${english?'Report a problem':'Signaler un problème'}</a></footer><style>.igr-beta-footer{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;padding:20px 16px calc(20px + env(safe-area-inset-bottom));font-size:13px;color:#b6bec5}.igr-beta-footer a{display:inline-flex;align-items:center;min-height:44px;color:#eef1f3}.game-tabs button,.modal-actions button{min-height:44px}@media(max-width:640px){.store-inline-fields input,.field input,.field textarea,.field select{font-size:16px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}</style></body>`);
 await writeFile(file,s);
}
try{const file=path.join(target,'service-worker.js');let s=await readFile(file,'utf8');s=s.replace(/const CACHE='[^']+';/,`const CACHE='igr-${version}';`);for(const asset of assets){s=s.replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\'<> ]+','g'),asset+'?v='+version);if(!s.includes('/'+asset+'?v='+version))s=s.replace('const SHELL=[',`const SHELL=[\n  '/${asset}?v=${version}',`)}await writeFile(file,s)}catch(e){if(e.code!=='ENOENT')throw e}
const app=path.join(target,'app-v11.js');await writeFile(app,(await readFile(app,'utf8')).replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,'/service-worker.js?v='+version));
console.log('Mobile beta v60 assets and accessibility applied');
