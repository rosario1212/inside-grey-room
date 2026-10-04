-- Inside Grey Room v40 — scenario 001 playtest/audit corrections.
-- Keeps the core story and roles intact; fixes playable defense, clue balance,
-- and the cycle-3 interrogation contract when no Analyst is present.

with rebuilt as (
  select p.scenario_id,
         jsonb_agg(
           case ord
             when 1 then s || jsonb_build_object(
               'objective_main','Protège l’existence de l’intermédiaire aussi longtemps que possible : l’avouer revient à reconnaître l’intimidation. Si l’enquête menace de te faire porter le meurtre, assume alors l’intimidation et distingue-la du coup mortel.',
               'position','Ne révèle pas gratuitement l’existence de l’intermédiaire. Tant que l’enquête ne te fait pas porter le meurtre, défends uniquement ta chronologie. Si tu dois choisir, assume l’intimidation plutôt qu’un homicide que tu n’as pas commis.'
             )
             when 2 then s || jsonb_build_object(
               'objective_main','Minimise tes faits. Évite que ta présence soit reliée au coup mortel et exploite la première dispute comme explication concurrente.',
               'position','Ta ligne de défense : ne nie pas être passé dans l’hôtel si l’enquête peut te placer dans le secteur. Tu n’avais aucun lien personnel avec Maël. Admets seulement ce que les éléments imposent, insiste sur la première dispute et oblige l’Enquêteur à distinguer présence, désordre de la chambre et coup mortel.',
               'anchors','Quand tu arrives, la chambre est déjà en désordre et la première dispute a eu lieu avant toi. Tu n’as aucun lien personnel avec Maël : c’est le seul point vrai que tu peux utiliser sans inventer d’alibi.'
             )
             else s
           end
           order by ord
         ) as suspects
  from public.igr_v4_scenario_packs p
  cross join lateral jsonb_array_elements(coalesce(p.pack->'suspects','[]'::jsonb)) with ordinality x(s,ord)
  where p.scenario_id='001'
  group by p.scenario_id
)
update public.igr_v4_scenario_packs p
set pack=jsonb_set(p.pack,'{suspects}',r.suspects,true),updated_at=now()
from rebuilt r
where p.scenario_id=r.scenario_id;

with rebuilt as (
  select p.scenario_id,
         jsonb_agg(
           case ord
             when 1 then t || jsonb_build_object(
               'title','MOTO ENCORE AU PARKING',
               'text','À 03 h 10, la moto associée au client de l’hôtel est encore sur le parking. Elle quitte les lieux peu après. Cela confirme sa présence dans l’hôtel pendant la seconde séquence, sans prouver qu’il est entré dans la chambre 222.',
               'axes',jsonb_build_array('chronologie','acces'),
               'kind','ambiguity'
             )
             when 2 then t || jsonb_build_object(
               'title','TÉLÉPHONE ACTIF APRÈS 02 H 32',
               'text','Un appel bref est émis depuis le téléphone de Maël après 02 h 32. L’appareil est encore dans l’hôtel, mais l’enregistrement ne permet pas d’identifier qui l’utilise.',
               'axes',jsonb_build_array('chronologie'),
               'kind','balanced'
             )
             else t
           end
           order by ord
         ) as trames
  from public.igr_v4_scenario_packs p
  cross join lateral jsonb_array_elements(coalesce(p.pack->'trames','[]'::jsonb)) with ordinality x(t,ord)
  where p.scenario_id='001'
  group by p.scenario_id
)
update public.igr_v4_scenario_packs p
set pack=jsonb_set(p.pack,'{trames}',r.trames,true),updated_at=now()
from rebuilt r
where p.scenario_id=r.scenario_id;

create or replace function public.igr_v13_interrogation_limit(p_room text,p_cycle integer)
returns integer
language plpgsql
stable
security definer
set search_path to ''
as $$
declare has_analyst boolean;
begin
  has_analyst:=public.igr_v13_has_role(p_room,'analyste');
  if p_cycle=1 then return 3; end if;
  if p_cycle=2 then return 2; end if;
  if p_cycle=3 then return case when has_analyst then 1 else 2 end; end if;
  return 0;
end
$$;

create or replace function public.igr_v13_event_options(p_room text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  q jsonb;
  r public.igr_v4_rooms%rowtype;
  inter_max integer:=0;
  s_inter integer:=public.igr_v35_room_seconds(p_room,'interrogation');
  s_confront integer:=public.igr_v35_room_seconds(p_room,'confrontation');
  s_assembly integer:=public.igr_v35_room_seconds(p_room,'assembly');
  s_witness integer:=public.igr_v35_room_seconds(p_room,'witness');
  s_judicial_short integer:=public.igr_v35_room_seconds(p_room,'judicial_short');
  s_judicial_long integer:=public.igr_v35_room_seconds(p_room,'judicial_long');
begin
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found then return '[]'::jsonb; end if;
  inter_max:=public.igr_v13_interrogation_limit(p_room,r.cycle);

  select coalesce(jsonb_agg(
    case item->>'key'
      when 'interrogation' then jsonb_set(
        jsonb_set(item,'{seconds}',to_jsonb(s_inter),true),
        '{hint}',
        to_jsonb(public.igr_v35_seconds_label(s_inter)||case
          when r.cycle=2 then '. Maximum deux interrogatoires dans ce cycle.'
          when inter_max>=2 then '. Sans Analyste : jusqu’à deux interrogatoires dans ce cycle.'
          else '. Un seul interrogatoire maximum dans ce cycle.'
        end),true)
      when 'confrontation' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_confront),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_confront)||'. Deux personnes. Les versions sont mises face à face.'),true)
      when 'assembly' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_assembly),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_assembly)||' de mise en commun. Au cycle 3, l’Enquêteur peut restreindre les participants.'),true)
      when 'temoin' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_witness),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_witness)||' de fenêtre globale.'),true)
      when 'juge' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_long),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_long)||'. Information protégée ou arbitrage.'),true)
      when 'requete' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_short),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_short)||'. Avocat et Juge.'),true)
      when 'saisine' then jsonb_set(jsonb_set(item,'{seconds}',to_jsonb(s_judicial_short),true),'{hint}',to_jsonb(public.igr_v35_seconds_label(s_judicial_short)||'. Procureur et Juge.'),true)
      else item
    end
  ),'[]'::jsonb) into q
  from jsonb_array_elements(public.igr_v13_event_options_v34(p_room)) item;
  return q;
end
$$;

create or replace function public.igr_v4_start_cycle(p_room text,p_cycle integer)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  order_json jsonb;
  st jsonb;
  suspect_count integer;
  lim integer;
  cycle_copy text;
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
  st:=coalesce(r.state,'{}'::jsonb);
  st:=jsonb_set(st,'{heard}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_queue}','[]'::jsonb,true);
  st:=jsonb_set(st,'{annex_index}','0'::jsonb,true);
  st:=jsonb_set(st,'{interrogation_order}',order_json,true);
  st:=jsonb_set(st,'{interrogation_limit}',to_jsonb(lim),true);
  st:=jsonb_set(st,'{interrogation_count}','0'::jsonb,true);
  st:=st-'event_options'-'event_active'-'event_targets'-'event_participants'-'v13_event_mode'-'current_target'-'interrogation_mode';
  update public.igr_v4_rooms set cycle=p_cycle,state=st,updated_at=now() where code=p_room;

  if p_cycle=1 then
    update public.igr_v4_rooms set phase='interrogation_select',phase_started_at=now(),phase_ends_at=null,updated_at=now() where code=p_room;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object('title','CYCLE 1 · PREMIÈRES VERSIONS','text','Trois interrogatoires de 06:00 maximum. L’Enquêteur choisit l’ordre.'));
  else
    perform public.igr_v13_enter_event_select(p_room,3,true);
    cycle_copy:=case
      when p_cycle=2 then 'Trois actions au choix. Maximum deux interrogatoires de 06:00.'
      when lim>=2 then 'Trois actions au choix. Sans Analyste : jusqu’à deux interrogatoires de 06:00.'
      else 'Trois actions au choix. Maximum un interrogatoire de 06:00.'
    end;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(p_room,'cycle',jsonb_build_object(
      'title','CYCLE '||p_cycle||case when p_cycle=3 then ' · RÉSOLUTION' else ' · DIRECTION' end,
      'text',cycle_copy
    ));
  end if;
end
$$;