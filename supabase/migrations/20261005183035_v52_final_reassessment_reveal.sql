-- Inside Grey Room v52 — final reassessment and reveal
-- Investigation roles lock a final 0..2 reading only after every oral/defence stage.

create or replace function public.igr_v52_make_reveal(p_room text)
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
 if r.status='finished' then return jsonb_build_object('finished',true);end if;
 select count(*) into req from public.igr_v4_players where room_code=p_room and public.igr_v52_investigation_role(public_role);
 select count(distinct a.player_id) into got from public.igr_v4_actions a join public.igr_v4_players p on p.id=a.player_id where a.room_code=p_room and a.action_type='final_lock' and public.igr_v52_investigation_role(p.public_role);
 if public.igr_v44_judge_present(p_room) then
   select count(*) into vr from public.igr_v4_players where room_code=p_room and public_role in ('enqueteur','analyste','procureur');
   select count(distinct player_id) into vg from public.igr_v4_actions where room_code=p_room and action_type='judge_integrity_vote';
 end if;
 if r.scenario_id='027' then terror_ok:=nullif(r.state #>> '{terror_runtime,decision}','') is not null;end if;
 update public.igr_v4_rooms set state=jsonb_set(jsonb_set(jsonb_set(state,'{v52_locks_received}',to_jsonb(got),true),'{v52_integrity_received}',to_jsonb(vg),true),'{v52_locks_required}',to_jsonb(req),true),updated_at=now() where code=p_room;
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
 if not found or not public.igr_v52_investigation_role(p.public_role) then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if r.phase<>'locking' or not coalesce((r.state->>'v52_final_reassessment')::boolean,false) then raise exception 'wrong phase';end if;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') then raise exception 'already locked';end if;
 levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');
 note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 if note_text<>'' then perform igr_private.assert_ugc(note_text,300,false);end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version','v52'));
 st:=public.igr_v52_maybe_finish(r.code);
 return jsonb_build_object('ok',true)||st;
end$$;

create or replace function public.igr_v44_integrity_vote(p_code text,p_player_token uuid,p_corrupt boolean)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare me public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;st jsonb;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or me.public_role not in ('enqueteur','analyste','procureur') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if r.phase<>'locking' or not coalesce((r.state->>'v52_final_reassessment')::boolean,false) or not public.igr_v44_judge_present(r.code) then raise exception 'wrong phase';end if;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='judge_integrity_vote') then raise exception 'already voted';end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'judge_integrity_vote',jsonb_build_object('corrupt',p_corrupt));
 st:=public.igr_v52_maybe_finish(r.code);
 return jsonb_build_object('ok',true)||st;
end$$;

create or replace function public.igr_v33_terror_decide_027(p_code text,p_player_token uuid,p_decision text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;st jsonb;rt jsonb;ass jsonb;outcome text;finish jsonb;
begin
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;if not found then raise exception 'unauthorized';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if r.scenario_id<>'027' or r.status<>'playing' or p.public_role<>'inspecteur' or r.phase<>'locking' then raise exception 'forbidden';end if;
 if p_decision not in ('intervenir','retarder','annuler') then raise exception 'invalid decision';end if;
 st:=coalesce(r.state,'{}'::jsonb);rt:=coalesce(st->'terror_runtime','{}'::jsonb);ass:=coalesce(rt->'assessments','{}'::jsonb);
 if rt ? 'decision' then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true);end if;
 if not (ass ? 'credibility') or not (ass ? 'sincerity') then raise exception 'assessments incomplete';end if;
 outcome:=case p_decision when 'intervenir' then 'Recommandation transmise : agir malgré une information encore contestée.' when 'retarder' then 'Recommandation transmise : suspendre la décision jusqu’à une confirmation supplémentaire.' else 'Recommandation transmise : ne pas agir sur la base du dossier actuel.' end;
 rt:=jsonb_set(jsonb_set(rt,'{decision}',to_jsonb(p_decision),true),'{decision_outcome}',to_jsonb(outcome),true);
 update public.igr_v4_rooms set state=jsonb_set(st,'{terror_runtime}',rt,true),updated_at=now() where code=r.code;
 insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'terror_decision',jsonb_build_object('title','RECOMMANDATION EXTÉRIEURE','text',outcome));
 finish:=public.igr_v52_maybe_finish(r.code);
 return jsonb_build_object('ok',true,'runtime',rt)||finish;
end$$;