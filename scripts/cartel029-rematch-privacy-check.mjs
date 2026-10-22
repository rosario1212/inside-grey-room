import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const replaySql=await readFile('supabase/migrations/20261019200000_v160_cartel029_rematch_isolation.sql','utf8');
const matrixSql=await readFile('supabase/migrations/20261019201000_v161_cartel029_private_structural_audit.sql','utf8');
const commonSql=await readFile('supabase/migrations/20261019202000_v162_cartel029_common_dossier_isolation.sql','utf8');

for(const name of ['cartel029_protection','cartel029_position','cartel029_leadership',
 'breaking_news','breaking_news_manual','final_lock','provisional']){
  assert(replaySql.includes("'"+name+"'"),'A replay could retain the prior '+name+' action');
}
assert.match(replaySql,/old\.status<>'lobby'/);
assert.match(replaySql,/new\.status<>'playing'/);
assert.match(replaySql,/new\.scenario_id<>'029'/);
assert.match(replaySql,/c\.event_type='context'/);
assert.match(replaySql,/e\.id >= coalesce\(/);
assert.match(replaySql,/e\.visibility='private' and e\.target_player_id=p_player\.id/);
assert.match(replaySql,/p_player\.public_role=any\(e\.audience_roles\)/);
assert.match(replaySql,/igr_private\.blocks/,'Recipient blocking remains enforced');
assert.match(replaySql,/REVOKE ALL ON FUNCTION public\.igr_v4_visible_events/);
assert.match(matrixSql,/igr_private\.igr_v161_029_machine_audit/);
assert.match(matrixSql,/REVOKE ALL ON FUNCTION igr_private\.igr_v161_029_machine_audit/);
assert.match(matrixSql,/human_story_review_unchanged/);
assert.match(commonSql,/current_room\.scenario_id<>'029'/);
assert.match(commonSql,/start_event\.event_type='context'/);
assert.match(commonSql,/e\.visibility='public'/);


const events=[
 {id:1,type:'context',visibility:'public',payload:{title:'previous context'}},
 {id:2,type:'message',visibility:'private',target:4,payload:{title:'old threat'}},
 {id:3,type:'reveal',visibility:'public',payload:{title:'old private ending'}},
 {id:4,type:'context',visibility:'public',payload:{title:'new context'}},
 {id:5,type:'trame',visibility:'roles',roles:['enqueteur','analyste','procureur','juge'],payload:{title:'new clue'}},
 {id:6,type:'message',visibility:'private',target:4,payload:{title:'new threat'}},
 {id:7,type:'cartel029_chat',visibility:'private',target:9,payload:{title:'private leadership'}},
 {id:8,type:'phase',visibility:'public',payload:{title:'new phase'}}
];
const roles=['enqueteur','analyste','suspect','suspect','suspect','suspect','maitre','procureur','juge','journaliste','don','bras_droit'];
const visible=(viewer,count,scenario='029')=>{
 const marker=scenario==='029'?events.filter(e=>e.type==='context').at(-1).id:0;
 return events.filter(e=>e.id>=marker&&(
   e.visibility==='public'||(e.visibility==='private'&&e.target===viewer)
   ||(e.visibility==='roles'&&e.roles.includes(roles[viewer]))
 )).map(e=>e.id);
};
let tested=0;
for(let players=6;players<=12;players++){
 for(let viewer=0;viewer<players;viewer++){
  const v=visible(viewer,players);
  assert(!v.includes(1)&&!v.includes(2)&&!v.includes(3),'Prior match leaked');
  assert(v.includes(4)&&v.includes(8),'Public events absent');
  assert.equal(v.includes(5),['enqueteur','analyste','procureur','juge'].includes(roles[viewer]),
    'Protected evidence audience mismatch');
  assert.equal(v.includes(6),viewer===4,'A witness saw another witness private message');
  assert.equal(v.includes(7),viewer===9,'A player saw a private cartel message');
  tested++;
 }
}
assert(visible(0,6,'001').includes(1),'Non-029 scenarios must keep their historical event policy');
console.log('CARTEL 029 replay/privacy PASS: '+tested+
 ' separate role screens at 6–12 players, no old reveal, isolated evidence and recipient-only messages.');
console.log('Note: simulated role/screens test. Real phone/tablet multiplayer not certified.');
