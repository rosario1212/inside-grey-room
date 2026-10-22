import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist');
const source=await readFile(path.join(target,'cartel031-v171.js'),'utf8');
const meta=JSON.parse(await readFile(path.join(target,'cartel031-release.json'),'utf8'));
assert.equal(meta.version,'v172-cartel031-audit');assert.deepEqual(meta.evidence_per_cycle,[4,5,4]);
for(const name of ['index.html','en.html'])assert((await readFile(path.join(target,name),'utf8')).includes('cartel031-v171.js?v='+meta.version));
assert(!source.includes('"canonical_truth":{'));assert(!source.includes('family_proofs:{'));
const baseCanon={
 canonical_truth:{levels:[2,2,2],hostage_location:'site-a',safe_approach:'isolate',assault_author:'order-a'},
 resolution:{handover:'exchange-end',located_safe:'rescued',located_unsafe:'killed',unreached:'captive',delegate_fates:{'exchange-end':'delegate-end'}},
 assault_options:[{id:'order-a',label:'ORDER A'},{id:'order-b',label:'ORDER B'}],
 locations:[{id:'site-a',label:'SITE A'},{id:'site-b',label:'SITE B'}],
 approaches:[{id:'direct',label:'DIRECT'},{id:'isolate',label:'ISOLATE'}],
 family_proofs:{enqueteur:{title:'PROOF E',text:'PRIVATE E'},analyste:{title:'PROOF A',text:'PRIVATE A'},procureur:{title:'PROOF P',text:'PRIVATE P'}},
 demand:'BUREAU DEMAND',suspects:[1,2,3].map(slot=>({slot,information:'FACT '+slot})),revelations:[],
 final_reveal:'FINAL',endings:{rescued:'R',killed:'K',captive:'C','exchange-end':'X'},fate_copy:{},outcome_copy:{}
};
let flows=0,renders=0;
for(const locale of ['fr','en'])for(const count of [6,7,8]){
 const handlers=[],elements={};
 const document={addEventListener:(name,fn)=>{if(name==='click')handlers.push(fn)},getElementById:id=>elements[id]||null,
  createElement:()=>({}),head:{appendChild(){}}};
 const context=vm.createContext({document,console,setTimeout:()=>0,setInterval:()=>0,STATE:{}});
 context.window=context;context.IGR_LOCALE=locale;context.addEventListener=()=>{};context.confirm=()=>true;
 vm.runInContext(source,context);const api=context.IGR_CARTEL031;
 const make=()=>{
  const players=[{id:'e',name:'E <img src=x>',role:'enqueteur',card:{}},{id:'a',name:'A',role:'analyste',card:{}},
   {id:'l',name:'L',role:'maitre',card:{}},...[1,2,3].map(slot=>({id:'s'+slot,name:'S'+slot,role:'suspect',slot,card:{information:'FACT '+slot}}))];
  if(count>=7)players.push({id:'p',name:'P',role:'procureur',card:{}});
  if(count===8)players.push({id:'w',name:'W',role:'temoin',card:{}});
  const s={scenarioId:'031',cycle:1,stage:'cycle',players,pack:{cartel031_canon:structuredClone(baseCanon)}};
  api.initLocal(s);return s;
 };
 for(const ending of ['rescued','killed','captive','exchange-end']){
  const s=make();
  assert.throws(()=>api.applyLocal(s,'e','vote',{choice:'refuse'}));
  assert.throws(()=>api.applyLocal(s,'s1','vote',{choice:'e'}));
  s.cycle=2;
  assert.throws(()=>api.applyLocal(s,'s1','vote',{choice:'e'}));
  assert.throws(()=>api.applyLocal(s,'l','vote',{choice:'e'}));
  for(const p of s.players.filter(p=>['enqueteur','analyste','procureur'].includes(p.role)))api.applyLocal(s,p.id,'vote',{choice:ending==='exchange-end'?'e':'refuse'});
  assert.throws(()=>api.applyLocal(s,'a','plan',{mode:'wait'}));
  assert.throws(()=>api.applyLocal(s,'e','plan',{mode:'intervene',location:'site-a',approach:'direct'}));
  api.applyLocal(s,'e','plan',{mode:'intervene',location:ending==='captive'?'site-b':'site-a',approach:ending==='killed'?'direct':'isolate',acknowledge_risk:true,assault_author:'order-a'});
  for(const p of s.players.filter(p=>p.role==='suspect')){
   const terms=p.slot===1?'release':p.slot===2?'prison':'protected_release';
   api.applyLocal(s,'e','offer',{suspect_id:p.id,terms});
   assert.throws(()=>api.applyLocal(s,p.id,'respond',{revision:0,accept:true}));
   if(p.slot===1)assert.throws(()=>api.applyLocal(s,p.id,'respond',{revision:1,accept:true}));
   api.applyLocal(s,p.id,'respond',{revision:1,accept:true,acknowledge_risk:true});
   assert.throws(()=>api.applyLocal(s,'e','offer',{suspect_id:p.id,terms:'prison'}));
  }
  api.applyLocal(s,'s3','end_rep',{});
  assert.equal(s.cartel031.cartel_forfeit,false,'Client dismissal must not punish lawyer');
  api.applyLocal(s,'s3','request_rep',{});api.applyLocal(s,'l','accept_rep',{});
  if(ending==='exchange-end'){
   assert.throws(()=>api.applyLocal(s,'l','end_rep',{}));
   api.applyLocal(s,'l','end_rep',{acknowledge_risk:true});
   api.applyLocal(s,'s3','request_rep',{});api.applyLocal(s,'l','accept_rep',{});
   assert.equal(s.cartel031.cartel_forfeit,true,'Rehire cannot erase withdrawal');
  }
  for(const p of s.players){
   const d=api.localState(s,p.id),html=api.renderBoard(d,p);
   assert(!Object.hasOwn(d,'ballots'));assert(!html.includes('<img src=x>'));
   if(!['enqueteur','analyste','procureur'].includes(p.role)){
    assert(!Object.hasOwn(d,'own_ballot'));assert(!Object.hasOwn(d,'proof'));assert(!Object.hasOwn(d,'crew'));
    assert(!html.includes('PRIVATE E'));assert(!html.includes('BUREAU DEMAND'));
   }else{
    assert.equal(d.proof.text,baseCanon.family_proofs[p.role].text);
    assert(!html.includes('PRIVATE '+({enqueteur:'A',analyste:'E',procureur:'E'})[p.role]));
   }
   renders++;
  }
  if(count===8)api.applyLocal(s,'w','testify',{});
  s.cartel031.locked=true;s.cartel031.nominee=ending==='exchange-end'?'e':null;s.stage='verdict';
  for(const p of s.players.filter(p=>['enqueteur','analyste','procureur'].includes(p.role)))api.applyLocal(s,p.id,'levels',{s1:2,s2:2,s3:2});
  assert.throws(()=>api.applyLocal(s,'e','vote',{choice:'refuse'}));
  const result=api.localOutcome(s);
  assert.equal(result.outcome,ending);
  assert.equal(result.results.find(p=>p.id==='s1').fate,'killed_after_release');
  assert.equal(result.results.find(p=>p.id==='s2').success,false);
  assert.equal(result.results.find(p=>p.id==='s3').success,true);
  assert.equal(result.results.find(p=>p.id==='l').success,ending!=='exchange-end');
  assert.equal(result.results.find(p=>p.id==='e').success,ending==='rescued');
  if(ending==='rescued'){s.cartel031.plan.assault_author='order-b';assert.equal(api.localOutcome(s).results.find(p=>p.id==='e').success,false);s.cartel031.plan.assault_author='order-a';}
  flows++;
 }
 // Exercise the real privacy curtain, rather than only a string renderer.
 const s=make();s.cycle=2;let html='';
 api.renderLocal(s,{save(){},shell:value=>{html=value}});
 const click=(action,id)=>{const button={dataset:{c031Local:action,c031Id:id}};for(const h of handlers)h({preventDefault(){},target:{closest:selector=>selector==='[data-c031-local]'?button:null}})};
 click('open','e');assert(!html.includes('PRIVATE E'));assert(html.includes('INFORMATIONS SCELLÉES'));
 click('private');assert(html.includes('PRIVATE E'));assert(!html.includes('PRIVATE A'));
 click('hide');assert(!html.includes('PRIVATE E'));
 // Refusing confirmation never produces an actionable payload.
 context.confirm=()=>false;
 assert.equal(api.prepareAction('respond',{revision:1,accept:true,terms:'release'},{}),null);
 assert.equal(api.prepareAction('end_rep',{}, {role:'maitre'}),null);
}
console.log('CARTEL 031 PASS: '+flows+' local decision flows, '+renders+' FR/EN role renders, private curtain, binding deals and permanent lawyer defeat.');
await import('./cartel031-session-check.mjs');
