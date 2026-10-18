import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {fixtureRelease,MemoryStorage} from './casino-fixtures.mjs';
import {casinoService,sha256,replayCasinoJournal} from '../casino/service.mjs';
import {startRuntime,applyRuntime,viewRuntime,tickRuntime} from '../casino/runtime.mjs';
import {evaluateHand,compareHands,pokerAction,spinSlot,shuffledDeck,startPoker,pokerView} from '../casino/games.mjs';
import {edgeHandler,createStorage} from '../casino/edge.mjs';
const checks=[];
async function test(name,fn){await fn();checks.push(name);console.log('PASS Casino: '+name)}
const token=()=>randomBytes(32).toString('hex');
const players=['p0','p1','p2','p3'];
function initial({count=4,judge=false,prosecutor=false,undercoverIds=[]}={}){
 const members=[...Array.from({length:count},(_,i)=>({id:'p'+i,name:'Joueur '+i,role:'casino',ready:true})),
  ...['agent','investigator','analyst',...(judge?['judge']:[]),...(prosecutor?['prosecutor']:[])].map(role=>({id:role,name:role,role,ready:true}))];
 return startRuntime({id:randomUUID(),hostId:'p0',members},fixtureRelease(),{undercoverIds,now:0,deck:shuffledDeck(n=>n-1)});
}
let counter=0;
const command=(s,actor,type,payload={},now=0)=>applyRuntime(s,{id:'cmd-'+(++counter),actor,type,payload},{now});
function finishPoker(s){while(s.poker.stage!=='settled')s=command(s,s.poker.turn,'POKER_ACTION',{action:s.poker.stage==='draw'?'draw':'check'});return s}
await test('all poker categories, straight-low ace, kickers, ties and invalid cards',()=>{
 const hands=[[8,[8,9,10,11,12]],[7,[12,25,38,51,2]],[6,[12,25,38,11,24]],[5,[1,3,5,7,10]],[4,[12,0,14,28,42]],
  [3,[12,25,38,1,3]],[2,[12,25,11,24,2]],[1,[12,25,1,3,5]],[0,[12,24,1,3,5]]];
 for(const [category,cards]of hands)assert.equal(evaluateHand(cards)[0],category);
 assert.equal(evaluateHand([12,0,14,28,42])[1],5);
 assert.equal(compareHands([1,14,10,8,2],[1,14,9,8,2]),1);
 assert.equal(compareHands([4,5],[4,5]),0);assert.throws(()=>evaluateHand([0,0,1,2,3]),/invalid_poker_hand/);
});
await test('mandatory multiplayer poker and zero sum settlement at four through seven casino seats',()=>{
 for(let count=4;count<=7;count++){
  let s=initial({count});const total=s.players.length*500;
  assert.equal(s.players.reduce((n,p)=>n+s.roster[p].chips,0)+s.poker.pot,total);
  assert.throws(()=>command(s,'p0','ADVANCE_PHASE',{},60000),/finish_poker_first/);
  assert.throws(()=>command(s,'agent','POKER_ACTION',{action:'draw'}),/not_your_poker_turn/);
  for(const p of s.players){const discard=count===7?[0,1]:[0,1,2];s=command(s,p,'POKER_ACTION',{action:'draw',discard})}
  while(s.poker.stage!=='settled')s=command(s,s.poker.turn,'POKER_ACTION',{action:'check'});
  assert(s.openingPokerComplete);assert.equal(s.players.reduce((n,p)=>n+s.roster[p].chips,0),total);
  assert.equal(new Set(Object.values(s.poker.cards).flat()).size,count*5);
 }
});
await test('bet, call, fold, bounded stack, single payout and disconnected turn deadline',()=>{
 let s=initial();for(const p of players)s=command(s,p,'POKER_ACTION',{action:'draw'});
 assert.throws(()=>command(s,'p0','POKER_ACTION',{action:'bet',amount:99999}),/invalid_bet/);
 s=command(s,'p0','POKER_ACTION',{action:'bet',amount:20});
 s=command(s,'p1','POKER_ACTION',{action:'call'});s=command(s,'p2','POKER_ACTION',{action:'fold'});
 const timeout=tickRuntime(s,90001);assert(timeout);assert.equal(timeout.poker.stage,'settled');
 assert.equal(timeout.players.reduce((sum,p)=>sum+timeout.roster[p].chips,0),2000);
 assert.throws(()=>command(timeout,'p3','POKER_ACTION',{action:'call'}),/not_your_poker_turn/);
});
await test('server-only entropy, deck and private cards excluded from every other role',()=>{
 const s=initial({undercoverIds:['p3']});
 for(const viewer of [...players,'agent','investigator','analyst']){
  const v=viewRuntime(s,viewer),raw=JSON.stringify(v);
  for(const forbidden of ['answerKey','privateCanon','tokenHash','undercoverIds','releaseId','deck'])assert(!raw.includes('"'+forbidden+'"'),forbidden+' leaked to '+viewer);
  assert.equal(v.poker.ownCards.length,players.includes(viewer)?5:0);
  assert(!('eventLog'in v));assert(!('members'in v));
  if(players.includes(viewer)){assert(!v.evidence);assert(!v.agentPuzzles.length)}
 }
 assert.equal(viewRuntime(s,'p0').ownUndercoverBrief,undefined);
 assert(viewRuntime(s,'p3').ownUndercoverBrief);
 assert(viewRuntime(s,'p0').ownCard.brief.includes('Joueur 0'));
 assert(viewRuntime(s,'p0').ownCard.relations[0].text.includes('Joueur 1'));
});
await test('infiltration reports are playable only by real undercover roles, never leak to suspects, and pending succession stakes stay private',()=>{
 let s=initial({undercoverIds:['p3']});
 assert.throws(()=>command(s,'p0','REPORT_INTEL',{subjectId:'p1',text:'Observation fictive.'}),/not_undercover/);
 assert.throws(()=>command(s,'p3','REPORT_INTEL',{subjectId:'unknown',text:'Observation fictive.'}),/invalid_intelligence/);
 assert.throws(()=>command(s,'p3','REPORT_INTEL',{subjectId:'p3',text:'Observation fictive.'}),/invalid_intelligence/);
 s=command(s,'p3','REPORT_INTEL',{subjectId:'p1',text:'Observation fictive vérifiable.'});
 assert.equal(viewRuntime(s,'agent').intel[0].subjectId,'p1');
 assert.equal(viewRuntime(s,'investigator').intel[0].text,'Observation fictive vérifiable.');
 assert.equal(viewRuntime(s,'p3').intel,undefined);
 assert(!JSON.stringify(viewRuntime(s,'p0')).includes('Observation fictive vérifiable.'));
 s.successionWagers={p1:{to:'p2',status:'pending'},p0:{to:'p3',status:'signed'}};
 assert.equal(viewRuntime(s,'p0').successionWagers.p1,undefined);
 assert.equal(viewRuntime(s,'p3').successionWagers.p1,undefined);
 assert.equal(viewRuntime(s,'p1').successionWagers.p1.to,'p2');
 assert.equal(viewRuntime(s,'p2').successionWagers.p1.to,'p2');
 assert.equal(viewRuntime(s,'p3').successionWagers.p0.status,'signed');
});
await test('succession requires independent supporters, self-loyalty is rejected and a lone faction is not a split',()=>{
 let s=initial();s=command(s,'p0','CLAIM_SUCCESSION');
 assert.throws(()=>command(s,'p0','PLEDGE_LOYALTY',{to:'p0'}),/invalid_loyalty/);
 s=command(s,'p0','SPLIT_FACTION',{name:'Branche contestée'});
 s=chapterTwo(s);
 for(let i=0;i<4;i++)s=command(s,'p0','ADVANCE_PHASE');
 s=command(s,'p0','FINISH_CAMPAIGN');
 assert.equal(s.finale.successor,null);assert.equal(s.finale.split,null);
 assert.equal(s.finale.political,'dragon_retained');
 let t=initial();t=command(t,'p0','CLAIM_SUCCESSION');t=command(t,'p1','PLEDGE_LOYALTY',{to:'p0'});
 t=chapterTwo(t);for(let i=0;i<4;i++)t=command(t,'p0','ADVANCE_PHASE');
 t=command(t,'p0','FINISH_CAMPAIGN');assert.equal(t.finale.successor,'p0');
});
await test('analyst evaluates existing documents without manufacturing court evidence',()=>{
 let s=initial({undercoverIds:['p3']});s=command(s,'p3','REPORT_INTEL',{subjectId:'p1',text:'Observation fictive.'});
 const id=s.intel[0].id,before=s.evidence.length;
 assert.throws(()=>command(s,'p0','REVIEW_INTEL',{reportId:id,evidenceIds:['proof0'],confirmed:true,reasoning:'Concordance.'}),/unauthorized_role/);
 s=command(s,'analyst','REVIEW_INTEL',{reportId:id,evidenceIds:['proof0'],confirmed:true,reasoning:'Pièce d’archive vérifiée.'});
 assert.equal(s.evidence.length,before);assert.equal(viewRuntime(s,'agent').intel[0].checked,true);
 assert.equal(viewRuntime(s,'p0').intel,undefined);
 assert.throws(()=>command(s,'analyst','REVIEW_INTEL',{reportId:id,evidenceIds:['proof0'],confirmed:true,reasoning:'Encore.'}),/intel_already_reviewed/);
});
await test('host recovery only after extraordinary deadline without borrowing a missing role',()=>{
 let s=finishPoker(initial());s=command(s,'p0','ADVANCE_PHASE',{},60000);s=command(s,'p0','ADVANCE_PHASE',{},120000);
 assert.throws(()=>command(s,'p0','HOST_AUTHORIZE_CONTINUITY',{},240000),/continuity_not_available/);
 s=tickRuntime(s,240000);assert(s.fallbackReady);
 s=command(s,'p0','HOST_AUTHORIZE_CONTINUITY',{},300000);
 assert(s.roomLocated);s=command(s,'p0','ADVANCE_PHASE',{},300000);assert.equal(s.chapter,2);
});
await test('court continuity respects independent evidence and unanswered defence presumption',()=>{
 let s=chapterTwo(initial({judge:true}));
 s.evidence[0].facts=['act'];s.evidence[1].facts=['act'];
 s=command(s,'investigator','OPEN_HEARING',{subjectId:'p1',evidenceIds:['proof0','proof1'],offence:'infraction fictive',accusation:'Contradiction à examiner.'});
 const hearingId=s.hearings[0].id;
 for(let i=0;i<4;i++)s=command(s,'p0','ADVANCE_PHASE');
 const at=s.phaseStartedAt;
 assert.throws(()=>command(s,'p0','HOST_CLOSE_ABSENT_HEARING',{hearingId},at+240000),/defence_continuity_unavailable/);
 s=command(s,'p0','HOST_CLOSE_ABSENT_HEARING',{hearingId},at+300000);
 assert.throws(()=>command(s,'judge','RULING',{hearingId,decision:'convict',reasoning:'Non recevable.'}),/judicial_elements_not_established/);
 s=command(s,'p0','HOST_COURT_CONTINUITY',{},at+300000);
 assert.equal(s.rulings.at(-1).decision,'acquit');
 s=command(s,'p0','FINISH_CAMPAIGN');assert.equal(s.status,'finished');
});
await test('slot paytable, bank escrow and no duplicate/client-forged payout',()=>{
 let s=finishPoker(initial());s=command(s,'p0','ADVANCE_PHASE',{},60000);
 const total=s.casinoBank+players.reduce((n,p)=>n+s.roster[p].chips,0);
 spinSlot(s,'p0',10,['DRAGON','DRAGON','DRAGON']);assert.equal(s.slotResults.p0.payout,300);
 assert.equal(s.casinoBank+players.reduce((n,p)=>n+s.roster[p].chips,0),total);
 assert.throws(()=>spinSlot(s,'agent',1,['A','A','A']),/casino_player_required/);
 assert.throws(()=>spinSlot(s,'p0',21,['A','A','A']),/invalid_slot_wager/);
 assert.throws(()=>command(s,'p0','SETTLE_SLOT',{payout:1000000}),/server_action_forbidden/);
});
await test('private signatures, betrayal penalty, threshold-free claim and territory transfer',()=>{
 let s=finishPoker(initial());s.roster.p0.legitimacy=0;s.roster.p0.reputation=0;
 s=command(s,'p0','CLAIM_SUCCESSION');assert.equal(s.claims[0].id,'p0');
 s=command(s,'p0','PROPOSE_AGREEMENT',{recordId:'contract',participants:['p0','p1'],kind:'territory',territoryId:'t1',visibility:'private',terms:'Convention fictive.'});
 assert.equal(viewRuntime(s,'p2').agreements.length,0);
 s=command(s,'p1','SIGN_AGREEMENT',{recordId:'contract'});
 s=command(s,'p1','CLAIM_TERRITORY',{territoryId:'t1'});
 const influenceBefore=s.roster.p1.influence;
 s=command(s,'p0','TRANSFER_TERRITORY',{territoryId:'t1',agreementId:'contract',to:'p1'});assert.equal(s.territories.t1.controller,'p1');assert.equal(s.roster.p1.influence,influenceBefore+8);
 const legitimacyBefore=s.roster.p1.legitimacy;s=command(s,'p2','PLEDGE_LOYALTY',{to:'p1'});assert.equal(s.roster.p1.legitimacy,legitimacyBefore+4);
 s=command(s,'p1','BREAK_AGREEMENT',{recordId:'contract'});assert.equal(s.roster.p1.reputation,38);
 assert.throws(()=>command(s,'p1','TRANSFER_TERRITORY',{territoryId:'t1',agreementId:'contract',to:'p0'}),/signed_territory_agreement_required/);
});
function chapterTwo(s,{badAnswers=false}={}){
 s=finishPoker(s);
 for(let phase=1;phase<=3;phase++){
  const answers=phase<3?2:1;
  for(let i=0;i<answers;i++)s=command(s,'agent','AGENT_DECISION',{answer:badAnswers?'rumour':'confirmed'},phase*60000);
  if(phase<3)s=command(s,'p0','ADVANCE_PHASE',{},phase*60000);
 }
 if(badAnswers)s=tickRuntime(s,240000);
 s=command(s,'agent','LOCATE_ROOM',{},badAnswers?240000:180000);
 return command(s,'p0','ADVANCE_PHASE',{},badAnswers?240000:180000);
}
await test('five private deductions, minimum social time and authored late fallback',()=>{
 let s=initial();assert.throws(()=>command(s,'agent','LOCATE_ROOM'),/minimum_social_time/);
 s=chapterTwo(s,{badAnswers:true});assert.equal(s.chapter,2);assert(s.roomLocated);
 assert(!viewRuntime(s,'p0').fallbackHint);assert(viewRuntime(s,'agent').fallbackHint);
});
await test('corroborated personal arrest, distinct custody, adversarial hearing, active prison and final ruling',()=>{
 let s=chapterTwo(initial({judge:true,prosecutor:true}));
 const request={subjectId:'p1',evidenceIds:['proof0','proof1'],allegedOffence:'infraction fictive',reasoning:'Deux sources primaires indépendantes.'};
 const bad=structuredClone(s);bad.evidence[1].independenceGroup=bad.evidence[0].independenceGroup;
 assert.throws(()=>command(bad,'investigator','REQUEST_INTERPELLATION',request),/insufficient_independent/);
 s=command(s,'investigator','REQUEST_INTERPELLATION',request);const requestId=s.interpellationRequests[0].id;
 assert.throws(()=>command(s,'p0','INTERPELLATE',{requestId}),/unauthorized_role/);
 s=command(s,'agent','INTERPELLATE',{requestId});assert.equal(s.roster.p1.status,'interpellated');
 assert.throws(()=>command(s,'judge','DETAIN',{subjectId:'p1',judicialBasis:'x'}),/detention_not_open/);
 s=command(s,'prosecutor','OPEN_HEARING',{subjectId:'p1',evidenceIds:['proof0','proof1'],offence:'infraction fictive',accusation:'Exposer les faits.'});
 const hearingId=s.hearings[0].id;s=command(s,'p1','DEFENCE',{hearingId,text:'Je conteste cette interprétation.'});
 s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','ADVANCE_PHASE');
 s=command(s,'judge','DETAIN',{subjectId:'p1',judicialBasis:'Mesure provisoire motivée après audience.'});
 s=command(s,'p1','MESSAGE',{kind:'appeal',to:'bureau',text:'Je demande un réexamen.'});
 assert.equal(viewRuntime(s,'p0').messages.length,0);assert.equal(viewRuntime(s,'investigator').messages.length,1);
 assert.throws(()=>command(s,'p1','TRANSFER_CHIPS',{to:'p0',amount:1}),/invalid_transfer/);
 s=command(s,'p0','ADVANCE_PHASE');assert.equal(s.chapter,3);
 s=command(s,'judge','RULING',{hearingId,decision:'acquit',reasoning:'Les documents ne suffisent pas à imputer une responsabilité personnelle.'});
 s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','FINISH_CAMPAIGN');assert.equal(s.status,'finished');assert.equal(s.roster.p1.status,'free');
});
await test('all optional-role configurations and zero to two hidden informants',()=>{
 for(let count=4;count<=7;count++)for(const judge of [false,true])for(const prosecutor of [false,true])for(let n=0;n<=(count===4?1:2);n++){
  const s=initial({count,judge,prosecutor,undercoverIds:Array.from({length:n},(_,i)=>'p'+i)});
  assert.equal(s.players.length,count);assert.equal(s.undercoverIds.length,n);
  assert.equal(Object.keys(s.bureau).length,3+Number(judge)+Number(prosecutor));
 }
});
await test('eight phases with and without magistrates; factual system verdicts and persistent succession',()=>{
 for(const judge of [false,true])for(const prosecutor of [false,true])for(let count=4;count<=7;count++){
  let s=initial({judge,prosecutor,count});s=command(s,'p0','CLAIM_SUCCESSION');s=command(s,'p1','PLEDGE_LOYALTY',{to:'p0'});
  s=chapterTwo(s);
  const actor=prosecutor?'prosecutor':'investigator';
  s=command(s,actor,'OPEN_HEARING',{subjectId:'p1',evidenceIds:['proof0','proof1'],offence:'infraction fictive',accusation:'Faits fictifs à discuter.'});
  const hearingId=s.hearings[0].id;s=command(s,'p1','DEFENCE',{hearingId,text:'Défense enregistrée.'});
  s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','ADVANCE_PHASE');
  if(judge)s=command(s,'judge','RULING',{hearingId,decision:'convict',reasoning:'Faits fictifs établis.'});
  s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','FINISH_CAMPAIGN');
  assert.equal(s.status,'finished');assert.equal(s.finale.successor,'p0');assert.equal(s.finale.political,'recognised_claim');
  assert.equal(s.finale.judicial.find(r=>r.hearingId===hearingId).decision,'convict');
  assert.equal(s.roster.p1.status,'detained');assert.equal(s.players.length,count);
 }
 let s=chapterTwo(initial());s.evidence[0].facts=['act'];s.evidence[1].facts=['act'];
 s=command(s,'investigator','OPEN_HEARING',{subjectId:'p1',evidenceIds:['proof0','proof1'],offence:'infraction fictive',accusation:'Une intention reste à établir.'});
 s=command(s,'p1','DEFENCE',{hearingId:s.hearings[0].id,text:'Mon intention n’est pas établie.'});
 for(let i=0;i<4;i++)s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','FINISH_CAMPAIGN');
 assert.equal(s.finale.judicial.at(-1).decision,'acquit','Two sources alone cannot establish every element of responsibility');
});
await test('authored NPC nomination requires authority, secret conditions and prior warning for a lethal branch',()=>{
 let s=finishPoker(initial());s=command(s,'p0','CLAIM_SUCCESSION');
 assert.equal(viewRuntime(s,'p0').npcMoves.length,0);
 s=command(s,'p0','ADVANCE_PHASE',{},60000);s=command(s,'p0','ADVANCE_PHASE',{},120000);
 assert.equal(viewRuntime(s,'p0').npcMoves.length,1);
 s=command(s,'p0','NPC_MOVE',{moveId:'nomination'});assert.equal(s.namedSuccessor,'p0');
 assert.throws(()=>command(s,'p0','NPC_MOVE',{moveId:'nomination'}),/npc_move_unavailable/);
 s.privateCanon.moves.push({id:'synthetic-death',label:'Branche fictive',phase:3,actor:'c0',effect:'assassinate',target:'dragon',conditions:[{kind:'warning',eventId:'warning'}]});
 assert.throws(()=>command(s,'p0','NPC_MOVE',{moveId:'synthetic-death'}),/npc_move_unavailable/);
 s.publicEvents.push({id:'warning',text:'Danger de la branche rendu public.'});s=command(s,'p0','NPC_MOVE',{moveId:'synthetic-death'});
 assert.equal(s.roster.dragon.status,'dead');assert.equal(s.dragonAuthority,false);assert.equal(s.namedSuccessor,null);
});
await test('unplayed characters negotiate authored offers, retain consent and can answer an accusation',()=>{
 let s=finishPoker(initial());s.territories.t1.controller='c4';
 s.privateCanon.npcOffers=[{id:'npc-offer',npcId:'c4',actor:'c0',phase:1,label:'Offre fictive',terms:'Accord fictif de concession.',price:100,territoryId:'t1',support:true,conditions:[{kind:'status',subject:'c4',value:'free'}]}];
 assert.equal(viewRuntime(s,'p0').npcOffers.length,1);assert.equal(viewRuntime(s,'p1').npcOffers.length,0);
 const before=s.roster.p0.chips;s=command(s,'p0','ACCEPT_NPC_OFFER',{offerId:'npc-offer',price:0});
 assert.equal(s.roster.p0.chips,before-100);assert.equal(s.roster.c4.chips,600);assert.equal(s.territories.t1.controller,'p0');assert.equal(s.support.c4,'p0');
 assert.equal(viewRuntime(s,'p0').npcOffers.length,0);
 assert.throws(()=>command(s,'p0','ACCEPT_NPC_OFFER',{offerId:'npc-offer'}),/npc_offer_unavailable/);
 s=chapterTwo(s);s.evidence.push(...s.evidence.slice(0,2).map((e,i)=>({...e,id:'npc-proof-'+i,subjectId:'c4'})));
 s=command(s,'investigator','OPEN_HEARING',{subjectId:'c4',evidenceIds:['npc-proof-0','npc-proof-1'],offence:'infraction fictive',accusation:'Pièces à confronter.'});
 assert(s.hearings[0].defence,'A synthetic NPC gives its authored defence without a deadlock');
 for(let i=0;i<4;i++)s=command(s,'p0','ADVANCE_PHASE');s=command(s,'p0','FINISH_CAMPAIGN');assert.equal(s.status,'finished');
});
await test('succession stake, single split and traceable personal or collective corruption',()=>{
 let s=finishPoker(initial());s=command(s,'p0','ADVANCE_PHASE',{},60000);s=command(s,'p0','ADVANCE_PHASE',{},120000);
 s=command(s,'p0','PLEDGE_SUCCESSION',{to:'p1'});s=command(s,'p1','ACCEPT_SUCCESSION_WAGER',{from:'p0'});
 assert.throws(()=>command(s,'p0','CLAIM_SUCCESSION'),/succession_right_unavailable/);
 s=command(s,'p1','CLAIM_SUCCESSION');s=command(s,'p1','SPLIT_FACTION',{name:'Branche fictive'});s=command(s,'p2','JOIN_SPLIT');
 assert.throws(()=>command(s,'p2','SPLIT_FACTION',{name:'Autre branche'}),/split_unavailable/);
 const before=s.roster.p2.chips;s=command(s,'p2','OFFER_CORRUPTION',{to:'agent',amount:10,terms:'Proposition fictive à évaluer.'});
 const id=s.corruption[0].id;assert.equal(s.roster.p2.chips,before-10);assert.equal(viewRuntime(s,'p0').corruption.length,0);
 s=command(s,'agent','ANSWER_CORRUPTION',{offerId:id,accept:false});assert.equal(s.roster.p2.chips,before);
 assert.throws(()=>command(s,'agent','ANSWER_CORRUPTION',{offerId:id,accept:true}),/invalid_corruption_offer/);
});
await test('real service API: recovery, concurrent actions, idempotent retries, stale responses and approval lock',async()=>{
 const store=new MemoryStorage();let now=0;const service=casinoService(store,{clock:()=>now});
 const hostToken=token(),roomId=randomUUID(),create={op:'create',roomId,sessionToken:hostToken,name:'Ali',profileId:randomUUID(),profileToken:'fixture'};
 let v=await service.process(create);assert.equal(v.status,'lobby');
 assert.deepEqual(await service.process(create),v);
 const identities=[{sessionToken:hostToken,id:v.viewer,name:'Ali'}];
 for(let i=1;i<7;i++){
  const t=token();const joined=await service.process({op:'join',sessionToken:t,name:'Participant '+i,inviteCode:v.inviteCode,requestId:randomUUID()});
  identities.push({sessionToken:t,id:joined.viewer,name:'Participant '+i});
 }
 for(let i=0;i<7;i++){
  const id=identities[i];v=await service.process({op:'sync',roomId,sessionToken:id.sessionToken});
  if(i>=4)v=await service.process({op:'role',roomId,sessionToken:id.sessionToken,role:['agent','investigator','analyst'][i-4],expectedRevision:v.revision,requestId:randomUUID()});
  v=await service.process({op:'ready',roomId,sessionToken:id.sessionToken,ready:true,expectedRevision:v.revision,requestId:randomUUID()});
 }
 await assert.rejects(()=>service.process({op:'start',roomId,sessionToken:hostToken,requestId:randomUUID(),expectedRevision:v.revision}),/casino_editorial_release_required/);
 store.approved=['A','B','C'].map(variant=>({...fixtureRelease(),id:'synthetic-'+variant,variant}));
 store.approved[0].content.humanReviewApproved=false;
 await assert.rejects(()=>service.process({op:'start',roomId,sessionToken:hostToken,requestId:randomUUID(),expectedRevision:v.revision}),/casino_editorial_release_required/);
 store.approved[0].content.humanReviewApproved=true;
 v=await service.process({op:'start',roomId,sessionToken:hostToken,requestId:randomUUID(),expectedRevision:v.revision});
 assert.equal(v.status,'playing');
 const resumed=await service.process({op:'join',inviteCode:v.inviteCode,sessionToken:hostToken,name:'Ali',requestId:randomUUID()});assert.equal(resumed.viewer,identities[0].id);
 const turn=v.poker.turn,t=identities.find(i=>i.id===turn).sessionToken;
 const action={op:'command',roomId,sessionToken:t,requestId:randomUUID(),expectedRevision:v.revision,type:'POKER_ACTION',payload:{action:'draw'}};
 const first=await service.process(action),again=await service.process(action);assert.equal(first.revision,again.revision);
 await assert.rejects(()=>service.process({...action,payload:{action:'fold'}}),/idempotency_key_conflict/);
 await assert.rejects(()=>service.process({...action,requestId:randomUUID(),actor:'system'}),/revision_conflict|server_fields_forbidden/);
 const nextT=identities.find(i=>i.id===first.poker.turn).sessionToken;
 const parallel=await Promise.allSettled([1,2].map(()=>service.process({op:'command',roomId,sessionToken:nextT,requestId:randomUUID(),expectedRevision:first.revision,type:'POKER_ACTION',payload:{action:'draw'}})));
 assert.equal(parallel.filter(r=>r.status==='fulfilled').length,1);assert.equal(parallel.filter(r=>r.status==='rejected').length,1);
 const saved=await store.read(roomId);assert.equal(saved.revision,first.revision+1);
 const journal=[...store.journal.values()].sort((a,b)=>a.revision-b.revision).map(e=>e.command);
 assert.deepEqual(replayCasinoJournal(saved.initialState,journal),saved.state,'The immutable journal must recreate the complete server state');
 const restarted=casinoService(store,{clock:()=>now});assert.equal((await restarted.process({op:'sync',roomId,sessionToken:hostToken})).revision,saved.revision);
 await assert.rejects(()=>service.process({op:'sync',roomId,sessionToken:token()}),/session_not_authorized/);
 assert(!JSON.stringify(first).includes(hostToken));assert(!JSON.stringify(first).includes('tokenHash'));
});
await test('Edge personal authentication, hostile origins, bounded bodies and no SQL leakage',async()=>{
 const store=new MemoryStorage(),handler=edgeHandler(store);
 const req=(headers,body='{}')=>new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json',...headers},body});
 assert.deepEqual(await (await handler(req({},'{"op":"sync"}'))).json(),{error:'invalid_session_token'});
 assert.equal((await handler(req({Origin:'https://hostile.test'}))).status,403);
 assert.equal((await handler(req({},' '.repeat(17000)))).status,413);
 const r=await handler(req({},'broken json'));assert.equal(r.status,400);assert.deepEqual(await r.json(),{error:'invalid_request'});
 const roomId=randomUUID(),hostToken=token();
 const created=await handler(req({},JSON.stringify({op:'create',roomId,sessionToken:hostToken,name:'Ali',profileId:randomUUID(),profileToken:'fixture'})));
 assert.equal(created.status,200);
 const wrong=await handler(req({},JSON.stringify({op:'sync',roomId,sessionToken:token()})));
 assert.equal(wrong.status,403);assert.deepEqual(await wrong.json(),{error:'session_not_authorized'});
 const own=await handler(req({},JSON.stringify({op:'sync',roomId,sessionToken:hostToken})));
 assert.equal(own.status,200);assert(!JSON.stringify(await own.json()).includes(hostToken));
 const failed=edgeHandler({read:async()=>{throw Error('SQL select * from private_table; internal details')}});
 const unavailable=await failed(req({},JSON.stringify({op:'sync',roomId,sessionToken:hostToken})));
 assert.deepEqual(await unavailable.json(),{error:'invalid_request'});
 for(const fetcher of [async()=>{throw Error('upstream network details')},async()=>new Response('truncated JSON')]){
  const brokenStorage=createStorage({url:'https://fixture.test',key:'fixture-only',fetcher});
  const broken=edgeHandler(brokenStorage);
  const response=await broken(req({},JSON.stringify({op:'sync',roomId,sessionToken:hostToken})));
  assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'storage_unavailable'});
 }
});
console.log(`Casino runtime: ${checks.length} behavioral groups passed.`);
