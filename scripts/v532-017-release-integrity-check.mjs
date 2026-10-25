import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const load=async path=>readFile(path,'utf8');
const [app,html,sw,db1,db2,db3,db4,workflow,prod]=await Promise.all([
  'app-v11.js','index.html','service-worker.js',
  'supabase/migrations/20261025214500_igr_v520_017_private_engine_and_roster.sql',
  'supabase/migrations/20261025214510_igr_v525_017_operations_and_reveal.sql',
  'supabase/migrations/20261025214520_igr_v530_017_runtime_hooks_a.sql',
  'supabase/migrations/20261025214530_igr_v530_017_runtime_hooks_b.sql',
  '.github/workflows/cloudflare-build-check.yml','.github/workflows/cloudflare-production-deploy.yml'
].map(load));

const cache='v533-017-evidence-titles';
execFileSync(process.execPath,['--check','app-v11.js'],{stdio:'pipe'});
assert(html.includes('app-v11.js?v='+cache),'Source HTML has stale game cache');
assert(sw.includes("const CACHE='igr-"+cache+"'"),'SW cache mismatch');
assert(sw.includes('/app-v11.js?v='+cache),'SW shell mismatch');

assert(app.includes("id:'017',title:'LE PRIX DU SILENCE'"),'017 missing from game catalog');
assert(app.includes('min:7,max:10'),'017 room size mismatch');
assert(app.includes("optional:['2e témoin','Avocat','Expert']"),'017 optional roles missing');
assert(app.includes('investigate017Index'),'017 optional investigations missing');
assert(app.includes('igr_v526_017_investigate_index'),'017 backend investigation not routed');
assert(app.includes('payload.reconstruction_017={act,decision,cover}'),'017 final decision not persisted');
assert(app.includes("currentCase==='017'?'reconstruction_017'"),'017 final reveal not shown');
assert(!app.includes('"v520_verdict"'),'017 private answer must not be embedded in public JS');

assert(db1.includes('igr_v320_017_build_pack'),'Private builder missing');
assert(db1.includes('igr_v520_017_safe_pack'),'Safe narrative builder missing');
assert(db1.includes('igr_v521_017_room_snapshots'),'Private immutable room snapshots missing');
assert(db1.includes('igr_v521_017_release_status'),'Release approval gate missing');
assert(db1.includes("public.igr_v4_max_players('017')=10"),'Published roster must be 7-10');
assert(db1.includes("REVOKE ALL ON FUNCTION igr_private.igr_v520_017_safe_pack"),'Confidential pack execute rights not revoked');
assert(db2.includes('igr_v525_017_investigate'),'Role-gated investigations missing');
assert(db2.includes('igr_v526_017_investigate_index'),'Indexed private investigations missing');
assert(db2.includes('igr_v527_017_reveal_enrich'),'Private verdict scorer missing');
assert(db2.includes('igr_v529_017_room_release_guard'),'Fail-closed room creation missing');
assert(db3.includes('igr_v521_017_pin_room'),'Room start must lock a variant');
assert(db3.includes('reconstruction_017'),'Three-axis final should be locked');
assert(db4.includes('igr_v521_017_pinned_pack'),'Private pack must be used for sync/reveal');
assert(db4.includes('igr_v527_017_reveal_enrich'),'Verdict scorer must be hooked into reveal');
assert(db4.includes("r.scenario_id in ('003','009','016','017')"),'017 Expert must honor existing cycle limits');
assert(workflow.includes('node scripts/v532-017-release-integrity-check.mjs'),'017 CI check missing');
assert(prod.includes('node scripts/v532-017-release-integrity-check.mjs'),'017 production preflight missing');
console.log('PASS 017: private variants, secure snapshots, optional roles 7-10, indexed investigations, verdict, expert cycle limits, CI and PWA cache.');
