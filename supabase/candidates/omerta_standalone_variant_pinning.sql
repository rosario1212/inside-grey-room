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

-- Les nouveaux manuscrits Santoro restent isolés des anciens Verri.
-- Table de préparation PRIVÉE : les 15 récits ne doivent jamais figurer
-- dans les migrations GitHub, ni dans public.igr_v4_scenario_packs.
create table if not exists igr_private.igr_omerta_santoro_v25_drafts(
 scenario_id text not null check(scenario_id in ('021','022','023','024','025')),
 variant_id text not null check(variant_id in ('A','B','C')),
 manuscript jsonb not null,
 editorial_status text not null default 'review'
  check(editorial_status in ('review','ready','rejected')),
 approved_by text,
 approved_at timestamptz,
 content_md5 text,
 staged_at timestamptz not null default now(),
 primary key(scenario_id,variant_id),
 check((editorial_status='ready')=(approved_by is not null and approved_at is not null))
);
alter table igr_private.igr_omerta_santoro_v25_drafts enable row level security;
revoke all on igr_private.igr_omerta_santoro_v25_drafts
 from public,anon,authenticated;

-- Source unifiée: les vraies variantes Santoro privées ont priorité.
-- Sur les anciennes installations/tests, le fallback V99 ne sert que si
-- des brouillons explicitement marqués Santoro existent déjà.
create or replace view igr_private.igr_omerta_standalone_manuscripts
with (security_invoker=false) as
 select d.scenario_id,d.variant_id,d.manuscript,
  d.editorial_status,d.approved_by,d.approved_at,d.content_md5
 from igr_private.igr_omerta_santoro_v25_drafts d
 union all
 select old.scenario_id,old.variant_id,old.manuscript,
  old.editorial_status,old.approved_by,old.approved_at,old.content_md5
 from igr_private.igr_v99_variant_manuscripts old
 where old.manuscript->'saga'->>'family'='SANTORO'
   and not exists(
    select 1 from igr_private.igr_omerta_santoro_v25_drafts d
    where d.scenario_id=old.scenario_id
   );
revoke all on igr_private.igr_omerta_standalone_manuscripts
 from public,anon,authenticated;

-- Ne jamais confondre un ancien préflight Verri avec les nouveaux
-- brouillons Santoro : vérification éditoriale indépendante.
create or replace function igr_private.igr_omerta_editorial_preflight(
 p_scenario text
) returns boolean
language plpgsql stable security definer set search_path=''
as $editorial$
declare n integer; ok integer; truths integer;
begin
 select count(*),
   count(*) filter(where editorial_status='ready'
      and approved_by is not null and approved_at is not null
      and manuscript->>'status'='ready'
      and manuscript->>'human_review_approved'='true'
      and manuscript->>'verdict_scoring_review'='approved'
      and exists(
       select 1 from pg_catalog.jsonb_array_elements(
         coalesce(manuscript->'revelations','[]'::jsonb)) r
       where r->>'kind'='guaranteed' and r->>'min_cycle'='3'
          and r->'editorial_provenance'->>'human_source_review'='verified'
      )),
   count(distinct manuscript->'canonical_truth'->'truth_by_axis')
 into n,ok,truths
 from igr_private.igr_omerta_santoro_v25_drafts
 where scenario_id=p_scenario;
 if n>0 then return n=3 and ok=3 and truths=3; end if;
 return coalesce((igr_private.igr_v100_preflight(p_scenario)
   ->>'release_eligible')::boolean,false);
end;
$editorial$;
revoke all on function igr_private.igr_omerta_editorial_preflight(text)
 from public,anon,authenticated;

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
      -- Canon éditorial explicite: empêcher le mélange du vieux récit Verri
      -- avec l'arc Santoro tant que celui-ci n'est pas intégralement authored.
      and m.manuscript->'saga'->>'family'='SANTORO'
      and nullif(trim(m.manuscript->>'public_briefing'),'') is not null
      and nullif(trim(m.manuscript->>'final_reveal'),'') is not null
      and not exists (
        select 1 from jsonb_array_elements(
          coalesce(m.manuscript->'private_cards','[]'::jsonb)) card
        where nullif(trim(card->>'identity'),'') is null
           or nullif(trim(card->>'objective'),'') is null
           or nullif(trim(card->>'what_you_know'),'') is null
           or case when m.manuscript->>'private_format'='santoro_v25'
               and exists(select 1 from igr_private.igr_omerta_santoro_v25_drafts d
                 where d.scenario_id=m.scenario_id and d.variant_id=m.variant_id)
              then coalesce(
                m.manuscript->'canonical_truth'->'verdict_goal_by_slot'
                  ->(card->>'slot')->>'mode'
                is distinct from 'avoid_formal_designation',true)
              else coalesce(
                (m.manuscript->'canonical_truth'->'responsibility_by_slot'
                  ->>(card->>'slot')) not in ('0','1','2'),true)
             end
      )
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
  from igr_private.igr_omerta_standalone_manuscripts m
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
 picked record;
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
 if igr_private.igr_omerta_editorial_preflight(room.scenario_id) is not true
    or igr_private.igr_omerta_structural_preflight(room.scenario_id) is not true
    then return null; end if;

 select * into picked
 from igr_private.igr_omerta_standalone_manuscripts m
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
 fixed_slot int;
 has_pentito boolean;
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
   -- Reconnexion: vérifier aussi que le numéro du personnage reste identique.
   if already_cast<>suspects_count or exists(
     select 1 from igr_private.igr_omerta_room_cast_slots x
     left join public.igr_v4_players member
       on member.id=x.player_id and member.room_code=x.room_code
       and member.public_role='suspect'
     where x.room_code=r.code and x.match_no=match_id and (member.id is null or member.internal_slot<>x.internal_slot)
   ) then raise exception 'omerta_cast_changed_during_match'; end if;
   return already_cast;
 end if;

 select exists(
   select 1 from public.igr_v4_players
   where room_code=r.code and preferred_role='pentito'
 ) into has_pentito;
 -- Rangs nommés conservés selon le schéma canon du moteur hérité.
 -- Seuls les rôles génériques reçoivent une identité encore disponible.
 for mafia_player in
   select id,preferred_role,private_state from public.igr_v4_players
   where room_code=r.code and public_role='suspect'
   order by case preferred_role
     when 'pentito' then 1 when 'associato' then 2
     when 'caporegime' then 3 when 'consigliere' then 4
     when 'sottocapo' then 5 when 'uomo_onore' then 6
     when 'contabile' then 7 when 'don' then 8 else 99 end,seat_index
 loop
   fixed_slot:=case mafia_player.preferred_role
     when 'pentito' then 1
     when 'associato' then case
       when has_pentito and r.scenario_id in ('024','025') then 8 else 1 end
     when 'caporegime' then 2 when 'consigliere' then 3
     when 'sottocapo' then 4 when 'uomo_onore' then 6
     when 'contabile' then 7 when 'don' then 9 else null end;
   entry:=null;
   chosen_slot:=null;
   -- Les nouveaux manuscrits Santoro ont deux Associati et deux Soldati.
   -- Les numéros des places ne sont PAS les anciens rangs Verri :
   -- chercher le rang réel dans la carte, jamais le slot hérité.
   if m->>'private_format'='santoro_v25' then
      fixed_slot:=null;
   end if;
   if m->>'private_format'='santoro_v25'
     and mafia_player.preferred_role is not null
     and mafia_player.preferred_role<>'suspect' then
     select e.value,(e.value->>'slot')::int into entry,chosen_slot
     from pg_catalog.jsonb_array_elements(m->'private_cards') e(value)
     where e.value->>'rank_code'=mafia_player.preferred_role
       and (e.value->>'slot')::int<>all(selected_slots)
     order by pg_catalog.random() limit 1;
     if chosen_slot is null then
       raise exception 'omerta_santoro_rank_unavailable';end if;
   elsif fixed_slot is not null then
     select e.value,(e.value->>'slot')::int into entry,chosen_slot
     from pg_catalog.jsonb_array_elements(m->'private_cards') e(value)
     where (e.value->>'slot')::int=fixed_slot
       and fixed_slot<>all(selected_slots)
     limit 1;
     if chosen_slot is null then
       raise exception 'omerta_rank_cannot_match_canonical_identity'; end if;
   else
     select e.value,(e.value->>'slot')::int into entry,chosen_slot
     from pg_catalog.jsonb_array_elements(
       coalesce(m->'private_cards','[]'::jsonb)) e(value)
     where (e.value->>'slot')::int<>all(selected_slots)
     order by pg_catalog.random() limit 1;
   end if;
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
       'position',entry->'identity',
       'what_you_know',entry->'what_you_know',
       'what_you_hide',entry->'what_you_hide',
       'hide',entry->'what_you_hide',
       'your_chronology',entry->'your_chronology',
       'chronology',entry->'your_chronology',
       'conversation_hooks',entry->'conversation_hooks',
       'omerta_preferred_role',mafia_player.preferred_role,
       'omerta_player_identity',
         (select pseudo from public.igr_v4_players
          where id=mafia_player.id)
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
     case when m->>'private_format'='santoro_v25' then null
       else (m->'canonical_truth'->'responsibility_by_slot'
         ->>(role_slot.internal_slot::text))::integer end,
    'personal_goal',
      m->'canonical_truth'->'verdict_goal_by_slot'
       ->(role_slot.internal_slot::text)->>'description',
    'personal_goal_scoring_status',
      case when m->>'private_format'='santoro_v25'
         then 'awaiting_formal_designation_verdict'
         else 'legacy_canon' end
    ) order by player.seat_index),'[]'::jsonb)
 into n_mapped,summary
 from igr_private.igr_omerta_room_cast_slots role_slot
 join public.igr_v4_players player on player.id=role_slot.player_id
   and player.room_code=role_slot.room_code and player.public_role='suspect'
 where role_slot.room_code=r.code and role_slot.match_no=match_id
   and role_slot.internal_slot=player.internal_slot
   and (
     (m->>'private_format'='santoro_v25' and
       m->'canonical_truth'->'verdict_goal_by_slot'
        ->(role_slot.internal_slot::text)->>'mode'
        ='avoid_formal_designation')
     or (coalesce(m->>'private_format','')<>'santoro_v25'
       and (m->'canonical_truth'->'responsibility_by_slot'
           ->>(role_slot.internal_slot::text)) ~ '^[012]
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


-- Interrupteur privé de publication : FALSE par défaut.
-- Ni le client ni l'hôte ne peuvent lever le verrou éditorial.
create table if not exists igr_private.igr_omerta_standalone_release_control(
  id integer primary key check(id=1),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table igr_private.igr_omerta_standalone_release_control enable row level security;
revoke all on igr_private.igr_omerta_standalone_release_control from public,anon,authenticated;
insert into igr_private.igr_omerta_standalone_release_control(id,enabled)
values(1,false) on conflict(id) do nothing;

create or replace function igr_private.igr_omerta_standalone_can_start(
 p_scenario text
) returns boolean
language sql stable security definer set search_path=''
as $can$
  select coalesce(
    (select c.enabled from igr_private.igr_omerta_standalone_release_control c
       where c.id=1),false)
  and coalesce(igr_private.igr_omerta_editorial_preflight(p_scenario),false)
  and coalesce(igr_private.igr_omerta_structural_preflight(p_scenario),false);
$can$;
revoke all on function igr_private.igr_omerta_standalone_can_start(text)
 from public,anon,authenticated;

-- Statut public NON narratif, uniquement après contrôle du jeton d'hôte.
-- N'expose ni la lettre, ni les fiches, ni la vérité des variantes.
create or replace function public.igr_omerta_standalone_release_status(
 p_code text, p_host_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $availability$
declare r public.igr_v4_rooms%rowtype;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_code)) and host_token=p_host_token;
 if not found then raise exception 'unauthorized';end if;
 return jsonb_build_object('available',
  r.status='lobby'
   and r.scenario_id in ('021','022','023','024','025')
   and igr_private.igr_omerta_standalone_can_start(r.scenario_id));
end;
$availability$;
revoke all on function public.igr_omerta_standalone_release_status(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_standalone_release_status(text,uuid)
 to anon,authenticated;

-- Démarrage contrôlé A/B/C. API séparée de l'ancien démarrage pour conserver
-- une compatibilité stricte avec les salons historiques. Tant que les A/B/C
-- restent non approuvés, ce RPC refuse la partie AVANT de muter la salle.
-- Ce composant nécessite encore un client conscient des variantes.
create or replace function public.igr_omerta_start_standalone(
 p_code text, p_host_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $standalone_start$
declare
 r public.igr_v4_rooms%rowtype;
 manuscript jsonb;
 variant text;
 started jsonb;
 n integer;
 match_id integer;
 previous_event_id bigint;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_code)) and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if;
 if r.scenario_id not in ('021','022','023','024','025')
    or r.status<>'lobby' then raise exception 'standalone_not_in_lobby'; end if;
 -- Check both editorial and structural invariants before any side effects.
 if igr_private.igr_omerta_standalone_can_start(r.scenario_id) is not true
 then raise exception 'standalone_variant_not_released'; end if;
 variant:=igr_private.igr_omerta_pin_standalone_room_variant(r.code);
 if variant is null then raise exception 'standalone_variant_not_approved'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 select s.manuscript into manuscript
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=r.code and s.match_no=match_id
   and s.scenario_id=r.scenario_id;
 if manuscript is null then raise exception 'standalone_snapshot_missing'; end if;

 -- Only remove PUBLIC context events emitted by this new start.
 -- Historical event logs from earlier matches must be preserved.
 select coalesce(max(e.id),0) into previous_event_id
 from public.igr_v4_events e where e.room_code=r.code;
 -- Keep the established host check, role selection and room start behaviour.
 -- Any failure rolls the new snapshot back in the SAME transaction.
 started:=public.igr_omerta_start_game(r.code,p_host_token);
 if coalesce((started->>'ok')::boolean,false) is not true
 then raise exception 'omerta_legacy_start_failed'; end if;

 n:=igr_private.igr_omerta_cast_standalone_room(r.code);
 if n<1 then raise exception 'standalone_no_assigned_characters'; end if;

 -- Remove only stale public context from the legacy start. The fresh public
 -- context never contains the canonical answer or any private character card.
 delete from public.igr_v4_events e
 where e.room_code=r.code and e.id>previous_event_id
   and e.event_type='context';
 insert into public.igr_v4_events(
   room_code,cycle,event_type,visibility,payload)
 values(r.code,0,'context','public',
   jsonb_build_object('title','OMERTÀ · DOSSIER','text',
     manuscript->>'public_briefing','match_no',match_id));

 update public.igr_v4_rooms
 set state=jsonb_set(coalesce(state,'{}'::jsonb),
       '{omerta_standalone}', 'true'::jsonb,true),
     updated_at=now()
 where code=r.code;
 -- Do not return the variant letter, hidden manuscripts, role mappings or
 -- canonical truth even to the host.
 return jsonb_build_object('ok',true,'standalone',true,
   'cast_suspects',n,
   'auto_assigned_roles',coalesce(started->'auto_assigned_roles','0'::jsonb));
end;
$standalone_start$;
revoke all on function public.igr_omerta_start_standalone(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_start_standalone(text,uuid)
 to anon,authenticated;


-- Filtre côté serveur : ne jamais livrer les métadonnées, faits ou
-- événements de la Famiglia Verri à une partie Santoro épinglée.
-- Pour une salle historique, le résultat de sync reste IDENTIQUE.
create or replace function public.igr_omerta_standalone_safe_sync(
 p_code text, p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $safe_sync$
declare
 raw jsonb;
 st jsonb;
 m jsonb;
 room public.igr_v4_rooms%rowtype;
 match_id integer;
 events_filtered jsonb;
 safe_private jsonb;
 card_result jsonb;
 game_role text;
begin
 raw:=public.igr_omerta_legacy_sync_core(p_code,p_player_token);
 select * into room from public.igr_v4_rooms
 where code=upper(trim(p_code));
 if not found then raise exception 'unauthorized';end if;
 if room.scenario_id not in ('021','022','023','024','025')
   or coalesce((room.state->>'omerta_standalone')::boolean,false) is not true
 then return raw;end if;

 match_id:=greatest(1,coalesce((room.state->>'match_no')::integer,1));
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=room.code and s.match_no=match_id
   and s.scenario_id=room.scenario_id;
 if m is null then raise exception 'standalone_snapshot_missing';end if;

 -- Pas de chronologie omnisciente, final_reveal, liste des rôles secrets,
 -- contexte Verri, trames Verri, ni arbre familial hérité.
 st:=coalesce(raw->'room'->'state','{}'::jsonb)
     - 'omerta_campaign' - 'omerta_campaign_id' - 'omerta_campaign_mode'
     - 'family_tree';
 raw:=jsonb_set(raw,'{room,state}',st,true);
 raw:=jsonb_set(raw,'{scenario}',jsonb_build_object(
   'context',m->>'public_briefing',
   -- La conclusion est invisible avant fermeture officielle mais le
   -- moteur d'affichage hérité doit pouvoir l'afficher une fois terminé.
   'truth',case when room.status='finished' then m->'final_reveal' else null end,
   'protected','[]'::jsonb,
   'field_actions','[]'::jsonb,
   'expert_actions','[]'::jsonb,
   'news','[]'::jsonb
 ),true);
 select coalesce(jsonb_agg(e.value order by (e.value->>'id')::bigint),'[]'::jsonb)
 into events_filtered
 from pg_catalog.jsonb_array_elements(
    coalesce(raw->'events','[]'::jsonb)) e(value)
 where (e.value->>'event_type'='context'
          and e.value->'payload'->>'text'=m->>'public_briefing'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id)
    or (e.value->>'event_type'='omerta_c3_crosscheck'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id);
 raw:=jsonb_set(raw,'{events}',events_filtered,true);
 -- Core v4 sync can still contain an old Verri private_state for
 -- non-suspects, or stale rematch action logs. Replace them at source.
 game_role:=raw->'player'->>'public_role';
 if room.status in ('playing','finished') and room.phase<>'briefing' then
   if game_role='suspect' then
     card_result:=public.igr_omerta_my_private_dossier(p_code,p_player_token);
     if card_result->>'available'<>'true'
     then raise exception 'standalone_private_cast_missing';end if;
     safe_private:=card_result->'card';
   elsif game_role in ('enqueteur','analyste') then
     safe_private:=jsonb_build_object(
       'identity',case when game_role='analyste' then 'Analyste' else 'Enquêteur' end,
       'objective','Reconstituer les faits sans inventer de preuve.',
       'what_you_know',m->>'public_briefing',
       'what_you_hide','',
       'your_chronology','',
       'conversation_hooks','[]'::jsonb
     );
   else
     safe_private:='{}'::jsonb;
   end if;
 else
   safe_private:='{}'::jsonb;
 end if;
 raw:=jsonb_set(raw,'{player,private_state}',safe_private,true);
 -- Older reveal/action records may encode historical case text.
 raw:=jsonb_set(raw,'{my_actions}','[]'::jsonb,true);
 return raw;
end;
$safe_sync$;
revoke all on function public.igr_omerta_standalone_safe_sync(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_standalone_safe_sync(text,uuid)
 to anon,authenticated;
)
   );
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


-- Interrupteur privé de publication : FALSE par défaut.
-- Ni le client ni l'hôte ne peuvent lever le verrou éditorial.
create table if not exists igr_private.igr_omerta_standalone_release_control(
  id integer primary key check(id=1),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table igr_private.igr_omerta_standalone_release_control enable row level security;
revoke all on igr_private.igr_omerta_standalone_release_control from public,anon,authenticated;
insert into igr_private.igr_omerta_standalone_release_control(id,enabled)
values(1,false) on conflict(id) do nothing;

create or replace function igr_private.igr_omerta_standalone_can_start(
 p_scenario text
) returns boolean
language sql stable security definer set search_path=''
as $can$
  select coalesce(
    (select c.enabled from igr_private.igr_omerta_standalone_release_control c
       where c.id=1),false)
  and coalesce(igr_private.igr_omerta_editorial_preflight(p_scenario),false)
  and coalesce(igr_private.igr_omerta_structural_preflight(p_scenario),false);
$can$;
revoke all on function igr_private.igr_omerta_standalone_can_start(text)
 from public,anon,authenticated;

-- Statut public NON narratif, uniquement après contrôle du jeton d'hôte.
-- N'expose ni la lettre, ni les fiches, ni la vérité des variantes.
create or replace function public.igr_omerta_standalone_release_status(
 p_code text, p_host_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $availability$
declare r public.igr_v4_rooms%rowtype;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_code)) and host_token=p_host_token;
 if not found then raise exception 'unauthorized';end if;
 return jsonb_build_object('available',
  r.status='lobby'
   and r.scenario_id in ('021','022','023','024','025')
   and igr_private.igr_omerta_standalone_can_start(r.scenario_id));
end;
$availability$;
revoke all on function public.igr_omerta_standalone_release_status(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_standalone_release_status(text,uuid)
 to anon,authenticated;

-- Démarrage contrôlé A/B/C. API séparée de l'ancien démarrage pour conserver
-- une compatibilité stricte avec les salons historiques. Tant que les A/B/C
-- restent non approuvés, ce RPC refuse la partie AVANT de muter la salle.
-- Ce composant nécessite encore un client conscient des variantes.
create or replace function public.igr_omerta_start_standalone(
 p_code text, p_host_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $standalone_start$
declare
 r public.igr_v4_rooms%rowtype;
 manuscript jsonb;
 variant text;
 started jsonb;
 n integer;
 match_id integer;
 previous_event_id bigint;
begin
 select * into r from public.igr_v4_rooms
 where code=upper(trim(p_code)) and host_token=p_host_token for update;
 if not found then raise exception 'unauthorized'; end if;
 if r.scenario_id not in ('021','022','023','024','025')
    or r.status<>'lobby' then raise exception 'standalone_not_in_lobby'; end if;
 -- Check both editorial and structural invariants before any side effects.
 if igr_private.igr_omerta_standalone_can_start(r.scenario_id) is not true
 then raise exception 'standalone_variant_not_released'; end if;
 variant:=igr_private.igr_omerta_pin_standalone_room_variant(r.code);
 if variant is null then raise exception 'standalone_variant_not_approved'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::integer,1));
 select s.manuscript into manuscript
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=r.code and s.match_no=match_id
   and s.scenario_id=r.scenario_id;
 if manuscript is null then raise exception 'standalone_snapshot_missing'; end if;

 -- Only remove PUBLIC context events emitted by this new start.
 -- Historical event logs from earlier matches must be preserved.
 select coalesce(max(e.id),0) into previous_event_id
 from public.igr_v4_events e where e.room_code=r.code;
 -- Keep the established host check, role selection and room start behaviour.
 -- Any failure rolls the new snapshot back in the SAME transaction.
 started:=public.igr_omerta_start_game(r.code,p_host_token);
 if coalesce((started->>'ok')::boolean,false) is not true
 then raise exception 'omerta_legacy_start_failed'; end if;

 n:=igr_private.igr_omerta_cast_standalone_room(r.code);
 if n<1 then raise exception 'standalone_no_assigned_characters'; end if;

 -- Remove only stale public context from the legacy start. The fresh public
 -- context never contains the canonical answer or any private character card.
 delete from public.igr_v4_events e
 where e.room_code=r.code and e.id>previous_event_id
   and e.event_type='context';
 insert into public.igr_v4_events(
   room_code,cycle,event_type,visibility,payload)
 values(r.code,0,'context','public',
   jsonb_build_object('title','OMERTÀ · DOSSIER','text',
     manuscript->>'public_briefing','match_no',match_id));

 update public.igr_v4_rooms
 set state=jsonb_set(coalesce(state,'{}'::jsonb),
       '{omerta_standalone}', 'true'::jsonb,true),
     updated_at=now()
 where code=r.code;
 -- Do not return the variant letter, hidden manuscripts, role mappings or
 -- canonical truth even to the host.
 return jsonb_build_object('ok',true,'standalone',true,
   'cast_suspects',n,
   'auto_assigned_roles',coalesce(started->'auto_assigned_roles','0'::jsonb));
end;
$standalone_start$;
revoke all on function public.igr_omerta_start_standalone(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_start_standalone(text,uuid)
 to anon,authenticated;


-- Filtre côté serveur : ne jamais livrer les métadonnées, faits ou
-- événements de la Famiglia Verri à une partie Santoro épinglée.
-- Pour une salle historique, le résultat de sync reste IDENTIQUE.
create or replace function public.igr_omerta_standalone_safe_sync(
 p_code text, p_player_token uuid
) returns jsonb
language plpgsql security definer set search_path=''
as $safe_sync$
declare
 raw jsonb;
 st jsonb;
 m jsonb;
 room public.igr_v4_rooms%rowtype;
 match_id integer;
 events_filtered jsonb;
 safe_private jsonb;
 card_result jsonb;
 game_role text;
begin
 raw:=public.igr_omerta_legacy_sync_core(p_code,p_player_token);
 select * into room from public.igr_v4_rooms
 where code=upper(trim(p_code));
 if not found then raise exception 'unauthorized';end if;
 if room.scenario_id not in ('021','022','023','024','025')
   or coalesce((room.state->>'omerta_standalone')::boolean,false) is not true
 then return raw;end if;

 match_id:=greatest(1,coalesce((room.state->>'match_no')::integer,1));
 select s.manuscript into m
 from igr_private.igr_omerta_room_variant_snapshots s
 where s.room_code=room.code and s.match_no=match_id
   and s.scenario_id=room.scenario_id;
 if m is null then raise exception 'standalone_snapshot_missing';end if;

 -- Pas de chronologie omnisciente, final_reveal, liste des rôles secrets,
 -- contexte Verri, trames Verri, ni arbre familial hérité.
 st:=coalesce(raw->'room'->'state','{}'::jsonb)
     - 'omerta_campaign' - 'omerta_campaign_id' - 'omerta_campaign_mode'
     - 'family_tree';
 raw:=jsonb_set(raw,'{room,state}',st,true);
 raw:=jsonb_set(raw,'{scenario}',jsonb_build_object(
   'context',m->>'public_briefing',
   -- La conclusion est invisible avant fermeture officielle mais le
   -- moteur d'affichage hérité doit pouvoir l'afficher une fois terminé.
   'truth',case when room.status='finished' then m->'final_reveal' else null end,
   'protected','[]'::jsonb,
   'field_actions','[]'::jsonb,
   'expert_actions','[]'::jsonb,
   'news','[]'::jsonb
 ),true);
 select coalesce(jsonb_agg(e.value order by (e.value->>'id')::bigint),'[]'::jsonb)
 into events_filtered
 from pg_catalog.jsonb_array_elements(
    coalesce(raw->'events','[]'::jsonb)) e(value)
 where (e.value->>'event_type'='context'
          and e.value->'payload'->>'text'=m->>'public_briefing'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id)
    or (e.value->>'event_type'='omerta_c3_crosscheck'
          and coalesce((e.value->'payload'->>'match_no')::integer,-1)=match_id);
 raw:=jsonb_set(raw,'{events}',events_filtered,true);
 -- Core v4 sync can still contain an old Verri private_state for
 -- non-suspects, or stale rematch action logs. Replace them at source.
 game_role:=raw->'player'->>'public_role';
 if room.status in ('playing','finished') and room.phase<>'briefing' then
   if game_role='suspect' then
     card_result:=public.igr_omerta_my_private_dossier(p_code,p_player_token);
     if card_result->>'available'<>'true'
     then raise exception 'standalone_private_cast_missing';end if;
     safe_private:=card_result->'card';
   elsif game_role in ('enqueteur','analyste') then
     safe_private:=jsonb_build_object(
       'identity',case when game_role='analyste' then 'Analyste' else 'Enquêteur' end,
       'objective','Reconstituer les faits sans inventer de preuve.',
       'what_you_know',m->>'public_briefing',
       'what_you_hide','',
       'your_chronology','',
       'conversation_hooks','[]'::jsonb
     );
   else
     safe_private:='{}'::jsonb;
   end if;
 else
   safe_private:='{}'::jsonb;
 end if;
 raw:=jsonb_set(raw,'{player,private_state}',safe_private,true);
 -- Older reveal/action records may encode historical case text.
 raw:=jsonb_set(raw,'{my_actions}','[]'::jsonb,true);
 return raw;
end;
$safe_sync$;
revoke all on function public.igr_omerta_standalone_safe_sync(text,uuid)
 from public,anon,authenticated;
grant execute on function public.igr_omerta_standalone_safe_sync(text,uuid)
 to anon,authenticated;
