-- Inside Grey Room v35 — SHORT / LONG duration presets
-- New rooms default to LONG. Existing in-progress rooms without duration_mode keep their legacy timing.

create or replace function public.igr_v35_duration_seconds(p_mode text, p_kind text)
returns integer
language sql
immutable
set search_path=''
as $$
  select case coalesce(p_mode,'legacy')
    when 'short' then case p_kind
      when 'pre_investigation' then 120
      when 'interrogation' then 300
      when 'cycle_debrief' then 90
      when 'confrontation' then 120
      when 'assembly' then 150
      when 'judicial_short' then 90
      when 'judicial_long' then 120
      when 'witness' then 180
      when 'final_debrief' then 120
      else null end
    when 'long' then case p_kind
      when 'pre_investigation' then 180
      when 'interrogation' then 480
      when 'cycle_debrief' then 120
      when 'confrontation' then 240
      when 'assembly' then 240
      when 'judicial_short' then 120
      when 'judicial_long' then 240
      when 'witness' then 240
      when 'final_debrief' then 180
      else null end
    else case p_kind
      when 'pre_investigation' then 120
      when 'interrogation' then 360
      when 'cycle_debrief' then 120
      when 'confrontation' then 240
      when 'assembly' then 240
      when 'judicial_short' then 120
      when 'judicial_long' then 180
      when 'witness' then 240
      when 'final_debrief' then 120
      else null end
  end
$$;

create or replace function public.igr_v35_seconds_label(p_seconds integer)
returns text
language sql
immutable
set search_path=''
as $$
  select lpad((greatest(coalesce(p_seconds,0),0)/60)::text,2,'0') || ':' || lpad((greatest(coalesce(p_seconds,0),0)%60)::text,2,'0')
$$;

create or replace function public.igr_v35_room_mode(p_room text)
returns text
language sql
stable
security definer
set search_path=''
as $$
  select case
    when state->>'duration_mode' in ('short','long') then state->>'duration_mode'
    else 'legacy'
  end
  from public.igr_v4_rooms
  where code=upper(trim(p_room))
$$;

create or replace function public.igr_v35_room_seconds(p_room text, p_kind text)
returns integer
language sql
stable
security definer
set search_path=''
as $$
  select public.igr_v35_duration_seconds(public.igr_v35_room_mode(p_room),p_kind)
$$;

create or replace function public.igr_v35_set_duration_mode(p_code text, p_host_token uuid, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  v_mode text:=lower(trim(coalesce(p_mode,'')));
begin
  if v_mode not in ('short','long') then raise exception 'invalid duration mode'; end if;
  select * into r from public.igr_v4_rooms where code=upper(trim(p_code)) for update;
  if not found or r.host_token<>p_host_token then raise exception 'forbidden'; end if;
  if r.status<>'lobby' or r.phase<>'lobby' then raise exception 'duration mode locked'; end if;
  update public.igr_v4_rooms
    set state=jsonb_set(coalesce(state,'{}'::jsonb),'{duration_mode}',to_jsonb(v_mode),true),updated_at=now()
    where code=r.code;
  return jsonb_build_object('ok',true,'mode',v_mode);
end
$$;

-- One authoritative timing hook. It fixes every entry into a timed phase without
-- duplicating the whole gameplay engine. Existing rooms without duration_mode are untouched.
create or replace function public.igr_v35_apply_room_duration()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_mode text;
  v_kind text;
  v_seconds integer;
begin
  if tg_op='INSERT' then
    if coalesce(new.state->>'duration_mode','') not in ('short','long') then
      new.state:=jsonb_set(coalesce(new.state,'{}'::jsonb),'{duration_mode}',to_jsonb('long'::text),true);
    end if;
    return new;
  end if;

  v_mode:=new.state->>'duration_mode';
  if v_mode not in ('short','long') then return new; end if;
  if not (new.phase is distinct from old.phase or new.phase_started_at is distinct from old.phase_started_at) then return new; end if;
  if new.phase_started_at is null then return new; end if;

  v_kind:=case new.phase
    when 'initial_debrief' then 'pre_investigation'
    when 'interrogation' then 'interrogation'
    when 'cycle_debrief' then 'cycle_debrief'
    when 'event_confrontation' then 'confrontation'
    when 'event_assembly' then 'assembly'
    when 'event_requete' then 'judicial_short'
    when 'event_saisine' then 'judicial_short'
    when 'annex_juge' then 'judicial_long'
    when 'annex_temoin' then 'witness'
    when 'final_debrief' then 'final_debrief'
    else null
  end;
  if v_kind is null then return new; end if;

  v_seconds:=public.igr_v35_duration_seconds(v_mode,v_kind);
  if v_seconds is not null then new.phase_ends_at:=new.phase_started_at+make_interval(secs=>v_seconds); end if;
  return new;
end
$$;

drop trigger if exists zz_igr_v35_apply_room_duration on public.igr_v4_rooms;
create trigger zz_igr_v35_apply_room_duration
before insert or update on public.igr_v4_rooms
for each row execute function public.igr_v35_apply_room_duration();

-- Keep the action menu and the authoritative phase timer on the same values.
create or replace function public.igr_v13_event_options(p_room text)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $$
declare
  r public.igr_v4_rooms%rowtype;
  q jsonb:='[]'::jsonb;
  used jsonb;
  suspect_count integer;
  inter_used integer;
  inter_max integer;
  confront_used integer;
  has_analyst boolean;
  has_third boolean;
  s_inter integer;
  s_confront integer;
  s_assembly integer;
  s_witness integer;
  s_judicial_short integer;
  s_judicial_long integer;
begin
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found or not public.igr_v13_is_core_scenario(r.scenario_id) or r.cycle not in (2,3) then return q; end if;

  used:=coalesce(r.state->'event_types_used','[]'::jsonb);
  inter_used:=coalesce((r.state->>'event_interrogations')::integer,0);
  confront_used:=coalesce((r.state->>'confrontations_used')::integer,0);
  inter_max:=public.igr_v13_interrogation_limit(r.code,r.cycle);
  select count(*) into suspect_count from public.igr_v4_players where room_code=r.code and public_role='suspect';
  has_analyst:=public.igr_v13_has_role(r.code,'analyste');
  has_third:=exists(select 1 from public.igr_v4_players where room_code=r.code and public_role in ('procureur','juge','inspecteur','expert','journaliste'));

  s_inter:=public.igr_v35_room_seconds(r.code,'interrogation');
  s_confront:=public.igr_v35_room_seconds(r.code,'confrontation');
  s_assembly:=public.igr_v35_room_seconds(r.code,'assembly');
  s_witness:=public.igr_v35_room_seconds(r.code,'witness');
  s_judicial_short:=public.igr_v35_room_seconds(r.code,'judicial_short');
  s_judicial_long:=public.igr_v35_room_seconds(r.code,'judicial_long');

  if inter_used<inter_max then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','interrogation','label','INTERROGATOIRE','seconds',s_inter,
      'hint',public.igr_v35_seconds_label(s_inter)||case when r.cycle=2 then '. Deux interrogatoires maximum dans ce cycle.' else '. Un seul interrogatoire maximum dans ce cycle.' end
    ));
  end if;

  if suspect_count>=2 and confront_used<3 then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','confrontation','label','CONFRONTATION','seconds',s_confront,
      'hint',public.igr_v35_seconds_label(s_confront)||'. Deux personnes. Les versions sont mises face à face.'
    ));
  end if;

  if has_analyst and has_third and not (used ? 'assembly') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','assembly','label','ASSEMBLÉE','seconds',s_assembly,
      'hint',public.igr_v35_seconds_label(s_assembly)||' de mise en commun. Au cycle 3, l’Enquêteur peut restreindre les participants.'
    ));
  end if;

  if not (used ? 'analyse_dossier') then
    q:=q||jsonb_build_array(jsonb_build_object('key','analyse_dossier','label','ANALYSE DU DOSSIER','seconds',240,'hint','04:00 pour relier la chronologie, les contradictions et les priorités.'));
  end if;

  if r.scenario_id between '021' and '034' and not (used ? 'signature') then
    q:=q||jsonb_build_array(jsonb_build_object(
      'key','signature',
      'label',case
        when r.scenario_id between '021' and '025' then 'EXPLOITER LA FAMIGLIA'
        when r.scenario_id between '026' and '028' then 'CELLULE DE CRISE'
        when r.scenario_id between '029' and '031' then 'PRESSION DU RÉSEAU'
        else 'CARTE DU POUVOIR'
      end,
      'seconds',240,'hint','Utiliser la mécanique propre au DLC. Ce choix consomme une action du cycle.'
    ));
  end if;

  if public.igr_v13_has_role(r.code,'inspecteur') and not (used ? 'retour_inspecteur') then
    q:=q||jsonb_build_array(jsonb_build_object('key','retour_inspecteur','label','RETOUR INSPECTEUR','seconds',180,'hint','Terrain puis restitution.'));
  end if;
  if public.igr_v13_has_role(r.code,'expert') and not (used ? 'expertise') then
    q:=q||jsonb_build_array(jsonb_build_object('key','expertise','label','EXPERTISE','seconds',180,'hint','Portée technique, jamais verdict.'));
  end if;
  if public.igr_v13_has_role(r.code,'temoin') and not (used ? 'temoin') then
    q:=q||jsonb_build_array(jsonb_build_object('key','temoin','label','TÉMOIN','seconds',s_witness,'hint',public.igr_v35_seconds_label(s_witness)||' de fenêtre globale.'));
  end if;
  if public.igr_v13_has_role(r.code,'journaliste') and not (used ? 'enquete_journalistique') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_journalistique','label','ENQUÊTE JOURNALISTIQUE','seconds',180,'hint','Enquêter sur une personne puis décider quoi en faire.'));
  end if;
  if public.igr_v13_has_role(r.code,'inspecteur') and public.igr_v13_has_role(r.code,'journaliste') and not (used ? 'enquete_croisee') then
    q:=q||jsonb_build_array(jsonb_build_object('key','enquete_croisee','label','ENQUÊTE CROISÉE','seconds',180,'hint','Même piste, intérêts différents.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and not (used ? 'procureur') then
    q:=q||jsonb_build_array(jsonb_build_object('key','procureur','label','ENTRETIEN PROCUREUR','seconds',180,'hint','Stratégie de poursuite ou entretien ciblé.'));
  end if;
  if public.igr_v13_has_role(r.code,'juge') and not (used ? 'juge') then
    q:=q||jsonb_build_array(jsonb_build_object('key','juge','label','DÉCISION DU JUGE','seconds',s_judicial_long,'hint',public.igr_v35_seconds_label(s_judicial_long)||'. Information protégée ou arbitrage.'));
  end if;
  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'procureur') and not (used ? 'negociation') then
    q:=q||jsonb_build_array(jsonb_build_object('key','negociation','label','NÉGOCIATION','seconds',180,'hint','Avocat et Procureur.'));
  end if;
  if public.igr_v13_has_role(r.code,'maitre') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'requete') then
    q:=q||jsonb_build_array(jsonb_build_object('key','requete','label','REQUÊTE','seconds',s_judicial_short,'hint',public.igr_v35_seconds_label(s_judicial_short)||'. Avocat et Juge.'));
  end if;
  if public.igr_v13_has_role(r.code,'procureur') and public.igr_v13_has_role(r.code,'juge') and not (used ? 'saisine') then
    q:=q||jsonb_build_array(jsonb_build_object('key','saisine','label','SAISINE','seconds',s_judicial_short,'hint',public.igr_v35_seconds_label(s_judicial_short)||'. Procureur et Juge.'));
  end if;

  return q;
end
$$;

grant execute on function public.igr_v35_set_duration_mode(text,uuid,text) to anon, authenticated;
grant execute on function public.igr_v35_room_mode(text) to anon, authenticated;
grant execute on function public.igr_v35_room_seconds(text,text) to anon, authenticated;
