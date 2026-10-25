-- Scenario 018 Inspector actions and catalog consume the same private room snapshot.
CREATE OR REPLACE FUNCTION public.igr_v50_inspector_state(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; catalog jsonb:='[]'::jsonb; it jsonb; used_cycle int; hist jsonb:='[]'::jsonb; a record; active jsonb;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'inspecteur' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=me.room_code; select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 sealed evidence not found';end if;end if;
 for it in select value from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) loop catalog:=catalog||jsonb_build_array(jsonb_build_object('id',it->>'id','title',it->>'title','used',exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='field' and x.payload->>'choice'=it->>'id'))); end loop; for a in select x.id,x.cycle,x.payload from public.igr_v4_actions x where x.room_code=r.code and x.player_id=me.id and x.action_type='field' order by x.id loop hist:=hist||jsonb_build_array(jsonb_build_object('action_id',a.id,'cycle',a.cycle,'choice',a.payload->>'choice','title',a.payload->>'title','result',a.payload->>'result')); end loop;
 select count(*) into used_cycle from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='field' and cycle=r.cycle; active:=r.state->'v50_inspector_intervention'; return jsonb_build_object('version','v50','cycle',r.cycle,'phase',r.phase,'catalog',catalog,'history',hist,'used_this_cycle',used_cycle,'remaining_this_cycle',greatest(0,3-used_cycle),'can_explore',r.status='playing' and r.cycle between 1 and 3 and used_cycle<3 and r.phase not in ('role_reading','investigation_assembly','closed','reveal'),'active_intervention',active,'suspects',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id::text,'pseudo',p.pseudo) order by p.seat_index),'[]'::jsonb) from public.igr_v4_players p where p.room_code=r.code and p.public_role='suspect' and p.id::text<>coalesce(r.state->>'current_target','')));
end $function$
;

CREATE OR REPLACE FUNCTION public.igr_v50_inspector_explore(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; item jsonb; aid bigint; investigator uuid;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'inspecteur' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=me.room_code for update; if r.status<>'playing' or r.cycle not between 1 and 3 or r.phase in ('role_reading','investigation_assembly','closed','reveal') then raise exception 'field action unavailable now'; end if; if (select count(*) from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='field' and cycle=r.cycle)>=3 then raise exception 'three locations already explored this cycle'; end if;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id; if r.scenario_id='018' then pack:=igr_private.igr_v541_018_pinned_pack(r.code);if pack is null then raise exception '018 sealed evidence not found';end if;end if; select value into item from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) where value->>'id'=p_choice limit 1; if item is null then raise exception 'invalid location'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='field' and payload->>'choice'=p_choice) then raise exception 'already explored'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'field',jsonb_build_object('choice',p_choice,'title',item->>'title','result',item->>'result')) returning id into aid; select id into investigator from public.igr_v4_players where room_code=r.code and public_role='enqueteur' order by seat_index limit 1; insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'inspector_field','private',me.id,jsonb_build_object('title',item->>'title','text',item->>'result','action_id',aid)); if investigator is not null then insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'inspector_report','private',investigator,jsonb_build_object('title','RAPPORT INSPECTEUR · '||coalesce(item->>'title','TERRAIN'),'text',item->>'result','action_id',aid,'inspector',me.pseudo)); end if; return jsonb_build_object('ok',true,'action_id',aid,'title',item->>'title','result',item->>'result');
end $function$
;
