begin;

do $test$
declare sid text;c int;i int;out jsonb;joined jsonb;d jsonb;qa_code text;host uuid;tok uuid;pid uuid;proc uuid;target uuid;target_token uuid;req bigint;blocked boolean;cases int:=0;sid_status text;
begin
for sid in select scenario_id from public.igr_v4_scenario_packs order by scenario_id loop
 for c in select distinct n from unnest(array[public.igr_v4_min_players(sid),public.igr_v4_max_players(sid)]) n loop
  qa_code:=upper(substr(translate(replace(gen_random_uuid()::text,'-',''),'01','GH'),1,5));
  out:=public.igr_v4_create_room(qa_code,sid,'QA host');host:=(out->>'host_token')::uuid;tok:=(out->>'player_token')::uuid;
  for i in 1..c-1 loop joined:=public.igr_v4_join_room(qa_code,'QA '||i);end loop;
  for pid,tok,i in select id,player_token,seat_index from public.igr_v4_players where room_code=qa_code order by seat_index loop
   perform public.igr_v4_choose_role(qa_code,tok,public.igr_v4_role_for_seat(sid,i,c));
  end loop;
  blocked:=false;
  begin perform public.igr_v4_start_game(qa_code,host);exception when others then if sqlerrm='all players must prepare audio' then blocked:=true;else raise;end if;end;
  if not blocked then raise exception 'audio gate missing';end if;
  for tok in select player_token from public.igr_v4_players where room_code=qa_code loop perform public.igr_v4_set_audio_ready(qa_code,tok,true);end loop;
  perform public.igr_v4_start_game(qa_code,host);
  for tok in select player_token from public.igr_v4_players where room_code=qa_code loop
   d:=public.igr_v4_sync(qa_code,tok);
   if d#>>'{room,phase}'<>'briefing' or d#>'{player,private_state}'<>'{}'::jsonb or d->>'server_now' is null then raise exception 'briefing contract failed %',sid;end if;
  end loop;
  perform public.igr_v4_advance_phase(qa_code,host);
  for tok in select player_token from public.igr_v4_players where room_code=qa_code loop
   d:=public.igr_v4_sync(qa_code,tok);
   if d#>'{player,private_state}'='{}'::jsonb then raise exception 'empty private card %',sid;end if;
   perform public.igr_v4_ack_role(qa_code,tok);
  end loop;
  if sid='013' and c=6 then
   update public.igr_v4_rooms set phase='annex_procureur',cycle=1,phase_ends_at=now()+interval '10 minutes' where code=out->>'room_code';
   select player_token into proc from public.igr_v4_players where room_code=qa_code and public_role='procureur';
   select id,player_token into target,target_token from public.igr_v4_players where room_code=qa_code and public_role='suspect' limit 1;
   req:=(public.igr_v4_prosecutor_request(qa_code,proc,target)->>'request_id')::bigint;
   d:=public.igr_v4_sync(qa_code,target_token);
   if jsonb_array_length(d->'pending_requests')<>1 then raise exception 'missing prosecutor request';end if;
   perform public.igr_v4_prosecutor_respond(qa_code,target_token,req,false);
   d:=public.igr_v4_sync(qa_code,target_token);
   if jsonb_array_length(d->'pending_requests')<>0 then raise exception 'stale request';end if;
   req:=(public.igr_v4_prosecutor_request(qa_code,proc,target)->>'request_id')::bigint;
   update public.igr_v4_rooms set phase='cycle_debrief' where code=out->>'room_code';
   blocked:=false;
   begin perform public.igr_v4_prosecutor_respond(qa_code,target_token,req,true);exception when others then if sqlerrm='request expired' then blocked:=true;else raise;end if;end;
   if not blocked then raise exception 'expired request accepted';end if;
  end if;
  for i in 1..100 loop
   select status into sid_status from public.igr_v4_rooms where code=qa_code;
   exit when sid_status='finished';
   perform public.igr_v4_advance_phase(qa_code,host);
  end loop;
  if sid_status<>'finished' then raise exception 'game stuck %',sid;end if;
  d:=public.igr_v4_sync(qa_code,tok);
  if d#>'{scenario,truth}' is null or d#>'{scenario,truth}'='null'::jsonb then raise exception 'missing reveal %',sid;end if;
  cases:=cases+1;
 end loop;
end loop;
if cases<20 then raise exception 'missing scenarios';end if;
end $test$;
select 'All scenarios: minimum/maximum players, roles, briefing secrecy, private cards, readiness, prosecutor request and expiry passed' as result;

rollback;

