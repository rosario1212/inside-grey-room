-- Pin the helper search path used by the directed-cycle engine.
create or replace function public.igr_v13_is_core_scenario(p_scenario text)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select coalesce(p_scenario,'') between '001' and '034';
$$;

revoke all on function public.igr_v13_is_core_scenario(text) from public, anon, authenticated;
grant execute on function public.igr_v13_is_core_scenario(text) to service_role;
