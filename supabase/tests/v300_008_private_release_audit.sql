-- Private-only 008 manuscript audit: no raw story material in output.
-- DO NOT expose this query through the public Data API.
with variants as (
  select variant_id, editorial_status, content_md5=md5(manuscript::text) checksum_ok,
         igr_private.igr_v300_008_build_pack(variant_id) as pack,
         manuscript->'v300_editorial' as editorial
  from igr_private.igr_v99_variant_manuscripts
  where scenario_id='008'
)
select variant_id,editorial_status,checksum_ok,
       jsonb_array_length(pack->'suspects') suspects,
       jsonb_array_length(pack->'trames') mandatory_revelations,
       jsonb_array_length(pack->'investigation_008') optional_investigations,
       (select count(distinct e->>'id') from jsonb_array_elements(pack->'investigation_008') e) distinct_investigations,
       (select count(*) from jsonb_object_keys(pack->'relations')) relationship_sources,
       (select count(*) from jsonb_object_keys(pack->'truth'->'reconstruction_008')) verdict_axes,
       editorial->>'source_review' source_review,
       editorial->>'human_playtest_verified' human_playtest
from variants order by variant_id;

select
  count(*) drafts,
  count(distinct (manuscript->'v300_verdict')::text) distinct_verdicts,
  bool_and(editorial_status='review') remains_unreleased
from igr_private.igr_v99_variant_manuscripts
where scenario_id='008';

select
  has_function_privilege('anon','igr_private.igr_v300_008_build_pack(text)','EXECUTE') anon_private_access,
  has_function_privilege('authenticated','igr_private.igr_v300_008_build_pack(text)','EXECUTE') authenticated_private_access;
