-- Scenario 019: pin one approved private variant on game start; send only role-owned cards; grade validated three-axis verdict at final reveal.
-- All legacy scenario handlers remain integrated.
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
  if r.scenario_id='019' then if not igr_private.igr_v571_019_pin_room(r.code) then raise exception '019 variant unavailable';end if;end if; if r.scenario_id='018' then if not igr_private.igr_v541_018_pin_room(r.code) then raise exception '018 sealed variant unavailable';end if;end if; if r.scenario_id='017' then if not igr_private.igr_v521_017_pin_room(r.code) then raise exception '017 unavailable'; end if; end if; if r.scenario_id='016' then
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
$function$


CREATE OR REPLACE FUNCTION public.igr_v4_build_private_card(p_room text, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; base jsonb; rel jsonb; rels jsonb:='[]'::jsonb; q public.igr_v4_players%rowtype; widx int; role_note jsonb;
begin select * into p from public.igr_v4_players where id=p_player_id; select * into r from public.igr_v4_rooms where code=p.room_code; select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_build_private_card */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if p.public_role='suspect' then base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb); for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int; if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if; end loop; base:=jsonb_set(base,'{relations}',rels,true); else base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context'); role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb); base:=base||role_note; if p.public_role='temoin' then select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index; base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb); end if; end if; if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if; return base; end $function$


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
  where sp.scenario_id = v_room.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_emit_trame */ if v_room.scenario_id='001' then v_pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_V202_002_PINNED_READ */ if v_room.scenario_id='002' then v_pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_003_V221_READER */ if v_room.scenario_id='003' then v_pack:=coalesce(igr_private.igr_v220_003_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='004' then v_pack:=coalesce(igr_private.igr_v230_004_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='005' then v_pack:=coalesce(igr_private.igr_v250_005_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='006' then v_pack:=coalesce(igr_private.igr_v260_006_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='007' then v_pack:=coalesce(igr_private.igr_v281_007_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='008' then v_pack:=igr_private.igr_v301_008_pinned_pack(v_room.code);if v_pack is null then raise exception '008 private snapshot missing';end if;end if; if v_room.scenario_id='009' then v_pack:=igr_private.igr_v331_009_pinned_pack(v_room.code);if v_pack is null then raise exception '009 private snapshot missing';end if;end if; if v_room.scenario_id='010' then v_pack:=igr_private.igr_v351_010_pinned_pack(v_room.code);if v_pack is null then raise exception '010 private snapshot missing';end if;end if; if v_room.scenario_id='011' then v_pack:=igr_private.igr_v371_011_pinned_pack(v_room.code);if v_pack is null then raise exception '011 private snapshot missing';end if;end if; if v_room.scenario_id='012' then v_pack:=igr_private.igr_v391_012_pinned_pack(v_room.code);if v_pack is null then raise exception '012 private snapshot missing';end if;end if; if v_room.scenario_id='013' then v_pack:=igr_private.igr_v411_013_pinned_pack(v_room.code);if v_pack is null then raise exception '013 private snapshot missing';end if;end if; if v_room.scenario_id='014' then v_pack:=igr_private.igr_v431_014_pinned_pack(v_room.code);if v_pack is null then raise exception '014 private snapshot missing';end if;end if; if v_room.scenario_id='015' then v_pack:=igr_private.igr_v451_015_pinned_pack(v_room.code);if v_pack is null then raise exception '015 private snapshot missing';end if;end if; if v_room.scenario_id='016' then v_pack:=igr_private.igr_v481_016_pinned_pack(v_room.code);if v_pack is null then raise exception '016 private snapshot missing';end if;end if; if v_room.scenario_id='017' then v_pack:=igr_private.igr_v521_017_pinned_pack(v_room.code);if v_pack is null then raise exception '017 private snapshot missing';end if;end if; if v_room.scenario_id='018' then v_pack:=igr_private.igr_v541_018_pinned_pack(v_room.code);if v_pack is null then raise exception '018 private snapshot missing';end if;end if; if v_room.scenario_id='019' then v_pack:=igr_private.igr_v571_019_pinned_pack(v_room.code);if v_pack is null then raise exception '019 private snapshot missing';end if;end if;

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


CREATE OR REPLACE FUNCTION public.igr_v4_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  s public.igr_v4_players%rowtype;
  p public.igr_v4_players%rowtype;
  q public.igr_v4_players%rowtype;
  enq public.igr_v4_players%rowtype;
  truth_levels jsonb;
  enq_payload jsonb := '{}'::jsonb;
  own_payload jsonb := '{}'::jsonb;
  own_levels jsonb := '{}'::jsonb;
  provisional_payload jsonb := '{}'::jsonb;
  resp jsonb := '[]'::jsonb;
  results jsonb := '[]'::jsonb;
  winners jsonb := '[]'::jsonb;
  achievements jsonb := '[]'::jsonb;
  truth int;
  guess int;
  exact int := 0;
  total int := 0;
  own_exact int;
  own_total int;
  client_count int;
  client_exact int;
  lawyer_count int;
  lawyer_rank int;
  action_count int;
  witness_flags int;
  judge_spent int;
  provisional_exact int;
  threshold int;
  max_cycle_success int;
  success boolean;
  result_role text;
  result_text text;
begin
  -- v171 031 ending
  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then
    return igr_private.igr_v171_031_make_reveal(p_room);
  end if;
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found then raise exception 'room not found'; end if;
  if r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)
   and igr_private.igr_v108_029_is_enabled() then
      return igr_private.igr_v120_029_make_reveal(r.code);
  end if;

  select x.pack into pack
  from public.igr_v4_scenario_packs x
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if;

  truth_levels := coalesce(pack->'truth'->'levels','[]'::jsonb);

  select * into enq
  from public.igr_v4_players
  where room_code=r.code and public_role='enqueteur'
  limit 1;

  select payload into enq_payload
  from public.igr_v4_actions
  where room_code=r.code and player_id=enq.id and action_type='final_lock'
  order by id desc limit 1;
  enq_payload := coalesce(enq_payload->'levels', enq_payload, '{}'::jsonb);

  for s in
    select * from public.igr_v4_players
    where room_code=r.code and public_role='suspect'
    order by internal_slot
  loop
    truth := coalesce((truth_levels->>(s.internal_slot-1))::int,0);
    guess := coalesce((enq_payload->>s.id::text)::int,-1);
    total := total+1;
    if guess=truth then exact:=exact+1; end if;
    resp := resp || jsonb_build_array(
      jsonb_build_object(
        'player_id',s.id,
        'pseudo',s.pseudo,
        'truth_level',truth,
        'enqueteur_level',guess
      )
    );
  end loop;

  threshold := greatest(1,ceil(total*2.0/3.0)::int);

  for p in
    select * from public.igr_v4_players
    where room_code=r.code
    order by seat_index
  loop
    achievements := '[]'::jsonb;
    success := false;
    result_role := p.public_role;
    result_text := 'Objectif non évalué.';

    if p.secret_role='espion' then
      result_role := 'espion';
      success := exact < total;
      result_text := case when success
        then 'L’enquête n’a pas reconstruit parfaitement les responsabilités : ta couverture a tenu.'
        else 'L’enquête a reconstruit toutes les responsabilités : ta mission d’ombre échoue.'
      end;
      if success and exact*2<=total then
        achievements := achievements || jsonb_build_array('espion_ombre');
      end if;

    elsif p.public_role='suspect' then
      truth := coalesce((truth_levels->>(p.internal_slot-1))::int,0);
      guess := coalesce((enq_payload->>p.id::text)::int,-1);
      success := guess=truth;
      result_text := case when success
        then 'La frontière exacte de ta responsabilité a été reconnue.'
        else 'Le verdict a déformé ou manqué ton degré réel de responsabilité.'
      end;
      if success and truth>=2 then
        achievements := achievements || jsonb_build_array('suspect_sous_pression');
      end if;

    elsif p.public_role='maitre' then
      select count(*) into lawyer_count
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre';

      select count(*) into lawyer_rank
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre' and a.seat_index<=p.seat_index;

      client_count:=0;
      client_exact:=0;
      for q in
        select * from public.igr_v4_players c
        where c.room_code=r.code
          and c.public_role='suspect'
          and (lawyer_count=1 or ((c.internal_slot-1)%lawyer_count)=(lawyer_rank-1))
        order by c.internal_slot
      loop
        client_count:=client_count+1;
        truth:=coalesce((truth_levels->>(q.internal_slot-1))::int,0);
        guess:=coalesce((enq_payload->>q.id::text)::int,-1);
        if truth=guess then client_exact:=client_exact+1; end if;
      end loop;
      success := client_count>0 and client_exact=client_count;
      result_text := case when success
        then client_exact||'/'||client_count||' client(s) défendu(s) dans la frontière exacte de leur responsabilité.'
        else client_exact||'/'||client_count||' client(s) correctement défendu(s) au verdict final.'
      end;
      if success and client_count>=2 then
        achievements := achievements || jsonb_build_array('avocat_double_defense');
      end if;

    elsif p.public_role in ('enqueteur','analyste','procureur','juge') then
      if p.public_role='enqueteur' then
        own_exact:=exact;
        own_total:=total;
      else
        select payload into own_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='final_lock'
        order by id desc limit 1;
        own_levels:=coalesce(own_payload->'levels',own_payload,'{}'::jsonb);
        own_exact:=0;
        own_total:=0;
        for s in
          select * from public.igr_v4_players
          where room_code=r.code and public_role='suspect'
          order by internal_slot
        loop
          own_total:=own_total+1;
          truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
          guess:=coalesce((own_levels->>s.id::text)::int,-1);
          if truth=guess then own_exact:=own_exact+1; end if;
        end loop;
      end if;

      success := own_total>0 and own_exact=own_total;

      if p.public_role='enqueteur' then
        result_text := own_exact||'/'||own_total||' responsabilités exactes.';
        select payload into provisional_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='provisional'
        order by id desc limit 1;
        if provisional_payload is not null then
          provisional_exact:=0;
          for s in
            select * from public.igr_v4_players
            where room_code=r.code and public_role='suspect'
          loop
            truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
            guess:=coalesce((provisional_payload->>s.id::text)::int,-1);
            if truth=guess then provisional_exact:=provisional_exact+1; end if;
          end loop;
          if success and provisional_exact=total then
            achievements:=achievements||jsonb_build_array('enq_sans_correction');
          end if;
        end if;

      elsif p.public_role='analyste' then
        result_text := own_exact||'/'||own_total||' responsabilités correctement lues dans ton verrouillage.';
        if success then achievements:=achievements||jsonb_build_array('analyste_parfait'); end if;

      elsif p.public_role='procureur' then
        select count(*) into action_count
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='prosecutor_success';
        success := success and action_count>=1;
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||action_count||' entretien(s) accepté(s).';
        select coalesce(max(c),0) into max_cycle_success from (
          select cycle,count(*) c
          from public.igr_v4_actions
          where room_code=r.code and player_id=p.id and action_type='prosecutor_success'
          group by cycle
        ) z;
        if success and max_cycle_success>=2 then
          achievements:=achievements||jsonb_build_array('procureur_double_entretien');
        end if;

      elsif p.public_role='juge' then
        select coalesce(sum(coalesce((a.payload->>'cost')::int,0)),0) into judge_spent
        from public.igr_v4_actions a
        where a.room_code=r.code and a.player_id=p.id and a.action_type='judge';
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||judge_spent||'/5 points de confidentialité utilisés.';
        if success and judge_spent<=2 then
          achievements:=achievements||jsonb_build_array('juge_confidentiel');
        end if;
      end if;

    elsif p.public_role='journaliste' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='breaking_news';
      select payload into own_payload
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='final_lock'
      order by id desc limit 1;
      success := action_count>=1 and length(trim(coalesce(own_payload->>'note','')))>=8;
      result_text := action_count||' Breaking News publiée(s) · angle final '||
        case when length(trim(coalesce(own_payload->>'note','')))>=8 then 'assumé.' else 'non verrouillé.' end;
      if success and action_count=3 then
        achievements:=achievements||jsonb_build_array('journaliste_trois_unes');
      end if;

    elsif p.public_role='inspecteur' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='field';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' action(s) de terrain · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('inspecteur_trois_pistes');
      end if;

    elsif p.public_role='expert' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='expert';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' analyse(s) technique(s) · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('expert_trois_analyses');
      end if;

    elsif p.public_role='temoin' then
      select count(*) into witness_flags
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text
        and payload->>'status'='suspect';
      success := witness_flags=0;
      result_text := case when success
        then 'Tu n’as jamais été formellement requalifié comme suspect.'
        else 'Tu as été requalifié comme suspect au cours de l’enquête.'
      end;
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text;
      if success and action_count=0 then
        achievements:=achievements||jsonb_build_array('temoin_intouchable');
      end if;

    else
      success := false;
      result_text := 'Aucune condition de victoire n’est définie pour ce rôle.';
    end if;

    -- v170 cartel withdrawal result
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      success:=false; achievements:='[]'::jsonb;
      result_text:='Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Le cartel a fait tuer ta famille.';
    end if;

    if success then
      winners := winners || jsonb_build_array(p.id);
    end if;

    results := results || jsonb_build_array(
      jsonb_build_object(
        'player_id',p.id,
        'pseudo',p.pseudo,
        'role',result_role,
        'public_role',p.public_role,
        'success',success,
        'achievements',achievements,
        'text',result_text
      )
    );
  end loop;

  return jsonb_build_object(
    'title','RÉVÉLATION',
    'summary',pack->'truth'->>'summary',
    'responsibilities',resp,
    'results',results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'accuracy',jsonb_build_object('exact',exact,'total',total)
  );
end
$function$


CREATE OR REPLACE FUNCTION public.igr_v52_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  spy_base jsonb;
  spy_result jsonb;
  base jsonb;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  it jsonb;
  p public.igr_v4_players%rowtype;
  j public.igr_v4_players%rowtype;
  t public.igr_v4_players%rowtype;
  out_results jsonb:='[]';
  winners jsonb:='[]';
  corrupt boolean:=false;
  yes_n int:=0;
  voters int:=0;
  threshold int:=0;
  accused boolean:=false;
  truth int;
  guess int;
  levels jsonb;
  exact_n int;
  total_n int;
  acts int;
  ok boolean;
  absent jsonb;
  camp_ok boolean;
  personal_ok boolean;
  base_personal_ok boolean;
  protections_used int:=0;
begin
  -- v171 031 ending
  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then
    return igr_private.igr_v171_031_make_reveal(p_room);
  end if;
  spy_base:=public.igr_v4_make_reveal(p_room);
  base:=public.igr_v59_reveal_base(p_room);
  select * into r from public.igr_v4_rooms where code=p_room;

  absent:=coalesce(r.state->'v59_absent','[]'::jsonb);
  select sp.pack into pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v52_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if;

  select * into j
  from public.igr_v4_players
  where room_code=p_room and public_role='juge'
  order by seat_index limit 1;

  if j.id is not null then
    corrupt:=coalesce((j.private_state->>'judge_corrupt')::boolean,false);
    protections_used:=public.igr_v44_protection_count(p_room);

    select count(*) into voters
    from public.igr_v4_players pp
    where pp.room_code=p_room
      and pp.public_role in ('enqueteur','analyste','procureur')
      and not (absent ? pp.id::text);

    threshold:=case when voters=0 then 0 else floor(voters/2.0)::int+1 end;

    select count(distinct a.player_id) into yes_n
    from public.igr_v4_actions a
    join public.igr_v4_players pp on pp.id=a.player_id
    where a.room_code=p_room
      and a.action_type='judge_integrity_vote'
      and coalesce((a.payload->>'corrupt')::boolean,false)
      and pp.public_role in ('enqueteur','analyste','procureur')
      and not (absent ? pp.id::text);

    accused:=voters>0 and yes_n>=threshold;

    base:=jsonb_set(
      base,
      '{judge_integrity}',
      coalesce(base->'judge_integrity','{}'::jsonb)
      ||jsonb_build_object(
        'accused',accused,
        'votes_corrupt',yes_n,
        'eligible_voters',voters,
        'required_yes',threshold,
        'correct',accused=corrupt,
        'protections_used',protections_used,
        'protections_limit',3,
        'personal_objective_failed_by_protections',protections_used>=3
      ),
      true
    );
  end if;

  exact_n:=coalesce((base#>>'{camp_investigation,exact}')::int,(base#>>'{accuracy,exact}')::int,0);
  total_n:=coalesce((base#>>'{camp_investigation,total}')::int,(base#>>'{accuracy,total}')::int,0);

  for it in
    select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb))
  loop
    select * into p
    from public.igr_v4_players
    where id=(it->>'player_id')::uuid and room_code=p_room;

    if p.secret_role='espion' then
      select value into spy_result
      from jsonb_array_elements(coalesce(spy_base->'results','[]'::jsonb))
      where value->>'player_id'=p.id::text;
      if spy_result is not null then
        it:=it||jsonb_build_object(
          'success',spy_result->'success',
          'role',spy_result->'role',
          'text',spy_result->'text',
          'achievements',coalesce(spy_result->'achievements','[]'::jsonb)
        );
      end if;

    elsif p.public_role='juge' then
      camp_ok:=coalesce((it->>'camp_success')::boolean,false);
      base_personal_ok:=coalesce((it->>'success')::boolean,false);

      if corrupt then
        select * into t
        from public.igr_v4_players
        where room_code=p_room
          and id::text=j.private_state->>'judge_corruption_target_id'
          and public_role='suspect';

        truth:=coalesce((pack->'truth'->'levels'->>(t.internal_slot-1))::int,-1);

        select a.payload->'levels' into levels
        from public.igr_v4_actions a
        where a.room_code=p_room
          and a.player_id=p.id
          and a.action_type='final_lock'
        order by a.id desc
        limit 1;

        guess:=coalesce((levels->>t.id::text)::int,-1);
        personal_ok:=truth>0
          and guess>=0
          and guess<truth
          and not accused
          and protections_used<3;

        it:=it||jsonb_build_object(
          'success',camp_ok,
          'personal_objective_success',personal_ok,
          'personal_objective_failed_by_protections',protections_used>=3,
          'protections_used',protections_used,
          'protections_limit',3,
          'text',
            'Juge corrompu · camp '||
            case when camp_ok then 'victorieux' else 'défait' end||
            ' · cible '||case when truth>0 and guess>=0 and guess<truth then 'sous-évaluée' else 'non protégée' end||
            ' · corruption '||case when not accused then 'non détectée' else 'détectée' end||
            ' · protections '||protections_used||'/3'||
            case when protections_used>=3 then ' · 3e protection consommée : objectif personnel échoué.' else '.' end,
          'victories',jsonb_build_object(
            'camp',camp_ok,
            'personal',personal_ok,
            'target_protected',truth>0 and guess>=0 and guess<truth,
            'undetected',not accused,
            'protection_limit_respected',protections_used<3,
            'camp_label','Enquête'
          )
        );
      else
        personal_ok:=base_personal_ok and protections_used<3;

        it:=it||jsonb_build_object(
          'success',camp_ok,
          'personal_objective_success',personal_ok,
          'personal_objective_failed_by_protections',protections_used>=3,
          'protections_used',protections_used,
          'protections_limit',3,
          'text',
            'Juge intègre · décision d’autorité : '||exact_n||'/'||total_n||
            ' responsabilités exactes · camp '||
            case when camp_ok then 'victorieux' else 'défait' end||
            ' · protections '||protections_used||'/3'||
            case when protections_used>=3
              then ' · 3e protection consommée : objectif personnel échoué.'
              else ' · objectif personnel '||case when personal_ok then 'réussi.' else 'échoué.' end
            end,
          'victories',jsonb_build_object(
            'camp',camp_ok,
            'personal',personal_ok,
            'exact_decision',base_personal_ok,
            'protection_limit_respected',protections_used<3,
            'camp_label','Enquête'
          )
        );
      end if;

    elsif p.secret_role<>'espion'
      and p.public_role in ('inspecteur','expert')
      and r.scenario_id not in ('021','022','023','024','025')
    then
      select count(*) into acts
      from public.igr_v4_actions a
      where a.room_code=p_room
        and a.player_id=p.id
        and a.action_type=case when p.public_role='inspecteur' then 'field' else 'expert' end;

      ok:=acts>0 and total_n>0 and exact_n>=ceil(total_n*2.0/3.0)::int;
      it:=it||jsonb_build_object(
        'success',ok,
        'text',acts||' action(s) de rôle · décision faisant autorité : '||exact_n||'/'||total_n||' responsabilités exactes.'
      );
      if not ok then it:=jsonb_set(it,'{achievements}','[]'::jsonb,true); end if;
    end if;

    if absent ? p.id::text then
      it:=it||jsonb_build_object(
        'success',false,
        'achievements','[]'::jsonb,
        'absent',true,
        'text','Joueur déclaré absent par l’hôte : objectif final non validé.'
      );
      if p.public_role='juge' then
        it:=jsonb_set(it,'{personal_objective_success}','false'::jsonb,true);
      end if;
    end if;

    -- v170 cartel withdrawal forfeits personal victory
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      it:=it||jsonb_build_object('success',false,'personal_objective_success',false,
        'forfeited',true,'family_fate','killed','achievements','[]'::jsonb,
        'text','Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Informé de ton abandon, le cartel a fait tuer ta famille.');
      if it ? 'victories' then it:=jsonb_set(it,'{victories,personal}','false'::jsonb,true); end if;
    end if;

    if not coalesce((it->>'success')::boolean,false) then
      it:=jsonb_set(it,'{achievements}','[]'::jsonb,true);
    end if;

    out_results:=out_results||jsonb_build_array(it);
    if coalesce((it->>'success')::boolean,false) then
      winners:=winners||jsonb_build_array(p.id);
    end if;
  end loop;

  return igr_private.igr_v577_019_reveal_enrich(p_room,igr_private.igr_v547_018_reveal_enrich(p_room,igr_private.igr_v527_017_reveal_enrich(p_room, igr_private.igr_v487_016_reveal_enrich(p_room, igr_private.igr_v457_015_reveal_enrich(p_room, igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(
    'results',out_results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'absent_players',absent,
    'incomplete_decisions',jsonb_array_length(absent)>0
  )))))))))))));
end
$function$


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
 if r.scenario_id='017' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_017')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_017'))<>3 or not (p_payload->'reconstruction_017' ?& array['act','decision','cover'])) then raise exception 'invalid 017 reconstruction';end if; if r.scenario_id='018' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_018')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_018'))<>3 or not (p_payload->'reconstruction_018' ?& array['killer','tableau','prior_plan']) or coalesce(p_payload->'reconstruction_018'->>'killer','') not in ('resident_1','resident_2') or coalesce(p_payload->'reconstruction_018'->>'tableau','') not in ('resident_1','resident_2') or coalesce(p_payload->'reconstruction_018'->>'prior_plan','') not in ('isolated_confrontation','joint_intimidation')) then raise exception 'invalid 018 reconstruction';end if; if r.scenario_id='019' and p.public_role in ('enqueteur','analyste') and (jsonb_typeof(p_payload->'reconstruction_019')<>'object' or (select count(*) from jsonb_object_keys(p_payload->'reconstruction_019'))<>3 or not (p_payload->'reconstruction_019' ?& array['mandate','knowledge','cover'])) then raise exception 'invalid 019 reconstruction';end if; note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 IF p.public_role='journaliste' AND length(note_text)<(CASE WHEN is_029 THEN 24 ELSE 8 END) THEN RAISE EXCEPTION 'journalist final angle too short';END IF;
 IF note_text<>'' THEN PERFORM igr_private.assert_ugc(note_text,300,false);END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version',case when is_029 then '029-v148' else 'v52' end,'reconstruction_001',case when r.scenario_id='001' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_001' else null end,'reconstruction_002',case when r.scenario_id='002' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_002' else null end,'reconstruction_003',case when r.scenario_id='003' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_003' else null end,'reconstruction_004',case when r.scenario_id='004' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_004' else null end,'reconstruction_005',case when r.scenario_id='005' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_005' else null end,'reconstruction_006',case when r.scenario_id='006' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_006' else null end,'reconstruction_007',case when r.scenario_id='007' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_007' else null end,'reconstruction_008',case when r.scenario_id='008' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_008' else null end,'reconstruction_009',case when r.scenario_id='009' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_009' else null end,'reconstruction_010',case when r.scenario_id='010' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_010' else null end,'reconstruction_011',case when r.scenario_id='011' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_011' else null end,'reconstruction_012',case when r.scenario_id='012' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_012' else null end,'reconstruction_013',case when r.scenario_id='013' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_013' else null end,'reconstruction_014',case when r.scenario_id='014' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_014' else null end,'reconstruction_015',case when r.scenario_id='015' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_015' else null end,'reconstruction_016',case when r.scenario_id='016' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_016' else null end,'reconstruction_017',case when r.scenario_id='017' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_017' else null end,'reconstruction_018',case when r.scenario_id='018' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_018' else null end,'reconstruction_019',case when r.scenario_id='019' and p.public_role in ('enqueteur','analyste') then p_payload->'reconstruction_019' else null end));
 st:=public.igr_v52_maybe_finish(r.code);
 RETURN jsonb_build_object('ok',true)||st;
END $function$

