-- Test d'intégration de vraies RPC OMERTÀ sur PostgreSQL éphémère.
-- Jamais sur une base Supabase de production.
do $test$
declare
 sc text; code text; i public.igr_v4_players%rowtype; s public.igr_v4_players%rowtype;
 other public.igr_v4_players%rowtype;
 offer jsonb; cards jsonb; sent jsonb; result jsonb; fact text;
 refused boolean; personal boolean; second_ok boolean;
begin
 foreach sc in array array['021','022','023','024','025'] loop
  code:='TEST'||sc;
  insert into public.igr_v4_rooms(code,scenario_id,status,cycle,phase,state)
  values(code,sc,'playing',2,'interrogation','{"match_no":1}'::jsonb);
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role)
  values(code,'Enquêteur',1,'enqueteur','enqueteur') returning * into i;
  insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot,private_state)
  select code,'Source',2,'suspect','associato',1,
   jsonb_build_object('hide',pack->'suspects'->0->>'hide',
                     'chronology',pack->'suspects'->0->>'chronology')
  from public.igr_v4_scenario_packs where scenario_id=sc returning * into s;

  cards:=public.igr_omerta_money_intel_options(code,s.player_token);
  if cards->>'available'<>'false' then raise exception 'pre-recruitment leak in %',sc; end if;
  refused:=false;
  begin perform public.igr_omerta_indic_offer(code,s.player_token,s.id);
  exception when others then refused:=true; end;
  if not refused then raise exception 'suspect authorized as investigator %',sc; end if;

  if sc='024' then
   insert into public.igr_v4_players(room_code,pseudo,seat_index,public_role,secret_role,internal_slot,private_state)
   select code,'Uninformative suspect',3,'suspect','associato',2,
    jsonb_build_object('hide',pack->'suspects'->1->>'hide',
      'chronology',pack->'suspects'->1->>'chronology')
   from public.igr_v4_scenario_packs where scenario_id=sc returning * into other;
   refused:=false;
   begin perform public.igr_omerta_indic_offer(code,i.player_token,other.id);
   exception when others then refused:=true; end;
   if not refused then raise exception 'unwinnable 024 pact authorized'; end if;
  end if;
  offer:=public.igr_omerta_indic_offer(code,i.player_token,s.id);
  if offer->>'ok'<>'true' then raise exception 'recruitment failed %',sc; end if;
  perform public.igr_omerta_indic_respond(code,s.player_token,true);
  cards:=public.igr_omerta_money_intel_options(code,s.player_token);
  if jsonb_array_length(cards->'cards')<>3 then raise exception 'three cards missing in %',sc; end if;
  if cards->'cards'->0->>'eligible'<>'true' then raise exception 'no eligible truth for %',sc; end if;
  fact:=cards->'cards'->0->>'id';
  perform public.igr_omerta_money_intel_signal(code,s.player_token,fact);
  if exists(select 1 from public.igr_v4_actions where room_code=code and action_type='omerta_verified_intel')
  then raise exception 'mere intent credited %',sc; end if;
  sent:=public.igr_omerta_money_intel_send(code,s.player_token,fact);
  if sent->>'ok'<>'true' then raise exception 'send failed %',sc; end if;
  if not exists(select 1 from public.igr_v4_actions
     where room_code=code and player_id=s.id and action_type='omerta_verified_intel'
       and payload->>'truth_verified'='true' and payload->>'fact_id'=fact)
  then raise exception 'verified truth not credited %',sc; end if;
  if not exists(select 1 from public.igr_v4_events
     where room_code=code and event_type='omerta_intel'
       and visibility='private' and target_player_id=i.id)
  then raise exception 'private reception missing %',sc; end if;
  cards:=public.igr_omerta_money_intel_options(code,s.player_token);
  if cards->'cards'->0->>'logged'<>'true' then raise exception 'logged flag missing %',sc; end if;
  refused:=false;
  begin perform public.igr_omerta_money_intel_send(code,s.player_token,fact);
  exception when others then refused:=true; end;
  if not refused then raise exception 'duplicate intel allowed %',sc; end if;

  if sc='022' then
   -- L'ancien niveau de révélation auto-déclaré ne fait plus gagner.
   insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
   values(code,s.id,2,'omerta_reveal','{"level":3,"exposure":42,"cooperation":45,"sentence_reduction":7}');
  elsif sc='023' then
   -- Demande officielle postérieure au pacte + preuve => accord déterministe.
   insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
   values(code,s.id,2,'omerta_protection_request','{}');
  elsif sc='024' then
   perform public.igr_omerta_indic_protect(code,i.player_token,s.id);
  end if;

  result:=public.igr_omerta_make_reveal(code);
  select (v->'indic'->>'personal_condition_met')::boolean,
         (v->'indic'->>'second_condition_met')::boolean
   into personal,second_ok
   from jsonb_array_elements(result->'results') v
   where v->>'player_id'=s.id::text;
  if second_ok is distinct from true then raise exception 'no valid cooperation in %',sc; end if;
  if personal is distinct from (sc in ('023','024')) then
    raise exception 'arbitrary personal victory in % (actual %)',sc,personal;
  end if;
 end loop;
 if has_function_privilege('anon','public.igr_omerta_make_reveal(text)','EXECUTE')
 then raise exception 'privileged reveal callable anonymously'; end if;
end $test$;
select 'five_cases_checked' as test_result;
