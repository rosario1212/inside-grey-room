import {startRuntime,applyRuntime,tickRuntime,viewRuntime,validateRelease} from './runtime.mjs';
import {randomInt,shuffledDeck,SLOT_RULES} from './games.mjs';
const check=(ok,code)=>{if(!ok)throw Error(code)};
const roles=new Set(['casino','agent','investigator','analyst','prosecutor','judge']);
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const token=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const cleanName=v=>typeof v==='string'&&v.trim().length>=1&&v.length<=22&&!/[\u0000-\u001f<>]/.test(v);
export async function sha256(value){
  const data=new TextEncoder().encode(value),digest=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
const fingerprint=body=>sha256(JSON.stringify(stable(body)));
function view(state,member,room){
  if(state.status!=='lobby')return {...viewRuntime(state,member.id),revision:room.revision,roomId:room.id,inviteCode:room.inviteCode};
  return {roomId:room.id,inviteCode:room.inviteCode,revision:room.revision,status:'lobby',viewer:member.id,
    isHost:member.id===state.hostId,members:state.members.map(({id,name,role,ready})=>({id,name,role,ready})),
    name:member.name,minimumCasinoPlayers:4,maximumCasinoPlayers:7};
}
const selectMember=(state,hash)=>state.members.find(m=>m.tokenHash===hash);
// Storage is injected. Every mutation is persisted before the response exists.
// CAS is also the join/start lock; the client cannot supply authoritative actor,
// cards, dice, payouts, evidence validation, hidden roles, or server state.
export function casinoService(storage,{clock=Date.now,rng=randomInt,makeId=()=>crypto.randomUUID()}={}){
  async function persist(room,requestId,actor,fp,command,state){
    state.revision=room.revision+1;
    return storage.commit({id:room.id,expectedRevision:room.revision,requestId,actor,fingerprint:fp,command,state});
  }
  async function process(body){
    check(body&&typeof body==='object'&&!Array.isArray(body),'invalid_request');
    check(['create','join','sync','command','ready','role','start'].includes(body.op),'unknown_operation');
    check(token(body.sessionToken),'invalid_session_token');
    const hash=await sha256(body.sessionToken),now=clock();
    if(body.op==='create'){
      check(uuid(body.roomId)&&cleanName(body.name)&&uuid(body.profileId)&&typeof body.profileToken==='string','invalid_creation');
      // A retried create must prove possession of the original recovery secret.
      const old=await storage.read(body.roomId);
      if(old){const member=selectMember(old.state,hash);check(member?.id===old.state.hostId,'room_identifier_in_use');return view(old.state,member,old)}
      const id=makeId(),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const inviteCode='C'+Array.from({length:9},()=>alphabet[rng(alphabet.length)]).join('');
      const state={status:'lobby',id:body.roomId,revision:0,hostId:id,members:[{id,name:body.name.trim(),role:'casino',ready:false,tokenHash:hash}]};
      const room=await storage.create({id:body.roomId,inviteCode,profileId:body.profileId,profileToken:body.profileToken,state});
      return view(state,state.members[0],room);
    }
    check(uuid(body.roomId)||body.op==='join'&&/^C[A-Z2-9]{9}$/.test(body.inviteCode||''),'invalid_room');
    let room=await storage.read(body.roomId||null,body.inviteCode||null);check(room,'room_not_found');
    if(body.op==='join'){
      check(cleanName(body.name),'invalid_name');
      // Repeated join or a second device with the recovery secret resumes the
      // existing identity. A new token can never take over somebody else's name.
      for(let attempt=0;attempt<4;attempt++){
        const member=selectMember(room.state,hash);if(member)return view(room.state,member,room);
        check(room.state.status==='lobby','campaign_already_started');
        check(room.state.members.length<12,'room_full');
        check(!room.state.members.some(m=>m.name.toLocaleLowerCase()===body.name.trim().toLocaleLowerCase()),'name_already_in_use');
        check(uuid(body.requestId),'request_id_required');
        const joined={id:makeId(),name:body.name.trim(),role:'casino',ready:false,tokenHash:hash};
        const state=structuredClone(room.state);state.members.push(joined);
        const fp=await fingerprint({op:'join',name:body.name.trim(),tokenHash:hash});
        try{room=await persist(room,body.requestId,'join:'+hash,fp,{type:'JOIN',member:joined},state);return view(room.state,selectMember(room.state,hash),room)}
        catch(e){if(e.message!=='revision_conflict'||attempt===3)throw e;room=await storage.read(room.id)}
      }
    }
    let member=selectMember(room.state,hash);check(member,'session_not_authorized');
    if(body.op==='sync'){
      const tick=tickRuntime(room.state,now);
      if(tick){try{room=await persist(room,makeId(),'system',await fingerprint({type:'TICK',revision:room.revision}),{type:'TICK',now},tick)}
        catch(e){if(e.message!=='revision_conflict')throw e;room=await storage.read(room.id)}}
      return view(room.state,member,room);
    }
    check(uuid(body.requestId),'request_id_required');
    const input={op:body.op,type:body.type,payload:body.payload||{},role:body.role,ready:body.ready};
    const fp=await fingerprint(input),receipt=await storage.receipt(room.id,body.requestId);
    if(receipt){check(receipt.actor===member.id&&receipt.fingerprint===fp,'idempotency_key_conflict');return view(room.state,member,room)}
    check(Number.isSafeInteger(body.expectedRevision)&&body.expectedRevision===room.revision,'revision_conflict');
    let state=structuredClone(room.state),command;
    if(['role','ready'].includes(body.op)){
      check(state.status==='lobby','lobby_closed');const own=state.members.find(m=>m.id===member.id);
      if(body.op==='role'){
        check(roles.has(body.role),'invalid_role');
        check(body.role==='casino'||!state.members.some(m=>m.id!==own.id&&m.role===body.role),'role_already_taken');
        own.role=body.role;own.ready=false;
      }else{check(typeof body.ready==='boolean','invalid_ready');own.ready=body.ready}
      command={type:body.op.toUpperCase(),actor:member.id,payload:input};
    }else if(body.op==='start'){
      check(state.status==='lobby'&&member.id===state.hostId,'host_required');
      const releases=await storage.releases();
      check(releases.length===3&&['A','B','C'].every(v=>releases.some(r=>r.variant===v))&&
        releases.every(r=>r.content.humanReviewApproved===true&&r.content.editorialStatus==='ready'),'casino_editorial_release_required');
      for(const release of releases)validateRelease(release.content);
      const release=releases[rng(releases.length)],players=state.members.filter(m=>m.role==='casino').map(m=>m.id);
      const max=players.length===4?1:2,count=rng(max+1),pool=[...players],undercoverIds=[];
      for(let i=0;i<count;i++)undercoverIds.push(pool.splice(rng(pool.length),1)[0]);
      const deck=shuffledDeck(rng);state=startRuntime(state,release,{undercoverIds,now,deck});
      command={type:'START',actor:member.id,releaseId:release.id,release:structuredClone(release),undercoverIds,deck,now};
    }else{
      check(state.status==='playing','campaign_not_playing');
      check(typeof body.type==='string'&&body.type.length<=80,'invalid_command');
      check(!('actor' in body)&&!('entropy' in body)&&!('state' in body),'server_fields_forbidden');
      command={id:body.requestId,actor:member.id,type:body.type,payload:body.payload||{}};
      if(body.type==='START_POKER')command.entropy={deck:shuffledDeck(rng)};
      if(body.type==='SLOT_SPIN')command.entropy={reels:Array.from({length:3},()=>SLOT_RULES.symbols[rng(SLOT_RULES.symbols.length)])};
      state=applyRuntime(state,command,{now});command.now=now;
    }
    room=await persist(room,body.requestId,member.id,fp,command,state);
    member=selectMember(room.state,hash);return view(room.state,member,room);
  }
  return {process};
}
// Disaster-recovery check: reconstruct solely from the initial lobby snapshot
// and append-only server journal. START carries its immutable private release,
// so later editorial changes cannot rewrite the campaign being reconstructed.
export function replayCasinoJournal(initial,commands){
  let state=structuredClone(initial);
  for(const saved of commands){
    const revision=state.revision+1,command=structuredClone(saved);
    if(command.type==='JOIN')state.members.push(command.member);
    else if(command.type==='ROLE'||command.type==='READY'){
      const member=state.members.find(m=>m.id===command.actor);check(member,'replay_unknown_member');
      if(command.type==='ROLE'){member.role=command.payload.role;member.ready=false}else member.ready=command.payload.ready;
    }else if(command.type==='START'){
      state=startRuntime(state,command.release,{undercoverIds:command.undercoverIds,now:command.now,deck:command.deck});
    }else if(command.type==='TICK'){
      state=tickRuntime(state,command.now);check(state,'replay_missing_tick');
    }else{
      const now=command.now;delete command.now;state=applyRuntime(state,command,{now});
    }
    state.revision=revision;
  }
  return state;
}
