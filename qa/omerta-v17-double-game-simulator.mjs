// OMERTA V17 isolated assertion probe — not a live chat or an evidence backend.
// Statements may be strategically incomplete or false; sealed case facts
// are never changed by accepting source status or submitting a statement.
export function createDoubleGameProbe({caseId,canonicalFacts,cast}){
 if(!['021','022','023','024','025'].includes(caseId))throw Error('bad dossier');
 if(!Array.isArray(canonicalFacts)||canonicalFacts.length<2)throw Error('at least two independent case facts needed');
 if(!Array.isArray(cast)||cast.length<3)throw Error('cast required');
 const facts=canonicalFacts.map(x=>Object.freeze({...x}));
 const players=new Map(cast.map(x=>[x.id,{...x}]));
 const claims=[];
 const fail=(x)=>{throw new Error(x)};
 const owns=(id)=>{if(!players.has(id))fail('unknown player');return players.get(id)};
 return Object.freeze({
  submitPrivateClaim({sourceId,recipientId,text,protectId}){
   const source=owns(sourceId),receiver=owns(recipientId);
   if(source.publicRole==='enqueteur'||receiver.publicRole!=='enqueteur')fail('source and investigator required');
   const beneficiary=protectId?owns(protectId):null;
   if(beneficiary && beneficiary.publicRole==='enqueteur')fail('beneficiary is not a suspect');
   if(typeof text!=='string'||text.length<8)fail('claim is too short');
   // A strategic claim may favor a higher rank, and may be deceptive.
   // It remains unverified and never gains evidentiary status automatically.
   const claim={recipientId,sourceId,text,protectId:beneficiary?.id||null,status:'unverified'};
   claims.push(claim);
   return {delivered:true,status:'unverified',canonicalModified:false};
  },
  investigativeClaims(id){
   const receiver=owns(id);if(receiver.publicRole!=='enqueteur')fail('only investigator');
   // The investigator sees source-submitted statements, not their verdict truth.
   return claims.map(c=>({statement:c.text,status:c.status,source:'confidential contact'}));
  },
  publicSummary(){
   return {caseId,players:[...players.values()].map(x=>({id:x.id,rank:x.publicRole})),factsReleased:[]};
  },
  sealedFactsForTestOnly(){
   // This accessor MUST NOT exist in real client code; test-only probe.
   return facts.map(x=>({...x}));
  },
  getClaimCount(){return claims.length}
 });
}
