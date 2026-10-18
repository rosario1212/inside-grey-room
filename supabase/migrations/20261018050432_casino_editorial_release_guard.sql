-- Two matching approval records are required. Draft imports never activate.
create or replace function public.igr_casino_approved_releases()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'variant',variant,'revision',revision,'content',content)), '[]'::jsonb)
  from (select distinct on (variant) * from igr_casino_private.casino_releases
    where status='approved' and content->>'humanReviewApproved'='true'
      and content->>'editorialStatus'='ready'
    order by variant,revision desc) r
$$;
revoke all on function public.igr_casino_approved_releases() from public,anon,authenticated;
grant execute on function public.igr_casino_approved_releases() to service_role;
create or replace function igr_casino_private.casino_preserve_approved_release()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status in ('approved','retired') and
    (new.content is distinct from old.content or new.variant<>old.variant or new.revision<>old.revision or new.id<>old.id) then
    raise exception 'approved_casino_release_is_immutable';
  end if;
  return new;
end $$;
revoke all on function igr_casino_private.casino_preserve_approved_release() from public,anon,authenticated;
create trigger casino_preserve_approved_release before update on igr_casino_private.casino_releases
for each row execute function igr_casino_private.casino_preserve_approved_release();
