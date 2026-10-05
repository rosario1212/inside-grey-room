-- Inside Grey Room — v47 Procureur
-- Cabinet du Parquet, profils initiaux, entretiens 2 min avec joueurs libres,
-- coopération entre suspects, corruption cachée et hiérarchie de vérité du camp.

create table if not exists public.igr_v47_prosecutor_runtime (
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  prosecutor_id uuid not null references public.igr_v4_players(id) on delete cascade,
  corrupt boolean not null default false,
  protected_target_id uuid references public.igr_v4_players(id) on delete set null,
  initialized_at timestamptz not null default now(),
  primary key(room_code,prosecutor_id)
);

create table if not exists public.igr_v47_prosecutor_interviews (
  id bigserial primary key,
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  prosecutor_id uuid not null references public.igr_v4_players(id) on delete cascade,
  target_id uuid not null references public.igr_v4_players(id) on delete cascade,
  lawyer_id uuid references public.igr_v4_players(id) on delete set null,
  cycle integer not null check(cycle between 1 and 3),
  status text not null default 'pending' check(status in ('pending','active','completed','cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  started_at timestamptz,
  ends_at timestamptz,
  ended_at timestamptz,
  unique(room_code,prosecutor_id,target_id,cycle)
);

create table if not exists public.igr_v47_prosecutor_cooperations (
  id bigserial primary key,
  room_code text not null references public.igr_v4_rooms(code) on delete cascade,
  prosecutor_id uuid not null references public.igr_v4_players(id) on delete cascade,
  suspect_id uuid not null references public.igr_v4_players(id) on delete cascade,
  against_player_id uuid not null references public.igr_v4_players(id) on delete cascade,
  interview_id bigint references public.igr_v47_prosecutor_interviews(id) on delete set null,
  cycle integer not null check(cycle between 1 and 3),
  note text not null default '',
  status text not null default 'pending' check(status in ('pending','accepted','refused')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists igr_v47_prosecutor_cooperation_one_pending
  on public.igr_v47_prosecutor_cooperations(room_code,prosecutor_id,suspect_id)
  where status='pending';
create index if not exists igr_v47_prosecutor_interviews_room_cycle
  on public.igr_v47_prosecutor_interviews(room_code,cycle,status);
create index if not exists igr_v47_prosecutor_interviews_target
  on public.igr_v47_prosecutor_interviews(target_id);
create index if not exists igr_v47_prosecutor_interviews_lawyer
  on public.igr_v47_prosecutor_interviews(lawyer_id) where lawyer_id is not null;
create index if not exists igr_v47_prosecutor_runtime_target
  on public.igr_v47_prosecutor_runtime(protected_target_id) where protected_target_id is not null;
create index if not exists igr_v47_prosecutor_cooperations_suspect
  on public.igr_v47_prosecutor_cooperations(suspect_id);
create index if not exists igr_v47_prosecutor_cooperations_against
  on public.igr_v47_prosecutor_cooperations(against_player_id);

alter table public.igr_v47_prosecutor_runtime enable row level security;
alter table public.igr_v47_prosecutor_interviews enable row level security;
alter table public.igr_v47_prosecutor_cooperations enable row level security;
revoke all on table public.igr_v47_prosecutor_runtime from public,anon,authenticated;
revoke all on table public.igr_v47_prosecutor_interviews from public,anon,authenticated;
revoke all on table public.igr_v47_prosecutor_cooperations from public,anon,authenticated;
grant all on table public.igr_v47_prosecutor_runtime to service_role;
grant all on table public.igr_v47_prosecutor_interviews to service_role;
grant all on table public.igr_v47_prosecutor_cooperations to service_role;
grant usage,select on sequence public.igr_v47_prosecutor_interviews_id_seq to service_role;
grant usage,select on sequence public.igr_v47_prosecutor_cooperations_id_seq to service_role;

-- Dossiers initiaux : informations de profil, jamais la vérité canonique ni les secrets de carte.
update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{prosecutor_profiles}',
  '[{"slot":1,"text":"Profil logistique : à tester sur les déplacements, relais et liens opérationnels."},{"slot":2,"text":"Profil discret : à confronter sur sa présence, ses contacts et sa chronologie."},{"slot":3,"text":"Profil institutionnel : à tester sur les accès, procédures et anomalies de sécurité."}]'::jsonb,true)
where scenario_id='013';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{prosecutor_profiles}',
  '[{"slot":1,"text":"Profil opérationnel : à confronter sur la violence, les ordres reçus et ce qu’il a personnellement fait."},{"slot":2,"text":"Profil organisateur : à tester sur le contrôle de la situation, les décisions et les délais."},{"slot":3,"text":"Profil réseau : à confronter sur les contacts, paiements, messages et décisions prises après les faits."}]'::jsonb,true)
where scenario_id='017';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{prosecutor_profiles}',
  '[{"slot":1,"text":"Profil d’influence : intérêts puissants, réseaux et capacité à faire pression sans agir directement."},{"slot":2,"text":"Profil sécurité : accès opérationnels, contrôle des déplacements et maîtrise des zones sensibles."},{"slot":3,"text":"Profil intermédiaire : circulation d’informations, gestion de crise et liens entre plusieurs acteurs."}]'::jsonb,true)
where scenario_id='019';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{prosecutor_profiles}',
  '[{"slot":1,"text":"Profil exploitation : décisions sur le bâtiment, accès et arbitrages de sécurité."},{"slot":2,"text":"Profil technique : maintenance, conformité et connaissance des défaillances."},{"slot":3,"text":"Profil commandement : réaction opérationnelle, délais et interprétation des premiers signaux."},{"slot":4,"text":"Profil activiste : mobile revendicatif, actions de diversion et compréhension réelle des risques."}]'::jsonb,true)
where scenario_id='020';

update public.igr_v4_scenario_packs
set pack=jsonb_set(pack,'{role_notes,procureur,anchors}',to_jsonb(
  'Tu appartiens publiquement au camp Enquête. Tu as accès au Flux et peux convoquer tout joueur libre pendant 2 minutes. Au moins un entretien doit être terminé par cycle. Si un suspect est représenté, son Avocat l’accompagne. Tu cherches la vérité en fissurant les alliances et peux proposer des coopérations entre suspects.'::text),true)
where scenario_id in ('013','017','019','020');

create or replace function public.igr_v47_ensure_prosecutor_runtime(p_room text,p_prosecutor uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  p public.igr_v4_players%rowtype;
  pack jsonb;
  levels jsonb;
  is_corrupt boolean;
  target uuid;
begin
  if exists(select 1 from public.igr_v47_prosecutor_runtime x where x.room_code=p_room and x.prosecutor_id=p_prosecutor) then return; end if;
  select * into p from public.igr_v4_players where id=p_prosecutor and room_code=p_room and public_role='procureur';
  if not found then return; end if;
  select sp.pack into pack from public.igr_v4_scenario_packs sp join public.igr_v4_rooms r on r.scenario_id=sp.scenario_id where r.code=p_room;
  levels:=coalesce(pack->'truth'->'levels','[]'::jsonb);
  is_corrupt:=random()<(1.0/3.0);
  if is_corrupt then
    select s.id into target
    from public.igr_v4_players s
    where s.room_code=p_room and s.public_role='suspect'
      and coalesce((levels->>(s.internal_slot-1))::int,0)>=2
    order by random() limit 1;
    if target is null then select s.id into target from public.igr_v4_players s where s.room_code=p_room and s.public_role='suspect' order by random() limit 1; end if;
  end if;
  insert into public.igr_v47_prosecutor_runtime(room_code,prosecutor_id,corrupt,protected_target_id)
  values(p_room,p_prosecutor,is_corrupt,target)
  on conflict(room_code,prosecutor_id) do nothing;
end
$$;

create or replace function public.igr_v47_tick_prosecutor(p_room text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
  select i.room_code,i.prosecutor_id,i.cycle,'prosecutor_interview',
    jsonb_build_object('interview_id',i.id,'target',i.target_id,'lawyer_id',i.lawyer_id,'completed_by','timer')
  from public.igr_v47_prosecutor_interviews i
  where i.room_code=p_room and i.status='active' and i.ends_at<=now()
    and not exists(select 1 from public.igr_v4_actions a where a.room_code=i.room_code and a.action_type='prosecutor_interview' and (a.payload->>'interview_id')::bigint=i.id);
  update public.igr_v47_prosecutor_interviews
  set status='completed',ended_at=coalesce(ended_at,now())
  where room_code=p_room and status='active' and ends_at<=now();
end
$$;

-- Rend les entretiens du Procureur incompatibles avec les convocations du Juge et les consultations Avocat.
create or replace function public.igr_v44_player_has_private_meeting(p_room text,p_player uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
 select exists(select 1 from public.igr_v44_judge_summons s where s.room_code=p_room and s.status in ('pending','active') and p_player in (s.judge_id,s.target_id))
 or exists(select 1 from public.igr_v44_judge_reviews r where r.room_code=p_room and r.status='active' and p_player in (r.investigator_id,r.analyst_id,r.judge_id))
 or exists(select 1 from public.igr_v44_lawyer_consultations c where c.room_code=p_room and c.status in ('pending','active') and p_player in (c.suspect_id,c.lawyer_id))
 or exists(select 1 from public.igr_v47_prosecutor_interviews i where i.room_code=p_room and i.status in ('pending','active') and (p_player in (i.prosecutor_id,i.target_id) or i.lawyer_id=p_player))
$$;

create or replace function public.igr_v47_prosecutor_state(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  proc public.igr_v4_players%rowtype;
  rt public.igr_v47_prosecutor_runtime%rowtype;
  current_i record;
  pending_deal record;
  profiles jsonb:='[]'::jsonb;
  free_people jsonb:='[]'::jsonb;
  deals jsonb:='[]'::jsonb;
  pack jsonb;
  pp jsonb;
  lawyer public.igr_v4_players%rowtype;
  completed int:=0;
  target_name text;
begin
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=me.room_code;
  select * into proc from public.igr_v4_players where room_code=r.code and public_role='procureur' order by seat_index limit 1;
  if not found then return jsonb_build_object('version','v47','present',false); end if;
  perform public.igr_v47_tick_prosecutor(r.code);
  perform public.igr_v47_ensure_prosecutor_runtime(r.code,proc.id);
  select * into rt from public.igr_v47_prosecutor_runtime where room_code=r.code and prosecutor_id=proc.id;
  select pseudo into target_name from public.igr_v4_players where id=rt.protected_target_id;

  select i.id,i.prosecutor_id,i.target_id,i.lawyer_id,i.cycle,i.status,i.ends_at,t.pseudo target_pseudo,l.pseudo lawyer_pseudo
  into current_i
  from public.igr_v47_prosecutor_interviews i
  join public.igr_v4_players t on t.id=i.target_id
  left join public.igr_v4_players l on l.id=i.lawyer_id
  where i.room_code=r.code and i.status in ('pending','active')
    and (me.id in (i.prosecutor_id,i.target_id) or i.lawyer_id=me.id)
  order by i.id desc limit 1;

  if me.id=proc.id then
    select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
    for pp in select value from jsonb_array_elements(coalesce(pack->'prosecutor_profiles','[]'::jsonb)) loop
      profiles:=profiles||jsonb_build_array(jsonb_build_object(
        'id',(select s.id::text from public.igr_v4_players s where s.room_code=r.code and s.public_role='suspect' and s.internal_slot=(pp->>'slot')::int limit 1),
        'pseudo',(select s.pseudo from public.igr_v4_players s where s.room_code=r.code and s.public_role='suspect' and s.internal_slot=(pp->>'slot')::int limit 1),
        'role','Suspect','text',pp->>'text'));
    end loop;
    for lawyer in select * from public.igr_v4_players x where x.room_code=r.code and x.public_role in ('journaliste','maitre','juge') order by x.seat_index loop
      profiles:=profiles||jsonb_build_array(jsonb_build_object(
        'id',lawyer.id::text,'pseudo',lawyer.pseudo,'role',case lawyer.public_role when 'journaliste' then 'Journaliste' when 'maitre' then 'Avocat' else 'Juge' end,
        'text',case lawyer.public_role
          when 'journaliste' then 'Acteur indépendant : il ne fait partie d’aucun camp. Il cherche ses propres objectifs, peut publier et peut coopérer sans devenir un allié durable.'
          when 'maitre' then 'Défense : il protège son client officiel, l’accompagne aux entretiens du Parquet et peut négocier sans obligation de loyauté envers les non-clients.'
          else 'Autorité finale : sa lecture des responsabilités prime pour la victoire du camp Enquête. Il contrôle aussi certains accès et peut être loyal ou corrompu.' end));
    end loop;

    select count(*) into completed from public.igr_v47_prosecutor_interviews i where i.room_code=r.code and i.prosecutor_id=proc.id and i.cycle=r.cycle and i.status='completed';

    select coalesce(jsonb_agg(jsonb_build_object(
      'id',x.id::text,'pseudo',x.pseudo,'role',x.public_role,
      'lawyer_id',lr.lawyer_id::text,'lawyer',l.pseudo
    ) order by x.seat_index),'[]'::jsonb)
    into free_people
    from public.igr_v4_players x
    left join public.igr_v43_lawyer_representations lr on lr.room_code=r.code and lr.client_id=x.id
    left join public.igr_v4_players l on l.id=lr.lawyer_id
    where x.room_code=r.code and x.id<>proc.id
      and public.igr_v44_player_is_free(r.code,x.id)
      and (lr.lawyer_id is null or public.igr_v44_player_is_free(r.code,lr.lawyer_id))
      and not exists(select 1 from public.igr_v47_prosecutor_interviews z where z.room_code=r.code and z.prosecutor_id=proc.id and z.target_id=x.id and z.cycle=r.cycle and z.status<>'cancelled');

    select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'suspect_id',c.suspect_id::text,'suspect',s.pseudo,'against_id',c.against_player_id::text,'against',a.pseudo,'status',c.status,'note',c.note,'cycle',c.cycle) order by c.id),'[]'::jsonb)
    into deals
    from public.igr_v47_prosecutor_cooperations c
    join public.igr_v4_players s on s.id=c.suspect_id
    join public.igr_v4_players a on a.id=c.against_player_id
    where c.room_code=r.code and c.prosecutor_id=proc.id;

    return jsonb_build_object(
      'version','v47','present',true,'role','procureur','cycle',r.cycle,'phase',r.phase,
      'corrupt',rt.corrupt,'protected_target_id',rt.protected_target_id::text,'protected_target',target_name,
      'objective_main',case when rt.corrupt then 'Réduis dans ta propre version finale la responsabilité attribuée à '||coalesce(target_name,'ta cible')||' sans révéler que tu le protèges.' else 'Établis correctement, dans ta propre version finale, la responsabilité réelle de chaque suspect.' end,
      'objective_secondary',case when rt.corrupt then 'Fais accepter une coopération qui détourne crédiblement l’attention vers un autre suspect et contribue à le faire surestimer dans la version qui fait autorité.' else 'Obtiens au moins une coopération utile d’un suspect contre un autre suspect réellement impliqué.' end,
      'profiles',profiles,'free_players',free_people,'completed_this_cycle',completed,'minimum_met',completed>=1,
      'interview',case when current_i.id is null then null else jsonb_build_object('id',current_i.id,'target_id',current_i.target_id::text,'target',current_i.target_pseudo,'lawyer_id',current_i.lawyer_id::text,'lawyer',current_i.lawyer_pseudo,'status',current_i.status,'ends_at',current_i.ends_at) end,
      'cooperations',deals
    );
  end if;

  if me.public_role='suspect' then
    select c.id,c.prosecutor_id,c.suspect_id,c.against_player_id,c.status,c.note,a.pseudo against_pseudo
    into pending_deal
    from public.igr_v47_prosecutor_cooperations c join public.igr_v4_players a on a.id=c.against_player_id
    where c.room_code=r.code and c.suspect_id=me.id and c.status='pending' order by c.id desc limit 1;
  end if;

  return jsonb_build_object(
    'version','v47','present',true,'role',me.public_role,'cycle',r.cycle,'phase',r.phase,
    'interview',case when current_i.id is null then null else jsonb_build_object('id',current_i.id,'target_id',current_i.target_id::text,'target',current_i.target_pseudo,'lawyer_id',current_i.lawyer_id::text,'lawyer',current_i.lawyer_pseudo,'status',current_i.status,'ends_at',current_i.ends_at) end,
    'cooperation',case when pending_deal.id is null then null else jsonb_build_object('id',pending_deal.id,'against_id',pending_deal.against_player_id::text,'against',pending_deal.against_pseudo,'note',pending_deal.note) end
  );
end
$$;

create or replace function public.igr_v47_prosecutor_summon(p_code text,p_player_token uuid,p_target uuid)
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
  if exists(select 1 from public.igr_v47_prosecutor_interviews i where i.room_code=r.code and i.prosecutor_id=me.id and i.target_id=t.id and i.cycle=r.cycle and i.status<>'cancelled') then raise exception 'target already interviewed this cycle'; end if;
  if t.public_role='suspect' then
    select x.lawyer_id,l.pseudo into lid,lp from public.igr_v43_lawyer_representations x join public.igr_v4_players l on l.id=x.lawyer_id where x.room_code=r.code and x.client_id=t.id limit 1;
    if lid is not null and not public.igr_v44_player_is_free(r.code,lid) then raise exception 'lawyer not free'; end if;
  end if;
  insert into public.igr_v47_prosecutor_interviews(room_code,prosecutor_id,target_id,lawyer_id,cycle)
  values(r.code,me.id,t.id,lid,r.cycle) returning id into sid;
  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(r.code,'prosecutor_summons','private',t.id,jsonb_build_object('title','CONVOCATION DU PROCUREUR','text','Le Procureur vous convoque pour un entretien de 2 minutes. Confirmez depuis l’application.'||case when lid is not null then ' Votre Avocat vous accompagne.' else '' end,'interview_id',sid));
  if lid is not null then
    insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
    values(r.code,'prosecutor_summons_lawyer','private',lid,jsonb_build_object('title','VOTRE CLIENT EST CONVOQUÉ','text',t.pseudo||' est convoqué par le Procureur. Vous devez l’accompagner pendant l’entretien.','interview_id',sid));
  end if;
  return jsonb_build_object('ok',true,'interview_id',sid,'target',t.pseudo,'lawyer_id',lid,'lawyer',lp);
end
$$;

create or replace function public.igr_v47_confirm_prosecutor_interview(p_code text,p_player_token uuid,p_interview bigint)
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
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into i from public.igr_v47_prosecutor_interviews where id=p_interview and room_code=me.room_code and target_id=me.id for update;
  if not found or i.status<>'pending' then raise exception 'interview unavailable'; end if;
  select * into r from public.igr_v4_rooms where code=me.room_code;
  if r.status<>'playing' or r.cycle<>i.cycle or r.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal') then raise exception 'interview expired'; end if;
  update public.igr_v47_prosecutor_interviews set status='active',confirmed_at=now(),started_at=now(),ends_at=now()+interval '2 minutes' where id=i.id;
  return jsonb_build_object('ok',true,'status','active','seconds',120);
end
$$;

create or replace function public.igr_v47_end_prosecutor_interview(p_code text,p_player_token uuid,p_interview bigint)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  i public.igr_v47_prosecutor_interviews%rowtype;
begin
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into i from public.igr_v47_prosecutor_interviews where id=p_interview and room_code=me.room_code for update;
  if not found or i.status<>'active' or not (me.id=i.prosecutor_id or me.id=i.target_id or me.id=i.lawyer_id) then raise exception 'interview unavailable'; end if;
  if not exists(select 1 from public.igr_v4_actions a where a.room_code=i.room_code and a.action_type='prosecutor_interview' and (a.payload->>'interview_id')::bigint=i.id) then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(i.room_code,i.prosecutor_id,i.cycle,'prosecutor_interview',jsonb_build_object('interview_id',i.id,'target',i.target_id,'lawyer_id',i.lawyer_id,'completed_by',me.id));
  end if;
  update public.igr_v47_prosecutor_interviews set status='completed',ended_at=now() where id=i.id;
  return jsonb_build_object('ok',true,'status','completed');
end
$$;

create or replace function public.igr_v47_offer_cooperation(p_code text,p_player_token uuid,p_suspect uuid,p_against uuid,p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  s public.igr_v4_players%rowtype;
  a public.igr_v4_players%rowtype;
  iid bigint;
  did bigint;
  note_text text;
begin
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'procureur' then raise exception 'forbidden'; end if;
  select * into r from public.igr_v4_rooms where code=me.room_code;
  select * into s from public.igr_v4_players where id=p_suspect and room_code=r.code and public_role='suspect';
  select * into a from public.igr_v4_players where id=p_against and room_code=r.code and public_role='suspect' and id<>s.id;
  if s.id is null or a.id is null then raise exception 'invalid suspects'; end if;
  select i.id into iid from public.igr_v47_prosecutor_interviews i where i.room_code=r.code and i.prosecutor_id=me.id and i.target_id=s.id and i.cycle=r.cycle and i.status='active' limit 1;
  if iid is null then raise exception 'cooperation only during active suspect interview'; end if;
  if exists(select 1 from public.igr_v47_prosecutor_cooperations c where c.room_code=r.code and c.prosecutor_id=me.id and c.suspect_id=s.id and c.status='pending') then raise exception 'cooperation already pending'; end if;
  note_text:=left(trim(coalesce(p_note,'')),180);
  if note_text<>'' then perform public.igr_private.assert_ugc(note_text,180,false); end if;
  insert into public.igr_v47_prosecutor_cooperations(room_code,prosecutor_id,suspect_id,against_player_id,interview_id,cycle,note)
  values(r.code,me.id,s.id,a.id,iid,r.cycle,note_text) returning id into did;
  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(r.code,'prosecutor_cooperation','private',s.id,jsonb_build_object('title','PROPOSITION DU PARQUET','text','Le Procureur vous propose de coopérer contre '||a.pseudo||'. Cet accord n’oblige jamais le Juge à suivre le Procureur.','cooperation_id',did,'against',a.pseudo));
  return jsonb_build_object('ok',true,'cooperation_id',did,'against',a.pseudo);
end
$$;

create or replace function public.igr_v47_respond_cooperation(p_code text,p_player_token uuid,p_cooperation bigint,p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  me public.igr_v4_players%rowtype;
  c public.igr_v47_prosecutor_cooperations%rowtype;
  a public.igr_v4_players%rowtype;
begin
  select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'suspect' then raise exception 'forbidden'; end if;
  select * into c from public.igr_v47_prosecutor_cooperations where id=p_cooperation and room_code=me.room_code and suspect_id=me.id for update;
  if not found or c.status<>'pending' then raise exception 'cooperation unavailable'; end if;
  update public.igr_v47_prosecutor_cooperations set status=case when p_accept then 'accepted' else 'refused' end,responded_at=now() where id=c.id;
  select * into a from public.igr_v4_players where id=c.against_player_id;
  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(c.room_code,'prosecutor_cooperation_response','private',c.prosecutor_id,jsonb_build_object('title',case when p_accept then 'COOPÉRATION ACCEPTÉE' else 'COOPÉRATION REFUSÉE' end,'text',me.pseudo||case when p_accept then ' accepte de coopérer contre '||a.pseudo||'.' else ' refuse votre proposition.' end));
  return jsonb_build_object('ok',true,'status',case when p_accept then 'accepted' else 'refused' end);
end
$$;

-- Un entretien terminé minimum par cycle. Le cycle 3 est contrôlé au passage vers la clôture.
create or replace function public.igr_v47_require_prosecutor_cycle_interview()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  p public.igr_v4_players%rowtype;
  n int;
  must_check boolean:=false;
begin
  if old.status<>'playing' then return new; end if;
  if old.cycle between 1 and 2 and new.cycle>old.cycle then must_check:=true; end if;
  if old.cycle=3 and old.phase not in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote','reveal')
     and new.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking') then must_check:=true; end if;
  if not must_check then return new; end if;
  perform public.igr_v47_tick_prosecutor(old.code);
  for p in select * from public.igr_v4_players where room_code=old.code and public_role='procureur' loop
    select count(*) into n from public.igr_v47_prosecutor_interviews i where i.room_code=old.code and i.prosecutor_id=p.id and i.cycle=old.cycle and i.status='completed';
    if n<1 then raise exception 'Procureur : au moins un entretien de 2 minutes doit être terminé au cycle % avant de continuer.',old.cycle; end if;
  end loop;
  return new;
end
$$;

drop trigger if exists igr_v47_require_prosecutor_cycle_interview on public.igr_v4_rooms;
create trigger igr_v47_require_prosecutor_cycle_interview
before update of cycle,phase,status on public.igr_v4_rooms
for each row execute function public.igr_v47_require_prosecutor_cycle_interview();

create or replace function public.igr_v47_make_reveal(p_room text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  base jsonb;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  truth_levels jsonb;
  enq public.igr_v4_players%rowtype;
  proc public.igr_v4_players%rowtype;
  judge public.igr_v4_players%rowtype;
  proc_rt public.igr_v47_prosecutor_runtime%rowtype;
  enq_levels jsonb:='{}'::jsonb;
  proc_levels jsonb:='{}'::jsonb;
  judge_levels jsonb:='{}'::jsonb;
  authority_levels jsonb:='{}'::jsonb;
  authority_role text:='enqueteur';
  responsibilities jsonb:='[]'::jsonb;
  results jsonb:='[]'::jsonb;
  winners jsonb:='[]'::jsonb;
  it jsonb;
  s public.igr_v4_players%rowtype;
  truth int;
  enql int;
  procl int;
  judgel int;
  authl int;
  total int:=0;
  camp_exact int:=0;
  proc_exact int:=0;
  corrupt_main boolean:=false;
  secondary_success boolean:=false;
  camp_axis boolean:=false;
  main_axis boolean:=false;
  score int:=0;
  target_truth int:=-1;
  target_proc int:=-1;
  target_auth int:=-1;
  target_name text;
begin
  base:=public.igr_v44_make_reveal(p_room);
  select * into r from public.igr_v4_rooms where code=p_room;
  select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
  truth_levels:=coalesce(pack->'truth'->'levels','[]'::jsonb);
  select * into enq from public.igr_v4_players where room_code=p_room and public_role='enqueteur' order by seat_index limit 1;
  select * into proc from public.igr_v4_players where room_code=p_room and public_role='procureur' order by seat_index limit 1;
  select * into judge from public.igr_v4_players where room_code=p_room and public_role='juge' order by seat_index limit 1;
  if enq.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into enq_levels from public.igr_v4_actions where room_code=p_room and player_id=enq.id and action_type='final_lock' order by id desc limit 1; enq_levels:=coalesce(enq_levels,'{}'::jsonb); end if;
  if proc.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into proc_levels from public.igr_v4_actions where room_code=p_room and player_id=proc.id and action_type='final_lock' order by id desc limit 1; proc_levels:=coalesce(proc_levels,'{}'::jsonb); perform public.igr_v47_ensure_prosecutor_runtime(p_room,proc.id); select * into proc_rt from public.igr_v47_prosecutor_runtime where room_code=p_room and prosecutor_id=proc.id; end if;
  if judge.id is not null then select coalesce(payload->'levels',payload,'{}'::jsonb) into judge_levels from public.igr_v4_actions where room_code=p_room and player_id=judge.id and action_type='final_lock' order by id desc limit 1; judge_levels:=coalesce(judge_levels,'{}'::jsonb); authority_levels:=judge_levels; authority_role:='juge';
  elsif proc.id is not null then authority_levels:=proc_levels; authority_role:='procureur';
  else authority_levels:=enq_levels; authority_role:='enqueteur'; end if;

  for s in select * from public.igr_v4_players where room_code=p_room and public_role='suspect' order by internal_slot loop
    truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
    enql:=coalesce((enq_levels->>s.id::text)::int,-1);
    procl:=coalesce((proc_levels->>s.id::text)::int,-1);
    judgel:=coalesce((judge_levels->>s.id::text)::int,-1);
    authl:=coalesce((authority_levels->>s.id::text)::int,-1);
    total:=total+1;
    if authl=truth then camp_exact:=camp_exact+1; end if;
    if proc.id is not null and procl=truth then proc_exact:=proc_exact+1; end if;
    responsibilities:=responsibilities||jsonb_build_array(jsonb_build_object(
      'player_id',s.id,'pseudo',s.pseudo,'truth_level',truth,'enqueteur_level',enql,
      'prosecutor_level',case when proc.id is null then null else procl end,
      'judge_level',case when judge.id is null then null else judgel end,
      'authority_level',authl,'authority_role',authority_role));
    if proc_rt.protected_target_id=s.id then target_truth:=truth;target_proc:=procl;target_auth:=authl;target_name:=s.pseudo; end if;
  end loop;

  for it in select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb)) loop
    if it->>'public_role' in ('enqueteur','analyste','procureur','juge','inspecteur','expert') then
      it:=jsonb_set(it,'{camp_success}',to_jsonb(camp_exact=total and total>0),true);
      it:=jsonb_set(it,'{camp_authority_role}',to_jsonb(authority_role),true);
    end if;
    if it->>'public_role'='procureur' and proc.id is not null then
      if proc_rt.corrupt then
        main_axis:=target_truth>=0 and target_proc>=0 and target_proc<target_truth;
        camp_axis:=target_truth>=0 and target_auth>=0 and target_auth<target_truth;
        select exists(
          select 1
          from public.igr_v47_prosecutor_cooperations c
          join public.igr_v4_players a on a.id=c.against_player_id
          where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted'
            and c.against_player_id<>proc_rt.protected_target_id
            and coalesce((authority_levels->>a.id::text)::int,-1) > coalesce((truth_levels->>(a.internal_slot-1))::int,0)
        ) into secondary_success;
        score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end);
        score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
        it:=jsonb_set(it,'{success}',to_jsonb(main_axis),true);
        it:=jsonb_set(it,'{text}',to_jsonb('Procureur corrompu · cible : '||coalesce(target_name,'inconnue')||' · protection personnelle '||case when main_axis then 'réussie' else 'échouée' end||' · influence sur la version d’autorité '||case when camp_axis then 'réussie' else 'échouée' end||'.'),true);
        it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis,'secondary',secondary_success,'camp_label','Intérêts corrompus'),true);
      else
        main_axis:=proc_exact=total and total>0;
        camp_axis:=camp_exact=total and total>0;
        select exists(
          select 1 from public.igr_v47_prosecutor_cooperations c
          join public.igr_v4_players a on a.id=c.against_player_id
          where c.room_code=p_room and c.prosecutor_id=proc.id and c.status='accepted'
            and coalesce((truth_levels->>(a.internal_slot-1))::int,0)>0
        ) into secondary_success;
        score:=(case when camp_axis then 1 else 0 end)+(case when main_axis then 1 else 0 end)+(case when secondary_success then 1 else 0 end);
        score:=case score when 3 then 100 when 2 then 67 when 1 then 33 else 0 end;
        it:=jsonb_set(it,'{success}',to_jsonb(main_axis),true);
        it:=jsonb_set(it,'{text}',to_jsonb(proc_exact||'/'||total||' responsabilités exactes dans ta version · camp décidé par '||authority_role||' · coopération utile '||case when secondary_success then 'réussie' else 'non obtenue' end||'.'),true);
        it:=jsonb_set(it,'{victories}',jsonb_build_object('camp',camp_axis,'main',main_axis,'secondary',secondary_success,'camp_label','Enquête'),true);
      end if;
      it:=jsonb_set(it,'{score_percent}',to_jsonb(score),true);
      it:=jsonb_set(it,'{corrupt}',to_jsonb(proc_rt.corrupt),true);
    end if;
    results:=results||jsonb_build_array(it);
    if coalesce((it->>'success')::boolean,false) then winners:=winners||jsonb_build_array((it->>'player_id')::uuid); end if;
  end loop;

  return base||jsonb_build_object(
    'responsibilities',responsibilities,'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),
    'camp_investigation',jsonb_build_object('authority_role',authority_role,'exact',camp_exact,'total',total,'success',camp_exact=total and total>0),
    'prosecutor_integrity',case when proc.id is null then null else jsonb_build_object('corrupt',proc_rt.corrupt,'protected_target_id',proc_rt.protected_target_id,'protected_target',target_name) end
  );
end
$$;

-- Le flux de révélation v44 utilise désormais le rendu v47.
create or replace function public.igr_v44_integrity_vote(p_code text,p_player_token uuid,p_corrupt boolean)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; req int; got int; reveal jsonb;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role not in ('enqueteur','analyste','procureur') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code for update; if r.phase<>'judge_integrity_vote' or not public.igr_v44_judge_present(r.code) then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='judge_integrity_vote') then raise exception 'already voted'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'judge_integrity_vote',jsonb_build_object('corrupt',p_corrupt));
 select count(*) into req from public.igr_v4_players where room_code=r.code and public_role in ('enqueteur','analyste','procureur'); select count(*) into got from public.igr_v4_actions where room_code=r.code and action_type='judge_integrity_vote';
 if got>=req then reveal:=public.igr_v47_make_reveal(r.code); update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; perform public.igr_v4_init_continuation(r.code,reveal); perform public.igr_v44_fix_continuation(r.code,reveal); insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal); end if;
 return jsonb_build_object('ok',true,'voted',got,'required',req,'revealed',got>=req);
end
$$;

-- Même hiérarchie lorsqu’aucun Juge n’est présent.
create or replace function public.igr_v4_lock_final(p_code text,p_player_token uuid,p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $$
declare p public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; req int; got int; reveal jsonb; s public.igr_v4_players%rowtype; lvl int; note_text text; consequence text; terror_decision text; begin
 perform igr_private.rate_limit('final_lock',p_player_token::text,12,60); select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or p.public_role not in ('enqueteur','analyste','procureur','juge','journaliste') then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=p.room_code for update; if r.phase<>'locking' then raise exception 'wrong phase'; end if; if octet_length(coalesce(p_payload,'{}'::jsonb)::text)>8192 then raise exception 'payload too large'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') then raise exception 'already locked'; end if; note_text:=left(trim(coalesce(p_payload->>'note','')),300); if note_text<>'' then perform igr_private.assert_ugc(note_text,300,false); end if; p_payload:=jsonb_set(coalesce(p_payload,'{}'::jsonb),'{note}',to_jsonb(note_text),true); if p.public_role<>'journaliste' then if jsonb_typeof(p_payload->'levels')<>'object' then raise exception 'invalid levels'; end if; for s in select * from public.igr_v4_players where room_code=r.code and public_role='suspect' loop if not (p_payload->'levels' ? s.id::text) then raise exception 'missing suspect'; end if; begin lvl:=(p_payload->'levels'->>s.id::text)::int; exception when others then raise exception 'invalid level'; end; if lvl<0 or lvl>3 then raise exception 'invalid level'; end if; end loop; if exists(select 1 from jsonb_object_keys(p_payload->'levels') k where not exists(select 1 from public.igr_v4_players s2 where s2.room_code=r.code and s2.public_role='suspect' and s2.id::text=k)) then raise exception 'unknown suspect'; end if; end if; if p.public_role='juge' then consequence:=left(trim(coalesce(p_payload->>'consequence','')),80); if consequence<>'' then perform igr_private.assert_ugc(consequence,80,false); end if; p_payload:=jsonb_set(p_payload,'{consequence}',to_jsonb(consequence),true); else p_payload:=p_payload-'consequence'; end if; insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'final_lock',p_payload); select count(*) into req from public.igr_v4_players where room_code=r.code and public_role in ('enqueteur','analyste','procureur','juge','journaliste'); select count(*) into got from public.igr_v4_actions where room_code=r.code and action_type='final_lock'; if got>=req then if public.igr_v44_judge_present(r.code) then update public.igr_v4_rooms set phase='judge_speech',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'phase',jsonb_build_object('title','DÉCISION FINALE DU JUGE','text','Le Juge annonce publiquement la responsabilité retenue pour chaque personne et justifie brièvement sa décision. Il termine son discours depuis l’application.')); else terror_decision:=nullif(r.state #>> '{terror_runtime,decision}',''); if r.scenario_id='027' and terror_decision is null then insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'terror_decision_required',jsonb_build_object('title','DÉCISION EXTÉRIEURE REQUISE','text','Les conclusions sont verrouillées. L’Officier de liaison doit transmettre la recommandation extérieure avant la révélation.')); else reveal:=case when r.scenario_id in ('021','022','023','024','025') then public.igr_omerta_make_reveal(r.code) else public.igr_v47_make_reveal(r.code) end; update public.igr_v4_rooms set status='finished',phase='reveal',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=r.code; perform public.igr_v4_init_continuation(r.code,reveal); perform public.igr_v44_fix_continuation(r.code,reveal); insert into public.igr_v4_events(room_code,event_type,payload) values(r.code,'reveal',reveal); end if; end if; end if; return jsonb_build_object('ok',true,'locked',got,'required',req,'waiting_judge_speech',got>=req and public.igr_v44_judge_present(r.code)); end
$$;

-- New v47 RPCs are public game endpoints authenticated by room + player_token.
revoke all on function public.igr_v47_ensure_prosecutor_runtime(text,uuid) from public,anon,authenticated;
revoke all on function public.igr_v47_tick_prosecutor(text) from public,anon,authenticated;
revoke all on function public.igr_v47_prosecutor_state(text,uuid) from public,anon,authenticated;
revoke all on function public.igr_v47_prosecutor_summon(text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.igr_v47_confirm_prosecutor_interview(text,uuid,bigint) from public,anon,authenticated;
revoke all on function public.igr_v47_end_prosecutor_interview(text,uuid,bigint) from public,anon,authenticated;
revoke all on function public.igr_v47_offer_cooperation(text,uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.igr_v47_respond_cooperation(text,uuid,bigint,boolean) from public,anon,authenticated;
revoke all on function public.igr_v47_make_reveal(text) from public,anon,authenticated;
grant execute on function public.igr_v47_prosecutor_state(text,uuid) to anon,service_role;
grant execute on function public.igr_v47_prosecutor_summon(text,uuid,uuid) to anon,service_role;
grant execute on function public.igr_v47_confirm_prosecutor_interview(text,uuid,bigint) to anon,service_role;
grant execute on function public.igr_v47_end_prosecutor_interview(text,uuid,bigint) to anon,service_role;
grant execute on function public.igr_v47_offer_cooperation(text,uuid,uuid,uuid,text) to anon,service_role;
grant execute on function public.igr_v47_respond_cooperation(text,uuid,bigint,boolean) to anon,service_role;
grant execute on function public.igr_v47_make_reveal(text) to service_role;
grant execute on function public.igr_v47_ensure_prosecutor_runtime(text,uuid) to service_role;
grant execute on function public.igr_v47_tick_prosecutor(text) to service_role;
