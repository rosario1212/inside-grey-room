#!/usr/bin/env node
// Public safety gate: does NOT read the private canon pack.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const p=JSON.parse(await readFile('qa/omerta-v24-private-15-variants-public-release-manifest.json','utf8'));
const d=await readFile('docs/OMERTA_V24_15_VARIANTS_SECURITY_AND_RELEASE_GATES.md','utf8');
assert.equal(p.version,'OMERTA-V24');
assert.equal(p.status,'PRIVATE_EDITORIAL_DRAFTS_AND_QA_NOT_LIVE');
assert.equal(p.case_count,5);
assert.equal(p.variants_per_case,3);
assert.equal(p.variant_count,15);
assert.equal(p.roles_per_private_variant,7);
assert.equal(p.total_variant_role_slots,105);
assert.equal(p.private_compact_player_card_drafts,105);
assert.ok(p.private_compact_player_card_max_visible_words<=120);
assert.equal(p.private_compact_player_cards_active_live,false);
assert.equal(p.private_offer_cards_prepared,105);
assert.equal(p.private_offer_cards_active_live,false);
assert.equal(p.qualifying_private_tip_candidates,105);
assert.equal(p.guaranteed_independent_C3_sources,30);
assert.equal(p.optional_draft_role_corrob_sources,84);
assert.equal(p.public_is_spoiler_free,true);
assert.equal(p.release_ready,false);
assert.equal(p.production_security_read_only_findings.production_mutated,false);
assert.equal(p.production_security_read_only_findings.several_security_definer_omerta_RPC_publicly_executable,true);
assert.equal(p.production_security_read_only_findings.security_definer_rpc_exposure_audited_for_authorization,false);
assert.ok(Object.values(p.release_gate).every(x=>x===false),'Do not silently mark draft as release-ready');
for(const c of ['021','022','023','024','025']) {
 assert.ok(p.cases.some(x=>x.id===c));
 assert.ok(d.includes('**'+c+' —'),c+' public canon correction absent');
}
for(const t of ['Gallo','Falco','Valenti','Benedetti','Massimo De Luca','A/B/C','vrai','utile','ÉNONCÉ','RLS','SECURITY DEFINER','C3']) {
 assert.ok(d.includes(t),'missing public safety caveat '+t);
}
const combined=(await readdir('docs')).concat(await readdir('qa'));
for(const name of combined){
 assert.ok(!/^OMERTA_02[1-5]_A_B_C_CANONS_PRIVES_DRAFT/.test(name),'PRIVATE CANON FILE LEAK: '+name);
 assert.ok(!/OMERTA_021_025_PACK_PRIVE/.test(name),'PRIVATE PACK LEAK: '+name);
}
assert.ok(!d.includes('"truth_by_axis"'),'Raw variant canon must not be included');
assert.ok(!d.includes('"role_slots"'),'Raw sealed private roles must not be included');
console.log('OMERTA V24 PUBLIC GATE PASS: 15 confidential drafts accounted for, narrative V7 corrections, RLS/RPC caveat, no public sealed files, release blocked.');
console.log('NOT VERIFIED: exact secrets, private optional clue proofs, live variant assignment, RPC authorization, verdict, mobile or multiplayer.');
