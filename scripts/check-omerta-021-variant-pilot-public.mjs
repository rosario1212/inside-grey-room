#!/usr/bin/env node
// Editorial audit of public manifest only. Never import sealed variant truth.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const p = JSON.parse(await readFile('qa/omerta-021-variants-public-readiness.json','utf8'));
const d = await readFile('docs/OMERTA_021_VARIANT_A_B_C_PILOT_PUBLIC_AUDIT.md','utf8');
assert.equal(p.dossier,'021');
assert.equal(p.variant_count,3);
assert.equal(p.public_repo_contains_sealed_answers,false);
assert.equal(p.verified_private_editorial_structure.cycles_per_variant,3);
assert.equal(p.verified_private_editorial_structure.case_specific_role_slots_per_variant,7);
assert.ok(p.verified_private_editorial_structure.guaranteed_independent_c3_sources_per_variant>=2);
assert.equal(p.verified_private_editorial_structure.private_tips_total,21);
assert.equal(p.verified_private_editorial_structure.standalone_case,true);
assert.equal(p.narrative_reconciliation.v22_v23_gallo_homicide_supported_in_anchor,false);
assert.equal(p.narrative_reconciliation.must_avoid_using_gallo_homicide_as_021_goal,true);
assert.equal(p.live_source.pack_variants_json_property_present,false);
assert.equal(p.live_source.pack_trames_count_per_scenario,3);
assert.equal(p.live_source.room_min_observed,4);
assert.equal(p.live_source.room_max_observed,8);
assert.ok(Object.values(p.release_criteria).every(v=>v===false), 'not ready to merge');
assert.match(d, /TRAMES|trames/);
assert.match(d, /A\/B\/C/);
assert.match(d, /non déploy|NON DÉPLOY|NON DEPLOY|en production|runtime/);
assert.match(d, /Gallo/);
assert.match(d, /aucune vérité|sans spoiler|confidenti/i);
// Block common leaks from the public memo, not a substitute for CI secrets scanning.
for(const marker of ['LA DETTE CACHÉE','L’ORDRE RELAYÉ','LA SOMME FANTÔME','A-C3-01','B-C3-02','C-C3-01']) {
 assert.ok(!d.includes(marker), 'sealed variant text leaked into public audit: '+marker);
}
console.log('OMERTA 021 PUBLIC PILOT PASS — non-spoiler audit, three private editorial variant drafts, gap against actual live packs documented, NOT release-ready.');
