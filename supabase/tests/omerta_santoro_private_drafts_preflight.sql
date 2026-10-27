-- Sanity check: private Santoro source overrides historical manuscript only
-- inside isolated PostgreSQL. This fixture contains no narrative facts.
do $qa$
declare n integer;
begin
 insert into igr_private.igr_omerta_santoro_v25_drafts
  (scenario_id,variant_id,manuscript,editorial_status,content_md5)
 select scenario_id,variant_id,
  jsonb_set(manuscript,'{verdict_scoring_review}','"pending"'::jsonb,true),
  'review','fixture'
 from igr_private.igr_v99_variant_manuscripts
 where scenario_id='021';
 select count(*) into n
 from igr_private.igr_omerta_standalone_manuscripts
 where scenario_id='021';
 if n<>3 then raise exception 'draft and historical variants were mixed';end if;
 if igr_private.igr_omerta_editorial_preflight('021')
 then raise exception 'unapproved drafts passed review';end if;
 if igr_private.igr_omerta_standalone_can_start('021')
 then raise exception 'unreleased drafts reached playable state';end if;
end $qa$;
select 'OMERTA_PRIVATE_DRAFT_GATE_PASS' as outcome;
