-- TERREUR role windows: reuse the stable Inspecteur/Expert backend capabilities with DLC-specific identities.
create or replace function public.igr_v4_build_annex_queue(p_room text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; q jsonb:='[]'::jsonb; terror boolean:=false;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 terror:=r.scenario_id in ('026','027','028');
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='inspecteur') then q:=q||jsonb_build_array(jsonb_build_object('role','inspecteur','seconds',180,'title',case when terror then 'LIAISON DE CRISE' else 'ENTRETIEN INSPECTEUR' end)); end if;
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='procureur') then q:=q||jsonb_build_array(jsonb_build_object('role','procureur','seconds',case when r.scenario_id='017' then 360 else 180 end,'title','ENTRETIEN PROCUREUR')); end if;
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='juge') then q:=q||jsonb_build_array(jsonb_build_object('role','juge','seconds',180,'title','ENTRETIEN JUGE')); end if;
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='temoin') then q:=q||jsonb_build_array(jsonb_build_object('role','temoin','seconds',240,'title','FENÊTRE TÉMOINS')); end if;
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='journaliste') then q:=q||jsonb_build_array(jsonb_build_object('role','journaliste','seconds',180,'title','ENTRETIEN JOURNALISTE')); end if;
 if exists(select 1 from public.igr_v4_players where room_code=r.code and public_role='expert') then q:=q||jsonb_build_array(jsonb_build_object('role','expert','seconds',180,'title',case when terror then 'RENSEIGNEMENT' else 'ENTRETIEN EXPERT' end)); end if;
 return q;
end $$;

create or replace function public.igr_v4_start_next_annex_or_trame(p_room text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r public.igr_v4_rooms%rowtype; q jsonb; idx int; item jsonb; secs int; role_name text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 q:=coalesce(r.state->'annex_queue','[]'::jsonb); idx:=coalesce((r.state->>'annex_index')::int,0);
 if jsonb_array_length(q)=0 and idx=0 then q:=public.igr_v4_build_annex_queue(r.code); update public.igr_v4_rooms set state=jsonb_set(state,'{annex_queue}',q,true) where code=r.code; end if;
 if idx<jsonb_array_length(q) then
   item:=q->idx; secs:=coalesce((item->>'seconds')::int,180);
   role_name:=case when r.scenario_id in ('026','027','028') and item->>'role'='inspecteur' then 'Officier de liaison' when r.scenario_id in ('026','027','028') and item->>'role'='expert' then 'Agent de renseignement' else initcap(item->>'role') end;
   update public.igr_v4_rooms set phase='annex_'||(item->>'role'),phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>secs),state=jsonb_set(state,'{annex_index}',to_jsonb(idx+1),true),updated_at=now() where code=r.code;
   insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title',item->>'title','text',case item->>'role' when 'temoin' then 'Enquêteur et Analyste disposent de 4 minutes au total pour entendre le ou les témoins.' else 'Enquêteur + Analyste + '||role_name||' : fenêtre dédiée.' end));
 else
   perform public.igr_v4_emit_trame(r.code);
   update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 end if;
end $$;
