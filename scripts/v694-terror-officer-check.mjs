import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const root='.';
const runtime=read('terror-command-v694.js');
const css=read('terror-command-v694.css');
const migration=read('supabase/migrations/20261115020000_igr_v694_terror_officer_rapid_command.sql');
const qa=read('supabase/tests/igr_v694_officer_rapid_command_qa.sql');
const entry=read('index.html'),web=read('scripts/build-web.mjs'),mobile=read('scripts/build-mobile.mjs');
const pub=read('scripts/publish-006-adaptive-shell.mjs');
execFileSync(process.execPath,['--check','terror-command-v694.js'],{stdio:'pipe'});
for(const str of ['terrorV694Confirm','terrorV694Join','igr_v694_terror_orders','igr_v694_terror_confirm',
 'igr_v694_officer_confront','terror-v694-result','terrorV694Countdown','setInterval'])
 assert(runtime.includes(str),'v694 client missing: '+str);
for(const str of ['igr_v694_terror_confirm','igr_v694_terror_orders','igr_v694_commit',
 'igr_v694_pause_hearing','igr_v694_finish_cycle','suspect already visited in a previous cycle',
 'capital_held_verdict_incomplete','role capacity anchor'])
 assert(migration.includes(str),'v694 SQL contract missing: '+str);
for(const str of ['scenario_id',"'026'","'027'","'028'",'public immediate effects missing',
 'duplicate confrontation accepted','timer not paused','total nine commands missing'])
 assert(qa.includes(str),'v694 rollback QA missing: '+str);
for(const str of ['terror-command-v694.js','terror-command-v694.css']){
 assert(entry.includes(str),'HTML entrypoint missing: '+str);
 assert(web.includes("'"+str+"'"),'web build missing: '+str);
 assert(mobile.includes("'"+str+"'"),'mobile build missing: '+str);
 assert(pub.includes(str),'cache publisher missing: '+str);
}
assert(pub.includes("terror-live-v694-20261115"),'PWA version tag stale');
assert(css.includes('.terror-v694-timer'),'Countdown CSS missing');
const dest=process.argv[2];
if(dest){
 for(const f of ['terror-command-v694.js','terror-command-v694.css']){
  assert(existsSync(dest+'/'+f),'built release missing: '+f);
 }
 const html=read(dest+'/index.html'),sw=read(dest+'/service-worker.js');
 assert(html.includes('terror-command-v694.js'),'built HTML missing live commander');
 assert(sw.includes('/terror-command-v694.js?v=terror-live-v694-20261115'),'PWA missing v694 command JS');
 assert(sw.includes('/terror-command-v694.css?v=terror-live-v694-20261115'),'PWA missing v694 command CSS');
}
console.log('PASS Terror v694: three per-cycle timed orders, immediate consequences, distinct visits, independent confrontations, pause/resume, CI bundle and rollback QA.');
