import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(f,'utf8');
const sql=read('supabase/migrations/20261122164500_v832_provisional_vote_guard.sql');
const app=read('app-v11.js'),flow=read('gameplay-flow-v13.js');
const workflow=read('.github/workflows/cloudflare-production-deploy.yml');
assert(sql.includes("if r.phase='provisional_lock' then")&&
 sql.includes("Accusations provisoires requises"),'Server must reject host provisional skip');
assert(!sql.includes("if r.phase='provisional_lock' then\n    update public.igr_v4_rooms"),
 'Old automatic bypass of provisional accusation must not survive');
assert(sql.includes("r.phase='locking' and")&&sql.includes("v52_final_reassessment"),
 'Sealed final ballot and special finalization guards must remain');
assert(sql.includes("r.phase in ('interrogation','event_confrontation')"),
 'Investigator-only active conversations must remain');
assert(app.includes("room.phase!=='provisional_lock'"),
 'Base host UI must not offer to skip provisional accusation');
assert(flow.includes("return !!(STATE.hostToken&&ph==='locking')"),
 'Classic dossiers must not restore the provisional host skip');
assert(workflow.includes('node scripts/v832-provisional-guard-check.mjs'),
 'Production pipeline must enforce the provisional-skip regression');
console.log('PASS v832: no host short-circuit of provisional accusations; final votes and conversation guards intact.');
