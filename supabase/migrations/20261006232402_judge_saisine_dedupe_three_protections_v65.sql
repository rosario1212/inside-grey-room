-- Inside Grey Room v65 — Judge request dedupe + 3-protection personal objective rule
-- Canonical rules:
-- 1) the same requester cannot submit the same kind + protected element twice in one game;
-- 2) the Judge may consume at most 3 protections;
-- 3) consuming the 3rd protection fails only the Judge's personal objective;
-- 4) camp victory remains independent from the personal objective.

create or replace function public.igr_v44_submit_judge_request(
  p_code text,
  p_player_token uuid,
  p_kind text,
  p_element text default null,
  p_note text default ''
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  j public.igr_v4_players%rowtype;
  pack jsonb;
  item jsonb;
  valid boolean:=false;
  v_note text;
  v_element text;
  new_id bigint;
begin
  perform igr_private.rate_limit('v44_judge_request',p_player_token::text,12,60);

  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;
  if not found or r.status<>'playing' or r.cycle not between 1 and 3 then
    raise exception 'request window closed';
  end if;

  select * into j
  from public.igr_v4_players
  where room_code=r.code and public_role='juge'
  order by seat_index limit 1;
  if not found then raise exception 'judge unavailable'; end if;

  valid :=
    (me.public_role='enqueteur' and p_kind='investigation_access')
    or (me.public_role='maitre' and p_kind in ('lawyer_confidentiality','lawyer_agreement'))
    or (me.public_role='procureur' and p_kind in ('prosecutor_access','prosecutor_hearing','prosecutor_agreement'))
    or (me.public_role='journaliste' and p_kind in ('journalist_access','journalist_publish','journalist_source'));
  if not valid then raise exception 'forbidden'; end if;

  if exists(
    select 1
    from public.igr_v44_judge_requests q
    where q.room_code=r.code
      and q.requester_id=me.id
      and q.status='pending'
  ) then
    raise exception 'request already pending';
  end if;

  select x.pack into pack
  from public.igr_v4_scenario_packs x
  where x.scenario_id=r.scenario_id;

  v_element:=nullif(trim(coalesce(p_element,'')),'');

  if p_kind in ('investigation_access','lawyer_confidentiality','prosecutor_access','journalist_access','journalist_publish') then
    if v_element is null then raise exception 'protected element required'; end if;
    select v into item
    from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v
    where v->>'id'=v_element
    limit 1;
    if item is null then raise exception 'invalid protected element'; end if;
  elsif v_element is not null then
    select v into item
    from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v
    where v->>'id'=v_element
    limit 1;
    if item is null then raise exception 'invalid protected element'; end if;
  end if;

  if exists(
    select 1
    from public.igr_v44_judge_requests q
    where q.room_code=r.code
      and q.requester_id=me.id
      and q.kind=p_kind
      and coalesce(q.element_id,'')=coalesce(v_element,'')
  ) then
    raise exception 'request already used';
  end if;

  v_note:=left(regexp_replace(trim(coalesce(p_note,'')),'\s+',' ','g'),180);
  if v_note<>'' then perform igr_private.assert_ugc(v_note,180,false); end if;

  insert into public.igr_v44_judge_requests(room_code,requester_id,judge_id,kind,element_id,note)
  values(r.code,me.id,j.id,p_kind,v_element,v_note)
  returning id into new_id;

  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(
    r.code,'judge_request','private',j.id,
    jsonb_build_object('title','NOUVELLE SAISINE','text',me.pseudo||' saisit le Juge.','request_id',new_id)
  );

  return jsonb_build_object('ok',true,'request_id',new_id);
end
$function$;

create or replace function public.igr_v44_judge_decide_request(
  p_code text,
  p_player_token uuid,
  p_request bigint,
  p_outcome text,
  p_note text default ''
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  q public.igr_v44_judge_requests%rowtype;
  requester public.igr_v4_players%rowtype;
  consume boolean:=false;
  used integer;
  used_after integer;
  v_note text;
begin
  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found or me.public_role<>'juge' then raise exception 'forbidden'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code for update;

  select * into q
  from public.igr_v44_judge_requests
  where id=p_request and room_code=r.code and judge_id=me.id
  for update;
  if not found or q.status<>'pending' then raise exception 'request unavailable'; end if;

  select * into requester from public.igr_v4_players where id=q.requester_id;

  if q.kind in ('investigation_access','prosecutor_access','journalist_access','journalist_publish') then
    if p_outcome not in ('open','partial','protected') then raise exception 'invalid outcome'; end if;
    consume:=p_outcome in ('partial','protected');
  elsif q.kind in ('lawyer_confidentiality','journalist_source') then
    if p_outcome not in ('approve','limit','refuse') then raise exception 'invalid outcome'; end if;
    consume:=p_outcome in ('approve','limit');
  else
    if p_outcome not in ('approve','limit','refuse') then raise exception 'invalid outcome'; end if;
  end if;

  if consume and q.element_id is not null and exists(
    select 1
    from public.igr_v44_judge_requests prior
    where prior.room_code=r.code
      and prior.protection_consumed=true
      and prior.element_id=q.element_id
      and prior.id<>q.id
  ) then
    consume:=false;
  end if;

  used:=public.igr_v44_protection_count(r.code);
  if consume and used>=3 then raise exception 'protection quota reached'; end if;
  used_after:=used+case when consume then 1 else 0 end;

  v_note:=left(regexp_replace(trim(coalesce(p_note,'')),'\s+',' ','g'),180);
  if v_note<>'' then perform igr_private.assert_ugc(v_note,180,false); end if;

  update public.igr_v44_judge_requests
  set status='decided',
      outcome=p_outcome,
      decision_note=v_note,
      protection_consumed=consume,
      decided_at=now()
  where id=q.id;

  if consume then
    insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload)
    values(
      r.code,me.id,r.cycle,'judge',
      jsonb_build_object('request_id',q.id,'choice',q.element_id,'cost',1,'source','v65')
    );
  end if;

  perform public.igr_v44_emit_protected_access(r.code,q.id,p_outcome);

  insert into public.igr_v4_events(room_code,event_type,visibility,target_player_id,payload)
  values(
    r.code,'judge_decision','private',requester.id,
    jsonb_build_object(
      'title','DÉCISION DU JUGE',
      'text',case p_outcome
        when 'open' then 'Accès accordé.'
        when 'partial' then 'Accès partiel accordé.'
        when 'protected' then 'Élément maintenu protégé.'
        when 'approve' then 'Demande acceptée.'
        when 'limit' then 'Demande acceptée avec limites.'
        else 'Demande refusée.'
      end,
      'outcome',p_outcome,
      'request_id',q.id,
      'note',v_note
    )
  );

  return jsonb_build_object(
    'ok',true,
    'outcome',p_outcome,
    'protections_used',used_after,
    'protections_limit',3,
    'protections_remaining',greatest(0,3-used_after),
    'personal_objective_failed',used_after>=3
  );
end
$function$;

create or replace function public.igr_v44_role_state(
  p_code text,
  p_player_token uuid
) returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  s jsonb;
  me public.igr_v4_players%rowtype;
  r public.igr_v4_rooms%rowtype;
  can_consult boolean:=false;
  used integer:=0;
  integrity jsonb:=null;
begin
  s:=public.igr_v50_judge_state_legacy(p_code,p_player_token);

  select * into me
  from public.igr_v4_players
  where room_code=upper(trim(p_code)) and player_token=p_player_token;
  if not found then raise exception 'unauthorized'; end if;

  select * into r from public.igr_v4_rooms where code=me.room_code;

  if me.public_role='juge' then
    used:=public.igr_v44_protection_count(r.code);
    integrity:=coalesce(s->'judge_integrity','{}'::jsonb)
      ||jsonb_build_object(
        'personal_objective_failed',used>=3,
        'protections_used',used,
        'protections_limit',3
      );
  end if;

  if me.public_role='suspect'
     and r.phase='interrogation'
     and r.state->>'current_target'=me.id::text
     and not exists(
       select 1
       from public.igr_v44_lawyer_consultations c
       where c.room_code=r.code and c.suspect_id=me.id and c.cycle=r.cycle
     )
  then
    can_consult:=exists(
      select 1 from public.igr_v4_players l
      where l.room_code=r.code and l.public_role='maitre'
    );
  end if;

  return s||jsonb_build_object(
    'version','v65',
    'summon',null,
    'review',null,
    'free_players','[]'::jsonb,
    'consultation_used',exists(
      select 1
      from public.igr_v44_lawyer_consultations c
      where c.room_code=r.code and c.suspect_id=me.id and c.cycle=r.cycle
    ),
    'can_request_lawyer_consultation',can_consult,
    'natural_interactions',true,
    'protections_used',case when me.public_role='juge' then used else null end,
    'protections_limit',3,
    'protections_remaining',case when me.public_role='juge' then greatest(0,3-used) else null end,
    'judge_integrity',integrity
  );
end
$function$;

create or replace function public.igr_v59_judge_objective()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  target public.igr_v4_players%rowtype;
  truth int;
begin
  if new.public_role='juge' then
    if coalesce((new.private_state->>'judge_corrupt')::boolean,false) then
      select * into target
      from public.igr_v4_players p
      where p.room_code=new.room_code
        and p.id::text=new.private_state->>'judge_corruption_target_id';

      select (sp.pack->'truth'->'levels'->>(target.internal_slot-1))::int
      into truth
      from public.igr_v4_scenario_packs sp
      join public.igr_v4_rooms rr on rr.scenario_id=sp.scenario_id
      where rr.code=new.room_code;

      if target.id is null or coalesce(truth,0)=0 then
        select p.* into target
        from public.igr_v4_players p
        join public.igr_v4_rooms rr on rr.code=p.room_code
        join public.igr_v4_scenario_packs sp on sp.scenario_id=rr.scenario_id
        where p.room_code=new.room_code
          and p.public_role='suspect'
          and coalesce((sp.pack->'truth'->'levels'->>(p.internal_slot-1))::int,0)>0
        order by p.seat_index
        limit 1;
      end if;

      if target.id is null then
        new.private_state:=new.private_state||jsonb_build_object(
          'judge_corrupt',false,
          'judge_integrity_objective',
          'Rends une décision exacte et impartiale pour chaque suspect. Tu peux utiliser jusqu’à 3 protections, mais consommer la 3e fait échouer cet objectif personnel sans annuler une victoire de ton camp.'
        );
      else
        new.private_state:=new.private_state||jsonb_build_object(
          'judge_corruption_target_id',target.id::text,
          'judge_corruption_target',target.pseudo,
          'judge_integrity_objective',
          'Retiens pour '||target.pseudo||' une responsabilité inférieure à sa responsabilité réelle sans obtenir une majorité de votes de corruption. Tu peux utiliser jusqu’à 3 protections, mais consommer la 3e fait échouer cet objectif personnel sans annuler une victoire de ton camp.'
        );
      end if;
    else
      new.private_state:=new.private_state||jsonb_build_object(
        'judge_integrity_objective',
        'Rends une décision exacte et impartiale pour chaque suspect. Tu peux utiliser jusqu’à 3 protections, mais consommer la 3e fait échouer cet objectif personnel sans annuler une victoire de ton camp.'
      );
    end if;
  end if;

  return new;
end
$function$;

create or replace function public.igr_v52_make_reveal(p_room text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  spy_base jsonb;
  spy_result jsonb;
  base jsonb;
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  it jsonb;
  p public.igr_v4_players%rowtype;
  j public.igr_v4_players%rowtype;
  t public.igr_v4_players%rowtype;
  out_results jsonb:='[]';
  winners jsonb:='[]';
  corrupt boolean:=false;
  yes_n int:=0;
  voters int:=0;
  threshold int:=0;
  accused boolean:=false;
  truth int;
  guess int;
  levels jsonb;
  exact_n int;
  total_n int;
  acts int;
  ok boolean;
  absent jsonb;
  camp_ok boolean;
  personal_ok boolean;
  base_personal_ok boolean;
  protections_used int:=0;
begin
  spy_base:=public.igr_v4_make_reveal(p_room);
  base:=public.igr_v59_reveal_base(p_room);
  select * into r from public.igr_v4_rooms where code=p_room;

  absent:=coalesce(r.state->'v59_absent','[]'::jsonb);
  select sp.pack into pack
  from public.igr_v4_scenario_packs sp
  where sp.scenario_id=r.scenario_id;

  select * into j
  from public.igr_v4_players
  where room_code=p_room and public_role='juge'
  order by seat_index limit 1;

  if j.id is not null then
    corrupt:=coalesce((j.private_state->>'judge_corrupt')::boolean,false);
    protections_used:=public.igr_v44_protection_count(p_room);

    select count(*) into voters
    from public.igr_v4_players pp
    where pp.room_code=p_room
      and pp.public_role in ('enqueteur','analyste','procureur')
      and not (absent ? pp.id::text);

    threshold:=case when voters=0 then 0 else floor(voters/2.0)::int+1 end;

    select count(distinct a.player_id) into yes_n
    from public.igr_v4_actions a
    join public.igr_v4_players pp on pp.id=a.player_id
    where a.room_code=p_room
      and a.action_type='judge_integrity_vote'
      and coalesce((a.payload->>'corrupt')::boolean,false)
      and pp.public_role in ('enqueteur','analyste','procureur')
      and not (absent ? pp.id::text);

    accused:=voters>0 and yes_n>=threshold;

    base:=jsonb_set(
      base,
      '{judge_integrity}',
      coalesce(base->'judge_integrity','{}'::jsonb)
      ||jsonb_build_object(
        'accused',accused,
        'votes_corrupt',yes_n,
        'eligible_voters',voters,
        'required_yes',threshold,
        'correct',accused=corrupt,
        'protections_used',protections_used,
        'protections_limit',3,
        'personal_objective_failed_by_protections',protections_used>=3
      ),
      true
    );
  end if;

  exact_n:=coalesce((base#>>'{camp_investigation,exact}')::int,(base#>>'{accuracy,exact}')::int,0);
  total_n:=coalesce((base#>>'{camp_investigation,total}')::int,(base#>>'{accuracy,total}')::int,0);

  for it in
    select value from jsonb_array_elements(coalesce(base->'results','[]'::jsonb))
  loop
    select * into p
    from public.igr_v4_players
    where id=(it->>'player_id')::uuid and room_code=p_room;

    if p.secret_role='espion' then
      select value into spy_result
      from jsonb_array_elements(coalesce(spy_base->'results','[]'::jsonb))
      where value->>'player_id'=p.id::text;
      if spy_result is not null then
        it:=it||jsonb_build_object(
          'success',spy_result->'success',
          'role',spy_result->'role',
          'text',spy_result->'text',
          'achievements',coalesce(spy_result->'achievements','[]'::jsonb)
        );
      end if;

    elsif p.public_role='juge' then
      camp_ok:=coalesce((it->>'camp_success')::boolean,false);
      base_personal_ok:=coalesce((it->>'success')::boolean,false);

      if corrupt then
        select * into t
        from public.igr_v4_players
        where room_code=p_room
          and id::text=j.private_state->>'judge_corruption_target_id'
          and public_role='suspect';

        truth:=coalesce((pack->'truth'->'levels'->>(t.internal_slot-1))::int,-1);

        select a.payload->'levels' into levels
        from public.igr_v4_actions a
        where a.room_code=p_room
          and a.player_id=p.id
          and a.action_type='final_lock'
        order by a.id desc
        limit 1;

        guess:=coalesce((levels->>t.id::text)::int,-1);
        personal_ok:=truth>0
          and guess>=0
          and guess<truth
          and not accused
          and protections_used<3;

        it:=it||jsonb_build_object(
          'success',camp_ok,
          'personal_objective_success',personal_ok,
          'personal_objective_failed_by_protections',protections_used>=3,
          'protections_used',protections_used,
          'protections_limit',3,
          'text',
            'Juge corrompu · camp '||
            case when camp_ok then 'victorieux' else 'défait' end||
            ' · cible '||case when truth>0 and guess>=0 and guess<truth then 'sous-évaluée' else 'non protégée' end||
            ' · corruption '||case when not accused then 'non détectée' else 'détectée' end||
            ' · protections '||protections_used||'/3'||
            case when protections_used>=3 then ' · 3e protection consommée : objectif personnel échoué.' else '.' end,
          'victories',jsonb_build_object(
            'camp',camp_ok,
            'personal',personal_ok,
            'target_protected',truth>0 and guess>=0 and guess<truth,
            'undetected',not accused,
            'protection_limit_respected',protections_used<3,
            'camp_label','Enquête'
          )
        );
      else
        personal_ok:=base_personal_ok and protections_used<3;

        it:=it||jsonb_build_object(
          'success',camp_ok,
          'personal_objective_success',personal_ok,
          'personal_objective_failed_by_protections',protections_used>=3,
          'protections_used',protections_used,
          'protections_limit',3,
          'text',
            'Juge intègre · décision d’autorité : '||exact_n||'/'||total_n||
            ' responsabilités exactes · camp '||
            case when camp_ok then 'victorieux' else 'défait' end||
            ' · protections '||protections_used||'/3'||
            case when protections_used>=3
              then ' · 3e protection consommée : objectif personnel échoué.'
              else ' · objectif personnel '||case when personal_ok then 'réussi.' else 'échoué.' end
            end,
          'victories',jsonb_build_object(
            'camp',camp_ok,
            'personal',personal_ok,
            'exact_decision',base_personal_ok,
            'protection_limit_respected',protections_used<3,
            'camp_label','Enquête'
          )
        );
      end if;

    elsif p.secret_role<>'espion'
      and p.public_role in ('inspecteur','expert')
      and r.scenario_id not in ('021','022','023','024','025')
    then
      select count(*) into acts
      from public.igr_v4_actions a
      where a.room_code=p_room
        and a.player_id=p.id
        and a.action_type=case when p.public_role='inspecteur' then 'field' else 'expert' end;

      ok:=acts>0 and total_n>0 and exact_n>=ceil(total_n*2.0/3.0)::int;
      it:=it||jsonb_build_object(
        'success',ok,
        'text',acts||' action(s) de rôle · décision faisant autorité : '||exact_n||'/'||total_n||' responsabilités exactes.'
      );
      if not ok then it:=jsonb_set(it,'{achievements}','[]'::jsonb,true); end if;
    end if;

    if absent ? p.id::text then
      it:=it||jsonb_build_object(
        'success',false,
        'achievements','[]'::jsonb,
        'absent',true,
        'text','Joueur déclaré absent par l’hôte : objectif final non validé.'
      );
      if p.public_role='juge' then
        it:=jsonb_set(it,'{personal_objective_success}','false'::jsonb,true);
      end if;
    end if;

    if not coalesce((it->>'success')::boolean,false) then
      it:=jsonb_set(it,'{achievements}','[]'::jsonb,true);
    end if;

    out_results:=out_results||jsonb_build_array(it);
    if coalesce((it->>'success')::boolean,false) then
      winners:=winners||jsonb_build_array(p.id);
    end if;
  end loop;

  return base||jsonb_build_object(
    'results',out_results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'absent_players',absent,
    'incomplete_decisions',jsonb_array_length(absent)>0
  );
end
$function$;

update public.igr_v4_players
set private_state=private_state
where public_role='juge';
