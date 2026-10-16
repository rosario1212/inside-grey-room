-- Run after the v79 migration, inside BEGIN / ROLLBACK. All fixtures disappear.
do $test$
declare
  c text:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  j uuid; proc uuid; other uuid; jt uuid; pt uuid; ot uuid; journalist_token uuid;
  test_phase text; test_outcome text; caught boolean; result jsonb;
  profile uuid:=gen_random_uuid(); token text:=gen_random_uuid()::text;
  test_code text; variant text; campaign text;
begin
  insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase)
    values(c,'015','playing',1,'event_negociation');
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
    values(c,'Audit Judge',1,'juge','juge') returning id,player_token into j,jt;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
    values(c,'Audit Prosecutor',2,'procureur','procureur') returning id,player_token into proc,pt;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
    values(c,'Audit Analyst',3,'analyste','analyste') returning id,player_token into other,ot;
  caught:=false;
  begin perform public.igr_v13_record_judicial_outcome(c,gen_random_uuid(),'accepted');
    exception when others then caught:=sqlerrm='unauthorized'; end;
  assert caught,'unknown token authorized';
  foreach test_phase in array array['event_negociation','event_requete','event_saisine'] loop
    update public.igr_v4_rooms set phase=test_phase where code=c;
    caught:=false;
    begin perform public.igr_v13_record_judicial_outcome(c,ot,'accepted');
      exception when others then caught:=sqlerrm='forbidden'; end;
    assert caught,'non-judicial role authorized';
    caught:=false;
    begin perform public.igr_v13_record_judicial_outcome(c,case when test_phase='event_negociation' then jt else pt end,'accepted');
      exception when others then caught:=sqlerrm='forbidden'; end;
    assert caught,'wrong judicial role authorized';
    caught:=false;
    begin perform public.igr_v13_record_judicial_outcome(c,case when test_phase='event_negociation' then pt else jt end,null);
      exception when others then caught:=sqlerrm='invalid outcome'; end;
    assert caught,'NULL outcome accepted';
    test_outcome:=case when test_phase='event_requete' then 'refused' else 'accepted' end;
    result:=public.igr_v13_record_judicial_outcome(c,case when test_phase='event_negociation' then pt else jt end,test_outcome,repeat('x',220));
    assert result->>'ok'='true';
    assert (select payload->>'outcome'=test_outcome and length(payload->>'note')=180 from public.igr_v4_actions where room_code=c and action_type='v13_outcome_'||test_phase),'wrong stored decision';
    caught:=false;
    begin perform public.igr_v13_record_judicial_outcome(c,case when test_phase='event_negociation' then pt else jt end,'refused');
      exception when others then caught:=sqlerrm='already submitted'; end;
    assert caught,'duplicate decision accepted';
  end loop;
  update public.igr_v4_rooms set phase='locking' where code=c;
  caught:=false;
  begin perform public.igr_v13_record_judicial_outcome(c,jt,'accepted');
    exception when others then caught:=sqlerrm='wrong phase'; end;
  assert caught,'decision accepted outside an event';
  update public.igr_v4_rooms set phase='event_requete',status='finished' where code=c;
  caught:=false;
  begin perform public.igr_v13_record_judicial_outcome(c,jt,'accepted');
    exception when others then caught:=sqlerrm='wrong phase'; end;
  assert caught,'decision accepted in finished room';

  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
    values(c,'Audit Journalist',4,'journaliste','journaliste') returning player_token into journalist_token;
  update public.igr_v4_rooms set phase='annex_journaliste',status='playing' where code=c;
  result:=public.igr_v50_journalist_investigate(c,journalist_token,'j1');
  assert result->>'ok'='true' and length(result->>'result')>0,'Press investigation has no result';
  assert (select payload->>'lead'='j1' and jsonb_typeof(payload->'lead')='string' and length(payload->>'result')>0 from public.igr_v4_actions where room_code=c and action_type='journalist_investigation'),'journalist result/history contract broken';
  caught:=false;
  begin perform public.igr_v50_journalist_investigate(c,journalist_token,'j1');
    exception when others then caught:=sqlerrm='already investigated'; end;
  assert caught,'duplicate press investigation accepted';
  update public.igr_v4_rooms set phase='event_enquete_croisee' where code=c;
  result:=public.igr_v50_journalist_investigate(c,journalist_token,'j2');
  assert result->>'ok'='true','cross investigation cannot use Press';

  insert into public.igr_social_profiles(id,token_hash,friend_code,pseudo)
    values(profile,encode(extensions.digest(token,'sha256'),'hex'),replace(profile::text,'-',''),'Audit Host');
  insert into public.igr_dlc_entitlements(profile_id,dlc_key,access_level) values(profile,'heritage','tester');
  caught:=false;
  begin perform public.igr_heritage_online_create('HZZZZ','maitre',1,'Audit Host',profile,token);
    exception when others then caught:=sqlerrm like 'maitre variant required%'; end;
  assert caught,'generic creation silently accepted NULL MAÎTRE variant';
  foreach variant in array array['fiscal','blind','link'] loop
    loop
      test_code:='H'||translate(upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)),'01','YZ');
      exit when not exists(select 1 from public.igr_heritage_online_rooms where igr_heritage_online_rooms.code=test_code)
        and not exists(select 1 from public.igr_v4_rooms where igr_v4_rooms.code=test_code);
    end loop;
    result:=public.igr_heritage_online_create_maitre(test_code,1,'Audit Host',profile,token,variant);
    assert (select maitre_variant=variant from public.igr_heritage_online_rooms where igr_heritage_online_rooms.code=test_code),'canonical variant lost';
    caught:=false;
    begin insert into public.igr_heritage_online_players(room_code,pseudo,seat_index) values(test_code,'audit host',1);
      exception when unique_violation then caught:=true; end;
    assert caught,'case-insensitive nickname uniqueness lost';
  end loop;
  caught:=false;
  begin perform public.igr_heritage_online_create_maitre('HZZZY',1,'Audit Host',profile,token,null);
    exception when others then caught:=sqlerrm='invalid maitre variant'; end;
  assert caught,'dedicated endpoint accepted NULL variant';
  foreach campaign in array array['cendres','kuroi'] loop
    loop
      test_code:='H'||translate(upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)),'01','YZ');
      exit when not exists(select 1 from public.igr_heritage_online_rooms where igr_heritage_online_rooms.code=test_code)
        and not exists(select 1 from public.igr_v4_rooms where igr_v4_rooms.code=test_code);
    end loop;
    result:=public.igr_heritage_online_create(test_code,campaign,1,'Audit Host',profile,token);
    assert result->>'campaign_id'=campaign,'CENDRES/KUROI creation regressed';
  end loop;
end $test$;
do $permissions$
begin
  assert has_function_privilege('anon','public.igr_v13_record_judicial_outcome(text,uuid,text,text)','execute');
  assert has_function_privilege('service_role','public.igr_v13_record_judicial_outcome(text,uuid,text,text)','execute');
  assert not has_function_privilege('authenticated','public.igr_v13_record_judicial_outcome(text,uuid,text,text)','execute');
  assert not exists(select 1 from pg_class where relnamespace='public'::regnamespace and relname='igr_heritage_online_players_room_pseudo_ci_uidx');
end $permissions$;
select 'v79 judicial decisions, denied actions, canonical variants, generic campaigns and uniqueness OK' as result;
