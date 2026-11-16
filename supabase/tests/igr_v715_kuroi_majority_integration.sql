-- CENDRES ballot integration, runs against disposable PG fixture.
do $check$
declare
  n integer;
  room text;
  host uuid;
  token uuid;
  tokens uuid[];
  i integer;
  out jsonb;
  stage text;
  chosen text;
  round_n integer;
  blocked boolean;
begin
  for n in 5..7 loop
    room:=case when n=5 then 'HQA05' when n=6 then 'HQA06' else 'HQA07' end;
    tokens:=array[]::uuid[];
    insert into public.igr_heritage_online_rooms(code,campaign_id,chapter)
      values (room,'kuroi',1) returning host_token into host;
    for i in 1..n loop
      insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host,role_id)
        values(room,'Joueur '||i,i,i=1,case when i=1 then 'waka_k' else 'kobun_k' end)
        returning player_token into token;
      tokens:=array_append(tokens,token);
    end loop;

    blocked:=false;
    begin perform public.igr_heritage_online_decide(room,host,'police_hand');
    exception when others then blocked:=position('collective ballot required' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Host bypass accepted: %',n; end if;

    blocked:=false;
    begin perform public.igr_heritage_online_vote_kuroi(room,gen_random_uuid(),'police_hand');
    exception when others then blocked:=position('unauthorized' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Token bypass accepted: %',n; end if;

    -- One token cannot double-count votes, though it may edit its choice.
    perform public.igr_heritage_online_vote_kuroi(room,tokens[1],'police_hand');
    perform public.igr_heritage_online_vote_kuroi(room,tokens[1],'arakida');
    out:=public.igr_heritage_online_kuroi_ballot_status(room,tokens[1]);
    if (out->>'votes_cast')::integer<>1 or out->>'my_vote'<>'arakida'
      then raise exception 'Duplicate token counted: %',n; end if;

    if n=5 then
      perform public.igr_heritage_online_vote_kuroi(room,tokens[2],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[3],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[4],'arakida');
      out:=public.igr_heritage_online_vote_kuroi(room,tokens[5],'internal');
    elsif n=6 then
      perform public.igr_heritage_online_vote_kuroi(room,tokens[2],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[3],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[4],'arakida');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[5],'internal');
      out:=public.igr_heritage_online_vote_kuroi(room,tokens[6],'internal');
    else
      perform public.igr_heritage_online_vote_kuroi(room,tokens[2],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[3],'police_hand');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[4],'arakida');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[5],'internal');
      perform public.igr_heritage_online_vote_kuroi(room,tokens[6],'internal');
      out:=public.igr_heritage_online_vote_kuroi(room,tokens[7],'internal');
    end if;
    if coalesce((out->>'new_round')::boolean,false)=false
      then raise exception 'Runoff required: %',n; end if;
    select r.stage,r.decision_id,r.kuroi_vote_round
      into stage,chosen,round_n from public.igr_heritage_online_rooms r where code=room;
    if stage<>'decision' or chosen is not null or round_n<>2
      then raise exception 'Runoff lost: %',n; end if;
    out:=public.igr_heritage_online_kuroi_ballot_status(room,tokens[1]);
    if (out->>'votes_cast')::integer<>0 or out->>'my_vote' is not null
      then raise exception 'Runoff not reset: %',n; end if;

    out:=public.igr_heritage_online_leave(room,tokens[2]);
    if coalesce((out->>'resume_required')::boolean,false)=false
      then raise exception 'Live leave was not suspended: %',n; end if;
    if (select count(*) from public.igr_heritage_online_players where room_code=room)<>n
      then raise exception 'Player removed from active ballot: %',n; end if;

    for i in 1..(n/2+1) loop
      out:=public.igr_heritage_online_vote_kuroi(room,tokens[i],'police_hand');
    end loop;
    if coalesce((out->>'decided')::boolean,false) then
      raise exception 'Decision released before all players voted: %',n; end if;
    for i in (n/2+2)..n loop
      out:=public.igr_heritage_online_vote_kuroi(room,tokens[i],'arakida');
    end loop;
    if coalesce((out->>'decided')::boolean,false)=false
      then raise exception 'Majority not reached: %',n; end if;
    select r.stage,r.decision_id into stage,chosen
       from public.igr_heritage_online_rooms r where code=room;
    if stage<>'reveal' or chosen<>'police_hand'
      then raise exception 'Wrong canonical verdict: %',n; end if;

    blocked:=false;
    begin perform public.igr_heritage_online_vote_kuroi(room,tokens[n],'arakida');
    exception when others then blocked:=position('ballot closed' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Vote accepted after closure: %',n; end if;
  end loop;


  -- Legacy CENDRES is still protected after the KUROI migration.
  insert into public.igr_heritage_online_rooms(code,campaign_id,chapter)
    values ('HQA08','cendres',3) returning host_token into host;
  blocked:=false;
  begin perform public.igr_heritage_online_decide('HQA08',host,'b');
  exception when others then blocked:=position('collective ballot required' in sqlerrm)>0;
  end;
  if not blocked then raise exception 'CENDRES host bypass was restored'; end if;
  if has_table_privilege('anon','public.igr_heritage_online_kuroi_votes','select')
    then raise exception 'KUROI ballots are directly readable by anon'; end if;
end
$check$;
