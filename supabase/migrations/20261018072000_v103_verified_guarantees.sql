-- v103. Private-only stricter author release preflight.
-- Does not approve drafts, pin rooms, expose canon, or change public RPCs.
-- A "guaranteed" clue is not release-ready until its factual provenance
-- has been checked by a human editor, independently of optional actions.
create or replace function igr_private.igr_v100_preflight(p_scenario text)
returns jsonb language sql security definer set search_path to ''
as $v103$
  with m as (
    select variant_id, manuscript, editorial_status, approved_by, approved_at
    from igr_private.igr_v99_variant_manuscripts
    where scenario_id=p_scenario
  ), rollup as (
    select count(*)::int as stored,
      count(*) filter(where variant_id='A')::int as a_count,
      count(*) filter(where variant_id='B')::int as b_count,
      count(*) filter(where variant_id='C')::int as c_count,
      count(distinct coalesce(manuscript->'canonical_truth','{}'::jsonb)::text)::int
        as distinct_canonical_truths,
      count(*) filter(where editorial_status='ready' and approved_by is not null
        and approved_at is not null and manuscript->>'status'='ready'
        and manuscript->>'human_review_approved'='true')::int as approved,
      count(*) filter(where exists (
        select 1 from pg_catalog.jsonb_array_elements(
          coalesce(manuscript->'revelations','[]'::jsonb)) e
        where e->>'kind'='guaranteed' and e->>'min_cycle'='3'
      ))::int as cycle_three_guarantees,
      count(*) filter(where exists (
        select 1 from pg_catalog.jsonb_array_elements(
          coalesce(manuscript->'revelations','[]'::jsonb)) e
        where e->>'kind'='guaranteed' and e->>'min_cycle'='3'
          and e->'editorial_provenance'->>'human_source_review'='verified'
          and (e->'editorial_provenance'->>'independent_of_optional_actions'='true'
            or e->'editorial_provenance'->>'official_fact_validation'='verified')
      ))::int as verified_cycle_three_guarantees,
      count(*) filter(where p_scenario between '021' and '025' and (
        manuscript->'saga' is null
        or manuscript->'saga'->>'collection'<>'OMERTA'
        or manuscript->'saga'->>'branch'<>variant_id
        or (manuscript->'saga'->>'chapter')::integer <> p_scenario::integer-20
      ))::int as omerta_lock_missing
    from m
  )
  select pg_catalog.jsonb_build_object(
    'stored',stored,
    'approved',approved,
    'distinct_canonical_truths',distinct_canonical_truths,
    'cycle_three_guarantees',cycle_three_guarantees,
    'verified_cycle_three_guarantees',verified_cycle_three_guarantees,
    'omerta_lock_missing',omerta_lock_missing,
    'release_eligible',stored=3 and a_count=1 and b_count=1 and c_count=1
      and approved=3 and distinct_canonical_truths=3
      and verified_cycle_three_guarantees=3 and omerta_lock_missing=0
  ) from rollup
$v103$;

revoke all on function igr_private.igr_v100_preflight(text)
from public,anon,authenticated;
comment on function igr_private.igr_v100_preflight(text) is
'Internal-only author approval guard v103. Requires distinct canon, independently verified third-cycle evidence and OMERTA lock; never exposes story truth to clients.';
