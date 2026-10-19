// LIVE browser integration test of the deployed private beta with real Supabase RPC.
// Eleven independent browser profiles, disposable QA room, no real user accounts.
// This is NOT a substitute for humans playing on physical devices.
// Never print room tokens, private cards, reporter text or plot secrets.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {chromium} from 'playwright';
const base=process.env.IGR_LIVE_BASE||'https://inside-grey-room-last.alial-khafaji2002.workers.dev';
const count=Number(process.env.IGR_LIVE_SEATS||11);
assert(count>=6&&count<=11);
const expectedRoles=['enqueteur','analyste','suspect','suspect','suspect','suspect',
 'procureur','juge','journaliste','don','bras_droit'].slice(0,count);
const qaTag='QA29'+randomBytes(3).toString('hex').toUpperCase();
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(){return 'Q'+[...randomBytes(4)].map(b=>alphabet[b%alphabet.length]).join('')}
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const contexts=[],players=[],stages=[],failures=[];
let started=false,roomCode;
function cleanError(e){return String(e?.message||e).replace(/[A-Z2-9]{5}/g,'[code]').slice(0,280)}
async function exec(i,func,arg){
 return players[i].page.evaluate(({func,arg})=>{return (async()=>{
   if(func==='rpc')return rpc(arg.name,arg.payload);
   if(func==='setup'){
     Object.assign(STATE,{room:arg.out.room_code,token:arg.out.player_token,
       hostToken:arg.host?arg.out.host_token:null,playerId:arg.out.player_id,
       playerPseudo:arg.pseudo,scenarioId:'029',selectedScenario:'029',
       view:'lobby',tab:'card',sync:null,syncSig:''});
     SOUND.enabled=false;
     saveSession();
     const d=await syncNow(true);
     if(d?.room?.status==='lobby')renderLobby(d);
     startRoomWatcher();
     return {status:d?.room?.status,lobbyRoles:document.querySelectorAll('[data-role-id]').length};
   }
   if(func==='state'){
     const d=await syncNow(true);
     return {phase:d.room.phase,cycle:d.room.cycle,status:d.room.status,
       state:d.room.state,role:d.player.public_role,
       playerId:d.player.id,witnessIndex:d.player.private_state?.['029_witness_index'],
       myActions:(d.my_actions||[]).map(a=>({action_type:a.action_type,cycle:a.cycle})),
       eventCount:(d.events||[]).length,privateEvents:(d.events||[]).filter(e=>e.visibility==='private').map(e=>e.id),
       roles:(d.players||[]).map(p=>p.public_role),
       visibleRoleButtons:document.querySelectorAll('[data-role-id]').length,
       screenPhase:document.querySelector('.game-v11')?.textContent?.slice(0,100)||document.querySelector('#app')?.textContent?.slice(0,140)};
   }
   if(func==='startwatch')return startRoomWatcher();
   throw Error('invalid task');
 })()}, {func,arg});
}
async function rpc(i,name,payload){
 return exec(i,'rpc',{name,payload});
}
async function state(i=0){return exec(i,'state')}
async function hostAdvance(){return rpc(0,'igr_v4_advance_phase',{p_code:roomCode,p_host_token:players[0].out.host_token})}
async function actor(role){const i=players.findIndex(p=>p.role===role);assert(i>=0,'Absent role '+role);return i}
async function action(i,name,values){return rpc(i,name,{p_code:roomCode,p_player_token:players[i].out.player_token,...values})}
async function record(label){const x=await state();const last=stages.at(-1);
 if(!last||last.phase!==x.phase||last.cycle!==x.cycle){
   stages.push({cycle:x.cycle,phase:x.phase});
   console.log('LIVE stage '+label+': C'+x.cycle+' '+x.phase);
 }return x;}
try{
 for(let i=0;i<count;i++){
   const context=await browser.newContext({serviceWorkers:'block',
     viewport:i===0?{width:390,height:844}:i===1?{width:820,height:1180}:{width:1366,height:768}});
   contexts.push(context);
   const page=await context.newPage();
   page.on('pageerror',e=>failures.push('browser-'+i+': '+cleanError(e)));
   const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:35000});
   assert(response?.ok(),'Site could not be opened in independent browser '+i);
   await page.waitForFunction(()=>typeof rpc==='function'&&typeof STATE!=='undefined',{timeout:25000});
   players.push({page,context,pseudo:qaTag+'-'+i});
 }
 let out;
 for(let tries=0;tries<4;tries++){
   roomCode=code();
   try{out=await players[0].page.evaluate(({roomCode,pseudo})=>
    rpc('igr_v4_create_room',{p_code:roomCode,p_scenario_id:'029',p_pseudo:pseudo}),
    {roomCode,pseudo:players[0].pseudo});break}
   catch(e){if(tries===3)throw e}
 }
 players[0].out=out;
 let ui=await exec(0,'setup',{out,host:true,pseudo:players[0].pseudo});
 assert.equal(ui.status,'lobby');
 assert(ui.lobbyRoles>=4,'Required 029 roles must be available before everyone joins');
 console.log('LIVE host created actual Supabase room; role picker visible');
 for(let i=1;i<count;i++){
   const out=await players[i].page.evaluate(({roomCode,pseudo})=>
     rpc('igr_v4_join_room',{p_code:roomCode,p_pseudo:pseudo}),
     {roomCode,pseudo:players[i].pseudo});
   players[i].out=out;
   await exec(i,'setup',{out,host:false,pseudo:players[i].pseudo});
 }
 const initial=await state(0);
 assert.equal(initial.status,'lobby');
 assert.equal(initial.roles.length,count);
 console.log('LIVE '+count+' independent browser profiles connected');
 for(let i=0;i<count;i++){
   await action(i,'igr_v4_choose_role',{p_role:expectedRoles[i]});
   players[i].role=expectedRoles[i];
 }
 const selected=await state(0);
 assert.deepEqual(selected.roles,Array(count).fill(null),'Public assigned roles cannot exist before launch');
 await rpc(0,'igr_v4_start_game',{p_code:roomCode,p_host_token:players[0].out.host_token});
 started=true;
 const startedState=await record('start');
 assert.equal(startedState.status,'playing');
 for(let i=0;i<count;i++){
   const s=await state(i);
   assert.equal(s.status,'playing');
   assert.equal(s.role,expectedRoles[i],'Role assigned to wrong player');
 }
 console.log('LIVE started game on production backend; independent cards/roles confirmed');
 const witnesses=[];
 for(let i=0;i<count;i++){
   if(players[i].role!=='suspect')continue;
   const s=await state(i);
   assert(Number.isInteger(s.witnessIndex)&&s.witnessIndex>=1&&s.witnessIndex<=4,'Witness slot missing');
   witnesses.push({i,slot:s.witnessIndex,id:s.playerId});
 }
 assert.equal(new Set(witnesses.map(w=>w.slot)).size,4,'Witness roles must be unique');
 const investigator=players.findIndex(p=>p.role==='enqueteur');
 const journalist=players.findIndex(p=>p.role==='journaliste');
 const don=players.findIndex(p=>p.role==='don');
 const right=players.findIndex(p=>p.role==='bras_droit');
 let didReport=false,didProtect=new Set(),interviews=0;
 let terminal=false;
 for(let turn=0;turn<110;turn++){
   let s=await record(String(turn));
   if(s.status==='finished'){terminal=true;break}
   if(s.cycle>=1&&s.cycle<=3&&
     ['investigation_assembly','interrogation_select','event_select','trame'].includes(s.phase)&&
     !didProtect.has(s.cycle)){
     const target=['survivors','relatives','captives'][s.cycle-1];
     await action(investigator,'igr_v118_029_protection',{p_target:target});
     didProtect.add(s.cycle);
   }
   if(s.phase==='investigation_assembly'&&s.cycle===2&&don>=0&&right>=0){
     await action(don,'igr_v155_029_leadership_decision',{p_choice:'cooperate'}).catch(()=>{});
     await action(right,'igr_v155_029_leadership_decision',{p_choice:'cooperate'}).catch(()=>{});
   }
   if(s.cycle===3&&!didReport&&['investigation_assembly','event_select','trame','closed'].includes(s.phase)){
     const fields={santa_ceniza:'Chronologie des violences analysée durant les trois cycles.',
       activities:'Activités et conditions examinées après les auditions.',
       responsibilities:'L’équipe a recoupé les documents disponibles sans certitude complète.',
       responsibility_choice:'unknown',witness4_assessment:'unknown',
       protection:'Mesures de protection décidées par le camp enquêteur.'};
     await action(investigator,'igr_v107_029_report',{p_patch:fields,p_submit:false});
     await action(investigator,'igr_v107_029_report',{p_patch:null,p_submit:true});
     didReport=true;console.log('LIVE report submitted in cycle 3');
   }
   if(s.phase==='interrogation_select'){
     const used=new Set((s.state.heard||[]).map(String));
     const next=witnesses.find(w=>!used.has(w.id));
     assert(next,'No remaining witness eligible for interrogation');
     await action(investigator,'igr_v4_start_interrogation',{p_target:next.id});
     await action(investigator,'igr_v4_end_interrogation',{});
     interviews++;
     continue;
   }
   if(s.phase==='event_select'){
     const choices=(s.state.event_options||[]).map(x=>x.key);
     const key=['assembly','analyse_dossier','signature','negociation','requete','saisine','enquete_croisee']
       .find(x=>choices.includes(x));
     assert(key,'No target-free event offered in '+s.phase);
     await action(investigator,'igr_v13_start_event',{p_event:key,p_targets:null});
     continue;
   }
   if(s.phase==='final_audience'||s.phase==='final_suspect_defenses'){
     const id=s.state.v52_current_id;
     const chosen=players.findIndex(p=>p.out.player_id===id);
     assert(chosen>=0,'Final speaker missing');
     const required=players[chosen].role==='juge';
     if(required){
       await action(chosen,'igr_v52_stage_action',{p_action:'start',p_levels:null});
       await action(chosen,'igr_v52_stage_action',{p_action:'end',p_levels:null});
     }else{
       await action(chosen,'igr_v52_stage_action',{p_action:'skip',p_levels:null});
     }
     continue;
   }
   if(s.phase==='locking'){
     for(let i=0;i<count;i++){
       if(!['enqueteur','analyste','procureur','juge','journaliste'].includes(players[i].role))continue;
       const my=await state(i);
       if(my.myActions.some(a=>a.action_type==='final_lock'))continue;
       const note=players[i].role==='journaliste'
         ?'Une publication doit être attribuée et vérifiée avant conclusion.'
         :'Conclusion administrative du test, aucune culpabilité attribuée aux témoins.';
       await action(i,'igr_v4_lock_final',{p_payload:{note,levels:{}}});
     }
     continue;
   }
   await hostAdvance();
 }
 assert(terminal,'Server did not reach reveal in 110 actual RPC turns');
 const endStates=await Promise.all(players.map((_,i)=>state(i)));
 for(const s of endStates){assert.equal(s.status,'finished');assert.equal(s.phase,'reveal')}
 assert(stages.some(x=>x.cycle===1)&&stages.some(x=>x.cycle===2)&&stages.some(x=>x.cycle===3),
 'All three story cycles must be visited');
 assert(interviews>=4,'All four witnesses must be interviewed in cycle 1');
 assert.equal(didProtect.size,3,'Protection actions missing in three cycles');
 assert(didReport,'Report never submitted');
 const privateIds=endStates.map(s=>new Set(s.privateEvents));
 const identities=privateIds.some((ids,i)=>[...ids].some(v=>privateIds.some((other,j)=>i!==j&&other.has(v))));
 // A few private communications may correctly be visible to both leaders;
 // no witness should receive another witness's targeted message.
 for(const w of witnesses)for(const v of witnesses){
   if(w.i!==v.i)assert(![...privateIds[w.i]].some(id=>privateIds[v.i].has(id)),
    'Witness-specific confidential event leaked');
 }
 console.log('LIVE FULL GAME PASS: '+count+' browser profiles, '+interviews+' interviews, '+
   '3 cycles, 3 protective choices, final report, role-private events, synchronized reveal');
 console.log('This is a real production-backend automated playthrough, not a human 6–11-device review');
}catch(e){
 console.error('LIVE GAME FAIL: '+cleanError(e));
 console.error('Started='+started+' stages='+JSON.stringify(stages.slice(-18))+' browserExceptions='+JSON.stringify(failures.slice(-3)));
 process.exitCode=1;
}finally{
 await Promise.allSettled(contexts.map(c=>c.close()));await browser.close();
}
