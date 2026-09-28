-- Inside Grey Room v12.18 — live playtest repair
-- 1) Fix ambiguous trame SQL that rolled back the second debrief submission.
-- 2) Make cycle debrief response-driven instead of timer-driven.
-- 3) Keep host manual skip as an explicit escape hatch.

create or replace function public.igr_v4_emit_trame(p_room text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_room public.igr_v4_rooms%rowtype;
  v_pack jsonb;
  v_used jsonb;
  v_wanted text := 'balanced';
  v_selected_trame jsonb := null;
  v_chosen_idx int := null;
  v_chosen_axis text := '';
  v_last_axis text := '';
  v_last_kind text := '';
  v_conv numeric := 1;
  v_conf numeric := 1;
  v_conv_min int := 1;
  v_conv_max int := 1;
  v_conf_min int := 1;
  v_conf_max int := 1;
  v_responders int := 0;
  v_strong int := 0;
  v_field_count int := 0;
  v_expert_count int := 0;
  v_judge_count int := 0;
  v_news_count int := 0;
begin
  select rr.* into v_room from public.igr_v4_rooms rr where rr.code=p_room for update;
  if not found then return; end if;
  select sp.pack into v_pack from public.igr_v4_scenario_packs sp where sp.scenario_id=v_room.scenario_id;
  v_used:=coalesce(v_room.state->'used_trames','{}'::jsonb);

  select coalesce(avg(coalesce((a.payload->>'convergence')::int,1)),1),
         coalesce(avg(coalesce((a.payload->>'confusion')::int,1)),1),
         coalesce(min(coalesce((a.payload->>'convergence')::int,1)),1),
         coalesce(max(coalesce((a.payload->>'convergence')::int,1)),1),
         coalesce(min(coalesce((a.payload->>'confusion')::int,1)),1),
         coalesce(max(coalesce((a.payload->>'confusion')::int,1)),1),count(*)::int
  into v_conv,v_conf,v_conv_min,v_conv_max,v_conf_min,v_conf_max,v_responders
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle and a.action_type='debrief';

  select count(*) filter (where a.action_type in ('field','expert','judge'))::int,
         count(*) filter (where a.action_type='field')::int,
         count(*) filter (where a.action_type='expert')::int,
         count(*) filter (where a.action_type='judge')::int,
         count(*) filter (where a.action_type='breaking_news')::int
  into v_strong,v_field_count,v_expert_count,v_judge_count,v_news_count
  from public.igr_v4_actions a where a.room_code=v_room.code and a.cycle=v_room.cycle;

  select coalesce(e.payload->>'adaptive_axis',''),coalesce(e.payload->>'adaptive_kind','')
  into v_last_axis,v_last_kind
  from public.igr_v4_events e where e.room_code=v_room.code and e.event_type='trame'
  order by e.id desc limit 1;

  v_last_axis:=coalesce(v_last_axis,''); v_last_kind:=coalesce(v_last_kind,'');
  if v_responders>=2 and ((v_conv_max-v_conv_min)>=2 or (v_conf_max-v_conf_min)>=2) then v_wanted:='balanced';
  elsif coalesce(v_conf,1)>=1.5 and coalesce(v_conv,1)<1.5 then v_wanted:='clarity';
  elsif coalesce(v_conv,1)>=1.5 and coalesce(v_conf,1)<1.5 then v_wanted:='ambiguity';
  else v_wanted:='balanced'; end if;
  if v_strong>=2 and v_wanted='clarity' and v_conf<2 then v_wanted:='balanced'; end if;

  with raw as (
    select (jt.ord-1)::int as idx,jt.trame_json,
           coalesce(jt.trame_json->>'kind','balanced') as kind,
           coalesce((jt.trame_json->>'min_cycle')::int,1) as min_cycle,
           coalesce(jt.trame_json->'axes','[]'::jsonb) as axes
    from jsonb_array_elements(coalesce(v_pack->'trames','[]'::jsonb)) with ordinality as jt(trame_json,ord)
    where coalesce((jt.trame_json->>'min_cycle')::int,1)<=v_room.cycle
      and not (v_used ? ((jt.ord-1)::int)::text)
  ), scored as (
    select raw.*,case when jsonb_array_length(raw.axes)>0 then raw.axes->>0 else '' end as candidate_axis,
      (case when raw.kind=v_wanted then 8 when raw.kind='balanced' then 5 when v_wanted='balanced' then 2 else 0 end
       + case when v_room.cycle=1 and raw.kind='ambiguity' then 2 when v_room.cycle=1 and raw.kind='balanced' then 1 when v_room.cycle=2 and raw.kind='balanced' then 3 when v_room.cycle=2 and raw.kind='ambiguity' then 1 when v_room.cycle=3 and raw.kind='balanced' then 3 when v_room.cycle=3 and raw.kind='clarity' then 2 when v_room.cycle=3 and raw.kind='ambiguity' then -1 else 0 end
       + case when raw.min_cycle=v_room.cycle then 2 else 0 end
       - case when v_last_kind<>'' and raw.kind=v_last_kind then 1 else 0 end
       - case when v_last_axis<>'' and raw.axes ? v_last_axis then 2 else 0 end
       - case when v_expert_count>0 and raw.axes ? 'materiel' then 2 else 0 end
       - case when v_field_count>0 and raw.axes ? 'acces' then 2 else 0 end
       - case when v_judge_count>0 and raw.axes ? 'responsabilite' then 1 else 0 end
       - case when v_news_count>0 and raw.axes ? 'mobile' then 1 else 0 end
       - case when v_room.cycle=1 and lower(coalesce(raw.trame_json->>'text','')) ~ '(responsable principal|coupable|meurtrier|tueur|a tué|a tue)' then 10 else 0 end
       + random()*1.75) as score
    from raw
  )
  select s.trame_json,s.idx,s.candidate_axis into v_selected_trame,v_chosen_idx,v_chosen_axis
  from scored s order by s.score desc limit 1;

  if v_selected_trame is null or v_chosen_idx is null then return; end if;
  v_used:=v_used||jsonb_build_object(v_chosen_idx::text,true);
  update public.igr_v4_rooms rr set state=jsonb_set(rr.state,'{used_trames}',v_used,true),updated_at=now() where rr.code=v_room.code;
  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
  values(v_room.code,'trame','roles',array['enqueteur','analyste','procureur','juge','inspecteur','expert']::text[],
    jsonb_build_object('title',v_selected_trame->>'title','text',v_selected_trame->>'text','cycle',v_room.cycle,'adaptive_kind',v_wanted,'adaptive_axis',coalesce(v_chosen_axis,''),'director_version','v12.18-playtest'));
end
$function$;

create or replace function public.igr_v4_submit_debrief(p_code text,p_player_token uuid,p_convergence integer,p_confusion integer,p_axis text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_player public.igr_v4_players%rowtype; v_room public.igr_v4_rooms%rowtype;
begin
  select pp.* into v_player from public.igr_v4_players pp where pp.room_code=upper(trim(p_code)) and pp.player_token=p_player_token;
  if not found or v_player.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
  select rr.* into v_room from public.igr_v4_rooms rr where rr.code=v_player.room_code for update;
  if v_room.phase<>'cycle_debrief' then raise exception 'wrong phase'; end if;
  if exists(select 1 from public.igr_v4_actions a where a.room_code=v_room.code and a.player_id=v_player.id and a.cycle=v_room.cycle and a.action_type='debrief') then raise exception 'already submitted'; end if;
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(v_room.code,v_player.id,v_room.cycle,'debrief',jsonb_build_object('convergence',greatest(0,least(2,p_convergence)),'confusion',greatest(0,least(2,p_confusion)),'axis',left(coalesce(p_axis,''),32)));
  if not exists(select 1 from public.igr_v4_players pp where pp.room_code=v_room.code and pp.public_role in ('enqueteur','analyste') and not exists(select 1 from public.igr_v4_actions a where a.room_code=v_room.code and a.player_id=pp.id and a.cycle=v_room.cycle and a.action_type='debrief')) then
    perform public.igr_v4_start_next_annex_or_trame(v_room.code);
  end if;
  return jsonb_build_object('ok',true);
end
$function$;

create or replace function public.igr_v4_tick(p_room text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare r public.igr_v4_rooms%rowtype; heard jsonb; target text; suspect_count int; q jsonb; idx int; item jsonb; next_idx int; defq jsonb;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found or r.status<>'playing' then return; end if;
  if r.phase='cycle_debrief' then
    if r.phase_ends_at is not null then update public.igr_v4_rooms set phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code; end if;
    return;
  end if;
  if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;
  if r.phase='briefing' then
    update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'roles_distributed',jsonb_build_object('title','OUVERTURE DU DOSSIER','text','Cartes privées distribuées. Lecture individuelle : 5 minutes.'));
  elsif r.phase='role_reading' then
    update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF INITIAL','text','Enquêteur + Analyste : 3 minutes. Si aucun Analyste n’est présent, l’Enquêteur travaille seul.'));
  elsif r.phase='initial_debrief' then perform public.igr_v4_start_cycle(r.code,1);
  elsif r.phase='interrogation' then
    heard:=coalesce(r.state->'heard','[]'::jsonb); target:=r.state->>'current_target';
    if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
    select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
    if jsonb_array_length(heard)>=suspect_count then
      update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=null,state=(jsonb_set(state,'{heard}',heard,true)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','Enquêteur et Analyste répondent chacun librement sur leur téléphone. Le MJ peut passer le débrief manuellement.'));
    else update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code; end if;
  elsif r.phase like 'annex_%' then perform public.igr_v4_start_next_annex_or_trame(r.code);
  elsif r.phase='trame' then
    if r.cycle<3 then perform public.igr_v4_start_cycle(r.code,r.cycle+1);
    else update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Plus aucune trame, expertise, Breaking News ou action de terrain ne peut être déclenchée.'));
    end if;
  elsif r.phase='closed' then perform public.igr_v4_start_orals(r.code);
  elsif r.phase='provisional_orals' then
    q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::int,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(q) then item:=q->next_idx; update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::int),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
    else update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ACCUSATIONS PROVISOIRES','text','L’Enquêteur verrouille maintenant le degré provisoire de responsabilité de chaque suspect.')); end if;
  elsif r.phase='defense' then
    defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::int,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(defq) then item:=defq->next_idx; update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',state=jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 5 minutes. L’Avocat éventuel partage ce temps.'));
    else update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Enquêteur + Analyste, avec Procureur si présent : 3 minutes. Le Juge reste à l’extérieur.')); end if;
  elsif r.phase='final_debrief' then update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final sur son propre téléphone.'));
  end if;
end
$function$;

create or replace function public.igr_v4_advance_phase(p_code text,p_host_token uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare r public.igr_v4_rooms%rowtype; reveal jsonb; next_phase text;
begin
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status<>'playing' then raise exception 'room is not playing'; end if;
  if r.phase='reveal' then return jsonb_build_object('ok',true,'phase','reveal'); end if;
  if r.phase='interrogation_select' then
    update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'-'current_target'),updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text','Passage manuel au débrief. Enquêteur et Analyste répondent indépendamment.'));
  elsif r.phase='cycle_debrief' then
    update public.igr_v4_rooms set phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code;
    perform public.igr_v4_start_next_annex_or_trame(r.code);
  elsif r.phase='provisional_lock' then
    update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',state=jsonb_set((coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),'{provisional}','{}'::jsonb,true),updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Passage manuel à l’étape suivante.'));
  elsif r.phase='locking' then
    reveal:=public.igr_v4_make_reveal(r.code); update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code; perform public.igr_v4_init_continuation(r.code,reveal); insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  else
    update public.igr_v4_rooms set phase_ends_at=now()-interval '1 second',state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where code=r.code; perform public.igr_v4_tick(r.code);
  end if;
  select phase into next_phase from public.igr_v4_rooms where code=r.code;
  return jsonb_build_object('ok',true,'phase',next_phase);
end
$function$;

update public.igr_v4_rooms set phase_ends_at=null,state=(coalesce(state,'{}'::jsonb)-'timer_paused'-'timer_remaining_seconds'-'timer_paused_phase'-'timer_paused_started_at'),updated_at=now() where status='playing' and phase='cycle_debrief';
