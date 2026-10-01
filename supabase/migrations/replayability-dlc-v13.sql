-- Inside Grey Room v13.1 — replayability + DLC state scaffolding
-- This file is additive. It does NOT fabricate canonical variants.
-- A scenario becomes replay-enabled only when pack.replay_variants contains >=3 fully authored variants.

create or replace function public.igr_v13_replay_variant_count(p_scenario text)
returns integer language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_array_length(coalesce(pack->'replay_variants','[]'::jsonb)),0)
  from public.igr_v4_scenario_packs where scenario_id=p_scenario;
$$;

create or replace function public.igr_v13_choose_replay_variant(p_room text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; variants jsonb; chosen jsonb; chosen_id text; previous text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then raise exception 'room not found'; end if;
  select coalesce(pack->'replay_variants','[]'::jsonb) into variants from public.igr_v4_scenario_packs where scenario_id=r.scenario_id;
  if jsonb_array_length(variants)<3 then return null; end if;
  previous:=nullif(r.state->>'last_replay_variant','');
  select v into chosen
  from jsonb_array_elements(variants) v
  where nullif(v->>'id','') is not null and (previous is null or v->>'id'<>previous)
  order by gen_random_uuid() limit 1;
  if chosen is null then select v into chosen from jsonb_array_elements(variants) v order by gen_random_uuid() limit 1; end if;
  chosen_id:=chosen->>'id';
  update public.igr_v4_rooms
     set state=jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{replay_variant}',chosen,true),'{replay_variant_id}',to_jsonb(chosen_id),true),updated_at=now()
   where code=r.code;
  return chosen_id;
end $$;

-- Server-only accessor. Never include replay_variant or replay_variant_id in client sync payloads.
create or replace function public.igr_v13_room_replay_variant(p_room text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(state->'replay_variant','{}'::jsonb) from public.igr_v4_rooms where code=p_room;
$$;

create or replace function public.igr_v13_init_dlc_world_state(p_room text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; w jsonb:='{}'::jsonb;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
  if r.scenario_id between '021' and '025' then
    w:=jsonb_build_object('kind','omerta','active',0,'protected',0,'missing',0,'dead',0,'circle','stable');
  elsif r.scenario_id between '026' and '028' then
    w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',case r.scenario_id when '026' then 9 when '027' then 6 else 3 end,'perimeter','stable','liaison','active');
  elsif r.scenario_id between '029' and '031' then
    w:=jsonb_build_object('kind','cartel','witnesses_total',6,'witnesses_available',6,'integrity','stable','protection','stable');
  elsif r.scenario_id between '032' and '034' then
    w:=jsonb_build_object('kind','regime','archives_total',9,'archives_open',0,'power_chain','partial','identities_total',5,'identities_confirmed',0);
  else return; end if;
  update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{dlc_world}',w,true),updated_at=now() where code=r.code;
end $$;

revoke all on function public.igr_v13_replay_variant_count(text) from public;
revoke all on function public.igr_v13_choose_replay_variant(text) from public;
revoke all on function public.igr_v13_room_replay_variant(text) from public;
revoke all on function public.igr_v13_init_dlc_world_state(text) from public;
grant execute on function public.igr_v13_replay_variant_count(text) to service_role;
grant execute on function public.igr_v13_choose_replay_variant(text) to service_role;
grant execute on function public.igr_v13_room_replay_variant(text) to service_role;
grant execute on function public.igr_v13_init_dlc_world_state(text) to service_role;
