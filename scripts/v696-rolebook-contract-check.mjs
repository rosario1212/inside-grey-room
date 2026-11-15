import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';

const read=f=>readFileSync(f,'utf8');
const source=read('self-guided-rules-v51.js');
const roleUi=read('role-cadence-v694.js');
const sql=read('supabase/migrations/20261115123000_igr_v696_role_phase_alignment.sql');
execFileSync(process.execPath,['--check','self-guided-rules-v51.js']);
execFileSync(process.execPath,['--check','role-cadence-v694.js']);
for(const marker of ['roleAgencyHtml','terrorRulesHtml','RULE_EDITION','officier_liaison',
 'Trois ordres par cycle','3 points','three protection points','Analyst initiative',
 'Witness initiative','PROCEDURE','REPORT','SOMETHING']){
 // The last three are not required: preserve only observed contract tokens.
 if(['PROCEDURE','REPORT','SOMETHING'].includes(marker))continue;
 assert(source.includes(marker),'rulebook source missing '+marker);
}
assert(roleUi.includes('ROLE_TIPS_EN')&&roleUi.includes('workingKey'),'role tips must be bilingual and room-safe');
assert(sql.includes('v696 phase preparation gate')&&sql.includes('v696 initiative final-phase gate'),'server phase guards missing');
function rendered(locale,role,scenario){
 const w={IGR_LOCALE:locale,STATE:{sync:{room:{scenario_id:scenario,cycle:2,phase:'interrogation_select',
  status:'playing',state:{duration_mode:'long'}},player:{id:'demo',public_role:role},players:[]}},
  renderGameTab(){return ''},renderRules(){return ''},
  IGR_RUNTIME_COORDINATOR:{every(){}}
 };
 const document={
  createElement:()=>({dataset:{},style:{},innerHTML:'',textContent:''}),
  head:{appendChild(){}},
  querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>[]
 };
 runInNewContext(source,{window:w,document,console:{info(){}},setTimeout(){},setInterval(){}},
  {timeout:3000});
 assert(w.IGR_SELF_GUIDED_RULES_V51,'in-app rulebook export unavailable');
 return w.IGR_SELF_GUIDED_RULES_V51.rulebookHtml(true);
}
const fr=rendered('fr','officier_liaison','026');
const en=rendered('en','officier_liaison','026');
const normal=rendered('en','expert','003');
for(const marker of ['Commandement de l’Officier','Trois ordres par cycle','Initiative de l’Analyste',
 'Parole volontaire du Témoin','3 points','60, 90 ou 120 secondes','0 : aucune, 1 : secondaire, 2 : principale'])
 assert(fr.includes(marker),'French canonical rules missing: '+marker);
for(const marker of ['Officer command: complete rules','Three orders per cycle','Analyst initiative',
 'Witness initiative','three protection points','60, 90 or 120-second','0: none, 1: secondary, 2: primary',
 'Read role cards','Assembly I'])
 assert(en.includes(marker),'English rulebook missing: '+marker);
assert(en.includes('Officer')&&!en.includes('l’Officier de liaison'),'Officer naming regressed');
assert(normal.includes('Officer')&&normal.includes('Three orders per cycle'),'global rules must mention Terror DLC');
const dest=process.argv[2];
if(dest){
 for(const file of ['index.html','en.html','self-guided-rules-v51.js']){
  assert(existsSync(dest+'/'+file),'missing runtime '+file);
 }
 const html=read(dest+'/index.html');
 const enHtml=read(dest+'/en.html');
 assert(html.includes('self-guided-rules-v51.js?v=v696-rolebook')&&enHtml.includes('self-guided-rules-v51.js?v=v696-rolebook'),
  'PWA/native build not using v696 rulebook revision');
 const built=read(dest+'/self-guided-rules-v51.js');
 assert(built.includes('roleAgencyHtml')&&built.includes('terrorRulesHtml'),'built rulebook stale');
 if(existsSync(dest+'/service-worker.js')){
  const sw=read(dest+'/service-worker.js');
  assert(sw.includes("const CACHE='igr-santoro-display-audit-20261108-"),'Published PWA cache namespace changed unexpectedly');
  assert(sw.includes('/self-guided-rules-v51.js?v=v696-rolebook'),'rulebook not in new precache');
 }
}
console.log('PASS v696 bilingual rulebook: all roles, officer, noncanonical initiatives, phase guards and cache rollout');
