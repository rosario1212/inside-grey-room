-- Inside Grey Room v52 — route end of cycle 3 into the Final Audience.

create or replace function public.igr_v4_tick(p_room text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare r public.igr_v4_rooms%rowtype;status text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if not found or r.status<>'playing' then return;end if;

 if r.phase='role_reading' and r.phase_ends_at is not null and now()>=r.phase_ends_at then
   perform public.igr_v4_start_cycle(r.code,1);return;
 end if;
 if r.phase='initial_debrief' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then
   perform public.igr_v4_start_cycle(r.code,greatest(1,r.cycle));return;
 end if;
 if r.phase='investigation_assembly' then
   if r.phase_ends_at is null or now()<r.phase_ends_at then return;end if;
   if r.cycle=1 then
     update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
   else
     perform public.igr_v13_enter_event_select(r.code,3,true);
   end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload)
   values(r.code,'free_investigation','public',jsonb_build_object('title','ENQUÊTE OUVERTE','text','Les interactions redeviennent libres. Seules les convocations officielles de la Grey Room sont prioritaires.','cycle',r.cycle));
   return;
 end if;

 if r.phase='closed' then
   if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,'audience');end if;
   return;
 end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then
   status:=coalesce(r.state->>'v52_status','waiting');
   if status='active' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_advance(r.code,'timeout');end if;
   return;
 end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;

 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then
   perform public.igr_v4_emit_trame(r.code);
   update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then
   perform public.igr_v52_begin_stage(r.code,'locking');
 end if;
end$$;