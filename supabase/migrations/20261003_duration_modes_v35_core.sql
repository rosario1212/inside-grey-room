-- Inside Grey Room v35 — SHORT / LONG duration presets.
-- Existing in-progress rooms without duration_mode keep legacy timing.
create or replace function public.igr_v35_duration_seconds(p_mode text,p_kind text)
returns integer language sql immutable set search_path='' as $$
select case coalesce(p_mode,'legacy')
 when 'short' then case p_kind when 'pre_investigation' then 120 when 'interrogation' then 300 when 'cycle_debrief' then 90 when 'confrontation' then 120 when 'assembly' then 150 when 'judicial_short' then 90 when 'judicial_long' then 120 when 'witness' then 180 when 'final_debrief' then 120 else null end
 when 'long' then case p_kind when 'pre_investigation' then 180 when 'interrogation' then 480 when 'cycle_debrief' then 120 when 'confrontation' then 240 when 'assembly' then 240 when 'judicial_short' then 120 when 'judicial_long' then 240 when 'witness' then 240 when 'final_debrief' then 180 else null end
 else case p_kind when 'pre_investigation' then 120 when 'interrogation' then 360 when 'cycle_debrief' then 120 when 'confrontation' then 240 when 'assembly' then 240 when 'judicial_short' then 120 when 'judicial_long' then 180 when 'witness' then 240 when 'final_debrief' then 120 else null end end
$$;
create or replace function public.igr_v35_seconds_label(p_seconds integer) returns text language sql immutable set search_path='' as $$ select lpad((greatest(coalesce(p_seconds,0),0)/60)::text,2,'0')||':'||lpad((greatest(coalesce(p_seconds,0),0)%60)::text,2,'0') $$;
create or replace function public.igr_v35_room_mode(p_room text) returns text language sql stable security definer set search_path='' as $$ select case when state->>'duration_mode' in ('short','long') then state->>'duration_mode' else 'legacy' end from public.igr_v4_rooms where code=upper(trim(p_room)) $$;
create or replace function public.igr_v35_room_seconds(p_room text,p_kind text) returns integer language sql stable security definer set search_path='' as $$ select public.igr_v35_duration_seconds(public.igr_v35_room_mode(p_room),p_kind) $$;
create or replace function public.igr_v35_set_duration_mode(p_code text,p_host_token uuid,p_mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.igr_v4_rooms%rowtype; v_mode text:=lower(trim(coalesce(p_mode,'')));
begin
 if v_mode not in ('short','long') then raise exception 'invalid duration mode'; end if;
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) for update;
 if not found or r.host_token<>p_host_token then raise exception 'forbidden'; end if;
 if r.status<>'lobby' or r.phase<>'lobby' then raise exception 'duration mode locked'; end if;
 update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(v_mode),true),updated_at=now() where code=r.code;
 return jsonb_build_object('ok',true,'mode',v_mode);
end $$;
create or replace function public.igr_v35_apply_room_duration() returns trigger language plpgsql set search_path='' as $$
declare v_mode text; v_kind text; v_seconds integer;
begin
 if tg_op='INSERT' then if coalesce(new.state->>'duration_mode','') not in ('short','long') then new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{duration_mode}',to_jsonb('long'::text),true); end if; return new; end if;
 v_mode:=new.state->>'duration_mode'; if v_mode not in ('short','long') then return new; end if;
 if not (new.phase is distinct from old.phase or new.phase_started_at is distinct from old.phase_started_at) or new.phase_started_at is null then return new; end if;
 v_kind:=case new.phase when 'initial_debrief' then 'pre_investigation' when 'interrogation' then 'interrogation' when 'cycle_debrief' then 'cycle_debrief' when 'event_confrontation' then 'confrontation' when 'event_assembly' then 'assembly' when 'event_requete' then 'judicial_short' when 'event_saisine' then 'judicial_short' when 'annex_juge' then 'judicial_long' when 'annex_temoin' then 'witness' when 'final_debrief' then 'final_debrief' else null end;
 if v_kind is not null then v_seconds:=public.igr_v35_duration_seconds(v_mode,v_kind); new.phase_ends_at:=new.phase_started_at+make_interval(secs=>v_seconds); end if;
 return new;
end $$;
drop trigger if exists zz_igr_v35_apply_room_duration on public.igr_v4_rooms;
create trigger zz_igr_v35_apply_room_duration before insert or update on public.igr_v4_rooms for each row execute function public.igr_v35_apply_room_duration();
grant execute on function public.igr_v35_set_duration_mode(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_v35_room_mode(text) to anon,authenticated;
grant execute on function public.igr_v35_room_seconds(text,text) to anon,authenticated;
