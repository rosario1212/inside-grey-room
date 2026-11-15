-- v711: collective-majority camp verdict. Read-only private tally, no one-person authority.
-- Strict majority (>50%) per suspect, equal weight; -1 means no majority and cannot count as correct.
-- Only investigation camp members who actually locked a ballot count. Absences do not vote.
-- Special 021-025 Omerta, 029 witness report and 031 Cartel preserve specialized reveal paths.

CREATE OR REPLACE FUNCTION igr_private.igr_v711_majority_levels(p_room text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
WITH available AS (
  SELECT a.player_id,a.payload->'levels' as levels
    FROM public.igr_v4_actions a
    JOIN public.igr_v4_players p ON p.id=a.player_id AND p.room_code=p_room
    JOIN public.igr_v4_rooms r ON r.code=p_room
   WHERE a.room_code=p_room AND a.action_type='final_lock'
     AND public.igr_v52_investigation_role(p.public_role)
     AND NOT (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text)
), suspects AS (
  SELECT id FROM public.igr_v4_players WHERE room_code=p_room AND public_role='suspect'
), ballots AS (
  SELECT s.id AS suspect_id,(a.levels->>s.id::text)::int AS level
    FROM suspects s CROSS JOIN available a
   WHERE (a.levels->>s.id::text) IN ('0','1','2')
), tally AS (
  SELECT suspect_id,level,count(*) AS votes FROM ballots GROUP BY suspect_id,level
), majority AS (
  SELECT s.id,
    (SELECT t.level FROM tally t WHERE t.suspect_id=s.id
       AND t.votes*2>(SELECT count(*) FROM ballots b WHERE b.suspect_id=s.id)
      ORDER BY t.level LIMIT 1) AS level
  FROM suspects s
)
SELECT coalesce(jsonb_object_agg(id::text,to_jsonb(coalesce(level,-1))),'{}'::jsonb)
  FROM majority
$function$;
REVOKE ALL ON FUNCTION igr_private.igr_v711_majority_levels(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.igr_v50_reveal_legacy(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 base jsonb; r public.igr_v4_rooms%rowtype; pack jsonb; truth_levels jsonb;
 enq public.igr_v4_players%rowtype; proc public.igr_v4_players%rowtype; judge public.igr_v4_players%rowtype;
 proc_rt public.igr_v47_prosecutor_runtime%rowtype;
 enq_levels jsonb:='{}'::jsonb; proc_levels jsonb:='{}'::jsonb; judge_levels jsonb:='{}'::jsonb; authority_levels jsonb:='{}'::jsonb;
 authority_role text:='enqueteur'; responsibilities jsonb:='[]'::jsonb; results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
 it jsonb; s public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype; lr record;
 truth int; enql int; procl int; judgel int; authl int; total int:=0; camp_exact int:=0; proc_exact int:=0;
 secondary_success boolean:=false; camp_axis boolean:=false; main_axis boolean:=false; score int:=0;
 target_truth int:=-1; target_proc int:=-1; target_auth int:=-1; target_name text; role_name text; current_success boolean;
begin
 base:=public.igr_v44_make_reveal(p_room);
 select * into r from public.igr_v4_rooms where code=p_room;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

  
 if r.scenario_id in ('026','027','028') then pack:=coalesce(igr_private.igr_v695_pinned_pack(r.code),pack);end if;
 truth_levels:=coalesce(pack->'truth'->'levels','[]'::jsonb);
 select * into enq from public.igr_v4_players where room_code=p_room and public_role='enqueteur' order by seat_index limit 1;
 select * into proc from public.igr_v4_players where room_code=p_room and public_role='procureur' order by seat_index limit 1;
 select * into judge from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1;
 if enq.id is not null then
  select coalesce(payload->'levels',payload,'{}'::jsonb) into enq_levels from public.igr_v4_actions where room_code=p_room and player_id=enq.id and action_type='final_lock' order by id desc limit 1;
  enq_levels:=coalesce(enq_levels,'{}'::jsonb);
 end if;
 if proc.id is not null then
  select coalesce(payload->'levels',payload,'{}'::jsonb) into proc_levels from public.igr_v4_actions where room_code=p_room and player_id=proc.id and action_type='final_lock' order by id desc limit 1;
  proc_levels:=coalesce(proc_levels,'{}'::jsonb);
  perform public.igr_v47_ensure_prosecutor_runtime(p_room,proc.id);
  select * into proc_rt from public.igr_v47_prosecutor_runtime where room_code=p_room and prosecutor_id=proc.id;
 end if;
 if judge.id is not null then
  select coalesce(payload->'levels',payload,'{}'::jsonb) into judge_levels from public.igr_v4_actions where room_code=p_room and player_id=judge.id and action_type='final_lock' order by id desc limit 1;
  judge_levels:=coalesce(judge_levels,'{}'::jsonb);
 end if;
 -- v711: one vote per available member of camp Enquête. No judge/prosecutor veto.
 authority_levels:=igr_private.igr_v711_majority_levels(p_room);
 authority_role:='camp_enquete';

 for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot loop
  truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
  enql:=coalesce((enq_levels->>s.id::text)::int,-1); procl:=coalesce((proc_levels->>s.id::text)::int,-1); judgel:=coalesce((judge_levels->>s.id::text)::int,-1); authl:=coalesce((authority_levels->>s.id::text)::int,-1);
  total:=total+1; if authl=truth then camp_exact:=camp_exact+1; end if; if proc.id is not null and procl=truth then proc_exact:=proc_exact+1; end if;
  responsibilities:=responsibilities||jsonb_build_array(jsonb_build_object('player_id',s.id,'pseudo',s.pseudo,'truth_level',truth,'enqueteur_level',enql,'prosecutor_level',case when proc.id is null then null else procl end,'judge_level',case when judge.id is null then null else judgel end,'authority_level',authl,'authority_role',authority_role));
  if proc.id is not null and proc_rt.protected_target_id=s.id then target_truth:=truth; target_proc:=procl; target_auth:=authl; target_name:=s.pseudo; end if;
 end loop;

 for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
  role_name:=it->>'public_role';
  if role_name in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then
   it:=jsonb_set(it,'{camp_success}',to_jsonb(camp_exact=total and total>0),true);
   it:=jsonb_set(it,'{camp_authority_role}',to_jsonb(authority_role),true);
  end if;

  if it->>'role'='espion' then
   current_success:=total>0 and camp_exact<total;
   it:=jsonb_set(it,'{success}',to_jsonb(current_success),true);
   it:=jsonb_set(it,'{text}',to_jsonb(case when current_success
    then 'La décision majoritaire du camp Enquête ne reconstitue pas toutes les responsabilités : ta couverture a tenu.'
    else 'Le camp Enquête a retrouvé les responsabilités par décision majoritaire : ta mission d’ombre échoue.' end),true);
   it:=jsonb_set(it,'{achievements}',case when current_success and camp_exact*2<=total
    then '["espion_ombre"]'::jsonb else '[]'::jsonb end,true);
  elsif role_name='suspect' then
   select * into s from public.igr_v4_players where id=(it->>'player_id')::uuid;
   truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0); authl:=coalesce((authority_levels->>s.id::text)::int,-1); current_success:=truth=authl;
   it:=jsonb_set(it,'{success}',to_jsonb(current_success),true);
   it:=jsonb_set(it,'{text}',to_jsonb(case when current_success then 'La version qui fait autorité ('||authority_role||') respecte exactement la frontière réelle de ta responsabilité.' else 'La version qui fait autorité ('||authority_role||') déforme ou manque ta responsabilité réelle.' end),true);
  elsif role_name='maitre' then
   select x.client_id,c.pseudo into lr from public.igr_v43_lawyer_representations x join public.igr_v4_players c on c.id=x.client_id where x.room_code=p_room and x.lawyer_id=(it->>'player_id')::uuid limit 1;
   if found then
    select * into client from public.igr_v4_players where id=lr.client_id;
    truth:=coalesce((truth_levels->>(client.internal_slot-1))::int,0); authl:=coalesce((authority_levels->>client.id::text)::int,-1); current_success:=truth=authl;
    it:=jsonb_set(it,'{success}',to_jsonb(current_success),true);
    it:=jsonb_set(it,'{text}',to_jsonb(case when current_success then 'La version qui fait autorité protège exactement la responsabilité réelle de ton client '||lr.pseudo||'.' else 'La version qui fait autorité ne correspond pas à la responsabilité réelle de ton client '||lr.pseudo||'.' end),true);
   end if;
  elsif role_name='procureur' and proc.id is not null then
   if proc_rt.corrupt then
    main_axis:=target_truth>=0 and target_proc>=0 and target_proc<target_truth;
    camp_axis:=target_truth>=0 and target_auth>=0 and target_auth<target_truth;
    select exists(select 1 from public.igr_v47_prosecutor_cooperations c join public.igr_v4_players a on a.id=c.against_player_id where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted' and c.against_player_id<>proc_rt.protected_target_id and coalesce((authority_levels->>a.id::text)::int,-1)>coalesce((truth_levels->>(a.internal_slot-1))::int,0)) into secondary_success;
    score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end); score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
    it:=jsonb_set(it,'{success}',to_jsonb(main_axis and camp_axis),true);
    it:=jsonb_set(it,'{text}',to_jsonb('Procureur corrompu · cible : '||coalesce(target_name,'inconnue')||' · ta version personnelle '||case when main_axis then 'réduit bien son exposition' else 'ne la protège pas assez' end||' · la version d’autorité '||case when camp_axis then 'la protège' else 'ne la protège pas' end||'.'),true);
    it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis and camp_axis,'secondary',secondary_success,'camp_label','Intérêts corrompus'),true);
   else
    main_axis:=proc_exact=total and total>0; camp_axis:=camp_exact=total and total>0;
    select exists(select 1 from public.igr_v47_prosecutor_cooperations c join public.igr_v4_players a on a.id=c.against_player_id where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted' and coalesce((truth_levels->>(a.internal_slot-1))::int,0)>0) into secondary_success;
    score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end); score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
    it:=jsonb_set(it,'{success}',to_jsonb(main_axis),true);
    it:=jsonb_set(it,'{text}',to_jsonb(proc_exact||'/'||total||' responsabilités exactes dans ta propre version · version du camp décidée par '||authority_role||' · coopération utile '||case when secondary_success then 'réussie' else 'non obtenue' end||'.'),true);
    it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis,'secondary',secondary_success,'camp_label','Enquête'),true);
   end if;
   it:=jsonb_set(it,'{score_percent}',to_jsonb(score),true); it:=jsonb_set(it,'{corrupt}',to_jsonb(proc_rt.corrupt),true);
  end if;
  results:=results||jsonb_build_array(it);
  if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array((it->>'player_id')::uuid); end if;
 end loop;
 return base||jsonb_build_object('responsibilities',responsibilities,'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),'camp_investigation',jsonb_build_object('authority_role',authority_role,'exact',camp_exact,'total',total,'success',camp_exact=total and total>0),'prosecutor_integrity',case when proc.id is null then null else jsonb_build_object('corrupt',proc_rt.corrupt,'protected_target_id',proc_rt.protected_target_id,'protected_target',target_name) end);
end $function$;

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
  objective_report jsonb;
  protections_used int:=0;
begin
  -- v171 031 ending
  if exists(select 1 from igr_private.igr_v171_031_matches where room_code=p_room) then
    return igr_private.igr_v630_spy_reveal_overlay(p_room,igr_private.igr_v171_031_make_reveal(p_room));
  end if;
  spy_base:=public.igr_v4_make_reveal(p_room);
  base:=public.igr_v59_reveal_base(p_room);
  select * into r from public.igr_v4_rooms where code=p_room;

  absent:=coalesce(r.state->'v59_absent','[]'::jsonb);
  select sp.pack into pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v52_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

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
      from jsonb_array_elements(coalesce(
        (case when r.scenario_id in ('021','022','023','024','025','029') then spy_base else base end)->'results',
        '[]'::jsonb))
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
          and exists(select 1 from jsonb_array_elements(coalesce(base->'responsibilities','[]'::jsonb)) b(value)
                     where b.value->>'player_id'=t.id::text
                       and coalesce((b.value->>'authority_level')::int,-1)>=0
                       and (b.value->>'authority_level')::int<truth)
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

    elsif p.public_role='suspect'
      and r.scenario_id in ('001','002')
      and r.created_at >= timestamptz '2026-10-30 19:45:49+00'
    then
      truth:=coalesce((pack->'truth'->'levels'->>(p.internal_slot-1))::int,-1);
      select coalesce((q.value->>'authority_level')::int,-1) into guess
      from jsonb_array_elements(coalesce(base->'responsibilities','[]'::jsonb)) as q(value)
      where q.value->>'player_id'=p.id::text
      limit 1;
      guess:=coalesce(guess,-1);
      objective_report:=null;
      if r.scenario_id='001' then
        select a.payload->'reconstruction_001' into objective_report
        from public.igr_v4_actions a
        join public.igr_v4_players e on e.id=a.player_id
        where a.room_code=p_room and a.action_type='final_lock'
          and e.public_role in ('enqueteur','analyste')
        order by case when e.public_role='enqueteur' then 0 else 1 end,a.id desc
        limit 1;
      end if;
      personal_ok:=igr_private.igr_v13_suspect_goal(
        r.scenario_id,p.internal_slot,truth,guess,
        coalesce((pack->'truth'->'levels'->>2)::int,-1),
        objective_report
      );
      it:=it||jsonb_build_object(
        'success',personal_ok,
        'personal_objective_success',personal_ok,
        'objective_version','v13',
        'text',case when personal_ok then
          'Ton objectif privé est réussi selon les éléments du verdict enregistrés par l’application.'
          else 'Ton objectif privé n’est pas atteint selon le verdict enregistré par l’application.' end,
        'victories',coalesce(it->'victories','{}'::jsonb)||jsonb_build_object('personal',personal_ok)
      );
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

  spy_base:=igr_private.igr_v607_020_reveal_enrich(p_room,igr_private.igr_v577_019_reveal_enrich(p_room,igr_private.igr_v547_018_reveal_enrich(p_room,igr_private.igr_v527_017_reveal_enrich(p_room, igr_private.igr_v487_016_reveal_enrich(p_room, igr_private.igr_v457_015_reveal_enrich(p_room, igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(
    'results',out_results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'absent_players',absent,
    'incomplete_decisions',jsonb_array_length(absent)>0
  ))))))))))))));
return igr_private.igr_v630_spy_reveal_overlay(p_room,spy_base);
end $function$;
