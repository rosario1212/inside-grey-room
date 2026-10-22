-- Either party may end a current representation during play. The initial cartel
-- appointment remains character-based; only a lawyer's own voluntary withdrawal
-- from a 030/031 mandate creates the permanent personal defeat.
drop trigger if exists igr_v45_block_rehire_after_dismissal_trg on public.igr_v43_lawyer_requests;

create or replace function igr_private.igr_v170_end_representation(
 p_code text,p_player_token uuid,p_peer_id uuid,p_acknowledge_cartel boolean
) returns jsonb language plpgsql set search_path='' as $end_relation$
declare
 me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype;
 rep public.igr_v43_lawyer_representations%rowtype;
 counsel public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype;
 reason text; penalty boolean; history jsonb; room_state jsonb; queue jsonb; key_name text;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or me.public_role not in ('suspect','maitre') then raise exception 'forbidden'; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code for update;
 if not found or r.status<>'playing' then raise exception 'game unavailable'; end if;
 select * into rep from public.igr_v43_lawyer_representations
 where room_code=r.code and (case when me.public_role='maitre' then lawyer_id=me.id else client_id=me.id end)
 for update;
 if not found then return jsonb_build_object('ok',true,'status','already_ended'); end if;
 if p_peer_id is not null and p_peer_id<>(case when me.public_role='maitre' then rep.client_id else rep.lawyer_id end) then
  raise exception 'representation changed; refresh before deciding';
 end if;
 select * into counsel from public.igr_v4_players where id=rep.lawyer_id and room_code=r.code;
 select * into client from public.igr_v4_players where id=rep.client_id and room_code=r.code;
 reason:=case when me.public_role='maitre' then 'lawyer_withdrew' else 'client_dismissed' end;
 penalty:=me.public_role='maitre' and r.scenario_id in ('030','031');
 if penalty and not coalesce(p_acknowledge_cartel,false) then
  raise exception 'confirm personal defeat and cartel family execution before withdrawing';
 end if;

 -- Ending a mandate is allowed even during an activity. Resume a paused
 -- interrogation and remove cached counsel permissions without ending its turn.
 if exists(select 1 from public.igr_v44_lawyer_consultations c where c.room_code=r.code
   and c.suspect_id=client.id and c.lawyer_id=counsel.id and c.status in ('pending','active')) then
  perform public.igr_v44_end_lawyer_consultation(r.code,p_player_token,client.id);
 end if;
 delete from public.igr_v43_lawyer_representations
 where room_code=r.code and lawyer_id=counsel.id and client_id=client.id;
 update public.igr_v43_lawyer_requests set status='closed',decided_at=coalesce(decided_at,now())
 where room_code=r.code and suspect_id=client.id and status in ('pending','accepted');

 history:=jsonb_build_object('reason',reason,'initiated_by',me.id::text,'ended_at',now());
 update public.igr_v4_players set private_state=jsonb_set(coalesce(private_state,'{}'::jsonb),'{cartel_mandate,locked}','false',true)
   ||jsonb_build_object('lawyer_relation_end',history||jsonb_build_object('peer_id',client.id::text,'peer_pseudo',client.pseudo))
 where id=counsel.id;
 update public.igr_v4_players set private_state=jsonb_set(coalesce(private_state,'{}'::jsonb),'{cartel_mandate,locked}','false',true)
   ||jsonb_build_object('lawyer_relation_end',history||jsonb_build_object('peer_id',counsel.id::text,'peer_pseudo',counsel.pseudo))
 where id=client.id;
 if penalty then
  update public.igr_v4_players set private_state=private_state||jsonb_build_object(
    'lawyer_cartel_forfeit',true,'lawyer_family_fate','execution_ordered') where id=counsel.id;
 end if;

 select state into room_state from public.igr_v4_rooms where code=r.code;
 foreach key_name in array array['v52_queue','defense_queue'] loop
  if jsonb_typeof(room_state->key_name)='array' then
   select coalesce(jsonb_agg(case when (value->>'player_id'=client.id::text or value->>'id'=client.id::text)
     and value->>'lawyer_id'=counsel.id::text then value||jsonb_build_object('lawyer_id',null,'lawyer_pseudo',null) else value end order by ord),'[]'::jsonb)
   into queue from jsonb_array_elements(room_state->key_name) with ordinality as q(value,ord);
   room_state:=jsonb_set(room_state,array[key_name],queue,true);
  end if;
 end loop;
 if coalesce(room_state->'event_participants','[]'::jsonb) ? client.id::text then
  room_state:=jsonb_set(room_state,'{event_participants}',coalesce(room_state->'event_participants','[]'::jsonb)-counsel.id::text,true);
 end if;
 update public.igr_v4_rooms set state=room_state,updated_at=now() where code=r.code;

 insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload) values
 (r.code,'lawyer_dismissal','private',client.id,jsonb_build_object('title','REPRÉSENTATION TERMINÉE',
  'text',case when reason='client_dismissed' then 'Tu as renvoyé '||counsel.pseudo||'.' else counsel.pseudo||' a cessé de te représenter.' end,
  'reason',reason,'lawyer_id',counsel.id::text)),
 (r.code,'lawyer_dismissal','private',counsel.id,jsonb_build_object('title','REPRÉSENTATION TERMINÉE',
  'text',(case when reason='client_dismissed' then client.pseudo||' t’a renvoyé.' else 'Tu as cessé de représenter '||client.pseudo||'.' end)
   ||case when penalty then ' Le cartel est informé de ton abandon du mandat. Tu perds personnellement la partie ; le cartel fera tuer ta famille au dénouement.' else '' end,
  'reason',reason,'client_id',client.id::text));
 return jsonb_build_object('ok',true,'status','ended','reason',reason,'cartel_forfeit',penalty);
end $end_relation$;
revoke all on function igr_private.igr_v170_end_representation(text,uuid,uuid,boolean) from public,anon,authenticated;

create or replace function public.igr_v170_end_representation(
 p_code text,p_player_token uuid,p_peer_id uuid,p_acknowledge_cartel boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $rpc$
begin
 if p_peer_id is null then raise exception 'representation partner required'; end if;
 return igr_private.igr_v170_end_representation(p_code,p_player_token,p_peer_id,p_acknowledge_cartel);
end $rpc$;
revoke all on function public.igr_v170_end_representation(text,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.igr_v170_end_representation(text,uuid,uuid,boolean) to anon,service_role;

-- Keep the old suspect RPC compatible with an already-open client.
create or replace function public.igr_v45_dismiss_lawyer(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $legacy$
begin return igr_private.igr_v170_end_representation(p_code,p_player_token,null,false); end $legacy$;

create or replace function public.igr_v45_lawyer_state(p_code text,p_player_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $state$
declare me public.igr_v4_players%rowtype; r public.igr_v4_rooms%rowtype; base jsonb; active boolean; previous jsonb;
begin
 select * into me from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found then raise exception 'unauthorized'; end if;
 base:=public.igr_v43_lawyer_state(p_code,p_player_token);
 if me.public_role not in ('suspect','maitre') then return base; end if;
 select * into r from public.igr_v4_rooms where code=me.room_code;
 active:=r.status='playing' and case when me.public_role='maitre' then coalesce((base->>'has_client')::boolean,false) else coalesce((base->>'represented')::boolean,false) end;
 previous:=me.private_state->'lawyer_relation_end';
 return base||jsonb_build_object('version','v170','dismissal_used',false,
  'can_dismiss',active and me.public_role='suspect','can_withdraw',active and me.public_role='maitre',
  'can_end_representation',active,'last_termination',previous,
  'cartel_penalty_on_withdraw',me.public_role='maitre' and r.scenario_id in ('030','031'),
  'cartel_forfeit',me.public_role='maitre' and coalesce((me.private_state->>'lawyer_cartel_forfeit')::boolean,false),
  'former_lawyer',case when me.public_role='suspect' and previous is not null then jsonb_build_object('id',previous->>'peer_id','pseudo',previous->>'peer_pseudo') else null end);
end $state$;

do $hooks$
declare definition text; anchor text; addition text;
begin
 -- A new match clears relations before cards are rebuilt, for every dossier.
 definition:=pg_get_functiondef('public.igr_v4_start_game(text,uuid)'::regprocedure);
 anchor:='  if r.status <> ''lobby'' then raise exception ''already started''; end if;';
 if position('v170 relation reset' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'start reset hook missing'; end if;
  addition:=$body$
  -- v170 relation reset
  delete from public.igr_v43_lawyer_representations where room_code=r.code;
  delete from public.igr_v43_lawyer_requests where room_code=r.code;
  delete from public.igr_v44_lawyer_consultations where room_code=r.code;
  delete from public.igr_v45_lawyer_dismissals where room_code=r.code;
$body$;
  execute replace(definition,anchor,anchor||addition);
 end if;

 definition:=pg_get_functiondef('public.igr_v43_lawyer_state(text,uuid)'::regprocedure);
 definition:=replace(definition,'''mandate_locked'',r.scenario_id in (''030'',''031'')','''mandate_locked'',false');
 anchor:='    can_request:=lawyer_count>0';
 if position('v170 reserved cartel client' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'request state hook missing'; end if;
  execute replace(definition,anchor,anchor||E'\n'||'      -- v170 reserved cartel client'||E'\n'||'      and r.status=''playing'' and (r.scenario_id not in (''030'',''031'') or me.internal_slot=igr_private.igr_v169_cartel_client_slot(r.scenario_id))');
 else execute definition;
 end if;

 definition:=pg_get_functiondef('public.igr_v43_request_lawyer(text,uuid)'::regprocedure);
 anchor:='  if not found then raise exception ''room not found''; end if;';
 if position('v170 reserved cartel client' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'request RPC hook missing'; end if;
  addition:=$body$
  -- v170 reserved cartel client
  if r.status<>'playing' then raise exception 'game unavailable'; end if;
  if r.scenario_id in ('030','031') and me.internal_slot<>igr_private.igr_v169_cartel_client_slot(r.scenario_id) then
    raise exception 'cartel mandate reserved for assigned client';
  end if;
$body$;
  execute replace(definition,anchor,anchor||addition);
 end if;

 definition:=pg_get_functiondef('public.igr_v43_accept_lawyer(text,uuid,uuid)'::regprocedure);
 anchor:='  if not found then raise exception ''invalid suspect''; end if;';
 if position('v170 reserved cartel client' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'accept RPC hook missing'; end if;
  addition:=$body$
  -- v170 reserved cartel client
  if r.status<>'playing' then raise exception 'game unavailable'; end if;
  if r.scenario_id in ('030','031') and s.internal_slot<>igr_private.igr_v169_cartel_client_slot(r.scenario_id) then
    raise exception 'cartel mandate reserved for assigned client';
  end if;
$body$;
  execute replace(definition,anchor,anchor||addition);
 end if;

 definition:=pg_get_functiondef('igr_private.igr_v169_assign_cartel_lawyer(text)'::regprocedure);
 definition:=replace(definition,'''locked'',true','''locked'',false');
 definition:=replace(definition,'Ce mandat est fixé pour cette partie. Les autres suspects peuvent te parler librement.',
  'Tu peux cesser de le représenter, mais cet abandon te fait perdre personnellement la partie et le cartel fera tuer ta famille au dénouement. Les autres suspects peuvent te parler librement.');
 execute definition;

 -- Apply the penalty after spy and role objectives, before winners are counted.
 definition:=pg_get_functiondef('public.igr_v52_make_reveal(text)'::regprocedure);
 anchor:='    if not coalesce((it->>''success'')::boolean,false) then';
 if position('v170 cartel withdrawal forfeits personal victory' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'final result hook missing'; end if;
  addition:=$body$    -- v170 cartel withdrawal forfeits personal victory
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      it:=it||jsonb_build_object('success',false,'personal_objective_success',false,
        'forfeited',true,'family_fate','killed','achievements','[]'::jsonb,
        'text','Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Informé de ton abandon, le cartel a fait tuer ta famille.');
      if it ? 'victories' then it:=jsonb_set(it,'{victories,personal}','false'::jsonb,true); end if;
    end if;

$body$;
  execute replace(definition,anchor,addition||anchor);
 end if;

 definition:=pg_get_functiondef('public.igr_v4_make_reveal(text)'::regprocedure);
 anchor:=E'    if success then\n      winners := winners || jsonb_build_array(p.id);';
 if position('v170 cartel withdrawal result' in definition)=0 then
  if position(anchor in definition)=0 then raise exception 'base result hook missing'; end if;
  addition:=$body$    -- v170 cartel withdrawal result
    if p.public_role='maitre' and r.scenario_id in ('030','031')
      and coalesce((p.private_state->>'lawyer_cartel_forfeit')::boolean,false) then
      success:=false; achievements:='[]'::jsonb;
      result_text:='Tu as abandonné le mandat du cartel. Tu perds personnellement la partie. Le cartel a fait tuer ta famille.';
    end if;

$body$;
  execute replace(definition,anchor,addition||anchor);
 end if;
end $hooks$;

do $rules$
declare row_record record; notes jsonb; rule_text text;
begin
 for row_record in select scenario_id,pack from public.igr_v4_scenario_packs where scenario_id<>'029' loop
  if row_record.scenario_id not in ('030','031') and row_record.pack#>'{role_notes,maitre}' is null then continue; end if;
  notes:=coalesce(row_record.pack#>'{role_notes,maitre}','{}'::jsonb);
  rule_text:=case when row_record.scenario_id in ('030','031') then
   'Los Salcedo t’assigne son suspect le plus haut placé dès le début. Ton client peut te renvoyer. Si tu abandonnes toi-même son mandat, tu perds personnellement la partie et le cartel fera tuer ta famille au dénouement. Tu peux parler librement aux autres suspects. Ton mandat ne révèle aucun secret.'
   else 'Ton client peut te renvoyer et tu peux cesser de le représenter pendant la partie. Une nouvelle représentation exige une nouvelle demande et ton acceptation. Un seul client officiel à la fois.' end;
  if row_record.scenario_id in ('030','031') then notes:=notes||jsonb_build_object('anchors',rule_text);
  else notes:=notes||jsonb_build_object('anchors',concat_ws(E'\n\n',rule_text,
   replace(notes->>'anchors','Une fois accepté, ce client reste rattaché à lui pour toute l’affaire et l’Avocat l’accompagne lors des procédures officielles qui le concernent.',
    'L’Avocat accompagne son client dans les procédures officielles tant que la représentation est active.'))); end if;
  update public.igr_v4_scenario_packs set pack=jsonb_set(pack,'{role_notes,maitre}',notes,true),updated_at=now()
  where scenario_id=row_record.scenario_id;
 end loop;
 update public.igr_v4_players p set private_state=p.private_state||jsonb_build_object('anchors',
  'Ton client peut te renvoyer et tu peux cesser de le représenter pendant la partie.'||
  case when r.scenario_id in ('030','031') then ' Si tu abandonnes toi-même le mandat de Los Salcedo, tu perds personnellement la partie et le cartel fera tuer ta famille au dénouement.' else '' end
  ||E'\n\n'||case when r.scenario_id in ('030','031') then 'Los Salcedo t’assigne son suspect le plus haut placé dès le début. Ton mandat ne révèle aucun secret du cartel.' else
    replace(coalesce(p.private_state->>'anchors',''),'Une fois accepté, ce client reste rattaché à lui pour toute l’affaire et l’Avocat l’accompagne lors des procédures officielles qui le concernent.',
     'L’Avocat accompagne son client dans les procédures officielles tant que la représentation est active.') end)
 from public.igr_v4_rooms r where p.room_code=r.code and r.status='playing' and p.public_role='maitre';
end $rules$;

-- Exercise real starts and RPCs in every dossier that distributes a lawyer.
-- Fixtures, including their private events and endings, are rolled back together.
do $qa$
declare
 sc text; n integer; seat integer; code_id text; host uuid; phase_name text;
 counsel public.igr_v4_players%rowtype; client public.igr_v4_players%rowtype;
 other_counsel public.igr_v4_players%rowtype; other_client public.igr_v4_players%rowtype;
 actor public.igr_v4_players%rowtype; response jsonb; result_item jsonb;
 blocked boolean; cartel boolean; own_withdrawal boolean; ended integer:=0; starts integer:=0;
 has_forfeit boolean; room_state jsonb; deadline timestamptz; i integer;
begin
 begin
  for sc in select p.scenario_id from public.igr_v4_scenario_packs p where exists(
   select 1 from generate_series(0,public.igr_v4_max_players(p.scenario_id)-1) s(seat)
   where public.igr_v4_role_for_seat(p.scenario_id,s.seat,public.igr_v4_max_players(p.scenario_id))='maitre'
  ) order by p.scenario_id loop
   cartel:=sc in ('030','031'); has_forfeit:=false;
   n:=public.igr_v4_max_players(sc);
   loop
    code_id:='ZQ'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
    exit when not exists(select 1 from public.igr_v4_rooms where code=code_id);
   end loop;
   insert into public.igr_v4_rooms(code,scenario_id,state)
   values(code_id,sc,jsonb_build_object('duration_mode','short')) returning host_token into host;
   for seat in 0..n-1 loop
    insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
    values(code_id,'QA rupture '||seat,seat,seat=0);
   end loop;
   perform public.igr_v4_start_game(code_id,host); starts:=starts+1;
   select * into counsel from public.igr_v4_players where room_code=code_id and public_role='maitre' order by seat_index limit 1;
   select * into client from public.igr_v4_players where room_code=code_id and public_role='suspect'
    and (not cartel or internal_slot=igr_private.igr_v169_cartel_client_slot(sc)) order by internal_slot limit 1;
   if counsel.id is null or client.id is null then raise exception 'QA distribution missing for %',sc; end if;
   if not cartel then
    perform public.igr_v43_request_lawyer(code_id,client.player_token);
    perform public.igr_v43_accept_lawyer(code_id,counsel.player_token,client.id);
   end if;
   select * into other_counsel from public.igr_v4_players where room_code=code_id and public_role='maitre' and id<>counsel.id limit 1;
   if other_counsel.id is not null then
    select * into other_client from public.igr_v4_players where room_code=code_id and public_role='suspect' and id<>client.id order by internal_slot limit 1;
    perform public.igr_v43_request_lawyer(code_id,other_client.player_token);
    perform public.igr_v43_accept_lawyer(code_id,other_counsel.player_token,other_client.id);
   end if;
   select * into actor from public.igr_v4_players where room_code=code_id and public_role='enqueteur' limit 1;
   blocked:=false;
   begin perform public.igr_v170_end_representation(code_id,actor.player_token,counsel.id,true);
   exception when others then blocked:=true; end;
   if not blocked then raise exception 'bureau can terminate a mandate'; end if;
   blocked:=false;
   begin perform public.igr_v170_end_representation(code_id,gen_random_uuid(),counsel.id,true);
   exception when others then blocked:=true; end;
   if not blocked then raise exception 'invalid token can terminate a mandate'; end if;
   blocked:=false;
   begin perform public.igr_v170_end_representation(code_id,client.player_token,gen_random_uuid(),true);
   exception when others then blocked:=true; end;
   if not blocked then raise exception 'stale partner can terminate a different mandate'; end if;

   for i in 1..4 loop
    phase_name:=(array['briefing','interrogation','final_suspect_defenses','locking'])[i];
    own_withdrawal:=i in (2,4);
    update public.igr_v4_rooms set phase=phase_name,cycle=least(i,3),phase_ends_at=now()+interval '90 seconds',
     state=state||jsonb_build_object('current_target',client.id::text,
      'v52_queue',jsonb_build_array(jsonb_build_object('player_id',client.id::text,'lawyer_id',counsel.id::text,'lawyer_pseudo',counsel.pseudo)),
      'defense_queue',jsonb_build_array(jsonb_build_object('id',client.id::text,'lawyer_id',counsel.id::text)),
      'event_participants',jsonb_build_array(client.id::text,counsel.id::text)) where code=code_id;
    if i=2 then
     insert into public.igr_v44_lawyer_consultations(room_code,suspect_id,lawyer_id,cycle,status,remaining_seconds,ends_at)
     values(code_id,client.id,counsel.id,2,'active',42,now()+interval '60 seconds');
     update public.igr_v4_rooms set phase_ends_at=null,state=state||jsonb_build_object(
      'lawyer_consultation_suspect',client.id::text,'lawyer_consultation_remaining',42) where code=code_id;
    end if;
    response:=public.igr_v45_lawyer_state(code_id,client.player_token);
    if response->>'can_dismiss' is distinct from 'true' then raise exception 'client cannot dismiss during %/%',sc,phase_name; end if;
    response:=public.igr_v45_lawyer_state(code_id,counsel.player_token);
    if response->>'can_withdraw' is distinct from 'true' or response->>'mandate_locked' is distinct from 'false' then
     raise exception 'lawyer cannot withdraw during %/%',sc,phase_name;
    end if;
    if own_withdrawal and cartel then
     blocked:=false;
     begin perform public.igr_v170_end_representation(code_id,counsel.player_token,client.id,false);
     exception when others then blocked:=true; end;
     if not blocked then raise exception 'cartel withdrawal needs explicit acknowledgement'; end if;
     blocked:=false;
     begin perform public.igr_v45_dismiss_lawyer(code_id,counsel.player_token);
     exception when others then blocked:=true; end;
     if not blocked then raise exception 'legacy RPC bypasses cartel acknowledgement'; end if;
    end if;
    response:=public.igr_v170_end_representation(code_id,
     case when own_withdrawal then counsel.player_token else client.player_token end,
     case when own_withdrawal then client.id else counsel.id end,true);
    ended:=ended+1; has_forfeit:=has_forfeit or (own_withdrawal and cartel);
    if response->>'status'<>'ended' or exists(select 1 from public.igr_v43_lawyer_representations where room_code=code_id and lawyer_id=counsel.id) then
     raise exception 'representation survived ending %/%',sc,phase_name;
    end if;
    if other_counsel.id is not null and not exists(select 1 from public.igr_v43_lawyer_representations
     where room_code=code_id and lawyer_id=other_counsel.id and client_id=other_client.id) then raise exception 'unrelated representation was ended'; end if;
    response:=public.igr_v45_lawyer_state(code_id,counsel.player_token);
    if coalesce((response->>'cartel_forfeit')::boolean,false)<>has_forfeit then raise exception 'wrong cartel penalty for %/%',sc,phase_name; end if;
    if response->>'has_client' is distinct from 'false' then raise exception 'ended client still returned'; end if;
    response:=public.igr_v45_lawyer_state(code_id,client.player_token);
    if response->>'represented' is distinct from 'false' or response->>'can_request' is distinct from 'true' then raise exception 'client cannot request again %/%',sc,phase_name; end if;
    select state,phase_ends_at into room_state,deadline from public.igr_v4_rooms where code=code_id;
    if room_state#>>'{v52_queue,0,lawyer_id}' is not null or room_state#>>'{defense_queue,0,lawyer_id}' is not null
      or room_state->'event_participants' ? counsel.id::text or room_state#>>'{v52_queue,0,player_id}'<>client.id::text then
     raise exception 'former counsel kept turn access';
    end if;
    if i=2 and (room_state ? 'lawyer_consultation_suspect' or deadline is distinct from now()+interval '42 seconds'
     or not exists(select 1 from public.igr_v44_lawyer_consultations where room_code=code_id and suspect_id=client.id and status='completed')) then
     raise exception 'interrogation timer not resumed correctly';
    end if;
    -- A repeated button press cannot create a sanction after a client dismissal.
    response:=public.igr_v170_end_representation(code_id,counsel.player_token,client.id,true);
    if response->>'status'<>'already_ended' then raise exception 'ending is not idempotent'; end if;
    response:=public.igr_v45_lawyer_state(code_id,counsel.player_token);
    if coalesce((response->>'cartel_forfeit')::boolean,false)<>has_forfeit then raise exception 'client dismissal caused cartel penalty'; end if;
    if cartel then
     select * into actor from public.igr_v4_players where room_code=code_id and public_role='suspect' and id<>client.id limit 1;
     blocked:=false;
     begin perform public.igr_v43_request_lawyer(code_id,actor.player_token);
     exception when others then blocked:=true; end;
     if not blocked then raise exception 'another suspect obtained the cartel mandate'; end if;
    end if;
    perform public.igr_v43_request_lawyer(code_id,client.player_token);
    perform public.igr_v43_accept_lawyer(code_id,counsel.player_token,client.id);
    response:=public.igr_v45_lawyer_state(code_id,counsel.player_token);
    if response->>'has_client' is distinct from 'true' or coalesce((response->>'cartel_forfeit')::boolean,false)<>has_forfeit then
     raise exception 'rehire failed or erased permanent defeat';
    end if;
   end loop;
   if cartel then
    -- A mole victory must never override voluntary withdrawal either.
    update public.igr_v4_players set secret_role='espion' where id=counsel.id;
    response:=public.igr_v52_make_reveal(code_id);
    select value into result_item from jsonb_array_elements(response->'results') where value->>'player_id'=counsel.id::text;
    if result_item->>'success' is distinct from 'false' or result_item->>'family_fate' is distinct from 'killed'
     or result_item->>'forfeited' is distinct from 'true' or response->'winners' ? counsel.id::text then
     raise exception 'cartel defeat missing from final result: %',sc;
    end if;
   end if;
   if exists(select 1 from public.igr_v4_events where room_code=code_id and event_type='lawyer_dismissal'
    and (visibility<>'private' or target_player_id not in (client.id,counsel.id))) then raise exception 'private termination event leaked'; end if;
   response:=public.igr_v4_sync(code_id,client.player_token);
   if exists(select 1 from jsonb_array_elements(response->'players') p where p ? 'private_state') then raise exception 'private state leaked in roster'; end if;
   update public.igr_v4_rooms set status='finished' where code=code_id;
   blocked:=false;
   begin perform public.igr_v170_end_representation(code_id,client.player_token,counsel.id,true);
   exception when others then blocked:=true; end;
   if not blocked then raise exception 'ended match can mutate mandate'; end if;
   update public.igr_v4_rooms set status='lobby',state=jsonb_build_object('match_no',2,'duration_mode','short') where code=code_id;
   perform public.igr_v4_start_game(code_id,host); starts:=starts+1;
   if exists(select 1 from public.igr_v4_players where room_code=code_id and (private_state ? 'lawyer_cartel_forfeit' or private_state ? 'lawyer_relation_end'))
    or (select count(*) from public.igr_v43_lawyer_representations where room_code=code_id)<>(case when cartel then 1 else 0 end)
    or exists(select 1 from public.igr_v43_lawyer_requests where room_code=code_id)
    or exists(select 1 from public.igr_v44_lawyer_consultations where room_code=code_id) then raise exception 'new match retained old representation or penalty'; end if;
  end loop;
  if public.igr_v4_role_capacity('029',11,'maitre')<>0 then raise exception '029 regained a lawyer'; end if;
  if not has_function_privilege('anon','public.igr_v170_end_representation(text,uuid,uuid,boolean)','execute')
   or has_function_privilege('anon','igr_private.igr_v170_end_representation(text,uuid,uuid,boolean)','execute') then raise exception 'incorrect helper/RPC access'; end if;
  raise exception using errcode='ZX170',message='rollback mutual termination QA fixtures';
 exception when sqlstate 'ZX170' then null;
 end;
 if starts<>20 or ended<>40 then raise exception 'incomplete termination QA: % starts, % endings',starts,ended; end if;
 raise notice 'Mutual lawyer termination verified: % starts/rematches, % terminations in ten dossiers; all fixtures rolled back.',starts,ended;
end $qa$;
