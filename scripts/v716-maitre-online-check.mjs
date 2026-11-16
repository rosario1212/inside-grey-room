import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const online=readFileSync('heritage-maitre-online-v34-4.js','utf8');
const local=readFileSync('heritage-maitre-v34.js','utf8');
const audit=readFileSync('heritage-audit-v55.js','utf8');
const sql=readFileSync('supabase/migrations/20261116020000_heritage_maitre_majority_consent_v716.sql','utf8');
for(const term of [
 'igr_heritage_online_vote_maitre',
 'igr_heritage_online_maitre_ballot_status',
 'persistConfirmed',
 'finishOnline',
 "d.room.ballot_status",
 "lastStage",
 "suspended"
])assert.ok(online.includes(term),'Missing online majority/recovery contract: '+term);
assert.ok(!online.includes('igr_heritage_online_decide_v71'),'Legacy role-only RPC is still called');
assert.ok(!audit.includes('data-h55-decide'),'Old overlay could steal votes');
assert.ok(!audit.includes("if(options)$('button',options).forEach"),'Single-node .forEach bug reintroduced');
assert.ok(local.includes('function maitrePublicExhibit')&&local.includes('function consentToMaitreVerdict'));
assert.ok(sql.includes('revoke all on function public.igr_heritage_online_decide_v71'));
assert.ok(sql.includes("v_room.campaign_id in ('cendres','kuroi','maitre')"));
assert.ok(sql.includes("v_room.chapter=3 and v_option='common'"));
assert.ok(!sql.includes('// Security:'),'SQL syntax error in migration');
const i=online.indexOf('function persistConfirmed(d){');
const j=online.indexOf('function renderFinished(d){',i);
const k=online.indexOf('async function finishOnline(){');
const z=online.indexOf('async function click(n){',k);
assert.ok(i>=0&&j>i&&k>i&&z>k);
const code=online.slice(i,j)+'\n'+online.slice(k,z)+'\nthis.persistConfirmed=persistConfirmed;this.finishOnline=finishOnline;';
const confirmed={room:{campaign_id:'maitre',chapter:1,decision_id:'fiscal_only',stage:'finished',maitre_angle:'La preuve du trafic ne peut être inférée de la simple proximité.',maitre_demonstration:'Comparer les flux.'}};
const calls=[],notices=[],known={completed:[]},current={campaign:'maitre',chapter:1,practice:false,code:'MR716',token:'player',hostToken:'host'};
let failures=0,failSave=false;
const window={IGR_HERITAGE:{
  get:()=>known,
  completeChapter:(id,n,payload)=>{calls.push({name:'save',payload});if(failSave)return {ok:false};known.completed.push(n);return {ok:true}}
},IGR_HERITAGE_MAITRE:{open:()=>calls.push({name:'open'})}};
const ctx={window,sess:()=>current,pc:n=>({outcomes:[{id:'fiscal_only'}]}),rpcx:async(name)=>{calls.push({name});if(name==='igr_heritage_online_sync')return confirmed;return {ok:true}},clear:()=>calls.push({name:'clear'}),toastx:x=>notices.push(x),console:{warn(){}},finishPending:false};
runInNewContext(code,ctx);
assert.equal(ctx.persistConfirmed({room:{...confirmed.room,stage:'decision'}}),false,'Accepted unverified verdict');
assert.equal(calls.length,0);
failSave=true;
await ctx.finishOnline();
assert.deepEqual(calls.map(x=>x.name),['igr_heritage_online_finish','igr_heritage_online_sync','save'],'Incorrect server-first ordering');
assert.equal(known.completed.length,0,'Failed write advanced campaign');
assert.equal(calls.some(x=>x.name==='clear'),false,'Failed host save destroyed credentials');
assert.equal(notices.length,1,'Missing feedback for storage retry');
assert.equal(ctx.finishPending,false);
calls.length=0;failSave=false;
await ctx.finishOnline();
assert.deepEqual(calls.map(x=>x.name),['igr_heritage_online_finish','igr_heritage_online_sync','save','clear','open'],'Recovery did not complete');
assert.equal(known.completed.length,1);
calls.length=0;
assert.equal(ctx.persistConfirmed(confirmed),true,'Duplicate confirmation should be idempotent');
assert.equal(calls.length,0);
const testCode=online.slice(online.indexOf('function decision(d){'),online.indexOf('function result(d){'));
assert.ok(testCode.includes("data-mnet=\"decide\""),'Voting buttons not actionable');
assert.ok(testCode.includes('ballot_status'),'Online vote count missing');
console.log('MAÎTRE v716 online OK: server-first finish, no premature progress, retry without lost credentials, idempotent result, secure majority and consistent voting UI');
