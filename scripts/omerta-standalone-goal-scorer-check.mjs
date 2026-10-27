import assert from 'node:assert/strict';
import {scoreStandaloneGoal as score} from './omerta-standalone-goal-scorer.mjs';

const goal={mode:'avoid_formal_designation',goal_id:'021-A-slot-1-avoid_designation',scenario_variant_id:'021-A'};
const base={playerId:'player-1',matchNo:2,goal,verdictLocked:true};
const designation={playerId:'player-1',matchNo:2,goalId:goal.goal_id,scenarioVariantId:'021-A',confirmed:true,investigatorAuthorized:true};
const intel={playerId:'player-1',matchNo:2,scenarioVariantId:'021-A',truthVerified:true,transmittedToInvestigation:true,nonpublicWhenSent:true};
const assessment={playerId:'player-1',matchNo:2,scenarioVariantId:'021-A',investigatorAuthorized:true,confirmed:true,useful:true};
const indic={accepted:true,survived:true,protectedByOfficialPact:true,formalReductionYears:0,intelEvents:[],investigatorAssessments:[]};

assert.deepEqual(score({...base,verdictLocked:false}).status,'pending');
assert.equal(score(base).won,true);
assert.equal(score({...base,designations:[designation]}).won,false);
for (const patch of [
  {playerId:'player-2'},{matchNo:1},{scenarioVariantId:'021-B'},
  {goalId:'other-act'},{confirmed:false},{investigatorAuthorized:false}
]) assert.equal(score({...base,designations:[{...designation,...patch}]}).won,true);

assert.equal(score({...base,informant:{...indic,intelEvents:[intel]}}).won,true);
assert.equal(score({...base,informant:{...indic,investigatorAssessments:[assessment]}}).won,true);
assert.equal(score({...base,informant:{...indic,investigatorAssessments:[assessment]}}).usefulnessSource,'investigator');
assert.equal(score({...base,informant:{...indic,intelEvents:[intel],survived:false}}).won,false);
assert.equal(score({...base,informant:{...indic,intelEvents:[intel],protectedByOfficialPact:false,formalReductionYears:2}}).won,false);
assert.equal(score({...base,informant:{...indic,intelEvents:[intel],protectedByOfficialPact:false,formalReductionYears:3}}).won,true);
for(const patch of [
  {playerId:'other'},{matchNo:1},{scenarioVariantId:'021-B'},
  {truthVerified:false},{nonpublicWhenSent:false},{transmittedToInvestigation:false}
]) assert.equal(score({...base,informant:{...indic,intelEvents:[{...intel,...patch}]}}).won,false);
for(const patch of [
  {playerId:'other'},{matchNo:1},{scenarioVariantId:'021-B'},
  {investigatorAuthorized:false},{confirmed:false},{useful:false}
]) assert.equal(score({...base,informant:{...indic,investigatorAssessments:[{...assessment,...patch}]}}).won,false);
assert.equal(score({...base,informant:indic}).won,false);
assert.throws(()=>score({...base,goal:{...goal,scenario_variant_id:''}}),/omerta_invalid_private_goal/);
assert.throws(()=>score({...base,matchNo:0}),/omerta_invalid_private_goal/);
console.log('OMERTÀ scorer: 26+ checks — portée joueur/match/variante, verdict, indic, utilité enquêteur OK');
