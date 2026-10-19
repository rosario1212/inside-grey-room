import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist');
const [source,compiled,html,en,sql]=await Promise.all([
readFile('cartel029-leadership-v119.js','utf8'),
readFile(path.join(target,'cartel029-leadership-v119.js'),'utf8'),
readFile(path.join(target,'index.html'),'utf8'),readFile(path.join(target,'en.html'),'utf8'),
readFile('supabase/migrations/20261019064000_v118_cartel029_leaders_correspondence.sql','utf8')
]);
for(const file of ['cartel029-leadership-v119.js','scripts/apply-cartel029-leadership-v119.mjs']){
 const x=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(x.status,0,file+' '+x.stderr);
}
assert.equal(source,compiled);
for(const document of [html,en]){
 assert(document.includes('cartel029-v107.js'));
 assert(document.includes('cartel029-leadership-v119.js?v=v119-cartel'));
 assert(document.indexOf('cartel029-v107.js')<document.indexOf('cartel029-leadership-v119.js'));
}
assert.match(source,/r\?\.scenario_id==='029'/);
assert.match(source,/cartel029_ready===true/);
assert.match(source,/roster=\['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'\]/);
assert.match(source,/igr_v118_cartel_correspondence/);
assert.match(sql,/igr_v108_029_is_enabled\(\)/);
assert.match(sql,/actor\.public_role not in \('don','bras_droit','suspect'\)/);
assert.match(sql,/actor\.public_role='suspect' and receiver\.public_role='suspect'/);
assert.match(sql,/perform igr_private\.assert_ugc/);
assert.match(sql,/target_player_id,cycle,payload/);
assert.doesNotMatch(sql,/\bgrant\s+select\b/i);
console.log('Cartel 029 v119: separate leaders, guarded messages, client role scope PASS');
