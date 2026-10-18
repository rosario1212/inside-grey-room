-- v100: internal-only preview and release preflight. NOT an activation hook.
-- All manuscript-derived information remains in the private schema.
create or replace function igr_private.igr_v100_preflight(p_scenario text)
returns jsonb language sql security definer set search_path to ''
as $v100$
  with m as (
    select variant_id, manuscript, editorial_status, approved_by, approved_at
      from igr_private.igr_v99_variant_manuscripts
      where scenario_id=p_scenario
  ), rollup as (
    select count(*)::int as stored,
      count(*) filter(where variant_id='A')::int as a_count,
      count(*) filter(where variant_id='B')::int as b_count,
      count(*) filter(where variant_id='C')::int as c_count,
      count(*) filter(where editorial_status='ready' and approved_by is not null
         and approved_at is not null and manuscript->>'status'='ready'
         and manuscript->>'human_review_approved'='true')::int as approved,
      count(*) filter(where exists (
        select 1 from jsonb_array_elements(coalesce(manuscript->'revelations','[]'::jsonb)) e
        where e->>'kind'='guaranteed' and e->>'min_cycle'='3'
      ))::int as cycle_three_guarantees,
      count(*) filter(where p_scenario between '021' and '025' and
        (manuscript->'saga' is null or
        manuscript->'saga'->>'collection' <> 'OMERTA'))::int as omerta_lock_missing
    from m
  )
  select jsonb_build_object(
    'stored',stored,'approved',approved,'cycle_three_guarantees',cycle_three_guarantees,
    'omerta_lock_missing',omerta_lock_missing,
    'release_eligible',stored=3 and a_count=1 and b_count=1 and c_count=1
       and approved=3 and cycle_three_guarantees=3 and omerta_lock_missing=0
  ) from rollup
$v100$;

-- Generate a legacy-shaped runtime pack for an editor-only dry run.
-- This is not consumed by any running game, nor granted to API roles.
create or replace function igr_private.igr_v100_preview_runtime_pack(p_scenario text,p_variant text)
returns jsonb language plpgsql security definer set search_path to ''
as $v100$
declare
  original jsonb;
  v jsonb;
  card jsonb;
  rel jsonb;
  cards jsonb := '[]'::jsonb;
  rels jsonb := '{}'::jsonb;
  lvl jsonb := '[]'::jsonb;
  chars jsonb := '[]'::jsonb;
  steps jsonb := '[]'::jsonb;
  x record;
  t jsonb;
begin
  select p.pack into original from public.igr_v4_scenario_packs p where p.scenario_id=p_scenario;
  select m.manuscript into v from igr_private.igr_v99_variant_manuscripts m
     where m.scenario_id=p_scenario and m.variant_id=p_variant;
  if original is null or v is null then return null; end if;
  if v->>'id'<>p_variant then raise exception 'variant id mismatch'; end if;
  for card in select value from jsonb_array_elements(v->'private_cards')
     order by (value->>'slot')::int loop
    cards := cards || jsonb_build_array(jsonb_build_object(
       'place',card->>'identity','anchors',card->>'what_you_know',
       'hide',card->>'what_you_hide','chronology',card->>'your_chronology',
       'objective_main',card->>'objective','position',card->>'objective'
    ));
    chars := chars || jsonb_build_array(jsonb_build_object(
       'slot',(card->>'slot')::int,'place',card->>'identity',
       'anchors',card->>'what_you_know','hide',card->>'what_you_hide',
       'chronology',card->>'your_chronology'
    ));
  end loop;
  if jsonb_array_length(cards)<>(v->>'suspect_count')::int
    and jsonb_array_length(cards)<>(select jsonb_array_length(p.pack->'suspects')
      from public.igr_v4_scenario_packs p where p.scenario_id=p_scenario) then
       raise exception 'suspect count mismatch';
  end if;
  for x in select key,value from jsonb_each(v->'relationships') loop
    select coalesce(jsonb_agg(jsonb_build_object(
       'slot',(r->>'target_slot')::int,
       'text','Ce que tu sais — ' || (r->>'known_fact') ||
              E'\n\nCe que tu peux lui demander — ' || (r->>'conversation_tension')
    ) order by ord),'[]'::jsonb) into rel
    from jsonb_array_elements(x.value) with ordinality as y(r,ord);
    rels := jsonb_set(rels,array[x.key],rel,true);
  end loop;
  for x in select key,value from jsonb_each(v->'canonical_truth'->'responsibility_by_slot')
     order by key::int loop
    lvl := lvl || jsonb_build_array((x.value#>>'{}')::int);
  end loop;
  select coalesce(jsonb_agg(value->>'what' order by ord),'[]'::jsonb)
    into steps from jsonb_array_elements(v->'canonical_truth'->'timeline')
      with ordinality as y(value,ord);
  t := (coalesce(original->'truth','{}'::jsonb)
      || jsonb_build_object('summary',v->'canonical_truth'->'summary','levels',lvl));
  t := jsonb_set(t,'{cinematic}',coalesce(t->'cinematic','{}'::jsonb) ||
       jsonb_build_object('timeline',steps,'characters',chars),true);
  return original || jsonb_build_object(
    'context',v->'public_briefing','suspects',cards,'relations',rels,
    'truth',t
  );
end $v100$;

revoke all on function igr_private.igr_v100_preflight(text) from public,anon,authenticated;
revoke all on function igr_private.igr_v100_preview_runtime_pack(text,text) from public,anon,authenticated;

comment on function igr_private.igr_v100_preview_runtime_pack(text,text) is
'INTERNAL AUTHOR QA ONLY. Must never be invoked by client RPC. Does not change any production scenario.';
