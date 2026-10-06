-- v59: role outcomes, genuine journalist conclusion, explicit host absence recovery.
create or replace function public.igr_v59_reveal_base(p_room text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare r public.igr_v4_rooms%rowtype;base jsonb;pre jsonb;finals jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 base:=case when r.scenario_id in ('021','022','023','024','025') then public.igr_omerta_make_reveal(p_room) else public.igr_v47_make_reveal(p_room) end;
 select coalesce(jsonb_agg(jsonb_build_object('player_id',a.player_id,'pseudo',p.pseudo,'role',p.public_role,'levels',a.payload->'levels') order by a.id),'[]'::jsonb) into pre from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=p_room and a.action_type='v52_audience_initial';
 select coalesce(jsonb_agg(jsonb_build_object('player_id',a.player_id,'pseudo',p.pseudo,'role',p.public_role,'levels',a.payload->'levels') order by p.seat_index),'[]'::jsonb) into finals from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=p_room and a.action_type='final_lock' and public.igr_v52_investigation_role(p.public_role);
 return base||jsonb_build_object(
  'responsibility_scale',jsonb_build_array(
    jsonb_build_object('value',0,'label','Aucune responsabilité'),
    jsonb_build_object('value',1,'label','Responsabilité secondaire'),
    jsonb_build_object('value',2,'label','Responsabilité principale')
  ),
  'pre_defense_readings',pre,
  'final_readings',finals,
  'final_audience',jsonb_build_object(
    'spoken',(select count(*) from public.igr_v4_actions where room_code=p_room and action_type='v52_audience_spoken'),
    'skipped',(select count(*) from public.igr_v4_actions where room_code=p_room and action_type='v52_audience_skip'),
    'defenses',(select count(*) from public.igr_v4_actions where room_code=p_room and action_type='v52_defense_spoken'),
    'lawyer_opinions',(select count(*) from public.igr_v4_actions where room_code=p_room and action_type='v52_lawyer_spoken')
  )
 );
end$$;
revoke all on function public.igr_v59_reveal_base(text) from public,anon,authenticated;
create or replace function public.igr_v52_advance(p_room text,p_reason text default 'manual')
returns void language plpgsql security definer set search_path=''
as $$
declare r public.igr_v4_rooms%rowtype; q jsonb; idx int; nxt int; item jsonb; stage text; status text; spoken_type text; next_stage text;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update; if not found then return; end if;
 stage:=r.state->>'v52_stage';q:=coalesce(r.state->'v52_queue','[]'::jsonb);idx:=coalesce((r.state->>'v52_index')::int,0);item:=q->idx;status:=coalesce(r.state->>'v52_status','waiting');
 spoken_type:=case stage when 'audience' then 'v52_audience_spoken' when 'defenses' then 'v52_defense_spoken' else 'v52_lawyer_spoken' end;
 if status='active' and item is not null and not exists(select 1 from public.igr_v4_actions where room_code=p_room and player_id=(item->>'player_id')::uuid and action_type=spoken_type) then
   insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(p_room,(item->>'player_id')::uuid,r.cycle,spoken_type,jsonb_build_object('reason',p_reason,'role',item->>'role'));
 end if;
 nxt:=idx+1;
 if nxt>=jsonb_array_length(q) then
   next_stage:=case stage when 'audience' then 'defenses' when 'defenses' then 'lawyers' else 'locking' end;perform public.igr_v52_begin_stage(p_room,next_stage);return;
 end if;
 item:=q->nxt;
 update public.igr_v4_rooms set phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{v52_index}',to_jsonb(nxt),true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(item->>'player_id'),true),'{v52_current_role}',to_jsonb(item->>'role'),true),updated_at=now() where code=p_room;
end$$;
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
   for p in select * from public.igr_v4_players where room_code=p_room and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text) and public_role in ('enqueteur','analyste','inspecteur','expert','procureur','juge','journaliste') order by case public_role when 'enqueteur' then 1 when 'analyste' then 2 when 'inspecteur' then 3 when 'expert' then 4 when 'procureur' then 5 when 'juge' then 6 when 'journaliste' then 7 else 99 end,seat_index loop
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role,'seconds',case when r.state->>'duration_mode'='short' then 60 else 120 end,'required',p.public_role='juge'));
   end loop;
   phase_name:='final_audience';next_stage:='defenses';
 elsif p_stage='defenses' then
   for p in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text) order by internal_slot nulls last,seat_index loop
     select x.lawyer_id,l.pseudo into lr from public.igr_v43_lawyer_representations x join public.igr_v4_players l on l.id=x.lawyer_id where x.room_code=p_room and x.client_id=p.id limit 1;
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','suspect','seconds',case when r.state->>'duration_mode'='short' then 120 else 300 end,'required',false,'lawyer_id',case when lr.lawyer_id is null then null else lr.lawyer_id::text end,'lawyer_pseudo',lr.pseudo));
   end loop;
   phase_name:='final_suspect_defenses';next_stage:='lawyers';
 elsif p_stage='lawyers' then
   for p in select * from public.igr_v4_players where room_code=p_room and public_role='maitre' and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text) order by seat_index loop
     q:=q||jsonb_build_array(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role','maitre','seconds',case when r.state->>'duration_mode'='short' then 60 else 120 end,'required',false));
   end loop;
   phase_name:='final_lawyer_opinions';next_stage:='locking';
 elsif p_stage='locking' then
   select count(*) into req from public.igr_v4_players where room_code=p_room and public.igr_v52_investigation_role(public_role);
   select count(*) into vote_req from public.igr_v4_players where room_code=p_room and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text) and public_role in ('enqueteur','analyste','procureur') and public.igr_v44_judge_present(p_room);
   update public.igr_v4_rooms set phase='locking',phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb('locking'::text),true),'{v52_final_reassessment}','true'::jsonb,true),'{v52_locks_required}',to_jsonb(req),true),'{v52_locks_received}','0'::jsonb,true),'{v52_integrity_required}',to_jsonb(vote_req),true),updated_at=now() where code=p_room;
   insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(p_room,'phase','public',jsonb_build_object('title','RÉÉVALUATION FINALE','text','Après toutes les défenses : 0 aucune, 1 secondaire, 2 principale. Aucun nouvel élément ne peut entrer.'));
   perform public.igr_v52_maybe_finish(p_room);return;
 else raise exception 'invalid stage'; end if;
 if jsonb_array_length(q)=0 then perform public.igr_v52_begin_stage(p_room,next_stage);return;end if;
 first:=q->0;
 update public.igr_v4_rooms set phase=phase_name,phase_started_at=now(),phase_ends_at=null,state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(state,'{}'::jsonb),'{v52_stage}',to_jsonb(p_stage),true),'{v52_queue}',q,true),'{v52_index}','0'::jsonb,true),'{v52_status}',to_jsonb('waiting'::text),true),'{v52_current_id}',to_jsonb(first->>'player_id'),true),'{v52_current_role}',to_jsonb(first->>'role'),true),updated_at=now() where code=p_room;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(p_room,'phase','public',case p_stage when 'audience' then jsonb_build_object('title','AUDIENCE FINALE','text','Enquêteur → Analyste → Inspecteur → Expert → Procureur → Juge → Journaliste. COURT 01:00 / LONG 02:00 max. Tous peuvent passer sauf le Juge.') when 'defenses' then jsonb_build_object('title','DÉFENSES FINALES','text','Chaque suspect peut parler COURT 02:00 / LONG 05:00 ou passer. Son Avocat officiel partage ce temps.') else jsonb_build_object('title','AVIS FINAL DE L’AVOCAT','text','Après toutes les défenses, chaque Avocat peut parler COURT 01:00 / LONG 02:00 ou passer.') end);
end$function$
;
create or replace function public.igr_v52_maybe_finish(p_room text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare r public.igr_v4_rooms%rowtype;req int;got int;vr int:=0;vg int:=0;terror_ok boolean:=true;reveal jsonb;
begin
 select * into r from public.igr_v4_rooms where code=p_room for update;
 if not found then return jsonb_build_object('finished',false);end if;
 if r.phase<>'locking' or not coalesce((r.state->>'v52_final_reassessment')::boolean,false) then return jsonb_build_object('finished',false);end if;
 if r.status='finished' then return jsonb_build_object('finished',true);end if;
 select count(*) into req from public.igr_v4_players where room_code=p_room and (public.igr_v52_investigation_role(public_role) or public_role='journaliste') and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text);
 select count(distinct a.player_id) into got from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=p_room and a.action_type='final_lock' and (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text);
 if public.igr_v44_judge_present(p_room) then
   select count(*) into vr from public.igr_v4_players where room_code=p_room and public_role in ('enqueteur','analyste','procureur') and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? id::text);
   select count(distinct a.player_id) into vg from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=p_room and a.action_type='judge_integrity_vote' and p.public_role in ('enqueteur','analyste','procureur') and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text);
 end if;
 if r.scenario_id='027' then terror_ok:=nullif(r.state #>> '{terror_runtime,decision}','') is not null or not exists(select 1 from public.igr_v4_players p where p.room_code=p_room and p.public_role='inspecteur' and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text));end if;
 update public.igr_v4_rooms set state=jsonb_set(jsonb_set(jsonb_set(state,'{v52_locks_received}',to_jsonb(got),true),'{v52_integrity_received}',to_jsonb(vg),true),'{v52_locks_required}',to_jsonb(req),true),updated_at=now() where code=p_room;
 update public.igr_v4_rooms set state=jsonb_set(state,'{v59_pending}',coalesce((select jsonb_agg(jsonb_build_object('player_id',p.id::text,'pseudo',p.pseudo,'role',p.public_role) order by p.seat_index) from public.igr_v4_players p where p.room_code=p_room and not (coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text) and (( (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') and not exists(select 1 from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type='final_lock')) or (public.igr_v44_judge_present(p_room) and p.public_role in ('enqueteur','analyste','procureur') and not exists(select 1 from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type='judge_integrity_vote')) or (r.scenario_id='027' and p.public_role='inspecteur' and nullif(r.state#>>'{terror_runtime,decision}','') is null))),'[]'::jsonb),true) where code=p_room;
 if got<req or vg<vr or not terror_ok then return jsonb_build_object('finished',false,'locked',got,'required',req,'votes',vg,'votes_required',vr,'terror_ok',terror_ok);end if;
 reveal:=public.igr_v52_make_reveal(p_room);
 update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=p_room;
 perform public.igr_v4_init_continuation(p_room,reveal);
 perform public.igr_v44_fix_continuation(p_room,reveal);
 insert into public.igr_v4_events(room_code,event_type,payload) values(p_room,'reveal',reveal);
 return jsonb_build_object('finished',true,'locked',got,'required',req);
end$$;
create or replace function public.igr_v4_lock_final(p_code text,p_player_token uuid,p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;levels jsonb;note_text text;st jsonb;
begin
 perform igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or not (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if r.phase<>'locking' or not coalesce((r.state->>'v52_final_reassessment')::boolean,false) then raise exception 'wrong phase';end if;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') then raise exception 'already locked';end if;
 if coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text then raise exception 'player marked absent';end if;
 if p.public_role<>'journaliste' then levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');else levels:='{}'::jsonb;end if;
 note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 if p.public_role='journaliste' and length(note_text)<8 then raise exception 'journalist final angle required';end if;
 if note_text<>'' then perform igr_private.assert_ugc(note_text,300,false);end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version','v52'));
 st:=public.igr_v52_maybe_finish(r.code);
 return jsonb_build_object('ok',true)||st;
end$$;

create or replace function public.igr_v52_make_reveal(p_room text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb;r public.igr_v4_rooms%rowtype;pack jsonb;it jsonb;p public.igr_v4_players%rowtype;j public.igr_v4_players%rowtype;t public.igr_v4_players%rowtype;out_results jsonb:='[]';winners jsonb:='[]';corrupt boolean:=false;yes_n int:=0;voters int:=0;threshold int:=0;accused boolean:=false;truth int;guess int;levels jsonb;exact_n int;total_n int;acts int;ok boolean;absent jsonb;
begin
 base:=public.igr_v59_reveal_base(p_room);select * into r from public.igr_v4_rooms where code=p_room;
 absent:=coalesce(r.state->'v59_absent','[]'::jsonb);select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 select * into j from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1;
 if j.id is not null then
  corrupt:=coalesce((j.private_state->>'judge_corrupt')::boolean,false);
  select count(*) into voters from public.igr_v4_players pp where pp.room_code=p_room and pp.public_role in ('enqueteur','analyste','procureur') and not (absent ? pp.id::text);
  threshold:=case when voters=0 then 0 else floor(voters/2.0)::int+1 end;
  select count(distinct a.player_id) into yes_n from public.igr_v4_actions a join public.igr_v4_players pp on pp.id=a.player_id where a.room_code=p_room and a.action_type='judge_integrity_vote' and coalesce((a.payload->>'corrupt')::boolean,false) and pp.public_role in ('enqueteur','analyste','procureur') and not (absent ? pp.id::text);
  accused:=voters>0 and yes_n>=threshold;
  base:=jsonb_set(base,'{judge_integrity}',coalesce(base->'judge_integrity','{}'::jsonb)||jsonb_build_object('accused',accused,'votes_corrupt',yes_n,'eligible_voters',voters,'required_yes',threshold,'correct',accused=corrupt),true);
 end if;
 exact_n:=coalesce((base#>>'{camp_investigation,exact}')::int,(base#>>'{accuracy,exact}')::int,0);total_n:=coalesce((base#>>'{camp_investigation,total}')::int,(base#>>'{accuracy,total}')::int,0);
 for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
  select * into p from public.igr_v4_players where id=(it->>'player_id')::uuid and room_code=p_room;
  if p.secret_role<>'espion' and p.public_role='juge' and corrupt then
   select * into t from public.igr_v4_players where room_code=p_room and id::text=j.private_state->>'judge_corruption_target_id' and public_role='suspect';
   truth:=coalesce((pack->'truth'->'levels'->>(t.internal_slot-1))::int,-1);
   select a.payload->'levels' into levels from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type='final_lock' order by a.id desc limit 1;
   guess:=coalesce((levels->>t.id::text)::int,-1);ok:=truth>0 and guess>=0 and guess<truth and not accused;
   it:=it||jsonb_build_object('success',ok,'achievements','[]'::jsonb,'text','Juge corrompu : réduire la responsabilité retenue de la cible et éviter la majorité des votes de corruption.','victories',jsonb_build_object('target_protected',truth>0 and guess>=0 and guess<truth,'undetected',not accused));
  elsif p.secret_role<>'espion' and p.public_role in ('inspecteur','expert') and r.scenario_id not in ('021','022','023','024','025') then
   select count(*) into acts from public.igr_v4_actions a where a.room_code=p_room and a.player_id=p.id and a.action_type=case when p.public_role='inspecteur' then 'field' else 'expert' end;
   ok:=acts>0 and total_n>0 and exact_n>=ceil(total_n*2.0/3.0)::int;
   it:=it||jsonb_build_object('success',ok,'text',acts||' action(s) de rôle · décision faisant autorité : '||exact_n||'/'||total_n||' responsabilités exactes.');
   if not ok then it:=jsonb_set(it,'{achievements}','[]'::jsonb,true);end if;
  end if;
  if absent ? p.id::text then it:=it||jsonb_build_object('success',false,'achievements','[]'::jsonb,'absent',true,'text','Joueur déclaré absent par l’hôte : objectif final non validé.');end if;
  out_results:=out_results||jsonb_build_array(it);if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array(p.id);end if;
 end loop;
 return base||jsonb_build_object('results',out_results,'winners',winners,'winner_count',jsonb_array_length(winners),'absent_players',absent,'incomplete_decisions',jsonb_array_length(absent)>0);
end$$;

create or replace function public.igr_v59_host_recover(p_code text,p_host_token uuid,p_player_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
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
  if r.state->>'v52_status'<>'waiting' or q->>'player_id'<>p.id::text then raise exception 'only waiting current player';end if;
 else
  if not (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') then raise exception 'not a final voter';end if;
  if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') and (p.public_role not in ('enqueteur','analyste','procureur') or exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='judge_integrity_vote') or not public.igr_v44_judge_present(r.code)) and not (r.scenario_id='027' and p.public_role='inspecteur' and nullif(r.state#>>'{terror_runtime,decision}','') is null) then raise exception 'player already completed';end if;
 end if;
 update public.igr_v4_rooms set state=jsonb_set(state,'{v59_absent}',absent||jsonb_build_array(p.id::text),true),updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,visibility,payload) values(r.code,'final_absence','public',jsonb_build_object('title','ABSENCE CONFIRMÉE','text',p.pseudo||' : absent. Aucune décision inventée. Motif : '||note,'player_id',p.id));
 if r.phase='locking' then st:=public.igr_v52_maybe_finish(r.code);else perform public.igr_v52_advance(r.code,'host_confirmed_absence');st:='{}'::jsonb;end if;
 return jsonb_build_object('ok',true)||st;
end$$;
revoke all on function public.igr_v59_host_recover(text,uuid,uuid,text) from public;
grant execute on function public.igr_v59_host_recover(text,uuid,uuid,text) to anon,authenticated,service_role;

create or replace function public.igr_v59_judge_objective() returns trigger language plpgsql set search_path='' as $$
declare target public.igr_v4_players%rowtype;truth int;
begin
 if new.public_role='juge' and coalesce((new.private_state->>'judge_corrupt')::boolean,false) then
  select * into target from public.igr_v4_players p where p.room_code=new.room_code and p.id::text=new.private_state->>'judge_corruption_target_id';
  select (sp.pack->'truth'->'levels'->>(target.internal_slot-1))::int into truth from public.igr_v4_scenario_packs sp join public.igr_v4_rooms rr on rr.scenario_id=sp.scenario_id where rr.code=new.room_code;
  if target.id is null or coalesce(truth,0)=0 then
   select p.* into target from public.igr_v4_players p join public.igr_v4_rooms rr on rr.code=p.room_code join public.igr_v4_scenario_packs sp on sp.scenario_id=rr.scenario_id where p.room_code=new.room_code and p.public_role='suspect' and coalesce((sp.pack->'truth'->'levels'->>(p.internal_slot-1))::int,0)>0 order by p.seat_index limit 1;
  end if;
  if target.id is null then new.private_state:=new.private_state||jsonb_build_object('judge_corrupt',false,'judge_integrity_objective','Rends une décision exacte et impartiale pour chaque suspect.');
  else new.private_state:=new.private_state||jsonb_build_object('judge_corruption_target_id',target.id::text,'judge_corruption_target',target.pseudo,'judge_integrity_objective','Retiens pour '||target.pseudo||' une responsabilité inférieure à sa responsabilité réelle sans obtenir une majorité de votes de corruption. Les protections ne provoquent aucune défaite automatique.');end if;
 end if;return new;
end$$;
drop trigger if exists zz_v59_judge_objective on public.igr_v4_players;
create trigger zz_v59_judge_objective before insert or update of public_role,private_state on public.igr_v4_players for each row execute function public.igr_v59_judge_objective();
revoke all on function public.igr_v59_judge_objective() from public,anon,authenticated;
update public.igr_v4_players set private_state=private_state where public_role='juge' and coalesce((private_state->>'judge_corrupt')::boolean,false);
-- A forged old automatic journalist note must never count as a personal conclusion.
delete from public.igr_v4_actions a using public.igr_v4_rooms r where a.room_code=r.code and r.status='playing' and a.action_type='final_lock' and a.payload->>'note'='Audience finale v52' and exists(select 1 from public.igr_v4_players p where p.id=a.player_id and p.public_role='journaliste');
