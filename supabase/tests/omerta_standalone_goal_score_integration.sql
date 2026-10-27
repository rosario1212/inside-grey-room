-- Test déterministe isolé : aucun spoiler, aucun personnage réel.
do $qa$
declare
  who uuid := '00000000-0000-4000-8000-000000000021';
  goal jsonb := '{"mode":"avoid_formal_designation","goal_id":"021-A-slot-1-avoid_designation","scenario_variant_id":"021-A"}';
  decision jsonb;
  verified jsonb;
  assessment jsonb;
  indic jsonb;
  result jsonb;
begin
  decision:=jsonb_build_array(jsonb_build_object(
    'playerId',who::text,'matchNo',2,'scenarioVariantId','021-A',
    'goalId','021-A-slot-1-avoid_designation',
    'confirmed',true,'investigatorAuthorized',true));
  verified:=jsonb_build_array(jsonb_build_object(
    'playerId',who::text,'matchNo',2,'scenarioVariantId','021-A',
    'truthVerified',true,'transmittedToInvestigation',true,
    'nonpublicWhenSent',true));
  assessment:=jsonb_build_array(jsonb_build_object(
    'playerId',who::text,'matchNo',2,'scenarioVariantId','021-A',
    'useful',true,'investigatorAuthorized',true,'confirmed',true));

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,false) into result;
  if result->>'status'!='pending' then
    raise exception 'scorer counted verdict before lock';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true) into result;
  if result->>'won'!='true' then
    raise exception 'undesignated suspect incorrectly loses';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,decision) into result;
  if result->>'won'!='false' then
    raise exception 'authorized exact designation ignored';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,jsonb_set(decision,'{0,scenarioVariantId}','"021-B"'::jsonb)) into result;
  if result->>'won'!='true' then
    raise exception 'designation leaked from a different variant';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,jsonb_set(decision,'{0,investigatorAuthorized}','false'::jsonb)) into result;
  if result->>'won'!='true' then
    raise exception 'unauthorized designation counted';end if;

  indic:=jsonb_build_object(
    'accepted',true,'survived',true,'protectedByOfficialPact',true,
    'formalReductionYears',0,'intelEvents',verified);
  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,indic) into result;
  if result->>'won'!='true' then
    raise exception 'valid verified informant information not counted';end if;

  indic:=jsonb_build_object(
    'accepted',true,'survived',true,'protectedByOfficialPact',true,
    'formalReductionYears',0,'investigatorAssessments',assessment);
  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,indic) into result;
  if result->>'won'!='true' or result->>'usefulnessSource'!='investigator' then
    raise exception 'authorized investigator assessment not counted';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,
    jsonb_set(indic,'{investigatorAssessments,0,scenarioVariantId}','"021-C"'::jsonb))
    into result;
  if result->>'won'!='false' then
    raise exception 'assessment leaked from wrong variant';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,
    jsonb_set(indic,'{investigatorAssessments,0,investigatorAuthorized}','false'::jsonb))
    into result;
  if result->>'won'!='false' then
    raise exception 'unverified assessment counted';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,jsonb_set(indic,'{survived}','false'::jsonb))
    into result;
  if result->>'won'!='false' then
    raise exception 'dead informant incorrectly wins';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,
    jsonb_set(jsonb_set(indic,'{protectedByOfficialPact}','false'::jsonb),
      '{formalReductionYears}','2'::jsonb))
    into result;
  if result->>'won'!='false' then
    raise exception 'two-year reduction was accepted';end if;

  select igr_private.igr_omerta_score_standalone_goal(
    who,2,goal,true,'[]'::jsonb,
    jsonb_set(jsonb_set(indic,'{protectedByOfficialPact}','false'::jsonb),
      '{formalReductionYears}','3'::jsonb))
    into result;
  if result->>'won'!='true' then
    raise exception 'three-year reduction was ignored';end if;

  begin
    perform igr_private.igr_omerta_score_standalone_goal(
      who,2,goal-'scenario_variant_id',true);
    raise exception 'missing variant was accepted';
  exception when others then
    if sqlerrm!='omerta_invalid_private_goal' then raise;end if;
  end;
  if has_function_privilege('anon',
      'igr_private.igr_omerta_score_standalone_goal(uuid,integer,jsonb,boolean,jsonb,jsonb)',
      'EXECUTE') then
    raise exception 'public runtime can invoke private scorer directly';end if;
end $qa$;
select 'OMERTA_SQL_SCORER_PASS' as outcome;
