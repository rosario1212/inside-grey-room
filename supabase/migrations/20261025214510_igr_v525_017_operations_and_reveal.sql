-- 017 actions and strict verdict checks. No hidden manuscript contents are committed.
CREATE OR REPLACE FUNCTION public.igr_v525_017_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce((igr_private.igr_v521_017_release_status()->>'eligible')::boolean,false) is not true then
  raise exception '017 not released' using errcode='P0001';end if;
 perform igr_private.rate_limit('017_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'017' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_017')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v521_017_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_017','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_017',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_017','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$;

CREATE OR REPLACE FUNCTION public.igr_v526_017_investigate_index(p_code text, p_player_token uuid, p_index integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.igr_v4_rooms%rowtype;pack jsonb;choice text;
BEGIN
 IF p_index NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'invalid index';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code));
 IF NOT FOUND OR r.scenario_id<>'017' THEN RAISE EXCEPTION 'not available';END IF;
 pack:=igr_private.igr_v521_017_pinned_pack(r.code);
 SELECT e->>'id' INTO choice FROM jsonb_array_elements(coalesce(pack->'investigation_017','[]'::jsonb)) WITH ORDINALITY AS t(e,i)
 WHERE (e->>'cycle')::int=r.cycle ORDER BY i OFFSET (p_index-1) LIMIT 1;
 IF choice IS NULL THEN RAISE EXCEPTION 'no choice';END IF;
 RETURN public.igr_v525_017_investigate(p_code,p_player_token,choice);
END $function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v527_017_reveal_enrich(p_room text, p_base jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
declare r public.igr_v4_rooms%rowtype; pack jsonb; truth_ jsonb;
  item jsonb; player_ public.igr_v4_players%rowtype; guess jsonb; correct_ boolean;
  out_results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb; evaluation jsonb:='{}'::jsonb;
  newitem jsonb; all_correct boolean:=true; investigator_count int:=0;
begin
 select * into r from public.igr_v4_rooms where code=upper(trim(p_room));
 if not found or r.scenario_id<>'017' then return p_base;end if;
 pack=igr_private.igr_v521_017_pinned_pack(r.code);
 if pack is null then raise exception '017 reveal snapshot unavailable';end if;
 truth_=pack->'truth'->'reconstruction_017';
 if jsonb_typeof(truth_)<>'object' then raise exception '017 reveal truth missing';end if;
 for item in select value from jsonb_array_elements(coalesce(p_base->'results','[]'::jsonb)) loop
  newitem=item;
  select * into player_ from public.igr_v4_players
   where room_code=r.code and id=(item->>'player_id')::uuid;
  if found and player_.public_role in ('enqueteur','analyste') then
   investigator_count=investigator_count+1;
   select a.payload->'reconstruction_017' into guess
   from public.igr_v4_actions a where a.room_code=r.code and a.player_id=player_.id
     and a.action_type='final_lock' order by a.id desc limit 1;
   correct_=coalesce(guess=truth_,false);
   all_correct=all_correct and correct_;
   newitem=newitem||jsonb_build_object(
    'reconstruction_017_correct',correct_,
    'success',coalesce((item->>'success')::boolean,false) and correct_,
    'text',coalesce(item->>'text','') || case when correct_ then
      ' · Reconstitution sous serment exacte.' else ' · Reconstitution des faits erronée.' end);
   if not coalesce((newitem->>'success')::boolean,false) then
     newitem=jsonb_set(newitem,'{achievements}','[]'::jsonb,true);
   end if;
   evaluation=evaluation||jsonb_build_object(player_.public_role,
      jsonb_build_object('guess',guess,'correct',correct_));
  end if;
  out_results=out_results||jsonb_build_array(newitem);
  if coalesce((newitem->>'success')::boolean,false) then
    winners=winners||jsonb_build_array((newitem->>'player_id')::uuid);
  end if;
 end loop;
 return p_base || jsonb_build_object(
  'results',out_results,'winners',winners,'winner_count',jsonb_array_length(winners),
  'reconstruction_017',jsonb_build_object('truth',truth_,'investigators',evaluation,
      'camp_reconstruction_complete',all_correct and investigator_count=2));
end;
$function$;

CREATE OR REPLACE FUNCTION igr_private.igr_v529_017_room_release_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$ begin if new.scenario_id='017' and coalesce((igr_private.igr_v521_017_release_status()->>'eligible')::boolean,false) is not true then raise exception 'Dossier 017 non publie';end if;return new;end $function$;

REVOKE ALL ON FUNCTION public.igr_v525_017_investigate(text,uuid,text) FROM public,anon,authenticated;
-- Direct named-investigation RPC remains private; only the validated index wrapper is exposed.
REVOKE ALL ON FUNCTION public.igr_v526_017_investigate_index(text,uuid,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v526_017_investigate_index(text,uuid,integer) TO anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v527_017_reveal_enrich(text,jsonb) FROM public,anon,authenticated;
REVOKE ALL ON FUNCTION igr_private.igr_v529_017_room_release_guard() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS igr_v529_017_room_release_guard ON public.igr_v4_rooms;
CREATE TRIGGER igr_v529_017_room_release_guard BEFORE INSERT OR UPDATE OF scenario_id ON public.igr_v4_rooms FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v529_017_room_release_guard();
