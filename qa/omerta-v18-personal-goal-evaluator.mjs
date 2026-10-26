// OMERTA V18 isolated objective evaluator. TEST ONLY: actual verdict + truth
// must be fetched from strictly protected server state, never client-side.
const levelOrder={none:0,minor:1,participant:2,principal:3};
const protectionOrder={none:0,confidentiality:1,temporary:2,enhanced:3};
const includes=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
export function gradePersonalGoal(goal,{lockedVerdict,caseEvents}={}){
 if(!goal||typeof goal!=='object')throw Error('objective missing');
 const needsVerdict=['avoid_attribution','pin_target','protect_ally'].includes(goal.kind);
 if(needsVerdict){
  const {crime_id,liability_level}=goal;
  if(typeof crime_id!=='string'||!crime_id||!includes(lockedVerdict||{},crime_id))throw Error('crime-specific verdict unavailable');
  const threshold=levelOrder[liability_level];
  if(!Number.isInteger(threshold)||threshold<=0)throw Error('invalid liability threshold');
  const participants=lockedVerdict[crime_id];
  if(!Array.isArray(participants)||participants.some(x=>!x||typeof x.player_id!=='string'||!includes(levelOrder,x.level)))throw Error('bad locked crime verdict');
  const who=goal.kind==='pin_target'?goal.target_player_id:goal.kind==='protect_ally'?goal.ally_player_id:goal.player_id;
  if(typeof who!=='string'||!who)throw Error('missing player target');
  const level=Math.max(0,...participants.filter(x=>x.player_id===who).map(x=>levelOrder[x.level]));
  return goal.kind==='pin_target' ? level>=threshold : level<threshold;
 }
 if(goal.kind==='retain_interest'){
  if(typeof goal.interest_id!=='string'||typeof goal.owner_player_id!=='string')throw Error('missing interest target');
  if(!includes(caseEvents?.interests||{},goal.interest_id))throw Error('untracked contested interest');
  return caseEvents.interests[goal.interest_id]===goal.owner_player_id;
 }
 if(goal.kind==='approved_protection'){
  const required=protectionOrder[goal.min_protection_level];
  if(!['temporary','enhanced'].includes(goal.min_protection_level))throw Error('invalid requested protection');
  if(typeof goal.protected_player_id!=='string')throw Error('missing protected player');
  if(!Array.isArray(caseEvents?.protections))throw Error('no authenticated protection decisions');
  return caseEvents.protections.some(p=>p.player_id===goal.protected_player_id && p.authorized_by_competent_authority===true&&p.status==='approved'&&protectionOrder[p.level]>=required);
 }
 throw Error('unsupported objective kind');
}
export function gradeInvestigationAgainstSealedTruth(locked,actual){
 if(!locked||!actual||Object.keys(actual).length===0)throw Error('truth or verdict missing');
 // Comparing sealed truth must happen on the server, NEVER in a player client.
 for(const [crime,actors] of Object.entries(actual)){
  if(!includes(locked,crime))throw Error('crime-specific verdict incomplete');
  if(!Array.isArray(actors)||!Array.isArray(locked[crime]))throw Error('bad verdict');
  const canonical=(list)=>JSON.stringify(list.map(x=>x.player_id+':'+x.level).sort());
  if(canonical(actors)!==canonical(locked[crime]))return false;
 }
 return true;
}
