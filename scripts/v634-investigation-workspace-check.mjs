/* v634: source/bundle and role permissions smoke test; no external browser needed. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const target=path.resolve(process.argv[2]||'dist');
const fetch=async x=>readFile(path.join(target,x),'utf8');
const html=await fetch('index.html'),js=await fetch('investigation-workspace-v634.js'),css=await fetch('investigation-workspace-v634.css');
const sw=await fetch('service-worker.js').catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
assert(html.includes('investigation-workspace-v634.js?v=v636-team-investigation'));
assert(html.includes('investigation-workspace-v634.css?v=v636-team-investigation'));
assert(html.lastIndexOf('investigation-workspace-v634.js')>html.lastIndexOf('common-dossier-v106.js'));
assert(html.lastIndexOf('investigation-workspace-v634.js')>html.lastIndexOf('live-game-ux-v632.js'));
assert(html.lastIndexOf('investigation-workspace-v634.css')>html.lastIndexOf('live-game-ux-v632.css'));
if(sw){
 assert(sw.includes("const CACHE='igr-v636-team-investigation';"),'Latest ergonomic bundle must invalidate old PWA cache');
 assert(sw.includes('/reading-stability-v635.css?v=v636-team-investigation'),'Reading CSS must be precached');
 assert(sw.includes('/investigation-workspace-v634.js?v=v636-team-investigation'));
 assert(sw.includes('/investigation-workspace-v634.css?v=v636-team-investigation'));
}
for(const key of ['igr634-interviews',"makeGroup('actions'","makeGroup('evidence'","makeGroup('notebook'",'igr87-note-form','igr634-priority','data-igr634-group','igr87-dossier','igr634-channel-help']){
 assert(js.includes(key)||css.includes(key),'Missing essential UX component: '+key);
}
let tests=0;
for(let id=1;id<=49;id++){
 for(const role of ['enqueteur','analyste','procureur','juge','inspecteur','expert','suspect','journaliste','temoin','maitre']){
  const STATE={view:'game',room:'ABC12',tab:'card',sync:{player:{public_role:role,id:'self'},room:{code:'ABC12',scenario_id:String(id).padStart(3,'0'),phase:'investigation_assembly',state:{match_no:1}}}};
  const window={IGR_LOCALE:'fr'};
  const document={addEventListener(){}};
  const sandbox={window,document,STATE,console:{warn(){}},
   gameTabs:()=>[{id:'card'},{id:'investigation'},{id:'notes'},{id:'timeline'}],
   renderGameTab:()=>'<section>untouched source</section>',
   setTab:function(tab){STATE.tab=tab;return tab;}
  };
  vm.runInNewContext(js,sandbox);
  const available=window.gameTabs().map(x=>x.id);
  const authorized=['enqueteur','analyste','procureur','juge','inspecteur','expert'].includes(role);
  assert.equal(available.includes('notes'),!authorized,'Notes tab should remain only for roles without enquiry: '+role);
  const tab=window.setTab('notes');
  assert.equal(tab,authorized?'investigation':'notes','Notes navigation must redirect without losing notes for '+role);
  assert.equal(window.IGR_INVESTIGATION_WORKSPACE_V634.eligible(),authorized);
  if(!authorized)assert.equal(window.renderGameTab(),'<section>untouched source</section>','non-investigators must keep their experience');
  tests++;
 }
}
console.log('PASS investigation workspace: '+tests+' scenario-role combinations; investigator notes unified and private tabs retained for other roles.');
