BEGIN;

CREATE TABLE IF NOT EXISTS igr_private.igr_v688_military_role_backup(signature text primary key,definition text not null,archived_at timestamptz default now());

ALTER TABLE igr_private.igr_v688_military_role_backup ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON igr_private.igr_v688_military_role_backup FROM PUBLIC,anon,authenticated;

INSERT INTO igr_private.igr_v688_military_role_backup(signature,definition) SELECT v.sig,pg_get_functiondef(v.sig::regprocedure) FROM (VALUES ('public.igr_v4_role_for_seat(text,integer,integer)'),('public.igr_v4_role_capacity(text,integer,text)'),('public.igr_v4_generic_role_card(text,text)'),('igr_private.igr_v681_terror_dynamic_room()')) v(sig) ON CONFLICT(signature) DO NOTHING;

CREATE OR REPLACE FUNCTION public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
begin
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
 elsif p_scenario='026' then
   if p_count=6 then return (array['enqueteur','analyste','officier_liaison','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','officier_liaison','expert','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='027' then
   if p_count=7 then return (array['enqueteur','analyste','inspecteur','officier_liaison','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','inspecteur','officier_liaison','procureur','suspect','suspect','suspect'])[p_seat+1]; end if;
 elsif p_scenario='028' then
   if p_count=6 then return (array['enqueteur','analyste','officier_liaison','suspect','suspect','suspect'])[p_seat+1]; elsif p_count=7 then return (array['enqueteur','analyste','officier_liaison','inspecteur','suspect','suspect','suspect'])[p_seat+1]; else return (array['enqueteur','analyste','officier_liaison','inspecteur','expert','suspect','suspect','suspect'])[p_seat+1]; end if;
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
;

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
 if p_scenario in ('026','027','028') then
  case r
   when 'officier_liaison' then return 1;
   when 'procureur' then return case when p_scenario='027' and p_count>=8 then 1 else 0 end;
   when 'expert' then return case when p_scenario='026' and p_count>=7 then 1 when p_scenario='028' and p_count>=8 then 1 else 0 end;
   when 'inspecteur' then return case when p_scenario='027' then 1 when p_scenario='028' and p_count>=7 then 1 else 0 end;
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
   when p_scenario='031' and p_count>=6 then 1
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
;

CREATE OR REPLACE FUNCTION public.igr_v4_generic_role_card(p_role text, p_context text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
begin case p_role when 'enqueteur' then return jsonb_build_object('place','Tu diriges l’enquête.','chronology',p_context,'hide','Tu ne caches aucun fait du dossier.','anchors','Croise les horaires, les accès, les objets et les contradictions. Le stress n’est pas une preuve.','position','Tu mènes les interrogatoires et portes la reconstruction factuelle finale.'); when 'analyste' then return jsonb_build_object('place','Tu observes les interrogatoires et aides l’Enquêteur.','chronology',p_context,'hide','Tes notes restent privées jusqu’aux échanges avec l’Enquêteur.','anchors','Repère les contradictions et les changements de version. Une impression n’est pas une preuve.','position','Tu aides à reconstruire les faits et participes à la délibération finale avec le Juge.'); when 'procureur' then return jsonb_build_object('place','Tu portes l’accusation.','chronology',p_context,'hide','Tes priorités d’entretien restent stratégiques.','anchors','Tu peux saisir le Juge et participes à sa délibération finale.','position','Accuse uniquement ce que les faits permettent de soutenir.'); when 'juge' then return jsonb_build_object('place','Tu arbitres l’accès aux éléments protégés et rends la décision officielle.','chronology',p_context,'hide','Ton statut d’intégrité et tes éventuels objectifs restent strictement privés.','anchors','Tu peux maintenir au maximum 3 éléments sous protection. Tu peux convoquer chaque joueur libre une fois par cycle pendant 2 minutes.','position','Tu n’enquêtes pas. À la fin, tu délibères obligatoirement avec le camp d’enquête puis tu tranches la responsabilité de chacun.'); when 'journaliste' then return jsonb_build_object('place','Tu enquêtes en dehors de tous les camps.','chronology',p_context,'hide','Tes sources et ton angle restent à toi.','anchors','Tu peux saisir le Juge pour un accès, une publication ou la protection d’une source.','position','Tu peux mettre la pression. Une publication n’est pas un verdict.'); when 'inspecteur' then return jsonb_build_object('place','Tu travailles sur le terrain.','chronology',p_context,'hide','Tes priorités de recherche restent privées jusqu’au résultat.','anchors','Une action de terrain par cycle.','position','Tu choisis où chercher. L’Expert dit ce que les traces prouvent.'); when 'officier_liaison' then return jsonb_build_object('place','Tu représentes l’état-major des forces armées d’Almizia à la Grey Room dans la dernière capitale libre.','chronology',p_context,'hide','Tu ne connais pas la vérité judiciaire ni les plans de toutes les factions du FDR.','anchors','Une seule opération par cycle. La qualité des renseignements déjà vérifiés détermine les options disponibles. Tu peux tenir la ligne, protéger les civils ou tenter une reconquête si les sources le permettent.','position','Tu décides réellement de l’opération nationale du cycle. Ton ordre a des conséquences publiques, mais tu ne décides ni des verdicts ni de la précision des preuves recueillies par les enquêteurs.'); when 'expert' then return jsonb_build_object('place','Tu es l’Expert / médecin légiste.','chronology',p_context,'hide','Tes priorités d’analyse restent privées.','anchors','Une analyse complémentaire par cycle.','position','Tu établis un fait technique. Tu ne désignes jamais un coupable.'); when 'temoin' then return jsonb_build_object('place','Tu es témoin dans le dossier.','chronology',p_context,'hide','Tu peux garder un élément personnel pour toi tant que tu ne changes pas les faits.','anchors','La fenêtre témoins est commune.','position','Réponds uniquement avec ce que tu sais réellement.'); when 'maitre' then return jsonb_build_object('place','Tu es l’Avocat.','chronology',p_context,'hide','Tu ne connais pas automatiquement les secrets des suspects.','anchors','Tu peux accepter un seul client officiel. Les autres suspects non représentés disposent chacun d’une unique consultation de 1 minute, seulement pendant leur propre interrogatoire.','position','Défends la frontière exacte de la responsabilité de ton client, sans inventer de fait ni de preuve.'); else return jsonb_build_object('place',p_role,'chronology',p_context,'hide','','anchors','','position',''); end case; end $function$
;


CREATE OR REPLACE FUNCTION public.igr_v688_terror_operations(p_code text,p_player_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $func$
DECLARE r public.igr_v4_rooms%rowtype;p public.igr_v4_players%rowtype;
last_result jsonb;previous_score integer:=0;
choices jsonb;chosen text;prev_cycle int;scenario text;eligible boolean;
BEGIN
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'not military officer';END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing' OR r.cycle NOT BETWEEN 1 AND 3
 THEN RETURN jsonb_build_object('enabled',false);END IF;
 SELECT a.payload->>'choice' INTO chosen FROM public.igr_v4_actions a
 WHERE a.room_code=r.code AND a.cycle=r.cycle AND a.player_id=p.id
 AND a.action_type='terror_v688_military' ORDER BY a.id DESC LIMIT 1;
 last_result:=coalesce(r.state#>'{terror_v681,history}','[]'::jsonb)->-1;
 prev_cycle:=coalesce((last_result->>'cycle')::integer,0);
 previous_score:=CASE WHEN prev_cycle=r.cycle-1 THEN coalesce((last_result->>'correct_answers')::int,0) ELSE 0 END;
 eligible:=r.cycle>1 AND previous_score>=5;
 scenario:=r.scenario_id;
 choices:=jsonb_build_array(
  jsonb_build_object('id','tenir','name',CASE scenario WHEN '026' THEN 'Défendre les institutions et les archives' WHEN '027' THEN 'Tenir les positions nationales' ELSE 'Verrouiller le périmètre de la Grey Room' END,
   'risk','Réduit les pertes possibles, sans reconquête immédiate'),
  jsonb_build_object('id','proteger','name',CASE scenario WHEN '026' THEN 'Sécuriser les services civils' WHEN '027' THEN 'Protéger les civils encore exposés' ELSE 'Garantir une évacuation des témoins vulnérables' END,
   'risk','Préserve une capacité humanitaire, mais oblige à abandonner une partie du terrain')
 );
 IF eligible THEN
  choices:=choices||jsonb_build_array(jsonb_build_object('id','reconquerir',
    'name',CASE scenario WHEN '026' THEN 'Reprendre un secteur et restaurer son administration' WHEN '027' THEN 'Rétablir le contrôle d une zone contestée' ELSE 'Desserrer l encerclement de la capitale' END,
    'risk','Un succès exige de nouvelles preuves; une mauvaise interprétation peut aggraver la situation'));
 END IF;
 RETURN jsonb_build_object('enabled',true,'cycle',r.cycle,'choices',choices,
  'previous_quality',CASE WHEN r.cycle=1 THEN 'aucune_synthese' WHEN previous_score>=5 THEN 'fiable'
   WHEN previous_score>=3 THEN 'partielle' ELSE 'incertaine' END,
  'already_chosen',chosen,'operation_window','during_cycle_before_debrief_close');
END; $func$;
REVOKE ALL ON FUNCTION public.igr_v688_terror_operations(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v688_terror_operations(text,uuid) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v688_terror_choose_operation(p_code text,p_player_token uuid,p_choice text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $func$
DECLARE p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;
opts jsonb;choice text;display text;allowed boolean;report text;
BEGIN
 PERFORM igr_private.rate_limit('terror_688_military',coalesce(p_player_token::text,''),8,60);
 SELECT * INTO p FROM public.igr_v4_players WHERE room_code=upper(trim(p_code)) AND player_token=p_player_token;
 IF NOT FOUND OR p.public_role<>'officier_liaison' THEN RAISE EXCEPTION 'not authorized'; END IF;
 SELECT * INTO r FROM public.igr_v4_rooms WHERE code=p.room_code FOR UPDATE;
 IF NOT FOUND OR r.scenario_id NOT IN ('026','027','028') OR r.status<>'playing'
 OR r.cycle NOT BETWEEN 1 AND 3 OR r.phase IN ('cycle_debrief','trame','locking','reveal')
 THEN RAISE EXCEPTION 'operation window closed'; END IF;
 choice:=lower(trim(coalesce(p_choice,'')));
 IF EXISTS(SELECT 1 FROM public.igr_v4_actions a WHERE a.room_code=r.code AND a.player_id=p.id AND a.cycle=r.cycle AND a.action_type='terror_v688_military')
 THEN RAISE EXCEPTION 'operation already committed';END IF;
 opts:=public.igr_v688_terror_operations(r.code,p_player_token);
 SELECT item->>'name' INTO display FROM jsonb_array_elements(opts->'choices') item WHERE item->>'id'=choice LIMIT 1;
 IF display IS NULL THEN RAISE EXCEPTION 'operation not justified by verified intelligence';END IF;
 INSERT INTO public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
 VALUES(r.code,p.id,r.cycle,'terror_v688_military',jsonb_build_object('choice',choice,'name',display));
 report:=CASE choice WHEN 'tenir' THEN 'L état-major ordonne de tenir les positions et de protéger les dossiers essentiels, dans les limites des forces encore disponibles.'
 WHEN 'proteger' THEN 'L état-major privilégie la protection des civils et des témoins. Cette décision réduit les moyens affectés au contrôle territorial.'
 ELSE 'L état-major autorise une reprise limitée d un secteur contesté, sous réserve de vérifications récentes. Ce choix comporte un risque réel si les informations sont dépassées.' END;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(r.code,'terror_v688_military_order','public',r.cycle,
 jsonb_build_object('title','ORDRE DE L ÉTAT-MAJOR · '||upper(display),'text',report,
  'operation',choice,'country','Almizia','base','Ferra','committed',true));
 RETURN jsonb_build_object('ok',true,'decision',choice,'name',display,'public',true);
END; $func$;
REVOKE ALL ON FUNCTION public.igr_v688_terror_choose_operation(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.igr_v688_terror_choose_operation(text,uuid,text) TO anon,authenticated;



DO $v688_impact$
DECLARE olddef text;newdef text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v681_terror_dynamic_room()'::regprocedure) INTO olddef;
 newdef:=olddef;
 IF position('held_before_final int;group_survives boolean;counterpush int;' in newdef)=0 THEN
  RAISE EXCEPTION 'v683 declaration changed';END IF;
 newdef:=replace(newdef,'held_before_final int;group_survives boolean;counterpush int;',
 'held_before_final int;group_survives boolean;counterpush int;
  military_choice text;');
 IF position('IF correct_count>=5 THEN counterpush:=least(2,counterpush+1);' in newdef)=0
 THEN RAISE EXCEPTION 'v683 counteroffensive mechanism changed';END IF;
 newdef:=replace(newdef,
 'IF correct_count>=5 THEN counterpush:=least(2,counterpush+1);
 ELSIF correct_count<3 THEN counterpush:=greatest(0,counterpush-1);END IF;',
 'IF correct_count<3 THEN counterpush:=greatest(0,counterpush-1);END IF;');
 IF position('pressure:=greatest(0,least(100,pressure+delta));' in newdef)=0
 THEN RAISE EXCEPTION 'score application changed';END IF;
 newdef:=replace(newdef,'pressure:=greatest(0,least(100,pressure+delta));',
 'SELECT a.payload->>''choice'' INTO military_choice FROM public.igr_v4_actions a
  JOIN public.igr_v4_players p ON p.id=a.player_id AND p.room_code=a.room_code
  WHERE a.room_code=new.code AND a.cycle=old.cycle
  AND a.action_type=''terror_v688_military'' AND p.public_role=''officier_liaison''
  ORDER BY a.id DESC LIMIT 1;
  military_choice:=coalesce(military_choice,''tenir'');
  delta:=CASE military_choice
   WHEN ''tenir'' THEN CASE WHEN correct_count>=5 THEN 0 WHEN correct_count>=3 THEN 10 ELSE 20 END
   WHEN ''proteger'' THEN CASE WHEN correct_count>=5 THEN 4 WHEN correct_count>=3 THEN 16 ELSE 26 END
   WHEN ''reconquerir'' THEN CASE WHEN correct_count>=5 THEN -16 WHEN correct_count>=3 THEN 9 ELSE 34 END
   ELSE 27 END;
  IF military_choice=''reconquerir'' AND correct_count>=5 THEN
    counterpush:=least(2,counterpush+1);
  END IF;
  band:=CASE
    WHEN military_choice=''reconquerir'' AND correct_count>=5 THEN ''RECONQUÊTE NATIONALE''
    WHEN military_choice=''reconquerir'' AND correct_count<3 THEN ''OFFENSIVE ÉCHOUÉE · FDR EN AVANCE''
    WHEN military_choice=''proteger'' THEN ''PROTECTION DES CIVILS''
    WHEN military_choice=''tenir'' AND correct_count>=5 THEN ''DÉFENSE TENUE · INTELLIGENCE VÉRIFIÉE''
    WHEN correct_count>=3 THEN ''PRESSION CONTENUE'' ELSE ''AVANCÉE DU FDR'' END;
  pressure:=greatest(0,least(100,pressure+delta));');
 IF position('''correct_answers'',correct_count,''possible_answers'',6,' in newdef)=0
 THEN RAISE EXCEPTION 'last-cycle public grade missing';END IF;
 newdef:=replace(newdef,
 '''correct_answers'',correct_count,''possible_answers'',6,',
 '''correct_answers'',correct_count,''possible_answers'',6,
     ''military_operation'',military_choice,
     ''civilian_protection'',(military_choice=''proteger''),');
 IF position('''national_liaison'',CASE WHEN correct_count>=5' in newdef)=0
 THEN RAISE EXCEPTION 'history band missing';END IF;
 newdef:=replace(newdef,
 '''national_liaison'',CASE WHEN correct_count>=5',
 '''military_operation'',military_choice,
     ''civilian_protection'',(military_choice=''proteger''),
     ''national_liaison'',CASE WHEN correct_count>=5');
 EXECUTE newdef;
END; $v688_impact$;



-- The common failure is capture, imprisonment and mistreatment by the FDR.
-- The pressure on the captives is unique to each dossier; never detail abusive acts graphically.
CREATE OR REPLACE FUNCTION igr_private.igr_v688_terror_captivity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $func$
DECLARE city_name text;message text;outcome text;
BEGIN
 IF new.scenario_id NOT IN ('026','027','028')
 OR old.status IS NOT DISTINCT FROM new.status OR new.status<>'finished'
 THEN RETURN new;END IF;
 outcome:=new.state#>>'{terror_v681,terminal_outcome}';
 IF outcome<>'front_at_gates' THEN RETURN new;END IF;
 city_name:=coalesce(new.state#>>'{terror_v681,city}','la capitale');
 message:=CASE new.scenario_id
  WHEN '026' THEN 'Le FDR pénètre dans la Grey Room de '||city_name||'. Les enquêteurs, les témoins et les suspects sont faits prisonniers. Ils subissent des interrogatoires coercitifs, des mauvais traitements et des menaces destinées à faire disparaître les preuves des crimes du FDR. Les copies sauvegardées ailleurs représentent la dernière chance de préserver la vérité.'
  WHEN '027' THEN 'Après la chute de la capitale, le FDR capture tous les occupants. Les prisonniers sont séparés et soumis à des pressions et à des mauvais traitements afin de leur faire confirmer une version manipulée des renseignements. Le dossier révèle quelles omissions et quelles informations périmées ont aidé cette prise de contrôle.'
  ELSE 'Le FDR prend le centre et détient les occupants. La dernière liaison se tait; certains prisonniers sont maltraités et interrogés pour identifier les témoins et les preuves. Selon la vérité du dossier, une menace intérieure était réelle ou fabriquée; les détenus ignorent à qui se fier. Aucun membre du FDR ne bénéficie automatiquement d une protection.' END;
 INSERT INTO public.igr_v4_events(room_code,event_type,visibility,cycle,payload)
 VALUES(new.code,'terror_v688_captivity','public',new.cycle,
  jsonb_build_object('title','DÉFAITE · PRISONNIERS DU FDR',
   'text',message,'city',city_name,'country','Almizia',
   'defeat',true,'captured',true,'fates_unresolved',true,'scenario',new.scenario_id));
 RETURN new;
END; $func$;
REVOKE ALL ON FUNCTION igr_private.igr_v688_terror_captivity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS zz_igr_v688_terror_captivity ON public.igr_v4_rooms;
CREATE TRIGGER zz_igr_v688_terror_captivity AFTER UPDATE OF status ON public.igr_v4_rooms
FOR EACH ROW EXECUTE FUNCTION igr_private.igr_v688_terror_captivity();



DO $qa$
DECLARE sc text;n int;c int;
BEGIN
 FOR sc IN SELECT unnest(ARRAY['026','027','028']) LOOP
  n:=public.igr_v4_min_players(sc);
  FOR c IN n..public.igr_v4_max_players(sc) LOOP
   IF (SELECT count(*) FROM generate_series(0,c-1) seat
     WHERE public.igr_v4_role_for_seat(sc,seat,c)='suspect')<>3
     OR (SELECT count(*) FROM generate_series(0,c-1) seat
       WHERE public.igr_v4_role_for_seat(sc,seat,c)='officier_liaison')<>1
   THEN RAISE EXCEPTION 'roster broken %/%',sc,c; END IF;
   IF public.igr_v4_role_capacity(sc,c,'officier_liaison')<>1
   THEN RAISE EXCEPTION 'officer unavailable %/%',sc,c;END IF;
  END LOOP;
 END LOOP;
 IF public.igr_v4_role_for_seat('027',2,7)<>'inspecteur' OR
 public.igr_v4_role_for_seat('027',4,8)<>'procureur'
 THEN RAISE EXCEPTION 'special role 027 mismatch';END IF;
 IF public.igr_v4_role_for_seat('028',3,7)<>'inspecteur' OR
 public.igr_v4_role_for_seat('028',4,8)<>'expert'
 THEN RAISE EXCEPTION 'special role 028 mismatch';END IF;
 IF (select count(*) from igr_private.igr_v680_terror_editorial_drafts where proposed_manuscript#>>'{v687_almizia_ferra_canon,country}'='République d''Almizia')<>9
 THEN RAISE EXCEPTION 'Almizia/ Ferra draft canon missing';END IF;
 IF has_function_privilege('anon','igr_private.igr_v688_terror_captivity()','EXECUTE')
 THEN RAISE EXCEPTION 'private victory trigger public';END IF;
END $qa$;


COMMIT;