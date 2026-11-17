#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const scripts=['app-v11.js','gameplay-flow-v13.js','common-dossier-v106.js','investigation-workspace-v634.js','cast-names-v772.js','idle-choice-v772.js'];
for(const file of scripts){
  execFileSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{stdio:'pipe'});
}
const app=read('app-v11.js'), shared=read('common-dossier-v106.js');
const html=read('index.html'), sw=read('service-worker.js');
const sql=read('supabase/migrations/20261117224500_igr_v772_cycle_choice_quiz_timer.sql');
assert.match(app,/const limit=1;/,'Investigation chooser must limit selections');
assert.match(app,/thisCycle\.length>=1/,'Late dossier selectors must close after one');
assert.doesNotMatch(app,/Trois trames principales et une trame facultative/,'Old four-piece UI text must be gone');
assert.match(shared,/const sameOpening=e\?\.event_type==='context'/,'Duplicate context is filtered');
assert.match(shared,/redundantCycleSummary/,'Repetitive cycle notices are filtered');
assert.match(sql,/create trigger igr_v772_one_choice/,'Server-side enforcement is required');
assert.match(sql,/create trigger igr_v772_phase_timer/,'Server must own 60-second timer');
assert.match(sql,/QUESTIONNAIRE DE FIN DE CYCLE/,'Cycle 2/3 event sequence must include quiz');
assert.doesNotMatch(sql,/if r\.phase='cycle_debrief' then perform public\.igr_v4_emit_trame/,'Do not skip quiz on the same tick');
assert.match(sql,/igr_v772_cast_names/,'Authenticated slot-to-pseudo mapping required');
for(const file of ['cast-names-v772.js','idle-choice-v772.js','live-game-v772.css']){
  assert.ok(html.includes(file),'Missing asset in HTML: '+file);
  assert.ok(sw.includes(file),'Missing asset in PWA precache: '+file);
}
console.log('v772 source contracts and six JavaScript syntax checks passed');
