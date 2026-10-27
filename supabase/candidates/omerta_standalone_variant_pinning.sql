-- OMERTÀ: base privée d'un tirage A/B/C autonome à chaque partie.
-- CANDIDAT DE MIGRATION : ne pas exécuter en production sans tests de compatibilité.
-- Aucun texte du manuscrit n'est publié dans le dépôt ni dans les réponses client.
create table if not exists igr_private.igr_omerta_room_variant_snapshots (
 room_code text not null,
 match_no integer not null check(match_no > 0),
 scenario_id text not null check(scenario_id in ('021','022','023','024','025')),
 variant_id text not null check(variant_id in ('A','B','C')),
 manuscript jsonb not null,
 source_md5 text not null,
 pinned_at timestamptz not null default now(),
 primary key(room_code,match_no)
);
alter table igr_private.igr_omerta_room_variant_snapshots enable row level security;
revoke all on igr_private.igr_omerta_room_variant_snapshots from public,anon,authenticated;

-- Contrôle structurel en lecture seule, distinct de l'approbation éditoriale.
-- Vérifie les événements canon, les postes distincts et l'existence de deux
-- ancrages documentaires sans actions facultatives pour le cycle III.
create or replace function igr_private.igr_omerta_structural_preflight(
 p_scenario text
) returns boolean
language sql stable security definer set search_path=''
as $structure$
  select coalesce(
    count(*)=3 and
    count(distinct m.variant_id)=3 and
    bool_and(
      jsonb_typeof(m.manuscript->'private_cards')='array'
      and jsonb_array_length(coalesce(m.manuscript->'private_cards','[]'::jsonb)) between 3 and 9
      and (select count(distinct p->>'slot')
        from jsonb_array_elements(coalesce(m.manuscript->'private_cards','[]'::jsonb)) p)
        =jsonb_array_length(coalesce(m.manuscript->'private_cards','[]'::jsonb))
      and not exists (
         select 1 from jsonb_array_elements(coalesce(m.manuscript->'revelations','[]'::jsonb)) e
         where not exists(
           select 1 from jsonb_array_elements(
             coalesce(m.manuscript->'canonical_truth'->'timeline','[]'::jsonb)) t
           where t->>'id'=e->>'canonical_event_id'
         )
      )
      and (select count(*) from jsonb_array_elements(
           coalesce(m.manuscript->'revelations','[]'::jsonb)) e
         where e->>'kind'='guaranteed' and e->>'min_cycle'='3'
          and nullif(e->'editorial_provenance'->>'source_material','') is not null
          and e->'editorial_provenance'->>'independent_of_optional_actions'='true'
          and jsonb_array_length(coalesce(
            e->'editorial_provenance'->'existing_events','[]'::jsonb))>=2
          and (select count(distinct existing.value) from jsonb_array_elements_text(
             coalesce(e->'editorial_provenance'->'existing_events','[]'::jsonb)) existing)>=2
          and not exists(
            select 1 from jsonb_array_elements_text(
              coalesce(e->'editorial_provenance'->'existing_events','[]'::jsonb)) existing
            where not exists(
              select 1 from jsonb_array_elements(
                coalesce(m.manuscript->'canonical_truth'->'timeline','[]'::jsonb)) t
              where t->>'id'=existing.value
            )
          )
      ) >= 1
    ),false)
  from igr_private.igr_v99_variant_manuscripts m
  where m.scenario_id=p_scenario and m.variant_id in ('A','B','C');
$structure$;
revoke all on function igr_private.igr_omerta_structural_preflight(text)
 from public,anon,authenticated;

-- Appel serveur interne UNIQUEMENT ; le client ne peut ni choisir sa lettre,
-- ni lire une variante. Un nouveau match est épinglé indépendamment des précédents.
create or replace function igr_private.igr_omerta_pin_standalone_room_variant(
 p_room_code text
) returns text
language plpgsql security definer set search_path=''
as $pin$
declare
 room public.igr_v4_rooms%rowtype;
 match_id integer;
 present igr_private.igr_omerta_room_variant_snapshots%rowtype;
 picked igr_private.igr_v99_variant_manuscripts%rowtype;
begin
 select * into room from public.igr_v4_rooms
 where code=upper(trim(p_room_code)) for update;
 if not found then raise exception 'omerta_room_missing'; end if;
 if room.scenario_id not in ('021','022','023','024','025') then
   raise exception 'omerta_invalid_scenario'; end if;
 if room.status not in ('lobby','playing') then
   raise exception 'omerta_pinning_closed'; end if;

 match_id:=greatest(1,coalesce((room.state->>'match_no')::int,1));
 select * into present
 from igr_private.igr_omerta_room_variant_snapshots x
 where x.room_code=room.code and x.match_no=match_id;
 if found then
   if present.scenario_id<>room.scenario_id then
      raise exception 'omerta_scenario_changed_mid_match'; end if;
   return present.variant_id;
 end if;

 -- Bloquer une variante dont l'auteur/provenance C3 n'a pas été certifié.
 -- Évaluation par épisode : les cinq enquêtes doivent rester indépendantes.
 if coalesce((igr_private.igr_v100_preflight(room.scenario_id)->>'release_eligible')::boolean,false)
    is not true or igr_private.igr_omerta_structural_preflight(room.scenario_id) is not true
    then return null; end if;

 select * into picked
 from igr_private.igr_v99_variant_manuscripts m
 where m.scenario_id=room.scenario_id
   and m.variant_id in ('A','B','C')
   and m.editorial_status='ready'
   and m.approved_by is not null and m.approved_at is not null
   and m.manuscript->>'status'='ready'
   and m.manuscript->>'human_review_approved'='true'
   -- Lorsqu'il y a une alternative approuvée, éviter de rejouer la même lettre.
   and (not exists(
     select 1 from igr_private.igr_omerta_room_variant_snapshots prev
     where prev.room_code=room.code and prev.match_no<match_id
   ) or m.variant_id is distinct from (
     select prev.variant_id
     from igr_private.igr_omerta_room_variant_snapshots prev
     where prev.room_code=room.code and prev.match_no<match_id
     order by prev.match_no desc limit 1
   ))
 order by pg_catalog.random() limit 1;

 if not found then raise exception 'omerta_no_approved_variant'; end if;
 insert into igr_private.igr_omerta_room_variant_snapshots(
   room_code,match_no,scenario_id,variant_id,manuscript,source_md5)
 values(room.code,match_id,room.scenario_id,picked.variant_id,picked.manuscript,
   coalesce(picked.content_md5,md5(picked.manuscript::text)));
 return picked.variant_id;
end;
$pin$;
revoke all on function igr_private.igr_omerta_pin_standalone_room_variant(text)
 from public,anon,authenticated;

-- Snapshot immuable : une correction éditoriale ultérieure ne doit jamais
-- modifier les preuves, les objectifs ou les rôles d'une partie déjà lancée.
create or replace function igr_private.igr_omerta_standalone_snapshot(
 p_room_code text, p_match_no integer
) returns jsonb
language sql security definer set search_path=''
as $read$
  select x.manuscript
  from igr_private.igr_omerta_room_variant_snapshots x
  where x.room_code=upper(trim(p_room_code))
    and x.match_no=p_match_no;
$read$;
revoke all on function igr_private.igr_omerta_standalone_snapshot(text,integer)
 from public,anon,authenticated;

-- Ne jamais exposer un endpoint qui renvoie un manuscrit complet.
-- Les futurs lecteurs serveur de fiches seront responsables de filtrer par
-- token de joueur, par rôle, par slot, par cycle et par salle.

-- Lecteur du dossier individuel. Accessible par jeton de salle, mais ne
-- délivre JAMAIS le manuscrit entier ni les fiches d'autres personnages.
create or replace function public.igr_omerta_my_private_dossier(
 p_code text, p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $mine$
declare
 p public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 m jsonb;
 card jsonb;
 match_id integer;
begin
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 if not found or r.scenario_id not in ('021','022','023','024','025')
   or r.status not in ('playing','finished')
   or r.phase='briefing' or p.public_role<>'suspect' or p.internal_slot is null
 then return jsonb_build_object('available',false); end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select x.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots x
 where x.room_code=r.code and x.match_no=match_id
   and x.scenario_id=r.scenario_id;
 if m is null then return jsonb_build_object('available',false); end if;
 -- Ne jamais réutiliser un slot historique après un rematch. Le tirage
 -- confirmé du même joueur dans le match courant fait autorité.
 if not exists(
   select 1 from igr_private.igr_omerta_room_cast_slots c
   where c.room_code=r.code and c.match_no=match_id
     and c.player_id=p.id and c.internal_slot=p.internal_slot
 ) then return jsonb_build_object('available',false); end if;
 select value into card
 from pg_catalog.jsonb_array_elements(coalesce(m->'private_cards','[]'::jsonb)) value
 where value->>'slot'=p.internal_slot::text limit 1;
 if card is null then raise exception 'omerta_private_slot_missing'; end if;
 -- Explicit allowlist: stray editorial fields cannot become client secrets.
 return jsonb_build_object('available',true,'card',jsonb_build_object(
   'identity',card->'identity',
   'objective',card->'objective',
   'what_you_know',card->'what_you_know',
   'what_you_hide',card->'what_you_hide',
   'your_chronology',card->'your_chronology',
   'conversation_hooks',card->'conversation_hooks'
 ));
end;
$mine$;
revoke all on function public.igr_omerta_my_private_dossier(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_my_private_dossier(text,uuid)
 to anon,authenticated;

-- Recoupement C3 sûr : le texte livré est UNIQUEMENT la révélation
-- éditoriale destinée à l'Enquête, jamais la chronologie omnisciente du canon.
-- Les 2 références restent distinctes et vérifiées par le contrôle structurel.
-- Le véritable archivage/affichage par le client reste à intégrer.
create or replace function igr_private.igr_omerta_emit_c3_crosschecks(
 p_room_code text
) returns integer
language plpgsql security definer set search_path=''
as $emit$
declare
 r public.igr_v4_rooms%rowtype;
 m jsonb;
 match_id int;
 item jsonb;
 recipient record;
 added int:=0;
 source_ids jsonb;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room_code)) for update;
 if not found or r.scenario_id not in ('021','022','023','024','025')
   or r.status<>'playing' or r.cycle<>3 then return 0; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select x.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots x
 where x.room_code=r.code and x.match_no=match_id
   and x.scenario_id=r.scenario_id;
 if m is null then return 0; end if;
 for item in
   select v.value from pg_catalog.jsonb_array_elements(
      coalesce(m->'revelations','[]'::jsonb)) v(value)
   where v.value->>'kind'='guaranteed' and v.value->>'min_cycle'='3'
      and v.value->>'audience'='investigation'
      and v.value->'editorial_provenance'->>'human_source_review'='verified'
      and v.value->'editorial_provenance'->>'independent_of_optional_actions'='true'
 loop
   source_ids:=item->'editorial_provenance'->'existing_events';
   if nullif(item->>'text','') is null
     or jsonb_array_length(coalesce(source_ids,'[]'::jsonb))<2
     or (select count(distinct e.value) from pg_catalog.jsonb_array_elements_text(
        source_ids) e(value))<2
   then raise exception 'omerta_crosscheck_not_authored'; end if;
   for recipient in
     select p.id from public.igr_v4_players p
     where p.room_code=r.code and p.public_role in ('enqueteur','analyste')
   loop
     if not exists(
       select 1 from public.igr_v4_events e
       where e.room_code=r.code and e.event_type='omerta_c3_crosscheck'
         and e.target_player_id=recipient.id and e.visibility='private'
         and coalesce((e.payload->>'match_no')::int,-1)=match_id
         and e.payload->>'revelation_id'=item->>'id'
     ) then
       insert into public.igr_v4_events(
         room_code,cycle,event_type,visibility,target_player_id,payload)
       values(r.code,r.cycle,'omerta_c3_crosscheck','private',recipient.id,
         jsonb_build_object(
           'title',item->>'title','text',item->>'text',
           'revelation_id',item->>'id',
           'source_event_ids',source_ids,
           'document_category','recoupement_documentaire',
           'match_no',match_id));
       added:=added+1;
     end if;
   end loop;
 end loop;
 return added;
end;
$emit$;
revoke all on function igr_private.igr_omerta_emit_c3_crosschecks(text)
 from public,anon,authenticated;

-- Postes attribués une seule fois par salle ET par match.
-- Ce composant reste privé et doit être appelé au démarrage dans un contrat
-- vérifié ; ne jamais l'appeler directement depuis le navigateur.
create table if not exists igr_private.igr_omerta_room_cast_slots (
  room_code text not null,
  match_no integer not null check(match_no>0),
  player_id uuid not null,
  internal_slot integer not null check(internal_slot>0),
  created_at timestamptz not null default now(),
  primary key(room_code,match_no,player_id),
  unique(room_code,match_no,internal_slot)
);
alter table igr_private.igr_omerta_room_cast_slots enable row level security;
revoke all on igr_private.igr_omerta_room_cast_slots from public,anon,authenticated;

create or replace function igr_private.igr_omerta_cast_standalone_room(
 p_room_code text
) returns integer
language plpgsql security definer set search_path=''
as $cast$
declare
 r public.igr_v4_rooms%rowtype;
 m jsonb;
 match_id int;
 total_players int;
 investigator_count int;
 suspects_count int;
 already_cast int;
 mafia_player record;
 entry jsonb;
 chosen_slot int;
 selected_slots int[]:=array[]::int[];
 n int:=0;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_room_code)) for update;
 if not found or r.scenario_id not in ('021','022','023','024','025')
   or r.status<>'playing' or r.cycle<>0 or r.phase<>'briefing'
 then raise exception 'omerta_cast_wrong_phase'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=r.code and s.match_no=match_id
  and s.scenario_id=r.scenario_id;
 if m is null then raise exception 'omerta_cast_missing_pinned_variant'; end if;

 select count(*),
   count(*) filter(where public_role='enqueteur'),
   count(*) filter(where public_role='suspect')
 into total_players,investigator_count,suspects_count
 from public.igr_v4_players
 where room_code=r.code;
 if total_players not between 4 and 8 or investigator_count<>1
   or suspects_count=0 or
   total_players<>(investigator_count+suspects_count+
     (select count(*) from public.igr_v4_players
      where room_code=r.code and public_role='analyste'))
 then raise exception 'omerta_invalid_cast'; end if;
 if suspects_count>jsonb_array_length(coalesce(m->'private_cards','[]'::jsonb))
 then raise exception 'omerta_insufficient_distinct_roles'; end if;

 select count(*) into already_cast
 from igr_private.igr_omerta_room_cast_slots x
 where x.room_code=r.code and x.match_no=match_id;
 if already_cast>0 then
   if already_cast<>suspects_count or exists(
     select 1 from igr_private.igr_omerta_room_cast_slots x
     left join public.igr_v4_players member
       on member.id=x.player_id and member.room_code=x.room_code
       and member.public_role='suspect'
     where x.room_code=r.code and x.match_no=match_id and member.id is null
   ) then raise exception 'omerta_cast_changed_during_match'; end if;
   return already_cast;
 end if;

 for mafia_player in
   select id from public.igr_v4_players
   where room_code=r.code and public_role='suspect'
   order by pg_catalog.random()
 loop
   select s.value,(s.value->>'slot')::int
   into entry,chosen_slot
   from pg_catalog.jsonb_array_elements(
     coalesce(m->'private_cards','[]'::jsonb)) s(value)
   where (s.value->>'slot')::int<>all(selected_slots)
   order by pg_catalog.random() limit 1;
   if entry is null or chosen_slot is null
   then raise exception 'omerta_insufficient_distinct_roles'; end if;
   insert into igr_private.igr_omerta_room_cast_slots(
     room_code,match_no,player_id,internal_slot)
   values(r.code,match_id,mafia_player.id,chosen_slot);
   selected_slots:=pg_catalog.array_append(selected_slots,chosen_slot);
   update public.igr_v4_players
   set internal_slot=chosen_slot,
     private_state=jsonb_build_object(
       'identity',entry->'identity',
       'objective',entry->'objective',
       'position',entry->'objective',
       'what_you_know',entry->'what_you_know',
       'what_you_hide',entry->'what_you_hide',
       'hide',entry->'what_you_hide',
       'your_chronology',entry->'your_chronology',
       'chronology',entry->'your_chronology',
       'conversation_hooks',entry->'conversation_hooks'
     )
   where id=mafia_player.id and room_code=r.code;
   n:=n+1;
 end loop;
 return n;
end;
$cast$;
revoke all on function igr_private.igr_omerta_cast_standalone_room(text)
 from public,anon,authenticated;

-- Même pour un hôte, le seul contexte ouvert est le public_briefing
-- de la variante de cette partie : jamais canonical_truth ni final_reveal.
create or replace function public.igr_omerta_public_briefing(
 p_code text,p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $intro$
declare
 p public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 m jsonb;
begin
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 if not found or r.scenario_id not in ('021','022','023','024','025')
    or r.status<>'playing'
 then return jsonb_build_object('available',false); end if;
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=r.code and s.scenario_id=r.scenario_id
    and s.match_no=greatest(1,coalesce((r.state->>'match_no')::int,1));
 if m is null then return jsonb_build_object('available',false); end if;
 return jsonb_build_object('available',true,'text',m->>'public_briefing');
end;
$intro$;
revoke all on function public.igr_omerta_public_briefing(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_public_briefing(text,uuid)
 to anon,authenticated;

-- Hook de transition C2 -> C3. Aucun RPC joueur ni appel de frontend requis.
-- Quand il n'y a PAS de snapshot Santoro, le trigger est un no-op strict :
-- aucune incidence sur les anciennes parties OMERTÀ et les autres DLC.
create or replace function igr_private.igr_omerta_c3_on_cycle_transition()
returns trigger
language plpgsql security definer set search_path=''
as $cycle$
declare
 current_match integer;
begin
 if new.scenario_id not in ('021','022','023','024','025')
    or new.status<>'playing' or new.cycle<>3
    or old.cycle is not distinct from new.cycle then
   return new;
 end if;
 current_match:=greatest(1,coalesce((new.state->>'match_no')::int,1));
 if exists(
   select 1 from igr_private.igr_omerta_room_variant_snapshots s
   where s.room_code=new.code and s.match_no=current_match
     and s.scenario_id=new.scenario_id
 ) then
   perform igr_private.igr_omerta_emit_c3_crosschecks(new.code);
 end if;
 return new;
end;
$cycle$;
revoke all on function igr_private.igr_omerta_c3_on_cycle_transition()
 from public,anon,authenticated;
drop trigger if exists igr_omerta_standalone_c3_auto on public.igr_v4_rooms;
create trigger igr_omerta_standalone_c3_auto
after update of cycle on public.igr_v4_rooms
for each row
when (new.cycle=3 and old.cycle is distinct from new.cycle)
execute function igr_private.igr_omerta_c3_on_cycle_transition();


-- Conclusion consultable par les participants uniquement APRÈS fermeture.
-- Le niveau 0–2 indique une implication narrative rédigée par l'auteur,
-- JAMAIS un jugement pénal automatique ou une condition de victoire.
create or replace function public.igr_omerta_standalone_closure(
 p_code text,p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $closure$
declare
 p public.igr_v4_players%rowtype;
 r public.igr_v4_rooms%rowtype;
 m jsonb;
 match_id integer;
 n_suspects integer;
 n_mapped integer;
 summary jsonb;
begin
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 if not found or r.scenario_id not in ('021','022','023','024','025')
   or r.status<>'finished'
 then return jsonb_build_object('available',false); end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=r.code and s.match_no=match_id
   and s.scenario_id=r.scenario_id;
 if m is null or nullif(m->>'final_reveal','') is null
 then return jsonb_build_object('available',false); end if;
 select count(*) into n_suspects from public.igr_v4_players
 where room_code=r.code and public_role='suspect';
 select count(*),coalesce(jsonb_agg(jsonb_build_object(
    'player_id',player.id,
    'pseudo',player.pseudo,
    'editorial_involvement_level',
     (m->'canonical_truth'->'responsibility_by_slot'->>(role_slot.internal_slot::text))::integer
    ) order by player.seat_index),'[]'::jsonb)
 into n_mapped,summary
 from igr_private.igr_omerta_room_cast_slots role_slot
 join public.igr_v4_players player on player.id=role_slot.player_id
   and player.room_code=role_slot.room_code and player.public_role='suspect'
 where role_slot.room_code=r.code and role_slot.match_no=match_id
   and role_slot.internal_slot=player.internal_slot
   and (m->'canonical_truth'->'responsibility_by_slot'->>(role_slot.internal_slot::text))
       ~ '^[012]$';
 if n_mapped<>n_suspects or n_suspects=0
 then return jsonb_build_object('available',false); end if;
 return jsonb_build_object(
   'available',true,
   'story',m->>'final_reveal',
   'involvement_levels_are_not_sentences_or_win_conditions',true,
   'characters',summary
 );
end;
$closure$;
revoke all on function public.igr_omerta_standalone_closure(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_standalone_closure(text,uuid)
 to anon,authenticated;
