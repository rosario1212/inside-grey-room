import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync('app-v11.js','utf8');
const db=readFileSync('supabase/migrations/20261025040000_igr_optional_roles_003_008_009_011.sql','utf8');
const prosecutorVariant=readFileSync('supabase/migrations/20261025041000_igr_011_prosecutor_variant_runtime.sql','utf8');
const index=readFileSync('index.html','utf8');
const sw=readFileSync('service-worker.js','utf8');
const finalizer=readFileSync('scripts/finalize-cartel030-release.mjs','utf8');

const cases=[
  {id:'003',min:4,role:'Expert',key:'expert'},
  {id:'008',min:5,role:'Juge',key:'juge'},
  {id:'009',min:5,role:'Expert',key:'expert'},
  {id:'011',min:5,role:'Procureur',key:'procureur'}
];
for(const {id,min,role,key} of cases){
 const card=new RegExp("\\{id:'"+id+"',[^\\n]*min:"+min+",max:6,");
 assert.match(app,card,'Scenario capacity must show 6 seats for '+id);
 assert.match(app,new RegExp("'"+id+"':\\{required:\\[[^\\n]*'Enquêteur'[^\\n]*'3 suspects'[^\\n]*\\],optional:\\[[^\\n]*'"+role+"'"),'Optional role not displayed for '+id);
 assert(db.includes("'"+id+"'"),'Missing SQL for '+id);
 assert(db.includes("public.igr_v4_max_players('''||item.case_id||''')=6"),'Missing protected release gate amendment');
 assert(db.includes("'"+key+"'"),'Missing role ID '+key);
}
for(const id of ['007','010','012']){
 assert.match(app,new RegExp("'"+id+"':\\{required:\\['Enquêteur','Analyste','3 suspects'\\],optional:\\[\\]"),'Neighbor scenario must remain unchanged '+id);
}
assert(db.includes("public.igr_v4_min_players('003')<>4"),'4-player 003 compatibility guard missing');
assert(db.includes("Five-player roster changed in %"),'Old roster assertion missing');
assert(db.includes("igr_v220_003_build_pack"),'003 pinned pack must keep expert_actions');
assert(db.includes("'{expert_actions}'"),'Expert has no actual choices');
assert(db.includes("'{protected}'"),'008 Judge has no protected procedural items');
assert(prosecutorVariant.includes('igr_private.igr_v371_011_pinned_pack(p_room)'), '011 prosecutor must use pinned A/B/C variant');
assert(index.includes('v580-019-grand-bal'));
assert(sw.includes("igr-v580-019-grand-bal"));
assert(sw.includes('v580-019-grand-bal'));
assert(finalizer.includes("const clientVersion='v580-019-grand-bal'"),'Production finalizer would restore stale role cache');
console.log('Optional-role 003/008/009/011 contract: PASS (4/5-player rosters preserved; 6-player roles, private release guards, action content and PWA checked).');
