-- Beta v60: host authorization, authoritative pauses, secret-role victory precedence.
CREATE OR REPLACE FUNCTION public.igr_v35_set_duration_mode(p_code text, p_host_token uuid, p_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; v_mode text:=lower(trim(coalesce(p_mode,'')));
begin
 if v_mode not in ('short','long') then raise exception 'invalid duration mode'; end if;
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) for update;
 if not found or p_host_token is null or r.host_token is distinct from p_host_token then raise exception 'forbidden'; end if;
 if r.status<>'lobby' or r.phase<>'lobby' then raise exception 'duration mode locked'; end if;
 update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(v_mode),true),updated_at=now() where code=r.code;
 return jsonb_build_object('ok',true,'mode',v_mode);
end $function$
;
CREATE OR REPLACE FUNCTION public.igr_v4_tick(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;status text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;if not found or r.status<>'playing' then return;end if;
 if coalesce((r.state->>'timer_paused')::boolean,false) and r.state->>'timer_paused_phase'=r.phase and (r.state->>'timer_paused_started_at')::timestamptz=r.phase_started_at then return;end if;
 if r.phase='role_reading' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v4_start_cycle(r.code,1);return;end if;
 if r.phase='initial_debrief' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then perform public.igr_v4_start_cycle(r.code,greatest(1,r.cycle));return;end if;
 if r.phase='investigation_assembly' then
   if r.phase_ends_at is null or now()<r.phase_ends_at then return;end if;
   if r.cycle=1 then update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;else perform public.igr_v13_enter_event_select(r.code,3,true);end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'free_investigation','public',jsonb_build_object('title','ENQUÊTE OUVERTE','text','Les interactions redeviennent libres. Seules les convocations officielles de la Grey Room sont prioritaires.','cycle',r.cycle));return;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,'audience');end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if status='active' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_advance(r.code,'timeout');end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$
;
CREATE OR REPLACE FUNCTION public.igr_v52_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare spy_base jsonb;spy_result jsonb;base jsonb;r public.igr_v4_rooms%rowtype;pack jsonb;it jsonb;p public.igr_v4_players%rowtype;j public.igr_v4_players%rowtype;t public.igr_v4_players%rowtype;out_results jsonb:='[]';winners jsonb:='[]';corrupt boolean:=false;yes_n int:=0;voters int:=0;threshold int:=0;accused boolean:=false;truth int;guess int;levels jsonb;exact_n int;total_n int;acts int;ok boolean;absent jsonb;
begin
 spy_base:=public.igr_v4_make_reveal(p_room);base:=public.igr_v59_reveal_base(p_room);select * into r from public.igr_v4_rooms where code=p_room;
 absent:=coalesce(r.state->'v59_absent','[]'::jsonb);select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 select * into j from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1;
 if j.id is not null then
  corrupt:=coalesce((j.private_state->>'judge_corrupt')::boolean,false);
  select count(*) into voters from public.igr_v4_players pp where pp.room_code=p_room and pp.public_role in ('enqueteur','analyste','procureur') and not (absent ? pp.id::text);
  threshold:=case when voters=0 then 0 else floor(voters/2.0)::int+1 end;
  select count(distinct a.player_id) into yes_n from public.igr_v4_actions a join public.igr_v4_players pp on pp.id=a.player_id where a.room_code=p_room and a.action_type='judge_integrity_vote' and coalesce((a.payload->>'corrupt')::boolean,false) and pp.public_role in ('enqueteur','analyste','procureur') and not (absent ? pp.id::text);
  accused:=voters>0 and yes_n>=threshold;
  base:=jsonb_set(base,'{judge_integrity}',coalesce(base->'judge_integrity','{}'::jsonb)||jsonb_build_object('accused',accused,'votes_corrupt',yes_n,'eligible_voters',voters,'required_yes',threshold,'correct',accused=corrupt),true);
 end if;
 exact_n:=coalesce((base#>>'{camp_investigation,exact}')::int,(base#>>'{accuracy,exact}')::int,0);total_n:=coalesce((base#>>'{camp_investigation,total}')::int,(base#>>'{accuracy,total}')::int,0);
 for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
  select * into p from public.igr_v4_players where id=(it->>'player_id')::uuid and room_code=p_room;
  if p.secret_role='espion' then
   select value into spy_result from jsonb_array_elements(coalesce(spy_base->'results','[]'::jsonb)) where value->>'player_id'=p.id::text;
   if spy_result is not null then it:=it||jsonb_build_object('success',spy_result->'success','role',spy_result->'role','text',spy_result->'text','achievements',coalesce(spy_result->'achievements','[]'::jsonb));end if;
  elsif p.public_role='juge' and corrupt then
   select * into t from public.igr_v4_players where room_code=p_room and id::text=j.private_state->>'judge_corruption_target_id' and public_role='suspect';
   truth:=coalesce((pack->'truth'->'levels'->>(t.internal_slot-1))::int,-1);
   select a.payload->'levels' into levels from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type='final_lock' order by a.id desc limit 1;
   guess:=coalesce((levels->>t.id::text)::int,-1);ok:=truth>0 and guess>=0 and guess<truth and not accused;
   it:=it||jsonb_build_object('success',ok,'achievements','[]'::jsonb,'text','Juge corrompu : réduire la responsabilité retenue de la cible et éviter la majorité des votes de corruption.','victories',jsonb_build_object('target_protected',truth>0 and guess>=0 and guess<truth,'undetected',not accused));
  elsif p.secret_role<>'espion' and p.public_role in ('inspecteur','expert') and r.scenario_id not in ('021','022','023','024','025') then
   select count(*) into acts from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type=case when p.public_role='inspecteur' then 'field' else 'expert' end;
   ok:=acts>0 and total_n>0 and exact_n>=ceil(total_n*2.0/3.0)::int;
   it:=it||jsonb_build_object('success',ok,'text',acts||' action(s) de rôle · décision faisant autorité : '||exact_n||'/'||total_n||' responsabilités exactes.');
   if not ok then it:=jsonb_set(it,'{achievements}','[]'::jsonb,true);end if;
  end if;
  if absent ? p.id::text then it:=it||jsonb_build_object('success',false,'achievements','[]'::jsonb,'absent',true,'text','Joueur déclaré absent par l’hôte : objectif final non validé.');end if;
  if not coalesce((it->>'success')::boolean,false) then it:=jsonb_set(it,'{achievements}','[]'::jsonb,true);end if;
  out_results:=out_results||jsonb_build_array(it);if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array(p.id);end if;
 end loop;
 return base||jsonb_build_object('results',out_results,'winners',winners,'winner_count',jsonb_array_length(winners),'absent_players',absent,'incomplete_decisions',jsonb_array_length(absent)>0);
end$function$
;

-- A corrupt prosecutor must have a responsible target whose level can be reduced.
CREATE OR REPLACE FUNCTION public.igr_v47_ensure_prosecutor_runtime(p_room text, p_prosecutor uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.igr_v4_players%rowtype; pack jsonb; levels jsonb; is_corrupt boolean; target uuid;
begin
 if exists(select 1 from public.igr_v47_prosecutor_runtime x where x.room_code=p_room and x.prosecutor_id=p_prosecutor) then return; end if;
 select * into p from public.igr_v4_players where id=p_prosecutor and room_code=p_room and public_role='procureur'; if not found then return; end if;
 select sp.pack into pack from public.igr_v4_scenario_packs sp join public.igr_v4_rooms r on r.scenario_id=sp.scenario_id where r.code=p_room;
 levels:=coalesce(pack->'truth'->'levels','[]'::jsonb); is_corrupt:=random()<(1.0/3.0);
 if is_corrupt then
  select s.id into target from public.igr_v4_players s where s.room_code=p_room and s.public_role='suspect' and coalesce((levels->>(s.internal_slot-1))::int,0)>=2 order by random() limit 1;
  if target is null then select s.id into target from public.igr_v4_players s where s.room_code=p_room and s.public_role='suspect' and coalesce((levels->>(s.internal_slot-1))::int,0)>0 order by random() limit 1; end if;
  if target is null then is_corrupt:=false;end if;
 end if;
 insert into public.igr_v47_prosecutor_runtime(room_code,prosecutor_id,corrupt,protected_target_id) values(p_room,p_prosecutor,is_corrupt,target) on conflict(room_code,prosecutor_id) do nothing;
end $function$
;
