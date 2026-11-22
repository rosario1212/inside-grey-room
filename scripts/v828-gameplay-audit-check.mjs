import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=f=>readFileSync(f,'utf8');
const base=read('app-v11.js'),final=read('final-audience-v52.js'),
 profiling=read('analyst-profiling-v700.js'),polish=read('audit-gameplay-v828.js'),
 css=read('audit-gameplay-v828.css'),index=read('index.html'),
 sw=read('service-worker.js'),web=read('scripts/build-web.mjs'),
 mobile=read('scripts/build-mobile.mjs'),
 sql=read('supabase/migrations/20261122150000_v828_no_judge_defenses_direct.sql'),
 authority=read('game-tab-stability-host-v827.js'),
 stageSql=read('supabase/migrations/20261122135000_v827_investigator_confrontation_and_skip_guard.sql'),
 manuscript=read('sql/v780_variant_manuscripts_204.sql');
assert.doesNotThrow(()=>new Function(final),'final runtime syntax');
assert.doesNotThrow(()=>new Function(profiling),'profile runtime syntax');
assert.doesNotThrow(()=>new Function(polish),'editorial runtime syntax');
for(const id of ['igr001Moment','igr001Gesture','igr001Reframe','igr001Intent'])
 assert(base.includes('id="'+id+'"'),id+' absent from canonical finale');
assert(base.includes('payload.reconstruction_001={moment,gesture,reframe,intent}'));
assert(final.includes("typeof renderFinalLockForm==='function'"),'Finale must use original 001-020 reconstruction');
assert(final.includes('igr828-reconstruction'),'Complete report should be visible');
assert(!final.includes('1 personne = 1 voix · ni Juge ni Procureur'),'Absent roles mentioned in ballot');
assert(sql.includes("p_stage='audience' and not public.igr_v44_judge_present(p_room)"));
assert(sql.includes("igr_v52_begin_stage(p_room,'defenses')"));
assert(final.includes("1 · "+'$'+"{copy('Défenses','Defences')}"),'No Judge first step is defences');
assert(!profiling.includes('profils obligatoires enregistrés'));
assert(!profiling.includes('Obligatoire : deux réponses'));
assert(profiling.includes('Facultatif : deux réponses'));
assert(profiling.includes('ni le verdict'));
assert(manuscript.includes('02 h 48')&&manuscript.includes('02 h 55'));
assert(polish.includes('02:48 est l’arrivée à l’hôtel'));
assert(polish.includes('vers 02:55, l’entrée dans la chambre'));
assert(authority.includes("==='enqueteur'"));
assert(authority.includes('igr_v827_end_confrontation'));
assert(stageSql.includes("r.phase in ('interrogation','event_confrontation')"));
assert(polish.includes('return original.apply(this,arguments)'));
for(const f of ['audit-gameplay-v828.css','audit-gameplay-v828.js']){
 assert(index.includes(f+'?v=20261122-audit-v828'),'index missing '+f);
 assert(sw.includes('/'+f+'?v=20261122-audit-v828'),'PWA missing '+f);
 assert(web.includes("'"+f+"'"),'web build missing '+f);
 assert(mobile.includes("'"+f+"'"),'native build missing '+f);
}
assert(index.includes('analyst-profiling-v700.js?v=v828-optional-profiles-20261122'));
assert(sw.includes("const CACHE='igr-v830-final-ballot-guard-20261122'"));
assert(css.includes('safe-area-inset-bottom'));
assert(css.includes('min-height: 44px'));
const a=final.indexOf('function reassessment(){'),b=final.indexOf('function renderFinal(){',a);
assert(a>0&&b>a,'Final renderer boundaries');
const snippet=final.slice(a,b);
function renderFor(id){
 const context={
  room:()=>({scenario_id:id,state:{v52_locks_required:2,v52_locks_received:0}}),
  role:()=> 'enqueteur',judgePresent:()=>false,specialCartel029:()=>false,
  invRoles:new Set(['enqueteur','analyste','procureur','juge','inspecteur','expert']),
  hasAction:()=>false,copy:fr=>fr,
  suspects:()=>[{id:'suspect-1',pseudo:'A'}],esc:String,
  scaleForm:()=>'<div id="generic-level-form">GENERIC</div>',
  renderFinalLockForm:()=>'<div id="canonical-001-020-form">RECONSTRUCTION</div>',
  Math,Number
 };
 return vm.runInNewContext(snippet+'\nreassessment()',context);
}
assert(renderFor('001').includes('canonical-001-020-form'));
assert(renderFor('020').includes('canonical-001-020-form'));
assert(!renderFor('001').includes('generic-level-form'));
assert(renderFor('021').includes('generic-level-form'));
console.log('PASS v828: original final renderer, no Judge, optional profiles, roles, canonical times and mobile asset delivery.');
