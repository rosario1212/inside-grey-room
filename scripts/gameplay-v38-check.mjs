import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=process.cwd();
const runtime='gameplay-state-fix-v38.js';
const version='v38-gameplay-ui-state';
const cache='igr-v38-gameplay-ui-state';
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const exists=async p=>{try{await stat(p);return true}catch{return false}};
const read=rel=>readFile(path.join(root,rel),'utf8');

const parsed=spawnSync(process.execPath,['--check',path.join(root,runtime)],{encoding:'utf8'});
ok(parsed.status===0,`${runtime}: syntax check failed: ${parsed.stderr||parsed.stdout}`);
const source=await read(runtime);
ok(source.includes("const CORE=new Set(Array.from({length:34}"),'v38 must cover dossiers 001–034');
ok(source.includes("s.includes('fais reconnaitre exactement ce que tu as fait')"),'legacy generic suspect objective guard missing');
ok(source.includes("label==='ce que tu gardes pour toi'"),'investigator private-card cleanup missing');
ok(source.includes("event_select:['CHOIX DE L’ÉVÉNEMENT'"),'event-select human label missing');
ok(source.includes("const v=room()?.state?.event_options"),'event-select must use authoritative room.state.event_options');
ok(source.includes("b.id='igrGameSettings'"),'in-game Settings control missing');

for(const dir of ['dist','www']){
  if(!(await exists(path.join(root,dir))))continue;
  const languagePath=path.join(root,dir,'language-v12.js');
  const v39Applied=await exists(languagePath) && (await readFile(languagePath,'utf8')).includes('IGR_AUTHORITATIVE_V39');
  if(v39Applied){
    // v39 deliberately removes the additive v37/v38 script tags and takes over
    // through the established language-v12.js path. A postinstall-generated dist
    // can therefore coexist with a www bundle that is still at the v38 stage.
    const appPath=path.join(root,dir,'app-v11.js');
    if(await exists(appPath))ok((await readFile(appPath,'utf8')).includes('/service-worker.js?v=v39-authoritative-ui'),`${dir}/app-v11.js: v39 service-worker registration missing`);
    const swPath=path.join(root,dir,'service-worker.js');
    if(await exists(swPath))ok((await readFile(swPath,'utf8')).includes("const CACHE='igr-v39-authoritative-ui';"),`${dir}/service-worker.js: v39 cache namespace missing`);
    continue;
  }
  for(const page of ['index.html','en.html']){
    const p=path.join(root,dir,page);if(!(await exists(p)))continue;
    const html=await readFile(p,'utf8');
    const ref=`${runtime}?v=${version}`;
    ok(html.includes(ref),`${dir}/${page}: missing v38 runtime`);
    ok((html.match(new RegExp(runtime.replaceAll('.','\\.'),'g'))||[]).length===1,`${dir}/${page}: v38 runtime must appear exactly once`);
    const lastScript=html.lastIndexOf('<script');
    ok(lastScript>=0&&html.slice(lastScript).includes(runtime),`${dir}/${page}: v38 must be the final runtime script`);
  }
  const sw=path.join(root,dir,'service-worker.js');
  if(await exists(sw)){
    const text=await readFile(sw,'utf8');
    ok(text.includes(`const CACHE='${cache}';`),`${dir}/service-worker.js: v38 cache namespace missing`);
    ok(text.includes(`/${runtime}?v=${version}`),`${dir}/service-worker.js: v38 runtime missing from shell cache`);
    ok(text.includes('self.skipWaiting()'),`${dir}/service-worker.js: skipWaiting missing`);
    ok(text.includes('self.clients.claim()'),`${dir}/service-worker.js: clients.claim missing`);
  }
}

if(failures.length){console.error('\nGameplay v38 check FAILED:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gameplay v38 check passed.');
