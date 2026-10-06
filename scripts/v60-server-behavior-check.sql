-- Run migration + this script inside BEGIN / ROLLBACK: no fixture survives.
do $test$
declare c text:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));ht uuid;spy uuid;enq uuid;j uuid;map jsonb;res jsonb;canonical jsonb;actual jsonb;caught boolean;proc uuid;n int;
begin
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state) values(c,'014','lobby',0,'lobby','{"duration_mode":"long"}') returning host_token into ht;
 caught:=false;begin perform public.igr_v35_set_duration_mode(c,null,'short');exception when others then caught:=sqlerrm='forbidden';end;assert caught,'null host token authorized';
 caught:=false;begin perform public.igr_v35_set_duration_mode(c,gen_random_uuid(),'short');exception when others then caught:=sqlerrm='forbidden';end;assert caught,'wrong host token authorized';
 perform public.igr_v35_set_duration_mode(c,ht,'short');assert (select state->>'duration_mode'='short' from public.igr_v4_rooms where code=c);
 update public.igr_v4_rooms set status='playing',cycle=1,phase='initial_debrief',phase_started_at=now(),phase_ends_at=null,state=state||jsonb_build_object('timer_paused',true,'timer_paused_phase','initial_debrief','timer_paused_started_at',now()) where code=c;
 perform public.igr_v4_tick(c);assert (select phase='initial_debrief' from public.igr_v4_rooms where code=c),'paused debrief advanced';
 update public.igr_v4_rooms set cycle=3,phase='locking',state='{}'::jsonb where code=c;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot) values(c,'Spy QA',1,'suspect','espion',1) returning id into spy;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot) values(c,'Suspect QA',2,'suspect','suspect',2),(c,'Suspect QA 3',3,'suspect','suspect',3);
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role) values(c,'Investigator QA',4,'enqueteur','enqueteur') returning id into enq;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role) values(c,'Judge QA',5,'juge','juge') returning id into j;
 insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role) values(c,'Prosecutor QA',6,'procureur','procureur') returning id into proc;
 -- No suspect allocation means corruption cannot receive an achievable target.
 update public.igr_v4_players set internal_slot=null where room_code=c and public_role='suspect';
 for n in 1..100 loop
  delete from public.igr_v47_prosecutor_runtime where room_code=c and prosecutor_id=proc;
  perform public.igr_v47_ensure_prosecutor_runtime(c,proc);
  assert not (select corrupt from public.igr_v47_prosecutor_runtime where room_code=c and prosecutor_id=proc),'impossible corrupt objective assigned';
 end loop;
 update public.igr_v4_players set internal_slot=seat_index where room_code=c and public_role='suspect';
 select jsonb_object_agg(p.id::text,sp.pack->'truth'->'levels'->(p.internal_slot-1)) into map from public.igr_v4_players p join public.igr_v4_scenario_packs sp on sp.scenario_id='014' where p.room_code=c and p.public_role='suspect';
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,enq,3,'final_lock',jsonb_build_object('levels',map)),(c,j,3,'final_lock',jsonb_build_object('levels',jsonb_set(map,array[spy::text],to_jsonb(0))));
 canonical:=public.igr_v4_make_reveal(c);res:=public.igr_v52_make_reveal(c);
 select value into canonical from jsonb_array_elements(canonical->'results') where value->>'player_id'=spy::text;
 select value into actual from jsonb_array_elements(res->'results') where value->>'player_id'=spy::text;
 assert actual->'success'=canonical->'success','spy lost secret-role victory rule';assert actual->>'role'='espion';
 assert not exists(select 1 from jsonb_array_elements(res->'results') v where not (v->>'success')::boolean and jsonb_array_length(v->'achievements')>0),'defeated role retains victory achievement';
end $test$;
select 'v60 authorization, paused debrief, spy role precedence and defeat achievements OK' as result;
