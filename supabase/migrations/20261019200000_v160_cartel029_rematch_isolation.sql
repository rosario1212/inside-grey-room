-- v160: isolate the dossier 029 on successive matches without loosening privacy.
CREATE OR REPLACE FUNCTION igr_private.igr_v126_029_reset_choices()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.scenario_id<>'029' or old.status<>'lobby' or new.status<>'playing'
    or not igr_private.igr_v108_029_is_enabled() then return new; end if;
 delete from public.igr_v4_actions
 where room_code=new.code and action_type in ('cartel029_protection','cartel029_position','cartel029_leadership',
 'breaking_news','breaking_news_manual','final_lock','provisional');
 return new;
end $function$;
REVOKE ALL ON FUNCTION igr_private.igr_v126_029_reset_choices() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v4_visible_events(p_room text, p_player igr_v4_players)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'event_type',e.event_type,'payload',e.payload,
  'created_at',e.created_at,'cycle',e.cycle,'visibility',e.visibility
 ) order by e.id),'[]'::jsonb)
 from public.igr_v4_events e
 where e.room_code=p_room
   -- 029 rematches reuse a room code. Hide the previous match's events,
   -- including its prior reveal, but do not affect other scenarios.
   and (not exists (select 1 from public.igr_v4_rooms r where r.code=p_room and r.scenario_id='029')
        or e.id >= coalesce((select max(c.id) from public.igr_v4_events c
          where c.room_code=p_room and c.event_type='context'),0))
   and (e.visibility='public'
     or (e.visibility='private' and e.target_player_id=p_player.id)
     or (e.visibility='roles' and p_player.public_role=any(e.audience_roles)))
   and not (e.event_type='message' and e.payload ? 'author_id'
     and exists (
       select 1 from igr_private.blocks b
       where b.room_code=p_room and b.blocker_player_id=p_player.id
         and b.blocked_player_id=(e.payload->>'author_id')::uuid
     ))
$function$;
REVOKE ALL ON FUNCTION public.igr_v4_visible_events(text,public.igr_v4_players) FROM PUBLIC,anon,authenticated;
