-- Disposable PostgreSQL 16 integration for MAÎTRE v716.
do $check$
declare
  n integer; ch integer; i integer; room text; host uuid; tok uuid;
  tokens uuid[]; roles text[]; opts text[]; o jsonb; target text; stage text;
  round_n integer; denied boolean; role_index integer; selected text;
begin
  if has_function_privilege('anon','public.igr_heritage_online_decide_v55(text,uuid,text)','execute')
    or has_function_privilege('anon','public.igr_heritage_online_decide_v71(text,uuid,text)','execute')
    or has_function_privilege('authenticated','public.igr_heritage_online_decide_v71(text,uuid,text)','execute')
    then raise exception 'Legacy MAÎTRE owner-only bypass remains executable'; end if;
  if has_table_privilege('anon','public.igr_heritage_online_maitre_votes','select')
    then raise exception 'Anonymous role can read individual MAÎTRE votes'; end if;
  if not (select relrowsecurity from pg_class where oid='public.igr_heritage_online_maitre_votes'::regclass)
    then raise exception 'MAÎTRE ballots have no RLS'; end if;

  for n in 5..7 loop
    for ch in 1..5 loop
      room:='HM'||n||ch;
      roles:=case when ch=3
        then array['avocat','client','associe','enqueteur','juge','procureur','temoin']
        else array['avocat','client','enqueteur','procureur','juge','associe','temoin'] end;
      opts:=public.igr_heritage_online_decisions('maitre',ch);
      tokens:=array[]::uuid[];
      insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,campaign_carry,maitre_angle)
        values (room,'maitre',ch,'{"maitre":{"relationships":{"associe":"aligned"}}}'::jsonb,'Les éléments présentés ne suffisent pas à déduire une culpabilité collective.')
        returning host_token into host;
      for i in 1..n loop
        insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host,role_id)
          values(room,'Joueur '||i,i,i=1,roles[i]) returning player_token into tok;
        tokens:=array_append(tokens,tok);
      end loop;
      denied:=false;
      begin perform public.igr_heritage_online_decide(room,host,opts[1]);
      exception when others then denied:=position('collective ballot required' in sqlerrm)>0;
      end;
      if not denied then raise exception 'Host override succeeded for % at %',n,ch; end if;
      denied:=false;
      begin perform public.igr_heritage_online_vote_maitre(room,gen_random_uuid(),opts[1]);
      exception when others then denied:=position('unauthorized' in sqlerrm)>0;
      end;
      if not denied then raise exception 'Unrecognized token accepted for % at %',n,ch; end if;
      denied:=false;
      begin perform public.igr_heritage_online_vote_maitre(room,tokens[1],'INVALID');
      exception when others then denied:=position('invalid option' in sqlerrm)>0;
      end;
      if not denied then raise exception 'Invalid option accepted for % at %',n,ch; end if;
      -- The same seat cannot create a sixth ballot by repeat voting.
      perform public.igr_heritage_online_vote_maitre(room,tokens[1],opts[1]);
      perform public.igr_heritage_online_vote_maitre(room,tokens[1],opts[2]);
      o:=public.igr_heritage_online_maitre_ballot_status(room,tokens[1]);
      if (o->>'votes_cast')::integer<>1 or o->>'my_vote'<>opts[2]
        then raise exception 'Repeat token counted more than once: %/%',n,ch; end if;
      perform public.igr_heritage_online_vote_maitre(room,tokens[1],opts[1]);
      -- A split without absolute majority must reopen a clean second round.
      for i in 2..n loop
        selected:=case when i<=n/2 then opts[1] when i<=2*(n/2) then opts[2] else opts[3] end;
        o:=public.igr_heritage_online_vote_maitre(room,tokens[i],selected);
      end loop;
      if coalesce((o->>'new_round')::boolean,false)=false
        then raise exception 'No-majority runoff failed: %/%',n,ch; end if;
      select r.stage,r.maitre_vote_round into stage,round_n
        from public.igr_heritage_online_rooms r where r.code=room;
      if stage<>'decision' or round_n<>2 then raise exception 'Runoff state invalid: %/%',n,ch; end if;
      o:=public.igr_heritage_online_maitre_ballot_status(room,tokens[1]);
      if (o->>'votes_cast')::integer<>0 or o->>'my_vote' is not null
        then raise exception 'Runoff did not clear votes: %/%',n,ch; end if;
      o:=public.igr_heritage_online_leave(room,tokens[2]);
      if coalesce((o->>'resume_required')::boolean,false)=false or
        (select count(*) from public.igr_heritage_online_players where room_code=room)<>n
        then raise exception 'Leaving reduced quorum: %/%',n,ch; end if;
      -- Winning group includes all required consents at n=5/6/7.
      for i in 1..n loop
        selected:=case when i<=n/2+1 then opts[1] else opts[2] end;
        o:=public.igr_heritage_online_vote_maitre(room,tokens[i],selected);
        if i<n and coalesce((o->>'decided')::boolean,false)
          then raise exception 'Decision made before all cast: %/%',n,ch; end if;
      end loop;
      if coalesce((o->>'decided')::boolean,false)=false
        then raise exception 'Majority not counted: %/%',n,ch; end if;
      if (select decision_id from public.igr_heritage_online_rooms where code=room)<>opts[1]
        then raise exception 'Wrong winning option: %/%',n,ch; end if;
      denied:=false;
      begin perform public.igr_heritage_online_vote_maitre(room,tokens[n],opts[2]);
      exception when others then denied:=position('ballot closed' in sqlerrm)>0;
      end;
      if not denied then raise exception 'Post-decision vote accepted: %/%',n,ch; end if;
    end loop;
  end loop;

  -- Majority is not sufficient to coerce Client (II), joint defence (III)
  -- or the Lawyer's own career decision (V).
  for ch in 2..5 loop
    if ch=4 then continue; end if;
    room:='HMC'||ch;
    roles:=case when ch=3
      then array['avocat','client','associe','enqueteur','juge']
      else array['avocat','client','enqueteur','procureur','juge'] end;
    opts:=public.igr_heritage_online_decisions('maitre',ch);
    tokens:=array[]::uuid[];
    insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,campaign_carry,maitre_angle)
      values(room,'maitre',ch,'{"maitre":{"relationships":{"associe":"aligned"}}}'::jsonb,'Une stratégie juridique suffisamment circonstanciée.')
      returning host_token into host;
    for i in 1..5 loop
      insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host,role_id)
        values(room,'Joueur '||i,i,i=1,roles[i]) returning player_token into tok;
      tokens:=array_append(tokens,tok);
    end loop;
    target:=case when ch=3 then 'common' else opts[1] end;
    role_index:=case when ch=2 then 2 when ch=3 then 3 else 1 end;
    for i in 1..5 loop
      o:=public.igr_heritage_online_vote_maitre(room,tokens[i],case when i=role_index then (case when ch=3 then opts[1] else opts[2] end) else target end);
    end loop;
    if coalesce((o->>'new_round')::boolean,false)=false or o->>'reason'<>'consent_required'
      then raise exception 'Owner forced by majority: chapter %',ch; end if;
    if (select decision_id from public.igr_heritage_online_rooms where code=room) is not null
      then raise exception 'Forced verdict already saved: chapter %',ch; end if;
    for i in 1..5 loop
      o:=public.igr_heritage_online_vote_maitre(room,tokens[i],target);
    end loop;
    if coalesce((o->>'decided')::boolean,false)=false
      then raise exception 'Consensus still blocked: chapter %',ch; end if;
  end loop;

  insert into public.igr_heritage_online_rooms(code,campaign_id,chapter,campaign_carry,maitre_angle)
    values('HMX3','maitre',3,'{"maitre":{"relationships":{"associe":"broken"}}}'::jsonb,'Conflit procédural établi.')
    returning host_token into host;
  insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,role_id)
    values('HMX3','Avocat',1,'avocat') returning player_token into tok;
  denied:=false;
  begin perform public.igr_heritage_online_vote_maitre('HMX3',tok,'common');
  exception when others then denied:=position('joint defense conflict' in sqlerrm)>0; end;
  if not denied then raise exception 'Broken joint defence accepted'; end if;
end
$check$;
