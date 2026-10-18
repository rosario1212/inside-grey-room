// Zero-spoiler release gate. Run locally and in CI before shipping any v99 work.
// The private drafts migration is not an activation mechanism.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
const sql=await readFile('supabase/migrations/20261018043000_v99_private_variant_drafts.sql','utf8');
assert.match(sql,/create table if not exists igr_private\.igr_v99_variant_manuscripts/i);
assert.match(sql,/enable row level security/i);
assert.match(sql,/revoke all on table igr_private\.igr_v99_variant_manuscripts from public,anon,authenticated/i);
assert(!/\bgrant\s+(select|execute|usage)\s+on[\s\S]+?\bto\s+(anon|authenticated|public)\b/i.test(sql),
  'No public access to author manuscripts');
const pinSql=await readFile('supabase/migrations/20261018043500_v99_private_room_canon_pin.sql','utf8');
assert.match(pinSql,/create table if not exists igr_private\.igr_v99_room_canons/i);
assert.match(pinSql,/enable row level security/i);
assert.match(pinSql,/revoke all on table igr_private\.igr_v99_room_canons from public, anon, authenticated/i);
assert.match(pinSql,/revoke all on function igr_private\.igr_v99_pin_room_canon\(text\) from public,anon,authenticated/i);
assert.match(pinSql,/revoke all on function igr_private\.igr_v99_pinned_room_canon\(text\) from public,anon,authenticated/i);
assert(!/\bgrant\s+execute\s+on\s+function\s+igr_private\.igr_v99_pin_room_canon/i.test(pinSql),'Room canon pin must never be granted to clients');
assert(!sql.match(/\b(update|insert)\s+(?:into\s+)?public\.igr_v4_scenario_packs\b/i),
  'An editorial schema migration may not replace production packs');
const dist='dist';
let names=[];
try{names=await readdir(dist,{recursive:true})}catch{}
for(const path of names){
  if(/canons?_.*variantes|bible_narrative|manuscrits?[_-]priv|variant[_-]manuscripts?.*json/i.test(path))
    throw Error('Private author manuscript must not be in Cloudflare bundle: '+path);
}
console.log('v99: private-manuscript schema, public access guard and web-bundle exclusion OK');
