import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const app=await readFile('app-v11.js','utf8');
const addon=await readFile('cartel029-v121.js','utf8');
const rolesSql=await readFile('supabase/migrations/20261022050317_cartel_lawyer_029_031.sql','utf8');
function part(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a);
 assert(a>=0&&b>a,'Expected shipped source segment: '+start);
 return source.slice(a,b);
}
const roleSource=part(app,'function lobbyRoleSlots(','const ROLE_INFO =');
const lobbySource=part(app,'function renderLobby(prefetched=null){','async function chooseLobbyRole(');
const roster=['enqueteur','analyste','suspect','suspect','suspect','suspect','maitre','procureur','juge','journaliste','don','bras_droit'];
const names={enqueteur:'Enquêteur',analyste:'Analyste',suspect:'Témoin',maitre:'Avocat',procureur:'Procureur',juge:'Juge',journaliste:'Journaliste',don:'Le Don',bras_droit:'Bras droit'};
const scene={id:'029',min:6,max:12,title:'LE CYCLE MORT'};
const root={innerHTML:''};
const scope={
 STATE:{sync:null,hostToken:'host'},
 SCENARIO_ROLES:{'001':{required:['Enquêteur','3 suspects'],optional:['Analyste']}},
 expandRoleLabel:x=>x==='Enquêteur'?['enqueteur']:x==='Analyste'?['analyste']:x==='3 suspects'?['suspect','suspect','suspect']:[x],
 roleInfo:id=>({label:names[id]||id,body:'Présentation publique sans spoiler.'}),
 scenario:id=>id==='029'?scene:{id,min:4,max:5,title:'LA CHAMBRE 222'},
 publicScenarioSummary:()=> 'Résumé public de test.',
 avatarHtml:()=>'<span class="avatar-small"></span>',
 publicRoleLabel:id=>names[id]||id,
 lobbyThemeForScenario:id=>id==='029'?'cartel':'base',
 shell:html=>html,byId:()=>root,
 h:value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[ch])),
 SOUND:{enabled:false},ensureAmbient:()=>{},
};
vm.createContext(scope);
vm.runInContext(roleSource+'\n'+lobbySource,scope);
assert(!addon.includes("wrap('lobbyRoleSlots'"),'A later override must not shrink the 029 roster to the current attendance');
assert.match(rolesSql,/when 'suspect' then return 4/);
for(const [role,minimum] of [['maitre',7],['procureur',8],['juge',9],['journaliste',10],['don',11],['bras_droit',12]]){
 assert(rolesSql.includes("when '"+role+"' then return case when p_count>="+minimum+" then 1"),'Server threshold mismatch: '+role);
}
let testCount=0;
const expectEqual=(a,b,context)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),context);
function session(count,index,allSelected=false){
 const players=Array.from({length:count},(_,i)=>({id:'player-'+i,pseudo:'Participant '+i,
   seat_index:i,preferred_role:allSelected?roster[i]:null}));
 const snapshot={room:{code:'QA029',scenario_id:'029',status:'lobby',min_players:6,max_players:12,state:{}},
   players,player:{id:players[index].id,preferred_role:players[index].preferred_role}};
 scope.STATE.sync=snapshot;scope.STATE.hostToken=index===0?'host':null;
 return snapshot;
}
for(let count=1;count<=12;count++){
 session(count,0);
 const actual=scope.lobbyRoleSlots(scene,count);
 const expected=roster.slice(0,Math.max(6,count));
 expectEqual(actual,expected,'The 029 public roster must be ready before enough people join: '+count);
 const summary=scope.roleChoiceSummary(scene,count,scope.STATE.sync.players);
 const capacities=Object.fromEntries(summary.map(s=>[s.id,s.cap]));
 const expectedCapacity=Object.fromEntries([...new Set(expected)].map(r=>[r,expected.filter(x=>x===r).length]));
 expectEqual(capacities,expectedCapacity,'Available types and capacities must match the server: '+count);
 scope.renderLobby();
 assert(root.innerHTML.includes('data-role-id="enqueteur"'));
 assert(root.innerHTML.includes('data-role-id="analyste"'));
 assert(root.innerHTML.includes('data-role-id="suspect"'));
 assert(root.innerHTML.includes('0/4'),'All four witness slots must be shown before launch');
 assert(root.innerHTML.includes('Minimum 6 · Maximum 12'));
 for(const role of ['maitre','procureur','juge','journaliste','don','bras_droit']){
  assert.equal(root.innerHTML.includes('data-role-id="'+role+'"'),count>=roster.indexOf(role)+1,
   'Optional role must unlock at the exact supported party size: '+role+' count '+count);
 }
 testCount++;
}
// Independent participant screens must see the same capacities and the correct
// personal preference, including every optional-role configuration 6..12.
for(let count=6;count<=12;count++){
 for(let i=0;i<count;i++){
  const snapshot=session(count,i,true);
  const summary=scope.roleChoiceSummary(scene,count,snapshot.players);
  const expected=roster.slice(0,count);
  assert(summary.every(s=>s.taken===s.cap),'An assigned role must occupy its capacity exactly once');
  scope.renderLobby();
  const role=roster[i];
  assert(root.innerHTML.includes('data-role-id="'+role+'"'),'Own role missing on participant '+i);
  const selected=new RegExp('class="role-choice-card selected[^"]*" data-role-id="'+role+'"');
  assert.match(root.innerHTML,selected,'The selected role must remain available to its owner');
  if(i!==0)assert(root.innerHTML.includes('En attente de l’hôte'));
  testCount++;
 }
}
// Another scenario must retain its original role composition.
scope.STATE.sync={room:{min_players:4,max_players:5,scenario_id:'001'}};
expectEqual(scope.lobbyRoleSlots({id:'001'},4),['enqueteur','suspect','suspect','suspect']);
testCount++;
console.log('CARTEL 029 multiplayer lobby PASS: '+testCount+' independent role-rendering checks; all 6–12 player configurations, 4 witness slots, and no impact on another dossier.');
