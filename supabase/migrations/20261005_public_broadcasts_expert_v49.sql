-- Inside Grey Room v49 — public broadcasts
-- Breaking News stays explicitly public; Expert may publicly present only a canonical analysis already completed.

create or replace function public.igr_v4_publish_breaking(
  p_code text,
  p_player_token uuid,
  p_choice text
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  item jsonb;
  idx int;
  n int;
  used jsonb;
  total int;
begin
  select * into p
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or p.public_role<>'journaliste' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.status<>'playing' or r.phase in ('role_reading','initial_debrief','trame','closed','provisional_orals','provisional_lock','defense','final_debrief','locking') then
    raise exception 'closed';
  end if;

  if exists(
    select 1 from public.igr_v4_actions
    where room_code=r.code and player_id=p.id and cycle=r.cycle and action_type='breaking_news'
  ) then raise exception 'cycle limit'; end if;

  select count(*) into total
  from public.igr_v4_actions
  where room_code=r.code and player_id=p.id and action_type='breaking_news';
  if total>=3 then raise exception 'limit reached'; end if;

  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  n:=jsonb_array_length(coalesce(pack->'news','[]'::jsonb));
  item:=null;
  for idx in 0..greatest(n-1,0) loop
    if n>0 and pack->'news'->idx->>'id'=p_choice then
      item:=pack->'news'->idx;
      exit;
    end if;
  end loop;
  if item is null then raise exception 'invalid choice'; end if;

  used:=coalesce(r.state->'used_news','{}'::jsonb);
  if used ? p_choice then raise exception 'already published'; end if;
  used:=used||jsonb_build_object(p_choice,true);

  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(r.code,p.id,r.cycle,'breaking_news',jsonb_build_object('choice',p_choice));

  update public.igr_v4_rooms
  set state=jsonb_set(state,'{used_news}',used,true),updated_at=now()
  where code=r.code;

  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
  values(
    r.code,
    'breaking_news',
    'public',
    jsonb_build_object(
      'title','‼️ BREAKING NEWS — '||coalesce(item->>'title','PUBLICATION'),
      'text',item->>'text',
      'author',p.pseudo,
      'public_broadcast',true,
      'source','journaliste'
    )
  );

  return jsonb_build_object('ok',true,'visibility','public');
end
$function$;

create or replace function public.igr_v49_expert_public_state(
  p_code text,
  p_player_token uuid
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  items jsonb;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'action_id',a.id,
      'cycle',a.cycle,
      'choice',a.payload->>'choice',
      'title',coalesce(item.value->>'title','EXPERTISE'),
      'result',coalesce(item.value->>'result',item.value->>'text','Résultat indisponible.'),
      'published',exists(
        select 1
        from public.igr_v4_actions pub
        where pub.room_code=r.code
          and pub.player_id=me.id
          and pub.action_type='expert_public'
          and pub.payload->>'source_action_id'=a.id::text
      )
    ) order by a.id
  ),'[]'::jsonb) into items
  from public.igr_v4_actions a
  join lateral jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) item(value)
    on item.value->>'id'=a.payload->>'choice'
  where a.room_code=r.code
    and a.player_id=me.id
    and a.action_type='expert';

  return jsonb_build_object(
    'version','v49',
    'analyses',items,
    'can_publish',r.status='playing' and r.phase not in ('closed','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal')
  );
end
$function$;

create or replace function public.igr_v49_publish_expert_result(
  p_code text,
  p_player_token uuid,
  p_action_id bigint
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  a public.igr_v4_actions%rowtype;
  pack jsonb;
  item jsonb;
  choice text;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  if r.status<>'playing' or r.phase in ('closed','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') then
    raise exception 'publication closed';
  end if;

  select * into a
  from public.igr_v4_actions
  where id=p_action_id
    and room_code=r.code
    and player_id=me.id
    and action_type='expert'
  for update;
  if not found then raise exception 'analysis unavailable'; end if;

  if exists(
    select 1 from public.igr_v4_actions pub
    where pub.room_code=r.code
      and pub.player_id=me.id
      and pub.action_type='expert_public'
      and pub.payload->>'source_action_id'=a.id::text
  ) then raise exception 'already published'; end if;

  choice:=a.payload->>'choice';
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  select v.value into item
  from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v(value)
  where v.value->>'id'=choice
  limit 1;
  if item is null then raise exception 'canonical result unavailable'; end if;

  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  values(
    r.code,
    me.id,
    r.cycle,
    'expert_public',
    jsonb_build_object('source_action_id',a.id,'choice',choice)
  );

  insert into public.igr_v4_events(room_code,event_type,visibility,payload)
  values(
    r.code,
    'expert_public',
    'public',
    jsonb_build_object(
      'title','EXPERTISE PUBLIQUE — '||coalesce(item->>'title','ANALYSE'),
      'text',coalesce(item->>'result',item->>'text','Résultat indisponible.'),
      'author',me.pseudo,
      'public_broadcast',true,
      'source','expert',
      'source_action_id',a.id,
      'choice',choice
    )
  );

  return jsonb_build_object('ok',true,'status','published','visibility','public','source_action_id',a.id);
end
$function$;

revoke all on function public.igr_v49_expert_public_state(text,uuid) from public;
revoke all on function public.igr_v49_publish_expert_result(text,uuid,bigint) from public;
grant execute on function public.igr_v49_expert_public_state(text,uuid) to anon,authenticated,service_role;
grant execute on function public.igr_v49_publish_expert_result(text,uuid,bigint) to anon,authenticated,service_role;
