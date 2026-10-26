// OMERTA V23 — TEST-ONLY win evaluator. Runs offline; NO live RPC.
// Server must own goal, facts, recipient identity, room, and the sealed truth.
import {gradePersonalGoal} from './omerta-v18-personal-goal-evaluator.mjs';

export function gradeTwoConditionIndicWin({
 roomId,playerId,acceptedAt,lockedAt,personalGoal,
 lockedVerdict,caseEvents,privateFactCatalog,disclosureEvents
}={}){
 if(typeof roomId!=='string'||!roomId||typeof playerId!=='string'||!playerId)throw Error('room and player required');
 if(!Number.isFinite(acceptedAt)||!Number.isFinite(lockedAt)||lockedAt<=acceptedAt)throw Error('no eligible voluntary INDIC acceptance before verdict');
 if(!personalGoal||typeof personalGoal!=='object')throw Error('personal goal missing');
 if(!Array.isArray(privateFactCatalog)||!Array.isArray(disclosureEvents))throw Error('verified private fact/event records missing');
 const factById=new Map();
 for(const fact of privateFactCatalog){
  if(!fact||typeof fact.factId!=='string'||!fact.factId||factById.has(fact.factId))throw Error('bad private facts');
  factById.set(fact.factId,fact);
 }
 const personalSaved=gradePersonalGoal(personalGoal,{lockedVerdict,caseEvents});
 let tipDelivered=false;
 for(const event of disclosureEvents){
  if(!event||event.type!=='source_private_fact_submission'||event.roomId!==roomId||event.playerId!==playerId||
     event.recipientRole!=='enqueteur'||event.serverAuthenticated!==true)continue;
  if(typeof event.submittedAt!=='number'||event.submittedAt<=acceptedAt||event.submittedAt>=lockedAt)continue;
  const fact=factById.get(event.factId);
  if(!fact||fact.ownerPlayerId!==playerId||fact.roomId!==roomId)continue;
  if(fact.trueInSealedVariant!==true||fact.caseRelevant!==true||fact.corrobableIndependently!==true)continue;
  if(event.alreadyPublicAtSubmission===true||event.serverEligibleFact!==true)continue;
  // Does NOT require that the investigator trusts or uses the fact.
  tipDelivered=true;break;
 }
 return {personalSaved,tipDelivered,won:personalSaved&&tipDelivered};
}

export function formatIndicCard(goal,sharedLine="Avant le verdict, transmets volontairement à l’Enquêteur au moins un renseignement vrai et utile tiré de ta fiche privée."){
 if(!goal||typeof goal.indic_condition_1?.text!=='string')throw Error('missing personal escape');
 return [
  'TON OBJECTIF D’INDIC — DEUX CONDITIONS POUR GAGNER',
  '1. SAUVE TA PEAU — '+goal.indic_condition_1.text,
  '2. RENSEIGNE L’ENQUÊTE — '+sharedLine
 ].join('\n');
}
