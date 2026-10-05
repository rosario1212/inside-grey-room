-- Inside Grey Room v48: Judge and Prosecutor individual meetings are 3 minutes.
-- Judge joint review stays at 2 minutes; Lawyer consultation stays at 1 minute.

create or replace function public.igr_v44_confirm_summon(p_code text, p_player_token uuid, p_summons bigint)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  s public.igr_v44_judge_summons%rowtype;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into s
  from public.igr_v44_judge_summons
  where id=p_summons and room_code=me.room_code and target_id=me.id
  for update;
  if not found or s.status<>'pending' then raise exception 'summons unavailable'; end if;

  update public.igr_v44_judge_summons
  set status='active',confirmed_at=now(),started_at=now(),ends_at=now()+interval '3 minutes'
  where id=s.id;

  return jsonb_build_object('ok',true,'status','active','seconds',180);
end
$$;

create or replace function public.igr_v47_confirm_prosecutor_interview(p_code text, p_player_token uuid, p_interview bigint)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  i public.igr_v47_prosecutor_interviews%rowtype;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into i
  from public.igr_v47_prosecutor_interviews
  where id=p_interview and room_code=me.room_code and target_id=me.id
  for update;
  if not found or i.status<>'pending' then raise exception 'interview unavailable'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;
  if r.status<>'playing' or r.cycle<>i.cycle or r.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') then
    raise exception 'interview expired';
  end if;

  update public.igr_v47_prosecutor_interviews
  set status='active',confirmed_at=now(),started_at=now(),ends_at=now()+interval '3 minutes'
  where id=i.id;

  return jsonb_build_object('ok',true,'status','active','seconds',180);
end
$$;

create or replace function public.igr_v47_prosecutor_summon(p_code text, p_player_token uuid, p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  t public.igr_v4_players%rowtype;
  lid uuid;
  lp text;
  sid bigint;
begin
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'procureur' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;
  perform public.igr_v47_tick_prosecutor(r.code);
  if r.status<>'playing' or r.cycle not between 1 and 3 then raise exception 'interview unavailable'; end if;

  select * into t from public.igr_v4_players where room_code=r.code and id=p_target and id<>me.id;
  if not found then raise exception 'invalid target'; end if;
  if not public.igr_v44_player_is_free(r.code,me.id) or not public.igr_v44_player_is_free(r.code,t.id) then raise exception 'player not free'; end if;
  if exists(
    select 1 from public.igr_v47_prosecutor_interviews i
    where i.room_code=r.code and i.prosecutor_id=me.id and i.target_id=t.id and i.cycle=r.cycle and i.status<>'cancelled'
  ) then raise exception 'target already interviewed this cycle'; end if;

  if t.public_role='suspect' then
    select x.lawyer_id,l.pseudo into lid,lp
    from public.igr_v43_lawyer_representations x
    join public.igr_v4_players l on l.id=x.lawyer_id
    where x.room_code=r.code and x.client_id=t.id
    limit 1;
    if lid is not null and not public.igr_v44_player_is_free(r.code,lid) then raise exception 'lawyer not free'; end if;
  end if;

  insert into public.igr_v47_prosecutor_interviews(room_code,prosecutor_id,target_id,lawyer_id,cycle)
  values(r.code,me.id,t.id,lid,r.cycle)
  returning id into sid;

  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(
    r.code,'prosecutor_summons','private',t.id,
    jsonb_build_object(
      'title','CONVOCATION DU PROCUREUR',
      'text','Le Procureur vous convoque pour un entretien de 3 minutes. Confirmez depuis l’application.'||case when lid is not null then ' Votre Avocat vous accompagne.' else '' end,
      'interview_id',sid
    )
  );

  if lid is not null then
    insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
    values(
      r.code,'prosecutor_summons_lawyer','private',lid,
      jsonb_build_object(
        'title','VOTRE CLIENT EST CONVOQUÉ',
        'text',t.pseudo||' est convoqué par le Procureur. Vous devez l’accompagner pendant l’entretien de 3 minutes.',
        'interview_id',sid
      )
    );
  end if;

  return jsonb_build_object('ok',true,'interview_id',sid,'target',t.pseudo,'lawyer_id',lid,'lawyer',lp);
end
$$;

update public.igr_v4_scenario_packs
set pack=jsonb_set(
  pack,
  '{role_notes,procureur,anchors}',
  to_jsonb('Tu appartiens publiquement au camp Enquête. Tu as accès au Flux et peux convoquer tout joueur libre pendant 3 minutes. Au moins un entretien doit être terminé par cycle. Si un suspect est représenté, son Avocat l’accompagne. Tu cherches la vérité en fissurant les alliances et peux proposer des coopérations entre suspects.'::text),
  true
)
where scenario_id in ('013','017','019','020');
