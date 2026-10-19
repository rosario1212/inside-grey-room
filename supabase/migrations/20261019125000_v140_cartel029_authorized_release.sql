-- CARTEL 029 replacement: author explicitly requested immediate release on
-- 2026-10-19. Uses the existing Supabase project; no new billed branch.
-- 'approved' here is the author's approval to publish the prepared matrix.
-- Independent editorial reviewer flags and multi-device QA remain unchanged.
-- All other scenarios retain their original capacity and mechanics.
do $release$
begin
 if (select manually_activated from igr_private.igr_v108_029_release_control where only_row=true) is distinct from true
 then raise exception '029 author release permission missing'; end if;
 if (select count(*) from igr_private.igr_v107_029_editorial_matrix
     where jsonb_array_length(coalesce(authoring->'evidence','[]'::jsonb))=16
       and (authoring->'witnesses') ?& array['T1','T2','T3','T4']
       and length(coalesce(authoring->'branch'->>'clue',''))>20
       and length(coalesce(authoring->'witness4'->>'proof',''))>20)<>15
 then raise exception '029 private manuscript matrix incomplete'; end if;
 update igr_private.igr_v107_029_editorial_matrix
    set editorial_status='approved',public_enabled=true,revised_at=now()
  where branch in ('A','B','C') and profile in ('V1','V2','V3','V4','V5');
 if (select count(*) from igr_private.igr_v107_029_editorial_matrix
     where editorial_status='approved' and public_enabled)<>15
 then raise exception '029 release not complete'; end if;
end $release$;

-- Operational gate: accepted author release + all 15 complete private packs.
-- Do NOT claim unperformed QA or independent manuscript review.
create or replace function igr_private.igr_v108_029_is_enabled() returns boolean
language sql stable security definer set search_path='' as $body$
  select coalesce((igr_private.igr_v135_029_preflight()->>'present')::int=15
             and (igr_private.igr_v135_029_preflight()->>'approved')::int=15
             and (select manually_activated from igr_private.igr_v108_029_release_control where only_row=true),false)
$body$;
revoke all on function igr_private.igr_v108_029_is_enabled() from public,anon,authenticated;
