-- v772: 1 chosen investigation action per cycle, server timers, phase quizzes.
create or replace function igr_private.igr_v772_one_choice() returns trigger language plpgsql security invoker set search_path='' as $body$
begin
 if exists(select 1 from public.igr_v4_actions a where a.room_code=new.room_code and a.cycle=new.cycle and a.action_type~'^investigation_[0-9]{3}$') then
  raise exception 'Une seule pièce au choix par cycle.';
 end if;
 return new;
end $body$;
drop trigger if exists igr_v772_one_choice on public.igr_v4_actions;
create trigger igr_v772_one_choice before insert on public.igr_v4_actions for each row when (new.action_type~'^investigation_[0-9]{3}$') execute function igr_private.igr_v772_one_choice();

create or replace function igr_private.igr_v772_phase_timer() returns trigger language plpgsql security invoker set search_path='' as $body$
begin
 if new.status='playing' and new.phase in ('interrogation_select','event_select') and new.phase is distinct from old.phase then
  new.phase_ends_at:=now()+interval '60 seconds';
 end if;
 return new;
end $body$;
drop trigger if exists igr_v772_phase_timer on public.igr_v4_rooms;
create trigger igr_v772_phase_timer before update of phase on public.igr_v4_rooms for each row execute function igr_private.igr_v772_phase_timer();

CREATE OR REPLACE FUNCTION public.igr_v13_complete_event(p_room text, p_event text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; st jsonb; used_count int; total_count int; used_types jsonb; history jsonb; inter_count int; confront_count int;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
 st:=coalesce(r.state,'{}'::jsonb); used_count:=coalesce((st->>'event_slots_used')::int,0)+1; total_count:=coalesce((st->>'event_slots_total')::int,0); used_types:=coalesce(st->'event_types_used','[]'::jsonb); history:=coalesce(st->'v13_event_history','[]'::jsonb); inter_count:=coalesce((st->>'event_interrogations')::int,0); confront_count:=coalesce((st->>'confrontations_used')::int,0);
 if p_event='interrogation' then inter_count:=inter_count+1; end if; if p_event='confrontation' then confront_count:=confront_count+1; end if; if p_event not in ('interrogation','confrontation') and not (used_types ? p_event) then used_types:=used_types||to_jsonb(p_event); end if;
 history:=history||jsonb_build_array(jsonb_build_object('cycle',r.cycle,'event',p_event,'ended_at',now())); st:=jsonb_set(st,'{event_slots_used}',to_jsonb(used_count),true); st:=jsonb_set(st,'{event_types_used}',used_types,true); st:=jsonb_set(st,'{event_interrogations}',to_jsonb(inter_count),true); st:=jsonb_set(st,'{confrontations_used}',to_jsonb(confront_count),true); st:=jsonb_set(st,'{v13_event_history}',history,true); st:=st-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
 update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
 if used_count<total_count then perform public.igr_v13_enter_event_select(r.code,total_count,false);
 else update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','QUESTIONNAIRE DE FIN DE CYCLE','text','Répondez individuellement. Les réponses orientent les pièces suivantes.','cycle',r.cycle));
 end if;
end $function$


CREATE OR REPLACE FUNCTION public.igr_v4_tick(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;status text; v_target uuid; v_other uuid; v_token uuid; v_opts jsonb;
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
 if r.scenario_id IN ('032','033','034')
   AND coalesce((r.state->>'regime_v13_active')::boolean,false) THEN
   if r.phase='closed' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then
     perform igr_private.igr_regime_v13_begin_court(r.code);return;
   end if;
   if r.phase='regime_court' then
     perform igr_private.igr_regime_v13_finish_court(r.code);return;
   end if;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,case when public.igr_v44_judge_present(r.code) then 'courtroom' else 'audience' end);end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if r.phase_ends_at is not null and now()>=r.phase_ends_at then if status='active' then perform public.igr_v52_advance(r.code,'timeout'); elsif status='waiting' and public.igr_v44_judge_present(r.code) then
     if r.phase='final_audience' then perform public.igr_v52_advance(r.code,'waiting_timeout');
     else update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0)->>'seconds')::int,180)),state=jsonb_set(jsonb_set(r.state,'{v52_status}',to_jsonb('active'::text),true),'{v705_defense_done}','false'::jsonb,true),updated_at=now() where code=r.code;
     end if;end if;end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;

 -- v772: server-authoritative automatic decision when the lead player is inactive.
 if r.phase in ('interrogation_select','event_select') and r.phase_ends_at is not null and now()>=r.phase_ends_at then
   select p.player_token into v_token from public.igr_v4_players p where p.room_code=r.code and p.public_role='enqueteur' order by p.seat_index limit 1;
   select p.id into v_target from public.igr_v4_players p where p.room_code=r.code and p.public_role='suspect'
     and not (coalesce(r.state->'heard','[]'::jsonb) ? p.id::text) order by random() limit 1;
   if r.phase='interrogation_select' then
      if v_token is not null and v_target is not null then
        update public.igr_v4_rooms set phase_ends_at=now()+interval '5 seconds' where code=r.code;
        perform public.igr_v4_start_interrogation(r.code,v_token,v_target);
      else
        update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes' where code=r.code;
      end if;
      return;
   end if;
   if v_token is not null then
     v_opts:=public.igr_v13_event_options(r.code);
     if v_target is not null and exists(select 1 from jsonb_array_elements(v_opts) e where e->>'key'='interrogation') then
       perform public.igr_v13_start_event(r.code,v_token,'interrogation',array[v_target]); return;
     elsif exists(select 1 from jsonb_array_elements(v_opts) e where e->>'key'='analyse_dossier') then
       perform public.igr_v13_start_event(r.code,v_token,'analyse_dossier',null); return;
     elsif exists(select 1 from jsonb_array_elements(v_opts) e where e->>'key'='assembly') then
       perform public.igr_v13_start_event(r.code,v_token,'assembly',null); return;
     elsif exists(select 1 from jsonb_array_elements(v_opts) e where e->>'key'='confrontation') then
       select p.id into v_target from public.igr_v4_players p where p.room_code=r.code and p.public_role='suspect' order by random() limit 1;
       select p.id into v_other from public.igr_v4_players p where p.room_code=r.code and p.public_role='suspect' and p.id<>v_target order by random() limit 1;
       if v_target is not null and v_other is not null then perform public.igr_v13_start_event(r.code,v_token,'confrontation',array[v_target,v_other]); return; end if;
     end if;
   end if;
   update public.igr_v4_rooms set phase_ends_at=now()+interval '60 seconds' where code=r.code;
   return;
 end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$


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
  if r.scenario_id in ('032','033','034') and
    coalesce((r.state->>'regime_v13_active')::boolean,false) and
    r.phase='regime_court' then
    if r.phase_ends_at is null OR now()<r.phase_ends_at then
      raise exception 'courtroom time has not expired';
    end if;
    perform igr_private.igr_regime_v13_finish_court(r.code);
    return jsonb_build_object('ok',true,'phase','locking');
  end if;
  if r.phase='cycle_debrief' and not exists(select 1 from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=r.code and a.cycle=r.cycle and a.action_type='debrief' and p.public_role='enqueteur') then raise exception 'Questionnaire de l''Enquêteur requis avant le passage manuel.'; end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;
  if r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'defense_current_id'-'defense_current_pseudo'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
  -- v171 final locks
  elsif r.phase='locking' and ((r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) or (r.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=r.code))) then
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
$function$


revoke all on function igr_private.igr_v772_one_choice() from public,anon,authenticated;
revoke all on function igr_private.igr_v772_phase_timer() from public,anon,authenticated;
