-- Run in a transaction with the v58 migration; always roll back test fixtures.
begin;
DO $test$
declare v_code text:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)); j uuid; jt uuid; e uuid; req bigint; out jsonb; v jsonb; pl record; levels jsonb:='{}'; before_result jsonb; after_result jsonb; n int; slot int:=0; seat int:=0; rol text;
begin
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state) values(v_code,'001','playing',1,'event_select','{"duration_mode":"short"}');
 foreach rol in array array['enqueteur','analyste','juge','procureur','inspecteur','expert','journaliste','maitre','temoin','suspect','suspect','suspect'] loop
 seat:=seat+1;if rol='suspect' then slot:=slot+1;end if;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot) values(v_code,'QA'||seat,seat,rol,rol,case when rol='suspect' then slot else null end);
 end loop;
 select id,player_token into j,jt from public.igr_v4_players where room_code=v_code and public_role='juge';
 select id into e from public.igr_v4_players where room_code=v_code and public_role='enqueteur';
 select jsonb_object_agg(p.id::text,sp.pack->'truth'->'levels'->(p.internal_slot-1)) into levels from public.igr_v4_players p join public.igr_v4_scenario_packs sp on sp.scenario_id='001' where p.room_code=v_code and p.public_role='suspect';
 for pl in select * from public.igr_v4_players where room_code=v_code loop
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(v_code,pl.id,3,'final_lock',jsonb_build_object('levels',levels,'note','QA coherent final reading'));
 end loop;
 before_result:=public.igr_v52_make_reveal(v_code);
 for n in 1..6 loop
 insert into public.igr_v44_judge_requests(room_code,requester_id,judge_id,kind,element_id) values(v_code,e,j,'investigation_access','QA'||n) returning id into req;
 out:=public.igr_v44_judge_decide_request(v_code,jt,req,'protected');
 assert (out->>'protections_used')::int=n;assert (out->>'protections_remaining')::int=6-n;
 end loop;
 insert into public.igr_v44_judge_requests(room_code,requester_id,judge_id,kind,element_id) values(v_code,e,j,'investigation_access','QA1') returning id into req;
 out:=public.igr_v44_judge_decide_request(v_code,jt,req,'protected');assert (out->>'protections_used')::int=6;
 insert into public.igr_v44_judge_requests(room_code,requester_id,judge_id,kind,element_id) values(v_code,e,j,'investigation_access','QA7') returning id into req;
 begin
 perform public.igr_v44_judge_decide_request(v_code,jt,req,'protected');raise exception 'seventh protection accepted';
 exception when others then if sqlerrm<>'protection quota reached' then raise;end if;end;
 after_result:=public.igr_v52_make_reveal(v_code);
 for v in select value from jsonb_array_elements(before_result->'results') loop
 assert (select x->>'success' from jsonb_array_elements(after_result->'results') x where x->>'player_id'=v->>'player_id')=v->>'success','protection count changed role victory';
 end loop;
 perform public.igr_v4_start_cycle(v_code,1);select (state->>'assembly_seconds')::int into n from public.igr_v4_rooms where code=v_code;assert n=150;
 perform public.igr_v4_start_cycle(v_code,2);select (state->>'assembly_seconds')::int into n from public.igr_v4_rooms where code=v_code;assert n=120;
 perform public.igr_v13_enter_event_select(v_code,3,true);select (state->>'event_slots_total')::int into n from public.igr_v4_rooms where code=v_code;assert n=1;
 perform public.igr_v52_begin_stage(v_code,'audience');select state->'v52_queue'->0 into out from public.igr_v4_rooms where code=v_code;assert (out->>'seconds')::int=60;
 perform public.igr_v52_begin_stage(v_code,'defenses');select state->'v52_queue'->0 into out from public.igr_v4_rooms where code=v_code;assert (out->>'seconds')::int=120;
 update public.igr_v4_rooms set state=jsonb_set(state,'{duration_mode}','"long"') where code=v_code;
 perform public.igr_v52_begin_stage(v_code,'audience');select state->'v52_queue'->0 into out from public.igr_v4_rooms where code=v_code;assert (out->>'seconds')::int=120;
 perform public.igr_v52_begin_stage(v_code,'defenses');select state->'v52_queue'->0 into out from public.igr_v4_rooms where code=v_code;assert (out->>'seconds')::int=300;
 assert public.igr_v35_duration_seconds('short','interrogation')=360;assert public.igr_v35_duration_seconds('long','interrogation')=360;
end $test$;
select 'v58 transactional quota, all-role victory independence, short/long timers OK' as result;
rollback;
