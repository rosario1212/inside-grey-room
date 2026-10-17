import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=process.cwd(),target=path.resolve(process.argv[2]||'dist');
const read=path=>readFile(path,'utf8');
const runtime=await read(path.join(target,'dossier-reliability-v84.js'));
const guard=await read(path.join(target,'cell-controls-stability-v23.js'));
const live=await read(path.join(target,'live-cell-v12-44.js'));
const index=await read(path.join(target,'index.html'));
const css=await read(path.join(target,'dossier-reliability-v84.css'));
const sw=await read(path.join(target,'service-worker.js'));
assert.match(index,/dossier-reliability-v84\.js\?v=v84-multiplayer-dossier/);
assert.match(index,/dossier-reliability-v84\.css\?v=v84-multiplayer-dossier/);
assert.match(index,/cell-controls-stability-v23\.js\?v=v84-multiplayer-dossier/);
assert(index.lastIndexOf('dossier-reliability-v84.js')>index.lastIndexOf('authoritative-runtime-v41.js'),'The canonical card parser must be loaded last');
assert.match(sw,/const CACHE='igr-v84-multiplayer-dossier'/);
for(const name of ['dossier-reliability-v84.js','dossier-reliability-v84.css','cell-controls-stability-v23.js','live-cell-v12-44.js']){
  assert(sw.includes('/'+name+'?v=v84-multiplayer-dossier'),name+' must be precached');
}
assert(css.includes('safe-area-inset-top')&&css.includes('igr84-relation-card'),'Mobile safe areas and relation cards must be styled');
assert(live.includes('syncSoon(16,true,realtimeRevision(record))'),'Server revision must request an authoritative read');
assert(live.includes('return room?.status===\'finished\' ? 3500 : 1600'),'Live socket watchdog must repair missed notifications');

const sandbox={
  window:{IGR_LOCALE:'fr'},
  document:{getElementById(){return null}},
  requestAnimationFrame(){},
  console,
  addEventListener(){}
};
vm.runInNewContext(runtime,sandbox);
const api=sandbox.window.IGR_DOSSIER_RELIABILITY_V84;
assert(api&&api.version==='v84-dossier-reliability');
const example='Ton point de départ — Tu ne le connais pas.\n\nÀ mettre sur la table — À quelle heure es-tu parti ?';
const parts=api.splitNarrative(example);
assert.equal(parts.fact,'Tu ne le connais pas.');
assert.equal(parts.question,'À quelle heure es-tu parti ?');
assert(!JSON.stringify(parts).includes('Ton point de départ'));
assert(!JSON.stringify(parts).includes('À mettre sur la table'));
assert.equal(api.linkFromFact(parts.fact),'Vous ne vous connaissez pas.');
assert.equal(api.linkFromFact('Vous travaillez dans la même structure.'),'Même structure : vous avez pu vous croiser.');
assert.equal(api.linkFromFact('Elle est ta sœur.'),'C’est ta sœur.');
assert.match(api.linkFromFact('Une dispute a eu lieu avant ton arrivée.'),/Lien personnel non établi/);
assert.equal(api.readablePhase('investigation_assembly'),'ASSEMBLÉE DU CAMP ENQUÊTE');
sandbox.window.IGR_LOCALE='en';
assert.equal(api.readablePhase('investigation_assembly'),'INVESTIGATION ASSEMBLY');

const start=guard.indexOf('  let installed=false;'),end=guard.indexOf('  /* The legacy launcher',start);
assert(start>=0&&end>start,'Guard regression fixture missing');
let counter=0,now=0;
const data={sync:{revision:0}};
const guardScope={
  STATE:data,performance:{now:()=>now},
  inRoom:()=>true,syncGameUiState(){},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},console,
  syncNow:async(force,fresh)=>{counter++;data.sync={revision:counter};return data.sync;}
};
vm.runInNewContext(guard.slice(start,end),guardScope);
await guardScope.syncNow(false,true);
now=100;
await guardScope.syncNow(false,true);
assert.equal(counter,2,'Fresh realtime reads must bypass the one-second throttle');
now=200;
await guardScope.syncNow(false);
assert.equal(counter,2,'Passive unchanged polling remains throttled');

let release,reads=0;
const gate=new Promise(resolve=>{release=resolve});
const queuedScope={
  STATE:{sync:{revision:0}},performance:{now:()=>500},
  inRoom:()=>true,syncGameUiState(){},setInterval(){return 1},clearInterval(){},setTimeout(){return 1},console,
  syncNow:async()=>{reads++;if(reads===1)await gate;queuedScope.STATE.sync={revision:reads};return queuedScope.STATE.sync;}
};
vm.runInNewContext(guard.slice(start,end),queuedScope);
const first=queuedScope.syncNow(false,true);
await Promise.resolve();
const second=queuedScope.syncNow(false,true);
release();
await Promise.all([first,second]);
assert.equal(reads,2,'A realtime invalidation during an in-flight read must cause a trailing read');
console.log('IGR v84: PWA assets, role copy, phase names and multiplayer throttle/coalescing tests passed');
