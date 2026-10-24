CREATE OR REPLACE FUNCTION public.igr_v415_013_investigate(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;pack jsonb;item jsonb;kind text;
begin
 if coalesce((igr_private.igr_v411_013_release_status()->>'eligible')::boolean,false) is not true then
  raise exception '013 not released' using errcode='P0001';end if;
 perform igr_private.rate_limit('013_investigation',p_player_token::text,18,60);
 select * into p from public.igr_v4_players
 where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or p.public_role not in ('enqueteur','analyste') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if not found or r.scenario_id<>'013' or r.status<>'playing'
 then raise exception 'unavailable'; end if;
 if not (r.phase in ('investigation_assembly','interrogation_select','interrogation','cycle_debrief')
    or r.phase like 'annex_%') or r.cycle not between 1 and 3
 then raise exception 'wrong phase'; end if;
 if exists(select 1 from public.igr_v4_actions a
     where a.room_code=r.code and a.cycle=r.cycle and a.action_type='investigation_013')
 then raise exception 'camp investigation used'; end if;
 pack:=igr_private.igr_v411_013_pinned_pack(r.code);
 if pack is null then raise exception 'unavailable'; end if;
 select x.value into item from jsonb_array_elements(coalesce(pack->'investigation_013','[]'::jsonb)) x(value)
 where x.value->>'id'=p_choice and (x.value->>'cycle')::int=r.cycle limit 1;
 if item is null then raise exception 'invalid choice'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 values(r.code,p.id,r.cycle,'investigation_013',jsonb_build_object('choice',p_choice,'title',item->>'title'));
 insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,cycle,payload)
 values(r.code,'investigation_013','roles',array['enqueteur','analyste']::text[],r.cycle,
    jsonb_build_object('title',item->>'title','text',item->>'result','author','Enquête de terrain'));
 return jsonb_build_object('ok',true,'cycle',r.cycle);
end $function$
;
revoke all on function public.igr_v415_013_investigate(text,uuid,text) from public,anon,authenticated;
grant execute on function public.igr_v415_013_investigate(text,uuid,text) to anon,authenticated;
