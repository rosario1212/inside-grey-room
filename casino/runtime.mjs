// Server-only orchestration of the existing foundation. Never send this state
// to a browser; viewRuntime is the sole client projection.
import {createCasinoCampaign, applyCasinoCommand, casinoView} from './campaign-core.mjs';
import {startPoker,pokerAction,pokerView,spinSlot,expirePokerTurn,SLOT_RULES} from './games.mjs';
const check=(ok,code)=>{if(!ok)throw Error(code)};
const text=(v,max=700)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const uniq=a=>Array.isArray(a)&&new Set(a).size===a.length;
const bureauRole=(s,id)=>Object.keys(s.bureau).find(k=>s.bureau[k]===id);
const active=(s,id)=>s.players.includes(id)&&s.roster[id].status==='free';
const numberPhase=s=>s.chapter===1?s.phase:s.chapter===2?3+s.phase:6+s.phase;
const identity=(s,id)=>s.roster[id]?.name||s.members?.find(m=>m.id===id)?.name||id;
const resolveId=(s,id)=>s.cast[id]||id;
function render(s,value){
  if(typeof value==='string')return value.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g,(_,id)=>identity(s,resolveId(s,id)));
  if(Array.isArray(value))return value.map(v=>render(s,v));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,render(s,v)]));
  return value;
}
export function validateRelease(pack){
  check(pack?.schemaVersion===1,'invalid_casino_release');
  check(Array.isArray(pack.characters)&&pack.characters.length===7&&uniq(pack.characters.map(c=>c.id)),'invalid_cast');
  check(pack.casting&&[4,5,6,7].every(n=>uniq(pack.casting[n])&&pack.casting[n].length===n&&
    pack.casting[n].every(id=>pack.characters.some(c=>c.id===id))),'incomplete_casting');
  check(pack.characters.every(c=>text(c.title,100)&&text(c.brief,4000)&&text(c.objective,1000)&&
    Array.isArray(c.relations)&&c.relations.length>0&&c.relations.every(r=>text(r.target,80)&&text(r.text,1500))),'incomplete_character_cards');
  check(Array.isArray(pack.phases)&&pack.phases.length===8&&pack.phases.every(p=>text(p.title,100)&&text(p.public,3000)),'incomplete_eight_phases');
  check(['agent','investigator','analyst','prosecutor','judge'].every(r=>text(pack.bureau?.[r],4000)),'incomplete_bureau_cards');
  check(Array.isArray(pack.puzzles)&&pack.puzzles.length===5&&pack.puzzles.every(p=>text(p.question,1000)&&
    text(p.answer,120)&&p.options?.length>=2&&p.options.some(o=>o.id===p.answer)),'incomplete_agent_puzzles');
  check(Array.isArray(pack.evidence)&&pack.evidence.length>=4&&uniq(pack.evidence.map(e=>e.id))&&
    pack.evidence.every(e=>text(e.id,100)&&text(e.sourceId,150)&&text(e.independenceGroup,150)&&
      text(e.description,1000)&&text(e.offence,120)&&Number.isInteger(e.phase)&&e.phase>=1&&e.phase<=8),'incomplete_evidence_provenance');
  check(Array.isArray(pack.territories)&&pack.territories.length>0&&pack.territories.every(t=>text(t.id,80)&&text(t.name,100)&&text(t.controller,80)),'incomplete_territories');
  check(Array.isArray(pack.npcs)&&pack.npcs.some(n=>n.id==='dragon')&&pack.npcs.some(n=>n.id==='chan'),'missing_central_npcs');
  check(pack.npcs.every(n=>text(n.id,80)&&text(n.name,100)&&text(n.motivation,2000)),'incomplete_npc_motivations');
  check([...pack.characters,...pack.npcs].every(c=>text(pack.npcDefences?.[c.id],2000)),'incomplete_npc_defences');
  check(text(pack.fallback?.text,1000)&&Number.isSafeInteger(pack.minimumSocialMs)&&pack.minimumSocialMs>=60000,'missing_social_time_or_fallback');
  check(Array.isArray(pack.organigram)&&pack.organigram.every(e=>text(e.subject,80)&&text(e.relation,100)&&text(e.target,80)),'incomplete_canonical_organigram');
  check(Array.isArray(pack.judicialRules)&&pack.judicialRules.length>0&&pack.judicialRules.every(r=>text(r.offence,120)&&
    uniq(r.requiredFacts)&&r.requiredFacts.length>0&&text(r.convictionText,1500)&&text(r.acquittalText,1500)),'incomplete_judicial_rules');
  check(Array.isArray(pack.moves)&&pack.moves.every(m=>text(m.id,100)&&text(m.label,150)&&m.phase>=1&&m.phase<=8&&
    ['nominate','depose','assassinate','reveal'].includes(m.effect)&&Array.isArray(m.conditions)&&m.conditions.length>0),'incomplete_npc_branches');
  check(pack.moves.every(m=>m.effect!=='assassinate'||m.conditions.some(c=>c.kind==='warning')),'lethal_branch_requires_prior_warning');
  check(pack.npcOffers===undefined||Array.isArray(pack.npcOffers)&&pack.npcOffers.every(o=>text(o.id,100)&&text(o.label,150)&&
    text(o.npcId,80)&&text(o.terms,1000)&&Number.isInteger(o.phase)&&o.phase>=1&&o.phase<=8&&
    Number.isSafeInteger(o.price)&&o.price>=0&&Array.isArray(o.conditions)&&typeof o.support==='boolean'),'invalid_npc_offers');
  return true;
}
export function startRuntime(lobby,release,{undercoverIds,now,deck}){
  const pack=structuredClone(release.content);validateRelease(pack);
  const casino=lobby.members.filter(m=>m.role==='casino'),bureau=Object.fromEntries(lobby.members.filter(m=>m.role!=='casino').map(m=>[m.role,m.id]));
  check(casino.length>=4&&casino.length<=7&&bureau.agent&&bureau.investigator&&bureau.analyst,'incomplete_lobby_roles');
  check(lobby.members.every(m=>m.ready),'players_not_ready');
  const cast=Object.fromEntries(pack.casting[casino.length].map((key,i)=>[key,casino[i].id]));
  const characters=[...pack.characters.map(c=>({id:cast[c.id]||c.id,name:cast[c.id]?casino.find(m=>m.id===cast[c.id]).name:c.name,
    chips:500,reputation:45,legitimacy:20,influence:35,npc:!cast[c.id]})),
    ...pack.npcs.map(n=>({id:n.id,name:n.name,chips:0,reputation:70,legitimacy:70,influence:70,npc:true}))];
  const state=createCasinoCampaign({id:lobby.id,players:casino.map(m=>m.id),characters,bureau,undercoverIds,
    answerKey:Object.fromEntries(pack.puzzles.map((p,i)=>[i+1,p.answer]))});
  Object.assign(state,{runtimeVersion:2,status:'playing',members:lobby.members,hostId:lobby.hostId,cast,
    releaseId:release.id,privateCanon:pack,openingPokerComplete:false,phaseStartedAt:now,campaignStartedAt:now,
    politicalBase:Object.fromEntries(Object.values(state.roster).map(c=>[c.id,{influence:c.influence,legitimacy:c.legitimacy}])),
    casinoBank:100000,slotResults:{},loyalty:{},successionWagers:{},territories:{},messages:[],hearings:[],
    rulings:[],organigram:[],npcEvents:[],publicEvents:[],corruption:[],support:{},motions:[],privateNotes:{},usedMoves:[],usedNpcOffers:[],finale:null});
  for(const t of pack.territories)state.territories[t.id]={id:t.id,name:t.name,controller:resolveId(state,t.controller),claims:[]};
  releasePhase(state);startPoker(state,{id:'opening',participants:state.players,deck,now});refreshPolitics(state);
  return state;
}
function releasePhase(s){
  const phase=numberPhase(s),p=s.privateCanon.phases[phase-1];
  s.publicEvents.push({id:'phase-'+phase,text:render(s,p.public),phase});
  // Only trusted authored sources can enter the validated evidence pool.
  for(const e of s.privateCanon.evidence.filter(e=>e.phase===phase)){
    s.evidence.push({...render(s,e),id:e.id,subjectId:resolveId(s,e.subjectId),validated:true,origin:'authored'});
  }
  for(const event of (p.npcEvents||[])){
    const npc=s.roster[event.npcId];
    if(npc&&npc.status==='free')s.npcEvents.push({id:event.id||`npc-${phase}-${s.npcEvents.length}`,npcId:npc.id,
      text:render(s,event.text),to:event.to?resolveId(s,event.to):null,phase});
  }
}
function record(s,cmd,previous){
  s.revision=previous.revision+1;
  s.eventLog.push({...structuredClone(cmd),chapter:previous.chapter,phase:previous.phase,revision:s.revision});
  return s;
}
function corroborated(s,subject,evidenceIds,offence){
  check(uniq(evidenceIds),'invalid_evidence_selection');
  const items=s.evidence.filter(e=>evidenceIds.includes(e.id)&&e.subjectId===subject&&e.validated&&e.offence===offence);
  check(items.length===evidenceIds.length&&items.length>=2&&new Set(items.map(e=>e.independenceGroup)).size>=2,'insufficient_independent_corroboration');
  return items;
}
function moveAllowed(s,move,actor){
  return !s.usedMoves.includes(move.id)&&numberPhase(s)>=move.phase&&(!move.actor||resolveId(s,move.actor)===actor)&&
    move.conditions.every(c=>{
      const id=resolveId(s,c.subject),target=resolveId(s,c.target);
      switch(c.kind){
        case 'status':return s.roster[id]?.status===c.value;
        case 'claim':return s.claims.some(v=>v.id===id);
        case 'loyalty':return s.loyalty[id]===target;
        case 'territory':return s.territories[c.territoryId]?.controller===id;
        case 'agreement':return Object.values(s.agreements).some(a=>a.kind===c.agreementKind&&a.status==='signed'&&a.breachedBy.length===0&&a.participants.includes(id)&&a.participants.includes(target));
        case 'warning':return s.publicEvents.some(e=>e.id===c.eventId)||s.npcEvents.some(e=>e.id===c.eventId&&(!e.to||e.to===actor));
        default:return false;
      }
    });
}
function offerAllowed(s,offer,actor){
  const npc=s.roster[resolveId(s,offer.npcId)];
  return npc?.npc&&npc.status==='free'&&!s.usedNpcOffers.includes(offer.id)&&moveAllowed(s,offer,actor)&&
    (!offer.territoryId||s.territories[offer.territoryId]?.controller===npc.id);
}
function applyRuntimeRules(current,command,{now}={now:Date.now()}){
  check(current.status==='playing','campaign_closed');
  const {actor,type,payload={}}=command,role=bureauRole(current,actor),s=structuredClone(current);
  check(current.players.includes(actor)||role,'unknown_actor');
  check(!current.eventLog.some(e=>e.id===command.id),'duplicate_command');
  check(!type.startsWith('_')&&actor!=='system','server_action_forbidden');
  const player=current.players.includes(actor),free=active(s,actor);
  const privileged=roles=>check(roles.includes(role),'unauthorized_role');
  const pcheck=()=>check(player&&s.roster[actor].status!=='dead','active_character_required');
  switch(type){
    case 'POKER_ACTION': pokerAction(s,actor,payload,now);break;
    case 'START_POKER':
      check(actor===s.hostId,'host_required');check(s.phase>=2,'opening_hand_already_started');
      startPoker(s,{id:command.id,participants:s.players.filter(p=>active(s,p)&&s.roster[p].chips>=5),deck:command.entropy.deck,now});break;
    case 'SLOT_SPIN':spinSlot(s,actor,payload.wager,command.entropy.reels);break;
    case 'TRANSFER_CHIPS':{
      check(free&&s.players.includes(payload.to)&&active(s,payload.to)&&payload.to!==actor,'invalid_transfer');
      check(Number.isSafeInteger(payload.amount)&&payload.amount>0&&payload.amount<=s.roster[actor].chips,'insufficient_chips');
      s.roster[actor].chips-=payload.amount;s.roster[payload.to].chips+=payload.amount;break;
    }
    case 'PLEDGE_SUCCESSION':
      check(free&&s.chapter===1&&s.phase===3&&!s.successionWagers[actor],'succession_wager_unavailable');
      check(s.players.includes(payload.to)&&payload.to!==actor,'invalid_beneficiary');
      s.successionWagers[actor]={to:payload.to,status:'pending'};break;
    case 'ACCEPT_SUCCESSION_WAGER':{
      check(free,'free_character_required');const w=s.successionWagers[payload.from];
      check(w?.to===actor&&w.status==='pending','no_wager_to_accept');w.status='signed';
      // A signed stake transfers the right, not the throne or automatic loyalty.
      w.recordedAt=numberPhase(s);s.claims=s.claims.filter(c=>c.id!==payload.from);break;
    }
    case 'CLAIM_SUCCESSION':
      check(free&&!s.successionWagers[actor]?.status?.includes('signed'),'succession_right_unavailable');
      check(!s.claims.some(c=>c.id===actor),'claim_already_registered');
      s.claims.push({id:actor,status:'contested',claimedAt:{chapter:s.chapter,phase:s.phase}});
      s.roster[actor].reputation=Math.max(0,s.roster[actor].reputation-2);
      s.publicEvents.push({id:command.id,text:`${identity(s,actor)} revendique la succession. Les soutiens restent à négocier.`,phase:numberPhase(s)});break;
    case 'PLEDGE_LOYALTY':
      check(free&&s.roster[payload.to]&&s.roster[payload.to].status!=='dead','invalid_loyalty');
      s.loyalty[actor]=payload.to;s.support[actor]=payload.to;break;
    case 'CLAIM_TERRITORY':{
      check(free,'free_character_required');const t=s.territories[payload.territoryId];check(t,'unknown_territory');
      check(!t.claims.includes(actor),'territory_already_claimed');t.claims.push(actor);break;
    }
    case 'TRANSFER_TERRITORY':{
      check(free,'free_character_required');const t=s.territories[payload.territoryId];check(t?.controller===actor,'territory_controller_required');
      const a=s.agreements[payload.agreementId];
      check(a?.kind==='territory'&&a.status==='signed'&&a.breachedBy.length===0&&a.participants.includes(actor)&&a.participants.includes(payload.to),'signed_territory_agreement_required');
      check(active(s,payload.to)&&t.claims.includes(payload.to),'claiming_recipient_required');t.controller=payload.to;break;
    }
    case 'MESSAGE':{
      check(player,'casino_player_required');check(text(payload.text)&&['cooperate','allies','appeal','contact','witness'].includes(payload.kind),'invalid_message');
      if(s.roster[actor].status==='dead')check(payload.kind==='witness'&&payload.to==='bureau','continuity_witness_only');
      const to=payload.to;
      check(to==='bureau'||s.players.includes(to)||s.privateCanon.npcs.some(n=>n.id===to),'invalid_recipient');
      if(payload.kind==='appeal')check(['interpellated','detained'].includes(s.roster[actor].status),'no_custody_to_appeal');
      s.messages.push({id:command.id,from:actor,to,kind:payload.kind,text:payload.text,phase:numberPhase(s),verified:false});break;
    }
    case 'BUREAU_MESSAGE':
      privileged(['agent','analyst','investigator','prosecutor','judge']);check(text(payload.text)&&s.players.includes(payload.to),'invalid_message');
      s.messages.push({id:command.id,from:actor,to:payload.to,kind:'bureau',text:payload.text,phase:numberPhase(s),verified:false});break;
    case 'NOTE':
      privileged(['agent','analyst','investigator','prosecutor','judge']);check(text(payload.text,3000),'invalid_note');s.privateNotes[actor]=payload.text;break;
    case 'MAP_RELATION':
      privileged(['analyst','investigator']);
      check(s.roster[payload.subject]&&s.roster[payload.target]&&payload.subject!==payload.target&&text(payload.relation,100),'invalid_organigram_relation');
      corroborated(s,payload.subject,payload.evidenceIds,payload.offence);
      s.organigram.push({id:command.id,subject:payload.subject,target:payload.target,relation:payload.relation,evidenceIds:payload.evidenceIds});break;
    case 'REQUEST_INTERPELLATION':
      check(s.chapter>=2,'no_visible_police_operation_yet');privileged(['investigator','prosecutor']);
      corroborated(s,payload.subjectId,payload.evidenceIds,payload.allegedOffence);
      return applyCasinoCommand(current,command);
    case 'DETAIN':
      privileged(['judge']);check(s.chapter===2&&s.phase>=3||s.chapter===3,'detention_not_open');
      check(s.hearings.some(h=>h.subjectId===payload.subjectId&&h.defence!==null),'hearing_required');
      return applyCasinoCommand(current,command);
    case 'OPEN_HEARING':
      privileged(s.bureau.prosecutor?['prosecutor']:['investigator']);check(s.chapter>=2&&s.roster[payload.subjectId]&&text(payload.accusation,1000),'hearing_not_available');
      corroborated(s,payload.subjectId,payload.evidenceIds,payload.offence);
      check(!s.hearings.some(h=>h.subjectId===payload.subjectId),'hearing_already_open');
      s.hearings.push({id:command.id,subjectId:payload.subjectId,accusation:payload.accusation,offence:payload.offence,evidenceIds:payload.evidenceIds,
        defence:s.roster[payload.subjectId].npc?render(s,s.privateCanon.npcDefences[payload.subjectId]):null});break;
    case 'DEFENCE':{
      pcheck();const h=s.hearings.find(h=>h.id===payload.hearingId&&h.subjectId===actor);check(h&&text(payload.text,2000),'hearing_not_available');h.defence=payload.text;break;
    }
    case 'RULING':{
      privileged(['judge']);check(s.chapter===3,'trial_not_open');
      const h=s.hearings.find(h=>h.id===payload.hearingId);check(h&&h.defence!==null,'defence_required');
      check(['acquit','convict','release'].includes(payload.decision)&&text(payload.reasoning,1500),'invalid_ruling');
      check(!s.rulings.some(r=>r.hearingId===h.id),'ruling_already_recorded');
      if(payload.decision==='convict')corroborated(s,h.subjectId,h.evidenceIds,h.offence);
      s.rulings.push({id:command.id,hearingId:h.id,subjectId:h.subjectId,decision:payload.decision,reasoning:payload.reasoning});
      s.roster[h.subjectId].status=payload.decision==='convict'?'detained':'free';break;
    }
    case 'OFFER_CORRUPTION':{
      pcheck();check(s.members.some(m=>m.id===payload.to&&m.role!=='casino')&&text(payload.terms,1000),'invalid_corruption_offer');
      check(Number.isSafeInteger(payload.amount)&&payload.amount>0&&payload.amount<=s.roster[actor].chips,'insufficient_chips');
      s.roster[actor].chips-=payload.amount;s.corruption.push({id:command.id,from:actor,to:payload.to,amount:payload.amount,terms:payload.terms,status:'offered',phase:numberPhase(s)});break;
    }
    case 'ANSWER_CORRUPTION':{
      check(role,'bureau_required');const offer=s.corruption.find(o=>o.id===payload.offerId);check(offer?.to===actor&&offer.status==='offered','invalid_corruption_offer');
      check(typeof payload.accept==='boolean','invalid_corruption_answer');offer.status=payload.accept?'accepted':'refused';
      if(!payload.accept)s.roster[offer.from].chips+=offer.amount;
      // Accepting never deletes evidence, grants powers, or dictates a verdict.
      break;
    }
    case 'ASK_NPC':
      pcheck();check(s.roster[payload.npcId]?.npc&&text(payload.text),'invalid_npc_contact');
      s.motions.push({id:command.id,from:actor,npcId:payload.npcId,text:payload.text});
      s.npcEvents.push({id:command.id,npcId:payload.npcId,to:actor,text:render(s,s.privateCanon.npcs.find(n=>n.id===payload.npcId)?.reply||'Ta demande est consignée. Aucun engagement ne vaut sans reconnaissance des parties.'),phase:numberPhase(s)});break;
    case 'ACCEPT_NPC_OFFER':{
      check(free,'free_character_required');const offer=(s.privateCanon.npcOffers||[]).find(o=>o.id===payload.offerId);
      check(offer&&offerAllowed(s,offer,actor),'npc_offer_unavailable');const npcId=resolveId(s,offer.npcId),price=offer.price||0;
      check(Number.isSafeInteger(price)&&price>=0&&price<=s.roster[actor].chips,'insufficient_chips');
      s.roster[actor].chips-=price;s.roster[npcId].chips+=price;
      if(offer.territoryId)s.territories[offer.territoryId].controller=actor;
      if(offer.support){s.loyalty[npcId]=actor;s.support[npcId]=actor}
      s.usedNpcOffers.push(offer.id);
      s.agreements[command.id]={id:command.id,participants:[actor,npcId],kind:offer.territoryId?'territory':'alliance',visibility:'public',terms:render(s,offer.terms),signatures:[actor,npcId],status:'signed',breachedBy:[]};
      s.publicEvents.push({id:command.id,text:`${identity(s,actor)} et ${identity(s,npcId)} signent : ${render(s,offer.terms)}`,phase:numberPhase(s)});break;
    }
    case 'NPC_MOVE':{
      check(free,'free_character_required');const move=s.privateCanon.moves.find(m=>m.id===payload.moveId);
      check(move&&moveAllowed(s,move,actor),'npc_move_unavailable');const target=resolveId(s,move.target);
      if(move.effect==='nominate'){
        check(s.dragonAuthority&&s.roster.dragon.status==='free'&&s.claims.some(c=>c.id===target),'dragon_lacks_authority');s.namedSuccessor=target;
      }else if(move.effect==='depose'||move.effect==='assassinate'){
        check(s.roster[target]?.status==='free','npc_target_unavailable');s.roster[target].status=move.effect==='assassinate'?'dead':'deposed';
        if(target==='dragon'){s.dragonAuthority=false;s.namedSuccessor=null}
      }else if(move.effect==='reveal'){
        check(Array.isArray(move.evidenceIds),'invalid_authored_reveal');
        for(const id of move.evidenceIds){const e=s.privateCanon.evidence.find(e=>e.id===id);check(e,'invalid_authored_reveal');
          if(!s.evidence.some(x=>x.id===id))s.evidence.push({...render(s,e),subjectId:resolveId(s,e.subjectId),validated:true,origin:'authored'});
        }
      }
      s.usedMoves.push(move.id);s.publicEvents.push({id:move.id,text:render(s,move.publicText||move.label),phase:numberPhase(s)});break;
    }
    case 'ADVANCE_PHASE':{
      check(actor===s.hostId,'host_required');check(s.openingPokerComplete&&s.poker.stage==='settled','finish_poker_first');
      if(s.chapter===1)check(now-s.phaseStartedAt>=s.privateCanon.minimumSocialMs,'minimum_social_time');
      if(s.chapter===3&&s.phase===2)throw Error('use_finish_campaign');
      if(s.chapter===1&&s.phase===3){
        const perfect=s.agentDecisions.length===5&&s.agentDecisions.every(d=>d.correct);
        check(perfect||s.roomLocated||s.fallbackReady,'agent_must_locate_room');
        check(s.roomLocated,'agent_must_locate_room');
      }
      const next=applyCasinoCommand(current,{...command,actor:'system'});
      next.phaseStartedAt=now;releasePhase(next);
      // A separate human judge is optional. In their absence, a recorded
      // adversarial hearing and independent sources precede system custody.
      if(next.chapter===2&&next.phase===3&&!next.bureau.judge){
        for(const h of next.hearings){if(next.roster[h.subjectId]?.status==='interpellated'&&h.defence!==null){
          corroborated(next,h.subjectId,h.evidenceIds,h.offence);
          next.roster[h.subjectId].status='detained';
          next.rulings.push({id:`custody-${h.id}`,subjectId:h.subjectId,decision:'custody',reasoning:'Mesure provisoire distincte de la culpabilité, après audition contradictoire et recoupement de sources indépendantes.'});
        }}
      }
      return next;
    }
    case 'LOCATE_ROOM':
      check(now-s.phaseStartedAt>=s.privateCanon.minimumSocialMs,'minimum_social_time');
      return applyCasinoCommand(current,command);
    case 'FINISH_CAMPAIGN':{
      check(actor===s.hostId&&s.chapter===3&&s.phase===2,'finale_not_open');
      check(!s.hearings.some(h=>h.defence===null),'pending_defence');
      if(s.bureau.judge)check(s.hearings.every(h=>s.rulings.some(r=>r.hearingId===h.id)),'pending_judicial_ruling');
      else for(const h of s.hearings){
        const sources=corroborated(s,h.subjectId,h.evidenceIds,h.offence),rule=s.privateCanon.judicialRules.find(r=>r.offence===h.offence);
        check(rule,'judicial_rule_missing');
        const convict=rule.requiredFacts.every(fact=>sources.some(e=>e.admissible===true&&e.facts?.includes(fact)));
        s.rulings.push({id:`system-${h.id}`,hearingId:h.id,subjectId:h.subjectId,decision:convict?'convict':'acquit',reasoning:render(s,convict?rule.convictionText:rule.acquittalText)});
        s.roster[h.subjectId].status=convict?'detained':'free';
      }
      const supporters=id=>Object.values(s.support).filter(v=>v===id).length;
      const controllers=id=>Object.values(s.territories).filter(t=>t.controller===id).length;
      const candidates=s.claims.filter(c=>s.roster[c.id].status==='free'&&supporters(c.id)>0&&controllers(c.id)>0);
      candidates.sort((a,b)=>supporters(b.id)-supporters(a.id)||controllers(b.id)-controllers(a.id));
      const contested=candidates.length>1&&supporters(candidates[0].id)===supporters(candidates[1].id)&&controllers(candidates[0].id)===controllers(candidates[1].id);
      const dragon=s.roster.dragon;
      const winner=!contested&&candidates[0]?.id||null;
      s.finale={political:s.splitClaim?'split':winner?'recognised_claim':dragon.status==='free'&&s.dragonAuthority?'dragon_retained':'collapse',
        successor:winner,contested,split:s.splitClaim,judicial:s.rulings,organigram:s.organigram.map(e=>({...e,
          corroborated:s.privateCanon.organigram.some(c=>resolveId(s,c.subject)===e.subject&&resolveId(s,c.target)===e.target&&c.relation===e.relation)}))};
      s.status='finished';break;
    }
    default:{
      check(!['SETTLE_POKER','SETTLE_SLOT','VALIDATE_EVIDENCE','AUTHORIZE_FALLBACK','DRAGON_AUTHORITY','DRAGON_NOMINATION'].includes(type),'server_action_forbidden');
      if(['PROPOSE_AGREEMENT','SIGN_AGREEMENT','BREAK_AGREEMENT','SPLIT_FACTION','JOIN_SPLIT'].includes(type))check(free,'free_character_required');
      return applyCasinoCommand(current,command);
    }
  }
  return record(s,command,current);
}
function refreshPolitics(s){
  const cap=n=>Math.max(0,Math.min(100,n));
  for(const c of Object.values(s.roster)){
    const base=s.politicalBase[c.id],territories=Object.values(s.territories).filter(t=>t.controller===c.id).length;
    const alliances=Object.values(s.agreements).filter(a=>a.kind==='alliance'&&a.status==='signed'&&a.breachedBy.length===0&&a.participants.includes(c.id)).length;
    const supporters=Object.entries(s.loyalty).filter(([from,to])=>from!==c.id&&to===c.id).length;
    c.influence=cap(base.influence+territories*8+alliances*3);
    c.legitimacy=cap(base.legitimacy+supporters*4+territories*2+(s.namedSuccessor===c.id&&s.dragonAuthority?10:0));
  }
}
export function applyRuntime(current,command,options){const next=applyRuntimeRules(current,command,options);refreshPolitics(next);return next}
export function tickRuntime(current,now){
  if(current.status!=='playing')return null;
  const s=structuredClone(current);let changed=expirePokerTurn(s,now);
  if(s.chapter===1&&s.phase===3&&!s.fallbackReady&&now-s.phaseStartedAt>=s.privateCanon.minimumSocialMs*2){
    s.fallbackReady=true;changed=true;
  }
  if(!changed)return null;
  return record(s,{id:`tick-${current.revision}`,actor:'system',type:'_TICK',payload:{now}},current);
}
export function viewRuntime(state,viewer){
  const base=casinoView(state,viewer),role=bureauRole(state,viewer),player=state.players.includes(viewer);
  const member=state.members.find(m=>m.id===viewer),p=numberPhase(state);
  const brief=player?state.privateCanon.characters.find(c=>state.cast[c.id]===viewer):null;
  const ownCard=brief?{name:member.name,title:brief.title,brief:brief.brief,objective:brief.objective,
    relations:brief.relations.map(r=>({target:resolveId(state,r.target),text:r.text}))}:{name:member.name,title:role,brief:state.privateCanon.bureau[role]};
  const puzzles=role==='agent'?state.privateCanon.puzzles.flatMap((q,i)=>{
    const phase=i<2?1:i<4?2:3;
    return state.chapter===1&&state.phase===phase&&i===state.agentDecisions.length?[{index:i+1,question:q.question,options:q.options}]:[];
  }):[];
  const corruption=state.corruption.filter(o=>o.from===viewer||o.to===viewer);
  return {...base,status:state.status,viewer:viewer,isHost:viewer===state.hostId,name:member.name,
    ...(role?{evidence:state.evidence.map(({id,subjectId,sourceId,description,offence,independenceGroup})=>({id,subjectId,sourceId,description,offence,independenceGroup})),
      dossiers:(state.privateCanon.publicDossiers||[]).map(d=>({subjectId:resolveId(state,d.subjectId),title:d.title,context:render(state,d.context)}))}:{}),
    participants:state.members.map(({id,name,role})=>({id,name,role})),
    bureauRecipients:state.members.filter(m=>m.role!=='casino').map(({id,name,role})=>({id,name,role})),
    ownCard:render(state,ownCard),characters:base.characters.map(c=>({...c,npc:state.roster[c.id].npc,
      title:state.privateCanon.characters.find(r=>resolveId(state,r.id)===c.id)?.title||''})),
    phaseTitle:state.privateCanon.phases[p-1].title,poker:pokerView(state,viewer),
    slotRules:SLOT_RULES,ownSlotResult:player?state.slotResults[viewer]||null:undefined,
    territories:Object.values(state.territories),loyalty:player?state.loyalty:undefined,
    successionWagers:state.successionWagers,openingPokerComplete:state.openingPokerComplete,
    publicEvents:state.publicEvents,npcEvents:state.npcEvents.filter(e=>!e.to||e.to===viewer),
    messages:state.messages.filter(m=>m.from===viewer||m.to===viewer||role&&m.to==='bureau'),
    hearings:state.hearings.filter(h=>role||h.subjectId===viewer),rulings:state.rulings,
    organigram:role?state.organigram:undefined,ownNote:role?state.privateNotes[viewer]||'':undefined,
    corruption,agentPuzzles:render(state,puzzles),
    fallbackHint:role==='agent'&&state.fallbackReady?render(state,state.privateCanon.fallback.text):undefined,
    npcMoves:player?state.privateCanon.moves.filter(m=>moveAllowed(state,m,viewer)).map(m=>({id:m.id,label:render(state,m.label)})):[],
    npcOffers:player?(state.privateCanon.npcOffers||[]).filter(o=>offerAllowed(state,o,viewer)).map(o=>({id:o.id,label:render(state,o.label),terms:render(state,o.terms),price:o.price||0})):[],
    continuityRole:player&&state.roster[viewer].status==='dead'?'witness':undefined,
    minimumSocialUntil:state.phaseStartedAt+state.privateCanon.minimumSocialMs,
    finale:state.finale?{...state.finale,organigram:role?state.finale.organigram:undefined}:null};
}
