import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const sql=read('supabase/migrations/20261122162000_v830_final_votes_required.sql'),
      ui=read('game-tab-stability-host-v827.js'),
      app=read('app-v11.js'),index=read('index.html'),
      sw=read('service-worker.js'),finalizer=read('scripts/finalize-cartel030-release.mjs');
execFileSync(process.execPath,['--check','game-tab-stability-host-v827.js']);
assert(sql.includes("r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false)"),'Server must recognize the sealed-vote phase');
const reject=sql.indexOf("raise exception 'Votes finaux obligatoires");
const legacy=sql.indexOf("elsif r.phase='locking' then");
assert(reject>0 && legacy>reject,'Final-vote guard must precede the old host reveal shortcut');
assert(sql.includes("Seul l''Enquêteur peut terminer cet échange"),'Investigator-only control preserved');
assert(sql.includes("perform public.igr_v52_maybe_finish(r.code)"),'Special legacy 029/031 finalization preserved');
assert(app.includes("rpc('igr_v4_lock_final'"),'Individual vote still submitted to canonical endpoint');
const start=ui.indexOf('const originalCanAdvance=window.phaseCanAdvance;');
const end=ui.indexOf('const legacyInstruction=',start);
assert(start>0 && end>start,'Host canAdvance wrapper accessible');
const segment=ui.slice(start,end);
function enabled(phase,flag) {
 const room=()=>({phase,state:{v52_final_reassessment:flag}});
 const window={phaseCanAdvance:()=>true};
 new Function('room','window',segment)(room,window);
 return window.phaseCanAdvance();
}
assert.equal(enabled('locking',true),false,'Host must not advance sealed final ballots');
assert.equal(enabled('locking','true'),false,'Stringified Boolean state must be safe');
assert.equal(enabled('locking',false),true,'Legacy flow remains permitted');
assert.equal(enabled('interrogation',true),false,'Host must not end interviews');
assert.equal(enabled('event_confrontation',false),false,'Host must not end confrontations');
assert.equal(enabled('cycle_debrief',false),true,'Ordinary host phase controls remain');
assert(index.includes('game-tab-stability-host-v827.js?v=20261122-v830-ballot-guard'));
assert(sw.includes('/game-tab-stability-host-v827.js?v=20261122-v830-ballot-guard'));
assert(sw.includes("const CACHE='igr-v831-mobile-ux-20261122'"));
assert(finalizer.includes("const pwaVersion='v831-mobile-ux-20261122'"));
console.log('PASS v830: no host vote bypass, individual 001 final lock retained, other roles and stages unchanged.');
