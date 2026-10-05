-- Final alignment for the v47 Procureur migration.
-- Production was applied in smaller verified steps; this file makes a fresh migration run converge to the tested definitions.

create or replace function public.igr_v44_player_is_free(p_room text,p_player uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; target uuid; participants jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 select * into p from public.igr_v4_players where id=p_player and room_code=p_room;
 if not found or r.status<>'playing' or r.cycle not between 1 and 3 then return false; end if;
 if public.igr_v44_player_has_private_meeting(p_room,p_player) then return false; end if;
 if r.phase in ('briefing','role_reading','initial_debrief','trame','closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') then return false; end if;
 if r.phase in ('interrogation_select','event_select','annex_procureur') then return true; end if;
 if r.phase='cycle_debrief' then return p.public_role not in ('enqueteur','analyste'); end if;
 if r.phase='interrogation' then
  begin target:=nullif(r.state->>'current_target','')::uuid; exception when others then target:=null; end;
  if p.public_role in ('enqueteur','analyste') or p.id=target then return false; end if;
  if p.public_role='maitre' and target is not null and exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=p_room and x.lawyer_id=p.id and x.client_id=target) then return false; end if;
  return true;
 end if;
 if r.phase='event_confrontation' then
  participants:=coalesce(r.state->'event_targets','[]'::jsonb);
  if p.public_role in ('enqueteur','analyste') or participants ? p.id::text then return false; end if;
  if p.public_role='maitre' and exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=p_room and x.lawyer_id=p.id and participants ? x.client_id::text) then return false; end if;
  return true;
 end if;
 if r.phase in ('event_assembly','event_analysis','event_signature') then participants:=coalesce(r.state->'event_participants','[]'::jsonb); return not (participants ? p.id::text); end if;
 if r.phase='annex_inspecteur' then return p.public_role<>'inspecteur'; end if;
 if r.phase='annex_expert' then return p.public_role<>'expert'; end if;
 if r.phase='annex_temoin' then return p.public_role not in ('temoin','enqueteur'); end if;
 if r.phase='annex_journaliste' then return p.public_role<>'journaliste'; end if;
 if r.phase='event_negociation' then return p.public_role not in ('maitre','procureur'); end if;
 if r.phase='event_enquete_croisee' then return p.public_role not in ('inspecteur','journaliste'); end if;
 return true;
end $$;

create or replace function public.igr_v47_offer_cooperation(p_code text,p_player_token uuid,p_suspect uuid,p_against uuid,p_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; s public.igr_v4_players%rowtype; a public.igr_v4_players%rowtype; iid bigint; did bigint; note_text text;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'procureur' then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code;
 select * into s from public.igr_v4_players where id=p_suspect and room_code=r.code and public_role='suspect';
 select * into a from public.igr_v4_players where id=p_against and room_code=r.code and public_role='suspect' and id<>s.id;
 if s.id is null or a.id is null then raise exception 'invalid suspects'; end if;
 select i.id into iid from public.igr_v47_prosecutor_interviews i where i.room_code=r.code and i.prosecutor_id=me.id and i.target_id=s.id and i.cycle=r.cycle and i.status='active' limit 1;
 if iid is null then raise exception 'cooperation only during active suspect interview'; end if;
 if exists(select 1 from public.igr_v47_prosecutor_cooperations c where c.room_code=r.code and c.prosecutor_id=me.id and c.suspect_id=s.id and c.status='pending') then raise exception 'cooperation already pending'; end if;
 note_text:=left(trim(coalesce(p_note,'')),180); if note_text<>'' then perform igr_private.assert_ugc(note_text,180,false); end if;
 insert into public.igr_v47_prosecutor_cooperations(room_code,prosecutor_id,suspect_id,against_player_id,interview_id,cycle,note) values(r.code,me.id,s.id,a.id,iid,r.cycle,note_text) returning id into did;
 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'prosecutor_cooperation','private',s.id,jsonb_build_object('title','PROPOSITION DU PARQUET','text','Le Procureur vous propose de coopérer contre '||a.pseudo||'. Cet accord n’oblige jamais le Juge à suivre le Procureur.','cooperation_id',did,'against',a.pseudo));
 return jsonb_build_object('ok',true,'cooperation_id',did,'against',a.pseudo);
end $$;

create or replace function public.igr_v47_make_reveal(p_room text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 base jsonb; r public.igr_v4_rooms%rowtype; pack jsonb; truth_levels jsonb;
 enq public.igr_v4_players%rowtype; proc public.igr_v4_players%rowtype; judge public.igr_v4_players%rowtype;
 proc_rt public.igr_v47_prosecutor_runtime%rowtype;
 enq_levels jsonb:='{}'::jsonb; proc_levels jsonb:='{}'::jsonb; judge_levels jsonb:='{}'::jsonb; authority_levels jsonb:='{}'::jsonb;
 authority_role text:='enqueteur'; responsibilities jsonb:='[]'::jsonb; results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
 it jsonb; s public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype; lr record;
 truth int; enql int; procl int; judgel int; authl int; total int:=0; camp_exact int:=0; proc_exact int:=0;
 secondary_success boolean:=false; camp_axis boolean:=false; main_axis boolean:=false; score int:=0;
 target_truth int:=-1; target_proc int:=-1; target_auth int:=-1; target_name text; role_name text; current_success boolean;
begin
 base:=public.igr_v44_make_reveal(p_room);
 select * into r from public.igr_v4_rooms where code=p_room;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 truth_levels:=coalesce(pack->'truth'->'levels','[]'::jsonb);
 select * into enq from public.igr_v4_players where room_code=p_room and public_role='enqueteur' order by seat_index limit 1;
 select * into proc from public.igr_v4_players where room_code=p_room and public_role='procureur' order by seat_index limit 1;
 select * into judge from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1;
 if enq.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into enq_levels from public.igr_v4_actions where room_code=p_room and player_id=enq.id and action_type='final_lock' order by id desc limit 1; enq_levels:=coalesce(enq_levels,'{}'::jsonb); end if;
 if proc.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into proc_levels from public.igr_v4_actions where room_code=p_room and player_id=proc.id and action_type='final_lock' order by id desc limit 1; proc_levels:=coalesce(proc_levels,'{}'::jsonb); perform public.igr_v47_ensure_prosecutor_runtime(p_room,proc.id); select * into proc_rt from public.igr_v47_prosecutor_runtime where room_code=p_room and prosecutor_id=proc.id; end if;
 if judge.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into judge_levels from public.igr_v4_actions where room_code=p_room and player_id=judge.id and action_type='final_lock' order by id desc limit 1; judge_levels:=coalesce(judge_levels,'{}'::jsonb); authority_levels:=judge_levels; authority_role:='juge'; elsif proc.id is not null then authority_levels:=proc_levels; authority_role:='procureur'; else authority_levels:=enq_levels; authority_role:='enqueteur'; end if;
 for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot loop
  truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0); enql:=coalesce((enq_levels->>s.id::text)::int,-1); procl:=coalesce((proc_levels->>s.id::text)::int,-1); judgel:=coalesce((judge_levels->>s.id::text)::int,-1); authl:=coalesce((authority_levels->>s.id::text)::int,-1);
  total:=total+1; if authl=truth then camp_exact:=camp_exact+1; end if; if proc.id is not null and procl=truth then proc_exact:=proc_exact+1; end if;
  responsibilities:=responsibilities||jsonb_build_array(jsonb_build_object('player_id',s.id,'pseudo',s.pseudo,'truth_level',truth,'enqueteur_level',enql,'prosecutor_level',case when proc.id is null then null else procl end,'judge_level',case when judge.id is null then null else judgel end,'authority_level',authl,'authority_role',authority_role));
  if proc.id is not null and proc_rt.protected_target_id=s.id then target_truth:=truth;target_proc:=procl;target_auth:=authl;target_name:=s.pseudo; end if;
 end loop;
 for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
  role_name:=it->>'public_role';
  if role_name in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then it:=jsonb_set(it,'{camp_success}',to_jsonb(camp_exact=total and total>0),true); it:=jsonb_set(it,'{camp_authority_role}',to_jsonb(authority_role),true); end if;
  if role_name='suspect' then
   select * into s from public.igr_v4_players where id=(it->>'player_id')::uuid; truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0); authl:=coalesce((authority_levels->>s.id::text)::int,-1); current_success:=truth=authl;
   it:=jsonb_set(it,'{success}',to_jsonb(current_success),true); it:=jsonb_set(it,'{text}',to_jsonb(case when current_success then 'La version qui fait autorité ('||authority_role||') respecte exactement la frontière réelle de ta responsabilité.' else 'La version qui fait autorité ('||authority_role||') déforme ou manque ta responsabilité réelle.' end),true);
  elsif role_name='maitre' then
   select x.client_id,c.pseudo into lr from public.igr_v43_lawyer_representations x join public.igr_v4_players c on c.id=x.client_id where x.room_code=p_room and x.lawyer_id=(it->>'player_id')::uuid limit 1;
   if found then select * into client from public.igr_v4_players where id=lr.client_id; truth:=coalesce((truth_levels->>(client.internal_slot-1))::int,0); authl:=coalesce((authority_levels->>client.id::text)::int,-1); current_success:=truth=authl; it:=jsonb_set(it,'{success}',to_jsonb(current_success),true); it:=jsonb_set(it,'{text}',to_jsonb(case when current_success then 'La version qui fait autorité protège exactement la responsabilité réelle de ton client '||lr.pseudo||'.' else 'La version qui fait autorité ne correspond pas à la responsabilité réelle de ton client '||lr.pseudo||'.' end),true); end if;
  elsif role_name='procureur' and proc.id is not null then
   if proc_rt.corrupt then
    main_axis:=target_truth>=0 and target_proc>=0 and target_proc<target_truth; camp_axis:=target_truth>=0 and target_auth>=0 and target_auth<target_truth;
    select exists(select 1 from public.igr_v47_prosecutor_cooperations c join public.igr_v4_players a on a.id=c.against_player_id where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted' and c.against_player_id<>proc_rt.protected_target_id and coalesce((authority_levels->>a.id::text)::int,-1)>coalesce((truth_levels->>(a.internal_slot-1))::int,0)) into secondary_success;
    score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end); score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
    it:=jsonb_set(it,'{success}',to_jsonb(main_axis),true); it:=jsonb_set(it,'{text}',to_jsonb('Procureur corrompu · cible : '||coalesce(target_name,'inconnue')||' · ta version personnelle '||case when main_axis then 'réduit bien son exposition' else 'ne la protège pas assez' end||' · la version d’autorité '||case when camp_axis then 'la protège' else 'ne la protège pas' end||'.'),true); it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis,'secondary',secondary_success,'camp_label','Intérêts corrompus'),true);
   else
    main_axis:=proc_exact=total and total>0; camp_axis:=camp_exact=total and total>0;
    select exists(select 1 from public.igr_v47_prosecutor_cooperations c join public.igr_v4_players a on a.id=c.against_player_id where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted' and coalesce((truth_levels->>(a.internal_slot-1))::int,0)>0) into secondary_success;
    score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end); score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
    it:=jsonb_set(it,'{success}',to_jsonb(main_axis),true); it:=jsonb_set(it,'{text}',to_jsonb(proc_exact||'/'||total||' responsabilités exactes dans ta propre version · version du camp décidée par '||authority_role||' · coopération utile '||case when secondary_success then 'réussie' else 'non obtenue' end||'.'),true); it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis,'secondary',secondary_success,'camp_label','Enquête'),true);
   end if;
   it:=jsonb_set(it,'{score_percent}',to_jsonb(score),true); it:=jsonb_set(it,'{corrupt}',to_jsonb(proc_rt.corrupt),true);
  end if;
  results:=results||jsonb_build_array(it); if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array((it->>'player_id')::uuid); end if;
 end loop;
 return base||jsonb_build_object('responsibilities',responsibilities,'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),'camp_investigation',jsonb_build_object('authority_role',authority_role,'exact',camp_exact,'total',total,'success',camp_exact=total and total>0),'prosecutor_integrity',case when proc.id is null then null else jsonb_build_object('corrupt',proc_rt.corrupt,'protected_target_id',proc_rt.protected_target_id,'protected_target',target_name) end);
end $$;
