import {copyFile,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const version='v173-cartel031-negotiation';
// CARTEL release metadata stays v173; the public app/SW gets its own
// cache revision so new scenario roles reach installed PWAs.
const clientVersion='v645-005-short-cards-120-160';
await copyFile(path.resolve('cartel031-v171.js'),path.join(target,'cartel031-v171.js'));
const nativeBundle=(await readFile(path.join(target,'index.html'),'utf8')).includes('native-store-boundary-v14.js');
// Run after all historical patchers: none may restore an older app URL or cache.
for(const name of ['index.html','en.html',...(!nativeBundle?['service-worker.js']:[]),'app-v11.js']){
  const file=path.join(target,name);
  let text=await readFile(file,'utf8');
  text=text.replace(/app-v11\.js\?v=[A-Za-z0-9._-]+/g,`app-v11.js?v=${clientVersion}`);
  text=text.replace(/dlc-suite-v12-37\.js\?v=[A-Za-z0-9._-]+/g,`dlc-suite-v12-37.js?v=${version}`);
  text=text.replace(/(cartel029-v(?:107|121)\.js)\?v=[A-Za-z0-9._-]+/g,`$1?v=${version}`);
  text=text.replace(/(lawyer-runtime-v43\.js|lawyer-dismissal-v45\.js|natural-role-gameplay-v50\.js|play-modes-v13-8\.js|prosecutor-runtime-v47\.js)\?v=[A-Za-z0-9._-]+/g,`$1?v=${version}`);
  if(name==='index.html'||name==='en.html')text=text.replace('</body>',`  <script src="cartel031-v171.js?v=${version}"></script>\n</body>`);
  if(name==='service-worker.js'){
    if(!text.includes('/cartel031-v171.js?v='+version))text=text.replace('const SHELL=[',`const SHELL=[\n  '/cartel031-v171.js?v=${version}',`);
    text=text.replace(/const CACHE='[^']+';/,`const CACHE='igr-${clientVersion}';`);
    if(!text.includes(`/app-v11.js?v=${clientVersion}`)){
      text=text.replace('const SHELL=[',`const SHELL=[\n  '/app-v11.js?v=${clientVersion}',`);
    }
  }
  if(name==='app-v11.js')text=text.replace(/\/service-worker\.js\?v=[A-Za-z0-9._-]+/g,`/service-worker.js?v=${clientVersion}`);
  await writeFile(file,text,'utf8');
}
const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const commit=process.env.GITHUB_SHA||git.stdout?.trim()||'';
await writeFile(path.join(target,'cartel030-release.json'),JSON.stringify({
  scenario:'030',version,commit,bundle:nativeBundle?'native':'web',players:[7,8,9],moles:{7:1,8:1,9:2},
  evidence_per_cycle:[6,7,10]
},null,2)+'\n');
console.log('CARTEL 030 release finalized: core application and PWA cache agree.');

await writeFile(path.join(target,'cartel031-release.json'),JSON.stringify({scenario:'031',version,commit,players:[6,7,8],variants:['A','B','C'],cycles:3,evidence_per_cycle:[4,5,4],private_votes:true,local_mode:true},null,2)+'\n');
