-- v708: Direct unclocked Judge courtroom at cycle 3 end, server-synced agenda.
-- Without Judge: preserve timed audience and timed defendant turns.
CREATE OR REPLACE FUNCTION public.igr_v52_begin_stage(p_room text, p_stage text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  p public.igr_v4_players%rowtype;
  q jsonb='[]'::jsonb;
  first jsonb;
  phase_name text;
  next_stage text;
  req int;
  vote_req int;
  speech_seconds int;
  defense_seconds int;
  lawyer_id uuid;
  lawyer_pseudo text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  if public.igr_v44_judge_present(p_room) and p_stage in ('courtroom','audience','defenses') then
    update public.igr_v4_rooms set phase='final_suspect_defenses',phase_started_at=now(),phase_ends_at=null,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),
        '{v52_stage}',to_jsonb('courtroom'::text),true),
        '{v52_queue}','[]'::jsonb,true),
        '{v52_status}',to_jsonb('courtroom'::text),true),
        '{v708_court_step}',to_jsonb('seating'::text),true),
        '{v708_checks}','[]'::jsonb,true),
        '{v708_heard}','[]'::jsonb,true),
        '{v708_last_word}','[]'::jsonb,true),
      updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,visibility,payload)
      values(p_room,'phase','public',jsonb_build_object('title','TRIBUNAL FINAL',
       'text','Le Juge ouvre le procès. Disposition suggérée, accusation, débats, conclusions et vote individuel. Aucun chronomètre.'));
    return;
  end if;
  speech_seconds:=case when public.igr_v44_judge_present(p_room) and r.state->>'duration_mode'='short' then 60 when public.igr_v44_judge_present(p_room) then 90 when r.state->>'duration_mode'='short' then 60 else 120 end;
  defense_seconds:=case when public.igr_v44_judge_present(p_room) then 0 when r.state->>'duration_mode'='short' then 120 else 180 end;

  if p_stage='audience' then
    delete from public.igr_v4_actions
    where room_code=p_room
      and action_type in ('final_lock','judge_integrity_vote','v52_audience_initial','v52_audience_spoken','v52_audience_skip','v52_defense_spoken','v52_defense_skip','v52_lawyer_spoken','v52_lawyer_skip');
    for p in
      select * from public.igr_v4_players
      where room_code=p_room and (case when public.igr_v44_judge_present(p_room) then public.igr_v52_investigation_role(public_role) else public_role in ('enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste') end)
      order by case public_role when 'enqueteur' then 1 when 'analyste' then 2 when 'inspecteur' then 3 when 'expert' then 4 when 'procureur' then 5 when 'juge' then 6 when 'journaliste' then 7 else 99 end,seat_index
    loop
      q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role,'seconds',speech_seconds,'required',false));
    end loop;
    phase_name:='final_audience'; next_stage:='defenses';

  elsif p_stage='defenses' then
    for p in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot nulls last,seat_index loop
      lawyer_id:=null; lawyer_pseudo:=null;
      select x.lawyer_id,l.pseudo into lawyer_id,lawyer_pseudo
      from public.igr_v43_lawyer_representations x
      join public.igr_v4_players l on l.id=x.lawyer_id
      where x.room_code=p_room and x.client_id=p.id limit 1;
      q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','suspect','seconds',defense_seconds,'required',false,'lawyer_id',case when lawyer_id is null then null else lawyer_id::text end,'lawyer_pseudo',lawyer_pseudo));
    end loop;
    phase_name:='final_suspect_defenses'; next_stage:='locking';

  elsif p_stage='lawyers' then
    perform public.igr_v52_begin_stage(p_room,'locking'); return;

  elsif p_stage='locking' then
    select count(*) into req from public.igr_v4_players where room_code=p_room and public.igr_v52_investigation_role(public_role);
    if r.scenario_id='029' then vote_req:=0;
    else
      select count(*) into vote_req from public.igr_v4_players
      where room_code=p_room and public_role in ('enqueteur','analyste','procureur')
      and public.igr_v44_judge_present(p_room);
    end if;
    update public.igr_v4_rooms
    set phase='locking',phase_started_at=now(),phase_ends_at=null,
        state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb('locking'::text),true),'{v52_final_reassessment}','true'::jsonb,true),'{v52_locks_required}',to_jsonb(req),true),'{v52_locks_received}','0'::jsonb,true),'{v52_integrity_required}',to_jsonb(vote_req),true),
        updated_at=now()
    where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,visibility,payload)
    values(p_room,'phase','public',
      case when r.scenario_id='029' then
        jsonb_build_object('title','CONCLUSION · LE CYCLE MORT',
          'text','L’enquête se conclut par le rapport sur Los Salcedo et le quatrième témoin. Chaque membre du camp Enquête confirme sa participation, sans noter les témoins comme des suspects.')
      else jsonb_build_object('title','DÉCISION FINALE',
          'text','Après toutes les défenses : 0 aucune, 1 secondaire, 2 principale. Chaque rôle du camp Enquête verrouille une seule lecture. Aucun nouvel élément ne peut entrer.')
      end);
    return;
  else
    raise exception 'invalid stage';
  end if;

  if jsonb_array_length(q)=0 then perform public.igr_v52_begin_stage(p_room,next_stage); return; end if;
  first:=q->0;
  update public.igr_v4_rooms
  set phase=phase_name,phase_started_at=now(),phase_ends_at=case when p_stage='audience' and public.igr_v44_judge_present(p_room) then now()+interval '25 seconds' else null end,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb(p_stage),true),'{v52_queue}',q,true),'{v52_index}','0'::jsonb,true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(first->>'player_id'),true),'{v52_current_role}',to_jsonb(first->>'role'),true),
      updated_at=now()
  where code=p_room;

  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
  values(p_room,'phase','public',
    case p_stage
      when 'audience' then case when public.igr_v44_judge_present(p_room) then jsonb_build_object('title','AUDIENCE PRÉPARATOIRE','text','Audience réservée au camp Enquête : Enquêteur, Analyste, Inspecteur, Expert, Procureur, Juge si présents. COURT 01:00 / LONG 01:30 chacun, ou Passer. Suspects et Avocat interviennent ensuite au tribunal. Aucun verdict à l’audience.') else case when r.scenario_id in ('026','027','028') then jsonb_build_object('title','AUDIENCE FINALE · TERREUR','text','L’Enquêteur puis l’Analyste présentent leur lecture des faits (COURT 01:00 / LONG 02:00 chacun). Ils peuvent passer. Les trois suspects se défendent ensuite, avant les deux conclusions individuelles.') else jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.') end end
      else case when r.scenario_id='029' then
        jsonb_build_object('title',case when public.igr_v44_judge_present(p_room) then 'TRIBUNAL · TÉMOINS' else 'PAROLE FINALE DES TÉMOINS' end,
          'text',case when public.igr_v44_judge_present(p_room) then 'Le Juge conduit librement l’audition des témoins, sans chronomètre. Chaque témoin peut répondre ou garder le silence ; le rapport final spécifique au dossier 029 reste inchangé.' else 'Chaque témoin peut préciser ce qu’il sait, se taire ou demander des éclaircissements. COURT 02:00 / LONG 03:00.' end)
      else case when public.igr_v44_judge_present(p_room) then jsonb_build_object('title','TRIBUNAL','text','Tribunal sans chronomètre : le Juge donne la parole au Suspect, à son Avocat officiel et aux autres participants pour les questions et confrontations. Le Suspect signale qu’il a pu se défendre avant la clôture par le Juge. Vote secret ensuite.') when r.scenario_id in ('026','027','028') then jsonb_build_object('title','DÉFENSES FINALES · TERREUR','text','Les trois suspects présentent leur défense à tour de rôle (COURT 02:00 / LONG 03:00 chacun), ou passent. Il n’y a ni Avocat ni Juge dans TERREUR.') else jsonb_build_object('title','DÉFENSES FINALES','text','Chaque suspect peut parler COURT 02:00 / LONG 03:00 ou passer. Son Avocat officiel partage ce temps ; il n’existe pas de second plaidoyer séparé.') end
      end
    end
  );
end$function$;
CREATE OR REPLACE FUNCTION public.igr_v4_tick(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;status text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;if not found or r.status<>'playing' then return;end if;
 perform public.igr_v44_maintain(r.code);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if coalesce((r.state->>'timer_paused')::boolean,false) and r.state->>'timer_paused_phase'=r.phase and (r.state->>'timer_paused_started_at')::timestamptz=r.phase_started_at then return;end if;
 if r.phase='role_reading' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v4_start_cycle(r.code,1);return;end if;
 if r.phase='initial_debrief' and (r.phase_ends_at is null or now()>=r.phase_ends_at) then perform public.igr_v4_start_cycle(r.code,greatest(1,r.cycle));return;end if;
 if r.phase='investigation_assembly' then
   if r.phase_ends_at is null or now()<r.phase_ends_at then return;end if;
   if r.cycle=1 then update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;else perform public.igr_v13_enter_event_select(r.code,3,true);end if;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'free_investigation','public',jsonb_build_object('title','ENQUÊTE OUVERTE','text','Les interactions redeviennent libres. Seules les convocations officielles de la Grey Room sont prioritaires.','cycle',r.cycle));return;
 end if;
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,case when public.igr_v44_judge_present(r.code) then 'courtroom' else 'audience' end);end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if r.phase_ends_at is not null and now()>=r.phase_ends_at then if status='active' then perform public.igr_v52_advance(r.code,'timeout'); elsif status='waiting' and public.igr_v44_judge_present(r.code) then
     if r.phase='final_audience' then perform public.igr_v52_advance(r.code,'waiting_timeout');
     else update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>coalesce((r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0)->>'seconds')::int,180)),state=jsonb_set(jsonb_set(r.state,'{v52_status}',to_jsonb('active'::text),true),'{v705_defense_done}','false'::jsonb,true),updated_at=now() where code=r.code;
     end if;end if;end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$;
CREATE OR REPLACE FUNCTION public.igr_v59_host_recover(p_code text, p_host_token uuid, p_player_id uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;q jsonb;absent jsonb;note text;st jsonb;
begin
 select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) and host_token=p_host_token for update;if not found then raise exception 'forbidden';end if;
 if r.status<>'playing' or r.phase not in ('final_audience','final_suspect_defenses','final_lawyer_opinions','locking') then raise exception 'wrong phase';end if;
 if coalesce((r.state->>'timer_paused')::boolean,false) then raise exception 'resume timer first';end if;
 if now()<coalesce(r.phase_started_at,now())+make_interval(secs=>case when r.phase='locking' then 120 else 60 end) then raise exception 'recovery delay not reached';end if;
 select * into p from public.igr_v4_players where id=p_player_id and room_code=r.code;if not found or p.is_host then raise exception 'invalid absent player';end if;
 note:=left(trim(coalesce(p_reason,'')),180);if length(note)<8 then raise exception 'absence reason required';end if;perform igr_private.assert_ugc(note,180,false);
 absent:=coalesce(r.state->'v59_absent','[]'::jsonb);if absent ? p.id::text then return jsonb_build_object('ok',true,'already_absent',true);end if;
 if r.phase<>'locking' then
  q:=r.state->'v52_queue'->coalesce((r.state->>'v52_index')::int,0);
  if r.phase='final_suspect_defenses' and r.state->>'v52_stage'='courtroom' then
    if p.public_role<>'suspect' then raise exception 'only an absent defendant can be marked in courtroom';end if;
  elsif r.state->>'v52_status'<>'waiting' or q->>'player_id'<>p.id::text then raise exception 'only waiting current player';end if;
 else
  if not (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') then raise exception 'not a final voter';end if;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') and (p.public_role not in ('enqueteur','analyste','procureur') or exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='judge_integrity_vote') or not public.igr_v44_judge_present(r.code)) and not (r.scenario_id='027' and p.public_role='inspecteur' and nullif(r.state#>>'{terror_runtime,decision}','') is null) then raise exception 'player already completed';end if;
 end if;
 update public.igr_v4_rooms set state=jsonb_set(state,'{v59_absent}',absent||jsonb_build_array(p.id::text),true),updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'final_absence','public',jsonb_build_object('title','ABSENCE CONFIRMÉE','text',p.pseudo||' : absent. Aucune décision inventée. Motif : '||note,'player_id',p.id));
 if r.phase='locking' then st:=public.igr_v52_maybe_finish(r.code);
  elsif r.phase='final_suspect_defenses' and r.state->>'v52_stage'='courtroom' then st:='{}'::jsonb;
  else perform public.igr_v52_advance(r.code,'host_confirmed_absence');st:='{}'::jsonb;end if;
 return jsonb_build_object('ok',true)||st;
end$function$;
