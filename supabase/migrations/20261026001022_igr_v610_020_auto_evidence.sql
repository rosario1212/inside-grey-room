CREATE OR REPLACE FUNCTION public.igr_v4_emit_trame(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_room public.igr_v4_rooms%rowtype;
  v_pack jsonb;
  v_used jsonb;
  v_wanted text := 'balanced';
  v_focus_axis text := '';
  v_prior_conv numeric := null;
  v_prior_conf numeric := null;
  v_trend text := 'stable';
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
  select rr.* into v_room
  from public.igr_v4_rooms rr
  where rr.code = p_room
  for update;
  if not found then return; end if;
  -- v171 031 scheduled evidence
  if v_room.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then return; end if;
  if v_room.scenario_id='029' and igr_private.igr_v108_029_is_enabled() then return; end if;

  select sp.pack into v_pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id = v_room.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_emit_trame */ if v_room.scenario_id='001' then v_pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_V202_002_PINNED_READ */ if v_room.scenario_id='002' then v_pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_003_V221_READER */ if v_room.scenario_id='003' then v_pack:=coalesce(igr_private.igr_v220_003_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='004' then v_pack:=coalesce(igr_private.igr_v230_004_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='005' then v_pack:=coalesce(igr_private.igr_v250_005_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='006' then v_pack:=coalesce(igr_private.igr_v260_006_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='007' then v_pack:=coalesce(igr_private.igr_v281_007_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='008' then v_pack:=igr_private.igr_v301_008_pinned_pack(v_room.code);if v_pack is null then raise exception '008 private snapshot missing';end if;end if; if v_room.scenario_id='009' then v_pack:=igr_private.igr_v331_009_pinned_pack(v_room.code);if v_pack is null then raise exception '009 private snapshot missing';end if;end if; if v_room.scenario_id='010' then v_pack:=igr_private.igr_v351_010_pinned_pack(v_room.code);if v_pack is null then raise exception '010 private snapshot missing';end if;end if; if v_room.scenario_id='011' then v_pack:=igr_private.igr_v371_011_pinned_pack(v_room.code);if v_pack is null then raise exception '011 private snapshot missing';end if;end if; if v_room.scenario_id='012' then v_pack:=igr_private.igr_v391_012_pinned_pack(v_room.code);if v_pack is null then raise exception '012 private snapshot missing';end if;end if; if v_room.scenario_id='013' then v_pack:=igr_private.igr_v411_013_pinned_pack(v_room.code);if v_pack is null then raise exception '013 private snapshot missing';end if;end if; if v_room.scenario_id='014' then v_pack:=igr_private.igr_v431_014_pinned_pack(v_room.code);if v_pack is null then raise exception '014 private snapshot missing';end if;end if; if v_room.scenario_id='015' then v_pack:=igr_private.igr_v451_015_pinned_pack(v_room.code);if v_pack is null then raise exception '015 private snapshot missing';end if;end if; if v_room.scenario_id='016' then v_pack:=igr_private.igr_v481_016_pinned_pack(v_room.code);if v_pack is null then raise exception '016 private snapshot missing';end if;end if; if v_room.scenario_id='017' then v_pack:=igr_private.igr_v521_017_pinned_pack(v_room.code);if v_pack is null then raise exception '017 private snapshot missing';end if;end if; if v_room.scenario_id='018' then v_pack:=igr_private.igr_v541_018_pinned_pack(v_room.code);if v_pack is null then raise exception '018 private snapshot missing';end if;end if; if v_room.scenario_id='019' then v_pack:=igr_private.igr_v571_019_pinned_pack(v_room.code);if v_pack is null then raise exception '019 private snapshot missing';end if;end if; if v_room.scenario_id='020' then v_pack:=igr_private.igr_v601_020_pinned_pack(v_room.code);if v_pack is null then raise exception '020 private snapshot missing';end if;end if;

  v_used := coalesce(v_room.state->'used_trames','{}'::jsonb);

  select
    coalesce(avg(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(avg(coalesce((a.payload->>'confusion')::int,1)),1),
    coalesce(min(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(max(coalesce((a.payload->>'convergence')::int,1)),1),
    coalesce(min(coalesce((a.payload->>'confusion')::int,1)),1),
    coalesce(max(coalesce((a.payload->>'confusion')::int,1)),1),
    count(*)::int
  into v_conv,v_conf,v_conv_min,v_conv_max,v_conf_min,v_conf_max,v_responders
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle and a.action_type='debrief';

  -- End-cycle votes signal which prewritten revelation is helpful, not what is true.
  select coalesce(a.payload->>'axis','') into v_focus_axis
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle and a.action_type='debrief'
    and a.payload->>'axis' in ('chronologie','acces','mobile','materiel','responsabilite')
  group by a.payload->>'axis'
  order by count(*) desc, a.payload->>'axis' asc limit 1;
  select avg((a.payload->>'convergence')::numeric),avg((a.payload->>'confusion')::numeric)
  into v_prior_conv,v_prior_conf
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle-1 and a.action_type='debrief';
  if v_prior_conf is not null and v_conf-v_prior_conf >= .75 then v_trend:='confusion_up';
  elsif v_prior_conv is not null and v_conv-v_prior_conv >= .75 then v_trend:='convergence_up';
  elsif v_prior_conf is not null and v_conf-v_prior_conf <= -.75 then v_trend:='confusion_down';
  elsif v_prior_conv is not null and v_conv-v_prior_conv <= -.75 then v_trend:='convergence_down';
  end if;
  select
    count(*) filter (where a.action_type in ('field','expert','judge'))::int,
    count(*) filter (where a.action_type='field')::int,
    count(*) filter (where a.action_type='expert')::int,
    count(*) filter (where a.action_type='judge')::int,
    count(*) filter (where a.action_type='breaking_news')::int
  into v_strong,v_field_count,v_expert_count,v_judge_count,v_news_count
  from public.igr_v4_actions a
  where a.room_code=v_room.code and a.cycle=v_room.cycle;

  select coalesce(e.payload->>'adaptive_axis',''), coalesce(e.payload->>'adaptive_kind','')
  into v_last_axis,v_last_kind
  from public.igr_v4_events e
  where e.room_code=v_room.code and e.event_type='trame'
  order by e.id desc limit 1;

  v_last_axis:=coalesce(v_last_axis,'');
  v_last_kind:=coalesce(v_last_kind,'');

  if v_responders>=2 and ((v_conv_max-v_conv_min)>=2 or (v_conf_max-v_conf_min)>=2) then
    v_wanted:='balanced';
  elsif coalesce(v_conf,1)>=1.5 and coalesce(v_conv,1)<1.5 then
    v_wanted:='clarity';
  elsif coalesce(v_conv,1)>=1.5 and coalesce(v_conf,1)<1.5 then
    v_wanted:='ambiguity';
  else
    v_wanted:='balanced';
  end if;

  if v_strong>=2 and v_wanted='clarity' and v_conf<2 then v_wanted:='balanced'; end if;

  with raw as (
    select
      (jt.ord-1)::int as idx,
      jt.trame_json,
      coalesce(jt.trame_json->>'kind','balanced') as kind,
      coalesce((jt.trame_json->>'min_cycle')::int,1) as min_cycle,
      coalesce(jt.trame_json->'axes','[]'::jsonb) as axes
    from jsonb_array_elements(coalesce(v_pack->'trames','[]'::jsonb)) with ordinality as jt(trame_json,ord)
    where coalesce((jt.trame_json->>'min_cycle')::int,1)<=v_room.cycle
      and not (v_used ? ((jt.ord-1)::int)::text)
  ), scored as (
    select
      raw.*,
      case when jsonb_array_length(raw.axes)>0 then raw.axes->>0 else '' end as candidate_axis,
      (case when raw.kind=v_wanted then 8 when raw.kind='balanced' then 5 when v_wanted='balanced' then 2 else 0 end
       + case when v_room.cycle=1 and raw.kind='ambiguity' then 2 when v_room.cycle=1 and raw.kind='balanced' then 1 when v_room.cycle=2 and raw.kind='balanced' then 3 when v_room.cycle=2 and raw.kind='ambiguity' then 1 when v_room.cycle=3 and raw.kind='balanced' then 3 when v_room.cycle=3 and raw.kind='clarity' then 2 when v_room.cycle=3 and raw.kind='ambiguity' then -1 else 0 end
       + case when raw.min_cycle=v_room.cycle then 2 else 0 end
       + case when v_focus_axis<>'' and raw.axes ? v_focus_axis then 5 else 0 end
       + case when v_trend='confusion_up' and raw.kind='clarity' then 3
              when v_trend='convergence_up' and raw.kind='ambiguity' then 3 else 0 end
       - case when v_last_kind<>'' and raw.kind=v_last_kind then 1 else 0 end
       - case when v_last_axis<>'' and raw.axes ? v_last_axis then 2 else 0 end
       - case when v_expert_count>0 and raw.axes ? 'materiel' then 2 else 0 end
       - case when v_field_count>0 and raw.axes ? 'acces' then 2 else 0 end
       - case when v_judge_count>0 and raw.axes ? 'responsabilite' then 1 else 0 end
       - case when v_news_count>0 and raw.axes ? 'mobile' then 1 else 0 end
       - case when v_room.cycle=1 and lower(coalesce(raw.trame_json->>'text','')) ~ '(responsable principal|coupable|meurtrier|tueur|a tué|a tue)' then 12 else 0 end
       + random()*1.75) as score
    from raw
  )
  select s.trame_json,s.idx,s.candidate_axis
  into v_selected_trame,v_chosen_idx,v_chosen_axis
  from scored s
  order by s.score desc
  limit 1;

  if v_selected_trame is null or v_chosen_idx is null then return; end if;

  v_used:=v_used||jsonb_build_object(v_chosen_idx::text,true);
  update public.igr_v4_rooms rr
  set state=jsonb_set(rr.state,'{used_trames}',v_used,true),updated_at=now()
  where rr.code=v_room.code;

  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
  values(
    v_room.code,'trame','roles',
    array['enqueteur','analyste','procureur','juge','inspecteur','expert']::text[],
    jsonb_build_object(
      'title',v_selected_trame->>'title','text',v_selected_trame->>'text','cycle',v_room.cycle,
      'adaptive_kind',v_wanted,'adaptive_axis',coalesce(v_chosen_axis,''),'director_focus',coalesce(v_focus_axis,''),'director_trend',v_trend,'director_version','v87-canonical-signal'
    )
  );
end
$function$
;
