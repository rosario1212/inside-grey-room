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
  if r.scenario_id='020' then if not igr_private.igr_v601_020_pin_room(r.code) then raise exception '020 private dossier unavailable';end if;end if; if r.scenario_id='019' then if not igr_private.igr_v571_019_pin_room(r.code) then raise exception '019 variant unavailable';end if;end if; if r.scenario_id='018' then if not igr_private.igr_v541_018_pin_room(r.code) then raise exception '018 sealed variant unavailable';end if;end if; if r.scenario_id='017' then if not igr_private.igr_v521_017_pin_room(r.code) then raise exception '017 unavailable'; end if; end if; if r.scenario_id='016' then
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
;
