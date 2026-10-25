CREATE OR REPLACE FUNCTION public.igr_v50_expert_analyze(p_code text, p_player_token uuid, p_choice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; pack jsonb; item jsonb; aid bigint;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token; if not found or me.public_role<>'expert' then raise exception 'forbidden'; end if; select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if r.scenario_id in ('003','009','016','017','018','020','020') and r.phase in ('provisional_orals','provisional_lock','defense','final_debrief','locking','judge_speech','judge_integrity_vote') then raise exception 'expertise closed';end if;
 if r.status<>'playing' or r.cycle not between 1 and 3 or r.phase in ('role_reading','investigation_assembly','interrogation','event_confrontation','closed','reveal') then raise exception 'expert unavailable now'; end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and cycle=r.cycle and action_type='expert') then raise exception 'cycle limit'; end if;
 select sp.pack into pack from public.igr_v4_scenario_packs sp where sp.scenario_id=r.scenario_id;
 if r.scenario_id='003' then pack:=coalesce(igr_private.igr_v220_003_pinned_pack(r.code),pack); elsif r.scenario_id='009' then pack:=coalesce(igr_private.igr_v331_009_pinned_pack(r.code),pack);elsif r.scenario_id='017' then pack:=coalesce(igr_private.igr_v521_017_pinned_pack(r.code),pack);elsif r.scenario_id='018' then pack:=coalesce(igr_private.igr_v541_018_pinned_pack(r.code),pack);elsif r.scenario_id='020' then pack:=igr_private.igr_v601_020_pinned_pack(r.code);elsif r.scenario_id='016' then pack:=coalesce(igr_private.igr_v481_016_pinned_pack(r.code),pack);end if; select value into item from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) where value->>'id'=p_choice limit 1; if item is null then raise exception 'invalid choice'; end if;
 if r.scenario_id in ('003','009','016','017','018','020','020') and r.cycle<coalesce((item->>'min_cycle')::integer,1) then raise exception 'expertise unlocks in a later cycle';end if; if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=me.id and action_type='expert' and payload->>'choice'=p_choice) then raise exception 'already used'; end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,me.id,r.cycle,'expert',jsonb_build_object('choice',p_choice,'shared_investigation',false)) returning id into aid; insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values(r.code,'expert','private',me.id,jsonb_build_object('title',item->>'title','text',item->>'result','action_id',aid)); return jsonb_build_object('ok',true,'action_id',aid,'title',item->>'title','result',item->>'result');
end $function$
;
