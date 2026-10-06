import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const root=process.cwd(),read=f=>readFile(root+'/'+f,'utf8'),target=process.argv[2]||'dist';
const mem=new Map(),app={innerHTML:''};
const document={readyState:'loading',addEventListener(){},querySelector(){return null},querySelectorAll(){return []},getElementById(id){return id==='app'?app:null}};
const c=vm.createContext({document,localStorage:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)},crypto:webcrypto,console,setTimeout(){},setInterval(){},queueMicrotask(){},requestAnimationFrame(){},MutationObserver:class{observe(){}},confirm:()=>true,navigator:{},location:{},scrollTo(){},addEventListener(){}});c.window=c;
async function load(f,hook){let s=await read(f);if(hook){const i=s.lastIndexOf('})();')>=0?s.lastIndexOf('})();'):s.lastIndexOf('})()');s=s.slice(0,i)+hook+'\n'+s.slice(i)}vm.runInContext(s,c,{filename:f})}
await load('heritage-v13-5.js');
await load('heritage-play-v13-7.js','window.testGeneric={PACKS,ROLES,startSession,readLive,chooseOption,applyResult,renderPlay};');
await load('heritage-maitre-data-v34.js');
await load('heritage-maitre-v34.js','boot();window.testMaitre={startSession,readLive,completeChapter,secretFor};');
await load('heritage-context-v57.js');
for(const id of ['cendres','kuroi']){
 c.IGR_HERITAGE.begin(id);
 for(let n=1;n<=5;n++){
  const pack=c.testGeneric.PACKS[id].chapters[n];assert.equal(pack.phases.length,4);assert.equal(pack.options.length,3);
  for(const role of c.testGeneric.ROLES[id])assert.ok(pack.secrets[role.id]?.[0],`${id} ${n} ${role.id}: missing clue`);
  for(let count=5;count<=7;count++){
   c.testGeneric.startSession(id,n,Array.from({length:count},(_,i)=>'J'+i));const live=c.testGeneric.readLive();const ids=live.players.map(p=>p.roleId);assert.equal(new Set(ids).size,count);
   if(id==='kuroi')for(const required of ['waka_k','waka_a','commissaire','inspecteur'])assert.ok(ids.includes(required));
  }
  c.testGeneric.chooseOption(pack.options[0].id);const live=c.testGeneric.readLive();c.testGeneric.applyResult(live,false);assert.ok(c.IGR_HERITAGE.get(id).completed.includes(n));
  const before=JSON.stringify(c.IGR_HERITAGE.get(id));c.IGR_HERITAGE.completeChapter(id,n,{crisisDelta:4,flags:{invalid_replay:true}});assert.equal(JSON.stringify(c.IGR_HERITAGE.get(id)),before,'archived generic conclusion changed');
 }
 assert.equal(c.IGR_HERITAGE.get(id).status,'completed');if(id==='kuroi')for(const event of c.IGR_HERITAGE.get(id).kuroi.chronicle.filter(e=>e.label.startsWith('Dossier ')))assert.ok(event.label.startsWith('Dossier 0'+event.chapter));
}
for(let n=1;n<=5;n++){
 for(let count=5;count<=7;count++)for(let i=0;i<12;i++){
  c.testMaitre.startSession(n,Array.from({length:count},(_,i)=>'J'+i));const live=c.testMaitre.readLive(),ids=live.players.map(p=>p.roleId);assert.equal(ids[0],'avocat');for(const required of ['client','enqueteur','juge'])assert.ok(ids.includes(required),`MAITRE ${n}/${count}: ${required}`);if(n===3)assert.ok(ids.includes('associe'));assert.equal(new Set(ids).size,count);
 }
 for(const role of c.IGR_HERITAGE_MAITRE_DATA.ROLES)for(const variant of ['fiscal','blind','link']){const sec=c.testMaitre.secretFor(n,role.id,variant,{maitre:{relationships:{associe:'broken'}}});assert.ok(sec[0]);assert.ok(sec[1])}
 const option=c.IGR_HERITAGE_MAITRE_DATA.PACK.chapters[n].outcomes[0];assert.equal(c.testMaitre.completeChapter(n,option.id).ok,true);const before=JSON.stringify(c.IGR_HERITAGE.get('maitre'));c.testMaitre.completeChapter(n,c.IGR_HERITAGE_MAITRE_DATA.PACK.chapters[n].outcomes[1].id);assert.equal(JSON.stringify(c.IGR_HERITAGE.get('maitre')),before,'archived MAITRE conclusion changed');
}
assert.equal(c.IGR_HERITAGE.get('maitre').status,'completed');
const snap=c.IGR_HERITAGE_CONTEXT_V57.snapshot('maitre');assert.ok(!JSON.stringify(snap).includes('canon'));assert.ok(!('variant' in snap.maitre));
await load('heritage-maitre-online-v34-4.js','window.testOnline={secret};');
const online=c.testOnline.secret(3,'client',null,{maitre:{relationships:{associe:'broken'}}});assert.ok(online[0].includes('CONFIANCE ROMPUE'));assert.notEqual(c.testOnline.secret(1,'client','fiscal',null)[0],c.testOnline.secret(3,'client',null,null)[0]);
for(const file of ['heritage-v13-5.js','heritage-play-v13-7.js'])assert.ok(!/Vesper|Arken|VESPER|ARKEN/.test(await read(file)),file+' invented country remains');
const onlineSource=await read('heritage-maitre-online-v34-4.js');assert.ok(onlineSource.includes("rpcx('igr_heritage_online_decide_v55'"));assert.ok(!onlineSource.includes("rpcx('igr_heritage_online_decide',"));
for(const page of ['index.html','en.html']){const html=await readFile(root+'/'+target+'/'+page,'utf8');assert.ok(html.includes('heritage-context-v57.js?v=v57-heritage-integrity'));assert.ok(html.includes('heritage-integrity-v57.css?v=v57-heritage-integrity'));for(const file of ['heritage-play-v13-7.js','heritage-maitre-v34.js','heritage-maitre-online-v34-4.js'])assert.ok(html.includes(file+'?v=v57-heritage-integrity'))}
console.log('HÉRITAGE v57: 15 dossiers, roles for 5/6/7 players, immutable conclusions, chapter-specific secrets, shared context and both pages OK');
