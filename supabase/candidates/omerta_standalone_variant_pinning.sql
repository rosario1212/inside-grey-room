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
