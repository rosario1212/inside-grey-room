-- Inside Grey Room — v45 client dismissal
-- A represented suspect may dismiss their official lawyer once per game.
-- The dismissal is irreversible for that suspect; the former lawyer becomes free to represent someone else.

create table if not exists public.igr_v45_lawyer_dismissals (
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  suspect_id uuid not null references public.igr_v4_players(id) on delete cascade,
  lawyer_id uuid not null references public.igr_v4_players(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (room_code,suspect_id)
);

revoke all on table public.igr_v45_lawyer_dismissals from public,anon,authenticated;
grant all on table public.igr_v45_lawyer_dismissals to service_role;

create or replace function public.igr_v45_block_rehire_after_dismissal()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if exists(
    select 1
    from public.igr_v45_lawyer_dismissals d
    where d.room_code=new.room_code and d.suspect_id=new.suspect_id
  ) then
    raise exception 'representation permanently ended by suspect';
  end if;
  return new;
end
$$;

revoke all on function public.igr_v45_block_rehire_after_dismissal() from public,anon,authenticated;
grant execute on function public.igr_v45_block_rehire_after_dismissal() to service_role;

drop trigger if exists igr_v45_block_rehire_after_dismissal_trg on public.igr_v43_lawyer_requests;
create trigger igr_v45_block_rehire_after_dismissal_trg
before insert on public.igr_v43_lawyer_requests
for each row execute function public.igr_v45_block_rehire_after_dismissal();

create or replace function public.igr_v45_lawyer_state(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  base jsonb;
  d public.igr_v45_lawyer_dismissals%rowtype;
  former_name text;
  used boolean:=false;
  represented boolean:=false;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  base:=public.igr_v43_lawyer_state(p_code,p_player_token);

  select * into d
  from public.igr_v45_lawyer_dismissals
  where room_code=me.room_code and suspect_id=me.id;
  used:=found;

  if used then
    select p.pseudo into former_name from public.igr_v4_players p where p.id=d.lawyer_id;
  end if;

  represented:=coalesce((base->>'represented')::boolean,false);

  return base || jsonb_build_object(
    'version','v45',
    'dismissal_used',used,
    'can_dismiss',me.public_role='suspect' and represented and not used,
    'former_lawyer',case when used then jsonb_build_object(
      'id',d.lawyer_id::text,
      'pseudo',former_name,
      'dismissed_at',d.dismissed_at
    ) else null end,
    'can_request',case
      when me.public_role='suspect' and used then false
      else coalesce((base->>'can_request')::boolean,false)
    end
  );
end
$$;

revoke all on function public.igr_v45_lawyer_state(text,uuid) from public,anon,authenticated;
grant execute on function public.igr_v45_lawyer_state(text,uuid) to anon,service_role;

create or replace function public.igr_v45_dismiss_lawyer(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  rep public.igr_v43_lawyer_representations%rowtype;
  lawyer_name text;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'suspect' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  if not found or r.status<>'playing' then raise exception 'game unavailable'; end if;
  if r.phase in ('final_debrief','locking','judge_speech','judge_integrity_vote','reveal','closed') then
    raise exception 'representation can no longer be changed';
  end if;

  if exists(
    select 1 from public.igr_v45_lawyer_dismissals d
    where d.room_code=r.code and d.suspect_id=me.id
  ) then
    raise exception 'lawyer dismissal already used';
  end if;

  select * into rep
  from public.igr_v43_lawyer_representations
  where room_code=r.code and client_id=me.id
  for update;
  if not found then raise exception 'no official lawyer to dismiss'; end if;

  -- Avoid changing representation in the middle of a locked private interaction.
  if to_regprocedure('public.igr_v44_player_is_free(text,uuid)') is not null
     and not public.igr_v44_player_is_free(r.code,me.id) then
    raise exception 'finish your current activity before dismissing the lawyer';
  end if;

  select pseudo into lawyer_name from public.igr_v4_players where id=rep.lawyer_id;

  insert into public.igr_v45_lawyer_dismissals(room_code,suspect_id,lawyer_id)
  values(r.code,me.id,rep.lawyer_id);

  delete from public.igr_v43_lawyer_representations
  where room_code=r.code and client_id=me.id and lawyer_id=rep.lawyer_id;

  update public.igr_v43_lawyer_requests
  set status='closed',decided_at=coalesce(decided_at,now())
  where room_code=r.code and suspect_id=me.id and status in ('pending','accepted');

  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(
    r.code,'lawyer_dismissal','private',me.id,
    jsonb_build_object(
      'title','REPRÉSENTATION TERMINÉE',
      'text','Tu as mis fin à la représentation de '||coalesce(lawyer_name,'l’Avocat')||'. Ce choix est définitif : tu ne peux plus demander de nouvel avocat officiel.',
      'lawyer_id',rep.lawyer_id::text
    )
  );

  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(
    r.code,'lawyer_dismissal','private',rep.lawyer_id,
    jsonb_build_object(
      'title','FIN DE REPRÉSENTATION',
      'text',me.pseudo||' a mis fin à votre représentation. Vous êtes à nouveau libre d’accepter un autre client officiel.',
      'suspect_id',me.id::text
    )
  );

  return jsonb_build_object(
    'ok',true,
    'status','dismissed',
    'lawyer_id',rep.lawyer_id::text,
    'lawyer_pseudo',lawyer_name,
    'irreversible',true,
    'can_request_new_lawyer',false
  );
end
$$;

revoke all on function public.igr_v45_dismiss_lawyer(text,uuid) from public,anon,authenticated;
grant execute on function public.igr_v45_dismiss_lawyer(text,uuid) to anon,service_role;

-- Keep the role card aligned with the new unilateral client right.
update public.igr_v4_scenario_packs
set pack=jsonb_set(
  pack,
  '{role_notes,maitre,anchors}',
  to_jsonb('Un seul client officiel à la fois par avocat. Le client peut mettre fin une seule fois à sa représentation ; cette rupture est définitive pour lui et libère l’Avocat pour un autre suspect. Les non-représentés gardent leur consultation unique pendant leur propre interrogatoire.'::text),
  true
)
where scenario_id in ('016','019','020') and pack->'role_notes' ? 'maitre';
