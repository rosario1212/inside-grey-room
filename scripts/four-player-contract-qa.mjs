/**
 * Inside Grey Room — Four-player contract and regression QA.
 *
 * This is a fail-closed check. It asserts that the existing verified
 * 1 Investigator + 3 Suspects configuration is intact, and tests the
 * explicitly opted-in Team-4 composition in case 001. Other dossiers remain
 * fail-closed until their own A/B/C variant adaptations are certified.
 *
 * These are static and simulated rules checks; human multiplayer playtests
 * and database end-to-end QA remain separate deployment prerequisites.
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
 assert.equal(scById[id]?.min,id==='009'?4:5,'Incorrect dossier minimum: '+id);
 equalRoster(id,5,['enqueteur','analyste','suspect','suspect','suspect']);
}
for(const id of [...traditional4,'002',...['007','008','009','010','011','012','013','014','015','016']]){
 const sc=scById[id];
 const atMin=slotRoster(id,sc.min);
 if(id==='009')assert.equal(sc.min,4,'009 must start at four');
 else assert.equal(atMin.length,sc.min,`Miscounted required seats for ${id}`);
}
assert(guideline.includes('Enquêteur + 3 Suspects'),'Missing classic four-player policy');
assert(guideline.includes('Enquêteur + 1 Analyste + 2 Suspects'),'Missing Team-4 policy');
assert(patch.includes("'intent',CASE WHEN"),'Verdict smoke patch missing intent axis');
assert(rolesMigration.includes('v699 roster capacity sync'),'Missing capacity reconciliation baseline');

// Evaluate the ACTUAL lobby role-slot function under both room states.
// No dependency on DOM or browser globals for the target case.
const start=source.indexOf('function expandRoleLabel(');
const end=source.indexOf('function roleCapacityMap(',start);
assert(start>=0&&end>start,'Lobby roster functions missing');
const rosterFns=source.slice(start,end);
function actualLobbyRoster(id,count,mode){
 const sandbox={
  SCENARIO_ROLES:roleMap,
  ROLE_LABEL_TO_ID:{'Enquêteur':'enqueteur','Analyste':'analyste','Suspect':'suspect',
    'suspect':'suspect','suspects':'suspect','Juge':'juge','Expert':'expert',
    'Procureur':'procureur','Journaliste':'journaliste','Avocat':'maitre',
    'Maître':'maitre','Témoin':'temoin'},
  STATE:{sync:{room:{state:{four_player_mode:mode},min_players:4,max_players:5}}}
 };
 const actual=vm.runInNewContext(rosterFns+'\n lobbyRoleSlots({id:'+JSON.stringify(id)+'},'+count+')',sandbox);
 return JSON.parse(JSON.stringify(actual)).sort();
}
assert.deepEqual(actualLobbyRoster('001',4,'classic'),
 ['enqueteur','suspect','suspect','suspect'].sort());
assert.deepEqual(actualLobbyRoster('001',4,'team'),
 ['enqueteur','analyste','suspect','suspect'].sort());
assert.deepEqual(actualLobbyRoster('004',4,'team'),
 ['enqueteur','analyste','suspect','suspect'].sort());
assert.deepEqual(actualLobbyRoster('009',4,'classic'),
 ['enqueteur','suspect','suspect','suspect'].sort());
assert.deepEqual(actualLobbyRoster('009',4,'team'),
 ['enqueteur','analyste','suspect','suspect'].sort());
assert.deepEqual(actualLobbyRoster('001',5,'team'),
 ['enqueteur','analyste','suspect','suspect','suspect'].sort());
for(const id of traditional4.filter(id=>!['001','004'].includes(id))){
 assert.deepEqual(actualLobbyRoster(id,4,'team'),
  ['enqueteur','suspect','suspect','suspect'].sort(),
  'Uncertified Team-4 must be blocked: '+id);
}
assert(!source.includes('fourModePanel')&&!source.includes('Composition à 4 joueurs'),'Redundant manual composition panel returned');
assert(source.includes('igr_v4_choose_role'),'Authoritative role-choice RPC missing');
const local=readFileSync('play-modes-v13-8.js','utf8');
assert(local.includes("['001','004','009'].includes(id)&&count===4&&mode==='team'"),'Local mode roster absent');
assert(local.includes('IGR_001_ARCHIVED_WITNESS')&&local.includes('IGR_004_ARCHIVED_WITNESS')&&local.includes('IGR_009_ARCHIVED_WITNESS'),'Local witness statements missing');
const migration=readFileSync('supabase/migrations/20261120230000_igr_v800_team4_001.sql','utf8');
for(const expected of ['igr_v800_set_four_player_mode','igr_v800_role_for_seat',
'igr_v800_role_capacity','igr_v800_team4_enabled',
'igr_v4_start_game','igr_v4_build_private_card','igr_v4_leave_room',
"r.scenario_id<>'001'","'nonplayer',true"]){
 assert(migration.includes(expected),'Missing Team-4 database guard: '+expected);
}
const v805=readFileSync('supabase/migrations/20261120234500_igr_v805_team4_004.sql','utf8');
assert(v805.includes("p_scenario IN ('001','004')")&&v805.includes('igr_v805_team4_allowed'),
 'Server must keep an exact whitelist for 001 and 004');
const v806=readFileSync('supabase/migrations/20261121000100_igr_v808_team4_009_qualified_release.sql','utf8');
assert(v806.includes("p_scenario IN ('001','004','009')")&&v806.includes("when p_scenario='009' then 4"),
 '009 release requires an explicit whitelist and authoritative four-player minimum');
assert(['007','008','010','011','012','013','014','015','016']
 .every(id=>scById[id].min>=5),'Uncertified scenarios must remain five-player');

// Analyst can be reserved while the certified four-player lobby fills.
// Role picks and random draws retain a fixed viewport instead of card anchoring.
const polish=readFileSync('role-tree-polish-v12-29.js','utf8');
const lobbyUi=readFileSync('lobby-ui-fix-v13.js','utf8');
const lobbyCss=readFileSync('lobby-ui-fix-v13.css','utf8');
const html=readFileSync('index.html','utf8');
assert(source.includes('otherSuspects<=2?1:0'),'Analyst must not displace a third reserved suspect');
assert(!source.includes('const analystPreview='),'Locked Analyst preview returned');
assert(source.includes("if(me?.preferred_role==='analyste')caps.suspect=3"),'Analyst must be able to switch back to the third suspect seat');
for(const id of ['001','004','009'])for(const count of [1,2,3,4]){
 assert.deepEqual(actualLobbyRoster(id,count,'team'),['enqueteur','analyste','suspect','suspect'].sort());
 assert.deepEqual(actualLobbyRoster(id,count,'classic'),['enqueteur','suspect','suspect','suspect'].sort());
}
assert(source.includes('igr-roster-variant'),'Two explicit four-player roster cards missing');
assert(!source.includes('<strong>ou</strong>'),'Old inline roster conjunction reappeared');
assert(!source.includes('const oldRoleTop='),'Duplicate core scroll anchor reappeared');
assert(!polish.includes('restoreRoleAnchor('),'Multi-frame scroll restoration reappeared');
assert(!polish.includes('animateFrom('),'Role-card FLIP motion reappeared');
assert(lobbyUi.includes('const sameLobby='),'Role updates must detect the same mounted lobby');
assert(lobbyUi.includes('const scrollY=sameLobby?window.scrollY:0'),'Role updates must preserve the actual viewport position');
assert(!lobbyUi.includes('scrollY+delta'),'A changing card must never shift the viewport');
assert(lobbyCss.includes('.igr-role-preview'),'Analyst preview styling missing');
assert(html.includes('v831-mobile-ux-20261122'),'Current mobile app revision missing');
console.log('PASS: stationary role cards, exact viewport retention, early Analyst selection, automatic composition and no manual lobby panel');

console.log('PASS: classic, 001/004/009 Team-4 online room slot allocation');
console.log('PASS: five-player, 002 and all other scenario safety exceptions');
console.log('PASS: local choice and neutral nonplayer witnesses for 001/004/009');
console.log('PASS: guarded 001-only SQL migration and 001 smoke verdict audit');
console.log('BLOCKED BY DESIGN: other scenarios do NOT yet claim Team-4 readiness');
