-- OMERTÀ : évaluateur pur côté PostgreSQL pour la variante Santoro épinglée.
-- NON PUBLIÉ. Il n'autorise ni verdict, ni pacte, ni divulgation, et ne lit
-- AUCUN manuscrit. Un RPC serveur doit produire les événements authentifiés.
create or replace function igr_private.igr_omerta_score_standalone_goal(
  p_player_id uuid,
  p_match_no integer,
  p_goal jsonb,
  p_verdict_locked boolean,
  p_designations jsonb default '[]'::jsonb,
  p_informant jsonb default '{}'::jsonb
) returns jsonb
language plpgsql immutable security invoker set search_path=''
as $scorer$
declare
  v text;
  g text;
  e jsonb;
  useful boolean := false;
  approved boolean := false;
  designated boolean := false;
  alive boolean := false;
  selfish boolean := false;
  won boolean := false;
  reduction numeric := 0;
begin
  v := p_goal->>'scenario_variant_id';
  g := p_goal->>'goal_id';
  if p_player_id is null or p_match_no is null or p_match_no < 1
      or p_goal->>'mode' is distinct from 'avoid_formal_designation'
      or nullif(g,'') is null
      or nullif(v,'') is null or coalesce(v !~ '^02[1-5]-[ABC]
  then raise exception 'omerta_invalid_private_goal'; end if;

  if p_verdict_locked is distinct from true then
    return jsonb_build_object('status','pending','won',null,
      'reason','verdict_not_locked');
  end if;

  if p_informant->>'accepted'='true' then
    alive := p_informant->>'survived'='true';
    if jsonb_typeof(p_informant->'formalReductionYears')='number' then
      reduction := (p_informant->>'formalReductionYears')::numeric;
    end if;
    selfish := p_informant->>'protectedByOfficialPact'='true'
       or reduction >= 3;
    for e in select value from pg_catalog.jsonb_array_elements(
      coalesce(p_informant->'intelEvents','[]'::jsonb)) value
    loop
      if e->>'playerId'=p_player_id::text
         and e->>'matchNo'=p_match_no::text
         and e->>'scenarioVariantId'=v
         and e->>'truthVerified'='true'
         and e->>'transmittedToInvestigation'='true'
         and e->>'nonpublicWhenSent'='true'
      then useful:=true;end if;
    end loop;
    for e in select value from pg_catalog.jsonb_array_elements(
      coalesce(p_informant->'investigatorAssessments','[]'::jsonb)) value
    loop
      if e->>'playerId'=p_player_id::text
         and e->>'matchNo'=p_match_no::text
         and e->>'scenarioVariantId'=v
         and e->>'investigatorAuthorized'='true'
         and e->>'confirmed'='true'
         and e->>'useful'='true'
      then approved:=true;end if;
    end loop;
    won:=alive and selfish and (useful or approved);
    return jsonb_build_object('status',case when won then 'won' else 'lost' end,
      'won',won,'personalConditionMet',alive and selfish,
      'usefulInformationMet',useful or approved,
      'usefulnessSource',case when approved then 'investigator'
          when useful then 'verified_fact' else null end,
      'survived',alive,'oldGoalReplaced',true);
  end if;

  for e in select value from pg_catalog.jsonb_array_elements(
    coalesce(p_designations,'[]'::jsonb)) value
  loop
    if e->>'playerId'=p_player_id::text
       and e->>'matchNo'=p_match_no::text
       and e->>'scenarioVariantId'=v
       and e->>'goalId'=g
       and e->>'confirmed'='true'
       and e->>'investigatorAuthorized'='true'
    then designated:=true;end if;
  end loop;
  won:=not designated;
  return jsonb_build_object('status',case when won then 'won' else 'lost' end,
    'won',won,'personalConditionMet',won,'oldGoalReplaced',false);
end;
$scorer$;
revoke all on function igr_private.igr_omerta_score_standalone_goal(
  uuid,integer,jsonb,boolean,jsonb,jsonb) from public,anon,authenticated;
