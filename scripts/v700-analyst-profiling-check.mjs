import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=f=>readFileSync(f,'utf8');
const js=read('analyst-profiling-v700.js');
const rules=read('self-guided-rules-v51.js');
const sql=read('supabase/migrations/20261115143000_igr_v700_analyst_two_question_profiles.sql');
for(const f of ['analyst-profiling-v700.js','self-guided-rules-v51.js'])execFileSync(process.execPath,['--check',f]);
for(const marker of ["igr_v700_psych_profiles","igr_v700_submit_psych_profile",
 "r.status='finished'","a.action_type='igr_v700_psych_profile'",
 "p.public_role='analyste'","coalesce((a.payload->>'match_no')::integer,1)=match_",
 "canonical_evidence"]){
 assert(sql.includes(marker),'Missing server guard '+marker);
}
assert(!sql.includes("INSERT INTO public.igr_v4_events"),'no public broadcast during play');
assert(read('app-v11.js').includes("'rules','profiling'].includes(STATE.tab)"),
 'profiling tab must persist across server reconciliation');
assert(read('app-v11.js').includes("if(STATE.tab!=='profiling')STATE.tab='investigation'"),
 'final reveal must retain the profiling tab when chosen');
assert(rules.includes('Profilage psychologique de l’Analyste')&&rules.includes('Analyst psychological profiling'),
 'Rolebook missing FR/EN profiling rules');
const listeners={};
const sandbox={
 window:{IGR_LOCALE:'fr',toast:()=>{}},
 document:{addEventListener:(evt,fn)=>{listeners[evt]=fn},querySelector:()=>null},
 console:{warn:()=>{}},
 STATE:{view:'game',tab:'profiling',room:'Q700',token:'ANALYST',sync:{
  room:{status:'playing',phase:'interrogation_select',cycle:1,state:{match_no:1}},
  player:{id:'A',public_role:'analyste'}
 }},
 gameTabs:()=>[{id:'card',label:'Carte'},{id:'investigation',label:'Enquête'}],
 renderGameTab:()=>'<p>Existing gameplay remains intact</p>',
 renderGame:()=>{},Date,Map,
 rpc:async(name)=>{
  assert.equal(name,'igr_v700_psych_profiles');
  if(sandbox.STATE.sync.room.status==='finished')
   return {enabled:true,published:true,can_write:false,profiles:[
    {cycle:1,suspect_id:'s1',suspect_pseudo:'Suspect A',answer_one:'Sa stratégie reste prudente.',answer_two:'Un témoignage reste contradictoire.'}]};
  return {enabled:true,published:false,can_write:true,cycle:1,
   suspects:[{id:'s1',pseudo:'Suspect A'},{id:'s2',pseudo:'Suspect B'}],profiles:[]};
 }
};
runInNewContext(js,sandbox,{timeout:3000});
assert(sandbox.gameTabs().some(x=>x.id==='profiling'),'Analyst profiling tab absent');
assert(sandbox.renderGameTab().includes('Chargement'),'safe loading placeholder absent');
await sandbox.window.IGR_ANALYST_PROFILING_V700.refresh(true);
let out=sandbox.renderGameTab();
assert.equal((out.match(/<textarea id="igr700-(?:one|two)-[^\"]+" rows="2"/g)||[]).length,4,'two questions for each of two suspects');
assert(out.includes('Suspect A')&&out.includes('Suspect B'),'suspect panels not independent');
assert(out.includes('Quels propos ou faits connus'),'second grounded question missing');
assert(!out.includes('Profils psychologiques de l’Analyste'),'profiles prematurely published');
sandbox.STATE.sync.player.public_role='suspect';sandbox.STATE.token='SUSPECT';
sandbox.STATE.tab='investigation';
assert(!sandbox.gameTabs().some(x=>x.id==='profiling'),'suspects could open unfinished profiles');
sandbox.STATE.sync.room.status='finished';sandbox.STATE.tab='profiling';
assert(sandbox.gameTabs().some(x=>x.id==='profiling'),'postgame player access missing');
await sandbox.window.IGR_ANALYST_PROFILING_V700.refresh(true);
out=sandbox.renderGameTab();
assert(out.includes('Sa stratégie reste prudente.'),'completed profile not public');
assert(!out.includes('<textarea'),'postgame archive must be read-only');
for(const path of ['index.html','en.html']){
 const html=read(path);
 assert(html.includes('analyst-profiling-v700.js?v=v700-analyst-psychology'),path+' missing client script');
 assert(html.includes('analyst-profiling-v700.css?v=v700-analyst-psychology'),path+' missing styling');
}
for(const path of ['scripts/build-web.mjs','scripts/build-mobile.mjs']){
 const txt=read(path);assert(txt.includes("'analyst-profiling-v700.js'")&&txt.includes("'analyst-profiling-v700.css'"),path+' missing bundle assets');
}
const dest=process.argv[2];
if(dest){
 for(const file of ['analyst-profiling-v700.js','analyst-profiling-v700.css','index.html','en.html'])
  assert(existsSync(dest+'/'+file),'built asset not found '+dest+'/'+file);
 const html=read(dest+'/index.html');
 assert(html.includes('analyst-profiling-v700.js?v=v700-analyst-psychology'),
  'published entrypoint missing profiling option');
 const sw=dest+'/service-worker.js';
 if(existsSync(sw))assert(read(sw).includes('/analyst-profiling-v700.js?v=v700-analyst-psychology'),
  'PWA worker not precaching the new profiling option');
}
console.log('PASS v700: 2 two-line questions per suspect, private during play, readable by everyone at the end, bilingual bundles.');
