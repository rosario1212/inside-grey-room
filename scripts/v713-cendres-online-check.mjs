import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const src=readFileSync('play-modes-v13-8.js','utf8');
const play=readFileSync('heritage-play-v13-7.js','utf8');
const sql=readFileSync('supabase/migrations/20261115230500_heritage_cendres_majority_ballot_v713.sql','utf8');

for(const phrase of [
  "igr_heritage_online_vote_cendres",
  "igr_heritage_online_cendres_ballot_status",
  "hLastStage",
  "Votre place est conservée",
  "finishOnlineConfirmed",
  "ballot?.vote_round",
  "ballot?.votes_cast",
  "ballot?.my_vote",
])assert.ok(src.includes(phrase),'Online runtime contract missing '+phrase);
assert.ok(play.includes('finishOnlineConfirmed:(serverRoom=null,serverPractice=false)=>'),'Post-confirmation persistence absent');
assert.ok(src.includes('hFinishPending'),'Online finish must guard in-flight watcher race');
assert.ok(src.includes("finishOnlineConfirmed?.(d.room,!!s.practice)"),'Host result must persist after confirmed room-finished sync');
assert.ok(sql.includes("if v_room.campaign_id='cendres' then raise exception 'collective ballot required'"),'Legacy host bypass not blocked');
assert.ok(sql.includes("if v_total not between 5 and 7"),'Invalid roster not blocked');
assert.ok(sql.includes('v_majority := (v_total/2)+1'),'Absolute majority not implemented');
assert.ok(sql.includes('on conflict (room_code,player_id)'),'Repeated votes are not unique');
assert.ok(sql.includes('cendres_vote_round=cendres_vote_round+1'),'Runoff missing');
assert.ok(sql.includes('enable row level security'),'Votes table missing RLS');

const match=src.match(/async function decideHeritageOnline\(decision\)\{[\s\S]*?\n\}/);
assert.ok(match,'Online vote handler missing');
async function verify(campaign,hostToken,expected){
  const calls=[],notices=[];
  const context={
    hVotePending:false,
    hSession:()=>({campaign,code:'HX713',token:'PRIVATE_PLAYER_TOKEN',hostToken}),
    rpc:async(name,args)=>{calls.push({name,args});return {ok:true,new_round:false}},
    syncHeritageOnline:async()=>{calls.push({name:'sync'})},
    toastX:message=>notices.push(message),
    console:{error(){}}
  };
  runInNewContext(match[0]+'\nthis.vote=decideHeritageOnline',context);
  await context.vote('b');
  assert.equal(calls[0]?.name,expected,'Wrong authority path '+campaign);
  if(campaign==='cendres'||campaign==='kuroi'){
    assert.equal(calls[0].args.p_player_token,'PRIVATE_PLAYER_TOKEN');
    assert.equal(calls[0].args.p_host_token,undefined);
  }
  assert.equal(calls[1]?.name,'sync');
  assert.equal(notices.length,0);
}
await verify('cendres',null,'igr_heritage_online_vote_cendres');
await verify('cendres','HOST_TOKEN','igr_heritage_online_vote_cendres');
await verify('kuroi','HOST_TOKEN','igr_heritage_online_vote_kuroi');
await verify('kuroi',null,'igr_heritage_online_vote_kuroi');

// KUROI guests vote; MAÎTRE guests cannot bypass the host-authorized choice.
{
  const calls=[];
  const c={hVotePending:false,hSession:()=>({campaign:'maitre',code:'HM713',token:'GUEST',hostToken:null}),
    rpc:async(name)=>calls.push(name),syncHeritageOnline:async()=>{},toastX:()=>{},console:{error(){}}};
  runInNewContext(match[0]+'\nthis.vote=decideHeritageOnline',c);
  await c.vote('b');assert.deepEqual(calls,[]);
}
console.log('HÉRITAGE online controls: CENDRES and KUROI guest/host private majority ballots, no host bypass, MAÎTRE authority preserved.');
