// CARTEL 029 v722/v723: client recovery, privacy and collective verdict contracts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const report=readFileSync('cartel029-v107.js','utf8');
const roles=readFileSync('cartel029-v121.js','utf8');
const random=readFileSync('supabase/migrations/20261116123000_igr_v722_cartel029_random_roles.sql','utf8');
const verdict=readFileSync('supabase/migrations/20261116123500_igr_v723_cartel029_collective_verdict.sql','utf8');

for(const source of [report,roles])assert.doesNotThrow(()=>new vm.Script(source));
assert.match(random,/\('don'\),\('bras_droit'\)/);
assert.match(random,/igr_v4_role_capacity\(r.scenario_id,player_count,q.role\)/);
assert.match(verdict,/BEFORE UPDATE OF status ON public\.igr_v4_rooms/);
assert.match(verdict,/OLD.status='lobby' AND NEW.status='playing'/);
assert.match(verdict,/DELETE FROM public\.igr_v4_actions[\s\S]*?cartel029_final_opinion/);
assert.match(verdict,/public\.igr_v723_029_vote\(/);
assert.match(verdict,/room\.phase<>'locking'/);
assert.match(verdict,/p_responsibility NOT IN/);
assert.match(verdict,/p_witness4 NOT IN/);
assert.match(verdict,/vote_already_locked/);
assert.match(verdict,/BEFORE INSERT ON public\.igr_v4_actions/);
assert.match(verdict,/029_collective_vote_required/);
assert.match(verdict,/votes_cast=electorate/);
assert.match(verdict,/branch_votes\*2>electorate/);
assert.match(verdict,/witness_votes\*2>electorate/);
assert.match(verdict,/voter.public_role IN \('enqueteur','analyste','procureur','juge'\)/);
assert.doesNotMatch(roles,/León Trejo dépasse|Rogelio.*approuve|Óscar Beltrán ordonne/);
const storage=new Map();
const sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};

function reportSession(identity='investigator'){
 const body={innerHTML:''};
 const values={
  santa_ceniza:'Conclusion locale non sauvegardée, avec plusieurs faits.',
  activities:'Circuits logistiques et sites distincts à vérifier.',
  responsibilities:'Responsabilités à établir par recoupement.',
  protection:'Protection des captifs et familles.',
  responsibility_choice:'local',witness4_assessment:'coerced'
 };
 const player={id:identity,public_role:'enqueteur',pseudo:'ENQUÊTE'};
 const state={tab:'investigation',token:'secret-'+identity,sync:{
  player,room:{code:'C029A',scenario_id:'029',cycle:3,status:'playing',state:{cartel029_ready:true,match_no:2}}
 }};
 let server={status:'draft',fields:{santa_ceniza:'Texte du serveur existant.',activities:'Brouillon du serveur.'}};
 let mode='success',writes=0,reads=0;
 const ctx={
  STATE:state,window:null,document:{
   createElement:()=>({style:{},textContent:''}),head:{appendChild(){}},
   getElementById:id=>id==='igr029-report-body'?body:null,
   querySelectorAll:()=>Object.entries(values).map(([name,value])=>({dataset:{igr029Field:name},value}))
  },
  renderGameTab:()=>'<section>Base</section>',setInterval:()=>0,console,
  rpc:async(name,params)=>{
   assert.equal(name,'igr_v107_029_report');
   if(params.p_patch===null){reads++;return server}
   writes++;
   if(mode==='lost_reply'){server={status:params.p_submit?'submitted':'draft',fields:{...params.p_patch}};throw Error('Network response lost')}
   if(mode==='failure')throw Error('Service unavailable');
   server={status:params.p_submit?'submitted':'draft',fields:{...params.p_patch}};
   return server;
  }
 };ctx.window=ctx;ctx.sessionStorage=sessionStorage;
 vm.runInNewContext(report,ctx);
 return {ctx,state,body,values,setMode:m=>mode=m,server:()=>server,stats:()=>({writes,reads})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

{
 const a=reportSession();a.ctx.renderGameTab();await flush();
 assert.match(a.body.innerHTML,/Rapport final|Trois conclusions/);
 a.ctx.igr029MarkDirty();assert.equal(storage.size,1,'Draft must be scoped to tab, player, room and match');
 a.setMode('failure');await a.ctx.igr029SaveReport();
 assert.match(a.body.innerHTML,/Conclusion locale non sauvegardée/,'Failed save erased typed answers');
 assert.match(a.body.innerHTML,/conservées dans cet onglet/);
 assert.equal(storage.size,1,'Failed save removed recovery copy');
 const recovered=reportSession();recovered.ctx.renderGameTab();await flush();
 assert.match(recovered.body.innerHTML,/Conclusion locale non sauvegardée/,'Tab reinit did not restore the draft');
 recovered.setMode('lost_reply');await recovered.ctx.igr029SaveReport();
 assert.match(recovered.body.innerHTML,/Enregistrement confirmé après reconnexion/);
 assert.equal(storage.size,0,'Server-confirmed write must clear the recovery copy');
}
{
 const a=reportSession('other-investigator');a.ctx.renderGameTab();await flush();
 assert.equal(storage.size,0,'Other player must not inherit previous player private draft');
 a.setMode('failure');await a.ctx.igr029SaveReport();
 assert.equal(storage.size,1);
 a.state.sync.room.state.match_no=3;a.ctx.renderGameTab();await flush();
 assert.equal(storage.size,1,'New match must not erase previous private draft');
 assert.doesNotMatch(a.body.innerHTML,/Conclusion locale non sauvegardée/,'A prior match draft leaked into new match');
}
{
 let originalCalls=0;
 const toastMessages=[],rpcCalls=[];
 const player={id:'p-1',public_role:'analyste',pseudo:'Analyste'};
 const sync={player,room:{code:'C029A',status:'playing',scenario_id:'029',min_players:6,max_players:11,cycle:3,
   phase:'locking',state:{cartel029_ready:true,cartel029_collective_v723:true}},my_actions:[],players:[],events:[]};
 const doc={createElement:()=>({style:{},textContent:''}),head:{appendChild(){}},
   getElementById:id=>({value:id==='igr029-responsibility'?'finance':'operative'})};
 const ctx={STATE:{sync,room:'C029A',token:'secret',tab:'investigation'},
  document:doc,console,window:null,
  renderFinalLockForm:()=>'<div>Default final</div>',lockFinal:async()=>{originalCalls++},
  renderGameTab:()=>'<div>Game</div>',renderReveal:()=>'<div>Reveal</div>',
  roleInfo:r=>({label:r}),displayRole:r=>r,publicRoleLabel:r=>r,
  privateCardHtml:()=>'<div>Card</div>',renderInterrogationSelect:()=>'<div>Interview</div>',
  renderProvisionalForm:()=>'<div>Provisional</div>',levelsForm:()=>'<div>Levels</div>',
  collectLevels:()=>({}),phaseLabel:p=>p,toast:msg=>toastMessages.push(msg),
  rpc:async(name,args)=>{rpcCalls.push({name,args});return {ok:true}},
  syncNow:async()=>{},};
 ctx.window=ctx;vm.runInNewContext(roles,ctx);
 assert.match(ctx.renderFinalLockForm(),/majorité absolue/);
 assert.match(ctx.renderFinalLockForm(),/igr029-responsibility/);
 await ctx.lockFinal();
 assert.equal(originalCalls,1);
 assert.equal(rpcCalls.length,1);
 assert.equal(rpcCalls[0].name,'igr_v723_029_vote');
 assert.equal(rpcCalls[0].args.p_responsibility,'finance');
 assert.equal(rpcCalls[0].args.p_witness4,'operative');
 sync.room.state.cartel029_collective_v723=false;
 await ctx.lockFinal();
 assert.equal(originalCalls,2);assert.equal(rpcCalls.length,1,'Legacy session should not be forced into new voting');
 sync.room.scenario_id='030';sync.room.state.cartel029_collective_v723=true;
 await ctx.lockFinal();
 assert.equal(originalCalls,3);assert.equal(rpcCalls.length,1,'Dossier 030 must retain its own locking rules');
}
console.log('CARTEL 029 v722-v723 PASS: no lost report draft, match isolation, retry deduplication, prospectively gated collective votes, strict majority and zero canonical leaks.');
