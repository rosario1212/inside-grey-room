#!/usr/bin/env node
// OMERTA V12 editor-only gate. Never reads a player's secret state.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const d=JSON.parse(await readFile('qa/omerta-v12-indic-self-interest-and-atmosphere.json','utf8'));
const story=await readFile('docs/OMERTA_V12_PERSONAL_INDIC_AND_MAFIA_ATMOSPHERE.md','utf8');
const errors=[];const ok=(truth,message)=>{if(!truth)errors.push(message)};
const ids=['021','022','023','024','025'];
ok(d.version==='OMERTA-V12','Wrong editorial version');
ok(d.live===false,'Must not claim live by documentation change');
ok(d.informant?.mandatory&&d.informant?.exact_count_per_match===1,'Exactly one guaranteed indic required');
ok(d.informant?.eligible_family_players_min>=2,'A sole eligible mafioso would reveal the indic');
ok(d.informant?.win_condition_independent_of_investigator_result===true,'Informant cannot be scored as Investigator helper');
ok(d.informant?.may_benefit_from_investigator_failure===true,'Informant requires own win track');
ok(d.informant?.may_lose_when_investigators_win===true,'Informant personal outcome independence');
ok(d.informant?.objective_must_be_measurable_via_server_events===true,'No subjective acting scoring');
ok(d.informant?.objective_must_be_feasible_under_selected_variant_and_assigned_rank===true,'No impossible role-variant win conditions');
ok(d.informant?.oral_sentiment_not_scorable===true,'Do not listen to oral behavior to score');
ok(d.informant?.may_keep_silent&&d.informant?.may_lie,'Informant agency');
ok(d.informant?.uncooperative_informant_does_not_block_phases===true,'Silence must not hardlock the game');
ok(d.informant?.never_in_public_family_tree&&d.informant?.public_role_as_cover,'Public cover identity must stay hidden');
ok(d.gameplay?.official_confrontations_earliest_cycle===2&&d.gameplay?.interrogations_cycle_1,'Ordinary phase rules violated');
ok(d.gameplay?.cycle_total===3&&d.gameplay?.no_new_mini_game,'No alien mini-game');
ok(d.split?.case_story===80&&d.split?.shared_santoro_world===20,'80/20 editorial framework');
ok(d.split?.no_imported_variants_or_player_deaths===true,'Cross-case continuum forbidden');
ok(d.tone?.prohibit_player_acting&&d.tone?.concrete_economic_and_human_effects,'Mafia ambiance must not impose acting');
ok(d.cases?.length===5,'Not exactly five stories');
const seen=new Set();
for(const [i,caseSpec] of (d.cases||[]).entries()){
 const id=ids[i];
 ok(caseSpec.id===id,'Story ID or order '+id);
 ok(!seen.has(id),'Repeated story '+id);seen.add(id);
 ok(caseSpec.private_goal_example?.length>60,'Indic personal goal must be concrete '+id);
 ok(caseSpec.solo_story?.length>=4,'Story must have 4 independent facts '+id);
 ok(caseSpec.world_echo?.length>=2,'Missing Santoro shared-world echo '+id);
 ok(caseSpec.variant_goal_adjustment_required===true,'Must validate goal across each A/B/C '+id);
 const section=story.split('## '+id+' — ')[1]?.split('\n## ')[0]||'';
 ok(!!section,'Story section missing '+id);
 for(const marker of ['**C1','**C2','**C3','**OBJECTIF PERSONNEL D\'INDIC','**80 %**']){
  ok(section.includes(marker),'Missing scene or 80/20 or selfish goal '+id+' '+marker);
 }
 ok(!/objectif.*aider l.enqu.te|faire gagner l.enqu.te/i.test(caseSpec.private_goal_example),'Investigators mistaken for informant employer '+id);
}
ok((d.checks_required_before_release||[]).length>=10,'Release gates incomplete');
ok(/L.INDIC JOUE POUR LUI/.test(story),'Self-interest not declared upfront');
ok(/première.*partie/i.test(story)||/nouvelle salle\/partie/i.test(story),'Per-room assignment wording');
ok(/aucun.*rôle.*visible|jamais.*dans.*arbre/i.test(story),'Informant must stay out of public chart');
if(process.argv.includes('--release')){
 ok(d.audited_live===true,'Live migration/playtesting not certified');
 for(const gate of d.checks_required_before_release)ok(false,'Requires external evidence: '+gate);
}
if(errors.length){
 console.error('OMERTA V12 '+(process.argv.includes('--release')?'RELEASE':'EDITORIAL')+' FAIL '+errors.length);
 errors.forEach(e=>console.error(' - '+e));process.exitCode=1;
}else {
 console.log('OMERTA V12 editorial PASS: 5 self-interested informant goals, 80/20 Mafia immersion, classic phases.');
 console.log('No live assignment/15 private manuscripts/production tests certified.');
}
