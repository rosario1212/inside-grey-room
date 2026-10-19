// v106 fail-closed static and bundle checks. This is NOT a substitute for live role tests.
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const target=path.resolve(process.argv[2]||'dist');
const root=process.cwd();
const fetch=async (name,base=root)=>readFile(path.join(base,name),'utf8');
const [runtime,notify,sql,build]=await Promise.all([
 fetch('common-dossier-v106.js'),fetch('notifications-v12.js'),
 fetch('supabase/migrations/20261019012600_v106_common_dossier_visibility.sql'),
 fetch('scripts/apply-common-dossier-v106.mjs')
]);
for(const f of ['common-dossier-v106.js','notifications-v12.js','scripts/apply-common-dossier-v106.mjs']){
 const status=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});
 assert.equal(status.status,0,f+': '+status.stderr);
}
assert.match(runtime,/const AUTH=new Set\(\['enqueteur','analyste','procureur','juge','inspecteur','expert'\]\)/);
assert.match(runtime,/if\(id==='investigation'\)return isInquiry\(\)/);
assert.match(runtime,/if\(S\(\)\?\.tab==='timeline'\)return publicHtml\(\)/);
assert.match(runtime,/igr_v106_common_dossier/);
assert.match(runtime,/const origCard/);
assert.match(runtime,/details\.className='igr106-fact'/);
assert.match(runtime,/className='igr106-action-panel'/);
assert.match(runtime,/press50/);
assert.match(runtime,/cache\.key!==k/);
assert.match(runtime,/press_claim/);
assert.match(notify,/d\.player\?\.id/,'notification key must include player identity');
assert.match(notify,/localStorage\.removeItem\(name\)/);
assert.match(notify,/Inside Grey Room · Nouvelle information/);
assert.match(notify,/data-cycle="1"/);
assert.match(notify,/cycle:\[1,2,3\]\.includes/);
assert.match(notify,/route==='investigation'&&!allowed/);
assert.match(sql,/e\.visibility='public'/);
assert.match(sql,/p\.player_token|player_token=p_player_token/);
assert.match(sql,/igr_private\.rate_limit/);
assert.match(sql,/e\.cycle/);
assert.match(sql,/e\.event_type='reveal' and current_room\.status='finished'/);
assert.match(sql,/grant execute on function public\.igr_v106_common_dossier\(text,uuid\) to anon/i);
assert(!/grant\s+select\s+on\s+public\.igr_v4_events\s+to\s+anon/i.test(sql));
const [html,en,sw,builtRuntime,builtNotify]=await Promise.all([
 fetch('index.html',target),fetch('en.html',target),
 fetch('service-worker.js',target),fetch('common-dossier-v106.js',target),
 fetch('notifications-v12.js',target)
]);
for(const [name,doc] of [['index',html],['en',en]]){
 assert.match(doc,/common-dossier-v106\.js\?v=v106-common-dossier/);
 const pos=doc.lastIndexOf('common-dossier-v106.js');
 assert(!/<script\s[^>]*src=/i.test(doc.slice(pos)),'v106 must be last external runtime in '+name);
 if(name==='index')assert.match(doc,/notifications-v12\.js\?v=v106-common-dossier/);
}
assert.equal(builtRuntime,runtime);
assert.equal(builtNotify,notify);
assert.match(sw,/igr-v106-common-dossier/);
assert.match(sw,/common-dossier-v106\.js\?v=v106-common-dossier/);
assert.match(sw,/notifications-v12\.js\?v=v106-common-dossier/);
assert.match(build,/apply/);
console.log('v106: public dossier, role gating, notification privacy, cycle provenance and web/mobile bundle PASS');