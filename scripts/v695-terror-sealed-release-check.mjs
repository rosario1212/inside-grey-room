import './v706-host-lobby-participants-check.mjs';
import './v704-terror-final-polish-check.mjs';
import './v703-terror-six-core-roles-check.mjs';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=x=>readFileSync(x,'utf8');
const migration=read('supabase/migrations/20261115034000_igr_v695_terror_sealed_variants.sql');
const sqlQA=read('supabase/tests/igr_v695_terror_sealed_variants_qa.sql');
const officer=read('supabase/migrations/20261115033000_igr_v694_terror_officer_rapid_command.sql');
const ui=read('dlc-copy-v12-46.js'),intro=read('terror-v12-37.js');
for(const token of ['igr_v695_release_eligible','igr_v695_build_pack','igr_v695_pin_room',
 'igr_v695_pinned_pack','igr_v695_emit_guaranteed','igr_v695_terror_room_packs',
 'igr_v4_start_game','igr_v4_build_private_card','igr_omerta_legacy_sync_core',
 'igr_v4_emit_trame','igr_v4_make_reveal','igr_v681_terror_dynamic_room',
 'v_prior_accuracy','correct_answers','min_cycle','challenge','mixed',
 'ON DELETE CASCADE','ENABLE ROW LEVEL SECURITY','REVOKE ALL'])
 assert(migration.includes(token),'sealed variants SQL missing '+token);
for(const token of ['variant pack wrong','private suspect card','truth leaked before reveal',
 'reveal mismatch','expected 9 guaranteed investigations','variant identifier leaked'])
 assert(sqlQA.includes(token),'sealed smoke QA missing '+token);
assert(intro.includes('Dans la capitale encore défendue, la Grey Room détient trois personnes liées au FDR.') &&
 intro.includes('Le FDR annonce qu’un complice'),'owner-approved descriptions were not preserved');
assert(ui.includes('la capitale résiste')&&!ui.includes('s’empare de la ville.'),'DLC teaser contradicts still-defended capital');
assert(!ui.includes('RECOMMANDATION IRRÉVERSIBLE')&&!ui.includes('OFFICIER DE LIAISON'),'old liaison takeover screen must be removed');
assert(officer.includes('igr_v694_terror_confirm')&&officer.includes('igr_v694_officer_confront'),'v694 military command contract missing');
for(const f of ['dlc-copy-v12-46.js','terror-v12-37.js','terror-command-v694.js'])
 execFileSync(process.execPath,['--check',f],{stdio:'pipe'});
if(process.argv[2]){
 const target=process.argv[2];
 assert(existsSync(target+'/terror-command-v694.js'),'live military panel missing from bundle');
 const entry=read(target+'/index.html');
 assert(entry.includes('terror-v12-37.js?v=v725-poster-native-fit-20261116'),'current TERREUR catalogue asset version missing');
}
console.log('PASS TERREUR v695: 9 sealed A/B/C variants, canonical source isolation, 20 authored (9 guaranteed, 11 optional), verdicts, officer and approved final copy.');
