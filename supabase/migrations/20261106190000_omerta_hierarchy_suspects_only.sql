-- Omerta: preserve internal family-tree only for authenticated suspect clients.
-- This does not enable the DLC and does not change canonical truths.
CREATE OR REPLACE FUNCTION public.igr_omerta_standalone_safe_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
     - 'family_tree' - 'omerta_santoro_family';
 -- Internal hierarchy, real names and assigned ranks must never appear in
 -- the investigation-side synchronization payload. Only suspects receive it.
 if raw->'player'->>'public_role'='suspect' then
   st:=jsonb_set(st,'{omerta_santoro_family}',igr_private.igr_omerta_santoro_family(room.code,match_id),true);
 end if;
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
 if room.status in ('playing','finished') then
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
$function$;
