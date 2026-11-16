import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('heritage-v13-5.js','utf8'),source=readFileSync('heritage-play-v13-7.js','utf8');
const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();";
assert.ok(source.includes(marker));
const expose="window.__kuroiTest={startSession,secretFor,readLive,saveLive,renderPlay,renderDecision,chooseOption,applyResult,missingRoleIntel,conditionalIntel,kuroiLateEvidence,kuroiFinalConsequence,PACKS,ROLES};boot();\n";
const map=new Map(),app={innerHTML:''};
let writes=0;
const storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{if(k==='igr_heritage_v1')writes++;map.set(k,String(v))},removeItem:k=>map.delete(k)};
const document={readyState:'loading',documentElement:{},addEventListener(){},querySelector(){return null},getElementById:id=>id==='app'?app:null};
const window={IGR_LOCALE:'fr',scrollTo(){},addEventListener(){}};
const crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=(Math.random()*0x100000000)>>>0;return a},randomUUID:()=>String(Math.random())};
runInNewContext(engine+'\n'+source.replace(marker,expose+marker),{window,document,localStorage:storage,STORAGE:storage,crypto,requestAnimationFrame:cb=>cb(),setTimeout(){},confirm:()=>true,queueMicrotask(){},console:{warn(){}},MutationObserver:class{observe(){}}},{timeout:4500,filename:'KUROI end-to-end'});
const t=window.__kuroiTest;
assert.equal(Object.keys(t.PACKS.kuroi.chapters).length,5);
assert.equal(t.ROLES.kuroi.length,7);
assert.doesNotMatch(t.PACKS.kuroi.chapters[4].secrets.bengoshi[0],/Ishida ordonne/i);
for(const [n,ch] of Object.entries(t.PACKS.kuroi.chapters)){
  assert.equal(ch.phases.length,4);
  assert.equal(ch.options.length,3);
  assert.equal(new Set(ch.options.map(x=>x.id)).size,3,'Distinct verdicts');
  for(const role of t.ROLES.kuroi)assert.ok(ch.secrets[role.id]?.[0]?.length>30,'Missing clue '+n+'/'+role.id);
}
function ballot(choices){
  let live=t.readLive();live.stage='decision';t.saveLive(live);t.renderDecision(live);
  for(let i=0;i<choices.length;i++){
    live=t.readLive();assert.equal(live.ballot.index,i,'Seat mismatch');
    live.ballot.show=true;t.saveLive(live);t.renderDecision(live);t.chooseOption(choices[i]);
    if(i<choices.length-1)assert.equal(t.readLive().stage,'decision','Premature vote reveal');
  }
}
const routes={strong:['police_hand','mori_ren','copy','chain','public'],misled:['arakida','arakida_k','police','ren','scapegoat'],grey:['internal','oyabun_police','clan','mori','internal']};
let runs=0;
for(const n of [5,6,7])for(const [route,answers] of Object.entries(routes)){
  map.clear();window.IGR_HERITAGE.begin('kuroi',false);
  for(let ch=1;ch<=5;ch++){
    t.startSession('kuroi',ch,Array.from({length:n},(_,i)=>'Joueur '+(i+1)));
    const live=t.readLive();
    assert.equal(live.players.length,n);
    assert.equal(new Set(live.players.map(p=>p.roleId)).size,n,'Duplicate role');
    for(const p of live.players)assert.ok(t.secretFor(live,p.roleId)[0]);
    for(let phase=0;phase<4;phase++){
      live.phaseIndex=phase;t.renderPlay(live);
      if(phase>=2)assert.match(app.innerHTML,/RECOUPEMENT TARDIF/);
      if(n===5&&phase>=1)assert.doesNotMatch(app.innerHTML,/Ishida ordonne\. Mori fait faire/i);
    }
    ballot(Array(n).fill(answers[ch-1]));
    const result=t.readLive();assert.equal(result.stage,'result');
    if(ch===5)assert.ok(app.innerHTML.includes(route==='strong'?'LA LUMIÈRE FROIDE':route==='misled'?'LA DETTE CONTINUE':'LE SILENCE NÉGOCIÉ'));
    const previous=writes;t.applyResult(result);
    assert.equal(writes-previous,1,'Not exactly one canonical campaign write');
    assert.equal(window.IGR_HERITAGE.get('kuroi').completed.length,ch);
  }
  const saved=window.IGR_HERITAGE.get('kuroi');assert.equal(saved.status,'completed');
  assert.ok(saved.kuroi.chronicle.length>=5);
  if(route==='strong'){
    assert.equal(saved.kuroi.debts.length,3);
    assert.equal(saved.kuroi.debts.find(x=>x.id==='kuroi-debt-2-mori_ren')?.status,'broken');
    assert.equal(saved.kuroi.clans.police.members.find(x=>x.id==='ishida')?.status,'active','No automatic detention');
  }
  const snapshot=JSON.stringify(saved);
  t.startSession('kuroi',1,Array.from({length:n},(_,i)=>'Joueur '+(i+1)));
  assert.equal(t.readLive().practice,true);
  const split=n===5?['police_hand','police_hand','arakida','arakida','internal']:n===6?['police_hand','police_hand','arakida','arakida','internal','internal']:['police_hand','police_hand','police_hand','arakida','arakida','internal','internal'];
  ballot(split);
  assert.equal(t.readLive().stage,'decision','Plurality is not a majority');
  assert.equal(t.readLive().ballot.round,2);
  ballot(Array(n).fill('internal'));t.applyResult(t.readLive());
  assert.equal(JSON.stringify(window.IGR_HERITAGE.get('kuroi')),snapshot,'Replay modified campaign');
  runs++;
}
map.clear();window.IGR_HERITAGE.begin('kuroi',false);
t.startSession('kuroi',1,['A','B','C','D','E']);ballot(Array(5).fill('police_hand'));
const first=t.readLive(),set=storage.setItem;
storage.setItem=(key,val)=>{if(key==='igr_heritage_v1')throw new Error('quota');set(key,val)};
t.applyResult(first);
assert.equal(window.IGR_HERITAGE.get('kuroi').completed.length,0,'Quota failure changed campaign');
assert.equal(t.readLive()?.stage,'result','Quota failure discarded result');
storage.setItem=set;t.applyResult(first);
assert.equal(window.IGR_HERITAGE.get('kuroi').completed.length,1,'Retry failed');
assert.equal(window.IGR_HERITAGE.get('kuroi').kuroi.debts.length,1);
const snapshot=JSON.stringify(window.IGR_HERITAGE.get('kuroi'));
const room={campaign_id:'kuroi',chapter:1,decision_id:'police_hand',stage:'finished'};
assert.equal(window.IGR_HERITAGE_PLAY.finishOnlineConfirmed(room,false),true);
assert.equal(JSON.stringify(window.IGR_HERITAGE.get('kuroi')),snapshot,'Repeat server ack changed canonical save');
const guest={campaignId:'kuroi',chapter:5,online:true,campaignCarry:{kuroi:{flags:{k3_correct:true,k4_correct:true}}}};
assert.match(t.kuroiFinalConsequence(guest,t.PACKS.kuroi.chapters[5].options[0]),/LA LUMIÈRE FROIDE/);
assert.match(t.kuroiFinalConsequence({...guest,campaignCarry:{kuroi:{flags:{k3_wrong:true,k4_wrong:true}}}},t.PACKS.kuroi.chapters[5].options[0]),/LA LUMIÈRE FRAGILE/);
console.log('KUROI v715 PASS: '+runs+' campaigns at 5/6/7 players, 45 dossiers, 180 phases; private majority, conditional outcomes, atomic write, storage retry and replay');
