import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.cwd(),process.argv[2]||'dist');
const runtime=path.join(target,'natural-role-gameplay-v50.js');
const must=async f=>{try{await stat(f)}catch{throw new Error(`missing ${f}`)}};
await must(runtime);
const parsed=spawnSync(process.execPath,['--check',runtime],{encoding:'utf8'});
if(parsed.status!==0)throw new Error(parsed.stderr||parsed.stdout||'v50 syntax error');
const js=await readFile(runtime,'utf8');
const needles=[
 'igr_v50_role_state','igr_v50_inspector_explore','igr_v50_expert_analyze','igr_v50_journalist_investigate',
 'igr_v50_publish_manual_breaking','igr_v50_denounce_inspector','igr_v50_report_journalist','igr_v50_decide_journalist_complaint',
 'ACTIVITÉ','investigation_assembly','3/cycle','6/partie','1 minute'
];
for(const n of needles)if(!js.includes(n))throw new Error(`v50 runtime missing contract: ${n}`);
for(const page of ['index.html','en.html']){const f=path.join(target,page);await must(f);const html=await readFile(f,'utf8');const v49=html.lastIndexOf('public-broadcasts-v49.js'),v50=html.lastIndexOf('natural-role-gameplay-v50.js?v=v50-natural-role-gameplay');if(v49<0||v50<=v49)throw new Error(`${page}: v50 load order invalid`)}
const app=await readFile(path.join(target,'app-v11.js'),'utf8');if(!app.includes('/service-worker.js?v=v50-natural-role-gameplay'))throw new Error('v50 service worker registration missing');
const swPath=path.join(target,'service-worker.js');try{const sw=await readFile(swPath,'utf8');if(!sw.includes("const CACHE='igr-v50-natural-role-gameplay';")||!sw.includes('/natural-role-gameplay-v50.js?v=v50-natural-role-gameplay'))throw new Error('v50 service worker cache contract missing')}catch(error){if(error?.code!=='ENOENT')throw error}
console.log('v50 natural role gameplay checks passed');
