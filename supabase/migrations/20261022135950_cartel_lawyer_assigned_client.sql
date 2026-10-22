-- The cartel appoints its lawyer's only official client at the start of a match.
-- Selection follows character priority, never player seat, guilt or a hidden variant.
-- 029 has four witnesses and no lawyer; its other optional roles are preserved.
do $roster029$
declare definition text; anchor text; replacement text; start_at integer; end_at integer;
begin
 definition:=pg_get_functiondef('public.igr_v4_role_capacity(text,integer,text)'::regprocedure);
 anchor:=' if p_scenario=''029'' and igr_private.igr_v108_029_is_enabled() then';
 start_at:=position(anchor in definition);
 if start_at=0 then raise exception '029 capacity branch missing'; end if;
 end_at:=position(E'\n end if;' in substring(definition from start_at));
 if end_at=0 then raise exception '029 capacity branch end missing'; end if;
 replacement:=$capacity$ if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
  case (case when r='avocat' then 'maitre' else r end)
    when 'enqueteur' then return 1;
    when 'analyste' then return 1;
    when 'suspect' then return 4;
    when 'procureur' then return case when p_count>=7 then 1 else 0 end;
    when 'juge' then return case when p_count>=8 then 1 else 0 end;
    when 'journaliste' then return case when p_count>=9 then 1 else 0 end;
    when 'don' then return case when p_count>=10 then 1 else 0 end;
    when 'bras_droit' then return case when p_count>=11 then 1 else 0 end;
    when 'maitre' then return 0;
    else return 0;
  end case;
 end if;$capacity$;
 execute overlay(definition placing replacement from start_at for end_at+length(E'\n end if;')-1);

 definition:=pg_get_functiondef('public.igr_v4_role_for_seat(text,integer,integer)'::regprocedure);
 anchor:='array[''enqueteur'',''analyste'',''suspect'',''suspect'',''suspect'',''suspect'',''maitre'',''procureur'',''juge'',''journaliste'',''don'',''bras_droit'']';
 if position(anchor in definition)=0 then raise exception '029 seat roster missing'; end if;
 definition:=replace(definition,anchor,'array[''enqueteur'',''analyste'',''suspect'',''suspect'',''suspect'',''suspect'',''procureur'',''juge'',''journaliste'',''don'',''bras_droit'']');
 definition:=replace(definition,'p_count not between 6 and 12','p_count not between 6 and 11');
 definition:=replace(definition,'four witness roster requires 6 to 12 participants','four witness roster requires 6 to 11 participants');
 execute definition;

 definition:=pg_get_functiondef('public.igr_v4_max_players(text)'::regprocedure);
 anchor:='when p_scenario=''029'' and igr_private.igr_v108_029_is_enabled() then 12';
 if position(anchor in definition)=0 then raise exception '029 player limit missing'; end if;
 execute replace(definition,anchor,'when p_scenario=''029'' and igr_private.igr_v108_029_is_enabled() then 11');
end $roster029$;

create or replace function igr_private.igr_v169_cartel_client_slot(p_scenario text)
returns integer language sql immutable set search_path='' as $slot$
 select case p_scenario when '030' then 1 when '031' then 3 end
$slot$;
revoke all on function igr_private.igr_v169_cartel_client_slot(text) from public,anon,authenticated;

create or replace function igr_private.igr_v169_assign_cartel_lawyer(p_code text)
returns void language plpgsql security definer set search_path='' as $assign$
declare
 r public.igr_v4_rooms%rowtype;
 counsel public.igr_v4_players%rowtype;
 client public.igr_v4_players%rowtype;
 n integer; match_id integer;
begin
 select * into r from public.igr_v4_rooms where code=p_code for update;
 if not found or r.scenario_id not in ('030','031') then return; end if;
 if r.status<>'playing' then raise exception 'cartel mandate requires a started match'; end if;

 -- This helper is called only by the authenticated start RPC, after all story
 -- triggers. A rematch must not inherit requests or a previous representation.
 delete from public.igr_v43_lawyer_representations where room_code=r.code;
 delete from public.igr_v44_lawyer_consultations where room_code=r.code;
 delete from public.igr_v43_lawyer_requests where room_code=r.code;
 delete from public.igr_v45_lawyer_dismissals where room_code=r.code;
 select count(*) into n from public.igr_v4_players where room_code=r.code and public_role='maitre';
 if n=0 then return; end if;
 if n<>1 then raise exception 'cartel mandate requires one lawyer'; end if;
 select * into counsel from public.igr_v4_players where room_code=r.code and public_role='maitre';
 select * into client from public.igr_v4_players
 where room_code=r.code and public_role='suspect'
   and internal_slot=igr_private.igr_v169_cartel_client_slot(r.scenario_id);
 if not found then raise exception 'cartel priority client missing'; end if;
 match_id:=greatest(1,coalesce((r.state->>'match_no')::integer,1));

 insert into public.igr_v43_lawyer_representations(room_code,lawyer_id,client_id)
 values(r.code,counsel.id,client.id);
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||jsonb_build_object(
  'cartel_mandate',jsonb_build_object('mode','cartel_priority','locked',true,'match_no',match_id,
    'client_id',client.id::text,'client_pseudo',client.pseudo)
 ) where id=counsel.id;
 update public.igr_v4_players set private_state=coalesce(private_state,'{}'::jsonb)||jsonb_build_object(
  'cartel_mandate',jsonb_build_object('mode','cartel_priority','locked',true,'match_no',match_id,
    'lawyer_id',counsel.id::text,'lawyer_pseudo',counsel.pseudo)
 ) where id=client.id;
 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values
 (r.code,'cartel_lawyer_assignment','private',counsel.id,jsonb_build_object(
   'title','MANDAT DU CARTEL','text','Los Salcedo t’assigne la défense de '||client.pseudo||'. Ce mandat est fixé pour cette partie. Les autres suspects peuvent te parler librement.',
   'client_id',client.id::text,'match_no',match_id)),
 (r.code,'cartel_lawyer_assignment','private',client.id,jsonb_build_object(
   'title','AVOCAT DU CARTEL','text',counsel.pseudo||' est ton avocat officiel, désigné par Los Salcedo pour cette partie.',
   'lawyer_id',counsel.id::text,'match_no',match_id));
end $assign$;
revoke all on function igr_private.igr_v169_assign_cartel_lawyer(text) from public,anon,authenticated;

-- Patch the installed functions without copying private story manuscripts or
-- replacing changes made by other scenario releases.
do $hooks$
declare definition text; anchor text; addition text;
begin
 definition:=pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure);
 anchor:='  return jsonb_build_object(''ok'', true, ''auto_assigned_roles'', auto_assigned);';
 if position('perform igr_private.igr_v169_assign_cartel_lawyer(r.code);' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'start RPC hook missing'; end if;
  execute replace(definition,anchor,'  perform igr_private.igr_v169_assign_cartel_lawyer(r.code);'||E'\n'||anchor);
 end if;

 -- The lawyer receives a mandate, not the client's hidden acts or cartel plans.
 definition:=pg_get_functiondef('public.igr_v43_lawyer_brief(uuid)'::regprocedure);
 anchor:='  card:=coalesce(s.private_state,''{}''::jsonb);';
 if position('cartel mandate does not disclose private facts' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'lawyer brief hook missing'; end if;
  addition:=$body$  -- cartel mandate does not disclose private facts
  if exists(select 1 from public.igr_v4_rooms r where r.code=s.room_code and r.scenario_id in ('030','031')) then
    return 'Le mandat de Los Salcedo ne révèle aucun fait privé sur cette personne. Obtiens tes informations dans les échanges et les éléments auxquels tu as accès.';
  end if;
$body$;
  execute replace(definition,anchor,addition||anchor);
 end if;

 definition:=pg_get_functiondef('public.igr_v43_lawyer_state(text,uuid)'::regprocedure);
 anchor:='''version'',''v43'',';
 if position('''assignment_mode''' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'lawyer state hook missing'; end if;
  addition:=$body$'version','v43',
      'assignment_mode',case when r.scenario_id in ('030','031') then 'cartel_priority' else 'request' end,
      'mandate_locked',r.scenario_id in ('030','031'),$body$;
  execute replace(definition,anchor,addition);
 end if;

 definition:=pg_get_functiondef('public.igr_v45_lawyer_state(text,uuid)'::regprocedure);
 anchor:='''can_dismiss'',me.public_role=''suspect'' and represented and not used,';
 if position('and not coalesce((base->>''mandate_locked'')::boolean,false)' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'dismissal state hook missing'; end if;
  execute replace(definition,anchor,'''can_dismiss'',me.public_role=''suspect'' and represented and not used and not coalesce((base->>''mandate_locked'')::boolean,false),');
 end if;

 definition:=pg_get_functiondef('public.igr_v45_dismiss_lawyer(text,uuid)'::regprocedure);
 anchor:='  if not found or r.status<>''playing'' then raise exception ''game unavailable''; end if;';
 if position('cartel mandate is fixed' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'dismissal RPC hook missing'; end if;
  execute replace(definition,anchor,anchor||E'\n'||'  if r.scenario_id in (''030'',''031'') then raise exception ''cartel mandate is fixed''; end if;');
 end if;
end $hooks$;

do $cards$
declare row_record record; notes jsonb;
begin
 update public.igr_v4_scenario_packs set pack=pack#-'{role_notes,maitre}',updated_at=now() where scenario_id='029';
 for row_record in select scenario_id,pack from public.igr_v4_scenario_packs where scenario_id in ('030','031') loop
  notes:=coalesce(row_record.pack#>'{role_notes,maitre}','{}'::jsonb)||jsonb_build_object(
   'anchors','Los Salcedo t’assigne dès le début un seul client officiel, choisi selon sa priorité pour le cartel. Ce mandat reste fixé pendant toute la partie. Tu peux discuter librement avec les autres suspects. Ton mandat ne te donne aucun accès à leurs fiches privées ni aux preuves réservées au bureau.',
   'hide','Tu ignores les intentions cachées des narcos. Ton mandat ne te révèle ni les secrets de ton client ni ceux des autres suspects. Tes arrangements et ta stratégie de négociation restent à ta discrétion.'
  );
  if row_record.scenario_id='031' then
   notes:=notes||jsonb_build_object('chronology','Los Salcedo te mandate et te paie pour défendre le suspect qu’il te désigne parmi les trois arrêtés. Tu négocies pour ton client et pour les intérêts du cartel. Tu ignores les intentions cachées des narcos ; tu dois obtenir tes informations pendant la partie.');
  end if;
  update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{role_notes,maitre}',notes,true),updated_at=now()
  where scenario_id=row_record.scenario_id;
 end loop;
end $cards$;

-- Real starts, private delivery and RPC checks. Every fixture is rolled back.
do $qa$
declare
 sc text; n integer; seat integer; mode text; code_id text; host uuid;
 counsel public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype;
 actor record; response jsonb; expected integer; tested integer:=0;
 blocked boolean; rematches integer:=0;
begin
 begin
  foreach sc in array array['029','030','031'] loop
   for n in public.igr_v4_min_players(sc)..public.igr_v4_max_players(sc) loop
    foreach mode in array array['short','long'] loop
     loop
      code_id:='ZM'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
      exit when not exists(select 1 from public.igr_v4_rooms where code=code_id);
     end loop;
     insert into public.igr_v4_rooms(code,scenario_id,state)
     values(code_id,sc,jsonb_build_object('duration_mode',mode)) returning host_token into host;
     for seat in 0..n-1 loop
      insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
      values(code_id,'QA mandat '||seat,seat,seat=0);
     end loop;
     if sc='029' and n=6 and mode='short' then
      update public.igr_v4_players set preferred_role='maitre' where room_code=code_id and seat_index=0;
      blocked:=false;
      begin perform public.igr_v4_start_game(code_id,host);
      exception when others then blocked:=true; end;
      if not blocked then raise exception '029 accepted a forbidden lawyer preference'; end if;
      update public.igr_v4_players set preferred_role=null where room_code=code_id;
     end if;
     perform public.igr_v4_start_game(code_id,host);
     tested:=tested+1;
     expected:=case when sc='029' or sc='030' and n=7 then 0 else 1 end;
     if sc='029' then
      if (select count(*) from public.igr_v4_players where room_code=code_id and public_role='suspect')<>4
        or exists(select 1 from public.igr_v4_players where room_code=code_id and public_role='maitre')
        or public.igr_v4_role_capacity(sc,n,'maitre')<>0 or public.igr_v4_role_capacity(sc,n,'avocat')<>0
        or public.igr_v4_max_players(sc)<>11 then raise exception '029 must have four witnesses and no lawyer'; end if;
     end if;
     if (select count(*) from public.igr_v43_lawyer_representations where room_code=code_id)<>expected then
      raise exception 'automatic representation count mismatch: %/%/%',sc,n,mode;
     end if;
     if sc='030' and (select count(*) from public.igr_v4_players where room_code=code_id and secret_role='espion')<>(case when n=9 then 2 else 1 end) then
      raise exception '030 mole assignment changed';
     end if;
     if expected=1 then
      select * into counsel from public.igr_v4_players where room_code=code_id and public_role='maitre';
      select * into client from public.igr_v4_players where room_code=code_id and public_role='suspect'
       and internal_slot=igr_private.igr_v169_cartel_client_slot(sc);
      if not exists(select 1 from public.igr_v43_lawyer_representations where room_code=code_id and lawyer_id=counsel.id and client_id=client.id) then
       raise exception 'wrong character priority: %/%',sc,n;
      end if;
      if exists(select 1 from public.igr_v43_lawyer_requests where room_code=code_id) then
       raise exception 'automatic mandate must not require a request';
      end if;
      response:=public.igr_v43_lawyer_state(code_id,counsel.player_token);
      if response->>'has_client' is distinct from 'true' or response#>>'{client,id}' is distinct from client.id::text or response->>'mandate_locked' is distinct from 'true' then
       raise exception 'lawyer does not see assigned client';
      end if;
      update public.igr_v4_players set private_state=private_state||jsonb_build_object('hide','QA_HIDDEN_CARTEL_INTENTIONS') where room_code=code_id and public_role='suspect';
      response:=public.igr_v43_lawyer_state(code_id,counsel.player_token);
      if response::text like '%QA_HIDDEN_CARTEL_INTENTIONS%' or response#>>'{client,brief}' not like '%ne révèle aucun fait privé%' then
       raise exception 'private facts leaked through lawyer brief';
      end if;
      response:=public.igr_v45_lawyer_state(code_id,client.player_token);
      if response->>'represented' is distinct from 'true' or response->>'can_dismiss' is distinct from 'false' or response->>'can_request' is distinct from 'false' then
       raise exception 'assigned client state incorrect';
      end if;
      blocked:=false;
      begin perform public.igr_v45_dismiss_lawyer(code_id,client.player_token);
      exception when others then blocked:=true; end;
      if not blocked or exists(select 1 from public.igr_v45_lawyer_dismissals where room_code=code_id) then
       raise exception 'fixed cartel mandate could be dismissed';
      end if;
      for actor in select * from public.igr_v4_players where room_code=code_id loop
       response:=public.igr_v4_sync(code_id,actor.player_token);
       if exists(select 1 from jsonb_array_elements(coalesce(response->'players','[]'::jsonb)) p where p ? 'private_state') then
        raise exception 'another player private card leaked';
       end if;
       if actor.public_role not in ('maitre','suspect') then
        response:=public.igr_v43_lawyer_state(code_id,actor.player_token);
        if response ? 'client' or response ? 'suspects' then raise exception 'mandate details leaked to bureau'; end if;
       elsif actor.public_role='suspect' and actor.id<>client.id then
        response:=public.igr_v43_lawyer_state(code_id,actor.player_token);
        if response->>'represented' is distinct from 'false' or response->>'can_request' is distinct from 'false' then raise exception 'second client allowed'; end if;
        blocked:=false;
        begin perform public.igr_v43_request_lawyer(code_id,actor.player_token);
        exception when others then blocked:=true; end;
        if not blocked then raise exception 'non-client obtained a request'; end if;
        blocked:=false;
        begin perform public.igr_v43_accept_lawyer(code_id,counsel.player_token,actor.id);
        exception when others then blocked:=true; end;
        if not blocked then raise exception 'lawyer could switch clients'; end if;
       end if;
      end loop;
      blocked:=false;
      begin perform public.igr_v43_lawyer_state(code_id,gen_random_uuid());
      exception when others then blocked:=true; end;
      if not blocked then raise exception 'unauthenticated lawyer state accessible'; end if;

      if n=public.igr_v4_max_players(sc) and mode='short' then
       update public.igr_v4_rooms set status='lobby',state=jsonb_build_object('match_no',2,'duration_mode',mode) where code=code_id;
       perform public.igr_v4_start_game(code_id,host);
       tested:=tested+1; rematches:=rematches+1;
       if (select count(*) from public.igr_v43_lawyer_representations where room_code=code_id)<>1 or not exists(
        select 1 from public.igr_v43_lawyer_representations rep join public.igr_v4_players p on p.id=rep.client_id
        where rep.room_code=code_id and p.internal_slot=igr_private.igr_v169_cartel_client_slot(sc)
       ) then raise exception 'rematch retained previous assignment'; end if;
      end if;
     end if;
    end loop;
   end loop;
  end loop;

  -- The original request/accept system remains available outside these dossiers.
  loop
   code_id:='ZM'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
   exit when not exists(select 1 from public.igr_v4_rooms where code=code_id);
  end loop;
  insert into public.igr_v4_rooms(code,scenario_id) values(code_id,'016') returning host_token into host;
  for seat in 0..5 loop
   insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host) values(code_id,'QA classique '||seat,seat,seat=0);
  end loop;
  perform public.igr_v4_start_game(code_id,host); tested:=tested+1;
  select * into counsel from public.igr_v4_players where room_code=code_id and public_role='maitre';
  select * into client from public.igr_v4_players where room_code=code_id and public_role='suspect' order by internal_slot limit 1;
  perform public.igr_v43_request_lawyer(code_id,client.player_token);
  perform public.igr_v43_accept_lawyer(code_id,counsel.player_token,client.id);
  response:=public.igr_v45_lawyer_state(code_id,client.player_token);
  if response->>'represented' is distinct from 'true' or response->>'can_dismiss' is distinct from 'true' or response->>'mandate_locked' is distinct from 'false' then
   raise exception 'ordinary lawyer rules changed';
  end if;
  raise exception using errcode='ZX169',message='rollback lawyer QA fixtures';
 exception when sqlstate 'ZX169' then null;
 end;
 if tested<>27 or rematches<>2 then raise exception 'incomplete automatic lawyer QA: % starts, % rematches',tested,rematches; end if;
 raise notice 'Cartel lawyer verified: % starts, including % rematches; all QA fixtures rolled back.',tested,rematches;
end $qa$;
