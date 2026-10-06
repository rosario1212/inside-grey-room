-- Inside Grey Room v54 — witness scenario alignment.
-- Base game: witness remains scenario-bound (017/020 only).
-- DLC: 029 has no witness; 031–034 receive one authored witness each.

update public.igr_v4_scenario_packs
set pack =
  jsonb_set(
    jsonb_set(pack, '{witnesses}', '[]'::jsonb, true),
    '{role_notes}',
    coalesce(pack->'role_notes','{}'::jsonb) - 'temoin',
    true
  )
where scenario_id='029';

update public.igr_v4_scenario_packs
set pack =
  jsonb_set(
    jsonb_set(
      pack,
      '{witnesses}',
      $json$[
        {
          "place":"Victime retenue puis libérée.",
          "chronology":"Tu es enlevé puis conduit dans un lieu de rétention. Tu identifies le deuxième suspect comme la personne qui gère concrètement le lieu. À un moment, il dispose d’une occasion réelle de te laisser partir mais choisit de maintenir la rétention. Tu entends aussi des exigences être évoquées, sans savoir qui a décidé l’enlèvement au départ.",
          "hide":"Dans ton premier récit, par peur des représailles, tu as prétendu ne pouvoir reconnaître personne alors que tu as reconnu la voix du gardien.",
          "anchors":"Tu peux décrire le lieu, les horaires approximatifs, les personnes que tu as réellement vues ou entendues et le moment où une libération était possible. Tu ignores qui a conçu l’enlèvement et tu ne connais pas les intentions de chacun.",
          "position":"Reste strictement sur ce que tu as vécu. Distingue ce que tu as observé de ce que tu déduis après coup."
        }
      ]$json$::jsonb,
      true
    ),
    '{role_notes}',
    coalesce(pack->'role_notes','{}'::jsonb) || jsonb_build_object(
      'temoin',
      jsonb_build_object('anchors','Le Témoin apporte un récit factuel limité. Il ne connaît ni la chaîne complète de décision ni la vérité finale du dossier.')
    ),
    true
  )
where scenario_id='031';

update public.igr_v4_scenario_packs
set pack =
  jsonb_set(
    jsonb_set(
      pack,
      '{witnesses}',
      $json$[
        {
          "place":"Archiviste administratif du palais.",
          "chronology":"Tu vois circuler une première liste d’arrestations, puis une version corrigée après le début des détentions. Tu archives aussi des registres de prolongation transmis par la sécurité. Tu peux reconnaître les signatures, les dates et l’ordre des versions, mais tu n’assistes pas aux interrogatoires ni aux mauvais traitements.",
          "hide":"Tu as conservé une copie d’une liste après avoir reçu l’ordre administratif de la détruire.",
          "anchors":"Tu peux authentifier les documents, leur chronologie et certaines corrections manuscrites. Tu ne peux pas affirmer ce qui a été ordonné oralement ni ce qui s’est passé à l’intérieur des lieux de détention.",
          "position":"Sépare toujours ce que les archives prouvent de ce qu’elles laissent seulement supposer."
        }
      ]$json$::jsonb,
      true
    ),
    '{role_notes}',
    coalesce(pack->'role_notes','{}'::jsonb) || jsonb_build_object(
      'temoin',
      jsonb_build_object('anchors','Le Témoin sert à authentifier la chaîne documentaire sans transformer les archives en preuve automatique d’intention.')
    ),
    true
  )
where scenario_id='032';

update public.igr_v4_scenario_packs
set pack =
  jsonb_set(
    jsonb_set(
      pack,
      '{witnesses}',
      $json$[
        {
          "place":"Ancien secrétaire de cabinet chargé des agendas et réunions.",
          "chronology":"Tu organises plusieurs rendez-vous sensibles. Tu constates que certaines décisions sont retardées jusqu’à l’avis du troisième suspect et qu’une enquête administrative concernant un chef de service est stoppée après une intervention du deuxième suspect. Tu ne participes pas aux décisions elles-mêmes.",
          "hide":"Tu as modifié un agenda officiel pour masquer une réunion familiale non inscrite au registre.",
          "anchors":"Tu peux confirmer les présences, l’ordre des réunions, les reports et les interventions administratives que tu as personnellement enregistrés. Tu ignores le contenu exact des conversations privées et ne peux pas attribuer chaque décision à une seule personne.",
          "position":"Ton témoignage porte sur le fonctionnement réel du pouvoir, pas sur la culpabilité automatique d’un membre de la famille."
        }
      ]$json$::jsonb,
      true
    ),
    '{role_notes}',
    coalesce(pack->'role_notes','{}'::jsonb) || jsonb_build_object(
      'temoin',
      jsonb_build_object('anchors','Le Témoin éclaire le pouvoir informel à partir d’agendas et de présences, sans connaître toutes les décisions privées.')
    ),
    true
  )
where scenario_id='033';

update public.igr_v4_scenario_packs
set pack =
  jsonb_set(
    jsonb_set(
      pack,
      '{witnesses}',
      $json$[
        {
          "place":"Ancien agent de liaison entre plusieurs bureaux du régime.",
          "chronology":"Tu transportes des notes et messages entre les services. Tu vois le Notaire authentifier certains dossiers, la Tour retenir ou redistribuer des informations et l’Héritier accéder régulièrement aux réunions du sommet. Selon les opérations, les mêmes surnoms ne correspondent pas exactement au même niveau de pouvoir.",
          "hide":"Dans plusieurs comptes rendus, tu as toi-même utilisé les surnoms comme s’ils désignaient une hiérarchie fixe, alors que tu savais que leur poids variait selon le dossier.",
          "anchors":"Tu connais les circuits de transmission, l’usage réel des surnoms et certaines présences. Tu n’assistes pas à toutes les délibérations et tu ne peux pas déduire un ordre criminel uniquement à partir d’un surnom ou d’un accès au sommet.",
          "position":"Aide à démonter la fausse hiérarchie des surnoms sans remplacer l’enquête sur les décisions concrètes."
        }
      ]$json$::jsonb,
      true
    ),
    '{role_notes}',
    coalesce(pack->'role_notes','{}'::jsonb) || jsonb_build_object(
      'temoin',
      jsonb_build_object('anchors','Le Témoin explique l’usage des surnoms et les circuits d’information, mais ne connaît pas toutes les décisions prises au sommet.')
    ),
    true
  )
where scenario_id='034';

create or replace function public.igr_v4_role_for_seat(p_scenario text, p_seat integer, p_count integer)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
begin
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

create or replace function public.igr_v4_role_capacity(p_scenario text, p_count integer, p_role text)
returns integer
language plpgsql
immutable
set search_path to 'public'
as $function$
declare r text:=lower(trim(coalesce(p_role,'')));
begin
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
