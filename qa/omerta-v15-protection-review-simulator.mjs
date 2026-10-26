// OMERTA V15 protection-review simulator — NEVER imported into the live client.
// Toy judicial/fictional authorization model to test that offers are not
// approvals and that senior rank never makes protection categorically impossible.
const exposure={associato:1,uomo_onore:2,contabile:3,caporegime:3,consigliere:4,sottocapo:4,don:5};
const limit=(x)=>Number.isInteger(x)&&x>=0&&x<=3;
export function reviewProtection({
 requesterRole,subjectRank,tier,testimonyValue,documentedThreat,
 essentialWitness=false,riskToOthersAssessed=false,
 suitablePrecautions=false,seniorExposurePlan=false,authorized=null
}={}){
 if(requesterRole!=='enqueteur')throw Error('only investigator may initiate request');
 if(!(subjectRank in exposure))throw Error('invalid suspect rank');
 if(!['confidential','temporary','enhanced'].includes(tier))throw Error('invalid protection level');
 if(!limit(testimonyValue)||!limit(documentedThreat))throw Error('invalid evidence rating');
 if(authorized!==null && typeof authorized!=='boolean')throw Error('invalid authorization state');
 const highVisibility=exposure[subjectRank]>=3;
 const residualRisks=[
  'information_can_be_attributed_by_case_evidence',
  'previous_criminal_liability_not_erased',
  'crew_reputation_or_income_may_still_be_lost'
 ];
 if(tier==='confidential')return {
  tier,decision:'discretion_offered',effective:true,physicalProtection:false,
  authorizedBy:'investigator_for_discretion_only',residualRisks
 };
 if(testimonyValue<2||documentedThreat<1)return{
  tier,decision:'unsupported_request',effective:false,
  reason:'more reliable testimony or documented threat required',residualRisks
 };
 if(tier==='enhanced'&&(testimonyValue<3||documentedThreat<2||!essentialWitness))return {
  tier,decision:'unsupported_request',effective:false,
  reason:'requires essential witness with strong evidence and grave threat',residualRisks
 };
 if(authorized===false)return {tier,decision:'refused_by_authority',effective:false,residualRisks};
 const planOk=suitablePrecautions && (!highVisibility || seniorExposurePlan);
 const extraOk=tier==='temporary'||riskToOthersAssessed;
 if(!planOk||!extraOk||authorized!==true)return{
  tier,decision:tier==='enhanced'?'referred_pending':'requested_pending',
  effective:false,
  needs:{authorization:authorized!==true,suitablePrecautions:!suitablePrecautions,
    seniorExposurePlan:highVisibility&&!seniorExposurePlan,
    riskAssessment:tier==='enhanced'&&!riskToOthersAssessed},
  residualRisks
 };
 return {tier,decision:'approved_by_competent_authority',effective:true,
  physicalProtection:tier==='enhanced'?'institutional_under_conditions':'limited_temporary',
  authorizedBy:'competent_authority_not_investigator',residualRisks};
}
