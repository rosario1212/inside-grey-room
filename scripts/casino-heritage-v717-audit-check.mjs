import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {randomUUID} from 'node:crypto';
import {fixtureRelease} from './casino-fixtures.mjs';
import {startRuntime,viewRuntime,validateRelease} from '../casino/runtime.mjs';
import {shuffledDeck} from '../casino/games.mjs';

const hubSource=readFileSync('heritage-casino-v91.js','utf8');
const client=readFileSync('casino-client-v105.js','utf8');
const runtime=readFileSync('casino/runtime.mjs','utf8');
const service=readFileSync('casino/service.mjs','utf8');
const pack=fixtureRelease();
assert.equal(validateRelease(pack.content),true);
assert.match(hubSource,/CAMPAGNE IV \/ IV/);
assert.match(hubSource,/data\.heritageSequence='4'/);
assert.match(hubSource,/aucun progrès dans les campagnes précédentes n’est exigé/);
assert.match(client,/DOSSIER '\+state\.chapter\+'\/3 · PHASE/);
assert.match(client,/Aucune audience n’a été enregistrée/);
assert.match(client,/Condamné/);
assert.match(service,/persist\(room,body\.requestId,member\.id,fp,command,state\)/);
assert.match(runtime,/privateCanon:pack/);
assert.doesNotMatch(client,/privateCanon|answerKey|undercoverIds/, 'Secret server fields must not appear in public runtime');

let mutations=0;
const hub={children:[],querySelector(selector){
  if(selector==='[data-casino-nav="campaign"]')return this.children.find(c=>c.dataset.casinoNav==='campaign')||null;
  if(selector==='[data-maitre-open="campaign"]')return this.children.find(c=>c.dataset.maitreOpen==='campaign')||null;
  return null;
}};
function insert(card,index){
  if(card.parent){card.parent.children.splice(card.parent.children.indexOf(card),1)}
  card.parent=hub;hub.children.splice(index,0,card);mutations++;
}
hub.appendChild=card=>insert(card,hub.children.length);
const node=(key,value)=>({
  dataset:{[key]:value},parent:null,setAttribute(){},
  insertAdjacentElement(where,card){
    assert.equal(where,'afterend');
    insert(card,hub.children.indexOf(this)+1);
  },
  get nextElementSibling(){return hub.children[hub.children.indexOf(this)+1]||null}
});
const cendres=node('other','cendres'),kuroi=node('other','kuroi');
hub.appendChild(cendres);hub.appendChild(kuroi);
const start=hubSource.indexOf('function patchHub(){');
const end=hubSource.indexOf('// The standard Join button',start);
assert.ok(start>0&&end>start,'Casino hub injector missing');
const ctx={
 document:{createElement:()=>node('other','new')},
 $:()=>hub,
 artwork:()=>'<poster>',
 hub
};
runInNewContext(hubSource.slice(start,end)+'\nthis.patchHub=patchHub;',ctx);
ctx.patchHub();
assert.deepEqual(hub.children.map(c=>c.dataset.casinoNav||c.dataset.maitreOpen||c.dataset.other),['cendres','kuroi','campaign']);
const maitre=node('maitreOpen','campaign');
hub.appendChild(maitre);ctx.patchHub();
assert.deepEqual(hub.children.map(c=>c.dataset.casinoNav?'casino':c.dataset.maitreOpen?'maitre':c.dataset.other),['cendres','kuroi','maitre','casino']);
const count=mutations;
ctx.patchHub();ctx.patchHub();
assert.equal(mutations,count,'CASINO MutationObserver must not reorder or duplicate a stable hub');
assert.equal(hub.children.filter(c=>c.dataset.casinoNav==='campaign').length,1);

for(let n=4;n<=7;n++){
 for(const optional of [[],['judge'],['prosecutor'],['judge','prosecutor']]){
  const members=[
   ...Array.from({length:n},(_,i)=>({id:'p'+i,name:'Personne '+i,role:'casino',ready:true})),
   ...['agent','investigator','analyst',...optional].map(role=>({id:role,name:role,role,ready:true}))
  ];
  assert.ok(members.length>=7&&members.length<=12);
  const state=startRuntime({id:randomUUID(),hostId:'p0',members},pack,{
   undercoverIds:n===4?['p1']:['p1','p2'],now:0,deck:shuffledDeck(max=>max-1)
  });
  assert.equal(state.chapter,1);
  assert.equal(state.phase,1);
  assert.equal(state.privateCanon.phases.length,8);
  assert.equal(state.players.length,n);
  for(const m of members){
    const view=viewRuntime(state,m.id);
    const raw=JSON.stringify(view);
    for(const key of ['privateCanon','answerKey','undercoverIds','tokenHash','releaseId','eventLog'])
      assert.ok(!raw.includes('"'+key+'"'), 'Secret '+key+' exposed to '+m.role);
    assert.equal(view.poker.ownCards.length,m.role==='casino'?5:0);
  }
 }
}
const base=readFileSync('casino/runtime.mjs','utf8');
assert.match(base,/case 'FINISH_CAMPAIGN':/);
assert.match(base,/check\(!s\.hearings\.some\(h=>h\.defence===null\),'pending_defence'\)/);
assert.match(base,/const contenders=s\.claims\.filter/);
console.log('CASINO v717 audit OK: fourth stable Heritage card, no duplicate observer work, 16 seven-to-twelve-seat casts, private projections, explicit phase and judicial outcome UI');
