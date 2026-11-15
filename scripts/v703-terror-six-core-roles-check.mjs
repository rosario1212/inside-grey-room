import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const ui=read('terror-v12-37.js'),rules=read('self-guided-rules-v51.js'),sql=read('supabase/migrations/20261115150000_igr_v703_terror_six_core_roles.sql');
for(const s of ['terror-v12-37.js','self-guided-rules-v51.js','terror-front-v682.js'])execFileSync(process.execPath,['--check',s]);
for(const sid of ['026','027','028']){
  assert.match(ui,new RegExp("id:'"+sid+"'[\\s\\S]*?min:6,max:6"),'six players required for '+sid);
  assert(ui.includes("'"+sid+"':{required:['Enquêteur','Analyste','Officier','3 suspects'],optional:[]}"),'invalid specialists for '+sid);
}
for(const marker of ['igr_v4_min_players(text)','igr_v4_max_players(text)','igr_v4_role_for_seat(text,integer,integer)','igr_v4_role_capacity(text,integer,text)','v703 terror six-person roster','v703 terror six-person capacities','v703 capacity mismatch'])assert(sql.includes(marker),marker+' missing');
const w={IGR_LOCALE:'fr',STATE:{sync:{room:{scenario_id:'027',cycle:2,phase:'investigation',status:'playing',state:{duration_mode:'long'}},player:{id:'test',public_role:'enqueteur'},players:[]}},renderGameTab(){return ''},renderRules(){return ''},IGR_RUNTIME_COORDINATOR:{every(){}}};
const doc={createElement:()=>({dataset:{},style:{},innerHTML:'',textContent:''}),head:{appendChild(){}},querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>[]};
runInNewContext(rules,{window:w,document:doc,console:{info(){}},setTimeout(){},setInterval(){}},{timeout:3000});
const html=w.IGR_SELF_GUIDED_RULES_V51.rulebookHtml(false);
assert.equal((html.match(/class="igr51-role /g)||[]).length,4,'in-game TERROR has only four role types');
for(const r of ['Inspecteur','Expert','Procureur','Juge','Avocat'])assert(!html.includes('<b>'+r+'</b>'),'in-game illegal role: '+r);
assert(html.includes('TERREUR : six rôles uniquement')&&html.includes('la conclusion officielle de l’Enquêteur'),'TERROR rulebook missing');
console.log('PASS TERREUR v703: six roles, no specialists, correct final authority.');
