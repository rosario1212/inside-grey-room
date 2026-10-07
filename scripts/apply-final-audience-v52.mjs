import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.resolve(root,process.argv[2]||'dist');
const VERSION='v52-final-audience',CACHE='igr-v52-final-audience',runtimeName='final-audience-v52.js';
const source=path.join(root,runtimeName),dest=path.join(target,runtimeName),appTarget=path.join(target,'app-v11.js'),swTarget=path.join(target,'service-worker.js'),pages=['index.html','en.html'];
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const required=(text,from,to,label)=>{const next=text.replace(from,to);if(next===text)throw new Error(`v52 patch target missing: ${label}`);return next};
if(!(await exists(target))||!(await exists(source)))throw new Error('v52 target/runtime missing');
const parsed=spawnSync(process.execPath,['--check',source],{encoding:'utf8'});if(parsed.status!==0)throw new Error(parsed.stderr||parsed.stdout);
await copyFile(source,dest);
if(await exists(appTarget)){
 let app=await readFile(appTarget,'utf8');
 if(app.includes('3 · centrale'))app=required(app,"<option value=\"0\">0 · aucune responsabilité</option><option value=\"1\">1 · secondaire / indirecte</option><option value=\"2\">2 · importante</option><option value=\"3\">3 · centrale</option>","<option value=\"0\">0 · aucune responsabilité</option><option value=\"1\">1 · responsabilité secondaire</option><option value=\"2\">2 · responsabilité principale</option>",'0..2 levels form');
 if(app.includes("3:'Centrale'"))app=required(app,"function responsibilityLabel(level){return ({0:'Aucune responsabilité',1:'Secondaire / indirecte',2:'Importante',3:'Centrale'})[+level]||'Non renseignée'}","function responsibilityLabel(level){return ({0:'Aucune responsabilité',1:'Responsabilité secondaire',2:'Responsabilité principale'})[+level]||'Non renseignée'}",'responsibility labels');
 app=app.replace(/\$\{x\.truth_level\}\/3/g,'${x.truth_level}/2').replace(/\$\{x\.enqueteur_level\}\/3/g,'${x.enqueteur_level}/2').replace(/niveau 0–3/g,'niveau 0–2');
 app=app.replace("closed:'ENQUÊTE CLOSE',provisional_orals:","closed:'ENQUÊTE CLOSE',final_audience:'AUDIENCE FINALE',final_suspect_defenses:'DÉFENSES FINALES',provisional_orals:");
 app=app.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${VERSION}`);
 await writeFile(appTarget,app,'utf8');
}
for(const name of pages){const file=path.join(target,name);if(!(await exists(file)))continue;let html=await readFile(file,'utf8');html=html.replace(/\s*<script[^>]+src=["']final-audience-v52\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');html=html.replace('</body>',`  <script src="${runtimeName}?v=${VERSION}"></script>\n</body>`);await writeFile(file,html,'utf8')}
if(await exists(swTarget)){let sw=await readFile(swTarget,'utf8');sw=sw.replace(/const CACHE='[^']+';/,`const CACHE='${CACHE}';`);sw=sw.replace(/^\s*['"]\/final-audience-v52\.js\?v=[^'"]+['"],?\s*$/gmi,'');sw=sw.replace("  '/', '/index.html', '/en.html',",`  '/', '/index.html', '/en.html',\n  '/${runtimeName}?v=${VERSION}',`);await writeFile(swTarget,sw,'utf8')}
for(const name of pages){const file=path.join(target,name);if(!(await exists(file)))continue;const html=await readFile(file,'utf8');const v51=html.lastIndexOf('self-guided-rules-v51.js'),v52=html.lastIndexOf(`${runtimeName}?v=${VERSION}`);if(v51<0||v52<0||v51>=v52)throw new Error(`${name}: expected v52 after v51`);const after=html.slice(v52+`${runtimeName}?v=${VERSION}`.length);if(/<script[^>]+src=/i.test(after))throw new Error(`${name}: v52 must be last external script`)}
console.log(`Inside Grey Room ${VERSION}: final audience applied to ${process.argv[2]||'dist'}`);
