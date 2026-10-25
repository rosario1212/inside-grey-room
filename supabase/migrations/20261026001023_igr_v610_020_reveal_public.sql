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
  where x.scenario_id=r.scenario_id; /* IGR_V181_001_SNAPSHOT_igr_v4_make_reveal */ if r.scenario_id='001' then pack:=coalesce(igr_private.igr_v181_001_pinned_game_pack(r.code),pack); end if; /* IGR_V202_002_PINNED_READ */ if r.scenario_id='002' then pack:=coalesce(igr_private.igr_v201_002_pinned_game_pack(r.code),pack); end if; /* IGR_003_V221_READER */ if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack);end if; if r.scenario_id='004' then pack:=coalesce(igr_private.igr_v230_004_pinned_pack(r.code),pack);end if; if r.scenario_id='005' then pack:=coalesce(igr_private.igr_v250_005_pinned_pack(r.code),pack);end if; if r.scenario_id='006' then pack:=coalesce(igr_private.igr_v260_006_pinned_pack(r.code),pack);end if; if r.scenario_id='007' then pack:=coalesce(igr_private.igr_v281_007_pinned_pack(r.code),pack);end if; if r.scenario_id='008' then pack:=igr_private.igr_v301_008_pinned_pack(r.code);if pack is null then raise exception '008 private snapshot missing';end if;end if; if r.scenario_id='009' then pack:=igr_private.igr_v331_009_pinned_pack(r.code);if pack is null then raise exception '009 private snapshot missing';end if;end if; if r.scenario_id='010' then pack:=igr_private.igr_v351_010_pinned_pack(r.code);if pack is null then raise exception '010 private snapshot missing';end if;end if; if r.scenario_id='011' then pack:=igr_private.igr_v371_011_pinned_pack(r.code);if pack is null then raise exception '011 private snapshot missing';end if;end if; if r.scenario_id='012' then pack:=igr_private.igr_v391_012_pinned_pack(r.code);if pack is null then raise exception '012 private snapshot missing';end if;end if; if r.scenario_id='013' then pack:=igr_private.igr_v411_013_pinned_pack(r.code);if pack is null then raise exception '013 private snapshot missing';end if;end if; if r.scenario_id='014' then pack:=igr_private.igr_v431_014_pinned_pack(r.code);if pack is null then raise exception '014 private snapshot missing';end if;end if; if r.scenario_id='015' then pack:=igr_private.igr_v451_015_pinned_pack(r.code);if pack is null then raise exception '015 private snapshot missing';end if;end if; if r.scenario_id='016' then pack:=igr_private.igr_v481_016_pinned_pack(r.code);if pack is null then raise exception '016 private snapshot missing';end if;end if; if r.scenario_id='017' then pack:=igr_private.igr_v521_017_pinned_pack(r.code);if pack is null then raise exception '017 private snapshot missing';end if;end if; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 private snapshot missing';end if;end if; if r.scenario_id='019' then pack:=igr_private.igr_v571_019_pinned_pack(r.code);if pack is null then raise exception '019 private snapshot missing';end if;end if; if r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);if pack is null then raise exception '020 private snapshot missing';end if;end if;

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
;
