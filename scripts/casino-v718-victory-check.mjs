import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixtureRelease} from './casino-fixtures.mjs';
import {startRuntime,applyRuntime,viewRuntime} from '../casino/runtime.mjs';
import {casinoVictory,casinoPersonalVictory,casinoVictoryBrief} from '../casino/victory.mjs';
import {shuffledDeck} from '../casino/games.mjs';

const release=fixtureRelease();let seq=0;
const cmd=(s,actor,type,payload={},now=0)=>applyRuntime(s,{id:'v718-'+(++seq),actor,type,payload},{now});
function fixture(count=4,optional=[],undercoverIds=[]){
 const members=[...Array.from({length:count},(_,i)=>({id:'p'+i,name:'Participant '+i,role:'casino',ready:true})),
   ...['agent','investigator','analyst',...optional].map(role=>({id:role,name:role,role,ready:true}))];
 return startRuntime({id:randomUUID(),hostId:'p0',members},release,{undercoverIds,now:0,deck:shuffledDeck(n=>n-1)});
}
const link={id:'map-a',subject:'p1',target:'p0',relation:'finance',offence:'infraction fictive',
 evidenceIds:['proof0','proof1'],filedBy:'analyst'};
function scored(s){
 s.roomLocated=true;
 s.organigram=[structuredClone(link)];
 s.finale={political:'dragon_retained',successor:null,split:null};
 s.bureauBallots={agent:'established',investigator:'established',analyst:'established'};
 return s;
}
const group=(s)=>casinoVictory(s).investigative;
for(let count=4;count<=7;count++)for(const optional of [[],['judge'],['prosecutor'],['judge','prosecutor']]){
 const s=fixture(count,optional);
 assert.equal(s.players.length+Object.keys(s.bureau).length,count+3+optional.length);
 assert.equal(Object.keys(s.bureau).length,3+optional.length);
 assert.equal(s.organigram.length,0);
 assert.ok(!JSON.stringify(viewRuntime(s,'p0')).includes('"undercoverIds"'));
 for(const viewer of s.players)assert.match(casinoVictoryBrief(s,viewer),/Victoire politique/);
 for(const viewer of Object.values(s.bureau))assert.ok(casinoVictoryBrief(s,viewer).length>50);
 scored(s);
 assert.equal(group(s).outcome,'victory','Correct link and 3 bureau members should establish an accurate dossier');
 assert.equal(group(s).majority,Math.floor(Object.values(s.bureau).length/2)+1);
 const judgeOnly=structuredClone(s);
 judgeOnly.bureauBallots={judge:'established'};
 assert.equal(group(judgeOnly).outcome,'defeat','Judge may not appoint a collective winner');
 const hostOnly=structuredClone(s);
 hostOnly.bureauBallots={p0:'established'};
 assert.equal(group(hostOnly).outcome,'defeat','Host vote cannot decide for bureau');
}
{
 const s=scored(fixture(5));
 assert.equal(group(s).corroborated,1);
 s.organigram.push({...link,id:'duplicate-identical-map'});
 assert.equal(group(s).corroborated,1,'Repeated exact same link may never count twice');
 s.organigram.push({...link,id:'false-map',relation:'commande'});
 assert.equal(group(s).outcome,'defeat','Too many speculative links must spoil the bureau victory');
 assert.equal(group(s).contested,1);
 const a=structuredClone(s);a.organigram=[link];a.bureauBallots={agent:'established',investigator:'insufficient',analyst:'established'};
 assert.equal(group(a).outcome,'victory','Two of three seats meet absolute majority');
 a.bureauBallots={agent:'established',investigator:'insufficient',analyst:'insufficient'};
 assert.equal(group(a).outcome,'defeat','Minority cannot claim victory');
 a.bureauBallots={agent:'established',investigator:'established',analyst:'established'};a.organigram=[];
 assert.equal(group(a).outcome,'defeat','No true reported link: no automatic victory for saying it exists');
 a.organigram=[{...link,relation:'dirige'}];
 assert.equal(group(a).outcome,'defeat','A different relation is not proof of the canonical link');
 const view=viewRuntime(s,'analyst');
 assert.equal(view.bureauVerdict,undefined,'Ballot is only visible in final phase');
}
{
 const s=scored(fixture(4,[],['p3']));
 s.finale={...s.finale,successor:'p0',political:'recognised_claim'};
 const fin=casinoVictory(s);s.finale.victory=fin;
 assert.equal(casinoPersonalVictory(s,'p0',fin).outcome,'victory','Recognized successor receives win');
 s.support.p1='p0';
 s.agreements.pact={id:'pact',participants:['p0','p1'],kind:'alliance',status:'signed',breachedBy:[]};
 assert.equal(casinoPersonalVictory(s,'p1',fin).outcome,'victory','Kingmaker must have a signed, unbroken pact');
 s.agreements.pact.breachedBy.push('p1');
 assert.notEqual(casinoPersonalVictory(s,'p1',fin).outcome,'victory','Betrayed pact is not a kingmaker victory');
 s.agreements={};
 assert.equal(casinoPersonalVictory(s,'p2',fin).outcome,'defeat','Standing free is not enough');
 s.territories.t1.controller='p2';
 assert.equal(casinoPersonalVictory(s,'p2',fin).outcome,'partial','Holding an asset earns a partial gain');
 s.finale.political='split';s.finale.split={founder:'p2',acceptedSupporters:['p1']};
 const splitFinal=casinoVictory(s);
 assert.equal(casinoPersonalVictory(s,'p2',splitFinal).outcome,'victory');
 assert.equal(casinoPersonalVictory(s,'p1',splitFinal).outcome,'victory');
 // A covert operative does not automatically win because the bureau did.
 assert.equal(casinoPersonalVictory(s,'p3',fin).outcome,'defeat');
 s.intel.push({id:'intel',from:'p3',subjectId:'p1',checked:true,reviewedBy:'analyst',evidenceIds:['proof0']});
 assert.equal(casinoPersonalVictory(s,'p3',fin).outcome,'victory');
 s.roster.p3.status='detained';
 assert.equal(casinoPersonalVictory(s,'p3',fin).outcome,'victory','Success may carry imprisonment');
 assert.match(casinoPersonalVictory(s,'p3',fin).narrative,/La porte s’est refermée/);
 assert.doesNotMatch(JSON.stringify(viewRuntime(s,'p0')),/"undercoverIds"|"privateCanon"/);
 assert.doesNotMatch(casinoVictoryBrief(s,'p0'),/mission privée|couverture cachée/);
 assert.match(casinoVictoryBrief(s,'p3'),/mission privée/);
}
// Full eight-phase game: no host-only or judge-only bureau result.
{
 let s=fixture(4);
 assert.throws(()=>cmd(s,'p0','BUREAU_VERDICT',{position:'established'}),/unauthorized_role/);
 for(let i=0;i<2;i++)s=cmd(s,'agent','AGENT_DECISION',{answer:'confirmed'},1000);
 s=cmd(s,'p0','CLAIM_SUCCESSION');
 s=cmd(s,'p1','PLEDGE_LOYALTY',{to:'p0'});
 while(s.poker.stage!=='settled'){
   s=cmd(s,s.poker.turn,'POKER_ACTION',s.poker.stage==='draw'?{action:'draw'}:{action:'check'},1000);
 }
 s=cmd(s,'analyst','MAP_RELATION',{subject:'p1',target:'p0',relation:'finance',offence:'infraction fictive',evidenceIds:['proof0','proof1']},1000);
 assert.equal(s.organigram[0].filedBy,'analyst');
 assert.equal(s.organigram[0].offence,'infraction fictive');
 s=cmd(s,'p0','ADVANCE_PHASE',{},65000);
 for(let i=0;i<2;i++)s=cmd(s,'agent','AGENT_DECISION',{answer:'confirmed'},66000);
 s=cmd(s,'p0','ADVANCE_PHASE',{},130000);
 s=cmd(s,'agent','AGENT_DECISION',{answer:'confirmed'},131000);
 s=cmd(s,'agent','LOCATE_ROOM',{},195000);
 s=cmd(s,'p0','ADVANCE_PHASE',{},195001);
 assert.equal(s.chapter,2);
 for(let i=0;i<3;i++)s=cmd(s,'p0','ADVANCE_PHASE',{},195010+i);
 assert.equal(s.chapter,3);
 s=cmd(s,'p0','ADVANCE_PHASE',{},195015);
 assert.equal(s.phase,2);
 assert.throws(()=>cmd(s,'p0','FINISH_CAMPAIGN',{},195016),/bureau_report_pending/);
 assert.throws(()=>cmd(s,'p0','BUREAU_VERDICT',{position:'established'},195016),/unauthorized_role/);
 assert.throws(()=>cmd(s,'agent','BUREAU_VERDICT',{position:'not-an-answer'},195016),/invalid_bureau_verdict/);
 s=cmd(s,'agent','BUREAU_VERDICT',{position:'established'},195016);
 s=cmd(s,'investigator','BUREAU_VERDICT',{position:'insufficient'},195017);
 s=cmd(s,'analyst','BUREAU_VERDICT',{position:'established'},195018);
 assert.equal(viewRuntime(s,'agent').bureauVerdict.cast,3);
 assert.equal(viewRuntime(s,'agent').bureauVerdict.myVote,'established');
 assert.equal(viewRuntime(s,'p0').bureauVerdict,undefined,'Casino player cannot see private bureau position');
 assert.doesNotMatch(JSON.stringify(viewRuntime(s,'p0')),/"bureauBallots"/);
 s=cmd(s,'p0','FINISH_CAMPAIGN',{},195019);
 assert.equal(s.status,'finished');
 assert.equal(s.finale.victory.investigative.outcome,'victory');
 assert.equal(s.finale.victory.political.outcome,'recognised_claim');
 assert.equal(s.finale.successor,'p0');
 assert.equal(viewRuntime(s,'p0').finale.personalVictory.outcome,'victory');
 assert.equal(viewRuntime(s,'analyst').finale.personalVictory.outcome,'victory');
 assert.equal(viewRuntime(s,'agent').finale.personalVictory.outcome,'victory');
 assert.notDeepEqual(viewRuntime(s,'analyst').finale.personalVictory,viewRuntime(s,'p0').finale.personalVictory);
 assert.equal(s.finale.judicial.length,0,'Never fabricate a judicial ruling when no hearing took place');
 assert.throws(()=>cmd(s,'agent','BUREAU_VERDICT',{position:'insufficient'}),/campaign_closed/);
 // Neutral empty report remains a loss after a documented no-show timeout.
 let missing=fixture(4);missing=scored(missing);missing.chapter=3;missing.phase=2;missing.phaseStartedAt=200000;
 missing.bureauBallots={agent:'established'};
 missing.poker.stage='settled';missing.openingPokerComplete=true;
 assert.throws(()=>cmd(missing,'p0','FINISH_CAMPAIGN',{},200001),/bureau_report_pending/);
 missing=cmd(missing,'p0','FINISH_CAMPAIGN',{},380001);
 assert.equal(missing.finale.victory.investigative.outcome,'defeat','Host cannot synthesize missing votes');
}
console.log('CASINO v718 OK: 16 cast variants (7–12 players), independent collective verdict, 8 actual phases, personal wins, no coercion, no fabricated hearings, private scores and timeout abstentions');
