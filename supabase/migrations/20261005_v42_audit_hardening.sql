-- Inside Grey Room v42.1 — audit hardening after the 34-scenario investigation pass.
-- 1) Adds scenario-specific suspect objectives for 021–034.
-- 2) Exposes the authoritative interrogation duration in room.state.
-- 3) Enforces a persistent content contract for every core scenario 001–034.

do $$
declare r record;
begin
  for r in
    select * from (values
      ('021',1,'Réduis ta peine en négociant ce que tu sais, sans te faire identifier comme informateur et sans nier le détournement.'),
      ('021',2,'Protège ton groupe et distingue les pressions que tu as exercées après la disparition de toute participation au détournement.'),
      ('021',3,'Protège le sommet en reconnaissant ce que tu savais du paiement sans te laisser attribuer le détournement.'),
      ('021',4,'Empêche que ta connaissance du paiement soit transformée en preuve contre toi ou contre ton père.'),
      ('021',5,'Protège Paolo et ta famille sans cacher les faits matériels que tu connais.'),
      ('021',6,'Fais établir que tu as été écarté du transport et découvre qui t’a mis hors-jeu sans accuser au hasard.'),
      ('021',7,'Utilise les comptes pour établir ce qui est prouvé, sans te laisser attribuer les ordres ou le transport.'),
      ('022',1,'Négocie ce que tu sais sur l’ordre indirect pour réduire ta peine, sans prétendre avoir assisté au meurtre.'),
      ('022',2,'Fais distinguer ta volonté de faire cesser la fuite d’un ordre de tuer que tu n’as jamais formulé.'),
      ('022',3,'Assume l’omertà organisée après le meurtre et sépare-la de l’ordre initial auquel tu n’as pas participé.'),
      ('022',4,'Protège le sommet familial sans te laisser associer à un meurtre que tu n’as appris qu’après les faits.'),
      ('022',5,'Aide à établir la peur de la victime et l’existence d’une fuite sans inventer l’identité d’une source que tu ignores.'),
      ('022',6,'Assume le meurtre et fais établir que tu as interprété une pression plutôt que reçu un ordre explicite de tuer.'),
      ('022',7,'Révèle uniquement ce que les paiements prouvent et distingue financement de la dissimulation, commandement et meurtre.'),
      ('023',1,'Utilise ce que tu sais sur l’itinéraire recherché comme monnaie de négociation sans prétendre en savoir davantage.'),
      ('023',2,'Fais distinguer ta rivalité avec Adriano de toute participation à l’attaque.'),
      ('023',3,'Protège le sommet et la paix interne tout en assumant ce que tu savais du septième participant.'),
      ('023',4,'Détermine si l’attaque visait ta vie ou ta succession sans transformer tes soupçons contre Rinaldi en preuves.'),
      ('023',5,'Explique comment le changement d’itinéraire a pu fuiter sans cacher ton propre rôle dans cette modification.'),
      ('023',6,'Révèle qui t’a demandé de ne pas contrôler le véhicule afin de limiter ta responsabilité dans la faille de sécurité.'),
      ('023',7,'Utilise le paiement annulé pour éclairer l’intention derrière l’attaque sans prétendre qu’il identifie seul le commanditaire.'),
      ('024',1,'Obtiens la meilleure réduction de peine possible en livrant des informations vérifiables et obtiens une protection sans minimiser tes propres crimes.'),
      ('024',2,'Identifie correctement le coopérant sans condamner un homme loyal sur de simples soupçons.'),
      ('024',3,'Démontre quelles fuites sont authentiques et lesquelles proviennent d’informations volontairement contaminées.'),
      ('024',4,'Empêche que la coopération remonte jusqu’à Vittorio, même si cela exige d’abandonner politiquement Rinaldi.'),
      ('024',5,'Aide à établir la peur réelle de Paolo pour soutenir sa protection sans le disculper de ses crimes.'),
      ('024',6,'Utilise les limites de ce que Paolo savait pour démontrer quelles accusations ne peuvent pas provenir de lui.'),
      ('024',7,'Authentifie les flux que tu peux prouver et distingue une preuve comptable de l’interprétation qu’on en tire.'),
      ('024',8,'Reste assez utile pour obtenir une protection sans devenir celui qui a livré Paolo à la Famiglia.'),
      ('025',1,'Aide à distinguer les vrais ordres de Vittorio des actes commis en son nom, en échange de la meilleure protection possible.'),
      ('025',2,'Assume tes propres initiatives et ne les attribue pas au Don lorsque tu n’avais reçu aucun ordre de lui.'),
      ('025',3,'Explique précisément comment tu as reformulé les ordres et défends la différence entre transmettre, atténuer et aggraver.'),
      ('025',4,'Assume les violences décidées de ta propre initiative et distingue loyauté familiale d’ordre paternel.'),
      ('025',5,'Utilise ce que tu as entendu pour innocenter Vittorio d’actes précis sans nier sa responsabilité réelle dans le système.'),
      ('025',6,'Assume tes propres interprétations des ordres et ne te cache pas derrière la réputation du Don.'),
      ('025',7,'Sépare ce que les flux prouvent sur le financement de ce qu’ils ne prouvent pas sur les méthodes ou les ordres précis.'),
      ('025',8,'Montre comment un ordre s’est déformé avant de t’atteindre sans te décharger des actes que tu as ensuite choisis.'),
      ('025',9,'Distingue exactement ce que tu as ordonné, toléré ou ignoré de ce que tes hommes ont fait en utilisant ton nom.'),
      ('026',1,'Réduis ta responsabilité en distinguant tes décisions de celles du commandement supérieur et ne coopère que sur ce qui te protège réellement.'),
      ('026',2,'Coopère suffisamment pour sortir du réseau, mais refuse qu’on t’attribue les crimes que tu n’as pas décidés.'),
      ('026',3,'Fais perdre du temps à l’enquête sans inventer de faits et minimise ton rôle opérationnel tout en protégeant ce que tu sais du dispositif encore actif.'),
      ('027',1,'Coopère pour réduire ta peine, assume ce que tu as facilité et empêche qu’on te transforme en chef militaire.'),
      ('027',2,'Échange tes informations contre une protection et une peine réduite sans nier les sévices que tu as couverts.'),
      ('027',3,'Donne suffisamment d’informations vraies pour paraître crédible tout en orientant l’enquête contre la faction rivale que tu veux éliminer.'),
      ('028',1,'Coopère pour sauver ta vie, mais limite ta responsabilité aux violences et décisions que tu as réellement couvertes.'),
      ('028',2,'Aide sincèrement l’enquête tout en minimisant ton soutien passé et fais distinguer complicité logistique et direction des violences.'),
      ('028',3,'Entretiens le doute le plus longtemps possible sans contredire les faits de ta carte et protège l’existence de la cellule intérieure.'),
      ('029',1,'Minimise ton rôle en présentant les transferts comme une fonction financière, sans nier que tu connaissais leur finalité criminelle.'),
      ('029',2,'Assume l’intimidation que tu as demandée, mais fais distinguer cet ordre de l’escalade qui a suivi.'),
      ('029',3,'Réduis ta peine en livrant la chaîne de décision sans nier ta participation matérielle à l’exécution.'),
      ('030',1,'Assume les démarches d’influence et le paiement indirect, mais distingue ton rôle d’intermédiaire des violences et décisions finales.'),
      ('030',2,'Réduis ta responsabilité en démontrant ce que tu as seulement transmis, tout en assumant la rencontre décisive que tu as organisée.'),
      ('030',3,'Assume avoir financé la corruption et validé la menace, mais fais distinguer l’objectif que tu as fixé des décisions précises que tu ne contrôlais pas.'),
      ('031',1,'Assume avoir exploité l’enlèvement en transmettant les exigences, mais distingue cette participation de la décision initiale d’enlever la victime.'),
      ('031',2,'Assume d’avoir maintenu la victime retenue après avoir compris la situation et ne minimise que ce que tu n’as réellement pas décidé.'),
      ('031',3,'Tu as décidé la disparition et utilisé l’enlèvement comme moyen de pression : défends seulement les actes ou violences qui ne te sont pas attribuables.'),
      ('032',1,'Assume la modification de la liste et distingue tes signatures conscientes des décisions opérationnelles prises ensuite par la sécurité.'),
      ('032',2,'Assume les arrestations et détentions que tu as prolongées sans te cacher derrière les directives civiles.'),
      ('032',3,'Assume avoir fixé les priorités et demandé la neutralisation tout en distinguant ton influence de l’exécution matérielle.'),
      ('033',1,'Assume le financement maintenu après avoir appris les abus et fais distinguer soutien financier de commandement politique direct.'),
      ('033',2,'Assume avoir protégé un chef de service et les décisions relevant de ton pouvoir sans accepter la responsabilité de tout l’appareil.'),
      ('033',3,'Assume l’influence réelle de tes arbitrages et la décision ayant renforcé la branche violente malgré l’absence de titre officiel.'),
      ('034',1,'Assume avoir validé le transfert en connaissant le risque, mais fais distinguer authentification, influence et décision initiale.'),
      ('034',2,'Fais reconnaître que tu n’étais pas l’auteur de l’ordre tout en assumant que tu pouvais le bloquer et que tu as choisi de le laisser passer.'),
      ('034',3,'Assume avoir recommandé l’opération et l’influence que tu exerçais, tout en distinguant conseil, décision formelle et exécution.')
    ) as x(scenario_id,slot,objective)
  loop
    update public.igr_v4_scenario_packs
    set pack=jsonb_set(
      pack,
      array['suspects',(r.slot-1)::text,'objective_main'],
      to_jsonb(r.objective::text),
      true
    )
    where scenario_id=r.scenario_id;
  end loop;
end
$$;

create or replace function public.igr_v42_valid_core_pack(p_scenario_id text,p_pack jsonb)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  select case
    when coalesce(p_scenario_id,'') not between '001' and '034' then true
    else
      jsonb_typeof(p_pack)='object'
      and nullif(btrim(coalesce(p_pack->>'context','')),'') is not null
      and case when jsonb_typeof(p_pack->'suspects')='array' then jsonb_array_length(p_pack->'suspects')>0 else false end
      and not exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(p_pack->'suspects')='array' then p_pack->'suspects' else '[]'::jsonb end
        ) s
        where nullif(btrim(coalesce(s->>'chronology','')),'') is null
           or nullif(btrim(coalesce(s->>'hide','')),'') is null
           or nullif(btrim(coalesce(s->>'anchors','')),'') is null
           or nullif(btrim(coalesce(s->>'position','')),'') is null
           or nullif(btrim(coalesce(s->>'objective_main','')),'') is null
      )
      and case when jsonb_typeof(p_pack->'trames')='array' then jsonb_array_length(p_pack->'trames')>0 else false end
      and not exists (
        select 1
        from jsonb_array_elements(
          case when jsonb_typeof(p_pack->'trames')='array' then p_pack->'trames' else '[]'::jsonb end
        ) t
        where nullif(btrim(coalesce(t->>'title','')),'') is null
           or nullif(btrim(coalesce(t->>'text','')),'') is null
           or not coalesce(t->>'min_cycle','') ~ '^[1-3]$'
      )
  end;
$function$;

alter table public.igr_v4_scenario_packs
  add constraint igr_v42_core_pack_integrity
  check (public.igr_v42_valid_core_pack(scenario_id,pack));

create or replace function public.igr_v4_start_cycle(p_room text, p_cycle integer)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r public.igr_v4_rooms%rowtype;
  order_json jsonb;
  st jsonb;
  suspect_count integer;
  lim integer;
  cycle_copy text;
  inter_seconds integer;
  inter_label text;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;

  select coalesce(jsonb_agg(id::text order by random()),'[]'::jsonb),count(*)
  into order_json,suspect_count
  from public.igr_v4_players where room_code=p_room and public_role='suspect';

  if not public.igr_v13_is_core_scenario(r.scenario_id) then
    update public.igr_v4_rooms set cycle=p_cycle,phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,
      state=jsonb_set(jsonb_set(jsonb_set(jsonb_set(state,'{heard}','[]'::jsonb,true),'{annex_queue}','[]'::jsonb,true),'{annex_index}','0'::jsonb,true),'{interrogation_order}',order_json,true),updated_at=now()
    where code=p_room;
    return;
  end if;

  lim:=least(public.igr_v13_interrogation_limit(r.code,p_cycle),suspect_count);
  inter_seconds:=coalesce(public.igr_v35_room_seconds(r.code,'interrogation'),360);
  inter_label:=public.igr_v35_seconds_label(inter_seconds);
  st:=coalesce(r.state,'{}'::jsonb);
  st:=jsonb_set(st,'{heard}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_index}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_order}',order_json,true);
  st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true);
  st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_seconds}',to_jsonb(inter_seconds),true);
  st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
  update public.igr_v4_rooms set cycle=p_cycle,state=st,updated_at=now() where code=p_room;

  if p_cycle=1 then
    update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object('title','CYCLE 1 · PREMIÈRES VERSIONS','text','Trois interrogatoires de '||inter_label||' maximum. L’Enquêteur choisit l’ordre.'));
  else
    perform public.igr_v13_enter_event_select(p_room,3,true);
    cycle_copy:=case
      when p_cycle=2 then 'Trois actions au choix. Maximum deux interrogatoires de '||inter_label||'.'
      else 'Trois actions au choix. Maximum un interrogatoire de '||inter_label||'.'
    end;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE '||p_cycle||case when p_cycle=3 then ' · RÉSOLUTION' else ' · DIRECTION' end,
      'text',cycle_copy
    ));
  end if;
end
$function$;

-- Backfill the duration for rooms that were already created before this migration.
update public.igr_v4_rooms r
set state=jsonb_set(
  coalesce(r.state,'{}'::jsonb),
  '{interrogation_seconds}',
  to_jsonb(coalesce(public.igr_v35_room_seconds(r.code,'interrogation'),360)),
  true
)
where public.igr_v13_is_core_scenario(r.scenario_id);

-- If a 021–034 game was already running, refresh its suspect objective in-place.
update public.igr_v4_players p
set private_state=jsonb_set(
  coalesce(p.private_state,'{}'::jsonb),
  '{objective_main}',
  sp.pack->'suspects'->(p.internal_slot-1)->'objective_main',
  true
)
from public.igr_v4_rooms r
join public.igr_v4_scenario_packs sp on sp.scenario_id=r.scenario_id
where p.room_code=r.code
  and r.scenario_id between '021' and '034'
  and p.public_role='suspect'
  and p.internal_slot is not null
  and jsonb_typeof(sp.pack->'suspects')='array'
  and jsonb_array_length(sp.pack->'suspects')>=p.internal_slot;

do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count
  from public.igr_v4_scenario_packs
  where scenario_id between '001' and '034'
    and not public.igr_v42_valid_core_pack(scenario_id,pack);

  if bad_count<>0 then
    raise exception 'v42 core content audit failed for % scenario pack(s)',bad_count;
  end if;

  if (select count(*) from public.igr_v4_scenario_packs where scenario_id between '001' and '034')<>34 then
    raise exception 'v42 core content audit expected 34 scenario packs';
  end if;
end
$$;
