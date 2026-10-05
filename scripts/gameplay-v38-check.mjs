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
const requestedTarget=process.argv[2];
const dirs=requestedTarget?[requestedTarget]:['dist','www'];

const parsed=spawnSync(process.execPath,['--check',path.join(root,runtime)],{encoding:'utf8'});
ok(parsed.status===0,`${runtime}: syntax check failed: ${parsed.stderr||parsed.stdout}`);
const source=await read(runtime);
ok(source.includes("const CORE=new Set(Array.from({length:34}"),'v38 must cover dossiers 001–034');
ok(source.includes("s.includes('fais reconnaitre exactement ce que tu as fait')"),'legacy generic suspect objective guard missing');
ok(source.includes("label==='ce que tu gardes pour toi'"),'investigator private-card cleanup missing');
ok(source.includes("event_select:['CHOIX DE L’ÉVÉNEMENT'"),'event-select human label missing');
ok(source.includes("const v=room()?.state?.event_options"),'event-select must use authoritative room.state.event_options');
ok(source.includes("b.id='igrGameSettings'"),'in-game Settings control missing');

for(const dir of dirs){
  if(!(await exists(path.join(root,dir))))continue;

  // v43/v43.1 may already have finalized dist during npm postinstall while
  // mobile:build is validating www at an earlier layer. Treat the newest
  // finalized bundle as authoritative instead of incorrectly demanding v42 last.
  const v43Path=path.join(root,dir,'lawyer-runtime-v43.js');
  const v431Path=path.join(root,dir,'lawyer-reading-v43-1.js');
  if(await exists(v43Path) && await exists(v431Path)){
    const v43=await readFile(v43Path,'utf8');
    const v431=await readFile(v431Path,'utf8');
    if(v43.includes('v43-lawyer-one-client')&&v431.includes('v43.1-lawyer-reading')){
      for(const page of ['index.html','en.html']){
        const p=path.join(root,dir,page);if(!(await exists(p)))continue;
        const html=await readFile(p,'utf8');
        const v42Pos=html.lastIndexOf('investigation-audit-v42-1.js');
        const v43Pos=html.lastIndexOf('lawyer-runtime-v43.js?v=v43-lawyer-one-client');
        const v431Pos=html.lastIndexOf('lawyer-reading-v43-1.js?v=v43.1-lawyer-reading');
        ok(v42Pos>=0&&v43Pos>v42Pos&&v431Pos>v43Pos,`${dir}/${page}: expected v42 < v43 < v43.1 runtime order`);
        const lastScript=html.lastIndexOf('<script');
        ok(lastScript>=0&&html.slice(lastScript).includes('lawyer-reading-v43-1.js'),`${dir}/${page}: v43.1 lawyer reading bridge must be the final runtime script`);
        ok(!html.includes('gameplay-state-fix-v38.js'),`${dir}/${page}: v38 tag should be removed after v43 finalization`);
      }
      const appPath=path.join(root,dir,'app-v11.js');
      if(await exists(appPath)){
        const app=await readFile(appPath,'utf8');
        ok(app.includes('/service-worker.js?v=v43.1-lawyer-reading'),`${dir}/app-v11.js: v43.1 service-worker registration missing`);
      }
      const swPath=path.join(root,dir,'service-worker.js');
      if(await exists(swPath)){
        const swText=await readFile(swPath,'utf8');
        ok(swText.includes("const CACHE='igr-v43-1-lawyer-reading';"),`${dir}/service-worker.js: v43.1 cache namespace missing`);
        ok(swText.includes('/lawyer-runtime-v43.js?v=v43-lawyer-one-client'),`${dir}/service-worker.js: v43 lawyer runtime missing from shell cache`);
        ok(swText.includes('/lawyer-reading-v43-1.js?v=v43.1-lawyer-reading'),`${dir}/service-worker.js: v43.1 reading bridge missing from shell cache`);
      }
      continue;
    }
  }

  // v42/v42.1/v42.2/v42.3 may already have finalized dist during npm postinstall
  // while mobile:build is still validating www at the earlier v38 stage.
  const v42Path=path.join(root,dir,'investigation-runtime-v42.js');
  if(await exists(v42Path)){
    const v42=await readFile(v42Path,'utf8');
    if(v42.includes('IGR_INVESTIGATION_V42')){
      const chrome=v42.includes('IGR_V42_3_MOBILE_CHROME');
      const stable=v42.includes('IGR_V42_2_CELL_STABILITY');
      const v42Version=chrome?'v42.3-mobile-chrome':stable?'v42.2-cell-stability':'v42-investigation-ui';
      const v42Label=chrome?'v42.3':stable?'v42.2':'v42';
      const v42Ref=`investigation-runtime-v42.js?v=${v42Version}`;
      const auditPath=path.join(root,dir,'investigation-audit-v42-1.js');
      const hasAudit=await exists(auditPath) && (await readFile(auditPath,'utf8')).includes('IGR_INVESTIGATION_AUDIT_V42_1');
      for(const page of ['index.html','en.html']){
        const p=path.join(root,dir,page);if(!(await exists(p)))continue;
        const html=await readFile(p,'utf8');
        ok(html.includes('authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/${page}: v41 base runtime reference missing under v42`);
        ok(html.includes(v42Ref),`${dir}/${page}: ${v42Label} runtime reference missing`);
        ok(!html.includes('gameplay-state-fix-v38.js'),`${dir}/${page}: v38 tag should be removed after v42 finalization`);
        const lastScript=html.lastIndexOf('<script');
        if(hasAudit){
          ok(html.includes('investigation-audit-v42-1.js?v=v42.1-investigation-audit'),`${dir}/${page}: v42.1 audit runtime reference missing`);
          ok(lastScript>=0&&html.slice(lastScript).includes('investigation-audit-v42-1.js'),`${dir}/${page}: v42.1 audit must be the final runtime script`);
        }else{
          ok(lastScript>=0&&html.slice(lastScript).includes('investigation-runtime-v42.js'),`${dir}/${page}: v42 must be the final runtime script`);
        }
      }
      const appPath=path.join(root,dir,'app-v11.js');
      if(await exists(appPath)){
        const app=await readFile(appPath,'utf8');
        const swRef=chrome?'/service-worker.js?v=v42.3-mobile-chrome':stable?'/service-worker.js?v=v42.2-cell-stability':hasAudit?'/service-worker.js?v=v42.1-investigation-audit':'/service-worker.js?v=v42-investigation-ui';
        ok(app.includes(swRef),`${dir}/app-v11.js: ${chrome?'v42.3':stable?'v42.2':hasAudit?'v42.1':'v42'} service-worker registration missing`);
      }
      const swPath=path.join(root,dir,'service-worker.js');
      if(await exists(swPath)){
        const swText=await readFile(swPath,'utf8');
        const expectedCache=chrome?"const CACHE='igr-v42-3-mobile-chrome';":"const CACHE='igr-v42-investigation-ui';";
        ok(swText.includes(expectedCache),`${dir}/service-worker.js: ${chrome?'v42.3':'v42'} cache namespace missing`);
        ok(swText.includes('/authoritative-runtime-v41.js?v=v41-authoritative-ui'),`${dir}/service-worker.js: v41 base runtime missing from shell cache`);
        ok(swText.includes(`/${v42Ref}`),`${dir}/service-worker.js: ${v42Label} runtime missing from shell cache`);
        if(hasAudit)ok(swText.includes('/investigation-audit-v42-1.js?v=v42.1-investigation-audit'),`${dir}/service-worker.js: v42.1 audit runtime missing from shell cache`);
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
