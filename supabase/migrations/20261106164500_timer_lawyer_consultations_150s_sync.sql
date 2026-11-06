-- IGR timer+rules v20261106: canonical COURT/LONG, accurate notices, lawyer 02:30.
-- Official client: once per cycle; other suspects: once per game.
-- Unanswered requests expire after 45s so one missing lawyer cannot freeze the room.
-- Latest server definitions are deliberately carried forward, including v65 guards.
CREATE OR REPLACE FUNCTION public.igr_v35_apply_room_duration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_mode text; v_kind text; v_seconds integer; begin if tg_op='INSERT' then if coalesce(new.state->>'duration_mode','') not in ('short','long') then new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{duration_mode}',to_jsonb('long'::text),true); end if; return new; end if; if coalesce(new.state->>'duration_mode','') not in ('short','long') and coalesce(old.state->>'duration_mode','') in ('short','long') then new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{duration_mode}',old.state->'duration_mode',true);end if; v_mode:=new.state->>'duration_mode'; if coalesce(v_mode,'') not in ('short','long') then return new; end if; if not (new.phase is distinct from old.phase or new.phase_started_at is distinct from old.phase_started_at) or new.phase_started_at is null then return new; end if; v_kind:=case new.phase when 'initial_debrief' then 'pre_investigation' when 'interrogation' then 'interrogation' when 'cycle_debrief' then 'cycle_debrief' when 'event_confrontation' then 'confrontation' when 'event_assembly' then 'assembly' when 'event_requete' then 'judicial_short' when 'event_saisine' then 'judicial_short' when 'annex_juge' then 'judicial_long' when 'annex_temoin' then 'witness' when 'final_debrief' then 'final_debrief' else null end; if v_kind is not null then v_seconds:=public.igr_v35_duration_seconds(v_mode,v_kind); end if; if v_seconds is not null then new.phase_ends_at:=new.phase_started_at+make_interval(secs=>v_seconds); end if; return new; end $function$


CREATE OR REPLACE FUNCTION public.igr_v50_tick_legacy(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  heard jsonb;
  target text;
  q jsonb;
  idx integer;
  item jsonb;
  next_idx integer;
  defq jsonb;
  inter_count integer;
  inter_limit integer;
  active_event text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found or r.status<>'playing' then return; end if;
  if r.phase_ends_at is null or now()<r.phase_ends_at then return; end if;

  if r.phase='briefing' then
    update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '5 minutes',updated_at=now() where code=r.code;
  elsif r.phase='role_reading' then
    update public.igr_v4_rooms set phase='initial_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF INITIAL','text','Enquêteur + Analyste : '||public.igr_v35_seconds_label(public.igr_v35_room_seconds(r.code,'pre_investigation'))||'.'));
  elsif r.phase='initial_debrief' then
    perform public.igr_v4_start_cycle(r.code,1);
  elsif r.phase='interrogation' then
    heard:=coalesce(r.state->'heard','[]'::jsonb);
    target:=r.state->>'current_target';
    if target is not null and not (heard ? target) then heard:=heard||to_jsonb(target); end if;
    if coalesce((r.state->>'v13_event_mode')::boolean,false) then
      update public.igr_v4_rooms set state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
      perform public.igr_v13_complete_event(r.code,'interrogation');
    elsif public.igr_v13_is_core_scenario(r.scenario_id) then
      inter_count:=coalesce((r.state->>'interrogation_count')::integer,0)+1;
      inter_limit:=coalesce((r.state->>'interrogation_limit')::integer,3);
      if inter_count>=inter_limit then
        update public.igr_v4_rooms
        set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',
            state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'),updated_at=now()
        where code=r.code;
        insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉBRIEF','text',public.igr_v35_seconds_label(public.igr_v35_room_seconds(r.code,'cycle_debrief'))||'. Enquêteur et Analyste répondent séparément.'));
      else
        update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=(jsonb_set(jsonb_set(state,'{heard}',heard,true),'{interrogation_count}',to_jsonb(inter_count),true)-'current_target'-'interrogation_mode'),updated_at=now() where code=r.code;
      end if;
    else
      update public.igr_v4_rooms set phase='cycle_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=jsonb_set(state,'{heard}',heard,true),updated_at=now() where code=r.code;
    end if;
  elsif r.phase='cycle_debrief' then
    perform public.igr_v4_emit_trame(r.code);
    update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
  elsif r.phase in ('event_confrontation','event_assembly','event_analysis','event_signature','event_negociation','event_requete','event_saisine','event_enquete_croisee') then
    active_event:=coalesce(r.state->>'event_active',case r.phase when 'event_confrontation' then 'confrontation' when 'event_assembly' then 'assembly' when 'event_analysis' then 'analyse_dossier' when 'event_signature' then 'signature' else replace(r.phase,'event_','') end);
    perform public.igr_v13_complete_event(r.code,active_event);
  elsif r.phase like 'annex_%' then
    if coalesce((r.state->>'v13_event_mode')::boolean,false) then
      perform public.igr_v13_complete_event(r.code,coalesce(r.state->>'event_active',replace(r.phase,'annex_','')));
    else
      perform public.igr_v4_start_next_annex_or_trame(r.code);
    end if;
  elsif r.phase='trame' then
    if r.cycle<3 then perform public.igr_v4_start_cycle(r.code,r.cycle+1);
    else
      update public.igr_v4_rooms set phase='closed',phase_started_at=now(),phase_ends_at=now()+interval '5 seconds',updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','ENQUÊTE CLOSE','text','Plus aucune action d’enquête ne peut être ouverte.'));
    end if;
  elsif r.phase='closed' then
    perform public.igr_v4_start_orals(r.code);
  elsif r.phase='provisional_orals' then
    q:=coalesce(r.state->'oral_queue','[]'::jsonb); idx:=coalesce((r.state->>'oral_index')::integer,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(q) then
      item:=q->next_idx;
      update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>(item->>'seconds')::integer),state=jsonb_set(state,'{oral_index}',to_jsonb(next_idx),true),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','CONCLUSION PROVISOIRE','text',(item->>'pseudo')||' prend la parole.'));
    else
      update public.igr_v4_rooms set phase='provisional_lock',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    end if;
  elsif r.phase='defense' then
    defq:=coalesce(r.state->'defense_queue','[]'::jsonb); idx:=coalesce((r.state->>'defense_index')::integer,0); next_idx:=idx+1;
    if next_idx<jsonb_array_length(defq) then
      item:=defq->next_idx;
      update public.igr_v4_rooms
      set phase_started_at=now(),phase_ends_at=now()+interval '3 minutes',
          state=jsonb_set(jsonb_set(jsonb_set(state,'{defense_index}',to_jsonb(next_idx),true),'{defense_current_id}',to_jsonb(item->>'id'),true),'{defense_current_pseudo}',to_jsonb(item->>'pseudo'),true),updated_at=now()
      where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIÈRE DÉFENSE','text',(item->>'pseudo')||' dispose de 03:00. L’Avocat éventuel partage ce temps.','target_id',item->>'id'));
    else
      update public.igr_v4_rooms set phase='final_debrief',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes',state=(state-'defense_current_id'-'defense_current_pseudo'),updated_at=now() where code=r.code;
      insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DERNIER DÉBRIEF','text','Enquêteur + Analyste, avec Procureur si présent : '||public.igr_v35_seconds_label(public.igr_v35_room_seconds(r.code,'final_debrief'))||'.'));
    end if;
  elsif r.phase='final_debrief' then
    update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','FIN DES ÉCHANGES','text','Chaque rôle concerné verrouille son choix final.'));
  end if;
end
$function$


CREATE OR REPLACE FUNCTION public.igr_v44_maintain(p_room text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.igr_v44_lawyer_consultations%rowtype;
begin
 update public.igr_v44_judge_summons set status='completed',ended_at=coalesce(ended_at,now()) where room_code=p_room and status='active' and ends_at<=now();
 update public.igr_v44_judge_reviews set status='decision_pending',ended_at=coalesce(ended_at,now()) where room_code=p_room and status='active' and ends_at<=now();
 select * into c from public.igr_v44_lawyer_consultations where room_code=p_room and status in ('pending','active') and ends_at<=now() order by requested_at desc limit 1 for update;
 if found then
   update public.igr_v44_lawyer_consultations set status='completed',ended_at=now() where room_code=c.room_code and suspect_id=c.suspect_id;
   update public.igr_v4_rooms r set phase_ends_at=case when r.phase='interrogation' and r.state->>'current_target'=c.suspect_id::text then now()+make_interval(secs=>c.remaining_seconds) else r.phase_ends_at end, state=case when r.state->>'lawyer_consultation_suspect'=c.suspect_id::text then (r.state-'lawyer_consultation_suspect'-'lawyer_consultation_remaining') else r.state end, updated_at=now() where r.code=c.room_code;
 end if;
end $function$


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
 if r.phase='closed' then if r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_begin_stage(r.code,'audience');end if;return;end if;
 if r.phase in ('final_audience','final_suspect_defenses','final_lawyer_opinions') then status:=coalesce(r.state->>'v52_status','waiting');if status='active' and r.phase_ends_at is not null and now()>=r.phase_ends_at then perform public.igr_v52_advance(r.code,'timeout');end if;return;end if;
 if r.phase='locking' and coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return;end if;
 perform public.igr_v50_tick_legacy(p_room);
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if r.phase='cycle_debrief' then perform public.igr_v4_emit_trame(r.code);update public.igr_v4_rooms set phase='trame',phase_started_at=now(),phase_ends_at=now()+interval '22 seconds',updated_at=now() where code=r.code;
 elsif r.phase='final_debrief' then perform public.igr_v52_begin_stage(r.code,'locking');end if;
end$function$


CREATE OR REPLACE FUNCTION public.igr_v44_request_lawyer_consultation(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $request$
DECLARE
 me public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 l public.igr_v4_players%rowtype;
 oldc public.igr_v44_lawyer_consultations%rowtype;
 remain integer;
 official boolean:=false;
BEGIN
 SELECT * INTO me FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR me.public_role<>'suspect' THEN RAISE EXCEPTION 'forbidden'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=me.room_code FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.phase<>'interrogation'
   OR r.state->>'current_target' IS DISTINCT FROM me.id::text
 THEN RAISE EXCEPTION 'consultation only during your interrogation'; END IF;
 IF r.phase_ends_at IS NULL OR r.phase_ends_at<=now()
   OR coalesce((r.state->>'timer_paused')::boolean,false)
 THEN RAISE EXCEPTION 'interrogation timer unavailable'; END IF;
 SELECT lp.* INTO l FROM public.igr_v43_lawyer_representations rep
 JOIN public.igr_v4_players lp ON lp.id=rep.lawyer_id
 WHERE rep.room_code=r.code AND rep.client_id=me.id AND lp.public_role='maitre' LIMIT 1;
 official:=FOUND;
 SELECT * INTO oldc FROM public.igr_v44_lawyer_consultations
 WHERE room_code=r.code AND suspect_id=me.id FOR UPDATE;
 IF FOUND AND (NOT official OR oldc.cycle=r.cycle) THEN
   RAISE EXCEPTION 'consultation already used';
 END IF;
 IF NOT official THEN
   SELECT * INTO l FROM public.igr_v4_players x
   WHERE x.room_code=r.code AND x.public_role='maitre'
     AND public.igr_v44_player_is_free(r.code,x.id)
   ORDER BY x.seat_index LIMIT 1;
 END IF;
 IF l.id IS NULL THEN RAISE EXCEPTION 'lawyer unavailable'; END IF;
 remain:=greatest(1,ceil(extract(epoch from (r.phase_ends_at-now())))::integer);
 IF oldc.room_code IS NOT NULL THEN
   UPDATE public.igr_v44_lawyer_consultations
   SET lawyer_id=l.id,cycle=r.cycle,status='pending',remaining_seconds=remain,
       requested_at=now(),started_at=null,ends_at=now()+interval '45 seconds',ended_at=null
   WHERE room_code=r.code AND suspect_id=me.id;
 ELSE
   INSERT INTO public.igr_v44_lawyer_consultations
     (room_code,suspect_id,lawyer_id,cycle,remaining_seconds,ends_at)
   VALUES(r.code,me.id,l.id,r.cycle,remain,now()+interval '45 seconds');
 END IF;
 UPDATE public.igr_v4_rooms
 SET phase_ends_at=null,
 state=jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),
   '{lawyer_consultation_suspect}',to_jsonb(me.id::text),true),
   '{lawyer_consultation_remaining}',to_jsonb(remain),true),
 updated_at=now() WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
 VALUES(r.code,'lawyer_consultation','private',l.id,
 jsonb_build_object('title','CONSULTATION · 02:30',
 'text',me.pseudo||' vous demande une consultation pendant son interrogatoire. Vous avez 45 secondes pour répondre.',
 'cycle',r.cycle,'consultation_seconds',150));
 RETURN jsonb_build_object('ok',true,'lawyer_id',l.id,'lawyer_pseudo',l.pseudo,
 'remaining_seconds',remain,'seconds',150,'response_window_seconds',45,
 'consultation_scope',case when official then 'per_cycle' else 'once_per_game' end,
 'cycle',r.cycle);
END
$request$;

CREATE OR REPLACE FUNCTION public.igr_v44_start_lawyer_consultation(p_code text, p_player_token uuid, p_suspect uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; c public.igr_v44_lawyer_consultations%rowtype;
begin select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'maitre' then raise exception 'forbidden'; end if; select * into c from public.igr_v44_lawyer_consultations where room_code=me.room_code and suspect_id=p_suspect and lawyer_id=me.id for update; if not found or c.status<>'pending' or c.ends_at<=now() then raise exception 'consultation unavailable'; end if; update public.igr_v44_lawyer_consultations set status='active',started_at=now(),ends_at=now()+interval '150 seconds' where room_code=c.room_code and suspect_id=c.suspect_id; return jsonb_build_object('ok',true,'status','active','seconds',150); end $function$


CREATE OR REPLACE FUNCTION public.igr_v44_role_state(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s jsonb;
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  can_consult boolean:=false;
  used integer:=0;
  integrity jsonb:=null;
begin
  s:=public.igr_v50_judge_state_legacy(p_code,p_player_token);

  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;

  if me.public_role='juge' then
    used:=public.igr_v44_protection_count(r.code);
    integrity:=coalesce(s->'judge_integrity','{}'::jsonb)
      ||jsonb_build_object(
        'personal_objective_failed',used>=3,
        'protections_used',used,
        'protections_limit',3
      );
  end if;

  if me.public_role='suspect'
     and r.phase='interrogation'
     and r.state->>'current_target'=me.id::text
     and not exists(
       select 1
       from public.igr_v44_lawyer_consultations c
       where c.room_code=r.code and c.suspect_id=me.id and (c.cycle=r.cycle or not exists (select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id))
     )
  then
    can_consult:=exists(
      select 1 from public.igr_v4_players l
      where l.room_code=r.code and l.public_role='maitre'
    );
  end if;

  return s||jsonb_build_object(
    'version','v65',
    'summon',null,
    'review',null,
    'free_players','[]'::jsonb,
    'consultation_used',exists(
      select 1
      from public.igr_v44_lawyer_consultations c
      where c.room_code=r.code and c.suspect_id=me.id and (c.cycle=r.cycle or not exists (select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id))
    ),
    'can_request_lawyer_consultation',can_consult,
    'consultation_seconds',150,
    'consultation_scope',case when exists(select 1 from public.igr_v43_lawyer_representations rep where rep.room_code=r.code and rep.client_id=me.id) then 'per_cycle' else 'once_per_game' end,
    'natural_interactions',true,
    'protections_used',case when me.public_role='juge' then used else null end,
    'protections_limit',3,
    'protections_remaining',case when me.public_role='juge' then greatest(0,3-used) else null end,
    'judge_integrity',integrity
  );
end
$function$


-- Existing RPC execute grants and existing tables are preserved.
