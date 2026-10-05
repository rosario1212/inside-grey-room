-- Inside Grey Room — duration correction: SHORT interrogation = 6 min, LONG = 8 min.
create or replace function public.igr_v35_duration_seconds(p_mode text,p_kind text)
returns integer language sql immutable set search_path='' as $$
select case coalesce(p_mode,'legacy')
 when 'short' then case p_kind when 'pre_investigation' then 120 when 'interrogation' then 360 when 'cycle_debrief' then 90 when 'confrontation' then 120 when 'assembly' then 150 when 'judicial_short' then 90 when 'judicial_long' then 120 when 'witness' then 180 when 'final_debrief' then 120 else null end
 when 'long' then case p_kind when 'pre_investigation' then 180 when 'interrogation' then 480 when 'cycle_debrief' then 120 when 'confrontation' then 240 when 'assembly' then 240 when 'judicial_short' then 120 when 'judicial_long' then 240 when 'witness' then 240 when 'final_debrief' then 180 else null end
 else case p_kind when 'pre_investigation' then 120 when 'interrogation' then 360 when 'cycle_debrief' then 120 when 'confrontation' then 240 when 'assembly' then 240 when 'judicial_short' then 120 when 'judicial_long' then 180 when 'witness' then 240 when 'final_debrief' then 120 else null end end
$$;

-- Repair any already-created SHORT rooms that still carry the old 5-minute value.
do $$
declare
  r record;
  v_state jsonb;
  v_options jsonb;
begin
  for r in
    select code,state,phase,phase_started_at,phase_ends_at
    from public.igr_v4_rooms
    where state->>'duration_mode'='short'
  loop
    v_state:=coalesce(r.state,'{}'::jsonb);

    if v_state->>'interrogation_seconds'='300' then
      v_state:=jsonb_set(v_state,'{interrogation_seconds}','360'::jsonb,true);
    end if;

    if jsonb_typeof(v_state->'event_options')='array' then
      select coalesce(jsonb_agg(
        case when item->>'key'='interrogation' then
          jsonb_set(
            jsonb_set(item,'{seconds}','360'::jsonb,true),
            '{hint}',
            to_jsonb(regexp_replace(coalesce(item->>'hint',''),'^05:00','06:00')),
            true
          )
        else item end
      ),'[]'::jsonb)
      into v_options
      from jsonb_array_elements(v_state->'event_options') item;
      v_state:=jsonb_set(v_state,'{event_options}',v_options,true);
    end if;

    update public.igr_v4_rooms
    set state=v_state,
        phase_ends_at=case
          when r.phase='interrogation'
           and r.phase_started_at is not null
           and r.phase_ends_at is not null
           and extract(epoch from (r.phase_ends_at-r.phase_started_at))::int=300
          then r.phase_started_at + interval '6 minutes'
          else r.phase_ends_at
        end,
        updated_at=now()
    where code=r.code;
  end loop;
end
$$;
