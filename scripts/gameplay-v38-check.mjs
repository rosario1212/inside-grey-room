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

  // v42 may already have finalized dist during npm postinstall while mobile:build
  // is still validating www at the earlier v38 stage. Accept that intentional split.
  const v42Path=path.join(root,dir,'investigation-runtime-v42.js');
  if(await exists(v42Path)){
    const v42=await readFile(v42Path,'utf8');
    if(v42.includes('IGR_INVESTIGATION_V42')){
      for(const page of ['index.html','en.html']){
        const p=path.join(root,dir,page);if(!(await exists(p)))continue;
        const html=await readFile(p,'utf8');
        ok(html.includes('authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/${page}: v41 base runtime reference missing under v42`);
        ok(html.includes('investigation-runtime-v42.js?v=v42-investigation-ui'),`${dir}/${page}: v42 runtime reference missing`);
        ok(!html.includes('gameplay-state-fix-v38.js'),`${dir}/${page}: v38 tag should be removed after v42 finalization`);
        const lastScript=html.lastIndexOf('<script');
        ok(lastScript>=0&&html.slice(lastScript).includes('investigation-runtime-v42.js'),`${dir}/${page}: v42 must be the final runtime script`);
      }
      const appPath=path.join(root,dir,'app-v11.js');
      if(await exists(appPath))ok((await readFile(appPath,'utf8')).includes('/service-worker.js?v=v42-investigation-ui'),`${dir}/app-v11.js: v42 service-worker registration missing`);
      const swPath=path.join(root,dir,'service-worker.js');
      if(await exists(swPath)){
        const swText=await readFile(swPath,'utf8');
        ok(swText.includes("const CACHE='igr-v42-investigation-ui';"),`${dir}/service-worker.js: v42 cache namespace missing`);
        ok(swText.includes('/authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/service-worker.js: v41 base runtime missing from shell cache`);
        ok(swText.includes('/investigation-runtime-v42.js?v=v42-investigation-ui'),`${dir}/service-worker.js: v42 runtime missing from shell cache`);
      }
      continue;
    }
  }

  // v41 is the consolidated authoritative owner before v42 is layered on top.
  const v41Path=path.join(root,dir,'authoritative-runtime-v41.js');
  if(await exists(v41Path)){
    const v41=await readFile(v41Path,'utf8');
    if(v41.includes('IGR_AUTHORITATIVE_V41')){
      for(const page of ['index.html','en.html']){
        const p=path.join(root,dir,page);if(!(await exists(p)))continue;
        const html=await readFile(p,'utf8');
        ok(html.includes('authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/${page}: v41 runtime reference missing`);
        ok(!html.includes('gameplay-state-fix-v38.js'),`${dir}/${page}: v38 tag should be removed after v41 finalization`);
      }
      const appPath=path.join(root,dir,'app-v11.js');
      if(await exists(appPath))ok((await readFile(appPath,'utf8')).includes('/service-worker.js?v=v41-authoritative-ui'),`${dir}/app-v11.js: v41 service-worker registration missing`);
      const swPath=path.join(root,dir,'service-worker.js');
      if(await exists(swPath)){
        const swText=await readFile(swPath,'utf8');
        ok(swText.includes("const CACHE='igr-v41-authoritative-ui';"),`${dir}/service-worker.js: v41 cache namespace missing`);
        ok(swText.includes('/authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/service-worker.js: v41 runtime missing from shell cache`);
      }
      continue;
    }
  }

  const languagePath=path.join(root,dir,'language-v12.js');
  const v39Applied=await exists(languagePath) && (await readFile(languagePath,'utf8')).includes('IGR_AUTHORITATIVE_V39');
  if(v39Applied){
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
console.log('Gameplay v38 compatibility check passed.');
