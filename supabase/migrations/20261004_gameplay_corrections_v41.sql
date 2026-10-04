-- Inside Grey Room v41 — correction consolidation
-- Restore the directed-cycle contract and make cycle copy follow the selected duration mode.

create or replace function public.igr_v13_interrogation_limit(p_room text,p_cycle integer)
returns integer
language plpgsql
stable
security definer
set search_path to ''
as $$
begin
  if p_cycle=1 then return 3; end if;
  if p_cycle=2 then return 2; end if;
  if p_cycle=3 then return 1; end if;
  return 0;
end
$$;

create or replace function public.igr_v4_start_cycle(p_room text,p_cycle integer)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  order_json jsonb;
  st jsonb;
  suspect_count integer;
  lim integer;
  cycle_copy text;
  inter_seconds integer;
  inter_label text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb),count(*)
  into order_json,suspect_count
  from public.igr_v4_players where room_code=p_room and public_role='suspect';

  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    update public.igr_v4_rooms set cycle=p_cycle,phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{heard}','[]'::jsonb,true),'{annex_queue}','[]'::jsonb,true),'{annex_index}','0'::jsonb,true),'{interrogation_order}',order_json,true),updated_at=now()
    where code=p_room;
    return;
  end if;

  lim:=least(public.igr_v13_interrogation_limit(r.code,p_cycle),suspect_count);
  inter_seconds:=coalesce(public.igr_v35_room_seconds(r.code,'interrogation'),360);
  inter_label:=public.igr_v35_seconds_label(inter_seconds);
  st:=coalesce(r.state,'{}'::jsonb);
  st:=jsonb_set(st,'{heard}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_index}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_order}',order_json,true);
  st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true);
  st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true);
  st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
  update public.igr_v4_rooms set cycle=p_cycle,state=st,updated_at=now() where code=p_room;

  if p_cycle=1 then
    update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object('title','CYCLE 1 · PREMIÈRES VERSIONS','text','Trois interrogatoires de '||inter_label||' maximum. L’Enquêteur choisit l’ordre.'));
  else
    perform public.igr_v13_enter_event_select(p_room,3,true);
    cycle_copy:=case
      when p_cycle=2 then 'Trois actions au choix. Maximum deux interrogatoires de '||inter_label||'.'
      else 'Trois actions au choix. Maximum un interrogatoire de '||inter_label||'.'
    end;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE '||p_cycle||case when p_cycle=3 then ' · RÉSOLUTION' else ' · DIRECTION' end,
      'text',cycle_copy
    ));
  end if;
end
$$;
