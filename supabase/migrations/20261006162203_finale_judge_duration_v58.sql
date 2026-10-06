-- v58: six judge protections; short assemblies/events/finale; interrogation remains 360s.
CREATE OR REPLACE FUNCTION public.igr_v44_judge_decide_request(p_code text, p_player_token uuid, p_request bigint, p_outcome text, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; q public.igr_v44_judge_requests%rowtype; requester public.igr_v4_players%rowtype; consume boolean:=false; used integer; v_note text;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'juge' then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code for update; select * into q from public.igr_v44_judge_requests where id=p_request and room_code=r.code and judge_id=me.id for update; if not found or q.status<>'pending' then raise exception 'request unavailable'; end if; select * into requester from public.igr_v4_players where id=q.requester_id;
 if q.kind in ('investigation_access','prosecutor_access','journalist_access','journalist_publish') then if p_outcome not in ('open','partial','protected') then raise exception 'invalid outcome'; end if; consume:=p_outcome in ('partial','protected');
 elsif q.kind in ('lawyer_confidentiality','journalist_source') then if p_outcome not in ('approve','limit','refuse') then raise exception 'invalid outcome'; end if; consume:=p_outcome in ('approve','limit');
 else if p_outcome not in ('approve','limit','refuse') then raise exception 'invalid outcome'; end if; end if;
 if consume and q.element_id is not null and exists(select 1 from public.igr_v44_judge_requests prior where prior.room_code=r.code and prior.protection_consumed=true and prior.element_id=q.element_id and prior.id<>q.id) then consume:=false; end if;
 used:=public.igr_v44_protection_count(r.code); if consume and used>=6 then raise exception 'protection quota reached'; end if;
 v_note:=left(regexp_replace(trim(coalesce(p_note,'')),'\s+',' ','g'),180); if v_note<>'' then perform igr_private.assert_ugc(v_note,180,false); end if;
 update public.igr_v44_judge_requests set status='decided',outcome=p_outcome,decision_note=v_note,protection_consumed=consume,decided_at=now() where id=q.id;
 if consume then insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'judge',jsonb_build_object('request_id',q.id,'choice',q.element_id,'cost',1,'source','v44')); end if;
 perform public.igr_v44_emit_protected_access(r.code,q.id,p_outcome);
 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'judge_decision','private',requester.id,jsonb_build_object('title','DÉCISION DU JUGE','text',case p_outcome when 'open' then 'Accès accordé.' when 'partial' then 'Accès partiel accordé.' when 'protected' then 'Élément maintenu protégé.' when 'approve' then 'Demande acceptée.' when 'limit' then 'Demande acceptée avec limites.' else 'Demande refusée.' end,'outcome',p_outcome,'request_id',q.id,'note',v_note));
 return jsonb_build_object('ok',true,'outcome',p_outcome,'protections_used',used+case when consume then 1 else 0 end,'protections_remaining',greatest(0,6-used-case when consume then 1 else 0 end));
end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v50_judge_state_legacy(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; judge public.igr_v4_players%rowtype; protected_catalog jsonb:='[]'::jsonb; pending jsonb:='[]'::jsonb; history jsonb:='[]'::jsonb; free_people jsonb:='[]'::jsonb; summon jsonb:=null; review jsonb:=null; consultation jsonb:=null; used integer:=0; rv public.igr_v44_judge_reviews%rowtype; c public.igr_v44_lawyer_consultations%rowtype;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found then raise exception 'unauthorized'; end if; perform public.igr_v44_maintain(me.room_code); select * into r from public.igr_v4_rooms where code=me.room_code; select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id; select * into judge from public.igr_v4_players where room_code=r.code and public_role='juge' order by seat_index limit 1;
 if judge.id is not null and me.public_role in ('juge','enqueteur','maitre','procureur','journaliste') then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title') order by ord),'[]'::jsonb) into protected_catalog from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) with ordinality a(v,ord); end if;
 if me.public_role='juge' then
   used:=public.igr_v44_protection_count(r.code);
   select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'requester_id',q.requester_id::text,'requester',p.pseudo,'requester_role',p.public_role,'kind',q.kind,'element_id',q.element_id,'element_title',coalesce(v.item->>'title',''),'element_text',coalesce(v.item->>'text',''),'note',q.note,'created_at',q.created_at) order by q.created_at),'[]'::jsonb) into pending from public.igr_v44_judge_requests q join public.igr_v4_players p on p.id=q.requester_id left join lateral (select z as item from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) z where z->>'id'=q.element_id limit 1) v on true where q.room_code=r.code and q.judge_id=me.id and q.status='pending';
   if r.cycle between 1 and 3 and public.igr_v44_player_is_free(r.code,me.id) then select coalesce(jsonb_agg(jsonb_build_object('id',p.id::text,'pseudo',p.pseudo,'role',p.public_role) order by p.seat_index),'[]'::jsonb) into free_people from public.igr_v4_players p where p.room_code=r.code and p.id<>me.id and public.igr_v44_player_is_free(r.code,p.id) and not exists(select 1 from public.igr_v44_judge_summons s where s.room_code=r.code and s.target_id=p.id and s.cycle=r.cycle and s.status<>'cancelled'); end if;
 end if;
 select jsonb_build_object('id',s.id,'status',s.status,'cycle',s.cycle,'target_id',s.target_id::text,'target',t.pseudo,'judge_id',s.judge_id::text,'judge',j.pseudo,'started_at',s.started_at,'ends_at',s.ends_at) into summon from public.igr_v44_judge_summons s join public.igr_v4_players t on t.id=s.target_id join public.igr_v4_players j on j.id=s.judge_id where s.room_code=r.code and s.status in ('pending','active') and me.id in (s.judge_id,s.target_id) order by s.id desc limit 1;
 select * into rv from public.igr_v44_judge_reviews where room_code=r.code; if found and me.id in (rv.investigator_id,rv.analyst_id,rv.judge_id) then review:=jsonb_build_object('status',rv.status,'request_id',rv.request_id,'investigator_id',rv.investigator_id::text,'analyst_id',rv.analyst_id::text,'judge_id',rv.judge_id::text,'started_at',rv.started_at,'ends_at',rv.ends_at,'outcome',rv.outcome); end if;
 select * into c from public.igr_v44_lawyer_consultations where room_code=r.code and me.id in (suspect_id,lawyer_id) order by requested_at desc limit 1; if found then consultation:=jsonb_build_object('suspect_id',c.suspect_id::text,'suspect',(select pseudo from public.igr_v4_players where id=c.suspect_id),'lawyer_id',c.lawyer_id::text,'lawyer',(select pseudo from public.igr_v4_players where id=c.lawyer_id),'status',c.status,'cycle',c.cycle,'started_at',c.started_at,'ends_at',c.ends_at,'remaining_seconds',c.remaining_seconds); end if;
 if judge.id is not null and me.public_role<>'juge' then select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'kind',q.kind,'element_id',q.element_id,'status',q.status,'outcome',q.outcome,'note',q.note,'decision_note',q.decision_note,'created_at',q.created_at,'decided_at',q.decided_at) order by q.id desc),'[]'::jsonb) into history from public.igr_v44_judge_requests q where q.room_code=r.code and q.requester_id=me.id; end if;
 return jsonb_build_object('version','v44','role',me.public_role,'cycle',r.cycle,'phase',r.phase,'duration_mode',coalesce(r.state->>'duration_mode','long'),'judge_present',judge.id is not null,'judge_id',case when judge.id is null then null else judge.id::text end,'judge_pseudo',judge.pseudo,'protected_catalog',protected_catalog,'protections_used',case when me.public_role='juge' then used else null end,'protections_limit',6,'protections_remaining',case when me.public_role='juge' then greatest(0,6-used) else null end,'pending_requests',pending,'my_requests',history,'free_players',free_people,'summon',summon,'review',review,'lawyer_consultation',consultation,'consultation_used',exists(select 1 from public.igr_v44_lawyer_consultations z where z.room_code=r.code and z.suspect_id=me.id),'can_request_lawyer_consultation',me.public_role='suspect' and r.phase='interrogation' and r.state->>'current_target'=me.id::text and not exists(select 1 from public.igr_v43_lawyer_representations z where z.room_code=r.code and z.client_id=me.id) and not exists(select 1 from public.igr_v44_lawyer_consultations z where z.room_code=r.code and z.suspect_id=me.id) and exists(select 1 from public.igr_v4_players z where z.room_code=r.code and z.public_role='maitre' and public.igr_v44_player_is_free(r.code,z.id)),'judge_integrity',case when me.public_role='juge' then jsonb_build_object('corrupt',coalesce((me.private_state->>'judge_corrupt')::boolean,false),'target_id',me.private_state->>'judge_corruption_target_id','target',me.private_state->>'judge_corruption_target','objective',me.private_state->>'judge_integrity_objective') else null end);
end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v44_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare base jsonb; r public.igr_v4_rooms%rowtype; pack jsonb; judge public.igr_v4_players%rowtype; enq public.igr_v4_players%rowtype; judge_payload jsonb:='{}'::jsonb; enq_payload jsonb:='{}'::jsonb; truth_levels jsonb; results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb; responsibilities jsonb:='[]'::jsonb; it jsonb; s public.igr_v4_players%rowtype; lr record; truth int; official int; success boolean; protections int; actual_corrupt boolean:=false; target_id text; target_name text; votes_yes int:=0; votes_total int:=0; accused boolean:=false; required_yes int:=2; required_votes int:=2;
begin
 base:=public.igr_v4_make_reveal(p_room); select * into r from public.igr_v4_rooms where code=p_room; select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id; truth_levels:=coalesce(pack->'truth'->'levels','[]'::jsonb); select * into judge from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1; select * into enq from public.igr_v4_players where room_code=p_room and public_role='enqueteur' order by seat_index limit 1; select coalesce(payload->'levels',payload,'{}'::jsonb) into enq_payload from public.igr_v4_actions where room_code=p_room and player_id=enq.id and action_type='final_lock' order by id desc limit 1; enq_payload:=coalesce(enq_payload,'{}'::jsonb);
 if judge.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into judge_payload from public.igr_v4_actions where room_code=p_room and player_id=judge.id and action_type='final_lock' order by id desc limit 1; judge_payload:=coalesce(judge_payload,'{}'::jsonb); actual_corrupt:=coalesce((judge.private_state->>'judge_corrupt')::boolean,false); target_id:=judge.private_state->>'judge_corruption_target_id'; target_name:=judge.private_state->>'judge_corruption_target'; select count(*) filter(where coalesce((payload->>'corrupt')::boolean,false)),count(*) into votes_yes,votes_total from public.igr_v4_actions where room_code=p_room and action_type='judge_integrity_vote'; required_votes:=case when exists(select 1 from public.igr_v4_players where room_code=p_room and public_role='procureur') then 3 else 2 end; accused:=votes_yes>=required_yes and votes_total>=required_votes; end if;
 for it in select value from jsonb_array_elements(coalesce(base->'responsibilities','[]'::jsonb)) loop if judge.id is not null then it:=jsonb_set(it,'{judge_level}',to_jsonb(coalesce((judge_payload->>(it->>'player_id'))::int,-1)),true); end if; responsibilities:=responsibilities||jsonb_build_array(it); end loop;
 protections:=public.igr_v44_protection_count(p_room);
 for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
   if it->>'public_role'='suspect' and judge.id is not null then select * into s from public.igr_v4_players where id=(it->>'player_id')::uuid; truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0); official:=coalesce((judge_payload->>s.id::text)::int,-1); success:=truth=official; it:=jsonb_set(it,'{success}',to_jsonb(success),true); it:=jsonb_set(it,'{text}',to_jsonb(case when success then 'La décision officielle du Juge correspond exactement à ta responsabilité réelle.' else 'La décision officielle du Juge ne correspond pas exactement à ta responsabilité réelle.' end),true);
   elsif it->>'public_role'='maitre' then select x.client_id,c.pseudo into lr from public.igr_v43_lawyer_representations x join public.igr_v4_players c on c.id=x.client_id where x.room_code=p_room and x.lawyer_id=(it->>'player_id')::uuid limit 1; if found then select * into s from public.igr_v4_players where id=lr.client_id; truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0); official:=coalesce(((case when judge.id is not null then judge_payload else enq_payload end)->>s.id::text)::int,-1); success:=truth=official; it:=jsonb_set(it,'{success}',to_jsonb(success),true); it:=jsonb_set(it,'{text}',to_jsonb(case when success then 'Ton unique client officiel, '||lr.pseudo||', termine avec le niveau exact de responsabilité.' else 'La responsabilité officielle retenue pour ton unique client, '||lr.pseudo||', ne correspond pas exactement à la vérité.' end),true); it:=jsonb_set(it,'{achievements}','[]'::jsonb,true); else it:=jsonb_set(it,'{success}','false'::jsonb,true); it:=jsonb_set(it,'{text}',to_jsonb('Aucun client officiel n’a été verrouillé pendant cette affaire.'::text),true); it:=jsonb_set(it,'{achievements}','[]'::jsonb,true); end if;
   elsif it->>'public_role'='juge' then it:=jsonb_set(it,'{text}',to_jsonb(split_part(coalesce(it->>'text',''),' · ',1)||' · '||protections||'/6 protections utilisées. Aucune défaite automatique liée au quota.'),true); if coalesce((it->>'success')::boolean,false) and protections<=3 then it:=jsonb_set(it,'{achievements}',jsonb_build_array('juge_confidentiel'),true); else it:=jsonb_set(it,'{achievements}','[]'::jsonb,true); end if; end if;
   results:=results||jsonb_build_array(it); if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array((it->>'player_id')::uuid); end if;
 end loop;
 return base || jsonb_build_object('responsibilities',responsibilities,'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),'judge_integrity',case when judge.id is null then null else jsonb_build_object('actual_corrupt',actual_corrupt,'accused',accused,'votes_corrupt',votes_yes,'votes_total',votes_total,'correct',accused=actual_corrupt,'target_id',target_id,'target',target_name) end);
end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v44_fix_continuation(p_room text, p_reveal jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; arr jsonb; out jsonb:='[]'::jsonb; v jsonb; protections int; begin select * into r from public.igr_v4_rooms where code=p_room; if not found then return; end if; arr:=coalesce(r.state#>'{continuation,winners}','[]'::jsonb); protections:=public.igr_v44_protection_count(p_room); for v in select value from jsonb_array_elements(arr) loop if v->>'public_role'='maitre' then v:=jsonb_set(v,'{score}',to_jsonb(95),true); end if; if v->>'public_role'='juge' then v:=jsonb_set(v,'{score}',to_jsonb(100),true); end if; out:=out||jsonb_build_array(v); end loop; update public.igr_v4_rooms set state=jsonb_set(state,'{continuation,winners}',out,true),updated_at=now() where code=p_room; end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v13_enter_event_select(p_room text, p_slots integer, p_reset boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; st jsonb;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;
  st:=coalesce(r.state,'{}'::jsonb);
  if p_reset then
    st:=jsonb_set(st,'{event_slots_total}',to_jsonb(greatest(0,case when r.state->>'duration_mode'='short' then least(p_slots,1) else p_slots end)),true);
    st:=jsonb_set(st,'{event_slots_used}','0'::jsonb,true);
    st:=jsonb_set(st,'{event_types_used}','[]'::jsonb,true);
    st:=jsonb_set(st,'{event_interrogations}','0'::jsonb,true);
    st:=jsonb_set(st,'{confrontations_used}','0'::jsonb,true);
  end if;
  st:=st-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode'-'defense_current_id'-'defense_current_pseudo';
  update public.igr_v4_rooms
  set phase='event_select',phase_started_at=now(),phase_ends_at=null,state=st,updated_at=now()
  where code=r.code;
  update public.igr_v4_rooms
  set state=jsonb_set(state,'{event_options}',public.igr_v13_event_options(r.code),true),updated_at=now()
  where code=r.code;
end
$function$
;

CREATE OR REPLACE FUNCTION public.igr_v52_begin_stage(p_room text, p_stage text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; p public.igr_v4_players%rowtype; q jsonb='[]'::jsonb; first jsonb; phase_name text; next_stage text; lr record; req int; vote_req int;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
 if p_stage='audience' then
   delete from public.igr_v4_actions where room_code=p_room and action_type in ('final_lock','judge_integrity_vote','v52_audience_initial','v52_audience_spoken','v52_audience_skip','v52_defense_spoken','v52_defense_skip','v52_lawyer_spoken','v52_lawyer_skip');
   for p in select * from public.igr_v4_players where room_code=p_room and public_role in ('enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste') order by case public_role when 'enqueteur' then 1 when 'analyste' then 2 when 'inspecteur' then 3 when 'expert' then 4 when 'procureur' then 5 when 'juge' then 6 when 'journaliste' then 7 else 99 end,seat_index loop
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role,'seconds',case when r.state->>'duration_mode'='short' then 60 else 120 end,'required',p.public_role='juge'));
   end loop;
   phase_name:='final_audience';next_stage:='defenses';
 elsif p_stage='defenses' then
   for p in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot nulls last,seat_index loop
     select x.lawyer_id,l.pseudo into lr from public.igr_v43_lawyer_representations x join public.igr_v4_players l on l.id=x.lawyer_id where x.room_code=p_room and x.client_id=p.id limit 1;
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','suspect','seconds',case when r.state->>'duration_mode'='short' then 120 else 300 end,'required',false,'lawyer_id',case when lr.lawyer_id is null then null else lr.lawyer_id::text end,'lawyer_pseudo',lr.pseudo));
   end loop;
   phase_name:='final_suspect_defenses';next_stage:='lawyers';
 elsif p_stage='lawyers' then
   for p in select * from public.igr_v4_players where room_code=p_room and public_role='maitre' order by seat_index loop
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','maitre','seconds',case when r.state->>'duration_mode'='short' then 60 else 120 end,'required',false));
   end loop;
   phase_name:='final_lawyer_opinions';next_stage:='locking';
 elsif p_stage='locking' then
   select count(*) into req from public.igr_v4_players where room_code=p_room and public.igr_v52_investigation_role(public_role);
   select count(*) into vote_req from public.igr_v4_players where room_code=p_room and public_role in ('enqueteur','analyste','procureur') and public.igr_v44_judge_present(p_room);
   update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb('locking'::text),true),'{v52_final_reassessment}','true'::jsonb,true),'{v52_locks_required}',to_jsonb(req),true),'{v52_locks_received}','0'::jsonb,true),'{v52_integrity_required}',to_jsonb(vote_req),true),updated_at=now() where code=p_room;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(p_room,'phase','public',jsonb_build_object('title','RÉÉVALUATION FINALE','text','Après toutes les défenses : 0 aucune, 1 secondaire, 2 principale. Aucun nouvel élément ne peut entrer.'));
   return;
 else raise exception 'invalid stage'; end if;
 if jsonb_array_length(q)=0 then perform public.igr_v52_begin_stage(p_room,next_stage);return;end if;
 first:=q->0;
 update public.igr_v4_rooms set phase=phase_name,phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb(p_stage),true),'{v52_queue}',q,true),'{v52_index}','0'::jsonb,true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(first->>'player_id'),true),'{v52_current_role}',to_jsonb(first->>'role'),true),updated_at=now() where code=p_room;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(p_room,'phase','public',case p_stage when 'audience' then jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.') when 'defenses' then jsonb_build_object('title','DÉFENSES FINALES','text','Chaque suspect peut parler COURT 02:00 / LONG 05:00 ou passer. Son Avocat officiel partage ce temps.') else jsonb_build_object('title','AVIS FINAL DE L’AVOCAT','text','Après toutes les défenses, chaque Avocat peut parler COURT 01:00 / LONG 02:00 ou passer.') end);
end$function$
;

CREATE OR REPLACE FUNCTION public.igr_v4_start_cycle(p_room text, p_cycle integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; order_json jsonb; st jsonb; suspect_count int; lim int; assembly_seconds int;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
 select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb),count(*) into order_json,suspect_count from public.igr_v4_players where room_code=p_room and public_role='suspect';
 if not public.igr_v13_is_core_scenario(r.scenario_id) then update public.igr_v4_rooms set cycle=p_cycle,phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{heard}','[]'::jsonb,true),'{annex_queue}','[]'::jsonb,true),'{annex_index}','0'::jsonb,true),'{interrogation_order}',order_json,true),updated_at=now() where code=p_room; return; end if;
 lim:=least(public.igr_v13_interrogation_limit(r.code,p_cycle),suspect_count); assembly_seconds:=case when r.state->>'duration_mode'='short' then case when p_cycle=1 then 150 else 120 end else case when p_cycle=1 then 300 else 240 end end; st:=coalesce(r.state,'{}'::jsonb); st:=jsonb_set(st,'{heard}','[]'::jsonb,true); st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true); st:=jsonb_set(st,'{annex_index}','0'::jsonb,true); st:=jsonb_set(st,'{interrogation_order}',order_json,true); st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true); st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true); st:=jsonb_set(st,'{assembly_cycle}',to_jsonb(p_cycle),true); st:=jsonb_set(st,'{assembly_seconds}',to_jsonb(assembly_seconds),true); st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
 update public.igr_v4_rooms set cycle=p_cycle,phase='investigation_assembly',phase_started_at=now(),phase_ends_at=now()+make_interval(secs=>assembly_seconds),state=st,updated_at=now() where code=p_room;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(p_room,'assembly','public',jsonb_build_object('title','ASSEMBLÉE '||p_cycle,'text',public.igr_v35_seconds_label(assembly_seconds)||' · Tous les rôles du camp Enquête participent. Les autres joueurs sont en temps libre.','cycle',p_cycle,'seconds',assembly_seconds));
end $function$
;
