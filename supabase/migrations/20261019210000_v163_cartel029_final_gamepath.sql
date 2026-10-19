-- Only dossier 029: preserve journalist final lock, judge's right to skip, and specialized finalization.
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
  set phase_started_at=now(),phase_ends_at=null,
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
  if item is null or item->>'player_id'<>me.id::text then raise exception 'not your turn'; end if;

  if p_action='start' then
    if status<>'waiting' then raise exception 'already started'; end if;
    update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((item->>'seconds')::int,120)),state=jsonb_set(state,'{v52_status}',to_jsonb('active'::text),true),updated_at=now() where code=r.code;
  elsif p_action='skip' then
    if status<>'waiting' then raise exception 'already started'; end if;
    if stage='audience' and me.public_role='juge' and r.scenario_id<>'029' then raise exception 'judge must speak'; end if;
    skip_type:=case when stage='audience' then 'v52_audience_skip' else 'v52_defense_skip' end;
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,skip_type,jsonb_build_object('role',me.public_role));
    perform public.igr_v52_advance(r.code,'skip');
  elsif p_action='end' then
    if status<>'active' then raise exception 'not active'; end if;
    perform public.igr_v52_advance(r.code,'manual');
  else raise exception 'invalid action'; end if;
  return jsonb_build_object('ok',true);
end$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_advance_phase(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;
  if r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'defense_current_id'-'defense_current_pseudo'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
  elsif r.phase='locking' and r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false) then
    perform public.igr_v52_maybe_finish(r.code);
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  elsif r.phase in ('event_select','interrogation_select') then
    raise exception 'choice required';
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',updated_at=now() where code=r.code;
    perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$function$;
