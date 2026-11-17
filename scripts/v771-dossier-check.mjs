/* v771: public dossier contracts. Run after npm build, no network required. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=path.resolve(process.argv[2]||path.join(root,'dist'));
const source=await readFile(path.join(root,'common-dossier-v106.js'),'utf8');
const built=await readFile(path.join(bundle,'common-dossier-v106.js'),'utf8');
const sql=await readFile(path.join(root,'supabase/migrations/20261117200729_igr_v771_common_dossier_public_progress_and_collective_release.sql'),'utf8');
new Function(source);
new Function(built);
for(const phrase of ['igr_v771_dossier_candidates','igr_v771_dossier_vote','disclosurePanel()','syncDisclosure()','PIÈCE COMMUNIQUÉE · À RECOUPER','BILAN PUBLIC DU CYCLE'])
  assert(source.includes(phrase)&&built.includes(phrase),'Missing v771 UI or bundle feature: '+phrase);
assert(sql.includes('after update of cycle,status'),'Cycle transition hook not installed');
assert(sql.includes("new.status <> 'playing'"),'Do not publish in lobby or finished rooms');
assert(sql.includes('e.visibility=\'roles\''),'Publication proposals must originate from role-authorized evidence');
assert(sql.includes('actor.public_role=any(e.audience_roles)'),'Publication proposals must enforce source visibility');
assert(sql.includes('count(distinct a.player_id)'),'Distinct-player consensus required');
assert(sql.includes('if v_votes<2 then'),'One player must not release alone');
assert(sql.includes("v_publications>=2"),'Per-cycle disclosure limit missing');
assert(sql.includes("'public_evidence','public'"),'Approved evidence must be explicitly public');
assert(sql.includes("'public_notice','public'"),'Independent cycle notice must be public');
assert(sql.includes('not between 2 and 3'),'No premature automatic reveal in cycle 1');
for(let id=1;id<=44;id++){
 const label=String(id).padStart(3,'0');
 assert(sql.includes("when '"+label+"' then"),'Missing scenario-safe cycle guidance: '+label);
}
console.log('PASS v771: 44 dossiers, public summaries, consent barrier, display classes and bundle syntax');
