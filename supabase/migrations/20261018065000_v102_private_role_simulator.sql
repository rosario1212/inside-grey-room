-- V102 author-only role/cycle visibility simulation.
-- No public API grants, no live game reads, no manuscript or branch disclosure.
create or replace function igr_private.igr_v102_simulate_role_view(
  p_scenario text,
  p_variant text,
  p_role text,
  p_slot int,
  p_cycle int,
  p_verified_actions text[] default array[]::text[],
  p_unlocked_clues text[] default array[]::text[]
)
returns jsonb language plpgsql security definer set search_path to ''
as $v102$
declare
  v jsonb;
  e jsonb;
  card jsonb;
  visible jsonb := '[]'::jsonb;
  current_audience text;
  event_kind text;
  allowed_role_slot int;
  role_is_private boolean := false;
begin
  if p_cycle not between 0 and 3 then raise exception 'invalid cycle'; end if;
  if p_variant not in ('A','B','C') then raise exception 'invalid variant'; end if;
  if p_slot is not null and p_slot not between 1 and 12 then raise exception 'invalid slot'; end if;
  if p_role is null or p_role not in
     ('suspect','inspecteur','enqueteur','juge','avocat','client',
      'procureur','associe','temoin','expert','journaliste','maitre','hote')
    then raise exception 'invalid role'; end if;

  select m.manuscript into v
  from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=p_scenario and m.variant_id=p_variant;
  if v is null then return null; end if;

  -- A participant only receives their OWN private role card.
  -- For MAITRE (045–049), role-to-slot mapping is fixed.
  if p_scenario between '045' and '049' then
    allowed_role_slot := case p_role
     when 'avocat' then 1 when 'client' then 2 when 'enqueteur' then 3
     when 'procureur' then 4 when 'juge' then 5 when 'associe' then 6
     when 'temoin' then 7 else null end;
    role_is_private := allowed_role_slot is not null
          and p_slot=allowed_role_slot;
  else
    role_is_private := p_role='suspect' and p_slot is not null;
  end if;

  if role_is_private then
    select z.value into card from pg_catalog.jsonb_array_elements(
         coalesce(v->'private_cards','[]'::jsonb)) as z(value)
    where (z.value->>'slot')::int=p_slot
    limit 1;
  end if;

  if p_cycle>0 then
    for e in select value from pg_catalog.jsonb_array_elements(
         coalesce(v->'revelations','[]'::jsonb)) loop
      if coalesce((e->>'min_cycle')::int,999)>p_cycle then continue; end if;
      current_audience := e->>'audience';
      event_kind := e->>'kind';

      if not (
        current_audience='public'
        or (current_audience='investigation' and p_role in ('inspecteur','enqueteur'))
        or (current_audience='role' and e->>'role'=p_role)
        or (current_audience='player' and role_is_private
            and (e->>'target_slot')::int=p_slot)
      ) then continue; end if;

      if event_kind='conditional' and not (
           e->>'trigger_action' = any(coalesce(p_verified_actions,array[]::text[]))
         ) then continue; end if;
      if event_kind='missable' and not (
           e->>'id' = any(coalesce(p_unlocked_clues,array[]::text[]))
         ) then continue; end if;
      if event_kind not in ('guaranteed','conditional','missable') then continue; end if;

      -- Deliberately omit canonical timeline, responsibilities, solution, saga seed.
      visible := visible || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'id', e->>'id','title',e->>'title','text',e->>'text',
          'cycle',(e->>'min_cycle')::int
        )
      );
    end loop;
  end if;

  return pg_catalog.jsonb_build_object(
    'public_briefing',v->>'public_briefing',
    'private_card',card,
    'revelations',visible
  );
end $v102$;

revoke all on function igr_private.igr_v102_simulate_role_view(
  text,text,text,int,int,text[],text[]) from public,anon,authenticated;
comment on function igr_private.igr_v102_simulate_role_view(
  text,text,text,int,int,text[],text[]) is
  'PRIVATE author-only dry run of role-appropriate reveals. Not an application RPC.';
