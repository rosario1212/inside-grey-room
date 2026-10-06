-- Execute in BEGIN/ROLLBACK. Omerta uses a separate engine.
do $test$
declare sp record;count_players int;seat int;c text;ht uuid;pl record;d jsonb;mode text;tests int:=0;
begin
 for sp in select scenario_id,pack from public.igr_v4_scenario_packs where scenario_id not in ('021','022','023','024','025') order by scenario_id loop
  foreach mode in array array['short','long'] loop
  foreach count_players in array array[public.igr_v4_min_players(sp.scenario_id),public.igr_v4_max_players(sp.scenario_id)] loop
   c:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
   insert into public.igr_v4_rooms(code,scenario_id,status,phase,state) values(c,sp.scenario_id,'lobby','lobby',jsonb_build_object('duration_mode',mode)) returning host_token into ht;
   for seat in 0..count_players-1 loop insert into public.igr_v4_players(room_code,pseudo,seat_index) values(c,'Beta scenario QA '||seat,seat);end loop;
   perform public.igr_v4_start_game(c,ht);
   assert (select state->>'duration_mode'=mode from public.igr_v4_rooms where code=c),'start lost duration mode';
   assert not exists(select 1 from public.igr_v4_players where room_code=c and (public_role is null or public_role='en_attente' or private_state is null or private_state='{}'::jsonb)),'unassigned role or empty private card';
   assert not exists(select 1 from public.igr_v4_players where room_code=c and public_role='suspect' and (internal_slot is null or internal_slot>jsonb_array_length(sp.pack->'truth'->'levels'))),'suspect outside truth slots';
   update public.igr_v4_rooms set phase='role_reading',phase_started_at=now(),phase_ends_at=now()+interval '2 minutes' where code=c;
   select * into pl from public.igr_v4_players where room_code=c order by seat_index limit 1;
   d:=public.igr_v4_sync(c,pl.player_token);
   assert d->'player'->>'id'=pl.id::text,'sync returned wrong private identity';
   assert not exists(select 1 from jsonb_array_elements(d->'players') p where p ? 'player_token' or p ? 'secret_role' or p ? 'private_state'),'public player list leaked secrets';
   tests:=tests+1;
  end loop;
  end loop;
 end loop;
 assert tests=156,'unexpected scenario coverage';
end $test$;
select '156 short/long minimum/maximum compositions: allocation, private cards, duration retention and public player privacy OK' as result;
