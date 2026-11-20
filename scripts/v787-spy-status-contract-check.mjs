import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const app=readFileSync('app-v11.js','utf8');
const sql=readFileSync('supabase/migrations/20261120232713_igr_v787_spy_authoritative_own_stage_status.sql','utf8');
const from=app.indexOf("let spyDecisionPendingKey='';");
const to=app.indexOf('\nfunction privateCardHtml(){',from);
assert(from>0&&to>from&&to-from<5500,'Spy decision handler not isolated');
assert(app.includes("await rpc('igr_v787_spy_status',params)"),'Private sync must query authoritative status');
assert(app.includes("d.player.spy_stage_status=ownStatus?.ok===true?ownStatus:null"),'Status fetch failure must fail closed');
assert(app.includes("const spyEarlyMissed=spySealStage==='final'&&spyStatus?.early_sealed===false"),'Cycle 3 missing-first-stage UI not blocked');
assert(!app.includes('igr_spy_v631_'),'Local storage v631 lock must not determine eligibility');
assert(sql.includes('player_token=p_player_token')&&sql.includes("actor_.secret_role IS DISTINCT FROM 'espion'"),'Token and own-role authorization required');
assert(sql.includes("a.match_no=match_")&&sql.includes('s.player_id=actor_.id'),'Status must apply only to this match and player');
assert(sql.includes("'early_sealed',EXISTS")&&sql.includes("'final_sealed',EXISTS"),'Only sealed status may be returned');
assert(!sql.includes("'choice',")&&!sql.includes("'mission_key',")&&!sql.includes("'correct',"),'Spy status must not leak route or verdict');
assert(sql.includes('REVOKE ALL ON FUNCTION public.igr_v787_spy_status(text,uuid) FROM PUBLIC, anon, authenticated;'),'Function permissions must be explicit');
const handler=app.slice(from,to);
const make=(cycle,{early=false,final=false,secret='espion',phase='interrogation_select',hold=false}={})=>{
 let calls=[],messages=[],syncs=0,resolveCall;
 const player={id:'spy-player',secret_role:secret,spy_stage_status:{ok:true,match_no:1,early_sealed:early,final_sealed:final}};
 const room={cycle,phase,status:'playing'};
 const state={room:'QA787',token:'private-token',sync:{room,player}};
 const sandbox={
  STATE:state,
  toast:msg=>messages.push(msg),
  rpc:async(name,args)=>{calls.push({name,args});if(hold)return new Promise(resolve=>{resolveCall=resolve});return {ok:true};},
  syncNow:async()=>{syncs++;return state.sync;},
  console:{error:()=>{}}
 };
 const fn=runInNewContext(handler+'\n;sendSpyDecision',sandbox);
 return {fn,state,calls,messages,get syncs(){return syncs},resolve:()=>resolveCall?.({ok:true})};
};
{
 const t=make(1);
 await t.fn('source');
 assert.equal(t.calls.length,1);
 assert.equal(t.calls[0].name,'igr_v631_spy_decide');
 assert.equal(t.state.sync.player.spy_stage_status.early_sealed,true);
 await t.fn('archive');
 assert.equal(t.calls.length,1,'Sealed first stage cannot be replayed');
 assert.equal(t.syncs,1);
}
{
 const t=make(2,{early:true});
 await t.fn('source');
 assert.equal(t.calls.length,0,'A choice on cycle 1 must remain sealed in cycle 2 on another device');
}
{
 const t=make(3,{early:false});
 await t.fn('verify');
 assert.equal(t.calls.length,0,'Final stage must be unavailable when first stage was missed');
}
{
 const t=make(3,{early:true});
 await t.fn('verify');
 assert.equal(t.calls.length,1);
 assert.equal(t.state.sync.player.spy_stage_status.final_sealed,true);
 await t.fn('protect');
 assert.equal(t.calls.length,1,'Final stage cannot be replayed');
}
{
 const t=make(1,{hold:true});
 const first=t.fn('source');
 const duplicate=t.fn('archive');
 assert.equal(t.calls.length,1,'Two rapid taps must share a single pending submission');
 t.resolve();await Promise.all([first,duplicate]);
 assert.equal(t.state.sync.player.spy_stage_status.early_sealed,true);
}
{
 const t=make(1,{secret:'suspect'});
 await t.fn('source');
 assert.equal(t.calls.length,0,'Non-spies cannot execute secret choices');
}
{
 const t=make(1);
 await t.fn('protect');
 assert.equal(t.calls.length,0,'Wrong-stage action must be rejected before RPC');
}
{
 const t=make(1);
 t.state.sync.player.spy_stage_status=null;
 await t.fn('source');
 assert.equal(t.calls.length,0,'Unknown server status must fail closed');
}
console.log('PASS v787: self-only stage RPC, reconnect seal, missed cycle, duplicate tap and fail-closed decisions');
