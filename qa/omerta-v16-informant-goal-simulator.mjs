// OMERTA V16 TEST-ONLY SIMULATOR. No Supabase, UI, or live gameplay mutation.
// Real implementation requires server-owned variant truth and actor authorization.
const caseIds=new Set(['021','022','023','024','025']);
const cardFields=[
 'original_goal','informant_goal','certain_effects','possible_benefits',
 'exposure_risk','financial_risk','judicial_risk',
 'rank_retaliation_conditions','protection_conditions',
 'protection_approval_status','scope_of_optional_disclosures',
 'unknown_facts_limits','accept_label','decline_label'
];
export function createV16Room({scenarioId,players,maxOffers=2}){
 if(!caseIds.has(scenarioId)||!Array.isArray(players))throw Error('invalid room');
 const roster=new Map(players.map(p=>[p.id,{...p}]));
 if(roster.size!==players.length||!players.every(p=>p.id&&p.camp&&p.role&&p.original_goal))throw Error('invalid cast');
 let cycle=1,locked=false,sent=0;
 const offers=new Map(),privateRecords=new Map(players.map(p=>[p.id,{
  informant:false,activeGoal:p.original_goal,previousGoal:null,decision:'not_offered',disclosures:[]
 }]));
 const fail=(reason)=>{throw new Error(reason)};
 const player=(id)=>{const p=roster.get(id);if(!p)fail('unknown player');return p};
 const ensureC2=()=>{if(cycle<2)fail('cycle 2 required');if(locked)fail('verdict locked')};
 function sendOffer(actorId,recipientId,terms){
  ensureC2();
  const initiator=player(actorId);
  if(initiator.role!=='enqueteur'||initiator.camp!=='investigation')fail('investigator only');
  const target=player(recipientId);
  if(target.camp!=='suspect')fail('eligible suspect only');
  if(sent>=maxOffers)fail('offer budget exhausted');
  if(offers.has(recipientId))fail('offer already sent to suspect');
  if(!terms||cardFields.some(k=>typeof terms[k]!=='string'||terms[k].trim().length<5))
    fail('full up-front risk/goal card required');
  if(terms.original_goal!==target.original_goal)fail('original objective must be current');
  if(terms.informant_goal===target.original_goal)fail('goal must change');
  const o={recipientId,actorId,terms:structuredClone(terms)};
  offers.set(recipientId,o);sent++;
  privateRecords.get(recipientId).decision='pending';
  return {sent:true};
 }
 function respond(id,choice){
  ensureC2();player(id);
  if(!offers.has(id))fail('not a proposal recipient');
  if(!['accept','decline'].includes(choice))fail('invalid choice');
  const s=privateRecords.get(id);
  if(s.decision==='accepted'||s.decision==='declined') {
    if((s.decision==='accepted'&&choice==='accept')||(s.decision==='declined'&&choice==='decline'))
      return {ok:true,idempotent:true}; 
    fail('decision already final');
  }
  if(s.decision!=='pending')fail('no pending offer');
  if(choice==='decline'){
    s.decision='declined';
    return {ok:true,privateStatus:'ordinary',objectiveUnchanged:true,disclosed:0};
  }
  s.informant=true;
  s.previousGoal=s.activeGoal;
  s.activeGoal=offers.get(id).terms.informant_goal;
  s.decision='accepted';
  // Crucial: NO disclosure on accepting the role and replacing the goal.
  return {ok:true,privateStatus:'informant',objectiveChanged:true,disclosed:0};
 }
 function submitDisclosure(id,fact){
  ensureC2();player(id);
  const s=privateRecords.get(id);
  if(!s.informant)fail('not an informant');
  if(typeof fact!=='string'||fact.length<8)fail('invalid disclosure');
  s.disclosures.push(fact);
  return {ok:true,privateSubmission:true}; // Canon is NOT altered by this.
 }
 return Object.freeze({
  advanceCycle(n){if(locked||!Number.isInteger(n)||n<cycle||n>3)fail('invalid cycle');cycle=n;},
  sendOffer,respond,submitDisclosure,
  recipientCard(id){player(id);const o=offers.get(id);return o?structuredClone(o.terms):null;},
  privateFor(id){player(id);return structuredClone(privateRecords.get(id));},
  investigatorView(id){const p=player(id);if(p.role!=='enqueteur'||p.camp!=='investigation')fail('investigator only');return {sentTo:[...offers.keys()],remaining:maxOffers-sent};},
  publicView(){return {scenarioId,cycle,players:[...roster.values()].map(p=>({id:p.id,rank:p.role}))};},
  lock(){locked=true;},
  informantCount(){return [...privateRecords.values()].filter(s=>s.informant).length}
 });
}
