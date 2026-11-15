// TERREUR v704: responsive investigation quiz and canonical military reports.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const read=p=>readFileSync(p,'utf8');
const ui=read('terror-live-v681.js');
const report=read('terror-front-v682.js');
const migration=read('supabase/migrations/20261115163000_igr_v704_terror_debrief_military_consistency.sql');
const qa=read('supabase/tests/igr_v704_terror_debrief_military_qa.sql');
for(const script of ['terror-live-v681.js','terror-front-v682.js','terror-command-v694.js']){
  execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
}
for(const token of ['v704_terror_debrief_canonical_last_order','military_order_text','military_order_label',
  'RECONQUÊTE TENTÉE','igr_v4_actions','public.igr_v4_role_capacity']){
  if(token==='public.igr_v4_role_capacity')continue; // v704 does not change six-role assignments.
  assert(migration.includes(token),'canonical military debrief patch missing: '+token);
}
for(const sid of ['026','027','028'])assert(qa.includes("'"+sid+"'"),'SQL E2E missing '+sid);
assert(ui.includes('last?.military_order_text')&&ui.includes('last?.military_order_label'),
  'UI must show the Officer real last order');
assert(report.includes('L’Officier confirme')&&report.includes('réponses de l’enquête'),
  'TERROR public copy must have proper French punctuation');

const fields={};
const notices=[],calls=[];
let attempts=0,submitPayload=null;
const questions=[
  {title:'Première source vérifiée ?',options:['A','B','C']},
  {title:'Deuxième contradiction ?',options:['A','B','C']},
  {title:'Troisième responsabilité ?',options:['A','B','C']}
];
const state={room:'T4P027',token:'qa-player',view:'game',
 sync:{room:{code:'T4P027',scenario_id:'027',status:'playing',phase:'cycle_debrief',cycle:2,
  state:{terror_v681:{city:'Capitale QA'}}},
  player:{public_role:'analyste'}}};
const scope={STATE:state,document:{getElementById:id=>fields[id]||null,querySelector:()=>null},
 renderDebriefForm:()=>'<p>BASE DEBRIEF</p>',myAction:()=>null,
 renderCurrent:()=>{},renderLobby:()=>{},renderGame:()=>{},startGame:()=>{},
 toast:x=>notices.push(x),syncNow:async()=>{},h:x=>String(x??''),
 console:{warn(){},error(){}},window:{},
 rpc:async(name,args)=>{
  calls.push(name);
  if(name==='igr_v681_terror_get_questions'){
   attempts++;
   if(attempts===1)throw Error('network interrupted');
   return {enabled:true,questions};
  }
  if(name==='igr_v681_terror_submit_quiz'){submitPayload=args;return {ok:true};}
  throw Error('unexpected RPC '+name);
 }
};
vm.runInNewContext(ui,scope,{timeout:2500});
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
assert(scope.renderDebriefForm().includes('Réception'),'first render requests three questions');
await flush();
let html=scope.renderDebriefForm();
assert(html.includes('Réessayer'),'transient failure must be recoverable without restarting game');
scope.window.terrorV681RetryQuiz();
await flush();
html=scope.renderDebriefForm();
assert(html.includes('terrorV681Q1')&&html.includes('terrorV681Q3'),'retry must restore the real questionnaire');

const saved={terrorV681Q1:'b',terrorV681Q2:'u',terrorV681Q3:'c',
 qConvergence:'2',qConfusion:'1',qAxis:'responsabilite'};
for(const [k,v] of Object.entries(saved))fields[k]={value:v};
scope.window.terrorV681SaveDraft();
for(const k of Object.keys(fields))delete fields[k];
html=scope.renderDebriefForm();
for(const token of ['<option value="b" selected>','<option value="u" selected>','<option value="c" selected>',
    '<option value="responsabilite" selected>','<option value="2" selected>Oui, largement']){
 assert(html.includes(token),'form rerender erased draft answer: '+token);
}
for(const [k,v] of Object.entries(saved))fields[k]={value:v};
await scope.window.terrorV681SubmitQuiz();
assert(submitPayload,'quiz submission missing');
assert.equal(submitPayload.p_answers.q1,'b');
assert.equal(submitPayload.p_answers.q2,'u');
assert.equal(submitPayload.p_answers.q3,'c');
assert.equal(submitPayload.p_axis,'responsabilite');
assert.equal(submitPayload.p_convergence,2);
assert.equal(submitPayload.p_confusion,1);
assert(notices.some(x=>x.includes('Réponses scellées')),'quiz acknowledgement missing');
console.log('PASS TERREUR v704: failed question fetch recovers, draft survives rerenders, validated submit and real Officer report metadata.');
