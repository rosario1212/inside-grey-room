import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const read=name=>readFile(path.join(target,name),'utf8');
const [html,app,release]=await Promise.all(['index.html','app-v11.js','cartel030-release.json'].map(read));
const meta=JSON.parse(release);
const clientVersion='v642-shortcards-001-004';
assert.equal(meta.scenario,'030');
assert.match(meta.commit,/^[a-f0-9]{40}$/);
assert.equal((html.match(new RegExp(`app-v11\\.js\\?v=${clientVersion}`,'g'))||[]).length,1);
if(meta.bundle==='native')assert(html.includes('native-store-boundary-v14.js'));
else{
  assert.equal(meta.bundle,'web');
  const sw=await read('service-worker.js');
  assert(sw.includes(`const CACHE='igr-${clientVersion}';`));
  assert(sw.includes(`/app-v11.js?v=${clientVersion}`));
}
assert(app.includes(`/service-worker.js?v=${clientVersion}`));

// Exercise actual built renderers: private cards and evidence respect role access,
// and received text is escaped rather than interpreted as markup.
const context=vm.createContext({
  STATE:{role:'suspect',sync:{room:{scenario_id:'030',phase:'briefing',cycle:0},player:{public_role:'suspect',private_state:{}},events:[]}},
  h:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
  currentScenario:()=>({id:'030'}),displayRole:x=>x,roleInfo:()=>({win:'Objectif'}),
  currentTarget:()=>null,phaseLabel:x=>x,phaseInstruction:()=>'',igr82RelationsHtml:()=>'',
  renderReveal:()=>'',renderPendingRequests:()=>''
});
for(const [name,next] of [['valueBlock','privateCardHtml'],['privateCardHtml','renderRole'],['canInvestigationChannel','canVideo'],['renderInvestigationTab','phaseInstruction']]){
  const start=app.indexOf(`function ${name}(`),end=app.indexOf(`function ${next}(`,start+1);
  assert(start>=0&&end>start,`Built renderer ${name} missing`);
  vm.runInContext(app.slice(start,end),context);
}
for(const slot of [1,2,3]){
  context.STATE.sync.player={public_role:'suspect',secret_role:'suspect',private_state:{variant_card:{
    identity:`PERSON_${slot}`,what_you_know:`FACT_${slot}`,variant_secret:`SECRET_${slot}`,
    what_you_hide:`HIDDEN_${slot}`,your_chronology:`TIME_${slot}`,objective:`GOAL_${slot}`
  }}};
  const rendered=vm.runInContext('privateCardHtml()',context);
  for(const key of ['PERSON','FACT','SECRET','HIDDEN','TIME','GOAL'])assert(rendered.includes(`${key}_${slot}`));
  for(const other of [1,2,3].filter(x=>x!==slot))assert(!rendered.includes(`SECRET_${other}`));
}
context.STATE.sync.player={public_role:'analyste',secret_role:'espion',private_state:{secret_mission:'MISSION <img src=x>'}};
const mole=vm.runInContext('privateCardHtml()',context);
assert(mole.includes('MISSION &lt;img src=x&gt;'));
assert(!mole.includes('<img src=x>'));
context.STATE.sync.events=[{event_type:'trame',cycle:1,payload:{evidence_id:'P01',title:'PIÈCE_TEST',text:'ÉLÉMENT <script>test</script>'}}];
for(const role of ['enqueteur','analyste','procureur','juge','suspect','maitre','journaliste']){
  context.STATE.sync.player.public_role=role;
  const rendered=vm.runInContext('renderInvestigationTab()',context);
  assert.equal(rendered.includes('PIÈCE_TEST'),['enqueteur','analyste','procureur','juge'].includes(role),role+' evidence access');
  assert(!rendered.includes('<script>test</script>'));
}
console.log('CARTEL 030 PASS: final cache, deployed metadata, three private cards, mole mission, evidence access and escaped content.');
await import('./cartel-lawyer-assignment-check.mjs');
await import('./lawyer-mutual-termination-check.mjs');

await import('./cartel031-check.mjs');
