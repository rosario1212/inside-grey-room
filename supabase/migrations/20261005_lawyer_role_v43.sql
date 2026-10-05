-- Inside Grey Room — v43 lawyer representation
-- One official client per lawyer, repeatable requests after refusal, and role-scoped state.

create table if not exists public.igr_v43_lawyer_requests (
  id bigserial primary key,
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  suspect_id uuid not null references public.igr_v4_players(id) on delete cascade,
  attempt integer not null default 1 check (attempt > 0),
  status text not null default 'pending' check (status in ('pending','refused','accepted','closed')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.igr_v4_players(id) on delete set null
);

create unique index if not exists igr_v43_lawyer_requests_one_pending
  on public.igr_v43_lawyer_requests(room_code,suspect_id)
  where status='pending';
create index if not exists igr_v43_lawyer_requests_room_status
  on public.igr_v43_lawyer_requests(room_code,status,requested_at);

create table if not exists public.igr_v43_lawyer_representations (
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  lawyer_id uuid not null references public.igr_v4_players(id) on delete cascade,
  client_id uuid not null references public.igr_v4_players(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  primary key (room_code,lawyer_id),
  unique (room_code,client_id)
);

revoke all on table public.igr_v43_lawyer_requests from public,anon,authenticated;
revoke all on table public.igr_v43_lawyer_representations from public,anon,authenticated;
grant all on table public.igr_v43_lawyer_requests to service_role;
grant all on table public.igr_v43_lawyer_representations to service_role;
grant usage,select on sequence public.igr_v43_lawyer_requests_id_seq to service_role;

create or replace function public.igr_v43_lawyer_brief(p_suspect uuid)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  s public.igr_v4_players%rowtype;
  card jsonb;
  hay text;
  n text;
begin
  select * into s from public.igr_v4_players where id=p_suspect;
  if not found or s.public_role<>'suspect' then return ''; end if;
  card:=coalesce(s.private_state,'{}'::jsonb);
  n:=coalesce(nullif(trim(s.pseudo),''),'Le suspect');
  hay:=lower(concat_ws(' ',card->>'place',card->>'chronology',card->>'hide',card->>'anchors',card->>'position',card->>'objective_main'));

  if hay ~ '(tu caches le meurtre|meurtre est ton choix|d[ée]cides?[^.]{0,50}tuer|geste fatal|coup fatal|tir mortel|poignard|[ée]trangl|empoisonn)' then
    return n||' est très exposé : un acte directement lié au fait principal peut lui être reproché. La défense devra distinguer sa décision personnelle du plan ou des actes des autres.';
  elsif hay ~ '(aide mat[ée]rielle|interm[ée]diaire|tu fournis|fournit|fourni une partie|adresse|mat[ée]riel)' then
    return n||' est exposé par une aide matérielle ou logistique concrète. Il faudra distinguer cette participation de la décision ou de l’acte principal.';
  elsif hay ~ '(organis|pr[ée]pare|enl[èe]vement|s[ée]datif|drogue|humili|violence|menac|contraint|retient|s[ée]questr)' then
    return n||' est fortement exposé : une participation à la préparation, à la contrainte ou à la violence peut être établie. Le lien exact avec le fait principal reste déterminant.';
  elsif hay ~ '(cache|efface|supprime|falsifi|modifie|dissimule|d[ée]place le corps|mensonge|menti|d[ée]truit)' then
    return n||' est exposé par une dissimulation ou une action postérieure aux faits. La défense devra empêcher que cette conduite soit automatiquement confondue avec le fait principal.';
  elsif hay ~ '(inaction|n.interviens|refus|retard|laisse faire|secours|ignore|pouvais intervenir|pouvait intervenir)' then
    return n||' est exposé par une possible inaction, un retard ou une occasion d’intervenir. L’enjeu sera d’établir précisément ce qui était connu et réellement possible à ce moment-là.';
  elsif hay ~ '(dette|argent|h[ée]ritage|testament|financ|b[ée]n[ée]ficiaire|patrimoine)' then
    return n||' présente un intérêt personnel ou financier susceptible d’attirer les soupçons. Cet intérêt ne suffit toutefois pas, à lui seul, à établir la responsabilité dans le fait principal.';
  else
    return n||' peut être mis en cause sur un élément concret du dossier. La défense devra faire préciser les faits réellement attribuables au suspect sans laisser l’enquête élargir sa responsabilité.';
  end if;
end
$$;

revoke all on function public.igr_v43_lawyer_brief(uuid) from public,anon,authenticated;
grant execute on function public.igr_v43_lawyer_brief(uuid) to service_role;

create or replace function public.igr_v43_lawyer_state(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  rep record;
  latest_req record;
  pending jsonb:='[]'::jsonb;
  people jsonb:='[]'::jsonb;
  lawyer_count integer:=0;
  represented_count integer:=0;
  my_rep boolean:=false;
  can_request boolean:=false;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;
  if not found then raise exception 'room not found'; end if;

  select count(*) into lawyer_count
  from public.igr_v4_players
  where room_code=r.code and public_role='maitre';

  select count(*) into represented_count
  from public.igr_v43_lawyer_representations
  where room_code=r.code;

  if me.public_role='maitre' then
    select lr.client_id,lr.accepted_at,c.pseudo as client_pseudo
      into rep
    from public.igr_v43_lawyer_representations lr
    join public.igr_v4_players c on c.id=lr.client_id
    where lr.room_code=r.code and lr.lawyer_id=me.id
    limit 1;

    my_rep:=found;

    select coalesce(jsonb_agg(jsonb_build_object(
      'suspect_id',s.id::text,
      'pseudo',s.pseudo,
      'brief',public.igr_v43_lawyer_brief(s.id),
      'attempt',q.attempt,
      'requested_at',q.requested_at
    ) order by q.requested_at),'[]'::jsonb)
    into pending
    from public.igr_v43_lawyer_requests q
    join public.igr_v4_players s on s.id=q.suspect_id and s.room_code=r.code
    where q.room_code=r.code and q.status='pending'
      and not exists (
        select 1 from public.igr_v43_lawyer_representations x
        where x.room_code=r.code and x.client_id=s.id
      );

    select coalesce(jsonb_agg(jsonb_build_object(
      'id',s.id::text,
      'pseudo',s.pseudo,
      'represented',exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.client_id=s.id),
      'is_client',exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.lawyer_id=me.id and x.client_id=s.id)
    ) order by s.internal_slot,s.seat_index),'[]'::jsonb)
    into people
    from public.igr_v4_players s
    where s.room_code=r.code and s.public_role='suspect';

    return jsonb_build_object(
      'version','v43',
      'role','maitre',
      'cycle',coalesce(r.cycle,0),
      'phase',r.phase,
      'lawyer_count',lawyer_count,
      'has_client',my_rep,
      'client',case when my_rep then jsonb_build_object(
        'id',rep.client_id::text,
        'pseudo',rep.client_pseudo,
        'brief',public.igr_v43_lawyer_brief(rep.client_id),
        'accepted_at',rep.accepted_at
      ) else null end,
      'pending_requests',pending,
      'suspects',people
    );
  elsif me.public_role='suspect' then
    select lr.lawyer_id,lr.accepted_at,l.pseudo as lawyer_pseudo
      into rep
    from public.igr_v43_lawyer_representations lr
    join public.igr_v4_players l on l.id=lr.lawyer_id
    where lr.room_code=r.code and lr.client_id=me.id
    limit 1;
    my_rep:=found;

    select q.status,q.attempt,q.requested_at,q.decided_at
      into latest_req
    from public.igr_v43_lawyer_requests q
    where q.room_code=r.code and q.suspect_id=me.id
    order by q.id desc
    limit 1;

    can_request:=lawyer_count>0
      and not my_rep
      and represented_count<lawyer_count
      and coalesce(r.cycle,0)<=3
      and not exists (
        select 1 from public.igr_v43_lawyer_requests q
        where q.room_code=r.code and q.suspect_id=me.id and q.status='pending'
      );

    return jsonb_build_object(
      'version','v43',
      'role','suspect',
      'cycle',coalesce(r.cycle,0),
      'phase',r.phase,
      'lawyer_count',lawyer_count,
      'represented',my_rep,
      'lawyer',case when my_rep then jsonb_build_object('id',rep.lawyer_id::text,'pseudo',rep.lawyer_pseudo,'accepted_at',rep.accepted_at) else null end,
      'request',case when latest_req.status is not null then jsonb_build_object(
        'status',latest_req.status,
        'attempt',latest_req.attempt,
        'requested_at',latest_req.requested_at,
        'decided_at',latest_req.decided_at
      ) else null end,
      'can_request',can_request,
      'lawyer_available',lawyer_count>represented_count
    );
  end if;

  return jsonb_build_object('version','v43','role',me.public_role,'lawyer_count',lawyer_count);
end
$$;

create or replace function public.igr_v43_request_lawyer(
  p_code text,
  p_player_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  attempt_no integer;
  lawyer_count integer;
  represented_count integer;
  q public.igr_v43_lawyer_requests%rowtype;
begin
  select * into me from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'suspect' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  if not found then raise exception 'room not found'; end if;
  if coalesce(r.cycle,0)>3 then raise exception 'representation window closed'; end if;

  if exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.client_id=me.id) then
    return jsonb_build_object('ok',true,'status','represented');
  end if;

  select count(*) into lawyer_count from public.igr_v4_players where room_code=r.code and public_role='maitre';
  select count(*) into represented_count from public.igr_v43_lawyer_representations where room_code=r.code;
  if lawyer_count=0 or represented_count>=lawyer_count then raise exception 'lawyer unavailable'; end if;

  select * into q from public.igr_v43_lawyer_requests
  where room_code=r.code and suspect_id=me.id and status='pending'
  order by id desc limit 1;
  if found then return jsonb_build_object('ok',true,'status','pending','attempt',q.attempt); end if;

  select coalesce(max(attempt),0)+1 into attempt_no
  from public.igr_v43_lawyer_requests
  where room_code=r.code and suspect_id=me.id;

  insert into public.igr_v43_lawyer_requests(room_code,suspect_id,attempt,status)
  values(r.code,me.id,attempt_no,'pending');

  return jsonb_build_object('ok',true,'status','pending','attempt',attempt_no);
end
$$;

create or replace function public.igr_v43_refuse_lawyer(
  p_code text,
  p_player_token uuid,
  p_suspect uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  changed bigint;
begin
  select * into me from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'maitre' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  if exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.lawyer_id=me.id) then
    raise exception 'client already locked';
  end if;

  update public.igr_v43_lawyer_requests
  set status='refused',decided_at=now(),decided_by=me.id
  where id=(
    select id from public.igr_v43_lawyer_requests
    where room_code=r.code and suspect_id=p_suspect and status='pending'
    order by id desc limit 1
  );
  get diagnostics changed=row_count;
  if changed=0 then raise exception 'request not pending'; end if;

  return jsonb_build_object('ok',true,'status','refused','can_request_again',true);
end
$$;

create or replace function public.igr_v43_accept_lawyer(
  p_code text,
  p_player_token uuid,
  p_suspect uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  s public.igr_v4_players%rowtype;
  req_id bigint;
  lawyer_count integer;
begin
  select * into me from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'maitre' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;
  if not found then raise exception 'room not found'; end if;

  if exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.lawyer_id=me.id) then
    raise exception 'client already locked';
  end if;

  select * into s from public.igr_v4_players
  where id=p_suspect and room_code=r.code and public_role='suspect';
  if not found then raise exception 'invalid suspect'; end if;
  if exists(select 1 from public.igr_v43_lawyer_representations x where x.room_code=r.code and x.client_id=s.id) then
    raise exception 'suspect already represented';
  end if;

  select id into req_id from public.igr_v43_lawyer_requests
  where room_code=r.code and suspect_id=s.id and status='pending'
  order by id desc limit 1 for update;
  if req_id is null then raise exception 'request not pending'; end if;

  insert into public.igr_v43_lawyer_representations(room_code,lawyer_id,client_id)
  values(r.code,me.id,s.id);

  update public.igr_v43_lawyer_requests
  set status='accepted',decided_at=now(),decided_by=me.id
  where id=req_id;

  select count(*) into lawyer_count from public.igr_v4_players where room_code=r.code and public_role='maitre';
  if lawyer_count<=1 then
    update public.igr_v43_lawyer_requests
    set status='closed',decided_at=coalesce(decided_at,now()),decided_by=coalesce(decided_by,me.id)
    where room_code=r.code and status='pending' and id<>req_id;
  else
    update public.igr_v43_lawyer_requests
    set status='closed',decided_at=coalesce(decided_at,now()),decided_by=coalesce(decided_by,me.id)
    where room_code=r.code and suspect_id=s.id and status='pending' and id<>req_id;
  end if;

  return jsonb_build_object(
    'ok',true,
    'status','accepted',
    'client_id',s.id::text,
    'client_pseudo',s.pseudo,
    'locked',true
  );
end
$$;

revoke all on function public.igr_v43_lawyer_state(text,uuid) from public;
revoke all on function public.igr_v43_request_lawyer(text,uuid) from public;
revoke all on function public.igr_v43_refuse_lawyer(text,uuid,uuid) from public;
revoke all on function public.igr_v43_accept_lawyer(text,uuid,uuid) from public;
grant execute on function public.igr_v43_lawyer_state(text,uuid) to anon,service_role;
grant execute on function public.igr_v43_request_lawyer(text,uuid) to anon,service_role;
grant execute on function public.igr_v43_refuse_lawyer(text,uuid,uuid) to anon,service_role;
grant execute on function public.igr_v43_accept_lawyer(text,uuid,uuid) to anon,service_role;

-- New games should stop describing the lawyer as a multi-client role. Existing
-- private cards are corrected client-side by the v43 runtime as well.
update public.igr_v4_scenario_packs
set pack=jsonb_set(
  pack,
  '{role_notes,maitre,anchors}',
  to_jsonb('Un seul client officiel par avocat. Les autres suspects peuvent toujours être reçus en consultation officieuse.'::text),
  true
)
where scenario_id in ('016','019','020') and pack->'role_notes' ? 'maitre';
