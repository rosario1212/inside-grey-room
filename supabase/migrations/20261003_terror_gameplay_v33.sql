-- Inside Grey Room — TERREUR 026–028 gameplay runtime v33
-- Additive only. State is stored in igr_v4_rooms.state and exposed through existing sync.
-- Public RPCs remain SECURITY DEFINER because the app uses opaque per-room player tokens instead of Supabase Auth.
-- Every exposed function validates that token and, where relevant, the caller's public role.

create or replace function public.igr_v33_terror_checkpoint(p_code text,p_player_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  w jsonb;
  losses jsonb := '[]'::jsonb;
  stage integer := 0;
  old_stage integer := -1;
  changed boolean := false;
  event_text text;
begin
  select * into p
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r
  from public.igr_v4_rooms
  where code=p.room_code
  for update;
  if r.scenario_id not in ('026','027','028') then raise exception 'not a terror scenario'; end if;
  if r.status not in ('playing','finished') then raise exception 'room is not playing'; end if;

  if coalesce(r.cycle,0)>=2 then stage:=1; end if;
  if coalesce(r.cycle,0)>=3 then stage:=2; end if;
  if coalesce(r.cycle,0)>=3 and r.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','reveal') then stage:=3; end if;

  st:=coalesce(r.state,'{}'::jsonb);
  rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  old_stage:=coalesce((rt->>'stage')::integer,-1);
  if old_stage>stage then stage:=old_stage; end if;

  if r.scenario_id='026' then
    if stage=0 then
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',9,'perimeter','stable','liaison','active');
    elsif stage=1 then
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',7,'perimeter','strained','liaison','active');
      losses:=jsonb_build_array('REGISTRE ADMINISTRATIF EXTERNE');
    elsif stage=2 then
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',5,'perimeter','critical','liaison','degraded');
      losses:=jsonb_build_array('REGISTRE ADMINISTRATIF EXTERNE','SOURCE INSTITUTIONNELLE SECONDAIRE');
    else
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',3,'perimeter','isolated','liaison','limited');
      losses:=jsonb_build_array('REGISTRE ADMINISTRATIF EXTERNE','SOURCE INSTITUTIONNELLE SECONDAIRE','CANAL DOCUMENTAIRE EXTÉRIEUR');
    end if;
  elsif r.scenario_id='027' then
    if stage=0 then w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',6,'perimeter','stable','liaison','active');
    elsif stage=1 then w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',5,'perimeter','strained','liaison','active');
    elsif stage=2 then w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',4,'perimeter','critical','liaison','degraded');
    else w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',3,'perimeter','critical','liaison','limited');
    end if;
  else
    if stage=0 then w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',3,'perimeter','critical','liaison','active');
    elsif stage=1 then
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',2,'perimeter','critical','liaison','degraded');
      losses:=jsonb_build_array('LIAISON INSTITUTIONNELLE SECONDAIRE');
    elsif stage=2 then
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',1,'perimeter','isolated','liaison','last');
      losses:=jsonb_build_array('LIAISON INSTITUTIONNELLE SECONDAIRE','RECOUPEMENT DOCUMENTAIRE EXTERNE');
    else
      w:=jsonb_build_object('kind','terror','districts_total',12,'districts_controlled',0,'perimeter','collapsed','liaison','lost');
      losses:=jsonb_build_array('LIAISON INSTITUTIONNELLE SECONDAIRE','RECOUPEMENT DOCUMENTAIRE EXTERNE','CONTACT EXTÉRIEUR DIRECT');
      if nullif(rt->>'selected_confirmation','') is null then
        rt:=jsonb_set(rt,'{missed_confirmation}','true'::jsonb,true);
      end if;
      rt:=jsonb_set(rt,'{evacuation}','"uncertain"'::jsonb,true);
    end if;
  end if;

  changed:=old_stage<>stage or st->'dlc_world' is distinct from w;
  rt:=jsonb_set(rt,'{stage}',to_jsonb(stage),true);
  rt:=jsonb_set(rt,'{lost_resources}',losses,true);
  st:=jsonb_set(st,'{dlc_world}',w,true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);

  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;

  if stage>old_stage then
    event_text:=case r.scenario_id
      when '026' then case stage when 0 then 'Le périmètre tient encore.' when 1 then 'Un secteur tombe. Une ressource administrative devient indisponible.' when 2 then 'La liaison se dégrade. Une seconde source extérieure disparaît du dossier.' else 'Le périmètre judiciaire est isolé. Les derniers recoupements extérieurs sont limités.' end
      when '027' then case stage when 0 then 'La cellule de crise attend une évaluation.' when 1 then 'La ville se contracte autour de la zone contestée.' when 2 then 'La liaison se dégrade. Crédibilité de l’information et sincérité de la source doivent être évaluées séparément.' else 'La décision extérieure approche. Le verdict judiciaire reste distinct de la recommandation de crise.' end
      else case stage when 0 then 'Le dernier périmètre tient encore.' when 1 then 'Une liaison secondaire est perdue.' when 2 then 'Dernière liaison disponible : une seule confirmation extérieure peut encore être demandée.' else 'La liaison extérieure est rompue. L’évacuation n’est plus garantie.' end
    end;
    insert into public.igr_v4_events(room_code,event_type,payload)
    values(r.code,'terror_checkpoint',jsonb_build_object('title','PÉRIMÈTRE','text',event_text));
  end if;

  return jsonb_build_object('ok',true,'changed',changed,'world',w,'runtime',rt);
end
$$;

create or replace function public.igr_v33_terror_rate(p_code text,p_player_token uuid,p_axis text,p_value text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  assessments jsonb;
  actor_label text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'027' or r.status<>'playing' then raise exception 'not available'; end if;

  if p_axis='credibility' then
    if p.public_role<>'enqueteur' then raise exception 'enqueteur only'; end if;
    if p_value not in ('incertaine','plausible','solide') then raise exception 'invalid value'; end if;
    actor_label:='L’Enquêteur';
  elsif p_axis='sincerity' then
    if p.public_role<>'analyste' then raise exception 'analyste only'; end if;
    if p_value not in ('faible','incertaine','forte') then raise exception 'invalid value'; end if;
    actor_label:='L’Analyste';
  else raise exception 'invalid axis'; end if;

  st:=coalesce(r.state,'{}'::jsonb);
  rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  assessments:=coalesce(rt->'assessments','{}'::jsonb);
  if assessments ? p_axis then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;
  assessments:=jsonb_set(assessments,array[p_axis],to_jsonb(p_value),true);
  rt:=jsonb_set(rt,'{assessments}',assessments,true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_assessment',jsonb_build_object('title','ÉVALUATION VERROUILLÉE','text',actor_label||' a verrouillé son évaluation indépendamment.'));
  return jsonb_build_object('ok',true,'runtime',rt);
end
$$;

create or replace function public.igr_v33_terror_decide_027(p_code text,p_player_token uuid,p_decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  assessments jsonb;
  outcome text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'027' or r.status<>'playing' then raise exception 'not available'; end if;
  if p.public_role<>'enqueteur' then raise exception 'enqueteur only'; end if;
  if r.phase<>'locking' then raise exception 'decision available during locking'; end if;
  if p_decision not in ('intervenir','retarder','annuler') then raise exception 'invalid decision'; end if;

  st:=coalesce(r.state,'{}'::jsonb);rt:=coalesce(st->'terror_runtime','{}'::jsonb);assessments:=coalesce(rt->'assessments','{}'::jsonb);
  if rt ? 'decision' then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;
  if not (assessments ? 'credibility') or not (assessments ? 'sincerity') then raise exception 'assessments incomplete'; end if;

  outcome:=case p_decision
    when 'intervenir' then 'Recommandation transmise : agir malgré une information encore contestée. La décision extérieure reste abstraite.'
    when 'retarder' then 'Recommandation transmise : suspendre la décision jusqu’à une confirmation supplémentaire.'
    else 'Recommandation transmise : ne pas agir sur la base du dossier actuel.'
  end;
  rt:=jsonb_set(rt,'{decision}',to_jsonb(p_decision),true);
  rt:=jsonb_set(rt,'{decision_outcome}',to_jsonb(outcome),true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_decision',jsonb_build_object('title','RECOMMANDATION EXTÉRIEURE','text',outcome));
  return jsonb_build_object('ok',true,'runtime',rt);
end
$$;

create or replace function public.igr_v33_terror_confirm_028(p_code text,p_player_token uuid,p_choice text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  st jsonb;
  rt jsonb;
  label text;
  result_text text;
begin
  select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;
  select * into r from public.igr_v4_rooms where code=p.room_code for update;
  if r.scenario_id<>'028' or r.status<>'playing' then raise exception 'not available'; end if;
  if p.public_role not in ('enqueteur','analyste') then raise exception 'investigation lead only'; end if;
  if coalesce(r.cycle,0)<3 or r.phase in ('closed','provisional_orals','provisional_lock','defense','final_debrief','locking','reveal') then raise exception 'liaison unavailable'; end if;
  if p_choice not in ('identite','chronologie','relais') then raise exception 'invalid choice'; end if;

  st:=coalesce(r.state,'{}'::jsonb);rt:=coalesce(st->'terror_runtime','{}'::jsonb);
  if nullif(rt->>'selected_confirmation','') is not null then return jsonb_build_object('ok',true,'runtime',rt,'already_locked',true); end if;

  if p_choice='identite' then
    label:='IDENTITÉ';
    result_text:='Une source extérieure confirme qu’un contact attribué au réseau a bien existé. Cela ne prouve pas à lui seul qui le dirigeait.';
  elsif p_choice='chronologie' then
    label:='CHRONOLOGIE';
    result_text:='Une source extérieure confirme qu’une liaison du réseau était encore active après la perte du secteur. Le niveau de responsabilité reste à établir.';
  else
    label:='RELAIS INTÉRIEUR';
    result_text:='Une source extérieure confirme qu’un relais du groupe a opéré à l’intérieur du périmètre protégé. Son exécutant matériel n’est pas automatiquement identifié.';
  end if;

  rt:=jsonb_set(rt,'{selected_confirmation}',to_jsonb(p_choice),true);
  rt:=jsonb_set(rt,'{selected_confirmation_label}',to_jsonb(label),true);
  rt:=jsonb_set(rt,'{confirmation_result}',to_jsonb(result_text),true);
  st:=jsonb_set(st,'{terror_runtime}',rt,true);
  update public.igr_v4_rooms set state=st,updated_at=now() where code=r.code;
  insert into public.igr_v4_events(room_code,event_type,payload)
  values(r.code,'terror_last_liaison',jsonb_build_object('title','DERNIÈRE LIAISON','text',result_text));
  return jsonb_build_object('ok',true,'runtime',rt);
end
$$;

revoke all on function public.igr_v33_terror_checkpoint(text,uuid) from public,anon,authenticated;
revoke all on function public.igr_v33_terror_rate(text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.igr_v33_terror_decide_027(text,uuid,text) from public,anon,authenticated;
revoke all on function public.igr_v33_terror_confirm_028(text,uuid,text) from public,anon,authenticated;
grant execute on function public.igr_v33_terror_checkpoint(text,uuid) to anon,authenticated;
grant execute on function public.igr_v33_terror_rate(text,uuid,text,text) to anon,authenticated;
grant execute on function public.igr_v33_terror_decide_027(text,uuid,text) to anon,authenticated;
grant execute on function public.igr_v33_terror_confirm_028(text,uuid,text) to anon,authenticated;
