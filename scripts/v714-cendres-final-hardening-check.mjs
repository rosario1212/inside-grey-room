// CENDRES v714: real runtime functions, ballot UI, late-evidence neutrality and server-result recovery.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const game=readFileSync('heritage-play-v13-7.js','utf8');
const engine=readFileSync('heritage-v13-5.js','utf8');
const online=readFileSync('play-modes-v13-8.js','utf8');
const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();";
assert.ok(game.includes(marker),'CENDRES game boot missing');
assert.ok(online.includes("routeHOnline(d);hLastSig=sig;"),'A failed render could freeze the online watcher');

const storageMap=new Map(),app={innerHTML:''};
let heritageWrites=0;
const storage={
  getItem:k=>storageMap.has(k)?storageMap.get(k):null,
  setItem:(k,v)=>{if(k==='igr_heritage_v1')heritageWrites++;storageMap.set(k,String(v))},
  removeItem:k=>storageMap.delete(k)
};
const document={readyState:'loading',documentElement:{},addEventListener(){},querySelector(){return null},getElementById:id=>id==='app'?app:null};
const window={IGR_LOCALE:'fr',addEventListener(){},scrollTo(){}};
const rng={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=(Math.random()*0x100000000)>>>0;return a},randomUUID:()=>String(Math.random())};
const instrumented=game.replace(marker,"window.__cendresTest={startSession,readLive,saveLive,resumeLive,renderDecision,conditionalIntel,cendresLateEvidence,PACKS};boot();\n"+marker);
runInNewContext(engine+'\n'+instrumented,{window,document,localStorage:storage,STORAGE:storage,crypto:rng,MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout(){},confirm:()=>true,queueMicrotask(){},console:{warn(){}}},{timeout:3500});
const t=window.__cendresTest;
assert.ok(window.IGR_HERITAGE_PLAY?.finishOnlineConfirmed,'The online result reconciler was not exposed');

window.IGR_HERITAGE.begin('cendres',false);
const goodCarry={cendres:{flags:{s1_correct:true,s2_correct:true,s3_correct:true,s4_correct:true},crisis:{level:0}}};
const goodFour=t.conditionalIntel('cendres',4,goodCarry);
const goodFourLate=t.cendresLateEvidence({campaignId:'cendres',chapter:4},2,goodCarry);
assert.doesNotMatch(goodFour,/compte privilégié du service des habilitations/i,'Dossier IV public briefing reveals the culprit');
assert.doesNotMatch(goodFourLate,/appartient à un compte de service lié aux habilitations/i,'Dossier IV late clue reveals the culprit');
const goodFiveLate=t.cendresLateEvidence({campaignId:'cendres',chapter:5},2,goodCarry);
assert.doesNotMatch(goodFiveLate,/ni la base ni le dépôt ne possèdent de reçu signé/i,'Dossier V late clue eliminates two suspects directly');

// The local result may be lost after a refresh. Confirmed server state must restore the host's progress exactly once.
const room={campaign_id:'cendres',chapter:1,decision_id:'alias',stage:'finished',campaign_carry:goodCarry};
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed({...room,stage:'decision'},false),false,'Unfinished server stage persisted');
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed({...room,decision_id:'forged'},false),false,'Invalid server option persisted');
const writesBefore=heritageWrites;
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed(room,false),true,'Lost result did not recover');
assert.equal(heritageWrites-writesBefore,1,'A complete CENDRES verdict must persist in exactly one campaign write');
let state=window.IGR_HERITAGE.get('cendres');
assert.equal(state.completed.length,1,'Recovered chapter was not committed');
assert.equal(state.cendres.network.nodes.length,1,'Recovered chapter graph was not saved');
const snapshot=JSON.stringify(state);
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed(room,false),true,'Second server confirmation refused');
assert.equal(JSON.stringify(window.IGR_HERITAGE.get('cendres')),snapshot,'Duplicate confirmation altered saved campaign');
assert.equal(heritageWrites-writesBefore,1,'Repeat confirmation rewrote canonical state');

// Quota or storage access errors must leave chapter two uncommitted and recoverable.
const second={...room,chapter:2,decision_id:'transfer'};
const originalSetItem=storage.setItem;
storage.setItem=(key,val)=>{if(key==='igr_heritage_v1')throw new Error('quota exceeded');originalSetItem(key,val)};
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed(second,false),false,'Save failure reported a completed chapter');
assert.equal(window.IGR_HERITAGE.get('cendres').completed.length,1,'A failed write advanced the chapter');
storage.setItem=originalSetItem;
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed(second,false),true,'Quota recovery did not retry chapter two');
assert.equal(window.IGR_HERITAGE.get('cendres').completed.length,2,'Recovery did not finish chapter two');
assert.equal(window.IGR_HERITAGE.get('cendres').cendres.network.links.length,1,'Atomic recovery lost the dossier connection');

// Return to a private pass-and-play ballot after a navigation/reload: the answer choices must be masked.
storageMap.clear();window.IGR_HERITAGE.begin('cendres',false);
t.startSession('cendres',1,['A','B','C','D','E']);
const live=t.readLive();
live.stage='decision';live.ballot={round:1,index:0,votes:[],show:true};t.saveLive(live);
t.resumeLive();
assert.equal(t.readLive().ballot.show,false,'Resumed local private ballot was exposed');
assert.match(app.innerHTML,/PASSEZ LE TÉLÉPHONE À/i);

// The actual DOM patch must enumerate all three buttons rather than treating querySelector as a list.
const from=online.indexOf('function patchHBridge(d,stage){'),to=online.indexOf('async function advanceHeritageOnline()',from);
assert.ok(from>0&&to>from,'Could not isolate online ballot renderer');
const buttons=['b','source','audio'].map(id=>({dataset:{hpOption:id},disabled:false,classList:{toggle(){}}}));
const options={before(note){this.note=note.textContent}};
const heading={textContent:''};
const ui={
  hSession:()=>({hostToken:null}),
  document:{createElement:()=>({textContent:'',className:''})},
  $:(selector)=>selector==='.hplay-options'?options:selector==='.hplay-mode'?heading:null,
  $$:(selector,root)=>selector==='button'&&root===options?buttons:[],
  requestAnimationFrame:fn=>fn(),
  console:{}
};
runInNewContext(online.slice(from,to)+'\nthis.patch=patchHBridge',ui);
ui.patch({room:{campaign_id:'cendres',ballot_status:{vote_round:1,votes_cast:2,players:5,majority:3,my_vote:null}}},'decision');
assert.equal(buttons.length,3);
assert.ok(buttons.every(b=>b.disabled===false),'A guest could not vote on all three options');
assert.match(options.note,/2\/5 votes/);
ui.patch({room:{campaign_id:'cendres',ballot_status:{vote_round:1,votes_cast:3,players:5,majority:3,my_vote:'b'}}},'decision');
assert.ok(buttons.every(b=>b.disabled===true),'Already cast ballot was not disabled');

// Server-finished but locally unsaved: preserve recovery token, offer retry instead of success.
const finishFrom=online.indexOf('function renderHFinished(d){'),finishTo=online.indexOf('function resumeHeritageOnline()',finishFrom);
assert.ok(finishFrom>0&&finishTo>finishFrom);
let cleared=0,retryShown='',handler=null;
const recover={
  hSession:()=>({hostToken:'HOST',practice:false}),
  window:{IGR_HERITAGE_PLAY:{finishOnlineConfirmed:()=>false}},
  clearHSession:()=>cleared++,
  del:()=>cleared++,
  HERITAGE_LIVE_KEY:'test-key',
  shellPut:html=>{retryShown=html},
  $:()=>({addEventListener:(event,fn)=>{handler=fn}}),
  syncHeritageOnline:()=>true,
  renderHome:()=>{}
};
runInNewContext(online.slice(finishFrom,finishTo)+'\nthis.finished=renderHFinished',recover);
recover.finished({room});
assert.equal(cleared,0,'Failed host persistence deleted recovery credentials');
assert.match(retryShown,/RÉESSAYER LA SYNCHRONISATION/);
assert.equal(typeof handler,'function');
recover.window.IGR_HERITAGE_PLAY.finishOnlineConfirmed=()=>true;
recover.finished({room});
assert.equal(cleared,2,'Successful persistence did not clear finished room token');

console.log('CENDRES v714 PASS: public clue neutrality, 5-seat private ballot, 3-button online vote, host crash recovery, idempotent confirmed completion and retained retry credentials');
