-- v705: judge-led audience and tribunal with private vote and no forced speech.
-- Based on production function definitions; preserve special 029 result/score rules.

CREATE OR REPLACE FUNCTION public.igr_v52_begin_stage(p_room text, p_stage text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  p public.igr_v4_players%rowtype;
  q jsonb='[]'::jsonb;
  first jsonb;
  phase_name text;
  next_stage text;
  req int;
  vote_req int;
  speech_seconds int;
  defense_seconds int;
  lawyer_id uuid;
  lawyer_pseudo text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;
  speech_seconds:=case when public.igr_v44_judge_present(p_room) then 90 when r.state->>'duration_mode'='short' then 60 else 120 end;
  defense_seconds:=case when public.igr_v44_judge_present(p_room) then 240 when r.state->>'duration_mode'='short' then 120 else 180 end;

  if p_stage='audience' then
    delete from public.igr_v4_actions
    where room_code=p_room
      and action_type in ('final_lock','judge_integrity_vote','v52_audience_initial','v52_audience_spoken','v52_audience_skip','v52_defense_spoken','v52_defense_skip','v52_lawyer_spoken','v52_lawyer_skip');
    for p in
      select * from public.igr_v4_players
      where room_code=p_room and (public.igr_v44_judge_present(p_room) or public_role in ('enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste'))
      order by case public_role when 'enqueteur' then 1 when 'analyste' then 2 when 'inspecteur' then 3 when 'expert' then 4 when 'procureur' then 5 when 'journaliste' then 6 when 'suspect' then 7 when 'maitre' then 8 when 'juge' then 9 else 99 end,seat_index
    loop
      q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role,'seconds',speech_seconds,'required',false));
    end loop;
    phase_name:='final_audience'; next_stage:='defenses';

  elsif p_stage='defenses' then
    for p in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot nulls last,seat_index loop
      lawyer_id:=null; lawyer_pseudo:=null;
      select x.lawyer_id,l.pseudo into lawyer_id,lawyer_pseudo
      from public.igr_v43_lawyer_representations x
      join public.igr_v4_players l on l.id=x.lawyer_id
      where x.room_code=p_room and x.client_id=p.id limit 1;
      q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','suspect','seconds',defense_seconds,'required',false,'lawyer_id',case when lawyer_id is null then null else lawyer_id::text end,'lawyer_pseudo',lawyer_pseudo));
    end loop;
    phase_name:='final_suspect_defenses'; next_stage:='locking';

  elsif p_stage='lawyers' then
    perform public.igr_v52_begin_stage(p_room,'locking'); return;

  elsif p_stage='locking' then
    select count(*) into req from public.igr_v4_players where room_code=p_room and public.igr_v52_investigation_role(public_role);
    if r.scenario_id='029' then vote_req:=0;
    else
      select count(*) into vote_req from public.igr_v4_players
      where room_code=p_room and public_role in ('enqueteur','analyste','procureur')
      and public.igr_v44_judge_present(p_room);
    end if;
    update public.igr_v4_rooms
    set phase='locking',phase_started_at=now(),phase_ends_at=null,
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb('locking'::text),true),'{v52_final_reassessment}','true'::jsonb,true),'{v52_locks_required}',to_jsonb(req),true),'{v52_locks_received}','0'::jsonb,true),'{v52_integrity_required}',to_jsonb(vote_req),true),
        updated_at=now()
    where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,visibility,payload)
    values(p_room,'phase','public',
      case when r.scenario_id='029' then
        jsonb_build_object('title','CONCLUSION · LE CYCLE MORT',
          'text','L’enquête se conclut par le rapport sur Los Salcedo et le quatrième témoin. Chaque membre du camp Enquête confirme sa participation, sans noter les témoins comme des suspects.')
      else jsonb_build_object('title','DÉCISION FINALE',
          'text','Après toutes les défenses : 0 aucune, 1 secondaire, 2 principale. Chaque rôle du camp Enquête verrouille une seule lecture. Aucun nouvel élément ne peut entrer.')
      end);
    return;
  else
    raise exception 'invalid stage';
  end if;

  if jsonb_array_length(q)=0 then perform public.igr_v52_begin_stage(p_room,next_stage); return; end if;
  first:=q->0;
  update public.igr_v4_rooms
  set phase=phase_name,phase_started_at=now(),phase_ends_at=case when public.igr_v44_judge_present(p_room) then now()+interval '25 seconds' else null end,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb(p_stage),true),'{v52_queue}',q,true),'{v52_index}','0'::jsonb,true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(first->>'player_id'),true),'{v52_current_role}',to_jsonb(first->>'role'),true),
      updated_at=now()
  where code=p_room;

  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
  values(p_room,'phase','public',
    case p_stage
      when 'audience' then case when public.igr_v44_judge_present(p_room) then jsonb_build_object('title','AUDIENCE PRÉPARATOIRE','text','Tous les joueurs : 01:30 chacun au maximum, ou Passer. Exprimez vos soupçons, pas de verdict. Le tribunal suit.') else jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max.') end
      else case when r.scenario_id='029' then
        jsonb_build_object('title',case when public.igr_v44_judge_present(p_room) then 'TRIBUNAL · TÉMOINS' else 'PAROLE FINALE DES TÉMOINS' end,
          'text',case when public.igr_v44_judge_present(p_room) then 'Le juge conduit les comparutions de 04:00. Le rapport final spécifique du dossier 029 reste inchangé.' else 'Chaque témoin peut préciser ce qu’il sait, se taire ou demander des éclaircissements. COURT 02:00 / LONG 03:00.' end)
      else jsonb_build_object('title',case when public.igr_v44_judge_present(p_room) then 'TRIBUNAL' else 'DÉFENSES FINALES' end,
          'text',case when public.igr_v44_judge_present(p_room) then 'Par suspect : 02:00 défense et avocat, 01:00 questions, 01:00 réponse. Le juge préside ; chacun peut se taire. Puis vote individuel secret.' else 'Chaque suspect peut parler COURT 02:00 / LONG 03:00 ou passer. Son Avocat officiel partage ce temps ; il n’existe pas de second plaidoyer séparé.' end)
      end
    end
  );
end$function$;


CREATE OR REPLACE FUNCTION public.igr_v52_advance(p_room text, p_reason text DEFAULT 'manual'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; q jsonb; idx int; nxt int; item jsonb; stage text; status text; spoken_type text; next_stage text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
  stage:=r.state->>'v52_stage'; q:=coalesce(r.state->'v52_queue','[]'::jsonb); idx:=coalesce((r.state->>'v52_index')::int,0); item:=q->idx; status:=coalesce(r.state->>'v52_status','waiting');
  spoken_type:=case when stage='audience' then 'v52_audience_spoken' else 'v52_defense_spoken' end;

  if status='active' and item is not null and not exists(select 1 from public.igr_v4_actions where room_code=p_room and player_id=(item->>'player_id')::uuid and action_type=spoken_type) then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(p_room,(item->>'player_id')::uuid,r.cycle,spoken_type,jsonb_build_object('reason',p_reason,'role',item->>'role'));
  end if;

  if status='waiting' and p_reason='waiting_timeout' and item is not null then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(p_room,(item->>'player_id')::uuid,r.cycle,case when stage='audience' then 'v52_audience_skip' else 'v52_defense_skip' end,jsonb_build_object('role',item->>'role','reason','waiting_timeout'));
  end if;
  if r.scenario_id<>'029' and stage='audience' and item->>'role'='journaliste' and not exists(select 1 from public.igr_v4_actions where room_code=p_room and player_id=(item->>'player_id')::uuid and action_type='final_lock') then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(p_room,(item->>'player_id')::uuid,r.cycle,'final_lock',jsonb_build_object('note','Audience finale v67','version','v67'));
  end if;

  nxt:=idx+1;
  if nxt>=jsonb_array_length(q) then
    next_stage:=case when stage='audience' then 'defenses' else 'locking' end;
    perform public.igr_v52_begin_stage(p_room,next_stage); return;
  end if;
  item:=q->nxt;
  update public.igr_v4_rooms
  set phase_started_at=now(),phase_ends_at=case when public.igr_v44_judge_present(p_room) then now()+interval '25 seconds' else null end,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{v52_index}',to_jsonb(nxt),true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(item->>'player_id'),true),'{v52_current_role}',to_jsonb(item->>'role'),true),
      updated_at=now()
  where code=r.code;
end$function$;


CREATE OR REPLACE FUNCTION public.igr_v52_stage_action(p_code text, p_player_token uuid, p_action text, p_levels jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; q jsonb; idx int; item jsonb; stage text; status text; skip_type text;
begin
  perform igr_private.rate_limit('v52_stage',p_player_token::text,30,60);
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  stage:=r.state->>'v52_stage';
  if r.phase not in ('final_audience','final_suspect_defenses') then raise exception 'wrong phase'; end if;
  q:=coalesce(r.state->'v52_queue','[]'::jsonb); idx:=coalesce((r.state->>'v52_index')::int,0); item:=q->idx; status:=coalesce(r.state->>'v52_status','waiting');
  if item is null then raise exception 'no current speaker';end if;
  if item->>'player_id'<>me.id::text and not(stage='defenses' and me.public_role='juge' and public.igr_v44_judge_present(r.code)) then raise exception 'not your turn';end if;

  if status='waiting' and public.igr_v44_judge_present(r.code) and r.phase_ends_at is not null and now()>=r.phase_ends_at then
    perform public.igr_v52_advance(r.code,'waiting_timeout');
    return jsonb_build_object('ok',false,'expired',true);
  end if;
  if p_action='start' then
    if status<>'waiting' then raise exception 'already started'; end if;
    update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((item->>'seconds')::int,120)),state=jsonb_set(jsonb_set(state,'{v52_status}',to_jsonb('active'::text),true),'{v705_defense_done}','false'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_action='skip' then
    if status<>'waiting' then raise exception 'already started'; end if;
    if stage='defenses' and public.igr_v44_judge_present(r.code) then raise exception 'the court must hear the suspect; silence is allowed';end if;
    skip_type:=case when stage='audience' then 'v52_audience_skip' else 'v52_defense_skip' end;
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,skip_type,jsonb_build_object('role',me.public_role));
    perform public.igr_v52_advance(r.code,'skip');
  elsif p_action='defense_done' then
    if stage<>'defenses' or not public.igr_v44_judge_present(r.code) or status<>'active' or me.public_role<>'suspect' or item->>'player_id'<>me.id::text then raise exception 'defense signal forbidden';end if;
    update public.igr_v4_rooms set state=jsonb_set(state,'{v705_defense_done}','true'::jsonb,true),updated_at=now() where code=r.code;
  elsif p_action='end' then
    if status<>'active' then raise exception 'not active'; end if;
    if stage='defenses' and public.igr_v44_judge_present(r.code) then
      if me.public_role<>'juge' then raise exception 'only the judge can close this appearance';end if;
      if not coalesce((r.state->>'v705_defense_done')::boolean,false) and now()<r.phase_started_at+interval '2 minutes' then raise exception 'suspect has the right to two minutes of defense unless they waive it';end if;
    end if;
    perform public.igr_v52_advance(r.code,'manual');
  else raise exception 'invalid action'; end if;
  return jsonb_build_object('ok',true);
end$function$;


CREATE OR REPLACE FUNCTION public.igr_v4_tick(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;status text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;if not found or r.status<>'playing' then return;end if;
 perform public.igr_v44_maintain(r.code);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if coalesce((r.state->>'timer_paused')::boolean,false) and r.state->>'timer_paused_phase'=r.phase and (r.state->>'timer_paused_started_at')::timestamptz=r.phase_started_at then return;end if;
 if r.phase='role_reading' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v4_start_cycle(r.code,1);return;end if;
 if r.phase='initial_debrief' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then perform public.igr_v4_start_cycle(r.code,greatest(1,r.cycle));return;end if;
 if r.phase='investigation_assembly' then
   if r.phase_ends_at is null or now()<r.phase_ends_at then return;end if;
   if r.cycle=1 then update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;else perform public.igr_v13_enter_event_select(r.code,3,true);end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'free_investigation','public',jsonb_build_object('title','ENQUÊTE OUVERTE','text','Les interactions redeviennent libres. Seules les convocations officielles de la Grey Room sont prioritaires.','cycle',r.cycle));return;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,'audience');end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if r.phase_ends_at is not null and now()>=r.phase_ends_at then if status='active' then perform public.igr_v52_advance(r.code,'timeout'); elsif status='waiting' and public.igr_v44_judge_present(r.code) then perform public.igr_v52_advance(r.code,'waiting_timeout');end if;end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$;
