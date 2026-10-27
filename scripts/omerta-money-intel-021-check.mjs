// node scripts/omerta-money-intel-021-check.mjs
// Tests hors production : logique du parcours UI + assertions de migrations.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('omerta-money-intel-v1.js','utf8');
const sql=fs.readFileSync('supabase/migrations/20261026233500_omerta_money_intel_021.sql','utf8');
const pact=fs.readFileSync('supabase/migrations/20261026233000_omerta_indic_recruitment_021.sql','utf8');
const html=fs.readFileSync('index.html','utf8');
new vm.Script(js);
assert.match(html,/omerta-money-intel-v1\.js/);
assert.match(sql,/igr_omerta_money_intel_signal/);
assert.match(sql,/igr_omerta_money_intel_send/);
assert.match(sql,/igr_omerta_money_intel_options/);
assert.match(pact,/igr_omerta_indic_offer/);
assert.match(pact,/igr_omerta_indic_respond/);
assert.match(sql,/action_type='omerta_indic_response'/);
assert.match(sql,/coalesce\(\(a\.payload->>'match_no'\)::int/);
assert.match(sql,/omerta_intel_intent/);
assert.match(sql,/counts_for_cooperation',false/);
assert.match(sql,/p\.internal_slot between 2 and 6/);
assert.match(sql,/first_official_delivery/);
assert.match(sql,/one_intel_per_cycle/);
assert.match(sql,/'private',receiver\.id/);
assert.match(pact,/'private',suspect\.id/);
assert.match(pact,/'private',inv\.id/);
assert.doesNotMatch(js,/contenteditable/i);

function simulate({role='suspect',scenario='021',cycle=2,phase='interrogation',accepted=false,offered=false,logged=false}={}){
 const all=[];
 function el(tag){
  const x={tag,className:'',textContent:'',children:[],events:{},value:'',isConnected:true,
    addEventListener(k,fn){this.events[k]=fn;},setAttribute(){},
    append(...vs){for(const v of vs){v.parent=this;this.children.push(v);}},
    appendChild(v){v.parent=this;this.children.push(v);return v;},
    replaceChildren(...vs){this.children=vs;for(const v of vs)v.parent=this;},
    insertBefore(v,w){const i=this.children.indexOf(w);this.children.splice(i<0?this.children.length:i,0,v);v.parent=this;},
    remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(y=>y!==this);},
    querySelector(q){return this.children.find(x=>x.className.includes(q.substring(1)))||null}
  };
  all.push(x);return x;
 }
 const dock=el('div'),body=el('body'),panel=el('div');
 const d={
  room:{code:'ROOM1',scenario_id:scenario,cycle,status:'playing',phase,state:{match_no:1}},
  player:{id:'INDIC1',public_role:role},
  players:[{id:'S1',pseudo:'Suspect A',public_role:'suspect'}],
  my_actions:logged?[{action_type:'omerta_verified_intel',cycle,payload:{match_no:1}}]:[],
  events:[...(accepted?[{event_type:'omerta_indic_status',payload:{accepted:true,source_id:'INDIC1',match_no:1}}]:[]),
    ...(offered?[{event_type:'omerta_indic_offer',payload:{offer_id:10,match_no:1}}]:[])]
 };
 const doc={body,readyState:'complete',createElement:el,addEventListener(){},
  querySelector(sel){if(sel==='.omerta-decision-dock')return dock;if(sel==='.game-panel-v11')return panel;return body.children.find(x=>x.className==='modal igr-money-intel-modal')||null;}};
 const calls=[];
 const rp=async(name,args)=>{calls.push({name,args});switch(name){
  case 'igr_omerta_money_intel_options':return{cards:[
   {id:'021_money_route',title:'Les transferts d’argent',detail:'Circuit de Rinaldi'},
   {id:'021_handoff',title:'La remise de l’enveloppe',detail:'Une remise'},
   {id:'021_detour',title:'Le détour',detail:'Un déplacement'}]};
  default:return{ok:true};
 }};
 vm.runInNewContext(js,{STATE:{room:'ROOM1',token:'TOKEN',sync:d},rpc:rp,
  document:doc,window:{addEventListener(){}},MutationObserver:class{observe(){}},
  confirm:()=>true,syncNow:async()=>{},console});
 return{all,dock,panel,calls};
}
const no=simulate();assert.equal(no.dock.children.length,0,'no panel before recruitment');
const early=simulate({accepted:true,cycle:1});assert.equal(early.dock.children.length,0);
for(const scenario of ['022','023','024','025']){
 const active=simulate({accepted:true,scenario});
 assert.equal(active.dock.children.length,1,'five dossiers support source cards');
}
const other=simulate({accepted:true,scenario:'026'});assert.equal(other.dock.children.length,0);
const offer=simulate({role:'enqueteur'});
assert.equal(offer.dock.children.length,1,'Enquêteur can offer source pact');
const pending=simulate({offered:true});
assert.equal(pending.dock.children.length,2,'Suspect can accept or refuse');
const src=simulate({accepted:true});
assert.equal(src.dock.children.length,1);
await src.dock.children[0].events.click();
assert.equal(src.calls[0].name,'igr_omerta_money_intel_options');
const intent=src.all.find(x=>x.tag==='button'&&x.textContent==='Je souhaite en parler');
assert.ok(intent,'optional pre-oral signalling');
await intent.events.click();
assert.equal(src.calls[1].name,'igr_omerta_money_intel_signal');
const after=src.all.find(x=>x.tag==='button'&&x.textContent==='J’en ai déjà parlé');
assert.ok(after,'post-oral confirmation');
await after.events.click();
assert.equal(src.calls[2].name,'igr_omerta_money_intel_send');
assert.equal(src.calls[2].args.p_card_id,'021_money_route');
console.log('OMERTÀ 021 — tests de branche : PASS (accord, 3 sujets, signal libre, consignation post-orale)');

// Le rappel n'apparaît que pour l'Indic sans transmission enregistrée.
const reminder=simulate({accepted:true,cycle:2,phase:'cycle_debrief'});
const prompt=reminder.all.find(x=>x.tag==='p'&&x.textContent==='As-tu partagé une information ?');
assert.ok(prompt,'A single short end-cycle question appears with no recorded card');
const yes=reminder.all.find(x=>x.tag==='button'&&x.textContent==='Oui');
assert.ok(yes);
await yes.events.click();
assert.equal(reminder.calls[0].name,'igr_omerta_money_intel_options','Yes opens own private canonical cards');
const already=simulate({accepted:true,cycle:2,phase:'cycle_debrief',logged:true});
assert.equal(already.panel.children.length,0,'No question after already logging intel in this cycle');
const silent=simulate({accepted:true,cycle:2,phase:'interrogation'});
assert.equal(silent.panel.children.length,0,'No redundant question during oral gameplay');
const noIndic=simulate({accepted:false,cycle:2,phase:'cycle_debrief'});
assert.equal(noIndic.panel.children.length,0,'No question without a recruited source');
// L'avis final de l'Enquêteur est une action indépendante des 3 sujets.
const lastCycle=simulate({role:'enqueteur',accepted:true,cycle:3,phase:'cycle_debrief'});
const review=lastCycle.all.find(x=>x.tag==='button'&&x.textContent.includes('Évaluer mon Indic'));
assert.ok(review,'Investigator gets final utility review in cycle III');
await review.events.click();
const selectors=lastCycle.all.filter(x=>x.tag==='select');
assert.equal(selectors.length,2);
selectors[0].value='yes';selectors[1].value='3';
const finalize=lastCycle.all.find(x=>x.tag==='button'&&x.textContent==='Enregistrer le bilan définitif');
assert.ok(finalize);
await finalize.events.click();
assert.equal(lastCycle.calls[0].name,'igr_omerta_indic_final_assess');
assert.equal(lastCycle.calls[0].args.p_useful,true);
assert.equal(lastCycle.calls[0].args.p_reduction_years,3);
const notYet=simulate({role:'enqueteur',accepted:true,cycle:2,phase:'cycle_debrief'});
assert.ok(!notYet.all.some(x=>x.tag==='button'&&x.textContent.includes('Évaluer mon Indic')),
  'No early investigator review');
console.log('OMERTÀ : conditional cycle reminder + authenticated oral final review UI, PASS');
