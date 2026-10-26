// OMERTA V22 — OFFLINE role-goal assignment auditor. Not imported into gameplay.
// A future server must author/check sealed variants before using these templates.
export function reviewRoleObjectiveAssignment({scenario,cast,availableOutcomeTracks=[]}={}){
 if(!scenario||!Array.isArray(scenario.goals))throw Error('valid case required');
 if(!Array.isArray(cast)||cast.length===0)throw Error('room needs cast');
 const roleMap=new Map(scenario.goals.map(g=>[g.role,g]));
 const available=new Set(availableOutcomeTracks);
 const playerIds=new Set(),goalIds=new Set();
 const result=[];
 for(const p of cast){
   if(!p||typeof p.playerId!=='string'||!p.playerId)throw Error('player identity missing');
   if(playerIds.has(p.playerId))throw Error('duplicate player');
   playerIds.add(p.playerId);
   const role=roleMap.get(p.role);
   if(!role)throw Error('no authored objective for player rank');
   // A room with two people of same public rank needs separately authored
   // private jobs and stakes. A default shared template is NOT enough.
   const assignedBefore=p.customOriginal??role.suspect_text;
   const assignedAfter=p.customInformant??role.indic_text;
   const beforeId=p.originalGoalId??scenario.id+':'+p.role+':before';
   const afterId=p.informantGoalId??scenario.id+':'+p.role+':after';
   if(goalIds.has(beforeId)||goalIds.has(afterId))throw Error('duplicate personal objective assignment');
   goalIds.add(beforeId);goalIds.add(afterId);
   if(!assignedBefore||!assignedAfter||assignedBefore===assignedAfter)throw Error('no meaningful goal switch');
   if(!p.hasUniqueFacts || !p.winAndLoseReachable)throw Error('no verified personal stakes and success/failure route');
   const tracks=scenario.role_track_assignments[p.role];
   if(!tracks||tracks.length!==2||tracks.some(id=>!available.has(id)))throw Error('outcome not verified for this particular variant');
   // The caller MUST provide evidence the actual resulting event/verdict can
   // be recorded; having a label for it does NOT mean it exists in production.
   if(!p.outcomeScoringAuthenticated)throw Error('no authenticated verdict or event scorer');
   if(assignedBefore.length>170||assignedAfter.length>170)throw Error('goal must fit a readable role card');
   result.push({playerId:p.playerId,role:p.role,preGoal:assignedBefore,postGoal:assignedAfter,verified:true});
 }
 return {caseId:scenario.id,readyForFictionalDryRun:true,participants:result};
}
