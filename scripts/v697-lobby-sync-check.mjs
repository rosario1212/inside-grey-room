// Regression gate: creating a private-variant room must not require its
// sealed A/B/C snapshot until the host actually starts the match.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync('supabase/migrations/20261115123500_igr_v697_lobby_snapshot_sync.sql','utf8');
assert.match(migration,/igr_omerta_legacy_sync_core\(text,uuid\)/);
assert.match(migration,/FOR n IN 8\.\.20 LOOP/);
assert.match(migration,/r\.status<>''lobby''/);
assert.match(migration,/IF position\(before_clause in ddl\)>0 THEN/);
assert.match(migration,/r\.status=''lobby'' and r\.scenario_id between ''008'' and ''020''/);
assert.match(migration,/jsonb_build_object\(''context'',pack->>''context''\)/);
assert.match(migration,/unexpected sync implementation; refusing to patch/);
assert.match(migration,/EXECUTE ddl/);
assert.doesNotMatch(migration,/create\s+or\s+replace\s+function\s+public\.igr_v4_start_game/i);
console.log('PASS v697: lobby sync does not require future private snapshots; public context only, active game sealed.');
