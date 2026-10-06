begin;
do $test$
declare test_code text:='HT57'||upper(substr(md5(random()::text),1,8)); host uuid:=gen_random_uuid(); lawyer uuid:=gen_random_uuid(); judge uuid:=gen_random_uuid(); data jsonb; denied boolean;
begin
 insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,host_token,maitre_variant) values(test_code,'maitre',3,host,'link');
 insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host,player_token,role_id) values(test_code,'Audit avocat',1,true,lawyer,'avocat'),(test_code,'Audit juge',2,false,judge,'juge');
 perform public.igr_heritage_online_context_v57(test_code,host,'{"id":"maitre","completed":[1,2],"summary":"Conclusion du dossier II","maitre":{"canon":{"variant":"link"},"relationships":{"associe":"broken"},"decisions":{"1":"fiscal_only"}}}'::jsonb);
 select campaign_carry into data from public.igr_heritage_online_rooms where igr_heritage_online_rooms.code=test_code;
 if data#>'{maitre,canon}' is not null then raise exception 'hidden variant leaked'; end if;
 if data#>>'{maitre,relationships,associe}'<>'broken' then raise exception 'context missing'; end if;
 denied:=false;begin perform public.igr_heritage_online_context_v57(test_code,gen_random_uuid(),'{"id":"maitre"}'::jsonb);exception when others then denied:=sqlerrm='unauthorized';end;if not denied then raise exception 'unauthenticated context accepted';end if;
 denied:=false;begin perform public.igr_heritage_online_finish(test_code,host);exception when others then denied:=sqlerrm='decision required';end;if not denied then raise exception 'premature finish accepted';end if;
 update public.igr_heritage_online_rooms set status='playing',stage='play',phase_index=1,maitre_angle='Private preparation',maitre_demonstration='Draft' where igr_heritage_online_rooms.code=test_code;
 data:=public.igr_heritage_online_sync(test_code,judge);if data#>>'{room,maitre_angle}' is not null or data#>>'{room,maitre_variant}' is not null then raise exception 'judge received private preparation';end if;
 data:=public.igr_heritage_online_sync(test_code,lawyer);if data#>>'{room,maitre_angle}'<>'Private preparation' then raise exception 'lawyer draft missing';end if;
 update public.igr_heritage_online_rooms set stage='decision',phase_index=2 where igr_heritage_online_rooms.code=test_code;
 denied:=false;begin perform public.igr_heritage_online_decide(test_code,host,(public.igr_heritage_online_decisions('maitre',3))[1]);exception when others then denied:=sqlerrm='judge only';end;if not denied then raise exception 'host bypass accepted';end if;
 denied:=false;begin perform public.igr_heritage_online_decide_v55(test_code,lawyer,(public.igr_heritage_online_decisions('maitre',3))[1]);exception when others then denied:=sqlerrm='judge only';end;if not denied then raise exception 'lawyer judgement accepted';end if;
 perform public.igr_heritage_online_decide_v55(test_code,judge,(public.igr_heritage_online_decisions('maitre',3))[1]);
 perform public.igr_heritage_online_finish(test_code,host);perform public.igr_heritage_online_finish(test_code,host);
end $test$;
select 'v57 server assertions passed; test data rolled back' as result;
rollback;
