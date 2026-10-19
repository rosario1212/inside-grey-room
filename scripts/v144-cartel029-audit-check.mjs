import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const target=path.resolve(process.argv[2]||'dist');
const read=p=>readFile(p,'utf8');
const [reportSql,threatSql,dossier,roles,choices,build,reportUi,html,htmlEn]=await Promise.all([
 read('supabase/migrations/20261019140000_v142_cartel029_report_protection_integrity.sql'),
 read('supabase/migrations/20261019141000_v143_cartel029_missing_threats.sql'),
 read('narrative-dossier-v87.js'),read('app-v11.js'),read('cartel029-v121.js'),
 read('scripts/apply-cartel029-v121.mjs'),read('cartel029-v107.js'),
 read(path.join(target,'index.html')),read(path.join(target,'en.html'))
]);
for(const filename of ['narrative-dossier-v87.js','app-v11.js','cartel029-v121.js']){
 const result=spawnSync(process.execPath,['--check',filename],{encoding:'utf8'});
 assert.equal(result.status,0,filename+' parse: '+result.stderr);
}
assert.match(reportSql,/room\.status='finished' and \(p_patch is not null or p_submit\)/);
assert.match(reportSql,/report closed after final reveal/);
assert.match(reportSql,/'target',p_target,'verified'/);
for(const pressure of ['M03','M04','M09','M10'])assert(threatSql.includes("'"+pressure+"'"),'Missing '+pressure);
assert.match(threatSql,/visibility,target_player_id,cycle,payload/);
assert.match(threatSql,/new\.status<>'playing'/);
assert.match(threatSql,/pressure_id'=v_id/);
assert.match(threatSql,/threat_not_confirmed',true/);
assert.match(roles,/if\(sc\?\.id==='029'\)/);
assert.match(roles,/Enquêteur · Analyste · 4 témoins/);
assert.match(roles,/Procureur · Juge · Journaliste · Don · Bras droit/);
assert.match(dossier,/const briefing029=\[/);
assert.match(dossier,/publicBrief029\(index\)/);
assert.match(dossier,/cartel029\(\)\?tr\('témoins','witnesses'\)/);
assert.match(dossier,/Il ne faisait pas partie des quatre fugitifs de Santa Ceniza/);
assert.doesNotMatch(dossier,/const briefing029=[\s\S]*?\];\s*function publicBrief029[\s\S]*?(?:secret_v5|canonical_truth)/i);
assert.match(choices,/function protectionProgress\(\)/);
assert.match(choices,/e\.payload\?\.target/);
assert.match(choices,/disabled aria-disabled="true"/);
assert.match(choices,/status\.thisCycle/);
for(const action of ['protectionPending','messagePending','positionPending']){
 assert.match(choices,new RegExp('if\\('+action+'\\|\\|!active\\(\\)'),'Repeated 029 commands must be blocked while a request is pending');
 assert.match(choices,new RegExp('finally\\{'+action+'=false\\}'),'029 action lock must always reset');
}
assert.match(build,/v145-cartel029-role-selection/);
assert.match(html,/cartel029-v121\.js\?v=v145-cartel029-role-selection/);
assert.match(htmlEn,/cartel029-v121\.js\?v=v145-cartel029-role-selection/);
assert.match(reportUi,/responsibility_choice/);
const lobbyQa=spawnSync(process.execPath,['scripts/cartel029-multiplayer-check.mjs'],{encoding:'utf8'});
assert.equal(lobbyQa.status,0,'029 6–11 players role-choice regression failed: '+lobbyQa.stdout+'\n'+lobbyQa.stderr);
console.log('029 audit v145 PASS: immutable final report; recipient-scoped threats; initial witness briefs; role catalog; protection state; cache versions.');
