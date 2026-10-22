import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'dist');
const source=await readFile(path.join(target,'lawyer-runtime-v43.js'),'utf8');
const app=await readFile(path.join(target,'app-v11.js'),'utf8');
let checks=0;
for(const scenario of ['030','031','016']){
 for(const locale of ['fr','en']){
  let response={};
  const document={createElement:()=>({dataset:{}}),head:{appendChild(){}},querySelector:()=>null};
  const context=vm.createContext({document,console,setInterval:()=>0,setTimeout:()=>0,clearInterval(){},addEventListener(){},requestAnimationFrame:callback=>callback()});
  context.window=context;
  context.IGR_LOCALE=locale;
  context.STATE={room:'QA123',token:'QA_TOKEN',sync:{room:{code:'QA123',scenario_id:scenario,phase:'briefing',cycle:0},player:{id:'counsel',public_role:'maitre'},players:[{id:'counsel',public_role:'maitre'},{id:'client',public_role:'suspect'},{id:'other',public_role:'suspect'}]}};
  context.rpc=async()=>response;
  context.cartelLawyerLabel=()=>scenario==='016'?'':locale==='en'?'Cartel lawyer':'Avocat du cartel';
  vm.runInContext(source,context);
  const api=context.IGR_LAWYER_V43;
  assert.equal(typeof api?.renderLawyerTab,'function');
  const assigned=scenario!=='016';
  response={lawyer_count:1,assignment_mode:assigned?'cartel_priority':'request',mandate_locked:false,has_client:false,pending_requests:[],suspects:[]};
  await api.refresh(true);
  let html=api.renderLawyerTab();
  if(assigned)assert(!/Choisir un client|Choose a client/.test(html));
  else assert.match(html,/Choisir un client|Choose a client/);
  checks++;

  response={...response,has_client:true,client:{id:'client',pseudo:'CLIENT <img src=x>',brief:'MANDATE_ONLY'},suspects:[{id:'client',pseudo:'CLIENT',is_client:true},{id:'other',pseudo:'OTHER',is_client:false}]};
  await api.refresh(true);
  html=api.renderLawyerTab();
  assert(html.includes('CLIENT &lt;img src=x&gt;'));
  assert(!html.includes('<img src=x>'));
  assert(!html.includes('igr43AcceptLawyer'));
  if(assigned)assert.match(html,/CLIENT DÉSIGNÉ PAR LE CARTEL|CARTEL-APPOINTED CLIENT/);
  checks++;

  context.STATE.sync.player={id:'client',public_role:'suspect'};
  response={lawyer_count:1,mandate_locked:assigned,represented:true,lawyer:{pseudo:'COUNSEL'},can_request:false};
  await api.refresh(true);
  html=api.renderLawyerTab();
  assert(html.includes('COUNSEL'));
  if(assigned)assert.match(html,/MANDAT DU CARTEL|CARTEL APPOINTMENT/);
  assert(!html.includes('onclick="igr43RequestLawyer()"'));
  checks++;

  context.STATE.sync.player={id:'other',public_role:'suspect'};
  response={lawyer_count:1,mandate_locked:assigned,represented:false,can_request:!assigned,lawyer_available:!assigned};
  await api.refresh(true);
  html=api.renderLawyerTab();
  assert.equal(html.includes('onclick="igr43RequestLawyer()"'),!assigned);
  if(assigned)assert(!/refus reste réversible|refusal remains reversible/.test(html));
  checks++;

  // Exercise the actual application role copy, including its English branch.
  context.ROLE_INFO={maitre:{label:'Avocat',win:'BASE_WIN',body:'BASE_BODY'}};
  const start=app.indexOf('function roleInfo('),end=app.indexOf('\n',start);
  assert(start>=0&&end>start);
  vm.runInContext(app.slice(start,end),context);
  const info=vm.runInContext("roleInfo('maitre')",context);
  if(scenario==='031')assert.match(info.win,/sortir|alive/);else if(assigned){assert.match(info.win,/assigné|appointed/);assert.match(info.body,/dès le début|at the start/);}
  else assert.equal(info.win,'BASE_WIN');
  checks++;
 }
}
console.log(`CARTEL lawyer PASS: ${checks} renderer checks, FR/EN, automatic mandate and ordinary representation.`);
