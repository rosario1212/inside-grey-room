// OMERTA V23 — OFFLINE scoring contract; never load hidden catalog on client.
// Server must supply sealed role facts, public timestamps and validated verdict.
import {gradePersonalGoal} from './omerta-v18-personal-goal-evaluator.mjs';
export function gradeInformantTwoChecks({
  objective,playerId,caseId,variantId,roleSlotId,lockedVerdict,caseEvents,claims=[],sealedFactCatalog={}
}={}){
 if(!objective||objective.victory!=='both_conditions_true')throw Error('unsupported informant objective');
 if(!playerId||!caseId||!variantId||!roleSlotId)throw Error('missing private server context');
 if(!Array.isArray(claims))throw Error('invalid disclosures');
 const s=objective.condition_1;
 if(!s||!s.scored_by)throw Error('self preservation undefined');
 const goal=s.scored_by==='approved_protection'
   ?{kind:'approved_protection',protected_player_id:playerId,min_protection_level:'temporary'}
   :s.scored_by==='avoid_attribution'
    ?{kind:'avoid_attribution',crime_id:s.crime_axis,player_id:playerId,liability_level:'principal'}
    :null;
 if(!goal)throw Error('unsupported self-preservation type');
 // Require a real recorded per-act verdict/protection event; never guess on missing data.
 const selfSaved=gradePersonalGoal(goal,{lockedVerdict,caseEvents});
 // Private and public-at-submission timestamps are checked on the sealed fact catalog.
 const usefulSubmitted=claims.some(claim=>{
  if(!claim||typeof claim.clueId!=='string'||!Number.isFinite(claim.sentAt)||!claim.explicitlySent)return false;
  const item=sealedFactCatalog[claim.clueId];
  if(!item||item.truthVerified!==true||item.relevant!==true||item.privateToPlayerAtStart!==true||
    item.independentCorroboration!==true||
    item.ownerPlayerId!==playerId||item.caseId!==caseId||
    item.variantId!==variantId||item.roleSlotId!==roleSlotId)return false;
  // A clue that is already public by the time the indic sends it is not new.
  if(Number.isFinite(item.firstPublicAt) && item.firstPublicAt<=claim.sentAt)return false;
  return true;
 });
 return Object.freeze({
  safe:selfSaved,
  usefulDisclosure:usefulSubmitted,
  won:selfSaved&&usefulSubmitted,
  // Client should receive its outcome only at the proper debrief, never live.
  reason:!selfSaved?'Tu ne t’es pas protégé.':!usefulSubmitted?'Tu n’as pas transmis de renseignement admissible.':'Tu t’es protégé et tu as renseigné l’Enquête.'
 });
}
