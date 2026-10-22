-- Author request: a cartel-employed lawyer in CARTEL 029, 030 and 031.
-- Public role description only; no private branch, culprit or solution is embedded.
-- Four witnesses and all former optional roles remain available on 029.
CREATE OR REPLACE FUNCTION public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
  case (case when r='avocat' then 'maitre' else r end)
    when 'enqueteur' then return 1;
    when 'analyste' then return 1;
    when 'suspect' then return 4;
    when 'procureur' then return case when p_count>=8 then 1 else 0 end;
    when 'juge' then return case when p_count>=9 then 1 else 0 end;
    when 'journaliste' then return case when p_count>=10 then 1 else 0 end;
    when 'don' then return case when p_count>=11 then 1 else 0 end;
    when 'bras_droit' then return case when p_count>=12 then 1 else 0 end;
    when 'maitre' then return case when p_count>=7 then 1 else 0 end;
    else return 0;
  end case;
 end if;
 if r='avocat' then r:='maitre'; end if;
 if r='enqueteur' then return 1;
 elsif r='analyste' then return case when p_scenario in ('001','003','004','005','006') and p_count=4 then 0 else 1 end;
 elsif r='suspect' then return case when p_scenario='002' then 4 when p_scenario='020' then 4 else 3 end;
 elsif r='procureur' then return case
   when p_scenario in ('017','019','020','027','030','032','034') then 1
   when p_scenario='013' and p_count>=6 then 1 when p_scenario='026' and p_count>=7 then 1 when p_scenario='028' and p_count>=8 then 1
   when p_scenario in ('029','031','033') and p_count>=7 then 1 else 0 end;
 elsif r='juge' then return case
   when p_scenario in ('019','020','030','033','034') then 1
   when p_scenario='032' and p_count>=7 then 1
   when p_scenario='014' and p_count>=6 then 1 when p_scenario='015' and p_count>=7 then 1 when p_scenario='016' and p_count>=8 then 1 else 0 end;
 elsif r='journaliste' then return case
   when p_scenario='019' then 1 when p_scenario='020' then case when p_count>=15 then 2 else 1 end
   when p_scenario='015' and p_count>=6 then 1 when p_scenario='016' and p_count>=7 then 1
   when p_scenario='030' and p_count>=9 then 1 when p_scenario='034' and p_count>=9 then 1 else 0 end;
 elsif r='maitre' then return case
   when p_scenario='019' then 1
   when p_scenario='020' then case when p_count>=14 then 2 else 1 end
   when p_scenario='016' and p_count>=6 then 1
   when p_scenario='029' then case when p_count>=8 then 2 when p_count>=6 then 1 else 0 end
   when p_scenario='030' and p_count>=8 then 1
   when p_scenario='031' and p_count>=6 then 1
   else 0 end;
 elsif r='inspecteur' then return case when p_scenario in ('018','020','027') then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
 elsif r='expert' then return case when p_scenario in ('020','026','028') then 1 when p_scenario='027' and p_count>=8 then 1 else 0 end;
 elsif r='temoin' then return case
   when p_scenario='017' then case when p_count>=8 then 2 else 1 end
   when p_scenario='020' then case when p_count>=16 then 2 else 1 end
   when p_scenario='031' and p_count>=8 then 1
   when p_scenario='032' and p_count>=8 then 1
   when p_scenario='033' and p_count>=8 then 1
   when p_scenario='034' and p_count>=8 then 1
   else 0 end;
 end if;
 return 0;
end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 12 then raise exception 'four witness roster requires 6 to 12 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','maitre','procureur','juge','journaliste','don','bras_droit'])[p_seat+1];
 end if;
 if p_scenario between '035' and '039' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario between '040' and '044' then
   return (array['enqueteur','analyste','maitre','suspect','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='026' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='027' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','inspecteur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','inspecteur','expert','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='028' then
   if p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','expert','inspecteur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','expert','inspecteur','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='029' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','maitre','procureur','maitre','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='030' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','maitre','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','maitre','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='031' then
   if p_count=6 then return (array['enqueteur','analyste','maitre','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','maitre','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','maitre','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='032' then
   if p_count=6 then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='033' then
   if p_count=6 then return (array['enqueteur','analyste','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','juge','procureur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','juge','procureur','temoin','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='034' then
   if p_count=7 then return (array['enqueteur','analyste','procureur','juge','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=8 then return (array['enqueteur','analyste','procureur','juge','temoin','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','procureur','juge','temoin','journaliste','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','003','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario in ('007','008','009','010','011','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$;

CREATE OR REPLACE FUNCTION public.igr_v4_max_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 12
 when p_scenario between '035' and '039' then 7
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 8
 when p_scenario='026' then 7 when p_scenario='027' then 8 when p_scenario='028' then 8
 when p_scenario='029' then 8 when p_scenario='030' then 9 when p_scenario='031' then 8
 when p_scenario='032' then 8 when p_scenario='033' then 8 when p_scenario='034' then 9
 when p_scenario in ('001','003','004','005','006') then 5
 when p_scenario='002' then 6
 when p_scenario in ('007','008','009','010','011','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 8
 when p_scenario='017' then 8 when p_scenario='018' then 6 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$;

do $cards$
declare item record; notes jsonb; common jsonb;
begin
 common:=jsonb_build_object(
  'place','Tu es l’avocat attitré du cartel Los Salcedo. Le cartel te mandate et te paie pour défendre ses intérêts dans cette affaire. Tu interviens comme défenseur extérieur à la Grey Room.',
  'hide','Tes arrangements avec le cartel et ta stratégie de négociation restent à ta discrétion. Tu ne connais pas automatiquement les secrets de tes interlocuteurs.',
  'anchors','Tu peux négocier, exploiter les contradictions et défendre une version favorable à ton client. Un seul client officiel peut te désigner ; les autres peuvent échanger avec toi dans les limites ordinaires du rôle. Ton employeur ne te donne aucun accès aux fiches privées ni aux preuves réservées au bureau.',
  'position','Ton tempérament et ta manière de parler t’appartiennent : charmeur, extravagant, froid, nerveux ou provocateur. Tu peux évoquer un avocat de combines à la Saul Goodman sans copier sa personnalité. Tes choix restent libres ; les faits, les preuves et les pouvoirs du rôle restent ceux du jeu.'
 );
 for item in select scenario_id,pack from public.igr_v4_scenario_packs where scenario_id in ('029','030','031') loop
  notes:=coalesce(item.pack#>'{role_notes,maitre}','{}'::jsonb)||common;
  notes:=notes||jsonb_build_object('chronology',case item.scenario_id
   when '029' then 'Les témoins arrivés dans la Grey Room menacent les intérêts de Los Salcedo. Le cartel t’envoie pour suivre leurs déclarations, contester les accusations fragiles et négocier ce qui peut l’être. Ton mandat ne te révèle ni leurs secrets ni la vérité complète de l’affaire.'
   when '030' then 'Après le massacre du gouverneur, Los Salcedo te mandate pour défendre les assaillants arrêtés. Ton objectif est de négocier la meilleure issue pour ton client et de limiter les conséquences pour le cartel. Tu dois obtenir tes informations dans les échanges et les éléments auxquels ton rôle a accès.'
   else 'Los Salcedo te mandate pour défendre les trois suspects arrêtés. Tu cherches à obtenir leur sortie et à préserver ta propre sécurité. Tu peux discuter avec les trois, tout en conservant un seul client officiel ; ton mandat ne te donne pas connaissance de toute l’opération.'
   end);
  update public.igr_v4_scenario_packs
   set pack=jsonb_set(pack,'{role_notes}',coalesce(pack->'role_notes','{}'::jsonb)||jsonb_build_object('maitre',notes),true),updated_at=now()
   where scenario_id=item.scenario_id;
 end loop;
 if (select count(*) from public.igr_v4_scenario_packs where scenario_id in ('029','030','031') and pack#>>'{role_notes,maitre,place}' like '%avocat attitré du cartel Los Salcedo%')<>3 then
  raise exception 'Cartel lawyer cards missing';
 end if;
end $cards$;

-- Extend the existing private 029 ending without embedding its private manuscript.
-- The lawyer needs an accepted mandate and a cartel chain left unestablished.
do $lawyer_ending$
declare definition text; anchor text:='  elsif p.public_role=''journaliste'' then'; addition text;
begin
 definition:=pg_get_functiondef('igr_private.igr_v120_029_make_reveal(text)'::regprocedure);
 if position('elsif p.public_role=''maitre'' then' in definition)=0 then
  if position(anchor in definition)=0 then raise exception '029 ending anchor missing'; end if;
  addition:=$body$  elsif p.public_role='maitre' then
    won:=not branch_ok and exists(
      select 1 from public.igr_v43_lawyer_representations rep
      where rep.room_code=r.code and rep.lawyer_id=p.id
    );
    explanation:=case when won then
      'Tu as obtenu un mandat officiel et la chaîne de responsabilité du cartel reste non établie.'
      else 'Ton objectif exigeait un mandat officiel et une chaîne de responsabilité du cartel restée non établie.' end;
$body$;
  execute replace(definition,anchor,addition||anchor);
 end if;
end $lawyer_ending$;

-- Exercise real role assignment, private card delivery and representation.
-- The exception subtransaction removes every fixture, including events/actions.
do $qa$
declare sc text; n int; seat int; mode text; code_id text; host uuid;
 actor record; lawyer record; client record; response jsonb; ending jsonb;
 expected int; cap record; tested int:=0; lawyer_won boolean;
begin
 begin
  foreach sc in array array['029','030','031'] loop
   for n in public.igr_v4_min_players(sc)..public.igr_v4_max_players(sc) loop
    foreach mode in array array['short','long'] loop
     loop
      code_id:='ZL'||substr(translate(upper(md5(gen_random_uuid()::text)),'01','AB'),1,3);
      exit when not exists(select 1 from public.igr_v4_rooms where code=code_id);
     end loop;
     insert into public.igr_v4_rooms(code,scenario_id,state)
      values(code_id,sc,jsonb_build_object('duration_mode',mode)) returning host_token into host;
     for seat in 0..n-1 loop
      insert into public.igr_v4_players(room_code,pseudo,seat_index,is_host)
       values(code_id,'QA avocat '||seat,seat,seat=0);
     end loop;
     perform public.igr_v4_start_game(code_id,host);
     tested:=tested+1;
     expected:=case when sc='029' and n=6 or sc='030' and n=7 then 0 else 1 end;
     if (select count(*) from public.igr_v4_players where room_code=code_id and public_role='maitre')<>expected then
      raise exception 'lawyer count mismatch %/%',sc,n;
     end if;
     for cap in select public_role,count(*) as actual from public.igr_v4_players where room_code=code_id group by public_role loop
      if public.igr_v4_role_capacity(sc,n,cap.public_role)<>cap.actual then
       raise exception 'role capacity mismatch %/%/%',sc,n,cap.public_role;
      end if;
     end loop;
     if sc='029' and (select count(*) from public.igr_v4_players where room_code=code_id and public_role='suspect')<>4 then
      raise exception '029 witness seats lost';
     end if;
     if sc='030' and (select count(*) from public.igr_v4_players where room_code=code_id and secret_role='espion')<>(case when n=9 then 2 else 1 end) then
      raise exception '030 mole distribution changed';
     end if;
     update public.igr_v4_rooms set phase='role_reading',phase_ends_at=now()+interval '1 hour' where code=code_id;
     for actor in select * from public.igr_v4_players where room_code=code_id loop
      response:=public.igr_v4_sync(code_id,actor.player_token);
      if response->'players' @? '$[*].private_state' or response->'players' @? '$[*].secret_role' then
       raise exception 'another role secret leaked';
      end if;
      if actor.public_role='maitre' then
       if response#>>'{player,private_state,place}' not like '%avocat attitré du cartel Los Salcedo%' then
        raise exception 'cartel mandate absent from card %',sc;
       end if;
       if response#>>'{player,private_state,position}' not like '%Tes choix restent libres%' then
        raise exception 'interpretation freedom absent';
       end if;
       if response#>'{player,private_state,variant_card}' is not null then
        raise exception 'suspect private card leaked to lawyer';
       end if;
      end if;
     end loop;
     if expected=1 then
      select * into lawyer from public.igr_v4_players where room_code=code_id and public_role='maitre';
      select * into client from public.igr_v4_players where room_code=code_id and public_role='suspect' order by internal_slot limit 1;
      perform public.igr_v43_request_lawyer(code_id,client.player_token);
      perform public.igr_v43_accept_lawyer(code_id,lawyer.player_token,client.id);
      if not exists(select 1 from public.igr_v43_lawyer_representations where room_code=code_id and lawyer_id=lawyer.id and client_id=client.id) then
       raise exception 'lawyer representation failed';
      end if;
      if sc='029' then
       ending:=igr_private.igr_v120_029_make_reveal(code_id);
       select (x->>'success')::boolean into lawyer_won from jsonb_array_elements(ending->'results') x where x->>'player_id'=lawyer.id::text;
       if lawyer_won is distinct from true then raise exception '029 lawyer goal missing from ending'; end if;
      end if;
     end if;
    end loop;
   end loop;
  end loop;
  raise exception sqlstate 'P0167' using message='lawyer fixtures complete';
 exception when sqlstate 'P0167' then null;
 end;
 if tested<>26 then raise exception 'lawyer test matrix incomplete: %',tested; end if;
end $qa$;
