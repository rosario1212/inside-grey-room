import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261117190000_igr_v765_cast_pseudonyms_omerta_cartel.sql','utf8');
for(const fragment of [
 'igr_v765_cast_aliases',
 'igr_v765_alias_document',
 'igr_v764_alias_text',
 'igr_omerta_room_variant_snapshots',
 'igr_omerta_room_cast_slots',
 'c.player_id',
 'p.internal_slot=c.internal_slot',
 "p.public_role='suspect'",
 "r.state->>'omerta_standalone'='true'",
 "snap.match_no=greatest(1,coalesce((r.state->>'match_no')::integer,1))",
 "'Damián « Dami » Salcedo'",
 "'Damián'",
 "'Dami'",
 "'relations','conversation_hooks','variant_card'",
 "'what_you_hide','your_chronology','variant_secret','text'",
 "raw->''player''->>''public_role''=''suspect''",
 "raw->''room''->>''status'' in (''playing'',''finished'')",
 "'{player,private_state}'",
 'REVOKE ALL ON FUNCTION igr_private.igr_v765_cast_aliases',
 'REVOKE ALL ON FUNCTION igr_private.igr_v765_alias_document',
 "pg_catalog.strpos(fn,'igr_v764_visible_suspect_card')=0"
])assert(sql.includes(fragment),'Incomplete private name projection: '+fragment);
assert(!/\b(?:UPDATE|INSERT INTO|DELETE FROM)\s+(?:igr_private\.)?(?:igr_v99_variant_manuscripts|igr_omerta_room_variant_snapshots|igr_v4_players)\b/i.test(sql),
 'Canon and persistent player identities must not be modified');
assert(sql.includes('public.igr_v4_players p'),'Names must come from real player seats, not invented aliases');
assert(!sql.includes("raw:=jsonb_set(raw,'{scenario}"),'Do not disclose player-cast links to investigators');
console.log('PASS v765 — Omertà and Cartel 030 named suspects use current seat pseudos in private views; NPCs, canon, public clues unchanged');
