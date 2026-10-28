-- Santoro duplicate-rank start: preserve user choices and isolate Verri.
CREATE OR REPLACE FUNCTION public.igr_omerta_start_standalone(p_code text, p_host_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 r public.igr_v4_rooms%rowtype;
 manuscript jsonb;
 variant text;
 started jsonb;
 n integer;
 match_id integer;
 previous_event_id bigint;
 duplicated_picks jsonb:='[]'::jsonb;
 picked jsonb;
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
 if manuscript->>'private_format'='santoro_v25'
    and exists (
      select 1 from public.igr_v4_players p
      where p.room_code=r.code and p.public_role='suspect'
        and p.preferred_role not in ('suspect')
        and p.preferred_role is not null
        and not exists(
          select 1 from pg_catalog.jsonb_array_elements(
            manuscript->'private_cards') card
          where card->>'rank_code'=p.preferred_role
        )
    ) then
   raise exception 'standalone_selected_rank_not_in_manuscript';
 end if;


 -- Only remove PUBLIC context events emitted by this new start.
 -- Historical event logs from earlier matches must be preserved.
 select coalesce(max(e.id),0) into previous_event_id
 from public.igr_v4_events e where e.room_code=r.code;
 -- Keep the established host check, role selection and room start behaviour.
 -- Any failure rolls the new snapshot back in the SAME transaction.
 if manuscript->>'private_format'='santoro_v25'
    and exists(
     select 1 from public.igr_v4_players p
     where p.room_code=r.code
       and p.preferred_role is not null
       and p.preferred_role not in ('enqueteur','analyste','suspect')
       and not exists(
         select 1 from pg_catalog.jsonb_array_elements(
           manuscript->'private_cards') c
         where c->>'rank_code'=p.preferred_role)
    ) then raise exception 'standalone_selected_rank_not_available';end if;
 -- Santoro permits multiple people to select a rank if the pinned
 -- manuscript contains multiple distinct characters bearing that rank.
 -- The unchanged Verri starter rejects duplicate ranks, so temporarily
 -- represent *only subsequent copies* as generic suspects in this same
 -- transaction, then restore their original choices before the private cast.
 IF manuscript->>'private_format'='santoro_v25' THEN
   IF EXISTS (
     SELECT 1 FROM (
       SELECT p.preferred_role,count(*) AS chosen
       FROM public.igr_v4_players p
       WHERE p.room_code=r.code AND p.preferred_role IS NOT NULL
         AND p.preferred_role NOT IN('suspect','enqueteur','analyste')
       GROUP BY p.preferred_role
     ) requested
     WHERE requested.chosen>(
       SELECT count(*) FROM pg_catalog.jsonb_array_elements(manuscript->'private_cards') c
       WHERE c->>'rank_code'=requested.preferred_role
     )
   ) THEN RAISE EXCEPTION 'santoro_rank_capacity_exceeded';END IF;
   SELECT coalesce(jsonb_agg(jsonb_build_object('player_id',ranks.id,
       'rank',ranks.preferred_role)), '[]'::jsonb)
   INTO duplicated_picks
   FROM (
     SELECT p.id,p.preferred_role,
       row_number() OVER (PARTITION BY p.preferred_role
         ORDER BY p.seat_index NULLS LAST,p.id) AS rank_number
     FROM public.igr_v4_players p
     WHERE p.room_code=r.code AND p.preferred_role NOT IN('suspect','enqueteur','analyste')
   ) ranks
   WHERE ranks.rank_number>1;
   UPDATE public.igr_v4_players player
   SET preferred_role='suspect'
   WHERE player.room_code=r.code
     AND EXISTS (
       SELECT 1 FROM pg_catalog.jsonb_array_elements(duplicated_picks) saved
       WHERE saved->>'player_id'=player.id::text
     );
 END IF;
 started:=public.igr_omerta_start_game(r.code,p_host_token);
 if coalesce((started->>'ok')::boolean,false) is not true
 then raise exception 'omerta_legacy_start_failed'; end if;

 -- Restore every explicitly selected duplicate rank before the private
 -- Santoro cast. A role chosen by the player cannot silently be replaced.
 FOR picked IN SELECT value FROM pg_catalog.jsonb_array_elements(duplicated_picks) value
 LOOP
   UPDATE public.igr_v4_players player
   SET preferred_role=picked->>'rank',secret_role=picked->>'rank'
   WHERE player.room_code=r.code AND player.id=(picked->>'player_id')::uuid
     AND player.public_role='suspect';
   IF NOT FOUND THEN RAISE EXCEPTION 'santoro_original_rank_restoration_failed';END IF;
 END LOOP;
 -- Legacy random assignment may select ranks absent from this Santoro manuscript.
 -- Reject explicitly chosen ranks above; normalize only unavailable
 -- automatically assigned ranks before pinning the final character.
 if manuscript->>'private_format'='santoro_v25' then
   update public.igr_v4_players p
   set preferred_role='suspect',secret_role='suspect'
   where p.room_code=r.code and p.public_role='suspect'
     and not exists (
       select 1 from pg_catalog.jsonb_array_elements(manuscript->'private_cards') c
       where c->>'rank_code'=p.preferred_role
     );
 end if;
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
$function$
;
REVOKE ALL ON FUNCTION public.igr_omerta_start_standalone(text,uuid) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_omerta_start_standalone(text,uuid) TO anon,authenticated;