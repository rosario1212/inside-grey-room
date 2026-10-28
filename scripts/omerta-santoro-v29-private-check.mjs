import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const load=p=>readFileSync(p,'utf8');
const indic=load('omerta-santoro-indic-v29.js');
const verdict=load('omerta-santoro-verdict-v28.js');
const pacts=load('supabase/migrations/20261028015500_omerta_v29_indic_state.sql');
const actions=load('supabase/migrations/20261028015600_omerta_v29_indic_actions.sql');
const scoring=load('supabase/migrations/20261028015700_omerta_v29_indic_goal_scoring.sql');
const sequence=load('supabase/migrations/20261028015800_omerta_v29_indic_final_verdict_order.sql');
const precise=load('supabase/migrations/20261028015000_omerta_v29_precise_signed_verdict.sql');
const gate=load('supabase/migrations/20261028014000_omerta_santoro_v29_editorial_goals_indic_gate.sql');
new vm.Script(indic,{filename:'omerta-santoro-indic-v29.js'});
new vm.Script(verdict,{filename:'omerta-santoro-verdict-v28.js'});
for(const token of [
 'igr_omerta_santoro_indic_status','igr_omerta_santoro_indic_action',
 "'offer'","'answer'","'signal'","'spoken'","'protect'","'review'",
 'Je souhaite en parler','J’en ai déjà parlé'
])assert.ok(indic.includes(token),'Missing Indic UX '+token);
for(const token of [
 "role_slot=p.internal_slot","i.review_status='verified'",
 "p.id=pact.investigator_id","p.id=pact.source_id","report.told_to_investigator"
])assert.ok(pacts.includes(token),'Missing private data isolation '+token);
const investigatorStatus=pacts.split('ELSIF p.id=pact.investigator_id')[1]?.split('END IF;')[0]||'';
assert.ok(!investigatorStatus.includes('topic_text'),'Investigator may receive a topic title, never a secret detail');
for(const token of [
 "actor.public_role<>'enqueteur'","actor.id<>pact.source_id",
 "role_slot=actor.internal_slot","review_status='verified'",
 "indic_one_official_report_per_cycle","pact.submitted_at IS NOT NULL"
])assert.ok(actions.includes(token),'Missing action authorization or deduplication '+token);
assert.ok(scoring.includes('pact.protected')&&scoring.includes('pact.reduction_years'));
assert.ok(scoring.includes('pact.usefulness_final')&&scoring.includes('intel_verified'));
assert.ok(scoring.includes("source_id=own.id AND accepted=true"));
assert.ok(sequence.includes('indic_final_review_required'));
assert.ok(precise.includes('igr_omerta_v29_precise_act_review'));
assert.ok(!precise.includes("responsibility_by_act' ? (e->>'act_axis')"),'Broad V28 act validation remains active');
assert.ok(gate.includes("3*(SELECT count(*)"),'Initial three-topic gate must exist');
const uniqueTopics=load('supabase/migrations/20261028020100_omerta_v29_unique_indic_topics_guard.sql');
assert.ok(uniqueTopics.includes('count(DISTINCT lower(btrim(i.topic_text)))=3'),'Different intelligence details required');
assert.ok(uniqueTopics.includes('count(DISTINCT i.source_event_id)>=2'),'Independent documentary anchors required');
for(const p of ['index.html','service-worker.js','scripts/build-web.mjs','scripts/build-mobile.mjs']){
 const contents=load(p);
 assert.ok(contents.includes('omerta-santoro-indic-v29.js'),p+' lacks Indic JS');
 assert.ok(contents.includes('omerta-santoro-indic-v29.css'),p+' lacks Indic CSS');
}
const titlePrivacy=load('supabase/migrations/20261028020300_omerta_v29_silent_unannounced_indic_topics.sql');
assert.ok(titlePrivacy.includes('AND (coalesce(report.intent_only,false) OR coalesce(report.told_to_investigator,false))'),
  'An investigator must not see a topic title before the source signals it');
assert.ok(!indic.includes('innerHTML'),'Never interpolate secret testimony into HTML');
const rankStart=load('supabase/migrations/20261028020200_omerta_v29_parallel_ranks_start.sql');
for(const invariant of [
 'santoro_rank_capacity_exceeded',
 'row_number() OVER (PARTITION BY p.preferred_role',
 "SET preferred_role='suspect'",
 'SET preferred_role=picked->>\'rank\',secret_role=picked->>\'rank\'',
 'igr_omerta_cast_standalone_room(r.code)'
]) assert.ok(rankStart.includes(invariant),'Santoro duplicate-rank start guard missing '+invariant);
assert.ok(rankStart.includes('public.igr_omerta_start_game(r.code,p_host_token)'),
  'Legacy starter must remain unchanged in Verri');
console.log('OMERTA V29 INDIC/VERDICT SECURITY, ACCESS AND BUNDLING: PASS');
