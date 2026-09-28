-- Inside Grey Room — auto-assign unselected lobby roles
-- Applied to Supabase production on 2026-09-28.

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

  select count(*) into c
  from public.igr_v4_players
  where room_code = r.code;
  if c > public.igr_v4_max_players(r.scenario_id) then raise exception 'too many players'; end if;
  if c < public.igr_v4_min_players(r.scenario_id) then raise exception 'not enough players'; end if;

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

  return jsonb_build_object('ok', true, 'auto_assigned_roles', auto_assigned);
end
$function$;
