import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const get=path=>readFile(path,'utf8');
const names=[
 'app-v11.js','index.html','service-worker.js',
 'supabase/migrations/20261025232000_igr_v540_018_private_core.sql',
 'supabase/migrations/20261025232010_igr_v545_018_investigation_reveal.sql',
 'supabase/migrations/20261025232020_igr_v550_018_start_cards_final.sql',
 'supabase/migrations/20261025232030_igr_v550_018_sync_forensic.sql',
 'supabase/migrations/20261025232040_igr_v551_018_inspector_pinned_evidence.sql',
 '.github/workflows/cloudflare-build-check.yml',
 '.github/workflows/cloudflare-production-deploy.yml'
];
const [app,html,sw,core,actions,hooks,sync,inspector,check,deploy]=await Promise.all(names.map(get));
const cache='v642-shortcards-001-004';
execFileSync(process.execPath,['--check','app-v11.js'],{stdio:'pipe'});
assert(html.includes('app-v11.js?v='+cache),'HTML cache version mismatch');
assert(sw.includes("const CACHE='igr-"+cache+"'"),'service worker cache mismatch');
assert(sw.includes('/app-v11.js?v='+cache),'service worker references stale app');
assert(app.includes("id:'018',title:'LES ASSIETTES VIDES'"),'018 absent');
assert(app.includes("min:6,max:9"),'018 supports 6 to 9 players');
assert(app.includes("optional:['Expert','Avocat','Journaliste']"),'018 optional roles missing');
assert(app.includes("Array.isArray(d.scenario?.investigation_018)"),'018 must display real private current-cycle titles');
assert(app.includes('igr_v546_018_investigate_index'),'018 indexed investigation missing');
assert(app.includes('payload.reconstruction_018={killer,tableau,prior_plan}'),'018 final lock missing');
assert(app.includes("currentCase==='018'?'reconstruction_018'"),'018 final result missing');
assert(app.includes("currentCase==='018'?['killer','tableau','prior_plan']"),'018 scoring axes missing');
assert(!app.includes('v540_verdict'),'secret answers must not appear in frontend');
assert(core.includes('igr_v540_018_build_pack'),'018 private story builder missing');
assert(core.includes('igr_v541_018_room_snapshots'),'018 room snapshot missing');
assert(core.includes('igr_v541_018_release_status'),'018 release guard missing');
assert(core.includes('ALTER TABLE igr_private.igr_v541_018_room_snapshots ENABLE ROW LEVEL SECURITY'),'018 private table requires RLS');
assert(core.includes('REVOKE ALL ON FUNCTION igr_private.igr_v540_018_safe_pack'),'018 secret pack must be inaccessible');
assert(core.includes('when p_scenario=\'018\' then 9'),'018 maximum player count must match');
assert(actions.includes('igr_v545_018_investigate'),'018 secure investigation missing');
assert(actions.includes('igr_v546_018_investigate_index'),'018 indexed wrapper missing');
assert(actions.includes('igr_v547_018_reveal_enrich'),'018 sealed truth scorer missing');
assert(actions.includes('igr_v549_018_room_release_guard'),'018 must fail closed before editorial approval');
assert(hooks.includes('igr_v541_018_pin_room'),'018 variant must lock at start');
assert(hooks.includes('reconstruction_018'),'018 final score must be included in lock');
assert(sync.includes("'investigation_018_used'"),'018 choice limit feedback missing');
assert(sync.includes("r.scenario_id not in ('016','017','018')"),'018 must not leak future expert titles');
assert(inspector.includes('igr_v541_018_pinned_pack'),'Inspector must use selected variant evidence');
assert(check.includes('node scripts/v560-018-release-integrity-check.mjs'),'018 CI missing');
assert(deploy.includes('node scripts/v560-018-release-integrity-check.mjs'),'018 production check missing');
console.log('PASS 018: 3 confidential variants, 6–9 players, Inspector, cycle-gated Expert, 9 investigations, three-axis verdict, PWA and deployment gates.');
