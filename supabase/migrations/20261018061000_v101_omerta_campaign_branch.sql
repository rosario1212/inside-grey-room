-- v101. Dormant, private-only continuation lock for OMERTA.
-- Does not change gameplay functions, client-visible room.state, or active scenario packs.
create table if not exists igr_private.igr_v101_omerta_campaign_branches (
 campaign_id uuid primary key references public.igr_omerta_campaigns(id) on delete cascade,
 branch_id text not null check (branch_id in ('A','B','C')),
 pinned_at timestamptz not null default now()
);
alter table igr_private.igr_v101_omerta_campaign_branches enable row level security;
revoke all on table igr_private.igr_v101_omerta_campaign_branches from public,anon,authenticated;

create or replace function igr_private.igr_v101_pin_omerta_branch(p_campaign_id uuid)
returns text
language plpgsql security definer set search_path to ''
as $v101$
declare
  c public.igr_omerta_campaigns%rowtype;
  existing_branch text;
  chosen text;
  chapter_no integer;
  episode text;
  branches integer;
begin
  -- Lock one campaign row; simultaneous room starts cannot draw different branches.
  select * into c from public.igr_omerta_campaigns
  where id=p_campaign_id for update;
  if not found then return null; end if;

  select x.branch_id into existing_branch
  from igr_private.igr_v101_omerta_campaign_branches x
  where x.campaign_id=p_campaign_id;
  if found then return existing_branch; end if;

  -- The entire five-episode triplet must be approved before ANY branch is pinned.
  for chapter_no in 1..5 loop
    episode := lpad((20+chapter_no)::text,3,'0');
    if coalesce((igr_private.igr_v100_preflight(episode)->>'release_eligible')::boolean,false) is not true
      then return null;
    end if;
    select count(*)::integer into branches
    from igr_private.igr_v99_variant_manuscripts m
    where m.scenario_id=episode
      and m.editorial_status='ready'
      and m.approved_at is not null
      and m.approved_by is not null
      and m.manuscript->>'status'='ready'
      and m.manuscript->>'human_review_approved'='true'
      and m.manuscript->'saga'->>'collection'='OMERTA'
      and m.manuscript->'saga'->>'branch'=m.variant_id
      and (m.manuscript->'saga'->>'chapter')::int=chapter_no;
    if branches <> 3 then return null; end if;
  end loop;

  select v.letter into chosen from (values('A'),('B'),('C')) v(letter)
  order by pg_catalog.random() limit 1;
  insert into igr_private.igr_v101_omerta_campaign_branches(campaign_id,branch_id)
  values(p_campaign_id,chosen)
  on conflict(campaign_id) do nothing;

  select branch_id into existing_branch
  from igr_private.igr_v101_omerta_campaign_branches
  where campaign_id=p_campaign_id;
  return existing_branch;
end $v101$;

-- Safe internal read only. Never expose variant letter in sync or a public RPC.
create or replace function igr_private.igr_v101_omerta_room_branch(p_room_code text)
returns text language sql security definer set search_path to ''
as $v101$
 select b.branch_id
 from public.igr_omerta_room_campaigns l
 join igr_private.igr_v101_omerta_campaign_branches b on b.campaign_id=l.campaign_id
 where l.room_code=upper(trim(p_room_code))
$v101$;

revoke all on function igr_private.igr_v101_pin_omerta_branch(uuid) from public,anon,authenticated;
revoke all on function igr_private.igr_v101_omerta_room_branch(text) from public,anon,authenticated;

comment on function igr_private.igr_v101_pin_omerta_branch(uuid) is
 'Private-only, dormant OMERTA campaign seed. Requires all 15 approved variants and cycle 3 evidence; not invoked by live gameplay.';
