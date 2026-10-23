-- Dossier 007: read-only preflight. Run with a privileged internal operator.
-- Never run through a publicly exposed endpoint: packs contain confidential story data.
-- This query returns counts only. It does not create a room, play a game or approve a variant.
with trials as (
  select n, (array['A','B','C'])[1+floor(random()*3)::int] as variant
  from generate_series(1,48) as n
), builds as (
  select t.n, t.variant,
    igr_private.igr_v280_007_build_pack(m.manuscript) as pack
  from trials t
  join igr_private.igr_v99_variant_manuscripts m
    on m.scenario_id='007' and m.variant_id=t.variant
)
select
  count(*) as generated_packs,
  count(distinct variant) as observed_variants,
  count(*) filter (where variant='A') as a,
  count(*) filter (where variant='B') as b,
  count(*) filter (where variant='C') as c,
  bool_and(
    jsonb_array_length(pack->'suspects')=3
    and jsonb_array_length(pack->'trames')=3
    and jsonb_array_length(pack->'investigation_007')=9
    and jsonb_typeof(pack->'truth'->'reconstruction_007')='object'
  ) as all_structures_valid
from builds;

-- Separate checks, without exposing a single private story fragment:
select
  variant_id,
  editorial_status,
  content_md5 = md5(manuscript::text) as hash_matches,
  jsonb_array_length(coalesce(manuscript->'v280_runtime_trames','[]'::jsonb)) as revelations,
  jsonb_array_length(coalesce(manuscript->'v280_investigations','[]'::jsonb)) as investigations
from igr_private.igr_v99_variant_manuscripts
where scenario_id='007'
order by variant_id;

select igr_private.igr_v281_007_release_status() as release_gate;
