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
    if n=6 then continue; end if;
    room:=case when n=5 then 'HQA05' else 'HQA07' end;
    tokens:=array[]::uuid[];
    insert into public.igr_heritage_online_rooms(code,campaign_id,chapter)
      values (room,'cendres',3) returning host_token into host;
    for i in 1..n loop
      insert into public.igr_heritage_online_players(room_code,pseudo,seat_index,is_host,role_id)
        values(room,'Joueur '||i,i,i=1,case when i=1 then 'chef' else 'terrain' end)
        returning player_token into token;
      tokens:=array_append(tokens,token);
    end loop;

    blocked:=false;
    begin perform public.igr_heritage_online_decide(room,host,'b');
    exception when others then blocked:=position('collective ballot required' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Host bypass accepted: %',n; end if;

    blocked:=false;
    begin perform public.igr_heritage_online_vote_cendres(room,gen_random_uuid(),'b');
    exception when others then blocked:=position('unauthorized' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Token bypass accepted: %',n; end if;

    -- One token cannot double-count votes, though it may edit its choice.
    perform public.igr_heritage_online_vote_cendres(room,tokens[1],'b');
    perform public.igr_heritage_online_vote_cendres(room,tokens[1],'audio');
    out:=public.igr_heritage_online_cendres_ballot_status(room,tokens[1]);
    if (out->>'votes_cast')::integer<>1 or out->>'my_vote'<>'audio'
      then raise exception 'Duplicate token counted: %',n; end if;

    if n=5 then
      perform public.igr_heritage_online_vote_cendres(room,tokens[2],'b');
      perform public.igr_heritage_online_vote_cendres(room,tokens[3],'b');
      perform public.igr_heritage_online_vote_cendres(room,tokens[4],'audio');
      out:=public.igr_heritage_online_vote_cendres(room,tokens[5],'source');
    else
      perform public.igr_heritage_online_vote_cendres(room,tokens[2],'b');
      perform public.igr_heritage_online_vote_cendres(room,tokens[3],'b');
      perform public.igr_heritage_online_vote_cendres(room,tokens[4],'audio');
      perform public.igr_heritage_online_vote_cendres(room,tokens[5],'source');
      perform public.igr_heritage_online_vote_cendres(room,tokens[6],'source');
      out:=public.igr_heritage_online_vote_cendres(room,tokens[7],'source');
    end if;
    if coalesce((out->>'new_round')::boolean,false)=false
      then raise exception 'Runoff required: %',n; end if;
    select r.stage,r.decision_id,r.cendres_vote_round
      into stage,chosen,round_n from public.igr_heritage_online_rooms r where code=room;
    if stage<>'decision' or chosen is not null or round_n<>2
      then raise exception 'Runoff lost: %',n; end if;
    out:=public.igr_heritage_online_cendres_ballot_status(room,tokens[1]);
    if (out->>'votes_cast')::integer<>0 or out->>'my_vote' is not null
      then raise exception 'Runoff not reset: %',n; end if;

    out:=public.igr_heritage_online_leave(room,tokens[2]);
    if coalesce((out->>'resume_required')::boolean,false)=false
      then raise exception 'Live leave was not suspended: %',n; end if;
    if (select count(*) from public.igr_heritage_online_players where room_code=room)<>n
      then raise exception 'Player removed from active ballot: %',n; end if;

    for i in 1..(n/2+1) loop
      out:=public.igr_heritage_online_vote_cendres(room,tokens[i],'b');
    end loop;
    if coalesce((out->>'decided')::boolean,false) then
      raise exception 'Decision released before all players voted: %',n; end if;
    for i in (n/2+2)..n loop
      out:=public.igr_heritage_online_vote_cendres(room,tokens[i],'audio');
    end loop;
    if coalesce((out->>'decided')::boolean,false)=false
      then raise exception 'Majority not reached: %',n; end if;
    select r.stage,r.decision_id into stage,chosen
       from public.igr_heritage_online_rooms r where code=room;
    if stage<>'reveal' or chosen<>'b'
      then raise exception 'Wrong canonical verdict: %',n; end if;

    blocked:=false;
    begin perform public.igr_heritage_online_vote_cendres(room,tokens[n],'audio');
    exception when others then blocked:=position('ballot closed' in sqlerrm)>0;
    end;
    if not blocked then raise exception 'Vote accepted after closure: %',n; end if;
  end loop;

  -- Kuroi retains host-mediated decision authority: no unintended regression.
  insert into public.igr_heritage_online_rooms(code,campaign_id,chapter)
     values ('HQA09','kuroi',3) returning host_token into host;
  perform public.igr_heritage_online_decide('HQA09',host,'police_hand');
  if (select decision_id from public.igr_heritage_online_rooms where code='HQA09')<>'police_hand'
    then raise exception 'KUROI regression'; end if;
end
$check$;
