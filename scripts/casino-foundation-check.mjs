import assert from 'node:assert/strict';
import { createCasinoCampaign, applyCasinoCommand, casinoView, replayCasinoCommands } from '../casino/campaign-core.mjs';
const people=['mei','gao','zhou','rafael'];
const roster=[...people.map((id)=>({id,name:id, chips:500, reputation:45,legitimacy:20,influence:35})),
 {id:'dragon',name:'Vieux Dragon', chips:0,reputation:80,legitimacy:90,influence:85,npc:true},
 {id:'chan',name:'Chan Wai-lun', chips:0,reputation:65,legitimacy:55,influence:60,npc:true}];
const make=()=>createCasinoCampaign({ id:'casino-test',players:people,characters:roster,bureau:{agent:'agent',investigator:'inspector',analyst:'analyst',judge:'judge'},undercoverIds:['rafael'],answerKey:{1:'a',2:'b',3:'c',4:'d',5:'e'} });
let s=make(), commands=[];
const doIt=(id,actor,type,payload={})=>{const cmd={id,actor,type,payload};commands.push(cmd);s=applyCasinoCommand(s,cmd);return cmd};
const reject=(command,reason)=>assert.throws(()=>applyCasinoCommand(s,command),new RegExp(reason));
assert.equal(Object.keys(casinoView(s,'mei')).includes('undercoverIds'),false);
assert.equal(casinoView(s,'mei').ownUndercoverBrief,undefined);
assert.equal(casinoView(s,'rafael').ownUndercoverBrief.mission,'observer_rapporter');
assert.equal(casinoView(s,'mei').camp,'casino');
assert.equal(casinoView(s,'agent').camp,'bureau');
assert.equal(casinoView(s,'mei').characters.find(c=>c.id==='dragon').reputation,80);
assert.equal(casinoView(s,'mei').intel,undefined);
reject({id:'illegal',actor:'mei',type:'VALIDATE_EVIDENCE',payload:{subjectId:'gao',sourceId:'x',description:'x',offence:'x'}},'evidence_requires_server_validation');
// Poker: idempotent, sum-zero, no overspending
const hand=doIt('poker-1','system','SETTLE_POKER',{handId:'hand-1',net:{mei:-100,gao:100}});
assert.equal(s.roster.mei.chips,400);
assert.strictEqual(applyCasinoCommand(s,hand),s);
reject({...hand,payload:{handId:'hand-1',net:{mei:-50,gao:50}}},'idempotency_key_conflict');
reject({id:'poker-bad',actor:'system',type:'SETTLE_POKER',payload:{handId:'hand-2',net:{mei:-2000,gao:2000}}},'insufficient_chips');
// Accord oral followed by signed entry in the register, then betrayal
const contract={recordId:'contract-1',participants:['mei','gao'],kind:'territory',visibility:'private',terms:'Droit de revendication sur une concession, sans transfert immédiat.'};
doIt('agreement','mei','PROPOSE_AGREEMENT',contract);
assert.equal(casinoView(s,'zhou').agreements.length,0);
assert.equal(casinoView(s,'gao').agreements.length,1);
doIt('signed','gao','SIGN_AGREEMENT',{recordId:'contract-1'});
assert.equal(s.agreements['contract-1'].status,'signed');
doIt('breach','gao','BREAK_AGREEMENT',{recordId:'contract-1'});
assert.equal(s.roster.gao.reputation,38);
// No legitimacy threshold for claiming; dragon's nomination must be backed by authority
s=applyCasinoCommand(s,{id:'claim',actor:'mei',type:'CLAIM_SUCCESSION',payload:{}});commands.push({id:'claim',actor:'mei',type:'CLAIM_SUCCESSION',payload:{}});
doIt('nominate','system','DRAGON_NOMINATION',{characterId:'mei'});
assert.equal(s.namedSuccessor,'mei');
doIt('authority-lost','system','DRAGON_AUTHORITY',{retained:false,canonicalReason:'Conseil refuse de reconnaître l’autorité.'});
assert.equal(s.namedSuccessor,null);
reject({id:'nominate-again',actor:'system',type:'DRAGON_NOMINATION',payload:{characterId:'mei'}},'dragon_lacks_authority');
// Separate camp: information may pass privately but no immediate arrest
reject({id:'espion-bad',actor:'mei',type:'REPORT_INTEL',payload:{text:'soupçon',subjectId:'gao'}},'not_undercover');
doIt('intel','rafael','REPORT_INTEL',{text:'Observation à vérifier',subjectId:'gao'});
assert.equal(casinoView(s,'gao').intel,undefined);
assert.equal(casinoView(s,'agent').intel.length,1);
reject({id:'too-early',actor:'agent',type:'LOCATE_ROOM',payload:{}},'incorrect_campaign_phase');
// Decisions are tied to phase and answer key on server; perfect path at phase 3
for (const [i,answer] of [[1,'a'],[2,'b']]) doIt(`decision-${i}`,'agent','AGENT_DECISION',{answer});
doIt('phase-2','system','ADVANCE_PHASE');
for (const [i,answer] of [[3,'c'],[4,'d']]) doIt(`decision-${i}`,'agent','AGENT_DECISION',{answer});
doIt('phase-3','system','ADVANCE_PHASE');
doIt('decision-5','agent','AGENT_DECISION',{answer:'e'});
doIt('found-room','agent','LOCATE_ROOM');
assert.equal(s.roomLocated,true);
doIt('chapter2','system','ADVANCE_PHASE');
// Investigator cannot arrest on an uncorroborated claim
reject({id:'weak',actor:'inspector',type:'REQUEST_INTERPELLATION',payload:{subjectId:'gao',evidenceIds:[],allegedOffence:'détournement',reasoning:'rumeur'}},'insufficient_corroboration');
doIt('e1','system','VALIDATE_EVIDENCE',{subjectId:'gao',sourceId:'register',description:'Contrat',offence:'extorsion'});
doIt('e2','system','VALIDATE_EVIDENCE',{subjectId:'gao',sourceId:'witness',description:'Témoignage corroboré',offence:'extorsion'});
doIt('request','inspector','REQUEST_INTERPELLATION',{subjectId:'gao',evidenceIds:['e1','e2'],allegedOffence:'extorsion',reasoning:'Sources distinctes et confirmées'});
reject({id:'bad-arrest',actor:'mei',type:'INTERPELLATE',payload:{requestId:'request'}},'unauthorized_role');
doIt('arrest','agent','INTERPELLATE',{requestId:'request'});
assert.equal(s.roster.gao.status,'interpellated');
doIt('detain','judge','DETAIN',{subjectId:'gao',judicialBasis:'Décision motivée après audience.'});
doIt('prison','gao','PRISON_MESSAGE',{kind:'allies',text:'Je conserve mes soutiens.'});
assert.equal(casinoView(s,'gao').ownPrisonMessages.length,1);
assert.equal(casinoView(s,'mei').ownPrisonMessages.length,0);
assert.equal(s.roster.gao.status,'detained');
assert.deepEqual(replayCasinoCommands(make(),commands),s);
// Missing undercover is legitimate. A failed puzzle can be resolved by server-authorized fallback only.
let other=createCasinoCampaign({id:'no-infiltrator',players:people,characters:roster,bureau:{agent:'agent',investigator:'inspector',analyst:'analyst'},undercoverIds:[],answerKey:{1:'yes'}});
other=applyCasinoCommand(other,{id:'adv1',actor:'system',type:'ADVANCE_PHASE'});
other=applyCasinoCommand(other,{id:'adv2',actor:'system',type:'ADVANCE_PHASE'});
assert.throws(()=>applyCasinoCommand(other,{id:'loc-no',actor:'agent',type:'LOCATE_ROOM',payload:{authorizer:'system',serverAuthorized:true,fallbackValidated:true}}),/room_not_locatable_yet/);
other=applyCasinoCommand(other,{id:'fallback',actor:'system',type:'AUTHORIZE_FALLBACK',payload:{reason:'Piste de secours après phase 3'}});
other=applyCasinoCommand(other,{id:'loc-yes',actor:'agent',type:'LOCATE_ROOM'});
assert.equal(other.roomLocated,true);
console.log('Casino foundation: 26+ invariants validated, incl. replay, secrecy, evidence, detention and transitions.');

