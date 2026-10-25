-- Dossier 018: sync confidentiality for evidence, expert actions and verdict.
-- Privileged pack never sent to other roles before completion.
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
 select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_sync */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'public_role',public_role,'preferred_role',preferred_role,'ready',ready,'audio_ready',audio_ready,'avatar_rev',avatar_rev,'has_avatar',avatar_data is not null,'equipped_title',equipped_title,'equipped_badge',equipped_badge) order by seat_index),'[]'::jsonb) into players from public.igr_v4_players where room_code=r.code;
 ev:=public.igr_v4_visible_events(r.code,p);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo) order by seat_index),'[]'::jsonb) into suspects from public.igr_v4_players where room_code=r.code and public_role='suspect';
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'cycle',cycle,'action_type',action_type,'payload',payload,'created_at',created_at) order by id),'[]'::jsonb) into my_actions from public.igr_v4_actions where room_code=r.code and player_id=p.id;
 if p.public_role='juge' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cost',coalesce((v->>'cost')::int,1))),'[]'::jsonb) into protected_meta from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v;else protected_meta:='[]'::jsonb;end if;
 if p.public_role='inspecteur' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into field_meta from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) v;else field_meta:='[]'::jsonb;end if;
 if p.public_role='expert' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into expert_meta from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v where (r.scenario_id not in ('016','017','018') or coalesce((v->>'min_cycle')::integer,1)<=r.cycle);else expert_meta:='[]'::jsonb;end if;
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
'investigation_017',case when r.scenario_id='017' and r.status='playing' and p.public_role in ('enqueteur','analyste') then (select coalesce(jsonb_agg(jsonb_build_object('id',i->>'id','title',i->>'title')),'[]'::jsonb) from jsonb_array_elements(coalesce(pack->'investigation_017','[]'::jsonb)) i where (i->>'cycle')::integer=r.cycle) else '[]'::jsonb end, 'investigation_017_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_017'), 'investigation_018',case when r.scenario_id='018' and r.status='playing' and r.cycle between 1 and 3 and p.public_role in ('enqueteur','analyste') then (select coalesce(jsonb_agg(jsonb_build_object('id',e->>'id','title',e->>'title') order by e->>'id'),'[]'::jsonb) from jsonb_array_elements(coalesce(pack->'investigation_018','[]'::jsonb)) e where (e->>'cycle')::integer=r.cycle) else '[]'::jsonb end,'investigation_018_used',exists(select 1 from public.igr_v4_actions a where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_018'),'news',case when p.public_role='journaliste' then pack->'news' else '[]'::jsonb end,'protected',protected_meta,'field_actions',field_meta,'expert_actions',expert_meta,'truth',case when r.status='finished' and not (r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) then pack->'truth' else null end)
 );
end
$function$
;

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
 if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='017' then pack:=coalesce(igr_private.igr_v521_017_pinned_pack(r.code),pack);elsif r.scenario_id='018' then pack:=coalesce(igr_private.igr_v541_018_pinned_pack(r.code),pack);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if;
 for it in select value from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) loop IF r.scenario_id in ('016','017','018') AND r.cycle<coalesce((it->>'min_cycle')::integer,1) THEN CONTINUE; END IF; catalog:=catalog||jsonb_build_array(jsonb_build_object('id',it->>'id','title',it->>'title','min_cycle',coalesce((it->>'min_cycle')::integer,1),'available',r.cycle>=coalesce((it->>'min_cycle')::integer,1),'used',exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' and x.payload->>'choice'=it->>'id'))); end loop;
 for a in select x.id,x.cycle,x.payload from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' order by x.id loop select value into it from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) where value->>'id'=a.payload->>'choice' limit 1; completed:=completed||jsonb_build_array(jsonb_build_object('action_id',a.id,'cycle',a.cycle,'choice',a.payload->>'choice','title',coalesce(it->>'title','Analyse'),'result',coalesce(it->>'result',''),'shared_investigation',coalesce((a.payload->>'shared_investigation')::boolean,false))); end loop;
 select count(*) into used_cycle from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert' and x.cycle=r.cycle; counter_used:=exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='expert_counter');
 return jsonb_build_object('version','v50','cycle',r.cycle,'phase',r.phase,'catalog',catalog,'completed',completed,'used_this_cycle',used_cycle,'can_analyze',r.status='playing' and r.cycle between 1 and 3 and used_cycle=0 and jsonb_array_length(coalesce(pack->'expert_actions','[]'::jsonb))>0 and r.phase not in ('role_reading','investigation_assembly','interrogation','event_confrontation','closed','reveal') and (r.scenario_id not in ('003','009') or r.phase not in ('provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote')),'counter_used',counter_used,'can_counter',r.status='playing' and r.phase not in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') and not counter_used and jsonb_array_length(completed)>0,'observe_official',r.phase in ('interrogation','event_confrontation'));
end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v50_expert_analyze(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; item jsonb; aid bigint;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if r.scenario_id in ('003','009','016','017','018') and r.phase in ('provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote') then raise exception 'expertise closed';end if;
 if r.status<>'playing' or r.cycle not between 1 and 3 or r.phase in ('role_reading','investigation_assembly','interrogation','event_confrontation','closed','reveal') then raise exception 'expert unavailable now'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and cycle=r.cycle and action_type='expert') then raise exception 'cycle limit'; end if;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='017' then pack:=coalesce(igr_private.igr_v521_017_pinned_pack(r.code),pack);elsif r.scenario_id='018' then pack:=coalesce(igr_private.igr_v541_018_pinned_pack(r.code),pack);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if; select value into item from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) where value->>'id'=p_choice limit 1; if item is null then raise exception 'invalid choice'; end if;
 if r.scenario_id in ('003','009','016','017','018') and r.cycle<coalesce((item->>'min_cycle')::integer,1) then raise exception 'expertise unlocks in a later cycle';end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='expert' and payload->>'choice'=p_choice) then raise exception 'already used'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'expert',jsonb_build_object('choice',p_choice,'shared_investigation',false)) returning id into aid; insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'expert','private',me.id,jsonb_build_object('title',item->>'title','text',item->>'result','action_id',aid)); return jsonb_build_object('ok',true,'action_id',aid,'title',item->>'title','result',item->>'result');
end $function$
;
