#!/usr/bin/env node
// Editorial V20 checks and isolated objective-grading demo only; no live RPC.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gradePersonalGoal} from '../qa/omerta-v18-personal-goal-evaluator.mjs';
const c=JSON.parse(await readFile('qa/omerta-v20-personal-motive-nonarbitrary-target.json','utf8'));
const text=await readFile('docs/OMERTA_V20_PERSONAL_MOTIVE_FREE_TARGET_NOT_ARBITRARY_WIN.md','utf8');
const legacy=await readFile('docs/OMERTA_V19_VERBATIM_PLAYER_GOALS_021_025.md','utf8');
assert.equal(c.version,'OMERTA-V20');assert.equal(c.stage,'editorial+isolated-tests-NOT-LIVE');
assert.equal(c.single_primary_personal_objective,true);
assert.equal(c.stays_in_mafia_camp,true);
assert.equal(c.acceptance.immediately_replaces_personal_goal,true);
assert.equal(c.acceptance.automatically_disclosed_facts,0);
assert.equal(c.targeting.optional,true);
assert.equal(c.targeting.can_choose_no_target,true);
assert.equal(c.targeting.can_change_target_as_strategy_changes,true);
assert.equal(c.targeting.accusing_arbitrary_target_is_not_win,true);
assert.equal(c.targeting.target_list_built_from_public_roster_not_hidden_truth,true);
assert.equal(c.targeting.no_automatic_targeting_bonus,true);
assert.equal(c.win_condition.score_only_active_personal_goal,true);
assert.equal(c.win_condition.never_automatically_won_when_accepted,true);
assert.equal(c.win_condition.interest_type_requires_reliable_server_accounting,true);
assert.equal(c.win_condition.if_not_supported_use_verdict_scored_alternative,true);
assert.equal(c.playable_even_if_zero_informants,true);
assert.deepEqual(c.scenarios,['021','022','023','024','025']);
assert.equal(c.case_examples.length,5);
assert.equal(c.case_fraction,80);assert.equal(c.shared_universe_fraction,20);
assert.match(text,/UNE RAISON PERSONNELLE DE TRAHIR/);
assert.match(text,/CIBLE LIBRE/);
assert.match(text,/pas la condition de victoire par défaut/);
assert.match(legacy,/REMPLACÉ SUR LES OBJECTIFS INDIC PAR V20/);
// Changing an arbitrary target never changes individual success.
// A verified contested asset decision, or a crime-specific locked verdict, does.
const goal={kind:'retain_interest',interest_id:'weekly_collection_share',owner_player_id:'A'};
const ctx={lockedVerdict:{leak_of_total:[{player_id:'C',level:'principal'}]},
 caseEvents:{interests:{weekly_collection_share:'B'},protections:[]}};
for(const target of [null,'B','C','D','Don Santoro']){
 const selectedTarget=target; // deliberately NOT used by personal goal scoring
 assert.equal(gradePersonalGoal(goal,ctx),false,'arbitrary target '+selectedTarget+' must not guarantee a win');
}
ctx.caseEvents.interests.weekly_collection_share='A';
assert.equal(gradePersonalGoal(goal,ctx),true);
assert.throws(()=>gradePersonalGoal(goal,{lockedVerdict:ctx.lockedVerdict,caseEvents:{interests:{},protections:[]}}),/untracked/);
const fallback={kind:'avoid_attribution',crime_id:'leak_of_total',player_id:'A',liability_level:'principal'};
assert.equal(gradePersonalGoal(fallback,ctx),true);
ctx.lockedVerdict.leak_of_total=[{player_id:'A',level:'principal'}];
assert.equal(gradePersonalGoal(fallback,ctx),false);
for(const item of c.case_examples){
 assert.ok(item.motive&&item.in_game_targeting);
 assert.ok(['retain_interest','avoid_attribution'].includes(item.single_goal));
 if(item.single_goal==='retain_interest')assert.ok(item.server_key&&item.fallback&&item.fallback_crime);
}
console.log('OMERTA V20 EDITORIAL PASS: personal gain not arbitrary target; 5 motives, no-target allowed, target selection does not score, conditional asset or verdict outcomes only, 80/20.');
console.log('NOT live: 15 variants, secure case-state, server scoring, and multiplayer QA remain pending.');
