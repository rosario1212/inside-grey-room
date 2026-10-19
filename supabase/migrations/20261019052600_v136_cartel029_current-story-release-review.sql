-- 029: independent editorial sign-offs for the 15 NEW four-witness plots.
-- Do not reuse the obsolete three-suspect manuscript approvals.
create table if not exists igr_private.igr_v135_029_editorial_reviews(
 branch text not null check(branch in ('A','B','C')),
 profile text not null check(profile in ('V1','V2','V3','V4','V5')),
 story_reviewed boolean not null default false,
 third_cycle_sources_verified boolean not null default false,
 reviewed_at timestamptz,
 notes text,
 primary key(branch,profile),
 foreign key(branch,profile) references igr_private.igr_v107_029_editorial_matrix(branch,profile));
alter table igr_private.igr_v135_029_editorial_reviews enable row level security;
revoke all on igr_private.igr_v135_029_editorial_reviews from public,anon,authenticated;
insert into igr_private.igr_v135_029_editorial_reviews(branch,profile)
 select branch,profile from igr_private.igr_v107_029_editorial_matrix
 on conflict(branch,profile) do nothing;

create or replace function igr_private.igr_v135_029_preflight() returns jsonb
language sql stable security definer set search_path='' as $$
with checks as (
 select count(*) count_variants,
   count(*) filter(where m.editorial_status='approved' and m.public_enabled
    and jsonb_array_length(coalesce(m.authoring->'evidence','[]'::jsonb))=16
    and (m.authoring->'witnesses') ?& array['T1','T2','T3','T4']
    and (select count(*) from jsonb_array_elements(m.authoring->'evidence') e
         where e->>'id'=any(array['P11','P12','P14','P15','P16']) and e->>'cycle'='3')=5
    and coalesce(length(m.authoring->'branch'->>'clue'),0)>20
    and coalesce(length(m.authoring->'witness4'->>'proof'),0)>20) as approved,
   count(*) filter(where r.story_reviewed and r.third_cycle_sources_verified and r.reviewed_at is not null) as signed
 from igr_private.igr_v107_029_editorial_matrix m
 left join igr_private.igr_v135_029_editorial_reviews r on r.branch=m.branch and r.profile=m.profile
)
select jsonb_build_object('present',count_variants,'approved',approved,'signed',signed,'editorial_ready',count_variants=15 and approved=15 and signed=15) from checks
$$;
revoke all on function igr_private.igr_v135_029_preflight() from public,anon,authenticated;

create or replace function igr_private.igr_v108_029_is_enabled() returns boolean
language sql stable security definer set search_path='' as $$
 select (igr_private.igr_v135_029_preflight()->>'editorial_ready')::boolean is true
   and (select passed_end_to_end_testing and manually_activated
       from igr_private.igr_v108_029_release_control where only_row=true) is true
$$;
revoke all on function igr_private.igr_v108_029_is_enabled() from public,anon,authenticated;
