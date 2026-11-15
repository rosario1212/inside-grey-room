import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import path from 'node:path';

const root=process.cwd();
const engine=readFileSync(path.join(root,'heritage-v13-5.js'),'utf8');
const source=readFileSync(path.join(root,'heritage-play-v13-7.js'),'utf8');
const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();";
assert.ok(source.includes(marker),'Heritage playable runtime boot missing');
const instrumented=source.replace(marker,"window.__igrTest={startSession,secretFor,readLive,saveLive,renderPlay,renderDecision,chooseOption,applyResult,cendresLateEvidence,cendresFinalConsequence,missingRoleIntel,PACKS,ROLES};\n"+marker);

const entries=new Map(),dom={app:{innerHTML:''}};
const storage={getItem:key=>entries.has(key)?entries.get(key):null,setItem:(key,val)=>entries.set(key,String(val)),removeItem:key=>entries.delete(key)};
const document={readyState:'loading',addEventListener(){},getElementById:id=>dom[id]||null,querySelector(){return null},documentElement:{}};
const window={IGR_LOCALE:'fr',scrollTo(){},addEventListener(){}};
const rng={getRandomValues:array=>{for(let i=0;i<array.length;i++)array[i]=(Math.random()*0x100000000)>>>0;return array},randomUUID:()=>`test-${Math.random()}`};
runInNewContext(engine+'\n'+instrumented,{window,document,localStorage:storage,STORAGE:storage,crypto:rng,requestAnimationFrame:cb=>cb(),setTimeout(){},confirm:()=>true,console:{warn(){}},MutationObserver:class{observe(){}}},{timeout:3000,filename:'CENDRES runtime integration'});
const test=window.__igrTest;
assert.ok(test,'CENDRES test hooks missing');
assert.equal(Object.keys(test.PACKS.cendres.chapters).length,5);
assert.equal(test.ROLES.cendres.length,7);
assert.ok(!test.PACKS.cendres.chapters[3].briefing.includes('compte rendu B'),'Dossier III briefing gives away B');
assert.ok(!test.PACKS.cendres.chapters[4].briefing.includes('aux habilitations'),'Dossier IV briefing gives away culprit');
for(const [number,chapter] of Object.entries(test.PACKS.cendres.chapters)){
  assert.equal(chapter.phases.length,4,'Dossier '+number+' phase count');
  assert.equal(chapter.options.length,3,'Dossier '+number+' choices');
  assert.equal(chapter.options.filter(o=>o.grade===2).length,1,'Dossier '+number+' correct hypothesis');
  assert.equal(new Set(chapter.options.map(o=>o.id)).size,3,'Dossier '+number+' duplicate choice ids');
  for(const role of test.ROLES.cendres)assert.ok(chapter.secrets[role.id]?.[0]?.length>15,'Missing clue: '+number+' / '+role.id);
}

function submitLocalVotes(choices){
  let live=test.readLive();
  live.stage='decision';test.saveLive(live);test.renderDecision(live);
  for(let i=0;i<choices.length;i++){
    live=test.readLive();
    assert.equal(live.ballot.index,i,'Local ballot switched player unexpectedly');
    live.ballot.show=true;test.saveLive(live);
    test.renderDecision(live);
    test.chooseOption(choices[i]);
    if(i<choices.length-1)assert.equal(test.readLive().stage,'decision','Decision revealed before everyone voted');
  }
}

const choices={
  correct:['alias','transfer','b','kern','nadir'],
  wrong:['agent','terror','source','prisoner','airbase'],
  severe:['agent','terror','source','prisoner','nadir']
};
let cases=0;
for(const count of [5,7])for(const [route,answers] of Object.entries(choices)){
  entries.clear();window.IGR_HERITAGE.begin('cendres',false);
  for(let chapter=1;chapter<=5;chapter++){
    test.startSession('cendres',chapter,Array.from({length:count},(_,i)=>'Joueur '+(i+1)));
    let live=test.readLive();
    assert.equal(live.players.length,count);
    const present=new Set(live.players.map(p=>p.roleId));
    assert.equal(present.size,count,'Duplicate roles');
    for(const p of live.players)assert.ok(test.secretFor(live,p.roleId)[0],'Missing private content');
    for(let phase=0;phase<4;phase++){
      live.phaseIndex=phase;
      test.renderPlay(live);
      if(chapter>=3&&phase>=2)assert.ok(dom.app.innerHTML.includes('RECOUPEMENT TARDIF'),'Missing staged exhibit '+count+'/'+chapter+'/'+phase);
    }
    if(chapter===5&&route==='severe'){
      assert.ok(test.cendresLateEvidence(live,2,window.IGR_HERITAGE.get('cendres')).includes('incomplet'),'High crisis should degrade late evidence');
    }
    submitLocalVotes(Array(count).fill(answers[chapter-1]));
    live=test.readLive();
    assert.equal(live.stage,'result');
    if(chapter===5&&route==='severe')assert.ok(dom.app.innerHTML.includes('compromission institutionnelle majeure'),'Finale does not reflect severe prior crisis');
    test.applyResult(live);
    const progress=window.IGR_HERITAGE.get('cendres');
    assert.equal(progress.completed.length,chapter,'Progression failed');
  }
  const state=window.IGR_HERITAGE.get('cendres');
  const expected=route==='correct'?0:route==='wrong'?4:3;
  assert.equal(state.cendres.crisis.level,expected,'Wrong crisis carry '+count+'/'+route);
  assert.equal(state.cendres.network.nodes.length,5,'Wrong graph node count');
  assert.equal(state.cendres.network.links.length,4,'Wrong graph link count');

  // Replaying a past chapter must never mutate the campaign's canonical history.
  const snapshot=JSON.stringify(state);
  test.startSession('cendres',1,Array.from({length:count},(_,i)=>'Joueur '+(i+1)));
  let replay=test.readLive();
  assert.equal(replay.practice,true,'Replay should be non-canonical');
  const split=count===5?['alias','alias','agent','agent','victim']:['alias','alias','agent','agent','victim','victim','victim'];
  submitLocalVotes(split);
  replay=test.readLive();
  assert.equal(replay.stage,'decision','Split vote should require a new round');
  assert.equal(replay.ballot.round,2,'Expected second round');
  submitLocalVotes(Array(count).fill('victim'));
  replay=test.readLive();test.applyResult(replay);
  assert.equal(JSON.stringify(window.IGR_HERITAGE.get('cendres')),snapshot,'Replay rewrote campaign');
  cases++;
}

// Online guests must use host carry, not a conflicting campaign on their own phone.
entries.clear();window.IGR_HERITAGE.begin('cendres',false);
const hostCarry={cendres:{crisis:{level:4,label:'POINT DE RUPTURE'},flags:{s4_wrong:true}}};
const guest={campaignId:'cendres',chapter:5,online:true,campaignCarry:hostCarry};
assert.ok(test.cendresLateEvidence(guest,2,hostCarry).includes('incomplet'));
assert.ok(test.cendresFinalConsequence(guest,test.PACKS.cendres.chapters[5].options[0]).includes('compromission institutionnelle majeure'));
assert.equal(test.cendresLateEvidence({...guest,online:false},2,window.IGR_HERITAGE.get('cendres')).includes('incomplet'),false,'Local/remote state isolation missing');

console.log('CENDRES v713: '+cases+' end-to-end local runs (5/7 players × 3 paths), 30 chapters, 120 phases, replay and online carry projections OK');
