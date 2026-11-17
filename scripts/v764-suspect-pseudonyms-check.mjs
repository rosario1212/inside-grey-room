import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const path='supabase/migrations/20261117164305_igr_v764_dynamic_suspect_names_only_in_private_projections.sql';
const sql=readFileSync(path,'utf8');

for(const piece of [
 'igr_v764_alias_text','igr_v764_alias_card',
 'igr_v764_visible_suspect_card',
 "raw->'room'->>'scenario_id' in ('005','006')",
 "raw->'player'->>'public_role'='suspect'",
 "raw->'room'->>'status' in ('playing','finished')",
 "'{player,private_state}'",
 'p.internal_slot=n.slot',
 "p.public_role='suspect'",
 'ORDER BY pg_catalog.length(n.canonical) DESC',
 'pg_catalog.regexp_replace',
 'pg_catalog.replace',
 '⟦IGR_V764_SLOT_',
 "result_card->'relations'",
 "r.rel->'text'",
 'ELSE r.rel END',
 'FROM PUBLIC;'
])assert(sql.includes(piece),'Missing role-safe pseudonymization: '+piece);

// Fixed cast slots verified against all three approved manuscripts per case.
const cast={
 '005':{'1':['Lucien Varenne','Lucien'],'2':['Nils Ferrand','Nils'],'3':['Gabriel Sorel','Gabriel']},
 '006':{'1':['Hugo'],'2':['Eliott'],'3':['Mathis']}
};
for(const [scenario,slots] of Object.entries(cast))
 for(const [slot,names] of Object.entries(slots))
  for(const name of names)
   assert(sql.includes("('"+scenario+"',"+slot+",'"+name+"')"),
    'Alias missing: case '+scenario+', slot '+slot+', '+name);

// Never alter the actual pinned truth, scenes or user data.
assert(!/\b(?:insert|update|delete)\s+(?:into\s+|from\s+)?(?:igr_private\.)?igr_v99_/i.test(sql),
 'Never mutate private canon versions to change a player-visible name');
assert(!/\bupdate\s+public\.igr_v4_players\b/i.test(sql),
 'Do not rewrite persistent user private state');
assert(sql.includes('REVOKE ALL ON FUNCTION igr_private.igr_v764_visible_suspect_card'),
 'The alias helper must not be callable by public API roles');
assert(sql.includes("pg_catalog.strpos(fn,needle)=0"),
 'Do not silently rewrite a different igr_v4_sync implementation');
console.log('PASS v764: 005/006 dynamic pseudos in private card only; NPCs, canon, roles and evidence unchanged.');
