-- Apply v58 + v59 in the same transaction before this test; roll back all fixtures.
do $test$
declare c text:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));enq uuid;j uuid;jt uuid;reporter uuid;rt uuid;ins uuid;expert uuid;target uuid;host_token uuid;req bigint;map jsonb;bad jsonb;res jsonb;outcome jsonb;pl record;slot int:=0;seat int:=0;rol text;caught boolean;
begin
 insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state) values(c,'014','playing',3,'event_select','{"duration_mode":"short"}') returning igr_v4_rooms.host_token into host_token;
 foreach rol in array array['enqueteur','journaliste','inspecteur','expert','suspect','suspect','suspect','juge'] loop
  seat:=seat+1;if rol='suspect' then slot:=slot+1;end if;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot,is_host) values(c,'V59QA'||seat,seat,rol,rol,case when rol='suspect' then slot else null end,rol='enqueteur');
 end loop;
 select id into enq from public.igr_v4_players where room_code=c and public_role='enqueteur';
 select id,player_token into j,jt from public.igr_v4_players where room_code=c and public_role='juge';
 select id,player_token into reporter,rt from public.igr_v4_players where room_code=c and public_role='journaliste';
 select id into ins from public.igr_v4_players where room_code=c and public_role='inspecteur';select id into expert from public.igr_v4_players where room_code=c and public_role='expert';
 select jsonb_object_agg(p.id::text,sp.pack->'truth'->'levels'->(p.internal_slot-1)) into map from public.igr_v4_players p join public.igr_v4_scenario_packs sp on sp.scenario_id='014' where p.room_code=c and p.public_role='suspect';
 select p.id into target from public.igr_v4_players p where p.room_code=c and p.public_role='suspect' and (map->>p.id::text)::int>0 limit 1;
 assert target is not null,'fixture needs responsible suspect';
 update public.igr_v4_players set private_state=private_state||jsonb_build_object('judge_corrupt',true,'judge_corruption_target_id',target::text) where id=j;
 bad:=jsonb_set(map,array[target::text],to_jsonb((map->>target::text)::int-1));
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,enq,3,'final_lock',jsonb_build_object('levels',map)),(c,j,3,'final_lock',jsonb_build_object('levels',bad)),(c,ins,3,'field','{}'),(c,expert,3,'expert','{}'),(c,reporter,3,'breaking_news','{}');
 res:=public.igr_v52_make_reveal(c);select x into outcome from jsonb_array_elements(res->'results') x where x->>'player_id'=j::text;
 assert (outcome->>'success')::boolean,'corrupt judge protects target and remains undetected';
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,enq,3,'judge_integrity_vote','{"corrupt":true}');
 res:=public.igr_v52_make_reveal(c);assert (res#>>'{judge_integrity,required_yes}')::int=1,'single voter threshold';
 select x into outcome from jsonb_array_elements(res->'results') x where x->>'player_id'=j::text;assert not (outcome->>'success')::boolean,'detected corrupt judge must lose';
 -- An honest judge is evaluated on exact decisions, independent of false accusations.
 update public.igr_v4_players set private_state=jsonb_set(private_state,'{judge_corrupt}','false') where id=j;
 update public.igr_v4_actions set payload=jsonb_build_object('levels',map) where room_code=c and player_id=j and action_type='final_lock';
 res:=public.igr_v52_make_reveal(c);select x into outcome from jsonb_array_elements(res->'results') x where x->>'player_id'=j::text;assert (outcome->>'success')::boolean;
 -- Field/Expert results follow the authority's reading, rather than the investigator's exact map.
 select jsonb_object_agg(key,to_jsonb(case when value::text='0' then 1 else 0 end)) into bad from jsonb_each(map);
 update public.igr_v4_actions set payload=jsonb_build_object('levels',bad) where room_code=c and player_id=j and action_type='final_lock';
 res:=public.igr_v52_make_reveal(c);
 for pl in select value x from jsonb_array_elements(res->'results') where value->>'player_id' in (ins::text,expert::text) loop assert not (pl.x->>'success')::boolean,'authority mismatch must affect field/expert';end loop;
 update public.igr_v4_actions set payload=jsonb_build_object('levels',map) where room_code=c and player_id=j and action_type='final_lock';
 -- Passing a journalist speech must never create a personal final conclusion.
 update public.igr_v4_rooms set phase='final_audience',state=state||jsonb_build_object('v52_stage','audience','v52_index',0,'v52_status','waiting','v52_queue',jsonb_build_array(jsonb_build_object('player_id',reporter::text,'role','journaliste'))) where code=c;
 perform public.igr_v52_stage_action(c,rt,'skip',null);
 assert not exists(select 1 from public.igr_v4_actions where room_code=c and player_id=reporter and action_type='final_lock'),'automatic journalist angle remains';
 update public.igr_v4_rooms set phase='locking',phase_started_at=now(),state=state||'{"v52_final_reassessment":true}'::jsonb where code=c;
 caught:=false;begin perform public.igr_v4_lock_final(c,rt,'{"note":"court"}');exception when others then caught:=sqlerrm='journalist final angle required';end;assert caught;
 perform public.igr_v4_lock_final(c,rt,'{"note":"Les publications appuient une conclusion personnelle prudente."}');
 res:=public.igr_v52_make_reveal(c);select x into outcome from jsonb_array_elements(res->'results') x where x->>'player_id'=reporter::text;assert (outcome->>'success')::boolean,'real angle should count';
 -- Host recovery is authenticated, delayed and limited to the current waiting player.
 update public.igr_v4_rooms set phase='final_audience',phase_started_at=now(),state=state||jsonb_build_object('v52_stage','audience','v52_index',0,'v52_status','waiting','v52_queue',jsonb_build_array(jsonb_build_object('player_id',j::text,'role','juge'))) where code=c;
 caught:=false;begin perform public.igr_v59_host_recover(c,gen_random_uuid(),j,'Connexion indisponible');exception when others then caught:=sqlerrm='forbidden';end;assert caught;
 caught:=false;begin perform public.igr_v59_host_recover(c,host_token,j,'Connexion indisponible');exception when others then caught:=sqlerrm='recovery delay not reached';end;assert caught;
 update public.igr_v4_rooms set phase_started_at=now()-interval '70 seconds' where code=c;
 perform public.igr_v59_host_recover(c,host_token,j,'Connexion indisponible');
 assert exists(select 1 from public.igr_v4_events where room_code=c and event_type='final_absence');
 assert (select state->'v59_absent' ? j::text from public.igr_v4_rooms where code=c);
 -- Locking recovery releases a missing role without inventing that player's decision.
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(c,ins,3,'final_lock',jsonb_build_object('levels',map));
 update public.igr_v4_rooms set phase='locking',phase_started_at=now()-interval '150 seconds',state=state||'{"v52_final_reassessment":true}'::jsonb where code=c;
 perform public.igr_v52_maybe_finish(c);
 assert (select state->'v59_pending' @> jsonb_build_array(jsonb_build_object('player_id',expert::text)) from public.igr_v4_rooms where code=c);
 perform public.igr_v59_host_recover(c,host_token,expert,'Joueur indisponible');
 assert (select status='finished' and phase='reveal' from public.igr_v4_rooms where code=c),'host recovery must unblock reveal';
 assert not exists(select 1 from public.igr_v4_actions where room_code=c and player_id=expert and action_type='final_lock'),'recovery fabricated final decision';
 select payload into res from public.igr_v4_events where room_code=c and event_type='reveal' order by id desc limit 1;
 select x into outcome from jsonb_array_elements(res->'results') x where x->>'player_id'=expert::text;assert not (outcome->>'success')::boolean and (outcome->>'absent')::boolean;
end $test$;
select 'v59 judge integrity, journalist conclusion, authority scoring, authenticated absence recovery and reveal OK' as result;
