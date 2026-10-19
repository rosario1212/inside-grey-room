-- Final 029 now checks two concise structured conclusions against private canon.
CREATE OR REPLACE FUNCTION igr_private.igr_v120_029_make_reveal(p_room text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r public.igr_v4_rooms%rowtype; a igr_private.igr_v107_029_editorial_matrix%rowtype;
 pin igr_private.igr_v108_029_room_variants%rowtype;
 p public.igr_v4_players%rowtype; written jsonb:='{}'::jsonb;
 report_ok boolean:=false; branch_ok boolean:=false; witness_ok boolean:=false; shield_count int:=0;
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
 branch_ok:=report_ok and coalesce(written->>'responsibility_choice','unknown')=case pin.branch when 'A' then 'local' when 'B' then 'execution' else 'finance' end;
 witness_ok:=report_ok and coalesce(written->>'witness4_assessment','unknown')=case pin.profile when 'V1' then 'innocent' when 'V2' then 'innocent' when 'V3' then 'coerced' when 'V4' then 'voluntary' else 'operative' end;
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
    won:=branch_ok and witness_ok and shield_count>=2;
    explanation:=case when won then 'Le rapport a été remis et des protections ont été engagées.'
      else 'Le rapport ou les mesures de protection restent incomplets.' end;
  elsif p.public_role='journaliste' then
    won:=exists(select 1 from public.igr_v4_actions x where x.room_code=r.code and x.player_id=p.id and x.action_type='breaking_news');
    explanation:=case when won then 'Tu as publié pendant l’enquête.' else 'Tu n’as pas publié pendant l’enquête.' end;
  elsif p.public_role in ('don','bras_droit') then
    won:=not branch_ok;
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
 '029_report_submitted',report_ok,'029_responsibility_correct',branch_ok,'029_fourth_witness_correct',witness_ok,'029_protection_count',shield_count,
 '029_branch_resolved',true,'029_witness4_resolved',true);
end $function$;
