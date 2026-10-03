-- Inside Grey Room — TERREUR v33 role ownership + legacy compatibility
-- 027: the Officier de liaison (public role inspecteur) owns the external recommendation.
-- The reveal waits for that recommendation, so the choice is made before canonical truth is shown.

create or replace function public.igr_v33_terror_decide_027(p_code text,p_player_token uuid,p_decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  assessments jsonb;
  outcome text;
  req integer;
  got integer;
  reveal jsonb;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'027' or r.status<>'playing' then raise exception 'not available'; end if;
  if p.public_role<>'inspecteur' then raise exception 'officier de liaison only'; end if;
  if r.phase<>'locking' then raise exception 'decision available during locking'; end if;
  if p_decision not in ('intervenir','retarder','annuler') then raise exception 'invalid decision'; end if;

  st:=coalesce(r.state,'{}'::jsonb);
  rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  assessments:=coalesce(rt->'assessments','{}'::jsonb);
  if rt ? 'decision' then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;
  if not (assessments ? 'credibility') or not (assessments ? 'sincerity') then raise exception 'assessments incomplete'; end if;

  outcome:=case p_decision
    when 'intervenir' then 'Recommandation transmise : agir malgré une information encore contestée. La décision extérieure reste abstraite.'
    when 'retarder' then 'Recommandation transmise : suspendre la décision jusqu’à une confirmation supplémentaire.'
    else 'Recommandation transmise : ne pas agir sur la base du dossier actuel.'
  end;
  rt:=jsonb_set(rt,'{decision}',to_jsonb(p_decision),true);
  rt:=jsonb_set(rt,'{decision_outcome}',to_jsonb(outcome),true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_decision',jsonb_build_object('title','RECOMMANDATION EXTÉRIEURE','text',outcome));

  select count(*) into req from public.igr_v4_players where room_code=r.code and public_role in ('enqueteur','analyste','procureur','juge','journaliste');
  select count(*) into got from public.igr_v4_actions where room_code=r.code and action_type='final_lock';
  if got>=req then
    reveal:=public.igr_v4_make_reveal(r.code);
    update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
    perform public.igr_v4_init_continuation(r.code,reveal);
    insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
  end if;

  return jsonb_build_object('ok',true,'runtime',rt,'locked',got,'required',req);
end
$$;

create or replace function public.igr_v4_lock_final(p_code text,p_player_token uuid,p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; req int; got int; reveal jsonb; s public.igr_v4_players%rowtype; lvl int; note_text text; consequence text; terror_decision text;
begin
 perform igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or p.public_role not in ('enqueteur','analyste','procureur','juge','journaliste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update; if r.phase<>'locking' then raise exception 'wrong phase'; end if;
 if octet_length(coalesce(p_payload,'{}'::jsonb)::text)>8192 then raise exception 'payload too large'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') then raise exception 'already locked'; end if;
 note_text:=left(trim(coalesce(p_payload->>'note','')),300); if note_text<>'' then perform igr_private.assert_ugc(note_text,300,false); end if; p_payload:=jsonb_set(coalesce(p_payload,'{}'::jsonb),'{note}',to_jsonb(note_text),true);
 if p.public_role<>'journaliste' then if jsonb_typeof(p_payload->'levels')<>'object' then raise exception 'invalid levels'; end if; for s in select * from public.igr_v4_players where room_code=r.code and public_role='suspect' loop if not (p_payload->'levels' ? s.id::text) then raise exception 'missing suspect'; end if; begin lvl:=(p_payload->'levels'->>s.id::text)::int; exception when others then raise exception 'invalid level'; end; if lvl<0 or lvl>3 then raise exception 'invalid level'; end if; end loop; if exists(select 1 from jsonb_object_keys(p_payload->'levels') k where not exists(select 1 from public.igr_v4_players s2 where s2.room_code=r.code and s2.public_role='suspect' and s2.id::text=k)) then raise exception 'unknown suspect'; end if; end if;
 if p.public_role='juge' then consequence:=left(trim(coalesce(p_payload->>'consequence','')),80); if consequence<>'' then perform igr_private.assert_ugc(consequence,80,false); end if; p_payload:=jsonb_set(p_payload,'{consequence}',to_jsonb(consequence),true); else p_payload:=p_payload-'consequence'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'final_lock',p_payload);
 select count(*) into req from public.igr_v4_players where room_code=r.code and public_role in ('enqueteur','analyste','procureur','juge','journaliste'); select count(*) into got from public.igr_v4_actions where room_code=r.code and action_type='final_lock';
 if got>=req then
   terror_decision:=nullif(r.state #>> '{terror_runtime,decision}','');
   if r.scenario_id='027' and terror_decision is null then
     insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'terror_decision_required',jsonb_build_object('title','DÉCISION EXTÉRIEURE REQUISE','text','Les conclusions sont verrouillées. L’Officier de liaison doit transmettre la recommandation extérieure avant la révélation.'));
   else
     reveal:=case when r.scenario_id in ('021','022','023','024','025') then public.igr_omerta_make_reveal(r.code) else public.igr_v4_make_reveal(r.code) end;
     update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code;
     perform public.igr_v4_init_continuation(r.code,reveal);
     insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal);
   end if;
 end if;
 return jsonb_build_object('ok',true,'locked',got,'required',req,'waiting_external_decision',r.scenario_id='027' and got>=req and nullif(r.state #>> '{terror_runtime,decision}','') is null);
end;
$$;

-- Legacy compatibility: old clients may still call the former post-reveal RPC.
-- If v33 already locked a recommendation, return it without creating a second outcome.
-- Otherwise keep the old endpoint non-operational and abstract.
create or replace function public.igr_terror_military_decision(p_code text,p_player_token uuid,p_decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  rt jsonb;
  normalized text;
  outcome text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'027' or p.public_role<>'inspecteur' then raise exception 'forbidden'; end if;

  rt:=coalesce(r.state->'terror_runtime','{}'::jsonb);
  if nullif(rt->>'decision','') is not null then
    return jsonb_build_object('ok',true,'decision',rt->>'decision','outcome',rt->>'decision_outcome','compat',true);
  end if;

  if r.status<>'finished' or r.phase<>'reveal' then raise exception 'decision handled before reveal'; end if;
  normalized:=case lower(trim(coalesce(p_decision,''))) when 'intervene' then 'intervenir' when 'delay' then 'retarder' when 'cancel' then 'annuler' else null end;
  if normalized is null then raise exception 'invalid decision'; end if;
  outcome:=case normalized
    when 'intervenir' then 'Recommandation transmise : agir malgré une information encore contestée. La décision extérieure reste abstraite.'
    when 'retarder' then 'Recommandation transmise : suspendre la décision jusqu’à une confirmation supplémentaire.'
    else 'Recommandation transmise : ne pas agir sur la base du dossier actuel.'
  end;
  rt:=jsonb_set(rt,'{decision}',to_jsonb(normalized),true);
  rt:=jsonb_set(rt,'{decision_outcome}',to_jsonb(outcome),true);
  update public.igr_v4_rooms set state=jsonb_set(coalesce(state,'{}'::jsonb),'{terror_runtime}',rt,true),updated_at=now() where code=r.code;
  return jsonb_build_object('ok',true,'decision',normalized,'outcome',outcome,'compat',true);
end
$$;

revoke all on function public.igr_v33_terror_decide_027(text,uuid,text) from public,anon,authenticated;
revoke all on function public.igr_v4_lock_final(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.igr_terror_military_decision(text,uuid,text) from public,anon,authenticated;
grant execute on function public.igr_v33_terror_decide_027(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_v4_lock_final(text,uuid,jsonb) to anon,authenticated;
grant execute on function public.igr_terror_military_decision(text,uuid,text) to anon,authenticated;
