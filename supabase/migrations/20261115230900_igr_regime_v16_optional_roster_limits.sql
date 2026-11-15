-- Régime v16: 8th witness and 034-only 9th journalist, extended court at 8+.
CREATE OR REPLACE FUNCTION public.igr_v4_max_players(p_scenario text)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
 select case
 when p_scenario IN ('032','033','034') AND igr_private.igr_regime_v13_release_eligible() THEN (CASE WHEN p_scenario='034' THEN 9 ELSE 8 END)
 when p_scenario='029' and igr_private.igr_v108_029_is_enabled() then 11
 when p_scenario between '035' and '039' then 7
 when p_scenario between '040' and '044' then 7
 when p_scenario in ('021','022','023','024','025') then 8
 when p_scenario in ('026','027','028') then 6 /* v703 terror six-person maximum */
 when p_scenario='029' then 8 when p_scenario='030' then 9 when p_scenario='031' then 8
 when p_scenario='032' then 8 when p_scenario='033' then 8 when p_scenario='034' then 9
 when p_scenario in ('001','004','005','006') then 5
 when p_scenario in ('003','008','009','011') then 6
 when p_scenario='002' then 6
 when p_scenario in ('007','010','012') then 5
 when p_scenario in ('013','014') then 6 when p_scenario='015' then 7 when p_scenario='016' then 9
 when p_scenario='017' then 10 when p_scenario='018' then 9 when p_scenario='019' then 9 when p_scenario='020' then 16 else 5 end
$function$


CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
 if p_scenario in ('032','033','034') AND igr_private.igr_regime_v13_release_eligible() then
   if p_count<6 OR p_count>public.igr_v4_max_players(p_scenario)
     OR p_seat<0 OR p_seat>=p_count THEN
       raise exception 'Regime requires 6 to 8 players (032/033), or 6 to 9 (034)';
   end if;
   return (array['enqueteur','analyste','juge','suspect','suspect','suspect','procureur','temoin','journaliste']::text[])[p_seat+1];
 end if;
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
   if p_count not between 6 and 11 then raise exception 'four witness roster requires 6 to 11 participants'; end if;
   return (array['enqueteur','analyste','suspect','suspect','suspect','suspect','procureur','juge','journaliste','don','bras_droit'])[p_seat+1];
 end if;
 if p_scenario between '035' and '039' then
   if p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   elsif p_count=6 then return (array['enqueteur','analyste','expert','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','analyste','expert','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario between '040' and '044' then
   return (array['enqueteur','analyste','maitre','suspect','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario in ('026','027','028') then
   -- v703 terror six-person roster
   if p_count<>6 or p_seat not between 0 and 5 then raise exception 'TERREUR requires exactly six players'; end if;
   return (array['enqueteur','analyste','officier_liaison','suspect','suspect','suspect']::text[])[p_seat+1];
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
 
elsif p_scenario='003' then
   if p_count=6 then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
   elsif p_count=5 then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
   else return (array['enqueteur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario in ('001','004','005','006') then
   if p_seat=0 then return 'enqueteur'; elsif p_count=5 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 elsif p_scenario='002' then
   if p_seat=0 then return 'enqueteur'; elsif p_count=6 and p_seat=1 then return 'analyste'; else return 'suspect'; end if;
 
elsif p_scenario in ('007','010','012') then return (array['enqueteur','analyste','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='008' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='009' then return (array['enqueteur','analyste','suspect','suspect','suspect','expert'])[p_seat+1];
 elsif p_scenario='011' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='013' then return (array['enqueteur','analyste','suspect','suspect','suspect','procureur'])[p_seat+1];
 elsif p_scenario='014' then return (array['enqueteur','analyste','suspect','suspect','suspect','juge'])[p_seat+1];
 elsif p_scenario='015' then return (array['enqueteur','analyste','suspect','suspect','suspect','journaliste','juge'])[p_seat+1];
 elsif p_scenario='016' then return (array['enqueteur','analyste','suspect','suspect','suspect','maitre','journaliste','juge','expert'])[p_seat+1];
 elsif p_scenario='017' then return (array['enqueteur','analyste','procureur','suspect','suspect','suspect','temoin','temoin','maitre','expert'])[p_seat+1];
 elsif p_scenario='018' then return (array['enqueteur','analyste','inspecteur','suspect','suspect','suspect','expert','maitre','journaliste'])[p_seat+1];
 elsif p_scenario='019' then return (array['enqueteur','analyste','procureur','juge','journaliste','maitre','suspect','suspect','suspect'])[p_seat+1];
 elsif p_scenario='020' then return (array['enqueteur','analyste','inspecteur','procureur','juge','expert','suspect','suspect','suspect','suspect','maitre','journaliste','temoin','maitre','journaliste','temoin'])[p_seat+1];
 end if;
 return 'suspect';
end
$function$


CREATE OR REPLACE FUNCTION public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
 -- Regime: selectable roles match the pinned six-person core plus optional seats.
 if p_scenario in ('032','033','034') and igr_private.igr_regime_v13_release_eligible() then
  case r
   when 'enqueteur','analyste','juge' then return 1;
   when 'suspect' then return 3;
   when 'procureur' then return case when p_count>=7 then 1 else 0 end;
   when 'temoin' then return case when p_count>=8 then 1 else 0 end;
   when 'journaliste' then return case when p_scenario='034' and p_count>=9 then 1 else 0 end;
   else return 0;
  end case;
 end if;
 if p_scenario='029' and igr_private.igr_v108_029_is_enabled() then
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
 end if;
 
 if r='avocat' then r:='maitre'; end if;
 -- v703 terror six-person capacities: independent of historical specialist defaults.
 if p_scenario in ('026','027','028') then
   case r when 'enqueteur','analyste','officier_liaison' then return 1;
     when 'suspect' then return 3;
     else return 0; end case;
 end if;
 -- v699 roster capacity sync: lobby selection must match the server's start roster.
 IF p_scenario BETWEEN '035' AND '039' THEN
   CASE r
     WHEN 'enqueteur','analyste' THEN RETURN 1;
     WHEN 'suspect' THEN RETURN 3;
     WHEN 'expert' THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END;
     WHEN 'procureur' THEN RETURN CASE WHEN p_count>=7 THEN 1 ELSE 0 END;
     ELSE RETURN 0;
   END CASE;
 END IF;
 IF p_scenario BETWEEN '040' AND '044' THEN
   CASE r
     WHEN 'enqueteur','analyste','maitre' THEN RETURN 1;
     WHEN 'suspect' THEN RETURN 4;
     ELSE RETURN 0;
   END CASE;
 END IF;
 IF r='analyste' AND
    ((p_scenario IN ('001','003','004','005','006') AND p_count<5)
      OR (p_scenario='002' AND p_count<6))
 THEN RETURN 0; END IF;
 IF r='expert' AND p_scenario IN ('003','009')
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;
 IF r='juge' AND p_scenario='008'
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;
 IF r='procureur' AND p_scenario='011'
 THEN RETURN CASE WHEN p_count>=6 THEN 1 ELSE 0 END; END IF;

 if p_scenario in ('026','027','028') then
  case r
   when 'officier_liaison' then return 1;
   when 'procureur' then return case when p_scenario='027' and p_count>=8 then 1 else 0 end;
   when 'expert' then return case when p_scenario='026' and p_count>=7 then 1 when p_scenario='028' and p_count>=8 then 1 else 0 end;
   when 'inspecteur' then return case when p_scenario='027' then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
  else null;
  end case;
 end if;
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
   when p_scenario='015' and p_count>=6 then 1 when p_scenario='016' and p_count>=7 then 1 when p_scenario='018' and p_count>=9 then 1
   when p_scenario='030' and p_count>=9 then 1 when p_scenario='034' and p_count>=9 then 1 else 0 end;
 elsif r='maitre' then return case
   when p_scenario='019' then 1
   when p_scenario='020' then case when p_count>=14 then 2 else 1 end
   when p_scenario='016' and p_count>=6 then 1 when p_scenario='017' and p_count>=9 then 1 when p_scenario='018' and p_count>=8 then 1
   when p_scenario='029' then case when p_count>=8 then 2 when p_count>=6 then 1 else 0 end
   when p_scenario='030' and p_count>=8 then 1
   when p_scenario='031' then 1 /* v698 cartel031 early lobby lawyer reservation */
   else 0 end;
 elsif r='inspecteur' then return case when p_scenario in ('018','020','027') then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
 elsif r='expert' then return case when p_scenario in ('020','026','028') then 1 when p_scenario='027' and p_count>=8 then 1 when p_scenario='016' and p_count>=9 then 1 when p_scenario='017' and p_count>=10 then 1 when p_scenario='018' and p_count>=7 then 1 else 0 end;
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
$function$


CREATE OR REPLACE FUNCTION igr_private.igr_regime_v13_begin_court(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 r public.igr_v4_rooms%rowtype;m igr_private.igr_regime_v13_rooms%rowtype;
 t1 text;t2 text;c1 integer;c2 integer;minutes integer;
 st jsonb;
BEGIN
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=upper(trim(p_code)) FOR UPDATE;
 SELECT * INTO m FROM igr_private.igr_regime_v13_rooms WHERE room_code=upper(trim(p_code)) FOR UPDATE;
 IF NOT FOUND OR r.status<>'playing' OR r.cycle<>3 OR r.phase<>'closed' THEN RETURN false;END IF;
 IF m.play_state->'court' ? 'started' THEN RETURN false;END IF;
 t1:=m.private_pack->'private_cards'->0->>'actor_id';
 t2:=m.private_pack->'private_cards'->1->>'actor_id';
 c1:=(m.play_state->'arrests'->t1->>'cycle')::int;
 c2:=(m.play_state->'arrests'->t2->>'cycle')::int;
 minutes:=CASE WHEN (SELECT count(*) FROM public.igr_v4_players WHERE room_code=r.code)>=8 OR (c1 IS NOT NULL AND c2 IS NOT NULL AND greatest(c1,c2)=3) THEN 14 ELSE 8 END;
 st:=jsonb_set(m.play_state,'{court}',jsonb_build_object(
    'started',true,'started_at',now(),'duration_minutes',minutes,
    'stage','opening','called','[]'::jsonb,'current',NULL,'phase','tribunal'),true);
 UPDATE igr_private.igr_regime_v13_rooms SET play_state=st WHERE room_code=m.room_code;
 UPDATE public.igr_v4_rooms SET phase='regime_court',phase_started_at=now(),
   phase_ends_at=now()+make_interval(mins=>minutes),updated_at=now() WHERE code=r.code;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,payload)
 VALUES(r.code,'phase','public',jsonb_build_object(
   'title','TRIBUNAL DE KARSANE',
   'text','Tous les joueurs rejoignent la salle commune. Le Juge appelle les personnes présentes à la barre. L audience finale ne sera pas rejouée.',
   'duration_minutes',minutes));
 RETURN true;
END $function$

