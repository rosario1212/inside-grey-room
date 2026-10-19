-- 029 server-only endings; release only after private approval and full QA.
create or replace function igr_private.igr_v120_029_make_reveal(p_room text)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare r public.igr_v4_rooms%rowtype; a igr_private.igr_v107_029_editorial_matrix%rowtype;
 pin igr_private.igr_v108_029_room_variants%rowtype;
 p public.igr_v4_players%rowtype; written jsonb:='{}'::jsonb;
 report_ok boolean:=false; shield_count int:=0;
 results jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
 protection_detail text; choice text; profile_real text;
 is_victim boolean; won boolean; explanation text; headline text;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 if not found or r.scenario_id<>'029' or not coalesce((r.state->>'cartel029_ready')::boolean,false)
    or not igr_private.igr_v108_029_is_enabled() then raise exception 'unavailable';end if;
 select * into pin from igr_private.igr_v108_029_room_variants
 where room_code=r.code and match_no=greatest(1,coalesce((r.state->>'match_no')::int,1));
 if not found then raise exception 'private ending missing';end if;
 select * into a from igr_private.igr_v107_029_editorial_matrix
 where branch=pin.branch and profile=pin.profile and editorial_status='approved' and public_enabled;
 if not found then raise exception 'unapproved outcome';end if;
 select fields, status='submitted' into written,report_ok from public.igr_v107_029_reports
 where room_code=r.code and match_no=pin.match_no;
 written:=coalesce(written,'{}'::jsonb); report_ok:=coalesce(report_ok,false)
  and length(trim(coalesce(written->>'santa_ceniza','')))>=12
  and length(trim(coalesce(written->>'activities','')))>=12
  and length(trim(coalesce(written->>'responsibilities','')))>=12;
 select count(distinct payload->>'target') into shield_count
 from public.igr_v4_actions where room_code=r.code and action_type='cartel029_protection';
 select payload->>'choice' into choice from public.igr_v4_actions
 where room_code=r.code and action_type='cartel029_position'
 order by cycle desc,id desc limit 1;
 protection_detail:=case when shield_count=3
  then 'Les trois mesures de protection ont été décidées. La libération des captifs doit encore être confirmée.'
  when shield_count>0 then 'Certaines protections ont été engagées, mais des personnes restent exposées.'
  else 'Aucune protection supplémentaire n’a été décidée. Le danger demeure, sans décès automatique.' end;
 profile_real:=coalesce(a.authoring->'witness4'->>'real','La situation du quatrième témoin reste à vérifier.');
 headline:='Santa Ceniza : sept morts, trois rescapés, vingt captifs au moment de la fuite. '
   ||coalesce(a.authoring->'branch'->>'responsibility','La chaîne de commandement doit être établie.')||' '
   ||'Quatrième témoin : '||profile_real||' '||protection_detail;
 for p in select * from public.igr_v4_players where room_code=r.code order by seat_index loop
  is_victim:=p.public_role='suspect';
  if p.public_role in ('enqueteur','analyste','procureur','juge') then
    won:=report_ok and shield_count>=2;
    explanation:=case when won then 'Le rapport a été remis et des protections ont été engagées.'
      else 'Le rapport ou les mesures de protection restent incomplets.' end;
  elsif p.public_role='journaliste' then
    won:=exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=p.id and x.action_type='breaking_news');
    explanation:=case when won then 'Tu as publié pendant l’enquête.' else 'Tu n’as pas publié pendant l’enquête.' end;
  elsif p.public_role in ('don','bras_droit') then
    won:=not report_ok;
    explanation:=case when won then 'La Grey Room n’a pas remis un rapport complet.'
      else 'La Grey Room a remis son rapport sur Los Salcedo.' end;
  elsif is_victim then
    if p.internal_slot=4 and pin.profile in ('V3','V4','V5') then
      won:=coalesce(choice,'loyal')='cooperate' and report_ok
           or coalesce(choice,'loyal')='loyal' and not report_ok;
      explanation:=case when coalesce(choice,'loyal')='cooperate'
        then 'Tu as choisi de coopérer. Ta décision a pesé sur la conclusion.'
        else 'Tu as conservé ta loyauté. Les enquêteurs jugeront ce que prouvent les faits.' end;
    else
      won:=report_ok and shield_count>=1;
      explanation:=case when won then 'Ton témoignage a contribué au dossier et une protection a été engagée.'
        else 'Le danger reste important et l’enquête est incomplète.' end;
    end if;
  else won:=false; explanation:='Ton rôle a participé à la partie.';end if;
  if won then winners:=winners||jsonb_build_array(p.id);end if;
  results:=results||jsonb_build_array(jsonb_build_object(
     'player_id',p.id,'pseudo',p.pseudo,
     'role',case when p.public_role='suspect' then 'temoin' else p.public_role end,
     'public_role',p.public_role,'success',won,'achievements','[]'::jsonb,'text',explanation));
 end loop;
 return jsonb_build_object('title','LE CYCLE MORT · RÉVÉLATION',
 'summary',headline,'responsibilities','[]'::jsonb,
 'results',results,'winners',winners,'winner_count',jsonb_array_length(winners),
 '029_report_submitted',report_ok,'029_protection_count',shield_count,
 '029_branch_resolved',true,'029_witness4_resolved',true);
end $body$;
revoke all on function igr_private.igr_v120_029_make_reveal(text) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.igr_v4_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.igr_v4_rooms%rowtype;
  pack jsonb;
  s public.igr_v4_players%rowtype;
  p public.igr_v4_players%rowtype;
  q public.igr_v4_players%rowtype;
  enq public.igr_v4_players%rowtype;
  truth_levels jsonb;
  enq_payload jsonb := '{}'::jsonb;
  own_payload jsonb := '{}'::jsonb;
  own_levels jsonb := '{}'::jsonb;
  provisional_payload jsonb := '{}'::jsonb;
  resp jsonb := '[]'::jsonb;
  results jsonb := '[]'::jsonb;
  winners jsonb := '[]'::jsonb;
  achievements jsonb := '[]'::jsonb;
  truth int;
  guess int;
  exact int := 0;
  total int := 0;
  own_exact int;
  own_total int;
  client_count int;
  client_exact int;
  lawyer_count int;
  lawyer_rank int;
  action_count int;
  witness_flags int;
  judge_spent int;
  provisional_exact int;
  threshold int;
  max_cycle_success int;
  success boolean;
  result_role text;
  result_text text;
begin
  select * into r from public.igr_v4_rooms where code=p_room;
  if not found then raise exception 'room not found'; end if;
  if r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)
   and igr_private.igr_v108_029_is_enabled() then
      return igr_private.igr_v120_029_make_reveal(r.code);
  end if;

  select x.pack into pack
  from public.igr_v4_scenario_packs x
  where x.scenario_id=r.scenario_id;

  truth_levels := coalesce(pack->'truth'->'levels','[]'::jsonb);

  select * into enq
  from public.igr_v4_players
  where room_code=r.code and public_role='enqueteur'
  limit 1;

  select payload into enq_payload
  from public.igr_v4_actions
  where room_code=r.code and player_id=enq.id and action_type='final_lock'
  order by id desc limit 1;
  enq_payload := coalesce(enq_payload->'levels', enq_payload, '{}'::jsonb);

  for s in
    select * from public.igr_v4_players
    where room_code=r.code and public_role='suspect'
    order by internal_slot
  loop
    truth := coalesce((truth_levels->>(s.internal_slot-1))::int,0);
    guess := coalesce((enq_payload->>s.id::text)::int,-1);
    total := total+1;
    if guess=truth then exact:=exact+1; end if;
    resp := resp || jsonb_build_array(
      jsonb_build_object(
        'player_id',s.id,
        'pseudo',s.pseudo,
        'truth_level',truth,
        'enqueteur_level',guess
      )
    );
  end loop;

  threshold := greatest(1,ceil(total*2.0/3.0)::int);

  for p in
    select * from public.igr_v4_players
    where room_code=r.code
    order by seat_index
  loop
    achievements := '[]'::jsonb;
    success := false;
    result_role := p.public_role;
    result_text := 'Objectif non évalué.';

    if p.secret_role='espion' then
      result_role := 'espion';
      success := exact < total;
      result_text := case when success
        then 'L’enquête n’a pas reconstruit parfaitement les responsabilités : ta couverture a tenu.'
        else 'L’enquête a reconstruit toutes les responsabilités : ta mission d’ombre échoue.'
      end;
      if success and exact*2<=total then
        achievements := achievements || jsonb_build_array('espion_ombre');
      end if;

    elsif p.public_role='suspect' then
      truth := coalesce((truth_levels->>(p.internal_slot-1))::int,0);
      guess := coalesce((enq_payload->>p.id::text)::int,-1);
      success := guess=truth;
      result_text := case when success
        then 'La frontière exacte de ta responsabilité a été reconnue.'
        else 'Le verdict a déformé ou manqué ton degré réel de responsabilité.'
      end;
      if success and truth>=2 then
        achievements := achievements || jsonb_build_array('suspect_sous_pression');
      end if;

    elsif p.public_role='maitre' then
      select count(*) into lawyer_count
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre';

      select count(*) into lawyer_rank
      from public.igr_v4_players a
      where a.room_code=r.code and a.public_role='maitre' and a.seat_index<=p.seat_index;

      client_count:=0;
      client_exact:=0;
      for q in
        select * from public.igr_v4_players c
        where c.room_code=r.code
          and c.public_role='suspect'
          and (lawyer_count=1 or ((c.internal_slot-1)%lawyer_count)=(lawyer_rank-1))
        order by c.internal_slot
      loop
        client_count:=client_count+1;
        truth:=coalesce((truth_levels->>(q.internal_slot-1))::int,0);
        guess:=coalesce((enq_payload->>q.id::text)::int,-1);
        if truth=guess then client_exact:=client_exact+1; end if;
      end loop;
      success := client_count>0 and client_exact=client_count;
      result_text := case when success
        then client_exact||'/'||client_count||' client(s) défendu(s) dans la frontière exacte de leur responsabilité.'
        else client_exact||'/'||client_count||' client(s) correctement défendu(s) au verdict final.'
      end;
      if success and client_count>=2 then
        achievements := achievements || jsonb_build_array('avocat_double_defense');
      end if;

    elsif p.public_role in ('enqueteur','analyste','procureur','juge') then
      if p.public_role='enqueteur' then
        own_exact:=exact;
        own_total:=total;
      else
        select payload into own_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='final_lock'
        order by id desc limit 1;
        own_levels:=coalesce(own_payload->'levels',own_payload,'{}'::jsonb);
        own_exact:=0;
        own_total:=0;
        for s in
          select * from public.igr_v4_players
          where room_code=r.code and public_role='suspect'
          order by internal_slot
        loop
          own_total:=own_total+1;
          truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
          guess:=coalesce((own_levels->>s.id::text)::int,-1);
          if truth=guess then own_exact:=own_exact+1; end if;
        end loop;
      end if;

      success := own_total>0 and own_exact=own_total;

      if p.public_role='enqueteur' then
        result_text := own_exact||'/'||own_total||' responsabilités exactes.';
        select payload into provisional_payload
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='provisional'
        order by id desc limit 1;
        if provisional_payload is not null then
          provisional_exact:=0;
          for s in
            select * from public.igr_v4_players
            where room_code=r.code and public_role='suspect'
          loop
            truth:=coalesce((truth_levels->>(s.internal_slot-1))::int,0);
            guess:=coalesce((provisional_payload->>s.id::text)::int,-1);
            if truth=guess then provisional_exact:=provisional_exact+1; end if;
          end loop;
          if success and provisional_exact=total then
            achievements:=achievements||jsonb_build_array('enq_sans_correction');
          end if;
        end if;

      elsif p.public_role='analyste' then
        result_text := own_exact||'/'||own_total||' responsabilités correctement lues dans ton verrouillage.';
        if success then achievements:=achievements||jsonb_build_array('analyste_parfait'); end if;

      elsif p.public_role='procureur' then
        select count(*) into action_count
        from public.igr_v4_actions
        where room_code=r.code and player_id=p.id and action_type='prosecutor_success';
        success := success and action_count>=1;
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||action_count||' entretien(s) accepté(s).';
        select coalesce(max(c),0) into max_cycle_success from (
          select cycle,count(*) c
          from public.igr_v4_actions
          where room_code=r.code and player_id=p.id and action_type='prosecutor_success'
          group by cycle
        ) z;
        if success and max_cycle_success>=2 then
          achievements:=achievements||jsonb_build_array('procureur_double_entretien');
        end if;

      elsif p.public_role='juge' then
        select coalesce(sum(coalesce((a.payload->>'cost')::int,0)),0) into judge_spent
        from public.igr_v4_actions a
        where a.room_code=r.code and a.player_id=p.id and a.action_type='judge';
        result_text := own_exact||'/'||own_total||' responsabilités exactes · '||judge_spent||'/5 points de confidentialité utilisés.';
        if success and judge_spent<=2 then
          achievements:=achievements||jsonb_build_array('juge_confidentiel');
        end if;
      end if;

    elsif p.public_role='journaliste' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='breaking_news';
      select payload into own_payload
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='final_lock'
      order by id desc limit 1;
      success := action_count>=1 and length(trim(coalesce(own_payload->>'note','')))>=8;
      result_text := action_count||' Breaking News publiée(s) · angle final '||
        case when length(trim(coalesce(own_payload->>'note','')))>=8 then 'assumé.' else 'non verrouillé.' end;
      if success and action_count=3 then
        achievements:=achievements||jsonb_build_array('journaliste_trois_unes');
      end if;

    elsif p.public_role='inspecteur' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='field';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' action(s) de terrain · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('inspecteur_trois_pistes');
      end if;

    elsif p.public_role='expert' then
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and player_id=p.id and action_type='expert';
      success := action_count>=1 and exact>=threshold;
      result_text := action_count||' analyse(s) technique(s) · enquête à '||exact||'/'||total||' responsabilités exactes.';
      if success and action_count>=3 then
        achievements:=achievements||jsonb_build_array('expert_trois_analyses');
      end if;

    elsif p.public_role='temoin' then
      select count(*) into witness_flags
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text
        and payload->>'status'='suspect';
      success := witness_flags=0;
      result_text := case when success
        then 'Tu n’as jamais été formellement requalifié comme suspect.'
        else 'Tu as été requalifié comme suspect au cours de l’enquête.'
      end;
      select count(*) into action_count
      from public.igr_v4_actions
      where room_code=r.code and action_type='witness_status'
        and payload->>'target'=p.id::text;
      if success and action_count=0 then
        achievements:=achievements||jsonb_build_array('temoin_intouchable');
      end if;

    else
      success := false;
      result_text := 'Aucune condition de victoire n’est définie pour ce rôle.';
    end if;

    if success then
      winners := winners || jsonb_build_array(p.id);
    end if;

    results := results || jsonb_build_array(
      jsonb_build_object(
        'player_id',p.id,
        'pseudo',p.pseudo,
        'role',result_role,
        'public_role',p.public_role,
        'success',success,
        'achievements',achievements,
        'text',result_text
      )
    );
  end loop;

  return jsonb_build_object(
    'title','RÉVÉLATION',
    'summary',pack->'truth'->>'summary',
    'responsibilities',resp,
    'results',results,
    'winners',winners,
    'winner_count',jsonb_array_length(winners),
    'accuracy',jsonb_build_object('exact',exact,'total',total)
  );
end
$function$;
CREATE OR REPLACE FUNCTION public.igr_v4_sync(p_code text, p_player_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;players jsonb;ev jsonb;suspects jsonb;pack jsonb;my_actions jsonb;protected_meta jsonb;field_meta jsonb;expert_meta jsonb;
begin
 perform igr_private.rate_limit('sync',p_player_token::text,240,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;if not found then raise exception 'unauthorized';end if;
 perform public.igr_v4_tick(p.room_code);
 select * into p from public.igr_v4_players where id=p.id;
 select * into r from public.igr_v4_rooms where code=p.room_code;
 select x.pack into pack from public.igr_v4_scenario_packs x where x.scenario_id=r.scenario_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo,'seat_index',seat_index,'is_host',is_host,'public_role',public_role,'preferred_role',preferred_role,'ready',ready,'audio_ready',audio_ready,'avatar_rev',avatar_rev,'has_avatar',avatar_data is not null,'equipped_title',equipped_title,'equipped_badge',equipped_badge) order by seat_index),'[]'::jsonb) into players from public.igr_v4_players where room_code=r.code;
 ev:=public.igr_v4_visible_events(r.code,p);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'pseudo',pseudo) order by seat_index),'[]'::jsonb) into suspects from public.igr_v4_players where room_code=r.code and public_role='suspect';
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'cycle',cycle,'action_type',action_type,'payload',payload,'created_at',created_at) order by id),'[]'::jsonb) into my_actions from public.igr_v4_actions where room_code=r.code and player_id=p.id;
 if p.public_role='juge' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title','cost',coalesce((v->>'cost')::int,1))),'[]'::jsonb) into protected_meta from jsonb_array_elements(coalesce(pack->'protected','[]'::jsonb)) v;else protected_meta:='[]'::jsonb;end if;
 if p.public_role='inspecteur' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into field_meta from jsonb_array_elements(coalesce(pack->'field_actions','[]'::jsonb)) v;else field_meta:='[]'::jsonb;end if;
 if p.public_role='expert' then select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','title',v->>'title')),'[]'::jsonb) into expert_meta from jsonb_array_elements(coalesce(pack->'expert_actions','[]'::jsonb)) v;else expert_meta:='[]'::jsonb;end if;
 return jsonb_build_object(
   'server_now',clock_timestamp(),
   'pending_requests',(select coalesce(jsonb_agg(jsonb_build_object('request_id',a.id,'from_pseudo',sender.pseudo) order by a.id),'[]'::jsonb) from public.igr_v4_actions a join public.igr_v4_players sender on sender.id=a.player_id where a.room_code=r.code and a.cycle=r.cycle and r.phase='annex_procureur' and a.action_type='prosecutor_request' and a.payload->>'target'=p.id::text and coalesce(a.payload->>'status','pending')='pending'),
   'room',jsonb_build_object('code',r.code,'scenario_id',r.scenario_id,'status',r.status,'cycle',r.cycle,'phase',r.phase,'phase_started_at',r.phase_started_at,'phase_ends_at',r.phase_ends_at,'state',r.state,'min_players',public.igr_v4_min_players(r.scenario_id),'max_players',public.igr_v4_max_players(r.scenario_id)),
   'player',jsonb_build_object('id',p.id,'pseudo',p.pseudo,'is_host',p.is_host,'ready',p.ready,'audio_ready',p.audio_ready,'public_role',p.public_role,'preferred_role',p.preferred_role,'equipped_title',p.equipped_title,'equipped_badge',p.equipped_badge,'secret_role',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.secret_role else null end,'private_state',case when r.status in ('playing','finished') and r.phase<>'briefing' then p.private_state else '{}'::jsonb end),
   'players',players,'suspects',suspects,'events',ev,'my_actions',my_actions,
   'scenario',jsonb_build_object('context',pack->>'context','news',case when p.public_role='journaliste' then pack->'news' else '[]'::jsonb end,'protected',protected_meta,'field_actions',field_meta,'expert_actions',expert_meta,'truth',case when r.status='finished' and not (r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)) then pack->'truth' else null end)
 );
end
$function$;
CREATE OR REPLACE FUNCTION public.igr_v4_lock_final(p_code text, p_player_token uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.igr_v4_players%rowtype;r public.igr_v4_rooms%rowtype;levels jsonb;note_text text;st jsonb;
begin
 perform igr_private.rate_limit('final_lock',p_player_token::text,12,60);
 select * into p from public.igr_v4_players where room_code=upper(trim(p_code)) and player_token=p_player_token;
 if not found or not (public.igr_v52_investigation_role(p.public_role) or p.public_role='journaliste') then raise exception 'forbidden';end if;
 select * into r from public.igr_v4_rooms where code=p.room_code for update;
 if r.phase<>'locking' or not coalesce((r.state->>'v52_final_reassessment')::boolean,false) then raise exception 'wrong phase';end if;
 if r.scenario_id='029' and coalesce((r.state->>'cartel029_ready')::boolean,false)
   and p.public_role='enqueteur' and not exists (
    select 1 from public.igr_v107_029_reports x where x.room_code=r.code
      and x.match_no=greatest(1,coalesce((r.state->>'match_no')::int,1)) and x.status='submitted')
   then raise exception 'le rapport final doit être remis'; end if;
 if exists(select 1 from public.igr_v4_actions where room_code=r.code and player_id=p.id and action_type='final_lock') then raise exception 'already locked';end if;
 if coalesce(r.state->'v59_absent','[]'::jsonb) ? p.id::text then raise exception 'player marked absent';end if;
 if p.public_role<>'journaliste' then levels:=public.igr_v52_validate_levels(r.code,p_payload->'levels');else levels:='{}'::jsonb;end if;
 note_text:=left(trim(coalesce(p_payload->>'note','')),300);
 if p.public_role='journaliste' and length(note_text)<8 then raise exception 'journalist final angle required';end if;
 if note_text<>'' then perform igr_private.assert_ugc(note_text,300,false);end if;
 insert into public.igr_v4_actions(room_code,player_id,cycle,action_type,payload) values(r.code,p.id,r.cycle,'final_lock',jsonb_build_object('levels',levels,'note',note_text,'version','v52'));
 st:=public.igr_v52_maybe_finish(r.code);
 return jsonb_build_object('ok',true)||st;
end$function$;
