-- Inside Grey Room v35 — keep emitted phase/cycle copy aligned with duration_mode.
create or replace function public.igr_v35_rewrite_timing_event_copy()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  v_text text;
  v_seconds integer;
begin
  if new.payload is null or not (new.payload ? 'text') then return new; end if;
  select * into r from public.igr_v4_rooms where code=new.room_code;
  if not found or coalesce(r.state->>'duration_mode','') not in ('short','long') then return new; end if;
  v_text:=new.payload->>'text';

  if new.event_type='cycle' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'interrogation');
    v_text:=replace(replace(v_text,'06:00',public.igr_v35_seconds_label(v_seconds)),'08:00',public.igr_v35_seconds_label(v_seconds));
  elsif new.event_type='interrogation' or r.phase='interrogation' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'interrogation');
    v_text:=replace(replace(v_text,'06:00',public.igr_v35_seconds_label(v_seconds)),'08:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='initial_debrief' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'pre_investigation');
    v_text:=replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='cycle_debrief' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'cycle_debrief');
    v_text:=replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'01:30',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='event_confrontation' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'confrontation');
    v_text:=replace(replace(v_text,'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='event_assembly' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'assembly');
    v_text:=replace(replace(replace(v_text,'02:30',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase in ('event_requete','event_saisine') then
    v_seconds:=public.igr_v35_room_seconds(r.code,'judicial_short');
    v_text:=replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'01:30',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='annex_juge' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'judicial_long');
    v_text:=replace(replace(v_text,'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='annex_temoin' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'witness');
    v_text:=replace(replace(v_text,'03:00',public.igr_v35_seconds_label(v_seconds)),'04:00',public.igr_v35_seconds_label(v_seconds));
  elsif r.phase='final_debrief' then
    v_seconds:=public.igr_v35_room_seconds(r.code,'final_debrief');
    v_text:=replace(replace(v_text,'02:00',public.igr_v35_seconds_label(v_seconds)),'03:00',public.igr_v35_seconds_label(v_seconds));
  end if;

  new.payload:=jsonb_set(new.payload,'{text}',to_jsonb(v_text),true);
  return new;
end
$$;

drop trigger if exists zz_igr_v35_rewrite_timing_event_copy on public.igr_v4_events;
create trigger zz_igr_v35_rewrite_timing_event_copy
before insert on public.igr_v4_events
for each row execute function public.igr_v35_rewrite_timing_event_copy();
