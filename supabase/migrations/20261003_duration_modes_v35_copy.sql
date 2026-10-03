-- Rewrite stale v34 timing text in emitted events for rooms using a v35 preset.
create or replace function public.igr_v35_rewrite_timing_event_copy()
returns trigger language plpgsql set search_path='' as $$
declare r public.igr_v4_rooms%rowtype; v_text text; v_seconds integer; v_kind text;
begin
  if new.payload is null or not (new.payload ? 'text') then return new; end if;
  select * into r from public.igr_v4_rooms where code=new.room_code;
  if not found or coalesce(r.state->>'duration_mode','') not in ('short','long') then return new; end if;
  v_text:=new.payload->>'text';
  v_kind:=case
    when new.event_type in ('cycle','interrogation') or r.phase='interrogation' then 'interrogation'
    when r.phase='initial_debrief' then 'pre_investigation'
    when r.phase='cycle_debrief' then 'cycle_debrief'
    when r.phase='event_confrontation' then 'confrontation'
    when r.phase='event_assembly' then 'assembly'
    when r.phase in ('event_requete','event_saisine') then 'judicial_short'
    when r.phase='annex_juge' then 'judicial_long'
    when r.phase='annex_temoin' then 'witness'
    when r.phase='final_debrief' then 'final_debrief'
    else null end;
  if v_kind is null then return new; end if;
  v_seconds:=public.igr_v35_room_seconds(r.code,v_kind);
  if v_kind='interrogation' then v_text:=replace(replace(v_text,'06:00',public.igr_v35_seconds_label(v_seconds)),'08:00',public.igr_v35_seconds_label(v_seconds));
  elsif v_kind in ('pre_investigation','final_debrief') then v_text:=replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds));
  elsif v_kind='cycle_debrief' then v_text:=replace(replace(v_text,'01:30',public.igr_v35_seconds_label(v_seconds)),'02:00',public.igr_v35_seconds_label(v_seconds));
  elsif v_kind='assembly' then v_text:=replace(replace(replace(v_text,'02:30',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds));
  elsif v_kind='judicial_short' then v_text:=replace(replace(v_text,'01:30',public.igr_v35_seconds_label(v_seconds)),'02:00',public.igr_v35_seconds_label(v_seconds));
  else v_text:=replace(replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds)); end if;
  new.payload:=jsonb_set(new.payload,'{text}',to_jsonb(v_text),true);
  return new;
end $$;

drop trigger if exists zz_igr_v35_rewrite_timing_event_copy on public.igr_v4_events;
create trigger zz_igr_v35_rewrite_timing_event_copy before insert on public.igr_v4_events for each row execute function public.igr_v35_rewrite_timing_event_copy();
