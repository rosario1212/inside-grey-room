// v101: OMERTA campaign branch can be selected once, only after
// all five episodes are independently ready with a third-cycle guarantee.
// Zero narrative content is present in this repository.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const filename='supabase/migrations/20261018061000_v101_omerta_campaign_branch.sql';
const src=await readFile(filename,'utf8');
assert.match(src,/create table if not exists igr_private\.igr_v101_omerta_campaign_branches/i);
assert.match(src,/campaign_id uuid primary key references public\.igr_omerta_campaigns\(id\)/i);
assert.match(src,/for update/i,'serialize simultaneous draws via campaign row');
assert.match(src,/for chapter_no in 1\.\.5 loop/i);
assert.match(src,/igr_private\.igr_v100_preflight\(episode\)/i);
assert.match(src,/release_eligible/i);
assert.match(src,/if branches <> 3 then return null/i);
assert.match(src,/on conflict\(campaign_id\) do nothing/i);
assert.match(src,/where l\.room_code=upper\(trim\(p_room_code\)\)/i);
assert.match(src,/revoke all on function igr_private\.igr_v101_pin_omerta_branch\(uuid\) from public,anon,authenticated/i);
assert.match(src,/revoke all on function igr_private\.igr_v101_omerta_room_branch\(text\) from public,anon,authenticated/i);
assert(!/\bgrant\s+execute/i.test(src));
assert(!/\bcreate or replace function public\./i.test(src));
assert(!/\bupdate public\.igr_v4_rooms/i.test(src));
console.log('v101: campaign branch continuity remains private, immutable and dormant');
