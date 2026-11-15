import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const natural=read('natural-role-gameplay-v50.js'),rules=read('self-guided-rules-v51.js');
const expected={enqueteur:5,suspect:4,procureur:3,juge:4,maitre:3,journaliste:3,inspecteur:3,analyste:3,expert:2,temoin:2,officier_liaison:5};
const readActivity=s=>{const m=s.match(/const ACTIVITY=(\{[^;\n]+\});/);assert(m,'missing activity map');return Function('return ('+m[1]+')')();};
assert.deepEqual(readActivity(natural),expected,'lobby activity ratings do not match v697');
assert.deepEqual(readActivity(rules),expected,'rulebook activity ratings must match lobby');
assert(natural.includes("ACTIVITÉ','ACTIVITY")&&natural.includes('stars(activityRating(r))'),'lobby stars not wired');
assert(rules.includes('ESTIMATED ACTIVITY')&&rules.includes('stars(activityRating(r,global))')&&rules.includes('COURTROOM_ACTIVITY'),'rulebook stars absent');
assert(rules.includes('Stars estimate likely activity, not difficulty or importance'),'rating meaning missing');
for(const file of ['natural-role-gameplay-v50.js','self-guided-rules-v51.js'])execFileSync(process.execPath,['--check',file]);
for(const lang of ['fr','en']){
 const window={IGR_LOCALE:lang,STATE:{sync:{room:{scenario_id:'026',cycle:2,status:'playing',state:{}},player:{public_role:'officier_liaison'},players:[]}},renderGameTab(){return''},renderRules(){return''},IGR_RUNTIME_COORDINATOR:{every(){}}};
 const document={createElement(){return {dataset:{},style:{}}},head:{appendChild(){}},querySelector(){return null},getElementById(){return null},querySelectorAll(){return []}};
 runInNewContext(rules,{window,document,setTimeout(){},setInterval(){},console:{info(){}}},{timeout:2500});
 const rendered=window.IGR_SELF_GUIDED_RULES_V51.rulebookHtml(true);
 assert(rendered.includes(lang==='fr'?'ACTIVITÉ ESTIMÉE':'ESTIMATED ACTIVITY'),'localized stars label absent');
 assert(rendered.includes(lang==='fr'?'Officier':'Officer'),'Terror officer missing');
 const stars=[...rendered.matchAll(/(?:ACTIVITÉ ESTIMÉE|ESTIMATED ACTIVITY) · ([★☆]{5})/g)].map(x=>x[1]);
 assert.equal(stars.length,11,'expected 11 visible public role ratings');
 assert.equal(stars[10],'★★★★★','Officer must have 5 stars');
 assert.equal(stars[1],'★★★☆☆','Analyst must have 3 stars');
 assert.equal(stars[7],'★★☆☆☆','Expert must have 2 stars');
 assert.equal(stars[9],'★★☆☆☆','Witness must have 2 stars');
}
const dist=process.argv[2];
if(dist){
 assert(existsSync(dist+'/natural-role-gameplay-v50.js'),'built lobby script missing');
 assert(existsSync(dist+'/self-guided-rules-v51.js'),'built rulebook script missing');
 assert.deepEqual(readActivity(read(dist+'/natural-role-gameplay-v50.js')),expected);
 assert.deepEqual(readActivity(read(dist+'/self-guided-rules-v51.js')),expected);
}
console.log('PASS v711 activity stars: 11 roles, five-star scale, synchronized lobby/rules, FR/EN.');
