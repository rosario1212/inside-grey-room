-- LE RÉGIME v13 — opt-in integration with the CURRENT v4/v52 runtime.
-- This candidate is a snapshot of the exact existing functions + tightly
-- scoped release-gated branches; all other scenarios follow legacy logic.
-- APPLY only after v13_private_runtime.sql, v13_judicial_runtime.sql,
-- v13_final_scoring.sql, private manuscripts approved and full QA.
-- DO NOT deploy while release flag is false/unreviewed.
-- PATCH igr_v4_min_players
CREATE OR REPLACE FUNCTION public.igr_v4_min_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario in ('032','033','034') and igr_private.igr_regime_v13_release_eligible() then 6
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 6
 when p_scenario between '035' and '039' then 5
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 4
 when p_scenario in ('026','027','028') then 6 /* v703 terror six-person minimum */
 when p_scenario='029' then 5 when p_scenario='030' then 7 when p_scenario='031' then 6
 when p_scenario='032' then 6 when p_scenario='033' then 6 when p_scenario='034' then 7
 when p_scenario in ('001','003','004','005','006') then 4
 when p_scenario='002' then 5
 when p_scenario in ('007','008','009','010','011','012','013','014','015','016') then 5
 when p_scenario='017' then 7 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 13 else 5 end
$function$
;

-- PATCH igr_v4_role_for_seat
CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario in ('032','033','034') AND igr_private.igr_regime_v13_release_eligible() then
   if p_count<6 OR p_count>public.igr_v4_max_players(p_scenario)
     OR p_seat<0 OR p_seat>=p_count THEN
       raise exception 'Regime requires a valid six-to-nine-player configuration';
   end if;
   return (array['enqueteur','analyste','juge','suspect','suspect','suspect','procureur','temoin','journaliste']::text[])[p_seat+1];
 end if;
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 11 then raise exception 'four witness roster requires 6 to 11 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'])[p_seat+1];
 end if;
 if p_scenario between '035' and '039' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario between '040' and '044' then
   return (array['enqueteur','analyste','maitre','suspect','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario in ('026','027','028') then
   -- v703 terror six-person roster
   if p_count<>6 or p_seat not between 0 and 5 then raise exception 'TERREUR requires exactly six players'; end if;
   return (array['enqueteur','analyste','officier_liaison','suspect','suspect','suspect']::text[])[p_seat+1];
 elsif p_scenario='029' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','maitre','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='030' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','maitre','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','maitre','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='031' then
   if p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='032' then
   if p_count=6 then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='033' then
   if p_count=6 then return (array['enqueteur','analyste','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','juge','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','juge','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='034' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 
elsif p_scenario='003' then
   if p_count=6 then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
   elsif p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 
elsif p_scenario in ('007','010','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='008' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='009' then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
 elsif p_scenario='011' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge','expert'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin','maitre','expert'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect','expert','maitre','journaliste'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$
;

-- PATCH igr_v4_start_game
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
  if r.scenario_id in ('026','027','028') then if not igr_private.igr_v695_pin_room(r.code) then raise exception 'TERREUR variants unavailable';end if;end if;
  IF r.scenario_id IN ('032','033','034')
      AND igr_private.igr_regime_v13_release_eligible() THEN
     IF NOT igr_private.igr_regime_v13_pin(r.code) THEN
       RAISE EXCEPTION 'Regime private candidate cannot be pinned';
     END IF;
  END IF;
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
        'video_cut_until', null,
        'regime_v13_active', (r.scenario_id IN ('032','033','034')
         AND igr_private.igr_regime_v13_release_eligible()
         AND EXISTS(SELECT 1 FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code))
      ),
      updated_at = now()
  where code = r.code;

  insert into public.igr_v4_events(room_code, event_type, payload)
  select r.code, 'context', jsonb_build_object('title','CONTEXTE','text',case when r.scenario_id IN ('032','033','034')
   AND EXISTS(SELECT 1 FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code)
   THEN (SELECT private_pack->>'public_briefing' FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code)
   when r.scenario_id='003' then coalesce(igr_private.igr_v220_003_pinned_pack(r.code)->>'context',x.pack->>'context') else x.pack->>'context' end) /* IGR003_PUBLIC_BRIEFING_V232 */
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

-- PATCH igr_v4_build_private_card
CREATE OR REPLACE FUNCTION public.igr_v4_build_private_card(p_room text, p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; base jsonb; rel jsonb; rels jsonb:='[]'::jsonb; q public.igr_v4_players%rowtype; widx int; role_note jsonb;
begin select * into p from public.igr_v4_players where id=p_player_id; select * into r from public.igr_v4_rooms where code=p.room_code; select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; IF r.scenario_id IN ('032','033','034') AND EXISTS(
 SELECT 1 FROM igr_private.igr_regime_v13_rooms rr WHERE rr.room_code=r.code) THEN
 SELECT private_pack INTO pack FROM igr_private.igr_regime_v13_rooms WHERE room_code=r.code;
 IF p.public_role='suspect' AND p.internal_slot BETWEEN 1 AND 3 THEN
   base:=pack->'private_cards'->(p.internal_slot-1);
   RETURN base||jsonb_build_object(
    'title',base->>'identity','context',pack->>'public_briefing',
    'goal',base->>'objective','secret',base->>'what_you_hide',
    'briefing',base->>'what_you_know');
 END IF;
 RETURN public.igr_v4_generic_role_card(p.public_role,pack->>'public_briefing')||
   jsonb_build_object('context',pack->>'public_briefing');
END IF;
 /* IGR_V181_001_SNAPSHOT_igr_v4_build_private_card */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if; if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if; if p.public_role='suspect' then base:=coalesce(pack->'suspects'->greatest(0,p.internal_slot-1),'{}'::jsonb); for rel in select value from jsonb_array_elements(coalesce(pack->'relations'->p.internal_slot::text,'[]'::jsonb)) loop select * into q from public.igr_v4_players where room_code=r.code and public_role='suspect' and internal_slot=(rel->>'slot')::int; if found then rels:=rels||jsonb_build_array(jsonb_build_object('pseudo',q.pseudo,'text',rel->>'text')); end if; end loop; base:=jsonb_set(base,'{relations}',rels,true); else base:=public.igr_v4_generic_role_card(p.public_role,pack->>'context'); role_note:=coalesce(pack->'role_notes'->p.public_role,'{}'::jsonb); base:=base||role_note; if p.public_role='temoin' then select count(*) into widx from public.igr_v4_players w where w.room_code=r.code and w.public_role='temoin' and w.seat_index<=p.seat_index; base:=base||coalesce(pack->'witnesses'->greatest(0,widx-1),'{}'::jsonb); end if; end if; if p.secret_role='espion' then base:=base||jsonb_build_object('secret_mission',coalesce(pack->>'espion_mission','Observe et détourne sans inventer de preuve.')); end if; return base; end $function$
;

-- PATCH igr_v4_emit_trame
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
  v_prior_conf numeric := null; v_prior_accuracy integer := null;
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
  IF v_room.scenario_id IN ('032','033','034')
   AND coalesce((v_room.state->>'regime_v13_active')::boolean,false) THEN
    INSERT INTO public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
    SELECT v_room.code,'trame','roles',ARRAY['enqueteur','analyste','juge','procureur']::text[],
     jsonb_build_object('id',e.value->>'id','title',e.value->>'title',
       'text',e.value->>'text','cycle',v_room.cycle,'source','Registre de Karsane')
    FROM igr_private.igr_regime_v13_rooms rp,
         LATERAL jsonb_array_elements(rp.private_pack->'revelations') e
    WHERE rp.room_code=v_room.code AND e.value->>'kind'='guaranteed'
      AND (e.value->>'min_cycle')::integer=v_room.cycle
      AND NOT EXISTS(SELECT 1 FROM public.igr_v4_events old
       WHERE old.room_code=v_room.code AND old.event_type='trame'
         AND old.payload->>'id'=e.value->>'id');
    RETURN;
  END IF;
  -- v171 031 scheduled evidence
  if v_room.scenario_id='031' and exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then return; end if;
  if v_room.scenario_id='029' and igr_private.igr_v108_029_is_enabled() then return; end if;

  select sp.pack into v_pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id = v_room.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_emit_trame */ if v_room.scenario_id='001' then v_pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_V202_002_PINNED_READ */ if v_room.scenario_id='002' then v_pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(v_room.code),v_pack); end if; /* IGR_003_V221_READER */ if v_room.scenario_id='003' then v_pack:=coalesce(igr_private.igr_v220_003_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='004' then v_pack:=coalesce(igr_private.igr_v230_004_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='005' then v_pack:=coalesce(igr_private.igr_v250_005_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='006' then v_pack:=coalesce(igr_private.igr_v260_006_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='007' then v_pack:=coalesce(igr_private.igr_v281_007_pinned_pack(v_room.code),v_pack);end if; if v_room.scenario_id='008' then v_pack:=igr_private.igr_v301_008_pinned_pack(v_room.code);if v_pack is null then raise exception '008 private snapshot missing';end if;end if; if v_room.scenario_id='009' then v_pack:=igr_private.igr_v331_009_pinned_pack(v_room.code);if v_pack is null then raise exception '009 private snapshot missing';end if;end if; if v_room.scenario_id='010' then v_pack:=igr_private.igr_v351_010_pinned_pack(v_room.code);if v_pack is null then raise exception '010 private snapshot missing';end if;end if; if v_room.scenario_id='011' then v_pack:=igr_private.igr_v371_011_pinned_pack(v_room.code);if v_pack is null then raise exception '011 private snapshot missing';end if;end if; if v_room.scenario_id='012' then v_pack:=igr_private.igr_v391_012_pinned_pack(v_room.code);if v_pack is null then raise exception '012 private snapshot missing';end if;end if; if v_room.scenario_id='013' then v_pack:=igr_private.igr_v411_013_pinned_pack(v_room.code);if v_pack is null then raise exception '013 private snapshot missing';end if;end if; if v_room.scenario_id='014' then v_pack:=igr_private.igr_v431_014_pinned_pack(v_room.code);if v_pack is null then raise exception '014 private snapshot missing';end if;end if; if v_room.scenario_id='015' then v_pack:=igr_private.igr_v451_015_pinned_pack(v_room.code);if v_pack is null then raise exception '015 private snapshot missing';end if;end if; if v_room.scenario_id='016' then v_pack:=igr_private.igr_v481_016_pinned_pack(v_room.code);if v_pack is null then raise exception '016 private snapshot missing';end if;end if; if v_room.scenario_id='017' then v_pack:=igr_private.igr_v521_017_pinned_pack(v_room.code);if v_pack is null then raise exception '017 private snapshot missing';end if;end if; if v_room.scenario_id='018' then v_pack:=igr_private.igr_v541_018_pinned_pack(v_room.code);if v_pack is null then raise exception '018 private snapshot missing';end if;end if; if v_room.scenario_id='019' then v_pack:=igr_private.igr_v571_019_pinned_pack(v_room.code);if v_pack is null then raise exception '019 private snapshot missing';end if;end if; if v_room.scenario_id='020' then v_pack:=igr_private.igr_v601_020_pinned_pack(v_room.code);if v_pack is null then raise exception '020 private snapshot missing';end if;end if; if v_room.scenario_id='020' then perform igr_private.igr_v620_020_emit_evidence(v_room.code);return;end if;

  if v_room.scenario_id in ('026','027','028') then v_pack:=coalesce(igr_private.igr_v695_pinned_pack(v_room.code),v_pack);perform igr_private.igr_v695_emit_guaranteed(v_room.code,v_room.cycle);end if;
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

  if v_room.scenario_id in ('026','027','028') and v_room.cycle>=2 then select (h->>'correct_answers')::int into v_prior_accuracy from jsonb_array_elements(coalesce(v_room.state#>'{terror_v681,history}','[]'::jsonb)) h where (h->>'cycle')::int=v_room.cycle-1 limit 1;v_wanted:=CASE WHEN v_prior_accuracy<=2 THEN 'clarity' WHEN v_prior_accuracy>=5 THEN 'ambiguity' ELSE 'balanced' END;end if;
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

-- PATCH igr_v4_tick
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
 if r.scenario_id IN ('032','033','034')
   AND coalesce((r.state->>'regime_v13_active')::boolean,false) THEN
   if r.phase='closed' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then
     perform igr_private.igr_regime_v13_begin_court(r.code);return;
   end if;
   if r.phase='regime_court' then
     perform igr_private.igr_regime_v13_finish_court(r.code);return;
   end if;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,'audience');end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if r.phase_ends_at is not null and now()>=r.phase_ends_at then if status='active' then perform public.igr_v52_advance(r.code,'timeout'); elsif status='waiting' and public.igr_v44_judge_present(r.code) then
     if r.phase='final_audience' then perform public.igr_v52_advance(r.code,'waiting_timeout');
     else update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0)->>'seconds')::int,180)),state=jsonb_set(jsonb_set(r.state,'{v52_status}',to_jsonb('active'::text),true),'{v705_defense_done}','false'::jsonb,true),updated_at=now() where code=r.code;
     end if;end if;end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$
;

-- PATCH igr_v4_advance_phase
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
;

-- PATCH igr_v4_make_reveal
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
  SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_room));
  IF r.scenario_id IN ('032','033','034') AND
    coalesce((r.state->>'regime_v13_active')::boolean,false) THEN
    RETURN igr_private.igr_regime_v13_make_reveal(r.code);
  END IF;
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
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

  if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;
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

    -- The Front reaches the Grey Room on a failed collective investigation.
    -- All occupants are executed after a terminal FDR victory, whatever their status.
    if r.scenario_id in ('026','027','028')
      and coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
    then
      success:=false;
      achievements:='[]'::jsonb;
      result_text:='Le FDR prend la Grey Room de la dernière capitale libre d Almizia. Tu es capturé, maltraité et exécuté sommairement, sans distinction de rôle ni de fidélité au groupe.';
    end if;
    if p.public_role='officier_liaison' AND r.scenario_id in ('026','027','028') then
      select count(*) into action_count from public.igr_v4_actions cmd
       where cmd.room_code=r.code AND cmd.player_id=p.id
       AND cmd.action_type='terror_v694_military' AND coalesce((cmd.payload->>'auto')::boolean,false)=false;
      success:=exact>=threshold
       AND coalesce((r.state#>>'{terror_v681,controlled}')::int,0)>0
       AND action_count>=1;
      result_text:=CASE WHEN success THEN
        'Tu as personnellement confirmé la majorité des ordres décisifs et préservé la capitale. Le verdict judiciaire est évalué indépendamment.'
       WHEN action_count=0 THEN
        'Tu n as confirmé aucun ordre. Les procédures de sécurité ont limité les dégâts, sans remplacer ton commandement.'
       ELSE
        'Ta mission militaire échoue : le périmètre est perdu ou moins de sept décisions ont été confirmées personnellement.' END;
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
    'terror_finale',case when r.scenario_id in ('026','027','028') then
      jsonb_build_object(
       'organization','Front de la Restauration',
       'city',coalesce(r.state#>>'{terror_v681,city}','la ville'),
       'status',case when false OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
          then 'front_at_gates' else 'evidence_preserved' end,
       'message',case when false OR
          coalesce((r.state#>>'{terror_v681,controlled}')::int,0)=0
         then 'DÉFAITE. Le FDR a pris la Grey Room. Tous les occupants sont faits prisonniers, maltraités puis exécutés sommairement. Le contexte précis dépend du scénario.'
         else 'La Grey Room conserve ses preuves et tient encore un secteur de la capitale. Le FDR demeure une menace, mais sa progression peut être contenue.' end)
      else null end,
    'summary',pack->'truth'->>'summary',
    'responsibilities',resp,
    'results',results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'accuracy',jsonb_build_object('exact',exact,'total',total)
  );
end
$function$
;
