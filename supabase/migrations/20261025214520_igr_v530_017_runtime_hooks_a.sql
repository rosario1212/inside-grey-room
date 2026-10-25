-- 017 runtime hooks, authoritative server-side private pack reader and final lock.
-- This migration intentionally contains no private A/B/C manuscripts.
CREATE OR REPLACE FUNCTION public.igr_v4_build_private_card(p_room text, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; base jsonb; rel jsonb; rels jsonb:='[]'::jsonb; q public.igr_v4_players%rowtype; widx int; role_note jsonb;
begin select * into p from public.igr_v4_players where id=p_player_id; select * into r from public.igr_v4_rooms where code=p.room_code; select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_build_private_card */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if p.public_role='suspect' then base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb); for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int; if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if; end loop; base:=jsonb_set(base,'{relations}',rels,true); else base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context'); role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb); base:=base||role_note; if p.public_role='temoin' then select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index; base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb); end if; end if; if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if; return base; end $function$;

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
  where sp.scenario_id = v_room.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_emit_trame */ if v_room.scenario_id='001' then v_pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_V202_002_PINNED_READ */ if v_room.scenario_id='002' then v_pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_003_V221_READER */ if v_room.scenario_id='003' then v_pack:=coalesce(igr_private.igr_v220_003_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='004' then v_pack:=coalesce(igr_private.igr_v230_004_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='005' then v_pack:=coalesce(igr_private.igr_v250_005_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='006' then v_pack:=coalesce(igr_private.igr_v260_006_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='007' then v_pack:=coalesce(igr_private.igr_v281_007_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='008' then v_pack:=igr_private.igr_v301_008_pinned_pack(v_room.code);if v_pack is null then raise exception '008 private snapshot missing';end if;end if; if v_room.scenario_id='009' then v_pack:=igr_private.igr_v331_009_pinned_pack(v_room.code);if v_pack is null then raise exception '009 private snapshot missing';end if;end if; if v_room.scenario_id='010' then v_pack:=igr_private.igr_v351_010_pinned_pack(v_room.code);if v_pack is null then raise exception '010 private snapshot missing';end if;end if; if v_room.scenario_id='011' then v_pack:=igr_private.igr_v371_011_pinned_pack(v_room.code);if v_pack is null then raise exception '011 private snapshot missing';end if;end if; if v_room.scenario_id='012' then v_pack:=igr_private.igr_v391_012_pinned_pack(v_room.code);if v_pack is null then raise exception '012 private snapshot missing';end if;end if; if v_room.scenario_id='013' then v_pack:=igr_private.igr_v411_013_pinned_pack(v_room.code);if v_pack is null then raise exception '013 private snapshot missing';end if;end if; if v_room.scenario_id='014' then v_pack:=igr_private.igr_v431_014_pinned_pack(v_room.code);if v_pack is null then raise exception '014 private snapshot missing';end if;end if; if v_room.scenario_id='015' then v_pack:=igr_private.igr_v451_015_pinned_pack(v_room.code);if v_pack is null then raise exception '015 private snapshot missing';end if;end if; if v_room.scenario_id='016' then v_pack:=igr_private.igr_v481_016_pinned_pack(v_room.code);if v_pack is null then raise exception '016 private snapshot missing';end if;end if; if v_room.scenario_id='017' then v_pack:=igr_private.igr_v521_017_pinned_pack(v_room.code);if v_pack is null then raise exception '017 private snapshot missing';end if;end if;

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
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_start_game(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  c int;
  p public.igr_v4_players%rowtype;
  spy_id uuid;
  idx int;
  roles text[] := array[]::text[];
  rr text;
  match_no int;
  auto_assigned int := 0;
begin
  select * into r
  from public.igr_v4_rooms
  where code = upper(trim(p_code)) and host_token = p_host_token
  for update;
  if not found then raise exception 'unauthorized'; end if;
  if r.status <> 'lobby' then raise exception 'already started'; end if;
  -- v170 relation reset
  delete from public.igr_v43_lawyer_representations where room_code=r.code;
  delete from public.igr_v43_lawyer_requests where room_code=r.code;
  delete from public.igr_v44_lawyer_consultations where room_code=r.code;
  delete from public.igr_v45_lawyer_dismissals where room_code=r.code;


  select count(*) into c
  from public.igr_v4_players
  where room_code = r.code;
  if c > public.igr_v4_max_players(r.scenario_id) then raise exception 'too many players'; end if;
  if c < public.igr_v4_min_players(r.scenario_id) then raise exception 'not enough players'; end if;

  /* IGR_V181_001_SNAPSHOT_igr_v4_start_game */ if r.scenario_id='001' then if coalesce((igr_private.igr_v183_001_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '001 verified narrative release unavailable'; end if; if not igr_private.igr_v183_001_pin_room_canon(r.code) then raise exception '001 randomized snapshot not available'; end if; end if;
  /* IGR_V202_002_PIN_BEFORE_ROLES */ if r.scenario_id='002' then
    if coalesce((igr_private.igr_v202_002_release_status()->>'release_eligible')::boolean,false) is not true
      then raise exception '002 narrative release blocked'; end if;
    if not igr_private.igr_v202_002_pin_room(r.code)
      then raise exception '002 verified random snapshot unavailable'; end if;
   end if;
  /* IGR_003_V221_PIN_SNAPSHOT */
  if r.scenario_id='003' then
    if coalesce((igr_private.igr_v221_003_release_status()->>'release_eligible')::boolean,false) is not true
      then raise exception '003 editorial security gate rejected';end if;
    if not igr_private.igr_v221_003_pin_room(r.code) then raise exception '003 snapshot unavailable';end if;
  end if;
  if r.scenario_id='004' then
  if coalesce((igr_private.igr_v231_004_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '004 unavailable';end if;
  if not igr_private.igr_v231_004_pin_room(r.code) then raise exception '004 snapshot unavailable';end if;
  end if;
  if r.scenario_id='005' then
   if coalesce((igr_private.igr_v251_005_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '005 release unavailable';end if;
   if not igr_private.igr_v251_005_pin_room(r.code) then raise exception '005 immutable snapshot unavailable';end if;
  end if;
 if r.scenario_id='006' then
 if coalesce((igr_private.igr_v261_006_release_status()->>'release_eligible')::boolean,false) is not true then raise exception '006 unavailable';end if;
 if not igr_private.igr_v261_006_pin_room(r.code) then raise exception '006 snapshot unavailable';end if;
 end if;
  if r.scenario_id='007' then
    if coalesce((igr_private.igr_v281_007_release_status()->>'eligible')::boolean,false) is not true then raise exception '007 variants incomplete: game cannot start';end if;
    if not igr_private.igr_v281_007_pin_room(r.code) then raise exception '007 private canonical snapshot unavailable';end if;
  end if;
  if r.scenario_id='008' then
    if coalesce((igr_private.igr_v301_008_release_status()->>'eligible')::boolean,false) is not true then raise exception '008 gated';end if;
    if not igr_private.igr_v301_008_pin_room(r.code) then raise exception '008 snapshot unavailable';end if;
  end if;
  if r.scenario_id='009' then
    if coalesce((igr_private.igr_v331_009_release_status()->>'eligible')::boolean,false) is not true then raise exception '009 gated';end if;
    if not igr_private.igr_v331_009_pin_room(r.code) then raise exception '009 snapshot unavailable';end if;
  end if;
  if r.scenario_id='010' then
    if coalesce((igr_private.igr_v351_010_release_status()->>'eligible')::boolean,false) is not true then raise exception '010 gated';end if;
    if not igr_private.igr_v351_010_pin_room(r.code) then raise exception '010 snapshot unavailable';end if;
  end if;
  if r.scenario_id='011' then
    if coalesce((igr_private.igr_v371_011_release_status()->>'eligible')::boolean,false) is not true then raise exception '011 gated';end if;
    if not igr_private.igr_v371_011_pin_room(r.code) then raise exception '011 snapshot unavailable';end if;
  end if;
  if r.scenario_id='012' then
    if coalesce((igr_private.igr_v391_012_release_status()->>'eligible')::boolean,false) is not true then raise exception '012 gated';end if;
    if not igr_private.igr_v391_012_pin_room(r.code) then raise exception '012 snapshot unavailable';end if;
  end if;
  if r.scenario_id='013' then
    if coalesce((igr_private.igr_v411_013_release_status()->>'eligible')::boolean,false) is not true then raise exception '013 gated';end if;
    if not igr_private.igr_v411_013_pin_room(r.code) then raise exception '013 snapshot unavailable';end if;
  end if;
  if r.scenario_id='014' then
    if coalesce((igr_private.igr_v431_014_release_status()->>'eligible')::boolean,false) is not true then raise exception '014 gated';end if;
    if not igr_private.igr_v431_014_pin_room(r.code) then raise exception '014 snapshot unavailable';end if;
  end if;
  if r.scenario_id='015' then
    if coalesce((igr_private.igr_v451_015_release_status()->>'eligible')::boolean,false) is not true then raise exception '015 gated';end if;
    if not igr_private.igr_v451_015_pin_room(r.code) then raise exception '015 snapshot unavailable';end if;
  end if;
  if r.scenario_id='017' then if not igr_private.igr_v521_017_pin_room(r.code) then raise exception '017 unavailable'; end if; end if; if r.scenario_id='016' then
    if coalesce((igr_private.igr_v481_016_release_status()->>'eligible')::boolean,false) is not true then raise exception '016 gated';end if;
    if not igr_private.igr_v481_016_pin_room(r.code) then raise exception '016 snapshot unavailable';end if;
  end if;
  for idx in 0..c - 1 loop
    roles := array_append(roles, public.igr_v4_role_for_seat(r.scenario_id, idx, c));
  end loop;

  -- Keep every explicit choice, but remove it from the pool exactly once.
  for p in
    select * from public.igr_v4_players
    where room_code = r.code and preferred_role is not null
    order by seat_index
  loop
    idx := array_position(roles, p.preferred_role);
    if idx is null then
      raise exception 'chosen roles do not match scenario composition';
    end if;
    roles := coalesce(roles[1:idx - 1], array[]::text[])
          || coalesce(roles[idx + 1:array_length(roles, 1)], array[]::text[]);
  end loop;

  -- Players who did not choose receive one of the remaining valid public roles.
  -- Both the players and role slots are shuffled, so no seat has priority.
  for p in
    select * from public.igr_v4_players
    where room_code = r.code and preferred_role is null
    order by gen_random_uuid()
  loop
    if coalesce(array_length(roles, 1), 0) = 0 then
      raise exception 'role allocation failed';
    end if;
    idx := 1 + floor(random() * array_length(roles, 1))::int;
    rr := roles[idx];
    roles := coalesce(roles[1:idx - 1], array[]::text[])
          || coalesce(roles[idx + 1:array_length(roles, 1)], array[]::text[]);
    update public.igr_v4_players
    set preferred_role = rr
    where id = p.id;
    auto_assigned := auto_assigned + 1;
  end loop;

  if coalesce(array_length(roles, 1), 0) <> 0 then
    raise exception 'role allocation failed';
  end if;

  update public.igr_v4_players
  set public_role = preferred_role,
      secret_role = preferred_role,
      ready = false
  where room_code = r.code;

  with ranked as (
    select id, row_number() over (order by gen_random_uuid())::int as slot
    from public.igr_v4_players
    where room_code = r.code and public_role = 'suspect'
  )
  update public.igr_v4_players x
  set internal_slot = ranked.slot
  from ranked
  where x.id = ranked.id;

  if r.scenario_id in ('013','014','016','019','020') then
    select id into spy_id
    from public.igr_v4_players
    where room_code = r.code and public_role = 'suspect'
    order by gen_random_uuid()
    limit 1;
    if spy_id is not null then
      update public.igr_v4_players set secret_role = 'espion' where id = spy_id;
    end if;
  end if;

  for p in select * from public.igr_v4_players where room_code = r.code loop
    update public.igr_v4_players
    set private_state = public.igr_v4_build_private_card(r.code, p.id)
    where id = p.id;
  end loop;

  match_no := greatest(1, coalesce((r.state->>'match_no')::int, 1));
  update public.igr_v4_rooms
  set status = 'playing',
      cycle = 0,
      phase = 'briefing',
      phase_started_at = now(),
      phase_ends_at = now() + interval '28 seconds',
      state = jsonb_build_object(
        'match_no', match_no,
        'heard', '[]'::jsonb,
        'used_trames', '{}'::jsonb,
        'used_news', '{}'::jsonb,
        'annex_queue', '[]'::jsonb,
        'annex_index', 0,
        'video_active', false,
        'video_cut_until', null
      ),
      updated_at = now()
  where code = r.code;

  insert into public.igr_v4_events(room_code, event_type, payload)
  select r.code, 'context', jsonb_build_object('title','CONTEXTE','text',x.pack->>'context')
  from public.igr_v4_scenario_packs x
  where x.scenario_id = r.scenario_id;
  insert into public.igr_v4_events(room_code, event_type, payload)
  values (
    r.code,
    'phase',
    jsonb_build_object(
      'title','BRIEFING DU DOSSIER',
      'text','La musique du lobby s’arrête. Le contexte public est affiché avant la lecture des cartes privées.',
      'auto_assigned_roles', auto_assigned
    )
  );

  perform igr_private.igr_v169_assign_cartel_lawyer(r.code);
  return jsonb_build_object('ok', true, 'auto_assigned_roles', auto_assigned);
end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_lock_final(p_code text, p_player_token uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
 levels jsonb;note_text text;st jsonb;is_029 boolean;
BEGIN
 PERFORM igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 SELECT * INTO p FROM public.igr_v4_players
 WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR NOT (public.igr_v52_investigation_role(p.public_role) OR p.public_role='journaliste')
 THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF r.phase<>'locking' OR NOT coalesce((r.state->>'v52_final_reassessment')::boolean,false)
 THEN RAISE EXCEPTION 'wrong phase'; END IF;
 is_029:=r.scenario_id='029' AND coalesce((r.state->>'cartel029_ready')::boolean,false)
       AND igr_private.igr_v108_029_is_enabled();
 IF exists(SELECT 1 FROM public.igr_v4_actions WHERE room_code=r.code AND player_id=p.id AND action_type='final_lock')
 THEN RAISE EXCEPTION 'already locked'; END IF;
 IF coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text
 THEN RAISE EXCEPTION 'player marked absent'; END IF;
 IF is_029 THEN
   -- No fabricated responsibility levels for four witnesses; the report decides.
   -- Unsubmitted reports count as incomplete, never a permanent lockout.
   levels:='{}'::jsonb;
 ELSIF p.public_role<>'journaliste' THEN
   levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');
 ELSE levels:='{}'::jsonb; END IF;
 IF r.scenario_id='001' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_001' THEN
   IF jsonb_typeof(p_payload->'reconstruction_001')<>'object' OR
     coalesce(p_payload->'reconstruction_001'->>'moment','') NOT IN ('first','second') OR
     coalesce(p_payload->'reconstruction_001'->>'gesture','') NOT IN ('s1_intentional','s2_intentional','s3_accident') OR
     coalesce(p_payload->'reconstruction_001'->>'reframe','') NOT IN ('recording','evidence_moved','third_intervention')
     THEN RAISE EXCEPTION 'invalid reconstruction'; END IF;
 END IF;
 IF r.scenario_id='002' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_002' THEN
   IF jsonb_typeof(p_payload->'reconstruction_002')<>'object' OR
     coalesce(p_payload->'reconstruction_002'->>'central','') NOT IN ('repeated_public_humiliation','explicit_help_request_unanswered','distinct_acts_without_single_culprit') OR
     coalesce(p_payload->'reconstruction_002'->>'evidence','') NOT IN ('repeated_publications','unmade_call_after_note','unread_apology_and_unverified_help') OR
     coalesce(p_payload->'reconstruction_002'->>'boundary','') NOT IN ('no_unique_cause','no_certain_outcome','separate_knowledge')
   THEN RAISE EXCEPTION 'invalid 002 reconstruction'; END IF;
 END IF;
 IF r.scenario_id='003' AND p.public_role in ('enqueteur','analyste') AND p_payload ? 'reconstruction_003' THEN
   IF jsonb_typeof(p_payload->'reconstruction_003')<>'object'
    OR coalesce(p_payload->'reconstruction_003'->>'central','') not in ('maintained_order','validation_erroneous','transfer_without_agreement')
    OR coalesce(p_payload->'reconstruction_003'->>'knowledge','') not in ('active_warning','conflicting_records_known','unsigned_receipt')
    OR coalesce(p_payload->'reconstruction_003'->>'reversal','') not in ('omitted_reservation','error_not_proven_fraud','postincident_rewrite')
    THEN raise exception 'invalid 003 reconstruction'; end if;
 END IF;
 if r.scenario_id='004' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_004')<>'object'
 or coalesce(p_payload->'reconstruction_004'->>'signal','') not in ('explicit_first_call','parallel_messages','misdated_passage')
 or coalesce(p_payload->'reconstruction_004'->>'decision','') not in ('refused_referral','mutual_waiting','early_refusal')
 or coalesce(p_payload->'reconstruction_004'->>'limit','') not in ('no_certain_prevention','no_rescue_assigned','late_visit_no_early_knowledge')
 then raise exception 'invalid 004 reconstruction';end if;
 end if;
 if r.scenario_id='005' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_005')<>'object'
 or coalesce(p_payload->'reconstruction_005'->>'author','') not in ('first_suspect','second_suspect','third_suspect')
 or coalesce(p_payload->'reconstruction_005'->>'mask','') not in ('added_after','present_before','moved_after')
 or coalesce(p_payload->'reconstruction_005'->>'proof','') not in ('late_entry_and_staging','inventory_and_appointment','separate_entries_and_shift')
 then raise exception 'invalid 005 reconstruction';end if;
 end if;
 if r.scenario_id='006' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_006')<>'object' or
 coalesce(p_payload->'reconstruction_006'->>'fall','') not in ('accidental','strike') or
 coalesce(p_payload->'reconstruction_006'->>'response','') not in ('presumed_dead','help_blocked') or
 coalesce(p_payload->'reconstruction_006'->>'lie','') not in ('coordinated_presence','concealed_strike','suppressed_signs')
 then raise exception 'invalid 006 reconstruction';end if;end if;
 if r.scenario_id='007' and p.public_role in ('enqueteur','analyste') then
 if jsonb_typeof(p_payload->'reconstruction_007')<>'object'
 or coalesce(p_payload->'reconstruction_007'->>'cause','') not in ('separate_dispute','debt_confrontation','lineage_document')
 or coalesce(p_payload->'reconstruction_007'->>'actor','') not in ('second_confrontation','third_file_struggle','second_document_struggle')
 or coalesce(p_payload->'reconstruction_007'->>'decoy','') not in ('forced_signature','concealed_debt','hidden_lineage')
 then raise exception 'invalid 007 reconstruction';end if;
 end if;
 if r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_008')<>'object'
   or coalesce(p_payload->'reconstruction_008'->>'incident','') not in ('authorised_removal_confirmed','custody_gap','document_displacement')
   or coalesce(p_payload->'reconstruction_008'->>'responsible','') not in ('slot2_witness_pressure','slot1_custody_breach','slot3_deliberate_move')
   or coalesce(p_payload->'reconstruction_008'->>'decoy','') not in ('slot3_private_arrival','slot3_early_arrival','slot1_false_timesheet')
   or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_008'))<>3
   then raise exception 'invalid 008 reconstruction';end if;
 end if;

 if r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_009')<>'object'
     or coalesce(p_payload->'reconstruction_009'->>'withdrawal','') not in
        ('explicit_before_continuation','original_note_confirmed_explicit')
     or coalesce(p_payload->'reconstruction_009'->>'decision','') not in
        ('director_ordered_continuation','clinician_signed_continuation','director_rewrote_and_blocked_stop')
     or coalesce(p_payload->'reconstruction_009'->>'decoy','') not in
        ('amnesia_does_not_erase_prior_order','supervision_recommended_stop','unauthorized_copy_not_source_of_refusal')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_009'))<>3
   then raise exception 'invalid 009 reconstruction';end if;
 end if;

 if r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_010')<>'object'
     or coalesce(p_payload->'reconstruction_010'->>'origin','') not in
        ('manual_confinement_by_first','accidental_latch_after_maintenance','knowledge_and_order_by_first')
     or coalesce(p_payload->'reconstruction_010'->>'door','') not in
        ('independent_reclose_after_contact','panic_reclose_after_contact','pressured_reclose_after_contact')
     or coalesce(p_payload->'reconstruction_010'->>'signal','') not in
        ('noise_witness_without_identification','credible_warning_read_ignored','unauthorized_presence_misdirection')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_010'))<>3
   then raise exception 'invalid 010 reconstruction';end if;
 end if;

 if r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_011')<>'object'
     or coalesce(p_payload->'reconstruction_011'->>'order','') not in
        ('informed_illegal_authorization','explicit_civilian_limits','general_risk_no_specific_authorization')
     or coalesce(p_payload->'reconstruction_011'->>'field','') not in
        ('abusive_execution_with_local_discretion','unauthorized_expansion_with_self_edited_report','unauthorized_expansion_with_coverup_by_control')
     or coalesce(p_payload->'reconstruction_011'->>'halt','') not in
        ('delayed_despite_first_alert','delayed_after_repeated_warnings','delayed_and_directed_coverup')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_011'))<>3
   then raise exception 'invalid 011 reconstruction';end if;
 end if;

 if r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_012')<>'object'
     or coalesce(p_payload->'reconstruction_012'->>'directive','') not in
        ('ordre_explicite_de_retenir','consigne_de_discussion_detournee','aucun_ordre_initial')
     or coalesce(p_payload->'reconstruction_012'->>'violence','') not in
        ('coups_ajoutes_hors_ordre','coups_pour_imposer_consigne','violences_et_retention_autonomes')
     or coalesce(p_payload->'reconstruction_012'->>'reaction','') not in
        ('direction_assume_retention','chef_averti_mais_inactif','chef_organise_couverture')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_012'))<>3
   then raise exception 'invalid 012 reconstruction';end if;
 end if;

 if r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_013')<>'object'
     or coalesce(p_payload->'reconstruction_013'->>'knowledge','') not in
        ('logistique_savait_violence','logistique_risque_sans_cible','logistique_alerte_et_suspension')
     or coalesce(p_payload->'reconstruction_013'->>'command','') not in
        ('ordre_nominatif_transmis','financeur_nomme_cible_separement','suspension_jamais_confirmee')
     or coalesce(p_payload->'reconstruction_013'->>'security','') not in
        ('acces_vendu_et_journal_retouche_apres','securite_payee_separement','acces_prepare_et_logs_alteres_avant')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_013'))<>3
   then raise exception 'invalid 013 reconstruction';end if;
 end if;

 if r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_014')<>'object'
     or coalesce(p_payload->'reconstruction_014'->>'source','') not in
        ('export_irregulier','procedure_urgence_incomplete','acces_autorise_detourne')
     or coalesce(p_payload->'reconstruction_014'->>'transmission','') not in
        ('vente_volontaire','canal_secours_non_verifie','mandat_emploie_hors_mission')
     or coalesce(p_payload->'reconstruction_014'->>'concealment','') not in
        ('logs_retouches_pour_cacher_faille','alerte_ignoree','fausse_piste_intrusion')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_014'))<>3
   then raise exception 'invalid 014 reconstruction';end if;
 end if;

 if r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_015')<>'object'
     or coalesce(p_payload->'reconstruction_015'->>'authority','') not in
        ('direction_refuse_suspension','direction_autorise_arret','direction_absente_blocage_admin')
     or coalesce(p_payload->'reconstruction_015'->>'continuation','') not in
        ('ordre_de_poursuite_impose','clinicien_poursuit_malgre_arret','sortie_bloquee_administrativement')
     or coalesce(p_payload->'reconstruction_015'->>'records','') not in
        ('alertes_attenuees_apres_deces','compromis_clinique_masque','delai_sortie_efface')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_015'))<>3
   then raise exception 'invalid 015 reconstruction';end if;
 end if;

 if r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then
   if jsonb_typeof(p_payload->'reconstruction_016')<>'object'
     or coalesce(p_payload->'reconstruction_016'->>'after_video','') not in
       ('executant_reste_seul','organisateur_revient_clandestinement','executant_n_appelle_pas_les_secours')
     or coalesce(p_payload->'reconstruction_016'->>'death','') not in
       ('executant_homicide_volontaire','organisateur_homicide_volontaire','deces_violences_sedation_sans_geste_distinct')
     or coalesce(p_payload->'reconstruction_016'->>'warning','') not in
       ('intermediaire_message_trop_tard','intermediaire_ignore_retour','intermediaire_a_ete_induit_en_erreur')
     or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_016'))<>3
   then raise exception 'invalid 016 reconstruction';end if;
 end if;
 if r.scenario_id='017' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_017')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_017'))<>3 or not (p_payload->'reconstruction_017' ?& array['act','decision','cover'])) then raise exception 'invalid 017 reconstruction';end if; note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 IF p.public_role='journaliste' AND length(note_text)<(CASE WHEN is_029 THEN 24 ELSE 8 END) THEN RAISE EXCEPTION 'journalist final angle too short';END IF;
 IF note_text<>'' THEN PERFORM igr_private.assert_ugc(note_text,300,false);END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version',case when is_029 then '029-v148' else 'v52' end,'reconstruction_001',case when r.scenario_id='001' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_001' else null end,'reconstruction_002',case when r.scenario_id='002' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_002' else null end,'reconstruction_003',case when r.scenario_id='003' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_003' else null end,'reconstruction_004',case when r.scenario_id='004' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_004' else null end,'reconstruction_005',case when r.scenario_id='005' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_005' else null end,'reconstruction_006',case when r.scenario_id='006' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_006' else null end,'reconstruction_007',case when r.scenario_id='007' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_007' else null end,'reconstruction_008',case when r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_008' else null end,'reconstruction_009',case when r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_009' else null end,'reconstruction_010',case when r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_010' else null end,'reconstruction_011',case when r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_011' else null end,'reconstruction_012',case when r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_012' else null end,'reconstruction_013',case when r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_013' else null end,'reconstruction_014',case when r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_014' else null end,'reconstruction_015',case when r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_015' else null end,'reconstruction_016',case when r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_016' else null end,'reconstruction_017',case when r.scenario_id='017' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_017' else null end));
 st:=public.igr_v52_maybe_finish(r.code);
 RETURN jsonb_build_object('ok',true)||st;
END $function$;
