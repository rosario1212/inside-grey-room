do $qa$
declare variant text; n integer; seat integer; mode text; ending text; c text; host uuid; p record; other_actor record;
 lawyer public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype; enq public.igr_v4_players%rowtype;
 x igr_private.igr_v171_031_matches%rowtype; response jsonb; result_item jsonb; levels jsonb;
 right_place text;wrong_place text;right_approach text;wrong_approach text;
 blocked boolean; starts integer:=0; ends integer:=0; cycle_no integer; expected integer; tmp jsonb;
begin
 begin
  foreach variant in array array['A','B','C'] loop
   update igr_private.igr_v99_variant_manuscripts set editorial_status=case when variant_id=variant then 'ready' else 'retired' end where scenario_id='031';
  foreach n in array array[6,7,8] loop
   foreach mode in array array['short','long'] loop
    foreach ending in array array['rescued','killed','captive','handover'] loop
     loop
      c:='ZD'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
      exit when not exists(select 1 from public.igr_v4_rooms where code=c);
     end loop;
     insert into public.igr_v4_rooms(code,scenario_id,state) values(c,'031',jsonb_build_object('duration_mode',mode)) returning host_token into host;
     for seat in 0..n-1 loop insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
      values(c,'QA dette '||seat,seat,seat=0); end loop;
     perform public.igr_v4_start_game(c,host); starts:=starts+1;
     select * into x from igr_private.igr_v171_031_matches where room_code=c;
     right_place:=x.manuscript#>>'{canonical_truth,hostage_location}'; right_approach:=x.manuscript#>>'{canonical_truth,safe_approach}';
     select a->>'id' into wrong_place from jsonb_array_elements(x.manuscript->'locations') a where a->>'id'<>right_place limit 1;
     select a->>'id' into wrong_approach from jsonb_array_elements(x.manuscript->'approaches') a where a->>'id'<>right_approach limit 1;
     if x.manuscript->>'variant' is distinct from variant then raise exception '031 wrong pinned variant'; end if;
     if x.manuscript->>'version'<>'v171-cartel031-la-dette' then raise exception '031 start not pinned'; end if;
     select * into enq from public.igr_v4_players where room_code=c and public_role='enqueteur';
     select * into lawyer from public.igr_v4_players where room_code=c and public_role='maitre';
     select * into client from public.igr_v4_players where room_code=c and public_role='suspect' and internal_slot=3;
     if not exists(select 1 from public.igr_v43_lawyer_representations where room_code=c and lawyer_id=lawyer.id and client_id=client.id) then raise exception '031 lawyer not assigned to superior'; end if;
     if exists(select 1 from public.igr_v4_players where room_code=c and (private_state ? 'family_proof' or secret_role='espion')) then raise exception '031 premature proof or unintended mole'; end if;
     blocked:=false;
     begin perform public.igr_v171_031_state(c,gen_random_uuid()); exception when others then blocked:=true; end;
     if not blocked then raise exception '031 invalid token accepted'; end if;
     for cycle_no in 1..3 loop
      update public.igr_v4_rooms set cycle=cycle_no,phase='investigation_assembly',phase_ends_at=now()+interval '90 seconds' where code=c;
      expected:=(array[4,9,13])[cycle_no];
      if (select count(*) from public.igr_v4_events where room_code=c and payload->>'evidence_id' like 'D%')<>expected then raise exception '031 evidence timing mismatch'; end if;
      if cycle_no=1 then
       blocked:=false;
       begin perform public.igr_v171_031_act(c,enq.player_token,'vote',jsonb_build_object('choice','refuse'));
       exception when others then blocked:=true; end;
       if not blocked or exists(select 1 from public.igr_v4_events where room_code=c and event_type='cartel031_private_proof') then raise exception '031 crisis before C2'; end if;
      end if;
     end loop;
     if (select count(*) from public.igr_v4_events where room_code=c and event_type='cartel031_private_proof')<>(case when n=6 then 2 else 3 end) then raise exception '031 wrong private proof count'; end if;
     -- Repeated cycle/phase updates never duplicate evidence or life proofs.
     update public.igr_v4_rooms set cycle=3,phase_ends_at=now()+interval '90 seconds' where code=c;
     for p in select * from public.igr_v4_players where room_code=c loop
      response:=public.igr_v171_031_state(c,p.player_token);
      if response ? 'ballots' or response ? 'manuscript' or response ? 'canonical_truth' or response ? 'family_proofs' then raise exception '031 state leaks secrets'; end if;
      tmp:=public.igr_v4_sync(c,p.player_token);
      if exists(select 1 from jsonb_array_elements(tmp->'players') a where a ? 'private_state' or a ? 'player_token') then raise exception '031 roster leaks'; end if;
      if p.public_role in ('enqueteur','analyste','procureur') then
       if response->'proof' is null or response->'proof'='null'::jsonb then raise exception '031 bureau proof missing'; end if;
       if (select count(*) from jsonb_array_elements(tmp->'events') a where a->>'event_type'='cartel031_private_proof')<>1 then raise exception '031 private proof scope'; end if;
       perform public.igr_v171_031_act(c,p.player_token,'vote',jsonb_build_object('choice',case when ending='handover' then enq.id::text else 'refuse' end));
      else
       if response ? 'proof' or response ? 'crew' or response ? 'own_ballot' then raise exception '031 non-bureau sees private vote or proof'; end if;
       blocked:=false;
       begin perform public.igr_v171_031_act(c,p.player_token,'vote',jsonb_build_object('choice',enq.id::text)); exception when others then blocked:=true; end;
       if not blocked then raise exception '031 non-bureau can vote'; end if;
       if p.public_role='temoin' then perform public.igr_v171_031_act(c,p.player_token,'testify','{}'); end if;
      end if;
     end loop;
     blocked:=false;
     begin perform public.igr_v171_031_act(c,enq.player_token,'plan',jsonb_build_object('mode','intervene','location',right_place,'approach',wrong_approach,'assault_author',x.manuscript#>>'{canonical_truth,assault_author}'));
     exception when others then blocked:=true; end;
     if not blocked then raise exception '031 dangerous action without acknowledgement'; end if;
     perform public.igr_v171_031_act(c,enq.player_token,'plan',jsonb_build_object('mode','intervene',
      'location',case when ending='captive' then wrong_place else right_place end,
      'approach',case when ending='killed' then wrong_approach else right_approach end,'acknowledge_risk',true,
      'assault_author',x.manuscript#>>'{canonical_truth,assault_author}'));
     for p in select * from public.igr_v4_players where room_code=c and public_role='suspect' loop
      perform public.igr_v171_031_act(c,enq.player_token,'offer',jsonb_build_object('suspect_id',p.id::text,
       'terms',case p.internal_slot when 1 then 'release' when 2 then 'prison' else 'protected_release' end));
      blocked:=false;
      begin perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',0,'accept',true));
      exception when others then blocked:=true; end;
      if not blocked then raise exception '031 stale offer accepted'; end if;
      if p.internal_slot=1 then
       blocked:=false;
       begin perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',1,'accept',true));
       exception when others then blocked:=true; end;
       if not blocked then raise exception '031 unsafe release missing acknowledgement'; end if;
      end if;
      perform public.igr_v171_031_act(c,p.player_token,'respond',jsonb_build_object('revision',1,'accept',true,'acknowledge_risk',true));
      blocked:=false;
      begin perform public.igr_v171_031_act(c,enq.player_token,'offer',jsonb_build_object('suspect_id',p.id::text,'terms','prison'));
      exception when others then blocked:=true; end;
      if not blocked then raise exception '031 accepted pledge broken'; end if;
     end loop;
     if ending='handover' then
      perform public.igr_v170_end_representation(c,lawyer.player_token,client.id,true);
      perform public.igr_v43_request_lawyer(c,client.player_token);
      perform public.igr_v43_accept_lawyer(c,lawyer.player_token,client.id);
     end if;
     update public.igr_v4_rooms set phase='locking',phase_ends_at=null,
      state=state||jsonb_build_object('v52_final_reassessment',true) where code=c;
     blocked:=false;
     begin perform public.igr_v171_031_act(c,enq.player_token,'vote',jsonb_build_object('choice','refuse'));
     exception when others then blocked:=true; end;
     if not blocked then raise exception '031 frozen vote changed'; end if;
     select jsonb_object_agg(id::text,2) into levels from public.igr_v4_players where room_code=c and public_role='suspect';
     for p in select * from public.igr_v4_players where room_code=c and public_role in ('enqueteur','analyste','procureur') loop
      insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,p.id,3,'final_lock',jsonb_build_object('levels',levels));
     end loop;
     response:=public.igr_v52_maybe_finish(c);
     if response->>'finished' is distinct from 'true' then raise exception '031 normal finish blocked'; end if;
     select payload into response from public.igr_v4_events where room_code=c and event_type='reveal' order by id desc limit 1;
     if response#>>'{crisis,outcome}' is distinct from ending then raise exception '031 ending mismatch %',ending; end if;
     if response ? 'ballots' or response::text like '%"own_ballot"%' then raise exception '031 ballot revealed at ending'; end if;
     for p in select * from public.igr_v4_players where room_code=c and public_role='suspect' loop
      select value into result_item from jsonb_array_elements(response->'results') a where a->>'player_id'=p.id::text;
      if (result_item->>'success')::boolean is distinct from (p.internal_slot=3) then raise exception '031 suspect goal mismatch'; end if;
     end loop;
     select value into result_item from jsonb_array_elements(response->'results') a where a->>'player_id'=lawyer.id::text;
     if ending='handover' then
      if result_item->>'forfeited' is distinct from 'true' or result_item->>'family_fate' is distinct from 'killed' or result_item->>'success' is distinct from 'false' then raise exception '031 lawyer penalty missing'; end if;
     elsif result_item->>'success' is distinct from 'true' then raise exception '031 lawyer client goal mismatch'; end if;
     ends:=ends+1;
     -- A new match must clear both the crisis and the lawyer's permanent
     -- previous-match sanction, while hiding all old evidence and votes.
     update public.igr_v4_rooms set status='lobby',state=jsonb_build_object('match_no',2,'duration_mode',mode) where code=c;
     perform public.igr_v4_start_game(c,host); starts:=starts+1;
     select * into x from igr_private.igr_v171_031_matches where room_code=c;
     if x.ballots<>'{}'::jsonb or x.offers<>'{}'::jsonb or x.decisions_locked or x.crisis_started_at is not null then raise exception '031 rematch stale choices'; end if;
     for p in select * from public.igr_v4_players where room_code=c loop
      tmp:=public.igr_v4_sync(c,p.player_token);
      if exists(select 1 from jsonb_array_elements(tmp->'events') a where a->>'event_type' in ('reveal','trame','cartel031_private_proof','cartel031_demand'))
       or p.private_state ? 'lawyer_cartel_forfeit' or p.private_state ? 'family_proof' then raise exception '031 rematch leaks previous story'; end if;
     end loop;
    end loop;
   end loop;
  end loop;
  end loop;
  if has_table_privilege('anon','igr_private.igr_v171_031_matches','select')
   or has_function_privilege('anon','igr_private.igr_v171_031_make_reveal(text)','execute')
   or has_function_privilege('anon','public.igr_v4_make_reveal(text)','execute') then raise exception '031 internal access exposed'; end if;
  raise exception using errcode='ZX171',message='rollback 031 QA fixtures';
 exception when sqlstate 'ZX171' then null;
 end;
 if starts<>144 or ends<>72 then raise exception '031 incomplete QA %/%',starts,ends; end if;
 raise notice '031 verified: A/B/C, 144 starts/rematches, 72 endings, 6/7/8 players, both durations, private votes/proofs and binding agreements. All fixtures rolled back.';
end $qa$;
