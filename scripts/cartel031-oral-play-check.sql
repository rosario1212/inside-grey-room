do $qa$
declare variant text; code_id text; host uuid; seat integer; cycle_no integer; p record;
 enq public.igr_v4_players%rowtype; x igr_private.igr_v171_031_matches%rowtype; levels jsonb; result jsonb; cases integer:=0;
begin
 begin
  foreach variant in array array['A','B','C'] loop
   update igr_private.igr_v99_variant_manuscripts set editorial_status=case when variant_id=variant then 'ready' else 'retired' end where scenario_id='031';
   loop
    code_id:='ZN'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
    exit when not exists(select 1 from public.igr_v4_rooms where code=code_id);
   end loop;
   insert into public.igr_v4_rooms(code,scenario_id,state) values(code_id,'031','{"duration_mode":"short"}') returning host_token into host;
   for seat in 0..6 loop insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host) values(code_id,'QA oral '||seat,seat,seat=0); end loop;
   perform public.igr_v4_start_game(code_id,host);
   select * into x from igr_private.igr_v171_031_matches where room_code=code_id;
   if x.manuscript->>'editorial_revision' is distinct from 'v173-negotiation' then raise exception '031 wrong editorial revision'; end if;
   select * into enq from public.igr_v4_players where room_code=code_id and public_role='enqueteur';
   for cycle_no in 1..3 loop update public.igr_v4_rooms set cycle=cycle_no,phase='investigation_assembly',phase_ends_at=now()+interval '90 seconds' where code=code_id; end loop;
   -- Correct information may be discussed face to face. No formal agreement
   -- or automatic deposition is a prerequisite for recording an intervention.
   perform public.igr_v171_031_act(code_id,enq.player_token,'plan',jsonb_build_object(
    'mode','intervene','location',x.manuscript#>>'{canonical_truth,hostage_location}',
    'approach',x.manuscript#>>'{canonical_truth,safe_approach}',
    'assault_author',x.manuscript#>>'{canonical_truth,assault_author}','acknowledge_risk',true));
   if exists(select 1 from igr_private.igr_v171_031_matches where room_code=code_id and offers<>'{}'::jsonb) then raise exception '031 unexpected agreement'; end if;
   if exists(select 1 from public.igr_v4_events where room_code=code_id and payload->>'evidence_id' in ('S1','S2','S3')) then raise exception '031 invented deposition'; end if;
   update public.igr_v4_rooms set phase='locking',phase_ends_at=null,state=state||jsonb_build_object('v52_final_reassessment',true) where code=code_id;
   select jsonb_object_agg(sp.id::text,(x.manuscript#>>array['canonical_truth','levels',(sp.internal_slot-1)::text])::int)
    into levels from public.igr_v4_players sp where sp.room_code=code_id and sp.public_role='suspect';
   for p in select * from public.igr_v4_players where room_code=code_id and public_role in ('enqueteur','analyste','procureur') loop
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(code_id,p.id,3,'final_lock',jsonb_build_object('levels',levels));
   end loop;
   result:=public.igr_v52_maybe_finish(code_id);
   if result->>'finished' is distinct from 'true' then raise exception '031 oral-only finish blocked'; end if;
   select payload into result from public.igr_v4_events where room_code=code_id and event_type='reveal' order by id desc limit 1;
   if result#>>'{crisis,outcome}' is distinct from 'rescued' then raise exception '031 signature incorrectly required'; end if;
   if exists(select 1 from jsonb_array_elements(result->'results') r where r->>'role'='suspect' and r->>'fate' is distinct from 'prison') then raise exception '031 silence bypassed responsibility'; end if;
   if exists(select 1 from jsonb_array_elements(result->'results') r where r->>'role' in ('enqueteur','analyste','procureur') and r->>'success' is distinct from 'true') then raise exception '031 oral information failed bureau objective'; end if;
   cases:=cases+1;
  end loop;
  raise exception using errcode='ZX173',message='rollback oral-play fixtures';
 exception when sqlstate 'ZX173' then null;
 end;
 if cases<>3 then raise exception '031 missing oral-play case'; end if;
end $qa$;
