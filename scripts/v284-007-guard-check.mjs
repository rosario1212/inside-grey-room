import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const [app, privilegeMigration, contract] = await Promise.all([
  readFile('app-v11.js', 'utf8'),
  readFile('supabase/migrations/20261023185000_v284_revoke_007_investigation_until_release.sql', 'utf8'),
  readFile('SCENARIO_007_RELEASE_GATES.md', 'utf8')
]);

// The public app can display only scenario-scoped titles and reports already
// authorized by the server; private story packs never belong in this source.
assert.match(app, /\['001','002','003','004','005','006','007'\]/);
assert.match(app, /r\.scenario_id==='007'\?'investigation_007'/);
assert.match(app, /igr_v292_007_investigate/);
assert.match(app, /role==='enqueteur'|\['enqueteur','analyste'\]/);
assert.match(app, /payload\.reconstruction_007=\{cause,actor,decoy\}/);
for (const axis of ['igr007Cause', 'igr007Actor', 'igr007Decoy']) {
  assert(app.includes(axis), 'Missing final reconstruction field: ' + axis);
}
assert.match(app, /currentCase==='007'\?\['cause','actor','decoy'\]/);

// The visible catalog follows a Boolean-only server release gate.
// Room creation and launch recheck freshly and fail closed on RPC errors.
assert.match(app, /DOSSIER 007 NON PUBLIÉ/);
assert.match(app, /IGR007_PUBLISH=\{enabled:false/);
assert.match(app, /igr_v291_007_catalog_enabled/);
assert.match(app, /igr_v292_007_investigate/);
assert.match(app, /if\(id==='007'&&!IGR007_PUBLISH.enabled\)return toast/);
assert.match(app, /if\(sc.id==='007'\)\{/);
assert.match(app, /if\(STATE.sync\?\.room\?\.scenario_id==='007'\)\{/);
assert.match(app, /SCENARIOS.filter\(s=>\(s.id!=='007'\|\|IGR007_PUBLISH.enabled\)/);
assert.match(app, /EN PRÉPARATION/);
assert.doesNotMatch(app, /scenarioClientIsReleased/);

// A code deployment cannot silently unlock the privileged RPC.
assert.match(privilegeMigration, /REVOKE EXECUTE ON FUNCTION public\.igr_v282_007_investigate/);
assert.match(privilegeMigration, /FROM PUBLIC, anon, authenticated/);
assert.doesNotMatch(privilegeMigration, /(?:^|\n)\s*GRANT\s+EXECUTE\b/im);

// Keep the specific go/no-go decision explicit and human-verifiable.
assert.match(contract, /3\/3/);
assert.match(contract, /ne pas fusionner/i);
const parse = spawnSync(process.execPath, ['--check', 'app-v11.js'], { encoding: 'utf8' });
assert.equal(parse.status, 0, 'app-v11.js syntax error: ' + parse.stderr);

console.log('007 client contracts and deny-by-default migration: PASS.');
console.log('Not a publication certificate: server release status and 5-player E2E QA are still mandatory.');
