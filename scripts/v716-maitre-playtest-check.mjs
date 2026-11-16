import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('heritage-v13-5.js','utf8');
const data=readFileSync('heritage-maitre-data-v34.js','utf8');
const src=readFileSync('heritage-maitre-v34.js','utf8');
const marker="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();";
assert.ok(src.includes(marker),'MAÎTRE boot missing');
const expose="window.__maitreQA={startSession,readLive,saveLive,renderCycle,renderDecision,chooseOutcome,finish,resume,secretFor,maitreInheritedEnd,maitrePublicExhibit,PACK,ROLES,VARIANTS};boot();\n";
const map=new Map(),app={innerHTML:''};
let primaryWrites=0,quota=false;
const storage={
  getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>{if(k==='igr_heritage_v1'){if(quota)throw new Error('quota');primaryWrites++}map.set(k,String(v))},
  removeItem:k=>map.delete(k)
};
const document={readyState:'loading',documentElement:{},addEventListener(){},querySelector(){return null},getElementById:k=>k==='app'?app:null};
const window={IGR_LOCALE:'fr',scrollTo(){},addEventListener(){}};
const crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=(Math.random()*0x100000000)>>>0;return a},randomUUID:()=>String(Math.random())};
runInNewContext(engine+'\n'+data+'\n'+src.replace(marker,expose+marker),{
  window,document,localStorage:storage,STORAGE:storage,crypto,
  requestAnimationFrame:fn=>fn(),setTimeout(){},confirm:()=>true,
  queueMicrotask(){},console:{warn(){}},MutationObserver:class{observe(){}}
},{timeout:4500,filename:'MAÎTRE v716 local playtest'});
const t=window.__maitreQA;
assert.equal(Object.keys(t.PACK.chapters).length,5);
assert.equal(Object.keys(t.VARIANTS).length,3);
assert.equal(t.ROLES.length,7);
for(const ch of [1,2,3,4,5]){
  assert.equal(t.PACK.chapters[ch].outcomes.length,3,'Three resolutions');
  assert.equal(t.PACK.chapters[ch].cycles.length,3,'Three courtroom cycles');
  for(const role of t.ROLES)assert.ok(t.secretFor(ch,role.id,'blind',{maitre:{relationships:{associe:'unknown'}}})[0]?.length>30,'Missing role clue '+ch+'/'+role.id);
}
function ballot(choices){
  let live=t.readLive();live.stage='decision';t.saveLive(live);t.renderDecision(live);
  for(let i=0;i<choices.length;i++){
    live=t.readLive();
    assert.equal(live.ballot.index,i,'Vote changed player');
    live.ballot.show=true;t.saveLive(live);t.renderDecision(live);
    t.chooseOutcome(choices[i]);
    if(i<choices.length-1)assert.equal(t.readLive().stage,'decision','Result published before all seats voted');
  }
}
const paths={
  fiscal:['fiscal_only','targeted','separate','narrow','defender'],
  blind:['blindness','protect','common','insufficient','name'],
  link:['active_link','deliver','fracture','network','negotiator']
};
let runs=0;
for(const n of [5,6,7])for(const [variant,answers] of Object.entries(paths)){
  map.clear();window.IGR_HERITAGE.begin('maitre');
  const store=JSON.parse(map.get('igr_heritage_v1'));
  store.maitre.maitre.canon.variant=variant;map.set('igr_heritage_v1',JSON.stringify(store));
  for(let chapter=1;chapter<=5;chapter++){
    const names=Array.from({length:n},(_,i)=>'Joueur '+(i+1));
    t.startSession(chapter,names);
    let live=t.readLive();
    assert.equal(live.players.length,n);
    assert.equal(live.players[0].roleId,'avocat','Lawyer must be fixed');
    assert.equal(new Set(live.players.map(p=>p.roleId)).size,n,'Duplicated role');
    assert.ok(live.players.some(p=>p.roleId==='juge'),'The judge is not at the table');
    for(const p of live.players){
      const clue=t.secretFor(chapter,p.roleId,variant,window.IGR_HERITAGE.get('maitre'));
      assert.ok(clue[0].length>35);
      if(p.roleId==='juge')assert.doesNotMatch(clue[0],/Le Client a réellement dissimulé des revenus|facilité une partie des flux liés au trafic/i);
    }
    for(let cycle=0;cycle<3;cycle++){
      live.cycleIndex=cycle;
      t.renderCycle(live);
      if(cycle>=1)assert.match(app.innerHTML,/PIÈCE DE L’AUDIENCE/);
    }
    live.angle='La chronologie ne démontre pas à elle seule une participation au réseau.';
    t.saveLive(live);
    ballot(Array(n).fill(answers[chapter-1]));
    live=t.readLive();
    assert.equal(live.stage,'result');
    if(chapter===5){
      const expected=variant==='fiscal'?'LE DÉFENSEUR':variant==='blind'?'LE NOM':'LE NÉGOCIATEUR';
      assert.ok(app.innerHTML.includes(expected),'Finale omitted professional inheritance');
    }
    const before=primaryWrites;t.finish(live);
    assert.equal(primaryWrites-before,1,'Verdict did not use exactly one campaign write');
    assert.equal(window.IGR_HERITAGE.get('maitre').completed.length,chapter,'Lost chapter');
  }
  const saved=window.IGR_HERITAGE.get('maitre');
  assert.equal(saved.status,'completed');
  assert.equal(saved.maitre.canon.variant,variant);
  assert.equal(Object.keys(saved.maitre.decisions).length,5);
  assert.equal(saved.maitre.traces.filter(x=>x.category==='angle').length,5,'Missing campaign strategy trace');
  assert.equal(saved.maitre.traces.filter(x=>x.category==='conclusion').length,5,'Missing five judicial conclusions');
  const snapshot=JSON.stringify(saved);
  t.startSession(1,Array.from({length:n},(_,i)=>'Nouvelle '+i));
  assert.equal(t.readLive().practice,true);
  ballot(Array(n).fill('active_link'));
  t.finish(t.readLive());
  assert.equal(JSON.stringify(window.IGR_HERITAGE.get('maitre')),snapshot,'Replay rewrote canonical history');
  runs++;
}
// A split ballot is never a final court decision.
map.clear();window.IGR_HERITAGE.begin('maitre');
for(const n of [5,6,7]){
  const names=Array.from({length:n},(_,i)=>'J'+i);
  if(n!==5){map.clear();window.IGR_HERITAGE.begin('maitre')}
  t.startSession(1,names);
  ballot(n===5?['fiscal_only','fiscal_only','blindness','blindness','active_link']:n===6?['fiscal_only','fiscal_only','blindness','blindness','active_link','active_link']:['fiscal_only','fiscal_only','fiscal_only','blindness','blindness','active_link','active_link']);
  assert.equal(t.readLive().ballot.round,2);
  assert.equal(t.readLive().stage,'decision');
  ballot(Array(n).fill('fiscal_only'));
  assert.equal(t.readLive().stage,'result');
}
// II: cannot force the Client to cooperate; V: cannot force lawyer's career.
for(const chapter of [2,5]){
  map.clear();window.IGR_HERITAGE.begin('maitre');
  const st=JSON.parse(map.get('igr_heritage_v1'));
  st.maitre.currentChapter=chapter;st.maitre.completed=Array.from({length:chapter-1},(_,i)=>i+1);
  map.set('igr_heritage_v1',JSON.stringify(st));
  t.startSession(chapter,['A','B','C','D','E']);
  const players=t.readLive().players,owner=chapter===2?'client':'avocat';
  const opts=t.PACK.chapters[chapter].outcomes;
  const forced=players.map(p=>p.roleId===owner?opts[1].id:opts[0].id);
  ballot(forced);
  assert.equal(t.readLive().stage,'decision','Owner was overruled by majority');
  assert.equal(t.readLive().ballot.round,2);
  ballot(Array(5).fill(opts[0].id));
  assert.equal(t.readLive().stage,'result','Consent did not allow the verdict');
}
// III: active joint defence requires assent of both accused.
map.clear();window.IGR_HERITAGE.begin('maitre');
{
  const st=JSON.parse(map.get('igr_heritage_v1'));
  st.maitre.currentChapter=3;st.maitre.completed=[1,2];st.maitre.maitre.relationships.associe='aligned';
  map.set('igr_heritage_v1',JSON.stringify(st));
  t.startSession(3,['A','B','C','D','E']);
  ballot(t.readLive().players.map(p=>p.roleId==='associe'?'separate':'common'));
  assert.equal(t.readLive().stage,'decision','Joint defence forced without both clients');
  assert.equal(t.readLive().ballot.round,2);
  ballot(Array(5).fill('common'));
  assert.equal(t.readLive().stage,'result');
}
map.clear();window.IGR_HERITAGE.begin('maitre');
{
  const st=JSON.parse(map.get('igr_heritage_v1'));
  st.maitre.currentChapter=3;st.maitre.completed=[1,2];st.maitre.maitre.relationships.associe='broken';
  map.set('igr_heritage_v1',JSON.stringify(st));
  t.startSession(3,['A','B','C','D','E']);
  let live=t.readLive();live.stage='decision';live.ballot={round:1,index:0,votes:[],show:true};t.saveLive(live);
  t.renderDecision(live);
  assert.match(app.innerHTML,/CONFLIT D’INTÉRÊTS/);
  t.chooseOutcome('common');
  assert.equal(t.readLive().ballot.votes.length,0,'Broken common defence accepted');
}
// A failed canonical write does not discard the pending result.
map.clear();window.IGR_HERITAGE.begin('maitre');
t.startSession(1,['A','B','C','D','E']);
{
  const live=t.readLive();live.angle='Il faut distinguer la preuve de la proximité.';t.saveLive(live);
}
ballot(Array(5).fill('fiscal_only'));
quota=true;t.finish(t.readLive());quota=false;
assert.equal(window.IGR_HERITAGE.get('maitre').completed.length,0,'Quota failure falsely marked complete');
assert.equal(t.readLive().stage,'result','Quota failure discarded verdict');
t.finish(t.readLive());
assert.equal(window.IGR_HERITAGE.get('maitre').completed.length,1,'Retry after quota failure did not complete');
console.log('MAÎTRE v716 OK: '+runs+' complete campaigns, 45 dossiers, 135 cycles, private majorities, consent, ethical conflicts, replay, 3 canon variants and persistence retry');
