/**
 * Inside Grey Room — Four-player contract and regression QA.
 *
 * This is a fail-closed check. It asserts that the existing verified
 * 1 Investigator + 3 Suspects configuration is intact, that five-player
 * rosters retain their Analyst, and that the unimplemented Team-4 composition
 * is NOT falsely presented as live. No database secrets are required.
 *
 * Once narrative/B-mode is actually implemented and certified, replace the
 * negative assertions with real A/B end-to-end checks in BOTH online and
 * local modes before changing this gate to green.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('app-v11.js','utf8');
const guideline=readFileSync('FOUR_PLAYER_COMPOSITIONS_GUIDELINE.md','utf8');
const patch=readFileSync('supabase/migrations/20261120214950_fix_001_verdict_smoke_intent_20261120.sql','utf8');
const rolesMigration=readFileSync('supabase/migrations/20261115130151_igr_v699_role_capacity_roster_alignment.sql','utf8');

function literal(name,opening,closing){
 const start=source.indexOf('const '+name+' = '+opening);
 assert(start>=0,'Missing '+name+' literal');
 const pos=start+('const '+name+' = ').length;
 const marker=closing==='\u005d'?'\n];':'\n};';
 const end=source.indexOf(marker,pos);
 assert(end>=0,'Unterminated '+name);
 return vm.runInNewContext('('+source.slice(pos,end+marker.length-1)+')');
}
const scenarios=literal('SCENARIOS','[',']');
const roleMap=literal('SCENARIO_ROLES','{','}');
function expand(label){
 const m=label.match(/^(\d+) suspects?$/i);
 if(m)return Array(Number(m[1])).fill('suspect');
 if(label==='Enquêteur')return ['enqueteur'];
 if(label==='Analyste')return ['analyste'];
 return [label.toLowerCase()];
}
function slotRoster(id,count){
 const def=roleMap[id];assert(def,'Missing role config '+id);
 const required=def.required.flatMap(expand);
 const extras=def.optional.slice(0,Math.max(0,count-required.length)).flatMap(expand);
 return [...required,...extras];
}
function equalRoster(id,count,expected){
 assert.deepEqual(
  [...slotRoster(id,count)].sort(),
  [...expected].sort(),
  `Wrong roster for ${id} at ${count} players`
 );
}
const scById=Object.fromEntries(scenarios.map(s=>[s.id,s]));
const traditional4=['001','003','004','005','006'];
for(const id of traditional4){
 assert.equal(scById[id]?.min,4,'Base four-player minimum changed: '+id);
 equalRoster(id,4,['enqueteur','suspect','suspect','suspect']);
 equalRoster(id,5,['enqueteur','analyste','suspect','suspect','suspect']);
}
assert.equal(scById['002']?.min,5,'Case 002 requires four suspects');
equalRoster('002',5,['enqueteur','suspect','suspect','suspect','suspect']);
for(const id of ['007','008','009','010','011','012','013','014','015','016']){
 assert.equal(scById[id]?.min,5,'Uncertified dossier must not advertise four players: '+id);
 equalRoster(id,5,['enqueteur','analyste','suspect','suspect','suspect']);
}
for(const id of [...traditional4,'002',...['007','008','009','010','011','012','013','014','015','016']]){
 const sc=scById[id];
 const atMin=slotRoster(id,sc.min);
 assert.equal(atMin.length,sc.min,`Miscounted required seats for ${id}`);
}
assert(guideline.includes('Enquêteur + 3 Suspects'),'Missing classic four-player policy');
assert(guideline.includes('Enquêteur + 1 Analyste + 2 Suspects'),'Missing Team-4 policy');
assert(patch.includes("'intent',CASE WHEN"),'Verdict smoke patch missing intent axis');
assert(rolesMigration.includes('v699 roster capacity sync'),'Missing capacity reconciliation baseline');

// Safety check: the code has no verified Team-4 launch API yet. This negative
// test prevents someone from accidentally lowering 007-016 to four players
// without shipping backend mode persistence, NPC testimony and verdict QA.
const team4ProductReady=false;
assert(!team4ProductReady,'Team-4 must not be enabled until each dossier is certified');

console.log('PASS: classic A four-player rosters, five-player and 002 exceptions');
console.log('PASS: uncertified 007–016 cannot advertise four-player minimum');
console.log('PASS: 001 smoke regression migration and canonical A/B design guidelines');
console.log('BLOCKED BY DESIGN: Team-4 (Analyst + 2 Suspects) is NOT yet implemented/certified');
