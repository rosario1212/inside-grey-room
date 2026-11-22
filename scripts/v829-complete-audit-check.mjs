import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=f=>readFileSync(f,'utf8');
const app=read('app-v11.js'),ui=read('gameplay-integrity-v829.js');
const sql=read('supabase/migrations/20261122153500_v829_presence_verified_recovery.sql');
const index=read('index.html'),sw=read('service-worker.js');
for(const file of ['app-v11.js','gameplay-integrity-v829.js']){
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
for(const marker of ["document.visibilityState==='hidden'||navigator.onLine===false",
 "STATE._lastWatcherAttempt=now","<strong>\${count} inscrit",
 "1 · Vérifier les faits · 4 questions","2 · Ton appréciation · 3 repères",
 "STATE._caseQuizData={enabled:false,error:true}",
 "hideIntroImmediately();"]){
 assert(app.includes(marker.replace('\\','')),'missing app correction '+marker);
}
for(const marker of ['igr_v829_player_presence','igr_v829_presence_status',
 'player still active recently','135 seconds','180 seconds']){
 assert(sql.includes(marker),'missing DB guard '+marker);
}
for(const file of ['gameplay-integrity-v829.js','gameplay-integrity-v829.css']){
 assert(index.includes(file+'?v=20261122-audit-v829'),'HTML missing '+file);
 assert(sw.includes('/'+file+'?v=20261122-audit-v829'),'PWA missing '+file);
 assert(read('scripts/build-web.mjs').includes("'"+file+"'"),'web build missing '+file);
 assert(read('scripts/build-mobile.mjs').includes("'"+file+"'"),'native build missing '+file);
}
assert(sw.includes("igr-v833-four-device-launch-20261122"));
const a=app.indexOf('async function lockFinal(){'),b=app.indexOf('function responsibilityLabel(',a);
assert(a>0&&b>a,'source final payload');
const body=app.slice(a,b);
async function voter(role,values){
 const writes=[],errors=[];
 const scope={STATE:{room:'ABCDE',token:'token-'+role,sync:{room:{scenario_id:'001'},player:{public_role:role}}},
  byId:id=>({value:values[id]||''}),collectLevels:()=>({s1:2,s2:0}),
  rpc:async(name,args)=>{writes.push({name,args});return {ok:true}},syncNow:async()=>{},
  toast:t=>errors.push(t),console:{error(){}}
 };
 await new Function('scope','with(scope){'+body+'return lockFinal();}')(scope);
 return {writes,errors};
}
const answers={igr001Moment:'second',igr001Gesture:'s2_intentional',
 igr001Reframe:'recording',igr001Intent:'voluntary_act'};
for(const role of ['enqueteur','analyste']){
 const r=await voter(role,answers);
 assert.equal(r.writes.length,1,'One valid individual final vote');
 assert.equal(r.writes[0].name,'igr_v4_lock_final');
 assert.equal(r.writes[0].args.p_payload.reconstruction_001.intent,'voluntary_act');
 assert.deepEqual(Object.keys(r.writes[0].args.p_payload.levels).sort(),['s1','s2']);
}
const denied=await voter('analyste',{...answers,igr001Intent:''});
assert.equal(denied.writes.length,0,'Incomplete reconstruction must not be submitted');
async function presenceTest(peer){
 const button={dataset:{igr59RecoveryAt:'1'},disabled:false,setAttribute(){}};
 let notice=null;
 const card={querySelector:q=>q.startsWith('button[')?button:q==='#igr829-recovery-check'?notice:null,
  appendChild:x=>{notice=x}};
 const sel={value:'target',closest:()=>card},state={room:'ABCDE',token:'my-token',view:'game'};
 const document={readyState:'loading',visibilityState:'visible',addEventListener(){},
  getElementById:id=>id==='igr59Absent'?sel:null,querySelector:()=>null,
  createElement:()=>({id:'',className:'',textContent:''})};
 const window={STATE:state,IGR_LOCALE:'fr',addEventListener(){},setInterval(){},
  rpc:async()=>({ok:true,room_code:'ABCDE',peers:[{id:'target',...peer}]})};
 const scope={window,document,STATE:state,Date,navigator:{onLine:true},
  requestAnimationFrame:fn=>fn(),console:{warn(){}}};
 vm.runInNewContext(ui,scope);
 await window.IGR_AUDIT_V829.ping(true);
 return {button,notice};
}
const online=await presenceTest({active:true,eligible_to_recover:false,known:true});
const offline=await presenceTest({active:false,eligible_to_recover:true,known:true});
assert.equal(online.button.disabled,true,'Host cannot mark recently active player absent');
assert.equal(offline.button.disabled,false,'Only server eligible stale peer can be marked absent');
assert(online.notice.textContent.includes('actif récemment'));
console.log('PASS v829: two canonical voters, missing intent, quiz hierarchy, presence and absence recovery.');
