-- 017 player-sync, revelation, and forensic access use only locked private evidence packs.
-- No private variants are included in this file.
CREATE OR REPLACE FUNCTION public.igr_v4_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;players jsonb;ev jsonb;suspects jsonb;pack jsonb;my_actions jsonb;protected_meta jsonb;field_meta jsonb;expert_meta jsonb;
begin
 perform igr_private.rate_limit('sync',p_player_token::text,240,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;if not found then raise exception 'unauthorized';end if;
 perform public.igr_v4_tick(p.room_code);
 select * into p from public.igr_v4_players where id=p.id;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_sync */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'public_role',public_role,'preferred_role',preferred_role,'ready',ready,'audio_ready',audio_ready,'avatar_rev',avatar_rev,'has_avatar',avatar_data is not null,'equipped_title',equipped_title,'equipped_badge',equipped_badge) order by seat_index),'[]'::jsonb) into players from public.igr_v4_players where room_code=r.code;
 ev:=public.igr_v4_visible_events(r.code,p);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo) order by seat_index),'[]'::jsonb) into suspects from public.igr_v4_players where room_code=r.code and public_role='suspect';
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'cycle',cycle,'action_type',action_type,'payload',payload,'created_at',created_at) order by id),'[]'::jsonb) into my_actions from public.igr_v4_actions where room_code=r.code and player_id=p.id;
 if p.public_role='juge' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cost',coalesce((v->>'cost')::int,1))),'[]'::jsonb) into protected_meta from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v;else protected_meta:='[]'::jsonb;end if;
 if p.public_role='inspecteur' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into field_meta from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) v;else field_meta:='[]'::jsonb;end if;
 if p.public_role='expert' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into expert_meta from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v;else expert_meta:='[]'::jsonb;end if;
 return jsonb_build_object(
   'server_now',clock_timestamp(),
   'pending_requests',(select coalesce(jsonb_agg(jsonb_build_object('request_id',a.id,'from_pseudo',sender.pseudo) order by a.id),'[]'::jsonb) from public.igr_v4_actions a join public.igr_v4_players sender on sender.id=a.player_id where a.room_code=r.code and a.cycle=r.cycle and r.phase='annex_procureur' and a.action_type='prosecutor_request' and a.payload->>'target'=p.id::text and coalesce(a.payload->>'status','pending')='pending'),
   'room',jsonb_build_object('code',r.code,'scenario_id',r.scenario_id,'status',r.status,'cycle',r.cycle,'phase',r.phase,'phase_started_at',r.phase_started_at,'phase_ends_at',r.phase_ends_at,'state',r.state,'min_players',public.igr_v4_min_players(r.scenario_id),'max_players',public.igr_v4_max_players(r.scenario_id)),
   'player',jsonb_build_object('id',p.id,'pseudo',p.pseudo,'is_host',p.is_host,'ready',p.ready,'audio_ready',p.audio_ready,'public_role',p.public_role,'preferred_role',p.preferred_role,'equipped_title',p.equipped_title,'equipped_badge',p.equipped_badge,'secret_role',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.secret_role else null end,'private_state',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.private_state else '{}'::jsonb end),
   'players',players,'suspects',suspects,'events',ev,'my_actions',my_actions,
   'scenario',jsonb_build_object('context',pack->>'context',
 'investigation_001',case when r.scenario_id='001' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
  then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
    from jsonb_array_elements(coalesce(pack->'investigation_001','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle) else '[]'::jsonb end,
 'investigation_001_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_001'),'investigation_002',case when r.scenario_id='002' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
  then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb) from jsonb_array_elements(coalesce(pack->'investigation_002','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle) else '[]'::jsonb end,
  'investigation_002_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_002'),
  'investigation_003',case when r.scenario_id='003' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
from jsonb_array_elements(coalesce(pack->'investigation_003','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
else '[]'::jsonb end,
'investigation_003_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_003'),
'investigation_004',case when r.scenario_id='004' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
from jsonb_array_elements(coalesce(pack->'investigation_004','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
else '[]'::jsonb end,
'investigation_004_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_004'),
'investigation_005',case when r.scenario_id='005' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb) from jsonb_array_elements(coalesce(pack->'investigation_005','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
else '[]'::jsonb end,
'investigation_005_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_005'),
'investigation_006',case when r.scenario_id='006' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb) from jsonb_array_elements(coalesce(pack->'investigation_006','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
else '[]'::jsonb end,
'investigation_006_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_006'),
'investigation_007',case when r.scenario_id='007' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3
then (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
from jsonb_array_elements(coalesce(pack->'investigation_007','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
else '[]'::jsonb end,
'investigation_007_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_007'),
'investigation_008',case when r.scenario_id='008' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
 from jsonb_array_elements(coalesce(pack->'investigation_008','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_008_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_008'),
'investigation_009',case when r.scenario_id='009' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_009','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_009_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_009'),
'investigation_010',case when r.scenario_id='010' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_010','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_010_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_010'),
'investigation_011',case when r.scenario_id='011' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_011','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_011_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_011'),
'investigation_012',case when r.scenario_id='012' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_012','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_012_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_012'),
'investigation_013',case when r.scenario_id='013' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_013','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_013_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_013'),
'investigation_014',case when r.scenario_id='014' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_014','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_014_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_014'),
'investigation_015',case when r.scenario_id='015' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
  from jsonb_array_elements(coalesce(pack->'investigation_015','[]'::jsonb)) v
  where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_015_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_015'),
'investigation_016',case when r.scenario_id='016' and p.public_role in ('enqueteur','analyste') and r.status='playing' and r.cycle between 1 and 3 then
 (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cycle',(v->>'cycle')::int) order by v->>'id'),'[]'::jsonb)
 from jsonb_array_elements(coalesce(pack->'investigation_016','[]'::jsonb)) v where (v->>'cycle')::int=r.cycle)
 else '[]'::jsonb end,
'investigation_016_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_016'),
'news',case when p.public_role='journaliste' then pack->'news' else '[]'::jsonb end,'protected',protected_meta,'field_actions',field_meta,'expert_actions',expert_meta,'truth',case when r.status='finished' and not (r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) then pack->'truth' else null end)
 );
end
$function$;

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
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if;

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
$function$;

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
  where sp.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v52_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if;

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

  return igr_private.igr_v527_017_reveal_enrich(p_room, igr_private.igr_v487_016_reveal_enrich(p_room, igr_private.igr_v457_015_reveal_enrich(p_room, igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(
    'results',out_results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'absent_players',absent,
    'incomplete_decisions',jsonb_array_length(absent)>0
  )))))))))));
end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v50_expert_state(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; catalog jsonb:='[]'::jsonb; it jsonb; a record; completed jsonb:='[]'::jsonb; used_cycle int; counter_used boolean;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code; select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='017' then pack:=coalesce(igr_private.igr_v521_017_pinned_pack(r.code),pack);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if;
 for it in select value from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) loop IF r.scenario_id in ('016','017') AND r.cycle<coalesce((it->>'min_cycle')::integer,1) THEN CONTINUE; END IF; catalog:=catalog||jsonb_build_array(jsonb_build_object('id',it->>'id','title',it->>'title','min_cycle',coalesce((it->>'min_cycle')::integer,1),'available',r.cycle>=coalesce((it->>'min_cycle')::integer,1),'used',exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' and x.payload->>'choice'=it->>'id'))); end loop;
 for a in select x.id,x.cycle,x.payload from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' order by x.id loop select value into it from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) where value->>'id'=a.payload->>'choice' limit 1; completed:=completed||jsonb_build_array(jsonb_build_object('action_id',a.id,'cycle',a.cycle,'choice',a.payload->>'choice','title',coalesce(it->>'title','Analyse'),'result',coalesce(it->>'result',''),'shared_investigation',coalesce((a.payload->>'shared_investigation')::boolean,false))); end loop;
 select count(*) into used_cycle from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' and x.cycle=r.cycle; counter_used:=exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert_counter');
 return jsonb_build_object('version','v50','cycle',r.cycle,'phase',r.phase,'catalog',catalog,'completed',completed,'used_this_cycle',used_cycle,'can_analyze',r.status='playing' and r.cycle between 1 and 3 and used_cycle=0 and jsonb_array_length(coalesce(pack->'expert_actions','[]'::jsonb))>0 and r.phase not in ('role_reading','investigation_assembly','interrogation','event_confrontation','closed','reveal') and (r.scenario_id not in ('003','009') or r.phase not in ('provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote')),'counter_used',counter_used,'can_counter',r.status='playing' and r.phase not in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') and not counter_used and jsonb_array_length(completed)>0,'observe_official',r.phase in ('interrogation','event_confrontation'));
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v50_expert_analyze(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; item jsonb; aid bigint;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if r.scenario_id in ('003','009','016','017') and r.phase in ('provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote') then raise exception 'expertise closed';end if;
 if r.status<>'playing' or r.cycle not between 1 and 3 or r.phase in ('role_reading','investigation_assembly','interrogation','event_confrontation','closed','reveal') then raise exception 'expert unavailable now'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and cycle=r.cycle and action_type='expert') then raise exception 'cycle limit'; end if;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='017' then pack:=coalesce(igr_private.igr_v521_017_pinned_pack(r.code),pack);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if; select value into item from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) where value->>'id'=p_choice limit 1; if item is null then raise exception 'invalid choice'; end if;
 if r.scenario_id in ('003','009','016','017') and r.cycle<coalesce((item->>'min_cycle')::integer,1) then raise exception 'expertise unlocks in a later cycle';end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='expert' and payload->>'choice'=p_choice) then raise exception 'already used'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'expert',jsonb_build_object('choice',p_choice,'shared_investigation',false)) returning id into aid; insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'expert','private',me.id,jsonb_build_object('title',item->>'title','text',item->>'result','action_id',aid)); return jsonb_build_object('ok',true,'action_id',aid,'title',item->>'title','result',item->>'result');
end $function$;
