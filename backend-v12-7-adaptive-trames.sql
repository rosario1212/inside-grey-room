-- Inside Grey Room v12.7 — adaptive trame director
-- Applied to Supabase production on 2026-09-28.
--
-- Goals:
-- 1) keep every trame canonical/pre-written;
-- 2) use debrief answers to select a relevant trame;
-- 3) keep controlled randomness only between relevant candidates;
-- 4) avoid repeating the same investigation axis or duplicating specialist evidence;
-- 5) avoid over-revealing responsibility too early.

update public.igr_v4_scenario_packs p
set pack=jsonb_set(
  p.pack,
  '{trames}',
  (
    select jsonb_agg(
      jsonb_set(
        case p.scenario_id||':'||t.ord
          when '007:1' then jsonb_set(t.value,'{title}',to_jsonb('BROUILLON TESTAMENTAIRE'::text),true)
          when '007:2' then jsonb_set(t.value,'{title}',to_jsonb('MOUVEMENT PATRIMONIAL'::text),true)
          when '007:3' then jsonb_set(t.value,'{title}',to_jsonb('DISPUTE AVANCÉE'::text),true)
          when '007:4' then jsonb_set(t.value,'{title}',to_jsonb('SIGNATURE SOUS PRESSION'::text),true)
          when '007:5' then jsonb_set(t.value,'{title}',to_jsonb('HÉRITAGE RECONFIGURÉ'::text),true)
          when '007:6' then jsonb_set(t.value,'{title}',to_jsonb('DETTE PRIVÉE'::text),true)
          when '008:1' then jsonb_set(t.value,'{title}',to_jsonb('HORAIRES INCOMPATIBLES'::text),true)
          when '008:2' then jsonb_set(t.value,'{title}',to_jsonb('PIÈCE CONNUE AVANT DÉPOSITION'::text),true)
          when '008:3' then jsonb_set(t.value,'{title}',to_jsonb('MENSONGE SECONDAIRE'::text),true)
          when '008:4' then jsonb_set(t.value,'{title}',to_jsonb('TÉMOIN SOUS PRESSION'::text),true)
          when '008:5' then jsonb_set(t.value,'{title}',to_jsonb('VÉRITÉ PARTIELLE'::text),true)
          when '008:6' then jsonb_set(t.value,'{title}',to_jsonb('MENSONGE ≠ RESPONSABILITÉ'::text),true)
          when '009:1' then jsonb_set(t.value,'{title}',to_jsonb('CONSENTEMENT RETIRÉ'::text),true)
          when '009:2' then jsonb_set(t.value,'{title}',to_jsonb('AMNÉSIE COMPATIBLE'::text),true)
          when '009:3' then jsonb_set(t.value,'{title}',to_jsonb('PROTOCOLE DÉPASSÉ'::text),true)
          when '009:4' then jsonb_set(t.value,'{title}',to_jsonb('NOTE CLINIQUE MODIFIÉE'::text),true)
          when '009:5' then jsonb_set(t.value,'{title}',to_jsonb('OPPOSITION ENREGISTRÉE'::text),true)
          when '009:6' then jsonb_set(t.value,'{title}',to_jsonb('AVANT L’AMNÉSIE'::text),true)
          when '010:1' then jsonb_set(t.value,'{title}',to_jsonb('OUVERTURE 13:54'::text),true)
          when '010:2' then jsonb_set(t.value,'{title}',to_jsonb('PORTE REFERMÉE'::text),true)
          when '010:3' then jsonb_set(t.value,'{title}',to_jsonb('NORA ENCORE VIVANTE'::text),true)
          when '010:4' then jsonb_set(t.value,'{title}',to_jsonb('ACCÈS SECONDAIRE INUTILISÉ'::text),true)
          when '010:5' then jsonb_set(t.value,'{title}',to_jsonb('BRUITS ANTÉRIEURS'::text),true)
          when '010:6' then jsonb_set(t.value,'{title}',to_jsonb('DEUX RESPONSABILITÉS POSSIBLES'::text),true)
          when '011:1' then jsonb_set(t.value,'{title}',to_jsonb('ORDRE INCOMPLET'::text),true)
          when '011:2' then jsonb_set(t.value,'{title}',to_jsonb('RAPPORT RÉÉCRIT'::text),true)
          when '011:3' then jsonb_set(t.value,'{title}',to_jsonb('INFORMATIONS ASYMÉTRIQUES'::text),true)
          when '011:4' then jsonb_set(t.value,'{title}',to_jsonb('36 HEURES DE RETARD'::text),true)
          when '011:5' then jsonb_set(t.value,'{title}',to_jsonb('DÉPASSEMENT D’INSTRUCTION'::text),true)
          when '011:6' then jsonb_set(t.value,'{title}',to_jsonb('CHAÎNE DE RESPONSABILITÉ'::text),true)
          else t.value
        end,
        '{axes}',
        to_jsonb(array_remove(array[
          case when lower(coalesce(t.value->>'title','')||' '||coalesce(t.value->>'text','')) ~ '(heure|minute|avant|après|apres|ordre des faits|retard|chrono|horodat|timing|séquence|sequence|fenêtre|fenetre|délai|delai)' then 'chronologie' end,
          case when lower(coalesce(t.value->>'title','')||' '||coalesce(t.value->>'text','')) ~ '(accès|acces|badge|porte|sortie|entrée|entree|couloir|caméra|camera|véhicule|vehicule|déplacement|deplacement|passage|toit|palier|verrou)' then 'acces' end,
          case when lower(coalesce(t.value->>'title','')||' '||coalesce(t.value->>'text','')) ~ '(message|appel|téléphone|telephone|relation|dette|menace|pression|dispute|mobile|paiement|virement|héritage|heritage|motif|famille)' then 'mobile' end,
          case when lower(coalesce(t.value->>'title','')||' '||coalesce(t.value->>'text','')) ~ '(trace|arme|objet|matériel|materiel|technique|détecteur|detecteur|système|systeme|empreinte|sang|adn|analyse|feu|matériau|materiau|toxic|lésion|lesion|médico|medico|balistique|sédatif|sedatif)' then 'materiel' end,
          case when lower(coalesce(t.value->>'title','')||' '||coalesce(t.value->>'text','')) ~ '(responsabil|ordre|décision|decision|consent|risque|alerte|savait|ignor|dissimul|protég|protege|autorisa|omission|instruction|pression|secret|silence)' then 'responsabilite' end
        ]::text[],null)),
        true
      ) order by t.ord
    )
    from jsonb_array_elements(coalesce(p.pack->'trames','[]'::jsonb)) with ordinality t(value,ord)
  ),
  true
);

create or replace function public.igr_v4_emit_trame(p_room text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  used jsonb;
  wanted text:='balanced';
  wanted_axis text:='';
  second_axis text:='';
  last_axis text:='';
  tr jsonb:=null;
  chosen_idx int:=null;
  chosen_axis text:='';
  conv numeric:=1;
  conf numeric:=1;
  conv_min int:=1;
  conv_max int:=1;
  conf_min int:=1;
  conf_max int:=1;
  responders int:=0;
  top_axis_votes int:=0;
  strong int:=0;
  field_count int:=0;
  expert_count int:=0;
  judge_count int:=0;
  news_count int:=0;
begin
  select * into r from public.igr_v4_rooms where code=p_room for update;
  if not found then return; end if;
  select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
  used:=coalesce(r.state->'used_trames','{}'::jsonb);

  select
    coalesce(avg(coalesce((payload->>'convergence')::int,1)),1),
    coalesce(avg(coalesce((payload->>'confusion')::int,1)),1),
    coalesce(min(coalesce((payload->>'convergence')::int,1)),1),
    coalesce(max(coalesce((payload->>'convergence')::int,1)),1),
    coalesce(min(coalesce((payload->>'confusion')::int,1)),1),
    coalesce(max(coalesce((payload->>'confusion')::int,1)),1),
    count(*)::int
  into conv,conf,conv_min,conv_max,conf_min,conf_max,responders
  from public.igr_v4_actions
  where room_code=r.code and cycle=r.cycle and action_type='debrief';

  select coalesce(q.axis,''),q.c into wanted_axis,top_axis_votes
  from (
    select nullif(payload->>'axis','') axis,count(*)::int c
    from public.igr_v4_actions
    where room_code=r.code and cycle=r.cycle and action_type='debrief'
    group by 1
    order by c desc,random()
    limit 1
  ) q;
  wanted_axis:=coalesce(wanted_axis,'');

  select coalesce(q.axis,'') into second_axis
  from (
    select nullif(payload->>'axis','') axis,count(*)::int c
    from public.igr_v4_actions
    where room_code=r.code and cycle=r.cycle and action_type='debrief'
      and nullif(payload->>'axis','') is distinct from nullif(wanted_axis,'')
    group by 1
    order by c desc,random()
    limit 1
  ) q;
  second_axis:=coalesce(second_axis,'');

  select
    count(*) filter (where action_type in ('field','expert','judge'))::int,
    count(*) filter (where action_type='field')::int,
    count(*) filter (where action_type='expert')::int,
    count(*) filter (where action_type='judge')::int,
    count(*) filter (where action_type='breaking_news')::int
  into strong,field_count,expert_count,judge_count,news_count
  from public.igr_v4_actions
  where room_code=r.code and cycle=r.cycle;

  select coalesce(payload->>'adaptive_axis','') into last_axis
  from public.igr_v4_events
  where room_code=r.code and event_type='trame'
  order by id desc limit 1;
  last_axis:=coalesce(last_axis,'');

  if responders>=2 and ((conv_max-conv_min)>=2 or (conf_max-conf_min)>=2) then
    wanted:='balanced';
  elsif coalesce(conf,1)>=1.5 and coalesce(conv,1)<1.5 then
    wanted:='clarity';
  elsif coalesce(conv,1)>=1.5 and coalesce(conf,1)<1.5 then
    wanted:='ambiguity';
  elsif coalesce(conv,1)>=1.5 and coalesce(conf,1)>=1.5 then
    wanted:='balanced';
  else
    wanted:='balanced';
  end if;

  if strong>=2 and wanted='clarity' and conf<2 then wanted:='balanced'; end if;
  if strong>=2 and conv>=1.5 and conf<1.5 then wanted:='ambiguity'; end if;

  with raw as (
    select
      (ord-1)::int idx,
      t.tr,
      coalesce(t.tr->>'kind','balanced') kind,
      coalesce((t.tr->>'min_cycle')::int,1) min_cycle,
      coalesce(t.tr->'axes','[]'::jsonb) axes
    from jsonb_array_elements(coalesce(pack->'trames','[]'::jsonb)) with ordinality as t(tr,ord)
    where coalesce((t.tr->>'min_cycle')::int,1)<=r.cycle
      and not (used ? ((ord-1)::int)::text)
  ), scored as (
    select raw.*,
      case
        when wanted_axis<>'' and axes ? wanted_axis then wanted_axis
        when second_axis<>'' and axes ? second_axis then second_axis
        when jsonb_array_length(axes)>0 then axes->>0
        else ''
      end candidate_axis,
      (
        case when kind=wanted then 9 when kind='balanced' then 4 when wanted='balanced' then 2 else 0 end
        + case when wanted_axis<>'' and axes ? wanted_axis then 8 else 0 end
        + case when second_axis<>'' and axes ? second_axis then 3 else 0 end
        + case when min_cycle=r.cycle then 2 else 0 end
        + case when r.cycle=3 and kind='clarity' then 1 else 0 end
        - case when last_axis<>'' and axes ? last_axis and not (wanted_axis<>'' and axes ? wanted_axis) then 4 else 0 end
        - case when expert_count>0 and axes ? 'materiel' and wanted_axis<>'materiel' then 2 else 0 end
        - case when field_count>0 and axes ? 'acces' and wanted_axis<>'acces' then 2 else 0 end
        - case when judge_count>0 and axes ? 'responsabilite' and wanted_axis<>'responsabilite' then 1 else 0 end
        - case when news_count>0 and axes ? 'mobile' and wanted_axis<>'mobile' then 1 else 0 end
        - case when r.cycle=1 and lower(coalesce(tr->>'text','')) ~ '(responsable principal|coupable|meurtrier|tueur)' then 7 else 0 end
        + random()*2.25
      ) score
    from raw
  )
  select s.tr,s.idx,s.candidate_axis into tr,chosen_idx,chosen_axis
  from scored s
  order by s.score desc
  limit 1;

  if tr is null or chosen_idx is null then return; end if;
  used:=used||jsonb_build_object(chosen_idx::text,true);
  update public.igr_v4_rooms
  set state=jsonb_set(state,'{used_trames}',used,true),updated_at=now()
  where code=r.code;

  insert into public.igr_v4_events(room_code,event_type,visibility,audience_roles,payload)
  values(
    r.code,
    'trame',
    'roles',
    array['enqueteur','analyste','procureur','juge','inspecteur','expert']::text[],
    jsonb_build_object(
      'title',tr->>'title',
      'text',tr->>'text',
      'cycle',r.cycle,
      'adaptive_kind',wanted,
      'adaptive_axis',coalesce(nullif(chosen_axis,''),wanted_axis),
      'director_version','v12.7'
    )
  );
end
$$;

revoke all on function public.igr_v4_emit_trame(text) from public;
grant execute on function public.igr_v4_emit_trame(text) to service_role;
