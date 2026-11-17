-- v773: require one approval only when exactly one eligible investigation player can view the evidence.
-- Preserve source authorization, distinct voters, and two disclosures per cycle.

CREATE OR REPLACE FUNCTION public.igr_v771_dossier_candidates(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  candidates jsonb;
begin
  perform igr_private.rate_limit('v771_dossier_candidates',p_player_token::text,90,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code;
  if not found then raise exception 'room not found'; end if;
  if current_room.status<>'playing' or actor.public_role not in
    ('enqueteur','analyste','procureur','juge','inspecteur','expert')
    then return jsonb_build_object('candidates','[]'::jsonb); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'title',q.title,'text',q.body,'cycle',q.cycle,
    'votes',q.votes,'required_votes',q.required_votes,'mine',q.mine,'published',q.published
  ) order by q.id desc),'[]'::jsonb) into candidates from (
    select e.id,left(e.payload->>'title',120) as title,
      left(coalesce(e.payload->>'text',e.payload->>'summary',''),1000) as body,
      e.cycle,
      (select count(distinct a.player_id)::integer from public.igr_v4_actions a
        join public.igr_v4_players voter on voter.id=a.player_id and voter.room_code=current_room.code
        where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
          and a.payload->>'source_id'=e.id::text
          and voter.public_role in ('enqueteur','analyste','procureur','juge','inspecteur','expert') and voter.public_role=any(e.audience_roles)) as votes,
      greatest(1,least(2,(select count(*)::integer from public.igr_v4_players eligible
        where eligible.room_code=current_room.code and eligible.public_role in ('enqueteur','analyste','procureur','juge','inspecteur','expert')
          and eligible.public_role=any(e.audience_roles)))) as required_votes,
      exists(select 1 from public.igr_v4_actions a
        where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
          and a.player_id=actor.id and a.payload->>'source_id'=e.id::text) as mine,
      exists(select 1 from public.igr_v4_events pub
        where pub.room_code=current_room.code and pub.event_type='public_evidence'
          and pub.payload->>'source_id'=e.id::text) as published
    from public.igr_v4_events e
    where e.room_code=current_room.code and e.visibility='roles'
      and actor.public_role=any(e.audience_roles)
      and (e.event_type in ('trame','field','expert','judge','evidence',
             'field_result','expert_result') or e.event_type ~ '^investigation_[0-9]{3}$')
      and length(coalesce(e.payload->>'text',e.payload->>'summary',''))>=12
      and length(coalesce(e.payload->>'title',''))>=3
      and coalesce(e.cycle,1)<=current_room.cycle
    order by e.id desc limit 8
  ) q;
  return jsonb_build_object('candidates',candidates);
end;
$function$;


revoke all on function public.igr_v771_dossier_candidates(text,uuid) from public,authenticated,anon;
grant execute on function public.igr_v771_dossier_candidates(text,uuid) to anon;

CREATE OR REPLACE FUNCTION public.igr_v771_dossier_vote(p_code text, p_player_token uuid, p_event_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor public.igr_v4_players%rowtype;
  current_room public.igr_v4_rooms%rowtype;
  source_event public.igr_v4_events%rowtype;
  v_votes integer;
  v_required_votes integer;
  v_publications integer;
  v_existing boolean;
begin
  perform igr_private.rate_limit('v771_dossier_vote',p_player_token::text,25,60);
  select * into actor from public.igr_v4_players
    where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'forbidden'; end if;
  select * into current_room from public.igr_v4_rooms where code=actor.room_code for update;
  if not found or current_room.status<>'playing' or current_room.cycle not between 1 and 3
     or current_room.phase='role_reading' then raise exception 'publication closed'; end if;
  if actor.public_role not in ('enqueteur','analyste','procureur','juge','inspecteur','expert')
     then raise exception 'forbidden'; end if;
  select * into source_event from public.igr_v4_events e where e.id=p_event_id
    and e.room_code=current_room.code and e.visibility='roles'
    and actor.public_role=any(e.audience_roles)
    and (e.event_type in ('trame','field','expert','judge','evidence',
           'field_result','expert_result') or e.event_type ~ '^investigation_[0-9]{3}$')
    and length(coalesce(e.payload->>'text',e.payload->>'summary',''))>=12
    and length(coalesce(e.payload->>'title',''))>=3
    and coalesce(e.cycle,1)<=current_room.cycle;
  if not found then raise exception 'source not authorized'; end if;
  select greatest(1,least(2,count(*)::integer)) into v_required_votes
  from public.igr_v4_players eligible where eligible.room_code=current_room.code
    and eligible.public_role in ('enqueteur','analyste','procureur','juge','inspecteur','expert') and eligible.public_role=any(source_event.audience_roles);
  if exists(select 1 from public.igr_v4_events e where e.room_code=current_room.code
    and e.event_type='public_evidence' and e.payload->>'source_id'=p_event_id::text) then
    return jsonb_build_object('status','published','votes',v_required_votes,'required_votes',v_required_votes); end if;
  select count(*)::integer into v_publications from public.igr_v4_events e
    where e.room_code=current_room.code and e.cycle=current_room.cycle
      and e.event_type='public_evidence' and e.payload->>'source'='camp_enquete';
  if v_publications>=2 then raise exception 'two public disclosures already made this cycle'; end if;
  select exists(select 1 from public.igr_v4_actions a where a.room_code=current_room.code
    and a.player_id=actor.id and a.action_type='dossier_vote_v771'
    and a.payload->>'source_id'=p_event_id::text) into v_existing;
  if not v_existing then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(current_room.code,actor.id,current_room.cycle,'dossier_vote_v771',
      jsonb_build_object('source_id',p_event_id::text));
  end if;
  select count(distinct a.player_id)::integer into v_votes from public.igr_v4_actions a
    join public.igr_v4_players voter on voter.id=a.player_id and voter.room_code=current_room.code
    where a.room_code=current_room.code and a.action_type='dossier_vote_v771'
      and a.payload->>'source_id'=p_event_id::text
      and voter.public_role in ('enqueteur','analyste','procureur','juge','inspecteur','expert') and voter.public_role=any(source_event.audience_roles);
  if v_votes<v_required_votes then
    return jsonb_build_object('status','pending','votes',v_votes,'required_votes',v_required_votes);
  end if;

  insert into public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
  values(current_room.code,'public_evidence','public',current_room.cycle,
     jsonb_build_object(
       'title',left('Document communiqué · '||(source_event.payload->>'title'),120),
       'text',left(coalesce(source_event.payload->>'text',source_event.payload->>'summary',''),1000),
       'source','camp_enquete','source_id',source_event.id::text,
       'source_type',source_event.event_type,'public_broadcast',true,
       'verified',coalesce(source_event.payload->>'verified','false')='true',
       'release_mode',case when v_required_votes=1 then 'sole_authorized_investigator' else 'two_distinct_investigators' end));
  return jsonb_build_object('status','published','votes',v_votes,'required_votes',v_required_votes);
end;
$function$;


revoke all on function public.igr_v771_dossier_vote(text,uuid,bigint) from public,authenticated,anon;
grant execute on function public.igr_v771_dossier_vote(text,uuid,bigint) to anon;

