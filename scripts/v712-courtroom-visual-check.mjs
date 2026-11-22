import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(path,'utf8');
const court=read('final-audience-v52.js');
const rules=read('self-guided-rules-v51.js');
const roles=read('natural-role-gameplay-v50.js');
const roomPlayers=[
 {id:'j',pseudo:'Présidente',public_role:'juge'},
 {id:'p',pseudo:'Procureur',public_role:'procureur'},
 {id:'e',pseudo:'Enquêteur',public_role:'enqueteur'},
 {id:'l',pseudo:'Avocate',public_role:'maitre'},
 {id:'s1',pseudo:'Suspect <A>',public_role:'suspect'},
 {id:'s2',pseudo:'Suspect B',public_role:'suspect'}
];
const doc={
 createElement(){return {dataset:{},style:{},innerHTML:''}},
 head:{appendChild(){}},querySelector(){return null},querySelectorAll(){return []},
 getElementById(){return null}
};
const env=(source,who,step,locale='fr',withJudge=true)=>{
 const players=roomPlayers.filter(p=>withJudge||p.public_role!=='juge');
 const player=players.find(p=>p.id===who)||players[0];
 const STATE={tab:'final52',room:'C712',token:'sample-token',sync:{
  room:{code:'C712',scenario_id:'014',status:'playing',phase:'final_suspect_defenses',
   state:{v52_stage:withJudge?'courtroom':'defenses',v708_court_step:step,v708_checks:['charges'],
    v708_heard:[],v708_last_word:[],v59_absent:[],v52_queue:[],duration_mode:'short'}},
  players,player}};
 const window={STATE,IGR_LOCALE:locale,renderGameTab(){return'fallback'},renderRules(){return''},
  IGR_RUNTIME_COORDINATOR:{every(){}}};
 const context={window,document:doc,STATE,console:{info(){}},setTimeout(){},setInterval(){}};
 runInNewContext(source,context,{timeout:5000});
 return {window,STATE};
};
for(const [id,step] of [['j','seating'],['j','debate'],['j','conclusions'],['s1','debate'],['s1','conclusions'],['p','opening'],['l','debate']]){
 const h=env(court,id,step).window.renderGameTab();
 for(const marker of ['igr712-hero','igr712-timeline','igr712-seating','igr712-role','igr712-defendants'])
  assert(h.includes(marker),'missing '+marker+' for '+id+' / '+step);
 assert(!h.includes('<h2>Fin de l’enquête</h2>'),'duplicate header in court');
 assert(!h.includes('<A>'),'unescaped pseudonym exposed');
 assert(h.includes('Suspect &lt;A&gt;'),'pseudonym not escaped');
 if(id==='j')assert(h.includes('igr712-topic-grid'),'judge agenda missing');
 if(id==='s1')assert(h.includes('igr712-participant-controls'),'defendant controls missing');
}
const noJudge=env(court,'e','opening','fr',false).window.renderGameTab();
assert(noJudge.includes('Défenses')&&!noJudge.includes('igr712-hero')&&!noJudge.includes('Audience des rôles'),'no-Judge must start with the suspect defences');
for(const locale of ['fr','en']){
 const h=env(rules,'j','seating',locale).window.IGR_SELF_GUIDED_RULES_V51.rulebookHtml(false);
 assert(h.includes('igr712-rule-lanes')&&h.includes('igr712-majority-strip'),'visual rule comparison missing');
 assert(h.includes('★★★★★'),'five-star range missing');
 assert(h.includes(locale==='fr'?'Majorité absolue':'Strict majority'),'majority rule missing in '+locale);
 assert(h.includes(locale==='fr'?'Fil conducteur':'Judge')||h.includes(locale==='fr'?'Le tribunal':'The courtroom'),'Judge court guide missing');
}
const missingJudge=env(rules,'e','seating','fr',false).window.IGR_SELF_GUIDED_RULES_V51.rulebookHtml(false);
assert(missingJudge.includes('SANS JUGE'),'no-Judge rule branch missing');
assert(court.includes('igr712-timeline-stage')&&court.includes('igr712-topic-grid'),'visual components not present');
assert(court.includes('@media(max-width:430px)'),'court layout lacks narrow-screen mode');
assert(rules.includes('@media(max-width:490px)'),'rulebook layout lacks narrow-screen mode');
assert(roles.includes('Math.min(5'),'lobby stars regressed');
console.log('PASS v712 courtroom visual: judges, defendants, role cards, FR/EN rules, strict majority and no-Judge preservation.');
