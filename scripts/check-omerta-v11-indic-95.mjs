#!/usr/bin/env node
// OMERTÀ V11 public design checks. This does NOT prove that a secret-source
// selection exists server-side; live release is deliberately blocked in the
// JSON contract until that is tested.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const file='qa/omerta-v11-indic-mandatory-95-contract.json';
const d=JSON.parse(await readFile(file,'utf8'));
const story=await readFile('docs/OMERTA_V11_MANDATORY_SECRET_INFORMANT_FIVE_95_CASES.md','utf8');
const tree=await readFile('omerta-santoro-family-v7.js','utf8');
const errors=[];
function check(cond,why){if(!cond)errors.push(why)}
const ids=['021','022','023','024','025'];
check(d.contract_version==='OMERTA-V11','version');
check(d.scenarios?.join(',')===ids.join(','),'scope 021–025');
check(d.ordinary_inside_grey_room_rules===true,'ordinary gameplay');
check(d.confrontation_first_cycle===2,'confrontation must start cycle 2');
check(d.four_laws?.length===4,'four laws');
check(d.story_split?.case_specific_percent_editorial===80,'80 percent story');
check(d.story_split?.shared_universe_percent_editorial===20,'20 percent shared');
check(d.informant?.exactly_one_per_room===true,'exactly one informant mandatory');
check(d.informant?.every_scenario===true,'all 5 cases need an informant');
check(d.informant?.hidden_to_other_players===true,'hidden informant');
check(d.informant?.mandatory_for_best_fully_supported_attribution===true,'the informant must materially matter');
check(d.informant?.mandatory_for_game_phase_progression===false,'no informant-caused phase deadlock');
check(d.informant?.player_can_withhold===true,'player agency on disclosure');
check(d.informant?.player_can_lie===true,'player agency on statements');
check(d.informant?.never_displayed_in_family_tree===true,'public family tree must hide informant');
check(d.informant?.stable_after_reconnect===true,'informant must be pinned per room');
check(d.informant?.isolated_across_rooms===true,'no cross-game assignment');
check(d.informant?.different_from_formal_pentito===true,'indic is not automatically pentito');
check(d.informant?.max_once_per_room===true,'at most one per room');
check(d.informant?.cannot_be_guaranteed_informant_by_selected_public_rank===true,'public roles must not betray source');
check((d.informant?.eligible_public_roles||[]).length>=3,'small-player compatible roles');
check(d.case_contracts?.length===5,'five cases');
const cases=d.case_contracts||[];
let matrix=0;
for(let i=0;i<5;i++){
 const c=cases[i];const id=ids[i];
 check(c?.id===id, id+' case identity/order');
 if(!c)continue;
 check(c.score_target===9.5,id+' score target 9.5');
 check(c.axes?.length>=4,id+' four verdict axes');
 check(new Set(c.independent_c3_sources||[]).size>=2,id+' independent C3 evidence');
 check(c.informant_exclusive?.length>35,id+' meaningful unique source knowledge');
 check(c.variations?.join(',')==='A,B,C',id+' three variants');
 check(c.replay_axes?.length>=3,id+' distinct replayable causal dimensions');
 check(c.imported_events?.length===0,id+' no inter-case state');
 check(c.crossovers?.length>=2,id+' shared world');
 const part=story.split('# '+id+' — ')[1]?.split('\n---\n')[0]||'';
 check(Boolean(part),id+' full story exists');
 for(const marker of ['**C1','**C2','**C3','**Fausse piste vraie','**Dilemme de l’indic','**80 %**','**Ambition éditoriale : 9,5/10']){
  check(part.includes(marker),id+' story lacks '+marker);
 }
 check(part.includes('indic'),id+' informed source missing from story');
 matrix+=c.variations?.length||0;
}
check(matrix===15,'15 variant design slots');
check(story.includes('exactement UN titulaire')&&story.includes('chaque partie'),'server contract must explicitly say exactly one per session');
check(story.includes('supplantées'),'legacy optional informant decision explicitly overridden');
check(tree.includes('Don Santoro')&&tree.includes('preferred_role')&&tree.includes('pseudo'),'public rank holders only');
check(!tree.includes('is_informant')&&!tree.includes('informant_player_id'),'tree cannot read informant identity');

if(process.argv.includes('--release')){
 check(d.actual_live_backend_support_verified===true,'server has not been certified');
 for(const [key,passed] of Object.entries(d.release_blockers||{}))check(passed===true,'release blocker: '+key);
}
if(errors.length){
 console.error('OMERTA V11 '+(process.argv.includes('--release')?'RELEASE':'EDITORIAL')+' GATES FAIL ('+errors.length+')');
 for(const e of errors)console.error(' - '+e);
 process.exitCode=1;
}else{
 console.log('OMERTA V11 PUBLIC EDITORIAL checks PASS: five cases, 15 variant slots, always-one hidden indic, C2+ confrontations and 80/20.');
 if(!process.argv.includes('--release'))console.log('This does NOT attest live informant allocation, 15 secret manuscripts, or playtest quality.');
}
