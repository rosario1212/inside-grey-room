import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const target=path.resolve(root,process.argv[2]||'dist');
const sourceFile=path.join(root,'investigation-elements-v42.js');
const exists=async f=>{try{await stat(f);return true}catch{return false}};
const fail=msg=>{throw new Error(`v42 investigation check failed: ${msg}`)};

const source=await readFile(sourceFile,'utf8');
for(let i=1;i<=34;i++){
  const id=String(i).padStart(3,'0');
  if(!source.includes(`'${id}':`))fail(`missing scenario guide ${id}`);
}
if((source.match(/data-context-card=\\"1\\"/g)||[]).length!==1)fail('context card 1 template missing or duplicated');
if((source.match(/data-context-card=\\"2\\"/g)||[]).length!==1)fail('context card 2 template missing or duplicated');
if(source.includes('data-context-card=\\"3\\"'))fail('a third opening context card is present');
for(const marker of [
  "label:isEn()?'Case evidence':'Éléments d’enquête'",
  "ps.objective_main||ps.position",
  "card.insertBefore(objective,foot)",
  "OPERATIONAL.has(type)",
  "renderInvestigationElements",
  "IGR_INVESTIGATION_V42"
]) if(!source.includes(marker)) fail(`missing source marker: ${marker}`);

if(await exists(target)){
  const runtime=path.join(target,'investigation-elements-v42.js');
  if(!(await exists(runtime)))fail(`${path.basename(target)} is missing investigation-elements-v42.js`);
  for(const name of ['index.html','en.html']){
    const file=path.join(target,name);if(!(await exists(file)))continue;
    const html=await readFile(file,'utf8');
    const v41=html.lastIndexOf('authoritative-runtime-v41.js');
    const v42=html.lastIndexOf('investigation-elements-v42.js?v=v42-investigation-elements');
    if(v41<0)fail(`${name} is missing v41`);
    if(v42<0)fail(`${name} is missing v42`);
    if(v42<v41)fail(`${name} loads v42 before v41`);
    if(/<script[^>]+src=/i.test(html.slice(v42+'investigation-elements-v42.js?v=v42-investigation-elements'.length)))fail(`${name}: v42 is not last external script`);
  }
  const appFile=path.join(target,'app-v11.js');
  if(await exists(appFile)){
    const app=await readFile(appFile,'utf8');
    if(!app.includes('/service-worker.js?v=v42-investigation-elements'))fail('service worker registration is not versioned for v42');
  }
  const swFile=path.join(target,'service-worker.js');
  if(await exists(swFile)){
    const sw=await readFile(swFile,'utf8');
    if(!sw.includes("const CACHE='igr-v42-investigation-elements';"))fail('service worker cache is not v42');
    if(!sw.includes('/investigation-elements-v42.js?v=v42-investigation-elements'))fail('service worker does not precache v42 runtime');
  }
}

console.log('Inside Grey Room v42 investigation elements checks passed: 34 scenario guides, two opening cards, progressive evidence, objective-at-bottom contract.');
