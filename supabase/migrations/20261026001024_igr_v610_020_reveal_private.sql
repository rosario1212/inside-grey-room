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

  return igr_private.igr_v607_020_reveal_enrich(p_room,igr_private.igr_v577_019_reveal_enrich(p_room,igr_private.igr_v547_018_reveal_enrich(p_room,igr_private.igr_v527_017_reveal_enrich(p_room, igr_private.igr_v487_016_reveal_enrich(p_room, igr_private.igr_v457_015_reveal_enrich(p_room, igr_private.igr_v437_014_reveal_enrich(p_room, igr_private.igr_v417_013_reveal_enrich(p_room, igr_private.igr_v397_012_reveal_enrich(p_room, igr_private.igr_v377_011_reveal_enrich(p_room, igr_private.igr_v357_010_reveal_enrich(p_room, igr_private.igr_v337_009_reveal_enrich(p_room, igr_private.igr_v307_008_reveal_enrich(p_room, base||jsonb_build_object(
    'results',out_results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'absent_players',absent,
    'incomplete_decisions',jsonb_array_length(absent)>0
  ))))))))))))));
end
$function$
;
