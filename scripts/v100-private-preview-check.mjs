// v100: statically enforce private-only preview and editorial fail-closed behavior.
// Never ship manuscript JSON, and never confuse "preflight" with playable variants.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=await readFile('supabase/migrations/20261018054000_v100_private_preview.sql','utf8');
assert.match(sql,/create or replace function igr_private\.igr_v100_preflight\(p_scenario text\)/i);
assert.match(sql,/create or replace function igr_private\.igr_v100_preview_runtime_pack\(p_scenario text,p_variant text\)/i);
assert.match(sql,/revoke all on function igr_private\.igr_v100_preflight\(text\) from public,anon,authenticated/i);
assert.match(sql,/revoke all on function igr_private\.igr_v100_preview_runtime_pack\(text,text\) from public,anon,authenticated/i);
assert.match(sql,/approved=3 and cycle_three_guarantees=3 and omerta_lock_missing=0/i);
assert.match(sql,/editorial_status='ready' and approved_by is not null/i);
assert.match(sql,/jsonb_build_object\(\s*'context',v->'public_briefing','suspects',cards,'relations',rels/i);
for(const forbidden of [
  /\bcreate or replace function public\.igr_v4_start_game/i,
  /\bcreate or replace function public\.igr_v4_sync/i,
  /\bupdate public\.igr_v4_scenario_packs/i,
  /\bgrant\s+execute\s+on\s+function\s+igr_private\.igr_v100_/i,
  /\bupdate\s+igr_private\.igr_v99_variant_manuscripts/i,
  /\bupdate\s+public\.igr_v4_rooms/i
]) assert(!forbidden.test(sql),'Preview must not alter live gameplay or client permissions');
const workflows=['.github/workflows/cloudflare-build-check.yml',
                 '.github/workflows/deploy-cloudflare-production.yml'];
for(const name of workflows){
  const content=await readFile(name,'utf8');
  assert.match(content,/v99-private-release-check\.mjs/i,
      name+' must keep the existing no-spoilers production guard');
}
console.log('v100: private-only preview, explicit approval and fail-closed release policy OK');
