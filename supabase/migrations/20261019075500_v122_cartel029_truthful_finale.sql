-- CARTEL 029 v122: final reveal judged by the investigative report and chosen
-- private A/B/C × V1–V5 canon, not the old three-suspect guilt grid.
create or replace function igr_private.igr_v122_029_reveal(p_room text)
returns jsonb language plpgsql security definer set search_path='' as $body$
declare
 r public.igr_v4_rooms%rowtype; report public.igr_v107_029_reports%rowtype;
 v_branch text;v_profile text;v_truth jsonb;v_match int;
 chosen text;assessment text;correct_branch text;correct_profile text;
 branch_ok boolean:=false;profile_ok boolean:=false;reported boolean:=false;protection boolean:=false;
 p public.igr_v4_players%rowtype; successes jsonb:='[]'::jsonb; winners jsonb:='[]'::jsonb;
 role_out text;outcome text;success boolean; n int;
 summary text;
begin
 select * into r from public.igr_v4_rooms where code=p_room;
 if not found or r.scenario_id<>'029' or not igr_private.igr_v108_029_is_enabled()
   or coalesce((r.state->>'cartel029_ready')::boolean,false)=false then
     raise exception '029 final adjudication unavailable';
 end if;
 v_match:=greatest(1,coalesce((r.state->>'match_no')::int,1));
 select branch,profile into v_branch,v_profile
 from igr_private.igr_v108_029_room_variants where room_code=r.code and match_no=v_match;
 if not found then raise exception '029 variant not assigned'; end if;
 select authoring into v_truth from igr_private.igr_v107_029_editorial_matrix
 where branch=v_branch and profile=v_profile and editorial_status='approved' and public_enabled;
 if v_truth is null then raise exception '029 final truth not approved'; end if;
 select * into report from public.igr_v107_029_reports
 where room_code=r.code and match_no=v_match;
 reported:=found and report.status='submitted';
 chosen:=coalesce(report.fields->>'responsibility_choice','unknown');
 assessment:=coalesce(report.fields->>'witness4_assessment','unknown');
 correct_branch:=case v_branch when 'A' then 'local' when 'B' then 'execution' when 'C' then 'finance' end;
 correct_profile:=case v_profile when 'V1' then 'innocent' when 'V2' then 'innocent'
    when 'V3' then 'coerced' when 'V4' then 'voluntary' when 'V5' then 'operative' end;
 branch_ok:=reported and chosen=correct_branch;
 profile_ok:=reported and assessment=correct_profile;
 protection:=reported and length(trim(coalesce(report.fields->>'protection','')))>12;
 summary:='Santa Ceniza : sept victimes au total, trois rescapés et vingt captifs. '
    ||coalesce(v_truth->'branch'->>'responsibility','La responsabilité principale doit être établie.')
    ||' Le quatrième témoin : '||coalesce(v_truth->'witness4'->>'real','Son rôle exact était resté inconnu.')
    ||' Le rapport remis par la Grey Room '||
      case when not reported then 'n’a pas été déposé.'
           when branch_ok and profile_ok then 'identifie correctement les responsabilités et le quatrième témoin.'
           when branch_ok then 'identifie le responsable principal, mais pas entièrement le quatrième témoin.'
           when profile_ok then 'comprend le quatrième témoin, mais manque la responsabilité principale.'
           else 'ne parvient pas à établir les deux conclusions déterminantes.' end;
 for p in select * from public.igr_v4_players where room_code=r.code order by seat_index loop
  role_out:=p.public_role;success:=false;outcome:='';
  case p.public_role
   when 'enqueteur' then
    success:=branch_ok and profile_ok;
    outcome:=case when success then 'Ton rapport identifie les faits déterminants et la place du quatrième témoin.'
      else 'Ton rapport ne démontre pas entièrement les deux conclusions finales.' end;
   when 'analyste' then
    success:=branch_ok and profile_ok;
    outcome:=case when success then 'La reconstruction commune est cohérente et les deux conclusions sont exactes.'
      else 'La reconstruction collective reste partielle.' end;
   when 'procureur' then
    success:=branch_ok;
    outcome:=case when success then 'La responsabilité principale a été correctement attribuée.'
      else 'La preuve de la responsabilité principale n’a pas été correctement exploitée.' end;
   when 'juge' then
    success:=branch_ok and reported;
    outcome:=case when success then 'Une conclusion étayée permet une réponse judiciaire proportionnée.'
      else 'La procédure ne permet pas de trancher précisément la responsabilité principale.' end;
   when 'journaliste' then
    select count(*) into n from public.igr_v4_actions
     where room_code=r.code and player_id=p.id and action_type='breaking_news';
    success:=n>0;
    outcome:=case when success then 'Tu as publié pendant l’enquête. La véracité des affirmations reste à établir.'
      else 'Tu n’as publié aucune nouvelle pendant l’enquête.' end;
   when 'don' then
    success:=not branch_ok;
    outcome:=case when success then 'Ton autorité n’est pas directement mise en échec par le rapport.'
      else 'L’enquête a correctement reconstitué une partie décisive de ton organisation.' end;
   when 'bras_droit' then
    success:=not branch_ok;
    outcome:=case when success then 'La chaîne de commandement demeure partiellement masquée.'
      else 'Les enquêteurs reconstituent une responsabilité décisive malgré tes manœuvres.' end;
   when 'suspect' then
    role_out:='temoin';
    if p.internal_slot between 1 and 3 then
      success:=reported and protection;
      outcome:=case when success then 'Ton témoignage contribue à un rapport et à des mesures de protection.'
        else 'Ton témoignage n’a pas encore conduit à des conclusions protectrices suffisantes.' end;
    elsif p.internal_slot=4 then
      success:=case when v_profile in ('V1','V2','V3') then profile_ok
         else not profile_ok end;
      outcome:=case when v_profile in ('V1','V2') then
             case when profile_ok then 'Ton innocence a été reconnue.' else 'Ton rôle n’a pas été établi correctement.' end
         when v_profile='V3' then
             case when profile_ok then 'La contrainte subie a été distinguée d’une complicité volontaire.' else 'La contrainte subie est restée mal comprise.' end
         else case when profile_ok then 'Les enquêteurs ont établi ton implication réelle.'
           else 'Ton implication réelle n’a pas été reconnue par le rapport.' end end;
    end if;
   else outcome:='Ton rôle dans cette affaire est clos.';success:=reported;
  end case;
  if success then winners:=winners||to_jsonb(p.id); end if;
  successes:=successes||jsonb_build_array(jsonb_build_object(
    'player_id',p.id,'pseudo',p.pseudo,'role',role_out,'public_role',p.public_role,
    'success',success,'achievements','[]'::jsonb,'text',outcome));
 end loop;
 return jsonb_build_object('title','RÉVÉLATION · LE CYCLE MORT','summary',summary,
 'responsibilities','[]'::jsonb,'results',successes,'winners',winners,
 'winner_count',jsonb_array_length(winners),'report_submitted',reported,
 'report_outcome',jsonb_build_object('responsibility_correct',branch_ok,
    'fourth_witness_correct',profile_ok,'protection_recommended',protection));
end $body$;
revoke all on function igr_private.igr_v122_029_reveal(text) from public,anon,authenticated;
