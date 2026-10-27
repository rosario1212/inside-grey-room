-- Deux tables artificielles pour éprouver le tirage indépendant.
-- Aucune vérité narrative de la base Supabase ne quitte le serveur réel.
create table igr_private.igr_v99_variant_manuscripts (
 scenario_id text not null,
 variant_id text not null,
 manuscript jsonb not null,
 editorial_status text,
 approved_by text,
 approved_at timestamptz,
 content_md5 text,
 primary key(scenario_id,variant_id)
);
create or replace function igr_private.igr_v100_preflight(p_scenario text)
returns jsonb language sql security definer set search_path=''
as $pre$
 with candidates as (
  select m.* from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=p_scenario
 ), checks as (
  select
   count(*) as all_count,
   count(*) filter(where editorial_status='ready' and approved_by is not null
    and approved_at is not null
    and manuscript->>'status'='ready'
    and manuscript->>'human_review_approved'='true') as approvals,
   count(distinct coalesce(manuscript->'canonical_truth','{}'::jsonb)::text) as truths,
   count(*) filter(where exists(
     select 1 from jsonb_array_elements(coalesce(manuscript->'revelations','[]'::jsonb)) e
     where e->>'kind'='guaranteed' and e->>'min_cycle'='3'
      and e->'editorial_provenance'->>'human_source_review'='verified'
      and e->'editorial_provenance'->>'independent_of_optional_actions'='true'
   )) as verified,
   count(*) filter(where manuscript->'saga'->>'collection'='OMERTA'
      and manuscript->'saga'->>'branch'=variant_id
      and (manuscript->'saga'->>'chapter')::int=p_scenario::int-20) as sage
  from candidates
 )
 select jsonb_build_object('release_eligible',
     all_count=3 and approvals=3 and truths=3 and verified=3 and sage=3)
 from checks;
$pre$;
revoke all on function igr_private.igr_v100_preflight(text) from public,anon,authenticated;
